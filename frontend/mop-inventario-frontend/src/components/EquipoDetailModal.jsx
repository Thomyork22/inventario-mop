import { useEffect } from "react";

export default function EquipoDetailModal({
  open,
  onClose,
  equipo,
  onAssign,
  onEdit,
}) {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="header">
          <div>
            <div className="title">Detalle de equipo</div>
            <div className="sub">
              {equipo?.numero_inventario || "—"} · {equipo?.modelo || "—"}
            </div>
          </div>

          <button className="closeBtn" onClick={onClose} title="Cerrar">
            ✕
          </button>
        </div>

        <div className="body">
          {/* Columna 1 */}
          <div className="col">
            <Field label="ID" value={equipo?.id_equipo} />
            <Field label="Inventario" value={equipo?.numero_inventario} />
            <Field label="Serie" value={equipo?.numero_serie} mono />
            <Field label="Modelo" value={equipo?.modelo} />
            <Field label="Activo" value={equipo?.activo ? "Sí" : "No"} />
          </div>

          {/* Columna 2 */}
          <div className="col">
            <Field label="Tipo" value={equipo?.tipo_equipo?.descripcion} />
            <Field label="Marca" value={equipo?.marca?.descripcion} />
            <Field label="Estado" value={equipo?.estado?.descripcion} pill />
            <Field label="Ubicación" value={equipo?.ubicacion?.nombre_sede} />
            <Field label="Región" value={equipo?.ubicacion?.region?.nombre || "—"} />
          </div>

          {/* Columna 3 */}
          <div className="col">
            <Field label="Proveedor" value={equipo?.proveedor || "—"} />
            <Field label="Factura" value={equipo?.numero_factura || "—"} />
            <Field label="Garantía (meses)" value={equipo?.garantia_meses ?? "—"} />
            <Field label="Fecha compra" value={equipo?.fecha_compra || "—"} />
            <Field label="Obs." value={equipo?.observaciones || "—"} multiline />
          </div>
        </div>

        <div className="footer">
          <button className="secondaryBtn" onClick={onClose}>
            Cerrar
          </button>

          <div className="u-flex-gap-10">
            <button
              className="secondaryBtn"
              onClick={() => onEdit?.(equipo)}
              title="Editar datos del equipo"
            >
              Editar
            </button>

            <button
              className="primaryBtn"
              onClick={() => onAssign?.(equipo)}
              title="Asignar equipo a funcionario"
            >
              Asignar / Devolver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono, multiline, pill }) {
  return (
    <div className="field">
      <div className="label">{label}</div>
      <div className={`value eq-detail-value${mono ? " is-mono" : ""}${multiline ? " is-multiline" : ""}`}>
        {pill ? <span className={detailPillClass(value)}>{value || "—"}</span> : value || "—"}
      </div>
    </div>
  );
}

function detailPillClass(label) {
  const base = "estado-pill";
  const l = (label || "").toLowerCase();
  if (l.includes("ocup")) return `${base} is-ocupado`;
  if (l.includes("libre") || l.includes("dispon")) return `${base} is-libre`;
  if (l.includes("baja")) return `${base} is-baja`;
  return base;
}
