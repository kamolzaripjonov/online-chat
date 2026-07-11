import {useState, useEffect, useCallback} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import StoriesBar from '../components/StoriesBar';
import StoryViewer from '../components/StoryViewer';
import PostCard from '../components/PostCard';
import api from '../lib/api';
import {Loader2} from 'lucide-react';

export default function HomePage({onOpenProfile}) {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [storyViewerIndex, setStoryViewerIndex] = useState(null);

    const loadPosts = useCallback(async (pageNum = 1, append = false) => {
        try {
            if (pageNum === 1) setLoading(true);
            const response = await api.posts.list(pageNum, 10);
            const data = response.data || response || [];
            setPosts((prev) => (append ? [...prev, ...data] : data));
            setHasMore(data.length === 10);
        } catch (err) {
            console.error('Error loading posts:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPosts(1);
    }, [loadPosts]);

    const handleDeletePost = (postId) => {
        setPosts((prev) => prev.filter((p) => (p.id || p._id) !== postId));
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            const next = page + 1;
            setPage(next);
            loadPosts(next, true);
        }
    };

    return (
        <div className={isDarkMode ? 'bg-slate-950' : 'bg-white'}>
            <StoriesBar onOpenStory={setStoryViewerIndex}/>
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}/>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center py-20">
                    <p className="text-sm text-red-500">{error}</p>
                    <button onClick={() => loadPosts(1)}
                            className="mt-3 text-blue-500 text-sm">{isDarkMode ? 'Retry' : 'Retry'}</button>
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center py-20">
                    <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>No posts yet</p>
                </div>
            ) : (
                <div>
                    {posts.map((post) => (
                        <PostCard key={post.id || post._id} post={post} onOpenProfile={onOpenProfile}
                                  onDelete={handleDeletePost}/>
                    ))}
                    {hasMore && (
                        <button onClick={loadMore}
                                className={`w-full py-4 text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
                            Load more
                        </button>
                    )}
                </div>
            )}
            {storyViewerIndex !== null && (
                <StoryViewer startIndex={storyViewerIndex} onClose={() => setStoryViewerIndex(null)}/>
            )}
        </div>
    );
}
