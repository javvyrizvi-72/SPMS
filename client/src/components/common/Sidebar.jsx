import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, User, Briefcase, FileText,
  Building2, PlusCircle, Users, BarChart3,
  GraduationCap, X,
} from 'lucide-react'

const studentLinks = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/profile', label: 'My Profile', icon: User },
  { to: '/student/jobs', label: 'Browse Jobs', icon: Briefcase },
  { to: '/student/applications', label: 'My Applications', icon: FileText },
]

const companyLinks = [
  { to: '/company/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/company/post-job', label: 'Post a Job', icon: PlusCircle },
  { to: '/company/applicants', label: 'Applicants', icon: Users },
]

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/companies', label: 'Companies', icon: Building2 },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
]

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth()

  const links =
    user?.role === 'student' ? studentLinks :
    user?.role === 'company' ? companyLinks : adminLinks

  const portal = user?.role === 'student' ? 'Student Portal' : user?.role === 'company' ? 'Company Portal' : 'Admin Panel'

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-navy-900 border-r border-navy-700 z-50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-[3px] bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
        <div className="flex items-center justify-between p-5 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center shadow-gold">
              <GraduationCap size={22} className="text-navy-950" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <span className="block font-extrabold text-lg tracking-wide gold-text">PLACEME</span>
              <span className="block text-[10px] text-navy-400 tracking-widest">PLACEMENT SYSTEM</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 hover:bg-navy-700 rounded-lg text-navy-300">
            <X size={18} />
          </button>
        </div>

        <div className="p-3 flex-1 overflow-y-auto">
          <p className="text-[11px] font-semibold text-gold-500/80 uppercase tracking-widest px-3 mb-3 mt-2">{portal}</p>
          <nav className="space-y-1">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border-l-2 ${
                    isActive
                      ? 'bg-gold-500/10 text-gold-300 border-gold-500'
                      : 'text-navy-300 border-transparent hover:bg-navy-700 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-navy-700 text-xs text-navy-400">
          Need help? Use the <span className="text-gold-400 font-semibold">Assistant</span> button at the bottom right.
        </div>
      </aside>
    </>
  )
}

export default Sidebar
