from rest_framework.permissions import BasePermission
from api.models import UserRole

class IsAdmin(BasePermission):
    """
    Custom permission to only allow admins to create new users.
    """

    def has_permission(self, request, view):
        return request.user and request.user.role == UserRole.ADMIN
