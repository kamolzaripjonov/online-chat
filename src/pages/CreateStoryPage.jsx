import React, {useState, useRef} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';
import {X, Camera, Upload, Image, Video} from 'lucide-react';

export default function CreateStoryPage({onClose}) {
    const {user, profile} = useAuth();
    const {t} = useLanguage();
    const {isDarkMode} = useTheme();

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [mediaType, setMediaType] = useState('image');
    const [submitting, setSubmitting] = useState(false);

    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);

        if (file.type.startsWith('video/')) {
            setMediaType('video');
        } else {
            setMediaType('image');
        }
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;
        setSubmitting(true);

        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64Url = reader.result;

                const newStory = {
                    id: `story-${Date.now()}`,
                    user_id: user.id,
                    media_url: base64Url,
                    media_type: mediaType,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    profiles: {
                        username: profile.username,
                        full_name: profile.full_name,
                        avatar_url: profile.avatar_url,
                    },
                    views_count: 0,
                    viewed_by: [],
                };

                const stored = localStorage.getItem('manga_stories');
                const stories = stored ? JSON.parse(stored) : [];
                stories.unshift(newStory);
                localStorage.setItem('manga_stories', JSON.stringify(stories));

                onClose();
            };
            reader.readAsDataURL(selectedFile);
        } catch (e) {
            console.error('Error creating story:', e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900 dark:bg-slate-100 flex flex-col z-50">
            <div
                className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6"/>
                </button>
                <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('createStory')}</h1>
                <button
                    onClick={handleSubmit}
                    disabled={!selectedFile || submitting}
                    className={`font-semibold disabled:opacity-50 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                >
                    {submitting ? 'Posting...' : t('share')}
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*,video/*"
                className="hidden"
            />

            <div className="flex-1 flex items-center justify-center p-4">
                {previewUrl ? (
                    <div className="w-full max-w-md aspect-[9/16] rounded-2xl overflow-hidden bg-slate-800 relative">
                        {mediaType === 'image' ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover"/>
                        ) : (
                            <video src={previewUrl} className="w-full h-full object-cover" controls/>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`absolute bottom-4 right-4 px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition ${isDarkMode ? 'bg-slate-900/80 text-white hover:bg-slate-800' : 'bg-white/80 text-gray-900 hover:bg-white'}`}
                        >
                            <Upload className="w-4 h-4"/>
                            Change
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full max-w-md aspect-[9/16] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition ${isDarkMode ? 'bg-slate-800 border-slate-600 hover:bg-slate-700' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}
                    >
                        <div
                            className={`w-20 h-20 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                            <Camera className={`w-10 h-10 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}/>
                        </div>
                        <p className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Add to your
                            story</p>
                        <div
                            className={`flex items-center gap-4 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            <span className="flex items-center gap-1"><Image className="w-4 h-4"/> Photo</span>
                            <span className="flex items-center gap-1"><Video className="w-4 h-4"/> Video</span>
                        </div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Tap to select from
                            gallery</p>
                    </button>
                )}
            </div>
        </div>
    );
}
