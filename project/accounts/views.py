from rest_framework.generics import (
    ListCreateAPIView, 
    RetrieveUpdateDestroyAPIView, 
    CreateAPIView
)
from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
from django.contrib.auth import login, logout, authenticate
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework import permissions
from .permissions import (
    IsOwnerOrReadOnly,
)

class CurrentView(RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user


class UserListView(ListCreateAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = UserSerializer


class UserDetail(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsOwnerOrReadOnly]
    queryset = User.objects.all()
    serializer_class = UserSerializer


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            # لاگین کردن کاربر در سشن جنگو
            login(request, serializer.validated_data['user'])
            return Response({"message": "با موفقیت وارد شدید"}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"message": "خروج موفقیت‌آمیز"}, status=status.HTTP_200_OK)


class RegisterView(CreateAPIView):
    permission_classes = [permissions.AllowAny]

    queryset = User.objects.all()
    serializer_class = RegisterSerializer