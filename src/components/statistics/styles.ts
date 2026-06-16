import React from 'react';

export const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  title: {
    fontSize: '2.25rem',
    marginBottom: '0.25rem',
    fontWeight: 700,
  } as React.CSSProperties,
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  } as React.CSSProperties,
  statsHighlights: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1.5rem',
  } as React.CSSProperties,
  highlightCard: {
    padding: '1.5rem',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(22, 26, 36, 0.5)',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  highlightLabel: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  } as React.CSSProperties,
  highlightVal: {
    fontSize: '1.85rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)',
  } as React.CSSProperties,
  highlightSubtext: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  } as React.CSSProperties,
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1.5rem',
  } as React.CSSProperties,
  chartPanel: {
    padding: '1.5rem',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    border: '1px solid var(--border-color)',
    backgroundColor: 'rgba(22, 26, 36, 0.7)',
  } as React.CSSProperties,
  chartTitle: {
    fontSize: '1.1rem',
    color: 'var(--text-secondary)',
    margin: 0,
    fontWeight: 600,
  } as React.CSSProperties,
  svgWrapper: {
    height: '280px',
    width: '100%',
    padding: '0.5rem 0',
  } as React.CSSProperties,
  chartTimeline: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '0.5rem',
  } as React.CSSProperties,
};
