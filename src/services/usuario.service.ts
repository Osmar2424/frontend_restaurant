import api from "../api/axios";
import type { User } from "../types";

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>('/usuarios');
  return response.data;
}

export async function deleteUser(idUsuario: number) {
  const response = await api.delete(`/usuarios/${idUsuario}`);
  return response.data;
}
