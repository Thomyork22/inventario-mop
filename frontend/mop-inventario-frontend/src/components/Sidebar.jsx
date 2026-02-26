import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  Wrench,
  Users,
  FileText,
  Settings,
} from "lucide-react";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventario", label: "Inventario", icon: Boxes },
  { to: "/mantenciones", label: "Mantenciones", icon: Wrench },
  { to: "/funcionarios", label: "Funcionarios", icon: Users },
  { to: "/reportes", label: "Reportes", icon: FileText },
  { to: "/configuracion", label: "Configuración", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo" />
        <div>
          <div className="sidebar-title">MOP Inventario TI</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " is-active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{it.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
