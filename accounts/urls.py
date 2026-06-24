from django.urls import path
from . import views


urlpatterns = [
    path('accounts/me/', views.CurrentView.as_view()),
    path('accounts/', views.UserListView.as_view()),
    path('accounts/login/', views.LoginView.as_view()),
    path('accounts/logout/', views.LogoutView.as_view()),
    path('accounts/register/', views.RegisterView.as_view()),
    path('accounts/<uuid:pk>/', views.UserDetail.as_view()),
]