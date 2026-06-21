from django.urls import path
from . import views


urlpatterns = [
    path('accounts/', views.UserListView.as_view()),
    path('accounts/register/', views.RegisterView.as_view()),
    path('accounts/<uuid:pk>/', views.UserDetail.as_view()),
]