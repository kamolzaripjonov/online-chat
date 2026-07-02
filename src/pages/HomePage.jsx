import React, {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';
import PostCard from '../components/PostCard';
import StoriesBar from '../components/StoriesBar';
import StoryViewer from '../components/StoryViewer';
import {postService, storyService} from '../service/authService';

export default function HomePage() {
    const {user, profile} = useAuth();
    const {t} = useLanguage();
    const {isDarkMode} = useTheme();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [storyViewerOpen, setStoryViewerOpen] = useState(false);
    const [currentStoryUserId, setCurrentStoryUserId] = useState('');
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [storyGroups, setStoryGroups] = useState([]);

    useEffect(() => {
        loadPosts();
        loadStories();
    }, [user]);

    const loadPosts = async () => {
        try {
            setLoading(true);
            const data = await postService.getPosts(1, 20);
            setPosts(data);
            setError(null);
        } catch (err) {
            console.error('Error loading posts:', err);
            setError('Failed to load posts');
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const loadStories = async () => {
        try {
            const data = await storyService.getStories();
            const groups = {};

            data.forEach((story) => {
                if (!groups[story.user._id]) {
                    groups[story.user._id] = {
                        user_id: story.user._id,
                        profiles: story.user,
                        stories: [],
                        has_unviewed: !story.viewers?.some(v => v.user === user?.id),
                    };
                }
                groups[story.user._id].stories.push(story);
            });

            const sortedGroups = Object.values(groups).sort((a, b) => {
                if (a.user_id === user?.id) return -1;
                if (b.user_id === user?.id) return 1;
                return 0;
            });
            setStoryGroups(sortedGroups);
        } catch (err) {
            console.error('Error loading stories:', err);
        }
    };

    const handleOpenStory = (userId, index) => {
        setCurrentStoryUserId(userId);
        setCurrentStoryIndex(index);
        setStoryViewerOpen(true);
    };

    const handleNextUser = () => {
        const currentIndex = storyGroups.findIndex((g) => g.user_id === currentStoryUserId);
        if (currentIndex < storyGroups.length - 1) {
            setCurrentStoryUserId(storyGroups[currentIndex + 1].user_id);
            setCurrentStoryIndex(0);
        } else setStoryViewerOpen(false);
    };

    const handlePrevUser = () => {
        const currentIndex = storyGroups.findIndex((g) => g.user_id === currentStoryUserId);
        if (currentIndex > 0) {
            setCurrentStoryUserId(storyGroups[currentIndex - 1].user_id);
            setCurrentStoryIndex(0);
        } else setStoryViewerOpen(false);
    };

    return (
        <div className={`pb-2 ${isDarkMode ? '' : 'bg-gray-50'}`}>
            <StoriesBar onOpenStory={handleOpenStory}/>
            <div className="px-0 sm:px-4 space-y-3">
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i}
                             className={`rounded-none sm:rounded-xl overflow-hidden animate-pulse ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                            <div className="p-4 flex items-center gap-3">
                                <div
                                    className={`w-10 h-10 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}/>
                                <div className="space-y-2 flex-1">
                                    <div className={`w-24 h-4 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}/>
                                </div>
                            </div>
                            <div className={`aspect-square ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}/>
                        </div>
                    ))
                ) : error ? (
                    <div className="text-center py-16 px-4">
                        <div
                            className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div
                            className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                            <span className="text-3xl">📸</span>
                        </div>
                        <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{t('noPosts')}</p>
                        <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('beFirst')}</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <PostCard key={post._id} post={post} onRefresh={loadPosts}/>
                    ))
                )}
            </div>
            {storyViewerOpen && (
                <StoryViewer userId={currentStoryUserId} initialStoryIndex={currentStoryIndex}
                             onClose={() => setStoryViewerOpen(false)} onNextUser={handleNextUser}
                             onPrevUser={handlePrevUser}/>
            )}
        </div>
    );
}