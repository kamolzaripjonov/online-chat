import {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import api from '../lib/api';
import {Plus} from 'lucide-react';

function normalizeUser(raw) {
    if (!raw) return null;
    return {
        id: raw.id || raw._id,
        _id: raw._id,
        username: raw.username || '',
        full_name: raw.full_name || raw.fullName || '',
        avatar_url: raw.avatar_url || raw.avatarUrl || raw.avatar || null,
    };
}

function normalizeStory(raw) {
    return {
        id: raw.id || raw._id,
        _id: raw._id,
        user_id: raw.user_id || raw.userId || '',
        user: raw.user ? normalizeUser(raw.user) : undefined,
        media_url: raw.media_url || raw.mediaUrl || raw.url || '',
        media_type: raw.media_type || raw.mediaType || 'image',
        created_at: raw.created_at || raw.createdAt || '',
        expires_at: raw.expires_at,
        views_count: raw.views_count ?? raw.viewsCount ?? 0,
        viewed_by: raw.viewed_by || [],
    };
}

export default function StoriesBar({onOpenStory, onOpenCreateStory}) {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();
    const {t} = useLanguage();
    const [storyGroups, setStoryGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStories();
        const interval = setInterval(loadStories, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStories = async () => {
        try {
            setLoading(true);
            const response = await api.stories.list();
            const stories = (response.data || response || []).map(normalizeStory);
            const groups = {};

            for (const story of stories) {
                const uid = story.user_id;
                if (!uid) continue;
                if (!groups[uid]) {
                    groups[uid] = {
                        userId: uid,
                        user: normalizeUser(story.user || {}),
                        stories: [],
                        has_unviewed: false,
                    };
                }
                groups[uid].stories.push(story);
                const viewedBy = story.viewed_by || [];
                const isViewed = viewedBy.some(
                    (v) => v === user?.id || v === user?._id || (typeof v === 'object' && (v.id === user?.id || v._id === user?._id))
                );
                if (!isViewed) groups[uid].has_unviewed = true;
            }

            const sorted = Object.values(groups).sort((a, b) => {
                if (a.userId === user?.id) return -1;
                if (b.userId === user?.id) return 1;
                if (a.has_unviewed && !b.has_unviewed) return -1;
                if (!a.has_unviewed && b.has_unviewed) return 1;
                return 0;
            });

            setStoryGroups(sorted);
        } catch (error) {
            console.error('Error loading stories:', error);
            setStoryGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStoryClick = (userId, index) => {
        const usersList = storyGroups.map((g) => ({userId: g.userId, user: g.user}));
        onOpenStory(userId, index, usersList);
    };

    if (loading) {
        return (
            <div className="flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex-shrink-0 w-16 h-16 rounded-full skeleton"/>
                ))}
            </div>
        );
    }

    return (
        <div
            className={`flex gap-3 px-4 py-3 overflow-x-auto scrollbar-hide border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
            <button onClick={onOpenCreateStory} className="flex-shrink-0 flex flex-col items-center gap-1">
                <div className="relative w-16 h-16">
                    <div
                        className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} flex items-center justify-center overflow-hidden`}>
                        <Plus className={`w-6 h-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}/>
                    </div>
                </div>
                <span className={`text-[10px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('story')}</span>
            </button>

            {storyGroups.map((group) => {
                if (group.userId === user?.id) return null;
                const avatar = group.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.user?.username || 'default'}`;
                const username = group.user?.username || 'Unknown';
                return (
                    <button key={group.userId} onClick={() => handleStoryClick(group.userId, 0)}
                            className="flex-shrink-0 flex flex-col items-center gap-1">
                        <div
                            className={`w-16 h-16 rounded-full p-0.5 ${group.has_unviewed ? 'story-gradient' : isDarkMode ? 'bg-slate-700' : 'bg-gray-300'}`}>
                            <div
                                className={`w-full h-full rounded-full p-0.5 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                                <img src={avatar} alt={username} className="w-full h-full rounded-full object-cover"/>
                            </div>
                        </div>
                        <span
                            className={`text-[10px] max-w-[64px] truncate ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{username}</span>
                    </button>
                );
            })}

            {storyGroups.length === 0 && (
                <div className="flex items-center">
                    <span
                        className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('noStories')}</span>
                </div>
            )}
        </div>
    );
}
