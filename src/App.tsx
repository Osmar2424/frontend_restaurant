import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './context/authContext';
import { Bell, X, Volume2, VolumeX } from 'lucide-react';
import type { Order, OrderStatus, Dish } from './types';
import { Login } from './components/login/Login';
import { Sidebar, getRoleName } from './components/Sidebar';
import { OrdersView } from './components/orders/OrdersView';
import { OrderForm } from './components/orderForm/OrderForm';
import { KitchenView } from './components/kitchen/kitchenView';
import { MenuView } from './components/menu/MenuView';
import { AdministrationView } from './components/administration/AdministrationView';
import { StatisticsView } from './components/statistics/StatisticsView';
import { LogsView } from './components/logs/LogsView';
import './App.css';
import { deleteOrder, getOrders, updateStateOrder } from './services/order.service';
import { availableDish, getDishes } from './services/dish.service';
import { handleUIError } from './components/utils';

interface ToastAlert {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

function App() {
  const { usuario: currentUser, isAuthenticated, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<string>('ordenes');
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishesList, setDishesList] = useState<Dish[]>([]);

  // Filtramos los platillos disponibles
  const availableDishes = dishesList.filter(dish => dish.availability);


  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Keep a ref to previous orders to detect updates and trigger sounds/toasts in the polling loop
  const prevOrdersRef = useRef<Order[]>([]);

  // Toast notifier helper
  const addToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Play sound notification
    if (soundEnabled) {
      try {
        const audioCtx = new AudioContext();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'success') {
          // Double ding (ready)
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.1);

          setTimeout(() => {
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);
            osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
            gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc2.start();
            osc2.stop(audioCtx.currentTime + 0.15);
          }, 120);
        } else if (type === 'warning') {
          // Low alert sound
          osc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.25);
        } else {
          // Neutral note (new order)
          osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
          gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        }
      } catch (e) {
        console.warn('Audio feedback failed or blocked by browser policy:', e);
      }
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, [soundEnabled]);

  // Obtener Dishes desde la API
  const fetchDishes = async () => {
    try {
      // Llamada a dish.service
      const backendDishes = await getDishes();

      setDishesList(backendDishes);
    } catch (err) {
      console.error('Ocurrio un error al obtener los platillos:', err);
    }
  };

  // Obtener ordenes desde la API
  const obtenerOrdenes = async (isBackground = false) => {
    if (!currentUser) return;
    if (!isBackground) setLoadingData(true);
    try {
      // Llamada a order.service
      const fetchedOrders = await getOrders();

      // Sort orders descending by ID or creation so that new orders are at the top
      const sorted = [...fetchedOrders].sort((a, b) => b.idOrder - a.idOrder);

      // If we have previous orders, compare to trigger alerts
      if (prevOrdersRef.current.length > 0 && isBackground) {
        const userRole = getRoleName(currentUser);

        sorted.forEach(newOrder => {
          const oldOrder = prevOrdersRef.current.find(o => o.idOrder === newOrder.idOrder);
          if (!oldOrder) {
            // Brand new order!
            if (userRole === 'cocinero') {
              addToast(`¡Nuevo pedido recibido! Mesa: ${newOrder.cliente}`, 'warning');
            }
          } else if (oldOrder.estado !== newOrder.estado) {
            // Status changed
            if (newOrder.estado === 'preparando' && userRole === 'cocinero') {
              addToast(`Pedido #${newOrder.idOrder} asignado a preparación`, 'info');
            } else if (newOrder.estado === 'entregado' && userRole === 'cajero') {
              addToast(`¡Pedido #${newOrder.idOrder} entregado/finalizado!`, 'success');
            }
          }
        });
      }

      setOrders(sorted);
      prevOrdersRef.current = sorted;
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      if (!isBackground) setLoadingData(false);
    }
  };

  // Load initial data on user login
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('umami_user', JSON.stringify(currentUser));

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab(getRoleName(currentUser) === 'cocinero' ? 'cocina' : 'ordenes');
      fetchDishes();
      obtenerOrdenes();
    } else {
      localStorage.removeItem('umami_user');
      localStorage.removeItem('token');
      setOrders([]);
      setDishesList([]);
      prevOrdersRef.current = [];
    }
  }, [currentUser]);

  // Polling loop for active orders (every 5 seconds)
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      obtenerOrdenes(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    setActiveTab('ordenes');
  };

  const handleRefreshData = () => {
    obtenerOrdenes();
  };

  const handleUpdateStatus = async (idOrder: number, status: OrderStatus) => {
    try {
      updateStateOrder(idOrder, status);

      setOrders(prevOrders => prevOrders.map(order => order.idOrder === idOrder ? { ...order, estado: status } : order));

      if (prevOrdersRef.current) {
        prevOrdersRef.current = prevOrdersRef.current.map(order => order.idOrder === idOrder ? { ...order, estado: status } : order);
      };

      // Toast message
      const statusText = status === 'preparando' ? 'En Cocina' : 'Entregado';
      addToast(`Estado actualizado: Orden #${idOrder} -> ${statusText}`, 'success');

    } catch (err) {
      console.error('Error al actualizar el estado de la orden:', err);
      addToast('No se pudo actualizar el estado de la orden', 'warning');
    }
  };

  const handleDeleteOrder = async (idOrder: number) => {
    try {
      deleteOrder(idOrder);
      addToast(`Comanda #${idOrder} eliminada`, 'warning');
      obtenerOrdenes(true);
    } catch (err) {
      handleUIError(
        err,
        (toastMessage) => addToast(toastMessage, 'warning'),
        'Error al eliminar la orden'
      );
    }
  };

  // Cambia la disponibilidad de los platillos
  const handleToggleDishAvailability = async (dishId: number) => {
    try {

      const oldDish = dishesList.find(d => d.idDish === dishId);

      if (!oldDish) throw new Error('No se encontro el platillo en la lista local.');

      const av: boolean = !oldDish.availability;

      const newDish = await availableDish(dishId, av);

      setDishesList(prevDishesList => prevDishesList.map(dish => dish.idDish === dishId ? newDish : dish));
      if (newDish) addToast(`${newDish.name} marcado como ${newDish.availability ? 'Disponible' : 'Agotado'}`, 'success');
    } catch (err) {
      handleUIError(
        err,
        (toastMessage) => addToast(toastMessage, 'warning'),
        'Ocurrio un error al actualizar la disponibilidad de un platillo.'
      );
      addToast('No se pudo cambiar la disponibilidad del item.', 'warning');
    }
  };

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    setIsOrderFormOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingOrder(null);
    setIsOrderFormOpen(true);
  };

  // Render view dispatcher
  const renderActiveView = () => {
    switch (activeTab) {
      case 'ordenes':
        return (
          <OrdersView
            orders={orders}
            onAddNewOrder={handleOpenAdd}
            onEditOrder={handleOpenEdit}
            onDeleteOrder={handleDeleteOrder}
            onUpdateStatus={handleUpdateStatus}
            onRefreshOrders={handleRefreshData}
          />
        );
      case 'cocina':
        return (
          <KitchenView
            orders={orders}
            dishesList={dishesList}
            onUpdateStatus={handleUpdateStatus}
            onToggleDishAvailability={handleToggleDishAvailability}
          />
        );
      case 'menu':
        return (
          <MenuView
            dishesList={dishesList}
            onRefreshDishes={fetchDishes}
          />
        );
      case 'administracion':
        return <AdministrationView />;
      case 'estadisticas':
        return <StatisticsView />;
      case 'logs':
        return <LogsView />;
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  if (!isAuthenticated || !currentUser) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Workspace Area */}
      <main className="main-content">
        {loadingData && (
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(249, 115, 22, 0.2)', color: 'var(--primary)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, zIndex: 1000 }}>
            Actualizando...
          </div>
        )}
        {renderActiveView()}
      </main>

      {/* Floating System Utilities (Sound toggle) */}
      <div className="glass-panel" style={styles.floatingControls}>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          style={styles.soundBtn}
          title={soundEnabled ? "Desactivar sonidos" : "Activar sonidos"}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Real-time Toast Notifications Grid */}
      <div style={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass-panel"
            style={{
              ...styles.toastCard,
              borderLeft: `4px solid ${toast.type === 'success'
                ? 'var(--color-ready)'
                : toast.type === 'warning'
                  ? 'var(--color-error)'
                  : 'var(--primary)'
                }`,
            }}
          >
            <Bell size={16} style={{
              color: toast.type === 'success'
                ? 'var(--color-ready)'
                : toast.type === 'warning'
                  ? 'var(--color-error)'
                  : 'var(--primary)',
              flexShrink: 0
            }} />
            <span style={styles.toastMessage}>{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              style={styles.toastCloseBtn}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Modal para crear o editar una orden*/}
      {isOrderFormOpen && (
        <OrderForm
          orderToEdit={editingOrder}
          dishesList={availableDishes}
          onSave={() => {
            setIsOrderFormOpen(false);
            setEditingOrder(null);
            addToast('Pedido guardado correctamente', 'success');
            obtenerOrdenes(true);
          }}
          onClose={() => {
            setIsOrderFormOpen(false);
            setEditingOrder(null);
          }}
        />
      )}
    </div>
  );
}

const styles = {
  floatingControls: {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    padding: '0.5rem',
    borderRadius: '10px',
    zIndex: 90,
  } as React.CSSProperties,
  soundBtn: {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)',
    transition: 'color var(--transition-fast)',
  } as React.CSSProperties,
  toastContainer: {
    position: 'fixed',
    top: '1.5rem',
    right: '1.5rem',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    maxWidth: '360px',
    width: '100%',
    pointerEvents: 'none',
  } as React.CSSProperties,
  toastCard: {
    padding: '1rem',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    backgroundColor: 'rgba(22, 26, 36, 0.95)',
    boxShadow: 'var(--shadow-lg)',
    animation: 'scaleIn 0.2s ease-out',
    pointerEvents: 'auto',
  } as React.CSSProperties,
  toastMessage: {
    fontSize: '0.85rem',
    fontWeight: 600,
    flex: 1,
    lineHeight: '1.3',
  } as React.CSSProperties,
  toastCloseBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.2rem',
    borderRadius: '4px',
    transition: 'color var(--transition-fast)',
  } as React.CSSProperties,
};

export default App;
