from rest_framework.permissions import BasePermission

from .models import UsuarioSistema


def user_is_administrador(user):
    if not user or not user.is_authenticated:
        return False
    if user.is_superuser:
        return True
    if user.groups.filter(name__iexact="Administrador").exists():
        return True
    usuario_sistema = (
        UsuarioSistema.objects.select_related("codigo_rol")
        .filter(username=user.username)
        .first()
    )
    if not usuario_sistema or not usuario_sistema.codigo_rol:
        return False
    return (usuario_sistema.codigo_rol.nombre_rol or "").strip().lower() == "administrador"


class IsInMopInventarioGroup(BasePermission):
    message = "No tienes permisos para usar el sistema de inventario."

    def has_permission(self, request, view):
        user = request.user
        return (
            user
            and user.is_authenticated
            and user.groups.filter(name="mop_inventario").exists()
        )


class IsAdminImportUser(BasePermission):
    message = "Solo un superusuario o un Administrador puede importar inventario."

    def has_permission(self, request, view):
        return user_is_administrador(request.user)
