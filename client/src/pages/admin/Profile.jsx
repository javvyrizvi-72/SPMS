import { useState } from 'react'
import Layout from '../../components/common/Layout'
import { useAuth } from '../../context/AuthContext'
import { updateUserProfile } from '../../services/api'
import toast from 'react-hot-toast'
import { Shield, Check, Save } from 'lucide-react'

// Anime / Tech Avatar presets (SVG DiceBear)
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

const AdminProfile = () => {
  const { user, login } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await updateUserProfile({ name, avatar: selectedAvatar })
      login(data, data.token || localStorage.getItem('token'))
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Profile</h1>
          <p className="text-navy-400 mt-1">Manage system administrator identity and avatar</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label className="block text-xs font-bold text-gold-400 tracking-wider mb-3">
              CHOOSE AVATAR ICON
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

          <div className="space-y-4 border-t border-navy-700/60 pt-4">
            <div>
              <label className="block text-xs font-bold text-navy-200 mb-1.5">FULL NAME</label>
              <input
                type="text"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-200 mb-1.5">EMAIL ADDRESS (SYSTEM)</label>
              <input
                type="email"
                disabled
                className="input-field opacity-60 cursor-not-allowed bg-navy-950"
                value={user?.email || ''}
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-300 text-xs">
              <Shield size={16} className="shrink-0" />
              <span>Placement Super Admin Role & Permissions Active</span>
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

export default AdminProfile