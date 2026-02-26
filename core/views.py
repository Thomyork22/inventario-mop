# core/views.py

from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from core.auth_serializers import MeSerializer
from .permissions import IsInMopInventarioGroup

from .models import (
    Equipo,
    AsignacionEquipo,
    HistorialEstadoEquipo,
    Mantenimiento,
    Marca,
    TipoEquipo,
    EstadoEquipo,
    Ubicacion,
    Region,
    TipoMantenimiento,
    Funcionario,
    EstadoMantenimiento,
)

from .serializers import (
    # equipos
    EquipoReadSerializer,
    EquipoWriteSerializer,

    # asignaciones
    AsignacionReadSerializer,
    AsignacionWriteSerializer,

    # historial
    HistorialEstadoEquipoReadSerializer,

    # mantenimiento
    MantenimientoReadSerializer,
    MantenimientoWriteSerializer,

    # catálogos
    MarcaSerializer,
    TipoEquipoSerializer,
    EstadoEquipoSerializer,
    UbicacionSerializer,
    RegionSerializer,
    TipoMantenimientoSerializer,
    EstadoMantenimientoSerializer,

    # funcionarios
    FuncionarioMiniSerializer,
    FuncionarioReadSerializer,
    FuncionarioWriteSerializer,
)


class EquipoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    queryset = Equipo.objects.all().order_by("-id_equipo")

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["codigo_estado", "id_ubicacion", "activo", "codigo_marca", "codigo_tipo"]
    search_fields = ["numero_inventario", "numero_serie", "modelo"]
    ordering_fields = ["id_equipo", "numero_inventario", "fecha_compra", "fecha_creacion"]
    ordering = ["-id_equipo"]

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return EquipoReadSerializer
        return EquipoWriteSerializer


class AsignacionEquipoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    queryset = AsignacionEquipo.objects.all().order_by("-id_asignacion")

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["id_equipo", "id_funcionario", "activo", "estado_asignacion"]
    ordering_fields = ["id_asignacion", "fecha_asignacion", "fecha_devolucion"]
    ordering = ["-id_asignacion"]

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return AsignacionReadSerializer
        return AsignacionWriteSerializer

    # =========================
    # Helpers (estado + historial)
    # =========================
    def _get_estado_id_by_keyword(self, keyword: str):
        """
        Busca un EstadoEquipo por descripción (ej: 'ocup', 'libre').
        Devuelve codigo_estado o None.
        """
        keyword = (keyword or "").strip().lower()
        if not keyword:
            return None
        est = (
            EstadoEquipo.objects.filter(descripcion__icontains=keyword)
            .order_by("codigo_estado")
            .first()
        )
        return est.codigo_estado if est else None

    def _set_equipo_estado(self, equipo, estado_id):
        """
        Setea el estado del equipo de forma directa (sin serializer).
        """
        if not estado_id:
            return
        Equipo.objects.filter(id_equipo=equipo.id_equipo).update(codigo_estado_id=estado_id)

    def _registrar_historial_estado(self, equipo, estado_anterior_id, estado_nuevo_id, motivo: str):
        HistorialEstadoEquipo.objects.create(
            id_equipo=equipo,
            codigo_estado_anterior_id=estado_anterior_id,
            codigo_estado_nuevo_id=estado_nuevo_id,
            fecha_cambio=timezone.now(),
            motivo_detallado=motivo,
        )

    # =========================
    # CREATE: asignar
    # =========================
    def perform_create(self, serializer):
        equipo = serializer.validated_data["id_equipo"]
        estado_anterior_id = equipo.codigo_estado_id

        asignacion = serializer.save()

        # Cambiar estado del equipo a OCUPADO (backend)
        estado_ocupado_id = self._get_estado_id_by_keyword("ocup")
        if estado_ocupado_id:
            self._set_equipo_estado(equipo, estado_ocupado_id)

        equipo.refresh_from_db()
        estado_nuevo_id = equipo.codigo_estado_id

        # Registrar historial con motivo real (motivo_asignacion)
        if estado_anterior_id != estado_nuevo_id:
            motivo_ui = (asignacion.motivo_asignacion or "").strip()
            motivo = motivo_ui if motivo_ui else "Asignación realizada (sin motivo)."
            self._registrar_historial_estado(
                equipo,
                estado_anterior_id,
                estado_nuevo_id,
                motivo=f"Asignación: {motivo}",
            )

        return asignacion

    # =========================
    # UPDATE: devolver/cerrar
    # =========================
    def perform_update(self, serializer):
        asignacion_actual = serializer.instance
        equipo = asignacion_actual.id_equipo
        estado_anterior_id = equipo.codigo_estado_id

        vd = serializer.validated_data
        asignacion = serializer.save()

        # Detectar cierre/devolución
        cerrando = False
        if "fecha_devolucion" in vd and vd.get("fecha_devolucion"):
            cerrando = True
        if "activo" in vd and vd.get("activo") is False:
            cerrando = True
        if "estado_asignacion" in vd and str(vd.get("estado_asignacion") or "").lower().startswith("cerr"):
            cerrando = True

        # Si se está cerrando -> estado LIBRE (backend)
        if cerrando:
            estado_libre_id = self._get_estado_id_by_keyword("libre")
            if estado_libre_id:
                self._set_equipo_estado(equipo, estado_libre_id)

        equipo.refresh_from_db()
        estado_nuevo_id = equipo.codigo_estado_id

        if estado_anterior_id != estado_nuevo_id:
            self._registrar_historial_estado(
                equipo,
                estado_anterior_id,
                estado_nuevo_id,
                motivo="Devolución: equipo devuelto/cierre de asignación.",
            )

        return asignacion


class HistorialEstadoEquipoViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    serializer_class = HistorialEstadoEquipoReadSerializer

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ["id_historial_estado", "fecha_cambio"]
    ordering = ["-id_historial_estado"]

    def get_queryset(self):
        qs = HistorialEstadoEquipo.objects.all().order_by("-id_historial_estado")
        equipo_id = self.request.query_params.get("id_equipo")
        if equipo_id:
            qs = qs.filter(id_equipo_id=equipo_id)
        return qs


class MantenimientoViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    queryset = Mantenimiento.objects.all().order_by("-id_mantenimiento")

    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["id_equipo"]
    ordering_fields = ["id_mantenimiento", "fecha_solicitud", "fecha_creacion"]
    ordering = ["-id_mantenimiento"]

    def get_queryset(self):
        qs = super().get_queryset()
        id_equipo = self.request.query_params.get("id_equipo")
        if id_equipo:
            qs = qs.filter(id_equipo_id=id_equipo)
        return qs

    def get_serializer_class(self):
        if self.action in ("list", "retrieve"):
            return MantenimientoReadSerializer
        return MantenimientoWriteSerializer

    # =========================
    # BONUS PRO: auto-estado por fechas
    # =========================
    def _get_estado_mant_id(self, keyword: str):
        keyword = (keyword or "").strip().lower()
        if not keyword:
            return None

        est = (
            EstadoMantenimiento.objects.filter(descripcion__icontains=keyword)
            .order_by("codigo_estado_mantenimiento")
            .first()
        )
        return est.codigo_estado_mantenimiento if est else None

    def _estado_por_fechas(self, mant: Mantenimiento):
        if mant.fecha_entrega:
            return self._get_estado_mant_id("entreg")
        if mant.fecha_salida_taller:
            return self._get_estado_mant_id("termin")
        if mant.fecha_ingreso_taller:
            return self._get_estado_mant_id("taller")
        return self._get_estado_mant_id("pend")

    def perform_create(self, serializer):
        mant = serializer.save()

        if mant.codigo_estado_mantenimiento_id is None:
            estado_id = self._estado_por_fechas(mant)
            if estado_id:
                Mantenimiento.objects.filter(id_mantenimiento=mant.id_mantenimiento).update(
                    codigo_estado_mantenimiento_id=estado_id
                )
                mant.refresh_from_db()

        return mant

    def perform_update(self, serializer):
        vd = serializer.validated_data
        user_set_estado = "codigo_estado_mantenimiento" in vd and vd.get("codigo_estado_mantenimiento") is not None

        mant = serializer.save()

        fechas_relevantes = ("fecha_ingreso_taller", "fecha_salida_taller", "fecha_entrega")
        changed_any_fecha = any(f in vd for f in fechas_relevantes)

        if (not user_set_estado) and changed_any_fecha:
            estado_id = self._estado_por_fechas(mant)
            if estado_id and mant.codigo_estado_mantenimiento_id != estado_id:
                Mantenimiento.objects.filter(id_mantenimiento=mant.id_mantenimiento).update(
                    codigo_estado_mantenimiento_id=estado_id
                )
                mant.refresh_from_db()

        return mant


# -------- Catálogos (solo lectura) --------

class MarcaViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    queryset = Marca.objects.all().order_by("descripcion")
    serializer_class = MarcaSerializer


class TipoEquipoViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    queryset = TipoEquipo.objects.all().order_by("descripcion")
    serializer_class = TipoEquipoSerializer


class EstadoEquipoViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    queryset = EstadoEquipo.objects.all().order_by("descripcion")
    serializer_class = EstadoEquipoSerializer


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    queryset = Region.objects.all().order_by("codigo_region")
    serializer_class = RegionSerializer


class UbicacionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    queryset = Ubicacion.objects.all().order_by("nombre_sede")
    serializer_class = UbicacionSerializer


class TipoMantenimientoViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    queryset = TipoMantenimiento.objects.all().order_by("descripcion")
    serializer_class = TipoMantenimientoSerializer


class EstadoMantenimientoViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    queryset = EstadoMantenimiento.objects.all().order_by("descripcion")
    serializer_class = EstadoMantenimientoSerializer


# -------- Funcionarios (PRO: list mini + retrieve detalle + write para POST/PATCH) --------

class FuncionarioViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]
    queryset = Funcionario.objects.all().order_by("nombre_completo")

    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["activo", "codigo_unidad", "codigo_cargo"]
    search_fields = ["nombre_completo", "rut", "email_institucional"]
    ordering_fields = ["id_funcionario", "nombre_completo", "rut"]
    ordering = ["nombre_completo"]

    def get_serializer_class(self):
        # Listado liviano
        if self.action == "list":
            return FuncionarioMiniSerializer

        # Ver detalle
        if self.action == "retrieve":
            return FuncionarioReadSerializer

        # Crear / editar (POST, PUT, PATCH)
        return FuncionarioWriteSerializer


# -------- Auth --------

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(MeSerializer(request.user).data)


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated, IsInMopInventarioGroup]

    def get(self, request):
        total = Equipo.objects.count()

        libres = Equipo.objects.filter(
            codigo_estado__descripcion__icontains="libre"
        ).count()

        ocupados = Equipo.objects.filter(
            codigo_estado__descripcion__icontains="ocup"
        ).count()

        mantenimiento = Equipo.objects.filter(
            codigo_estado__descripcion__icontains="manten"
        ).count()

        hoy = timezone.now().date()
        limite = hoy + timedelta(days=30)

        garantias_por_vencer = Equipo.objects.filter(
            fecha_fin_garantia__isnull=False,
            fecha_fin_garantia__range=(hoy, limite),
        ).count()

        # ✅ PRO: por sede con breakdown por estado (sin depender de related_name)
        por_sede_qs = (
            Equipo.objects
            .values("id_ubicacion_id", "id_ubicacion__nombre_sede")
            .annotate(
                total=Count("id_equipo"),
                libres=Count("id_equipo", filter=Q(codigo_estado__descripcion__icontains="libre")),
                ocupados=Count("id_equipo", filter=Q(codigo_estado__descripcion__icontains="ocup")),
                mantenimiento=Count("id_equipo", filter=Q(codigo_estado__descripcion__icontains="manten")),
            )
            .order_by("-total", "id_ubicacion__nombre_sede")
        )

        sin_sede = Equipo.objects.filter(id_ubicacion__isnull=True).count()
        sin_sede_libres = Equipo.objects.filter(id_ubicacion__isnull=True, codigo_estado__descripcion__icontains="libre").count()
        sin_sede_ocupados = Equipo.objects.filter(id_ubicacion__isnull=True, codigo_estado__descripcion__icontains="ocup").count()
        sin_sede_mantenimiento = Equipo.objects.filter(id_ubicacion__isnull=True, codigo_estado__descripcion__icontains="manten").count()

        por_sede = [
            {
                "id_ubicacion": x["id_ubicacion_id"],
                "sede": x["id_ubicacion__nombre_sede"] or "Sin sede",
                "total": x["total"],
                "libres": x["libres"],
                "ocupados": x["ocupados"],
                "mantenimiento": x["mantenimiento"],
            }
            for x in por_sede_qs
        ]

        if sin_sede:
            # ya viene en por_sede_qs con nombre_sede null si existe,
            # pero por si acaso lo dejamos asegurado:
            # (si te queda duplicado, me avisas y lo ajustamos)
            pass

        return Response({
            "total": total,
            "libres": libres,
            "ocupados": ocupados,
            "mantenimiento": mantenimiento,
            "garantias_por_vencer": garantias_por_vencer,
            "por_sede": por_sede,
        })