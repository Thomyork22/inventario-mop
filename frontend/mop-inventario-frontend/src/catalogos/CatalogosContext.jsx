import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadCatalogos } from "../api/catalogos";
import { useAuth } from "../auth/AuthContext.jsx";

const EMPTY = {
  condiciones: [],
  estados: [],
  tipos: [],
  marcas: [],
  ram: [],
  procesadores: [],
  sistemasOperativos: [],
  tamanosDisco: [],
  tiposDisco: [],
  marcasMonitor: [],
  pulgadasMonitor: [],
  sedes: [],
  tiposMantenimiento: [],
  estadosMantenimiento: [],
  cargosFuncionario: [],
  unidadesFuncionario: [],
};

const CatalogosContext = createContext(null);

export function CatalogosProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  async function reload() {
    setLoading(true);
    const result = await loadCatalogos();
    setData((prev) => ({ ...prev, ...result.data }));
    setErrors(result.errors);
    setLoading(false);
  }

  useEffect(() => {
    if (!isAuthenticated) {
      setData(EMPTY);
      setErrors({});
      setLoading(false);
      return;
    }
    reload();
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({
      data,
      loading,
      errors,
      hasErrors: Object.keys(errors).length > 0,
      reload,
    }),
    [data, loading, errors]
  );

  return (
    <CatalogosContext.Provider value={value}>
      {children}
    </CatalogosContext.Provider>
  );
}

export function useCatalogos() {
  const ctx = useContext(CatalogosContext);
  if (!ctx) {
    throw new Error("useCatalogos() debe usarse dentro de <CatalogosProvider>");
  }
  return ctx;
}
