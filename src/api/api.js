import {io} from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

function getToken() {
    return localStorage.getItem('token') || '';
}

function getHeaders() {
    const token = getToken();
    return {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})};
}

async function request(path, options = {}) {
    try {
        const res = await fetch(`${API_URL}${path}`, {...options, headers: {...getHeaders(), ...options.headers}});
        const data = res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => ({})) : {};
        if (!res.ok) {
            if (res.status === 401) {
                localStorage.removeItem('token');
                window.location.href = '/login';
                throw new Error('Session expired');
            }
            throw new Error(data.message || `Request failed (${res.status})`);
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

const api = {
    auth: {
        register: (body) => request('/auth/register', {method: 'POST', body: JSON.stringify(body)}),
        login: (body) => request('/auth/login', {method: 'POST', body: JSON.stringify(body)}),
        me: () => request('/auth/me'),
        logout: () => request('/auth/logout', {method: 'POST'}),
    },
    user: {
        me: () => request('/users/me'),
        updateProfile: (body) => request('/users/me', {method: 'PUT', body: JSON.stringify(body)}),
        getByUsername: (username) => request(`/users/username/${username}`),
        getLimits: () => request('/users/me/limits'),
        getActivity: () => request('/users/me/activity'),
        getById: (id) => request(`/users/${id}`),
        search: (q) => request(`/users/search?query=${encodeURIComponent(q)}`),
    },
    posts: {
        list: (page = 1, limit = 20) => request(`/posts?page=${page}&limit=${limit}`),
        getById: (postId) => request(`/posts/${postId}`),
        create: (body) => request('/posts', {method: 'POST', body: JSON.stringify(body)}),
        update: (postId, body) => request(`/posts/${postId}`, {method: 'PUT', body: JSON.stringify(body)}),
        delete: (postId) => request(`/posts/${postId}`, {method: 'DELETE'}),
        toggleLike: (postId) => request(`/posts/${postId}/like`, {method: 'PUT'}),
        toggleSave: (postId) => request(`/posts/${postId}/save`, {method: 'PUT'}),
        share: (postId, userId) => request(`/posts/${postId}/share`, {method: 'POST', body: JSON.stringify({userId})}),
        trackView: (postId) => request(`/posts/${postId}/view`, {method: 'POST'}),
        saved: (page = 1, limit = 20) => request(`/posts/saved?page=${page}&limit=${limit}`),
    },
    comments: {
        add: (postId, content) => request(`/comments/${postId}`, {method: 'POST', body: JSON.stringify({content})}),
        list: (postId, page = 1, limit = 20) => request(`/comments/${postId}?page=${page}&limit=${limit}`),
        update: (commentId, content) => request(`/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({content})
        }),
        delete: (commentId) => request(`/comments/${commentId}`, {method: 'DELETE'}),
        toggleLike: (commentId) => request(`/comments/${commentId}/like`, {method: 'PUT'}),
        reply: (commentId, content) => request(`/comments/${commentId}/reply`, {
            method: 'POST',
            body: JSON.stringify({content})
        }),
    },
    stories: {
        list: () => request('/stories'),
        getByUser: (userId) => request(`/stories/user/${userId}`),
        create: (body) => request('/stories', {method: 'POST', body: JSON.stringify(body)}),
        view: (storyId) => request(`/stories/${storyId}/view`, {method: 'PUT'}),
        react: (storyId, type) => request(`/stories/${storyId}/react`, {method: 'PUT', body: JSON.stringify({type})}),
        delete: (storyId) => request(`/stories/${storyId}`, {method: 'DELETE'}),
    },
    follow: {
        follow: (userId) => request(`/follow/${userId}/follow`, {method: 'POST'}),
        unfollow: (userId) => request(`/follow/${userId}/unfollow`, {method: 'DELETE'}),
        status: (userId) => request(`/follow/${userId}/status`),
        followers: (userId, page = 1) => request(`/follow/${userId}/followers?page=${page}`),
        following: (userId, page = 1) => request(`/follow/${userId}/following?page=${page}`),
        requests: () => request('/follow/requests'),
        acceptRequest: (followId) => request(`/follow/requests/${followId}/accept`, {method: 'PUT'}),
        rejectRequest: (followId) => request(`/follow/requests/${followId}/reject`, {method: 'DELETE'}),
    },
    messages: {
        send: (receiverId, content, type = 'text') => request('/messages', {
            method: 'POST',
            body: JSON.stringify({receiverId, content, type})
        }),
        getWith: (userId) => request(`/messages/${userId}`),
        markRead: (messageId) => request(`/messages/${messageId}/read`, {method: 'PUT'}),
        getChats: () => request('/chats'),
        getChatMessages: (chatId) => request(`/chats/${chatId}/messages`),
    },
    calls: {
        start: (receiverId, type = 'video') => request('/calls/start', {
            method: 'POST',
            body: JSON.stringify({receiverId, type})
        }),
        end: (callId, duration) => request('/calls/end', {method: 'POST', body: JSON.stringify({callId, duration})}),
        history: (userId) => request(`/calls/history/${userId}`),
        accept: (callId) => request(`/calls/${callId}/accept`, {method: 'PUT'}),
        reject: (callId) => request(`/calls/${callId}/reject`, {method: 'PUT'}),
    },
    notifications: {
        list: (page = 1, limit = 50) => request(`/notifications?page=${page}&limit=${limit}`),
        recent: () => request('/notifications/recent'),
        unreadCount: () => request('/notifications/unread/count'),
        markRead: (notificationId) => request(`/notifications/${notificationId}/read`, {method: 'PUT'}),
        markAllRead: () => request('/notifications/read/all', {method: 'PUT'}),
        delete: (notificationId) => request(`/notifications/${notificationId}`, {method: 'DELETE'}),
        create: (data) => request('/notifications', {method: 'POST', body: JSON.stringify(data)}),
    },
    payments: {
        plans: () => request('/payments/plans'),
        upgrade: (plan, paymentMethod = 'card', transactionId = null) => request('/payments/upgrade', {
            method: 'POST',
            body: JSON.stringify({plan, paymentMethod, transactionId})
        }),
        history: () => request('/payments/history'),
        status: () => request('/payments/status'),
        usage: () => request('/payments/usage'),
        cancel: () => request('/payments/cancel', {method: 'POST'}),
    },
    media: {
        async toBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },
        async fileToMedia(file) {
            const base64 = await this.toBase64(file);
            return {type: file.type.startsWith('video/') ? 'video' : 'image', url: base64};
        },
        async upload(file) {
            const formData = new FormData();
            formData.append('file', file);
            const token = getToken();
            const res = await fetch(`${API_URL}/media/upload`, {
                method: 'POST',
                headers: {...(token ? {Authorization: `Bearer ${token}`} : {})},
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            return data;
        }
    },
    search: {
        all: (query) => request(`/search?query=${encodeURIComponent(query)}`),
        users: (query) => request(`/search/users?query=${encodeURIComponent(query)}`),
        posts: (query) => request(`/search/posts?query=${encodeURIComponent(query)}`),
        trending: () => request('/search/trending'),
    },
    admin: {
        users: () => request('/admin/users'),
        stats: () => request('/admin/stats'),
        toggleUser: (userId) => request(`/admin/users/${userId}/toggle`, {method: 'PUT'}),
    },
};

// ===== SOCKET =====
let socket = null;

export function getSocket() {
    if (socket) return socket;
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('user_id');
    socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        auth: {token, userId},
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        withCredentials: true,
    });
    socket.on('connect', () => {
        console.log('✅ Socket connected');
        if (userId) socket.emit('join', {userId});
    });
    socket.on('disconnect', (reason) => console.log('❌ Socket disconnected:', reason));
    socket.on('connect_error', (error) => console.error('⚠️ Socket connection error:', error.message));
    socket.on('onlineUsers', (users) => window.dispatchEvent(new CustomEvent('onlineUsers', {detail: users})));
    socket.on('newMessage', (data) => window.dispatchEvent(new CustomEvent('newMessage', {detail: data})));
    socket.on('messageSent', (data) => window.dispatchEvent(new CustomEvent('messageSent', {detail: data})));
    socket.on('userTyping', (data) => window.dispatchEvent(new CustomEvent('userTyping', {detail: data})));
    socket.on('userStoppedTyping', (data) => window.dispatchEvent(new CustomEvent('userStoppedTyping', {detail: data})));
    return socket;
}

export function connectSocket() {
    const s = getSocket();
    if (!s.connected) s.connect();
    return s;
}

export function disconnectSocket() {
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }
}

export const socketService = {
    socket: null, isConnected: false,
    connect(userId, token) {
        if (!userId) userId = localStorage.getItem('user_id');
        if (!userId) return null;
        if (this.socket) this.disconnect();
        this.socket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            auth: {token, userId},
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            withCredentials: true,
        });
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('✅ Socket connected (service)');
            if (userId) this.socket.emit('join', {userId});
        });
        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            console.log('❌ Socket disconnected (service):', reason);
        });
        this.socket.on('connect_error', (error) => console.error('⚠️ Socket error (service):', error.message));
        this.socket.on('onlineUsers', (users) => window.dispatchEvent(new CustomEvent('onlineUsers', {detail: users})));
        this.socket.on('newMessage', (data) => window.dispatchEvent(new CustomEvent('newMessage', {detail: data})));
        this.socket.on('messageSent', (data) => window.dispatchEvent(new CustomEvent('messageSent', {detail: data})));
        this.socket.on('userTyping', (data) => window.dispatchEvent(new CustomEvent('userTyping', {detail: data})));
        this.socket.on('userStoppedTyping', (data) => window.dispatchEvent(new CustomEvent('userStoppedTyping', {detail: data})));
        return this.socket;
    },
    disconnect() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    },
    on(event, callback) {
        if (this.socket) this.socket.on(event, callback); else console.warn('⚠️ Socket not initialized');
    },
    off(event, callback) {
        if (this.socket) this.socket.off(event, callback);
    },
    emit(event, data) {
        if (this.socket && this.isConnected) this.socket.emit(event, data); else console.warn('⚠️ Socket not connected');
    },
    joinRoom(userId) {
        this.emit('join', {userId});
    },
    sendMessage(data) {
        this.emit('sendMessage', data);
    },
    sendTyping(receiverId, userId, username) {
        this.emit('typing', {receiverId, userId, username});
    },
    sendStopTyping(receiverId, userId) {
        this.emit('stopTyping', {receiverId, userId});
    },
    startCall(data) {
        this.emit('startCall', data);
    },
    endCall(data) {
        this.emit('endCall', data);
    },
    getOnlineUsers() {
        this.emit('getOnlineUsers');
    },
};

export default api;