import React, {useState, useEffect} from 'react';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';

export default function ExplorePage() {
    const {t} = useLanguage();
    const {isDarkMode} = useTheme();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const stored = localStorage.getItem('manga_users');
        const allUsers = stored ? JSON.parse(stored) : [];
        const {user} = JSON.parse(localStorage.getItem('manga_user') || '{}');
        const filteredUsers = allUsers.filter(u => u.id !== user?.id).map(({password, ...rest}) => rest);
        setUsers(filteredUsers);
    }, []);

    return (
        <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('explore')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {users.length === 0 ? (
                    <p className={`col-span-full text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>No
                        users yet</p>
                ) : (
                    users.map((u) => (
                        <div key={u.id}
                             className={`aspect-square rounded-xl overflow-hidden relative ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover"/>
                            <div
                                className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
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