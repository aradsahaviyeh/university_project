from django.shortcuts import render
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
)
from .serializers import *
from .models import *

class NotificationView(ListCreateAPIView):
    queryset = PrivateNotification.objects.all()
    serializer_class = PrivateNotificationSerializer

class NotificationDetail(RetrieveUpdateDestroyAPIView):
    queryset = PrivateNotification.objects.all()
    serializer_class = PrivateNotificationSerializer
    



class AttachmentView(ListCreateAPIView):
    queryset = PrivateAttachment.objects.all()
    serializer_class = PrivateAttachmentSeriailizer

class AttachmentDetail(RetrieveUpdateDestroyAPIView):
    queryset = PrivateAttachment.objects.all()
    serializer_class = PrivateAttachmentSeriailizer


class MessageView(ListCreateAPIView):
    queryset = PrivateMessage.objects.all()
    serializer_class = PrivateMessageSerializer

class MessageDetail(RetrieveUpdateDestroyAPIView):
    queryset = PrivateMessage.objects.all()
    serializer_class = PrivateMessageSerializer



class ChatView(ListCreateAPIView):
    queryset = PrivateChat.objects.all()
    serializer_class = PrivateChatSerializer