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
      className="max-w-4xl mx-auto relative flex items-center bg-gray-50 dark:bg-[#2f2f2f] rounded-full border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-sm pl-2 pr-2 py-1"
    >
      <FileAttachButton disabled={disabled} onUploadSuccess={onUploadSuccess} />
      
      <input
        type="text"
        className="flex-1 bg-transparent px-4 py-3 outline-none text-gray-800 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />
      
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="p-3 ml-2 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 transition-colors flex-shrink-0"
        title="Send Message"
      >
        <Send size={18} className="translate-x-[1px]" />
      </button>
    </form>
  );
};

export default ChatInput;
