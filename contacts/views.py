from django.shortcuts import render
from rest_framework.generics import (
    ListAPIView,
    CreateAPIView,
    ListCreateAPIView,
    RetrieveUpdateDestroyAPIView
)
from .models import Contact, BlockedUser
from .serializers import (
    ContactSerializer,
    AddContactSerializer,
    BlockedUserSerializer
)



class ContactView(ListAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer


class AddContact(CreateAPIView):
    queryset = Contact.objects.all()
    serializer_class = AddContactSerializer


class ContactDetail(RetrieveUpdateDestroyAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer



class BlockedUserView(ListCreateAPIView):
    queryset = BlockedUser.objects.all()
    serializer_class = BlockedUserSerializer

class BlockedUserDetail(RetrieveUpdateDestroyAPIView):
    queryset = BlockedUser.objects.all()
    serializer_class = BlockedUserSerializer