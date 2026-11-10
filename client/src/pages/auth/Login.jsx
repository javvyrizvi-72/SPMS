import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { loginUser, getErrorMessage } from '../../services/api'
import { getDashboardPath } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Eye, EyeOff, LogIn, GraduationCap, AlertCircle } from 'lucide-react'
import ServerStatus from '../../components/common/ServerStatus'

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slow, setSlow] = useState(false)
  const [error, setError] = useState('')
  const { user, loading: authLoading, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && user) navigate(getDashboardPath(user.role), { replace: true })
  }, [authLoading, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const email = form.email.trim()
    if (!email || !form.password) return setError('Please enter your email and password')
    setLoading(true)
    const timer = setTimeout(() => setSlow(true), 5000)
    try {
      const { data } = await loginUser({ email, password: form.password })
      login(data, data.token)
      toast.success(`Welcome back, ${data.name}!`)
      navigate(getDashboardPath(data.role), { replace: true })
    } catch (err) {
      const msg = getErrorMessage(err, 'Login failed')
      setError(msg)
      toast.error(msg)
    } finally {
      clearTimeout(timer)
      setSlow(false)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br from-navy-700 via-navy-800 to-navy-950 border-r border-navy-600">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gold-500 to-transparent" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-navy-500/20 blur-3xl" />
        <div className="relative z-10 text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center mx-auto mb-6 shadow-gold">
            <GraduationCap size={42} className="text-navy-950" strokeWidth={2.2} />
          </div>
          <h1 className="text-4xl font-black tracking-widest gold-text mb-2">PLACEME</h1>
          <p className="text-navy-300 text-sm tracking-widest mb-10">SMART PLACEMENT MANAGEMENT SYSTEM</p>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gold-500/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-gold-500" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold-500/60" />
          </div>
          <div className="space-y-2.5 text-left">
            {['Students: build a profile, upload a resume and apply to jobs', 'Companies: post jobs, review applicants and schedule interviews', 'Admin: approve users and track placement analytics'].map((t) => (
              <div key={t} className="flex items-start gap-3 bg-white/[0.03] border border-gold-500/15 rounded-lg px-4 py-2.5">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gold-500 shrink-0" />
                <span className="text-navy-200 text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-8 lg:hidden">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center mx-auto mb-3 shadow-gold">
              <GraduationCap size={30} className="text-navy-950" />
            </div>
            <h1 className="text-2xl font-black tracking-widest gold-text">PLACEME</h1>
          </div>

          <div className="h-[3px] bg-gradient-to-r from-gold-600 via-gold-300 to-gold-600 rounded mb-8" />
          <h2 className="text-3xl font-bold text-white mb-1">Sign In</h2>
          <p className="text-navy-300 text-sm mb-6">Enter your credentials to access your portal</p>

          {error && (
            <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-3 py-2.5 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-bold text-gold-400 tracking-wider mb-2">EMAIL ADDRESS</label>
              <input type="email" autoComplete="email" className="input-field" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-gold-400 tracking-wider">PASSWORD</label>
                <Link to="/forgot-password" className="text-xs text-gold-400 hover:text-gold-300 hover:underline transition-colors font-medium">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} autoComplete="current-password" className="input-field pr-11" placeholder="Enter your password"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPass(!showPass)} aria-label="Show or hide password"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-gold-400">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3 mt-2">
              {loading ? <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" /> : <><LogIn size={18} /> SIGN IN</>}
            </button>
            {slow && <p className="text-xs text-gold-300 text-center">Waking up the server, the first sign-in can take up to a minute...</p>}
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-navy-700" />
            <span className="text-navy-400 text-xs">New here?</span>
            <div className="flex-1 h-px bg-navy-700" />
          </div>
          <Link to="/register" className="flex items-center justify-center gap-2 py-2.5 border border-gold-500/70 rounded-lg text-gold-300 font-semibold text-sm tracking-wide hover:bg-gold-500/10 transition-colors">
            CREATE ACCOUNT
          </Link>
          <ServerStatus />
        </div>
      </div>
    </div>
  )
}

export default Login