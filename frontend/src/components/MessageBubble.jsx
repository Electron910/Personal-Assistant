import React from 'react';
import ReactMarkdown from 'react-markdown';

const MessageBubble = ({ role, content }) => {
  const isUser = role === 'user';

  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} ${
        isUser ? 'animate-slide-in-right' : 'animate-fade-slide-in'
      }`}
    >
      <div
        className={`max-w-[80%] sm:max-w-[75%] rounded-2xl px-4 sm:px-5 py-3 shadow-sm transition-shadow hover:shadow-md ${
          isUser
            ? 'bg-emerald-600 text-white rounded-br-sm'
            : 'bg-white text-slate-800 border border-gray-100 rounded-bl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-emerald prose-p:leading-relaxed prose-p:my-1">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;

