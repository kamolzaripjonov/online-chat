import {createContext, useContext, useState, useEffect} from 'react';
import api, {socketService} from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await api.auth.login({email, password});
            const {token, user: userInfo} = response;
            if (!token || !userInfo) throw new Error('Invalid response');

            const userId = userInfo.id || userInfo._id;
            localStorage.setItem('token', token);
            localStorage.setItem('user_id', userId);
            localStorage.setItem('user', JSON.stringify(userInfo));
            localStorage.setItem('profile', JSON.stringify(userInfo));

            setUser(userInfo);
            setProfile(userInfo);
            socketService.connect(userId, token);

            return {success: true};
        } catch (error) {
            setError(error.message);
            return {success: false, error: error.message};
        }
    };

    const register = async (userData) => {
        try {
            setError(null);
            const response = await api.auth.register(userData);
            const {token, user: userInfo} = response;
            if (!token || !userInfo) throw new Error('Invalid response');

            const userId = userInfo.id || userInfo._id;
            localStorage.setItem('token', token);
            localStorage.setItem('user_id', userId);
            localStorage.setItem('user', JSON.stringify(userInfo));
            localStorage.setItem('profile', JSON.stringify(userInfo));

            setUser(userInfo);
            setProfile(userInfo);
            socketService.connect(userId, token);

            return {success: true};
        } catch (error) {
            setError(error.message);
            return {success: false, error: error.message};
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
            const updated = response.data || response;
            setProfile(updated);
            setUser(updated);
            localStorage.setItem('profile', JSON.stringify(updated));
            localStorage.setItem('user', JSON.stringify(updated));
            return {success: true};
        } catch (error) {
            return {success: false, error: error.message};
        }
    };

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                setUser(userData);
                setProfile(userData);
            } catch (e) {
            }
        }

        try {
            const response = await api.user.me();
            const userInfo = response.data || response;
            const userId = userInfo.id || userInfo._id;
            setUser(userInfo);
            setProfile(userInfo);
            localStorage.setItem('user', JSON.stringify(userInfo));
            localStorage.setItem('profile', JSON.stringify(userInfo));
            localStorage.setItem('user_id', userId);
            socketService.connect(userId, token);
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const value = {
        user,
        profile,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        setError,
        isAuthenticated: !!user
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};