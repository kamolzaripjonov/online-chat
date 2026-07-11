import {useState, useEffect, useRef} from 'react';
import {useAuth} from '../contexts/AuthContext';
import api from '../lib/api';
import {X, Heart, Send, Eye} from 'lucide-react';

function normalizeStory(raw) {
    return {
        id: raw.id || raw._id,
        _id: raw._id,
        user_id: raw.user_id || raw.userId || '',
        user: raw.user,
        media_url: raw.media_url || raw.mediaUrl || raw.url || '',
        media_type: raw.media_type || raw.mediaType || 'image',
        created_at: raw.created_at || raw.createdAt || '',
        expires_at: raw.expires_at,
        views_count: raw.views_count ?? raw.viewsCount ?? 0,
        viewed_by: raw.viewed_by || [],
    };
}

export default function StoryViewer({userId, usersList, onClose, onNextUser, onPrevUser}) {
    const {user} = useAuth();
    const [stories, setStories] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [liked, setLiked] = useState(false);
    const [viewsCount, setViewsCount] = useState(0);
    const progressRef = useRef(null);

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
            const storiesData = (response.data || response || []).map(normalizeStory);
            if (storiesData.length === 0) {
                onClose();
                return;
            }
            setStories(storiesData);
            if (storiesData[0]?.user) setUserInfo(storiesData[0].user);
            const currentStory = storiesData[0];
            setViewsCount(currentStory.views_count || 0);
            const viewedBy = currentStory.viewed_by || [];
            setLiked(
                viewedBy.some(
                    (v) => v === user?.id || v === user?._id || (typeof v === 'object' && (v.id === user?.id || v._id === user?._id))
                ) || false
            );
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
                setProgress((prev) => {
                    if (prev >= 100) {
                        if (progressRef.current) clearInterval(progressRef.current);
                        goToNext();
                        return 100;
                    }
                    return prev + 1.5;
                });
            }
        }, 100);
    };

    const markAsViewed = async (story) => {
        if (!story || !story.id) return;
        try {
            await api.stories.view(story.id);
            setViewsCount((prev) => prev + 1);
        } catch (error) {
            console.error('Error marking story as viewed:', error);
        }
    };

    const handleLike = async () => {
        if (!user || !stories[currentIndex]) return;
        try {
            await api.stories.react(stories[currentIndex].id, 'like');
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
            onNextUser();
        }
    };

    const goToPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        } else {
            onPrevUser();
        }
    };

    const handleClick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) goToPrev();
        else if (x > (rect.width * 2) / 3) goToNext();
    };

    if (loading) return <div className="fixed inset-0 bg-black z-50"/>;
    if (stories.length === 0) return null;

    const currentStory = stories[currentIndex] || stories[0];
    const avatar = userInfo?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo?.username || 'default'}`;
    const mediaUrl = currentStory.media_url;
    const mediaType = currentStory.media_type;

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
            <div className="flex gap-1 p-2 mt-2">
                {stories.map((_, index) => (
                    <div key={index} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                        <div className="h-full bg-white transition-all"
                             style={{width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%'}}/>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-2 p-3">
                <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover"/>
                <span className="text-white text-sm font-medium">{userInfo?.username || 'Unknown'}</span>
                <span className="text-white/50 text-xs">
          {currentStory.created_at ? new Date(currentStory.created_at).toLocaleTimeString() : 'Just now'}
        </span>
                <button onClick={onClose} className="ml-auto">
                    <X className="w-6 h-6 text-white"/>
                </button>
            </div>

            <div className="flex-1 relative" onClick={handleClick} onMouseDown={() => setIsPaused(true)}
                 onMouseUp={() => setIsPaused(false)}>
                {mediaType === 'video' ? (
                    <video src={mediaUrl} autoPlay muted className="w-full h-full object-contain"/>
                ) : (
                    <img src={mediaUrl} alt="" className="w-full h-full object-contain"/>
                )}
            </div>

            <div className="flex items-center gap-4 p-4 pb-8">
                <button onClick={handleLike} className="flex items-center gap-1 text-white">
                    <Heart className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : ''}`}/>
                </button>
                <div className="flex items-center gap-1 text-white">
                    <Eye className="w-5 h-5"/>
                    <span className="text-sm">{viewsCount}</span>
                </div>
                <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Reply..."
                        className="flex-1 px-4 py-2 rounded-full bg-white/10 text-white placeholder-white/50 text-sm focus:outline-none"
                    />
                    <button type="submit" disabled={!messageInput.trim()}>
                        <Send className="w-5 h-5 text-white"/>
                    </button>
                </form>
            </div>
        </div>
    );
}
