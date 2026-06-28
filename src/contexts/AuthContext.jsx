import React, {createContext, useContext, useEffect, useState} from 'react';
import {TEST_USERS, generateMockToken} from '../service/testData.js';

const AuthContext = createContext(undefined);

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const generateId = () => `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    useEffect(() => {
        const savedUser = localStorage.getItem('socialchat_user');
        const savedProfile = localStorage.getItem('socialchat_profile');
        const savedToken = localStorage.getItem('socialchat_token');

        if (savedUser && savedProfile && savedToken) {
            setUser(JSON.parse(savedUser));
            setProfile(JSON.parse(savedProfile));
        }
        setLoading(false);
    }, []);

    // Email yoki Username orqali qidirish
    const findUserByEmailOrUsername = (emailOrUsername) => {
        const users = JSON.parse(localStorage.getItem('socialchat_users') || '[]');
        return users.find(
            u => u.email === emailOrUsername || u.username?.toLowerCase() === emailOrUsername?.toLowerCase()
        );
    };

    const signUp = async (email, password, username, fullName, terms) => {
        try {
            setError(null);
            const users = JSON.parse(localStorage.getItem('socialchat_users') || '[]');

            // Email yoki username mavjudligini tekshirish
            if (users.some(u => u.email === email)) {
                return {error: {message: 'Email already registered'}};
            }

            if (users.some(u => u.username?.toLowerCase() === username?.toLowerCase())) {
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
                password: password, // Vaqtinchalik - Backend ulangandan keyin ochiriladi
            };

            // Mahalliy storage'ga saqlash
            users.push(newUser);
            localStorage.setItem('socialchat_users', JSON.stringify(users));

            const userProfile = {...newUser};
            delete userProfile.password;

            // Token yaratish (vaqtinchalik)
            const token = generateMockToken(newUser);
            localStorage.setItem('socialchat_token', token);
            localStorage.setItem('socialchat_user', JSON.stringify({id: newUser.id, email}));
            localStorage.setItem('socialchat_profile', JSON.stringify(userProfile));

            setUser({id: newUser.id, email});
            setProfile(userProfile);

            return {error: null};
        } catch (e) {
            const errorMsg = 'Registration failed';
            setError(errorMsg);
            return {error: {message: errorMsg}};
        }
    };

    const signIn = async (emailOrUsername, password) => {
        try {
            setError(null);

            // Email yoki Username bilan login
            const foundUser = findUserByEmailOrUsername(emailOrUsername);

            if (!foundUser || foundUser.password !== password) {
                const errorMsg = 'Invalid email/username or password';
                setError(errorMsg);
                return {error: {message: errorMsg}};
            }

            const userProfile = {...foundUser};
            delete userProfile.password;

            // Token yaratish (vaqtinchalik)
            const token = generateMockToken(foundUser);
            localStorage.setItem('socialchat_token', token);
            localStorage.setItem('socialchat_user', JSON.stringify({id: foundUser.id, email: foundUser.email}));
            localStorage.setItem('socialchat_profile', JSON.stringify(userProfile));

            setUser({id: foundUser.id, email: foundUser.email});
            setProfile(userProfile);

            return {error: null};
        } catch (e) {
            const errorMsg = 'Login failed';
            setError(errorMsg);
            return {error: {message: errorMsg}};
        }
    };

    const signOut = async () => {
        try {
            localStorage.removeItem('socialchat_token');
            localStorage.removeItem('socialchat_user');
            localStorage.removeItem('socialchat_profile');
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
            if (updates.username && updates.username !== profile.username) {
                const users = JSON.parse(localStorage.getItem('socialchat_users') || '[]');
                if (users.some(u => u.username?.toLowerCase() === updates.username?.toLowerCase() && u.id !== user.id)) {
                    return {error: {message: 'Username already taken'}};
                }

                const userIndex = users.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                    users[userIndex].username = updates.username.toLowerCase();
                    localStorage.setItem('socialchat_users', JSON.stringify(users));
                }
            }

            const updatedProfile = {...profile, ...updates, updated_at: new Date().toISOString()};
            localStorage.setItem('socialchat_profile', JSON.stringify(updatedProfile));
            setProfile(updatedProfile);

            return {error: null};
        } catch (e) {
            return {error: {message: 'Update failed'}};
        }
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            const users = JSON.parse(localStorage.getItem('socialchat_users') || '[]');
            const userIndex = users.findIndex(u => u.id === user.id);

            if (userIndex === -1 || users[userIndex].password !== currentPassword) {
                return {error: {message: 'Current password is incorrect'}};
            }

            users[userIndex].password = newPassword;
            localStorage.setItem('socialchat_users', JSON.stringify(users));

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
