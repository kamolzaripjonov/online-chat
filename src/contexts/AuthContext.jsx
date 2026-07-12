import {createContext, useContext, useState, useEffect} from 'react';
import api, {socketService} from '../lib/api';

const AuthContext = createContext(undefined);

function normalizeUser(raw) {
    if (!raw) return null;
    return {
        id: raw.id || raw._id,
        _id: raw._id || raw.id,
        email: raw.email || '',
        username: raw.username || '',
        full_name: raw.full_name || raw.fullName || raw.fullname || '',
        avatar_url: raw.avatar_url || raw.avatarUrl || raw.avatar || null,
        bio: raw.bio || null,
        website: raw.website || null,
        is_premium: raw.is_premium ?? raw.isPremium ?? false,
        premium_expires_at: raw.premium_expires_at || raw.premiumExpiresAt || null,
        created_at: raw.created_at || raw.createdAt,
        followers_count: raw.followers_count ?? raw.followersCount ?? 0,
        following_count: raw.following_count ?? raw.followingCount ?? 0,
        posts_count: raw.posts_count ?? raw.postsCount ?? 0,
    };
}

export function AuthProvider({children}) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        console.log('🔍 Checking auth, token:', token ? '✅ Present' : '❌ Missing');

        if (!token) {
            setLoading(false);
            return;
        }

        // 1. Avval localStorage dan o'qish
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                const normalized = normalizeUser(userData);
                setUser(normalized);
                setProfile(normalized);
                console.log('👤 User set from localStorage:', normalized);
            } catch (e) {
                console.warn('⚠️ Failed to parse stored user:', e);
            }
        }

        // 2. Backend dan tekshirish
        try {
            console.log('📡 Fetching user from backend...');
            const response = await api.user.me();
            console.log('📡 Backend response:', response);

            const userInfo = response.data || response;
            const normalized = normalizeUser(userInfo);

            if (!normalized || !normalized.id) {
                throw new Error('User ID is missing from response');
            }

            console.log('✅ User from backend:', normalized);

            setUser(normalized);
            setProfile(normalized);

            // User ID ni localStorage ga saqlash
            localStorage.setItem('user', JSON.stringify(normalized));
            localStorage.setItem('user_id', normalized.id);

            // Socket ulanish
            socketService.connect(normalized.id, token);

        } catch (err) {
            console.error('❌ Auth check failed:', err);
            // Agar backend ishlamasa, localStorage dagi ma'lumotlarni ishlatamiz
            if (!user) {
                localStorage.removeItem('token');
                localStorage.removeItem('user_id');
                setUser(null);
                setProfile(null);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email, password) => {
        setError(null);
        try {
            console.log('🔐 Login attempt:', {email});

            const response = await api.auth.login({email, password});
            console.log('🔐 Login response:', response);

            const {token, user: userInfo} = response;
            if (!token || !userInfo) {
                throw new Error('Invalid response from server');
            }

            const normalized = normalizeUser(userInfo);
            const userId = normalized.id;

            if (!userId) {
                throw new Error('User ID is missing from response');
            }

            console.log('✅ User ID:', userId);

            localStorage.setItem('token', token);
            localStorage.setItem('user_id', userId);
            localStorage.setItem('user', JSON.stringify(normalized));

            setUser(normalized);
            setProfile(normalized);
            socketService.connect(userId, token);

            return {success: true};
        } catch (err) {
            console.error('❌ Login error:', err);
            const msg = err.message || 'Login failed';
            setError(msg);
            return {success: false, error: msg};
        }
    };

    const register = async (data) => {
        setError(null);
        try {
            console.log('📝 Register data:', data);

            const response = await api.auth.register({
                email: data.email,
                password: data.password,
                username: data.username,
                fullName: data.fullName,
                terms: {terms: true, promo: false, age: true},
            });

            console.log('📝 Register response:', response);

            const {token, user: userInfo} = response;
            if (!token || !userInfo) {
                throw new Error('Invalid response from server');
            }

            const normalized = normalizeUser(userInfo);
            const userId = normalized.id;

            if (!userId) {
                throw new Error('User ID is missing from response');
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user_id', userId);
            localStorage.setItem('user', JSON.stringify(normalized));

            setUser(normalized);
            setProfile(normalized);
            socketService.connect(userId, token);

            return {success: true};
        } catch (err) {
            console.error('❌ Register error:', err);
            const msg = err.message || 'Registration failed';
            setError(msg);
            return {success: false, error: msg};
        }
    };

    const logout = () => {
        socketService.disconnect();
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        setProfile(null);
        window.location.href = '/login';
    };

    const updateProfile = async (data) => {
        try {
            const response = await api.user.updateProfile(data);
            const updated = normalizeUser(response.data || response);
            setProfile(updated);
            setUser(updated);
            localStorage.setItem('user', JSON.stringify(updated));
            return {success: true};
        } catch (err) {
            const msg = err.message || 'Update failed';
            return {success: false, error: msg};
        }
    };

    return (
        <AuthContext.Provider
            value={{user, profile, loading, error, login, register, logout, updateProfile, isAuthenticated: !!user}}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}