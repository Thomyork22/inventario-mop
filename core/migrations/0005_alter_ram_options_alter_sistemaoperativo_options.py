from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0004_raw_excel_data"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="ram",
            options={"db_table": "ram", "managed": True, "ordering": ["descripcion"]},
        ),
        migrations.AlterModelOptions(
            name="sistemaoperativo",
            options={
                "db_table": "sistema_operativo",
                "managed": True,
                "ordering": ["descripcion", "nombre", "version"],
            },
        ),
    ]
