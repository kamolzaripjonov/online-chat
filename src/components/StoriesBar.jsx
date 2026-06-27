import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Plus } from 'lucide-react';

export default function StoriesBar({ onOpenStory }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = () => {
    const stored = localStorage.getItem('manga_stories');
    const stories = stored ? JSON.parse(stored) : [];
    const viewedStored = localStorage.getItem('manga_story_views');
    const viewedIds = viewedStored ? JSON.parse(viewedStored) : [];

    const groups = {};
    stories.forEach((story) => {
      if (!groups[story.user_id]) {
        groups[story.user_id] = {
          user_id: story.user_id,
          profiles: story.profiles,
          stories: [],
          has_unviewed: !viewedIds.includes(story.id),
        };
      }
      groups[story.user_id].stories.push(story);
      if (!viewedIds.includes(story.id)) groups[story.user_id].has_unviewed = true;
    });

    const sortedGroups = Object.values(groups).sort((a, b) => {
      if (a.user_id === user?.id) return -1;
      if (b.user_id === user?.id) return 1;
      return 0;
    });

    setStoryGroups(sortedGroups);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="px-4 py-4 flex gap-4 overflow-x-auto">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1 animate-pulse flex-shrink-0">
            <div className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
            <div className={`w-12 h-3 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`} />
          </div>
        ))}
      </div>
    );
  }

  const hasUserStory = storyGroups.some(g => g.user_id === user?.id);

  return (
    <div className="px-4 py-4">
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {/* Add Story Button (if no story) */}
        {user && !hasUserStory && (
          <button className="flex flex-col items-center gap-1 min-w-[70px] group flex-shrink-0">
            <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
              <Plus className={`w-8 h-8 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
            </div>
            <span className={`text-xs truncate max-w-[60px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t('stories')}
            </span>
          </button>
        )}

        {storyGroups.map((group) => (
          <button
            key={group.user_id}
            onClick={() => onOpenStory(group.user_id, 0)}
            className="flex flex-col items-center gap-1 min-w-[70px] group flex-shrink-0"
          >
            <div className={`w-16 h-16 rounded-full p-0.5 ${group.has_unviewed ? 'bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500' : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}>
              <img
                src={group.profiles.avatar_url}
                alt={group.profiles.username}
                className={`w-full h-full rounded-full object-cover border-2 ${isDarkMode ? 'border-slate-900' : 'border-white'}`}
              />
            </div>
            <span className={`text-xs truncate max-w-[60px] ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {group.user_id === user?.id ? 'You' : group.profiles.username}
            </span>
          </button>
        ))}

        {storyGroups.length === 0 && (
          <div className={`text-center py-4 w-full ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            <p className="text-sm">{t('noStories')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
