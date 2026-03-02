import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

export default function EditarEquipoModal({
  open,
  onClose,
  equipo,
  catalogos,
  onSaved, // callback para refrescar (tabla + detalle)
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    modelo: "",
    proveedor: "",
    numero_factura: "",
    garantia_meses: "",
    observaciones: "",
    activo: true,

    // selects (IDs)
    codigo_tipo_id: "",
    codigo_marca_id: "",
    codigo_estado_id: "",
    codigo_condicion_id: "",
    codigo_ram_id: "",
    codigo_procesador_id: "",
    codigo_so_id: "",
    codigo_disco_id: "",
    tamano_disco_id: "",
    id_ubicacion_id: "",
  });

  // ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // cargar datos del equipo al abrir
  useEffect(() => {
    if (!open || !equipo?.id_equipo) return;
    setErr("");

    setForm({
      modelo: equipo?.modelo ?? "",
      proveedor: equipo?.proveedor ?? "",
      numero_factura: equipo?.numero_factura ?? "",
      garantia_meses:
        equipo?.garantia_meses === null || equipo?.garantia_meses === undefined
          ? ""
          : String(equipo.garantia_meses),
      observaciones: equipo?.observaciones ?? "",
      activo: equipo?.activo ?? true,

      codigo_tipo_id: equipo?.tipo_equipo?.codigo_tipo ?? "",
      codigo_marca_id: equipo?.marca?.codigo_marca ?? "",
      codigo_estado_id: equipo?.estado?.codigo_estado ?? "",
      codigo_condicion_id: equipo?.condicion?.codigo_condicion ?? "",
      codigo_ram_id: equipo?.ram?.codigo_ram ?? "",
      codigo_procesador_id: equipo?.procesador?.codigo_procesador ?? "",
      codigo_so_id: equipo?.sistema_operativo?.codigo_so ?? "",
      codigo_disco_id: equipo?.tipo_disco?.codigo_disco ?? "",
      tamano_disco_id: equipo?.tamano_disco_catalogo?.id ?? "",
      id_ubicacion_id: equipo?.ubicacion?.id_ubicacion ?? "",
    });
  }, [open, equipo]);

  const canSave = useMemo(() => {
    if (!equipo?.id_equipo) return false;
    // lo mínimo: inventario/serie no se editan acá, así que ok.
    return true;
  }, [equipo]);

  function setField(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    if (!canSave) return;
    setLoading(true);
    setErr("");

    try {
      const payload = {
        modelo: form.modelo || null,
        proveedor: form.proveedor || null,
        numero_factura: form.numero_factura || null,
        observaciones: form.observaciones || null,
        activo: Boolean(form.activo),

        // numeric
        garantia_meses:
          form.garantia_meses === "" ? null : Number(form.garantia_meses),

        // FKs (si vienen vacíos, mandamos null)
        codigo_tipo_id: form.codigo_tipo_id ? Number(form.codigo_tipo_id) : null,
        codigo_marca_id: form.codigo_marca_id ? Number(form.codigo_marca_id) : null,
        codigo_estado_id: form.codigo_estado_id ? Number(form.codigo_estado_id) : null,
        codigo_condicion_id: form.codigo_condicion_id ? Number(form.codigo_condicion_id) : null,
        codigo_ram_id: form.codigo_ram_id ? Number(form.codigo_ram_id) : null,
        codigo_procesador_id: form.codigo_procesador_id ? Number(form.codigo_procesador_id) : null,
        codigo_so_id: form.codigo_so_id ? Number(form.codigo_so_id) : null,
        codigo_disco_id: form.codigo_disco_id ? Number(form.codigo_disco_id) : null,
        tamano_disco_id: form.tamano_disco_id ? Number(form.tamano_disco_id) : null,
        id_ubicacion_id: form.id_ubicacion_id ? Number(form.id_ubicacion_id) : null,
      };

      await api.patch(`/equipos/${equipo.id_equipo}/`, payload);

      onSaved?.();
      onClose?.();
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "object"
          ? JSON.stringify(e.response.data)
          : null) ||
        e?.message ||
        "No se pudo guardar.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const estados = catalogos?.estados ?? [];
  const ubicaciones = catalogos?.ubicaciones ?? [];
  const marcas = catalogos?.marcas ?? [];
  const tipos = catalogos?.tipos ?? [];
  const condiciones = catalogos?.condiciones ?? [];
  const ramCatalogo = catalogos?.ram ?? [];
  const procesadores = catalogos?.procesadores ?? [];
  const sistemasOperativos = catalogos?.sistemasOperativos ?? [];
  const tiposDisco = catalogos?.tiposDisco ?? [];
  const tamanosDisco = catalogos?.tamanosDisco ?? [];

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="header">
          <div>
            <div className="title">Editar equipo</div>
            <div className="sub">
              {equipo?.numero_inventario || "—"} · {equipo?.numero_serie || "—"}
            </div>
          </div>
          <button className="closeBtn" onClick={onClose} title="Cerrar">
            ✕
          </button>
        </div>

        <div className="body">
          {err ? <div className="error">{err}</div> : null}

          <div className="grid">
            <Field label="Modelo">
              <input
                className="input"
                value={form.modelo}
                onChange={(e) => setField("modelo", e.target.value)}
                placeholder="Ej: Latitude 5420"
              />
            </Field>

            <Field label="Activo">
              <select
                className="select"
                value={String(form.activo)}
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
                {tipos.map((x) => (
                  <option key={x.codigo_tipo} value={x.codigo_tipo}>
                    {x.descripcion}
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
                {marcas.map((x) => (
                  <option key={x.codigo_marca} value={x.codigo_marca}>
                    {x.descripcion}
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
                {estados.map((x) => (
                  <option key={x.codigo_estado} value={x.codigo_estado}>
                    {x.descripcion}
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
                {ubicaciones.map((x) => (
                  <option key={x.id_ubicacion} value={x.id_ubicacion}>
                    {x.nombre_sede}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Condición">
              <select
                className="select"
                value={form.codigo_condicion_id}
                onChange={(e) => setField("codigo_condicion_id", e.target.value)}
              >
                <option value="">—</option>
                {condiciones.map((x) => (
                  <option key={x.codigo_condicion} value={x.codigo_condicion}>
                    {x.descripcion}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="RAM">
              <select
                className="select"
                value={form.codigo_ram_id}
                onChange={(e) => setField("codigo_ram_id", e.target.value)}
              >
                <option value="">—</option>
                {ramCatalogo.map((x) => (
                  <option key={x.codigo_ram} value={x.codigo_ram}>
                    {x.descripcion}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Procesador">
              <select
                className="select"
                value={form.codigo_procesador_id}
                onChange={(e) => setField("codigo_procesador_id", e.target.value)}
              >
                <option value="">—</option>
                {procesadores.map((x) => (
                  <option key={x.codigo_procesador} value={x.codigo_procesador}>
                    {x.descripcion}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="S.O">
              <select
                className="select"
                value={form.codigo_so_id}
                onChange={(e) => setField("codigo_so_id", e.target.value)}
              >
                <option value="">—</option>
                {sistemasOperativos.map((x) => (
                  <option key={x.codigo_so} value={x.codigo_so}>
                    {x.descripcion || x.nombre}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tamaño disco">
              <select
                className="select"
                value={form.tamano_disco_id}
                onChange={(e) => setField("tamano_disco_id", e.target.value)}
              >
                <option value="">—</option>
                {tamanosDisco.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.descripcion}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tipo disco">
              <select
                className="select"
                value={form.codigo_disco_id}
                onChange={(e) => setField("codigo_disco_id", e.target.value)}
              >
                <option value="">—</option>
                {tiposDisco.map((x) => (
                  <option key={x.codigo_disco} value={x.codigo_disco}>
                    {x.descripcion}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Proveedor">
              <input
                className="input"
                value={form.proveedor}
                onChange={(e) => setField("proveedor", e.target.value)}
                placeholder="Ej: SP Digital"
              />
            </Field>

            <Field label="N° Factura">
              <input
                className="input"
                value={form.numero_factura}
                onChange={(e) => setField("numero_factura", e.target.value)}
                placeholder="Ej: 12345"
              />
            </Field>

            <Field label="Garantía (meses)">
              <input
                className="input"
                value={form.garantia_meses}
                onChange={(e) => setField("garantia_meses", e.target.value)}
                placeholder="Ej: 12"
                inputMode="numeric"
              />
            </Field>

            <Field label="Observaciones" wide>
              <textarea
                className="textarea"
                value={form.observaciones}
                onChange={(e) => setField("observaciones", e.target.value)}
                placeholder="Notas del equipo…"
              />
            </Field>
          </div>
        </div>

        <div className="footer">
          <button className="secondaryBtn" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            className="primaryBtn"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, wide }) {
  return (
    <div className={`field edit-eq-field${wide ? " is-wide" : ""}`}>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}
