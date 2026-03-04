from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0005_alter_ram_options_alter_sistemaoperativo_options"),
    ]

    operations = [
        migrations.AddField(
            model_name="asignacionequipo",
            name="fecha_entrega_excel",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="asignacionequipo",
            name="nombre_responsable_entrega",
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name="equipo",
            name="direccion_oficina_piso",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name="equipo",
            name="ip_maquina",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="equipo",
            name="nombre_equipo",
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AddField(
            model_name="equipomonitor",
            name="sigac_monitor",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
        migrations.AddField(
            model_name="funcionario",
            name="tipo_contrato",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
