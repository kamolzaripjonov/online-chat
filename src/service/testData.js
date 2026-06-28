export const TEST_USERS = [
    {
        id: 'test-user-1',
        email: 'test@example.com',
        username: 'testuser',
        fullName: 'Test User',
        password: 'test1234',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=testuser',
        bio: 'Test account',
        is_premium: false,
    },
    {
        id: 'test-user-2',
        email: 'demo@example.com',
        username: 'demouser',
        fullName: 'Demo User',
        password: 'demo1234',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demouser',
        bio: 'Demo account',
        is_premium: true,
    },
    {
        id: 'test-user-3',
        email: 'admin@example.com',
        username: 'admin',
        fullName: 'Admin User',
        password: 'admin1234',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
        bio: 'Admin account',
        is_premium: true,
    },
];

export const generateMockToken = (user) => {
    const payload = btoa(JSON.stringify({
        id: user.id,
        email: user.email,
        username: user.username,
    }));
    return `mock_token_${payload}`;
};
