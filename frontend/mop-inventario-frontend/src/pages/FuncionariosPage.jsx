import { useEffect, useMemo, useState } from "react";
import { api, getApiErrorMessage } from "../api/api";

export default function FuncionariosPage() {
  // ---- data ----
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);

  // ---- ui ----
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ---- filtros/paginación ----
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [q, setQ] = useState("");

  // ---- modal: nuevo ----
  const [openNew, setOpenNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [form, setForm] = useState({
    rut: "",
    nombre_completo: "",
    email_institucional: "",
    telefono: "",
    codigo_cargo_id: "",
    codigo_unidad_id: "",
    fecha_ingreso: "",
    activo: true,
  });

  // ---- modal: ver / editar ----
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [active, setActive] = useState(null);

  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [editForm, setEditForm] = useState({
    rut: "",
    nombre_completo: "",
    email_institucional: "",
    telefono: "",
    codigo_cargo_id: "",
    codigo_unidad_id: "",
    fecha_ingreso: "",
    fecha_salida: "",
    activo: true,
  });

  // ---- asignaciones (equipo actual + historial) ----
  const [asigLoading, setAsigLoading] = useState(false);
  const [asignaciones, setAsignaciones] = useState([]); // historial

  const equipoActual = useMemo(() => {
    const list = Array.isArray(asignaciones) ? asignaciones : [];

    // 1) Si el backend trae activo true, eso manda
    const byActivo = list.find((a) => a?.activo === true);
    if (byActivo) return byActivo;

    // 2) Si no hay devolución, probablemente es la actual
    const byNoDevol = list.find((a) => !a?.fecha_devolucion);
    if (byNoDevol) return byNoDevol;

    // 3) fallback: última (ya viene ordenada desc)
    return list[0] || null;
  }, [asignaciones]);

  async function loadFuncionarios(p = page) {
    setLoading(true);
    setErr("");
    try {
      const params = { ordering: "-id_funcionario", page: p };
      if (q?.trim()) params.search = q.trim();

      const res = await api.get("/funcionarios/", { params });
      const list = res.data?.results ?? res.data ?? [];
      const total = res.data?.count ?? list.length;

      setRows(list);
      setCount(total);
    } catch (e) {
      setErr(getApiErrorMessage(e, "Error cargando funcionarios."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFuncionarios(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = useMemo(() => Math.max(Math.ceil((count || 0) / pageSize), 1), [count]);

  function isImportedPlaceholderEmail(value) {
    return typeof value === "string" && value.trim().toLowerCase().endsWith("@import.local");
  }

  function displayEmail(value) {
    if (!value) return "—";
    if (isImportedPlaceholderEmail(value)) return "Sin correo importado";
    return value;
  }

  function openNewModal() {
    setFormErr("");
    setForm({
      rut: "",
      nombre_completo: "",
      email_institucional: "",
      telefono: "",
      codigo_cargo_id: "",
      codigo_unidad_id: "",
      fecha_ingreso: "",
      activo: true,
    });
    setOpenNew(true);
  }

  async function createFuncionario() {
    setSaving(true);
    setFormErr("");
    try {
      if (!form.rut?.trim()) return setFormErr("Ingresa RUT.");
      if (!form.nombre_completo?.trim()) return setFormErr("Ingresa nombre completo.");
      if (!form.email_institucional?.trim()) return setFormErr("Ingresa email institucional.");

      const payload = {
        rut: form.rut.trim(),
        nombre_completo: form.nombre_completo.trim(),
        email_institucional: form.email_institucional.trim(),
        telefono: form.telefono?.trim() || "",
        codigo_cargo_id: form.codigo_cargo_id ? Number(form.codigo_cargo_id) : null,
        codigo_unidad_id: form.codigo_unidad_id ? Number(form.codigo_unidad_id) : null,
        fecha_ingreso: form.fecha_ingreso || null,
        activo: Boolean(form.activo),
      };

      await api.post("/funcionarios/", payload);

      setOpenNew(false);
      setPage(1);
      await loadFuncionarios(1);
    } catch (e) {
      const data = e?.response?.data;
      if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : String(data[firstKey]);
        setFormErr(msg || "No se pudo crear el funcionario.");
      } else {
        setFormErr(getApiErrorMessage(e, "No se pudo crear el funcionario."));
      }
    } finally {
      setSaving(false);
    }
  }

  async function loadAsignacionesFuncionario(funcionario) {
    const id = funcionario?.id_funcionario ?? null;
    if (!id) {
      setAsignaciones([]);
      return;
    }

    setAsigLoading(true);
    try {
      const res = await api.get("/asignaciones/", {
        params: {
          id_funcionario: id,
          ordering: "-id_asignacion",
        },
      });

      const list = res.data?.results ?? res.data ?? [];
      setAsignaciones(Array.isArray(list) ? list : []);
    } catch {
      setAsignaciones([]);
    } finally {
      setAsigLoading(false);
    }
  }

  async function openViewModal(f) {
    setActive(f);
    setOpenView(true);
    await loadAsignacionesFuncionario(f);
  }

  function openEditModal(f) {
    setActive(f);
    setEditErr("");
    setEditForm({
      rut: f?.rut || "",
      nombre_completo: f?.nombre_completo || "",
      email_institucional: f?.email_institucional || "",
      telefono: f?.telefono || "",
      codigo_cargo_id: String(f?.codigo_cargo ?? f?.cargo?.codigo_cargo ?? "") || "",
      codigo_unidad_id: String(f?.codigo_unidad ?? f?.unidad?.codigo_unidad ?? "") || "",
      fecha_ingreso: f?.fecha_ingreso || "",
      fecha_salida: f?.fecha_salida || "",
      activo: f?.activo ?? true,
    });
    setOpenEdit(true);
    loadAsignacionesFuncionario(f);
  }

  async function saveEdit() {
    if (!active?.id_funcionario) return;

    setEditSaving(true);
    setEditErr("");
    try {
      const payload = {
        rut: editForm.rut?.trim() || "",
        nombre_completo: editForm.nombre_completo?.trim() || "",
        email_institucional: editForm.email_institucional?.trim() || "",
        telefono: editForm.telefono?.trim() || "",
        codigo_cargo_id: editForm.codigo_cargo_id ? Number(editForm.codigo_cargo_id) : null,
        codigo_unidad_id: editForm.codigo_unidad_id ? Number(editForm.codigo_unidad_id) : null,
        fecha_ingreso: editForm.fecha_ingreso || null,
        fecha_salida: editForm.fecha_salida || null,
        activo: Boolean(editForm.activo),
      };

      await api.patch(`/funcionarios/${active.id_funcionario}/`, payload);

      setOpenEdit(false);
      await loadFuncionarios(page);
    } catch (e) {
      const data = e?.response?.data;
      if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : String(data[firstKey]);
        setEditErr(msg || "No se pudo guardar.");
      } else {
        setEditErr(getApiErrorMessage(e, "No se pudo guardar."));
      }
    } finally {
      setEditSaving(false);
    }
  }

  async function quickToggleActivo(f) {
    if (!f?.id_funcionario) return;
    try {
      await api.patch(`/funcionarios/${f.id_funcionario}/`, { activo: !Boolean(f.activo) });
      await loadFuncionarios(page);
    } catch (e) {
      setErr(getApiErrorMessage(e, "No se pudo cambiar estado."));
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="headerRow">
        <div>
          <h1 className="title">Funcionarios</h1>
          <div className="sub">Gestiona funcionarios y revisa el equipo/PC asignado (actual + historial).</div>
        </div>

        <div className="headerActions">
          <button className="secondaryBtn" onClick={() => loadFuncionarios(page)} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
          <button className="primaryBtn" onClick={openNewModal}>
            + Nuevo funcionario
          </button>
        </div>
      </div>

      {err ? <div className="error">{err}</div> : null}

      {/* Filtros */}
      <div className="filtersCard">
        <div className="filtersGrid">
          <div>
            <div className="label">Buscar</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  loadFuncionarios(1);
                }
              }}
              placeholder="RUT / nombre / email…"
              className="input"
            />
            <div className="u-flex-gap-8 u-mt-10">
              <button
                className="smallBtn"
                onClick={() => {
                  setPage(1);
                  loadFuncionarios(1);
                }}
                disabled={loading}
              >
                Buscar
              </button>
              <button
                className="smallBtn"
                onClick={() => {
                  setQ("");
                  setPage(1);
                  loadFuncionarios(1);
                }}
                disabled={loading}
              >
                Limpiar
              </button>
            </div>
          </div>

          <div className="u-flex-end-end">
            <div className="u-flex-center-gap-8">
              <button
                className="smallBtn"
                onClick={() => {
                  const p = Math.max(page - 1, 1);
                  setPage(p);
                  loadFuncionarios(p);
                }}
                disabled={loading || page <= 1}
              >
                ←
              </button>

              <div className="pagePill">
                Página <b>{page}</b> / {totalPages}
              </div>

              <button
                className="smallBtn"
                onClick={() => {
                  const p = Math.min(page + 1, totalPages);
                  setPage(p);
                  loadFuncionarios(p);
                }}
                disabled={loading || page >= totalPages}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Listado</div>
            <div className="cardSub">{loading ? "Cargando…" : `${count || 0} registros`}</div>
          </div>
        </div>

        <div className="u-p-14">
          {!loading && rows.length === 0 ? (
            <div className="empty">No hay funcionarios para mostrar.</div>
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">ID</th>
                    <th className="th">Funcionario</th>
                    <th className="th">Email</th>
                    <th className="th">Estado</th>
                    <th className="thRight">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((f) => (
                    <tr key={f.id_funcionario}>
                      <td className="tdMono">{f.id_funcionario}</td>

                      <td className="td">
                        <div className="u-fw-1000 u-text-strong">{f.nombre_completo || "—"}</div>
                        <div className="u-fs-12 u-text-muted">{f.rut || "Sin RUT"}</div>
                      </td>

                      <td className="td">{displayEmail(f.email_institucional)}</td>

                      <td className="td">
                        <span className={f.activo ? "pillOk" : "pillBad"}>{f.activo ? "Activo" : "Inactivo"}</span>
                      </td>

                      <td className="tdRight">
                        <div className="u-flex-gap-8 u-justify-end">
                          <button className="smallBtn" onClick={() => openViewModal(f)}>
                            Ver
                          </button>
                          <button className="smallBtn" onClick={() => openEditModal(f)}>
                            Editar
                          </button>
                          <button className="smallBtn" onClick={() => quickToggleActivo(f)}>
                            {f.activo ? "Desactivar" : "Activar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Nuevo */}
      {openNew ? (
        <div className="modalOverlay" onMouseDown={() => setOpenNew(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Nuevo funcionario</div>
                <div className="modalSub">Crea un funcionario para poder asignarle equipos.</div>
              </div>
              <button className="iconBtn" onClick={() => setOpenNew(false)} title="Cerrar">
                ✕
              </button>
            </div>

            {formErr ? <div className="error">{formErr}</div> : null}

            <div className="formGrid">
              <div>
                <div className="label">RUT *</div>
                <input value={form.rut} onChange={(e) => setForm((p) => ({ ...p, rut: e.target.value }))} className="input" />
              </div>

              <div>
                <div className="label">Nombre completo *</div>
                <input value={form.nombre_completo} onChange={(e) => setForm((p) => ({ ...p, nombre_completo: e.target.value }))} className="input" />
              </div>

              <div>
                <div className="label">Email institucional *</div>
                <input value={form.email_institucional} onChange={(e) => setForm((p) => ({ ...p, email_institucional: e.target.value }))} className="input" />
              </div>

              <div>
                <div className="label">Teléfono</div>
                <input value={form.telefono} onChange={(e) => setForm((p) => ({ ...p, telefono: e.target.value }))} className="input" />
              </div>

              <div>
                <div className="label">Código cargo (opcional)</div>
                <input
                  value={form.codigo_cargo_id}
                  onChange={(e) => setForm((p) => ({ ...p, codigo_cargo_id: e.target.value.replace(/[^\d]/g, "") }))}
                  className="input"
                  placeholder="Ej: 1"
                />
              </div>

              <div>
                <div className="label">Código unidad (opcional)</div>
                <input
                  value={form.codigo_unidad_id}
                  onChange={(e) => setForm((p) => ({ ...p, codigo_unidad_id: e.target.value.replace(/[^\d]/g, "") }))}
                  className="input"
                  placeholder="Ej: 3"
                />
              </div>

              <div>
                <div className="label">Fecha ingreso</div>
                <input type="date" value={form.fecha_ingreso || ""} onChange={(e) => setForm((p) => ({ ...p, fecha_ingreso: e.target.value }))} className="input" />
              </div>

              <div className="u-flex-align-end">
                <label className="checkRow">
                  <input type="checkbox" checked={Boolean(form.activo)} onChange={(e) => setForm((p) => ({ ...p, activo: e.target.checked }))} />
                  <span className="u-fw-900">Activo</span>
                </label>
              </div>
            </div>

            <div className="modalFooter">
              <button className="secondaryBtn" onClick={() => setOpenNew(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="primaryBtn" onClick={createFuncionario} disabled={saving}>
                {saving ? "Guardando…" : "Crear funcionario"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal: Ver */}
      {openView && active ? (
        <div className="modalOverlay" onMouseDown={() => setOpenView(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">{active.nombre_completo || "Funcionario"}</div>
                <div className="modalSub">
                  {active.rut || "—"} · {displayEmail(active.email_institucional)}
                </div>
              </div>
              <button className="iconBtn" onClick={() => setOpenView(false)} title="Cerrar">
                ✕
              </button>
            </div>

            <div className="u-p-16 u-grid-gap-12">
              <div className="kvGrid">
                <KV label="Teléfono" value={active.telefono || "—"} />
                <KV label="Activo" value={active.activo ? "Sí" : "No"} />
                <KV label="Fecha ingreso" value={formatDate(active.fecha_ingreso)} />
              </div>

              <div className="section">
                <div className="sectionTitle">Equipo/PC actual asignado</div>

                {asigLoading ? (
                  <div className="help">Cargando asignaciones…</div>
                ) : !equipoActual?.equipo ? (
                  <div className="help">Este funcionario no tiene un equipo asignado actualmente.</div>
                ) : (
                  <EquipoCard asignacion={equipoActual} isActual />
                )}
              </div>

              <div className="section">
                <div className="sectionTitle">Historial de equipos asignados</div>

                {asigLoading ? (
                  <div className="help">Cargando historial…</div>
                ) : asignaciones.length === 0 ? (
                  <div className="help">No hay historial de asignaciones para este funcionario.</div>
                ) : (
                  <div className="histList">
                    {asignaciones.slice(0, 10).map((a) => {
                      const isActual =
                        (equipoActual?.id_asignacion && a?.id_asignacion === equipoActual.id_asignacion) ||
                        (equipoActual?.equipo?.id_equipo && a?.equipo?.id_equipo === equipoActual.equipo.id_equipo && !a?.fecha_devolucion);

                      return (
                        <div
                          key={a.id_asignacion ?? `${a?.equipo?.id_equipo}-${a?.fecha_asignacion}`}
                          className={isActual ? "histItemActive" : "histItem"}
                        >
                          <div className="u-flex-between-gap-10">
                            <div className="u-fw-1000">
                              {a?.equipo?.numero_inventario || "—"} · {a?.equipo?.modelo || "Sin modelo"}
                            </div>
                            {isActual ? <span className="pillOk">Actual</span> : <span className="pillNeutral">Histórico</span>}
                          </div>

                          <div className="u-fs-12 u-text-muted u-mt-4">
                            {formatDate(a?.fecha_asignacion)} → {a?.fecha_devolucion ? formatDate(a?.fecha_devolucion) : "Actual"}
                            {" · "}
                            {getEstadoAsignacionLabel(a)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modalFooter">
              <button className="secondaryBtn" onClick={() => setOpenView(false)}>
                Cerrar
              </button>
              <button
                className="primaryBtn"
                onClick={() => {
                  setOpenView(false);
                  openEditModal(active);
                }}
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal: Editar */}
      {openEdit && active ? (
        <div className="modalOverlay" onMouseDown={() => setOpenEdit(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Editar funcionario</div>
                <div className="modalSub">{active.nombre_completo || "—"}</div>
              </div>
              <button className="iconBtn" onClick={() => setOpenEdit(false)} title="Cerrar">
                ✕
              </button>
            </div>

            {editErr ? <div className="error">{editErr}</div> : null}

            <div className="formGrid">
              <div>
                <div className="label">RUT</div>
                <input value={editForm.rut} onChange={(e) => setEditForm((p) => ({ ...p, rut: e.target.value }))} className="input" />
              </div>

              <div>
                <div className="label">Nombre completo</div>
                <input value={editForm.nombre_completo} onChange={(e) => setEditForm((p) => ({ ...p, nombre_completo: e.target.value }))} className="input" />
              </div>

              <div>
                <div className="label">Email institucional</div>
                <input value={editForm.email_institucional} onChange={(e) => setEditForm((p) => ({ ...p, email_institucional: e.target.value }))} className="input" />
              </div>

              <div>
                <div className="label">Teléfono</div>
                <input value={editForm.telefono} onChange={(e) => setEditForm((p) => ({ ...p, telefono: e.target.value }))} className="input" />
              </div>

              <div>
                <div className="label">Código cargo</div>
                <input
                  value={editForm.codigo_cargo_id}
                  onChange={(e) => setEditForm((p) => ({ ...p, codigo_cargo_id: e.target.value.replace(/[^\d]/g, "") }))}
                  className="input"
                />
              </div>

              <div>
                <div className="label">Código unidad</div>
                <input
                  value={editForm.codigo_unidad_id}
                  onChange={(e) => setEditForm((p) => ({ ...p, codigo_unidad_id: e.target.value.replace(/[^\d]/g, "") }))}
                  className="input"
                />
              </div>

              <div>
                <div className="label">Fecha ingreso</div>
                <input type="date" value={editForm.fecha_ingreso || ""} onChange={(e) => setEditForm((p) => ({ ...p, fecha_ingreso: e.target.value }))} className="input" />
              </div>

              <div>
                <div className="label">Fecha salida</div>
                <input type="date" value={editForm.fecha_salida || ""} onChange={(e) => setEditForm((p) => ({ ...p, fecha_salida: e.target.value }))} className="input" />
              </div>

              <div className="u-flex-align-end">
                <label className="checkRow">
                  <input type="checkbox" checked={Boolean(editForm.activo)} onChange={(e) => setEditForm((p) => ({ ...p, activo: e.target.checked }))} />
                  <span className="u-fw-900">Activo</span>
                </label>
              </div>
            </div>

            <div className="modalFooter">
              <button className="secondaryBtn" onClick={() => setOpenEdit(false)} disabled={editSaving}>
                Cancelar
              </button>
              <button className="primaryBtn" onClick={saveEdit} disabled={editSaving}>
                {editSaving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* =========================
   Subcomponentes y helpers
   ========================= */

function EquipoCard({ asignacion, isActual }) {
  const eq = asignacion?.equipo || null;

  const estado =
    eq?.estado?.descripcion ||
    eq?.codigo_estado?.descripcion ||
    eq?.estado ||
    null;

  const sede =
    eq?.ubicacion?.nombre_sede ||
    eq?.id_ubicacion?.nombre_sede ||
    null;

  const tipo =
    eq?.tipo_equipo?.descripcion ||
    eq?.codigo_tipo?.descripcion ||
    null;

  const marca =
    eq?.marca?.descripcion ||
    eq?.codigo_marca?.descripcion ||
    null;

  return (
    <div className="equipoCard">
      <div className="u-flex-between-gap-10">
        <div>
          <div className="u-fw-1000 u-text-strong">
            {eq?.numero_inventario || "—"} · {eq?.modelo || "Sin modelo"}
          </div>
          <div className="u-fs-12 u-text-muted">
            Serie: {eq?.numero_serie || "—"}
            {estado ? ` · Estado: ${estado}` : ""}
          </div>

          {(sede || tipo || marca) ? (
            <div className="u-fs-12 u-text-muted u-mt-4">
              {sede ? `Sede: ${sede}` : null}
              {sede && (tipo || marca) ? " · " : null}
              {tipo ? `Tipo: ${tipo}` : null}
              {(tipo && marca) ? " · " : null}
              {marca ? `Marca: ${marca}` : null}
            </div>
          ) : null}
        </div>

        {isActual ? <span className="pillOk">Asignado</span> : <span className="pillNeutral">Histórico</span>}
      </div>

      <div className="u-mt-8 u-fs-12 u-text-muted">
        Asignado: <b>{formatDate(asignacion?.fecha_asignacion)}</b>
        {" · "}
        Devolución: <b>{asignacion?.fecha_devolucion ? formatDate(asignacion?.fecha_devolucion) : "—"}</b>
      </div>

      {asignacion?.motivo_asignacion ? (
        <div className="u-mt-8 u-fs-13 u-fw-800">
          {asignacion.motivo_asignacion}
        </div>
      ) : null}
    </div>
  );
}

function getEstadoAsignacionLabel(a) {
  // si backend trae estado_asignacion (texto), úsalo
  const est = (a?.estado_asignacion || "").toString().trim();
  if (est) return est;

  // fallback: activo o fecha_devolucion
  if (a?.activo === true) return "Activa";
  if (a?.fecha_devolucion) return "Finalizada";
  return "—";
}

function KV({ label, value }) {
  return (
    <div className="kv">
      <div className="kvLabel">{label}</div>
      <div className="kvValue">{value ?? "—"}</div>
    </div>
  );
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
}
