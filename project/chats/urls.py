from django.urls import path
from . import views


urlpatterns = [
    path('api/token/', views.CustomAuthToken.as_view()),
    path('attachments/', views.AttachmentView.as_view()),
    path('upload_attachment/', views.UploadAttachment.as_view()),
    path('attachments/<uuid:pk>/', views.AttachmentDetail.as_view()),
    path('messages/', views.MessageView.as_view()),
    path('read_message/<uuid:pk>/', views.ReadMessage.as_view()),
    path('read_all_messages/<uuid:chat_id>/', views.ReadAllMessages.as_view()),
    path('send_message/', views.SendMessage.as_view()),
    path('messages/<uuid:pk>/', views.MessageDetail.as_view(), name='message_detail'),
    path('chats/', views.ChatView.as_view()),
    path('start_chat/',views.StartChatView.as_view()),
    path('chats/<uuid:pk>/', views.ChatDetail.as_view(), name='chat_detail'),
]
