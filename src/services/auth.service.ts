import api from "../api/axios";
import type { AuthResponse, LoginDto, RegisterDto } from "../types";


// Endpoints centralizados para autenticación
const AUTH_ENDPOINTS = {
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  REGISTER: "/auth/register",
} as const;

// Inicia sesión con las credenciales proporcionadas
export async function login(loginDto: LoginDto): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(AUTH_ENDPOINTS.LOGIN, loginDto);
  return response.data;
}

// Registra un nuevo usuario (solo para administradores)
export async function register(registerDto: RegisterDto): Promise<void> {
  await api.post(AUTH_ENDPOINTS.REGISTER, registerDto);
}

// Cierra la sesión del usuario
export async function logout(): Promise<void> {
  await api.post(AUTH_ENDPOINTS.LOGOUT);
}

