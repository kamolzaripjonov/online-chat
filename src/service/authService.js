import api from './api';

export const authService = {
    login: async (emailOrUsername, password) => {
        const response = await api.post('/auth/login', {
            email: emailOrUsername,
            password,
        });
        if (response.data.token) {
            localStorage.setItem('socialchat_token', response.data.token);
            localStorage.setItem('socialchat_user', JSON.stringify({
                id: response.data.user.id,
                email: response.data.user.email
            }));
            localStorage.setItem('socialchat_profile', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    register: async (email, username, fullName, password) => {
        const response = await api.post('/auth/register', {
            email,
            username,
            name: fullName,
            password,
            acceptedTerms: true,
        });
        if (response.data.token) {
            localStorage.setItem('socialchat_token', response.data.token);
            localStorage.setItem('socialchat_user', JSON.stringify({
                id: response.data.user.id,
                email: response.data.user.email
            }));
            localStorage.setItem('socialchat_profile', JSON.stringify(response.data.user));
        }
        return response.data;
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
        localStorage.setItem('socialchat_profile', JSON.stringify(response.data.user));
        return response.data.user;
    },
};

export const postService = {
    getPosts: async (page = 1, limit = 20) => {
        const response = await api.get(`/posts?page=${page}&limit=${limit}`);
        return response.data;
    },

    createPost: async (content, media = [], hashtags = [], mentions = []) => {
        const response = await api.post('/posts', {
            content,
            media,
            hashtags,
            mentions,
        });
        return response.data;
    },

    getPostById: async (postId) => {
        const response = await api.get(`/posts/${postId}`);
        return response.data;
    },

    updatePost: async (postId, content, location = null) => {
        const response = await api.put(`/posts/${postId}`, {
            content,
            location,
        });
        return response.data;
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
        const response = await api.post(`/posts/${postId}/share`, {userId});
        return response.data;
    },

    getSavedPosts: async (page = 1, limit = 20) => {
        const response = await api.get(`/posts/saved?page=${page}&limit=${limit}`);
        return response.data;
    },
};

export const commentService = {
    addComment: async (postId, content, mentions = []) => {
        const response = await api.post(`/comments`, {
            postId,
            content,
            mentions,
        });
        return response.data;
    },

    deleteComment: async (commentId) => {
        const response = await api.delete(`/comments/${commentId}`);
        return response.data;
    },

    toggleCommentLike: async (commentId) => {
        const response = await api.put(`/comments/${commentId}/like`);
        return response.data;
    },
};

export const storyService = {
    getStories: async () => {
        const response = await api.get('/stories');
        return response.data;
    },

    createStory: async (content, media = null, background = 'white') => {
        const response = await api.post('/stories', {
            content,
            media,
            background,
        });
        return response.data;
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

export const messageService = {
    sendMessage: async (receiverId, content, type = 'text') => {
        const response = await api.post('/messages', {
            receiverId,
            content,
            type,
        });
        return response.data;
    },

    getMessages: async (userId, limit = 50) => {
        const response = await api.get(`/messages/${userId}?limit=${limit}`);
        return response.data;
    },

    markAsRead: async (messageId) => {
        const response = await api.put(`/messages/${messageId}/read`);
        return response.data;
    },
};

export const callService = {
    startCall: async (receiverId) => {
        const response = await api.post('/calls', {
            receiverId,
        });
        return response.data;
    },

    endCall: async (callId, duration) => {
        const response = await api.post(`/calls/${callId}/end`, {
            duration,
        });
        return response.data;
    },

    getCallHistory: async (userId, limit = 20) => {
        const response = await api.get(`/calls/${userId}?limit=${limit}`);
        return response.data;
    },
};

export const notificationService = {
    getNotifications: async (page = 1, limit = 50) => {
        const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
        return response.data;
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
        return response.data;
    },
};

export const userService = {
    searchUsers: async (query) => {
        const response = await api.get(`/users/search?query=${query}`);
        return response.data;
    },

    getUser: async (userId) => {
        const response = await api.get(`/users/${userId}`);
        return response.data;
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
