import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { X, Camera, Upload } from 'lucide-react';

export default function CreatePostPage({ onClose }) {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [mediaType, setMediaType] = useState('image');
  const [postCaption, setPostCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Detect media type
    if (file.type.startsWith('video/')) {
      setMediaType('video');
    } else {
      setMediaType('image');
    }
  };

  const handleCreatePost = async () => {
    if (!selectedFile) return;
    setSubmitting(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Url = reader.result;

        const newPost = {
          id: `post-${Date.now()}`,
          user_id: user.id,
          caption: postCaption,
          media_url: base64Url,
          media_type: mediaType,
          created_at: new Date().toISOString(),
          profiles: {
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          },
          likes_count: 0,
          comments_count: 0,
          views_count: 0,
          liked_by: [],
          is_liked: false,
        };

        // Save to localStorage
        const stored = localStorage.getItem('manga_posts');
        const posts = stored ? JSON.parse(stored) : [];
        posts.unshift(newPost);
        localStorage.setItem('manga_posts', JSON.stringify(posts));

        // Reset and close
        onClose();
      };
      reader.readAsDataURL(selectedFile);
    } catch (e) {
      console.error('Error creating post:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className={`w-full sm:w-[400px] rounded-t-2xl sm:rounded-2xl p-6 max-h-[80vh] overflow-auto ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{t('createPost')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />

          {/* Upload Button / Preview */}
          {!previewUrl ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-3 transition ${
                isDarkMode
                  ? 'bg-slate-700/50 border-2 border-dashed border-slate-600 hover:bg-slate-700'
                  : 'bg-gray-100 border-2 border-dashed border-gray-300 hover:bg-gray-200'
              }`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-slate-600' : 'bg-gray-200'
              }`}>
                <Camera className={`w-8 h-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{t('addPhoto')}</p>
              <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>from your gallery</p>
            </button>
          ) : (
            <div className="relative">
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-900">
                {mediaType === 'image' ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={previewUrl} className="w-full h-full object-cover" controls />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`absolute bottom-3 left-3 px-3 py-2 rounded-lg ${
                  isDarkMode ? 'bg-slate-900/80 text-white' : 'bg-white/80 text-gray-900'
                } text-sm flex items-center gap-2 hover:opacity-80 transition`}
              >
                <Upload className="w-4 h-4" />
                Change
              </button>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {t('writeCaption').replace('...', '')}
            </label>
            <textarea
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              placeholder={t('writeCaption')}
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                isDarkMode
                  ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-400'
                  : 'bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleCreatePost}
            disabled={!previewUrl || submitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : t('share')}
          </button>
        </div>
      </div>
    </div>
  );
}
