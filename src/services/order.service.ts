import type { Order, OrderStatus } from "../types";
import api from "../api/axios";

interface orderItems {
  cantidad: number;
  idDish: number;
}

export async function getOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>('/order?today=true');
  return response.data;
}

export async function updateStateOrder(idOrder: number, status: OrderStatus): Promise<Order> {
  const response = await api.patch<Order>(`/order/${idOrder}`, { estado: status });
  return response.data;
};

export async function deleteOrder(idOrder: number) {
  const response = await api.delete(`/order/${idOrder}`);
  return response.data;
};

export async function editOrder(
  idOrder: number,
  cliente: string,
  anotaciones: string,
  montoTotal: number,
  orderItems: orderItems[]
): Promise<Order> {
  const response = await api.patch(`/order/${idOrder}`, {
    cliente,
    anotaciones,
    montoTotal,
    orderItems
  });
  return response.data;
};

export async function saveOrder(
  cliente: string,
  fecha: string,
  hora: string,
  estado: string,
  montoTotal: number,
  anotaciones: string,
  orderItems: orderItems[]
): Promise<Order> {
  const response = await api.post<Order>('/order', {
    cliente,
    fecha,
    hora,
    estado,
    montoTotal,
    anotaciones,
    orderItems
  });
  return response.data;
}
