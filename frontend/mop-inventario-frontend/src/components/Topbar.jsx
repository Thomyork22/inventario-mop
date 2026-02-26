import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Topbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  const displayName = user?.username || "Usuario";
  const role = user?.is_superuser
    ? "Administrador"
    : user?.groups?.[0] || "Usuario";

  return (
    <header className="app-topbar">
      <div />

      <div className="topbar-user-box">
        <div className="topbar-avatar" />
        <div className="topbar-user-text">
          <div className="topbar-user-name">{displayName}</div>
          <div className="topbar-user-role">{role}</div>
        </div>

        <button className="topbar-logout-btn" title="Salir" onClick={handleLogout}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
