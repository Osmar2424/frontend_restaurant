import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  Globe,
  Calendar,
  Users,
  Clock
} from 'lucide-react';
import type { logItems, User } from '../../types';
import { getLogs } from '../../services/logs.service';
import { getUsers } from '../../services/usuario.service';
import { styles } from './styles';
import { handleUIError, obtenerFecha } from '../utils';

export const LogsView: React.FC = () => {
  const [logs, setLogs] = useState<logItems[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>(''); // YYYY-MM-DD

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const [logsData, usersData] = await Promise.all([
        getLogs(),
        getUsers()
      ]);
      // Sort logs by date and time descending (latest first)
      const sortedLogs = [...logsData].sort((a, b) => {
        const dateTimeA = new Date(`${a.fecha}T${a.hora || '00:00:00'}`).getTime();
        const dateTimeB = new Date(`${b.fecha}T${b.hora || '00:00:00'}`).getTime();
        return dateTimeB - dateTimeA;
      });
      setLogs(sortedLogs);
      setUsers(usersData);
    } catch (err) {
      handleUIError(err, setError, 'Error al cargar los logs de auditoría.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData(true);
  };

  const getLogUserId = (log: logItems): number => {
    return log.idUsuario !== undefined ? log.idUsuario : (log as any).idUsuario;
  };

  const getUserName = (userId: number): string => {
    const user = users.find(u => u.idUsuario === userId);
    return user ? user.fullName : `Usuario ID #${userId}`;
  };

  const getUserEmail = (userId: number): string => {
    const user = users.find(u => u.idUsuario === userId);
    return user ? user.email : '';
  };

  // Stats Calculations
  const todayStr = obtenerFecha();
  const logsToday = logs.filter(log => log.fecha === todayStr);
  const loginsTodayCount = logsToday.filter(log => log.action.toLowerCase() === 'login').length;
  const logoutsTodayCount = logsToday.filter(log => log.action.toLowerCase() === 'logout').length;

  const activeUsersTodayCount = new Set(
    logsToday
      .filter(log => log.action.toLowerCase() === 'login')
      .map(log => getLogUserId(log))
  ).size;

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    const userId = getLogUserId(log);
    const userName = getUserName(userId).toLowerCase();
    const userEmail = getUserEmail(userId).toLowerCase();
    const action = log.action.toLowerCase();
    const ip = (log.ipDir || '').toLowerCase();
    const search = searchQuery.toLowerCase();

    // 1. Search Query (Matches user name, email, action or IP)
    const matchesSearch = userName.includes(search) ||
      userEmail.includes(search) ||
      ip.includes(search);

    // 2. User Filter
    const matchesUser = selectedUserFilter === 'all' || userId.toString() === selectedUserFilter;

    // 3. Action Filter
    const matchesAction = selectedActionFilter === 'all' || action === selectedActionFilter;

    // 4. Date Filter
    const matchesDate = !selectedDateFilter || log.fecha === selectedDateFilter;

    return matchesSearch && matchesUser && matchesAction && matchesDate;
  });

  // Pagination Logic
  const totalItems = filteredLogs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Adjust current page if it is out of bounds due to filtering
  const activePage = Math.min(currentPage, totalPages);

  const indexOfLastItem = activePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Logs de Acceso</h1>
          <p style={styles.subtitle}>Historial de inicios y cierres de sesión de los operadores en el sistema</p>
        </div>
        <button
          onClick={handleRefresh}
          style={styles.refreshBtn}
          disabled={loading || refreshing}
          className="btn"
        >
          <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} style={{ transition: 'transform 0.5s ease' }} />
          {refreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-error-border)', borderRadius: '10px', color: 'var(--color-error)', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Summary Stats Cards */}
      <div style={styles.summaryCards}>
        <div className="glass-panel" style={styles.summaryCard}>
          <div style={styles.summaryIconWrapper}>
            <Activity size={20} color="var(--primary)" />
          </div>
          <div style={styles.summaryDetails}>
            <span style={styles.summaryVal}>{logs.length}</span>
            <span style={styles.summaryLabel}>Total Registros</span>
          </div>
        </div>

        <div className="glass-panel" style={{ ...styles.summaryCard, borderLeft: '3px solid var(--color-ready)' }}>
          <div style={styles.summaryIconWrapper}>
            <LogIn size={20} color="var(--color-ready)" />
          </div>
          <div style={styles.summaryDetails}>
            <span style={styles.summaryVal}>{loginsTodayCount}</span>
            <span style={styles.summaryLabel}>Logins Hoy</span>
          </div>
        </div>

        <div className="glass-panel" style={{ ...styles.summaryCard, borderLeft: '3px solid var(--color-error)' }}>
          <div style={styles.summaryIconWrapper}>
            <LogOut size={20} color="var(--color-error)" />
          </div>
          <div style={styles.summaryDetails}>
            <span style={styles.summaryVal}>{logoutsTodayCount}</span>
            <span style={styles.summaryLabel}>Logouts Hoy</span>
          </div>
        </div>

        <div className="glass-panel" style={{ ...styles.summaryCard, borderLeft: '3px solid #6366f1' }}>
          <div style={styles.summaryIconWrapper}>
            <Users size={20} color="#6366f1" />
          </div>
          <div style={styles.summaryDetails}>
            <span style={styles.summaryVal}>{activeUsersTodayCount}</span>
            <span style={styles.summaryLabel}>Operadores Activos</span>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={styles.controlsRow}>
          <div style={styles.filtersGroup}>
            {/* Search Input */}
            <div style={styles.inputWrapper}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem' }} />
              <input
                type="text"
                placeholder="Buscar por usuario o IP..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={styles.searchInput}
              />
            </div>

            {/* User Filter */}
            <select
              value={selectedUserFilter}
              onChange={(e) => {
                setSelectedUserFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.filterSelect}
            >
              <option value="all">Todos los operadores</option>
              {users.map(u => (
                <option key={u.idUsuario} value={u.idUsuario.toString()}>
                  {u.fullName}
                </option>
              ))}
            </select>

            {/* Action Filter */}
            <select
              value={selectedActionFilter}
              onChange={(e) => {
                setSelectedActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              style={styles.filterSelect}
            >
              <option value="all">Todas las acciones</option>
              <option value="login">Inicios de sesión (login)</option>
              <option value="logout">Cierres de sesión (logout)</option>
            </select>

            {/* Date Filter */}
            <div style={styles.inputWrapper}>
              <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', pointerEvents: 'none' }} />
              <input
                type="date"
                value={selectedDateFilter}
                onChange={(e) => {
                  setSelectedDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ ...styles.searchInput, paddingLeft: '2.25rem', width: '180px' }}
              />
              {selectedDateFilter && (
                <button
                  onClick={() => {
                    setSelectedDateFilter('');
                    setCurrentPage(1);
                  }}
                  style={{
                    position: 'absolute',
                    right: '0.5rem',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table Card */}
      <div className="glass-panel" style={styles.panelCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>
            <Clock size={18} color="var(--primary)" />
            Registro de Auditoría ({filteredLogs.length})
          </h3>
        </div>

        <div style={styles.cardBody}>
          <div style={styles.tableWrapper}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                Cargando registros...
              </div>
            ) : currentItems.length > 0 ? (
              <table style={styles.logsTable}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.tableHeaderCell}>Operador</th>
                    <th style={styles.tableHeaderCell}>Acción</th>
                    <th style={styles.tableHeaderCell}>Fecha</th>
                    <th style={styles.tableHeaderCell}>Hora</th>
                    <th style={styles.tableHeaderCell}>Dirección IP</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((log, index) => {
                    const userId = getLogUserId(log);
                    const userName = getUserName(userId);
                    const userEmail = getUserEmail(userId);
                    const isLogin = log.action.toLowerCase() === 'login';

                    return (
                      <tr key={index} style={styles.tableRow}>
                        {/* Operator Column */}
                        <td style={styles.tableCell}>
                          <div style={styles.userCell}>
                            <div style={styles.avatar}>
                              {userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{userName}</strong>
                              {userEmail && <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{userEmail}</span>}
                            </div>
                          </div>
                        </td>

                        {/* Action Column */}
                        <td style={styles.tableCell}>
                          <span style={{
                            ...styles.actionBadge,
                            ...(isLogin ? styles.actionLogin : styles.actionLogout)
                          }}>
                            {isLogin ? <LogIn size={10} /> : <LogOut size={10} />}
                            {log.action}
                          </span>
                        </td>

                        {/* Date Column */}
                        <td style={{ ...styles.tableCell, color: 'var(--text-secondary)' }}>
                          {log.fecha}
                        </td>

                        {/* Time Column */}
                        <td style={{ ...styles.tableCell, color: 'var(--text-secondary)' }}>
                          {log.hora || '--:--'}
                        </td>

                        {/* IP Address Column */}
                        <td style={styles.tableCell}>
                          <span style={styles.ipText}>
                            <Globe size={10} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                            {log.ipDir || 'Desconocido'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                No se encontraron registros de logs que coincidan con los filtros.
              </div>
            )}
          </div>

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div style={styles.paginationRow}>
              <span style={styles.paginationInfo}>
                Mostrando {indexOfFirstItem + 1} a {Math.min(indexOfLastItem, totalItems)} de {totalItems} registros
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => paginate(activePage - 1)}
                  disabled={activePage === 1}
                  style={{
                    ...styles.paginationBtn,
                    opacity: activePage === 1 ? 0.4 : 1,
                    cursor: activePage === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <button
                  onClick={() => paginate(activePage + 1)}
                  disabled={activePage === totalPages}
                  style={{
                    ...styles.paginationBtn,
                    opacity: activePage === totalPages ? 0.4 : 1,
                    cursor: activePage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
