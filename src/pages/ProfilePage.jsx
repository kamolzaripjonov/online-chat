import {useState, useEffect, useCallback} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import api from '../lib/api';
import PostCard from '../components/PostCard';
import {
    Settings,
    Camera,
    Grid3x3,
    Bookmark,
    Heart,
    UserPlus,
    UserCheck,
    ArrowLeft,
    Loader2,
    Edit2,
    X
} from 'lucide-react';

function normalizeUser(raw) {
    if (!raw) return null;
    return {
        id: raw.id || raw._id,
        _id: raw._id,
        username: raw.username || '',
        full_name: raw.full_name || raw.fullName || '',
        avatar_url: raw.avatar_url || raw.avatarUrl || raw.avatar || null,
        bio: raw.bio || '',
        followers_count: raw.followers_count ?? raw.followersCount ?? 0,
        following_count: raw.following_count ?? raw.followingCount ?? 0,
        posts_count: raw.posts_count ?? raw.postsCount ?? 0,
        following: raw.following ?? false,
    };
}

export default function ProfilePage({userId, onBack, onOpenSettings}) {
    const {user, updateProfile} = useAuth();
    const {isDarkMode} = useTheme();
    const {t} = useLanguage();
    const [profile, setProfile] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({username: '', full_name: '', bio: ''});
    const [followLoading, setFollowLoading] = useState(false);

    const isOwnProfile = !userId || userId === user?.id;

    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            let data;
            if (isOwnProfile) {
                data = normalizeUser(user);
                if (data) {
                    const statsRes = await api.user.getProfile(user.id);
                    const stats = normalizeUser(statsRes.data || statsRes);
                    if (stats) data = {...data, ...stats};
                }
            } else {
                const res = await api.user.getProfile(userId);
                data = normalizeUser(res.data || res);
            }
            setProfile(data);
            if (data) {
                setEditForm({username: data.username || '', full_name: data.full_name || '', bio: data.bio || ''});
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, user, isOwnProfile]);

    const loadPosts = useCallback(async () => {
        if (!profile?.id) return;
        try {
            const response = await api.posts.userPosts(profile.id);
            const data = response.data || response || [];
            setPosts(data);
        } catch (err) {
            console.error('Error loading posts:', err);
        }
    }, [profile]);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        if (profile) loadPosts();
    }, [profile, loadPosts]);

    const handleSaveEdit = async () => {
        try {
            await updateProfile(editForm);
            await loadProfile();
            setIsEditing(false);
        } catch (err) {
            console.error('Edit profile error:', err);
        }
    };

    const handleFollow = async () => {
        if (!profile) return;
        setFollowLoading(true);
        try {
            if (profile.following) {
                await api.follow.unfollow(profile.id);
                setProfile({...profile, following: false, followers_count: profile.followers_count - 1});
            } else {
                await api.follow.follow(profile.id);
                setProfile({...profile, following: true, followers_count: profile.followers_count + 1});
            }
        } catch (err) {
            console.error('Follow error:', err);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
                <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}/>
            </div>
        );
    }

    if (!profile) {
        return (
            <div
                className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
                <p className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>User not found</p>
            </div>
        );
    }

    const avatar = profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username || 'default'}`;

    return (
        <div className={`min-h-screen pb-20 ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
            <div
                className={`flex items-center gap-3 px-4 py-3 ${isDarkMode ? 'bg-slate-900/90' : 'bg-white/90'} glass sticky top-0 z-10`}>
                {!isOwnProfile && (
                    <button onClick={onBack} className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                        <ArrowLeft className="w-6 h-6"/>
                    </button>
                )}
                <h2 className={`text-lg font-bold flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile.username}</h2>
                {isOwnProfile && (
                    <button onClick={onOpenSettings} className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                        <Settings className="w-6 h-6"/>
                    </button>
                )}
            </div>

            <div className="flex flex-col items-center px-4 py-6">
                <div className="relative">
                    <img src={avatar} alt={profile.username}
                         className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-lg"/>
                    {isOwnProfile && (
                        <button
                            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
                            <Camera className="w-4 h-4 text-white"/>
                        </button>
                    )}
                </div>
                <h3 className={`text-xl font-bold mt-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile.full_name || profile.username}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>@{profile.username}</p>
                {profile.bio &&
                    <p className={`text-sm text-center mt-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{profile.bio}</p>}
            </div>

            <div className="flex justify-around px-8 py-3">
                <div className="text-center">
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile.posts_count ?? posts.length}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('posts')}</p>
                </div>
                <div className="text-center">
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile.followers_count ?? 0}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('followers')}</p>
                </div>
                <div className="text-center">
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile.following_count ?? 0}</p>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('following')}</p>
                </div>
            </div>

            <div className="px-4 mt-2">
                {isOwnProfile ? (
                    <button onClick={() => setIsEditing(true)}
                            className={`w-full py-2 rounded-lg border ${isDarkMode ? 'border-slate-700 text-slate-200' : 'border-gray-300 text-gray-800'} font-medium`}>
                        {t('editProfile')}
                    </button>
                ) : (
                    <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`w-full py-2 rounded-lg font-medium disabled:opacity-50 ${profile.following ? `${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-gray-100 text-gray-800'}` : 'bg-blue-500 text-white'}`}
                    >
                        {profile.following ? t('following') : t('follow')}
                    </button>
                )}
            </div>

            <div className={`flex border-t mt-4 ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                <button onClick={() => setActiveTab('posts')}
                        className={`flex-1 py-3 flex items-center justify-center ${activeTab === 'posts' ? 'border-t-2 border-blue-500' : ''}`}>
                    <Grid3x3
                        className={`w-5 h-5 ${activeTab === 'posts' ? 'text-blue-500' : isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}/>
                </button>
            </div>

            {activeTab === 'posts' && (
                <div>
                    {posts.length === 0 ? (
                        <p className={`text-sm text-center py-10 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('noPosts')}</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-0.5">
                            {posts.map((post) => {
                                const mediaUrl = post.media_url || post.mediaUrl || '';
                                return (
                                    <div key={post.id || post._id} className="aspect-square">
                                        <img src={mediaUrl} alt="" className="w-full h-full object-cover"/>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {isEditing && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4 animate-fade-in"
                     onClick={() => setIsEditing(false)}>
                    <div className={`w-full max-w-sm rounded-2xl p-5 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}
                         onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('editProfile')}</h3>
                            <button onClick={() => setIsEditing(false)}><X
                                className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}/></button>
                        </div>
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={editForm.username}
                                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                placeholder={t('username')}
                                className={`w-full px-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            <input
                                type="text"
                                value={editForm.full_name}
                                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                                placeholder={t('fullName')}
                                className={`w-full px-4 py-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            <textarea
                                value={editForm.bio}
                                onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                placeholder={t('bio')}
                                rows={3}
                                className={`w-full px-4 py-2.5 rounded-xl border resize-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            <button onClick={handleSaveEdit}
                                    className="w-full py-2.5 rounded-xl bg-blue-500 text-white font-semibold">
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
