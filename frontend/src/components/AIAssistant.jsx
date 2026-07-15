import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon } from 'lucide-react';

const AIAssistant = ({ messages, onSendMessage, isTyping, connected }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && connected && !isTyping) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2 style={{margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          <Bot size={24} color="var(--primary-color)" /> AI Assistant
        </h2>
        <p style={{margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem'}}>
          {connected ? '🟢 Connected to LangGraph' : '🔴 Disconnected'}
        </p>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        
        {isTyping && (
          <div className="message ai">
            <div className="typing-indicator">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-container" onSubmit={handleSubmit}>
        <input 
          type="text" 
          className="chat-input"
          placeholder={connected ? "Provide meeting notes or request updates..." : "Connecting to server..."}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!connected || isTyping}
        />
        <button 
          type="submit" 
          className="chat-submit"
          disabled={!inputValue.trim() || !connected || isTyping}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};

export default AIAssistant;
