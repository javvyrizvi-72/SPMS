import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import { getDashboardStats, getAllApplications } from '../../services/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import { getStatusBadge, formatDate } from '../../utils/helpers'
import toast from 'react-hot-toast'

const Reports = () => {
  const [stats, setStats] = useState(null)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, appsRes] = await Promise.all([getDashboardStats(), getAllApplications()])
        setStats(statsRes.data)
        setApplications(appsRes.data)
      } catch { toast.error('Failed to load reports') }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  const statusData = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected'].map(status => ({
    status,
    count: applications.filter(a => a.status === status).length
  }))

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent"></div></div></Layout>

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-navy-400 mt-1">Placement statistics and insights</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Application Status Distribution</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData}>
                <XAxis dataKey="status" tick={{ fontSize: 11, fill: '#b4cdea' }} stroke="#254a78" />
                <YAxis allowDecimals={false} tick={{ fill: '#b4cdea' }} stroke="#254a78" />
                <Tooltip contentStyle={{ background: '#12263f', border: '1px solid #254a78', borderRadius: 8, color: '#eaf1fb' }} itemStyle={{ color: '#eaf1fb' }} labelStyle={{ color: '#e6c867' }} cursor={{ fill: 'rgba(201,162,39,0.08)' }} />
                <Bar dataKey="count" fill="#c9a227" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Summary Stats</h2>
            <div className="space-y-4">
              {[
                { label: 'Total Students', value: stats?.totalStudents },
                { label: 'Total Companies', value: stats?.totalCompanies },
                { label: 'Total Jobs Posted', value: stats?.totalJobs },
                { label: 'Total Applications', value: stats?.totalApplications },
                { label: 'Students Placed', value: stats?.placed },
                { label: 'Placement Rate', value: stats?.totalStudents ? `${Math.round((stats?.placed / stats?.totalStudents) * 100)}%` : '0%' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-navy-700 last:border-0">
                  <span className="text-navy-300 text-sm">{item.label}</span>
                  <span className="font-semibold text-white">{item.value ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="p-5 border-b border-navy-700">
            <h2 className="text-lg font-semibold text-white">Recent Applications</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-900">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300">Student</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300 hidden sm:table-cell">Job</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300 hidden md:table-cell">Applied</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {applications.slice(0, 20).map(app => (
                  <tr key={app._id} className="hover:bg-navy-700">
                    <td className="py-3 px-6 text-sm font-medium text-white">{app.student?.user?.name || 'N/A'}</td>
                    <td className="py-3 px-6 text-sm text-navy-300 hidden sm:table-cell">{app.job?.title || 'N/A'}</td>
                    <td className="py-3 px-6 text-sm text-navy-400 hidden md:table-cell">{formatDate(app.appliedAt)}</td>
                    <td className="py-3 px-6"><span className={getStatusBadge(app.status)}>{app.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Reports
