from rest_framework import permissions


class IsAutherOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return obj.sender == request.user
    
class IsInChat(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return (
            obj.user1 == request.user or obj.user2 == request.user
        )
    
class IsAttachmentAutherOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return (
            obj.message.sender == request.user
        )