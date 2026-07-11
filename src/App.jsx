import {ThemeProvider} from './contexts/ThemeContext';
import {LanguageProvider} from './contexts/LanguageContext';
import {AuthProvider} from './contexts/AuthContext';
import AppContent from './components/AppContent';

export default function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <AuthProvider>
                    <AppContent/>
                </AuthProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}
