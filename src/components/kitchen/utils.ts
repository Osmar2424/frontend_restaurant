import type { OrderStatus } from "../../types";

export const getOrderStatusCardStyle = (status: OrderStatus) => {
  switch (status) {
    case 'pendiente':
      return {
        border: '2px solid var(--color-pending)',
        boxShadow: '0 0 15px rgba(249, 115, 22, 0.15)',
      };
    case 'preparando':
      return {
        border: '2px solid var(--color-preparing)',
        boxShadow: '0 0 15px rgba(251, 191, 36, 0.15)',
      };
    case 'entregado':
      return {
        border: '2px solid var(--color-ready)',
        boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)',
      };
    default:
      return {
        border: '1px solid var(--border-color)',
      };
  }
};

export const getStatusTextSpanish = (status: OrderStatus) => {
  switch (status) {
    case 'pendiente': return 'NUEVO PEDIDO';
    case 'preparando': return 'EN PREPARACIÓN';
    case 'entregado': return 'ENTREGADO';
    default: return '';
  }
};

export const formatTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

// Helper to count minutes since creation
export const getMinutesElapsed = (dateStr: string) => {
  try {
    const created = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffMs = now - created;
    return Math.floor(diffMs / 60000);
  } catch {
    return 0;
  }
};
