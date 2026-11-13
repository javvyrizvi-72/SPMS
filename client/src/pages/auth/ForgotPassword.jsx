import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, resetPasswordWithOtp, getErrorMessage } from '../../services/api'
import toast from 'react-hot-toast'
import { KeyRound, Mail, ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react'

const ForgotPassword = () => {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setError('')
    const targetEmail = email.trim()
    if (!targetEmail) return setError('Please enter your registered email address')

    setLoading(true)
    try {
      const { data } = await forgotPassword({ email: targetEmail })
      toast.success(data.message || 'Verification OTP generated!')
      setGeneratedOtp(data.otp || '')
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
      setStep(2)
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to send OTP')
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setError('')

    if (!otp.trim()) return setError('Please enter the 6-digit OTP')
    if (newPassword.length < 6) return setError('Password must be at least 6 characters')
    if (newPassword !== confirmPassword) return setError('Passwords do not match')

    setLoading(true)
    try {
      const { data } = await resetPasswordWithOtp({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      })
      toast.success(data.message || 'Password updated successfully!')
      navigate('/login')
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to reset password')
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-navy-950">
      <div className="w-full max-w-md animate-slide-up card border border-navy-700 p-8 shadow-2xl relative">
        <div className="h-[3px] bg-gradient-to-r from-gold-600 via-gold-300 to-gold-600 rounded mb-6" />

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
            {step === 1 ? <Mail size={22} /> : <KeyRound size={22} />}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {step === 1 ? 'Forgot Password' : 'Reset Password'}
            </h1>
            <p className="text-navy-300 text-xs">
              {step === 1
                ? 'Enter your registered email to receive a 6-digit OTP'
                : 'Enter OTP code and set your new password'}
            </p>
          </div>
        </div>

        {error && (
          <div className="my-4 flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg px-3 py-2.5 text-xs">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} className="space-y-4 mt-6" autoComplete="off">
            <div>
              <label className="block text-xs font-bold text-gold-400 tracking-wider mb-2">
                REGISTERED EMAIL ADDRESS
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="student@example.com / recruiter@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5 mt-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'SEND VERIFICATION OTP'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 mt-6" autoComplete="off">
            <div className="p-3 bg-navy-900 border border-navy-700 rounded-lg text-xs flex items-center justify-between">
              <span className="text-navy-300 truncate">Target: <strong>{email}</strong></span>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setGeneratedOtp(''); }}
                className="text-gold-400 hover:underline shrink-0 ml-2"
              >
                Change
              </button>
            </div>

            {generatedOtp && (
              <div className="p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg text-xs flex items-center justify-between">
                <span className="text-gold-300">
                  Verification OTP: <strong className="text-base tracking-widest text-gold-400 ml-1">{generatedOtp}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtp(generatedOtp)}
                  className="px-2.5 py-1 bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 rounded font-semibold transition-colors"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gold-400 tracking-wider mb-2">
                6-DIGIT OTP CODE
              </label>
              <input
                type="text"
                maxLength={6}
                className="input-field tracking-widest text-center text-lg font-bold"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoComplete="one-time-code"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gold-400 tracking-wider mb-2">
                NEW PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  className="input-field pr-11"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-gold-400"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gold-400 tracking-wider mb-2">
                CONFIRM NEW PASSWORD
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full !py-2.5 mt-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'UPDATE PASSWORD'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-navy-800 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-navy-300 hover:text-gold-300 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword