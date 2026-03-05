from django.test import TestCase
from rest_framework.test import APIRequestFactory

from .models import (
    AsignacionEquipo,
    Equipo,
    EstadoEquipo,
    Funcionario,
    Mantenimiento,
    TipoMantenimiento,
)
from .serializers import (
    AsignacionWriteSerializer,
    EquipoWriteSerializer,
    FuncionarioWriteSerializer,
    MantenimientoWriteSerializer,
)


class SerializerValidationTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.estado_disponible = EstadoEquipo.objects.create(
            descripcion="LIBRE",
            permite_asignacion=True,
        )
        self.funcionario = Funcionario.objects.create(
            rut="12345678-9",
            nombre_completo="Funcionario Test",
            email_institucional="funcionario@test.local",
            activo=True,
        )
        self.equipo = Equipo.objects.create(
            numero_inventario="INV-001",
            numero_serie="SER-001",
            codigo_estado=self.estado_disponible,
            activo=True,
        )
        self.tipo_mantenimiento = TipoMantenimiento.objects.create(descripcion="Correctivo")

    def test_funcionario_rejects_invalid_phone(self):
        serializer = FuncionarioWriteSerializer(
            data={
                "rut": "12345678-9",
                "nombre_completo": "Persona X",
                "email_institucional": "persona@test.local",
                "telefono": "ABC123",
            }
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("telefono", serializer.errors)

    def test_equipo_uppercases_inventory_and_serial(self):
        serializer = EquipoWriteSerializer(
            data={
                "numero_inventario": "inv-abc",
                "numero_serie": "ser-xyz",
                "garantia_meses": 12,
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["numero_inventario"], "INV-ABC")
        self.assertEqual(serializer.validated_data["numero_serie"], "SER-XYZ")

    def test_asignacion_rejects_devolution_before_assignation(self):
        request = self.factory.post("/api/asignaciones/")
        serializer = AsignacionWriteSerializer(
            data={
                "id_equipo_id": self.equipo.id_equipo,
                "id_funcionario_id": self.funcionario.id_funcionario,
                "fecha_asignacion": "2026-03-10",
                "fecha_devolucion": "2026-03-01",
            },
            context={"request": request},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("fecha_devolucion", serializer.errors)

    def test_mantenimiento_rejects_invalid_date_sequence(self):
        serializer = MantenimientoWriteSerializer(
            data={
                "id_equipo_id": self.equipo.id_equipo,
                "codigo_tipo_mantenimiento_id": self.tipo_mantenimiento.codigo_tipo_mantenimiento,
                "fecha_solicitud": "2026-03-10",
                "fecha_ingreso_taller": "2026-03-09",
            }
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn("fecha_ingreso_taller", serializer.errors)

    def test_mantenimiento_accepts_valid_date_sequence(self):
        serializer = MantenimientoWriteSerializer(
            data={
                "id_equipo_id": self.equipo.id_equipo,
                "codigo_tipo_mantenimiento_id": self.tipo_mantenimiento.codigo_tipo_mantenimiento,
                "fecha_solicitud": "2026-03-10",
                "fecha_ingreso_taller": "2026-03-11",
                "fecha_salida_taller": "2026-03-12",
                "fecha_entrega": "2026-03-13",
            }
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
