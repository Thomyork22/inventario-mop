import { useEffect, useMemo, useRef, useState } from "react";

const SHARED_BRAND_MAP = {
  1: "OLIDATA",
  2: "HP",
  3: "DELL",
  4: "LENOVO",
  5: "EPSON",
  6: "COMPAQ",
  7: "PACKARD BELL",
  8: "SONY",
  9: "ASUS",
  10: "VIEWSONIC",
  11: "LG",
  12: "SAMSUNG",
  13: "XEROX",
  14: "ACER",
  15: "APPLE",
  16: "CISCO",
};

const SHARED_MONITOR_SIZE_MAP = {
  0: "N/A",
  1: "15'",
  2: "17'",
  3: "19'",
  4: "20'",
  5: "21'",
  6: "22'",
  7: "24'",
  8: "10'",
  9: "16'",
  10: "16'",
  11: "28'",
  12: "32'",
  13: "43'",
  14: "27'",
};

const RAW_CODE_MAPS = {
  "CONDICIÓN EQUIPO 1 / 2": { 1: "SERVICIO", 2: "ARRIENDO" },
  "TIPO EQUIPO 1/2/OTRO": {
    1: "PC",
    2: "NOTEBOOK",
    3: "PLOTTER",
    4: "DATA SHOW",
    5: "IMPRESORA",
    6: "SCANNER",
    7: "ALL IN ONE",
    8: "WEBCAM",
  },
  "MARCA": SHARED_BRAND_MAP,
  "RAM": {
    0: "N/A",
    1: "1GB",
    2: "2GB",
    3: "4GB",
    4: "8GB",
    5: "3GB",
    6: "6GB",
    7: "12GB",
    8: "14GB",
    9: "16GB",
    10: "32GB",
    11: "256MEGA",
    12: "512 MEGA",
  },
  "PROCESADOR": {
    0: "N/A",
    1: "I3",
    2: "I5",
    3: "I7",
    4: "CORE 2 DUO",
    5: "PENTIUM IV",
    6: "RYZEN 3",
    7: "RYZEN 5",
    8: "RYZEN 7",
    9: "AMD",
    10: "ADM ATHLON",
  },
  "S.O": { 0: "N/A", 1: "WIN10", 2: "WIN7", 3: "WIN11", 4: "WINDXP" },
  "TAMAÑO DISCO": {
    0: "N/A",
    1: "160GB",
    2: "320GB",
    3: "480GB",
    4: "500GB",
    5: "750GB",
    6: "1TB",
    7: "2TB",
    8: "80GB",
    9: "120GB",
    10: "250GB",
    11: "256GB",
    12: "240GB",
    13: "512GB",
  },
  "TIPO DISCO 1/2": { 0: "N/A", 1: "SSD", 2: "HDD", 3: "M.2" },
  "ESTADO ACTUAL ASIGNADO/ BODEGA /EXTRAVIADO/ROBO": {
    1: "ASIGNADO",
    2: "ROBO",
    3: "RETIRAR",
    4: "PRESTAMO",
    5: "BODEGA",
    6: "EXTRAVIADO",
  },
  "MARCA MONITOR 1": SHARED_BRAND_MAP,
  "MARCA MONITOR 2": SHARED_BRAND_MAP,
  "PULGADA MONITOR 1": SHARED_MONITOR_SIZE_MAP,
  "PULGADA MONITOR 2": SHARED_MONITOR_SIZE_MAP,
};

const EXCEL_FIELD_ORDER = [
  "REGIÓN",
  "CONDICIÓN EQUIPO 1 / 2",
  "TIPO EQUIPO 1/2/OTRO",
  "MARCA",
  "RAM",
  "PROCESADOR",
  "S.O",
  "TAMAÑO DISCO",
  "TIPO DISCO 1/2",
  "SERIE ( E)",
  "SIGAC ( E)",
  "NOMBRE DE EQUIPO",
  "IP DE MAQUINA",
  "MARCA MONITOR 1",
  "SERIE MONITOR 1",
  "SIGAC MONITOR 1",
  "PULGADA MONITOR 1",
  "MARCA MONITOR 2",
  "SERIE MONITOR 2",
  "SIGAC MONITOR 2",
  "PULGADA MONITOR 2",
  "ESTADO ACTUAL ASIGNADO/ BODEGA /EXTRAVIADO/ROBO",
  "FECHA DE ASIGNACIÓN / ACTUALIZACIÓN",
  "NOMBRE RESPONSABLE DE ASIGNACIÓN",
  "RUT",
  "NOMBRE",
  "DIRECCIÓN OFICINA / PISO",
  "DEPTO / UNIDAD",
  "CARGO FUNCIONAL",
  "TIPO DE CONTRATO",
  "NUMERO DE ACTA",
  "FECHA DE ENTREGA",
  "OBSERVACIÓN",
];

export default function EquipoDetailModal({
  open,
  onClose,
  equipo,
  onAssign,
  onEdit,
}) {
  const [showRawData, setShowRawData] = useState(false);
  const [visibleCount, setVisibleCount] = useState(60);
  const rawListRef = useRef(null);

  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setShowRawData(false);
      setVisibleCount(60);
    }
  }, [open]);

  useEffect(() => {
    if (!showRawData) return;
    setVisibleCount(60);
  }, [showRawData]);

  const rawData =
    equipo?.raw_excel_data &&
    typeof equipo.raw_excel_data === "object" &&
    !Array.isArray(equipo.raw_excel_data)
      ? equipo.raw_excel_data
      : {};
  const rawRowCount = useMemo(
    () =>
      Object.entries(rawData).filter(([key, value]) => {
        if (key === "__sheet_name" || key === "__excel_row") return false;
        if (!key || /^COLUMNA_\d+$/i.test(key)) return false;
        if (value === null || value === undefined) return false;
        if (typeof value === "string" && value.trim() === "") return false;
        return true;
      }).length,
    [rawData]
  );

  const rawRows = useMemo(() => {
    if (!showRawData) return [];
    return Object.entries(rawData)
      .filter(([key, value]) => {
        if (key === "__sheet_name" || key === "__excel_row") return false;
        if (!key || /^COLUMNA_\d+$/i.test(key)) return false;
        if (value === null || value === undefined) return false;
        if (typeof value === "string" && value.trim() === "") return false;
        return true;
      })
      .sort(
        ([a], [b]) =>
          rawFieldSort(a) - rawFieldSort(b) ||
          normalizeRawKey(a).localeCompare(normalizeRawKey(b))
      );
  }, [rawData, showRawData]);
  const displayedRawRows = rawRows.slice(0, visibleCount);
  const hasMoreRawRows = visibleCount < rawRows.length;

  function onRawListScroll() {
    if (!rawListRef.current || !hasMoreRawRows) return;
    const { scrollTop, scrollHeight, clientHeight } = rawListRef.current;
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 30;
    if (nearBottom) {
      setVisibleCount((prev) => Math.min(prev + 60, rawRows.length));
    }
  }

  const tipoValue = firstPresent(
    equipo?.tipo_equipo?.descripcion,
    readExcelField(equipo, "TIPO EQUIPO  1/2/OTRO")
  );
  const marcaValue = firstPresent(
    equipo?.marca?.descripcion,
    readExcelField(equipo, "MARCA")
  );
  const estadoValue = firstPresent(
    equipo?.estado?.descripcion,
    readExcelField(equipo, "Estado Actual   ASIGNADO/ BODEGA /EXTRAVIADO/ROBO")
  );
  const ubicacionValue = firstPresent(
    equipo?.ubicacion?.nombre_sede,
    inferSedeFromText(firstPresent(equipo?.direccion_oficina_piso, readExcelField(equipo, "DIRECCIÓN OFICINA / PISO"))),
    readExcelField(equipo, "DIRECCIÓN OFICINA / PISO")
  );
  const regionValue = firstPresent(
    equipo?.ubicacion?.region?.nombre,
    readExcelField(equipo, "REGIÓN")
  );
  const nombreEquipoValue = firstPresent(
    equipo?.nombre_equipo,
    readExcelField(equipo, "NOMBRE DE EQUIPO"),
    equipo?.modelo
  );
  const ipValue = firstPresent(
    equipo?.ip_maquina,
    readExcelField(equipo, "IP DE MAQUINA")
  );
  const direccionValue = firstPresent(
    equipo?.direccion_oficina_piso,
    readExcelField(equipo, "DIRECCIÓN OFICINA / PISO")
  );
  const unidadValue = readExcelField(equipo, "DEPTO / UNIDAD");
  const cargoValue = readExcelField(equipo, "CARGO FUNCIONAL");
  const responsableValue = readExcelField(equipo, "NOMBRE RESPONSABLE DE ASIGNACIÓN");
  const observacionValue = firstPresent(
    equipo?.observaciones,
    readExcelField(equipo, "OBSERVACIÓN")
  );

  if (!open) return null;

  return (
    <div className="backdrop eq-detail-backdrop" onMouseDown={onClose}>
      <div className="modal eq-detail-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="header eq-detail-header">
          <div>
            <div className="title">Detalle de equipo</div>
            <div className="sub">
              {equipo?.numero_inventario || "—"} · {nombreEquipoValue || "—"}
            </div>
          </div>

          <button className="closeBtn" onClick={onClose} title="Cerrar">
            ✕
          </button>
        </div>

        <div className="body eq-detail-body">
          {/* Columna 1 */}
          <div className="col">
            <Field label="ID" value={equipo?.id_equipo} />
            <Field label="Inventario" value={equipo?.numero_inventario} />
            <Field label="Serie" value={equipo?.numero_serie} mono />
            <Field label="Nombre equipo" value={nombreEquipoValue} />
            <Field label="IP" value={ipValue} mono />
            <Field label="Activo" value={equipo?.activo ? "Sí" : "No"} />
          </div>

          {/* Columna 2 */}
          <div className="col">
            <Field label="Tipo" value={tipoValue} />
            <Field label="Marca" value={marcaValue} />
            <Field label="Estado" value={estadoValue} pill />
            <Field label="Ubicación" value={ubicacionValue} />
            <Field label="Región" value={regionValue} />
          </div>

          {/* Columna 3 */}
          <div className="col">
            <Field label="Dirección / Piso" value={direccionValue} multiline />
            <Field label="Depto / Unidad" value={unidadValue} />
            <Field label="Cargo funcional" value={cargoValue} />
            <Field label="Responsable" value={responsableValue} />
            <Field label="Obs." value={observacionValue} multiline />
          </div>

          {rawRowCount > 0 ? (
            <div className="col eq-detail-raw-col">
              <div className="field">
                <div className="label">Origen Excel</div>
                <div className="value eq-detail-value">
                  Hoja: {equipo?.raw_excel_data?.__sheet_name || "—"}
                  <br />
                  Fila: {equipo?.raw_excel_data?.__excel_row || "—"}
                </div>
              </div>

              <div className="field">
                <div className="eq-detail-raw-header">
                  <div className="label">Datos originales</div>
                  <button
                    type="button"
                    className="eq-detail-toggle-btn"
                    onClick={() => setShowRawData((prev) => !prev)}
                  >
                    {showRawData ? "Ocultar" : `Ver ${rawRowCount} campos`}
                  </button>
                </div>
                {showRawData ? (
                  <div className="eq-detail-raw-list" ref={rawListRef} onScroll={onRawListScroll}>
                    {displayedRawRows.map(([key, value]) => (
                      <div key={key} className="eq-detail-raw-item">
                        <div className="eq-detail-raw-key">{key}</div>
                        <div className="eq-detail-raw-value">
                          {formatDisplayValue(key, value)}
                        </div>
                      </div>
                    ))}
                    {hasMoreRawRows ? (
                      <div className="eq-detail-raw-more">
                        Cargando más campos… ({displayedRawRows.length}/{rawRows.length})
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="eq-detail-raw-preview">
                    Los datos originales del Excel se cargaron, pero quedan colapsados para que esta vista abra más rápido.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="footer eq-detail-footer">
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

function formatRawValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function normalizeRawKey(key) {
  return String(key || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");
}

function rawFieldSort(key) {
  const normalized = normalizeRawKey(key);
  const index = EXCEL_FIELD_ORDER.findIndex((item) => normalizeRawKey(item) === normalized);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function resolveCatalogLabel(key, value) {
  const mapping = RAW_CODE_MAPS[normalizeRawKey(key)];
  if (!mapping) return null;

  let numeric = null;
  if (typeof value === "number") {
    numeric = Number.isInteger(value) ? value : Number.isInteger(Number(value)) ? Number(value) : null;
  } else {
    const text = String(value).trim();
    if (/^\d+(?:\.0+)?$/.test(text)) numeric = Number(text);
  }

  if (numeric === null) return null;
  return mapping[numeric] || null;
}

function formatDisplayValue(key, value) {
  const resolved = resolveCatalogLabel(key, value);
  if (resolved) return resolved;
  return formatRawValue(value);
}

function rawValueFor(equipo, key) {
  return equipo?.raw_excel_data?.[key];
}

function readExcelField(equipo, key) {
  const value = rawValueFor(equipo, key);
  if (value === null || value === undefined) return "";
  const display = formatDisplayValue(key, value);
  return display === "—" ? "" : display;
}

function firstPresent(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    return value;
  }
  return "";
}

function inferSedeFromText(value) {
  const text = normalizeRawKey(value);
  if (!text) return "";
  if (text.includes("ANIMAS")) return "Ánimas";
  if (text.includes("YUNGAY")) return "Yungay";
  if (text.includes("LA UNION")) return "La Unión";
  if (text.includes("BOUCHEFF") || text.includes("BOUCHEF")) return "Bouchéff";
  return "";
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
