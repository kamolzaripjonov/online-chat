import React, {useState, useEffect} from 'react';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {Heart, MessageCircle, UserPlus, Share2, X, Trash2, CheckCheck} from 'lucide-react';

export default function NotificationsPanel({onClose}) {
    const {isDarkMode} = useTheme();
    const {t} = useLanguage();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = () => {
        const stored = localStorage.getItem('manga_notifications');
        const data = stored ? JSON.parse(stored) : [];
        setNotifications(data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    };

    const markAsRead = (id) => {
        const updated = notifications.map(n =>
            n.id === id ? {...n, read: true} : n
        );
        setNotifications(updated);
        localStorage.setItem('manga_notifications', JSON.stringify(updated));
    };

    const markAllAsRead = () => {
        const updated = notifications.map(n => ({...n, read: true}));
        setNotifications(updated);
        localStorage.setItem('manga_notifications', JSON.stringify(updated));
    };

    const deleteNotification = (id) => {
        const updated = notifications.filter(n => n.id !== id);
        setNotifications(updated);
        localStorage.setItem('manga_notifications', JSON.stringify(updated));
    };

    const deleteAllNotifications = () => {
        if (window.confirm('Hammasini o\'chirmoqchisiz?')) {
            setNotifications([]);
            localStorage.setItem('manga_notifications', JSON.stringify([]));
        }
    };

    const getNotificationIcon = (type) => {
        const iconClass = 'w-5 h-5';
        switch (type) {
            case 'like':
                return <Heart className={`${iconClass} text-red-500`} fill="currentColor"/>;
            case 'comment':
                return <MessageCircle className={`${iconClass} text-blue-500`}/>;
            case 'follow':
                return <UserPlus className={`${iconClass} text-green-500`}/>;
            case 'share':
                return <Share2 className={`${iconClass} text-purple-500`}/>;
            default:
                return <MessageCircle className={`${iconClass} text-gray-500`}/>;
        }
    };

    const getNotificationMessage = (notif) => {
        switch (notif.type) {
            case 'like':
                return `${notif.userName} sizning postingizni yoqtirdi`;
            case 'comment':
                return `${notif.userName} sizning postingizga komment qoldirdi`;
            case 'follow':
                return `${notif.userName} sizni kuzatishni boshladi`;
            case 'share':
                return `${notif.userName} sizning postingizni ulashdi`;
            default:
                return notif.message;
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Hozir';
        if (minutes < 60) return `${minutes} minut oldin`;
        if (hours < 24) return `${hours} soat oldin`;
        if (days < 7) return `${days} kun oldin`;

        return date.toLocaleDateString('uz-UZ');
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <div
                    className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <div className="flex-1">
                        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Notificationlar
                        </h3>
                        {unreadCount > 0 && (
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {unreadCount} o'qilmagan
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-slate-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
                    >
                        <X className="w-6 h-6"/>
                    </button>
                </div>

                {notifications.length > 0 && (
                    <div
                        className={`flex gap-2 p-3 border-b ${isDarkMode ? 'border-slate-700 bg-slate-750' : 'border-gray-200 bg-gray-50'}`}>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${isDarkMode ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                            >
                                <CheckCheck className="w-4 h-4"/>
                                Hamma o'qilgan
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={deleteAllNotifications}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                            >
                                <Trash2 className="w-4 h-4"/>
                                Hamma o'chir
                            </button>
                        )}
                    </div>
                )}

                <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                        <div
                            className={`flex flex-col items-center justify-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            <MessageCircle className="w-12 h-12 mb-3 opacity-50"/>
                            <p>Notificationlar yo'q</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => markAsRead(notif.id)}
                                className={`p-4 border-b cursor-pointer transition ${notif.read ? (isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100') : (isDarkMode ? 'bg-slate-700/50 border-slate-700' : 'bg-blue-50 border-gray-100')} hover:${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}
                            >
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0">
                                        {notif.userAvatar ? (
                                            <img
                                                src={notif.userAvatar}
                                                alt={notif.userName}
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div
                                                className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                                                {getNotificationIcon(notif.type)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {getNotificationMessage(notif)}
                                                </p>
                                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                    {formatTime(notif.timestamp)}
                                                </p>
                                            </div>
                                            {!notif.read && (
                                                <div
                                                    className="w-2 h-2 rounded-full bg-blue-500 ml-2 mt-1.5 flex-shrink-0"/>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notif.id);
                                        }}
                                        className={`p-2 rounded-lg transition ${isDarkMode ? 'text-gray-500 hover:text-red-400 hover:bg-slate-700' : 'text-gray-400 hover:text-red-600 hover:bg-gray-100'}`}
                                    >
                                        <X className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}