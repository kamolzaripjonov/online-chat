import {Home, Compass, Plus, MessageCircle, User} from 'lucide-react';
import {useTheme} from '../contexts/ThemeContext';

export default function BottomNavigation({activeTab, onTabChange}) {
    const {isDarkMode} = useTheme();

    const tabs = [
        {id: 'home', icon: Home, label: 'Home'},
        {id: 'search', icon: Compass, label: 'Explore'},
        {id: 'create', icon: Plus, label: 'Create', isCenter: true},
        {id: 'chat', icon: MessageCircle, label: 'Chat'},
        {id: 'profile', icon: User, label: 'Profile'},
    ];

    return (
        <nav
            className={`fixed bottom-0 left-0 right-0 z-30 ${isDarkMode ? 'bg-slate-900/90' : 'bg-white/90'} glass border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
            <div className="flex items-center justify-around h-16 max-w-md mx-auto px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    if (tab.isCenter) {
                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                className="flex flex-col items-center justify-center"
                            >
                                <div
                                    className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg -mt-4">
                                    <Icon className="w-6 h-6 text-white"/>
                                </div>
                            </button>
                        );
                    }
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1"
                        >
                            <Icon
                                className={`w-6 h-6 transition ${isActive ? 'text-blue-500' : isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                            />
                            <span
                                className={`text-[10px] font-medium transition ${isActive ? 'text-blue-500' : isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}
                            >
                {tab.label}
              </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
