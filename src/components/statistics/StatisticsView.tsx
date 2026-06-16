import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, FileDown } from 'lucide-react';
import type { DailyResume } from '../../types';
import { styles } from './styles';
import { getDailyResume } from '../../services/dailyResume.service';
import { generarReportePDF } from './pdfGenerator';

export const StatisticsView: React.FC = () => {
  const [data, setData] = useState<DailyResume[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const responseDailyResume = await getDailyResume();
      setData(responseDailyResume);
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('No se pudieron cargar los datos de estadísticas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, []);

  // Calculations
  const maxSales = data.length > 0 ? Math.max(...data.map(d => d.totalVenta)) : 0;

  // Generate SVG points
  const width = 800;
  const height = 220;
  const paddingX = 40;
  const paddingY = 20;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  let pointsPath = '';
  let areaPath = '';
  const pointsList: { x: number; y: number; val: number; date: string }[] = [];

  if (data.length > 1) {
    const maxVal = maxSales > 0 ? maxSales : 1;
    data.forEach((item, index) => {
      const x = paddingX + (index * chartWidth) / (data.length - 1);
      // y=0 is at top, so we subtract from height
      const y = height - paddingY - (item.totalVenta / maxVal) * chartHeight;
      pointsList.push({ x, y, val: item.totalVenta, date: item.fecha });
    });

    // Generate line path
    pointsPath = pointsList.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    // Generate area path
    areaPath = `${pointsPath} L ${pointsList[pointsList.length - 1].x} ${height - paddingY} L ${pointsList[0].x} ${height - paddingY} Z`;
  }

  // Format date helper (e.g. 2026-06-09 -> 09/06)
  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      const d = new Date(dateStr);
      return `${d.getDate()}/${d.getMonth() + 1}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analíticas de Ventas</h1>
          <p style={styles.subtitle}>Rendimiento comercial diario consolidado de los cierres de caja en REStBack</p>
        </div>
        <button
          onClick={() => generarReportePDF(data)}
          disabled={loading || data.length === 0}
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          title="Exportar reporte de ventas a PDF"
        >
          <FileDown size={16} />
          Exportar PDF
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-error-border)', borderRadius: '10px', color: 'var(--color-error)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Highlight Cards Grid */}


      {/* Charts Grid */}
      <div style={styles.chartsGrid}>
        <div className="glass-panel" style={styles.chartPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={styles.chartTitle}>Curva de Facturación Histórica</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Calendar size={12} /> {data.length} cierres registrados
            </span>
          </div>

          {loading ? (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Cargando estadísticas...
            </div>
          ) : data.length > 0 ? (
            <>
              <div style={styles.svgWrapper}>
                <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid Lines */}
                  <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  <line x1={paddingX} y1={paddingY + chartHeight / 2} x2={width - paddingX} y2={paddingY + chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="rgba(255,255,255,0.08)" />

                  {data.length > 1 && (
                    <>
                      {/* Area Fill */}
                      <path d={areaPath} fill="url(#chartGlow)" />

                      {/* Line Path */}
                      <path d={pointsPath} fill="none" stroke="var(--primary)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Peak/Interactive dots */}
                      {pointsList.map((p, idx) => (
                        <g key={idx}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="white"
                            stroke="var(--primary)"
                            strokeWidth="2.5"
                            style={{ cursor: 'pointer' }}
                          />
                          {/* Tooltip on hover/display (simplified display text) */}
                          <text
                            x={p.x}
                            y={p.y - 12}
                            textAnchor="middle"
                            fill="var(--text-primary)"
                            fontSize="9"
                            fontWeight="bold"
                            style={{ pointerEvents: 'none' }}
                          >
                            Bs. {Math.round(p.val)}
                          </text>
                        </g>
                      ))}
                    </>
                  )}

                  {data.length === 1 && (
                    <circle
                      cx={width / 2}
                      cy={height / 2}
                      r="8"
                      fill="var(--primary)"
                    />
                  )}
                </svg>
              </div>
              <div style={styles.chartTimeline}>
                {data.map((item, idx) => (
                  <span key={idx}>{formatDateLabel(item.fecha)}</span>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.5rem' }}>
              <TrendingUp size={40} style={{ opacity: 0.3 }} />
              <h3>Sin datos de facturación</h3>
              <p style={{ fontSize: '0.85rem' }}>Realiza cierres de caja en el panel de órdenes para ver datos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
