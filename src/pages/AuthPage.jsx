import {useState} from 'react';
import {useAuth} from '../contexts/AuthContext';
import {useTheme} from '../contexts/ThemeContext';
import {useLanguage} from '../contexts/LanguageContext';
import {MessageCircle, Eye, EyeOff} from 'lucide-react';

export default function AuthPage() {
    const {login, register} = useAuth();
    const {isDarkMode} = useTheme();
    const {t} = useLanguage();
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        full_name: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (mode === 'register') {
            if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
                setError(t('fillAllFields'));
                return;
            }
            if (!acceptedTerms || !acceptedPrivacy) {
                setError(t('acceptTerms'));
                return;
            }
        } else {
            if (!formData.email.trim() || !formData.password.trim()) {
                setError(t('fillAllFields'));
                return;
            }
        }

        setLoading(true);
        try {
            if (mode === 'register') {
                await register(formData);
            } else {
                await login(formData.email, formData.password);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || t('authError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className={`min-h-screen flex flex-col items-center justify-center px-6 ${isDarkMode ? 'bg-slate-950' : 'bg-gray-50'} theme-transition`}>
            <div className="w-full max-w-sm">
                <div className="flex flex-col items-center mb-8">
                    <div
                        className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center mb-3">
                        <MessageCircle className="w-8 h-8 text-white"/>
                    </div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Social Chat</h1>
                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{mode === 'login' ? t('loginSubtitle') : t('registerSubtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {mode === 'register' && (
                        <input
                            type="text"
                            placeholder={t('username')}
                            value={formData.username}
                            onChange={(e) => setFormData({...formData, username: e.target.value})}
                            className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                    )}
                    {mode === 'register' && (
                        <input
                            type="text"
                            placeholder={t('fullName')}
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                    )}
                    <input
                        type="email"
                        placeholder={t('email')}
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder={t('password')}
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className={`w-full px-4 py-3 rounded-xl border pr-11 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2">
                            {showPassword ?
                                <EyeOff className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}/> :
                                <Eye className={`w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}/>}
                        </button>
                    </div>

                    {mode === 'register' && (
                        <div className="space-y-2 pt-1">
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" checked={acceptedTerms}
                                       onChange={(e) => setAcceptedTerms(e.target.checked)} className="mt-0.5"/>
                                <span
                                    className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('acceptTermsLabel')}</span>
                            </label>
                            <label className="flex items-start gap-2 cursor-pointer">
                                <input type="checkbox" checked={acceptedPrivacy}
                                       onChange={(e) => setAcceptedPrivacy(e.target.checked)} className="mt-0.5"/>
                                <span
                                    className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{t('acceptPrivacyLabel')}</span>
                            </label>
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold disabled:opacity-50 hover:opacity-90 transition"
                    >
                        {loading ? '...' : mode === 'login' ? t('login') : t('register')}
                    </button>
                </form>

                <p className={`text-center text-sm mt-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {mode === 'login' ? t('noAccount') : t('haveAccount')}{' '}
                    <button onClick={() => {
                        setMode(mode === 'login' ? 'register' : 'login');
                        setError('');
                    }} className="text-blue-500 font-semibold">
                        {mode === 'login' ? t('register') : t('login')}
                    </button>
                </p>
            </div>
        </div>
    );
}
