import { useState, useEffect, useRef } from 'react';
import api from '../service/api';
import { socketService } from '../service/socket';

const ChatRoom = ({ receiverId }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/messages/${receiverId}`);
                setMessages(response.data);
            } catch (error) {
                console.error('Messages fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();

        // Socket orqali yangi xabarlarni eshitish
        socketService.onNewMessage((newMessage) => {
            if (newMessage.senderId === receiverId || newMessage.receiverId === receiverId) {
                setMessages(prev => [...prev, newMessage]);
            }
        });

        // Xabar yuborilganini eshitish
        socketService.onMessageSent((sentMessage) => {
            setMessages(prev => [...prev, sentMessage]);
        });

        return () => {
            socketService.off('newMessage');
            socketService.off('messageSent');
        };
    }, [receiverId]);

    // Xabar yuborish
    const sendMessage = async () => {
        if (!inputMessage.trim()) return;

        const messageData = {
            senderId: user._id,
            receiverId: receiverId,
            content: inputMessage,
            type: 'text'
        };

        // Socket orqali yuborish
        socketService.sendMessage(messageData);
        setInputMessage('');
    };

    // Avtomatik scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (loading) return <div>Xabarlar yuklanmoqda...</div>;

    return (
        <div className="chat-room">
            <div className="messages-container">
                {messages.map((message, index) => (
                    <MessageBubble key={message._id || index} message={message} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="message-input-container">
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Xabar yozing..."
                />
                <button onClick={sendMessage}>Yuborish</button>
            </div>
        </div>
    );
};

export default ChatRoom;