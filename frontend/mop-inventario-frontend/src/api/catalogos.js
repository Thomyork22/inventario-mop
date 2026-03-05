import { api, getApiErrorMessage } from "./api";

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
  cargosFuncionario: "/catalogos/cargos-funcionario/",
  unidadesFuncionario: "/catalogos/unidades-funcionario/",
};

export function pickList(payload) {
  const list = payload?.results ?? payload ?? [];
  return Array.isArray(list) ? list : [];
}

async function fetchAllCatalogPages(url) {
  const aggregated = [];
  let nextUrl = url;
  let page = 1;

  while (nextUrl) {
    const response = await api.get(nextUrl, {
      params: page === 1 ? { page_size: 5000 } : undefined,
    });
    const payload = response.data;
    const currentItems = pickList(payload);
    aggregated.push(...currentItems);

    const next = payload?.next;
    if (!next) break;
    nextUrl = next;
    page += 1;
  }

  return aggregated;
}

export async function loadCatalogos() {
  const entries = await Promise.all(
    Object.entries(CATALOG_ENDPOINTS).map(async ([key, url]) => {
      try {
        const list = await fetchAllCatalogPages(url);
        return [key, list, null];
      } catch (error) {
        const message = getApiErrorMessage(error, `No se pudo cargar ${key}.`);
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
