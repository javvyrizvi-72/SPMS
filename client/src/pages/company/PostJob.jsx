import { useState } from 'react'
import Layout from '../../components/common/Layout'
import { createJob } from '../../services/api'
import toast from 'react-hot-toast'
import { PlusCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const PostJob = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', location: '', salary: '',
    jobType: 'Full-Time', deadline: '',
    eligibility: { minCGPA: 0, degree: '', branch: '' }
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...form,
        eligibility: {
          ...form.eligibility,
          branch: form.eligibility.branch.split(',').map(b => b.trim()).filter(Boolean)
        }
      }
      await createJob(payload)
      toast.success('Job posted successfully!')
      navigate('/company/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job')
    } finally {
      setLoading(false)
    }
  }

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))
  const setElig = (field, val) => setForm(f => ({ ...f, eligibility: { ...f.eligibility, [field]: val } }))

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Post a New Job</h1>
          <p className="text-navy-400 mt-1">Fill in the details to attract the right candidates</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-1.5">Job Title *</label>
            <input type="text" className="input-field" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Software Engineer" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy-200 mb-1.5">Job Description *</label>
            <textarea rows={5} className="input-field" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe the role, responsibilities, and requirements..." required />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-navy-200 mb-1.5">Location</label>
              <input type="text" className="input-field" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Bangalore, Remote..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-200 mb-1.5">Salary / Stipend</label>
              <input type="text" className="input-field" value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="₹8 LPA / ₹25,000/month" />
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-200 mb-1.5">Job Type</label>
              <select className="input-field" value={form.jobType} onChange={e => set('jobType', e.target.value)}>
                <option>Full-Time</option>
                <option>Internship</option>
                <option>Part-Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-navy-200 mb-1.5">Application Deadline</label>
              <input type="date" className="input-field" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
            </div>
          </div>

          <div className="border-t border-navy-700 pt-5">
            <h3 className="font-semibold text-white mb-4">Eligibility Criteria</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Min CGPA</label>
                <input type="number" step="0.1" min="0" max="10" className="input-field" value={form.eligibility.minCGPA} onChange={e => setElig('minCGPA', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Required Degree</label>
                <input type="text" className="input-field" value={form.eligibility.degree} onChange={e => setElig('degree', e.target.value)} placeholder="B.Tech / BCA" />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy-200 mb-1.5">Branch (comma separated)</label>
                <input type="text" className="input-field" value={form.eligibility.branch} onChange={e => setElig('branch', e.target.value)} placeholder="CS, IT, ECE" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
            {loading ? <div className="w-5 h-5 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" /> : <><PlusCircle size={18} /> Post Job</>}
          </button>
        </form>
      </div>
    </Layout>
  )
}

export default PostJob
