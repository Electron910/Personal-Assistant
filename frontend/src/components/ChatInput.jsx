import React, { useState } from 'react';
import { Send } from 'lucide-react';
import FileAttachButton from './FileAttachButton';

const ChatInput = ({ onSendMessage, disabled, onUploadSuccess }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto flex items-center bg-white rounded-2xl border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-400 focus-within:border-transparent transition-all duration-200 shadow-sm focus-within:shadow-md pl-2 pr-2 py-1"
    >
      <FileAttachButton disabled={disabled} onUploadSuccess={onUploadSuccess} />

      <input
        type="text"
        className="flex-1 bg-transparent px-3 py-3 outline-none text-slate-800 placeholder-slate-400 text-sm sm:text-base min-w-0"
        placeholder="Message your assistant..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />

      <button
        type="submit"
        disabled={!hasText || disabled}
        className={`p-2.5 ml-1.5 rounded-xl text-white flex-shrink-0 transition-all duration-150
          ${hasText && !disabled
            ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-90 shadow-sm hover:shadow-md'
            : 'bg-emerald-200 cursor-not-allowed'
          }`}
        title="Send Message"
      >
        <Send
          size={17}
          className={`transition-transform duration-200 ${hasText && !disabled ? '-rotate-0 translate-x-[1px]' : ''}`}
        />
      </button>
    </form>
  );
};

export default ChatInput;

