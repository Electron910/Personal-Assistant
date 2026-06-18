import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { getHistory, sendMessage } from '../api/chat.api';

const ChatWindow = ({ currentSessionId, onSessionCreated, user }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!currentSessionId) {
        setMessages([]);
        return;
      }
      try {
        const history = await getHistory(currentSessionId);
        setMessages(history);
      } catch (error) {
        console.error('Failed to load chat history:', error);
      }
    };
    fetchHistory();
  }, [currentSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content) => {
    // Optimistic UI update
    const newMsg = { _id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, newMsg]);
    setLoading(true);

    try {
      const response = await sendMessage(content, currentSessionId);
      setMessages(prev => [...prev, response]);
      if (response.sessionId && !currentSessionId) {
        onSessionCreated(response.sessionId);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMsg = error.response?.data?.message || 'Failed to send message. Please check the server logs.';
      setMessages(prev => [...prev, { _id: Date.now().toString(), role: 'assistant', content: `Error: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUploadSuccess = async () => {
    // Inject a message prompting the AI to summarize the new file
    await handleSendMessage("I just uploaded a new file. Please read its contents and tell me what it's about, or confirm you have access to it.");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#212121] transition-colors duration-300">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-100">
              Welcome back, {user?.name || user?.email?.split('@')[0]}!
            </h2>
            <p className="text-gray-500 dark:text-gray-400">What would you like to do today?</p>
          </div>
        )}
        
        {messages.filter(m => (m.role === 'user' || m.role === 'assistant') && m.content).map((msg) => (
          <MessageBubble key={msg._id} role={msg.role} content={msg.content} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 rounded-2xl px-4 py-2 animate-pulse">
              Typing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-white dark:bg-[#212121] transition-colors duration-300">
        <ChatInput onSendMessage={handleSendMessage} disabled={loading} onUploadSuccess={handleFileUploadSuccess} />
      </div>
    </div>
  );
};

export default ChatWindow;
