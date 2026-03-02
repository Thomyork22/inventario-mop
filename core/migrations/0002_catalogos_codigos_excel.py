from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="MarcaMonitorCatalogo",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("codigo", models.IntegerField(blank=True, null=True)),
                ("descripcion", models.CharField(max_length=150)),
            ],
            options={
                "db_table": "marca_monitor_catalogo",
                "managed": True,
                "ordering": ["descripcion"],
            },
        ),
        migrations.CreateModel(
            name="PulgadaMonitorCatalogo",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("codigo", models.IntegerField(blank=True, null=True)),
                ("descripcion", models.CharField(max_length=150)),
            ],
            options={
                "db_table": "pulgada_monitor_catalogo",
                "managed": True,
                "ordering": ["descripcion"],
            },
        ),
        migrations.CreateModel(
            name="TamanoDiscoCatalogo",
            fields=[
                ("id", models.AutoField(primary_key=True, serialize=False)),
                ("codigo", models.IntegerField(blank=True, null=True)),
                ("descripcion", models.CharField(max_length=150)),
            ],
            options={
                "db_table": "tamano_disco_catalogo",
                "managed": True,
                "ordering": ["descripcion"],
            },
        ),
        migrations.AddField(
            model_name="condicionequipo",
            name="codigo",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="estadoequipo",
            name="codigo",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="marca",
            name="codigo",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="procesador",
            name="codigo",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="ram",
            name="codigo",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="ram",
            name="descripcion",
            field=models.CharField(default="", max_length=150),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="ram",
            name="capacidad_gb",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="ram",
            name="tipo",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AddField(
            model_name="sistemaoperativo",
            name="codigo",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="sistemaoperativo",
            name="descripcion",
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name="tipodisco",
            name="codigo",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="tipoequipo",
            name="codigo",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="equipo",
            name="tamano_disco",
            field=models.ForeignKey(blank=True, db_column="tamano_disco", null=True, on_delete=models.DO_NOTHING, to="core.TamanoDiscoCatalogo"),
        ),
        migrations.AddField(
            model_name="equipomonitor",
            name="marca_monitor_catalogo",
            field=models.ForeignKey(blank=True, db_column="marca_monitor_catalogo", null=True, on_delete=models.DO_NOTHING, to="core.MarcaMonitorCatalogo"),
        ),
        migrations.AddField(
            model_name="equipomonitor",
            name="pulgada_monitor_catalogo",
            field=models.ForeignKey(blank=True, db_column="pulgada_monitor_catalogo", null=True, on_delete=models.DO_NOTHING, to="core.PulgadaMonitorCatalogo"),
        ),
    ]
