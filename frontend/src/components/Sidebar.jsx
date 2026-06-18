import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const Sidebar = ({ currentSessionId, onSelectSession }) => {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetchSessions();
  }, [currentSessionId]);

  const fetchSessions = async () => {
    try {
      const { data } = await axiosClient.get('/chat/sessions');
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions', error);
    }
  };

  const createNewChat = () => {
    onSelectSession(null);
  };

  const deleteSession = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat?')) return;
    
    try {
      await axiosClient.delete(`/chat/sessions/${id}`);
      if (currentSessionId === id) {
        onSelectSession(null);
      }
      fetchSessions();
    } catch (error) {
      console.error('Failed to delete session', error);
    }
  };

  return (
    <div className="w-64 bg-gray-900 dark:bg-black h-full flex flex-col text-gray-300 transition-colors duration-300 flex-shrink-0">
      <div className="p-4">
        <button
          onClick={createNewChat}
          className="w-full flex items-center gap-2 px-4 py-3 bg-gray-800 dark:bg-gray-900 hover:bg-gray-700 dark:hover:bg-gray-800 text-white rounded-xl transition-colors shadow-sm border border-gray-700"
        >
          <Plus size={18} />
          <span className="font-medium">New chat</span>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3 mt-2">
          History
        </div>
        {sessions.map((session) => (
          <div
            key={session._id}
            onClick={() => onSelectSession(session._id)}
            className={`group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-colors ${
              currentSessionId === session._id 
                ? 'bg-gray-800 dark:bg-gray-800 text-white' 
                : 'hover:bg-gray-800/50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <MessageSquare size={16} className="flex-shrink-0" />
              <span className="truncate text-sm">{session.title}</span>
            </div>
            <button 
              onClick={(e) => deleteSession(e, session._id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
