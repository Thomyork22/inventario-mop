import { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const [statsRes, histRes] = await Promise.all([
        api.get("/dashboard/stats/"),
        api.get("/historial-estados/", {
          params: { ordering: "-id_historial_estado", page: 1 },
        }),
      ]);

      setStats(statsRes.data);

      const list = histRes.data?.results ?? histRes.data ?? [];
      setHistorial(list.slice(0, 8));
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.message || "Error cargando dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const sedeData = useMemo(() => stats?.por_sede ?? [], [stats]);
  const totalInventario = Number(stats?.total || 0);

  function goInventarioPorSede(sedeItem) {
    const ubicId = sedeItem?.id_ubicacion ?? sedeItem?.id_ubicacion_id ?? "";
    if (!ubicId) {
      window.location.href = "/inventario";
      return;
    }
    const params = new URLSearchParams();
    params.set("id_ubicacion", String(ubicId));
    window.location.href = `/inventario?${params.toString()}`;
  }

  return (
    <div>
      {/* Header */}
      <div className="headerRow">
        <div>
          <h1 className="title">Dashboard</h1>
          <div className="sub">
            Resumen inteligente del inventario · estados · sedes · garantías.
          </div>
        </div>

        <div className="headerActions">
          <button className="secondaryBtn" onClick={loadAll} disabled={loading}>
            {loading ? "Actualizando…" : "Actualizar"}
          </button>

          <button
            className="primaryBtn"
            onClick={() => (window.location.href = "/inventario")}
            title="Ir a Inventario"
          >
            Ir a Inventario →
          </button>
        </div>
      </div>

      {/* Estado */}
      {err ? <div className="error">{err}</div> : null}

      {/* KPIs */}
      <div className="kpiGrid">
        <KpiCard
          title="Total equipos"
          value={loading ? "—" : stats?.total ?? 0}
          hint="Registrados en el sistema"
          icon="📦"
        />
        <KpiCard
          title="Libres"
          value={loading ? "—" : stats?.libres ?? 0}
          hint="Disponibles para asignación"
          icon="🟢"
        />
        <KpiCard
          title="Ocupados"
          value={loading ? "—" : stats?.ocupados ?? 0}
          hint="Asignados a funcionario"
          icon="🔵"
        />
        <KpiCard
          title="En mantenimiento"
          value={loading ? "—" : stats?.mantenimiento ?? 0}
          hint="Revisando/diagnóstico/taller"
          icon="🛠️"
        />
        <KpiCard
          title="Garantías por vencer"
          value={loading ? "—" : stats?.garantias_por_vencer ?? 0}
          hint="Próximos 30 días"
          icon="⏳"
          accent="warn"
        />
      </div>

      {/* Layout principal */}
      <div className="mainGrid">
        {/* Acciones rápidas */}
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Acciones rápidas</div>
              <div className="cardSub">Atajos típicos del flujo</div>
            </div>
          </div>

          <div className="u-p-14 u-grid-gap-10">
            <QuickAction
              title="Gestionar inventario"
              desc="Buscar, filtrar y abrir detalles de equipos"
              onClick={() => (window.location.href = "/inventario")}
              icon="📋"
            />
            <QuickAction
              title="Crear equipo nuevo"
              desc="Ingresar un equipo al inventario"
              onClick={() => (window.location.href = "/inventario")}
              icon="➕"
            />
            <QuickAction
              title="Ver asignaciones"
              desc="Revisar asignaciones activas y devoluciones"
              onClick={() => (window.location.href = "/inventario")}
              icon="👤"
            />
          </div>
        </div>

        {/* Chart por sede */}
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Equipos por sede</div>
              <div className="cardSub">Distribución por sede (% del inventario total)</div>
            </div>

            <button
              className="smallBtn"
              onClick={() => (window.location.href = "/inventario")}
              title="Ver detalle en Inventario"
            >
              Ver detalle
            </button>
          </div>

          <div className="u-p-14">
            {!loading && sedeData.length === 0 ? (
              <div className="empty">No hay datos de sedes aún.</div>
            ) : (
              <div className="u-grid-gap-10">
                {sedeData.map((x, idx) => {
                  const totalSede = Number(x?.total || 0);
                  const pctTotal = totalInventario
                    ? (totalSede / totalInventario) * 100
                    : 0;
                  const pctLabel = `${pctTotal.toFixed(1)}%`;

                  return (
                    <button
                      key={`${x.sede}-${idx}`}
                      className="barRowBtn"
                      onClick={() => goInventarioPorSede(x)}
                      title="Ver inventario de esta sede"
                    >
                      <div className="barLabelWrap">
                        <div className="barLabelLine">
                          <span className="barLabelText">{x.sede}</span>
                          <span className="barPct">({pctLabel})</span>
                        </div>

                        <div className="barMini">
                          <span className="badge">🟢 {x.libres ?? 0}</span>
                          <span className="badge">🔵 {x.ocupados ?? 0}</span>
                          <span className="badge">🛠️ {x.mantenimiento ?? 0}</span>
                        </div>
                      </div>

                      <div className="barTrack">
                        <div
                          className="barFill"
                          style={{ width: `${Math.max(0, Math.min(100, pctTotal))}%` }}
                          aria-label={`${x.sede}: ${pctLabel}`}
                        />
                      </div>

                      <div className="barValue">{totalSede}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Últimos movimientos</div>
              <div className="cardSub">Cambios recientes de estado</div>
            </div>

            <button className="smallBtn" onClick={loadAll} disabled={loading}>
              {loading ? "…" : "Refrescar"}
            </button>
          </div>

          <div className="u-p-14">
            {!loading && historial.length === 0 ? (
              <div className="empty">Aún no hay movimientos registrados.</div>
            ) : (
              <div className="activityList">
                {historial.map((h) => (
                  <div key={h.id_historial_estado} className="activityItem">
                    <div className="activityLeft">
                      <div className="activityTitle">
                        <span className="mono">
                          {h?.equipo?.numero_inventario || "—"}
                        </span>

                        <span className="u-mx-8 u-text-light">→</span>

                        <span className="pill">
                          {h?.estado_nuevo?.descripcion || "Estado"}
                        </span>
                      </div>

                      <div className="activitySub">
                        {h?.motivo_detallado || "—"}
                      </div>
                    </div>

                    <div className="activityRight">
                      <div className="activityDate">
                        {formatDateTime(h?.fecha_cambio)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="note">
        Siguiente módulo recomendado: <b>Mantenimientos</b> (lista + crear + filtro por equipo).
      </div>
    </div>
  );
}

/* ---------------- UI Pieces ---------------- */

function KpiCard({ title, value, hint, icon, accent }) {
  return (
    <div className={`kpiCard dash-kpi-card${accent === "warn" ? " is-warn" : ""}`}>
      <div className="kpiTop">
        <div className="kpiTitle">{title}</div>
        <div className="kpiIcon">{icon}</div>
      </div>
      <div className="kpiValue">{value}</div>
      <div className="kpiHint">{hint}</div>
    </div>
  );
}

function QuickAction({ title, desc, onClick, icon }) {
  return (
    <button className="quickAction" onClick={onClick}>
      <div className="quickIcon">{icon}</div>
      <div className="u-text-left">
        <div className="quickTitle">{title}</div>
        <div className="quickDesc">{desc}</div>
      </div>
      <div className="quickArrow">→</div>
    </button>
  );
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

/* ---------------- Styles ---------------- */
