import React, { useState, useEffect } from 'react';
import { Plus, MessageSquare, Trash2, X } from 'lucide-react';
import axiosClient from '../api/axiosClient';

const Sidebar = ({ currentSessionId, onSelectSession, isOpen, onClose }) => {
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
    onClose?.();
  };

  const handleSelectSession = (id) => {
    onSelectSession(id);
    onClose?.();
  };

  const deleteSession = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat?')) return;
    try {
      await axiosClient.delete(`/chat/sessions/${id}`);
      if (currentSessionId === id) onSelectSession(null);
      fetchSessions();
    } catch (error) {
      console.error('Failed to delete session', error);
    }
  };

  const sidebarContent = (
    <div className="w-64 bg-white border-r border-gray-100 h-full flex flex-col text-slate-700 flex-shrink-0 shadow-sm">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-100">
        <span className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Conversations</span>
        {/* Close button — only visible on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* New Chat button */}
      <div className="p-3">
        <button
          onClick={createNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white rounded-xl transition-all duration-150 shadow-sm hover:shadow-md font-medium"
        >
          <Plus size={17} className="transition-transform group-hover:rotate-90 duration-200" />
          <span>New chat</span>
        </button>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {sessions.length > 0 && (
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-3 pt-2">
            History
          </div>
        )}
        {sessions.map((session, i) => (
          <div
            key={session._id}
            onClick={() => handleSelectSession(session._id)}
            style={{ animationDelay: `${i * 40}ms` }}
            className={`animate-fade-slide-in group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-150 ${
              currentSessionId === session._id
                ? 'bg-emerald-50 text-emerald-700 font-medium border border-emerald-200'
                : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <MessageSquare
                size={14}
                className={`flex-shrink-0 transition-colors ${currentSessionId === session._id ? 'text-emerald-500' : 'text-slate-400'}`}
              />
              <span className="truncate text-sm">{session.title}</span>
            </div>
            <button
              onClick={(e) => deleteSession(e, session._id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all flex-shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}

        {sessions.length === 0 && (
          <div className="px-3 pt-6 text-center">
            <p className="text-xs text-slate-400">No conversations yet.<br/>Start a new chat!</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:flex">{sidebarContent}</div>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <>
          <div
            className="sidebar-overlay fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 z-40 lg:hidden animate-fade-slide-in">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
};

export default Sidebar;

