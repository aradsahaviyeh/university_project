from django.shortcuts import get_object_or_404
from rest_framework.generics import (
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView,
    ListAPIView,
    CreateAPIView,
)
from rest_framework.views import APIView
from .serializers import *
from .models import *
from django.db.models import Q
from rest_framework import permissions
from .permissions import (
    IsAutherOrReadOnly,
    IsInChat,
    IsAttachmentAutherOrReadOnly
)
from rest_framework.authentication import (
    SessionAuthentication,
    BasicAuthentication
)
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework import status



class CustomAuthToken(ObtainAuthToken):

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
        })



class AttachmentView(ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PrivateAttachmentSeriailizer

    def get_queryset(self):
        user = self.request.user
        attachments = PrivateAttachment.objects.filter(
            Q(message__chat__user1=user) |
            Q(message__chat__user2=user)    
        )
        return attachments


class UploadAttachment(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = PrivateAttachmentSeriailizer(data=request.data)
        if serializer.is_valid():
            attachment = serializer.save()
            
            # دریافت پیام کامل با attachments
            message = attachment.message
            message_serializer = PrivateMessageSerializer(message)
            
            return Response({
                'attachment': serializer.data,
                'message': message_serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        message = serializer.save(sender=self.request.user)
        # آپدیت last_message در چت
        chat = message.chat
        chat.last_message = message
        chat.save(update_fields=['last_message', 'updated_at'])
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        self.perform_create(serializer)
        
        message = serializer.instance
        message_serializer = PrivateMessageSerializer(message)
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            message_serializer.data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )


class ReadMessage(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        try:
            # دریافت پیام
            message = get_object_or_404(PrivateMessage, id=pk)
            
            # بررسی اینکه کاربر مجاز به دیدن این پیام هست یا نه
            if message.chat.user1 != request.user and message.chat.user2 != request.user:
                return Response(
                    {'error': 'شما اجازه دسترسی به این پیام را ندارید'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # اگر پیام توسط خود کاربر ارسال شده، نیازی به تغییر نیست
            if message.sender == request.user:
                return Response(
                    {'message': 'این پیام توسط شما ارسال شده است'},
                    status=status.HTTP_200_OK
                )
            
            # تغییر وضعیت is_read
            message.is_read = True
            message.save()
            
            return Response(
                {
                    'message': 'پیام به عنوان خوانده شده علامت‌گذاری شد',
                    'is_read': message.is_read
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class ReadAllMessages(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, chat_id):
        try:
            # دریافت چت
            chat = get_object_or_404(PrivateChat, id=chat_id)
            
            # بررسی دسترسی
            if chat.user1 != request.user and chat.user2 != request.user:
                return Response(
                    {'error': 'شما اجازه دسترسی به این چت را ندارید'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # آپدیت همه پیام‌های نخوانده که توسط کاربر ارسال نشده‌اند
            updated_count = PrivateMessage.objects.filter(
                chat=chat,
                is_read=False
            ).exclude(
                sender=request.user
            ).update(is_read=True)
            
            return Response(
                {
                    'message': f'{updated_count} پیام به عنوان خوانده شده علامت‌گذاری شد',
                    'updated_count': updated_count
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


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


class StartChatView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        contact_id = request.data.get('contact_id')
        if not contact_id:
            return Response({'error': 'contact_id الزامی است'}, status=400)
        
        try:
            other_user = User.objects.get(id=contact_id)
        except User.DoesNotExist:
            return Response({'error': 'کاربر مورد نظر یافت نشد'}, status=404)
        
        chat = PrivateChat.objects.filter(
            Q(user1=request.user, user2=other_user) |
            Q(user1=other_user, user2=request.user)
        ).first()
        
        if not chat:
            chat = PrivateChat.objects.create(user1=request.user, user2=other_user)
        
        return Response({
            'chat_id': chat.id,
            'other_user_id': other_user.id,
            'other_user_username': other_user.username,
            'other_user_avatar': other_user.avatar.url if other_user.avatar else None,
            'is_new': not chat.messages.exists()
        }, status=200)



class ChatDetail(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsInChat]
    queryset = PrivateChat.objects.all()
    serializer_class = PrivateChatDetailSerializer