import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PhoneOff, Video, VideoOff, Mic, MicOff, X } from 'lucide-react';

const DEMO_USERS = {
  'demo-1': { username: 'sarah_photo', full_name: 'Sarah Photography', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
  'demo-2': { username: 'alex_daily', full_name: 'Alex Daily', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex' },
  'demo-3': { username: 'mike_films', full_name: 'Mike Films', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike' },
};

export default function CallPage({ otherUserId, callType, onClose }) {
  const { user, profile } = useAuth();
  const [otherUser, setOtherUser] = useState(null);
  const [status, setStatus] = useState('calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [duration, setDuration] = useState(0);
  const durationRef = useRef(null);

  useEffect(() => {
    // Get other user info
    const userInfo = DEMO_USERS[otherUserId] || {
      username: 'Unknown',
      full_name: 'Unknown User',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=unknown'
    };
    setOtherUser(userInfo);

    // Simulate call being answered
    const answerTimeout = setTimeout(() => {
      setStatus('connecting');
      setTimeout(() => {
        setStatus('connected');
      }, 1500);
    }, 3000);

    return () => clearTimeout(answerTimeout);
  }, [otherUserId]);

  useEffect(() => {
    if (status === 'connected') {
      durationRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (durationRef.current) {
        clearInterval(durationRef.current);
      }
    };
  }, [status]);

  const endCall = () => {
    setStatus('ended');
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col z-50">
      {/* Main Video Area */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
          <img
            src={otherUser?.avatar_url}
            alt={otherUser?.username}
            className="w-full h-full object-cover opacity-30"
          />
        </div>

        {/* Other User Info */}
        <div className="absolute top-8 left-5 flex items-center gap-3">
          <img
            src={otherUser?.avatar_url}
            alt={otherUser?.username}
            className="w-12 h-12 rounded-full border-2 border-white/20"
          />
          <div>
            <p className="text-white font-semibold text-lg">{otherUser?.full_name}</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
              <p className="text-gray-300 text-sm">
                {status === 'calling' && 'Calling...'}
                {status === 'connecting' && 'Connecting...'}
                {status === 'connected' && formatDuration(duration)}
                {status === 'ended' && 'Call Ended'}
              </p>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-5 right-5 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition">
          <X className="w-6 h-6" />
        </button>

        {/* Ringing Animation */}
        {status === 'calling' && (
          <div className="text-center">
            <div className="w-40 h-40 rounded-full border-8 border-blue-500/20 flex items-center justify-center mx-auto animate-pulse">
              <img src={otherUser?.avatar_url} alt={otherUser?.username} className="w-32 h-32 rounded-full" />
            </div>
            <p className="text-white text-xl mt-6">
              {callType === 'video' ? 'Video Calling...' : 'Calling...'}
            </p>
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="p-6 flex items-center justify-center gap-4 bg-gradient-to-t from-black/50 to-transparent">
        {status === 'connected' && (
          <>
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full transition ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            {callType === 'video' && (
              <button
                onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                className={`p-4 rounded-full transition ${isVideoEnabled ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-red-500 text-white'}`}
              >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
            )}
          </>
        )}
        <button
          onClick={endCall}
          className="p-5 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
