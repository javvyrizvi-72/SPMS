import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import { useAuth } from '../../context/AuthContext'
import { getCompanyProfile, updateCompanyProfile, updateUserProfile } from '../../services/api'
import toast from 'react-hot-toast'
import { Building2, Globe, MapPin, Briefcase, FileText, Check, Save, ShieldCheck } from 'lucide-react'

const AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Luna',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Shadow',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Zack',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Kira',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Astra',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Spark',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Titan'
]

const CompanyProfile = () => {
  const { user, login } = useAuth()
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState(user?.name || '')
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '')
  const [form, setForm] = useState({
    companyName: '',
    industry: '',
    location: '',
    website: '',
    description: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getCompanyProfile()
        setProfile(data)
        setForm({
          companyName: data.companyName || '',
          industry: data.industry || '',
          location: data.location || '',
          website: data.website || '',
          description: data.description || '',
        })
      } catch {
        toast.error('Failed to load company details')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleChange = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // 1. Update User basic info (Name, Avatar)
      const userRes = await updateUserProfile({ name, avatar: selectedAvatar })
      login(userRes.data, userRes.data.token || localStorage.getItem('token'))

      // 2. Update Company specific profile
      const compRes = await updateCompanyProfile(form)
      setProfile(compRes.data)

      toast.success('Company profile updated successfully!')
    } catch {
      toast.error('Failed to update company profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Profile</h1>
          <p className="text-navy-400 mt-1">Manage corporate identity, recruiter details and public info</p>
        </div>

        {profile?.isApproved ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
            <ShieldCheck className="text-green-400" size={20} />
            <p className="text-green-300 text-sm font-medium">
              Verified & Authorized Corporate Recruiter
            </p>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-300 text-sm font-medium">
              Verification Pending: An admin will review and verify your corporate domain/website.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold text-gold-400 tracking-wider mb-3">
              RECRUITER AVATAR
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
              {AVATARS.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedAvatar(url)}
                  className={`relative p-1 rounded-xl border-2 transition-all aspect-square bg-navy-900 overflow-hidden ${
                    selectedAvatar === url
                      ? 'border-gold-400 ring-2 ring-gold-400/30'
                      : 'border-navy-700 hover:border-navy-500'
                  }`}
                >
                  <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-contain" />
                  {selectedAvatar === url && (
                    <div className="absolute top-1 right-1 bg-gold-500 text-navy-950 rounded-full p-0.5">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Recruiter Details */}
          <div className="border-t border-navy-700/60 pt-4 space-y-4">
            <h2 className="text-sm font-bold text-navy-200 uppercase tracking-wide">Recruiter Contact</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-navy-200 mb-1">RECRUITER NAME</label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-200 mb-1">OFFICIAL EMAIL</label>
                <input
                  type="email"
                  disabled
                  className="input-field opacity-60 cursor-not-allowed bg-navy-950"
                  value={user?.email || ''}
                />
              </div>
            </div>
          </div>

          {/* Company Details */}
          <div className="border-t border-navy-700/60 pt-4 space-y-4">
            <h2 className="text-sm font-bold text-navy-200 uppercase tracking-wide">Company Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-navy-200 mb-1">COMPANY NAME</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input
                    type="text"
                    className="input-field pl-9"
                    value={form.companyName}
                    onChange={handleChange('companyName')}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-200 mb-1">OFFICIAL WEBSITE</label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input
                    type="url"
                    className="input-field pl-9"
                    value={form.website}
                    onChange={handleChange('website')}
                    placeholder="https://company.example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-200 mb-1">INDUSTRY</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input
                    type="text"
                    className="input-field pl-9"
                    value={form.industry}
                    onChange={handleChange('industry')}
                    placeholder="e.g. IT Services, Fintech"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy-200 mb-1">HEADQUARTERS / LOCATION</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input
                    type="text"
                    className="input-field pl-9"
                    value={form.location}
                    onChange={handleChange('location')}
                    placeholder="e.g. Bengaluru, India"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-navy-200 mb-1">ABOUT COMPANY</label>
              <textarea
                rows="4"
                className="input-field"
                value={form.description}
                onChange={handleChange('description')}
                placeholder="Briefly describe what your organization does and what you look for in candidates..."
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? (
              <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </form>
      </div>
    </Layout>
  )
}

export default CompanyProfile