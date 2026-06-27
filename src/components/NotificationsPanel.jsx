import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { X, Heart, MessageCircle, UserPlus, Check } from 'lucide-react';

export default function NotificationsPanel({ onClose }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    const stored = localStorage.getItem('manga_notifications');
    const allNotifications = stored ? JSON.parse(stored) : [];

    // Filter for current user and sort by date
    const userNotifications = allNotifications
      .filter(n => n.user_id === user?.id || n.for_user_id === user?.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setNotifications(userNotifications);

    // Mark all as read
    const updated = allNotifications.map(n => ({
      ...n,
      read: n.user_id === user?.id || n.for_user_id === user?.id ? true : n.read
    }));
    localStorage.setItem('manga_notifications', JSON.stringify(updated));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'reply':
        return <MessageCircle className="w-5 h-5 text-green-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-500" />;
      default:
        return <Check className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationText = (notification) => {
    const username = notification.from_user?.username || 'Someone';

    switch (notification.type) {
      case 'like':
        return `${username} ${t('likedYourPost')}`;
      case 'comment':
        return `${username} ${t('commentedOnYourPost')}`;
      case 'reply':
        return `${username} ${t('repliedToComment')}`;
      case 'follow':
        return `${username} started following you`;
      default:
        return '';
    }
  };

  const formatTime = (date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-end">
      <div className={`w-full max-w-md h-full ${isDarkMode ? 'bg-slate-800' : 'bg-white'} overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('notifications')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className={`w-12 h-12 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`} />
              <p className="text-gray-500">{t('noNotifications')}</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-center gap-3 p-4 ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-100'} transition ${
                  !notification.read ? (isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50') : ''
                }`}
              >
                {/* User Avatar */}
                <img
                  src={notification.from_user?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                  alt=""
                  className="w-12 h-12 rounded-full"
                />

                {/* Content */}
                <div className="flex-1">
                  <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {getNotificationText(notification)}
                  </p>
                  {notification.content && (
                    <p className="text-gray-500 text-sm truncate mt-1">
                      "{notification.content}"
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">{formatTime(notification.created_at)}</p>
                </div>

                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-slate-700' : 'bg-gray-100'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
