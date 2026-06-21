from django.db import models
from django.contrib.auth.models import AbstractUser
import uuid


class User(AbstractUser):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    bio = models.TextField(null=True, blank=True)
    GENDERS = (
        ('Male', 'Male'),
        ('Female', 'Female'),
    )
    gender = models.CharField(max_length=10, choices=GENDERS, null=True, blank=True)
    phone = models.CharField(max_length=11, unique=True)
    avatar = models.ImageField(upload_to='avatars/', default='avatars/default.png', blank=True)
    is_online = models.BooleanField(default=False)
    private_account = models.BooleanField(default=True)

    
    def __str__(self):
        return f'{self.username}'
