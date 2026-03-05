import unicodedata

from django.core.management.base import BaseCommand
from django.db import transaction

from core.models import Equipo, HistorialUbicacionEquipo, Ubicacion


def _norm(text):
    value = str(text or "").strip().upper()
    value = unicodedata.normalize("NFD", value)
    value = "".join(ch for ch in value if unicodedata.category(ch) != "Mn")
    return " ".join(value.split())


class Command(BaseCommand):
    help = "Fusiona sedes duplicadas/typos (ej: 'La unioni') en su sede canónica."

    CANONICAL = (
        "Ánimas",
        "Yungay",
        "La Unión",
        "Bouchéff",
    )

    def handle(self, *args, **options):
        with transaction.atomic():
            summary = {
                "sede_corregida": None,
                "duplicados_borrados": 0,
                "equipos_reasignados": 0,
                "historial_anterior_reasignado": 0,
                "historial_nueva_reasignado": 0,
            }

            for canonical_name in self.CANONICAL:
                changed = self._merge_for_canonical(canonical_name)
                if changed["duplicados_borrados"] > 0:
                    summary = changed
                    break

            if summary["duplicados_borrados"] == 0:
                self.stdout.write(self.style.WARNING("No se detectaron sedes duplicadas para fusionar."))
                return

            self.stdout.write(
                self.style.SUCCESS(
                    f"Fusion completada en sede '{summary['sede_corregida']}'. "
                    f"Duplicados borrados: {summary['duplicados_borrados']}, "
                    f"equipos reasignados: {summary['equipos_reasignados']}, "
                    f"historial anterior reasignado: {summary['historial_anterior_reasignado']}, "
                    f"historial nueva reasignado: {summary['historial_nueva_reasignado']}."
                )
            )

    def _merge_for_canonical(self, canonical_name):
        canonical_norm = _norm(canonical_name)
        all_sedes = list(Ubicacion.objects.all())
        canonical_candidates = [s for s in all_sedes if _norm(s.nombre_sede) == canonical_norm]

        if canonical_candidates:
            keeper = canonical_candidates[0]
        else:
            keeper = Ubicacion.objects.create(nombre_sede=canonical_name, activo=True)

        duplicates = []
        for sede in all_sedes:
            if sede.id_ubicacion == keeper.id_ubicacion:
                continue
            n = _norm(sede.nombre_sede)
            if n == canonical_norm or n.startswith(canonical_norm) or canonical_norm.startswith(n):
                duplicates.append(sede)

        # Caso puntual reportado: "LA UNIONI"
        if canonical_norm == "LA UNION":
            for sede in all_sedes:
                if sede.id_ubicacion == keeper.id_ubicacion:
                    continue
                if "LA UNIONI" in _norm(sede.nombre_sede):
                    if sede not in duplicates:
                        duplicates.append(sede)

        if not duplicates:
            return {
                "sede_corregida": canonical_name,
                "duplicados_borrados": 0,
                "equipos_reasignados": 0,
                "historial_anterior_reasignado": 0,
                "historial_nueva_reasignado": 0,
            }

        duplicate_ids = [s.id_ubicacion for s in duplicates]
        equipos = Equipo.objects.filter(id_ubicacion_id__in=duplicate_ids).update(id_ubicacion=keeper)
        hist_prev = HistorialUbicacionEquipo.objects.filter(
            id_ubicacion_anterior_id__in=duplicate_ids
        ).update(id_ubicacion_anterior=keeper)
        hist_new = HistorialUbicacionEquipo.objects.filter(
            id_ubicacion_nueva_id__in=duplicate_ids
        ).update(id_ubicacion_nueva=keeper)

        deleted_count = 0
        for sede in duplicates:
            sede.delete()
            deleted_count += 1

        return {
            "sede_corregida": canonical_name,
            "duplicados_borrados": deleted_count,
            "equipos_reasignados": equipos,
            "historial_anterior_reasignado": hist_prev,
            "historial_nueva_reasignado": hist_new,
        }
