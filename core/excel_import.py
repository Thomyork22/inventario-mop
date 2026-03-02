from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

from django.db import transaction
from django.utils import timezone

from openpyxl import load_workbook

from core.models import (
    AsignacionEquipo,
    CargoFuncionario,
    Equipo,
    EquipoMonitor,
    EstadoEquipo,
    Funcionario,
    ImportacionInventarioLote,
    ImportacionInventarioRegistro,
    Marca,
    MarcaMonitorCatalogo,
    Procesador,
    PulgadaMonitorCatalogo,
    Ram,
    SistemaOperativo,
    TamanoDiscoCatalogo,
    TipoDisco,
    TipoEquipo,
    UnidadFuncionario,
)


CODIGOS_SHEET = "CODIGOS"
EQUIPOS_SHEET = "EQUIPOS ACTIVOS DV"
DEFAULT_EXCEL_PATH = "inventariop.xlsx"

CODIGOS_COLUMNS = {
    "tipo_equipo_dict": "TIPO EQUIPO  1/2/OTRO",
    "marca_dict": "MARCA",
    "ram_dict": "RAM",
    "procesador_dict": "PROCESADOR",
    "so_dict": "S.O",
    "tamano_disco_dict": "TAMAÑO DISCO",
    "tipo_disco_dict": "TIPO DISCO   1/2",
    "estado_equipo_dict": "ESTADO/EQUIPO (PENDIENTE)",
    "marca_monitor_dict": "MARCA MONITOR",
    "pulgada_monitor_dict": "PULGADA MONITOR",
}

EQUIPOS_COLUMNS = {
    "numero_serie": "SERIE ( E)",
    "numero_inventario": "SIGAC ( E)",
    "tipo_equipo_codigo": "TIPO EQUIPO  1/2/OTRO",
    "marca_codigo": "MARCA",
    "ram_codigo": "RAM",
    "procesador_codigo": "PROCESADOR",
    "so_codigo": "S.O",
    "tamano_disco_codigo": "TAMAÑO DISCO",
    "tipo_disco_codigo": "TIPO DISCO   1/2",
    "estado_actual": "ESTADO ACTUAL   ASIGNADO/ BODEGA /EXTRAVIADO/ROBO",
    "rut": "RUT",
    "nombre": "NOMBRE",
    "unidad": "DEPTO / UNIDAD",
    "cargo": "CARGO FUNCIONAL",
    "monitor_1_marca": "MARCA MONITOR 1",
    "monitor_1_serie": "SERIE MONITOR 1",
    "monitor_1_pulgada": "PULGADA MONITOR 1",
    "monitor_2_marca": "MARCA MONITOR 2",
    "monitor_2_serie": "SERIE MONITOR 2",
    "monitor_2_pulgada": "PULGADA MONITOR 2",
    "observacion": "OBSERVACIÓN",
}


@dataclass
class ImportSummary:
    total_rows: int = 0
    funcionarios_created: int = 0
    funcionarios_updated: int = 0
    equipos_created: int = 0
    equipos_updated: int = 0
    asignaciones_created: int = 0
    monitores_created: int = 0
    errores: list[str] = field(default_factory=list)

    def as_dict(self):
        return {
            "total_rows": self.total_rows,
            "funcionarios_created": self.funcionarios_created,
            "funcionarios_updated": self.funcionarios_updated,
            "equipos_created": self.equipos_created,
            "equipos_updated": self.equipos_updated,
            "asignaciones_created": self.asignaciones_created,
            "monitores_created": self.monitores_created,
            "errores": self.errores,
        }


class ExcelInventoryImporter:
    TRACKED_MODELS = {
        "Funcionario": Funcionario,
        "Equipo": Equipo,
        "EquipoMonitor": EquipoMonitor,
        "AsignacionEquipo": AsignacionEquipo,
    }

    def __init__(self, path: str | Path | None = None):
        self.path = self._resolve_path(path or DEFAULT_EXCEL_PATH)
        self.lote = None

    @transaction.atomic
    def run(self):
        wb = load_workbook(self.path, data_only=True)
        codigos_sheet = self._get_sheet(wb, CODIGOS_SHEET)
        equipos_sheet = self._get_sheet(wb, EQUIPOS_SHEET)
        self.lote = ImportacionInventarioLote.objects.create(archivo_origen=self.path.name, estado="procesando")

        dictionaries = self._build_codigos_dicts(codigos_sheet)
        summary = self._import_equipos(equipos_sheet, dictionaries)
        self.lote.estado = "completado"
        self.lote.resumen = summary
        self.lote.save(update_fields=["estado", "resumen"])
        return summary

    def _resolve_path(self, path):
        candidate = Path(path).expanduser()
        if not candidate.is_absolute():
            candidate = Path.cwd() / candidate
        return candidate

    def _get_sheet(self, workbook, name):
        if name not in workbook.sheetnames:
            raise ValueError(f'La hoja "{name}" no existe en "{self.path.name}".')
        return workbook[name]

    def _build_codigos_dicts(self, sheet):
        header = self._header_map(sheet)
        dicts = {key: {} for key in CODIGOS_COLUMNS}

        for row in sheet.iter_rows(min_row=2, values_only=True):
            for dict_name, column_name in CODIGOS_COLUMNS.items():
                col_idx = header.get(self._normalize_header(column_name))
                if col_idx is None or col_idx >= len(row):
                    continue
                codigo, descripcion = self._parse_code_and_description(row[col_idx])
                if codigo is None or not descripcion:
                    continue
                dicts[dict_name][codigo] = descripcion

        return dicts

    def _import_equipos(self, sheet, dictionaries):
        header = self._header_map(sheet)
        summary = ImportSummary()

        for row_number, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
            if self._row_is_empty(row):
                continue

            summary.total_rows += 1

            try:
                funcionario = self._upsert_funcionario(row, header, summary)
                equipo = self._upsert_equipo(row, header, dictionaries, summary)
                self._create_monitores(row, header, dictionaries, equipo, summary)
                self._upsert_asignacion(row, header, dictionaries, equipo, funcionario, summary)
            except Exception as exc:
                summary.errores.append(f"Fila {row_number}: {exc}")

        return summary.as_dict()

    def _upsert_funcionario(self, row, header, summary):
        rut = self._clean_string(self._row_value(row, header, EQUIPOS_COLUMNS["rut"]))
        nombre = self._clean_string(self._row_value(row, header, EQUIPOS_COLUMNS["nombre"]))
        unidad_desc = self._clean_string(self._row_value(row, header, EQUIPOS_COLUMNS["unidad"]))
        cargo_desc = self._clean_string(self._row_value(row, header, EQUIPOS_COLUMNS["cargo"]))

        if not rut:
            return None

        unidad = None
        if unidad_desc:
            unidad, _ = UnidadFuncionario.objects.get_or_create(descripcion=unidad_desc)

        cargo = None
        if cargo_desc:
            cargo, _ = CargoFuncionario.objects.get_or_create(descripcion=cargo_desc)

        defaults = {
            "nombre_completo": nombre or f"Funcionario {rut}",
            "email_institucional": self._build_placeholder_email(rut),
            "activo": True,
            "codigo_unidad": unidad,
            "codigo_cargo": cargo,
        }

        funcionario, created = Funcionario.objects.get_or_create(rut=rut, defaults=defaults)
        if created:
            summary.funcionarios_created += 1
            self._record_change(funcionario, "create")
            return funcionario

        changed_fields = []
        if nombre and funcionario.nombre_completo != nombre:
            funcionario.nombre_completo = nombre
            changed_fields.append("nombre_completo")
        if not funcionario.email_institucional:
            funcionario.email_institucional = self._build_placeholder_email(rut)
            changed_fields.append("email_institucional")
        if unidad and funcionario.codigo_unidad_id != unidad.codigo_unidad:
            funcionario.codigo_unidad = unidad
            changed_fields.append("codigo_unidad")
        if cargo and funcionario.codigo_cargo_id != cargo.codigo_cargo:
            funcionario.codigo_cargo = cargo
            changed_fields.append("codigo_cargo")
        if funcionario.activo is not True:
            funcionario.activo = True
            changed_fields.append("activo")

        if changed_fields:
            self._record_change(funcionario, "update")
            funcionario.save(update_fields=changed_fields)
            summary.funcionarios_updated += 1

        return funcionario

    def _upsert_equipo(self, row, header, dictionaries, summary):
        numero_serie = self._clean_string(self._row_value(row, header, EQUIPOS_COLUMNS["numero_serie"]))
        numero_inventario = self._clean_string(self._row_value(row, header, EQUIPOS_COLUMNS["numero_inventario"]))

        if not numero_serie and not numero_inventario:
            raise ValueError("Equipo sin número de serie ni SIGAC.")

        tipo_equipo = self._catalog_from_code(
            TipoEquipo,
            dictionaries["tipo_equipo_dict"],
            self._row_value(row, header, EQUIPOS_COLUMNS["tipo_equipo_codigo"]),
            "codigo_tipo",
        )
        marca = self._catalog_from_code(
            Marca,
            dictionaries["marca_dict"],
            self._row_value(row, header, EQUIPOS_COLUMNS["marca_codigo"]),
            "codigo_marca",
        )
        ram = self._catalog_from_code(
            Ram,
            dictionaries["ram_dict"],
            self._row_value(row, header, EQUIPOS_COLUMNS["ram_codigo"]),
            "codigo_ram",
        )
        procesador = self._catalog_from_code(
            Procesador,
            dictionaries["procesador_dict"],
            self._row_value(row, header, EQUIPOS_COLUMNS["procesador_codigo"]),
            "codigo_procesador",
        )
        sistema_operativo = self._catalog_from_code(
            SistemaOperativo,
            dictionaries["so_dict"],
            self._row_value(row, header, EQUIPOS_COLUMNS["so_codigo"]),
            "codigo_so",
            use_nombre=True,
        )
        tamano_disco = self._catalog_from_code(
            TamanoDiscoCatalogo,
            dictionaries["tamano_disco_dict"],
            self._row_value(row, header, EQUIPOS_COLUMNS["tamano_disco_codigo"]),
        )
        tipo_disco = self._catalog_from_code(
            TipoDisco,
            dictionaries["tipo_disco_dict"],
            self._row_value(row, header, EQUIPOS_COLUMNS["tipo_disco_codigo"]),
            "codigo_disco",
        )
        estado_equipo = self._resolve_estado_equipo(
            dictionaries["estado_equipo_dict"],
            self._row_value(row, header, EQUIPOS_COLUMNS["estado_actual"]),
        )

        equipo = None
        if numero_inventario:
            equipo = Equipo.objects.filter(numero_inventario=numero_inventario).first()
        if equipo is None and numero_serie:
            equipo = Equipo.objects.filter(numero_serie=numero_serie).first()

        creating = equipo is None
        if creating:
            equipo = Equipo(
                numero_inventario=numero_inventario or numero_serie,
                numero_serie=numero_serie or numero_inventario,
            )

        changed_fields = []

        for field_name, value in (
            ("numero_inventario", numero_inventario or equipo.numero_inventario),
            ("numero_serie", numero_serie or equipo.numero_serie),
            ("codigo_tipo", tipo_equipo),
            ("codigo_marca", marca),
            ("codigo_ram", ram),
            ("codigo_procesador", procesador),
            ("codigo_so", sistema_operativo),
            ("tamano_disco", tamano_disco),
            ("codigo_disco", tipo_disco),
            ("codigo_estado", estado_equipo),
            ("observaciones", self._clean_string(self._row_value(row, header, EQUIPOS_COLUMNS["observacion"])) or equipo.observaciones),
            ("activo", True),
        ):
            current = getattr(equipo, field_name, None)
            if self._field_needs_update(current, value):
                setattr(equipo, field_name, value)
                changed_fields.append(field_name)

        if creating:
            equipo.save()
            self._record_change(equipo, "create")
            summary.equipos_created += 1
        elif changed_fields:
            self._record_change(equipo, "update")
            equipo.save(update_fields=changed_fields)
            summary.equipos_updated += 1

        return equipo

    def _create_monitores(self, row, header, dictionaries, equipo, summary):
        for idx in (1, 2):
            marca_raw = self._row_value(row, header, EQUIPOS_COLUMNS[f"monitor_{idx}_marca"])
            if self._is_blank(marca_raw):
                continue

            marca_catalogo = self._catalog_from_code(
                MarcaMonitorCatalogo,
                dictionaries["marca_monitor_dict"],
                marca_raw,
            )
            pulgada_catalogo = self._catalog_from_code(
                PulgadaMonitorCatalogo,
                dictionaries["pulgada_monitor_dict"],
                self._row_value(row, header, EQUIPOS_COLUMNS[f"monitor_{idx}_pulgada"]),
            )

            numero_serie = self._clean_string(self._row_value(row, header, EQUIPOS_COLUMNS[f"monitor_{idx}_serie"]))
            if numero_serie:
                monitor, created = EquipoMonitor.objects.get_or_create(
                    numero_serie_monitor=numero_serie,
                    defaults={"id_equipo": equipo},
                )
            else:
                monitor = EquipoMonitor(id_equipo=equipo)
                created = True

            changed_fields = []
            if monitor.id_equipo_id != equipo.id_equipo:
                monitor.id_equipo = equipo
                changed_fields.append("id_equipo")
            marca_text = marca_catalogo.descripcion if marca_catalogo else self._clean_string(marca_raw)
            if marca_text and monitor.marca_monitor != marca_text:
                monitor.marca_monitor = marca_text
                changed_fields.append("marca_monitor")
            if marca_catalogo and monitor.marca_monitor_catalogo_id != marca_catalogo.id:
                monitor.marca_monitor_catalogo = marca_catalogo
                changed_fields.append("marca_monitor_catalogo")
            if pulgada_catalogo and monitor.pulgada_monitor_catalogo_id != pulgada_catalogo.id:
                monitor.pulgada_monitor_catalogo = pulgada_catalogo
                changed_fields.append("pulgada_monitor_catalogo")
            pulgada_num = self._parse_monitor_inches(pulgada_catalogo.descripcion if pulgada_catalogo else self._row_value(row, header, EQUIPOS_COLUMNS[f"monitor_{idx}_pulgada"]))
            if pulgada_num is not None and monitor.pulgadas != pulgada_num:
                monitor.pulgadas = pulgada_num
                changed_fields.append("pulgadas")
            if monitor.activo is not True:
                monitor.activo = True
                changed_fields.append("activo")

            if created:
                monitor.save()
                self._record_change(monitor, "create")
                summary.monitores_created += 1
            elif changed_fields:
                self._record_change(monitor, "update")
                monitor.save(update_fields=changed_fields)

    def _upsert_asignacion(self, row, header, dictionaries, equipo, funcionario, summary):
        rut = self._clean_string(self._row_value(row, header, EQUIPOS_COLUMNS["rut"]))
        estado_raw = self._clean_string(self._row_value(row, header, EQUIPOS_COLUMNS["estado_actual"]))
        estado_normalized = (estado_raw or "").strip().upper()

        if not rut:
            return
        if estado_normalized == "BODEGA":
            return
        if funcionario is None:
            return

        active_qs = AsignacionEquipo.objects.filter(
            id_equipo=equipo,
            activo=True,
            fecha_devolucion__isnull=True,
        ).order_by("-id_asignacion")

        active_current = active_qs.filter(id_funcionario=funcionario).first()
        if active_current:
            return

        today = timezone.now().date()
        previous = active_qs.first()
        if previous:
            self._record_change(previous, "update")
            previous.fecha_devolucion = today
            previous.estado_asignacion = "Cerrada"
            previous.activo = False
            previous.save(update_fields=["fecha_devolucion", "estado_asignacion", "activo"])

        asignacion = AsignacionEquipo.objects.create(
            id_equipo=equipo,
            id_funcionario=funcionario,
            fecha_asignacion=today,
            estado_asignacion="Activa",
            activo=True,
            motivo_asignacion=f"Importado desde {self.path.name}",
        )
        self._record_change(asignacion, "create")
        summary.asignaciones_created += 1

    def _catalog_from_code(self, model, dictionary, raw_value, pk_field="id", use_nombre=False):
        code = self._to_int_or_none(raw_value)
        if code is None:
            return None

        descripcion = dictionary.get(code)
        if not descripcion:
            descripcion = str(code)

        lookup = {"descripcion": descripcion}
        defaults = {"codigo": code} if hasattr(model, "codigo") else {}

        if model is SistemaOperativo and use_nombre:
            lookup = {"nombre": descripcion}
            defaults["descripcion"] = descripcion

        obj, _ = model.objects.get_or_create(**lookup, defaults=defaults)

        changed_fields = []
        if hasattr(obj, "codigo") and obj.codigo != code:
            obj.codigo = code
            changed_fields.append("codigo")
        if model is SistemaOperativo and use_nombre and obj.descripcion != descripcion:
            obj.descripcion = descripcion
            changed_fields.append("descripcion")

        if changed_fields:
            obj.save(update_fields=changed_fields)

        return obj

    def _resolve_estado_equipo(self, dictionary, raw_value):
        text = self._clean_string(raw_value)
        code = self._to_int_or_none(raw_value)
        if code is not None:
            return self._catalog_from_code(EstadoEquipo, dictionary, code, "codigo_estado")

        if not text:
            text = "ASIGNADO"

        normalized = text.upper()
        existing = EstadoEquipo.objects.filter(descripcion__iexact=normalized).first()
        if existing:
            return existing

        permite_asignacion = normalized != "ASIGNADO"
        return EstadoEquipo.objects.create(
            descripcion=normalized,
            permite_asignacion=permite_asignacion,
        )

    def _header_map(self, sheet):
        first_row = next(sheet.iter_rows(min_row=1, max_row=1, values_only=True))
        return {
            self._normalize_header(value): idx
            for idx, value in enumerate(first_row)
            if not self._is_blank(value)
        }

    def _row_value(self, row, header, column_name):
        idx = header.get(self._normalize_header(column_name))
        if idx is None or idx >= len(row):
            return None
        return row[idx]

    def _parse_code_and_description(self, raw_value):
        text = self._clean_string(raw_value)
        if not text:
            return None, None

        match = re.match(r"^\s*(\d+)\s*-\s*(.+?)\s*$", text)
        if not match:
            return None, text

        return int(match.group(1)), match.group(2).strip()

    def _to_int_or_none(self, raw_value):
        if self._is_blank(raw_value):
            return None
        if isinstance(raw_value, bool):
            return None
        if isinstance(raw_value, (int, float)):
            return int(raw_value)

        text = self._clean_string(raw_value)
        if not text:
            return None

        code, _ = self._parse_code_and_description(text)
        if code is not None:
            return code

        if re.fullmatch(r"\d+", text):
            return int(text)
        return None

    def _parse_monitor_inches(self, raw_value):
        text = self._clean_string(raw_value)
        if not text:
            return None
        match = re.search(r"(\d+)", text)
        return int(match.group(1)) if match else None

    def _build_placeholder_email(self, rut):
        normalized = re.sub(r"[^0-9kK]", "", rut or "").lower()
        if not normalized:
            normalized = "sinrut"
        return f"{normalized}@import.local"

    def _field_needs_update(self, current, new_value):
        if new_value is None:
            return False
        current_id = getattr(current, "pk", current)
        new_id = getattr(new_value, "pk", new_value)
        return current_id != new_id

    def _row_is_empty(self, row):
        return all(self._is_blank(value) for value in row)

    def _is_blank(self, value):
        if value is None:
            return True
        if isinstance(value, str):
            text = value.strip()
            return text == "" or text.lower() == "nan"
        return False

    def _clean_string(self, value):
        if self._is_blank(value):
            return ""
        if isinstance(value, float) and value.is_integer():
            return str(int(value))
        return str(value).strip()

    def _normalize_header(self, value):
        text = self._clean_string(value).upper()
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    def _record_change(self, instance, action):
        if self.lote is None:
            return

        snapshot = None
        if action == "update":
            snapshot = self._snapshot_instance(instance)

        ImportacionInventarioRegistro.objects.create(
            id_lote=self.lote,
            modelo=instance.__class__.__name__,
            object_id=instance.pk,
            accion=action,
            snapshot_previo=snapshot,
        )

    def _snapshot_instance(self, instance):
        data = {}
        for field in instance._meta.concrete_fields:
            if field.primary_key:
                continue
            name = field.attname
            data[name] = getattr(instance, name)
        return data


def rollback_import_lote(lote=None):
    target_lote = lote or ImportacionInventarioLote.objects.order_by("-id_lote").first()
    if target_lote is None:
        raise ValueError("No hay lotes de importación registrados para revertir.")

    if target_lote.estado == "revertido":
        raise ValueError(f"El lote #{target_lote.id_lote} ya fue revertido.")

    with transaction.atomic():
        registros = list(target_lote.registros.order_by("-id_registro"))
        for registro in registros:
            model = ExcelInventoryImporter.TRACKED_MODELS.get(registro.modelo)
            if model is None:
                continue

            instance = model.objects.filter(pk=registro.object_id).first()

            if registro.accion == "create":
                if instance is not None:
                    instance.delete()
                continue

            if registro.accion == "update" and instance is not None and registro.snapshot_previo:
                changed_fields = []
                for key, value in registro.snapshot_previo.items():
                    if getattr(instance, key) != value:
                        setattr(instance, key, value)
                        changed_fields.append(key)
                if changed_fields:
                    instance.save(update_fields=changed_fields)

        target_lote.estado = "revertido"
        target_lote.save(update_fields=["estado"])

    return {
        "id_lote": target_lote.id_lote,
        "archivo_origen": target_lote.archivo_origen,
        "registros_revertidos": len(registros),
    }
