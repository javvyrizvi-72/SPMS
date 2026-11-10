import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import { getMyApplications } from '../../services/api'
import { formatDate, getStatusBadge } from '../../utils/helpers'
import { FileText, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

const Applications = () => {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getMyApplications()
        setApplications(data)
      } catch { toast.error('Failed to load applications') }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent"></div></div></Layout>

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Applications</h1>
          <p className="text-navy-400 mt-1">{applications.length} total applications</p>
        </div>

        {applications.length === 0 ? (
          <div className="card text-center py-16">
            <FileText className="mx-auto text-navy-500 mb-3" size={48} />
            <p className="text-navy-400 font-medium">No applications yet</p>
            <p className="text-navy-400 text-sm">Browse jobs and start applying!</p>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="w-full">
              <thead className="bg-navy-900 border-b border-navy-700">
                <tr>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300">Job Title</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300 hidden sm:table-cell">Company</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300 hidden md:table-cell">Applied On</th>
                  <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700">
                {applications.map(app => (
                  <tr key={app._id} className="hover:bg-navy-700 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-navy-400 shrink-0" />
                        <span className="font-medium text-white text-sm">{app.job?.title || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-navy-300 hidden sm:table-cell">{app.job?.company?.companyName || 'N/A'}</td>
                    <td className="py-4 px-6 text-sm text-navy-400 hidden md:table-cell">{formatDate(app.appliedAt)}</td>
                    <td className="py-4 px-6">
                      <span className={getStatusBadge(app.status)}>{app.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Applications
