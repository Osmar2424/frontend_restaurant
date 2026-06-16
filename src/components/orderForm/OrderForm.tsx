import React, { useState, useEffect } from 'react';
import { Search, Trash2, Plus, Minus, X, ShoppingBag, FileText, User as UserIcon, Hash } from 'lucide-react';
import type { Order, Dish } from '../../types';
import { styles } from './styles';
import { handleUIError, obtenerFecha, obtenerHora } from '../utils';
import { editOrder, saveOrder } from '../../services/order.service';


interface OrderFormProps {
  orderToEdit?: Order | null;
  onSave: () => void;
  onClose: () => void;
  dishesList: Dish[];
}

export const OrderForm: React.FC<OrderFormProps> = ({
  orderToEdit,
  onSave,
  onClose,
  dishesList
}) => {
  const [clientName, setClientName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ idDish: number; name: string; price: number; quantity: number }[]>([]);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Helper to parse "Cliente (Mesa X)" back to details
  useEffect(() => {
    if (orderToEdit) {
      const combined = orderToEdit.cliente || '';
      const match = combined.match(/^(.*?)\s*\((.*?)\)$/);
      if (match) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setClientName(match[1].trim());
        setTableNumber(match[2].trim());
      } else {
        setClientName('');
        setTableNumber(combined);
      }

      // Map backend order items to form structure
      const mappedItems = orderToEdit.orderItems.map(item => ({
        idDish: item.idDish,
        name: item.dish?.name || `Plato #${item.idDish}`,
        price: item.dish?.price || 0,
        quantity: item.cantidad
      }));
      setSelectedItems(mappedItems);
      setNotes(orderToEdit.anotaciones || '');
    } else {
      setClientName('');
      setTableNumber('');
      setSelectedItems([]);
      setNotes('');
    }
  }, [orderToEdit]);

  // Calculate total
  const orderTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const bgDishColor = 'linear-gradient(135deg, #f59e0b, #d97706)';

  const filteredDishes = dishesList.filter(dish => {
    const matchesSearch =
      dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleDishSelect = (dish: Dish) => {
    // If dish availability is tracked, check it
    if (dish.availability === false) return;

    setSelectedItems(prev => {
      const existing = prev.find(item => item.idDish === dish.idDish);
      if (existing) {
        return prev.map(item =>
          item.idDish === dish.idDish ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prev, { idDish: dish.idDish, name: dish.name, price: dish.price, quantity: 1 }];
      }
    });
  };

  const handleIncrement = (idDish: number) => {
    setSelectedItems(prev => prev.map(item =>
      item.idDish === idDish ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  const handleDecrement = (idDish: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.idDish === idDish) {
        const newQty = item.quantity - 1;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as typeof selectedItems);
  };

  const handleRemoveItem = (idDish: number) => {
    setSelectedItems(prev => prev.filter(item => item.idDish !== idDish));
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (selectedItems.length === 0) {
      setError('Selecciona al menos un platillo para el pedido.');
      return;
    }

    if (!tableNumber.trim()) {
      setError('Debes especificar una mesa o ubicación.');
      return;
    }

    setLoading(true);


    // 1. Obtenemos la fecha para Bolivia
    const fecha = obtenerFecha();

    // 2. Obtenemos la hora en formato de 24 horas para Bolivia
    const hora = obtenerHora(); // Resultado: HH:MM

    // Combine client name and table number into "cliente"
    const combinedCliente = clientName.trim()
      ? `${clientName.trim()} (${tableNumber.trim()})`
      : tableNumber.trim();

    // Prepare orderItems DTO list
    const orderItems = selectedItems.map(item => ({
      cantidad: item.quantity,
      idDish: item.idDish
    }));

    try {
      if (orderToEdit) {
        // Para editar el pedido
        await editOrder(
          orderToEdit.idOrder,
          combinedCliente,
          notes.trim(),
          orderTotal,
          orderItems
        );
      } else {
        // Para instanciar un pedido
        await saveOrder(
          combinedCliente,
          fecha,
          hora,
          'pendiente',
          orderTotal,
          notes.trim(),
          orderItems
        );
      }

      onSave();
    } catch (err) {
      handleUIError(err, setError, 'Ocurrio un error al guardar la orden/pedido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content" style={styles.modalContent}>

        {/* Modal Header */}
        <div style={styles.modalHeader}>
          <div style={styles.headerTitleGroup}>
            <ShoppingBag color="var(--primary)" size={24} />
            <h2>{orderToEdit ? 'Modificar Pedido' : 'Registrar Nuevo Pedido'}</h2>
            {orderToEdit && (
              <span className="badge badge-pending" style={{ marginLeft: '0.75rem' }}>
                ID: #{orderToEdit.idOrder}
              </span>
            )}
          </div>
          <button onClick={onClose} className="modal-close" disabled={loading}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={styles.splitBody}>

          {/* Left Panel: Menu Selection */}
          <div style={styles.menuPanel}>
            <div style={styles.searchBar}>
              <Search size={16} color="var(--text-muted)" style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Buscar platillos..."
                className="form-input"
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={loading}
              />
            </div>


            {/* Dishes Grid */}
            <div style={styles.dishesGrid}>
              {filteredDishes.length > 0 ? (
                filteredDishes.map((dish) => {
                  const isSelected = selectedItems.some(item => item.idDish === dish.idDish);
                  const isAvailable = dish.availability !== false;
                  return (
                    <button
                      key={dish.idDish}
                      type="button"
                      onClick={() => handleDishSelect(dish)}
                      disabled={!isAvailable || loading}
                      style={{
                        ...styles.dishCard,
                        opacity: isAvailable ? 1 : 0.4,
                        borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                        backgroundColor: isSelected ? 'rgba(249, 115, 22, 0.03)' : 'var(--bg-card)',
                      }}
                    >
                      <div
                        style={{
                          ...styles.dishImageColor,
                          background: bgDishColor || 'var(--primary)'
                        }}
                      >
                        <span style={styles.dishPriceBadge}>${dish.price}</span>
                      </div>
                      <div style={styles.dishInfo}>
                        <h4 style={styles.dishName}>{dish.name}</h4>
                        <p style={styles.dishDesc}>{dish.description}</p>
                      </div>
                      {!isAvailable && (
                        <div style={styles.outOfStockOverlay}>
                          <span style={styles.outOfStockText}>AGOTADO</span>
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div style={styles.emptyGrid}>
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', width: '100%', padding: '2rem 0' }}>
                    No se encontraron platillos
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Active Ticket */}
          <form onSubmit={handleSubmit} style={styles.ticketPanel}>
            {error && (
              <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-error-border)', borderRadius: '10px', color: 'var(--color-error)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Customer Inputs */}
            <div style={styles.customerInputs}>
              <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                <label className="form-label">Cliente</label>
                <div style={styles.inputWrapper}>
                  <UserIcon size={16} color="var(--text-muted)" style={styles.inputIcon} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Nombre (opcional)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group" style={{ flex: 1.2, marginBottom: 0 }}>
                <label className="form-label">Ubicación / Mesa</label>
                <div style={styles.inputWrapper}>
                  <Hash size={16} color="var(--text-muted)" style={styles.inputIcon} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Mesa 5 o Para llevar"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    style={{ paddingLeft: '2.25rem' }}
                    disabled={loading}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Ticket Table */}
            <div style={styles.ticketTableContainer}>
              {selectedItems.length > 0 ? (
                <table style={styles.ticketTable}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem' }}>Platillo</th>
                      <th style={{ padding: '0.5rem', textAlign: 'center' }}>Cant</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item) => (
                      <tr key={item.idDish} style={styles.ticketTableRow}>
                        <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <div style={styles.itemQtyControls}>
                            <button
                              type="button"
                              onClick={() => handleDecrement(item.idDish)}
                              style={styles.qtyBtn}
                              disabled={loading}
                            >
                              <Minus size={10} />
                            </button>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncrement(item.idDish)}
                              style={styles.qtyBtn}
                              disabled={loading}
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Bs. {(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.idDish)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            disabled={loading}
                          >
                            <Trash2 size={14} className="icon-hover-danger" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '0.5rem' }}>
                  <ShoppingBag size={28} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: '0.8rem' }}>La comanda está vacía</span>
                </div>
              )}
            </div>

            {/* Notes Input */}
            <div style={styles.notesWrapper}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <FileText size={14} /> Anotaciones
              </label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Ej. Sin cebolla, aderezos aparte..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: 'none', minHeight: '50px', padding: '0.5rem', fontSize: '0.8rem' }}
                disabled={loading}
              />
            </div>

            {/* Summary Box */}
            <div style={styles.summaryBox}>
              <div style={{ ...styles.summaryRow, borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem', marginTop: '0.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                <span>Total a Pagar</span>
                <span>Bs. {orderTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
