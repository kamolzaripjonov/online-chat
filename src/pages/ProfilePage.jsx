import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Settings, Edit2, Video, Crown, Globe, Eye, Heart, MessageCircle, Grid, Bookmark } from 'lucide-react';

export default function ProfilePage({ onOpenSettings }) {
  const { user, profile, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  const [userPosts, setUserPosts] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [stats, setStats] = useState({ views: 0, likes: 0, comments: 0 });

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditFullName(profile.full_name || '');
      setEditBio(profile.bio || '');
      setEditWebsite(profile.website || '');
      loadUserData();
    }
  }, [profile]);

  const loadUserData = () => {
    // Load posts
    const posts = JSON.parse(localStorage.getItem('manga_posts') || '[]');
    const userPosts = posts.filter(p => p.user_id === user?.id);
    setUserPosts(userPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));

    // Load stories
    const stories = JSON.parse(localStorage.getItem('manga_stories') || '[]');
    const userStories = stories.filter(s => s.user_id === user?.id);
    setUserStories(userStories);

    // Calculate stats
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;

    userPosts.forEach(post => {
      totalViews += post.views_count || 0;
      totalLikes += post.likes_count || 0;
      totalComments += post.comments_count || 0;
    });

    setStats({ views: totalViews, likes: totalLikes, comments: totalComments });
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    setEditError('');

    // Validate username
    if (!editUsername.trim()) {
      setEditError('Username is required');
      setSaving(false);
      return;
    }

    if (editUsername !== profile.username) {
      // Check for duplicate username
      const users = JSON.parse(localStorage.getItem('manga_users') || '[]');
      const exists = users.some(u => u.username.toLowerCase() === editUsername.toLowerCase() && u.id !== user.id);
      if (exists) {
        setEditError('Username already taken');
        setSaving(false);
        return;
      }
    }

    const { error } = await updateProfile({
      username: editUsername.toLowerCase().trim(),
      full_name: editFullName.trim(),
      bio: editBio.trim(),
      website: editWebsite.trim() || null,
    });

    if (error) {
      setEditError(error.message);
    } else {
      setEditing(false);
    }
    setSaving(false);
  };

  if (!profile) return null;

  return (
    <div className="px-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {profile.username}
        </h1>
        <button onClick={onOpenSettings} className={`p-2 rounded-full transition ${isDarkMode ? 'text-white hover:bg-slate-700' : 'text-gray-900 hover:bg-gray-100'}`}>
          <Settings className="w-6 h-6" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="flex items-start gap-6 mb-6">
        <img
          src={profile.avatar_url}
          alt={profile.username}
          className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-blue-500"
        />
        <div className="flex-1">
          <div className="flex gap-6 text-center">
            <div>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{userPosts.length}</p>
              <p className="text-xs text-gray-500">{t('posts')}</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>0</p>
              <p className="text-xs text-gray-500">{t('followers')}</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>0</p>
              <p className="text-xs text-gray-500">{t('following')}</p>
            </div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className={`mt-4 w-full px-6 py-1.5 rounded-lg flex items-center justify-center gap-2 transition ${
              isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
            } text-sm font-semibold`}
          >
            <Edit2 className="w-4 h-4" />
            {t('editProfile')}
          </button>
        </div>
      </div>

      {/* Bio Section */}
      <div className="mb-6">
        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {profile.full_name || profile.username}
        </p>
        {profile.bio && <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{profile.bio}</p>}
        {profile.website && (
          <a href={profile.website} target="_blank" rel="noopener noreferrer" className={`text-sm flex items-center gap-1 mt-1 ${(profile.website?.startsWith('http') ? 'text-blue-500' : 'text-gray-500')}`}>
            <Globe className="w-4 h-4" />
            {profile.website}
          </a>
        )}
        <div className="flex items-center gap-4 mt-3">
          {profile.is_premium && (
            <div className="flex items-center gap-1 text-yellow-500 text-sm">
              <Crown className="w-4 h-4" />
              Premium
            </div>
          )}
          <div className="flex items-center gap-1 text-gray-500 text-sm">
            <Video className="w-4 h-4" />
            {profile.free_calls_remaining} free calls
          </div>
        </div>
      </div>

      {/* Account Stats */}
      <div className={`rounded-xl p-4 mb-6 ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
        <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('accountStats')}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
              <Eye className="w-5 h-5 text-blue-500" />
            </div>
            <p className={`font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.views}</p>
            <p className="text-xs text-gray-500">{t('views')}</p>
          </div>
          <div className="text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${isDarkMode ? 'bg-red-500/20' : 'bg-red-100'}`}>
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <p className={`font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.likes}</p>
            <p className="text-xs text-gray-500">{t('likes')}</p>
          </div>
          <div className="text-center">
            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${isDarkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className={`font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.comments}</p>
            <p className="text-xs text-gray-500">{t('comments')}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} flex`}>
        <button onClick={() => setActiveTab('posts')} className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-1 ${activeTab === 'posts' ? `${isDarkMode ? 'text-white border-t-2 border-white' : 'text-gray-900 border-t-2 border-gray-900'} -mt-px` : 'text-gray-500'}`}>
          <Grid className="w-4 h-4" />
        </button>
        <button onClick={() => setActiveTab('saved')} className={`flex-1 py-3 text-sm font-semibold transition flex items-center justify-center gap-1 ${activeTab === 'saved' ? `${isDarkMode ? 'text-white border-t-2 border-white' : 'text-gray-900 border-t-2 border-gray-900'} -mt-px` : 'text-gray-500'}`}>
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      {/* Posts/Stories Grid */}
      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-3 gap-1">{[...Array(6)].map((_, i) => <div key={i} className={`aspect-square animate-pulse ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />)}</div>
        ) : userPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">{t('noPosts')}</div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {userPosts.map((post) => (
              <div key={post.id} className="aspect-square relative group cursor-pointer">
                {post.media_type === 'image' ? (
                  <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'}`}>
                    <Video className={`w-6 h-6 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                )}
                <div className={`absolute inset-0 flex items-center justify-center gap-3 text-white text-sm opacity-0 group-hover:opacity-100 transition ${isDarkMode ? 'bg-black/50' : 'bg-black/40'}`}>
                  <span className="flex items-center gap-1">{post.likes_count || 0}</span>
                  <span className="flex items-center gap-1">{post.comments_count || 0}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-2xl p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('editProfile')}</h3>
              <button onClick={() => setEditing(false)} className={`text-xl ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}>✕</button>
            </div>

            {editError && <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-500 text-sm mb-4">{editError}</div>}

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('username')}</label>
                <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`} placeholder="username" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('fullName')}</label>
                <input type="text" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('bio')}</label>
                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('website')}</label>
                <input type="text" value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditing(false)} className={`flex-1 py-3 rounded-lg font-semibold transition ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>{t('cancel')}</button>
                <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">{saving ? 'Saving...' : t('save')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
