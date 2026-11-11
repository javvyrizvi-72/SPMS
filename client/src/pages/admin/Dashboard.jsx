import React, { useState, useEffect } from 'react';
import { Users, Building2, Briefcase, FileText, CheckCircle, TrendingUp } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 1,
    companies: 5,
    activeJobs: 0,
    applications: 0,
    studentsPlaced: 0,
    placementRate: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        // Fallback default stats if API fails
      }
    };
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Students registered', value: stats.totalStudents, color: '#3b82f6' },
    { name: 'Companies verified', value: stats.companies, color: '#a855f7' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Admin Dashboard</h2>
        <p className="text-slate-400 text-sm mt-1">Platform overview and analytics</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Companies"
          value={stats.companies}
          icon={Building2}
          color="purple"
        />
        <StatCard
          title="Active Jobs"
          value={stats.activeJobs}
          icon={Briefcase}
          color="amber"
        />
        <StatCard
          title="Applications"
          value={stats.applications}
          icon={FileText}
          color="emerald"
        />
        <StatCard
          title="Students Placed"
          value={stats.studentsPlaced}
          icon={CheckCircle}
          color="cyan"
        />
        <StatCard
          title="Placement Rate"
          value={`${stats.placementRate}%`}
          icon={TrendingUp}
          color="rose"
        />
      </div>

      {/* Platform Overview Chart Section */}
      <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Platform Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm font-medium text-slate-300">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;