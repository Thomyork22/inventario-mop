import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layouts/AppLayout.jsx";

import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import InventarioPage from "./pages/InventarioPage.jsx";
import AsignacionesPage from "./pages/AsignacionesPage.jsx";
import MantencionesPage from "./pages/MantencionesPage.jsx";
import FuncionariosPage from "./pages/FuncionariosPage.jsx";
import CatalogosPage from "./pages/CatalogosPage.jsx";
import ReportesPage from "./pages/ReportesPage.jsx";
import ConfiguracionPage from "./pages/ConfiguracionPage.jsx";

function hasAccessToken() {
  return Boolean(localStorage.getItem("access_token"));
}

function RequireAuth({ children }) {
  if (!hasAccessToken()) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventario" element={<InventarioPage />} />
        <Route path="/asignaciones" element={<AsignacionesPage />} />
        <Route path="/mantenciones" element={<MantencionesPage />} />
        <Route path="/funcionarios" element={<FuncionariosPage />} />
        <Route path="/catalogos" element={<CatalogosPage />} />
        <Route path="/reportes" element={<ReportesPage />} />
        <Route path="/configuracion" element={<ConfiguracionPage />} />
      </Route>

      <Route path="*" element={<div className="page-404">404</div>} />
    </Routes>
  );
}
