import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import { useCatalogos } from "../catalogos/CatalogosContext.jsx";

export default function MantencionesPage() {
  const { data: catalogosData, loading: loadingCatalogos, errors: catalogosErrors } = useCatalogos();
  // ---- data ----
  const [rows, setRows] = useState([]);
  const [count, setCount] = useState(0);

  const [equipos, setEquipos] = useState([]);
  const tipos = catalogosData.tiposMantenimiento ?? [];
  const estadosMant = catalogosData.estadosMantenimiento ?? [];

  // ---- ui ----
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // ---- filtros/paginación ----
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [qEquipo, setQEquipo] = useState("");
  const [equipoSel, setEquipoSel] = useState(null);
  const [tipoSel, setTipoSel] = useState("");
  const [soloRecientes, setSoloRecientes] = useState(false);

  // ---- modal: nueva ----
  const [openNew, setOpenNew] = useState(false);
  const [form, setForm] = useState({
    id_equipo_id: "",
    codigo_tipo_mantenimiento_id: "",
    fecha_solicitud: todayISO(),
    problema_reportado: "",
    observaciones: "",
  });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState("");

  // ---- modal: ver / editar ----
  const [openView, setOpenView] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [active, setActive] = useState(null);

  const [historialEquipo, setHistorialEquipo] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  const [editSaving, setEditSaving] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [editForm, setEditForm] = useState({
    codigo_estado_mantenimiento_id: "",
    diagnostico_tecnico: "",
    solucion_aplicada: "",
    fecha_ingreso_taller: "",
    fecha_salida_taller: "",
    fecha_entrega: "",
    observaciones: "",
  });

  // ✅ FIX: esta función DEBE vivir dentro del componente para usar setEditForm
  function applyQuickStatus(kind) {
    const t = todayISO();

    setEditForm((p) => {
      if (kind === "taller") {
        return {
          ...p,
          fecha_ingreso_taller: p.fecha_ingreso_taller || t,
        };
      }
      if (kind === "terminado") {
        return {
          ...p,
          fecha_ingreso_taller: p.fecha_ingreso_taller || t,
          fecha_salida_taller: p.fecha_salida_taller || t,
        };
      }
      if (kind === "entregado") {
        return {
          ...p,
          fecha_ingreso_taller: p.fecha_ingreso_taller || t,
          fecha_salida_taller: p.fecha_salida_taller || t,
          fecha_entrega: p.fecha_entrega || t,
        };
      }
      if (kind === "reset") {
        return {
          ...p,
          fecha_ingreso_taller: "",
          fecha_salida_taller: "",
          fecha_entrega: "",
          codigo_estado_mantenimiento_id: "",
        };
      }
      return p;
    });
  }

  async function searchEquipos(term) {
    if (!term || term.trim().length < 2) {
      setEquipos([]);
      return;
    }
    const res = await api.get("/equipos/", {
      params: { search: term.trim(), ordering: "-id_equipo", page: 1 },
    });
    const list = res.data?.results ?? res.data ?? [];
    setEquipos(list.slice(0, 8));
  }

  async function loadMantenimientos(p = page) {
    setLoading(true);
    setErr("");
    try {
      const params = { ordering: "-id_mantenimiento", page: p };
      if (equipoSel?.id_equipo) params.id_equipo = equipoSel.id_equipo;

      const res = await api.get("/mantenimientos/", { params });
      const list = res.data?.results ?? res.data ?? [];
      const total = res.data?.count ?? list.length;

      let viewList = list;

      if (tipoSel) {
        viewList = viewList.filter(
          (x) =>
            String(x?.tipo_mantenimiento?.codigo_tipo_mantenimiento ?? "") ===
            String(tipoSel)
        );
      }

      if (soloRecientes) {
        const limit = new Date();
        limit.setDate(limit.getDate() - 30);
        viewList = viewList.filter((x) => {
          const d = new Date(x?.fecha_solicitud || x?.fecha_creacion || "");
          return !Number.isNaN(d.getTime()) && d >= limit;
        });
      }

      setRows(viewList);
      setCount(total);
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Error cargando mantenciones");
    } finally {
      setLoading(false);
    }
  }

  // init
  useEffect(() => {
    (async () => {
      try {
        if (Object.keys(catalogosErrors || {}).length > 0) {
          const firstError = Object.values(catalogosErrors)[0];
          setErr(firstError || "");
        }
      } finally {
        loadMantenimientos(1);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogosErrors]);

  // cambios filtros -> vuelve a page 1
  useEffect(() => {
    setPage(1);
    loadMantenimientos(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipoSel, tipoSel, soloRecientes]);

  const totalPages = useMemo(() => {
    return Math.max(Math.ceil((count || 0) / pageSize), 1);
  }, [count]);

  function openNewModal() {
    setFormErr("");
    setForm({
      id_equipo_id: equipoSel?.id_equipo ? String(equipoSel.id_equipo) : "",
      codigo_tipo_mantenimiento_id: "",
      fecha_solicitud: todayISO(),
      problema_reportado: "",
      observaciones: "",
    });
    setOpenNew(true);
  }

  async function createMantenimiento() {
    setSaving(true);
    setFormErr("");
    try {
      if (!form.id_equipo_id) return setFormErr("Selecciona un equipo.");
      if (!form.codigo_tipo_mantenimiento_id) return setFormErr("Selecciona un tipo de mantención.");
      if (!form.fecha_solicitud) return setFormErr("Ingresa fecha de solicitud.");

      const payload = {
        id_equipo_id: Number(form.id_equipo_id),
        codigo_tipo_mantenimiento_id: Number(form.codigo_tipo_mantenimiento_id),
        fecha_solicitud: form.fecha_solicitud,
        problema_reportado: form.problema_reportado || "",
        observaciones: form.observaciones || "",
      };

      await api.post("/mantenimientos/", payload);

      setOpenNew(false);
      setPage(1);
      await loadMantenimientos(1);
    } catch (e) {
      const data = e?.response?.data;
      if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : String(data[firstKey]);
        setFormErr(msg || "No se pudo crear la mantención.");
      } else {
        setFormErr(e?.message || "No se pudo crear la mantención.");
      }
    } finally {
      setSaving(false);
    }
  }

  // ---- Estado robusto ----
  function resolveEstadoMant(m) {
    if (m?.estado_mantenimiento_display) return m.estado_mantenimiento_display;
    if (m?.estado_mantenimiento?.descripcion) return m.estado_mantenimiento.descripcion;

    const id = m?.codigo_estado_mantenimiento;
    if (id == null || id === "") return "Pendiente";

    const found =
      estadosMant.find(
        (x) => String(x?.codigo_estado_mantenimiento ?? x?.id ?? x?.codigo ?? "") === String(id)
      ) || null;

    return found?.descripcion || `Estado #${id}`;
  }

  function pillClassByEstado(label) {
    const v = String(label || "").toLowerCase();
    if (v.includes("pend") || v.includes("abiert") || v.includes("nuevo")) {
      return "mant-pill is-pending";
    }
    if (v.includes("taller") || v.includes("diagn") || v.includes("proceso") || v.includes("curso")) {
      return "mant-pill is-workshop";
    }
    if (v.includes("termin") || v.includes("cerr") || v.includes("resuelt") || v.includes("final")) {
      return "mant-pill is-done";
    }
    if (v.includes("rechaz") || v.includes("cancel") || v.includes("anulad")) {
      return "mant-pill is-cancelled";
    }
    return "mant-pill";
  }

  // ---- Historial del EQUIPO asociado ----
  async function loadHistorialEquipo(m) {
    const idEquipo = m?.equipo?.id_equipo ?? null;
    if (!idEquipo) {
      setHistorialEquipo([]);
      return;
    }
    setHistLoading(true);
    try {
      const res = await api.get("/historial-estados/", {
        params: { id_equipo: idEquipo, ordering: "-id_historial_estado" },
      });
      setHistorialEquipo(res.data?.results ?? res.data ?? []);
    } catch {
      setHistorialEquipo([]);
    } finally {
      setHistLoading(false);
    }
  }

  async function openViewModal(m) {
    setActive(m);
    setOpenView(true);
    await loadHistorialEquipo(m);
  }

  function openEditModal(m) {
    setActive(m);
    setEditErr("");

    setEditForm({
      codigo_estado_mantenimiento_id:
        String(m?.codigo_estado_mantenimiento ?? m?.estado_mantenimiento?.codigo_estado_mantenimiento ?? "") || "",
      diagnostico_tecnico: m?.diagnostico_tecnico || "",
      solucion_aplicada: m?.solucion_aplicada || "",
      fecha_ingreso_taller: m?.fecha_ingreso_taller || "",
      fecha_salida_taller: m?.fecha_salida_taller || "",
      fecha_entrega: m?.fecha_entrega || "",
      observaciones: m?.observaciones || "",
    });

    setOpenEdit(true);
    loadHistorialEquipo(m);
  }

  // ✅ saveEdit correcto: NO manda estado si está vacío (para que el backend auto-calcule por fechas)
  async function saveEdit() {
    if (!active?.id_mantenimiento) return;

    setEditSaving(true);
    setEditErr("");
    try {
      const payload = {
        diagnostico_tecnico: editForm.diagnostico_tecnico || "",
        solucion_aplicada: editForm.solucion_aplicada || "",
        fecha_ingreso_taller: editForm.fecha_ingreso_taller || null,
        fecha_salida_taller: editForm.fecha_salida_taller || null,
        fecha_entrega: editForm.fecha_entrega || null,
        observaciones: editForm.observaciones || "",
      };

      if (editForm.codigo_estado_mantenimiento_id) {
        payload.codigo_estado_mantenimiento_id = Number(editForm.codigo_estado_mantenimiento_id);
      }

      await api.patch(`/mantenimientos/${active.id_mantenimiento}/`, payload);

      setOpenEdit(false);
      await loadMantenimientos(page);
    } catch (e) {
      const data = e?.response?.data;
      if (data && typeof data === "object") {
        const firstKey = Object.keys(data)[0];
        const msg = Array.isArray(data[firstKey]) ? data[firstKey][0] : String(data[firstKey]);
        setEditErr(msg || "No se pudo guardar.");
      } else {
        setEditErr(e?.message || "No se pudo guardar.");
      }
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div>
      {loadingCatalogos && tipos.length === 0 ? (
        <div className="empty">Cargando catálogos…</div>
      ) : null}

      {/* Header */}
      <div className="headerRow">
        <div>
          <h1 className="title">Mantenciones</h1>
          <div className="sub">Lista, filtra, revisa historial y edita mantenciones.</div>
        </div>

        <div className="headerActions">
          <button className="secondaryBtn" onClick={() => loadMantenimientos(page)} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
          <button className="primaryBtn" onClick={openNewModal}>
            + Nueva mantención
          </button>
        </div>
      </div>

      {err ? <div className="error">{err}</div> : null}

      {/* Filtros */}
      <div className="filtersCard">
        <div className="filtersGrid">
          {/* Buscar equipo */}
          <div>
            <div className="label">Equipo</div>
            <div className="u-grid-gap-8">
              <input
                value={qEquipo}
                onChange={(e) => {
                  const v = e.target.value;
                  setQEquipo(v);
                  searchEquipos(v);
                }}
                placeholder="Buscar (inventario / serie / modelo)…"
                className="input"
              />

              {equipos.length > 0 ? (
                <div className="suggestBox">
                  {equipos.map((eq) => (
                    <button
                      key={eq.id_equipo}
                      className="suggestItem"
                      onClick={() => {
                        setEquipoSel(eq);
                        setEquipos([]);
                        setQEquipo(`${eq.numero_inventario || "—"} · ${eq.modelo || ""}`.trim());
                      }}
                      title="Seleccionar equipo"
                    >
                      <div className="u-fw-900 u-text-strong">{eq.numero_inventario || "—"}</div>
                      <div className="u-fs-12 u-text-muted">
                        {eq.modelo || "Sin modelo"} · {eq.numero_serie || "Sin serie"}
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}

              {equipoSel ? (
                <div className="selectedPillRow">
                  <div className="selectedPill">
                    ✅ {equipoSel.numero_inventario || "Equipo"}{" "}
                    <span className="u-text-muted u-fw-800">· {equipoSel.modelo || "Sin modelo"}</span>
                  </div>
                  <button className="clearBtn" onClick={() => { setEquipoSel(null); setQEquipo(""); }}>
                    Quitar
                  </button>
                </div>
              ) : (
                <div className="help">Tip: escribe al menos 2 caracteres para buscar equipos.</div>
              )}
            </div>
          </div>

          {/* Tipo mantención */}
          <div>
            <div className="label">Tipo mantención</div>
            <select value={tipoSel} onChange={(e) => setTipoSel(e.target.value)} className="input">
              <option value="">(Todos)</option>
              {tipos.map((t) => (
                <option key={t.codigo_tipo_mantenimiento} value={String(t.codigo_tipo_mantenimiento)}>
                  {t.descripcion}
                </option>
              ))}
            </select>
            <div className="help">Filtro visual (no afecta el backend).</div>
          </div>

          {/* Recientes */}
          <div>
            <div className="label">Vista</div>
            <label className="checkRow">
              <input type="checkbox" checked={soloRecientes} onChange={(e) => setSoloRecientes(e.target.checked)} />
              <span className="u-fw-900">Solo últimos 30 días</span>
            </label>
            <div className="help">Útil para ver lo importante del mes.</div>
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

          <div className="u-flex-center-gap-8">
            <button
              className="smallBtn"
              onClick={() => {
                const p = Math.max(page - 1, 1);
                setPage(p);
                loadMantenimientos(p);
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
                loadMantenimientos(p);
              }}
              disabled={loading || page >= totalPages}
            >
              →
            </button>
          </div>
        </div>

        <div className="u-p-14">
          {!loading && rows.length === 0 ? (
            <div className="empty">No hay mantenciones para mostrar con estos filtros.</div>
          ) : (
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">ID</th>
                    <th className="th">Equipo</th>
                    <th className="th">Tipo</th>
                    <th className="th">Solicitud</th>
                    <th className="th">Estado</th>
                    <th className="th">Problema</th>
                    <th className="thRight">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((m) => {
                    const estadoLabel = resolveEstadoMant(m);
                    return (
                      <tr key={m.id_mantenimiento}>
                        <td className="tdMono">{m.id_mantenimiento}</td>

                        <td className="td">
                          <div className="u-fw-1000 u-text-strong">
                            {m?.equipo?.numero_inventario || "—"}
                          </div>
                          <div className="u-fs-12 u-text-muted">
                            {m?.equipo?.modelo || "Sin modelo"}
                          </div>
                        </td>

                        <td className="td">{m?.tipo_mantenimiento?.descripcion || "—"}</td>
                        <td className="td">{formatDate(m?.fecha_solicitud)}</td>

                        <td className="td">
                          <span className={pillClassByEstado(estadoLabel)}>{estadoLabel}</span>
                        </td>

                        <td className="td">
                          <div className="clamp2">{m?.problema_reportado || "—"}</div>
                        </td>

                        <td className="tdRight">
                          <div className="u-flex-gap-8 u-justify-end">
                            <button className="smallBtn" onClick={() => openViewModal(m)}>
                              Ver
                            </button>
                            <button className="smallBtn" onClick={() => openEditModal(m)}>
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Nueva mantención */}
      {openNew ? (
        <div className="modalOverlay" onMouseDown={() => setOpenNew(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <div className="modalTitle">Nueva mantención</div>
                <div className="modalSub">Crea una solicitud y queda registrada en el sistema.</div>
              </div>
              <button className="iconBtn" onClick={() => setOpenNew(false)} title="Cerrar">
                ✕
              </button>
            </div>

            {formErr ? <div className="error">{formErr}</div> : null}

            <div className="formGrid">
              <div className="u-col-span-all">
                <div className="label">Equipo *</div>
                <div className="u-grid-auto-gap-10">
                  <input
                    value={form.id_equipo_id ? `ID: ${form.id_equipo_id}` : ""}
                    placeholder="Selecciona equipo desde el filtro o escribe un ID…"
                    onChange={(e) => setForm((p) => ({ ...p, id_equipo_id: e.target.value.replace(/[^\d]/g, "") }))}
                    className="input"
                  />
                  <button
                    className="secondaryBtn"
                    onClick={() => {
                      if (equipoSel?.id_equipo) setForm((p) => ({ ...p, id_equipo_id: String(equipoSel.id_equipo) }));
                    }}
                  >
                    Usar seleccionado
                  </button>
                </div>
                <div className="help">Recomendado: elige un equipo arriba y presiona “Usar seleccionado”.</div>
              </div>

              <div>
                <div className="label">Tipo mantención *</div>
                <select
                  value={form.codigo_tipo_mantenimiento_id}
                  onChange={(e) => setForm((p) => ({ ...p, codigo_tipo_mantenimiento_id: e.target.value }))}
                  className="input"
                >
                  <option value="">Selecciona…</option>
                  {tipos.map((t) => (
                    <option key={t.codigo_tipo_mantenimiento} value={String(t.codigo_tipo_mantenimiento)}>
                      {t.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="label">Fecha solicitud *</div>
                <input
                  type="date"
                  value={form.fecha_solicitud}
                  onChange={(e) => setForm((p) => ({ ...p, fecha_solicitud: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="u-col-span-all">
                <div className="label">Problema reportado</div>
                <textarea
                  value={form.problema_reportado}
                  onChange={(e) => setForm((p) => ({ ...p, problema_reportado: e.target.value }))}
                  rows={3}
                  className="textarea"
                />
              </div>

              <div className="u-col-span-all">
                <div className="label">Observaciones</div>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
                  rows={3}
                  className="textarea"
                />
              </div>
            </div>

            <div className="modalFooter">
              <button className="secondaryBtn" onClick={() => setOpenNew(false)} disabled={saving}>
                Cancelar
              </button>
              <button className="primaryBtn" onClick={createMantenimiento} disabled={saving}>
                {saving ? "Guardando…" : "Crear mantención"}
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
                <div className="modalTitle">Mantención #{active.id_mantenimiento}</div>
                <div className="modalSub">
                  {active?.equipo?.numero_inventario || "Equipo"} · {active?.equipo?.modelo || "Sin modelo"}
                </div>
              </div>
              <button className="iconBtn" onClick={() => setOpenView(false)} title="Cerrar">
                ✕
              </button>
            </div>

            <div className="u-p-16 u-grid-gap-12">
              <div className="kvGrid">
                <KV label="Tipo" value={active?.tipo_mantenimiento?.descripcion || "—"} />
                <KV label="Estado" value={resolveEstadoMant(active)} />
                <KV label="Solicitud" value={formatDate(active?.fecha_solicitud)} />
                <KV label="Ingreso taller" value={formatDate(active?.fecha_ingreso_taller)} />
                <KV label="Salida taller" value={formatDate(active?.fecha_salida_taller)} />
                <KV label="Entrega" value={formatDate(active?.fecha_entrega)} />
              </div>

              <div className="section">
                <div className="sectionTitle">Problema</div>
                <div className="sectionBody">{active?.problema_reportado || "—"}</div>
              </div>

              <div className="section">
                <div className="sectionTitle">Diagnóstico</div>
                <div className="sectionBody">{active?.diagnostico_tecnico || "—"}</div>
              </div>

              <div className="section">
                <div className="sectionTitle">Solución</div>
                <div className="sectionBody">{active?.solucion_aplicada || "—"}</div>
              </div>

              <div className="section">
                <div className="sectionTitle">Historial del equipo</div>
                {histLoading ? (
                  <div className="help">Cargando historial…</div>
                ) : historialEquipo.length === 0 ? (
                  <div className="help">No hay historial de estados para este equipo.</div>
                ) : (
                  <div className="histList">
                    {historialEquipo.slice(0, 8).map((h) => (
                      <div key={h.id_historial_estado} className="histItem">
                        <div className="u-fw-1000">
                          {h?.codigo_estado_anterior?.descripcion || "—"} → {h?.codigo_estado_nuevo?.descripcion || "—"}
                        </div>
                        <div className="u-fs-12 u-text-muted">
                          {formatDateTime(h?.fecha_cambio)} · {h?.motivo_detallado || "—"}
                        </div>
                      </div>
                    ))}
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
                <div className="modalTitle">Editar mantención #{active.id_mantenimiento}</div>
                <div className="modalSub">
                  {active?.equipo?.numero_inventario || "Equipo"} · {active?.equipo?.modelo || "Sin modelo"}
                </div>
              </div>
              <button className="iconBtn" onClick={() => setOpenEdit(false)} title="Cerrar">
                ✕
              </button>
            </div>

            {editErr ? <div className="error">{editErr}</div> : null}

            {/* ✅ Bloque PRO: acciones rápidas */}
            <div className="u-px16-pb12">
              <div className="label">Acciones rápidas</div>
              <div className="u-flex-gap-8 u-wrap">
                <button className="smallBtn" type="button" onClick={() => applyQuickStatus("taller")}>
                  🛠️ Marcar “En taller”
                </button>
                <button className="smallBtn" type="button" onClick={() => applyQuickStatus("terminado")}>
                  ✅ Marcar “Terminado”
                </button>
                <button className="smallBtn" type="button" onClick={() => applyQuickStatus("entregado")}>
                  📦 Marcar “Entregado”
                </button>
                <button className="smallBtn" type="button" onClick={() => applyQuickStatus("reset")}>
                  ↩️ Reset fechas/estado
                </button>
              </div>
              <div className="help">
                Tip: si dejas “Estado” vacío y solo pones fechas, el backend lo calcula automático.
              </div>
            </div>

            <div className="formGrid">
              <div>
                <div className="label">Estado</div>
                <select
                  value={editForm.codigo_estado_mantenimiento_id}
                  onChange={(e) => setEditForm((p) => ({ ...p, codigo_estado_mantenimiento_id: e.target.value }))}
                  className="input"
                >
                  <option value="">(Sin estado)</option>
                  {estadosMant.map((s) => (
                    <option key={s.codigo_estado_mantenimiento} value={String(s.codigo_estado_mantenimiento)}>
                      {s.descripcion}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="label">Ingreso taller</div>
                <input
                  type="date"
                  value={editForm.fecha_ingreso_taller || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, fecha_ingreso_taller: e.target.value }))}
                  className="input"
                />
              </div>

              <div>
                <div className="label">Salida taller</div>
                <input
                  type="date"
                  value={editForm.fecha_salida_taller || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, fecha_salida_taller: e.target.value }))}
                  className="input"
                />
              </div>

              <div>
                <div className="label">Entrega</div>
                <input
                  type="date"
                  value={editForm.fecha_entrega || ""}
                  onChange={(e) => setEditForm((p) => ({ ...p, fecha_entrega: e.target.value }))}
                  className="input"
                />
              </div>

              <div className="u-col-span-all">
                <div className="label">Diagnóstico</div>
                <textarea
                  value={editForm.diagnostico_tecnico}
                  onChange={(e) => setEditForm((p) => ({ ...p, diagnostico_tecnico: e.target.value }))}
                  rows={3}
                  className="textarea"
                />
              </div>

              <div className="u-col-span-all">
                <div className="label">Solución aplicada</div>
                <textarea
                  value={editForm.solucion_aplicada}
                  onChange={(e) => setEditForm((p) => ({ ...p, solucion_aplicada: e.target.value }))}
                  rows={3}
                  className="textarea"
                />
              </div>

              <div className="u-col-span-all">
                <div className="label">Observaciones</div>
                <textarea
                  value={editForm.observaciones}
                  onChange={(e) => setEditForm((p) => ({ ...p, observaciones: e.target.value }))}
                  rows={3}
                  className="textarea"
                />
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

function KV({ label, value }) {
  return (
    <div className="kv">
      <div className="kvLabel">{label}</div>
      <div className="kvValue">{value ?? "—"}</div>
    </div>
  );
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

function formatDateTime(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${mi}`;
}
