from django.core.management.base import BaseCommand

from core.excel_import import ExcelInventoryImporter


class Command(BaseCommand):
    help = "Completa id_ubicacion en equipos existentes usando datos importados desde Excel."

    def handle(self, *args, **options):
        importer = ExcelInventoryImporter()
        updated = importer.run_backfill_ubicaciones()
        self.stdout.write(
            self.style.SUCCESS(
                f"Backfill completado. Equipos actualizados con ubicación: {updated}"
            )
        )
