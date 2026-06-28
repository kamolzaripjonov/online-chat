import api from './api';

export const authService = {
    login: async (emailOrUsername, password) => {
        const response = await api.post('/auth/login', {
            emailOrUsername,
            password,
        });
        if (response.data.token) {
            localStorage.setItem('socialchat_token', response.data.token);
            localStorage.setItem('socialchat_user', JSON.stringify(response.data.user));
            localStorage.setItem('socialchat_profile', JSON.stringify(response.data.profile));
        }
        return response.data;
    },

    register: async (email, username, fullName, password) => {
        const response = await api.post('/auth/register', {
            email,
            username,
            fullName,
            password,
        });
        if (response.data.token) {
            localStorage.setItem('socialchat_token', response.data.token);
            localStorage.setItem('socialchat_user', JSON.stringify(response.data.user));
            localStorage.setItem('socialchat_profile', JSON.stringify(response.data.profile));
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
        const response = await api.get('/auth/profile');
        return response.data;
    },

    updateProfile: async (updates) => {
        const response = await api.put('/auth/profile', updates);
        localStorage.setItem('socialchat_profile', JSON.stringify(response.data));
        return response.data;
    },
};

export const postService = {
    getPosts: async () => {
        const response = await api.get('/posts');
        return response.data;
    },

    createPost: async (caption, mediaUrl, mediaType) => {
        const response = await api.post('/posts', {
            caption,
            mediaUrl,
            mediaType,
        });
        return response.data;
    },

    likePost: async (postId) => {
        const response = await api.post(`/posts/${postId}/like`);
        return response.data;
    },

    unlikePost: async (postId) => {
        const response = await api.delete(`/posts/${postId}/like`);
        return response.data;
    },

    deletePost: async (postId) => {
        const response = await api.delete(`/posts/${postId}`);
        return response.data;
    },
};

export const storyService = {
    getStories: async () => {
        const response = await api.get('/stories');
        return response.data;
    },

    createStory: async (mediaUrl, mediaType) => {
        const response = await api.post('/stories', {
            mediaUrl,
            mediaType,
        });
        return response.data;
    },

    markStoryAsViewed: async (storyId) => {
        const response = await api.post(`/stories/${storyId}/view`);
        return response.data;
    },

    deleteStory: async (storyId) => {
        const response = await api.delete(`/stories/${storyId}`);
        return response.data;
    },
};

export const chatService = {
    getConversations: async () => {
        const response = await api.get('/conversations');
        return response.data;
    },

    getMessages: async (conversationId) => {
        const response = await api.get(`/conversations/${conversationId}/messages`);
        return response.data;
    },

    sendMessage: async (conversationId, content) => {
        const response = await api.post(`/conversations/${conversationId}/messages`, {
            content,
        });
        return response.data;
    },

    createConversation: async (userId) => {
        const response = await api.post('/conversations/create', {
            userId,
        });
        return response.data;
    },
};

export const userService = {
    searchUsers: async (query) => {
        const response = await api.get(`/users/search?q=${query}`);
        return response.data;
    },

    getUser: async (userId) => {
        const response = await api.get(`/users/${userId}`);
        return response.data;
    },
};
