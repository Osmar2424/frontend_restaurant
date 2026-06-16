import React, { useState } from 'react';
import { Plus, Trash2, Edit3, CheckCircle, Clock, Utensils, ShoppingBag, Printer, X, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import type { Order, OrderStatus } from '../../types';
import { styles } from './styles';
import { handleUIError, obtenerFecha } from '../utils';

interface OrdersViewProps {
  orders: Order[];
  onAddNewOrder: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (id: number) => void;
  onUpdateStatus: (id: number, status: OrderStatus) => void;
  onRefreshOrders: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onAddNewOrder,
  onEditOrder,
  onDeleteOrder,
  onUpdateStatus,
  onRefreshOrders
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cierreLoading, setCierreLoading] = useState(false);
  const [error, setError] = useState('');

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'all') return true;
    return order.estado === statusFilter;
  });

  console.log(filteredOrders);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pendiente':
        return <span className="badge badge-pending">Pendiente</span>;
      case 'preparando':
        return <span className="badge badge-preparing">En Cocina</span>;
      case 'entregado':
        return <span className="badge badge-delivered">Entregado</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const getStatusGlowColor = (status: OrderStatus) => {
    switch (status) {
      case 'pendiente': return 'var(--color-pending)';
      case 'preparando': return 'var(--color-preparing)';
      case 'entregado': return 'var(--color-delivered)';
      default: return 'var(--border-color)';
    }
  };

  // Parse Combined Client & Table String
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

  const handlePrint = (order: Order) => {
    const { clientName, tableNumber } = parseCliente(order.cliente);
    alert(`[TICKET IMPRESO] Enviado a ticketera de caja para: ${clientName || 'Cliente Genérico'} (${tableNumber})`);
  };

  // Perform Cierre de Caja
  const handleCierreCaja = async () => {

    const todayStr = obtenerFecha();
    console.log(todayStr);
    const confirmCierre = window.confirm(
      `¿Confirmas realizar el cierre de caja para la fecha de hoy (${todayStr})? \nEsto registrará el resumen diario de ventas en el backend.`
    );
    if (!confirmCierre) return;

    setCierreLoading(true);
    try {
      await api.post('/daily-resume/cierre_caja', {
        fecha: todayStr
      });
      alert('¡Cierre de caja realizado con éxito!');
      onRefreshOrders(); // Refresh orders list
    } catch (err) {
      handleUIError(err, setError, 'Ocurrio un error en el cierre de caja.');
    } finally {
      setCierreLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Title Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Panel de Órdenes</h1>
          <p style={styles.subtitle}>Gestión y control de comandas de caja de REStBack</p>
        </div>
        <div style={styles.headerRight}>
          <button
            style={styles.cierreCajaBtn}
            onClick={handleCierreCaja}
            disabled={cierreLoading}
          >
            <ShieldAlert size={16} />
            {cierreLoading ? 'Procesando...' : 'Cierre de Caja'}
          </button>
          <button className="btn btn-primary" onClick={onAddNewOrder} style={styles.newOrderBtn}>
            <Plus size={18} /> Nueva Orden
          </button>
        </div>

        {/*Mostrar notificaciones de error*/}
        {error && (
          <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-error-border)', borderRadius: '10px', color: 'var(--color-error)', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

      </div>

      {/* Filter Tabs */}
      <div style={styles.filtersWrapper}>
        <div style={styles.tabsContainer}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pendiente', label: 'Pendientes' },
            { id: 'preparando', label: 'En Cocina' },
            { id: 'entregado', label: 'Entregados' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                ...styles.filterTab,
                backgroundColor: statusFilter === tab.id ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === tab.id ? 'var(--primary)' : 'var(--text-secondary)',
                borderColor: statusFilter === tab.id ? 'var(--primary)' : 'transparent',
              }}
            >
              {tab.label}
              {tab.id !== 'all' && (
                <span style={{
                  ...styles.tabCount,
                  backgroundColor: statusFilter === tab.id ? 'var(--primary)' : 'var(--border-color)',
                  color: statusFilter === tab.id ? 'white' : 'var(--text-secondary)'
                }}>
                  {orders.filter(o => o.estado === tab.id).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Receipts */}
      {filteredOrders.length > 0 ? (
        <div className="grid grid-cols-3" style={styles.grid}>
          {filteredOrders.map((order) => {
            const { clientName, tableNumber } = parseCliente(order.cliente);
            return (
              <div
                key={order.idOrder}
                className="receipt-card"
                onClick={() => {
                  setSelectedOrder(order);
                  setShowDeleteConfirm(false);
                }}
                style={styles.cardHover}
              >
                {/* Highlight ribbon representing status */}
                <div style={{
                  ...styles.statusRibbon,
                  backgroundColor: getStatusGlowColor(order.estado)
                }} />

                <div className="receipt-header">
                  <div style={styles.cardHeaderTop}>
                    <span style={styles.ticketId}>#{order.idOrder}</span>
                    <div style={styles.timeTag}>
                      <Clock size={12} style={{ marginRight: '0.2rem' }} />
                      {order.hora}
                    </div>
                  </div>
                  <div style={styles.tableTag}>
                    {tableNumber}
                  </div>
                  {clientName && (
                    <div style={styles.clientTag}>
                      Clnt: {clientName}
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="receipt-items">
                  {order.orderItems.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="receipt-item-row">
                      <span className="receipt-item-qty">{item.cantidad}x</span>
                      <span className="receipt-item-name">{item.dish?.name || `Plato #${item.idDish}`}</span>
                      <span className="receipt-item-price">Bs. {((item.dish?.price || 0) * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                  {order.orderItems.length > 3 && (
                    <div style={styles.moreItems}>
                      + {order.orderItems.length - 3} platillo(s) más...
                    </div>
                  )}
                </div>

                {/* Notes */}
                {order.anotaciones && (
                  <div className="receipt-notes">
                    "{order.anotaciones.length > 35 ? `${order.anotaciones.slice(0, 35)}...` : order.anotaciones}"
                  </div>
                )}

                {/* Total & Action Status */}
                <div className="receipt-total-row">
                  <span>TOTAL:</span>
                  <span>Bs. {order.montoTotal}</span>
                </div>

                <div style={styles.cardStatusFooter}>
                  {getStatusBadge(order.estado)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel" style={styles.emptyContainer}>
          <ShoppingBag size={48} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <h3>No hay órdenes registradas</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            {statusFilter === 'all'
              ? 'Comienza registrando una nueva comanda con el botón superior.'
              : `No se encontraron órdenes con el estado seleccionado.`}
          </p>
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={styles.detailModal}>
            <div style={styles.detailModalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Utensils color="var(--primary)" size={20} />
                <h3>Detalle de Comanda #{selectedOrder.idOrder}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setShowDeleteConfirm(false);
                }}
                className="modal-close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={styles.detailModalBody}>
              {/* Receipt styling detail */}
              <div style={styles.detailsTicketBg}>
                <div style={styles.ticketDotLine}></div>

                <div style={styles.ticketMetaRow}>
                  <div><strong>Mesa/Ubicación:</strong> {parseCliente(selectedOrder.cliente).tableNumber}</div>
                  <div><strong>Hora:</strong> {selectedOrder.hora}</div>
                </div>
                {parseCliente(selectedOrder.cliente).clientName && (
                  <div style={{ marginBottom: '1rem', color: '#1e293b' }}>
                    <strong>Cliente:</strong> {parseCliente(selectedOrder.cliente).clientName}
                  </div>
                )}

                <div style={styles.ticketSeparator}></div>

                {/* Table of items */}
                <table style={styles.ticketTable}>
                  <thead>
                    <tr style={styles.ticketTableHeader}>
                      <th style={{ textAlign: 'left' }}>Cant</th>
                      <th style={{ textAlign: 'left' }}>Platillo</th>
                      <th style={{ textAlign: 'right' }}>Precio</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.orderItems.map((item, idx) => (
                      <tr key={idx} style={styles.ticketTableRow}>
                        <td>{item.cantidad}x</td>
                        <td>{item.dish?.name || `Plato #${item.idDish}`}</td>
                        <td style={{ textAlign: 'right' }}>Bs. {(item.dish?.price || 0)}</td>
                        <td style={{ textAlign: 'right' }}>Bs. {((item.dish?.price || 0) * item.cantidad).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={styles.ticketSeparator}></div>

                {selectedOrder.anotaciones && (
                  <div style={styles.ticketNotesBox}>
                    <strong>Anotaciones:</strong>
                    <p>"{selectedOrder.anotaciones}"</p>
                  </div>
                )}

                <div style={styles.ticketTotalBox}>
                  <span>TOTAL COBRAR:</span>
                  <span style={styles.ticketTotalVal}>Bs. {selectedOrder.montoTotal}</span>
                </div>
              </div>

              {/* Status and Action options */}
              <div style={styles.actionsPanel}>
                <div style={styles.actionStatusGroup}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Estado actual:
                  </span>
                  {getStatusBadge(selectedOrder.estado)}
                </div>

                <div style={styles.actionButtonsRow}>
                  {/* Edit */}
                  <button
                    onClick={() => {
                      onEditOrder(selectedOrder);
                      setSelectedOrder(null);
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    disabled={selectedOrder.estado === 'entregado'}
                  >
                    <Edit3 size={16} /> Editar
                  </button>

                  {/* Print */}
                  <button
                    onClick={() => handlePrint(selectedOrder)}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    <Printer size={16} /> Imprimir
                  </button>

                  {/* Mark Delivered */}
                  {selectedOrder.estado === 'preparando' && (
                    <button
                      onClick={() => {
                        onUpdateStatus(selectedOrder.idOrder, 'entregado');
                        setSelectedOrder(null);
                      }}
                      className="btn btn-primary"
                      style={{ flex: 1.5, backgroundColor: 'var(--color-delivered)' }}
                    >
                      <CheckCircle size={16} /> Entregar
                    </button>
                  )}

                  {/* Move back to cash check if not delivered */}
                  {selectedOrder.estado === 'pendiente' && (
                    <button
                      onClick={() => {
                        onUpdateStatus(selectedOrder.idOrder, 'preparando');
                        setSelectedOrder(null);
                      }}
                      className="btn btn-primary"
                      style={{ flex: 1.5 }}
                    >
                      <Utensils size={16} /> Enviar a Cocina
                    </button>
                  )}
                </div>

                {/* Delete Zone */}
                <div style={styles.deleteZone}>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn btn-danger"
                      style={{ width: '100%' }}
                    >
                      <Trash2 size={16} /> Eliminar Comanda
                    </button>
                  ) : (
                    <div style={styles.confirmDeleteBox}>
                      <span style={{ color: 'var(--color-error)', fontSize: '0.85rem', fontWeight: 600 }}>
                        ¿Confirmas eliminar la orden por completo?
                      </span>
                      <div style={styles.confirmButtons}>
                        <button
                          onClick={() => {
                            onDeleteOrder(selectedOrder.idOrder);
                            setSelectedOrder(null);
                          }}
                          className="btn btn-danger"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        >
                          Sí, Eliminar
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
