// src/auth/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

// ✅ Decodificador simple de JWT (sin librerías)
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [access, setAccess] = useState(localStorage.getItem("access_token") || "");
  const [refresh, setRefresh] = useState(localStorage.getItem("refresh_token") || "");
  const [user, setUser] = useState(null);

  // Cada vez que cambia el access, reconstruimos "user" desde el JWT
  useEffect(() => {
    if (!access) {
      setUser(null);
      return;
    }
    const payload = decodeJwt(access);
    if (!payload) {
      setUser(null);
      return;
    }

    // OJO: SimpleJWT por defecto no trae username.
    // Trae user_id, exp, token_type, etc.
    // Entonces mostramos algo razonable con lo que sí tenemos.
    setUser({
      id: payload.user_id,
      username: payload.username || `Usuario #${payload.user_id}`,
      is_superuser: false, // esto no viene en JWT por defecto
      groups: [], // esto tampoco viene en JWT por defecto
      exp: payload.exp,
      token_type: payload.token_type,
    });
  }, [access]);

  async function login(username, password) {
    const res = await fetch(`${API_BASE}/token/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.detail || "No se pudo iniciar sesión. Revisa usuario/contraseña.";
      throw new Error(msg);
    }

    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);

    setAccess(data.access);
    setRefresh(data.refresh);

    return data;
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAccess("");
    setRefresh("");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      access,
      refresh,
      user,
      isAuthenticated: Boolean(access),
      login,
      logout,
      setAccess, // útil si después conectamos con api.js refresh
    }),
    [access, refresh, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() debe usarse dentro de <AuthProvider>");
  return ctx;
}
