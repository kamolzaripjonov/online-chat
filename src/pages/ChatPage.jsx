import React, {useState, useEffect, useRef} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';
import {Search, Send, Phone, Video, ArrowLeft, Image, Info, User, MoreVertical} from 'lucide-react';
import api from '../api/api';

export default function ChatPage({onStartCall, hideNavigation, showNavigation}) {
    const {user} = useAuth();
    const {t} = useLanguage();
    const {isDarkMode} = useTheme();

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const handleNewMessage = (data) => {
            if (selectedConversation === data.senderId || selectedConversation === data.receiverId) {
                setMessages(prev => [...prev, {
                    _id: data.messageId || Date.now(),
                    content: data.message,
                    sender: {_id: data.senderId},
                    createdAt: data.timestamp || new Date().toISOString()
                }]);
            }
            loadConversations();
        };

        const handleOnlineUsers = (users) => setOnlineUsers(users || []);
        window.addEventListener('newMessage', handleNewMessage);
        window.addEventListener('onlineUsers', handleOnlineUsers);

        const socket = api.getSocket();
        if (socket.connected) socket.emit('getOnlineUsers');

        return () => {
            window.removeEventListener('newMessage', handleNewMessage);
            window.removeEventListener('onlineUsers', handleOnlineUsers);
        };
    }, [selectedConversation]);

    useEffect(() => {
        loadConversations();
    }, []);
    useEffect(() => {
        if (selectedConversation) {
            loadMessages(selectedConversation);
            if (hideNavigation) hideNavigation();
            markMessagesAsRead(selectedConversation);
        } else {
            if (showNavigation) showNavigation();
        }
    }, [selectedConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    const loadConversations = async () => {
        try {
            const response = await api.messages.getChats();
            setConversations(response.data || response || []);
        } catch (err) {
            console.error('Error loading conversations:', err);
            setConversations([]);
        }
    };

    const loadMessages = async (otherUserId) => {
        try {
            setLoading(true);
            const response = await api.messages.getWith(otherUserId);
            setMessages(response.data || response || []);
        } catch (err) {
            console.error('Error loading messages:', err);
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    const markMessagesAsRead = async (chatId) => {
        try {
            await api.messages.markRead(chatId);
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    };

    const searchUsers = async () => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        try {
            const response = await api.search.users(searchQuery);
            setSearchResults(response.data || response || []);
        } catch (err) {
            console.error('Error searching users:', err);
            setSearchResults([]);
        }
    };

    useEffect(() => {
        if (searchQuery.trim()) {
            const delay = setTimeout(searchUsers, 500);
            return () => clearTimeout(delay);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const startConversation = (otherUserId) => {
        setSelectedConversation(otherUserId);
        setSearchQuery('');
        setSearchResults([]);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !selectedConversation) return;

        const messageContent = messageInput.trim();
        setMessageInput('');

        const tempMessage = {
            _id: `temp-${Date.now()}`,
            content: messageContent,
            sender: {_id: user?.id},
            createdAt: new Date().toISOString(),
            pending: true
        };
        setMessages(prev => [...prev, tempMessage]);

        try {
            await api.messages.send(selectedConversation, messageContent, 'text');
            const socket = api.getSocket();
            if (socket.connected) {
                socket.emit('sendMessage', {
                    receiverId: selectedConversation,
                    message: messageContent,
                    senderId: user?.id
                });
            }
            loadConversations();
        } catch (err) {
            console.error('Error sending message:', err);
            setMessages(prev => prev.filter(m => m._id !== tempMessage._id));
        }
    };

    const handleTyping = (e) => {
        const value = e.target.value;
        setMessageInput(value);
        const socket = api.getSocket();
        if (socket.connected && selectedConversation) {
            if (value.trim()) {
                socket.emit('typing', {receiverId: selectedConversation, userId: user?.id, username: user?.username});
            } else {
                socket.emit('stopTyping', {receiverId: selectedConversation, userId: user?.id});
            }
        }
    };

    const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString('en-US', {hour: 'numeric', minute: '2-digit', hour12: true});
    };

    const selectedUser = conversations.find(u => u._id === selectedConversation || u.id === selectedConversation);
    const isOnline = onlineUsers.includes(selectedConversation);

    if (selectedConversation) {
        return (
            <div className={`fixed inset-0 flex flex-col ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'} z-50`}>
                <div
                    className={`sticky top-0 z-20 flex items-center gap-3 px-2 py-2 border-b backdrop-blur-lg ${isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-200'}`}>
                    <button onClick={() => setSelectedConversation(null)}
                            className={`p-2 rounded-full transition flex-shrink-0 ${isDarkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
                        <ArrowLeft className="w-6 h-6"/>
                    </button>
                    <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => {
                        const username = selectedUser?.username;
                        if (username) window.location.href = `/profile/${username}`;
                    }}>
                        <img src={selectedUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                             alt="" className="w-9 h-9 rounded-full flex-shrink-0"/>
                        <div className="min-w-0">
                            <p className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser?.name || selectedUser?.username || 'Unknown'}</p>
                            <p className={`text-xs ${isOnline ? 'text-green-500' : 'text-gray-500'}`}>{isOnline ? 'Online' : 'Offline'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => onStartCall(selectedConversation, 'voice')}
                                className={`p-2.5 rounded-full transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
                            <Phone className="w-5 h-5"/></button>
                        <button onClick={() => onStartCall(selectedConversation, 'video')}
                                className={`p-2.5 rounded-full transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
                            <Video className="w-5 h-5"/></button>
                        <button
                            className={`p-2.5 rounded-full transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
                            <MoreVertical className="w-5 h-5"/></button>
                    </div>
                </div>

                <div className={`flex-1 overflow-y-auto px-4 py-4 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
                    <div className="max-w-2xl mx-auto space-y-1.5">
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"/>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-16">
                                <img
                                    src={selectedUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                    alt="" className="w-20 h-20 rounded-full mx-auto mb-4"/>
                                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUser?.name || selectedUser?.username || 'Unknown'}</p>
                                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start a
                                    conversation</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isOwn = msg.sender?._id === user?.id || msg.senderId === user?.id;
                                return (
                                    <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[80%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl ${isOwn ? 'bg-blue-600 text-white rounded-br-md' : isDarkMode ? 'bg-slate-800 text-white rounded-bl-md' : 'bg-gray-200 text-gray-900 rounded-bl-md'}`}>
                                            <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-blue-200' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatTime(msg.createdAt)}{msg.pending && ' ⏳'}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef}/>
                    </div>
                </div>

                <div
                    className={`sticky bottom-0 ${isDarkMode ? 'bg-slate-900' : 'bg-white'} border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-200'} pb-safe`}>
                    <form onSubmit={sendMessage} className="flex items-end gap-2 px-3 py-2 max-w-2xl mx-auto">
                        <button type="button"
                                className={`p-2.5 rounded-full transition touch-manipulation flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => fileInputRef.current?.click()}><Image className="w-6 h-6"/></button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*"/>
                        <div
                            className={`flex-1 flex items-center min-h-[40px] rounded-full px-4 py-1.5 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <input type="text" value={messageInput} onChange={handleTyping}
                                   placeholder={t('typeMessage')}
                                   className={`flex-1 bg-transparent text-[15px] focus:outline-none ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}/>
                        </div>
                        {messageInput.trim() ? (
                            <button type="submit"
                                    className={`p-2.5 rounded-full transition touch-manipulation flex-shrink-0 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                                <Send className="w-6 h-6"/></button>
                        ) : (
                            <button type="button"
                                    className={`p-2.5 rounded-full transition touch-manipulation flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path
                                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                </svg>
                            </button>
                        )}
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <div className={`sticky top-0 z-10 p-4 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <div className="relative">
                    <Search
                        className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} w-5 h-5`}/>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                           placeholder={t('startChat')}
                           className={`w-full pl-12 pr-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border border-slate-700 text-white placeholder-gray-500' : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-400'}`}/>
                </div>
                {searchResults.length > 0 && (
                    <div
                        className={`absolute left-4 right-4 top-full mt-2 rounded-xl shadow-xl overflow-hidden z-20 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
                        {searchResults.map((user) => (
                            <button key={user._id || user.id} onClick={() => startConversation(user._id || user.id)}
                                    className={`w-full flex items-center gap-3 p-3 transition ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                                <img src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                     alt={user.username} className="w-12 h-12 rounded-full"/>
                                <div className="text-left"><p
                                    className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.name || user.username}</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{user.username}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className={`text-center py-16 px-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        <div
                            className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <Send className={`w-10 h-10 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`}/></div>
                        <p className="text-lg font-medium">{t('noConversations')}</p>
                        <p className="text-sm mt-2">{t('startChat')}</p>
                    </div>
                ) : (
                    conversations.map((conv) => {
                        const isUserOnline = onlineUsers.includes(conv._id || conv.id);
                        return (
                            <button key={conv._id || conv.id} onClick={() => startConversation(conv._id || conv.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-800 active:bg-slate-700' : 'hover:bg-gray-100 active:bg-gray-200'}`}>
                                <div className="relative flex-shrink-0">
                                    <img src={conv.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                                         alt="" className="w-14 h-14 rounded-full"/>
                                    {isUserOnline && <div
                                        className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"/>}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{conv.name || conv.username || 'Unknown'}</p>
                                    <div className="flex items-center gap-1"><p
                                        className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{conv.lastMessage || 'No messages yet'}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{conv.lastMessageTime ? formatTime(conv.lastMessageTime) : ''}</p>
                                    {conv.unreadCount > 0 && <span
                                        className="inline-block mt-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">{conv.unreadCount}</span>}
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}