import React, {createContext, useContext, useEffect, useState} from 'react';
import {authService} from '../service/authService.js';

const AuthContext = createContext(undefined);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('socialchat_user');
        const savedProfile = localStorage.getItem('socialchat_profile');
        const savedToken = localStorage.getItem('socialchat_token');

        if (savedUser && savedProfile && savedToken) {
            try {
                setUser(JSON.parse(savedUser));
                setProfile(JSON.parse(savedProfile));
            } catch (e) {
                localStorage.removeItem('socialchat_user');
                localStorage.removeItem('socialchat_profile');
                localStorage.removeItem('socialchat_token');
            }
        }
        setLoading(false);
    }, []);

    const signUp = async (email, password, username, fullName, terms) => {
        try {
            setError(null);
            const response = await authService.register(email, username, fullName, password);

            if (response.success && response.user) {
                setUser({id: response.user._id, email: response.user.email});
                setProfile(response.user);
                return {error: null};
            }
            return {error: {message: response.message || 'Registration failed'}};
        } catch (e) {
            const errorMsg = e.response?.data?.message || e.message || 'Registration failed';
            setError(errorMsg);
            return {error: {message: errorMsg}};
        }
    };

    const signIn = async (email, password) => {
        try {
            setError(null);
            const response = await authService.login(email, password);

            if (response.success && response.user) {
                setUser({id: response.user._id, email: response.user.email});
                setProfile(response.user);
                return {error: null};
            }
            return {error: {message: response.message || 'Login failed'}};
        } catch (e) {
            const errorMsg = e.response?.data?.message || e.message || 'Invalid email or password';
            setError(errorMsg);
            return {error: {message: errorMsg}};
        }
    };

    const signOut = async () => {
        try {
            await authService.logout();
            setUser(null);
            setProfile(null);
            setError(null);
        } catch (e) {
            console.error('Logout error:', e);
        }
    };

    const updateProfile = async (updates) => {
        if (!user) return {error: new Error('Not authenticated')};

        try {
            const updatedProfile = await authService.updateProfile({
                username: updates.username,
                name: updates.full_name,
                bio: updates.bio,
                website: updates.website,
            });

            setProfile(updatedProfile);
            return {error: null};
        } catch (e) {
            const errorMsg = e.response?.data?.message || 'Update failed';
            return {error: {message: errorMsg}};
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            return {error: null};
        } catch (e) {
            return {error: {message: 'Change password failed'}};
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            loading,
            error,
            signIn,
            signUp,
            signOut,
            updateProfile,
            changePassword,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}