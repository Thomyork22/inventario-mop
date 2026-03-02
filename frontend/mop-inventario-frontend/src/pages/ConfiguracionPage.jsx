import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/api";
import { useCatalogos } from "../catalogos/CatalogosContext.jsx";
import { useTheme } from "../global/useTheme";

export default function ConfiguracionPage() {
  const { data: catalogosData, loading: loadingCatalogos, errors: catalogosErrors, reload } = useCatalogos();
  const [me, setMe] = useState(null);
  const [meErr, setMeErr] = useState("");

  const { darkMode, toggleDarkMode } = useTheme();

  const [compactTable, setCompactTable] = useState(
    () => localStorage.getItem("pref_compact_table") === "true"
  );

  const [pingStatus, setPingStatus] = useState("idle");
  const [pingMsg, setPingMsg] = useState("");
  const [importPath, setImportPath] = useState("inventariop.xlsx");
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState("idle");
  const [importErr, setImportErr] = useState("");
  const [importSummary, setImportSummary] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [rollbackStatus, setRollbackStatus] = useState("idle");
  const [rollbackMsg, setRollbackMsg] = useState("");
  const fileInputRef = useRef(null);

  const apiBaseUrl =
    import.meta?.env?.VITE_API_URL ||
    "(no definido) - revisa VITE_API_URL en .env";

  useEffect(() => {
    localStorage.setItem("pref_compact_table", String(compactTable));
  }, [compactTable]);

  async function loadMe() {
    setMeErr("");
    try {
      const res = await api.get("/me/");
      setMe(res.data);
    } catch (e) {
      setMeErr(e?.response?.data?.detail || e?.message || "No se pudo cargar /me/");
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  const sedesOrdenadas = useMemo(() => {
    const sedes = catalogosData.sedes ?? [];
    const arr = Array.isArray(sedes) ? [...sedes] : [];
    arr.sort((a, b) =>
      String(a?.nombre_sede || "").localeCompare(String(b?.nombre_sede || ""))
    );
    return arr;
  }, [catalogosData]);

  const sedesErr = useMemo(() => {
    return catalogosErrors?.sedes || "";
  }, [catalogosErrors]);

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
  }

  async function pingApi() {
    setPingStatus("loading");
    setPingMsg("");
    try {
      await api.get("/dashboard/stats/");
      setPingStatus("ok");
      setPingMsg("Conexion OK (dashboard/stats respondio)");
    } catch (e) {
      setPingStatus("err");
      setPingMsg(e?.response?.data?.detail || e?.message || "Fallo la conexion");
    }
  }

  async function importInventario() {
    const sourceLabel = importFile?.name || String(importPath || "inventariop.xlsx").trim() || "inventariop.xlsx";
    const confirmed = window.confirm(
      `Se importará el inventario desde:\n\n${sourceLabel}\n\nEsto puede crear o actualizar registros. ¿Deseas continuar?`
    );
    if (!confirmed) {
      return;
    }

    setImportStatus("loading");
    setImportErr("");
    setImportSummary(null);
    setRollbackMsg("");
    setImportProgress(8);

    let progressTimer = null;

    try {
      progressTimer = window.setInterval(() => {
        setImportProgress((prev) => {
          if (prev >= 92) return prev;
          const next = prev + (prev < 40 ? 12 : prev < 70 ? 7 : 3);
          return Math.min(next, 92);
        });
      }, 220);

      let res;
      if (importFile) {
        const formData = new FormData();
        formData.append("file", importFile);
        if (String(importPath || "").trim()) {
          formData.append("path", String(importPath).trim());
        }
        res = await api.post("/import/inventario-excel/", formData);
      } else {
        const payload = {};
        if (String(importPath || "").trim()) {
          payload.path = String(importPath).trim();
        }
        res = await api.post("/import/inventario-excel/", payload);
      }

      if (progressTimer) window.clearInterval(progressTimer);
      setImportProgress(100);
      setImportSummary(res.data);
      setImportStatus("ok");
    } catch (e) {
      if (progressTimer) window.clearInterval(progressTimer);
      setImportProgress(100);
      setImportStatus("err");
      setImportSummary(null);
      const data = e?.response?.data;
      setImportErr(
        data?.error ||
        data?.detail ||
        e?.message ||
        "No se pudo importar el inventario."
      );
    } finally {
      if (progressTimer) window.clearInterval(progressTimer);
      window.setTimeout(() => {
        setImportProgress((prev) => (prev === 100 ? 0 : prev));
      }, 900);
    }
  }

  async function rollbackLastImport() {
    const confirmed = window.confirm(
      "Se revertirá el último lote de importación registrado. Esto eliminará lo creado y restaurará cambios rastreados. ¿Deseas continuar?"
    );
    if (!confirmed) {
      return;
    }

    setRollbackStatus("loading");
    setRollbackMsg("");

    try {
      const res = await api.post("/import/inventario-excel/rollback/", {});
      setRollbackStatus("ok");
      setImportSummary(null);
      setImportErr("");
      setRollbackMsg(
        `Rollback completado. Lote #${res.data.id_lote} · ${res.data.registros_revertidos} registros revertidos.`
      );
    } catch (e) {
      setRollbackStatus("err");
      const data = e?.response?.data;
      setRollbackMsg(
        data?.error ||
        data?.detail ||
        e?.message ||
        "No se pudo revertir la importación."
      );
    }
  }

  return (
    <div className="config-page">
      <div className="config-header-row">
        <div>
          <h1 className="config-title">Configuración</h1>
          <div className="config-sub">
            Sesión, preferencias, sedes y diagnóstico del sistema.
          </div>
        </div>

        <div className="config-header-actions">
          <button className="btn btn-secondary" onClick={() => { loadMe(); reload(); }}>
            Recargar
          </button>
        </div>
      </div>

      <div className="config-grid">
        <Card
          title="Sesión"
          subtitle="Usuario autenticado y acciones rápidas"
          right={
            <button className="btn btn-danger" onClick={logout} title="Cerrar sesión">
              Cerrar sesión
            </button>
          }
        >
          {meErr ? <div className="status-box status-error">{meErr}</div> : null}

          <div className="config-kv-grid">
            <KV label="Usuario" value={me?.username || me?.email || "-"} />
            <KV
              label="Nombre"
              value={
                me?.first_name
                  ? `${me.first_name} ${me?.last_name || ""}`
                  : me?.full_name || "-"
              }
            />
            <KV label="Email" value={me?.email || "-"} />
            <KV
              label="Permisos / grupos"
              value={
                me?.groups?.length ? me.groups.join(", ") : me?.is_staff ? "staff" : "-"
              }
            />
          </div>
        </Card>

        <Card
          title="Preferencias"
          subtitle="Se guardan en este navegador (localStorage)"
        >
          <ToggleRow
            title="Modo oscuro"
            desc="Aplica tema oscuro global"
            checked={darkMode}
            onChange={toggleDarkMode}
          />
          <Divider />
          <ToggleRow
            title="Tabla compacta"
            desc="Útil para ver más filas en Inventario"
            checked={compactTable}
            onChange={() => setCompactTable((v) => !v)}
          />
          <div className="config-mini-note">
            Tip: si quieres que Inventario use "compacta", después lo leemos desde
            <b> pref_compact_table</b>.
          </div>
        </Card>

        <Card
          title="Sedes"
          subtitle="Ubicaciones registradas (catálogo)"
          right={
            <button className="btn btn-small" onClick={reload}>
              Actualizar sedes
            </button>
          }
        >
          {sedesErr ? <div className="status-box status-error">{sedesErr}</div> : null}

          {loadingCatalogos && sedesOrdenadas.length === 0 ? (
            <div className="status-box status-empty">Cargando sedes…</div>
          ) : sedesOrdenadas.length === 0 ? (
            <div className="status-box status-empty">Aún no hay sedes cargadas.</div>
          ) : (
            <div className="config-sede-list">
              {sedesOrdenadas.map((s) => (
                <div key={s.id_ubicacion} className="config-sede-item">
                  <div className="config-sede-title">{s.nombre_sede}</div>
                  <div className="config-sede-sub">
                    ID: <span className="mono-text">{s.id_ubicacion}</span>
                    {s?.region?.nombre ? ` - Región: ${s.region.nombre}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="Sistema"
          subtitle="Diagnóstico y configuración del API"
          right={
            <button
              className={`btn btn-primary${pingStatus === "loading" ? " is-loading" : ""}`}
              onClick={pingApi}
              disabled={pingStatus === "loading"}
            >
              {pingStatus === "loading" ? "Probando..." : "Probar conexión API"}
            </button>
          }
        >
          <div className="config-kv-grid">
            <KV label="API base" value={apiBaseUrl} />
            <KV
              label="Estado"
              value={pingStatus === "ok" ? "OK" : pingStatus === "err" ? "Error" : "-"}
            />
          </div>

          {pingMsg ? (
            <div
              className={`status-box status-notice${
                pingStatus === "ok"
                  ? " status-ok"
                  : pingStatus === "err"
                    ? " status-error-soft"
                    : ""
              }`}
            >
              {pingMsg}
            </div>
          ) : (
            <div className="config-mini-note">
              Esto sirve para confirmar que el front está pegándole al backend correcto.
            </div>
          )}
        </Card>

        <Card
          title="Importación"
          subtitle="Carga inventario desde Excel y muestra el resumen del proceso"
          right={
            <div className="config-import-actions">
              <button
                className="btn btn-secondary"
                onClick={rollbackLastImport}
                disabled={importStatus === "loading" || rollbackStatus === "loading"}
              >
                {rollbackStatus === "loading" ? "Revirtiendo..." : "Revertir último lote"}
              </button>
              <button
                className={`btn btn-primary${importStatus === "loading" ? " is-loading" : ""}`}
                onClick={importInventario}
                disabled={importStatus === "loading" || rollbackStatus === "loading"}
              >
                {importStatus === "loading" ? "Importando..." : "Importar Excel"}
              </button>
            </div>
          }
        >
          <div className="config-import-shell">
            <label className="config-import-field">
              <span className="config-k-label">Ruta del archivo</span>
              <input
                className="config-import-input"
                value={importPath}
                onChange={(e) => setImportPath(e.target.value)}
                placeholder="inventariop.xlsx"
              />
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="config-import-hidden-input"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />

            <div className="config-import-file-row">
              <button
                className="config-import-file-btn"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                {importFile ? "Cambiar archivo" : "Elegir archivo Excel"}
              </button>

              <div className={`config-import-file-pill${importFile ? " is-filled" : ""}`}>
                {importFile ? importFile.name : "Sin archivo seleccionado"}
              </div>

              {importFile ? (
                <button
                  className="btn btn-small"
                  onClick={() => {
                    setImportFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  type="button"
                >
                  Quitar
                </button>
              ) : null}
            </div>

            <div className="config-mini-note">
              Puedes subir un archivo `.xlsx` desde aquí o usar una ruta relativa/absoluta en el campo superior.
            </div>

            {importErr ? (
              <div className="status-box status-error">{importErr}</div>
            ) : null}

            {rollbackMsg ? (
              <div className={`status-box status-notice${rollbackStatus === "ok" ? " status-ok" : rollbackStatus === "err" ? " status-error-soft" : ""}`}>
                {rollbackMsg}
              </div>
            ) : null}

            {importStatus === "loading" || importProgress > 0 ? (
              <div className="config-import-progress-wrap">
                <div className="config-import-progress-head">
                  <span className="config-k-label">
                    {importStatus === "loading" ? "Procesando importación" : "Proceso finalizado"}
                  </span>
                  <span className="config-import-progress-text">{importProgress}%</span>
                </div>
                <div className="config-import-progress-track">
                  <div
                    className={`config-import-progress-bar${importStatus === "ok" ? " is-ok" : importStatus === "err" ? " is-err" : ""}`}
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            ) : null}

            {importStatus === "ok" && importSummary ? (
              <>
                <div className="config-import-grid">
                  <ImportMetric label="Filas procesadas" value={importSummary.total_rows} />
                  <ImportMetric label="Funcionarios creados" value={importSummary.funcionarios_created} />
                  <ImportMetric label="Funcionarios actualizados" value={importSummary.funcionarios_updated} />
                  <ImportMetric label="Equipos creados" value={importSummary.equipos_created} />
                  <ImportMetric label="Equipos actualizados" value={importSummary.equipos_updated} />
                  <ImportMetric label="Asignaciones creadas" value={importSummary.asignaciones_created} />
                  <ImportMetric label="Monitores creados" value={importSummary.monitores_created} />
                  <ImportMetric label="Errores" value={importSummary.errores?.length || 0} accent={importSummary.errores?.length ? "warn" : "ok"} />
                </div>

                {Array.isArray(importSummary.errores) && importSummary.errores.length > 0 ? (
                  <div className="config-import-errors">
                    {importSummary.errores.slice(0, 8).map((item, idx) => (
                      <div key={`${idx}-${item}`} className="config-import-error-item">
                        {item}
                      </div>
                    ))}
                    {importSummary.errores.length > 8 ? (
                      <div className="config-mini-note">
                        Se muestran 8 errores. Total: {importSummary.errores.length}.
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="status-box status-notice status-ok">
                    Importación completada sin errores.
                  </div>
                )}
              </>
            ) : (
              <div className="config-mini-note">
                Al ejecutar, verás aquí el resumen completo de creación, actualización y errores.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, subtitle, right, children }) {
  return (
    <div className="surface-card config-card">
      <div className="config-card-header">
        <div>
          <div className="config-card-title">{title}</div>
          <div className="config-card-sub">{subtitle}</div>
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div className="config-card-content">{children}</div>
    </div>
  );
}

function KV({ label, value }) {
  return (
    <div className="config-kv-item">
      <div className="config-k-label">{label}</div>
      <div className="config-k-value">{value}</div>
    </div>
  );
}

function ImportMetric({ label, value, accent }) {
  return (
    <div className={`config-import-metric${accent ? ` is-${accent}` : ""}`}>
      <div className="config-k-label">{label}</div>
      <div className="config-import-value">{value ?? 0}</div>
    </div>
  );
}

function Divider() {
  return <div className="config-divider" />;
}

function ToggleRow({ title, desc, checked, onChange }) {
  return (
    <button className="config-toggle-row" onClick={onChange}>
      <div className="config-toggle-main">
        <div className="config-toggle-title">{title}</div>
        <div className="config-toggle-desc">{desc}</div>
      </div>

      <div className="config-toggle-right">
        <span className="config-toggle-state">{checked ? "ON" : "OFF"}</span>
        <div className={`config-switch${checked ? " is-on" : ""}`}>
          <div className={`config-switch-knob${checked ? " is-on" : ""}`} />
        </div>
      </div>
    </button>
  );
}
