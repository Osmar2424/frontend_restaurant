export type UserRole = 'cajero' | 'cocinero';

export interface Role {
  idRol: number;
  nameRol: string;
  description: string;
}

export type OrderStatus = 'pendiente' | 'preparando' | 'entregado';

export interface Dish {
  idDish: number;
  name: string;
  price: number;
  description: string;
  availability: boolean;
}

export interface OrderItem {
  id?: number;
  cantidad: number;
  idDish: number;
  dish: {
    idDish: number;
    name: string;
    price: number;
    description?: string;
  };
}

export interface Order {
  idOrder: number;
  cliente: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:MM
  estado: OrderStatus;
  montoTotal: number;
  anotaciones: string;
  orderItems: OrderItem[];
}

export interface DailyResume {
  fecha: string; // YYYY-MM-DD
  totalVenta: number;
  detailItems?: DetailResume[];
}

export interface DetailResume {
  idDetail: number;
  cantidad: number;
  totalDetail: number;
  dish?: DetailDishItem;
  dishItems?: DetailDishItem[];
}

export interface DetailDishItem {
  idDish: number;
  name: string;
  price: number;
}

//Interfaces para login y authentication

export interface AuthResponse {
  token: string;
  usuario?: Usuario;
}

export interface LoginDto {
  email: string;
  hashPassword: string;
}

export interface RegisterDto {
  fullName: string;
  email: string;
  hashPassword: string;
  idRol: number;
}

export interface Usuario {
  idUsuario: number;
  email: string;
  fullName: string;
  rol: string;
}

export interface User {
  idUsuario: number;
  fullName: string;
  email: string;
  idRol: number;
  rol?: Role;
}

export interface logItems {
  idUsuario: number;
  action: string;
  fecha: string;
  hora: string;
  ipDir: string;
}
