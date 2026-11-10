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
        const [appRes, jobRes, profileRes] = await Promise.all([
          getMyApplications(), getAllJobs(), getStudentProfile()
        ])
        setApplications(appRes.data)
        setJobs(jobRes.data)
        setProfile(profileRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const stats = {
    total: applications.length,
    selected: applications.filter(a => a.status === 'Selected').length,
    interview: applications.filter(a => a.status === 'Interview').length,
    pending: applications.filter(a => a.status === 'Applied').length,
  }

  const chartData = [
    { name: 'Applied', count: stats.pending },
    { name: 'Shortlisted', count: applications.filter(a => a.status === 'Shortlisted').length },
    { name: 'Interview', count: stats.interview },
    { name: 'Selected', count: stats.selected },
    { name: 'Rejected', count: applications.filter(a => a.status === 'Rejected').length },
  ]

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent"></div></div></Layout>

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.name}! 👋</h1>
          <p className="text-navy-400 mt-1">Here's your placement journey overview</p>
        </div>

        {!profile?.isApproved && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-center gap-3">
            <Clock className="text-yellow-400 shrink-0" size={20} />
            <p className="text-yellow-300 text-sm font-medium">Your profile is pending admin approval. Complete your profile to get started.</p>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Applications" value={stats.total} icon={FileText} color="blue" />
          <StatCard title="Selected" value={stats.selected} icon={CheckCircle} color="green" />
          <StatCard title="Interviews" value={stats.interview} icon={TrendingUp} color="purple" />
          <StatCard title="Jobs Available" value={jobs.length} icon={Briefcase} color="orange" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Application Status</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#b4cdea' }} stroke="#254a78" />
                <YAxis allowDecimals={false} tick={{ fill: '#b4cdea' }} stroke="#254a78" />
                <Tooltip contentStyle={{ background: '#12263f', border: '1px solid #254a78', borderRadius: 8, color: '#eaf1fb' }} itemStyle={{ color: '#eaf1fb' }} labelStyle={{ color: '#e6c867' }} cursor={{ fill: 'rgba(201,162,39,0.08)' }} />
                <Bar dataKey="count" fill="#c9a227" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Applications</h2>
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="mx-auto text-navy-500 mb-2" size={40} />
                <p className="text-navy-400 text-sm">No applications yet. Start applying!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.slice(0, 5).map(app => (
                  <div key={app._id} className="flex items-center justify-between py-2 border-b border-navy-700 last:border-0">
                    <div>
                      <p className="font-medium text-white text-sm">{app.job?.title}</p>
                      <p className="text-xs text-navy-400">{formatDate(app.appliedAt)}</p>
                    </div>
                    <span className={getStatusBadge(app.status)}>{app.status}</span>
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
