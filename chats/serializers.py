from rest_framework import serializers
from .models import *


class PrivateNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivateNotification
        fields = '__all__'


class PrivateAttachmentSeriailizer(serializers.ModelSerializer):
    class Meta:
        model = PrivateAttachment
        fields = '__all__'


class PrivateMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivateMessage
        exclude = ('is_read','is_updated')




class PrivateChatSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivateChat
        fields = '__all__'