import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Topbar />
        <div className="app-content">
          <Outlet />
        </div>
        <footer className="app-footer">
          © 2026 MOP Inventario TI. Todos los derechos reservados.
        </footer>
      </div>
    </div>
  );
}
