import React, {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';
import {Settings, Edit2, Video, Crown, Globe, Eye, Heart, MessageCircle, Grid, Bookmark, LogOut} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import api from '../api/api';

export default function ProfilePage({onOpenSettings}) {
    const navigate = useNavigate();
    const {user, profile, updateProfile, logout} = useAuth();
    const {t} = useLanguage();
    const {isDarkMode} = useTheme();

    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editFullName, setEditFullName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editWebsite, setEditWebsite] = useState('');
    const [saving, setSaving] = useState(false);
    const [editError, setEditError] = useState('');
    const [activeTab, setActiveTab] = useState('posts');
    const [stats, setStats] = useState({views: 0, likes: 0, comments: 0});
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    useEffect(() => {
        if (profile) {
            setEditUsername(profile.username || '');
            setEditFullName(profile.name || '');
            setEditBio(profile.bio || '');
            setEditWebsite(profile.website || '');
            loadUserData();
        }
    }, [profile, user]);

    const loadUserData = async () => {
        try {
            setLoading(true);
            const response = await api.posts.list(1, 100);
            const posts = response.data || response || [];
            const userPostsFiltered = posts.filter(p => p.userId === user?.id || p.user_id === user?.id);
            setUserPosts(userPostsFiltered.sort((a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)));

            let totalViews = 0, totalLikes = 0, totalComments = 0;
            userPostsFiltered.forEach(post => {
                totalViews += post.viewsCount || post.views_count || 0;
                totalLikes += post.likesCount || post.likes_count || post.likes?.length || 0;
                totalComments += post.commentsCount || post.comments_count || post.comments?.length || 0;
            });
            setStats({views: totalViews, likes: totalLikes, comments: totalComments});
        } catch (err) {
            console.error('Error loading user data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        setSaving(true);
        setEditError('');

        if (!editUsername.trim()) {
            setEditError('Username is required');
            setSaving(false);
            return;
        }

        try {
            const result = await updateProfile({
                username: editUsername.toLowerCase().trim(),
                full_name: editFullName.trim(),
                bio: editBio.trim(),
                website: editWebsite.trim() || null,
            });

            if (!result.success) {
                setEditError(result.error || 'Update failed');
            } else {
                setEditing(false);
            }
        } catch (err) {
            setEditError(err.response?.data?.message || 'Update failed');
        }
        setSaving(false);
    };

    const handleLogout = () => setShowLogoutModal(true);
    const confirmLogout = () => {
        logout();
        navigate('/login');
    };

    if (!profile) return null;

    return (
        <div className="px-4 pb-20">
            <div className="flex items-center justify-between py-4">
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile.username}</h1>
                <div className="flex items-center gap-2">
                    <button onClick={handleLogout}
                            className={`p-2 rounded-full transition ${isDarkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'}`}>
                        <LogOut className="w-6 h-6"/>
                    </button>
                    <button onClick={onOpenSettings}
                            className={`p-2 rounded-full transition ${isDarkMode ? 'text-white hover:bg-slate-700' : 'text-gray-900 hover:bg-gray-100'}`}>
                        <Settings className="w-6 h-6"/>
                    </button>
                </div>
            </div>

            <div className="flex items-start gap-6 mb-6">
                <img src={profile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                     alt={profile.username}
                     className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-blue-500"/>
                <div className="flex-1">
                    <div className="flex gap-6 text-center">
                        <div><p
                            className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{userPosts.length}</p>
                            <p className="text-xs text-gray-500">{t('posts')}</p></div>
                        <div><p
                            className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{followers}</p>
                            <p className="text-xs text-gray-500">{t('followers')}</p></div>
                        <div><p
                            className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{following}</p>
                            <p className="text-xs text-gray-500">{t('following')}</p></div>
                    </div>
                    <button onClick={() => setEditing(true)}
                            className={`mt-4 w-full px-6 py-1.5 rounded-lg flex items-center justify-center gap-2 transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'} text-sm font-semibold`}>
                        <Edit2 className="w-4 h-4"/> {t('editProfile')}
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile.name || profile.username}</p>
                {profile.bio &&
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{profile.bio}</p>}
                {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer"
                                       className={`text-sm flex items-center gap-1 mt-1 ${profile.website?.startsWith('http') ? 'text-blue-500' : 'text-gray-500'}`}><Globe
                    className="w-4 h-4"/>{profile.website}</a>}
                <div className="flex items-center gap-4 mt-3">
                    {profile.is_premium &&
                        <div className="flex items-center gap-1 text-yellow-500 text-sm"><Crown className="w-4 h-4"/>Premium
                        </div>}
                </div>
            </div>

            <div className={`rounded-xl p-4 mb-6 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('accountStats')}</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div
                            className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                            <Eye className="w-5 h-5 text-blue-500"/></div>
                        <p className={`font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.views}</p>
                        <p className="text-xs text-gray-500">{t('views')}</p></div>
                    <div className="text-center">
                        <div
                            className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
                            <Heart className="w-5 h-5 text-red-500"/></div>
                        <p className={`font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.likes}</p>
                        <p className="text-xs text-gray-500">{t('likes')}</p></div>
                    <div className="text-center">
                        <div
                            className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                            <MessageCircle className="w-5 h-5 text-green-500"/></div>
                        <p className={`font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.comments}</p>
                        <p className="text-xs text-gray-500">{t('comments')}</p></div>
                </div>
            </div>

            <div className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} flex`}>
                <button onClick={() => setActiveTab('posts')}
                        className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-1 ${activeTab === 'posts' ? `${isDarkMode ? 'text-white border-t-2 border-white' : 'text-gray-900 border-t-2 border-gray-900'}` : `${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}`}>
                    <Grid className="w-4 h-4"/><span>{t('posts')}</span>
                </button>
                <button onClick={() => setActiveTab('saved')}
                        className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-1 ${activeTab === 'saved' ? `${isDarkMode ? 'text-white border-t-2 border-white' : 'text-gray-900 border-t-2 border-gray-900'}` : `${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}`}>
                    <Bookmark className="w-4 h-4"/><span>Saved</span>
                </button>
            </div>

            <div className="mt-4">
                {loading ? (
                    <div className="grid grid-cols-3 gap-1">{[...Array(6)].map((_, i) => <div key={i}
                                                                                              className={`aspect-square animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}/>)}</div>
                ) : userPosts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">{t('noPosts')}</div>
                ) : (
                    <div className="grid grid-cols-3 gap-1">
                        {userPosts.map((post) => (
                            <div key={post._id || post.id} className="aspect-square relative group cursor-pointer">
                                {post.mediaUrl || post.media_url ? (
                                    post.mediaType === 'video' || post.media_type === 'video' ? (
                                        <div
                                            className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                                            <Video
                                                className={`w-6 h-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}/>
                                        </div>
                                    ) : (
                                        <img src={post.mediaUrl || post.media_url} alt=""
                                             className="w-full h-full object-cover"/>
                                    )
                                ) : (
                                    <div
                                        className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                                        <span className="text-2xl">📝</span>
                                    </div>
                                )}
                                <div
                                    className={`absolute inset-0 flex items-center justify-center gap-3 text-white text-sm opacity-0 group-hover:opacity-100 transition ${isDarkMode ? 'bg-black/50' : 'bg-black/40'}`}>
                                    <span className="flex items-center gap-1"><Heart
                                        className="w-4 h-4"/> {post.likesCount || post.likes_count || post.likes?.length || 0}</span>
                                    <span className="flex items-center gap-1"><MessageCircle
                                        className="w-4 h-4"/> {post.commentsCount || post.comments_count || post.comments?.length || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {editing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('editProfile')}</h3>
                            <button onClick={() => setEditing(false)}
                                    className={`text-xl ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>✕
                            </button>
                        </div>

                        {editError && <div
                            className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm mb-4">{editError}</div>}

                        <div className="space-y-4">
                            <div><label
                                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('username')}</label><input
                                type="text" value={editUsername}
                                onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`}
                                placeholder="username"/></div>
                            <div><label
                                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('fullName')}</label><input
                                type="text" value={editFullName} onChange={(e) => setEditFullName(e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`}
                                placeholder="Full Name"/></div>
                            <div><label
                                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('bio')}</label><textarea
                                value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`}
                                placeholder="Bio"/></div>
                            <div><label
                                className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('website')}</label><input
                                type="text" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'}`}
                                placeholder="https://example.com"/></div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setEditing(false)}
                                        className={`flex-1 py-3 rounded-lg font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>{t('cancel')}</button>
                                <button onClick={handleSaveEdit} disabled={saving}
                                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">{saving ? 'Saving...' : t('save')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showLogoutModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-sm rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} text-center mb-2`}>Logout</h3>
                        <p className={`text-sm text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-6`}>Are
                            you sure you want to logout?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowLogoutModal(false)}
                                    className={`flex-1 py-3 rounded-lg font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>Cancel
                            </button>
                            <button onClick={confirmLogout}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition">Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}