from django.core.management.base import BaseCommand

from core.excel_import import rollback_import_lote
from core.models import ImportacionInventarioLote


class Command(BaseCommand):
    help = "Revierte el último lote de importación de inventario o uno específico."

    def add_arguments(self, parser):
        parser.add_argument(
            "--id-lote",
            dest="id_lote",
            type=int,
            default=None,
            help="ID del lote a revertir. Si se omite, usa el último.",
        )

    def handle(self, *args, **options):
        lote = None
        if options["id_lote"] is not None:
            lote = ImportacionInventarioLote.objects.filter(id_lote=options["id_lote"]).first()
            if lote is None:
                raise ValueError(f'No existe el lote #{options["id_lote"]}.')

        summary = rollback_import_lote(lote=lote)
        self.stdout.write(self.style.SUCCESS("Rollback completado."))
        for key, value in summary.items():
            self.stdout.write(f"- {key}: {value}")
