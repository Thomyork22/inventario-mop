import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import EquipoDetailModal from "../components/EquipoDetailModal.jsx";
import AsignarDevolverModal from "../components/AsignarDevolverModal.jsx";
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

  const [catalogos, setCatalogos] = useState({
    estados: [],
    ubicaciones: [],
    marcas: [],
    tipos: [],
  });

  const [search, setSearch] = useState("");
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

  // Modal detalle
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedEquipo, setSelectedEquipo] = useState(null);

  // Modal asignar/devolver
  const [asignarOpen, setAsignarOpen] = useState(false);

  // Modal editar
  const [editarOpen, setEditarOpen] = useState(false);

  // Modal nuevo
  const [nuevoOpen, setNuevoOpen] = useState(false);

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
      const msg = e?.response?.data?.detail || e?.message || "Error cargando equipos";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function reloadSelectedEquipo() {
    if (!selectedEquipo?.id_equipo) return;
    try {
      const res = await api.get(`/equipos/${selectedEquipo.id_equipo}/`);
      setSelectedEquipo(res.data);
    } catch {}
  }

  useEffect(() => {
    let mounted = true;

    async function loadCatalogos() {
      try {
        const [estadosRes, ubicRes, marcasRes, tiposRes] = await Promise.all([
          api.get("/catalogos/estados-equipo/"),
          api.get("/catalogos/ubicaciones/"),
          api.get("/catalogos/marcas/"),
          api.get("/catalogos/tipos-equipo/"),
        ]);

        const pick = (res) => res.data?.results ?? res.data ?? [];

        if (!mounted) return;
        setCatalogos({
          estados: pick(estadosRes),
          ubicaciones: pick(ubicRes),
          marcas: pick(marcasRes),
          tipos: pick(tiposRes),
        });
      } catch (e) {
        console.error("Error cargando catálogos", e);
      }
    }

    loadCatalogos();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    reloadEquipos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const equipos = data.results;

  function openDetail(equipo) {
    setSelectedEquipo(equipo);
    setDetailOpen(true);
  }

  return (
    <div>
      {/* MODAL DETALLE */}
      <EquipoDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        equipo={selectedEquipo}
        onAssign={() => setAsignarOpen(true)}
        onEdit={() => setEditarOpen(true)}
      />

      {/* MODAL ASIGNAR/DEVOLVER */}
      <AsignarDevolverModal
        open={asignarOpen}
        onClose={() => setAsignarOpen(false)}
        equipo={selectedEquipo}
        estadosCatalogo={catalogos.estados}
        onDone={async () => {
          await reloadEquipos();
          await reloadSelectedEquipo();
        }}
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
                <th className="th">Modelo</th>
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

                    <td className="td">{e.modelo || "-"}</td>
                    <td className="td">{e.tipo_equipo?.descripcion || "-"}</td>
                    <td className="td">{e.marca?.descripcion || "-"}</td>

                    <td className="td">
                      <span className={estadoPillClass(e.estado?.descripcion)}>
                        {e.estado?.descripcion || "-"}
                      </span>
                    </td>

                    <td className="td">
                      {e.ubicacion?.nombre_sede || "-"}
                      <div className="mini">
                        {e.ubicacion?.region?.nombre ? `Región: ${e.ubicacion.region.nombre}` : ""}
                      </div>
                    </td>

                    <td className="td inv-td-right">
                      <button className="rowBtn" onClick={() => openDetail(e)}>
                        Ver
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
