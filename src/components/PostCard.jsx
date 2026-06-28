import React, {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';
import {Heart, MessageCircle, Send, Bookmark, Eye} from 'lucide-react';

export default function PostCard({post, onRefresh}) {
    const {user, profile} = useAuth();
    const {t} = useLanguage();
    const {isDarkMode} = useTheme();

    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [viewsCount, setViewsCount] = useState(0);
    const [likedBy, setLikedBy] = useState([]);
    const [comments, setComments] = useState([]);
    const [showComments, setShowComments] = useState(false);
    const [commentInput, setCommentInput] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyInput, setReplyInput] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [lastComment, setLastComment] = useState('');

    useEffect(() => {
        setLikesCount(post.likes_count || 0);
        setViewsCount(post.views_count || 0);
        setLikedBy(post.liked_by || []);
        setIsLiked(post.liked_by?.some(u => u.id === user?.id) || false);
    }, [post, user?.id]);

    useEffect(() => {
        if (user && post.user_id !== user.id) {
            const viewedPosts = JSON.parse(localStorage.getItem('manga_viewed_posts') || '[]');
            if (!viewedPosts.includes(post.id)) {
                viewedPosts.push(post.id);
                localStorage.setItem('manga_viewed_posts', JSON.stringify(viewedPosts));
                const stored = localStorage.getItem('manga_posts');
                const posts = stored ? JSON.parse(stored) : [];
                const postIndex = posts.findIndex(p => p.id === post.id);
                if (postIndex !== -1) {
                    posts[postIndex].views_count = (posts[postIndex].views_count || 0) + 1;
                    localStorage.setItem('manga_posts', JSON.stringify(posts));
                    setViewsCount(posts[postIndex].views_count);
                }
            }
        }
    }, [post.id, post.user_id, user]);

    useEffect(() => {
        if (showComments) loadComments();
    }, [showComments]);

    const loadComments = () => {
        const stored = localStorage.getItem('manga_comments');
        const allComments = stored ? JSON.parse(stored) : [];
        const postComments = allComments.filter(c => c.post_id === post.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setComments(postComments);
    };

    const handleLike = () => {
        if (!user) return;
        const stored = localStorage.getItem('manga_posts');
        const posts = stored ? JSON.parse(stored) : [];
        const postIndex = posts.findIndex(p => p.id === post.id);
        if (postIndex === -1) return;
        const userLike = {id: user.id, username: profile.username, avatar_url: profile.avatar_url};
        if (isLiked) {
            posts[postIndex].liked_by = posts[postIndex].liked_by.filter(u => u.id !== user.id);
            posts[postIndex].likes_count = Math.max(0, (posts[postIndex].likes_count || 1) - 1);
            setLikesCount(posts[postIndex].likes_count);
            setLikedBy(posts[postIndex].liked_by);
        } else {
            if (!posts[postIndex].liked_by) posts[postIndex].liked_by = [];
            posts[postIndex].liked_by.push(userLike);
            posts[postIndex].likes_count = (posts[postIndex].likes_count || 0) + 1;
            setLikesCount(posts[postIndex].likes_count);
            setLikedBy(posts[postIndex].liked_by);
            if (post.user_id !== user.id) createNotification('like', post);
        }
        localStorage.setItem('manga_posts', JSON.stringify(posts));
        setIsLiked(!isLiked);
    };

    const createNotification = (type, post, comment = null) => {
        const stored = localStorage.getItem('manga_notifications');
        const notifications = stored ? JSON.parse(stored) : [];
        notifications.unshift({
            id: `notif-${Date.now()}`,
            type,
            from_user: {id: user.id, username: profile.username, avatar_url: profile.avatar_url},
            post_id: post.id,
            comment_id: comment?.id,
            for_user_id: post.user_id,
            content: type === 'comment' ? comment?.content : null,
            created_at: new Date().toISOString(),
            read: false,
        });
        localStorage.setItem('manga_notifications', JSON.stringify(notifications));
    };

    const handleComment = (e) => {
        e.preventDefault();
        if (!user || !commentInput.trim() || submitting) return;
        if (commentInput.trim() === lastComment) {
            setCommentInput('');
            return;
        }
        setSubmitting(true);
        const newComment = {
            id: `comment-${Date.now()}`,
            post_id: post.id,
            user_id: user.id,
            content: commentInput.trim(),
            created_at: new Date().toISOString(),
            profiles: {id: user.id, username: profile.username, avatar_url: profile.avatar_url},
            replies: [],
        };
        const stored = localStorage.getItem('manga_comments');
        const allComments = stored ? JSON.parse(stored) : [];
        allComments.unshift(newComment);
        localStorage.setItem('manga_comments', JSON.stringify(allComments));
        const posts = JSON.parse(localStorage.getItem('manga_posts') || '[]');
        const postIndex = posts.findIndex(p => p.id === post.id);
        if (postIndex !== -1) {
            posts[postIndex].comments_count = (posts[postIndex].comments_count || 0) + 1;
            localStorage.setItem('manga_posts', JSON.stringify(posts));
        }
        if (post.user_id !== user.id) createNotification('comment', post, newComment);
        setLastComment(commentInput.trim());
        setComments([newComment, ...allComments.filter(c => c.post_id === post.id)]);
        setCommentInput('');
        setSubmitting(false);
    };

    const handleReply = (e, commentId, forUserId) => {
        e.preventDefault();
        if (!replyInput.trim() || submitting) return;
        setSubmitting(true);
        const reply = {
            id: `reply-${Date.now()}`,
            comment_id: commentId,
            user_id: user.id,
            content: replyInput.trim(),
            created_at: new Date().toISOString(),
            profiles: {id: user.id, username: profile.username, avatar_url: profile.avatar_url},
        };
        const stored = localStorage.getItem('manga_comments');
        const allComments = stored ? JSON.parse(stored) : [];
        const commentIndex = allComments.findIndex(c => c.id === commentId);
        if (commentIndex !== -1) {
            if (!allComments[commentIndex].replies) allComments[commentIndex].replies = [];
            allComments[commentIndex].replies.unshift(reply);
            localStorage.setItem('manga_comments', JSON.stringify(allComments));
            if (forUserId !== user.id) {
                const storedNotifs = localStorage.getItem('manga_notifications');
                const notifications = storedNotifs ? JSON.parse(storedNotifs) : [];
                notifications.unshift({
                    id: `notif-${Date.now()}`,
                    type: 'reply',
                    from_user: reply.profiles,
                    comment_id: commentId,
                    for_user_id: forUserId,
                    content: reply.content,
                    created_at: new Date().toISOString(),
                    read: false,
                });
                localStorage.setItem('manga_notifications', JSON.stringify(notifications));
            }
        }
        loadComments();
        setReplyInput('');
        setReplyingTo(null);
        setSubmitting(false);
    };

    const timeAgo = (date) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
        return `${Math.floor(seconds / 86400)}d`;
    };

    return (
        <article
            className={`${isDarkMode ? 'bg-slate-900 border-b border-slate-800 sm:rounded-xl sm:border' : 'bg-white border-b border-gray-100 sm:rounded-xl sm:border sm:shadow-sm'}`}>
            <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                    <img src={post.profiles.avatar_url} alt=""
                         className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"/>
                    <div>
                        <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{post.profiles.username}</p>
                        <p className="text-gray-500 text-xs">{timeAgo(post.created_at)}</p>
                    </div>
                </div>
                <button
                    className={`p-2 rounded-full transition ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>•••
                </button>
            </div>

            {post.media_url && (
                <div className="aspect-square bg-black">
                    {post.media_type === 'image' ? (
                        <img src={post.media_url} alt="" className="w-full h-full object-cover" loading="lazy"/>
                    ) : (
                        <video src={post.media_url} className="w-full h-full object-cover" controls playsInline/>
                    )}
                </div>
            )}

            {post.caption && (
                <div className="px-3 pt-3">
                    <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <span className="font-semibold">{post.profiles.username}</span>{' '}
                        {post.caption}
                    </p>
                </div>
            )}

            {viewsCount > 0 && (
                <div className="px-3 py-2 flex items-center gap-1 text-xs text-gray-500">
                    <Eye className="w-3.5 h-3.5"/>
                    <span>{viewsCount} {t('views')}</span>
                </div>
            )}

            <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-4">
                    <button onClick={handleLike}
                            className={`transition touch-manipulation ${isLiked ? 'text-red-500' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`}/>
                    </button>
                    <button onClick={() => setShowComments(!showComments)}
                            className={`transition touch-manipulation ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <MessageCircle className="w-7 h-7"/>
                    </button>
                    <button className={`transition touch-manipulation ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Send className="w-7 h-7"/>
                    </button>
                </div>
                <button className={`transition touch-manipulation ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    <Bookmark className="w-7 h-7"/>
                </button>
            </div>

            {likesCount > 0 && (
                <div className="px-3 pb-1">
                    <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{likesCount.toLocaleString()} {t('likes')}</p>
                </div>
            )}

            {showComments && (
                <div className={`border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                    <div className="max-h-60 overflow-y-auto p-3 space-y-3">
                        {comments.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-4">No comments yet</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id}>
                                    <div className="flex gap-2.5">
                                        <img src={comment.profiles.avatar_url} alt=""
                                             className="w-8 h-8 rounded-full flex-shrink-0"/>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                <span className="font-semibold">{comment.profiles.username}</span>{' '}
                                                {comment.content}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-xs text-gray-500">{timeAgo(comment.created_at)}</p>
                                                <button onClick={() => setReplyingTo(comment.id)}
                                                        className="text-xs font-medium text-gray-500 hover:text-gray-700 transition">{t('reply')}</button>
                                            </div>
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div className="mt-2 ml-2 space-y-2">
                                                    {comment.replies.map((reply) => (
                                                        <div key={reply.id} className="flex gap-2">
                                                            <img src={reply.profiles.avatar_url} alt=""
                                                                 className="w-6 h-6 rounded-full flex-shrink-0"/>
                                                            <p className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                <span
                                                                    className="font-semibold">{reply.profiles.username}</span>{' '}
                                                                {reply.content}
                                                                <span
                                                                    className="text-xs text-gray-500 ml-2">{timeAgo(reply.created_at)}</span>
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {replyingTo === comment.id && (
                                                <form onSubmit={(e) => handleReply(e, comment.id, comment.user_id)}
                                                      className="mt-2">
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={replyInput}
                                                            onChange={(e) => setReplyInput(e.target.value)}
                                                            placeholder={`${t('reply')}...`}
                                                            className={`flex-1 px-3 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-500'}`}
                                                            autoFocus
                                                        />
                                                        <button type="submit"
                                                                disabled={!replyInput.trim() || submitting}
                                                                className="text-blue-500 font-semibold text-sm disabled:opacity-50">Post
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <form onSubmit={handleComment}
                          className={`flex gap-2 p-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                        <input
                            type="text"
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            placeholder={t('addComment')}
                            className={`flex-1 px-4 py-2.5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-500'}`}
                        />
                        <button type="submit" disabled={!commentInput.trim() || submitting}
                                className="text-blue-500 font-semibold text-sm disabled:opacity-50">Post
                        </button>
                    </form>
                </div>
            )}
        </article>
    );
}
