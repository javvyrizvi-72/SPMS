import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import { useAuth } from '../../context/AuthContext'
import { getStudentProfile, updateStudentProfile, updateUserProfile, uploadResume } from '../../services/api'
import toast from 'react-hot-toast'
import { Save, Upload, CheckCircle, User, FileText, Check } from 'lucide-react'

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

const Profile = () => {
  const { user, login } = useAuth()
  const [profile, setProfile] = useState(null)
  const [name, setName] = useState(user?.name || '')
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '')
  const [form, setForm] = useState({ phone: '', college: '', degree: '', branch: '', cgpa: '', skills: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getStudentProfile()
        setProfile(data)
        setForm({
          phone: data.phone || '',
          college: data.college || '',
          degree: data.degree || '',
          branch: data.branch || '',
          cgpa: data.cgpa || '',
          skills: data.skills?.join(', ') || '',
        })
      } catch (err) { toast.error('Failed to load profile') }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // 1. Update basic user account info (Name & Avatar)
      const userRes = await updateUserProfile({ name, avatar: selectedAvatar })
      login(userRes.data, userRes.data.token || localStorage.getItem('token'))

      // 2. Update Student academic & skill profile
      const payload = { ...form, skills: form.skills.split(',').map(s => s.trim()).filter(Boolean) }
      const { data } = await updateStudentProfile(payload)
      setProfile(data)

      toast.success('Profile updated successfully!')
    } catch (err) { toast.error('Failed to update profile') }
    finally { setSaving(false) }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') return toast.error('Only PDF files allowed')
    if (file.size > 5 * 1024 * 1024) return toast.error('File size must be under 5MB')
    
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('resume', file)
      const { data } = await uploadResume(formData)
      setProfile(prev => ({ 
        ...prev, 
        resume: data.resume,
        resumeOriginalName: data.resumeOriginalName || file.name
      }))
      toast.success('Resume uploaded successfully!')
    } catch (err) { 
      toast.error('Resume upload failed') 
    } finally { 
      setUploading(false) 
    }
  }

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent"></div></div></Layout>

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-navy-400 mt-1">Keep your profile updated to improve placement chances</p>
        </div>

        {profile?.isApproved ? (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-400" size={20} />
            <p className="text-green-300 text-sm font-medium">Your profile is approved and visible to companies</p>
          </div>
        ) : (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <p className="text-yellow-300 text-sm font-medium">Profile pending admin approval</p>
          </div>
        )}

        <form onSubmit={handleSave} className="card space-y-6">
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-bold text-gold-400 tracking-wider mb-3">
              CHOOSE STUDENT AVATAR
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

          <div className="border-t border-navy-700/60 pt-4 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <User size={20} /> Personal & Academic Information
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Registered Email</label>
                <input
                  type="email"
                  disabled
                  className="input-field opacity-60 cursor-not-allowed bg-navy-950"
                  value={user?.email || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  placeholder="+91 9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">College Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.college}
                  onChange={e => setForm({...form, college: e.target.value})}
                  placeholder="ABC University"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Degree</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.degree}
                  onChange={e => setForm({...form, degree: e.target.value})}
                  placeholder="B.Tech / BCA / MCA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Branch / Specialization</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.branch}
                  onChange={e => setForm({...form, branch: e.target.value})}
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  className="input-field"
                  value={form.cgpa}
                  onChange={e => setForm({...form, cgpa: e.target.value})}
                  placeholder="8.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-200 mb-1.5">Skills (comma separated)</label>
              <input
                type="text"
                className="input-field"
                value={form.skills}
                onChange={e => setForm({...form, skills: e.target.value})}
                placeholder="React, Node.js, MongoDB, Python"
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </form>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Resume</h2>
          {profile?.resume ? (
            <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <FileText className="text-green-400" size={24} />
                <div>
                  <p className="font-medium text-green-300">
                    {profile.resumeOriginalName || 'Uploaded_Resume.pdf'}
                  </p>
                  <a 
                    href={`http://localhost:5000/api/students/resume/download/${profile._id}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-gold-400 text-sm hover:underline inline-block mt-0.5"
                  >
                    View Resume
                  </a>
                </div>
              </div>

              <label className={`btn-secondary text-sm flex items-center gap-2 ${uploading ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}>
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <span>Replace</span>
                    <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} disabled={uploading} />
                  </>
                )}
              </label>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center border-2 border-dashed border-navy-600 rounded-xl p-8 cursor-pointer hover:border-gold-400 hover:bg-gold-500/10 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <Upload size={32} className="text-navy-400 mb-2" />
              <p className="text-navy-300 font-medium">Upload Resume</p>
              <p className="text-navy-400 text-sm mt-1">PDF only, max 5MB</p>
              {uploading && <div className="mt-3 w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />}
              <input type="file" accept=".pdf" className="hidden" onChange={handleResumeUpload} disabled={uploading} />
            </label>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Profile