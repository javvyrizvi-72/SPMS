import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { registerUser, getErrorMessage } from '../../services/api'
import { getDashboardPath } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Eye, EyeOff, UserPlus, GraduationCap, AlertCircle, Briefcase, Building2, Globe } from 'lucide-react'
import ServerStatus from '../../components/common/ServerStatus'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const Register = () => {
  const [form, setForm] = useState({ 
    name: '', 
    companyName: '', 
    website: '', 
    email: '', 
    password: '', 
    confirm: '', 
    role: 'student' 
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [slow, setSlow] = useState(false)
  const [error, setError] = useState('')
  const { user, loading: authLoading, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && user) navigate(getDashboardPath(user.role), { replace: true })
  }, [authLoading, user, navigate])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const validate = () => {
    if (!form.name.trim()) return 'Please enter your full name'
    if (form.role === 'company') {
      if (!form.companyName.trim()) return 'Please enter the company name'
      if (!form.website.trim()) return 'Please enter the official company website'
    }
    if (!EMAIL_RE.test(form.email.trim())) return 'Please enter a valid email address'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    if (form.password !== form.confirm) return 'Passwords do not match'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const problem = validate()
    if (problem) return setError(problem)
    setError('')
    setLoading(true)
    const timer = setTimeout(() => setSlow(true), 5000)
    try {
      const payload = { 
        name: form.name.trim(), 
        email: form.email.trim(), 
        password: form.password, 
        role: form.role 
      }
      if (form.role === 'company') {
        payload.companyName = form.companyName.trim()
        payload.website = form.website.trim()
      }

      const { data } = await registerUser(payload)
      login(data, data.token)
      toast.success('Account created successfully!')
      navigate(getDashboardPath(data.role), { replace: true })
    } catch (err) {
      const msg = getErrorMessage(err, 'Registration failed')
      setError(msg)
      toast.error(msg)
    } finally {
      clearTimeout(timer)
      setSlow(false)
      setLoading(false)
    }
  }

  const label = 'block text-xs font-bold text-gold-400 tracking-wider mb-2'

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center mx-auto mb-3 shadow-gold">
            <GraduationCap size={30} className="text-navy-950" />
          </div>
          <h1 className="text-2xl font-black tracking-widest gold-text">PLACEME</h1>
          <p className="text-navy-300 text-sm mt-1">Create your account</p>
        </div>

        <div className="card !p-0 overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-gold-600 via-gold-300 to-gold-600" />
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { v: 'student', t: 'Student', d: 'Find and apply to jobs', i: Briefcase }, 
                { v: 'company', t: 'Company', d: 'Post jobs and hire', i: Building2 }
              ].map(({ v, t, d, i: Icon }) => (
                <button 
                  key={v} 
                  type="button" 
                  onClick={() => setForm({ ...form, role: v })}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    form.role === v ? 'border-gold-500 bg-gold-500/10' : 'border-navy-600 hover:border-navy-500'
                  }`}
                >
                  <Icon size={18} className={form.role === v ? 'text-gold-400' : 'text-navy-300'} />
                  <p className={`font-semibold text-sm mt-1.5 ${form.role === v ? 'text-gold-300' : 'text-white'}`}>{t}</p>
                  <p className="text-xs text-navy-400">{d}</p>
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-3 py-2.5 text-sm">
                <AlertCircle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className={label}>{form.role === 'company' ? 'CONTACT PERSON NAME' : 'FULL NAME'}</label>
                <input 
                  type="text" 
                  autoComplete="name" 
                  className="input-field" 
                  placeholder={form.role === 'company' ? 'e.g. Rahul Sharma (HR)' : 'John Doe'} 
                  value={form.name} 
                  onChange={set('name')} 
                  required 
                />
              </div>

              {form.role === 'company' && (
                <>
                  <div>
                    <label className={label}>COMPANY NAME</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Acme Technologies" 
                      value={form.companyName} 
                      onChange={set('companyName')} 
                      required 
                    />
                  </div>
                  <div>
                    <label className={label}>COMPANY WEBSITE</label>
                    <div className="relative">
                      <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                      <input 
                        type="url" 
                        className="input-field pl-9" 
                        placeholder="https://acme.example.com" 
                        value={form.website} 
                        onChange={set('website')} 
                        required 
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className={label}>EMAIL ADDRESS</label>
                <input 
                  type="email" 
                  autoComplete="email" 
                  className="input-field" 
                  placeholder={form.role === 'company' ? 'recruiter@acme.com' : 'you@example.com'} 
                  value={form.email} 
                  onChange={set('email')} 
                  required 
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={label}>PASSWORD</label>
                  <div className="relative">
                    <input 
                      type={showPass ? 'text' : 'password'} 
                      autoComplete="new-password" 
                      className="input-field pr-11" 
                      placeholder="Min. 6 characters" 
                      value={form.password} 
                      onChange={set('password')} 
                      required 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPass(!showPass)} 
                      aria-label="Show or hide password" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-gold-400"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={label}>CONFIRM PASSWORD</label>
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    autoComplete="new-password" 
                    className="input-field" 
                    placeholder="Repeat password" 
                    value={form.confirm} 
                    onChange={set('confirm')} 
                    required 
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full !py-3 mt-1">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><UserPlus size={18} /> CREATE ACCOUNT</>
                )}
              </button>
              {slow && <p className="text-xs text-gold-300 text-center">Waking up the server, this can take up to a minute the first time...</p>}
            </form>

            <p className="text-center text-sm text-navy-300 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-gold-400 font-semibold hover:text-gold-300">Sign in</Link>
            </p>
          </div>
        </div>
        <ServerStatus />
      </div>
    </div>
  )
}

export default Register