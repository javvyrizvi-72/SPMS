import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import StatCard from '../../components/common/StatCard'
import { getCompanyProfile, getCompanyJobs, getJobApplications } from '../../services/api'
import { Briefcase, Users, CheckCircle, Clock } from 'lucide-react'
import { formatDate, getStatusBadge } from '../../utils/helpers'
import toast from 'react-hot-toast'

const CompanyDashboard = () => {
  const [profile, setProfile] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [profileRes, jobsRes] = await Promise.all([getCompanyProfile(), getCompanyJobs()])
        setProfile(profileRes.data)
        setJobs(jobsRes.data)
      } catch { toast.error('Failed to load data') }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent"></div></div></Layout>

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Company Dashboard</h1>
          <p className="text-navy-400 mt-1">Welcome, {profile?.companyName}</p>
        </div>

        {!profile?.isApproved && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
            <Clock className="text-yellow-400" size={20} />
            <p className="text-yellow-300 text-sm font-medium">Your company is pending admin approval. You cannot post jobs until approved.</p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Jobs" value={jobs.filter(j => j.isActive).length} icon={Briefcase} color="blue" />
          <StatCard title="Total Jobs" value={jobs.length} icon={CheckCircle} color="green" />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Your Posted Jobs</h2>
          {jobs.length === 0 ? (
            <div className="text-center py-10">
              <Briefcase className="mx-auto text-navy-500 mb-2" size={40} />
              <p className="text-navy-400">No jobs posted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job._id} className="flex items-center justify-between p-4 bg-navy-900 rounded-xl">
                  <div>
                    <p className="font-semibold text-white">{job.title}</p>
                    <p className="text-sm text-navy-400">{job.location} • {job.jobType}</p>
                    <p className="text-xs text-navy-400 mt-0.5">Posted: {formatDate(job.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${job.isActive ? 'bg-green-500/15 text-green-300' : 'bg-navy-700 text-navy-300'}`}>
                    {job.isActive ? 'Active' : 'Closed'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default CompanyDashboard
