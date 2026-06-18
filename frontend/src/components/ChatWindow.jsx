import React, { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { getHistory, sendMessage } from '../api/chat.api';
import { Bot, Sparkles } from 'lucide-react';

const ChatWindow = ({ currentSessionId, onSessionCreated, user }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

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
    await handleSendMessage("I just uploaded a new file. Please read its contents and tell me what it's about, or confirm you have access to it.");
  };

  const firstName = user?.name || user?.email?.split('@')[0] || 'there';

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3">

        {/* ── Animated empty/welcome state ── */}
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-5 px-4">
            {/* Floating bot icon */}
            <div
              className="animate-scale-in w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200"
              style={{ animation: 'scaleIn 0.5s cubic-bezier(0.22,1,0.36,1) both' }}
            >
              <Bot size={32} className="text-white" />
            </div>

            <div className="animate-fade-slide-up delay-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                Hi, {firstName}! 👋
              </h2>
              <p className="text-slate-500 text-sm sm:text-base max-w-sm">
                I'm your personal AI assistant. Ask me anything — I'm here to help.
              </p>
            </div>

            {/* Suggestion chips */}
            <div className="animate-fade-slide-up delay-200 flex flex-wrap gap-2 justify-center max-w-md">
              {[
                '✏️ Help me write something',
                '🔍 Explain a concept',
                '📁 Analyze a file',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendMessage(chip.slice(3))}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-slate-600 hover:border-emerald-400 hover:text-emerald-700 hover:bg-emerald-50 transition-all duration-200 shadow-sm hover:shadow active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages
          .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content)
          .map((msg) => (
            <MessageBubble key={msg._id} role={msg.role} content={msg.content} />
          ))}

        {/* ── Typing indicator with animated dots ── */}
        {loading && (
          <div className="flex justify-start animate-fade-slide-in">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 bg-white border-t border-gray-100">
        <ChatInput
          onSendMessage={handleSendMessage}
          disabled={loading}
          onUploadSuccess={handleFileUploadSuccess}
        />
      </div>
    </div>
  );
};

export default ChatWindow;

