import React, {createContext, useContext, useState, useEffect} from 'react';

const ThemeContext = createContext(undefined);

export function ThemeProvider({children}) {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('manga_dark_mode');
        return saved !== 'false';
    });

    useEffect(() => {
        localStorage.setItem('manga_dark_mode', isDarkMode.toString());
        document.documentElement.classList.toggle('dark', isDarkMode);
        document.documentElement.classList.toggle('light', !isDarkMode);
    }, [isDarkMode]);

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    return <ThemeContext.Provider value={{isDarkMode, setIsDarkMode, toggleTheme}}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
}