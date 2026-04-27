import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import './ChatConsultant.css';

interface Message {
  id: number;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

const ChatConsultant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLabel, setShowLabel] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Chào bạn! Tôi là chuyên gia tư vấn kỹ thuật của Gà Giống Sâm Oanh. Gà của bạn đang gặp vấn đề gì về sức khỏe hay cần tư vấn kỹ thuật chăn nuôi không?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowLabel(false);
    }
  }, [isOpen, messages]);

  useEffect(() => {
    // Hide label after 10 seconds if not clicked
    const timer = setTimeout(() => setShowLabel(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now() + 1,
        text: 'Cảm ơn bạn đã đặt câu hỏi. Chuyên gia của chúng tôi đã nhận được thông tin và sẽ phản hồi chi tiết cho bạn ngay trong ít phút nữa qua kênh này hoặc số điện thoại bạn đã đăng ký. Bạn có thể để lại số điện thoại để chúng tôi gọi lại tư vấn trực tiếp không?',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1500);
  };

  return (
    <div className="chat-consultant-container">
      {showLabel && !isOpen && (
        <div className="consultant-label">
          Tư vấn bệnh gà miễn phí!
        </div>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-info">
              <div className="bot-avatar">🐔</div>
              <div className="bot-status">
                <h4>Hỗ Trợ Kỹ Thuật</h4>
                <span><div className="status-dot"></div> Đang trực tuyến</span>
              </div>
            </div>
            <button className="close-chat" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input 
              type="text" 
              placeholder="Nhập câu hỏi của bạn..." 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button type="submit" className="send-btn">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button className="chat-trigger" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        {!isOpen && <div className="chat-badge"></div>}
      </button>
    </div>
  );
};

export default ChatConsultant;
