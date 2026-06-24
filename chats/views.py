from django.shortcuts import render
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
    ListAPIView,
    CreateAPIView,
)
from .serializers import *
from .models import *
from django.db.models import Q

from rest_framework import permissions

from .permissions import (
    IsAutherOrReadOnly,
    IsInChat,
    IsAttachmentAutherOrReadOnly
)

    

class AttachmentView(ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PrivateAttachmentSeriailizer

    def get_queryset(self):
        user = self.request.user
        attachments = PrivateAttachment.objects.filter(
            Q(message__chat__user1=user) |
            Q(message__chat__user2=user)    
        )
        return attachments

class AttachmentDetail(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAttachmentAutherOrReadOnly]
    queryset = PrivateAttachment.objects.all()
    serializer_class = PrivateAttachmentSeriailizer


class MessageView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PrivateMessageSerializer

    def get_queryset(self):
        messages = PrivateMessage.objects.filter(
            Q(chat__user1=self.request.user) | Q(chat__user2=self.request.user)
        )
        return messages


class SendMessage(CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SendMessageSerializer

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)


class MessageDetail(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAutherOrReadOnly]
    queryset = PrivateMessage.objects.all()
    serializer_class = PrivateMessageDetailSerializer


class ChatView(ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsInChat]

    '''
        we should use get_query function for
        return the list for current user
    '''
    serializer_class = PrivateChatSerializer
    def get_queryset(self):
        chats = PrivateChat.objects.filter(
            Q(user1=self.request.user) | Q(user2=self.request.user)
        ).order_by('-updated_at')
        return chats


class ChatDetail(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsInChat]
    queryset = PrivateChat.objects.all()
    serializer_class = PrivateChatDetailSerializer