import React, { useState } from 'react';
import { Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Notifications clean list without cite tags
  const notifications = [
    {
      id: 1,
      title: "New Application",
      message: "A new student applied for Software Engineer role.",
      time: "10m ago"
    },
    {
      id: 2,
      title: "Company Registered",
      message: "TechCorp requested verification.",
      time: "1h ago"
    }
  ];

  return (
    <header className="h-16 bg-[#0a0f1d] border-b border-slate-800 flex items-center justify-between px-6 z-20">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-slate-200 text-sm md:text-base font-medium">
          Smart Placement Management System
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors relative"
            title="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-slate-800 rounded-xl shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Notifications
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((item) => (
                  <div key={item.id} className="px-4 py-3 hover:bg-slate-800/50 cursor-pointer border-b border-slate-850 last:border-none">
                    <p className="text-sm font-medium text-slate-200">{item.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-semibold text-xs border border-amber-500/30">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <p className="text-sm font-medium text-slate-200">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'Admin'}</p>
          </div>
        </div>

        {/* Logout (Icon Only) */}
        <button
          onClick={logout}
          title="Logout"
          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20 ml-1"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;