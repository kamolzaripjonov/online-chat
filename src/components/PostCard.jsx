import {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import api from '../lib/api';
import {Heart, MessageCircle, Send, MoreHorizontal, Trash2} from 'lucide-react';

function timeAgo(dateStr) {
    if (!dateStr) return 'now';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
}

function normalizeUser(raw) {
    if (!raw) return {id: '', username: 'Unknown', avatar_url: null};
    return {
        id: raw.id || raw._id,
        _id: raw._id,
        username: raw.username || '',
        full_name: raw.full_name || raw.fullName || '',
        avatar_url: raw.avatar_url || raw.avatarUrl || raw.avatar || null,
    };
}

export default function PostCard({post, onOpenProfile, onDelete}) {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();
    const {t} = useLanguage();
    const [likesCount, setLikesCount] = useState(post.likes_count ?? post.likesCount ?? 0);
    const [liked, setLiked] = useState(post.liked_by_me ?? post.likedByMe ?? false);
    const [comments, setComments] = useState([]);
    const [commentsCount, setCommentsCount] = useState(post.comments_count ?? post.commentsCount ?? 0);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        setLikesCount(post.likes_count ?? post.likesCount ?? 0);
        setLiked(post.liked_by_me ?? post.likedByMe ?? false);
        setCommentsCount(post.comments_count ?? post.commentsCount ?? 0);
    }, [post]);

    useEffect(() => {
        if (showComments) loadComments();
    }, [showComments]);

    const loadComments = async () => {
        try {
            const postId = post.id || post._id;
            const response = await api.comments.list(postId);
            const data = response.data || response || [];
            setComments(
                data.map((c) => ({
                    ...c,
                    id: c.id || c._id,
                    user: c.user ? normalizeUser(c.user) : undefined,
                }))
            );
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    };

    const handleLike = async () => {
        if (!user) return;
        const postId = post.id || post._id;
        const wasLiked = liked;
        setLiked(!wasLiked);
        setLikesCount((c) => (wasLiked ? c - 1 : c + 1));
        try {
            await api.posts.toggleLike(postId);
        } catch (error) {
            setLiked(wasLiked);
            setLikesCount((c) => (wasLiked ? c + 1 : c - 1));
            console.error('Like error:', error);
        }
    };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim() || !user) return;
        const postId = post.id || post._id;
        try {
            if (replyTo) {
                const response = await api.comments.reply(replyTo, commentText.trim());
                const newComment = response.data || response;
                setComments((prev) => [...prev, {
                    ...newComment,
                    id: newComment.id || newComment._id,
                    user: normalizeUser(user)
                }]);
            } else {
                const response = await api.comments.add(postId, commentText.trim());
                const newComment = response.data || response;
                setComments((prev) => [...prev, {
                    ...newComment,
                    id: newComment.id || newComment._id,
                    user: normalizeUser(user)
                }]);
            }
            setCommentsCount((c) => c + 1);
            setCommentText('');
            setReplyTo(null);
        } catch (error) {
            console.error('Comment error:', error);
        }
    };

    const handleDeletePost = async () => {
        const postId = post.id || post._id;
        try {
            await api.posts.delete(postId);
            setShowMenu(false);
            if (onDelete) onDelete(postId);
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const postUser = post.user || normalizeUser({id: post.user_id || post.userId, username: 'Unknown'});
    const avatar = postUser.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${postUser.username || 'default'}`;
    const username = postUser.username || 'Unknown';
    const mediaUrl = post.media_url || post.mediaUrl || '';
    const mediaType = post.media_type || post.mediaType || 'image';

    return (
        <div className={`border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-100'} theme-transition`}>
            <div className="flex items-center justify-between px-4 py-2.5">
                <button onClick={() => onOpenProfile?.(postUser.id)} className="flex items-center gap-2.5">
                    <img src={avatar} alt={username} className="w-9 h-9 rounded-full object-cover"/>
                    <div className="text-left">
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{username}</p>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{timeAgo(post.created_at || post.createdAt || '')}</p>
                    </div>
                </button>
                {user?.id === postUser.id && (
                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 rounded-full hover:bg-black/5">
                            <MoreHorizontal className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}/>
                        </button>
                        {showMenu && (
                            <div
                                className={`absolute right-0 top-8 z-10 ${isDarkMode ? 'bg-slate-700' : 'bg-white'} rounded-xl shadow-lg py-1 min-w-[140px]`}>
                                <button onClick={handleDeletePost}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-500/10">
                                    <Trash2 className="w-4 h-4"/> {t('deletePost')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="relative">
                {mediaType === 'video' ? (
                    <video src={mediaUrl} controls className="w-full aspect-square object-cover"/>
                ) : (
                    <img src={mediaUrl} alt={post.caption || ''} className="w-full aspect-square object-cover"/>
                )}
            </div>

            <div className="flex items-center gap-4 px-4 py-2.5">
                <button onClick={handleLike} className="flex items-center gap-1.5">
                    <Heart
                        className={`w-6 h-6 ${liked ? 'fill-red-500 text-red-500' : isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}/>
                    <span
                        className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{likesCount}</span>
                </button>
                <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5">
                    <MessageCircle className={`w-6 h-6 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}/>
                    <span
                        className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{commentsCount}</span>
                </button>
            </div>

            {post.caption && (
                <div className="px-4 pb-2">
                    <button onClick={() => onOpenProfile?.(postUser.id)}
                            className={`text-sm font-semibold mr-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{username}</button>
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{post.caption}</span>
                </div>
            )}

            {showComments && (
                <div className="px-4 pb-3 space-y-2 animate-fade-in">
                    {comments.map((comment) => {
                        const cAvatar = comment.user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user?.username || 'default'}`;
                        return (
                            <div key={comment.id} className="flex gap-2">
                                <img src={cAvatar} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0"/>
                                <div className="flex-1">
                                    <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                        <button onClick={() => onOpenProfile?.(comment.user_id || comment.userId || '')}
                                                className={`font-semibold mr-1.5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {comment.user?.username || 'Unknown'}
                                        </button>
                                        {comment.content}
                                    </p>
                                    <button
                                        onClick={() => setReplyTo(comment.id)}
                                        className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'} mt-0.5`}
                                    >
                                        {timeAgo(comment.created_at || comment.createdAt || '')} · {t('reply')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {comments.length === 0 && (
                        <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>No comments yet</p>
                    )}
                    <form onSubmit={handleComment} className="flex gap-2 pt-2">
                        <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={t('addComment')}
                            className={`flex-1 px-3 py-2 rounded-full text-sm border ${isDarkMode ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        />
                        <button type="submit" disabled={!commentText.trim()}
                                className="p-2 text-blue-500 disabled:opacity-30">
                            <Send className="w-5 h-5"/>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
