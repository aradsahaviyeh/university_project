# serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.db.models import Q
from .models import Contact

User = get_user_model()


class ContactSerializer(serializers.ModelSerializer):
    """
    Serializer برای نمایش مخاطبین
    """
    contact_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Contact
        fields = (
            'id',
            'owner',
            'contact',
            'contact_info',
            'nickname',
            'created_at'
        )
        read_only_fields = ('id', 'owner', 'created_at')
    
    def get_contact_info(self, obj):
        user = obj.contact
        return {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone': user.phone,
            'avatar': user.avatar.url if user.avatar else None,
        }


class AddContactSerializer(serializers.Serializer):
    """
    Serializer برای اضافه کردن مخاطب
    """
    username = serializers.CharField(required=False, write_only=True, allow_blank=True)
    email = serializers.EmailField(required=False, write_only=True, allow_blank=True)
    phone = serializers.CharField(required=False, write_only=True, allow_blank=True)
    nickname = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, attrs):
        username = attrs.get('username', '').strip()
        email = attrs.get('email', '').strip()
        phone = attrs.get('phone', '').strip()
        request = self.context.get('request')
        
        # حداقل یکی از فیلدها باید پر باشد
        if not any([username, email, phone]):
            raise serializers.ValidationError(
                'حداقل یکی از فیلدهای username، email یا phone باید پر شود.'
            )
        
        # ساخت فیلتر برای جستجو
        filters = Q()
        if username:
            filters |= Q(username=username)
        if email:
            filters |= Q(email=email)
        if phone:
            filters |= Q(phone=phone)
        
        # جستجوی کاربر
        try:
            target_user = User.objects.get(filters)
        except User.DoesNotExist:
            raise serializers.ValidationError('کاربری با این مشخصات پیدا نشد.')
        except User.MultipleObjectsReturned:
            raise serializers.ValidationError(
                'بیش از یک کاربر با این اطلاعات پیدا شد. لطفاً دقیق‌تر جستجو کنید.'
            )
        
        # بررسی اینکه کاربر خودش نباشد
        if target_user == request.user:
            raise serializers.ValidationError('نمی‌توانید خودتان را به مخاطبین اضافه کنید.')
        
        # بررسی اینکه قبلاً اضافه نشده باشد
        if Contact.objects.filter(owner=request.user, contact=target_user).exists():
            raise serializers.ValidationError('این کاربر قبلاً به مخاطبین شما اضافه شده است.')
        
        attrs['target_user'] = target_user
        return attrs
    
    def create(self, validated_data):
        target_user = validated_data.pop('target_user')
        request = self.context.get('request')
        
        contact = Contact.objects.create(
            owner=request.user,
            contact=target_user,
            nickname=validated_data.get('nickname', '')
        )
        return contact