// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function LoginPage() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      await login(username, password);
      nav("/dashboard", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Error de login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <div className="card">
        <div className="brandRow">
          <div className="logo" />
          <div>
            <div className="brandTitle">MOP Inventario TI</div>
            <div className="brandSub">Acceso al sistema</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="form">
          <label className="label">
            Usuario
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: admin"
              autoComplete="username"
            />
          </label>

          <label className="label">
            Contraseña
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
            />
          </label>

          {err ? <div className="error">{err}</div> : null}

          <button className="btn" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <div className="hint">
            Login con <b>SimpleJWT</b> (tokens guardados por AuthContext).
          </div>
        </form>
      </div>
    </div>
  );
}
