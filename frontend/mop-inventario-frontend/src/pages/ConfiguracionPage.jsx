import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import { useTheme } from "../global/useTheme";

export default function ConfiguracionPage() {
  const [me, setMe] = useState(null);
  const [meErr, setMeErr] = useState("");

  const { darkMode, toggleDarkMode } = useTheme();

  const [compactTable, setCompactTable] = useState(
    () => localStorage.getItem("pref_compact_table") === "true"
  );

  const [sedes, setSedes] = useState([]);
  const [sedesErr, setSedesErr] = useState("");

  const [pingStatus, setPingStatus] = useState("idle");
  const [pingMsg, setPingMsg] = useState("");

  const apiBaseUrl =
    import.meta?.env?.VITE_API_BASE_URL ||
    "(no definido) - revisa VITE_API_BASE_URL en .env";

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

  async function loadSedes() {
    setSedesErr("");
    try {
      const res = await api.get("/catalogos/ubicaciones/");
      const list = res.data?.results ?? res.data ?? [];
      setSedes(list);
    } catch (e) {
      setSedesErr(
        e?.response?.data?.detail || e?.message || "No se pudieron cargar sedes"
      );
    }
  }

  useEffect(() => {
    loadMe();
    loadSedes();
  }, []);

  const sedesOrdenadas = useMemo(() => {
    const arr = Array.isArray(sedes) ? [...sedes] : [];
    arr.sort((a, b) =>
      String(a?.nombre_sede || "").localeCompare(String(b?.nombre_sede || ""))
    );
    return arr;
  }, [sedes]);

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
          <button className="btn btn-secondary" onClick={() => { loadMe(); loadSedes(); }}>
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
            <button className="btn btn-small" onClick={loadSedes}>
              Actualizar sedes
            </button>
          }
        >
          {sedesErr ? <div className="status-box status-error">{sedesErr}</div> : null}

          {sedesOrdenadas.length === 0 ? (
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
