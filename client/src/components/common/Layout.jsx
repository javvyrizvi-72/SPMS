import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  Building2, 
  FileText, 
  Bell, 
  LogOut,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Clean notifications without cite tags
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

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Companies', path: '/admin/companies', icon: Building2 },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
  ];

  const companyNav = [
    { name: 'Dashboard', path: '/company/dashboard', icon: LayoutDashboard },
    { name: 'Post Job', path: '/company/post-job', icon: Briefcase },
    { name: 'Applicants', path: '/company/applicants', icon: Users },
  ];

  const studentNav = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', path: '/student/jobs', icon: Briefcase },
    { name: 'Applications', path: '/student/applications', icon: FileText },
  ];

  const navItems = user?.role === 'admin' 
    ? adminNav 
    : user?.role === 'company' 
    ? companyNav 
    : studentNav;

  return (
    <div className="flex h-screen bg-[#070b14] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-wider text-white">PLACEME</h2>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase">Placement System</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-4 py-6">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-3">
              {user?.role === 'admin' ? 'Admin Panel' : user?.role === 'company' ? 'Company Panel' : 'Student Panel'}
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <item.icon size={18} />
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500">
          Need help? Use the <span className="text-amber-400 font-medium">Assistant</span> button at the bottom right.
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-[#0a0f1d] border-b border-slate-800 flex items-center justify-between px-8 shrink-0">
          <div className="text-slate-300 text-sm font-medium">
            Smart Placement Management System
          </div>

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

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Notifications
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((item) => (
                      <div key={item.id} className="px-4 py-3 hover:bg-slate-800/50 cursor-pointer border-b border-slate-800/50 last:border-none">
                        <p className="text-sm font-medium text-slate-200">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.message}</p>
                        <span className="text-[10px] text-slate-500 mt-1 block">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SA'}
              </div>
              <div className="hidden md:block text-left leading-tight">
                <p className="text-sm font-semibold text-slate-200">{user?.name || 'Super Admin'}</p>
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

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;