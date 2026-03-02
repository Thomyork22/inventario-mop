import { api } from "./api";

export const CATALOG_ENDPOINTS = {
  condiciones: "/catalogos/condiciones-equipo/",
  estados: "/catalogos/estados-equipo/",
  tipos: "/catalogos/tipos-equipo/",
  marcas: "/catalogos/marcas/",
  ram: "/catalogos/ram/",
  procesadores: "/catalogos/procesadores/",
  sistemasOperativos: "/catalogos/sistemas-operativos/",
  tamanosDisco: "/catalogos/tamanos-disco/",
  tiposDisco: "/catalogos/tipos-disco/",
  marcasMonitor: "/catalogos/marcas-monitor/",
  pulgadasMonitor: "/catalogos/pulgadas-monitor/",
  sedes: "/catalogos/sedes/",
  tiposMantenimiento: "/catalogos/tipos-mantenimiento/",
  estadosMantenimiento: "/catalogos/estados-mantenimiento/",
};

export function pickList(payload) {
  const list = payload?.results ?? payload ?? [];
  return Array.isArray(list) ? list : [];
}

export async function loadCatalogos() {
  const entries = await Promise.all(
    Object.entries(CATALOG_ENDPOINTS).map(async ([key, url]) => {
      try {
        const response = await api.get(url);
        return [key, pickList(response.data), null];
      } catch (error) {
        const message =
          error?.response?.data?.detail ||
          error?.message ||
          `No se pudo cargar ${key}.`;
        return [key, [], message];
      }
    })
  );

  const data = {};
  const errors = {};

  for (const [key, list, error] of entries) {
    data[key] = list;
    if (error) {
      errors[key] = error;
    }
  }

  return {
    data,
    errors,
    hasErrors: Object.keys(errors).length > 0,
  };
}
