from django.contrib import admin
from .models import (
    PrivateChat,
    PrivateMessage,
    PrivateAttachment,
    PrivateNotification
)


admin.site.register(PrivateChat)
admin.site.register(PrivateMessage)
admin.site.register(PrivateAttachment)
admin.site.register(PrivateNotification)