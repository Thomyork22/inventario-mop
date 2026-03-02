from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_catalogos_codigos_excel"),
    ]

    operations = [
        migrations.CreateModel(
            name="ImportacionInventarioLote",
            fields=[
                ("id_lote", models.AutoField(primary_key=True, serialize=False)),
                ("archivo_origen", models.CharField(max_length=255)),
                ("estado", models.CharField(default="completado", max_length=30)),
                ("resumen", models.JSONField(blank=True, null=True)),
                ("fecha_creacion", models.DateTimeField(auto_now_add=True)),
                ("creado_por", models.ForeignKey(blank=True, db_column="creado_por", null=True, on_delete=models.DO_NOTHING, to="core.usuariosistema")),
            ],
            options={
                "db_table": "importacion_inventario_lote",
                "managed": True,
                "ordering": ["-id_lote"],
            },
        ),
        migrations.CreateModel(
            name="ImportacionInventarioRegistro",
            fields=[
                ("id_registro", models.AutoField(primary_key=True, serialize=False)),
                ("modelo", models.CharField(max_length=100)),
                ("object_id", models.IntegerField()),
                ("accion", models.CharField(max_length=20)),
                ("snapshot_previo", models.JSONField(blank=True, null=True)),
                ("fecha_creacion", models.DateTimeField(auto_now_add=True)),
                ("id_lote", models.ForeignKey(db_column="id_lote", on_delete=models.DO_NOTHING, related_name="registros", to="core.importacioninventariolote")),
            ],
            options={
                "db_table": "importacion_inventario_registro",
                "managed": True,
                "ordering": ["-id_registro"],
            },
        ),
    ]
