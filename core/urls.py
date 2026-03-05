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
    CondicionEquipoViewSet,
    TipoEquipoViewSet,
    EstadoEquipoViewSet,
    UbicacionViewSet,
    RegionViewSet,
    TipoMantenimientoViewSet,
    EstadoMantenimientoViewSet,
    RamViewSet,
    ProcesadorViewSet,
    SistemaOperativoViewSet,
    TipoDiscoViewSet,
    TamanoDiscoCatalogoViewSet,
    MarcaMonitorCatalogoViewSet,
    PulgadaMonitorCatalogoViewSet,
    CargoFuncionarioViewSet,
    UnidadFuncionarioViewSet,

    # funcionarios
    FuncionarioViewSet,

    # auth
    MeView,
    ImportInventarioExcelView,
    RollbackInventarioExcelView,
    ClearInventarioView,
)

from .reportes import (
    ReporteInventarioXLSX,
    ReporteInventarioPDF,
    ReporteAsignacionesXLSX,
    ReporteAsignacionesPDF,
    ReporteMantenimientosXLSX,
    ReporteMantenimientosPDF,
    ReporteGarantiasXLSX,
    ReporteGarantiasPDF,
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
router.register(r"catalogos/condiciones-equipo", CondicionEquipoViewSet, basename="catalogos-condiciones-equipo")
router.register(r"catalogos/ubicaciones", UbicacionViewSet, basename="catalogos-ubicaciones")
router.register(r"catalogos/sedes", UbicacionViewSet, basename="catalogos-sedes")
router.register(r"catalogos/regiones", RegionViewSet, basename="catalogos-regiones")
router.register(r"catalogos/ram", RamViewSet, basename="catalogos-ram")
router.register(r"catalogos/procesadores", ProcesadorViewSet, basename="catalogos-procesadores")
router.register(r"catalogos/sistemas-operativos", SistemaOperativoViewSet, basename="catalogos-sistemas-operativos")
router.register(r"catalogos/tipos-disco", TipoDiscoViewSet, basename="catalogos-tipos-disco")
router.register(r"catalogos/tamanos-disco", TamanoDiscoCatalogoViewSet, basename="catalogos-tamanos-disco")
router.register(r"catalogos/marcas-monitor", MarcaMonitorCatalogoViewSet, basename="catalogos-marcas-monitor")
router.register(r"catalogos/pulgadas-monitor", PulgadaMonitorCatalogoViewSet, basename="catalogos-pulgadas-monitor")
router.register(r"catalogos/tipos-mantenimiento", TipoMantenimientoViewSet, basename="catalogos-tipos-mantenimiento")
router.register(
    r"catalogos/estados-mantenimiento",
    EstadoMantenimientoViewSet,
    basename="catalogos-estados-mantenimiento",
)
router.register(r"catalogos/cargos-funcionario", CargoFuncionarioViewSet, basename="catalogos-cargos-funcionario")
router.register(r"catalogos/unidades-funcionario", UnidadFuncionarioViewSet, basename="catalogos-unidades-funcionario")

# funcionarios
router.register(r"funcionarios", FuncionarioViewSet, basename="funcionarios")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("import/inventario-excel/", ImportInventarioExcelView.as_view(), name="import-inventario-excel"),
    path("import/inventario-excel/rollback/", RollbackInventarioExcelView.as_view(), name="rollback-inventario-excel"),
    path("inventario/clear/", ClearInventarioView.as_view(), name="clear-inventario"),

    # ===== Reportes =====
    path("reportes/inventario.xlsx", ReporteInventarioXLSX.as_view(), name="reporte-inventario-xlsx"),
    path("reportes/inventario.pdf", ReporteInventarioPDF.as_view(), name="reporte-inventario-pdf"),

    path("reportes/asignaciones.xlsx", ReporteAsignacionesXLSX.as_view(), name="reporte-asignaciones-xlsx"),
    path("reportes/asignaciones.pdf", ReporteAsignacionesPDF.as_view(), name="reporte-asignaciones-pdf"),

    path("reportes/mantenimientos.xlsx", ReporteMantenimientosXLSX.as_view(), name="reporte-mantenimientos-xlsx"),
    path("reportes/mantenimientos.pdf", ReporteMantenimientosPDF.as_view(), name="reporte-mantenimientos-pdf"),

    path("reportes/garantias.xlsx", ReporteGarantiasXLSX.as_view(), name="reporte-garantias-xlsx"),
    path("reportes/garantias.pdf", ReporteGarantiasPDF.as_view(), name="reporte-garantias-pdf"),
]

urlpatterns += router.urls
