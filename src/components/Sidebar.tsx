import React, { useState } from 'react';
import {
  ClipboardList,
  ChefHat,
  BookOpen,
  Settings,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
  History
} from 'lucide-react';
import type { Usuario } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Usuario;
  onLogout: () => void;
}

export const getRoleName = (user: Usuario): 'cajero' | 'cocinero' => {
  const name = (user.rol || '').toLowerCase();
  if (name.includes('cocinero') || name.includes('cocina')) {
    return 'cocinero';
  }
  return 'cajero';
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogout
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const userRole = getRoleName(currentUser);
  {
    if (!isCollapsed) {
      <div style={styles.profileCard}>
        <div style={styles.profileDetails}>
          <span style={styles.username}>{currentUser.fullName}</span>
          <span style={styles.roleBadge}>
            {currentUser.rol}
          </span>
        </div>
      </div>
    }
  }

  const menuItems = [
    { id: 'ordenes', label: 'Órdenes', icon: ClipboardList, roles: ['cajero'] },
    { id: 'cocina', label: 'Cocina', icon: ChefHat, roles: ['cocinero', 'cajero'] },
    { id: 'menu', label: 'Menú', icon: BookOpen, roles: ['cajero', 'cocinero'] },
    { id: 'administracion', label: 'Administración', icon: Settings, roles: ['cajero', 'cocinero'] },
    { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3, roles: ['cajero', 'cocinero'] },
    { id: 'logs', label: 'Logs', icon: History, roles: ['cajero', 'cocinero'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
      }}
      className="glass-panel"
    >
      {/* Brand Header */}
      <div style={styles.header}>
        <div style={styles.logoIcon}>
          <ChefHat size={22} color="var(--primary)" />
        </div>
        {!isCollapsed && (
          <div style={styles.logoTextWrapper}>
            <span style={styles.brandTitle}>REStBack</span>
            <span style={styles.brandSubtitle}>Restaurant OS</span>
          </div>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        style={styles.toggleBtn}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Nav Menu */}
      <nav style={styles.nav}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navItem,
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                backgroundColor: isActive ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
                borderColor: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} style={{ color: isActive ? 'var(--primary)' : 'inherit' }} />
              {!isCollapsed && <span style={styles.navLabel}>{item.label}</span>}
              {isActive && !isCollapsed && (
                <span style={styles.activeDot}></span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile */}
      <div style={{
        ...styles.footer,
        alignItems: isCollapsed ? 'center' : 'stretch',
        padding: isCollapsed ? '1rem 0.5rem' : '1.25rem',
      }}>
        {!isCollapsed &&
          <div style={styles.profileCard}>
            <div style={styles.profileDetails}>
              <span style={styles.username}>{currentUser.fullName}</span>
              <span style={styles.roleBadge}>
                {currentUser.rol}
              </span>
            </div>
          </div>
        }

        <button
          onClick={onLogout}
          style={{
            ...styles.logoutBtn,
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            marginTop: isCollapsed ? '0.75rem' : '0.5rem',
          }}
          title="Cerrar sesión"
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    borderRadius: 0,
    boxShadow: 'none',
    transition: 'width var(--transition-normal)',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '1.75rem 1.25rem',
    gap: '0.75rem',
    borderBottom: '1px solid var(--border-color)',
    height: '80px',
    overflow: 'hidden',
  } as React.CSSProperties,
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    border: '1px solid rgba(249, 115, 22, 0.2)',
    flexShrink: 0,
  } as React.CSSProperties,
  logoTextWrapper: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  } as React.CSSProperties,
  brandTitle: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: '1rem',
    letterSpacing: '0.05em',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  brandSubtitle: {
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  toggleBtn: {
    position: 'absolute',
    right: '-12px',
    top: '28px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 10,
    boxShadow: 'var(--shadow-sm)',
    transition: 'all var(--transition-fast)',
  } as React.CSSProperties,
  nav: {
    flex: 1,
    padding: '1.5rem 0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  } as React.CSSProperties,
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.85rem 1rem',
    border: 'none',
    borderLeft: '3px solid transparent',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    gap: '1rem',
    position: 'relative',
    width: '100%',
  } as React.CSSProperties,
  navLabel: {
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  activeDot: {
    position: 'absolute',
    right: '1rem',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    boxShadow: '0 0 8px var(--primary)',
  } as React.CSSProperties,
  footer: {
    borderTop: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  } as React.CSSProperties,
  profileCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: '0.75rem',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.02)',
  } as React.CSSProperties,
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'var(--primary)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1rem',
    flexShrink: 0,
  } as React.CSSProperties,
  profileDetails: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  } as React.CSSProperties,
  username: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  roleBadge: {
    fontSize: '0.7rem',
    color: 'var(--primary)',
    fontWeight: 600,
  } as React.CSSProperties,
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    transition: 'all var(--transition-fast)',
    gap: '1rem',
    width: '100%',
  } as React.CSSProperties,
};
