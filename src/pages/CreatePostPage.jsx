import {useState, useRef} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import api from '../lib/api';
import {Image as ImageIcon, Video, X, Loader2, MapPin} from 'lucide-react';

export default function CreatePostPage({onClose, onPosted}) {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();
    const {t} = useLanguage();
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState('image');
    const [caption, setCaption] = useState('');
    const [location, setLocation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setMediaFile(file);
        setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
        const reader = new FileReader();
        reader.onload = (ev) => setMediaPreview(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!mediaFile) {
            setError(t('selectMedia'));
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('media', mediaFile);
            const uploadRes = await api.media.upload(formData);
            const mediaUrl = uploadRes.data?.url || uploadRes.url || uploadRes.data?.media_url || uploadRes.data?.mediaUrl;
            if (!mediaUrl) throw new Error('Upload failed');
            await api.posts.create({media_url: mediaUrl, media_type: mediaType, caption, location});
            onPosted?.();
            onClose?.();
        } catch (err) {
            console.error('Create post error:', err);
            setError(err.response?.data?.message || err.message || t('uploadError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 ${isDarkMode ? 'bg-slate-950' : 'bg-white'} flex flex-col animate-slide-up`}>
            <div
                className={`flex items-center justify-between px-4 py-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
                <button onClick={onClose} className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
                    <X className="w-6 h-6"/>
                </button>
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('newPost')}</h2>
                <div className="w-6"/>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 overflow-y-auto">
                {mediaPreview ? (
                    <div className="relative mb-4">
                        {mediaType === 'video' ? (
                            <video src={mediaPreview} controls className="w-full rounded-xl max-h-80 object-contain"/>
                        ) : (
                            <img src={mediaPreview} alt="preview"
                                 className="w-full rounded-xl max-h-80 object-contain"/>
                        )}
                        <button type="button" onClick={() => {
                            setMediaFile(null);
                            setMediaPreview(null);
                        }}
                                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                            <X className="w-4 h-4 text-white"/>
                        </button>
                    </div>
                ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                            className={`flex flex-col items-center justify-center w-full aspect-square rounded-xl border-2 border-dashed ${isDarkMode ? 'border-slate-700' : 'border-gray-300'}`}>
                        <ImageIcon className={`w-12 h-12 mb-2 ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}/>
                        <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{t('selectMedia')}</p>
                    </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelect}
                       className="hidden"/>

                <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={t('writeCaption')}
                    rows={3}
                    className={`w-full px-4 py-3 rounded-xl border mt-4 resize-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />

                <div className="flex items-center gap-2 mt-3">
                    <MapPin className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}/>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={t('addLocation')}
                        className={`flex-1 px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                    />
                </div>

                {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

                <button
                    type="submit"
                    disabled={loading || !mediaFile}
                    className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto"/> : t('share')}
                </button>
            </form>
        </div>
    );
}
