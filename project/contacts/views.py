# views.py
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.shortcuts import get_object_or_404
from .models import Contact
from .serializers import ContactSerializer, AddContactSerializer
from chats.models import PrivateChat

User = get_user_model()


class ContactView(generics.ListAPIView):
    """
    دریافت لیست مخاطبین کاربر جاری
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ContactSerializer
    
    def get_queryset(self):
        return Contact.objects.filter(owner=self.request.user).order_by('-created_at')


class AddContactView(APIView):
    """
    اضافه کردن مخاطب جدید با نام کاربری، ایمیل یا شماره تلفن
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        serializer = AddContactSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            contact = serializer.save()
            response_serializer = ContactSerializer(contact)
            return Response(
                response_serializer.data,
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class SearchUserView(APIView):
    """
    جستجوی کاربران با نام کاربری، ایمیل یا شماره تلفن
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        
        if len(query) < 2:
            return Response([], status=status.HTTP_200_OK)
        
        # جستجو در تمام فیلدها
        users = User.objects.filter(
            Q(username__icontains=query) |
            Q(first_name__icontains=query) |
            Q(last_name__icontains=query) |
            Q(email__icontains=query) |
            Q(phone__icontains=query)
        ).exclude(id=request.user.id).distinct()[:20]
        
        # ساخت داده برای پاسخ
        data = []
        for user in users:
            # بررسی اینکه آیا کاربر در لیست مخاطبین است
            is_contact = Contact.objects.filter(
                owner=request.user,
                contact=user
            ).exists()
            
            data.append({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email,
                'phone': user.phone,
                'avatar': user.avatar.url if user.avatar else None,
                'is_contact': is_contact
            })
        
        return Response(data, status=status.HTTP_200_OK)



class ContactDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    مشاهده، ویرایش و حذف یک مخاطب
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ContactSerializer
    
    def get_queryset(self):
        return Contact.objects.filter(owner=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save()
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'message': 'مخاطب با موفقیت حذف شد'},
            status=status.HTTP_200_OK
        )


class IsInChatView(APIView):
    """
    بررسی وجود چت بین دو کاربر
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user_id = request.query_params.get('user_id')
        other_user_id = request.query_params.get('other_user_id')
        
        if not user_id or not other_user_id:
            return Response(
                {'error': 'user_id و other_user_id الزامی هستند'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # اطمینان از اینکه کاربر جاری اجازه دارد
        if str(request.user.id) != str(user_id):
            return Response(
                {'error': 'شما اجازه دسترسی به این اطلاعات را ندارید'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        chat = PrivateChat.objects.filter(
            Q(user1=user_id, user2=other_user_id) |
            Q(user1=other_user_id, user2=user_id)
        ).first()
        
        if chat:
            return Response({
                'status': True,
                'chat_id': chat.id,
                'has_messages': chat.messages.exists(),
                'last_message': chat.last_message.content if chat.last_message else None
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'status': False
            }, status=status.HTTP_200_OK)  # تغییر از 404 به 200 با status: false


class CheckContactExistsView(APIView):
    """
    بررسی اینکه آیا کاربر در لیست مخاطبین وجود دارد
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        username = request.query_params.get('username')
        email = request.query_params.get('email')
        phone = request.query_params.get('phone')
        
        if not any([username, email, phone]):
            return Response(
                {'error': 'حداقل یکی از پارامترهای username, email, phone باید ارسال شود'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # پیدا کردن کاربر مورد نظر
        filters = Q()
        if username:
            filters |= Q(username=username)
        if email:
            filters |= Q(email=email)
        if phone:
            filters |= Q(phone=phone)
        
        try:
            target_user = User.objects.get(filters)
        except User.DoesNotExist:
            return Response(
                {'exists': False, 'message': 'کاربری با این مشخصات یافت نشد'},
                status=status.HTTP_200_OK
            )
        except User.MultipleObjectsReturned:
            return Response(
                {'error': 'بیش از یک کاربر با این مشخصات یافت شد'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # بررسی اینکه آیا در لیست مخاطبین است
        is_contact = Contact.objects.filter(
            owner=request.user,
            contact=target_user
        ).exists()
        
        return Response({
            'exists': True,
            'is_contact': is_contact,
            'user': {
                'id': target_user.id,
                'username': target_user.username,
                'first_name': target_user.first_name,
                'last_name': target_user.last_name,
                'email': target_user.email,
                'phone': target_user.phone,
                'avatar': target_user.avatar.url if target_user.avatar else None
            }
        }, status=status.HTTP_200_OK)