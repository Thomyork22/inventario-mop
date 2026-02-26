import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NuevoEquipoModal({ open, onClose, catalogos, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const tipos = catalogos?.tipos ?? [];
  const marcas = catalogos?.marcas ?? [];
  const estados = catalogos?.estados ?? [];
  const ubicaciones = catalogos?.ubicaciones ?? [];

  const estadoLibreDefault = useMemo(() => {
    const x = estados.find((e) => (e.descripcion || "").toLowerCase().includes("libre"));
    return x?.codigo_estado || "";
  }, [estados]);

  const [form, setForm] = useState({
    numero_inventario: "",
    numero_serie: "",
    modelo: "",
    activo: true,

    codigo_tipo_id: "",
    codigo_marca_id: "",
    codigo_estado_id: "",
    id_ubicacion_id: "",

    fecha_compra: "",
    fecha_ingreso_inventario: todayISO(),
    valor_compra: "",
    proveedor: "",
    numero_factura: "",
    garantia_meses: "",
    observaciones: "",
  });

  // ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // reset al abrir
  useEffect(() => {
    if (!open) return;
    setErr("");
    setLoading(false);
    setForm((prev) => ({
      ...prev,
      numero_inventario: "",
      numero_serie: "",
      modelo: "",
      activo: true,
      codigo_tipo_id: "",
      codigo_marca_id: "",
      codigo_estado_id: estadoLibreDefault || "",
      id_ubicacion_id: "",
      fecha_compra: "",
      fecha_ingreso_inventario: todayISO(),
      valor_compra: "",
      proveedor: "",
      numero_factura: "",
      garantia_meses: "",
      observaciones: "",
    }));
  }, [open, estadoLibreDefault]);

  if (!open) return null;

  function setField(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function normEmptyToNull(v) {
    return v === "" ? null : v;
  }

  async function handleCreate() {
    setLoading(true);
    setErr("");
    try {
      if (!form.numero_inventario.trim()) throw new Error("El número de inventario es obligatorio.");
      if (!form.numero_serie.trim()) throw new Error("El número de serie es obligatorio.");

      const payload = {
        numero_inventario: form.numero_inventario.trim(),
        numero_serie: form.numero_serie.trim(),
        modelo: normEmptyToNull(form.modelo.trim()),
        activo: form.activo,

        // IDs (serializer espera estos nombres)
        codigo_tipo_id: form.codigo_tipo_id === "" ? null : Number(form.codigo_tipo_id),
        codigo_marca_id: form.codigo_marca_id === "" ? null : Number(form.codigo_marca_id),
        codigo_estado_id: form.codigo_estado_id === "" ? null : Number(form.codigo_estado_id),
        id_ubicacion_id: form.id_ubicacion_id === "" ? null : Number(form.id_ubicacion_id),

        // opcionales
        fecha_compra: normEmptyToNull(form.fecha_compra),
        fecha_ingreso_inventario: normEmptyToNull(form.fecha_ingreso_inventario),
        valor_compra: form.valor_compra === "" ? null : Number(form.valor_compra),
        proveedor: normEmptyToNull(form.proveedor.trim()),
        numero_factura: normEmptyToNull(form.numero_factura.trim()),
        garantia_meses: form.garantia_meses === "" ? null : Number(form.garantia_meses),
        observaciones: normEmptyToNull(form.observaciones),
      };

      const res = await api.post("/equipos/", payload);

      // backend normalmente devuelve el objeto creado (con id)
      const created = res.data;

      onCreated?.(created);
      onClose?.();
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "object" ? JSON.stringify(e.response.data) : null) ||
        e?.message ||
        "No se pudo crear.";
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
            <div className="title">Nuevo equipo</div>
            <div className="sub">Crea un equipo en inventario</div>
          </div>
          <button className="closeBtn" onClick={onClose} title="Cerrar">✕</button>
        </div>

        <div className="body">
          {err ? <div className="error">{err}</div> : null}

          <div className="grid2">
            <Field label="Inventario *">
              <input
                className="input"
                value={form.numero_inventario}
                onChange={(e) => setField("numero_inventario", e.target.value)}
                placeholder="Ej: MOP-2026-0001"
              />
            </Field>

            <Field label="Serie *">
              <input
                className="input"
                value={form.numero_serie}
                onChange={(e) => setField("numero_serie", e.target.value)}
                placeholder="Ej: SN123456"
              />
            </Field>

            <Field label="Modelo">
              <input
                className="input"
                value={form.modelo}
                onChange={(e) => setField("modelo", e.target.value)}
              />
            </Field>

            <Field label="Activo">
              <select
                className="select"
                value={form.activo ? "true" : "false"}
                onChange={(e) => setField("activo", e.target.value === "true")}
              >
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </Field>

            <Field label="Tipo">
              <select
                className="select"
                value={form.codigo_tipo_id}
                onChange={(e) => setField("codigo_tipo_id", e.target.value)}
              >
                <option value="">—</option>
                {tipos.map((t) => (
                  <option key={t.codigo_tipo} value={t.codigo_tipo}>
                    {t.descripcion}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Marca">
              <select
                className="select"
                value={form.codigo_marca_id}
                onChange={(e) => setField("codigo_marca_id", e.target.value)}
              >
                <option value="">—</option>
                {marcas.map((m) => (
                  <option key={m.codigo_marca} value={m.codigo_marca}>
                    {m.descripcion}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Estado">
              <select
                className="select"
                value={form.codigo_estado_id}
                onChange={(e) => setField("codigo_estado_id", e.target.value)}
              >
                <option value="">—</option>
                {estados.map((s) => (
                  <option key={s.codigo_estado} value={s.codigo_estado}>
                    {s.descripcion}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Ubicación">
              <select
                className="select"
                value={form.id_ubicacion_id}
                onChange={(e) => setField("id_ubicacion_id", e.target.value)}
              >
                <option value="">—</option>
                {ubicaciones.map((u) => (
                  <option key={u.id_ubicacion} value={u.id_ubicacion}>
                    {u.nombre_sede}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Fecha compra">
              <input
                className="input"
                type="date"
                value={form.fecha_compra}
                onChange={(e) => setField("fecha_compra", e.target.value)}
              />
            </Field>

            <Field label="Ingreso inventario">
              <input
                className="input"
                type="date"
                value={form.fecha_ingreso_inventario}
                onChange={(e) => setField("fecha_ingreso_inventario", e.target.value)}
              />
            </Field>

            <Field label="Valor compra">
              <input
                className="input"
                type="number"
                value={form.valor_compra}
                onChange={(e) => setField("valor_compra", e.target.value)}
                placeholder="Ej: 450000"
              />
            </Field>

            <Field label="Garantía (meses)">
              <input
                className="input"
                type="number"
                value={form.garantia_meses}
                onChange={(e) => setField("garantia_meses", e.target.value)}
              />
            </Field>

            <Field label="Proveedor">
              <input
                className="input"
                value={form.proveedor}
                onChange={(e) => setField("proveedor", e.target.value)}
              />
            </Field>

            <Field label="Factura">
              <input
                className="input"
                value={form.numero_factura}
                onChange={(e) => setField("numero_factura", e.target.value)}
              />
            </Field>

            <Field label="Observaciones">
              <textarea
                className="modal-textarea"
                className="input"
                value={form.observaciones}
                onChange={(e) => setField("observaciones", e.target.value)}
              />
            </Field>
            <div />
          </div>
        </div>

        <div className="footer">
          <button className="secondaryBtn" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="primaryBtn" onClick={handleCreate} disabled={loading}>
            {loading ? "Creando…" : "Crear equipo"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="field">
      <div className="label">{label}</div>
      {children}
    </div>
  );
}
