import React, {createContext, useContext, useState, useEffect} from 'react';

const translations = {
    en: {
        welcome: 'Welcome',
        signIn: 'Sign In',
        signUp: 'Sign Up',
        email: 'Email',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        username: 'Username',
        fullName: 'Full Name',
        noAccount: "Don't have an account?",
        haveAccount: 'Already have an account?',
        login: 'Login',
        register: 'Register',

        termsTitle: 'Terms and Privacy',
        termsText1: 'I agree to the Terms of Service and Privacy Policy',
        termsText2: 'I agree to receive promotional emails',
        termsText3: 'I confirm that I am at least 13 years old',
        agreeAll: 'Agree to All',

        home: 'Home',
        explore: 'Explore',
        create: 'Create',
        chat: 'Chat',
        profile: 'Profile',

        createPost: 'Create Post',
        createStory: 'Create Story',
        addPhoto: 'Add Photo or Video',
        writeCaption: 'Write a caption...',
        share: 'Share',
        post: 'Post',
        story: 'Story',
        whatShare: 'What would you like to share?',
        posts: 'Posts',
        stories: 'Stories',
        likes: 'likes',
        comments: 'comments',
        views: 'views',
        addComment: 'Add a comment...',
        reply: 'Reply',
        noPosts: 'No posts yet',
        noStories: 'No stories yet',
        beFirst: 'Be the first to share something!',

        editProfile: 'Edit Profile',
        followers: 'Followers',
        following: 'Following',
        premium: 'Premium',
        accountSettings: 'Account Settings',
        privacySecurity: 'Privacy & Security',
        notifications: 'Notifications',
        helpCenter: 'Help Center',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        language: 'Language',
        logOut: 'Log Out',
        bio: 'Bio',
        website: 'Website',
        save: 'Save',
        cancel: 'Cancel',
        accountStats: 'Account Statistics',
        totalViews: 'Total Views',
        totalLikes: 'Total Likes',
        totalComments: 'Total Comments',
        activityLog: 'Activity',

        newNotif: 'New Notification',
        likedYourPost: 'liked your post',
        commentedOnYourPost: 'commented on your post',
        repliedToComment: 'replied to your comment',
        noNotifications: 'No notifications yet',

        calling: 'Calling...',
        videoCall: 'Video Call',
        voiceCall: 'Voice Call',
        endCall: 'End Call',
        mute: 'Mute',
        unmute: 'Unmute',
        videoOn: 'Video On',
        videoOff: 'Video Off',

        settings: 'Settings',
        upgradePremium: 'Upgrade to Premium',
        unlimitedCalls: 'Unlimited video calls & more',

        noConversations: 'No conversations yet',
        startChat: 'Search users to start chatting!',
        typeMessage: 'Type a message...',
    },
    ru: {
        welcome: 'Добро пожаловать',
        signIn: 'Войти',
        signUp: 'Регистрация',
        email: 'Электронная почта',
        password: 'Пароль',
        confirmPassword: 'Подтвердите пароль',
        username: 'Имя пользователя',
        fullName: 'Полное имя',
        noAccount: 'Нет аккаунта?',
        haveAccount: 'Уже есть аккаунт?',
        login: 'Войти',
        register: 'Зарегистрироваться',

        termsTitle: 'Условия и конфиденциальность',
        termsText1: 'Я принимаю Условия использования и Политику конфиденциальности',
        termsText2: 'Я согласен получать рекламные электронные письма',
        termsText3: 'Подтверждаю, что мне не менее 13 лет',
        agreeAll: 'Принять всё',

        home: 'Главная',
        explore: 'Обзор',
        create: 'Создать',
        chat: 'Чат',
        profile: 'Профиль',

        createPost: 'Создать пост',
        createStory: 'Создать историю',
        addPhoto: 'Добавить фото или видео',
        writeCaption: 'Напишите подпись...',
        share: 'Поделиться',
        post: 'Пост',
        story: 'История',
        whatShare: 'Чем хотите поделиться?',
        posts: 'Посты',
        stories: 'Истории',
        likes: 'лайков',
        comments: 'комментариев',
        views: 'просмотров',
        addComment: 'Добавить комментарий...',
        reply: 'Ответить',
        noPosts: 'Пока нет постов',
        noStories: 'Пока нет историй',
        beFirst: 'Станьте первым, кто поделится!',

        editProfile: 'Редактировать профиль',
        followers: 'Подписчики',
        following: 'Подписки',
        premium: 'Премиум',
        accountSettings: 'Настройки аккаунта',
        privacySecurity: 'Приватность и безопасность',
        notifications: 'Уведомления',
        helpCenter: 'Справка',
        darkMode: 'Тёмная тема',
        lightMode: 'Светлая тема',
        language: 'Язык',
        logOut: 'Выйти',
        bio: 'О себе',
        website: 'Сайт',
        save: 'Сохранить',
        cancel: 'Отмена',
        accountStats: 'Статистика аккаунта',
        totalViews: 'Всего просмотров',
        totalLikes: 'Всего лайков',
        totalComments: 'Всего комментариев',
        activityLog: 'Активность',

        newNotif: 'Новое уведомление',
        likedYourPost: 'оценил ваш пост',
        commentedOnYourPost: 'прокомментировал ваш пост',
        repliedToComment: 'ответил на ваш комментарий',
        noNotifications: 'Нет уведомлений',

        calling: 'Звонок...',
        videoCall: 'Видеозвонок',
        voiceCall: 'Голосовой звонок',
        endCall: 'Завершить',
        mute: 'Выключить микрофон',
        unmute: 'Включить микрофон',
        videoOn: 'Включить камеру',
        videoOff: 'Выключить камеру',

        settings: 'Настройки',
        upgradePremium: 'Обновить до Premium',
        unlimitedCalls: 'Безлимитные видеозвонки и многое другое',

        noConversations: 'Нет диалогов',
        startChat: 'Найдите пользователей для общения!',
        typeMessage: 'Введите сообщение...',
    }
};

const LanguageContext = createContext(undefined);

export function LanguageProvider({children}) {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('manga_language');
        return saved || 'en';
    });

    useEffect(() => {
        localStorage.setItem('manga_language', language);
    }, [language]);

    const t = (key) => {
        return translations[language][key] || key;
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ru' : 'en');
    };

    return (
        <LanguageContext.Provider value={{language, setLanguage, t, toggleLanguage}}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
}
