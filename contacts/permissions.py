from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return (
            (request.method in permissions.SAFE_METHODS and request.user == obj.owner)
            or
            (request.user == obj.owner)
        )


class IsBlocker(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return (
            (request.method in permissions.SAFE_METHODS and request.user == obj.blocker)
            or
            (request.user == obj.blocker)
        )