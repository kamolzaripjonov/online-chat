import React, {useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';
import {postService} from '../service/authService';
import {X, Image as ImageIcon, Loader} from 'lucide-react';

export default function CreatePostPage({onClose}) {
    const {user, profile} = useAuth();
    const {t} = useLanguage();
    const {isDarkMode} = useTheme();

    const [caption, setCaption] = useState('');
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setMedia(prev => [...prev, {
                    url: event.target?.result,
                    type: file.type.startsWith('image') ? 'image' : 'video'
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeMedia = (index) => {
        setMedia(prev => prev.filter((_, i) => i !== index));
    };

    const handleShare = async () => {
        if (!caption.trim() && media.length === 0) {
            setError('Please add caption or media');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await postService.createPost(caption, media, [], []);

            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
            <div
                className={`w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                {/* Header */}
                <div
                    className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('createPost')}</h2>
                    <button onClick={onClose}
                            className={`p-2 rounded-full transition ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-slate-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                        <X className="w-6 h-6"/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-4">
                        <img
                            src={profile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`}
                            alt="" className="w-10 h-10 rounded-full"/>
                        <div>
                            <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile?.name || profile?.username}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>@{profile?.username}</p>
                        </div>
                    </div>

                    {/* Caption Input */}
                    <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder={t('writeCaption')}
                        className={`w-full px-4 py-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 ${isDarkMode ? 'bg-slate-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`}
                        rows={4}
                    />

                    {/* Media Preview */}
                    {media.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                            {media.map((m, i) => (
                                <div key={i} className="relative group">
                                    {m.type === 'image' ? (
                                        <img src={m.url} alt=""
                                             className="w-full aspect-square object-cover rounded-lg"/>
                                    ) : (
                                        <video src={m.url} className="w-full aspect-square object-cover rounded-lg"/>
                                    )}
                                    <button
                                        onClick={() => removeMedia(i)}
                                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X className="w-4 h-4"/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div
                            className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm mb-4">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} p-4 flex items-center gap-3`}>
                    <label
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                        <ImageIcon className="w-5 h-5"/>
                        <span className="font-medium">{t('addPhoto')}</span>
                        <input
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </label>
                    <button
                        onClick={handleShare}
                        disabled={loading || (!caption.trim() && media.length === 0)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading && <Loader className="w-4 h-4 animate-spin"/>}
                        {t('share')}
                    </button>
                </div>
            </div>
        </div>
    );
}