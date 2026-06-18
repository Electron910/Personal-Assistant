import React, { useContext, useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Chat = () => {
  const { user, logout } = useContext(AuthContext);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  return (
    <div className="flex h-screen bg-slate-50 transition-colors duration-300">
      <Sidebar currentSessionId={currentSessionId} onSelectSession={setCurrentSessionId} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex justify-between items-center p-4 border-b border-gray-200 bg-white transition-colors duration-300">
          <h1 className="text-xl font-semibold text-slate-800">Personal Assistant</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500">{user?.email}</span>
            <button 
              onClick={logout}
              className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
              title="Log out"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-hidden relative">
          <ChatWindow currentSessionId={currentSessionId} onSessionCreated={setCurrentSessionId} user={user} />
        </main>
      </div>
    </div>
  );
};

export default Chat;
