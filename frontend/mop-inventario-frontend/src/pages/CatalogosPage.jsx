import { useMemo, useState } from "react";
import { api, getApiErrorMessage } from "../api/api";
import { useCatalogos } from "../catalogos/CatalogosContext.jsx";

const CATALOG_DEFS = [
  { key: "marcas", label: "Marcas", endpoint: "/catalogos/marcas/", idField: "codigo_marca", hasCodigo: true },
  { key: "tipos", label: "Tipos de equipo", endpoint: "/catalogos/tipos-equipo/", idField: "codigo_tipo", hasCodigo: true },
  { key: "estados", label: "Estados de equipo", endpoint: "/catalogos/estados-equipo/", idField: "codigo_estado", hasCodigo: true },
  { key: "condiciones", label: "Condiciones", endpoint: "/catalogos/condiciones-equipo/", idField: "codigo_condicion", hasCodigo: true },
  { key: "ram", label: "RAM", endpoint: "/catalogos/ram/", idField: "codigo_ram", hasCodigo: true },
  { key: "procesadores", label: "Procesadores", endpoint: "/catalogos/procesadores/", idField: "codigo_procesador", hasCodigo: true },
  { key: "sistemasOperativos", label: "Sistemas operativos", endpoint: "/catalogos/sistemas-operativos/", idField: "codigo_so", hasCodigo: true },
  { key: "tamanosDisco", label: "Tamaño disco", endpoint: "/catalogos/tamanos-disco/", idField: "id", hasCodigo: true },
  { key: "tiposDisco", label: "Tipos disco", endpoint: "/catalogos/tipos-disco/", idField: "codigo_disco", hasCodigo: true },
  { key: "marcasMonitor", label: "Marcas monitor", endpoint: "/catalogos/marcas-monitor/", idField: "id", hasCodigo: true },
  { key: "pulgadasMonitor", label: "Pulgadas monitor", endpoint: "/catalogos/pulgadas-monitor/", idField: "id", hasCodigo: true },
  { key: "sedes", label: "Sedes", endpoint: "/catalogos/sedes/", idField: "id_ubicacion", hasCodigo: false },
  { key: "cargosFuncionario", label: "Cargos funcionario", endpoint: "/catalogos/cargos-funcionario/", idField: "codigo_cargo", hasCodigo: false },
  { key: "unidadesFuncionario", label: "Unidades funcionario", endpoint: "/catalogos/unidades-funcionario/", idField: "codigo_unidad", hasCodigo: false },
];

export default function CatalogosPage() {
  const { data, loading, errors, reload } = useCatalogos();
  const [selectedKey, setSelectedKey] = useState(CATALOG_DEFS[0].key);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ descripcion: "", codigo: "", nombre_sede: "", direccion: "", sigla: "" });

  const def = useMemo(() => CATALOG_DEFS.find((x) => x.key === selectedKey) || CATALOG_DEFS[0], [selectedKey]);
  const rows = useMemo(() => data?.[def.key] ?? [], [data, def.key]);
  const firstError = useMemo(() => Object.values(errors || {})[0] || "", [errors]);

  function startNew() {
    setEditingId(null);
    setFormError("");
    setForm({ descripcion: "", codigo: "", nombre_sede: "", direccion: "", sigla: "" });
  }

  function startEdit(row) {
    setEditingId(row[def.idField]);
    setFormError("");
    if (def.key === "sedes") {
      setForm({
        nombre_sede: row.nombre_sede || "",
        direccion: row.direccion || "",
      });
      return;
    }
    if (def.key === "unidadesFuncionario") {
      setForm({
        descripcion: row.descripcion || "",
        sigla: row.sigla || "",
      });
      return;
    }
    setForm({
      descripcion: row.descripcion || "",
      codigo: row.codigo ?? "",
    });
  }

  async function submit() {
    setSaving(true);
    setFormError("");
    try {
      let payload = {};
      if (def.key === "sedes") {
        if (!form.nombre_sede?.trim()) {
          setFormError("El nombre de la sede es obligatorio.");
          return;
        }
        payload = {
          nombre_sede: form.nombre_sede.trim(),
          direccion: form.direccion?.trim() || "",
          activo: true,
        };
      } else if (def.key === "unidadesFuncionario") {
        if (!form.descripcion?.trim()) {
          setFormError("La descripción es obligatoria.");
          return;
        }
        payload = {
          descripcion: form.descripcion.trim(),
          sigla: form.sigla?.trim() || "",
        };
      } else if (def.key === "cargosFuncionario") {
        if (!form.descripcion?.trim()) {
          setFormError("La descripción es obligatoria.");
          return;
        }
        payload = { descripcion: form.descripcion.trim() };
      } else {
        if (!form.descripcion?.trim()) {
          setFormError("La descripción es obligatoria.");
          return;
        }
        payload = {
          descripcion: form.descripcion.trim(),
          ...(def.hasCodigo && form.codigo !== "" ? { codigo: Number(form.codigo) } : {}),
        };
      }

      if (editingId) {
        await api.patch(`${def.endpoint}${editingId}/`, payload);
      } else {
        await api.post(def.endpoint, payload);
      }
      await reload();
      startNew();
    } catch (e) {
      setFormError(getApiErrorMessage(e, "No se pudo guardar."));
    } finally {
      setSaving(false);
    }
  }

  async function removeRow(row) {
    const id = row[def.idField];
    if (!id) return;
    if (!window.confirm("¿Eliminar registro de catálogo?")) return;
    try {
      await api.delete(`${def.endpoint}${id}/`);
      await reload();
    } catch (e) {
      setFormError(getApiErrorMessage(e, "No se pudo eliminar."));
    }
  }

  return (
    <div>
      <div className="headerRow">
        <div>
          <h1 className="title">Catálogos</h1>
          <div className="sub">CRUD completo para catálogos y sedes, sin tocar SQL manualmente.</div>
        </div>
        <div className="headerActions">
          <button className="secondaryBtn" onClick={reload} disabled={loading || saving}>
            {loading ? "Cargando..." : "Recargar"}
          </button>
        </div>
      </div>

      {firstError ? <div className="error">{firstError}</div> : null}

      <div className="filtersCard">
        <div className="field">
          <div className="label">Catálogo</div>
          <select
            className="select"
            value={selectedKey}
            onChange={(e) => {
              setSelectedKey(e.target.value);
              startNew();
            }}
          >
            {CATALOG_DEFS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">{def.label}</div>
              <div className="cardSub">{rows.length} registro(s)</div>
            </div>
          </div>
          <div className="u-p-14">
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">ID</th>
                    <th className="th">Descripción</th>
                    <th className="th">Código</th>
                    <th className="th inv-th-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td className="td" colSpan={4}>Sin datos.</td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row[def.idField]}>
                        <td className="td">{row[def.idField]}</td>
                        <td className="td">{row.descripcion || row.nombre_sede || "-"}</td>
                        <td className="td">{row.codigo ?? row.sigla ?? "-"}</td>
                        <td className="td inv-td-right">
                          <button className="rowBtn" onClick={() => startEdit(row)}>Editar</button>
                          <button className="rowBtn danger" onClick={() => removeRow(row)}>Eliminar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">{editingId ? "Editar" : "Nuevo"} {def.label}</div>
              <div className="cardSub">Guardar cambios en tiempo real desde frontend.</div>
            </div>
          </div>
          <div className="u-p-14">
            {formError ? <div className="error">{formError}</div> : null}
            <div className="formGrid">
              {def.key === "sedes" ? (
                <>
                  <div>
                    <div className="label">Nombre sede *</div>
                    <input
                      className="input"
                      value={form.nombre_sede || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, nombre_sede: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div className="label">Dirección</div>
                    <input
                      className="input"
                      value={form.direccion || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="label">Descripción *</div>
                    <input
                      className="input"
                      value={form.descripcion || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                    />
                  </div>
                  {def.key === "unidadesFuncionario" ? (
                    <div>
                      <div className="label">Sigla</div>
                      <input
                        className="input"
                        value={form.sigla || ""}
                        onChange={(e) => setForm((prev) => ({ ...prev, sigla: e.target.value }))}
                      />
                    </div>
                  ) : null}
                  {def.hasCodigo ? (
                    <div>
                      <div className="label">Código</div>
                      <input
                        className="input"
                        value={form.codigo ?? ""}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, codigo: e.target.value.replace(/[^\d]/g, "") }))
                        }
                      />
                    </div>
                  ) : null}
                </>
              )}
            </div>
            <div className="modalFooter">
              <button className="secondaryBtn" onClick={startNew} disabled={saving}>
                Limpiar
              </button>
              <button className="primaryBtn" onClick={submit} disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
