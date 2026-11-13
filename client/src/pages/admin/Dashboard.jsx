import React, { useState, useEffect } from 'react';
import { Users, Building2, Briefcase, FileText, CheckCircle, TrendingUp } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Layout from '../../components/common/Layout';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import api from '../../services/api';

const defaultStats = {
  totalStudents: 0,
  companies: 0,
  activeJobs: 0,
  applications: 0,
  studentsPlaced: 0,
  placementRate: 0,
};

const Dashboard = () => {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        const fetchedData = res.data?.data || res.data?.stats || res.data;
        if (fetchedData && typeof fetchedData === 'object') {
          setStats({
            totalStudents: fetchedData.totalStudents ?? fetchedData.students ?? 0,
            companies: fetchedData.companies ?? fetchedData.totalCompanies ?? 0,
            activeJobs: fetchedData.activeJobs ?? fetchedData.jobs ?? 0,
            applications: fetchedData.applications ?? fetchedData.totalApplications ?? 0,
            studentsPlaced: fetchedData.studentsPlaced ?? fetchedData.placed ?? 0,
            placementRate: fetchedData.placementRate ?? 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const safeStats = stats || defaultStats;

  const pieData = [
    { name: 'Students Registered', value: Number(safeStats.totalStudents) || 0, color: '#3b82f6' },
    { name: 'Companies Verified', value: Number(safeStats.companies) || 0, color: '#a855f7' },
    { name: 'Active Jobs', value: Number(safeStats.activeJobs) || 0, color: '#f59e0b' },
    { name: 'Total Applications', value: Number(safeStats.applications) || 0, color: '#10b981' },
  ];

  return (
    <Layout>
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
            value={safeStats.totalStudents}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Companies"
            value={safeStats.companies}
            icon={Building2}
            color="purple"
          />
          <StatCard
            title="Active Jobs"
            value={safeStats.activeJobs}
            icon={Briefcase}
            color="amber"
          />
          <StatCard
            title="Applications"
            value={safeStats.applications}
            icon={FileText}
            color="emerald"
          />
          <StatCard
            title="Students Placed"
            value={safeStats.studentsPlaced}
            icon={CheckCircle}
            color="cyan"
          />
          <StatCard
            title="Placement Rate"
            value={`${safeStats.placementRate}%`}
            icon={TrendingUp}
            color="rose"
          />
        </div>

        {/* Single Full-Width Platform Overview Chart */}
        <div className="bg-[#0f172a] border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">Platform Overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ecosystem distribution across entities</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Live Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0a0f1d',
                      border: '1px solid #1e293b',
                      borderRadius: '10px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {pieData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-900/70 border border-slate-800/80"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;