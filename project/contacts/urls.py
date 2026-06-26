# urls.py
from django.urls import path
from . import views

urlpatterns = [
    # دریافت لیست مخاطبین
    path('contacts/', views.ContactView.as_view(), name='contact-list'),
    
    # اضافه کردن مخاطب
    path('add_contact/', views.AddContactView.as_view(), name='add-contact'),
    
    # جستجوی کاربران
    path('search_users/', views.SearchUserView.as_view(), name='search-users'),
        
    # مشاهده، ویرایش و حذف مخاطب
    path('contacts/<uuid:pk>/', views.ContactDetailView.as_view(), name='contact-detail'),
    
    # بررسی وجود چت
    path('is_in_chat_together/', views.IsInChatView.as_view(), name='is-in-chat'),
    
    # بررسی وجود مخاطب
    path('check_contact_exists/', views.CheckContactExistsView.as_view(), name='check-contact'),
]