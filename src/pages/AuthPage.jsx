import React, {useState, useEffect} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';
import {MessageCircle, Video, Users, Check, Eye, EyeOff, Mail, AtSign} from 'lucide-react';

export default function AuthPage() {
    const {t} = useLanguage();
    const {signIn, signUp} = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [loginInput, setLoginInput] = useState('');
    const [inputType, setInputType] = useState('email'); // 'email' yoki 'username'
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [termsAccepted, setTermsAccepted] = useState(false);
    const [promoAccepted, setPromoAccepted] = useState(false);
    const [ageConfirmed, setAgeConfirmed] = useState(false);

    const allTermsAccepted = termsAccepted && ageConfirmed;

    const handleAgreeAll = () => {
        setTermsAccepted(true);
        setPromoAccepted(true);
        setAgeConfirmed(true);
    };

    // Login input o'zgartirilganda input turini aniqlash
    const handleLoginInputChange = (e) => {
        const value = e.target.value;
        setLoginInput(value);

        // Email yoki Username ekanligini aniqlash
        if (value.includes('@')) {
            setInputType('email');
        } else {
            setInputType('username');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isLogin) {
                if (!loginInput.trim() || !password) {
                    setError('Please fill in all fields');
                    setLoading(false);
                    return;
                }

                // Backend ga username yoki email yuborish
                const loginData = inputType === 'email'
                    ? {email: loginInput, password}
                    : {email: loginInput, password}; // Backend o'z ichida handle qiladi

                const {error} = await signIn(loginInput, password);
                if (error) setError(error.message);
            } else {
                if (!email.trim() || !password || !username.trim() || !fullName.trim()) {
                    setError('All fields are required');
                    setLoading(false);
                    return;
                }

                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }

                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }

                if (!allTermsAccepted) {
                    setError('You must accept the required terms');
                    setLoading(false);
                    return;
                }

                const {error} = await signUp(email, password, username, fullName, {
                    terms: termsAccepted,
                    promo: promoAccepted,
                    age: ageConfirmed
                });

                if (error) setError(error.message);
            }
        } catch (e) {
            setError('An unexpected error occurred');
        }

        setLoading(false);
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 dark:from-slate-100 dark:via-blue-100 dark:to-slate-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <Video className="w-10 h-10 text-blue-400 dark:text-blue-600"/>
                        <h1 className="text-4xl font-bold text-white dark:text-slate-800">Social Chat</h1>
                    </div>
                    <p className="text-gray-400 dark:text-gray-600">Connect, Chat, and Video Call</p>
                    <div className="flex justify-center gap-8 mt-6">
                        <div className="text-center">
                            <MessageCircle className="w-6 h-6 text-blue-400 dark:text-blue-600 mx-auto mb-1"/>
                            <span className="text-xs text-gray-400 dark:text-gray-600">Instant Chat</span>
                        </div>
                        <div className="text-center">
                            <Video className="w-6 h-6 text-green-400 dark:text-green-600 mx-auto mb-1"/>
                            <span className="text-xs text-gray-400 dark:text-gray-600">Video Calls</span>
                        </div>
                        <div className="text-center">
                            <Users className="w-6 h-6 text-purple-400 dark:text-purple-600 mx-auto mb-1"/>
                            <span className="text-xs text-gray-400 dark:text-gray-600">Social Feed</span>
                        </div>
                    </div>
                </div>

                <div
                    className="bg-slate-800/50 dark:bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-700 dark:border-slate-200">
                    <h2 className="text-2xl font-semibold text-white dark:text-slate-800 mb-6 text-center">
                        {isLogin ? t('signIn') : t('signUp')}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 dark:text-gray-600 mb-2">
                                    Email or Username
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={loginInput}
                                        onChange={handleLoginInputChange}
                                        placeholder="example@mail.com or username"
                                        className="w-full px-4 py-3 pl-10 bg-slate-700/50 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        {inputType === 'email' ? (
                                            <Mail className="w-5 h-5 text-gray-400"/>
                                        ) : (
                                            <AtSign className="w-5 h-5 text-gray-400"/>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {inputType === 'email' ? '📧 Email mode' : '👤 Username mode'}
                                </p>
                            </div>
                        )}

                        {!isLogin && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 dark:text-gray-600 mb-1">
                                        {t('email')}
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700/50 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-300 dark:text-gray-600 mb-1">{t('username')}</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        className="w-full px-4 py-3 bg-slate-700/50 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="username"
                                        required
                                    />
                                </div>
                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-300 dark:text-gray-600 mb-1">{t('fullName')}</label>
                                    <input
                                        type="text"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-700/50 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Your Name"
                                        required
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label
                                className="block text-sm font-medium text-gray-300 dark:text-gray-600 mb-1">{t('password')}</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-700/50 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white dark:hover:text-slate-800"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-300 dark:text-gray-600 mb-1">{t('confirmPassword')}</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-700/50 dark:bg-slate-100 border border-slate-600 dark:border-slate-300 rounded-lg text-white dark:text-slate-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        )}

                        {!isLogin && (
                            <div className="bg-blue-500/10 dark:bg-blue-100 rounded-xl p-4 space-y-3">
                                <button
                                    type="button"
                                    onClick={handleAgreeAll}
                                    className="w-full text-blue-400 dark:text-blue-600 font-semibold text-sm flex items-center justify-center gap-2 hover:underline"
                                >
                                    <Check className="w-4 h-4"/>
                                    {t('agreeAll')}
                                </button>

                                <div className="space-y-2">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-slate-600"
                                            required
                                        />
                                        <span
                                            className="text-sm text-gray-300 dark:text-gray-700">{t('termsText1')} *</span>
                                    </label>

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={promoAccepted}
                                            onChange={(e) => setPromoAccepted(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-slate-600"
                                        />
                                        <span
                                            className="text-sm text-gray-300 dark:text-gray-700">{t('termsText2')}</span>
                                    </label>

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={ageConfirmed}
                                            onChange={(e) => setAgeConfirmed(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-slate-600"
                                            required
                                        />
                                        <span
                                            className="text-sm text-gray-300 dark:text-gray-700">{t('termsText3')} *</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Please wait...' : isLogin ? t('signIn') : t('signUp')}
                        </button>
                    </form>

                    <p className="text-center text-gray-400 dark:text-gray-600 mt-6">
                        {isLogin ? t('noAccount') : t('haveAccount')}
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setShowPassword(false);
                                setLoginInput('');
                                setInputType('email');
                            }}
                            className="ml-2 text-blue-400 dark:text-blue-600 hover:text-blue-300 dark:hover:text-blue-500 font-medium transition"
                        >
                            {isLogin ? t('signUp') : t('signIn')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}