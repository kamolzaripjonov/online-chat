import React from 'react';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';
import {Home, Search, PlusSquare, MessageCircle, User} from 'lucide-react';

export default function BottomNavigation({activeTab, onTabChange}) {
    const {t} = useLanguage();
    const {isDarkMode} = useTheme();

    const tabs = [
        {id: 'home', icon: Home},
        {id: 'search', icon: Search},
        {id: 'create', icon: PlusSquare, isSpecial: true},
        {id: 'chat', icon: MessageCircle},
        {id: 'profile', icon: User},
    ];

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-40 border-t pb-safe ${isDarkMode ? 'bg-slate-900/95 backdrop-blur-lg border-slate-800' : 'bg-white/95 backdrop-blur-lg border-gray-200'}`}>
            <div className="flex items-center justify-around max-w-2xl mx-auto">
                {tabs.map(({id, icon: Icon, isSpecial}) => (
                    <button
                        key={id}
                        onClick={() => onTabChange(id)}
                        className={`flex flex-col items-center justify-center py-2 px-4 sm:px-6 touch-manipulation transition-all ${
                            activeTab === id
                                ? `${isDarkMode ? 'text-white' : 'text-gray-900'}`
                                : `${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`
                        }`}
                    >
                        <div className={`p-2.5 rounded-xl transition-all ${
                            isSpecial
                                ? `bg-gradient-to-br ${isDarkMode ? 'from-blue-600 to-purple-600' : 'from-blue-500 to-purple-500'}`
                                : activeTab === id
                                    ? isDarkMode
                                        ? 'bg-slate-800'
                                        : 'bg-gray-100'
                                    : ''
                        }`}>
                            <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${
                                isSpecial ? 'text-white' : activeTab === id
                                    ? isDarkMode ? 'text-white' : 'text-gray-900'
                                    : ''
                            }`}/>
                        </div>
                    </button>
                ))}
            </div>
        </nav>
    );
}
