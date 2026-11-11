import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, X, ExternalLink, Clock } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

const Notifications = () => {
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      const data = Array.isArray(res.data) ? res.data : (res.data?.notifications || [])
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.isRead).length)
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 25000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      toast.success('All marked as read')
    } catch (err) {
      toast.error('Failed to update')
    }
  }

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) markAsRead(notif._id)
    setSelectedNotif(notif)
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now'
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-all"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 md:w-[420px] rounded-2xl bg-[#0f172a] border border-slate-700/80 shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white text-base">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-amber-500/15 text-amber-300 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-2 text-slate-600 opacity-60" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 cursor-pointer transition-all hover:bg-slate-800/40 flex gap-3 items-start ${
                    !notif.isRead ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <div className="text-xl mt-0.5 select-none">
                    {notif.type === 'application' ? '📄' : notif.type === 'status_update' ? '🎯' : '🎓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className={`text-sm font-semibold leading-tight ${!notif.isRead ? 'text-white' : 'text-slate-300'}`}>
                        {notif.title || 'New Notification'}
                      </p>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 whitespace-nowrap">
                        <Clock size={11} />
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed break-words line-clamp-2">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Full Detail Modal (Opens when any notification is clicked) */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {selectedNotif.type === 'application' ? '📄' : selectedNotif.type === 'status_update' ? '🎯' : '🎓'}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedNotif.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock size={12} /> {new Date(selectedNotif.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Complete Uncut Notification Message */}
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-line break-words max-h-64 overflow-y-auto">
              {selectedNotif.message}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {selectedNotif.link && (
                <a
                  href={selectedNotif.link}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl text-sm flex items-center gap-1.5 transition-colors"
                >
                  Go to Action <ExternalLink size={14} />
                </a>
              )}
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Notifications