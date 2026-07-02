import React, {useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';
import {storyService} from '../service/authService';
import {X, Image as ImageIcon, Loader} from 'lucide-react';

export default function CreateStoryPage({onClose}) {
    const {profile} = useAuth();
    const {t} = useLanguage();
    const {isDarkMode} = useTheme();

    const [content, setContent] = useState('');
    const [media, setMedia] = useState(null);
    const [background, setBackground] = useState('white');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const backgrounds = ['white', 'black', 'gradient_1', 'gradient_2', 'gradient_3', 'gradient_4', 'gradient_5'];

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setMedia({
                    url: event.target?.result,
                    type: file.type.startsWith('image') ? 'image' : 'video'
                });
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePublish = async () => {
        if (!content.trim() && !media) {
            setError('Please add content or media');
            return;
        }

        try {
            setLoading(true);
            setError('');

            await storyService.createStory(content, media, background);

            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create story');
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
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('createStory')}</h2>
                    <button onClick={onClose}
                            className={`p-2 rounded-full transition ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-slate-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                        <X className="w-6 h-6"/>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Story Preview */}
                    {!media ? (
                        <div className={`w-full aspect-video rounded-lg flex items-center justify-center ${
                            background === 'white' ? 'bg-white' :
                                background === 'black' ? 'bg-black' :
                                    'bg-gradient-to-br from-purple-500 to-pink-500'
                        }`}>
                            <p className={`text-center px-4 text-2xl font-bold ${
                                background === 'white' ? 'text-gray-900' :
                                    background === 'black' ? 'text-white' :
                                        'text-white'
                            }`}>
                                {content || 'Your story here'}
                            </p>
                        </div>
                    ) : (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                            {media.type === 'image' ? (
                                <img src={media.url} alt="" className="w-full h-full object-cover"/>
                            ) : (
                                <video src={media.url} className="w-full h-full object-cover"/>
                            )}
                            <button
                                onClick={() => setMedia(null)}
                                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white"
                            >
                                <X className="w-4 h-4"/>
                            </button>
                        </div>
                    )}

                    {/* Text Input */}
                    {!media && (
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's on your mind?"
                            className={`w-full px-4 py-3 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-900 placeholder-gray-400'}`}
                            rows={3}
                        />
                    )}

                    {/* Background Selection */}
                    {!media && (
                        <div>
                            <p className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Background</p>
                            <div className="grid grid-cols-7 gap-2">
                                {backgrounds.map((bg) => (
                                    <button
                                        key={bg}
                                        onClick={() => setBackground(bg)}
                                        className={`w-full aspect-square rounded-lg border-2 transition ${
                                            background === bg ? 'border-blue-500' : 'border-gray-300'
                                        } ${
                                            bg === 'white' ? 'bg-white' :
                                                bg === 'black' ? 'bg-black' :
                                                    'bg-gradient-to-br from-purple-500 to-pink-500'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} p-4 flex items-center gap-3`}>
                    {!media && (
                        <label
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg cursor-pointer transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}>
                            <ImageIcon className="w-5 h-5"/>
                            <span className="font-medium">{t('addPhoto')}</span>
                            <input
                                type="file"
                                accept="image/*,video/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </label>
                    )}
                    <button
                        onClick={handlePublish}
                        disabled={loading || (!content.trim() && !media)}
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