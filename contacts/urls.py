from django.urls import path
from . import views


urlpatterns = [
    path('contacts/', views.ContactView.as_view()),
    path('contacts/<uuid:pk>/', views.ContactDetail.as_view()),
    path('add_contacts/', views.AddContact.as_view()),
    path('blockedusers/', views.BlockedUserView.as_view()),
    path('blockedusers/<uuid:pk>/', views.BlockedUserDetail.as_view())
]
