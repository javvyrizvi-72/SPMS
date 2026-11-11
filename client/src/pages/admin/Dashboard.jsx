import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Users, Building2, Briefcase, FileText, CheckCircle, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#06B6D4']

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    activeJobs: 0,
    totalApplications: 0,
    studentsPlaced: 0,
    placementRate: 0,
  })
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        let res
        try {
          res = await api.get('/admin/stats')
        } catch {
          res = await api.get('/admin/dashboard-stats')
        }

        const d = res?.data || {}
        const totalStudents = Number(d.totalStudents ?? d.students ?? 0)
        const totalCompanies = Number(d.totalCompanies ?? d.companies ?? 0)
        const activeJobs = Number(d.activeJobs ?? d.totalJobs ?? d.jobs ?? 0)
        const totalApplications = Number(d.totalApplications ?? d.applications ?? 0)
        const studentsPlaced = Number(d.studentsPlaced ?? d.placed ?? 0)
        const placementRate = Number(
          d.placementRate ??
            (totalApplications > 0
              ? Math.round((studentsPlaced / totalApplications) * 100)
              : 0)
        )

        setStats({
          totalStudents,
          totalCompanies,
          activeJobs,
          totalApplications,
          studentsPlaced,
          placementRate,
        })

        const activePieValues = [
          { name: 'Students', value: totalStudents },
          { name: 'Companies', value: totalCompanies },
          { name: 'Jobs', value: activeJobs },
          { name: 'Applications', value: totalApplications },
          { name: 'Placed', value: studentsPlaced },
        ].filter((item) => item.value > 0)

        setChartData(
          activePieValues.length > 0
            ? activePieValues
            : [{ name: 'No Activity', value: 1 }]
        )
      } catch (err) {
        console.error('Stats fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Companies', value: stats.totalCompanies, icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Applications', value: stats.totalApplications, icon: FileText, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Students Placed', value: stats.studentsPlaced, icon: CheckCircle, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Placement Rate', value: `${stats.placementRate}%`, icon: TrendingUp, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-navy-400 mt-1">Platform overview and analytics</p>
        </div>

        {/* Top 6 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map((card, i) => {
            const Icon = card.icon
            return (
              <div key={i} className="card bg-navy-900/60 border border-navy-700/60 p-5 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-navy-400 text-sm font-medium">{card.label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon size={24} className={card.color} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Platform Overview with Pie Chart & Breakdown */}
        <div className="card bg-navy-900/60 border border-navy-700/60 p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-white mb-6">Platform Overview</h3>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Interactive Pie Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Metrics List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-navy-800/80 text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Students registered
                </span>
                <span className="font-bold text-white text-base">{stats.totalStudents}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-navy-800/80 text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  Companies verified
                </span>
                <span className="font-bold text-white text-base">{stats.totalCompanies}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-navy-800/80 text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  Jobs actively hiring
                </span>
                <span className="font-bold text-white text-base">{stats.activeJobs}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-navy-800/80 text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  Total candidate applications
                </span>
                <span className="font-bold text-white text-base">{stats.totalApplications}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="flex items-center gap-2 text-navy-300">
                  <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
                  Students placed
                </span>
                <span className="font-bold text-white text-base">{stats.studentsPlaced}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard