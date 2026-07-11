import {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import api from '../lib/api';
import {Search, UserPlus, UserCheck, Loader2} from 'lucide-react';

function normalizeUser(raw) {
    if (!raw) return null;
    return {
        id: raw.id || raw._id,
        _id: raw._id,
        username: raw.username || '',
        full_name: raw.full_name || raw.fullName || '',
        avatar_url: raw.avatar_url || raw.avatarUrl || raw.avatar || null,
        bio: raw.bio || '',
        followers_count: raw.followers_count ?? raw.followersCount ?? 0,
        following: raw.following ?? false,
    };
}

export default function ExplorePage({onOpenProfile}) {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();
    const {t} = useLanguage();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [followLoading, setFollowLoading] = useState({});

    useEffect(() => {
        const delay = setTimeout(async () => {
            if (query.trim().length < 1) {
                setResults([]);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const response = await api.search.users(query.trim());
                const data = response.data || response || [];
                setResults(data.map(normalizeUser).filter(Boolean));
            } catch (err) {
                console.error('Search error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(delay);
    }, [query]);

    const handleFollow = async (userId) => {
        setFollowLoading((prev) => ({...prev, [userId]: true}));
        try {
            const target = results.find((r) => r.id === userId);
            if (target?.following) {
                await api.follow.unfollow(userId);
                setResults((prev) => prev.map((r) => (r.id === userId ? {
                    ...r,
                    following: false,
                    followers_count: r.followers_count - 1
                } : r)));
            } else {
                await api.follow.follow(userId);
                setResults((prev) => prev.map((r) => (r.id === userId ? {
                    ...r,
                    following: true,
                    followers_count: r.followers_count + 1
                } : r)));
            }
        } catch (err) {
            console.error('Follow error:', err);
        } finally {
            setFollowLoading((prev) => ({...prev, [userId]: false}));
        }
    };

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
            <div className="p-4 sticky top-0 z-10">
                <div className="relative">
                    <Search
                        className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}/>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('searchUsers')}
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                </div>
            </div>

            <div className="px-4 pb-20">
                {loading && (
                    <div className="flex justify-center py-10">
                        <Loader2 className={`w-6 h-6 animate-spin ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}/>
                    </div>
                )}
                {error && <p className="text-sm text-red-500 text-center py-10">{error}</p>}
                {!loading && !error && results.length === 0 && query.trim() && (
                    <p className={`text-sm text-center py-10 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('noUsersFound')}</p>
                )}
                {!loading && !error && results.length === 0 && !query.trim() && (
                    <p className={`text-sm text-center py-10 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('searchPrompt')}</p>
                )}
                {results.map((u) => {
                    const avatar = u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username || 'default'}`;
                    const isMe = u.id === user?.id;
                    return (
                        <div key={u.id}
                             className={`flex items-center gap-3 p-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                            <button onClick={() => onOpenProfile?.(u.id)}
                                    className="flex items-center gap-3 flex-1 min-w-0">
                                <img src={avatar} alt={u.username}
                                     className="w-12 h-12 rounded-full object-cover flex-shrink-0"/>
                                <div className="text-left min-w-0">
                                    <p className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{u.username}</p>
                                    <p className={`text-xs truncate ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{u.full_name || ''}</p>
                                    <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{u.followers_count} followers</p>
                                </div>
                            </button>
                            {!isMe && (
                                <button
                                    onClick={() => handleFollow(u.id)}
                                    disabled={followLoading[u.id]}
                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                                        u.following
                                            ? `${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'}`
                                            : 'bg-blue-500 text-white hover:bg-blue-600'
                                    } disabled:opacity-50`}
                                >
                                    {u.following ? <UserCheck className="w-4 h-4"/> : <UserPlus className="w-4 h-4"/>}
                                    {u.following ? t('following') : t('follow')}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
