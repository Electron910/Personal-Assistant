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

  return (
    <form 
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto relative flex items-center bg-white rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all shadow-sm pl-2 pr-2 py-1"
    >
      <FileAttachButton disabled={disabled} onUploadSuccess={onUploadSuccess} />
      
      <input
        type="text"
        className="flex-1 bg-transparent px-4 py-3 outline-none text-slate-800 placeholder-slate-400"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />
      
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="p-3 ml-2 rounded-full text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 transition-colors flex-shrink-0"
        title="Send Message"
      >
        <Send size={18} className="translate-x-[1px]" />
      </button>
    </form>
  );
};

export default ChatInput;
