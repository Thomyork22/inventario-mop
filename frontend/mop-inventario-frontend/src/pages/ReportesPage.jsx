import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

export default function ReportesPage() {
  // --- catálogos para filtros ---
  const [ubicaciones, setUbicaciones] = useState([]);
  const [estadosEquipo, setEstadosEquipo] = useState([]);

  // --- filtros inventario ---
  const [invActivo, setInvActivo] = useState(""); // "" | "true" | "false"
  const [invUbicacion, setInvUbicacion] = useState(""); // id_ubicacion
  const [invEstado, setInvEstado] = useState(""); // codigo_estado

  // --- filtros asignaciones ---
  const [asigSoloActivas, setAsigSoloActivas] = useState(true);

  // --- filtros garantías ---
  const [garTipo, setGarTipo] = useState("pv"); // pv | vencidas
  const [garDias, setGarDias] = useState(30);

  // --- ui ---
  const [loadingCats, setLoadingCats] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState("");

  const invParams = useMemo(() => {
    const p = {};
    if (invActivo !== "") p.activo = invActivo;
    if (invUbicacion) p.id_ubicacion = invUbicacion;
    if (invEstado) p.codigo_estado = invEstado;
    return p;
  }, [invActivo, invUbicacion, invEstado]);

  const asigParams = useMemo(() => {
    const p = {};
    if (asigSoloActivas) p.solo_activas = "true";
    return p;
  }, [asigSoloActivas]);

  const garParams = useMemo(() => {
    const p = { tipo: garTipo, dias: String(garDias || 30) };
    return p;
  }, [garTipo, garDias]);

  async function loadCatalogos() {
    setLoadingCats(true);
    setErr("");
    try {
      const [u, e] = await Promise.all([
        api.get("/catalogos/ubicaciones/", { params: { page_size: 9999 } }),
        api.get("/catalogos/estados-equipo/", { params: { page_size: 9999 } }),
      ]);

      const uList = u.data?.results ?? u.data ?? [];
      const eList = e.data?.results ?? e.data ?? [];

      setUbicaciones(Array.isArray(uList) ? uList : []);
      setEstadosEquipo(Array.isArray(eList) ? eList : []);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "No se pudieron cargar los catálogos.");
    } finally {
      setLoadingCats(false);
    }
  }

  useEffect(() => {
    loadCatalogos();
  }, []);

  async function downloadFile({ url, filename, params }) {
    setDownloading(true);
    setErr("");
    try {
      const res = await api.get(url, {
        params,
        responseType: "blob",
      });

      const blob = new Blob([res.data]);
      const href = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(href);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "No se pudo descargar el reporte.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="headerRow">
        <div>
          <h1 className="title">Reportes</h1>
          <div className="sub">
            Descarga reportes en CSV o Excel (XLSX) con filtros básicos.
          </div>
        </div>

        <div className="headerActions">
          <button className="secondaryBtn" onClick={loadCatalogos} disabled={loadingCats || downloading}>
            {loadingCats ? "Cargando…" : "Recargar catálogos"}
          </button>
        </div>
      </div>

      {err ? <div className="error">{err}</div> : null}

      {/* Cards */}
      <div className="grid">
        {/* Inventario */}
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Inventario</div>
              <div className="cardSub">Equipos con filtros por estado/sede/activo.</div>
            </div>
          </div>

          <div className="body">
            <div className="formGrid">
              <div>
                <div className="label">Activo</div>
                <select
                  value={invActivo}
                  onChange={(e) => setInvActivo(e.target.value)}
                  className="input"
                >
                  <option value="">(Todos)</option>
                  <option value="true">Solo activos</option>
                  <option value="false">Solo inactivos</option>
                </select>
              </div>

              <div>
                <div className="label">Sede (Ubicación)</div>
                <select
                  value={invUbicacion}
                  onChange={(e) => setInvUbicacion(e.target.value)}
                  className="input"
                  disabled={loadingCats}
                >
                  <option value="">(Todas)</option>
                  {ubicaciones.map((u) => (
                    <option key={u.id_ubicacion} value={u.id_ubicacion}>
                      {u.nombre_sede}
                    </option>
                  ))}
                </select>
              </div>

              <div className="u-col-span-all">
                <div className="label">Estado equipo</div>
                <select
                  value={invEstado}
                  onChange={(e) => setInvEstado(e.target.value)}
                  className="input"
                  disabled={loadingCats}
                >
                  <option value="">(Todos)</option>
                  {estadosEquipo.map((es) => (
                    <option key={es.codigo_estado} value={es.codigo_estado}>
                      {es.descripcion}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="actionsRow">
              <button
                className="smallBtn"
                onClick={() =>
                  downloadFile({
                    url: "/reportes/inventario.csv",
                    filename: "reporte_inventario.csv",
                    params: invParams,
                  })
                }
                disabled={downloading}
              >
                Descargar CSV
              </button>

              <button
                className="primaryBtn"
                onClick={() =>
                  downloadFile({
                    url: "/reportes/inventario.xlsx",
                    filename: "reporte_inventario.xlsx",
                    params: invParams,
                  })
                }
                disabled={downloading}
              >
                Descargar Excel
              </button>
            </div>
          </div>
        </div>

        {/* Asignaciones */}
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Asignaciones</div>
              <div className="cardSub">Historial de asignaciones por funcionario/equipo.</div>
            </div>
          </div>

          <div className="body">
            <label className="checkRow">
              <input
                type="checkbox"
                checked={asigSoloActivas}
                onChange={(e) => setAsigSoloActivas(e.target.checked)}
              />
              <span className="u-fw-900">Solo activas (sin devolución)</span>
            </label>

            <div className="actionsRow">
              <button
                className="smallBtn"
                onClick={() =>
                  downloadFile({
                    url: "/reportes/asignaciones.csv",
                    filename: "reporte_asignaciones.csv",
                    params: asigParams,
                  })
                }
                disabled={downloading}
              >
                Descargar CSV
              </button>

              <button
                className="primaryBtn"
                onClick={() =>
                  downloadFile({
                    url: "/reportes/asignaciones.xlsx",
                    filename: "reporte_asignaciones.xlsx",
                    params: asigParams,
                  })
                }
                disabled={downloading}
              >
                Descargar Excel
              </button>
            </div>
          </div>
        </div>

        {/* Mantenimientos */}
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Mantenimientos</div>
              <div className="cardSub">Listado de mantenciones con estado y fechas.</div>
            </div>
          </div>

          <div className="body">
            <div className="actionsRow">
              <button
                className="smallBtn"
                onClick={() =>
                  downloadFile({
                    url: "/reportes/mantenimientos.csv",
                    filename: "reporte_mantenimientos.csv",
                    params: {},
                  })
                }
                disabled={downloading}
              >
                Descargar CSV
              </button>

              <button
                className="primaryBtn"
                onClick={() =>
                  downloadFile({
                    url: "/reportes/mantenimientos.xlsx",
                    filename: "reporte_mantenimientos.xlsx",
                    params: {},
                  })
                }
                disabled={downloading}
              >
                Descargar Excel
              </button>
            </div>
          </div>
        </div>

        {/* Garantías */}
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Garantías</div>
              <div className="cardSub">Por vencer (próximos X días) o vencidas.</div>
            </div>
          </div>

          <div className="body">
            <div className="formGrid">
              <div>
                <div className="label">Tipo</div>
                <select value={garTipo} onChange={(e) => setGarTipo(e.target.value)} className="input">
                  <option value="pv">Por vencer</option>
                  <option value="vencidas">Vencidas</option>
                </select>
              </div>

              <div>
                <div className="label">Días</div>
                <input
                  type="number"
                  min={1}
                  value={garDias}
                  onChange={(e) => setGarDias(Number(e.target.value || 30))}
                  className="input"
                />
              </div>
            </div>

            <div className="actionsRow">
              <button
                className="smallBtn"
                onClick={() =>
                  downloadFile({
                    url: "/reportes/garantias.csv",
                    filename: "reporte_garantias.csv",
                    params: garParams,
                  })
                }
                disabled={downloading}
              >
                Descargar CSV
              </button>

              <button
                className="primaryBtn"
                onClick={() =>
                  downloadFile({
                    url: "/reportes/garantias.xlsx",
                    filename: "reporte_garantias.xlsx",
                    params: garParams,
                  })
                }
                disabled={downloading}
              >
                Descargar Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {downloading ? <div className="toast">Descargando…</div> : null}
    </div>
  );
}
