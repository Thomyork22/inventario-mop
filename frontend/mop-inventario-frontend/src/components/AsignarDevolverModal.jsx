import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AsignarDevolverModal({
  open,
  onClose,
  equipo,
  estadosCatalogo = [],
  onDone, // callback para recargar
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // funcionarios
  const [q, setQ] = useState("");
  const [funcionarios, setFuncionarios] = useState([]);
  const [selectedFuncionarioId, setSelectedFuncionarioId] = useState("");

  // asignación activa (si existe)
  const [activeAsignacion, setActiveAsignacion] = useState(null);

  // form
  const [motivo, setMotivo] = useState("");
  const [fechaAsignacion, setFechaAsignacion] = useState(todayISO());
  const [fechaDevolucion, setFechaDevolucion] = useState(todayISO());

  const isOcupado = useMemo(() => {
    const txt = (equipo?.estado?.descripcion || "").toLowerCase();
    return txt.includes("ocup");
  }, [equipo]);

  const estadoLibreId = useMemo(() => {
    const x = estadosCatalogo.find((e) => (e.descripcion || "").toLowerCase().includes("libre"));
    return x?.codigo_estado || null;
  }, [estadosCatalogo]);

  const estadoOcupadoId = useMemo(() => {
    const x = estadosCatalogo.find((e) => (e.descripcion || "").toLowerCase().includes("ocup"));
    return x?.codigo_estado || null;
  }, [estadosCatalogo]);

  // ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // al abrir: cargar asignación activa y funcionarios iniciales
  useEffect(() => {
    if (!open || !equipo?.id_equipo) return;

    setErr("");
    setQ("");
    setFuncionarios([]);
    setSelectedFuncionarioId("");
    setMotivo("");
    setFechaAsignacion(todayISO());
    setFechaDevolucion(todayISO());

    (async () => {
      try {
        // 1) buscar asignaciones del equipo y quedarnos con la activa (si existe)
        const asigRes = await api.get("/asignaciones/", {
          params: { id_equipo: equipo.id_equipo, ordering: "-id_asignacion" },
        });
        const list = asigRes.data?.results ?? asigRes.data ?? [];
        const activa = list.find((a) => a?.activo === true && !a?.fecha_devolucion) || null;
        setActiveAsignacion(activa);

        // 2) traer algunos funcionarios (o vacio)
        const fRes = await api.get("/funcionarios/", { params: { search: "" } });
        setFuncionarios(fRes.data?.results ?? fRes.data ?? []);
      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.detail || "Error cargando datos para asignación.");
      }
    })();
  }, [open, equipo]);

  // buscar funcionarios con debounce simple
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const res = await api.get("/funcionarios/", { params: { search: q } });
        setFuncionarios(res.data?.results ?? res.data ?? []);
      } catch {
        // silencioso
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, open]);

  if (!open) return null;

  async function patchEquipoEstado(codigo_estado_id) {
    if (!codigo_estado_id) return; // si no existe en catálogo, no rompemos
    await api.patch(`/equipos/${equipo.id_equipo}/`, { codigo_estado_id });
  }

  async function handleAsignar() {
    setLoading(true);
    setErr("");
    try {
      if (!selectedFuncionarioId) {
        throw new Error("Selecciona un funcionario.");
      }

      // 1) crear asignación
      await api.post("/asignaciones/", {
        id_equipo_id: equipo.id_equipo,
        id_funcionario_id: Number(selectedFuncionarioId),
        fecha_asignacion: fechaAsignacion,
        motivo_asignacion: motivo || null,
        estado_asignacion: "Activa",
        activo: true,
      });



      onDone?.();
      onClose?.();
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "object" ? JSON.stringify(e.response.data) : null) ||
        e?.message ||
        "No se pudo asignar.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDevolver() {
    setLoading(true);
    setErr("");
    try {
      if (!activeAsignacion?.id_asignacion) {
        throw new Error("No se encontró una asignación activa para devolver.");
      }

      // 1) cerrar asignación (devolución)
      await api.patch(`/asignaciones/${activeAsignacion.id_asignacion}/`, {
        fecha_devolucion: fechaDevolucion,
        estado_asignacion: "Cerrada",
        activo: false,
      });



      onDone?.();
      onClose?.();
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "object" ? JSON.stringify(e.response.data) : null) ||
        e?.message ||
        "No se pudo devolver.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="header">
          <div>
            <div className="title">Asignar / Devolver</div>
            <div className="sub">
              {equipo?.numero_inventario || "—"} · {equipo?.modelo || "—"}
            </div>
          </div>
          <button className="closeBtn" onClick={onClose} title="Cerrar">
            ✕
          </button>
        </div>

        <div className="body">
          {err ? <div className="error">{err}</div> : null}

          {!isOcupado ? (
            <>
              <div className="blockTitle">Asignar a funcionario</div>

              <div className="grid2">
                <div className="field">
                  <div className="label">Buscar funcionario</div>
                  <input
                    className="input"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Nombre, RUT o correo…"
                  />
                </div>

                <div className="field">
                  <div className="label">Funcionario</div>
                  <select
                    className="select"
                    value={selectedFuncionarioId}
                    onChange={(e) => setSelectedFuncionarioId(e.target.value)}
                  >
                    <option value="">Selecciona…</option>
                    {funcionarios.map((f) => (
                      <option key={f.id_funcionario} value={f.id_funcionario}>
                        {f.nombre_completo} ({f.rut})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <div className="label">Fecha asignación</div>
                  <input
                    className="input"
                    type="date"
                    value={fechaAsignacion}
                    onChange={(e) => setFechaAsignacion(e.target.value)}
                  />
                </div>

                <div className="field">
                  <div className="label">Motivo</div>
                  <input
                    className="input"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Entrega por reemplazo, nuevo funcionario…"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="blockTitle">Devolver equipo</div>

              <div className="infoCard">
                <div className="u-fw-900 u-text-strong">
                  Asignación activa
                </div>
                <div className="u-mt-6 u-fs-13 u-text-soft">
                  {activeAsignacion?.funcionario
                    ? `${activeAsignacion.funcionario.nombre_completo} (${activeAsignacion.funcionario.rut})`
                    : "No se pudo cargar el funcionario."}
                </div>
              </div>

              <div className="grid2">
                <div className="field">
                  <div className="label">Fecha devolución</div>
                  <input
                    className="input"
                    type="date"
                    value={fechaDevolucion}
                    onChange={(e) => setFechaDevolucion(e.target.value)}
                  />
                </div>
                <div />
              </div>
            </>
          )}
        </div>

        <div className="footer">
          <button className="secondaryBtn" onClick={onClose} disabled={loading}>
            Cancelar
          </button>

          {!isOcupado ? (
            <button className="primaryBtn" onClick={handleAsignar} disabled={loading}>
              {loading ? "Asignando…" : "Asignar"}
            </button>
          ) : (
            <button className="primaryBtn" onClick={handleDevolver} disabled={loading}>
              {loading ? "Devolviendo…" : "Devolver"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
