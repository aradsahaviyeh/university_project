// Chats.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Search, MessageCircle, Users } from "lucide-react";

export default function Chats() {
    const [chats, setChats] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        axios.get('http://localhost:8000/chats/', {
            headers: {
                Authorization: `Token ${localStorage.getItem('token')}`
            },
        })
        .then(response => setChats(response.data))
        .catch(error => console.log(error))
    }, []);

    const filteredChats = chats.filter(chat => 
        chat.other_user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getLastMessageTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const msgDate = new Date(date);
        const diff = now - msgDate;
        
        if (diff < 60000) return 'لحظاتی پیش';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} دقیقه پیش`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} ساعت پیش`;
        return msgDate.toLocaleDateString('fa-IR');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="max-w-2xl mx-auto p-4">
                {/* هدر */}
                <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl shadow-lg mb-4">
                        <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        پیام‌ها
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {chats.length} گفت‌وگو
                    </p>
                </div>

                {/* جستجو */}
                <div className="relative mb-6">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="جستجوی مخاطب..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-12 pl-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all duration-200 shadow-sm"
                    />
                </div>

                {/* لیست چت‌ها */}
                <div className="space-y-2">
                    {filteredChats.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-400">گفت‌وگویی وجود ندارد</p>
                        </div>
                    ) : (
                        filteredChats.map((chat) => (
                            <Link
                                key={chat.id}
                                to={`/chat/${chat.id}`}
                                className="block group"
                            >
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-200 border border-gray-100/50 hover:border-indigo-200">
                                    <div className="flex items-center gap-4">
                                        {/* آواتار */}
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-md">
                                                <img
                                                    src={'http://localhost:8000/' + chat.other_user_avatar}
                                                    alt="avatar"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = `https://ui-avatars.com/api/?name=${chat.other_user_name}&background=818cf8&color=fff&size=56`;
                                                    }}
                                                />
                                            </div>
                                            {chat.unread_count > 0 && (
                                                <span className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                                                    {chat.unread_count}
                                                </span>
                                            )}
                                        </div>

                                        {/* اطلاعات */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors truncate">
                                                    {chat.other_user_name}
                                                </h3>
                                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                                    {getLastMessageTime(chat.updated_at)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 truncate">
                                                {chat.last_message || 'شروع مکالمه...'}
                                            </p>
                                        </div>

                                        {/* آیتم بیشتر */}
                                        <div className="text-gray-300 group-hover:text-indigo-400 transition-colors">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}