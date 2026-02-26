# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.

from django.db import models


class AsignacionEquipo(models.Model):
    id_asignacion = models.AutoField(primary_key=True)
    id_equipo = models.ForeignKey('Equipo', models.DO_NOTHING, db_column='id_equipo', blank=True, null=True)
    id_funcionario = models.ForeignKey('Funcionario', models.DO_NOTHING, db_column='id_funcionario', blank=True, null=True)
    fecha_asignacion = models.DateField(blank=True, null=True)
    fecha_devolucion = models.DateField(blank=True, null=True)
    motivo_asignacion = models.TextField(blank=True, null=True)
    estado_equipo_entrega = models.CharField(max_length=100, blank=True, null=True)
    estado_equipo_devolucion = models.CharField(max_length=100, blank=True, null=True)
    acta_entrega = models.CharField(max_length=255, blank=True, null=True)
    acta_devolucion = models.CharField(max_length=255, blank=True, null=True)
    observaciones_entrega = models.TextField(blank=True, null=True)
    observaciones_devolucion = models.TextField(blank=True, null=True)
    estado_asignacion = models.CharField(max_length=50, blank=True, null=True)
    activo = models.BooleanField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)
    creado_por = models.ForeignKey('Funcionario', models.DO_NOTHING, db_column='creado_por', related_name='asignacionequipo_creado_por_set', blank=True, null=True)
    actualizado_por = models.ForeignKey('Funcionario', models.DO_NOTHING, db_column='actualizado_por', related_name='asignacionequipo_actualizado_por_set', blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'asignacion_equipo'
        ordering = ['-id_asignacion']

    def __str__(self):
        inv = getattr(self.id_equipo, "numero_inventario", None) if self.id_equipo else None
        nom = getattr(self.id_funcionario, "nombre_completo", None) if self.id_funcionario else None
        return f"Asignación #{self.id_asignacion} - {inv or 'Sin equipo'} -> {nom or 'Sin funcionario'}"


class BajaEquipo(models.Model):
    id_baja = models.AutoField(primary_key=True)
    id_equipo = models.OneToOneField('Equipo', models.DO_NOTHING, db_column='id_equipo', blank=True, null=True)
    fecha_solicitud_baja = models.DateField(blank=True, null=True)
    fecha_aprobacion_baja = models.DateField(blank=True, null=True)
    fecha_baja_efectiva = models.DateField(blank=True, null=True)
    motivo_baja = models.TextField(blank=True, null=True)
    tipo_baja = models.CharField(max_length=100, blank=True, null=True)
    id_funcionario_solicita = models.ForeignKey('Funcionario', models.DO_NOTHING, db_column='id_funcionario_solicita', blank=True, null=True)
    id_funcionario_aprueba = models.ForeignKey('Funcionario', models.DO_NOTHING, db_column='id_funcionario_aprueba', related_name='bajaequipo_id_funcionario_aprueba_set', blank=True, null=True)
    valor_libro = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    valor_recuperado = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    destino_final = models.CharField(max_length=150, blank=True, null=True)
    empresa_reciclaje = models.CharField(max_length=150, blank=True, null=True)
    numero_acta_baja = models.CharField(max_length=100, blank=True, null=True)
    acta_baja_documento = models.CharField(max_length=255, blank=True, null=True)
    certificado_destruccion = models.CharField(max_length=255, blank=True, null=True)
    estado_solicitud = models.CharField(max_length=100, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)
    actualizado_por = models.ForeignKey('Funcionario', models.DO_NOTHING, db_column='actualizado_por', related_name='bajaequipo_actualizado_por_set', blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'baja_equipo'
        ordering = ['-id_baja']

    def __str__(self):
        inv = getattr(self.id_equipo, "numero_inventario", None) if self.id_equipo else None
        return f"Baja #{self.id_baja} - {inv or 'Sin equipo'}"


class CargoFuncionario(models.Model):
    codigo_cargo = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)
    nivel_jerarquico = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'cargo_funcionario'
        ordering = ['descripcion']

    def __str__(self):
        return self.descripcion


class CondicionEquipo(models.Model):
    codigo_condicion = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'condicion_equipo'
        ordering = ['descripcion']

    def __str__(self):
        return self.descripcion


class Equipo(models.Model):
    id_equipo = models.AutoField(primary_key=True)
    numero_inventario = models.CharField(unique=True, max_length=50)
    numero_serie = models.CharField(unique=True, max_length=100)
    codigo_tipo = models.ForeignKey('TipoEquipo', models.DO_NOTHING, db_column='codigo_tipo', blank=True, null=True)
    codigo_marca = models.ForeignKey('Marca', models.DO_NOTHING, db_column='codigo_marca', blank=True, null=True)
    modelo = models.CharField(max_length=100, blank=True, null=True)
    codigo_ram = models.ForeignKey('Ram', models.DO_NOTHING, db_column='codigo_ram', blank=True, null=True)
    codigo_procesador = models.ForeignKey('Procesador', models.DO_NOTHING, db_column='codigo_procesador', blank=True, null=True)
    codigo_so = models.ForeignKey('SistemaOperativo', models.DO_NOTHING, db_column='codigo_so', blank=True, null=True)
    codigo_disco = models.ForeignKey('TipoDisco', models.DO_NOTHING, db_column='codigo_disco', blank=True, null=True)
    capacidad_disco_gb = models.IntegerField(blank=True, null=True)
    codigo_condicion = models.ForeignKey(CondicionEquipo, models.DO_NOTHING, db_column='codigo_condicion', blank=True, null=True)
    codigo_estado = models.ForeignKey('EstadoEquipo', models.DO_NOTHING, db_column='codigo_estado', blank=True, null=True)
    id_ubicacion = models.ForeignKey('Ubicacion', models.DO_NOTHING, db_column='id_ubicacion', blank=True, null=True)
    fecha_compra = models.DateField(blank=True, null=True)
    fecha_ingreso_inventario = models.DateField(blank=True, null=True)
    valor_compra = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    codigo_tipo_adquisicion = models.ForeignKey('TipoAdquisicion', models.DO_NOTHING, db_column='codigo_tipo_adquisicion', blank=True, null=True)
    proveedor = models.CharField(max_length=150, blank=True, null=True)
    numero_factura = models.CharField(max_length=100, blank=True, null=True)
    garantia_meses = models.IntegerField(blank=True, null=True)
    fecha_fin_garantia = models.DateField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    imagen_equipo = models.CharField(max_length=255, blank=True, null=True)
    codigo_qr = models.CharField(max_length=255, blank=True, null=True)
    activo = models.BooleanField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)
    creado_por = models.ForeignKey('Funcionario', models.DO_NOTHING, db_column='creado_por', blank=True, null=True)
    actualizado_por = models.ForeignKey('Funcionario', models.DO_NOTHING, db_column='actualizado_por', related_name='equipo_actualizado_por_set', blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'equipo'
        ordering = ['-id_equipo']

    def __str__(self):
        return f"{self.numero_inventario} · {self.modelo or 'Sin modelo'}"


class EquipoMonitor(models.Model):
    id_equipo_monitor = models.AutoField(primary_key=True)
    id_equipo = models.ForeignKey(Equipo, models.DO_NOTHING, db_column='id_equipo', blank=True, null=True)
    marca_monitor = models.CharField(max_length=100, blank=True, null=True)
    modelo_monitor = models.CharField(max_length=100, blank=True, null=True)
    pulgadas = models.IntegerField(blank=True, null=True)
    resolucion = models.CharField(max_length=50, blank=True, null=True)
    tipo_panel = models.CharField(max_length=50, blank=True, null=True)
    numero_serie_monitor = models.CharField(unique=True, max_length=100, blank=True, null=True)
    fecha_asignacion_monitor = models.DateField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    activo = models.BooleanField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)
    creado_por = models.ForeignKey('Funcionario', models.DO_NOTHING, db_column='creado_por', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'equipo_monitor'
        ordering = ['-id_equipo_monitor']

    def __str__(self):
        inv = getattr(self.id_equipo, "numero_inventario", None) if self.id_equipo else None
        return f"Monitor #{self.id_equipo_monitor} - {inv or 'Sin equipo'}"


class EstadoEquipo(models.Model):
    codigo_estado = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)
    permite_asignacion = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'estado_equipo'
        ordering = ['descripcion']

    def __str__(self):
        return self.descripcion


class EstadoMantenimiento(models.Model):
    codigo_estado_mantenimiento = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'estado_mantenimiento'
        ordering = ['descripcion']

    def __str__(self):
        return self.descripcion


class Funcionario(models.Model):
    id_funcionario = models.AutoField(primary_key=True)
    rut = models.CharField(unique=True, max_length=20)
    nombre_completo = models.CharField(max_length=150)
    email_institucional = models.CharField(unique=True, max_length=150)
    telefono = models.CharField(max_length=30, blank=True, null=True)
    codigo_cargo = models.ForeignKey(CargoFuncionario, models.DO_NOTHING, db_column='codigo_cargo', blank=True, null=True)
    codigo_unidad = models.ForeignKey('UnidadFuncionario', models.DO_NOTHING, db_column='codigo_unidad', blank=True, null=True)
    fecha_ingreso = models.DateField(blank=True, null=True)
    fecha_salida = models.DateField(blank=True, null=True)
    activo = models.BooleanField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)
    actualizado_por = models.ForeignKey('self', models.DO_NOTHING, db_column='actualizado_por', blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'funcionario'
        ordering = ['nombre_completo']

    def __str__(self):
        return f"{self.nombre_completo} ({self.rut})"


class HistorialEstadoEquipo(models.Model):
    id_historial_estado = models.AutoField(primary_key=True)
    id_equipo = models.ForeignKey(Equipo, models.DO_NOTHING, db_column='id_equipo', blank=True, null=True)
    codigo_estado_anterior = models.ForeignKey(EstadoEquipo, models.DO_NOTHING, db_column='codigo_estado_anterior', blank=True, null=True)
    codigo_estado_nuevo = models.ForeignKey(EstadoEquipo, models.DO_NOTHING, db_column='codigo_estado_nuevo', related_name='historialestadoequipo_codigo_estado_nuevo_set', blank=True, null=True)
    codigo_motivo = models.ForeignKey('MotivoEstadoEquipo', models.DO_NOTHING, db_column='codigo_motivo', blank=True, null=True)
    fecha_cambio = models.DateTimeField(blank=True, null=True)
    id_funcionario_ejecuta = models.ForeignKey(Funcionario, models.DO_NOTHING, db_column='id_funcionario_ejecuta', blank=True, null=True)
    motivo_detallado = models.TextField(blank=True, null=True)
    documentos_respaldo = models.TextField(blank=True, null=True)
    ip_address = models.CharField(max_length=50, blank=True, null=True)
    navegador = models.CharField(max_length=100, blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'historial_estado_equipo'
        ordering = ['-id_historial_estado']

    def __str__(self):
        inv = getattr(self.id_equipo, "numero_inventario", None) if self.id_equipo else None
        return f"Historial #{self.id_historial_estado} - {inv or 'Sin equipo'}"


class HistorialUbicacionEquipo(models.Model):
    id_historial_ubicacion = models.AutoField(primary_key=True)
    id_equipo = models.ForeignKey(Equipo, models.DO_NOTHING, db_column='id_equipo', blank=True, null=True)
    id_ubicacion_anterior = models.ForeignKey('Ubicacion', models.DO_NOTHING, db_column='id_ubicacion_anterior', blank=True, null=True)
    id_ubicacion_nueva = models.ForeignKey('Ubicacion', models.DO_NOTHING, db_column='id_ubicacion_nueva', related_name='historialubicacionequipo_id_ubicacion_nueva_set', blank=True, null=True)
    fecha_movimiento = models.DateTimeField(blank=True, null=True)
    motivo_movimiento = models.TextField(blank=True, null=True)
    acta_movimiento = models.CharField(max_length=255, blank=True, null=True)
    id_funcionario_autoriza = models.ForeignKey(Funcionario, models.DO_NOTHING, db_column='id_funcionario_autoriza', blank=True, null=True)
    id_funcionario_ejecuta = models.ForeignKey(Funcionario, models.DO_NOTHING, db_column='id_funcionario_ejecuta', related_name='historialubicacionequipo_id_funcionario_ejecuta_set', blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'historial_ubicacion_equipo'
        ordering = ['-id_historial_ubicacion']

    def __str__(self):
        inv = getattr(self.id_equipo, "numero_inventario", None) if self.id_equipo else None
        return f"Mov. Ubicación #{self.id_historial_ubicacion} - {inv or 'Sin equipo'}"


class LogAuditoriaGeneral(models.Model):
    id_log = models.AutoField(primary_key=True)
    tabla_afectada = models.CharField(max_length=100, blank=True, null=True)
    id_registro_afectado = models.IntegerField(blank=True, null=True)
    tipo_operacion = models.CharField(max_length=20, blank=True, null=True)
    datos_anteriores = models.TextField(blank=True, null=True)
    datos_nuevos = models.TextField(blank=True, null=True)
    id_usuario_ejecuta = models.ForeignKey('UsuarioSistema', models.DO_NOTHING, db_column='id_usuario_ejecuta', blank=True, null=True)
    fecha_hora_operacion = models.DateTimeField(blank=True, null=True)
    ip_address = models.CharField(max_length=50, blank=True, null=True)
    navegador = models.CharField(max_length=100, blank=True, null=True)
    sistema_operativo = models.CharField(max_length=100, blank=True, null=True)
    exito = models.BooleanField(blank=True, null=True)
    mensaje_error = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'log_auditoria_general'
        ordering = ['-id_log']

    def __str__(self):
        return f"Log #{self.id_log} - {self.tabla_afectada or 'N/A'}"


class Mantenimiento(models.Model):
    id_mantenimiento = models.AutoField(primary_key=True)
    id_equipo = models.ForeignKey(Equipo, models.DO_NOTHING, db_column='id_equipo', blank=True, null=True)
    codigo_tipo_mantenimiento = models.ForeignKey('TipoMantenimiento', models.DO_NOTHING, db_column='codigo_tipo_mantenimiento', blank=True, null=True)
    fecha_solicitud = models.DateField(blank=True, null=True)
    fecha_ingreso_taller = models.DateField(blank=True, null=True)
    fecha_salida_taller = models.DateField(blank=True, null=True)
    fecha_entrega = models.DateField(blank=True, null=True)
    problema_reportado = models.TextField(blank=True, null=True)
    diagnostico_tecnico = models.TextField(blank=True, null=True)
    solucion_aplicada = models.TextField(blank=True, null=True)
    repuestos_utilizados = models.TextField(blank=True, null=True)
    costo_repuestos = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    costo_mano_obra = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    costo_total = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)
    proveedor_servicio = models.CharField(max_length=150, blank=True, null=True)
    tecnico_responsable = models.CharField(max_length=150, blank=True, null=True)
    numero_orden_trabajo = models.CharField(max_length=100, blank=True, null=True)
    numero_factura = models.CharField(max_length=100, blank=True, null=True)
    garantia_aplicada = models.BooleanField(blank=True, null=True)
    id_funcionario_solicita = models.ForeignKey(Funcionario, models.DO_NOTHING, db_column='id_funcionario_solicita', blank=True, null=True)
    id_funcionario_recibe = models.ForeignKey(Funcionario, models.DO_NOTHING, db_column='id_funcionario_recibe', related_name='mantenimiento_id_funcionario_recibe_set', blank=True, null=True)
    codigo_estado_mantenimiento = models.ForeignKey(EstadoMantenimiento, models.DO_NOTHING, db_column='codigo_estado_mantenimiento', blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)
    documentos_adjuntos = models.TextField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)
    creado_por = models.ForeignKey(Funcionario, models.DO_NOTHING, db_column='creado_por', related_name='mantenimiento_creado_por_set', blank=True, null=True)
    actualizado_por = models.ForeignKey(Funcionario, models.DO_NOTHING, db_column='actualizado_por', related_name='mantenimiento_actualizado_por_set', blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'mantenimiento'
        ordering = ['-id_mantenimiento']

    def __str__(self):
        inv = getattr(self.id_equipo, "numero_inventario", None) if self.id_equipo else None
        return f"Mantención #{self.id_mantenimiento} - {inv or 'Sin equipo'}"


class Marca(models.Model):
    codigo_marca = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)
    pais_origen = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'marca'
        ordering = ['descripcion']

    def __str__(self):
        return self.descripcion


class MotivoEstadoEquipo(models.Model):
    codigo_motivo = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=150)

    class Meta:
        managed = False
        db_table = 'motivo_estado_equipo'
        ordering = ['descripcion']

    def __str__(self):
        return self.descripcion


class Procesador(models.Model):
    codigo_procesador = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=150)
    fabricante = models.CharField(max_length=100, blank=True, null=True)
    generacion = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'procesador'
        ordering = ['descripcion']

    def __str__(self):
        return self.descripcion


class Ram(models.Model):
    codigo_ram = models.AutoField(primary_key=True)
    capacidad_gb = models.IntegerField()
    tipo = models.CharField(max_length=50)

    class Meta:
        managed = False
        db_table = 'ram'
        ordering = ['capacidad_gb']

    def __str__(self):
        return f"{self.capacidad_gb} GB {self.tipo}"


class Region(models.Model):
    codigo_region = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    numero_romano = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'region'
        ordering = ['codigo_region']

    def __str__(self):
        return self.nombre


class ReporteGenerado(models.Model):
    id_reporte = models.AutoField(primary_key=True)
    tipo_reporte = models.CharField(max_length=100, blank=True, null=True)
    nombre_reporte = models.CharField(max_length=150, blank=True, null=True)
    parametros_filtro = models.TextField(blank=True, null=True)
    formato_exportacion = models.CharField(max_length=50, blank=True, null=True)
    ruta_archivo = models.CharField(max_length=255, blank=True, null=True)
    cantidad_registros = models.IntegerField(blank=True, null=True)
    fecha_generacion = models.DateTimeField(blank=True, null=True)
    id_funcionario_genera = models.ForeignKey(Funcionario, models.DO_NOTHING, db_column='id_funcionario_genera', blank=True, null=True)
    tiempo_generacion_segundos = models.IntegerField(blank=True, null=True)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'reporte_generado'
        ordering = ['-id_reporte']

    def __str__(self):
        return f"Reporte #{self.id_reporte} - {self.nombre_reporte or 'Sin nombre'}"


class RolSistema(models.Model):
    codigo_rol = models.AutoField(primary_key=True)
    nombre_rol = models.CharField(max_length=50)
    puede_eliminar = models.BooleanField(blank=True, null=True)
    puede_aprobar_bajas = models.BooleanField(blank=True, null=True)
    puede_generar_reportes = models.BooleanField(blank=True, null=True)
    puede_editar_catalogos = models.BooleanField(blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'rol_sistema'
        ordering = ['nombre_rol']

    def __str__(self):
        return self.nombre_rol


class SistemaOperativo(models.Model):
    codigo_so = models.AutoField(primary_key=True)
    nombre = models.CharField(max_length=100)
    version = models.CharField(max_length=50, blank=True, null=True)
    fabricante = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sistema_operativo'
        ordering = ['nombre', 'version']

    def __str__(self):
        v = f" {self.version}" if self.version else ""
        return f"{self.nombre}{v}"


class TipoAdquisicion(models.Model):
    codigo_tipo_adquisicion = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'tipo_adquisicion'
        ordering = ['descripcion']

    def __str__(self):
        return self.descripcion


class TipoDisco(models.Model):
    codigo_disco = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'tipo_disco'
        ordering = ['descripcion']

    def __str__(self):
        return self.descripcion


class TipoEquipo(models.Model):
    codigo_tipo = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'tipo_equipo'
        ordering = ['descripcion']

    def __str__(self):
        return self.descripcion


class TipoMantenimiento(models.Model):
    codigo_tipo_mantenimiento = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'tipo_mantenimiento'
        ordering = ['descripcion']

    def __str__(self):
        return self.descripcion


class Ubicacion(models.Model):
    id_ubicacion = models.AutoField(primary_key=True)
    codigo_region = models.ForeignKey(Region, models.DO_NOTHING, db_column='codigo_region', blank=True, null=True)
    nombre_sede = models.CharField(max_length=150)
    direccion = models.CharField(max_length=200, blank=True, null=True)
    piso = models.CharField(max_length=20, blank=True, null=True)
    oficina = models.CharField(max_length=50, blank=True, null=True)
    descripcion_detallada = models.TextField(blank=True, null=True)
    activo = models.BooleanField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'ubicacion'
        ordering = ['nombre_sede']

    def __str__(self):
        return self.nombre_sede


class UnidadFuncionario(models.Model):
    codigo_unidad = models.AutoField(primary_key=True)
    descripcion = models.CharField(max_length=150)
    sigla = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'unidad_funcionario'
        ordering = ['descripcion']

    def __str__(self):
        return f"{self.sigla + ' - ' if self.sigla else ''}{self.descripcion}"


class UsuarioSistema(models.Model):
    id_usuario = models.AutoField(primary_key=True)
    id_funcionario = models.OneToOneField(Funcionario, models.DO_NOTHING, db_column='id_funcionario', blank=True, null=True)
    username = models.CharField(unique=True, max_length=50)
    password_hash = models.CharField(max_length=255)
    codigo_rol = models.ForeignKey(RolSistema, models.DO_NOTHING, db_column='codigo_rol', blank=True, null=True)
    ultimo_acceso = models.DateTimeField(blank=True, null=True)
    intentos_fallidos = models.IntegerField(blank=True, null=True)
    bloqueado = models.BooleanField(blank=True, null=True)
    token_recuperacion = models.CharField(max_length=255, blank=True, null=True)
    fecha_expiracion_token = models.DateTimeField(blank=True, null=True)
    activo = models.BooleanField(blank=True, null=True)
    fecha_creacion = models.DateTimeField(blank=True, null=True)
    actualizado_por = models.ForeignKey(Funcionario, models.DO_NOTHING, db_column='actualizado_por', related_name='usuariosistema_actualizado_por_set', blank=True, null=True)
    fecha_actualizacion = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'usuario_sistema'
        ordering = ['username']

    def __str__(self):
        return self.username
