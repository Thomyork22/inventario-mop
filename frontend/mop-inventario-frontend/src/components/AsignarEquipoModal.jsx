import { useEffect, useMemo, useState } from "react";
import { api, getApiErrorMessage } from "../api/api";

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function AsignarEquipoModal({ open, onClose, equipo, onAssigned }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q, 300);

  const [funcionarios, setFuncionarios] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [motivo, setMotivo] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const canSave = Boolean(selectedId) && !saving;

  useEffect(() => {
    if (!open) return;
    setErr("");
    setSelectedId("");
    setMotivo("");
    setQ("");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await api.get("/funcionarios/", {
          params: dq.trim() ? { search: dq.trim() } : {},
        });
        const list = res.data?.results ?? res.data ?? [];
        if (mounted) setFuncionarios(list);
      } catch (e) {
        if (mounted) setErr(getApiErrorMessage(e, "Error cargando funcionarios."));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [open, dq]);

  async function handleAsignar() {
    if (!equipo?.id_equipo) return;

    setSaving(true);
    setErr("");
    try {
      const payload = {
        id_equipo_id: equipo.id_equipo,
        id_funcionario_id: Number(selectedId),
        fecha_asignacion: new Date().toISOString().slice(0, 10),
        motivo_asignacion: motivo || null,
        estado_asignacion: "ACTIVA",
        activo: true,
      };

      await api.post("/asignaciones/", payload);

      onAssigned?.();
      onClose?.();
    } catch (e) {
      setErr(getApiErrorMessage(e, "No se pudo asignar."));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="header">
          <div>
            <div className="title">Asignar equipo</div>
            <div className="sub">
              {equipo?.numero_inventario || "—"} · {equipo?.modelo || "—"}
            </div>
          </div>

          <button className="closeBtn" onClick={onClose} title="Cerrar">
            ✕
          </button>
        </div>

        <div className="body">
          <div className="field">
            <div className="label">Buscar funcionario</div>
            <input
              className="input"
              placeholder="Nombre, RUT o correo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="label">Seleccionar funcionario</div>
            <select
              className="select"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loading}
            >
              <option value="">{loading ? "Cargando..." : "Selecciona..."}</option>
              {funcionarios.map((f) => (
                <option key={f.id_funcionario} value={f.id_funcionario}>
                  {f.nombre_completo} · {f.rut}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="label">Motivo (opcional)</div>
            <textarea
              className="textarea"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Asignación por renovación de equipo..."
            />
          </div>

          {err ? <div className="error">{err}</div> : null}
        </div>

        <div className="footer">
          <button className="secondaryBtn" onClick={onClose}>
            Cancelar
          </button>

          <button className="primaryBtn" disabled={!canSave} onClick={handleAsignar}>
            {saving ? "Asignando..." : "Asignar"}
          </button>
        </div>
      </div>
    </div>
  );
}
