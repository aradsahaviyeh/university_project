from django.contrib import admin
from .models import (
    PrivateChat,
    PrivateMessage,
    PrivateAttachment,
)


class PrivateChatAdmin(admin.ModelAdmin):
    list_display = ['id', 'user1', 'user2', 'last_message']


admin.site.register(PrivateChat, PrivateChatAdmin)
admin.site.register(PrivateMessage)
admin.site.register(PrivateAttachment)
