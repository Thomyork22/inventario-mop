from io import BytesIO
import csv
from datetime import datetime, timedelta

from django.http import HttpResponse
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from openpyxl import Workbook

from .permissions import IsInMopInventarioGroup
from .models import Equipo, AsignacionEquipo, Mantenimiento


def _bool_param(v):
    if v is None:
        return None
    s = str(v).strip().lower()
    if s in ("1", "true", "t", "si", "sí", "yes"):
        return True
    if s in ("0", "false", "f", "no"):
        return False
    return None


def _date_param(v):
    if not v:
        return None
    try:
        return datetime.strptime(v, "%Y-%m-%d").date()
    except Exception:
        return None


def _csv_response(filename: str, headers: list[str], rows: list[list]):
    resp = HttpResponse(content_type="text/csv; charset=utf-8")
    resp["Content-Disposition"] = f'attachment; filename="{filename}"'
    writer = csv.writer(resp)
    writer.writerow(headers)
    for r in rows:
        writer.writerow(r)
    return resp


def _xlsx_response(filename: str, sheet_name: str, headers: list[str], rows: list[list]):
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_name[:31]

    ws.append(headers)
    for r in rows:
        ws.append(list(r))

    bio = BytesIO()
    wb.save(bio)
    bio.seek(0)

    resp = HttpResponse(
        bio.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    resp["Content-Disposition"] = f'attachment; filename="{filename}"'
    return resp


# =========================
# Inventario
# =========================

class ReporteInventarioCSV(APIView):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]

    def get(self, request):
        qs = Equipo.objects.all().order_by("id_equipo")

        activo = _bool_param(request.query_params.get("activo"))
        if activo is not None:
            qs = qs.filter(activo=activo)

        id_ubicacion = request.query_params.get("id_ubicacion")
        if id_ubicacion:
            qs = qs.filter(id_ubicacion_id=id_ubicacion)

        codigo_estado = request.query_params.get("codigo_estado")
        if codigo_estado:
            qs = qs.filter(codigo_estado_id=codigo_estado)

        headers = [
            "id_equipo", "numero_inventario", "numero_serie", "modelo",
            "estado", "sede", "activo", "fecha_compra"
        ]

        rows = []
        for e in qs:
            rows.append([
                e.id_equipo,
                e.numero_inventario,
                e.numero_serie,
                e.modelo or "",
                getattr(e.codigo_estado, "descripcion", "") if e.codigo_estado else "",
                getattr(e.id_ubicacion, "nombre_sede", "") if e.id_ubicacion else "",
                "SI" if e.activo else "NO",
                e.fecha_compra.isoformat() if e.fecha_compra else "",
            ])

        return _csv_response("reporte_inventario.csv", headers, rows)


class ReporteInventarioXLSX(APIView):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]

    def get(self, request):
        qs = Equipo.objects.all().order_by("id_equipo")

        activo = _bool_param(request.query_params.get("activo"))
        if activo is not None:
            qs = qs.filter(activo=activo)

        id_ubicacion = request.query_params.get("id_ubicacion")
        if id_ubicacion:
            qs = qs.filter(id_ubicacion_id=id_ubicacion)

        codigo_estado = request.query_params.get("codigo_estado")
        if codigo_estado:
            qs = qs.filter(codigo_estado_id=codigo_estado)

        headers = [
            "id_equipo", "numero_inventario", "numero_serie", "modelo",
            "estado", "sede", "activo", "fecha_compra"
        ]

        rows = []
        for e in qs:
            rows.append([
                e.id_equipo,
                e.numero_inventario,
                e.numero_serie,
                e.modelo or "",
                getattr(e.codigo_estado, "descripcion", "") if e.codigo_estado else "",
                getattr(e.id_ubicacion, "nombre_sede", "") if e.id_ubicacion else "",
                "SI" if e.activo else "NO",
                e.fecha_compra.isoformat() if e.fecha_compra else "",
            ])

        return _xlsx_response("reporte_inventario.xlsx", "Inventario", headers, rows)


# =========================
# Asignaciones
# =========================

class ReporteAsignacionesCSV(APIView):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]

    def get(self, request):
        qs = AsignacionEquipo.objects.select_related("id_equipo", "id_funcionario").order_by("-id_asignacion")

        solo_activas = _bool_param(request.query_params.get("solo_activas"))
        if solo_activas is True:
            qs = qs.filter(activo=True, fecha_devolucion__isnull=True)

        headers = ["id_asignacion", "funcionario", "rut", "equipo", "modelo", "fecha_asignacion", "fecha_devolucion", "activo"]
        rows = []
        for a in qs:
            f = a.id_funcionario
            e = a.id_equipo
            rows.append([
                a.id_asignacion,
                getattr(f, "nombre_completo", "") if f else "",
                getattr(f, "rut", "") if f else "",
                getattr(e, "numero_inventario", "") if e else "",
                getattr(e, "modelo", "") if e else "",
                a.fecha_asignacion.isoformat() if a.fecha_asignacion else "",
                a.fecha_devolucion.isoformat() if a.fecha_devolucion else "",
                "SI" if a.activo else "NO",
            ])
        return _csv_response("reporte_asignaciones.csv", headers, rows)


class ReporteAsignacionesXLSX(APIView):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]

    def get(self, request):
        qs = AsignacionEquipo.objects.select_related("id_equipo", "id_funcionario").order_by("-id_asignacion")

        solo_activas = _bool_param(request.query_params.get("solo_activas"))
        if solo_activas is True:
            qs = qs.filter(activo=True, fecha_devolucion__isnull=True)

        headers = ["id_asignacion", "funcionario", "rut", "equipo", "modelo", "fecha_asignacion", "fecha_devolucion", "activo"]
        rows = []
        for a in qs:
            f = a.id_funcionario
            e = a.id_equipo
            rows.append([
                a.id_asignacion,
                getattr(f, "nombre_completo", "") if f else "",
                getattr(f, "rut", "") if f else "",
                getattr(e, "numero_inventario", "") if e else "",
                getattr(e, "modelo", "") if e else "",
                a.fecha_asignacion.isoformat() if a.fecha_asignacion else "",
                a.fecha_devolucion.isoformat() if a.fecha_devolucion else "",
                "SI" if a.activo else "NO",
            ])

        return _xlsx_response("reporte_asignaciones.xlsx", "Asignaciones", headers, rows)


# =========================
# Mantenimientos
# =========================

class ReporteMantenimientosCSV(APIView):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]

    def get(self, request):
        qs = Mantenimiento.objects.select_related("id_equipo", "codigo_estado_mantenimiento").order_by("-id_mantenimiento")

        headers = ["id_mantenimiento", "equipo", "modelo", "estado", "fecha_solicitud", "fecha_ingreso_taller", "fecha_salida_taller", "fecha_entrega"]
        rows = []
        for m in qs:
            e = m.id_equipo
            est = m.codigo_estado_mantenimiento
            rows.append([
                m.id_mantenimiento,
                getattr(e, "numero_inventario", "") if e else "",
                getattr(e, "modelo", "") if e else "",
                getattr(est, "descripcion", "") if est else "",
                m.fecha_solicitud.isoformat() if m.fecha_solicitud else "",
                m.fecha_ingreso_taller.isoformat() if m.fecha_ingreso_taller else "",
                m.fecha_salida_taller.isoformat() if m.fecha_salida_taller else "",
                m.fecha_entrega.isoformat() if m.fecha_entrega else "",
            ])
        return _csv_response("reporte_mantenimientos.csv", headers, rows)


class ReporteMantenimientosXLSX(APIView):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]

    def get(self, request):
        qs = Mantenimiento.objects.select_related("id_equipo", "codigo_estado_mantenimiento").order_by("-id_mantenimiento")

        headers = ["id_mantenimiento", "equipo", "modelo", "estado", "fecha_solicitud", "fecha_ingreso_taller", "fecha_salida_taller", "fecha_entrega"]
        rows = []
        for m in qs:
            e = m.id_equipo
            est = m.codigo_estado_mantenimiento
            rows.append([
                m.id_mantenimiento,
                getattr(e, "numero_inventario", "") if e else "",
                getattr(e, "modelo", "") if e else "",
                getattr(est, "descripcion", "") if est else "",
                m.fecha_solicitud.isoformat() if m.fecha_solicitud else "",
                m.fecha_ingreso_taller.isoformat() if m.fecha_ingreso_taller else "",
                m.fecha_salida_taller.isoformat() if m.fecha_salida_taller else "",
                m.fecha_entrega.isoformat() if m.fecha_entrega else "",
            ])
        return _xlsx_response("reporte_mantenimientos.xlsx", "Mantenimientos", headers, rows)


# =========================
# Garantías
# =========================

class ReporteGarantiasCSV(APIView):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]

    def get(self, request):
        hoy = timezone.now().date()
        dias = request.query_params.get("dias")  # default 30
        try:
            dias = int(dias) if dias else 30
        except Exception:
            dias = 30

        tipo = (request.query_params.get("tipo") or "pv").lower()  # pv | vencidas
        limite = hoy + timedelta(days=dias)

        qs = Equipo.objects.filter(fecha_fin_garantia__isnull=False).order_by("fecha_fin_garantia")

        if tipo == "vencidas":
            qs = qs.filter(fecha_fin_garantia__lt=hoy)
        else:
            qs = qs.filter(fecha_fin_garantia__range=(hoy, limite))

        headers = ["id_equipo", "numero_inventario", "modelo", "fecha_fin_garantia", "dias_restantes"]
        rows = []
        for e in qs:
            dias_rest = (e.fecha_fin_garantia - hoy).days if e.fecha_fin_garantia else ""
            rows.append([e.id_equipo, e.numero_inventario, e.modelo or "", e.fecha_fin_garantia.isoformat(), dias_rest])
        return _csv_response("reporte_garantias.csv", headers, rows)


class ReporteGarantiasXLSX(APIView):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]

    def get(self, request):
        hoy = timezone.now().date()
        dias = request.query_params.get("dias")
        try:
            dias = int(dias) if dias else 30
        except Exception:
            dias = 30

        tipo = (request.query_params.get("tipo") or "pv").lower()
        limite = hoy + timedelta(days=dias)

        qs = Equipo.objects.filter(fecha_fin_garantia__isnull=False).order_by("fecha_fin_garantia")
        if tipo == "vencidas":
            qs = qs.filter(fecha_fin_garantia__lt=hoy)
        else:
            qs = qs.filter(fecha_fin_garantia__range=(hoy, limite))

        headers = ["id_equipo", "numero_inventario", "modelo", "fecha_fin_garantia", "dias_restantes"]
        rows = []
        for e in qs:
            dias_rest = (e.fecha_fin_garantia - hoy).days if e.fecha_fin_garantia else ""
            rows.append([e.id_equipo, e.numero_inventario, e.modelo or "", e.fecha_fin_garantia.isoformat(), dias_rest])

        return _xlsx_response("reporte_garantias.xlsx", "Garantias", headers, rows)