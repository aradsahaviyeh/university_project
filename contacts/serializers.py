from rest_framework import serializers
from .models import Contact, BlockedUser
from django.db.models import Q
from accounts.models import User

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'


class AddContactSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, write_only=True)
    email = serializers.EmailField(required=False, write_only=True)
    phone = serializers.CharField(required=False, write_only=True)

    contact = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Contact
        fields = (
            'id',
            'contact',
            'nickname',
            'username',
            'email',
            'phone',
            'created_at',
        )
        read_only_fields = ('id', 'contact', 'created_at')

    def get_contact(self, obj):
        return {
            'id': obj.contact.id,
            'username': obj.contact.username,
            'first_name': obj.contact.first_name,
            'last_name': obj.contact.last_name,
            'email': obj.contact.email,
            'phone': obj.contact.phone,
            'avatar': obj.contact.avatar.url if obj.contact.avatar else None,
        }

    def validate(self, attrs):
        username = attrs.get('username')
        phone = attrs.get('phone')
        request = self.context.get('request')

        if not any([username, phone]):
            raise serializers.ValidationError(
                'حداقل یکی از فیلدهای username یا email یا phone باید ارسال شود.'
            )

        filters = Q()
        if username:
            filters |= Q(username=username)
        if phone:
            filters |= Q(phone=phone)

        users = User.objects.filter(filters)

        if not users.exists():
            raise serializers.ValidationError('کاربری با این مشخصات پیدا نشد.')

        if users.count() > 1:
            raise serializers.ValidationError(
                'بیش از یک کاربر با این اطلاعات پیدا شد. لطفاً دقیق‌تر جستجو کنید.'
            )

        target_user = users.first()

        if target_user == request.user:
            raise serializers.ValidationError('نمی‌توانید خودتان را به مخاطبین اضافه کنید.')

        if Contact.objects.filter(owner=request.user, contact=target_user).exists():
            raise serializers.ValidationError('این کاربر قبلاً به مخاطبین شما اضافه شده است.')

        attrs['target_user'] = target_user
        return attrs

    def create(self, validated_data):
        validated_data.pop('username', None)
        validated_data.pop('email', None)
        validated_data.pop('phone', None)

        target_user = validated_data.pop('target_user')
        request = self.context.get('request')

        contact = Contact.objects.create(
            owner=request.user,
            contact=target_user,
            nickname=validated_data.get('nickname', '')
        )
        return contact



class BlockedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlockedUser
        fields = '__all__'