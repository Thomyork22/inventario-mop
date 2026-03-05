import { useEffect, useMemo, useState } from "react";
import { api, getApiErrorMessage } from "../api/api";

export default function AsignacionesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ count: 0, next: null, previous: null });
  const [q, setQ] = useState("");
  const [soloActivas, setSoloActivas] = useState(false);

  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [funcionariosSuggest, setFuncionariosSuggest] = useState([]);
  const [equiposSuggest, setEquiposSuggest] = useState([]);
  const [form, setForm] = useState({
    funcionario_text: "",
    funcionario_id: "",
    equipo_text: "",
    equipo_id: "",
    fecha_asignacion: todayISO(),
    motivo_asignacion: "",
  });
  const [editForm, setEditForm] = useState({
    id_asignacion: "",
    fecha_asignacion: "",
    fecha_devolucion: "",
    motivo_asignacion: "",
    estado_asignacion: "",
    activo: true,
  });

  const params = useMemo(() => {
    const p = { page, ordering: "-id_asignacion" };
    if (soloActivas) p.activo = "true";
    return p;
  }, [page, soloActivas]);

  async function loadAsignaciones(currentParams = params) {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/asignaciones/", { params: currentParams });
      const payload = res.data?.results ?? res.data ?? [];
      setRows(Array.isArray(payload) ? payload : []);
      setData({
        count: res.data?.count ?? payload.length,
        next: res.data?.next ?? null,
        previous: res.data?.previous ?? null,
      });
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo cargar asignaciones."));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAsignaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const query = q.trim();
      if (!query) {
        loadAsignaciones(params);
        return;
      }
      try {
        const [fRes, eRes] = await Promise.all([
          api.get("/funcionarios/", { params: { search: query, page_size: 200 } }),
          api.get("/equipos/", { params: { search: query, page_size: 200 } }),
        ]);
        const fIds = new Set((fRes.data?.results ?? fRes.data ?? []).map((x) => x.id_funcionario));
        const eIds = new Set((eRes.data?.results ?? eRes.data ?? []).map((x) => x.id_equipo));
        const filtered = rows.filter(
          (row) => fIds.has(row?.funcionario?.id_funcionario) || eIds.has(row?.equipo?.id_equipo)
        );
        setRows(filtered);
        setData((prev) => ({ ...prev, count: filtered.length, next: null, previous: null }));
      } catch {}
    }, 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function searchFuncionarios(value) {
    if (!value || value.trim().length < 2) {
      setFuncionariosSuggest([]);
      return;
    }
    try {
      const res = await api.get("/funcionarios/", { params: { search: value.trim(), page_size: 10 } });
      setFuncionariosSuggest(res.data?.results ?? res.data ?? []);
    } catch {
      setFuncionariosSuggest([]);
    }
  }

  async function searchEquipos(value) {
    if (!value || value.trim().length < 2) {
      setEquiposSuggest([]);
      return;
    }
    try {
      const res = await api.get("/equipos/", { params: { search: value.trim(), page_size: 10 } });
      setEquiposSuggest(res.data?.results ?? res.data ?? []);
    } catch {
      setEquiposSuggest([]);
    }
  }

  function openCreate() {
    setOpenNew(true);
    setFormError("");
    setFuncionariosSuggest([]);
    setEquiposSuggest([]);
    setForm({
      funcionario_text: "",
      funcionario_id: "",
      equipo_text: "",
      equipo_id: "",
      fecha_asignacion: todayISO(),
      motivo_asignacion: "",
    });
  }

  async function createAsignacion() {
    setSaving(true);
    setFormError("");
    try {
      if (!form.funcionario_id) {
        setFormError("Debes seleccionar un funcionario desde las sugerencias.");
        return;
      }
      if (!form.equipo_id) {
        setFormError("Debes seleccionar un equipo desde las sugerencias.");
        return;
      }
      await api.post("/asignaciones/", {
        id_funcionario_id: Number(form.funcionario_id),
        id_equipo_id: Number(form.equipo_id),
        fecha_asignacion: form.fecha_asignacion || todayISO(),
        motivo_asignacion: form.motivo_asignacion?.trim() || "",
        estado_asignacion: "Activa",
        activo: true,
      });
      setOpenNew(false);
      setPage(1);
      await loadAsignaciones({ ...params, page: 1 });
    } catch (e) {
      setFormError(getApiErrorMessage(e, "No se pudo crear la asignación."));
    } finally {
      setSaving(false);
    }
  }

  async function cerrarAsignacion(item) {
    if (!item?.id_asignacion) return;
    try {
      await api.patch(`/asignaciones/${item.id_asignacion}/`, {
        fecha_devolucion: todayISO(),
        estado_asignacion: "Cerrada",
        activo: false,
      });
      await loadAsignaciones();
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo cerrar la asignación."));
    }
  }

  function openEditModal(item) {
    if (!item?.id_asignacion) return;
    setFormError("");
    setEditForm({
      id_asignacion: String(item.id_asignacion),
      fecha_asignacion: item.fecha_asignacion || "",
      fecha_devolucion: item.fecha_devolucion || "",
      motivo_asignacion: item.motivo_asignacion || "",
      estado_asignacion: item.estado_asignacion || "",
      activo: Boolean(item.activo),
    });
    setOpenEdit(true);
  }

  async function saveEditAsignacion() {
    if (!editForm.id_asignacion) return;
    setSaving(true);
    setFormError("");
    try {
      await api.patch(`/asignaciones/${editForm.id_asignacion}/`, {
        fecha_asignacion: editForm.fecha_asignacion || null,
        fecha_devolucion: editForm.fecha_devolucion || null,
        motivo_asignacion: editForm.motivo_asignacion?.trim() || "",
        estado_asignacion: editForm.estado_asignacion?.trim() || "",
        activo: Boolean(editForm.activo),
      });
      setOpenEdit(false);
      await loadAsignaciones();
    } catch (e) {
      setFormError(getApiErrorMessage(e, "No se pudo editar la asignación."));
    } finally {
      setSaving(false);
    }
  }

  async function eliminarAsignacion(item) {
    if (!item?.id_asignacion) return;
    if (!window.confirm("¿Eliminar asignación?")) return;
    try {
      await api.delete(`/asignaciones/${item.id_asignacion}/`);
      await loadAsignaciones();
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo eliminar la asignación."));
    }
  }

  async function exportarExcel() {
    try {
      const res = await api.get("/reportes/asignaciones.xlsx", {
        params: soloActivas ? { solo_activas: "true" } : {},
        responseType: "blob",
      });
      const blob = new Blob([res.data]);
      const href = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = "reporte_asignaciones_formato.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(href);
    } catch (e) {
      setError(getApiErrorMessage(e, "No se pudo exportar el Excel."));
    }
  }

  return (
    <div>
      <div className="headerRow">
        <div>
          <h1 className="title">Asignaciones</h1>
          <div className="sub">Gestiona asignación y devolución de equipos en un módulo separado.</div>
        </div>
        <div className="headerActions">
          <button className="secondaryBtn" onClick={exportarExcel}>
            Exportar Excel
          </button>
          <button className="secondaryBtn" onClick={() => loadAsignaciones()} disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar"}
          </button>
          <button className="primaryBtn" onClick={openCreate}>
            + Nueva asignación
          </button>
        </div>
      </div>

      {error ? <div className="error">{error}</div> : null}

      <div className="filtersCard">
        <div className="filtersGrid">
          <div className="field">
            <div className="label">Buscar (autocompletar)</div>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Funcionario, RUT, inventario o serie..."
            />
          </div>
          <div className="field">
            <div className="label">Estado</div>
            <select
              className="select"
              value={soloActivas ? "true" : ""}
              onChange={(e) => {
                setPage(1);
                setSoloActivas(e.target.value === "true");
              }}
            >
              <option value="">Todas</option>
              <option value="true">Solo activas</option>
            </select>
          </div>
        </div>
        <div className="statusRow">
          <div className="statusLeft">
            <span className="badgeOk">{loading ? "Cargando..." : `${data.count} resultado(s)`}</span>
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
                <th className="th">Funcionario</th>
                <th className="th">Equipo</th>
                <th className="th">Fecha asignación</th>
                <th className="th">Fecha devolución</th>
                <th className="th">Estado</th>
                <th className="th inv-th-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 ? (
                <tr>
                  <td className="td" colSpan={6}>
                    No hay asignaciones.
                  </td>
                </tr>
              ) : (
                rows.map((x) => {
                  const activa = x?.activo && !x?.fecha_devolucion;
                  return (
                    <tr key={x.id_asignacion}>
                      <td className="td">
                        <div className="u-fw-700 u-text-strong">{x?.funcionario?.nombre_completo || "-"}</div>
                        <div className="mini">{x?.funcionario?.rut || ""}</div>
                      </td>
                      <td className="td">
                        <div className="u-fw-700 u-text-strong">{x?.equipo?.numero_inventario || "-"}</div>
                        <div className="mini">{x?.equipo?.numero_serie || ""}</div>
                      </td>
                      <td className="td">{formatDate(x?.fecha_asignacion)}</td>
                      <td className="td">{formatDate(x?.fecha_devolucion)}</td>
                      <td className="td">
                        <span className={activa ? "pillOk" : "pillNeutral"}>{activa ? "Activa" : "Cerrada"}</span>
                      </td>
                      <td className="td inv-td-right">
                        <button className="rowBtn" onClick={() => openEditModal(x)}>
                          Editar
                        </button>
                        <button className="rowBtn" onClick={() => cerrarAsignacion(x)} disabled={!activa}>
                          Cerrar
                        </button>
                        <button className="rowBtn danger" onClick={() => eliminarAsignacion(x)}>
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openNew ? (
        <div className="modalOverlay" onMouseDown={() => setOpenNew(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Nueva asignación</div>
                <div className="modalSub">Selecciona funcionario y equipo con autocompletado.</div>
              </div>
              <button className="iconBtn" onClick={() => setOpenNew(false)}>
                ✕
              </button>
            </div>
            {formError ? <div className="error">{formError}</div> : null}
            <div className="formGrid">
              <div>
                <div className="label">Funcionario *</div>
                <input
                  className="input"
                  value={form.funcionario_text}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({ ...prev, funcionario_text: value, funcionario_id: "" }));
                    searchFuncionarios(value);
                  }}
                  placeholder="Escribe nombre o RUT..."
                />
                {funcionariosSuggest.length > 0 ? (
                  <div className="catalogSuggestList">
                    {funcionariosSuggest.map((f) => (
                      <button
                        type="button"
                        key={f.id_funcionario}
                        className="catalogSuggestItem"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            funcionario_id: String(f.id_funcionario),
                            funcionario_text: `${f.nombre_completo} (${f.rut})`,
                          }))
                        }
                      >
                        {f.nombre_completo} ({f.rut})
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="label">Equipo *</div>
                <input
                  className="input"
                  value={form.equipo_text}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({ ...prev, equipo_text: value, equipo_id: "" }));
                    searchEquipos(value);
                  }}
                  placeholder="Inventario, serie o modelo..."
                />
                {equiposSuggest.length > 0 ? (
                  <div className="catalogSuggestList">
                    {equiposSuggest.map((eq) => (
                      <button
                        type="button"
                        key={eq.id_equipo}
                        className="catalogSuggestItem"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            equipo_id: String(eq.id_equipo),
                            equipo_text: `${eq.numero_inventario} · ${eq.numero_serie}`,
                          }))
                        }
                      >
                        {eq.numero_inventario} · {eq.numero_serie}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div>
                <div className="label">Fecha asignación</div>
                <input
                  className="input"
                  type="date"
                  value={form.fecha_asignacion}
                  onChange={(e) => setForm((prev) => ({ ...prev, fecha_asignacion: e.target.value }))}
                />
              </div>

              <div>
                <div className="label">Motivo</div>
                <input
                  className="input"
                  value={form.motivo_asignacion}
                  onChange={(e) => setForm((prev) => ({ ...prev, motivo_asignacion: e.target.value }))}
                />
              </div>
            </div>
            <div className="modalFooter">
              <button className="secondaryBtn" onClick={() => setOpenNew(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="primaryBtn" onClick={createAsignacion} disabled={saving}>
                {saving ? "Guardando..." : "Crear asignación"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {openEdit ? (
        <div className="modalOverlay" onMouseDown={() => setOpenEdit(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Editar asignación</div>
                <div className="modalSub">Actualiza fechas, estado y observación.</div>
              </div>
              <button className="iconBtn" onClick={() => setOpenEdit(false)}>
                ✕
              </button>
            </div>
            {formError ? <div className="error">{formError}</div> : null}
            <div className="formGrid">
              <div>
                <div className="label">Fecha asignación</div>
                <input
                  className="input"
                  type="date"
                  value={editForm.fecha_asignacion}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fecha_asignacion: e.target.value }))}
                />
              </div>
              <div>
                <div className="label">Fecha devolución</div>
                <input
                  className="input"
                  type="date"
                  value={editForm.fecha_devolucion}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, fecha_devolucion: e.target.value }))}
                />
              </div>
              <div>
                <div className="label">Estado asignación</div>
                <input
                  className="input"
                  value={editForm.estado_asignacion}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, estado_asignacion: e.target.value }))}
                  placeholder="Activa, Cerrada, etc."
                />
              </div>
              <div>
                <div className="label">Motivo</div>
                <input
                  className="input"
                  value={editForm.motivo_asignacion}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, motivo_asignacion: e.target.value }))}
                />
              </div>
              <div className="u-flex-align-end">
                <label className="checkRow">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.activo)}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, activo: e.target.checked }))}
                  />
                  <span className="u-fw-900">Activa</span>
                </label>
              </div>
            </div>
            <div className="modalFooter">
              <button className="secondaryBtn" onClick={() => setOpenEdit(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="primaryBtn" onClick={saveEditAsignacion} disabled={saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}
