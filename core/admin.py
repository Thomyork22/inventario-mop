from django.contrib import admin
from . import models

# Registra automáticamente todos los modelos generados por inspectdb
for name in dir(models):
    obj = getattr(models, name)
    if isinstance(obj, type) and hasattr(obj, "_meta"):
        try:
            admin.site.register(obj)
        except admin.sites.AlreadyRegistered:
            pass
