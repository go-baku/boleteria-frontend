import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { api, setOnSessionExpired } from "../api/client.js";

const AuthContext = createContext(null);

const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutos, igual que el backend
const EVENTOS_ACTIVIDAD = ["mousemove", "keydown", "click", "touchstart", "scroll"];

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [usuario, setUsuario] = useState(() => {
    const raw = localStorage.getItem("usuario");
    return raw ? JSON.parse(raw) : null;
  });
  const [sesionExpirada, setSesionExpirada] = useState(false);
  const timerRef = useRef(null);

  const logout = useCallback(async (expirada = false) => {
    const t = localStorage.getItem("token");
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUsuario(null);
    if (expirada) setSesionExpirada(true);
    if (t) {
      try {
        await api.post("/api/auth/logout", {}, t);
      } catch {
        /* si el token ya venció, el logout del servidor puede fallar; no importa */
      }
    }
  }, []);

  // Timeout de inactividad del lado del cliente: complementa al del backend
  // para redirigir al login apenas se cumplen los 5 minutos, sin esperar a
  // que falle el próximo request.
  const reiniciarTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!token) return;
    timerRef.current = setTimeout(() => logout(true), INACTIVITY_MS);
  }, [token, logout]);

  useEffect(() => {
    setOnSessionExpired(() => logout(true));
  }, [logout]);

  useEffect(() => {
    if (!token) return;
    reiniciarTimer();
    EVENTOS_ACTIVIDAD.forEach((ev) => window.addEventListener(ev, reiniciarTimer));
    return () => {
      EVENTOS_ACTIVIDAD.forEach((ev) => window.removeEventListener(ev, reiniciarTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [token, reiniciarTimer]);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/api/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
    setSesionExpirada(false);
  }, []);

  return (
    <AuthContext.Provider value={{ token, usuario, login, logout, sesionExpirada, setSesionExpirada }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
