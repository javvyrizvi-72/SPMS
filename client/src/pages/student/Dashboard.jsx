import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import StatCard from '../../components/common/StatCard'
import { useAuth } from '../../context/AuthContext'
import { getMyApplications, getAllJobs, getStudentProfile } from '../../services/api'
import { Briefcase, FileText, CheckCircle, Clock, TrendingUp } from 'lucide-react'
import { formatDate, getStatusBadge } from '../../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [applications, setApplications] = useState([])
  const [jobs, setJobs] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appRes, jobRes, profileRes] = await Promise.allSettled([
          getMyApplications(),
          getAllJobs(),
          getStudentProfile()
        ])

        // Safely extract applications array
        if (appRes.status === 'fulfilled' && appRes.value?.data) {
          const rawApps = appRes.value.data
          const appsList = Array.isArray(rawApps)
            ? rawApps
            : Array.isArray(rawApps.applications)
            ? rawApps.applications
            : Array.isArray(rawApps.data)
            ? rawApps.data
            : []
          setApplications(appsList)
        }

        // Safely extract jobs array
        if (jobRes.status === 'fulfilled' && jobRes.value?.data) {
          const rawJobs = jobRes.value.data
          const jobsList = Array.isArray(rawJobs)
            ? rawJobs
            : Array.isArray(rawJobs.jobs)
            ? rawJobs.jobs
            : Array.isArray(rawJobs.data)
            ? rawJobs.data
            : []
          setJobs(jobsList)
        }

        // Safely extract profile
        if (profileRes.status === 'fulfilled' && profileRes.value?.data) {
          const rawProfile = profileRes.value.data
          setProfile(rawProfile.profile || rawProfile.data || rawProfile)
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Defensive array checks
  const safeApplications = Array.isArray(applications) ? applications : []
  const safeJobs = Array.isArray(jobs) ? jobs : []

  const stats = {
    total: safeApplications.length,
    selected: safeApplications.filter(a => a?.status === 'Selected').length,
    interview: safeApplications.filter(a => a?.status === 'Interview').length,
    pending: safeApplications.filter(a => a?.status === 'Applied').length,
  }

  const chartData = [
    { name: 'Applied', count: stats.pending },
    { name: 'Shortlisted', count: safeApplications.filter(a => a?.status === 'Shortlisted').length },
    { name: 'Interview', count: stats.interview },
    { name: 'Selected', count: stats.selected },
    { name: 'Rejected', count: safeApplications.filter(a => a?.status === 'Rejected').length },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-yellow-500 border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name || 'Student'}! 👋</h1>
          <p className="text-slate-400 mt-1">Here's your placement journey overview</p>
        </div>

        {profile && !profile?.isApproved && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
            <Clock className="text-yellow-400 shrink-0" size={20} />
            <p className="text-yellow-300 text-sm font-medium">
              Your profile is pending admin approval. Complete your profile to get started.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Applications" value={stats.total} icon={FileText} color="blue" />
          <StatCard title="Selected" value={stats.selected} icon={CheckCircle} color="green" />
          <StatCard title="Interviews" value={stats.interview} icon={TrendingUp} color="purple" />
          <StatCard title="Jobs Available" value={safeJobs.length} icon={Briefcase} color="orange" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4">Application Status</h2>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#b4cdea' }} stroke="#254a78" />
                  <YAxis allowDecimals={false} tick={{ fill: '#b4cdea' }} stroke="#254a78" />
                  <Tooltip
                    contentStyle={{ background: '#12263f', border: '1px solid #254a78', borderRadius: 8, color: '#eaf1fb' }}
                    itemStyle={{ color: '#eaf1fb' }}
                    labelStyle={{ color: '#e6c867' }}
                    cursor={{ fill: 'rgba(201,162,39,0.08)' }}
                  />
                  <Bar dataKey="count" fill="#c9a227" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Applications</h2>
            {safeApplications.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="mx-auto text-slate-500 mb-2" size={40} />
                <p className="text-slate-400 text-sm">No applications yet. Start applying!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {safeApplications.slice(0, 5).map(app => (
                  <div key={app._id || Math.random()} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <p className="font-medium text-white text-sm">{app.job?.title || 'Unknown Role'}</p>
                      <p className="text-xs text-slate-400">{formatDate ? formatDate(app.appliedAt) : app.appliedAt}</p>
                    </div>
                    <span className={getStatusBadge ? getStatusBadge(app.status) : 'px-2 py-1 rounded text-xs bg-slate-700 text-slate-200'}>
                      {app.status || 'Applied'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default StudentDashboard