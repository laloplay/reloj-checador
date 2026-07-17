import { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { AUTH_TOKEN_STORAGE_KEY } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [cargando, setCargando] = useState(true);

  const initAuth = useCallback(() => {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Opcional: verificar si el token ha expirado
        if (decoded.exp * 1000 > Date.now()) {
          setAdmin(decoded);
        } else {
          localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Token inválido:', error);
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = (token) => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    const decoded = jwtDecode(token);
    setAdmin(decoded);
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    setAdmin(null);
  };

  const value = { admin, login, logout, cargando, refresh: initAuth };

  return <AuthContext.Provider value={value}>{!cargando && children}</AuthContext.Provider>;
}
