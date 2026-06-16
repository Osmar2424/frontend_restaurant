import api from "../api/axios";
import type { Role } from "../types";

export async function getRoles(): Promise<Role[]> {
  const response = await api.get<Role[]>('/roles');
  return response.data;
}
