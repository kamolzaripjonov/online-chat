import {useState, useEffect, useRef, useCallback} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import api from '../lib/api';
import {Send, ArrowLeft, Search, MessageCircle, Loader2, Phone, Video} from 'lucide-react';

function normalizeUser(raw) {
    if (!raw) return {id: '', username: 'Unknown', avatar_url: null};
    return {
        id: raw.id || raw._id,
        _id: raw._id,
        username: raw.username || '',
        full_name: raw.full_name || raw.fullName || '',
        avatar_url: raw.avatar_url || raw.avatarUrl || raw.avatar || null,
    };
}

function normalizeMessage(raw) {
    return {
        id: raw.id || raw._id,
        _id: raw._id,
        sender_id: raw.sender_id || raw.senderId || '',
        receiver_id: raw.receiver_id || raw.receiverId || '',
        content: raw.content || '',
        type: raw.type || 'text',
        media_url: raw.media_url || raw.mediaUrl || null,
        created_at: raw.created_at || raw.createdAt || new Date().toISOString(),
        read: raw.read ?? false,
    };
}

export default function ChatPage({onStartCall, conversationId: initialConversationId}) {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();
    const {t} = useLanguage();
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [activeConversationId, setActiveConversationId] = useState(initialConversationId || null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    const loadConversations = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.messages.conversations();
            const data = response.data || response || [];
            setConversations(data.map((c) => ({
                id: c.id || c._id,
                user: normalizeUser(c.user || c.participant || c.otherUser),
                last_message: c.last_message || c.lastMessage || '',
                last_message_time: c.last_message_time || c.lastMessageTime || c.updated_at || c.updatedAt || '',
                unread_count: c.unread_count ?? c.unreadCount ?? 0,
            })));
        } catch (err) {
            console.error('Error loading conversations:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    const loadMessages = useCallback(async (convId) => {
        if (!convId) return;
        setMessagesLoading(true);
        try {
            const response = await api.messages.list(convId, 1, 50);
            const data = response.data || response || [];
            setMessages(data.map(normalizeMessage));
        } catch (err) {
            console.error('Error loading messages:', err);
        } finally {
            setMessagesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeConversationId) {
            const conv = conversations.find((c) => c.id === activeConversationId);
            if (conv) setActiveConversation(conv);
            loadMessages(activeConversationId);
        }
    }, [activeConversationId, conversations, loadMessages]);

    useEffect(() => {
        if (initialConversationId) setActiveConversationId(initialConversationId);
    }, [initialConversationId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
    }, [messages]);

    useEffect(() => {
        const handleNewMessage = (event) => {
            const msg = normalizeMessage(event.detail);
            if (msg.conversation_id === activeConversationId || msg.conversationId === activeConversationId || msg.chat_id === activeConversationId || msg.chatId === activeConversationId) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
            loadConversations();
        };
        window.addEventListener('newMessage', handleNewMessage);
        return () => window.removeEventListener('newMessage', handleNewMessage);
    }, [activeConversationId, loadConversations]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversationId) return;
        const text = newMessage.trim();
        setNewMessage('');
        try {
            const response = await api.messages.send(activeConversationId, text);
            const msg = normalizeMessage(response.data || response);
            setMessages((prev) => [...prev, msg]);
        } catch (err) {
            console.error('Send error:', err);
            setNewMessage(text);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    };

    const filteredConversations = conversations.filter((c) =>
        c.user?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (activeConversation) {
        const otherUser = activeConversation.user;
        const avatar = otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username || 'default'}`;
        return (
            <div className={`flex flex-col h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
                <div
                    className={`flex items-center gap-3 px-4 py-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                    <button onClick={() => {
                        setActiveConversation(null);
                        setActiveConversationId(null);
                    }} className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                        <ArrowLeft className="w-6 h-6"/>
                    </button>
                    <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover"/>
                    <div className="flex-1">
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{otherUser?.username || 'Unknown'}</p>
                    </div>
                    <button onClick={() => onStartCall?.(otherUser, 'audio')}
                            className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
                        <Phone className={`w-5 h-5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}/>
                    </button>
                    <button onClick={() => onStartCall?.(otherUser, 'video')}
                            className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
                        <Video className={`w-5 h-5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                    {messagesLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2
                                className={`w-6 h-6 animate-spin ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}/>
                        </div>
                    ) : messages.length === 0 ? (
                        <p className={`text-sm text-center py-10 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('noMessages')}</p>
                    ) : (
                        messages.map((msg) => {
                            const isMine = msg.sender_id === user?.id || msg.senderId === user?.id;
                            return (
                                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[70%] px-3.5 py-2 rounded-2xl ${isMine ? 'bg-blue-500 text-white' : isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-gray-100 text-gray-800'}`}>
                                        <p className="text-sm break-words">{msg.content}</p>
                                        <p className={`text-[10px] mt-0.5 ${isMine ? 'text-blue-100' : isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{formatTime(msg.created_at)}</p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef}/>
                </div>

                <form onSubmit={handleSend}
                      className={`flex items-center gap-2 px-4 py-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('typeMessage')}
                        className={`flex-1 px-4 py-2.5 rounded-full border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button type="submit" disabled={!newMessage.trim()}
                            className="p-2.5 bg-blue-500 text-white rounded-full disabled:opacity-30">
                        <Send className="w-5 h-5"/>
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
            <div className="p-4">
                <h2 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('messages')}</h2>
                <div className="relative">
                    <Search
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}/>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('search')}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                </div>
            </div>

            <div className="pb-20">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className={`w-6 h-6 animate-spin ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}/>
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center py-20">
                        <MessageCircle className={`w-12 h-12 mb-3 ${isDarkMode ? 'text-slate-700' : 'text-gray-300'}`}/>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('noConversations')}</p>
                    </div>
                ) : (
                    filteredConversations.map((conv) => {
                        const avatar = conv.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.user?.username || 'default'}`;
                        return (
                            <button
                                key={conv.id}
                                onClick={() => setActiveConversationId(conv.id)}
                                className={`flex items-center gap-3 w-full p-3 border-b text-left ${isDarkMode ? 'border-slate-800 hover:bg-slate-900' : 'border-gray-100 hover:bg-gray-50'}`}
                            >
                                <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover"/>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{conv.user?.username || 'Unknown'}</p>
                                    <p className={`text-xs truncate ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{conv.last_message || ''}</p>
                                </div>
                                {conv.unread_count > 0 && (
                                    <span
                                        className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">{conv.unread_count}</span>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}
