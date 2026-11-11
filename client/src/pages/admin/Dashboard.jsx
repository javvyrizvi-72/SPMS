import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/common/Layout'
import api from '../../services/api'
import {
  Users,
  Building2,
  Briefcase,
  FileText,
  CheckCircle,
  TrendingUp,
  Bell,
  LogOut,
  X,
  Clock,
  ExternalLink,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#06B6D4']

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCompanies: 5,
    activeJobs: 10,
    totalApplications: 0,
    studentsPlaced: 0,
    placementRate: 0,
  })
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  // Notification States
  const [notifications, setNotifications] = useState([])
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [selectedNotif, setSelectedNotif] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const notifRef = useRef(null)

  // Fetch Stats & Notifications
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        let res
        try {
          res = await api.get('/admin/stats')
        } catch {
          res = await api.get('/admin/dashboard-stats')
        }

        const d = res?.data || {}
        const totalStudents = Number(d.totalStudents ?? d.students ?? 0)
        const totalCompanies = Number(d.totalCompanies ?? d.companies ?? 5)
        const activeJobs = Number(d.activeJobs ?? d.totalJobs ?? d.jobs ?? 10)
        const totalApplications = Number(d.totalApplications ?? d.applications ?? 0)
        const studentsPlaced = Number(d.studentsPlaced ?? d.placed ?? 0)
        const placementRate = Number(
          d.placementRate ??
            (totalApplications > 0
              ? Math.round((studentsPlaced / totalApplications) * 100)
              : 0)
        )

        setStats({
          totalStudents,
          totalCompanies,
          activeJobs,
          totalApplications,
          studentsPlaced,
          placementRate,
        })

        const activePieValues = [
          { name: 'Students', value: totalStudents },
          { name: 'Companies', value: totalCompanies },
          { name: 'Jobs', value: activeJobs },
          { name: 'Applications', value: totalApplications },
          { name: 'Placed', value: studentsPlaced },
        ].filter((item) => item.value > 0)

        setChartData(
          activePieValues.length > 0
            ? activePieValues
            : [
                { name: 'Companies', value: totalCompanies },
                { name: 'Jobs', value: activeJobs },
              ]
        )
      } catch (err) {
        console.error('Stats error:', err)
      } finally {
        setLoading(false)
      }
    }

    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications')
        const data = Array.isArray(res.data) ? res.data : (res.data?.notifications || [])
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.isRead).length)
      } catch (err) {
        console.warn('Notifications load error:', err.message)
      }
    }

    fetchDashboardData()
    fetchNotifications()
  }, [])

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (err) {
      console.error(err)
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

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Companies', value: stats.totalCompanies, icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Applications', value: stats.totalApplications, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Students Placed', value: stats.studentsPlaced, icon: CheckCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Placement Rate', value: `${stats.placementRate}%`, icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Navbar Row: System Title + Bell + User Profile + Logout */}
        <div className="flex items-center justify-between pb-4 border-b border-navy-800">
          <div>
            <h2 className="text-sm font-medium text-navy-400">Smart Placement Management System</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Bell Icon with Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-navy-300 hover:text-white hover:bg-navy-800/80 rounded-xl transition-all"
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-navy-950 shadow-md">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Broad Notifications Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-navy-900 border border-navy-700 shadow-2xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-navy-800 flex items-center justify-between bg-navy-950/80">
                    <h3 className="font-bold text-white text-base">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs bg-gold-500/20 text-gold-300 px-2.5 py-0.5 rounded-full font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  <div className="max-h-[360px] overflow-y-auto divide-y divide-navy-800/80">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-navy-400">
                        <Bell size={30} className="mx-auto mb-2 opacity-40 text-navy-500" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => handleNotificationClick(notif)}
                          className={`p-4 cursor-pointer transition-colors hover:bg-navy-800/50 flex gap-3 items-start ${
                            !notif.isRead ? 'bg-gold-500/5' : ''
                          }`}
                        >
                          <span className="text-xl mt-0.5 select-none">
                            {notif.type === 'application' ? '📄' : notif.type === 'status_update' ? '🎯' : '🎓'}[cite: 2]
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className={`text-sm font-semibold truncate ${!notif.isRead ? 'text-white' : 'text-navy-300'}`}>
                                {notif.title || 'Notification'}
                              </p>
                              <span className="text-[11px] text-navy-400 flex items-center gap-1 whitespace-nowrap">
                                <Clock size={11} />
                                {formatTime(notif.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-navy-300 line-clamp-2 leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Super Admin Avatar Badge */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gold-500/20 text-gold-400 font-bold flex items-center justify-center text-sm border border-gold-500/30">
                SA
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-white leading-tight">Super Admin</p>
                <p className="text-xs text-navy-400">Admin</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout[cite: 1]</span>
            </button>
          </div>
        </div>

        {/* Dashboard Title */}
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard[cite: 1]</h1>
          <p className="text-navy-400 mt-1">Platform overview and analytics[cite: 1]</p>
        </div>

        {/* 6 Top Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} className="card bg-navy-900/60 border border-navy-700/60 p-5 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-navy-400 text-sm font-medium">{card.label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon size={24} className={card.color} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Platform Overview Card with Working Recharts Pie Chart & Rows */}
        <div className="card bg-navy-900/60 border border-navy-700/60 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Platform Overview[cite: 1]</h3>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Donut Pie Chart Container */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Exact Breakdown Rows */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-navy-800/80 text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Students registered[cite: 1]
                </span>
                <span className="font-bold text-white text-base">{stats.totalStudents}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-navy-800/80 text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  Companies verified[cite: 1]
                </span>
                <span className="font-bold text-white text-base">{stats.totalCompanies}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-navy-800/80 text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  Jobs actively hiring[cite: 1]
                </span>
                <span className="font-bold text-white text-base">{stats.activeJobs}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-navy-800/80 text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Total candidate applications[cite: 1]
                </span>
                <span className="font-bold text-white text-base">{stats.totalApplications}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                  Students placed[cite: 1]
                </span>
                <span className="font-bold text-white text-base">{stats.studentsPlaced}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Detail Modal for Notification Read */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {selectedNotif.type === 'application' ? '📄' : selectedNotif.type === 'status_update' ? '🎯' : '🎓'}[cite: 2]
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedNotif.title}</h3>
                  <p className="text-xs text-navy-400 mt-0.5 flex items-center gap-1">
                    <Clock size={12} /> {new Date(selectedNotif.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotif(null)}
                className="text-navy-400 hover:text-white p-1 rounded-lg hover:bg-navy-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-navy-950 border border-navy-800 rounded-xl p-4 text-sm text-navy-200 whitespace-pre-line leading-relaxed max-h-64 overflow-y-auto">
              {selectedNotif.message}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              {selectedNotif.link && (
                <a
                  href={selectedNotif.link}
                  className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold rounded-xl text-sm flex items-center gap-1.5 transition-colors"
                >
                  View Details <ExternalLink size={14} />
                </a>
              )}
              <button
                onClick={() => setSelectedNotif(null)}
                className="px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default Dashboard