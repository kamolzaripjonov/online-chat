import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Search, Send, Phone, Video, ArrowLeft, MoreVertical, Image, Info } from 'lucide-react';

const DEMO_USERS = [
  { user_id: 'demo-1', username: 'sarah_photo', full_name: 'Sarah Photography', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
  { user_id: 'demo-2', username: 'alex_daily', full_name: 'Alex Daily', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
  { user_id: 'demo-3', username: 'mike_films', full_name: 'Mike Films', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike' },
  { user_id: 'demo-4', username: 'emma_design', full_name: 'Emma Design', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma' },
];

export default function ChatPage({ onStartCall, hideNavigation, showNavigation }) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [lastMessage, setLastMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      // Hide bottom navigation when entering chat
      if (hideNavigation) hideNavigation();
    } else {
      // Show navigation when going back
      if (showNavigation) showNavigation();
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(DEMO_USERS.filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase())));
    } else setSearchResults([]);
  }, [searchQuery]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect keyboard on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 500) {
        setKeyboardVisible(true);
      } else {
        setKeyboardVisible(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadConversations = () => {
    const stored = localStorage.getItem('manga_conversations');
    const convs = stored ? JSON.parse(stored) : [];
    const enrichedConvs = convs.map(conv => {
      const otherId = conv.user1_id === user.id ? conv.user2_id : conv.user1_id;
      const otherUser = DEMO_USERS.find(u => u.user_id === otherId) || { username: 'unknown', full_name: 'Unknown', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown' };
      return { ...conv, other_user: otherUser, last_message: conv.last_message || { content: 'No messages yet' } };
    });
    setConversations(enrichedConvs);
  };

  const loadMessages = (otherUserId) => {
    const stored = localStorage.getItem('manga_messages');
    const allMessages = stored ? JSON.parse(stored) : [];
    const chatMessages = allMessages.filter(m => (m.sender_id === user.id && m.receiver_id === otherUserId) || (m.sender_id === otherUserId && m.receiver_id === user.id));
    setMessages(chatMessages.map(m => ({
      ...m,
      sender: m.sender_id === user.id ? { username: 'You' } : DEMO_USERS.find(u => u.user_id === m.sender_id) || { username: 'Unknown' }
    })));
  };

  const startConversation = (otherUserId) => {
    const stored = localStorage.getItem('manga_conversations');
    const convs = stored ? JSON.parse(stored) : [];
    const existing = convs.find(c => (c.user1_id === user.id && c.user2_id === otherUserId) || (c.user1_id === otherUserId && c.user2_id === user.id));
    if (existing) {
      setSelectedConversation(otherUserId);
      setSearchQuery('');
      setSearchResults([]);
      return;
    }
    const newConv = { id: `conv-${Date.now()}`, user1_id: user.id, user2_id: otherUserId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    convs.unshift(newConv);
    localStorage.setItem('manga_conversations', JSON.stringify(convs));
    setSelectedConversation(otherUserId);
    setSearchQuery('');
    setSearchResults([]);
    loadConversations();
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    // Duplicate prevention
    if (messageInput.trim() === lastMessage) { setMessageInput(''); return; }

    const stored = localStorage.getItem('manga_messages');
    const messages = stored ? JSON.parse(stored) : [];
    const newMessage = { id: `msg-${Date.now()}`, sender_id: user.id, receiver_id: selectedConversation, content: messageInput.trim(), created_at: new Date().toISOString() };
    messages.unshift(newMessage);
    localStorage.setItem('manga_messages', JSON.stringify(messages));

    const convsStored = localStorage.getItem('manga_conversations');
    const convs = convsStored ? JSON.parse(convsStored) : [];
    const convIndex = convs.findIndex(c => (c.user1_id === user.id && c.user2_id === selectedConversation) || (c.user1_id === selectedConversation && c.user2_id === user.id));
    if (convIndex !== -1) { convs[convIndex].last_message = { content: messageInput.trim() }; convs[convIndex].updated_at = new Date().toISOString(); localStorage.setItem('manga_conversations', JSON.stringify(convs)); }

    setLastMessage(messageInput.trim());
    loadMessages(selectedConversation);
    setMessageInput('');
    setIsTyping(false);
    loadConversations();
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleBack = () => {
    setSelectedConversation(null);
    setIsTyping(false);
  };

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const selectedUserProfile = DEMO_USERS.find(u => u.user_id === selectedConversation);

  // If in a conversation, show Instagram-like chat interface
  if (selectedConversation) {
    return (
      <div className={`fixed inset-0 flex flex-col ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'} z-50`}>
        {/* Sticky Header - Instagram style */}
        <div className={`sticky top-0 z-20 flex items-center gap-3 px-2 py-2 border-b backdrop-blur-lg ${isDarkMode ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-gray-200'}`}>
          <button onClick={handleBack} className={`p-2 rounded-full transition flex-shrink-0 ${isDarkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <img src={selectedUserProfile?.avatar_url} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
            <div className="min-w-0">
              <p className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUserProfile?.full_name}</p>
              <p className="text-green-500 text-xs">Active now</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onStartCall(selectedConversation, 'voice')} className={`p-2.5 rounded-full transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
              <Phone className="w-5 h-5" />
            </button>
            <button onClick={() => onStartCall(selectedConversation, 'video')} className={`p-2.5 rounded-full transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
              <Video className="w-5 h-5" />
            </button>
            <button className={`p-2.5 rounded-full transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className={`flex-1 overflow-y-auto px-4 py-4 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
          <div className="max-w-2xl mx-auto space-y-1.5">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <img src={selectedUserProfile?.avatar_url} alt="" className="w-20 h-20 rounded-full mx-auto mb-4" />
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedUserProfile?.full_name}</p>
                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start a conversation with {selectedUserProfile?.username}</p>
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] sm:max-w-[70%] px-3.5 py-2 rounded-2xl ${
                  msg.sender_id === user.id
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : isDarkMode
                      ? 'bg-slate-800 text-white rounded-bl-md'
                      : 'bg-gray-200 text-gray-900 rounded-bl-md'
                }`}>
                  <p className="text-[15px] leading-relaxed break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${msg.sender_id === user.id ? 'text-blue-200' : isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input - Instagram style */}
        <div className={`sticky bottom-0 ${isDarkMode ? 'bg-slate-900' : 'bg-white'} border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-200'} pb-safe`}>
          <form onSubmit={sendMessage} className="flex items-end gap-2 px-3 py-2 max-w-2xl mx-auto">
            <button type="button" className={`p-2.5 rounded-full transition touch-manipulation flex-shrink-0 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
              <Image className="w-6 h-6" />
            </button>
            <div className={`flex-1 flex items-center min-h-[40px] rounded-full px-4 py-1.5 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={handleInputChange}
                placeholder="Message..."
                className={`flex-1 bg-transparent text-[15px] focus:outline-none ${isDarkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
              />
            </div>
            {messageInput.trim() ? (
              <button
                type="submit"
                className={`p-2.5 rounded-full transition touch-manipulation flex-shrink-0 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                <Send className="w-6 h-6" />
              </button>
            ) : (
              <button type="button" className={`p-2.5 rounded-full transition touch-manipulation flex-shrink-0 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </button>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Chat list view
  return (
    <div className={`flex flex-col ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className={`sticky top-0 z-10 p-4 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="relative">
          <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} w-5 h-5`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('startChat').replace('!', '')}
            className={`w-full pl-12 pr-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border border-slate-700 text-white placeholder-gray-400' : 'bg-white border border-gray-200 text-gray-900 placeholder-gray-500'}`}
          />
        </div>
        {searchResults.length > 0 && (
          <div className={`absolute left-4 right-4 top-full mt-2 rounded-xl shadow-xl overflow-hidden z-20 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'}`}>
            {searchResults.map((p) => (
              <button key={p.user_id} onClick={() => startConversation(p.user_id)} className={`w-full flex items-center gap-3 p-3 transition ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                <img src={p.avatar_url} alt={p.username} className="w-12 h-12 rounded-full" />
                <div className="text-left">
                  <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{p.full_name}</p>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{p.username}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className={`text-center py-16 px-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <Send className={`w-10 h-10 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} />
            </div>
            <p className="text-lg font-medium">{t('noConversations')}</p>
            <p className="text-sm mt-2">{t('startChat')}</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv.user1_id === user.id ? conv.user2_id : conv.user1_id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-800 active:bg-slate-700' : 'hover:bg-gray-100 active:bg-gray-200'}`}
            >
              <div className="relative flex-shrink-0">
                <img src={conv.other_user?.avatar_url} alt="" className="w-14 h-14 rounded-full" />
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{conv.other_user?.full_name}</p>
                <div className="flex items-center gap-1">
                  <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{conv.last_message?.content}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>now</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
