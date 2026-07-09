import React, {useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';
import {useTheme} from '../contexts/ThemeContext';
import {MessageCircle, Video, Users, Eye, EyeOff, Mail, AtSign, Check} from 'lucide-react';

export default function AuthPage() {
    const {t} = useLanguage();
    const {login, register, loading} = useAuth();
    const {isDarkMode} = useTheme();

    const [isLogin, setIsLogin] = useState(true);
    const [loginInput, setLoginInput] = useState('');
    const [inputType, setInputType] = useState('email');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
    const handleLoginInputChange = (e) => {
        const value = e.target.value;
        setLoginInput(value);
        setInputType(value.includes('@') ? 'email' : 'username');
    };
    const switchMode = () => {
        setIsLogin(!isLogin);
        setError(null);
        setShowPassword(false);
        setLoginInput('');
        setPassword('');
        setConfirmPassword('');
        setUsername('');
        setFullName('');
        setEmail('');
        setInputType('email');
        setTermsAccepted(false);
        setPromoAccepted(false);
        setAgeConfirmed(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            if (isLogin) {
                if (!loginInput.trim() || !password) {
                    setError('Please fill in all fields');
                    setIsSubmitting(false);
                    return;
                }
                const result = await login(loginInput, password);
                if (!result.success) setError(result.error || 'Login failed');
                else window.location.href = '/';
            } else {
                if (!email.trim() || !password || !username.trim() || !fullName.trim()) {
                    setError('All fields are required');
                    setIsSubmitting(false);
                    return;
                }
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setIsSubmitting(false);
                    return;
                }
                if (password.length < 6) {
                    setError('Password must be at least 6 characters');
                    setIsSubmitting(false);
                    return;
                }
                if (!allTermsAccepted) {
                    setError('You must accept the required terms');
                    setIsSubmitting(false);
                    return;
                }
                const result = await register({
                    email,
                    password,
                    username: username.toLowerCase().trim(),
                    fullName: fullName.trim(),
                    terms: {terms: termsAccepted, promo: promoAccepted, age: ageConfirmed}
                });
                if (!result.success) setError(result.error || 'Registration failed');
                else window.location.href = '/';
            }
        } catch (err) {
            setError(err.message || 'An unexpected error occurred');
        }
        setIsSubmitting(false);
    };

    return (
        <div
            className={`min-h-screen min-h-[100dvh] flex items-center justify-center p-4 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900' : 'bg-gradient-to-br from-slate-100 via-blue-100 to-slate-100'}`}>
            <div className="w-full max-w-md pb-4">
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <Video className={`w-10 h-10 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}/>
                        <h1 className={`text-3xl sm:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Social
                            Chat</h1>
                    </div>
                    <p className={isDarkMode ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>Connect, Chat, and
                        Video Call</p>
                    <div className="flex justify-center gap-6 mt-4">
                        <div className="text-center"><MessageCircle
                            className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'} mx-auto mb-1`}/><span
                            className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Instant Chat</span>
                        </div>
                        <div className="text-center"><Video
                            className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'} mx-auto mb-1`}/><span
                            className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Video Calls</span>
                        </div>
                        <div className="text-center"><Users
                            className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} mx-auto mb-1`}/><span
                            className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Social Feed</span>
                        </div>
                    </div>
                </div>

                <div
                    className={`${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200'} backdrop-blur-xl rounded-2xl p-5 sm:p-6 shadow-2xl border`}>
                    <h2 className={`text-xl sm:text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'} mb-5 text-center`}>{isLogin ? t('signIn') : t('signUp')}</h2>

                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        {isLogin && (
                            <div>
                                <label
                                    className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1.5`}>Email
                                    or Username</label>
                                <div className="relative">
                                    <input type="text" value={loginInput} onChange={handleLoginInputChange}
                                           placeholder="example@mail.com or username"
                                           className={`w-full px-4 py-2.5 pl-10 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-500' : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-gray-400'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base`}
                                           autoComplete="off" disabled={isSubmitting}/>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                        {inputType === 'email' ? <Mail
                                                className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}/> :
                                            <AtSign
                                                className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}/>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isLogin && (
                            <>
                                <div><label
                                    className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1.5`}>{t('email')}</label><input
                                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full px-4 py-2.5 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-500' : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-gray-400'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base`}
                                    placeholder="you@example.com" autoComplete="off" disabled={isSubmitting}/></div>
                                <div><label
                                    className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1.5`}>{t('username')}</label><input
                                    type="text" value={username}
                                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    className={`w-full px-4 py-2.5 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-500' : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-gray-400'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base`}
                                    placeholder="username" autoComplete="off" disabled={isSubmitting}/></div>
                                <div><label
                                    className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1.5`}>{t('fullName')}</label><input
                                    type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                    className={`w-full px-4 py-2.5 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-500' : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-gray-400'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base`}
                                    placeholder="Your Name" autoComplete="off" disabled={isSubmitting}/></div>
                            </>
                        )}

                        <div>
                            <label
                                className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1.5`}>{t('password')}</label>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} value={password}
                                       onChange={(e) => setPassword(e.target.value)}
                                       className={`w-full px-4 py-2.5 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-500' : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-gray-400'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base`}
                                       placeholder="••••••••" autoComplete="off" disabled={isSubmitting}/>
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-slate-800'}`}
                                        disabled={isSubmitting}>{showPassword ? <EyeOff className="w-4 h-4"/> :
                                    <Eye className="w-4 h-4"/>}</button>
                            </div>
                        </div>

                        {!isLogin && (
                            <div><label
                                className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-1.5`}>{t('confirmPassword')}</label><input
                                type="password" value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={`w-full px-4 py-2.5 ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white placeholder-gray-500' : 'bg-slate-100 border-slate-300 text-slate-800 placeholder-gray-400'} border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base`}
                                placeholder="••••••••" autoComplete="off" disabled={isSubmitting}/></div>
                        )}

                        {!isLogin && (
                            <div
                                className={`${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-100'} rounded-xl p-3.5 space-y-2.5`}>
                                <button type="button" onClick={handleAgreeAll}
                                        className={`w-full ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} font-semibold text-sm flex items-center justify-center gap-2 hover:underline`}
                                        disabled={isSubmitting}>
                                    <Check className="w-4 h-4"/> {t('agreeAll')}
                                </button>
                                <div className="space-y-1.5">
                                    <label className="flex items-start gap-2.5 cursor-pointer"><input type="checkbox"
                                                                                                      checked={termsAccepted}
                                                                                                      onChange={(e) => setTermsAccepted(e.target.checked)}
                                                                                                      className="mt-0.5 w-4 h-4 rounded border-slate-600"
                                                                                                      disabled={isSubmitting}/><span
                                        className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('termsText1')} *</span></label>
                                    <label className="flex items-start gap-2.5 cursor-pointer"><input type="checkbox"
                                                                                                      checked={promoAccepted}
                                                                                                      onChange={(e) => setPromoAccepted(e.target.checked)}
                                                                                                      className="mt-0.5 w-4 h-4 rounded border-slate-600"
                                                                                                      disabled={isSubmitting}/><span
                                        className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('termsText2')}</span></label>
                                    <label className="flex items-start gap-2.5 cursor-pointer"><input type="checkbox"
                                                                                                      checked={ageConfirmed}
                                                                                                      onChange={(e) => setAgeConfirmed(e.target.checked)}
                                                                                                      className="mt-0.5 w-4 h-4 rounded border-slate-600"
                                                                                                      disabled={isSubmitting}/><span
                                        className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{t('termsText3')} *</span></label>
                                </div>
                            </div>
                        )}

                        {error && <div
                            className="bg-red-500/20 border border-red-500/50 rounded-lg p-2.5 text-red-400 text-sm">{error}</div>}

                        <button type="submit" disabled={isSubmitting || loading}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-base">
                            {isSubmitting || loading ? 'Please wait...' : isLogin ? t('signIn') : t('signUp')}
                        </button>
                    </form>

                    <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-5 text-sm`}>
                        {isLogin ? t('noAccount') : t('haveAccount')}
                        <button onClick={switchMode}
                                className={`ml-1.5 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} font-medium transition`}
                                disabled={isSubmitting}>
                            {isLogin ? t('signUp') : t('signIn')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}