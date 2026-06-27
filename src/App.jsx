import React, { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import CallPage from './pages/CallPage';
import CreateStoryPage from './pages/CreateStoryPage';
import CreatePostPage from './pages/CreatePostPage';
import BottomNavigation from './components/BottomNavigation';
import NotificationsPanel from './components/NotificationsPanel';
import { Settings, LogOut, Moon, Sun, Bell, Lock, HelpCircle, Crown, ChevronRight, X, User, Globe, BarChart3, Camera } from 'lucide-react';

function ExplorePage() {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('manga_users');
    const allUsers = stored ? JSON.parse(stored) : [];
    const { user } = JSON.parse(localStorage.getItem('manga_user') || '{}');
    const filteredUsers = allUsers.filter(u => u.id !== user?.id).map(({ password, ...rest }) => rest);
    setUsers(filteredUsers);
  }, []);

  return (
    <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('explore')}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {users.length === 0 ? (
          <p className={`col-span-full text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No users yet</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className={`aspect-square rounded-xl overflow-hidden relative ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-semibold truncate text-sm">{u.username}</p>
                <p className="text-gray-400 text-xs truncate">{u.full_name}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { user, profile, signOut } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState('home');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const [callData, setCallData] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createType, setCreateType] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hideNav, setHideNav] = useState(false);
  const [inChatView, setInChatView] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('manga_notifications');
    const notifications = stored ? JSON.parse(stored) : [];
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notificationsOpen, activeTab]);

  // Reset navigation visibility when changing tabs
  useEffect(() => {
    setHideNav(false);
    setInChatView(false);
  }, [activeTab]);

  if (!user || !profile) {
    return <AuthPage />;
  }

  const handleStartCall = (userId, type) => {
    setCallData({ userId, type });
    setCallOpen(true);
  };

  const handleTabChange = (tab) => {
    if (tab === 'create') {
      setCreateModalOpen(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleCreateChoice = (type) => {
    setCreateType(type);
    setCreateModalOpen(false);
  };

  const handleEnterChatConversation = () => {
    setHideNav(true);
    setInChatView(true);
  };

  const handleExitChatConversation = () => {
    setHideNav(false);
    setInChatView(false);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header - Hide when in chat conversation */}
      {!inChatView && (
        <header className={`fixed top-0 left-0 right-0 z-40 ${isDarkMode ? 'bg-slate-900/95 backdrop-blur-lg border-b border-slate-800' : 'bg-white/95 backdrop-blur-lg border-b border-gray-200'}`}>
          <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Manga Social</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setNotificationsOpen(true)}
                className={`relative p-2 rounded-full transition touch-manipulation ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-slate-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {profile.is_premium && (
                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600'}`}>
                  <Crown className="w-3 h-3" />
                  <span className="hidden sm:inline">Premium</span>
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className={`${inChatView ? '' : 'pt-14 pb-20'} max-w-2xl mx-auto w-full`}>
        {activeTab === 'home' && <HomePage />}
        {activeTab === 'search' && <ExplorePage />}
        {activeTab === 'chat' && (
          <ChatPage
            onStartCall={handleStartCall}
            hideNavigation={handleEnterChatConversation}
            showNavigation={handleExitChatConversation}
          />
        )}
        {activeTab === 'profile' && <ProfilePage onOpenSettings={() => setSettingsOpen(true)} />}
      </main>

      {/* Bottom Navigation - Hide when in chat conversation */}
      {!inChatView && !hideNav && <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />}

      {/* Create Modal - Mobile optimized */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className={`w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl p-6 pb-8 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="w-12 h-1.5 bg-gray-500 rounded-full mx-auto mb-4 sm:hidden" />
            <h3 className={`text-xl font-semibold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('whatShare')}
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => handleCreateChoice('post')}
                className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition touch-manipulation ${
                  isDarkMode
                    ? 'border-slate-600 hover:border-blue-500 hover:bg-slate-700 active:bg-slate-600'
                    : 'border-gray-200 hover:border-blue-500 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center">
                  <Camera className="w-7 h-7 text-white" />
                </div>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('post')}</span>
              </button>
              <button
                onClick={() => handleCreateChoice('story')}
                className={`flex-1 p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition touch-manipulation ${
                  isDarkMode
                    ? 'border-slate-600 hover:border-purple-500 hover:bg-slate-700 active:bg-slate-600'
                    : 'border-gray-200 hover:border-purple-500 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Bell className="w-7 h-7 text-white" />
                </div>
                <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('story')}</span>
              </button>
            </div>
            <button
              onClick={() => setCreateModalOpen(false)}
              className={`w-full mt-6 py-3 rounded-xl font-medium transition touch-manipulation ${
                isDarkMode ? 'text-gray-400 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Notifications Panel - Full screen on mobile */}
      {notificationsOpen && (
        <NotificationsPanel onClose={() => setNotificationsOpen(false)} />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className={`w-full sm:w-[400px] rounded-t-3xl sm:rounded-2xl max-h-[85vh] overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between p-4 border-b sm:border-b-0">
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('settings')}</h3>
              <button onClick={() => setSettingsOpen(false)} className={`p-2 rounded-full transition ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-slate-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[70vh]">
              <div className={`p-2 ${isDarkMode ? 'border-b border-slate-700' : 'border-b border-gray-100'}`}>
                <div className={`text-xs font-semibold px-4 py-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>ACCOUNT</div>
                {[
                  { icon: User, label: t('accountSettings') },
                  { icon: Lock, label: t('privacySecurity') },
                  { icon: Bell, label: t('notifications') },
                ].map(({ icon: Icon, label }) => (
                  <button
                    key={label}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-700/50 active:bg-slate-600' : 'hover:bg-gray-100 active:bg-gray-200'}`}
                  >
                    <Icon className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={`flex-1 text-left ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{label}</span>
                    <ChevronRight className={`w-5 h-5 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  </button>
                ))}
              </div>

              <div className="p-2">
                <div className={`text-xs font-semibold px-4 py-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>PREFERENCES</div>

                <button
                  onClick={toggleTheme}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-700/50 active:bg-slate-600' : 'hover:bg-gray-100 active:bg-gray-200'}`}
                >
                  {isDarkMode ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
                  <span className={`flex-1 text-left ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {isDarkMode ? t('darkMode') : t('lightMode')}
                  </span>
                  <div className={`w-12 h-7 rounded-full transition-colors relative ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDarkMode ? 'right-1' : 'left-1'}`} />
                  </div>
                </button>

                <button
                  onClick={toggleLanguage}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-700/50 active:bg-slate-600' : 'hover:bg-gray-100 active:bg-gray-200'}`}
                >
                  <Globe className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`flex-1 text-left ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('language')}</span>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'en' ? 'English' : 'Русский'}
                  </span>
                </button>

                <button className={`w-full flex items-center gap-4 p-4 rounded-xl transition touch-manipulation ${isDarkMode ? 'hover:bg-slate-700/50 active:bg-slate-600' : 'hover:bg-gray-100 active:bg-gray-200'}`}>
                  <HelpCircle className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`flex-1 text-left ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('helpCenter')}</span>
                </button>
              </div>

              <div className="p-4">
                <button
                  onClick={signOut}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl text-red-500 transition touch-manipulation ${isDarkMode ? 'hover:bg-red-500/10 active:bg-red-500/20' : 'hover:bg-red-50 active:bg-red-100'}`}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t('logOut')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {callOpen && callData && (
        <CallPage
          otherUserId={callData.userId}
          callType={callData.type}
          onClose={() => {
            setCallOpen(false);
            setCallData(null);
          }}
        />
      )}

      {/* Create Post Modal */}
      {createType === 'post' && (
        <CreatePostPage onClose={() => setCreateType(null)} />
      )}

      {/* Create Story Modal */}
      {createType === 'story' && (
        <CreateStoryPage onClose={() => setCreateType(null)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
