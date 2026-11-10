import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import StatCard from '../../components/common/StatCard'
import { getDashboardStats, getAllStudents, getAllCompanies } from '../../services/api'
import { Users, Building2, Briefcase, FileText, CheckCircle, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import toast from 'react-hot-toast'

const COLORS = ['#c9a227', '#3a6fa8', '#7fa6d6', '#10b981', '#ef4444']

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getDashboardStats()
        setStats(data)
      } catch { toast.error('Failed to load stats') }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent"></div></div></Layout>

  const pieData = [
    { name: 'Students', value: stats?.totalStudents || 0 },
    { name: 'Companies', value: stats?.totalCompanies || 0 },
    { name: 'Jobs', value: stats?.totalJobs || 0 },
    { name: 'Applications', value: stats?.totalApplications || 0 },
    { name: 'Placed', value: stats?.placed || 0 },
  ]

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-navy-400 mt-1">Platform overview and analytics</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Students" value={stats?.totalStudents || 0} icon={Users} color="blue" />
          <StatCard title="Companies" value={stats?.totalCompanies || 0} icon={Building2} color="purple" />
          <StatCard title="Active Jobs" value={stats?.totalJobs || 0} icon={Briefcase} color="orange" />
          <StatCard title="Applications" value={stats?.totalApplications || 0} icon={FileText} color="blue" />
          <StatCard title="Students Placed" value={stats?.placed || 0} icon={CheckCircle} color="green" />
          <StatCard title="Placement Rate" value={stats?.totalStudents ? `${Math.round((stats?.placed / stats?.totalStudents) * 100)}%` : '0%'} icon={TrendingUp} color="green" />
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Platform Overview</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" stroke="#12263f" label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#12263f', border: '1px solid #254a78', borderRadius: 8, color: '#eaf1fb' }} itemStyle={{ color: '#eaf1fb' }} labelStyle={{ color: '#e6c867' }} cursor={{ fill: 'rgba(201,162,39,0.08)' }} />
              <Legend formatter={(v) => <span style={{ color: '#b4cdea' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  )
}

export default AdminDashboard
