import api from './api';

export const authService = {
    login: async (email, password) => {
        try {
            const response = await api.post('/auth/login', {
                email,
                password,
            });

            if (response.data.success && response.data.token) {
                localStorage.setItem('socialchat_token', response.data.token);
                localStorage.setItem('socialchat_user', JSON.stringify({
                    id: response.data.user._id,
                    email: response.data.user.email
                }));
                localStorage.setItem('socialchat_profile', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    register: async (email, username, fullName, password) => {
        try {
            const response = await api.post('/auth/register', {
                email,
                username,
                name: fullName,
                password,
                acceptedTerms: true,
            });

            if (response.data.success && response.data.token) {
                localStorage.setItem('socialchat_token', response.data.token);
                localStorage.setItem('socialchat_user', JSON.stringify({
                    id: response.data.user._id,
                    email: response.data.user.email
                }));
                localStorage.setItem('socialchat_profile', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    },

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('socialchat_token');
            localStorage.removeItem('socialchat_user');
            localStorage.removeItem('socialchat_profile');
        }
    },

    getProfile: async () => {
        const response = await api.get('/auth/me');
        return response.data.user;
    },

    updateProfile: async (updates) => {
        const response = await api.put('/users/me', updates);
        if (response.data.user) {
            localStorage.setItem('socialchat_profile', JSON.stringify(response.data.user));
        }
        return response.data.user;
    },
};

export const postService = {
    getPosts: async (page = 1, limit = 20) => {
        const response = await api.get(`/posts?page=${page}&limit=${limit}`);
        return response.data.posts || [];
    },

    createPost: async (content, media = [], hashtags = [], mentions = []) => {
        const response = await api.post('/posts', {
            content,
            media,
            hashtags,
            mentions,
        });
        return response.data.data;
    },

    getPostById: async (postId) => {
        const response = await api.get(`/posts/${postId}`);
        return response.data.post;
    },

    updatePost: async (postId, content, location = null) => {
        const response = await api.put(`/posts/${postId}`, {
            content,
            location,
        });
        return response.data.data;
    },

    deletePost: async (postId) => {
        const response = await api.delete(`/posts/${postId}`);
        return response.data;
    },

    toggleLike: async (postId) => {
        const response = await api.put(`/posts/${postId}/like`);
        return response.data;
    },

    toggleSave: async (postId) => {
        const response = await api.put(`/posts/${postId}/save`);
        return response.data;
    },

    sharePost: async (postId, userId = null) => {
        const response = await api.post(`/posts/${postId}/share`, { userId });
        return response.data;
    },

    getSavedPosts: async (page = 1, limit = 20) => {
        const response = await api.get(`/posts/saved?page=${page}&limit=${limit}`);
        return response.data.posts || [];
    },
};

export const messageService = {
    sendMessage: async (receiverId, content, type = 'text') => {
        const response = await api.post('/messages', {
            receiverId,
            content,
            type,
        });
        return response.data.data;
    },

    getMessages: async (userId, limit = 50) => {
        const response = await api.get(`/messages/${userId}?limit=${limit}`);
        return response.data.messages || [];
    },

    markAsRead: async (messageId) => {
        const response = await api.put(`/messages/${messageId}/read`);
        return response.data;
    },
};

export const notificationService = {
    getNotifications: async (page = 1, limit = 50) => {
        const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
        return response.data.notifications || [];
    },

    markAsRead: async (notificationId) => {
        const response = await api.put(`/notifications/${notificationId}/read`);
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await api.put('/notifications/read-all');
        return response.data;
    },

    deleteNotification: async (notificationId) => {
        const response = await api.delete(`/notifications/${notificationId}`);
        return response.data;
    },

    getUnreadCount: async () => {
        const response = await api.get('/notifications/unread-count');
        return response.data.unreadCount || 0;
    },
};

export const userService = {
    searchUsers: async (query) => {
        const response = await api.get(`/users/search?query=${query}`);
        return response.data.users || [];
    },

    getUser: async (userId) => {
        const response = await api.get(`/users/${userId}`);
        return response.data.user;
    },

    getMyLimits: async () => {
        const response = await api.get('/users/me/limits');
        return response.data;
    },

    follow: async (userId) => {
        const response = await api.post(`/follow/${userId}`);
        return response.data;
    },

    unfollow: async (userId) => {
        const response = await api.delete(`/follow/${userId}`);
        return response.data;
    },
};

export const storyService = {
    getStories: async () => {
        const response = await api.get('/stories');
        return response.data.stories || [];
    },

    createStory: async (content, media = null, background = 'white') => {
        const response = await api.post('/stories', {
            content,
            media,
            background,
        });
        return response.data.data;
    },

    viewStory: async (storyId) => {
        const response = await api.post(`/stories/${storyId}/view`);
        return response.data;
    },

    deleteStory: async (storyId) => {
        const response = await api.delete(`/stories/${storyId}`);
        return response.data;
    },
};

export const callService = {
    startCall: async (receiverId) => {
        const response = await api.post('/calls', {
            receiverId,
        });
        return response.data.data;
    },

    endCall: async (callId, duration) => {
        const response = await api.post(`/calls/${callId}/end`, {
            duration,
        });
        return response.data.data;
    },

    getCallHistory: async (userId, limit = 20) => {
        const response = await api.get(`/calls/${userId}?limit=${limit}`);
        return response.data.calls || [];
    },
};