import React, {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {Plus} from 'lucide-react';
import api from '../api/api';

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
            const stories = response.data || response || [];

            const groups = {};
            stories.forEach((story) => {
                const userId = story.userId || story.user_id || story.user?._id;
                if (!userId) return;

                if (!groups[userId]) {
                    groups[userId] = {
                        userId,
                        user: story.user || story.profiles || story.author || {},
                        stories: [],
                        has_unviewed: false
                    };
                }
                groups[userId].stories.push(story);

                const viewedBy = story.viewed_by || [];
                const isViewed = viewedBy.some(v => v === user?.id || v === user?._id || v.id === user?.id || v._id === user?._id);
                if (!isViewed) groups[userId].has_unviewed = true;
            });

            const sortedGroups = Object.values(groups).sort((a, b) => {
                if (a.userId === user?.id) return -1;
                if (b.userId === user?.id) return 1;
                if (a.has_unviewed && !b.has_unviewed) return -1;
                if (!a.has_unviewed && b.has_unviewed) return 1;
                return 0;
            });

            setStoryGroups(sortedGroups);
        } catch (error) {
            console.error('Error loading stories:', error);
            setStoryGroups([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStoryClick = (userId, index) => {
        const usersList = storyGroups.map(group => ({userId: group.userId, user: group.user}));
        onOpenStory(userId, index, usersList);
    };

    if (loading) {
        return (
            <div className="flex gap-4 overflow-x-auto px-4 py-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div
                            className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} animate-pulse`}/>
                        <div
                            className={`w-12 h-3 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} animate-pulse`}/>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
                <button onClick={onOpenCreateStory}
                        className="flex flex-col items-center gap-1 min-w-[70px] flex-shrink-0 group">
                    <div
                        className="relative w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-500">
                        <Plus className="w-8 h-8 text-white"/>
                    </div>
                    <span className={`text-xs truncate max-w-[60px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your Story</span>
                </button>

                {storyGroups.map((group) => {
                    if (group.userId === user?.id) return null;
                    const avatar = group.user?.avatar || group.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.user?.username || 'default'}`;
                    const username = group.user?.username || group.user?.name || 'Unknown';
                    return (
                        <button key={group.userId} onClick={() => handleStoryClick(group.userId, 0)}
                                className="flex flex-col items-center gap-1 min-w-[70px] group flex-shrink-0">
                            <div
                                className={`relative w-16 h-16 rounded-full p-0.5 ${group.has_unviewed ? 'bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500' : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}>
                                <img src={avatar} alt={username}
                                     className="w-full h-full rounded-full object-cover border-2 dark:border-slate-900 border-white"/>
                                {group.has_unviewed && <span
                                    className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 dark:border-slate-900 border-white"/>}
                            </div>
                            <span
                                className={`text-xs truncate max-w-[60px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{username}</span>
                        </button>
                    );
                })}

                {storyGroups.length === 0 &&
                    <div className="w-full text-center py-4 text-gray-500 text-sm">No stories available</div>}
            </div>
        </div>
    );
}