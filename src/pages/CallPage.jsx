import {useState, useEffect, useRef, useCallback} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import api from '../lib/api';
import {Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, User} from 'lucide-react';

const ICE_SERVERS = {
    iceServers: [{urls: 'stun:stun.l.google.com:19302'}, {urls: 'stun:stun1.l.google.com:19302'}],
};

export default function CallPage({callData, onEndCall}) {
    const {user} = useAuth();
    const {isDarkMode} = useTheme();
    const {t} = useLanguage();
    const [callStatus, setCallStatus] = useState('connecting');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const [error, setError] = useState(null);

    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const localStream = useRef(null);
    const remoteStream = useRef(null);
    const callTimerRef = useRef(null);

    const {otherUser, callType, isIncoming, callId} = callData;

    const cleanup = useCallback(() => {
        if (peerConnection.current) {
            peerConnection.current.ontrack = null;
            peerConnection.current.onicecandidate = null;
            peerConnection.current.close();
            peerConnection.current = null;
        }
        if (localStream.current) {
            localStream.current.getTracks().forEach((track) => track.stop());
            localStream.current = null;
        }
        if (callTimerRef.current) {
            clearInterval(callTimerRef.current);
            callTimerRef.current = null;
        }
        api.socket.off('callSignal');
        api.socket.off('callEnded');
    }, []);

    const createPeerConnection = useCallback(() => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.ontrack = (event) => {
            remoteStream.current = event.streams[0];
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = event.streams[0];
            }
            setCallStatus('connected');
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                api.sendCallSignal(otherUser.id, {type: 'ice-candidate', candidate: event.candidate});
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setCallStatus('reconnecting');
            }
        };

        return pc;
    }, [otherUser]);

    const startCall = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === 'video',
            });
            localStream.current = stream;
            if (localVideoRef.current && callType === 'video') {
                localVideoRef.current.srcObject = stream;
            }

            const pc = createPeerConnection();
            peerConnection.current = pc;

            stream.getTracks().forEach((track) => {
                pc.addTrack(track, stream);
            });

            api.socket.on('callSignal', async (data) => {
                if (data.from !== otherUser.id && data.from !== otherUser._id) return;
                if (data.type === 'offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);
                    api.sendCallSignal(otherUser.id, {type: 'answer', sdp: answer});
                } else if (data.type === 'answer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                } else if (data.type === 'ice-candidate' && data.candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                    } catch (err) {
                        console.error('ICE candidate error:', err);
                    }
                }
            });

            api.socket.on('callEnded', () => {
                cleanup();
                onEndCall?.();
            });

            if (!isIncoming) {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                await api.startCall(otherUser.id, callType);
                api.sendCallSignal(otherUser.id, {type: 'offer', sdp: offer});
            }
        } catch (err) {
            console.error('Call start error:', err);
            setError(err.message);
            setCallStatus('failed');
        }
    }, [callType, isIncoming, otherUser, createPeerConnection, cleanup, onEndCall]);

    const acceptCall = useCallback(async () => {
        await startCall();
    }, [startCall]);

    useEffect(() => {
        if (!isIncoming) {
            startCall();
        }
        return () => cleanup();
    }, []);

    useEffect(() => {
        if (callStatus === 'connected') {
            callTimerRef.current = setInterval(() => {
                setCallDuration((d) => d + 1);
            }, 1000);
        }
        return () => {
            if (callTimerRef.current) clearInterval(callTimerRef.current);
        };
    }, [callStatus]);

    const toggleMute = () => {
        if (localStream.current) {
            localStream.current.getAudioTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream.current) {
            localStream.current.getVideoTracks().forEach((track) => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const handleEndCall = () => {
        if (callId) api.endCall(callId);
        cleanup();
        onEndCall?.();
    };

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const avatar = otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username || 'default'}`;

    if (isIncoming && callStatus === 'connecting') {
        return (
            <div
                className={`fixed inset-0 z-50 flex flex-col items-center justify-center ${isDarkMode ? 'bg-slate-950' : 'bg-white'}`}>
                <img src={avatar} alt="" className="w-32 h-32 rounded-full object-cover mb-4"/>
                <p className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{otherUser?.username}</p>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{callType === 'video' ? t('incomingVideoCall') : t('incomingVoiceCall')}</p>
                <div className="flex gap-8 mt-8">
                    <button onClick={handleEndCall}
                            className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center">
                        <PhoneOff className="w-7 h-7 text-white"/>
                    </button>
                    <button onClick={acceptCall}
                            className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center animate-pulse-ring">
                        {callType === 'video' ? <Video className="w-7 h-7 text-white"/> :
                            <Phone className="w-7 h-7 text-white"/>}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 z-50 flex flex-col ${isDarkMode ? 'bg-slate-950' : 'bg-gray-900'}`}>
            {callType === 'video' && (
                <>
                    <video ref={remoteVideoRef} autoPlay playsInline
                           className="absolute inset-0 w-full h-full object-cover"/>
                    <video ref={localVideoRef} autoPlay playsInline muted
                           className="absolute top-4 right-4 w-32 h-44 rounded-xl object-cover border-2 border-white/20 z-10"/>
                </>
            )}

            {callType === 'audio' && (
                <div className="flex-1 flex flex-col items-center justify-center">
                    <img src={avatar} alt="" className="w-32 h-32 rounded-full object-cover mb-4"/>
                    <p className={`text-xl font-semibold text-white`}>{otherUser?.username}</p>
                    <p className="text-sm text-gray-400 mt-1">{callStatus === 'connected' ? formatDuration(callDuration) : t(callStatus)}</p>
                </div>
            )}

            {error && <p className="text-sm text-red-400 text-center mt-4">{error}</p>}

            <div className="flex-1"/>

            <div className="flex items-center justify-center gap-4 pb-10 z-20">
                <button onClick={toggleMute}
                        className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-white/20'} backdrop-blur`}>
                    {isMuted ? <MicOff className="w-6 h-6 text-white"/> : <Mic className="w-6 h-6 text-white"/>}
                </button>
                {callType === 'video' && (
                    <button onClick={toggleVideo}
                            className={`w-14 h-14 rounded-full flex items-center justify-center ${isVideoOff ? 'bg-red-500' : 'bg-white/20'} backdrop-blur`}>
                        {isVideoOff ? <VideoOff className="w-6 h-6 text-white"/> :
                            <Video className="w-6 h-6 text-white"/>}
                    </button>
                )}
                <button onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center ${isSpeakerOn ? 'bg-white/20' : 'bg-white/10'} backdrop-blur`}>
                    <Volume2 className="w-6 h-6 text-white"/>
                </button>
                <button onClick={handleEndCall}
                        className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center">
                    <PhoneOff className="w-6 h-6 text-white"/>
                </button>
            </div>
        </div>
    );
}
