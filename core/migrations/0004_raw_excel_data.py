from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_importacion_lotes"),
    ]

    operations = [
        migrations.AddField(
            model_name="equipo",
            name="raw_excel_data",
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="funcionario",
            name="raw_excel_data",
            field=models.JSONField(blank=True, null=True),
        ),
    ]
