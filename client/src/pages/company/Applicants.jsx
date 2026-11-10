import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import { getCompanyJobs, getJobApplications, updateApplicationStatus, scheduleInterview } from '../../services/api'
import Modal from '../../components/common/Modal'
import { formatDate, getStatusBadge } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'

const Applicants = () => {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState({})
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interviewModal, setInterviewModal] = useState(null)
  const [interviewForm, setInterviewForm] = useState({ scheduledAt: '', mode: 'Online', link: '' })

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getCompanyJobs()
        setJobs(data)
      } catch { toast.error('Failed to load jobs') }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const loadApplications = async (jobId) => {
    if (applications[jobId]) return
    try {
      const { data } = await getJobApplications(jobId)
      setApplications(prev => ({ ...prev, [jobId]: data }))
    } catch { toast.error('Failed to load applicants') }
  }

  const toggleExpand = (jobId) => {
    if (expanded !== jobId) loadApplications(jobId)
    setExpanded(expanded === jobId ? null : jobId)
  }

  const handleStatusChange = async (appId, status, jobId) => {
    try {
      await updateApplicationStatus(appId, { status })
      setApplications(prev => ({
        ...prev,
        [jobId]: prev[jobId].map(a => a._id === appId ? { ...a, status } : a)
      }))
      toast.success(`Status updated to ${status}`)
    } catch { toast.error('Failed to update status') }
  }

  const handleScheduleInterview = async () => {
    try {
      await scheduleInterview({ applicationId: interviewModal, ...interviewForm })
      toast.success('Interview scheduled!')
      setInterviewModal(null)
    } catch { toast.error('Failed to schedule interview') }
  }

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent"></div></div></Layout>

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Applicants</h1>
          <p className="text-navy-400 mt-1">Review and manage candidates for your job postings</p>
        </div>

        {jobs.length === 0 ? (
          <div className="card text-center py-16"><Users className="mx-auto text-navy-500 mb-2" size={40} /><p className="text-navy-400">No jobs posted yet</p></div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job._id} className="card p-0 overflow-hidden">
                <button onClick={() => toggleExpand(job._id)} className="w-full flex items-center justify-between p-5 hover:bg-navy-700 transition-colors">
                  <div className="text-left">
                    <h3 className="font-semibold text-white">{job.title}</h3>
                    <p className="text-sm text-navy-400">{job.jobType} • Posted {formatDate(job.createdAt)}</p>
                  </div>
                  {expanded === job._id ? <ChevronUp size={20} className="text-navy-400" /> : <ChevronDown size={20} className="text-navy-400" />}
                </button>

                {expanded === job._id && (
                  <div className="border-t border-navy-700">
                    {!applications[job._id] ? (
                      <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-2 border-gold-500 border-t-transparent"></div></div>
                    ) : applications[job._id].length === 0 ? (
                      <p className="text-center py-8 text-navy-400 text-sm">No applicants yet</p>
                    ) : (
                      <div className="divide-y divide-navy-700">
                        {applications[job._id].map(app => (
                          <div key={app._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                            <div>
                              <p className="font-medium text-white">{app.student?.user?.name || 'Student'}</p>
                              <p className="text-sm text-navy-400">CGPA: {app.student?.cgpa} • {app.student?.branch}</p>
                              {app.student?.resume && <a href={app.student.resume} target="_blank" rel="noreferrer" className="text-xs text-gold-400 hover:underline">View Resume</a>}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={getStatusBadge(app.status)}>{app.status}</span>
                              <select
                                className="text-sm border border-navy-600 rounded-lg px-2 py-1"
                                value={app.status}
                                onChange={e => handleStatusChange(app._id, e.target.value, job._id)}
                              >
                                {['Applied','Shortlisted','Interview','Selected','Rejected'].map(s => <option key={s}>{s}</option>)}
                              </select>
                              <button onClick={() => setInterviewModal(app._id)} className="text-xs btn-secondary py-1 px-3">Schedule Interview</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!interviewModal} onClose={() => setInterviewModal(null)} title="Schedule Interview">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-1.5">Date & Time</label>
            <input type="datetime-local" className="input-field" value={interviewForm.scheduledAt} onChange={e => setInterviewForm({...interviewForm, scheduledAt: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-1.5">Mode</label>
            <select className="input-field" value={interviewForm.mode} onChange={e => setInterviewForm({...interviewForm, mode: e.target.value})}>
              <option>Online</option>
              <option>Offline</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-navy-200 mb-1.5">Meeting Link (if online)</label>
            <input type="text" className="input-field" value={interviewForm.link} onChange={e => setInterviewForm({...interviewForm, link: e.target.value})} placeholder="https://meet.google.com/..." />
          </div>
          <button onClick={handleScheduleInterview} className="btn-primary w-full">Confirm Schedule</button>
        </div>
      </Modal>
    </Layout>
  )
}

export default Applicants
