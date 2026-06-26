// ChatDetail.jsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
    ArrowRight, Send, MoreVertical, Phone, Video, Image, MessageCircle,
    Paperclip, File, Download, ChevronLeft, ChevronRight, X,
    Loader2,
    ArrowLeft
} from "lucide-react";

export default function ChatDetail() {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatInfo, setChatInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    // State برای مدیریت آپلود فایل
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pendingMessageId, setPendingMessageId] = useState(null);
    const [isCreatingMessage, setIsCreatingMessage] = useState(false);

    const currentUserId = localStorage.getItem('userId') || localStorage.getItem('user_id');

    // ================ دریافت اطلاعات چت ================
    useEffect(() => {
        const fetchChatData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await axios.get(
                    `http://localhost:8000/chats/${chatId}/`,
                    {
                        headers: { Authorization: `Token ${localStorage.getItem('token')}` }
                    }
                );
                
                setChatInfo(response.data);
                
                if (response.data.messages && Array.isArray(response.data.messages)) {
                    setMessages(response.data.messages);
                } else {
                    setMessages([]);
                }
                
            } catch (error) {
                console.error('Error fetching chat data:', error);
                setError('خطا در دریافت اطلاعات چت');
                if (error.response?.status === 404) {
                    navigate('/chats');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchChatData();
    }, [chatId, navigate, currentUserId]);

    // ================ اسکرول به انتها ================
    useEffect(() => {
        if (messages && Array.isArray(messages) && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // ================ علامت‌گذاری پیام‌ها به عنوان خوانده شده ================
    const markAllMessagesAsRead = async () => {
        try {
            const response = await axios.post(
                `http://localhost:8000/read_all_messages/${chatId}/`,
                {},
                {
                    headers: {
                        Authorization: `Token ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                }
            );
            
            console.log('All messages marked as read:', response.data);
            
            // به‌روزرسانی پیام‌ها در UI
            setMessages(prev => prev.map(msg => {
                if (msg.sender !== currentUserId && !msg.is_read) {
                    return { ...msg, is_read: true };
                }
                return msg;
            }));
            
            return response.data;
            
        } catch (error) {
            console.error('Error marking all messages as read:', error);
            return null;
        }
    };

    // وقتی پیام‌ها لود میشن یا پیام جدید میاد، علامت‌گذاری کن
    useEffect(() => {
        const markAsRead = async () => {
            if (messages.length > 0 && chatId) {
                const unreadMessages = messages.filter(
                    msg => msg.sender !== currentUserId && !msg.is_read
                );
                
                if (unreadMessages.length > 0) {
                    await markAllMessagesAsRead();
                }
            }
        };
        
        markAsRead();
    }, [messages, chatId, currentUserId]);

    // ================ ایجاد پیام ================
    const createMessage = async (content = "") => {
        try {
            setIsCreatingMessage(true);
            
            const messageData = {
                chat: chatId,
                sender: currentUserId,
                content: content
            };

            console.log('Creating message:', messageData);

            const response = await axios.post(
                'http://localhost:8000/send_message/',
                messageData,
                {
                    headers: {
                        Authorization: `Token ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    },
                }
            );
            
            console.log('Message created:', response.data);
            
            if (response.data && response.data.id) {
                setMessages(prev => [...prev, response.data]);
                return response.data;
            }
            return null;
        } catch (error) {
            console.error('Error creating message:', error);
            alert('خطا در ایجاد پیام');
            return null;
        } finally {
            setIsCreatingMessage(false);
        }
    };

    // ================ آپلود فایل‌ها ================
    const uploadFiles = async (messageId, files) => {
        const uploadedFiles = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('message', messageId);
            formData.append('file', file);
            
            const fileType = getFileType(file);
            formData.append('file_type', fileType);

            console.log(`Uploading file ${i+1}/${files.length}:`, file.name);

            try {
                const response = await axios.post(
                    'http://localhost:8000/upload_attachment/',
                    formData,
                    {
                        headers: {
                            Authorization: `Token ${localStorage.getItem('token')}`,
                            'Content-Type': 'multipart/form-data'
                        },
                        onUploadProgress: (progressEvent) => {
                            const progress = Math.round(
                                (progressEvent.loaded * 100) / progressEvent.total
                            );
                            setUploadProgress(progress);
                        }
                    }
                );
                
                console.log('File uploaded successfully:', response.data);
                uploadedFiles.push(response.data);
                
                if (response.data.message) {
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === messageId) {
                            return response.data.message;
                        }
                        return msg;
                    }));
                }
                
            } catch (error) {
                console.error('Error uploading file:', error);
                console.error('Error response:', error.response?.data);
                alert(`خطا در آپلود فایل ${file.name}`);
            }
        }
        
        return uploadedFiles;
    };

    // ================ تشخیص نوع فایل ================
    const getFileType = (file) => {
        const type = file.type;
        if (type.startsWith('image/')) return 'image';
        if (type.startsWith('video/')) return 'video';
        if (type.startsWith('audio/')) return 'audio';
        return 'file';
    };

    // ================ هندل کردن انتخاب فایل ================
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            console.log('Files selected:', files);
            setSelectedFiles(prev => [...prev, ...files]);
        }
        e.target.value = '';
    };

    // ================ حذف فایل از لیست ================
    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // ================ ارسال پیام با متن و/یا فایل ================
    const sendMessageWithAttachments = async (e) => {
        e.preventDefault();
        
        if (!newMessage.trim() && selectedFiles.length === 0) {
            console.log('No content to send');
            return;
        }

        console.log('Starting send process...');
        console.log('Message:', newMessage);
        console.log('Files:', selectedFiles);

        setIsUploading(true);
        setUploadProgress(0);

        try {
            let message = null;

            if (newMessage.trim() || selectedFiles.length > 0) {
                message = await createMessage(newMessage.trim());
                if (!message) {
                    throw new Error('Failed to create message');
                }
                console.log('Message created with ID:', message.id);
            }

            if (selectedFiles.length > 0 && message) {
                console.log('Uploading files for message ID:', message.id);
                await uploadFiles(message.id, selectedFiles);
            }

            setNewMessage("");
            setSelectedFiles([]);
            setPendingMessageId(null);
            inputRef.current?.focus();

            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);

        } catch (error) {
            console.error('Error sending message:', error);
            alert('خطا در ارسال پیام');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // ================ ارسال با Enter ================
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!newMessage.trim() && selectedFiles.length === 0) return;
            sendMessageWithAttachments(e);
        }
    };

    // ================ گالری تصاویر ================
    const getAllImages = () => {
        const images = [];
        messages.forEach(message => {
            if (message.attachments && Array.isArray(message.attachments)) {
                message.attachments.forEach(attachment => {
                    if (attachment.file_type === 'image') {
                        images.push({
                            url: `http://localhost:8000${attachment.file}`,
                            messageId: message.id
                        });
                    }
                });
            }
        });
        return images;
    };

    const allImages = getAllImages();

    const openGallery = (index) => {
        setCurrentImageIndex(index);
        setSelectedImage(allImages[index].url);
    };

    const closeGallery = () => {
        setSelectedImage(null);
    };

    const prevImage = (e) => {
        e.stopPropagation();
        if (currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
            setSelectedImage(allImages[currentImageIndex - 1].url);
        }
    };

    const nextImage = (e) => {
        e.stopPropagation();
        if (currentImageIndex < allImages.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
            setSelectedImage(allImages[currentImageIndex + 1].url);
        }
    };

    // ================ آیکون‌های فایل ================
    const getFileIcon = (filename) => {
        const extension = filename?.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
            return 'image';
        } else if (['pdf'].includes(extension)) {
            return 'pdf';
        } else if (['doc', 'docx'].includes(extension)) {
            return 'word';
        } else if (['xls', 'xlsx'].includes(extension)) {
            return 'excel';
        } else if (['zip', 'rar', '7z'].includes(extension)) {
            return 'zip';
        } else if (['mp4', 'avi', 'mkv', 'mov'].includes(extension)) {
            return 'video';
        } else if (['mp3', 'wav', 'ogg'].includes(extension)) {
            return 'audio';
        }
        return 'file';
    };

    const getFileIconComponent = (filename) => {
        const type = getFileIcon(filename);
        switch(type) {
            case 'image':
                return <Image className="w-4 h-4" />;
            case 'pdf':
                return <File className="w-4 h-4" />;
            case 'word':
                return <File className="w-4 h-4 text-blue-600" />;
            case 'excel':
                return <File className="w-4 h-4 text-green-600" />;
            case 'zip':
                return <File className="w-4 h-4 text-yellow-600" />;
            default:
                return <Paperclip className="w-4 h-4" />;
        }
    };

    // ================ فرمت تاریخ و زمان ================
    const formatTime = (date) => {
        if (!date) return '';
        try {
            return new Date(date).toLocaleTimeString('fa-IR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        try {
            return new Date(date).toLocaleDateString('fa-IR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return '';
        }
    };

    // ================ رندر ================
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

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 text-xl">{error}</p>
                    <button 
                        onClick={() => navigate('/chats')}
                        className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-full hover:bg-indigo-600 transition-colors"
                    >
                        بازگشت به چت‌ها
                    </button>
                </div>
            </div>
        );
    }

    const messageList = Array.isArray(messages) ? messages : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
            {/* ==================== هدر ==================== */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-100/50 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/chats')}
                            className="p-2 hover:bg-indigo-50 rounded-full transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-indigo-600" />
                        </button>

                        <div className="flex items-center gap-3 flex-1">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center ring-2 ring-white shadow-sm overflow-hidden">
                                <img
                                    src={chatInfo?.other_user_avatar ? `http://localhost:8000${chatInfo.other_user_avatar}` : 'https://ui-avatars.com/api/?name=User&background=818cf8&color=fff&size=44'}
                                    alt="avatar"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.target.src = `https://ui-avatars.com/api/?name=${chatInfo?.other_user_name || 'User'}&background=818cf8&color=fff&size=44`;
                                    }}
                                />
                            </div>
                            <div className="flex-1">
                                <h2 className="font-semibold text-gray-800">
                                    {chatInfo?.other_user_name || 'کاربر'}
                                </h2>
                                <p className="text-xs text-green-500">
                                    ● آنلاین
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {/* <button className="p-2 hover:bg-indigo-50 rounded-full transition-colors">
                                <Phone className="w-5 h-5 text-gray-600 hover:text-indigo-600" />
                            </button>
                            <button className="p-2 hover:bg-indigo-50 rounded-full transition-colors">
                                <Video className="w-5 h-5 text-gray-600 hover:text-indigo-600" />
                            </button> */}
                            <button className="p-2 hover:bg-indigo-50 rounded-full transition-colors">
                                <MoreVertical className="w-5 h-5 text-gray-600 hover:text-indigo-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ==================== پیام‌ها ==================== */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-3">
                    {messageList.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-10 h-10 text-indigo-400" />
                            </div>
                            <p className="text-gray-400">هنوز پیامی ارسال نشده است</p>
                            <p className="text-gray-300 text-sm">اولین پیام را شما بفرستید</p>
                        </div>
                    ) : (
                        messageList.map((message, index) => {
                            if (!message) return null;
                            
                            const isMyMessage = message.sender === currentUserId;
                            
                            const showDate = index === 0 || 
                                (messageList[index - 1] && 
                                new Date(message.created_at).toDateString() !== 
                                new Date(messageList[index - 1].created_at).toDateString());
                            
                            const hasAttachments = message.attachments && 
                                Array.isArray(message.attachments) && 
                                message.attachments.length > 0;

                            const images = hasAttachments ? 
                                message.attachments.filter(att => att.file_type === 'image') : [];
                            const otherFiles = hasAttachments ? 
                                message.attachments.filter(att => att.file_type !== 'image') : [];
                            
                            if (!message.content && !hasAttachments) return null;
                            
                            return (
                                <div key={message.id || index}>
                                    {showDate && (
                                        <div className="flex justify-center my-4">
                                            <span className="text-xs text-gray-400 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full">
                                                {formatDate(message.created_at)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} group`}>
                                        <div className={`flex items-end gap-2 max-w-[80%] ${isMyMessage ? 'flex-row-reverse' : ''}`}>
                                            {!isMyMessage && (
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    <img
                                                        src={chatInfo?.other_user_avatar ? `http://localhost:8000${chatInfo.other_user_avatar}` : 'https://ui-avatars.com/api/?name=User&background=818cf8&color=fff&size=32'}
                                                        alt="avatar"
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.src = `https://ui-avatars.com/api/?name=${chatInfo?.other_user_name || 'User'}&background=818cf8&color=fff&size=32`;
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${
                                                isMyMessage 
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-none' 
                                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                            }`}>
                                                {isMyMessage && (
                                                    <span className="text-[9px] opacity-70 block mb-0.5 text-right">
                                                        شما
                                                    </span>
                                                )}
                                                
                                                {message.content && (
                                                    <p className="text-sm leading-relaxed break-words">
                                                        {message.content}
                                                    </p>
                                                )}
                                                
                                                {/* تصاویر */}
                                                {images.length > 0 && (
                                                    <div className={`${message.content ? 'mt-2' : ''}`}>
                                                        <div className={`grid gap-1 ${
                                                            images.length === 1 ? 'grid-cols-1' :
                                                            images.length === 2 ? 'grid-cols-2' :
                                                            images.length === 3 ? 'grid-cols-3' :
                                                            'grid-cols-3'
                                                        }`}>
                                                            {images.map((image, imgIndex) => {
                                                                const globalIndex = allImages.findIndex(
                                                                    img => img.url === `http://localhost:8000${image.file}`
                                                                );
                                                                return (
                                                                    <div
                                                                        key={image.id || imgIndex}
                                                                        className={`relative cursor-pointer overflow-hidden rounded-lg ${
                                                                            images.length === 1 ? 'max-h-64' : 'h-24'
                                                                        }`}
                                                                        onClick={() => openGallery(globalIndex)}
                                                                    >
                                                                        <img
                                                                            src={`http://localhost:8000${image.file}`}
                                                                            alt="attachment"
                                                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                                                            loading="lazy"
                                                                        />
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* سایر فایل‌ها */}
                                                {otherFiles.length > 0 && (
                                                    <div className={`${message.content || images.length > 0 ? 'mt-2' : ''} space-y-1`}>
                                                        {otherFiles.map((file) => (
                                                            <a
                                                                key={file.id}
                                                                href={`http://localhost:8000${file.file}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                                                                    isMyMessage 
                                                                        ? 'bg-white/20 hover:bg-white/30 text-white' 
                                                                        : 'bg-gray-200/70 hover:bg-gray-200 text-gray-700'
                                                                } transition-colors`}
                                                                download
                                                            >
                                                                {getFileIconComponent(file.file)}
                                                                <span className="flex-1 truncate">
                                                                    {file.file?.split('/').pop() || 'فایل'}
                                                                </span>
                                                                <Download className="w-3 h-3 flex-shrink-0" />
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                                
                                                {/* زمان و وضعیت خوانده شده */}
                                                <span className={`text-[10px] mt-1 block ${
                                                    isMyMessage ? 'text-blue-100' : 'text-gray-400'
                                                }`}>
                                                    {formatTime(message.created_at)}
                                                    {isMyMessage && (
                                                        <span className="mr-1 inline-block">
                                                            {message.is_read ? (
                                                                <span className="text-blue-200">✓✓</span>
                                                            ) : (
                                                                <span className="text-blue-300/50">✓</span>
                                                            )}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* ==================== ورودی پیام ==================== */}
            <div className="border-t border-gray-100/50 bg-white/80 backdrop-blur-md">
                {/* فایل‌های انتخاب شده */}
                {selectedFiles.length > 0 && (
                    <div className="max-w-4xl mx-auto px-4 pt-3">
                        <div className="flex flex-wrap gap-2">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-sm">
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button
                                        onClick={() => removeFile(index)}
                                        className="text-red-500 hover:text-red-700 transition-colors"
                                        disabled={isUploading}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {isUploading && (
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{uploadProgress}%</span>
                                </div>
                            )}
                            {isCreatingMessage && (
                                <div className="flex items-center gap-2 text-sm text-indigo-600">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>ایجاد پیام...</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* فرم ارسال */}
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <form onSubmit={sendMessageWithAttachments} className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            multiple
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 hover:bg-indigo-50 rounded-full transition-colors"
                            disabled={isUploading || isCreatingMessage}
                        >
                            <Paperclip className="w-5 h-5 text-gray-400 hover:text-indigo-600" />
                        </button>
                        
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedFiles.length > 0 ? "متن پیام (اختیاری)..." : "پیام خود را بنویسید..."}
                            className="flex-1 px-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-sm"
                            disabled={isUploading || isCreatingMessage}
                        />
                        
                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && selectedFiles.length === 0) || isUploading || isCreatingMessage}
                            className={`p-2.5 rounded-full transition-all duration-200 ${
                                (newMessage.trim() || selectedFiles.length > 0) && !isUploading && !isCreatingMessage
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {isUploading || isCreatingMessage ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* ==================== مودال گالری ==================== */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
                    onClick={closeGallery}
                >
                    <button
                        onClick={closeGallery}
                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors p-2"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    
                    <button
                        onClick={prevImage}
                        disabled={currentImageIndex === 0}
                        className={`absolute left-4 text-white/70 hover:text-white transition-colors p-2 ${
                            currentImageIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                    >
                        <ChevronLeft className="w-10 h-10" />
                    </button>
                    
                    <img
                        src={selectedImage}
                        alt="gallery"
                        className="max-h-[90vh] max-w-[90vw] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                    
                    <button
                        onClick={nextImage}
                        disabled={currentImageIndex === allImages.length - 1}
                        className={`absolute right-4 text-white/70 hover:text-white transition-colors p-2 ${
                            currentImageIndex === allImages.length - 1 ? 'opacity-30 cursor-not-allowed' : ''
                        }`}
                    >
                        <ChevronRight className="w-10 h-10" />
                    </button>
                    
                    <div className="absolute bottom-4 text-white/50 text-sm">
                        {currentImageIndex + 1} / {allImages.length}
                    </div>
                </div>
            )}
        </div>
    );
}