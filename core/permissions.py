from rest_framework.permissions import BasePermission


class IsInMopInventarioGroup(BasePermission):
    message = "No tienes permisos para usar el sistema de inventario."

    def has_permission(self, request, view):
        user = request.user
        return (
            user
            and user.is_authenticated
            and user.groups.filter(name="mop_inventario").exists()
        )
