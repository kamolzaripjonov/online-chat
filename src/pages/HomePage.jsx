import {useState, useEffect} from 'react';
import api from '../service/api';
import PostCard from "../components/PostCard.jsx";

const HomePage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                setLoading(true);
                const response = await api.get('/posts');
                setPosts(response.data);
                setError(null);
            } catch (err) {
                setError('Postlarni yuklashda xatolik');
                console.error('Posts fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const createPost = async (content, image) => {
        try {
            const response = await api.post('/posts', {content, image});
            setPosts([response.data, ...posts]);
            return {success: true};
        } catch (error) {
            return {success: false, error: error.response?.data?.message};
        }
    };

    // Postni o'chirish
    const deletePost = async (postId) => {
        try {
            await api.delete(`/posts/${postId}`);
            setPosts(posts.filter(post => post._id !== postId));
            return {success: true};
        } catch (error) {
            return {success: false, error: error.response?.data?.message};
        }
    };

    if (loading) return <div className="loading-spinner">Yuklanmoqda...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="home-page">
            {posts.map(post => (
                <PostCard
                    key={post._id}
                    post={post}
                    onDelete={deletePost}
                />
            ))}
        </div>
    );
};

export default HomePage;