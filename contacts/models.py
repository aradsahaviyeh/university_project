from django.db import models
from accounts.models import User
from django.core.exceptions import ValidationError
import uuid

class Contact(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='contacts'
    )
    contact = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='in_contacts'
    )
    nickname = models.CharField(max_length=200, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'contact'],
                name='unique_contact'
            )
        ]

    
    def clean(self):
        if self.owner == self.contact:
            raise ValidationError("You cannot add yourself to contacts.")
    
    
    
    def __str__(self):
        return f'{self.owner.username} add {self.contact.username} to contacts.'
    




class BlockedUser(models.Model):
    id = models.UUIDField(default=uuid.uuid4, primary_key=True, editable=False)
    blocker = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blocked_users'
    )
    blocked = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='blocked_by'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['blocker', 'blocked'],
                name='unique_block_user'
            )
        ]


    def clean(self):
        if self.blocker == self.blocked:
            raise ValidationError("You cannot block yourself.")

    def __str__(self):
        return f'{self.blocker.username} blocked {self.blocked.username}'