from rest_framework import serializers
from .models import *
from contacts.models import Contact


# class PrivateNotificationSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = PrivateNotification
#         fields = '__all__'


class PrivateAttachmentSeriailizer(serializers.ModelSerializer):
    class Meta:
        model = PrivateAttachment
        fields = '__all__'


class PrivateMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(
        source='sender.username',
        read_only=True
    )
    attachments = PrivateAttachmentSeriailizer(many=True, read_only=True)

    class Meta:
        model = PrivateMessage
        fields = (
            'id',
            'chat',
            'sender',
            'sender_username',
            'content',
            'attachments',
            'is_read',
            'is_updated',
            'updated_at',
            'created_at'
        )
        read_only_fields = ['id', 'sender', 'is_read', 'is_updated', 'created_at', 'updated_at']


class PrivateMessageDetailSerializer(serializers.ModelSerializer):

    sender_username = serializers.CharField(
        source='sender.username',
        read_only=True
    )

    class Meta:
        model = PrivateMessage
        fields = (
            'id',
            'chat',
            'sender',
            'sender_username',
            'content',
            'attachments',
            'is_read',
            'is_updated',
            'updated_at',
            'created_at'
        )
        read_only_fields = ['id', 'chat', 'sender', 'is_read', 'is_updated', 'created_at']


class SendMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrivateMessage
        fields = (
            'id',  # اضافه کردن id
            'chat',
            'sender',
            'content'
        )
        read_only_fields = ['id']  # id فقط خواندنی


class PrivateChatSerializer(serializers.ModelSerializer):

    user1_username = serializers.CharField(source='user1.username', read_only=True)
    user2_username = serializers.CharField(source='user2.username', read_only=True)

    other_user_avatar = serializers.SerializerMethodField()
    other_user_name = serializers.SerializerMethodField()

    unread_count = serializers.SerializerMethodField()

    last_message = serializers.SerializerMethodField()

    class Meta:
        model = PrivateChat
        fields = (
            "id",
            "user1",
            "user2",
            "user1_username",
            "user2_username",
            "other_user_name",
            "other_user_avatar",
            "last_message",
            "created_at",
            "updated_at",
            "unread_count"
        )


    def get_other_user_name(self, obj):
        request = self.context.get("request")
        current_user = request.user

        other = obj.user2 if obj.user1 == current_user else obj.user1

        contact = Contact.objects.filter(
            owner=current_user,
            contact=other
        ).first()

        if contact and contact.nickname:
            return contact.nickname

        return other.username
    

    def get_other_user_avatar(self, obj):
        request = self.context["request"]
        user = request.user

        other = obj.user2 if obj.user1 == user else obj.user1
        return other.avatar.url if other.avatar else None
    

    def get_unread_count(self, obj):
        request = self.context["request"]

        return PrivateMessage.objects.filter(
            chat=obj,
            is_read=False
        ).exclude(
            sender=request.user
        ).count()
    
    def get_last_message(self, obj):
        if obj.last_message:
            return obj.last_message.content
        return None


class PrivateChatDetailSerializer(serializers.ModelSerializer):
    user1_username = serializers.CharField(source='user1.username', read_only=True)
    user2_username = serializers.CharField(source='user2.username', read_only=True)

    other_user_avatar = serializers.SerializerMethodField()
    other_user_name = serializers.SerializerMethodField()

    self_id = serializers.SerializerMethodField()

    messages = serializers.SerializerMethodField()

    class Meta:
        model = PrivateChat
        fields = (
            "id",
            "self_id",
            "user1",
            "user2",
            "user1_username",
            "user2_username",
            "other_user_name",
            "other_user_avatar",
            'messages',
            "last_message",
            "created_at",
            "updated_at"
        )


    def get_self_id(self, obj):
        request = self.context.get('request')
        user = request.user
        return user.id


    def get_other_user_name(self, obj):
        request = self.context.get("request")
        current_user = request.user

        other = obj.user2 if obj.user1 == current_user else obj.user1

        contact = Contact.objects.filter(
            owner=current_user,
            contact=other
        ).first()

        if contact and contact.nickname:
            return contact.nickname

        return other.username
    

    def get_other_user_avatar(self, obj):

        request = self.context["request"]
        user = request.user

        other = obj.user2 if obj.user1 == user else obj.user1
        return other.avatar.url if other.avatar else None
    

    def get_messages(self, obj):
        messages = obj.messages.all().order_by("created_at")

        return PrivateMessageSerializer(
            messages,
            many=True,
        ).data