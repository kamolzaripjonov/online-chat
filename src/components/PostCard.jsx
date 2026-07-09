import React, {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {Heart, MessageCircle, Send, Bookmark, Eye, MoreHorizontal, Share2} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import api from '../api/api';
import {useLanguage} from '../contexts/LanguageContext';

export default function PostCard({post, onRefresh}) {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();
    const {t} = useLanguage();
    const navigate = useNavigate();

    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [viewsCount, setViewsCount] = useState(0);
    const [comments, setComments] = useState([]);
    const [showComments, setShowComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [likedUsers, setLikedUsers] = useState([]);

    useEffect(() => {
        if (post) {
            setLikesCount(post.likesCount || post.likes_count || post.likes?.length || 0);
            setViewsCount(post.viewsCount || post.views_count || 0);
            const userId = user?.id || user?._id;
            setIsLiked(post.isLiked || post.liked_by?.some(u => u.id === userId || u._id === userId) || false);
            setIsSaved(post.isSaved || post.saved_by?.some(u => u.id === userId || u._id === userId) || false);
            setLikedUsers(post.liked_by || []);
        }
    }, [post, user]);

    useEffect(() => {
        if (showComments) loadComments();
    }, [showComments]);

    const loadComments = async () => {
        try {
            const response = await api.comments.list(post._id || post.id);
            setComments(response.data || response || []);
        } catch (error) {
            console.error('Error loading comments:', error);
            setComments([]);
        }
    };

    const goToProfile = (userId, username) => {
        if (!userId) return;
        if (userId === user?.id || userId === user?._id) navigate('/profile');
        else if (username) navigate(`/profile/${username}`);
        else navigate(`/profile/${userId}`);
    };

    const handleLike = async () => {
        if (!user) return;
        try {
            await api.posts.toggleLike(post._id || post.id);
            setIsLiked(!isLiked);
            setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        try {
            await api.posts.toggleSave(post._id || post.id);
            setIsSaved(!isSaved);
        } catch (error) {
            console.error('Save error:', error);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!user || !commentInput.trim() || submitting) return;
        setSubmitting(true);
        try {
            await api.comments.add(post._id || post.id, commentInput.trim());
            setCommentInput('');
            await loadComments();
            onRefresh?.();
        } catch (error) {
            console.error('Comment error:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Check out this post!',
                    text: post.caption || '',
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Share error:', error);
        }
        setShowShareMenu(false);
    };

    const timeAgo = (date) => {
        if (!date) return '';
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
        return new Date(date).toLocaleDateString();
    };

    const postUser = post.user || post.profiles || post.author || {};
    const avatar = postUser.avatar || postUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${postUser.username || 'default'}`;
    const userId = postUser.id || postUser._id;
    const username = postUser.username;

    return (
        <article
            className={`mb-4 rounded-xl overflow-hidden ${isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-gray-200'}`}>
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                     onClick={() => goToProfile(userId, username)}>
                    <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover"/>
                    <div>
                        <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{username || 'Unknown'}</p>
                        <p className="text-gray-500 text-xs">{timeAgo(post.createdAt || post.created_at)}</p>
                    </div>
                </div>
                <button
                    className={`p-2 rounded-full transition ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                    <MoreHorizontal className="w-5 h-5"/></button>
            </div>

            {post.mediaUrl || post.media_url || post.media?.[0]?.url ? (
                <div className="aspect-square bg-black">
                    {post.mediaType === 'video' || post.media_type === 'video' || post.media?.[0]?.type === 'video' ? (
                        <video src={post.mediaUrl || post.media_url || post.media[0].url}
                               className="w-full h-full object-cover" controls playsInline/>
                    ) : (
                        <img src={post.mediaUrl || post.media_url || post.media[0].url} alt=""
                             className="w-full h-full object-cover" loading="lazy"/>
                    )}
                </div>
            ) : null}

            {post.caption && (
                <div className="px-3 pt-3">
                    <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <span className="font-semibold cursor-pointer hover:underline"
                              onClick={() => goToProfile(userId, username)}>{username || 'Unknown'}</span> {post.caption}
                    </p>
                </div>
            )}

            {viewsCount > 0 && <div className="px-3 py-1 flex items-center gap-1 text-xs text-gray-500"><Eye
                className="w-3.5 h-3.5"/><span>{viewsCount} views</span></div>}

            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-4">
                    <button onClick={handleLike}
                            className={`transition touch-manipulation ${isLiked ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`}/></button>
                    <button onClick={() => setShowComments(!showComments)}
                            className={`transition touch-manipulation ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <MessageCircle className="w-6 h-6"/></button>
                    <button onClick={() => setShowShareMenu(!showShareMenu)}
                            className={`transition touch-manipulation ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Share2 className="w-6 h-6"/></button>
                </div>
                <button onClick={handleSave}
                        className={`transition touch-manipulation ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`}/></button>
            </div>

            {showShareMenu && (
                <div className={`px-3 py-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                    <button onClick={handleShare}
                            className={`w-full py-2 text-sm font-medium rounded-lg transition ${isDarkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}>Share
                        Post
                    </button>
                    <button onClick={() => setShowShareMenu(false)}
                            className={`w-full py-2 text-sm font-medium rounded-lg transition ${isDarkMode ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>Cancel
                    </button>
                </div>
            )}

            {likesCount > 0 && (
                <div className="px-3 pb-1">
                    <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{likesCount.toLocaleString()} likes</p>
                    {likedUsers.length > 0 && <p className="text-xs text-gray-500">Liked
                        by {likedUsers.slice(0, 3).map(u => u.username).join(', ')}{likedUsers.length > 3 && ` and ${likedUsers.length - 3} others`}</p>}
                </div>
            )}

            {showComments && (
                <div className={`border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                    <div className="max-h-60 overflow-y-auto p-3 space-y-3">
                        {comments.length === 0 ?
                            <p className="text-gray-500 text-sm text-center py-4">No comments yet</p> : (
                                comments.map((comment) => {
                                    const commentUser = comment.user || comment.profiles || {};
                                    const commentUserId = commentUser.id || commentUser._id;
                                    const commentUsername = commentUser.username;
                                    const commentAvatar = commentUser.avatar || commentUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${commentUsername || 'default'}`;
                                    return (
                                        <div key={comment._id || comment.id} className="flex gap-2.5">
                                            <img src={commentAvatar} alt=""
                                                 className="w-8 h-8 rounded-full flex-shrink-0 cursor-pointer hover:opacity-80 transition"
                                                 onClick={() => goToProfile(commentUserId, commentUsername)}/>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    <span className="font-semibold cursor-pointer hover:underline"
                                                          onClick={() => goToProfile(commentUserId, commentUsername)}>{commentUsername || 'Unknown'}</span> {comment.content}
                                                </p>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <p className="text-xs text-gray-500">{timeAgo(comment.createdAt || comment.created_at)}</p>
                                                    <button
                                                        className="text-xs text-gray-500 hover:text-gray-700 font-medium">Reply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                    </div>
                    <form onSubmit={handleComment}
                          className={`flex gap-2 p-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                        <input type="text" value={commentInput} onChange={(e) => setCommentInput(e.target.value)}
                               placeholder="Add a comment..."
                               className={`flex-1 px-4 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`}/>
                        <button type="submit" disabled={!commentInput.trim() || submitting}
                                className="text-blue-500 font-semibold text-sm disabled:opacity-50 transition hover:text-blue-600">{submitting ? '...' : 'Post'}</button>
                    </form>
                </div>
            )}
        </article>
    );
}