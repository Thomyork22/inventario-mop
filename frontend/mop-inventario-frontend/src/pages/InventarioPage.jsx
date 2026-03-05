import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api, getApiErrorMessage } from "../api/api";
import { useCatalogos } from "../catalogos/CatalogosContext.jsx";
import EquipoDetailModal from "../components/EquipoDetailModal.jsx";
import EditarEquipoModal from "../components/EditarEquipoModal.jsx";
import NuevoEquipoModal from "../components/NuevoEquipoModal.jsx";

function useDebounced(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function InventarioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlUbicacion = searchParams.get("id_ubicacion") || "";
  const { data: catalogosData, loading: catalogosLoading, errors: catalogosErrors } = useCatalogos();

  const [search, setSearch] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const debouncedSearch = useDebounced(search, 350);

  const [filters, setFilters] = useState({
    codigo_estado: "",
    id_ubicacion: urlUbicacion,
    codigo_marca: "",
    codigo_tipo: "",
    activo: "",
  });

  const [ordering, setOrdering] = useState("-id_equipo");
  const [page, setPage] = useState(1);

  const [data, setData] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bulkActionMsg, setBulkActionMsg] = useState("");
  const [clearingAll, setClearingAll] = useState(false);

  // Modal detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState(null);

  // Modal editar
  const [editarOpen, setEditarOpen] = useState(false);

  // Modal nuevo
  const [nuevoOpen, setNuevoOpen] = useState(false);

  const catalogos = useMemo(
    () => ({
      estados: catalogosData.estados ?? [],
      ubicaciones: catalogosData.sedes ?? [],
      marcas: catalogosData.marcas ?? [],
      tipos: catalogosData.tipos ?? [],
      condiciones: catalogosData.condiciones ?? [],
      ram: catalogosData.ram ?? [],
      procesadores: catalogosData.procesadores ?? [],
      sistemasOperativos: catalogosData.sistemasOperativos ?? [],
      tiposDisco: catalogosData.tiposDisco ?? [],
      tamanosDisco: catalogosData.tamanosDisco ?? [],
      marcasMonitor: catalogosData.marcasMonitor ?? [],
      pulgadasMonitor: catalogosData.pulgadasMonitor ?? [],
    }),
    [catalogosData]
  );

  const catalogosError = useMemo(() => {
    const values = Object.values(catalogosErrors || {});
    return values[0] || "";
  }, [catalogosErrors]);

  // =========================
  // 1) Leer id_ubicacion desde URL y sincronizarlo al filtro
  // =========================
  useEffect(() => {
    setFilters((prev) => {
      // no re-render innecesario si es igual
      if (String(prev.id_ubicacion || "") === String(urlUbicacion)) return prev;
      return { ...prev, id_ubicacion: urlUbicacion };
    });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const queryParams = useMemo(() => {
    const params = { page, ordering };

    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (filters.codigo_estado) params.codigo_estado = filters.codigo_estado;
    if (filters.id_ubicacion) {
      // Soporta backends que filtran por fk y/o por nombre *_id
      params.id_ubicacion = filters.id_ubicacion;
      params.id_ubicacion_id = filters.id_ubicacion;
    }
    if (filters.codigo_marca) params.codigo_marca = filters.codigo_marca;
    if (filters.codigo_tipo) params.codigo_tipo = filters.codigo_tipo;
    if (filters.activo) params.activo = filters.activo;

    return params;
  }, [page, ordering, debouncedSearch, filters]);

  // =========================
  // Helper: setFilter (con URL si es ubicación)
  // =========================
  function setFilter(key, value) {
    setPage(1);

    // Si cambia ubicación, también cambia la URL
    if (key === "id_ubicacion") {
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        if (value) p.set("id_ubicacion", value);
        else p.delete("id_ubicacion");
        return p;
      });
    }

    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setSearch("");
    setPage(1);
    setOrdering("-id_equipo");
    setFilters({
      codigo_estado: "",
      id_ubicacion: "",
      codigo_marca: "",
      codigo_tipo: "",
      activo: "",
    });

    // Limpia la URL también
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.delete("id_ubicacion");
      return p;
    });
  }

  async function reloadEquipos() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/equipos/", { params: queryParams });
      const payload = res.data;

      const normalized = Array.isArray(payload)
        ? { count: payload.length, next: null, previous: null, results: payload }
        : {
            count: payload.count ?? 0,
            next: payload.next ?? null,
            previous: payload.previous ?? null,
            results: payload.results ?? [],
          };

      // Fallback: si backend no aplica el filtro por sede, lo forzamos en frontend
      if (filters.id_ubicacion) {
        const sedeId = String(filters.id_ubicacion);
        const sameSede = normalized.results.filter((eq) => {
          const eqSedeId = String(
            eq?.id_ubicacion ??
              eq?.id_ubicacion_id ??
              eq?.ubicacion?.id_ubicacion ??
              ""
          );
          return eqSedeId === sedeId;
        });

        const backendFiltradoConsistente =
          normalized.results.length === 0 || sameSede.length === normalized.results.length;

        if (!backendFiltradoConsistente) {
          setData({
            ...normalized,
            count: sameSede.length,
            next: null,
            previous: null,
            results: sameSede,
          });
          return;
        }
      }

      setData(normalized);
    } catch (e) {
      const msg = getApiErrorMessage(e, "Error cargando equipos.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadEquipos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  useEffect(() => {
    const text = search.trim();
    if (text.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/equipos/", {
          params: { search: text, ordering: "-id_equipo", page: 1 },
        });
        const list = res.data?.results ?? res.data ?? [];
        setSearchSuggestions(Array.isArray(list) ? list.slice(0, 8) : []);
      } catch {
        setSearchSuggestions([]);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [search]);

  const equipos = data.results;

  function openDetail(equipo) {
    setSelectedEquipo(equipo);
    setDetailOpen(true);
  }

  function openEditFromRow(equipo) {
    setSelectedEquipo(equipo);
    setEditarOpen(true);
  }

  async function toggleActivoEquipo(equipo) {
    if (!equipo?.id_equipo) return;
    try {
      await api.patch(`/equipos/${equipo.id_equipo}/`, {
        activo: !Boolean(equipo.activo),
      });
      await reloadEquipos();
      if (selectedEquipo?.id_equipo === equipo.id_equipo) {
        setSelectedEquipo((prev) => (prev ? { ...prev, activo: !Boolean(prev.activo) } : prev));
      }
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo ocultar/activar el equipo."));
    }
  }

  async function eliminarEquipo(equipo) {
    if (!equipo?.id_equipo) return;
    const ok = window.confirm(`¿Eliminar equipo ${equipo.numero_inventario || equipo.id_equipo}?`);
    if (!ok) return;
    try {
      await api.delete(`/equipos/${equipo.id_equipo}/`);
      if (selectedEquipo?.id_equipo === equipo.id_equipo) {
        setDetailOpen(false);
        setEditarOpen(false);
        setSelectedEquipo(null);
      }
      await reloadEquipos();
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo eliminar el equipo."));
    }
  }

  async function clearAllInventario() {
    const confirmed = window.confirm(
      "Se eliminarán todos los equipos del inventario junto con sus asignaciones, monitores, mantenimientos e historiales. Esta acción no se puede deshacer. ¿Deseas continuar?"
    );
    if (!confirmed) return;

    setClearingAll(true);
    setError("");
    setBulkActionMsg("");

    try {
      const res = await api.post("/inventario/clear/");
      setDetailOpen(false);
      setEditarOpen(false);
      setSelectedEquipo(null);
      setPage(1);
      await reloadEquipos();
      setBulkActionMsg(
        res.data?.detail ||
        `Inventario vaciado. ${res.data?.equipos_eliminados ?? 0} equipo(s) eliminados.`
      );
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo eliminar el inventario."));
    } finally {
      setClearingAll(false);
    }
  }

  return (
    <div>
      {catalogosError ? <div className="error">{catalogosError}</div> : null}
      {catalogosLoading && catalogos.estados.length === 0 ? (
        <div className="empty">Cargando catálogos…</div>
      ) : null}

      {/* MODAL DETALLE */}
      <EquipoDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        equipo={selectedEquipo}
        onEdit={() => setEditarOpen(true)}
      />

      {/* MODAL EDITAR */}
      <EditarEquipoModal
        open={editarOpen}
        onClose={() => setEditarOpen(false)}
        equipo={selectedEquipo}
        catalogos={catalogos}
        onSaved={async () => {
          await reloadEquipos();
          await reloadSelectedEquipo();
        }}
      />

      {/* MODAL NUEVO */}
      <NuevoEquipoModal
        open={nuevoOpen}
        onClose={() => setNuevoOpen(false)}
        catalogos={catalogos}
        onCreated={async (createdEquipo) => {
          await reloadEquipos();
          if (createdEquipo?.id_equipo) {
            setSelectedEquipo(createdEquipo);
            setDetailOpen(true);
          }
        }}
      />

      <div className="headerRow">
        <div>
          <h1 className="title">Inventario</h1>
          <div className="sub">
            Gestiona equipos, revisa estado y filtra por ubicación, marca, tipo.
          </div>
        </div>

        <div className="headerActions">
          <button className="secondaryBtn" onClick={clearFilters}>
            Limpiar filtros
          </button>
          <button
            className="inventoryDangerBtn"
            onClick={clearAllInventario}
            disabled={clearingAll}
            title="Eliminar todo el inventario"
          >
            {clearingAll ? "Eliminando..." : "Vaciar inventario"}
          </button>
          <button
            className="primaryBtn"
            onClick={() => setNuevoOpen(true)}
            title="Crear nuevo equipo"
          >
            + Nuevo equipo
          </button>
        </div>
      </div>

      <div className="filtersCard">
        <div className="filtersGrid">
          <div className="field">
            <div className="label">Buscar</div>
            <input
              className="input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Inventario, serie o modelo…"
            />
            {searchSuggestions.length > 0 ? (
              <div className="catalogSuggestList">
                {searchSuggestions.map((item) => (
                  <button
                    key={item.id_equipo}
                    type="button"
                    className="catalogSuggestItem"
                    onClick={() => {
                      setSearch(item.numero_inventario || item.numero_serie || "");
                      setSearchSuggestions([]);
                    }}
                  >
                    {(item.numero_inventario || "—") + " · " + (item.numero_serie || "sin serie")}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="field">
            <div className="label">Estado</div>
            <select
              className="select"
              value={filters.codigo_estado}
              onChange={(e) => setFilter("codigo_estado", e.target.value)}
            >
              <option value="">Todos</option>
              {catalogos.estados.map((x) => (
                <option key={x.codigo_estado} value={x.codigo_estado}>
                  {x.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="label">Ubicación</div>
            <select
              className="select"
              value={filters.id_ubicacion}
              onChange={(e) => setFilter("id_ubicacion", e.target.value)}
            >
              <option value="">Todas</option>
              {catalogos.ubicaciones.map((x) => (
                <option key={x.id_ubicacion} value={String(x.id_ubicacion)}>
                  {x.nombre_sede}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="label">Marca</div>
            <select
              className="select"
              value={filters.codigo_marca}
              onChange={(e) => setFilter("codigo_marca", e.target.value)}
            >
              <option value="">Todas</option>
              {catalogos.marcas.map((x) => (
                <option key={x.codigo_marca} value={x.codigo_marca}>
                  {x.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="label">Tipo</div>
            <select
              className="select"
              value={filters.codigo_tipo}
              onChange={(e) => setFilter("codigo_tipo", e.target.value)}
            >
              <option value="">Todos</option>
              {catalogos.tipos.map((x) => (
                <option key={x.codigo_tipo} value={x.codigo_tipo}>
                  {x.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="label">Activo</div>
            <select
              className="select"
              value={filters.activo}
              onChange={(e) => setFilter("activo", e.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="field">
            <div className="label">Orden</div>
            <select
              className="select"
              value={ordering}
              onChange={(e) => {
                setPage(1);
                setOrdering(e.target.value);
              }}
            >
              <option value="-id_equipo">Más nuevos</option>
              <option value="id_equipo">Más antiguos</option>
              <option value="numero_inventario">Inventario A→Z</option>
              <option value="-numero_inventario">Inventario Z→A</option>
              <option value="fecha_compra">Compra (antiguos)</option>
              <option value="-fecha_compra">Compra (recientes)</option>
            </select>
          </div>
        </div>

        <div className="statusRow">
          <div className="statusLeft">
            {loading ? (
              <span className="badgeInfo">Cargando…</span>
            ) : error ? (
              <span className="badgeError">{error}</span>
            ) : bulkActionMsg ? (
              <span className="badgeOk">{bulkActionMsg}</span>
            ) : (
              <span className="badgeOk">{data.count} resultado(s)</span>
            )}
          </div>

          <div className="statusRight">
            <button
              className="pagerBtn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!data.previous || loading}
            >
              ← Anterior
            </button>
            <span className="pageChip">Página {page}</span>
            <button
              className="pagerBtn"
              onClick={() => setPage((p) => p + 1)}
              disabled={!data.next || loading}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      <div className="tableCard">
        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Inventario</th>
                <th className="th">Serie</th>
                <th className="th">Equipo</th>
                <th className="th">Tipo</th>
                <th className="th">Marca</th>
                <th className="th">Estado</th>
                <th className="th">Ubicación</th>
                <th className="th inv-th-right">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {!loading && equipos.length === 0 ? (
                <tr>
                  <td className="td" colSpan={8}>
                    No hay equipos con estos filtros.
                  </td>
                </tr>
              ) : (
                equipos.map((e) => (
                  <tr key={e.id_equipo} className="tr">
                    <td className="td">
                      <div className="u-fw-700 u-text-strong">
                        {e.numero_inventario}
                      </div>
                      <div className="mini">
                        {e.activo ? "Activo" : "Inactivo"}
                      </div>
                    </td>

                    <td className="td">
                      <div className="mono-text">
                        {e.numero_serie}
                      </div>
                    </td>

                    <td className="td">
                      <div className="u-fw-700 u-text-strong">
                        {firstPresent(
                          e.nombre_equipo,
                          readExcelField(e, "NOMBRE DE EQUIPO"),
                          e.modelo,
                          "-"
                        )}
                      </div>
                      <div className="mini">
                        {firstPresent(
                          e.ip_maquina,
                          readExcelField(e, "IP DE MAQUINA"),
                          "Sin IP"
                        )}
                      </div>
                    </td>
                    <td className="td">
                      {firstPresent(
                        e.tipo_equipo?.descripcion,
                        readExcelField(e, "TIPO EQUIPO  1/2/OTRO"),
                        "-"
                      )}
                    </td>
                    <td className="td">
                      {firstPresent(
                        e.marca?.descripcion,
                        readExcelField(e, "MARCA"),
                        "-"
                      )}
                    </td>

                    <td className="td">
                      <span className={estadoPillClass(firstPresent(e.estado?.descripcion, readExcelField(e, "Estado Actual   ASIGNADO/ BODEGA /EXTRAVIADO/ROBO")))}>
                        {firstPresent(
                          e.estado?.descripcion,
                          readExcelField(e, "Estado Actual   ASIGNADO/ BODEGA /EXTRAVIADO/ROBO"),
                          "-"
                        )}
                      </span>
                    </td>

                    <td className="td">
                      {firstPresent(
                        e.ubicacion?.nombre_sede,
                        inferSedeFromText(firstPresent(e.direccion_oficina_piso, readExcelField(e, "DIRECCIÓN OFICINA / PISO"))),
                        "-"
                      )}
                      <div className="mini">
                        {firstPresent(
                          e.ubicacion?.region?.nombre ? `Región: ${e.ubicacion.region.nombre}` : "",
                          readExcelField(e, "REGIÓN")
                        )}
                      </div>
                    </td>

                    <td className="td inv-td-right">
                      <button className="rowBtn" onClick={() => openDetail(e)}>
                        Ver
                      </button>
                      <button className="rowBtn" onClick={() => openEditFromRow(e)}>
                        Editar
                      </button>
                      <button className="rowBtn" onClick={() => toggleActivoEquipo(e)}>
                        {e.activo ? "Ocultar" : "Mostrar"}
                      </button>
                      <button className="rowBtn danger" onClick={() => eliminarEquipo(e)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function estadoPillClass(label) {
  const base = "estado-pill";
  const l = (label || "").toLowerCase();
  if (l.includes("ocup")) return `${base} is-ocupado`;
  if (l.includes("libre") || l.includes("dispon")) return `${base} is-libre`;
  if (l.includes("baja")) return `${base} is-baja`;
  return base;
}

function firstPresent(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return "";
}

function readExcelField(equipo, key) {
  const value = equipo?.raw_excel_data?.[key];
  if (value === null || value === undefined) return "";
  if (typeof value === "string" && value.trim() === "") return "";
  return String(value);
}

function inferSedeFromText(value) {
  const text = String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

  if (!text) return "";
  if (text.includes("ANIMAS")) return "Ánimas";
  if (text.includes("YUNGAY")) return "Yungay";
  if (text.includes("LA UNION")) return "La Unión";
  if (text.includes("BOUCHEFF") || text.includes("BOUCHEF")) return "Bouchéff";
  return "";
}
