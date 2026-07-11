import {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';
import api from '../lib/api';
import AuthPage from '../pages/AuthPage';
import HomePage from '../pages/HomePage';
import ProfilePage from '../pages/ProfilePage';
import ChatPage from '../pages/ChatPage';
import CallPage from '../pages/CallPage';
import CreateStoryPage from '../pages/CreateStoryPage';
import CreatePostPage from '../pages/CreatePostPage';
import BottomNavigation from './BottomNavigation';
import NotificationsPanel from './NotificationsPanel';
import ExplorePage from '../pages/ExplorePage';
import {Settings, LogOut, Moon, Sun, Bell, Lock, Crown, ChevronRight, X, User, Globe} from 'lucide-react';

export default function AppContent() {
    const {user, profile, logout} = useAuth();
    const {t, language, toggleLanguage} = useLanguage();
    const {isDarkMode, toggleTheme} = useTheme();
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
        if (!user) return;
        (async () => {
            try {
                const response = await api.notifications.unreadCount();
                const count = response.count ?? response.data?.count ?? 0;
                setUnreadCount(count);
            } catch {
                setUnreadCount(0);
            }
        })();
    }, [user, notificationsOpen, activeTab]);

    useEffect(() => {
        setHideNav(false);
        setInChatView(false);
    }, [activeTab]);

    if (!user || !profile) {
        return <AuthPage/>;
    }

    const handleStartCall = (otherUser, type) => {
        setCallData({otherUser, callType: type, isIncoming: false});
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
        <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'} theme-transition`}>
            {!inChatView && (
                <header
                    className={`sticky top-0 z-30 ${isDarkMode ? 'bg-slate-900/90' : 'bg-white/90'} glass border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between h-14 px-4 max-w-md mx-auto">
                        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Social
                            Chat</h1>
                        <div className="flex items-center gap-2">
                            {profile.is_premium && (
                                <span
                                    className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">
                  <Crown className="w-3.5 h-3.5"/> Premium
                </span>
                            )}
                            <button onClick={() => setNotificationsOpen(true)}
                                    className="relative p-2 rounded-full hover:bg-black/5">
                                <Bell className={`w-5 h-5 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}/>
                                {unreadCount > 0 && (
                                    <span
                                        className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>
            )}

            <main className={`${hideNav ? 'pb-0' : 'pb-20'} max-w-md mx-auto`}>
                {activeTab === 'home' && <HomePage/>}
                {activeTab === 'search' && <ExplorePage/>}
                {activeTab === 'chat' && (
                    <ChatPage
                        onEnterConversation={handleEnterChatConversation}
                        onExitConversation={handleExitChatConversation}
                        onStartCall={handleStartCall}
                    />
                )}
                {activeTab === 'profile' && <ProfilePage onOpenSettings={() => setSettingsOpen(true)}/>}
            </main>

            {!inChatView && !hideNav && <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange}/>}

            {createModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end animate-fade-in"
                     onClick={() => setCreateModalOpen(false)}>
                    <div
                        className={`w-full ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-t-2xl p-6 animate-slide-up`}
                        onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('whatShare')}</h3>
                            <button onClick={() => setCreateModalOpen(false)}>
                                <X className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}/>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleCreateChoice('post')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'} transition`}>
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Settings className="w-6 h-6 text-blue-500"/>
                                </div>
                                <span
                                    className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('post')}</span>
                            </button>
                            <button onClick={() => handleCreateChoice('story')}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-xl ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'} transition`}>
                                <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                                    <Globe className="w-6 h-6 text-pink-500"/>
                                </div>
                                <span
                                    className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('story')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)}/>}

            {settingsOpen && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end animate-fade-in"
                     onClick={() => setSettingsOpen(false)}>
                    <div
                        className={`w-full max-h-[80vh] overflow-y-auto ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-t-2xl animate-slide-up`}
                        onClick={(e) => e.stopPropagation()}>
                        <div
                            className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-700/50">
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('settings')}</h3>
                            <button onClick={() => setSettingsOpen(false)}>
                                <X className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}/>
                            </button>
                        </div>
                        <div className="p-4 space-y-6">
                            <div>
                                <h4 className={`text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Account</h4>
                                <div className="space-y-1">
                                    {[
                                        {icon: User, label: t('accountSettings')},
                                        {icon: Lock, label: t('privacySecurity')},
                                        {icon: Bell, label: t('notifications')},
                                    ].map(({icon: Icon, label}) => (
                                        <button key={label}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition`}>
                                            <Icon
                                                className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}/>
                                            <span
                                                className={`flex-1 text-left text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{label}</span>
                                            <ChevronRight
                                                className={`w-4 h-4 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className={`text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Preferences</h4>
                                <div className="space-y-1">
                                    <button onClick={toggleTheme}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition`}>
                                        {isDarkMode ? <Moon className="w-5 h-5 text-blue-400"/> :
                                            <Sun className="w-5 h-5 text-amber-500"/>}
                                        <span
                                            className={`flex-1 text-left text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{isDarkMode ? t('darkMode') : t('lightMode')}</span>
                                        <div
                                            className={`w-10 h-6 rounded-full p-0.5 transition ${isDarkMode ? 'bg-blue-500' : 'bg-gray-300'}`}>
                                            <div
                                                className={`w-5 h-5 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-4' : ''}`}/>
                                        </div>
                                    </button>
                                    <button onClick={toggleLanguage}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition`}>
                                        <Globe
                                            className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}/>
                                        <span
                                            className={`flex-1 text-left text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('language')}</span>
                                        <span
                                            className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{language === 'en' ? 'English' : 'Русский'}</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <h4 className={`text-xs font-semibold uppercase mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>Premium</h4>
                                <button className="w-full flex items-center gap-3 p-3 rounded-xl story-gradient">
                                    <Crown className="w-5 h-5 text-white"/>
                                    <span
                                        className="flex-1 text-left text-sm font-medium text-white">{t('upgradePremium')}</span>
                                    <ChevronRight className="w-4 h-4 text-white/80"/>
                                </button>
                            </div>
                            <div>
                                <button onClick={logout}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl ${isDarkMode ? 'hover:bg-red-500/10' : 'hover:bg-red-50'} transition`}>
                                    <LogOut className="w-5 h-5 text-red-500"/>
                                    <span
                                        className="flex-1 text-left text-sm font-medium text-red-500">{t('logOut')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {callOpen && callData && (
                <CallPage
                    callData={callData}
                    onEndCall={() => {
                        setCallOpen(false);
                        setCallData(null);
                    }}
                />
            )}

            {createType === 'post' && <CreatePostPage onClose={() => setCreateType(null)}/>}
            {createType === 'story' && <CreateStoryPage onClose={() => setCreateType(null)}/>}
        </div>
    );
}
