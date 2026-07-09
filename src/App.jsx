import React from 'react';
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {ThemeProvider} from './contexts/ThemeContext.jsx';
import {LanguageProvider} from './contexts/LanguageContext.jsx';
import {AuthProvider} from './contexts/AuthContext';
import AuthPage from './pages/AuthPage.jsx';
import AppContent from './components/AppContent.jsx';

export default function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <AuthProvider>
                    <BrowserRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}}>
                        <Routes>
                            <Route path="/login" element={<AuthPage/>}/>
                            <Route path="/register" element={<AuthPage/>}/>
                            <Route path="/profile" element={<AppContent/>}/>
                            <Route path="/profile/:username" element={<AppContent/>}/>
                            <Route path="/" element={<AppContent/>}/>
                            <Route path="*" element={<Navigate to="/"/>}/>
                        </Routes>
                    </BrowserRouter>
                </AuthProvider>
            </LanguageProvider>
        </ThemeProvider>
    );
}