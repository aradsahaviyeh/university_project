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
from rest_framework import permissions
from .permissions import IsOwner, IsBlocker

class ContactView(ListAPIView):

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ContactSerializer

    def get_queryset(self):
        contacts = Contact.objects.filter(
            owner=self.request.user
        )
        return contacts


class AddContact(CreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    queryset = Contact.objects.all()
    serializer_class = AddContactSerializer


class ContactDetail(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsOwner]
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer


class BlockedUserView(ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    # queryset = BlockedUser.objects.all()
    serializer_class = BlockedUserSerializer

    def get_queryset(self):
        blockedusers = BlockedUser.objects.filter(
            blocker=self.request.user
        )
        return blockedusers

class BlockedUserDetail(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsBlocker]
    queryset = BlockedUser.objects.all()
    serializer_class = BlockedUserSerializer