import { createContext, useContext, useState, type ReactNode } from "react";
import type { Usuario } from "../types";
import { jwtDecode } from "jwt-decode";
import { obtenerFecha, obtenerHora } from "../components/utils";
import { enter_log } from "../services/logs.service";

interface AuthContextValue {
  token: string | null;
  usuario: Usuario | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

interface JwtPayloadCustom {
  idUsuario: number;
  email: string;
  fullName: string;
  rol: string;
  exp: number;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('umami_user');
    return saved ? JSON.parse(saved) : null;
  });

  function login(token: string) {
    localStorage.setItem('token', token);
    setToken(token);

    // Extraemos los datos que vienen en el payload de el token
    const usuarioDecoded = obtenerUsuarioToken(token);
    setUsuario(usuarioDecoded);

    // Enviamos los datos para guardarlos en el log de logins\
    if (usuarioDecoded) registrarLog(usuarioDecoded.idUsuario, 'login');
  }

  function logout() {
    if (usuario) registrarLog(usuario.idUsuario, 'logout');
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{
      token,
      usuario,
      isAuthenticated: !!usuario,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );

}

async function registrarLog(idUsuario: number, action: string) {
  await enter_log(
    idUsuario,
    action,
    obtenerFecha(),
    obtenerHora()
  )
}

function obtenerUsuarioToken(token: string | null): Usuario | null {
  if (!token) return null;
  try {
    const decoded = jwtDecode<JwtPayloadCustom>(token);

    //Validamos si el token ya expiro
    const now = Date.now() / 1000;
    if (decoded.exp < now) {
      localStorage.removeItem('token');
      return null;
    }

    return {
      idUsuario: decoded.idUsuario,
      fullName: decoded.fullName,
      rol: decoded.rol,
      email: decoded.email,
    };
  } catch (error) {
    console.error("Token inválido o corrupto", error);
    return null;
  }
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
}
