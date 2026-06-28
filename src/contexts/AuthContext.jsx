import React, {createContext, useContext, useEffect, useState} from 'react';
import {supabase} from '../lib/supabase';

const AuthContext = createContext(undefined);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const generateId = () => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    useEffect(() => {
        const savedUser = localStorage.getItem('manga_user');
        const savedProfile = localStorage.getItem('manga_profile');

        if (savedUser && savedProfile) {
            setUser(JSON.parse(savedUser));
            setProfile(JSON.parse(savedProfile));
        }
        setLoading(false);
    }, []);

    const findUserByEmail = (email) => {
        const users = JSON.parse(localStorage.getItem('manga_users') || '[]');
        return users.find(u => u.email === email);
    };

    const findUserByUsername = (username) => {
        const users = JSON.parse(localStorage.getItem('manga_users') || '[]');
        return users.find(u => u.username?.toLowerCase() === username?.toLowerCase());
    };

    const signUp = async (email, password, username, fullName, terms) => {
        try {
            if (findUserByEmail(email)) {
                return {error: {message: 'Email already registered'}};
            }

            if (findUserByUsername(username)) {
                return {error: {message: 'Username already taken'}};
            }

            const newUser = {
                id: generateId(),
                email: email,
                username: username.toLowerCase(),
                full_name: fullName,
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
                bio: '',
                website: null,
                is_premium: false,
                free_calls_remaining: 3,
                terms_accepted: terms,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const users = JSON.parse(localStorage.getItem('manga_users') || '[]');
            users.push({...newUser, password: password}); // Store password for auth
            localStorage.setItem('manga_users', JSON.stringify(users));

            const userProfile = {...newUser};
            delete userProfile.password;

            localStorage.setItem('manga_user', JSON.stringify({id: newUser.id, email}));
            localStorage.setItem('manga_profile', JSON.stringify(userProfile));
            localStorage.setItem('manga_password', JSON.stringify({[newUser.id]: password}));

            setUser({id: newUser.id, email});
            setProfile(userProfile);

            return {error: null};
        } catch (e) {
            return {error: {message: 'Registration failed'}};
        }
    };

    const signIn = async (email, password) => {
        try {
            const user = findUserByEmail(email);

            if (!user || user.password !== password) {
                return {error: {message: 'Invalid email or password'}};
            }

            const userProfile = {...user};
            delete userProfile.password;

            localStorage.setItem('manga_user', JSON.stringify({id: user.id, email}));
            localStorage.setItem('manga_profile', JSON.stringify(userProfile));

            setUser({id: user.id, email});
            setProfile(userProfile);

            return {error: null};
        } catch (e) {
            return {error: {message: 'Login failed'}};
        }
    };

    const signOut = async () => {
        localStorage.removeItem('manga_user');
        localStorage.removeItem('manga_profile');
        setUser(null);
        setSession(null);
        setProfile(null);
    };

    const updateProfile = async (updates) => {
        if (!user) return {error: new Error('Not authenticated')};

        if (updates.username && updates.username !== profile.username) {
            if (findUserByUsername(updates.username)) {
                return {error: {message: 'Username already taken'}};
            }

            const users = JSON.parse(localStorage.getItem('manga_users') || '[]');
            const userIndex = users.findIndex(u => u.id === user.id);
            if (userIndex !== -1) {
                users[userIndex].username = updates.username.toLowerCase();
                localStorage.setItem('manga_users', JSON.stringify(users));
            }
        }

        const updatedProfile = {...profile, ...updates, updated_at: new Date().toISOString()};
        localStorage.setItem('manga_profile', JSON.stringify(updatedProfile));
        setProfile(updatedProfile);

        return {error: null};
    };

    const changePassword = async (currentPassword, newPassword) => {
        const users = JSON.parse(localStorage.getItem('manga_users') || '[]');
        const userIndex = users.findIndex(u => u.id === user.id);

        if (userIndex === -1 || users[userIndex].password !== currentPassword) {
            return {error: {message: 'Current password is incorrect'}};
        }

        users[userIndex].password = newPassword;
        localStorage.setItem('manga_users', JSON.stringify(users));

        return {error: null};
    };

    const refreshProfile = async () => {
        const savedProfile = localStorage.getItem('manga_profile');
        if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            profile,
            loading,
            signIn,
            signUp,
            signOut,
            updateProfile,
            changePassword,
            refreshProfile,
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
