import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

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
        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-semibold text-xs border border-amber-500/30">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div className="hidden md:block text-left leading-tight">
            <p className="text-sm font-medium text-slate-200">{user?.name || 'Super Admin'}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role || 'Admin'}</p>
          </div>
        </div>

        {/* Logout */}
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