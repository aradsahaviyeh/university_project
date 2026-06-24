from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
import secrets

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'bio',
            'gender',
            'phone',
            'avatar',
            'is_online',
            'private_account',
            'last_login',
        )
        read_only_fields = ['id','is_online','last_login']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("نام کاربری یا رمز عبور اشتباه است.")
        else:
            raise serializers.ValidationError("نام کاربری و رمز عبور الزامی است .")

        data['user'] = user
        return data
 

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'username',
            'first_name',
            'last_name',
            'email',
            'bio',
            'gender',
            'phone',
            'avatar',
            'private_account',
            'password'
        )
        extra_kwargs = {
            'username':{
                'required':False
            },
            'password':{
                'write_only':True
            }
        }

    def create(self, validated_data):
        if not validated_data.get('username'):
            validated_data['username'] = validated_data.get('first_name')+ '_' + validated_data.get('last_name')
            validated_data['username'] = validated_data['username'] + secrets.token_hex(5)
        user = User.objects.create_user(**validated_data)
        return user