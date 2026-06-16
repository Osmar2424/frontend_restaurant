import React from 'react';
import { ChefHat, Clock, Check, CheckCircle } from 'lucide-react';
import type { Order, OrderStatus, Dish } from '../../types';
import { styles } from './styles';
import { OrdersPend } from './components/ordersPend';
import { useKitchenState } from './hooks';

export interface KitchenViewProps {
  orders: Order[];
  dishesList: Dish[];
  onUpdateStatus: (id: number, status: OrderStatus) => void;
  onToggleDishAvailability: (dishId: number) => void;
}

const parseCliente = (combinedStr: string) => {
  const match = (combinedStr || '').match(/^(.*?)\s*\((.*?)\)$/);
  if (match) {
    return {
      clientName: match[1].trim(),
      tableNumber: match[2].trim()
    };
  }
  return {
    clientName: '',
    tableNumber: combinedStr || 'Para llevar'
  };
};

export const KitchenView: React.FC<KitchenViewProps> = ({
  orders,
  dishesList,
  onUpdateStatus,
  onToggleDishAvailability
}) => {
  const { setActiveTab, activeTab } = useKitchenState();
  const dishBgColor = 'linear-gradient(135deg, #f59e0b, #d97706)';


  // Active kitchen orders (pendiente or preparando)
  const activeOrders = orders.filter(
    (order) => order.estado === 'pendiente' || order.estado === 'preparando'
  );

  // Recently finished orders (entregado)
  const readyOrders = orders.filter((order) => order.estado === 'entregado');

  return (
    <div style={styles.container}>
      {/* Title Header */}
      <div style={styles.header}>
        <div style={styles.titleWrapper}>
          <ChefHat size={32} color="var(--primary)" />
          <div>
            <h1 style={styles.title}>Pantalla de Cocina</h1>
            <p style={styles.subtitle}>Gestión y despacho de comandas en tiempo real - REStBack</p>
          </div>
        </div>

        {/* View Switcher */}
        <div style={styles.tabSwitcher}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'orders' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.02)',
              color: activeTab === 'orders' ? 'white' : 'var(--text-secondary)',
            }}
          >
            Comandas ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === 'inventory' ? 'var(--primary)' : 'rgba(255, 255, 255, 0.02)',
              color: activeTab === 'inventory' ? 'white' : 'var(--text-secondary)',
            }}
          >
            Disponibilidad Menú
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div style={styles.kitchenLayout}>
          {/* Active Orders Section */}
          <div style={styles.activeOrdersCol}>
            <h2 style={styles.sectionHeading}>
              <Clock size={18} color="var(--color-pending)" /> Pedidos en Fila ({activeOrders.length})
            </h2>
            <OrdersPend activeOrders={activeOrders} onUpdateStatus={onUpdateStatus} />
          </div>

          {/* Recently Completed Sidebar */}
          <div style={styles.readyCol}>
            <h2 style={styles.sectionHeading}>
              <CheckCircle size={18} color="var(--color-ready)" /> Despachados ({readyOrders.length})
            </h2>

            <div style={styles.readyList}>
              {readyOrders.length > 0 ? (
                readyOrders.map((order) => (
                  <div
                    key={order.idOrder}
                    className="glass-panel"
                    style={{
                      ...styles.readyMiniCard,
                      borderLeft: '4px solid var(--color-ready)'
                    }}
                  >
                    <div style={styles.miniCardHeader}>
                      <strong style={{ color: 'var(--text-primary)' }}>{parseCliente(order.cliente).tableNumber}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {order.hora}
                      </span>
                    </div>
                    <div style={styles.miniCardItems}>
                      {order.orderItems.map((item, idx) => (
                        <span key={idx} style={styles.miniCardItem}>
                          {item.cantidad}x {item.dish?.name || `Plato #${item.idDish}`}
                        </span>
                      ))}
                    </div>
                    <div style={styles.miniCardFooter}>
                      <span style={{ color: 'var(--color-ready)', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', fontWeight: 600 }}>
                        <Check size={12} /> Entregado / Despachado
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ ...styles.emptyCardContainer, height: '150px', padding: '1rem' }}>
                  <p style={{ color: 'var(--text-muted)' }}>Ninguna orden entregada recientemente.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Pestaña para ver el inventario*/
        <div className="glass-panel" style={styles.inventoryPanel}>
          <div style={styles.inventoryHeader}>
            <div>
              <h3>Disponibilidad de Platos del Menú</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Deshabilita platos agotados para que los cajeros no puedan seleccionarlos.
              </p>
            </div>
            <div style={styles.inventoryStats}>
              <span style={{ color: 'var(--color-ready)' }}>
                Disponibles: <strong>{dishesList.filter(d => d.availability !== false).length}</strong>
              </span>
              <span style={{ color: 'var(--color-error)', marginLeft: '1rem' }}>
                Agotados: <strong>{dishesList.filter(d => d.availability === false).length}</strong>
              </span>
            </div>
          </div>

          <div style={styles.inventoryGrid}>
            {dishesList.map((dish) => {
              const isAvailable = dish.availability !== false;
              return (
                <div
                  key={dish.idDish}
                  style={{
                    ...styles.inventoryCard,
                    borderColor: isAvailable ? 'var(--border-color)' : 'var(--color-error-border)',
                    backgroundColor: isAvailable ? 'rgba(255,255,255,0.01)' : 'rgba(239, 68, 68, 0.03)',
                  }}
                >
                  <div style={{
                    ...styles.inventoryCardColor,
                    background: dishBgColor || 'var(--primary)'
                  }}>
                    {!isAvailable && (
                      <div style={styles.invOutOfStockTag}>AGOTADO</div>
                    )}
                  </div>

                  <div style={styles.inventoryCardInfo}>
                    <strong style={{
                      ...styles.inventoryCardName,
                      color: isAvailable ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}>
                      {dish.name}
                    </strong>
                    <span style={styles.inventoryCardCat}>Precio: ${dish.price}</span>
                  </div>

                  <div style={styles.inventoryCardAction}>
                    <button
                      onClick={() => onToggleDishAvailability(dish.idDish)}
                      className="btn"
                      style={{
                        ...styles.toggleAvailBtn,
                        backgroundColor: isAvailable ? 'var(--color-error-bg)' : 'var(--color-ready-bg)',
                        color: isAvailable ? 'var(--color-error)' : 'var(--color-ready)',
                        borderColor: isAvailable ? 'var(--color-error-border)' : 'var(--color-ready-border)',
                      }}
                    >
                      {isAvailable ? 'Marcar Agotado' : 'Marcar Disponible'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
