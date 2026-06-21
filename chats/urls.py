from django.urls import path
from . import views


urlpatterns = [
    path('notifications/', views.NotificationView.as_view()),
    path('notifications/<uuid:pk>/', views.NotificationDetail.as_view()),
    path('attachments/', views.AttachmentView.as_view()),
    path('attachments/<uuid:pk>/', views.AttachmentDetail.as_view()),
    path('messages/', views.MessageView.as_view()),
    path('messages/<uuid:pk>/', views.MessageDetail.as_view()),
    path('chats/', views.ChatView.as_view()),
]
