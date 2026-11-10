import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Bell, Menu, GraduationCap, CheckCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getNotifications, markNotificationRead } from '../../services/api'
import { getInitials, timeAgoShort } from '../../utils/helpers'

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const { data } = await getNotifications()
        if (alive && Array.isArray(data)) setItems(data)
      } catch { /* notifications optional */ }
    }
    load()
    const id = setInterval(load, 10000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const unread = items.filter((n) => !n.isRead).length

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)))
      try { await markNotificationRead(n._id) } catch { /* ignore */ }
    }

    setOpen(false)

    if (user?.role === 'admin') {
      if (n.type === 'company_registration' || n.title?.includes('Company')) {
        navigate('/admin/companies')
      } else if (n.title?.includes('Student')) {
        navigate('/admin/students')
      } else {
        navigate('/admin/applications')
      }
    } else if (user?.role === 'student') {
      navigate('/student/applications')
    } else if (user?.role === 'company') {
      navigate('/company/applicants')
    }
  }

  const readAll = () => {
    items.filter((n) => !n.isRead).forEach(async (n) => {
      try { await markNotificationRead(n._id) } catch { /* ignore */ }
    })
    setItems((prev) => prev.map((x) => ({ ...x, isRead: true })))
  }

  const handleProfileClick = () => {
    if (user?.role === 'student') navigate('/student/profile')
    else if (user?.role === 'company') navigate('/company/profile')
    else if (user?.role === 'admin') navigate('/admin/profile')
  }

  return (
    <header className="bg-navy-900/90 backdrop-blur border-b border-navy-700 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-navy-700 transition-colors lg:hidden text-navy-200" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center">
            <GraduationCap size={18} className="text-navy-950" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold gold-text tracking-wide">PLACEME</span>
        </div>
        <p className="hidden lg:block text-sm text-navy-300">
          Smart Placement Management System
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <div className="relative" ref={ref}>
          <button 
            onClick={() => setOpen((o) => !o)} 
            className="p-2 rounded-lg hover:bg-navy-700 relative text-navy-200 transition-colors" 
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold-500 text-navy-950 text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-84 max-w-[85vw] bg-navy-800 border border-navy-600 rounded-xl shadow-card overflow-hidden animate-slide-up z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-navy-700 bg-navy-900/50">
                <span className="font-semibold text-white text-sm">Notifications</span>
                {unread > 0 && (
                  <button onClick={readAll} className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium transition-colors">
                    <CheckCheck size={14} /> Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-navy-700/60">
                {items.length === 0 ? (
                  <p className="text-center text-sm text-navy-400 py-8">No notifications yet</p>
                ) : items.map((n) => (
                  <button 
                    key={n._id} 
                    onClick={() => handleNotificationClick(n)} 
                    className={`w-full text-left px-4 py-3 hover:bg-navy-750 transition-colors ${n.isRead ? 'opacity-65' : 'bg-navy-700/20'}`}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.isRead ? (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-gold-500 shrink-0" />
                      ) : (
                        <span className="mt-1.5 w-2 h-2 rounded-full bg-transparent shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                          <span className="text-[10px] text-navy-400 shrink-0">{timeAgoShort(n.createdAt)}</span>
                        </div>
                        <p className="text-xs text-navy-300 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Clickable Profile Avatar */}
        <button
          type="button"
          onClick={handleProfileClick}
          className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-navy-800 transition-all text-left group"
          title="Go to Profile"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center ring-2 ring-transparent group-hover:ring-gold-400/50 transition-all overflow-hidden shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-navy-950 text-sm font-bold">{getInitials(user?.name)}</span>
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-white leading-tight group-hover:text-gold-300 transition-colors">
              {user?.name}
            </p>
            <p className="text-xs text-gold-400 capitalize">{user?.role}</p>
          </div>
        </button>

        {/* Logout */}
        <button 
          onClick={handleLogout} 
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
        >
          <LogOut size={16} />
          <span className="hidden sm:block">Logout</span>
        </button>
      </div>
    </header>
  )
}

export default Navbar