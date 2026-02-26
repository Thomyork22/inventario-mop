from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DashboardStatsView,

    EquipoViewSet,
    AsignacionEquipoViewSet,
    HistorialEstadoEquipoViewSet,
    MantenimientoViewSet,

    # catálogos
    MarcaViewSet,
    TipoEquipoViewSet,
    EstadoEquipoViewSet,
    UbicacionViewSet,
    RegionViewSet,
    TipoMantenimientoViewSet,
    EstadoMantenimientoViewSet,

    # funcionarios
    FuncionarioViewSet,

    # auth
    MeView,
)

from .reportes import (
    ReporteInventarioCSV,
    ReporteInventarioXLSX,
    ReporteAsignacionesCSV,
    ReporteAsignacionesXLSX,
    ReporteMantenimientosCSV,
    ReporteMantenimientosXLSX,
    ReporteGarantiasCSV,
    ReporteGarantiasXLSX,
)

router = DefaultRouter()

# módulos principales
router.register(r"equipos", EquipoViewSet, basename="equipos")
router.register(r"asignaciones", AsignacionEquipoViewSet, basename="asignaciones")
router.register(r"historial-estados", HistorialEstadoEquipoViewSet, basename="historial-estados")
router.register(r"mantenimientos", MantenimientoViewSet, basename="mantenimientos")

# catálogos
router.register(r"catalogos/marcas", MarcaViewSet, basename="catalogos-marcas")
router.register(r"catalogos/tipos-equipo", TipoEquipoViewSet, basename="catalogos-tipos-equipo")
router.register(r"catalogos/estados-equipo", EstadoEquipoViewSet, basename="catalogos-estados-equipo")
router.register(r"catalogos/ubicaciones", UbicacionViewSet, basename="catalogos-ubicaciones")
router.register(r"catalogos/regiones", RegionViewSet, basename="catalogos-regiones")
router.register(r"catalogos/tipos-mantenimiento", TipoMantenimientoViewSet, basename="catalogos-tipos-mantenimiento")
router.register(
    r"catalogos/estados-mantenimiento",
    EstadoMantenimientoViewSet,
    basename="catalogos-estados-mantenimiento",
)

# funcionarios
router.register(r"funcionarios", FuncionarioViewSet, basename="funcionarios")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),

    # ===== Reportes =====
    path("reportes/inventario.csv", ReporteInventarioCSV.as_view(), name="reporte-inventario-csv"),
    path("reportes/inventario.xlsx", ReporteInventarioXLSX.as_view(), name="reporte-inventario-xlsx"),

    path("reportes/asignaciones.csv", ReporteAsignacionesCSV.as_view(), name="reporte-asignaciones-csv"),
    path("reportes/asignaciones.xlsx", ReporteAsignacionesXLSX.as_view(), name="reporte-asignaciones-xlsx"),

    path("reportes/mantenimientos.csv", ReporteMantenimientosCSV.as_view(), name="reporte-mantenimientos-csv"),
    path("reportes/mantenimientos.xlsx", ReporteMantenimientosXLSX.as_view(), name="reporte-mantenimientos-xlsx"),

    path("reportes/garantias.csv", ReporteGarantiasCSV.as_view(), name="reporte-garantias-csv"),
    path("reportes/garantias.xlsx", ReporteGarantiasXLSX.as_view(), name="reporte-garantias-xlsx"),
]

urlpatterns += router.urls