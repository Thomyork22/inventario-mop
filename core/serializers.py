from rest_framework import serializers

from .models import (
    Equipo, Marca, TipoEquipo, EstadoEquipo, CondicionEquipo,
    Ubicacion, Region,
    AsignacionEquipo, Funcionario,
    HistorialEstadoEquipo,
    Mantenimiento,
    TipoMantenimiento,
    EstadoMantenimiento,
    Ram,
    Procesador,
    SistemaOperativo,
    TipoDisco,
    TamanoDiscoCatalogo,
    MarcaMonitorCatalogo,
    PulgadaMonitorCatalogo,
    CargoFuncionario,
    UnidadFuncionario,
)

# -----------------------------
# Catálogos (lectura)
# -----------------------------

class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = ["codigo_marca", "codigo", "descripcion", "pais_origen"]


class TipoEquipoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoEquipo
        fields = ["codigo_tipo", "codigo", "descripcion"]


class EstadoEquipoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoEquipo
        fields = ["codigo_estado", "codigo", "descripcion", "permite_asignacion"]


class CondicionEquipoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CondicionEquipo
        fields = ["codigo_condicion", "codigo", "descripcion"]


class RamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ram
        fields = ["codigo_ram", "codigo", "descripcion"]


class ProcesadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Procesador
        fields = ["codigo_procesador", "codigo", "descripcion"]


class SistemaOperativoSerializer(serializers.ModelSerializer):
    class Meta:
        model = SistemaOperativo
        fields = ["codigo_so", "codigo", "descripcion", "nombre"]


class TipoDiscoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoDisco
        fields = ["codigo_disco", "codigo", "descripcion"]


class TamanoDiscoCatalogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TamanoDiscoCatalogo
        fields = ["id", "codigo", "descripcion"]


class MarcaMonitorCatalogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarcaMonitorCatalogo
        fields = ["id", "codigo", "descripcion"]


class PulgadaMonitorCatalogoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PulgadaMonitorCatalogo
        fields = ["id", "codigo", "descripcion"]


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ["codigo_region", "nombre", "numero_romano"]


class UbicacionSerializer(serializers.ModelSerializer):
    region = RegionSerializer(source="codigo_region", read_only=True)

    class Meta:
        model = Ubicacion
        fields = [
            "id_ubicacion",
            "nombre_sede",
            "direccion",
            "piso",
            "oficina",
            "descripcion_detallada",
            "activo",
            "fecha_creacion",
            "region",
        ]


class TipoMantenimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoMantenimiento
        fields = ["codigo_tipo_mantenimiento", "descripcion"]


class EstadoMantenimientoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EstadoMantenimiento
        fields = ["codigo_estado_mantenimiento", "descripcion"]


class CargoFuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = CargoFuncionario
        fields = ["codigo_cargo", "descripcion", "nivel_jerarquico"]


class UnidadFuncionarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnidadFuncionario
        fields = ["codigo_unidad", "descripcion", "sigla"]


# -----------------------------
# Equipo: LECTURA (bonito)
# -----------------------------

class EquipoReadSerializer(serializers.ModelSerializer):
    tipo_equipo = TipoEquipoSerializer(source="codigo_tipo", read_only=True)
    marca = MarcaSerializer(source="codigo_marca", read_only=True)
    estado = EstadoEquipoSerializer(source="codigo_estado", read_only=True)
    condicion = CondicionEquipoSerializer(source="codigo_condicion", read_only=True)
    ram = RamSerializer(source="codigo_ram", read_only=True)
    procesador = ProcesadorSerializer(source="codigo_procesador", read_only=True)
    sistema_operativo = SistemaOperativoSerializer(source="codigo_so", read_only=True)
    tipo_disco = TipoDiscoSerializer(source="codigo_disco", read_only=True)
    tamano_disco_catalogo = TamanoDiscoCatalogoSerializer(source="tamano_disco", read_only=True)
    ubicacion = UbicacionSerializer(source="id_ubicacion", read_only=True)

    class Meta:
        model = Equipo
        fields = [
            "id_equipo",
            "numero_inventario",
            "numero_serie",
            "nombre_equipo",
            "ip_maquina",
            "direccion_oficina_piso",
            "modelo",
            "capacidad_disco_gb",
            "fecha_compra",
            "fecha_ingreso_inventario",
            "valor_compra",
            "proveedor",
            "numero_factura",
            "garantia_meses",
            "fecha_fin_garantia",
            "observaciones",
            "raw_excel_data",
            "imagen_equipo",
            "codigo_qr",
            "activo",
            "fecha_creacion",
            "fecha_actualizacion",

            # embebidos (lectura)
            "tipo_equipo",
            "marca",
            "estado",
            "condicion",
            "ram",
            "procesador",
            "sistema_operativo",
            "tipo_disco",
            "tamano_disco_catalogo",
            "ubicacion",

            # otros FKs (como ID)
            "codigo_ram",
            "codigo_procesador",
            "codigo_so",
            "codigo_disco",
            "tamano_disco",
            "codigo_condicion",
            "codigo_tipo_adquisicion",
            "creado_por",
            "actualizado_por",
        ]


# -----------------------------
# Equipo: ESCRITURA (por IDs)
# -----------------------------

class EquipoWriteSerializer(serializers.ModelSerializer):
    codigo_tipo_id = serializers.PrimaryKeyRelatedField(
        source="codigo_tipo", queryset=TipoEquipo.objects.all(), required=False, allow_null=True
    )
    codigo_marca_id = serializers.PrimaryKeyRelatedField(
        source="codigo_marca", queryset=Marca.objects.all(), required=False, allow_null=True
    )
    codigo_estado_id = serializers.PrimaryKeyRelatedField(
        source="codigo_estado", queryset=EstadoEquipo.objects.all(), required=False, allow_null=True
    )
    codigo_condicion_id = serializers.PrimaryKeyRelatedField(
        source="codigo_condicion", queryset=CondicionEquipo.objects.all(), required=False, allow_null=True
    )
    codigo_ram_id = serializers.PrimaryKeyRelatedField(
        source="codigo_ram", queryset=Ram.objects.all(), required=False, allow_null=True
    )
    codigo_procesador_id = serializers.PrimaryKeyRelatedField(
        source="codigo_procesador", queryset=Procesador.objects.all(), required=False, allow_null=True
    )
    codigo_so_id = serializers.PrimaryKeyRelatedField(
        source="codigo_so", queryset=SistemaOperativo.objects.all(), required=False, allow_null=True
    )
    codigo_disco_id = serializers.PrimaryKeyRelatedField(
        source="codigo_disco", queryset=TipoDisco.objects.all(), required=False, allow_null=True
    )
    tamano_disco_id = serializers.PrimaryKeyRelatedField(
        source="tamano_disco", queryset=TamanoDiscoCatalogo.objects.all(), required=False, allow_null=True
    )
    id_ubicacion_id = serializers.PrimaryKeyRelatedField(
        source="id_ubicacion", queryset=Ubicacion.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Equipo
        fields = [
            "numero_inventario",
            "numero_serie",
            "nombre_equipo",
            "ip_maquina",
            "direccion_oficina_piso",
            "modelo",
            "capacidad_disco_gb",
            "fecha_compra",
            "fecha_ingreso_inventario",
            "valor_compra",
            "proveedor",
            "numero_factura",
            "garantia_meses",
            "fecha_fin_garantia",
            "observaciones",
            "imagen_equipo",
            "codigo_qr",
            "activo",

            # escritura por IDs
            "codigo_tipo_id",
            "codigo_marca_id",
            "codigo_estado_id",
            "codigo_condicion_id",
            "codigo_ram_id",
            "codigo_procesador_id",
            "codigo_so_id",
            "codigo_disco_id",
            "tamano_disco_id",
            "id_ubicacion_id",

            # otros FK por ahora como IDs directos (de tu modelo)
            "codigo_tipo_adquisicion",
            "creado_por",
            "actualizado_por",
        ]

    def validate_numero_inventario(self, value):
        clean = (value or "").strip()
        if not clean:
            raise serializers.ValidationError("El número de inventario es obligatorio.")
        if len(clean) < 3 or len(clean) > 50:
            raise serializers.ValidationError("El número de inventario debe tener entre 3 y 50 caracteres.")
        return clean.upper()

    def validate_numero_serie(self, value):
        clean = (value or "").strip()
        if not clean:
            raise serializers.ValidationError("El número de serie es obligatorio.")
        if len(clean) < 3 or len(clean) > 100:
            raise serializers.ValidationError("El número de serie debe tener entre 3 y 100 caracteres.")
        return clean.upper()

    def validate_garantia_meses(self, value):
        if value is None:
            return value
        if value < 0 or value > 120:
            raise serializers.ValidationError("La garantía en meses debe estar entre 0 y 120.")
        return value


# -----------------------------
# Funcionario mini (lectura) -> lo dejo IGUAL
# -----------------------------

class FuncionarioMiniSerializer(serializers.ModelSerializer):
    cargo = CargoFuncionarioSerializer(source="codigo_cargo", read_only=True)
    unidad = UnidadFuncionarioSerializer(source="codigo_unidad", read_only=True)

    class Meta:
        model = Funcionario
        fields = [
            "id_funcionario",
            "rut",
            "nombre_completo",
            "email_institucional",
            "activo",
            "codigo_cargo",
            "codigo_unidad",
            "cargo",
            "unidad",
        ]



# -----------------------------
# ✅ Funcionario: LECTURA (detalle)
# -----------------------------

class FuncionarioReadSerializer(serializers.ModelSerializer):
    cargo = CargoFuncionarioSerializer(source="codigo_cargo", read_only=True)
    unidad = UnidadFuncionarioSerializer(source="codigo_unidad", read_only=True)

    class Meta:
        model = Funcionario
        fields = [
            "id_funcionario",
            "rut",
            "nombre_completo",
            "email_institucional",
            "telefono",
            "codigo_cargo",
            "codigo_unidad",
            "tipo_contrato",
            "fecha_ingreso",
            "fecha_salida",
            "activo",
            "fecha_creacion",
            "fecha_actualizacion",
            "raw_excel_data",
            "cargo",
            "unidad",
        ]


# -----------------------------
# ✅ Funcionario: ESCRITURA (acepta codigo_cargo_id / codigo_unidad_id como tu front)
# -----------------------------

class FuncionarioWriteSerializer(serializers.ModelSerializer):
    codigo_cargo_id = serializers.PrimaryKeyRelatedField(
        source="codigo_cargo",
        queryset=CargoFuncionario.objects.all(),
        required=False,
        allow_null=True,
    )
    codigo_unidad_id = serializers.PrimaryKeyRelatedField(
        source="codigo_unidad",
        queryset=UnidadFuncionario.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Funcionario
        fields = [
            "rut",
            "nombre_completo",
            "email_institucional",
            "telefono",
            "codigo_cargo_id",
            "codigo_unidad_id",
            "tipo_contrato",
            "fecha_ingreso",
            "fecha_salida",
            "activo",
        ]

    def validate_rut(self, value):
        clean = (value or "").strip().upper()
        if len(clean) < 8 or len(clean) > 12:
            raise serializers.ValidationError("El RUT debe tener entre 8 y 12 caracteres.")
        return clean

    def validate_telefono(self, value):
        clean = (value or "").strip()
        if not clean:
            return clean
        valid_chars = set("0123456789+ -()")
        if any(ch not in valid_chars for ch in clean):
            raise serializers.ValidationError("El teléfono solo permite dígitos y + - ( ).")
        digits = "".join(ch for ch in clean if ch.isdigit())
        if len(digits) < 7 or len(digits) > 15:
            raise serializers.ValidationError("El teléfono debe tener entre 7 y 15 dígitos.")
        return clean


# -----------------------------
# Asignación: LECTURA (bonito)
# -----------------------------

class AsignacionReadSerializer(serializers.ModelSerializer):
    equipo = EquipoReadSerializer(source="id_equipo", read_only=True)
    funcionario = FuncionarioMiniSerializer(source="id_funcionario", read_only=True)

    class Meta:
        model = AsignacionEquipo
        fields = [
            "id_asignacion",
            "fecha_asignacion",
            "fecha_devolucion",
            "motivo_asignacion",
            "estado_equipo_entrega",
            "estado_equipo_devolucion",
            "acta_entrega",
            "acta_devolucion",
            "observaciones_entrega",
            "observaciones_devolucion",
            "nombre_responsable_entrega",
            "fecha_entrega_excel",
            "estado_asignacion",
            "activo",
            "fecha_creacion",
            "fecha_actualizacion",
            "equipo",
            "funcionario",
        ]


# -----------------------------
# Asignación: ESCRITURA (por IDs)
# + validación: no asignar si ya está ocupado
# -----------------------------

class AsignacionWriteSerializer(serializers.ModelSerializer):
    id_equipo_id = serializers.PrimaryKeyRelatedField(
        source="id_equipo", queryset=Equipo.objects.all()
    )
    id_funcionario_id = serializers.PrimaryKeyRelatedField(
        source="id_funcionario", queryset=Funcionario.objects.all()
    )

    class Meta:
        model = AsignacionEquipo
        fields = [
            "id_equipo_id",
            "id_funcionario_id",
            "fecha_asignacion",
            "fecha_devolucion",
            "motivo_asignacion",
            "estado_equipo_entrega",
            "estado_equipo_devolucion",
            "acta_entrega",
            "acta_devolucion",
            "observaciones_entrega",
            "observaciones_devolucion",
            "nombre_responsable_entrega",
            "fecha_entrega_excel",
            "estado_asignacion",
            "activo",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        method = getattr(request, "method", "").upper()

        equipo = attrs.get("id_equipo") if "id_equipo" in attrs else getattr(self.instance, "id_equipo", None)
        fecha_asignacion = attrs.get("fecha_asignacion", getattr(self.instance, "fecha_asignacion", None))
        fecha_devolucion = attrs.get("fecha_devolucion", getattr(self.instance, "fecha_devolucion", None))

        if fecha_asignacion and fecha_devolucion and fecha_devolucion < fecha_asignacion:
            raise serializers.ValidationError(
                {"fecha_devolucion": "La fecha de devolución no puede ser anterior a la fecha de asignación."}
            )

        if equipo is None:
            return attrs

        if method == "POST":
            if not equipo.codigo_estado or equipo.codigo_estado.permite_asignacion is not True:
                raise serializers.ValidationError(
                    {"id_equipo_id": "Este equipo no está disponible para asignación (estado no permite asignación)."}
                )

            ya_activa = AsignacionEquipo.objects.filter(
                id_equipo=equipo,
                activo=True,
                fecha_devolucion__isnull=True,
            ).exists()

            if ya_activa:
                raise serializers.ValidationError(
                    {"id_equipo_id": "Este equipo ya tiene una asignación activa. Devuélvelo antes de reasignar."}
                )

        return attrs


# -----------------------------
# Historial: LECTURA (para Dashboard)
# -----------------------------

class HistorialEstadoEquipoReadSerializer(serializers.ModelSerializer):
    equipo = EquipoReadSerializer(source="id_equipo", read_only=True)

    codigo_estado_anterior = EstadoEquipoSerializer(read_only=True)
    codigo_estado_nuevo = EstadoEquipoSerializer(read_only=True)

    class Meta:
        model = HistorialEstadoEquipo
        fields = [
            "id_historial_estado",
            "fecha_cambio",
            "motivo_detallado",
            "observaciones",
            "ip_address",
            "navegador",
            "documentos_respaldo",
            "codigo_estado_anterior",
            "codigo_estado_nuevo",
            "id_funcionario_ejecuta",
            "equipo",
        ]


# -----------------------------
# Mantenimiento: LECTURA
# -----------------------------

class MantenimientoReadSerializer(serializers.ModelSerializer):
    equipo = EquipoReadSerializer(source="id_equipo", read_only=True)
    tipo_mantenimiento = TipoMantenimientoSerializer(source="codigo_tipo_mantenimiento", read_only=True)

    estado_mantenimiento = EstadoMantenimientoSerializer(source="codigo_estado_mantenimiento", read_only=True)
    estado_mantenimiento_display = serializers.SerializerMethodField()

    def get_estado_mantenimiento_display(self, obj):
        est = getattr(obj, "codigo_estado_mantenimiento", None)
        if est is None:
            return None
        if hasattr(est, "descripcion"):
            return est.descripcion
        return str(est)

    class Meta:
        model = Mantenimiento
        fields = [
            "id_mantenimiento",
            "fecha_solicitud",
            "fecha_ingreso_taller",
            "fecha_salida_taller",
            "fecha_entrega",
            "problema_reportado",
            "diagnostico_tecnico",
            "solucion_aplicada",
            "repuestos_utilizados",
            "costo_repuestos",
            "costo_mano_obra",
            "costo_total",
            "proveedor_servicio",
            "tecnico_responsable",
            "numero_orden_trabajo",
            "numero_factura",
            "garantia_aplicada",
            "observaciones",
            "documentos_adjuntos",
            "fecha_creacion",
            "fecha_actualizacion",

            "equipo",
            "tipo_mantenimiento",

            "codigo_estado_mantenimiento",
            "estado_mantenimiento",
            "estado_mantenimiento_display",

            "id_funcionario_solicita",
            "id_funcionario_recibe",
            "creado_por",
            "actualizado_por",
        ]


# -----------------------------
# Mantenimiento: ESCRITURA
# -----------------------------

class MantenimientoWriteSerializer(serializers.ModelSerializer):
    id_equipo_id = serializers.PrimaryKeyRelatedField(
        source="id_equipo", queryset=Equipo.objects.all()
    )
    codigo_tipo_mantenimiento_id = serializers.PrimaryKeyRelatedField(
        source="codigo_tipo_mantenimiento", queryset=TipoMantenimiento.objects.all()
    )

    codigo_estado_mantenimiento_id = serializers.PrimaryKeyRelatedField(
        source="codigo_estado_mantenimiento",
        queryset=EstadoMantenimiento.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Mantenimiento
        fields = [
            "id_equipo_id",
            "codigo_tipo_mantenimiento_id",
            "codigo_estado_mantenimiento_id",

            "fecha_solicitud",
            "fecha_ingreso_taller",
            "fecha_salida_taller",
            "fecha_entrega",
            "problema_reportado",
            "diagnostico_tecnico",
            "solucion_aplicada",
            "repuestos_utilizados",
            "costo_repuestos",
            "costo_mano_obra",
            "costo_total",
            "proveedor_servicio",
            "tecnico_responsable",
            "numero_orden_trabajo",
            "numero_factura",
            "garantia_aplicada",
            "observaciones",
            "documentos_adjuntos",

            "id_funcionario_solicita",
            "id_funcionario_recibe",
            "creado_por",
            "actualizado_por",
        ]

    def validate(self, attrs):
        fecha_solicitud = attrs.get("fecha_solicitud", getattr(self.instance, "fecha_solicitud", None))
        fecha_ingreso = attrs.get("fecha_ingreso_taller", getattr(self.instance, "fecha_ingreso_taller", None))
        fecha_salida = attrs.get("fecha_salida_taller", getattr(self.instance, "fecha_salida_taller", None))
        fecha_entrega = attrs.get("fecha_entrega", getattr(self.instance, "fecha_entrega", None))

        if fecha_solicitud and fecha_ingreso and fecha_ingreso < fecha_solicitud:
            raise serializers.ValidationError(
                {"fecha_ingreso_taller": "La fecha de ingreso al taller no puede ser anterior a la solicitud."}
            )
        if fecha_ingreso and fecha_salida and fecha_salida < fecha_ingreso:
            raise serializers.ValidationError(
                {"fecha_salida_taller": "La salida de taller no puede ser anterior al ingreso."}
            )
        if fecha_salida and fecha_entrega and fecha_entrega < fecha_salida:
            raise serializers.ValidationError(
                {"fecha_entrega": "La entrega no puede ser anterior a la salida de taller."}
            )

        return attrs
