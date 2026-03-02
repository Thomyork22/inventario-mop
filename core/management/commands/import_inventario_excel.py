from django.core.management.base import BaseCommand

from core.excel_import import DEFAULT_EXCEL_PATH, ExcelInventoryImporter


class Command(BaseCommand):
    help = "Importa inventario desde inventariop.xlsx (CODIGOS + EQUIPOS ACTIVOS DV)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--path",
            dest="path",
            default=DEFAULT_EXCEL_PATH,
            help=f'Ruta al Excel. Por defecto: "{DEFAULT_EXCEL_PATH}".',
        )

    def handle(self, *args, **options):
        importer = ExcelInventoryImporter(path=options["path"])
        summary = importer.run()

        self.stdout.write(self.style.SUCCESS("Importación completada."))
        for key, value in summary.items():
            self.stdout.write(f"- {key}: {value}")
