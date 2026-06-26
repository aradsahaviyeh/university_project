from django.contrib import admin
from .models import Contact, BlockedUser


admin.site.register(Contact)
admin.site.register(BlockedUser)