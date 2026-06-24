from django.db import models
from django.db.models import Q, F
from accounts.models import User
import uuid

class PrivateChat(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    user1 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='private_chats_started',
        null=True,
        blank=True
    )
    user2 = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='private_chats_received',
        null=True,
        blank=True
    )
    last_message = models.ForeignKey('PrivateMessage', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user1', 'user2'],
                name='unique_private_chat'
            )
        ]
    def __str__(self):
        return f'{self.user1} and {self.user2} in chat.' 
    

class PrivateMessage(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    chat = models.ForeignKey(
        PrivateChat,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    content = models.TextField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    is_updated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.sender.username} sent message. in {self.chat}'


class PrivateAttachment(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    message = models.ForeignKey(
        PrivateMessage,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    FILE_TYPES = (
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('file', 'File'),
    )
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPES, default='file')


    def __str__(self):
        return f'Attachment for {self.message.id} ({self.file_type})'
    
