import { AlertTriangle, Check, CheckCircle, ChefHat, Eye, X } from "lucide-react";
import { styles } from "../styles";
import { getMinutesElapsed, getOrderStatusCardStyle, getStatusTextSpanish } from "../utils";
import type { Order, OrderStatus } from "../../../types";
import { useKitchenState } from "../hooks";

interface orderPendProps {
  activeOrders: Order[];
  onUpdateStatus: (id: number, status: OrderStatus) => void;
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

export const OrdersPend = (
  { activeOrders, onUpdateStatus }: orderPendProps
) => {

  const { selectedOrderDetails, setSelectedOrderDetails } = useKitchenState();

  return (
    <>
      {activeOrders.length > 0 ? (
        <div style={styles.ordersGrid}>
          {activeOrders.map((order) => {
            const { clientName, tableNumber } = parseCliente(order.cliente);
            const createdIsoStr = `${order.fecha}T${order.hora}`;
            const elapsed = getMinutesElapsed(createdIsoStr);
            const isLate = elapsed > 15 && order.estado !== 'entregado';

            return (
              <div
                key={order.idOrder}
                className={`glass-panel ${order.estado === 'pendiente' ? 'pulse-border' : ''}`}
                style={{
                  ...styles.orderCard,
                  ...getOrderStatusCardStyle(order.estado),
                }}
              >
                {/* Card Header */}
                <div style={styles.cardHeader}>
                  <div>
                    <span style={styles.cardTable}>{tableNumber}</span>
                    <span style={{
                      ...styles.cardStatusLabel,
                      color: order.estado === 'pendiente' ? 'var(--color-pending)' : 'var(--color-preparing)'
                    }}>
                      {getStatusTextSpanish(order.estado)}
                    </span>
                  </div>
                  <div style={{
                    ...styles.cardTime,
                    color: isLate ? 'var(--color-error)' : 'var(--text-secondary)',
                    fontWeight: isLate ? 800 : 'normal'
                  }}>
                    {isLate && <AlertTriangle size={14} style={{ marginRight: '0.2rem' }} />}
                    Hace {elapsed} min ({order.hora})
                  </div>
                </div>

                {/* Client info */}
                {clientName && (
                  <div style={styles.cardClient}>
                    Cliente: <strong>{clientName}</strong>
                  </div>
                )}

                {/* Items to Cook */}
                <div style={styles.cardItemsList}>
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} style={styles.cardItemRow}>
                      <span style={styles.cardItemQty}>{item.cantidad}x</span>
                      <span style={styles.cardItemName}>{item.dish?.name || `Plato #${item.idDish}`}</span>
                    </div>
                  ))}
                </div>

                {/* Notes Box */}
                {order.anotaciones && (
                  <div style={styles.cardNotes}>
                    <strong>Anotaciones:</strong>
                    <p>{order.anotaciones}</p>
                  </div>
                )}

                {/* Actions */}
                <div style={styles.cardActions}>
                  <button
                    onClick={() => setSelectedOrderDetails(order)}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem 0.75rem' }}
                    title="Ver detalle completo"
                  >
                    <Eye size={16} />
                  </button>

                  {order.estado === 'pendiente' ? (
                    <button
                      onClick={() => onUpdateStatus(order.idOrder, 'preparando')}
                      className="btn btn-primary"
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--color-preparing)',
                        boxShadow: '0 0 10px rgba(251, 191, 36, 0.2)'
                      }}
                    >
                      <ChefHat size={16} /> Empezar a Cocinar
                    </button>
                  ) : (
                    <button
                      onClick={() => onUpdateStatus(order.idOrder, 'entregado')}
                      className="btn btn-primary"
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--color-ready)',
                        boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)'
                      }}
                    >
                      <Check size={16} /> ¡Entregar!
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      ) : (
        <div className="glass-panel" style={styles.emptyCardContainer}>
          <CheckCircle size={40} color="var(--color-ready)" style={{ marginBottom: '0.75rem' }} />
          <h3>¡Todo al día en cocina!</h3>
          <p style={{ color: 'var(--text-secondary)' }}>No hay comandas pendientes de preparación.</p>
        </div>
      )}

      {/* Modal para detalles de pedidos */}
      {selectedOrderDetails && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={styles.detailsModal}>
            <div style={styles.detailsModalHeader}>
              <h3>Detalles Comanda {parseCliente(selectedOrderDetails.cliente).tableNumber}</h3>
              <button onClick={() => setSelectedOrderDetails(null)} className="modal-close">
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                <span>Hora pedido: {selectedOrderDetails.hora}</span>
                <span>ID: #{selectedOrderDetails.idOrder}</span>
              </div>

              {parseCliente(selectedOrderDetails.cliente).clientName && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Cliente:</strong> {parseCliente(selectedOrderDetails.cliente).clientName}
                </div>
              )}

              <h4 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                Platillos Solicitados:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {selectedOrderDetails.orderItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                    <span><strong>{item.cantidad}x</strong> {item.dish?.name || `Plato #${item.idDish}`}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Bs. {((item.dish?.price || 0) * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {selectedOrderDetails.anotaciones && (
                <div style={styles.cardNotes}>
                  <strong>Anotaciones del Pedido:</strong>
                  <p style={{ fontSize: '1.05rem', lineHeight: '1.4' }}>{selectedOrderDetails.anotaciones}</p>
                </div>
              )}

              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '1rem' }}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
