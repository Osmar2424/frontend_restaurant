import api from "../api/axios";
import type { logItems } from "../types";

export async function enter_log(idUsuario: number, action: string, fecha: string, hora: string): Promise<void> {
  await api.post('/login-logs', {
    idUsuario,
    action,
    fecha,
    hora,
  });
}


export async function getLogs(): Promise<logItems[]> {
  const response = await api.get('/login-logs');
  return response.data;
}
