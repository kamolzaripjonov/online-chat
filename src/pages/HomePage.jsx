import React, {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import StoriesBar from '../components/StoriesBar';
import StoryViewer from '../components/StoryViewer';
import PostCard from '../components/PostCard';
import CreatePostPage from './CreatePostPage';
import CreateStoryPage from './CreateStoryPage';

export default function HomePage() {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [storyViewerOpen, setStoryViewerOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

    const [createPostOpen, setCreatePostOpen] = useState(false);
    const [createStoryOpen, setCreateStoryOpen] = useState(false);

    useEffect(() => {
        loadPosts();
    }, []);

    const loadPosts = () => {
        try {
            setLoading(true);
            const stored = localStorage.getItem('manga_posts');
            const postsData = stored ? JSON.parse(stored) : [];
            if (Array.isArray(postsData)) {
                setPosts(postsData);
            } else {
                console.warn('Posts not an array:', postsData);
                setPosts([]);
            }
            setError(null);
        } catch (err) {
            console.error('Error loading posts:', err);
            setError('Failed to load posts');
            setPosts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => loadPosts();

    const handleOpenStory = (userId, index) => {
        setSelectedUserId(userId);
        setSelectedStoryIndex(index || 0);
        setStoryViewerOpen(true);
    };

    const handleCloseStory = () => {
        setStoryViewerOpen(false);
        setSelectedUserId(null);
        setSelectedStoryIndex(0);
    };

    const handleOpenCreateStory = () => setCreateStoryOpen(true);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"/>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <StoriesBar onOpenStory={handleOpenStory} onOpenCreateStory={handleOpenCreateStory}/>
            <div className="px-4 py-3">
                {error ? (
                    <div className="text-center py-10">
                        <p className="text-red-500 text-sm">{error}</p>
                        <button onClick={handleRefresh}
                                className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">Retry
                        </button>
                    </div>
                ) : !Array.isArray(posts) || posts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📸</div>
                        <p className="text-gray-500 text-lg">No posts yet</p>
                        <p className="text-gray-400 text-sm mt-1">Be the first to share something!</p>
                        <button onClick={() => setCreatePostOpen(true)}
                                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">Create
                            Post
                        </button>
                    </div>
                ) : (
                    posts.map((post) => <PostCard key={post.id || post._id} post={post} onRefresh={handleRefresh}/>)
                )}
            </div>

            {storyViewerOpen && selectedUserId && (
                <StoryViewer userId={selectedUserId} initialStoryIndex={selectedStoryIndex} onClose={handleCloseStory}
                             onNextUser={handleCloseStory} onPrevUser={handleCloseStory}/>
            )}

            {createPostOpen && <CreatePostPage onClose={() => {
                setCreatePostOpen(false);
                handleRefresh();
            }}/>}
            {createStoryOpen && <CreateStoryPage onClose={() => setCreateStoryOpen(false)}/>}
        </div>
    );
}