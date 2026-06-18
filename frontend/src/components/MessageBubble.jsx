import React from 'react';
import ReactMarkdown from 'react-markdown';

const MessageBubble = ({ role, content }) => {
  const isUser = role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
          isUser 
            ? 'bg-emerald-600 text-white rounded-br-none' 
            : 'bg-white text-slate-800 border border-gray-200 rounded-bl-none transition-colors duration-300'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-emerald">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
