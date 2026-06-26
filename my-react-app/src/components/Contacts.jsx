// Contacts.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { 
    Users, UserPlus, Search, X, MessageCircle, 
    User, Loader2, Check, AlertCircle, Trash2,
    Phone, Mail, AtSign
} from "lucide-react";

export default function Contacts() {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [newContact, setNewContact] = useState({
        username: "",
        email: "",
        phone: "",
        nickname: ""
    });
    const [addingContact, setAddingContact] = useState(false);
    const [addError, setAddError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [startingChat, setStartingChat] = useState(null);
    const [deletingContact, setDeletingContact] = useState(null);
    const [searchMethod, setSearchMethod] = useState('username');

    const currentUserId = localStorage.getItem('userId');

    // دریافت لیست مخاطبین
    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                'http://localhost:8000/contacts/',
                {
                    headers: {
                        Authorization: `Token ${localStorage.getItem('token')}`
                    }
                }
            );
            console.log('Contacts response:', response.data);
            setContacts(response.data);
        } catch (error) {
            console.error('Error fetching contacts:', error);
            setError('خطا در دریافت لیست مخاطبین');
        } finally {
            setLoading(false);
        }
    };

    // جستجوی کاربران
    const searchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setSearchLoading(true);
            const response = await axios.get(
                `http://localhost:8000/search_users/?q=${query}`,
                {
                    headers: {
                        Authorization: `Token ${localStorage.getItem('token')}`
                    }
                }
            );
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchUsers(query);
    };

    // شروع یا ایجاد چت
    const handleStartChat = async (contactData) => {
        let contactId = null;
        
        console.log('Contact data for start chat:', contactData);
        
        if (contactData && typeof contactData === 'object') {
            // اولویت 1: contact_info.id
            if (contactData.contact_info && contactData.contact_info.id) {
                contactId = contactData.contact_info.id;
            }
            // اولویت 2: contact که یک آبجکت است
            else if (contactData.contact && typeof contactData.contact === 'object' && contactData.contact.id) {
                contactId = contactData.contact.id;
            }
            // اولویت 3: contact که یک string است (UUID)
            else if (contactData.contact && typeof contactData.contact === 'string') {
                contactId = contactData.contact;
            }
            // اولویت 4: خود id (که معمولاً id Contact است، نه کاربر)
            else if (contactData.id) {
                contactId = contactData.id;
            }
        }
        
        if (!contactId) {
            console.error('Contact ID not found in data:', contactData);
            alert('خطا: شناسه مخاطب پیدا نشد');
            return;
        }

        console.log('Starting chat with contact ID:', contactId);

        try {
            setStartingChat(contactId);
            
            const response = await axios.post(
                'http://localhost:8000/start_chat/',
                { contact_id: contactId },
                {
                    headers: {
                        Authorization: `Token ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            console.log('Chat response:', response.data);
            
            if (response.data && response.data.chat_id) {
                navigate(`/chat/${response.data.chat_id}`);
            } else {
                alert('خطا در شروع چت');
            }
        } catch (error) {
            console.error('Error starting chat:', error);
            if (error.response?.status === 404) {
                alert('مسیر شروع چت پیدا نشد. لطفاً با پشتیبانی تماس بگیرید.');
            } else if (error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert('خطا در شروع چت. لطفاً دوباره تلاش کنید.');
            }
        } finally {
            setStartingChat(null);
        }
    };

    // اضافه کردن مخاطب
    const handleAddContact = async (e) => {
        e.preventDefault();
        setAddError(null);
        setSuccessMessage(null);

        if (!newContact.username && !newContact.email && !newContact.phone) {
            setAddError('حداقل یکی از فیلدهای نام کاربری، ایمیل یا شماره تلفن را وارد کنید');
            return;
        }

        try {
            setAddingContact(true);
            
            const contactData = {
                nickname: newContact.nickname
            };
            
            if (newContact.username) contactData.username = newContact.username;
            if (newContact.email) contactData.email = newContact.email;
            if (newContact.phone) contactData.phone = newContact.phone;

            const response = await axios.post(
                'http://localhost:8000/add_contact/',
                contactData,
                {
                    headers: {
                        Authorization: `Token ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setContacts(prev => [response.data, ...prev]);
            
            const displayName = newContact.username || newContact.email || newContact.phone;
            setSuccessMessage(`✅ ${displayName} با موفقیت اضافه شد`);
            
            setNewContact({
                username: "",
                email: "",
                phone: "",
                nickname: ""
            });
            setSearchQuery("");
            setSearchResults([]);

            setTimeout(() => {
                setSuccessMessage(null);
                setShowAddModal(false);
            }, 2000);

        } catch (error) {
            console.error('Error adding contact:', error);
            if (error.response?.data) {
                const errors = error.response.data;
                if (typeof errors === 'object') {
                    const firstError = Object.values(errors)[0];
                    setAddError(Array.isArray(firstError) ? firstError[0] : firstError);
                } else {
                    setAddError(errors);
                }
            } else {
                setAddError('خطا در اضافه کردن مخاطب');
            }
        } finally {
            setAddingContact(false);
        }
    };

    // حذف مخاطب
    const handleDeleteContact = async (contactId) => {
        if (!window.confirm('آیا از حذف این مخاطب مطمئن هستید؟')) return;

        try {
            setDeletingContact(contactId);
            await axios.delete(
                `http://localhost:8000/contacts/${contactId}/`,
                {
                    headers: {
                        Authorization: `Token ${localStorage.getItem('token')}`
                    }
                }
            );
            setContacts(prev => prev.filter(c => c.id !== contactId));
        } catch (error) {
            console.error('Error deleting contact:', error);
            alert('خطا در حذف مخاطب');
        } finally {
            setDeletingContact(null);
        }
    };

    // توابع کمکی برای استخراج اطلاعات از contact
    const getUserIdFromContact = (contact) => {
        if (!contact) return null;
        if (contact.contact_info?.id) return contact.contact_info.id;
        if (contact.contact?.id && typeof contact.contact === 'object') return contact.contact.id;
        if (typeof contact.contact === 'string') return contact.contact;
        return contact.id || null;
    };

    const getUserInfoFromContact = (contact) => {
        if (!contact) return null;
        if (contact.contact_info) return contact.contact_info;
        if (contact.contact && typeof contact.contact === 'object') return contact.contact;
        return contact;
    };

    // رندر
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-gray-500">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <div className="max-w-4xl mx-auto">
                {/* هدر */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                مخاطبین
                            </h1>
                            <p className="text-sm text-gray-500">
                                {contacts.length} مخاطب
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105"
                    >
                        <UserPlus className="w-5 h-5" />
                        <span>افزودن مخاطب</span>
                    </button>
                </div>

                {/* خطا */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 mb-4">
                        {error}
                    </div>
                )}

                {/* لیست مخاطبین */}
                {contacts.length === 0 ? (
                    <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-100">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-400">هیچ مخاطبی در لیست شما وجود ندارد</p>
                        <p className="text-gray-300 text-sm">با کلیک روی دکمه افزودن مخاطب، اولین مخاطب خود را اضافه کنید</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contacts.map((contact) => {
                            const userId = getUserIdFromContact(contact);
                            const userInfo = getUserInfoFromContact(contact);
                            
                            return (
                                <div
                                    key={contact.id}
                                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all duration-200 border border-gray-100/50 group"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* آواتار */}
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-md">
                                            {userInfo?.avatar ? (
                                                <img
                                                    src={`http://localhost:8000${userInfo.avatar}`}
                                                    alt={userInfo.username}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = `https://ui-avatars.com/api/?name=${userInfo?.username || 'U'}&background=818cf8&color=fff&size=56`;
                                                    }}
                                                />
                                            ) : (
                                                <User className="w-8 h-8 text-indigo-500" />
                                            )}
                                        </div>

                                        {/* اطلاعات */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-800 truncate">
                                                {contact.nickname || userInfo?.username || 'کاربر'}
                                            </h3>
                                            {contact.nickname && userInfo?.username && (
                                                <p className="text-xs text-gray-400 truncate">
                                                    @{userInfo.username}
                                                </p>
                                            )}
                                            {userInfo?.email && (
                                                <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                                    <Mail className="w-3 h-3" />
                                                    {userInfo.email}
                                                </p>
                                            )}
                                            {userInfo?.phone && (
                                                <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {userInfo.phone}
                                                </p>
                                            )}
                                        </div>

                                        {/* دکمه‌ها */}
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleStartChat(contact)}
                                                disabled={startingChat === userId || !userId}
                                                className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="شروع چت"
                                            >
                                                {startingChat === userId ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <MessageCircle className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteContact(contact.id)}
                                                disabled={deletingContact === contact.id}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all disabled:opacity-50"
                                                title="حذف مخاطب"
                                            >
                                                {deletingContact === contact.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* مودال افزودن مخاطب */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800">افزودن مخاطب جدید</h2>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setNewContact({ username: "", email: "", phone: "", nickname: "" });
                                    setSearchQuery("");
                                    setSearchResults([]);
                                    setAddError(null);
                                    setSuccessMessage(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* انتخاب روش جستجو */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                جستجو با:
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchMethod('username');
                                        setSearchQuery("");
                                        setSearchResults([]);
                                        setNewContact({ username: "", email: "", phone: "", nickname: "" });
                                    }}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                        searchMethod === 'username'
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <AtSign className="w-4 h-4 inline mr-1" />
                                    نام کاربری
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchMethod('email');
                                        setSearchQuery("");
                                        setSearchResults([]);
                                        setNewContact({ username: "", email: "", phone: "", nickname: "" });
                                    }}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                        searchMethod === 'email'
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    ایمیل
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchMethod('phone');
                                        setSearchQuery("");
                                        setSearchResults([]);
                                        setNewContact({ username: "", email: "", phone: "", nickname: "" });
                                    }}
                                    className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                        searchMethod === 'phone'
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    <Phone className="w-4 h-4 inline mr-1" />
                                    تلفن
                                </button>
                            </div>
                        </div>

                        {/* جستجو */}
                        <div className="relative mb-4">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={`جستجوی کاربر با ${searchMethod === 'username' ? 'نام کاربری' : searchMethod === 'email' ? 'ایمیل' : 'شماره تلفن'}...`}
                                value={searchQuery}
                                onChange={handleSearch}
                                className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                            />
                            {searchLoading && (
                                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-indigo-500" />
                            )}
                        </div>

                        {/* نتایج جستجو */}
                        {searchResults.length > 0 && (
                            <div className="mb-4 max-h-48 overflow-y-auto border border-gray-100 rounded-xl">
                                {searchResults.map((user) => {
                                    const isSelected = 
                                        (searchMethod === 'username' && newContact.username === user.username) ||
                                        (searchMethod === 'email' && newContact.email === user.email) ||
                                        (searchMethod === 'phone' && newContact.phone === user.phone);
                                    
                                    return (
                                        <div
                                            key={user.id}
                                            className={`flex items-center gap-3 p-3 hover:bg-indigo-50 cursor-pointer transition-colors ${
                                                isSelected ? 'bg-indigo-50' : ''
                                            }`}
                                            onClick={() => {
                                                const updates = {};
                                                if (searchMethod === 'username') updates.username = user.username;
                                                if (searchMethod === 'email') updates.email = user.email;
                                                if (searchMethod === 'phone') updates.phone = user.phone;
                                                setNewContact(prev => ({ ...prev, ...updates }));
                                                setSearchQuery(searchMethod === 'username' ? user.username : searchMethod === 'email' ? user.email : user.phone);
                                                setSearchResults([]);
                                            }}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {user.avatar ? (
                                                    <img
                                                        src={`http://localhost:8000${user.avatar}`}
                                                        alt={user.username}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-5 h-5 text-indigo-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-800 truncate">{user.username}</p>
                                                {user.first_name && (
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {user.first_name} {user.last_name}
                                                    </p>
                                                )}
                                                {user.email && (
                                                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </p>
                                                )}
                                                {user.phone && (
                                                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {user.phone}
                                                    </p>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Check className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* فرم */}
                        <form onSubmit={handleAddContact}>
                            <div className="space-y-4">
                                {searchMethod === 'username' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            نام کاربری <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="نام کاربری را وارد کنید"
                                            value={newContact.username}
                                            onChange={(e) => setNewContact(prev => ({
                                                ...prev,
                                                username: e.target.value
                                            }))}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                        />
                                    </div>
                                )}

                                {searchMethod === 'email' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            ایمیل <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            placeholder="ایمیل را وارد کنید"
                                            value={newContact.email}
                                            onChange={(e) => setNewContact(prev => ({
                                                ...prev,
                                                email: e.target.value
                                            }))}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                        />
                                    </div>
                                )}

                                {searchMethod === 'phone' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            شماره تلفن <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="شماره تلفن را وارد کنید"
                                            value={newContact.phone}
                                            onChange={(e) => setNewContact(prev => ({
                                                ...prev,
                                                phone: e.target.value
                                            }))}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        نام نمایشی (اختیاری)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="نام نمایشی برای این مخاطب"
                                        value={newContact.nickname}
                                        onChange={(e) => setNewContact(prev => ({
                                            ...prev,
                                            nickname: e.target.value
                                        }))}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                                    />
                                </div>

                                {addError && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <span>{addError}</span>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm">
                                        <Check className="w-5 h-5 flex-shrink-0" />
                                        <span>{successMessage}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={addingContact || !(newContact.username || newContact.email || newContact.phone)}
                                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {addingContact ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            در حال افزودن...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="w-5 h-5" />
                                            افزودن مخاطب
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}