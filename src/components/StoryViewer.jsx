import React, {useState, useEffect, useRef} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {X, Heart, MessageCircle, ChevronLeft, ChevronRight, Send, Eye} from 'lucide-react';
import api from '../api/api';

export default function StoryViewer({userId, initialStoryIndex, onClose, onNextUser, onPrevUser}) {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();

    const [stories, setStories] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(initialStoryIndex || 0);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [liked, setLiked] = useState(false);
    const [viewsCount, setViewsCount] = useState(0);

    const progressRef = useRef(null);
    const containerRef = useRef(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    useEffect(() => {
        if (userId) loadStories();
    }, [userId]);
    useEffect(() => {
        if (stories.length > 0 && currentIndex < stories.length) {
            startProgress();
            markAsViewed(stories[currentIndex]);
        }
        return () => {
            if (progressRef.current) clearInterval(progressRef.current);
        };
    }, [currentIndex, stories]);

    const loadStories = async () => {
        try {
            setLoading(true);
            const response = await api.stories.getByUser(userId);
            const storiesData = response.data || response || [];
            if (storiesData.length === 0) {
                onClose();
                return;
            }
            setStories(storiesData);
            if (storiesData[0]?.user) setUserInfo(storiesData[0].user);
            const currentStory = storiesData[0];
            setViewsCount(currentStory.viewsCount || currentStory.views_count || 0);
            const viewedBy = currentStory.viewed_by || [];
            setLiked(viewedBy.some(v => v === user?.id || v === user?._id || v.id === user?.id || v._id === user?._id) || false);
        } catch (error) {
            console.error('Error loading stories:', error);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const startProgress = () => {
        setProgress(0);
        if (progressRef.current) clearInterval(progressRef.current);
        progressRef.current = setInterval(() => {
            if (!isPaused) {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(progressRef.current);
                        goToNext();
                        return 100;
                    }
                    return prev + 1.5;
                });
            }
        }, 100);
    };

    const markAsViewed = async (story) => {
        if (!story || !story._id) return;
        try {
            await api.stories.view(story._id);
            setViewsCount(prev => prev + 1);
        } catch (error) {
            console.error('Error marking story as viewed:', error);
        }
    };

    const handleLike = async () => {
        if (!user || !stories[currentIndex]) return;
        try {
            await api.stories.react(stories[currentIndex]._id, 'like');
            setLiked(!liked);
        } catch (error) {
            console.error('Error liking story:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !user) return;
        try {
            await api.messages.send(userId, messageInput.trim());
            setMessageInput('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const goToNext = () => {
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            if (onNextUser) onNextUser(); else onClose();
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        } else {
            if (onPrevUser) onPrevUser();
        }
    };

    const handleTouchStart = (e) => {
        touchStartX.current = e.changedTouches[0].screenX;
        setIsPaused(true);
    };
    const handleTouchEnd = (e) => {
        touchEndX.current = e.changedTouches[0].screenX;
        const diff = touchStartX.current - touchEndX.current;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goToNext(); else goToPrev();
        }
        setIsPaused(false);
    };
    const handleMouseDown = () => setIsPaused(true);
    const handleMouseUp = () => setIsPaused(false);
    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) goToPrev();
        else if (x > rect.width * 2 / 3) goToNext();
    };

    if (loading) return <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"/>
    </div>;
    if (stories.length === 0) return null;

    const currentStory = stories[currentIndex] || stories[0];
    const avatar = userInfo?.avatar || userInfo?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo?.username || 'default'}`;
    const mediaUrl = currentStory.mediaUrl || currentStory.media_url || currentStory.url;
    const mediaType = currentStory.mediaType || currentStory.media_type || 'image';

    return (
        <div className="fixed inset-0 bg-black z-50" ref={containerRef} onTouchStart={handleTouchStart}
             onTouchEnd={handleTouchEnd} onMouseDown={handleMouseDown} onMouseUp={handleMouseUp}>
            <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
                {stories.map((_, index) => (
                    <div key={index} className="h-1 flex-1 bg-gray-800 rounded overflow-hidden">
                        <div className="h-full bg-white transition-all duration-300"
                             style={{width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'}}/>
                    </div>
                ))}
            </div>

            <div className="absolute top-12 left-4 right-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <img src={avatar} alt={userInfo?.username || 'User'}
                         className="w-10 h-10 rounded-full border-2 border-white object-cover"/>
                    <div>
                        <p className="text-white font-semibold text-sm">{userInfo?.username || 'Unknown'}</p>
                        <p className="text-gray-400 text-xs">{currentStory.createdAt || currentStory.created_at ? new Date(currentStory.createdAt || currentStory.created_at).toLocaleTimeString() : 'Just now'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-gray-400 text-xs"><Eye
                        className="w-4 h-4"/><span>{viewsCount}</span></div>
                    <button onClick={onClose} className="text-white hover:bg-white/10 p-2 rounded-full transition"><X
                        className="w-6 h-6"/></button>
                </div>
            </div>

            <div className="absolute inset-0 flex items-center justify-center" onClick={handleClick}>
                {mediaType === 'video' ?
                    <video src={mediaUrl} className="w-full h-full object-contain" autoPlay playsInline muted
                           controls/> : <img src={mediaUrl} alt="Story" className="w-full h-full object-contain"
                                             onError={(e) => e.target.src = 'https://via.placeholder.com/400x400/000/fff?text=No+Image'}/>}
            </div>

            {stories.length > 1 && (
                <>
                    <button onClick={goToPrev}
                            className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-10">
                        <ChevronLeft className="w-8 h-8"/></button>
                    <button onClick={goToNext}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition z-10">
                        <ChevronRight className="w-8 h-8"/></button>
                </>
            )}

            <div className="absolute bottom-8 left-4 right-4 flex items-center gap-3 z-10">
                <form onSubmit={handleSendMessage}
                      className="flex-1 flex items-center gap-2 bg-white/20 backdrop-blur-lg rounded-full px-4 py-2">
                    <input type="text" value={messageInput} onChange={(e) => setMessageInput(e.target.value)}
                           placeholder="Send message..."
                           className="flex-1 bg-transparent text-white placeholder-gray-400 text-sm focus:outline-none"
                           onClick={(e) => e.stopPropagation()}/>
                    <button type="submit" className="text-white hover:scale-110 transition"
                            onClick={(e) => e.stopPropagation()}><Send className="w-5 h-5"/></button>
                </form>
                <button onClick={handleLike}
                        className={`text-white hover:scale-110 transition ${liked ? 'text-red-500' : ''}`}><Heart
                    className={`w-6 h-6 ${liked ? 'fill-current' : ''}`}/></button>
                <button className="text-white hover:scale-110 transition"><MessageCircle className="w-6 h-6"/></button>
            </div>
        </div>
    );
}