import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { X, Heart, MessageCircle } from 'lucide-react';

export default function StoryViewer({ userId, initialStoryIndex, onClose, onNextUser, onPrevUser }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  const [stories, setStories] = useState([]);
  const [profile, setProfile] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [loading, setLoading] = useState(true);

  const progressRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    loadStories();
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [userId]);

  useEffect(() => {
    if (stories.length > 0) {
      startProgress();
      markAsViewed(stories[currentIndex]?.id);
      incrementView(stories[currentIndex]?.id);
    }
  }, [currentIndex, stories]);

  const loadStories = () => {
    const stored = localStorage.getItem('manga_stories');
    const allStories = stored ? JSON.parse(stored) : [];
    const userStories = allStories.filter(s => s.user_id === userId);

    if (userStories.length > 0) {
      setStories(userStories);
      setProfile(userStories[0].profiles);
    }
    setLoading(false);
  };

  const startProgress = () => {
    const progressBar = containerRef.current?.querySelector(`[data-story-index="${currentIndex}"]`);
    if (!progressBar) return;

    let width = 0;
    progressBar.style.width = '0%';
    if (progressRef.current) clearInterval(progressRef.current);

    progressRef.current = setInterval(() => {
      width += 2;
      progressBar.style.width = `${width}%`;
      if (width >= 100) { clearInterval(progressRef.current); goToNextStory(); }
    }, 100);
  };

  const markAsViewed = (storyId) => {
    if (!storyId) return;
    const stored = localStorage.getItem('manga_story_views');
    const viewedIds = stored ? JSON.parse(stored) : [];
    if (!viewedIds.includes(storyId)) {
      viewedIds.push(storyId);
      localStorage.setItem('manga_story_views', JSON.stringify(viewedIds));
    }
  };

  const incrementView = (storyId) => {
    if (!storyId || !user) return;
    const stored = localStorage.getItem('manga_stories');
    const stories = stored ? JSON.parse(stored) : [];
    const storyIndex = stories.findIndex(s => s.id === storyId);
    if (storyIndex !== -1 && !stories[storyIndex].viewed_by?.includes(user.id)) {
      stories[storyIndex].views_count = (stories[storyIndex].views_count || 0) + 1;
      if (!stories[storyIndex].viewed_by) stories[storyIndex].viewed_by = [];
      stories[storyIndex].viewed_by.push(user.id);
      localStorage.setItem('manga_stories', JSON.stringify(stories));
    }
  };

  const goToNextStory = () => {
    if (currentIndex < stories.length - 1) setCurrentIndex(currentIndex + 1);
    else onNextUser();
  };

  const goToPrevStory = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    else onPrevUser();
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) goToPrevStory();
    else goToNextStory();
  };

  if (loading) {
    return (<div className="fixed inset-0 bg-black z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white" /></div>);
  }

  if (stories.length === 0) { onClose(); return null; }

  const currentStory = stories[currentIndex];
  const hoursAgo = Math.floor((Date.now() - new Date(currentStory.created_at).getTime()) / (1000 * 60 * 60));

  return (
    <div className="fixed inset-0 bg-black z-50" ref={containerRef}>
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="h-1 flex-1 bg-gray-800 rounded overflow-hidden">
            <div data-story-index={index} className={`h-full bg-white transition-all ${index < currentIndex ? 'w-full' : index > currentIndex ? 'w-0' : ''}`} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img src={profile?.avatar_url} alt="" className="w-10 h-10 rounded-full border-2 border-white" />
          <div>
            <p className="text-white font-semibold">{profile?.username}</p>
            <p className="text-gray-400 text-xs">{hoursAgo}h ago</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white hover:bg-white/10 p-2 rounded-full transition"><X className="w-6 h-6" /></button>
      </div>

      {/* Story content */}
      <div className="absolute inset-0 flex" onClick={handleClick}>
        {currentStory.media_type === 'image' ? (
          <img src={currentStory.media_url} alt="" className="w-full h-full object-contain" />
        ) : (
          <video src={currentStory.media_url} className="w-full h-full object-contain" autoPlay playsInline />
        )}
      </div>

      {/* Views count */}
      <div className="absolute bottom-24 left-4 flex items-center gap-2 z-10">
        <span className="text-white text-sm">{currentStory.views_count || 0} {t('views')}</span>
      </div>

      {/* Bottom actions */}
      <div className="absolute bottom-8 left-4 right-4 flex items-center gap-4 z-10">
        <div className={`flex-1 flex items-center gap-3 rounded-full px-4 py-2 ${isDarkMode ? 'bg-black/30' : 'bg-white/20'}`}>
          <input type="text" placeholder={t('typeMessage').replace('...', '')} className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm" />
        </div>
        <button className="text-white hover:scale-110 transition"><Heart className="w-6 h-6" /></button>
        <button className="text-white hover:scale-110 transition"><MessageCircle className="w-6 h-6" /></button>
      </div>
    </div>
  );
}
