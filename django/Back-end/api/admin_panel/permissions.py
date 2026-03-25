from rest_framework.permissions import BasePermission
from api.models import UserRole

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == UserRole.ADMIN
    

class IsTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == UserRole.TEACHER
    

class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == UserRole.STUDENT
    

class IsAdminOrTeacher(BasePermission):
    def has_permission(self, request, view):
        return request.user and (request.user.role == UserRole.ADMIN or request.user.role == UserRole.TEACHER)
    
    
class IsAdminOrStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user and (request.user.role == UserRole.ADMIN or request.user.role == UserRole.STUDENT)
    