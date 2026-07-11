import {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import api from '../lib/api';
import {Heart, MessageCircle, UserPlus, Share2, X, Trash2, CheckCheck, Bell} from 'lucide-react';

function normalizeUser(raw) {
    if (!raw) return null;
    return {
        id: raw.id || raw._id,
        _id: raw._id,
        username: raw.username || '',
        full_name: raw.full_name || raw.fullName || '',
        avatar_url: raw.avatar_url || raw.avatarUrl || raw.avatar || null,
    };
}

function normalizeNotification(raw) {
    return {
        id: raw.id || raw._id,
        _id: raw._id,
        user_id: raw.user_id || raw.userId || '',
        actor_id: raw.actor_id || raw.actorId || '',
        actor: raw.actor || raw.user ? normalizeUser(raw.actor || raw.user) : undefined,
        type: raw.type,
        post_id: raw.post_id || raw.postId,
        message: raw.message,
        read: raw.read ?? false,
        created_at: raw.created_at || raw.createdAt || '',
    };
}

export default function NotificationsPanel({onClose}) {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            const response = await api.notifications.list(1, 50);
            const data = response.data || response || [];
            setNotifications(data.map(normalizeNotification));
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.notifications.markRead(id);
            setNotifications((prev) => prev.map((n) => (n.id === id ? {...n, read: true} : n)));
        } catch (error) {
            console.error('Error marking notification:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.notifications.markAllRead();
            setNotifications((prev) => prev.map((n) => ({...n, read: true})));
        } catch (error) {
            console.error('Error marking all:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await api.notifications.delete(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like':
                return <Heart className="w-5 h-5 text-red-500"/>;
            case 'comment':
                return <MessageCircle className="w-5 h-5 text-blue-500"/>;
            case 'follow':
                return <UserPlus className="w-5 h-5 text-green-500"/>;
            case 'share':
                return <Share2 className="w-5 h-5 text-purple-500"/>;
            default:
                return <Bell className="w-5 h-5 text-slate-500"/>;
        }
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString();
    };

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start animate-fade-in" onClick={onClose}>
            <div
                className={`w-full max-w-md mx-auto ${isDarkMode ? 'bg-slate-900' : 'bg-white'} min-h-screen animate-slide-up`}
                onClick={(e) => e.stopPropagation()}>
                <div
                    className={`sticky top-0 flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-200'} ${isDarkMode ? 'bg-slate-900/90' : 'bg-white/90'} glass`}>
                    <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                    <button onClick={onClose}>
                        <X className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}/>
                    </button>
                </div>

                {notifications.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-2">
                        {unreadCount > 0 && (
                            <span className="text-xs text-blue-500 font-medium">{unreadCount} unread</span>
                        )}
                        <div className="flex gap-2 ml-auto">
                            {unreadCount > 0 && (
                                <button onClick={markAllAsRead}
                                        className={`flex items-center gap-1 text-xs ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
                                    <CheckCheck className="w-4 h-4"/> Mark all
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Bell className={`w-12 h-12 mb-3 ${isDarkMode ? 'text-slate-700' : 'text-gray-300'}`}/>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>No notifications
                            yet</p>
                    </div>
                ) : (
                    <div>
                        {notifications.map((notif) => {
                            const avatar = notif.actor?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notif.actor?.username || 'default'}`;
                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => markAsRead(notif.id)}
                                    className={`flex items-center gap-3 p-4 border-b cursor-pointer transition ${notif.read ? (isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100') : (isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-blue-50 border-gray-100')} hover:${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}
                                >
                                    <div className="relative">
                                        <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover"/>
                                        <div
                                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                                            {getNotificationIcon(notif.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                            <span
                                                className="font-semibold">{notif.actor?.username || 'Someone'}</span>{' '}
                                            {notif.message || ''}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{formatTime(notif.created_at)}</p>
                                    </div>
                                    {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"/>}
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notif.id);
                                    }} className="p-1">
                                        <Trash2
                                            className={`w-4 h-4 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}/>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
