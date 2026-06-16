import React, { useState } from 'react';
import { Plus, Trash2, Edit, X, Save, BookOpen } from 'lucide-react';
import type { Dish } from '../../types';
import { styles } from './styles';
import { deleteDish, editDish, saveDish } from '../../services/dish.service';
import { handleUIError } from '../utils';



interface MenuViewProps {
  dishesList: Dish[];
  onRefreshDishes: () => void;
}

export const MenuView: React.FC<MenuViewProps> = ({ dishesList, onRefreshDishes }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dishBgColor = 'linear-gradient(135deg, #f59e0b, #d97706)';


  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingDish(null);
    setName('');
    setPrice('');
    setDescription('');
    setError('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (dish: Dish) => {
    setEditingDish(dish);
    setName(dish.name);
    setPrice(dish.price.toString());
    setDescription(dish.description);
    setError('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Controlamos que todas las casillas del form tengan un valor
    if (!name.trim() || !price || !description.trim()) {
      setError('Por favor complete todos los campos.');
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('El precio debe ser un número positivo.');
      return;
    }

    setLoading(true);

    try {
      if (editingDish) {
        // Edit via PATCH /dish/{id}
        await editDish(
          editingDish.idDish,
          name.trim(),
          priceNum,
          description.trim(),
        );
      } else {
        // Create via POST /dish
        await saveDish(
          name.trim(),
          priceNum,
          description.trim()
        );
      }
      onRefreshDishes(); setIsModalOpen(false);
    } catch (err) {
      //Pasamos el error al manejador de errores custom
      handleUIError(err, setError, 'Ocurrio un error al guardar el platillo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (idDish: number) => {
    if (!window.confirm('¿Confirmas que deseas eliminar este platillo del menú?')) {
      return;
    }

    try {
      await deleteDish(idDish);
      onRefreshDishes();
    } catch (err) {
      console.error('Error deleting dish:', err);
      alert('No se pudo eliminar el platillo.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Catálogo de Menú</h1>
          <p style={styles.subtitle}>Gestión de platillos, precios y descripciones en la carta de REStBack</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} /> Agregar Platillo
        </button>
      </div>


      {/* Menu Items Table */}
      <div className="glass-panel" style={{ padding: '1rem', overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
        {dishesList.length > 0 ? (
          <table style={styles.menuTable}>
            <thead>
              <tr style={styles.menuTableHeader}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Platillo</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Precio</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dishesList.map((dish) => (
                <tr key={dish.idDish} className="menu-row-hover" style={styles.menuTableRow}>
                  <td style={{ padding: '1rem' }}>
                    <div style={styles.menuTableDishCell}>
                      <div style={{
                        ...styles.dishColorIcon,
                        background: dishBgColor
                      }}>
                        {dish.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>{dish.name}</strong>
                        <span style={styles.dishTableDesc}>{dish.description}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Bs. {dish.price}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={styles.tableActionsWrapper}>
                      <button
                        onClick={() => handleOpenEdit(dish)}
                        style={styles.tableActionBtn}
                        title="Editar platillo"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(dish.idDish)}
                        style={{
                          ...styles.tableActionBtn,
                          color: 'var(--color-error)'
                        }}
                        title="Eliminar platillo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <BookOpen size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h3>No hay platillos en esta categoría</h3>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={styles.detailModal}>
            <div style={styles.detailModalHeader}>
              <h3>{editingDish ? 'Modificar Platillo' : 'Nuevo Platillo'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="modal-close" disabled={loading}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={styles.detailModalBody}>
                {error && (
                  <div style={{ padding: '0.75rem 1rem', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--color-error-border)', borderRadius: '10px', color: 'var(--color-error)', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Nombre del Platillo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Tacos al Pastor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Precio ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={loading}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Ingredientes y presentación..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={loading}
                    style={{ resize: 'vertical', minHeight: '80px', padding: '0.75rem' }}
                    required
                  />
                </div>

                <div style={styles.modalButtons}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    disabled={loading}
                  >
                    <Save size={16} /> {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
