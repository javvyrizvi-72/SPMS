import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import { getAllJobs, applyForJob } from '../../services/api'
import toast from 'react-hot-toast'
import { Briefcase, MapPin, Clock, Search, Filter } from 'lucide-react'
import { formatDate, truncate } from '../../utils/helpers'

const Jobs = () => {
  const [jobs, setJobs] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [selectedJob, setSelectedJob] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getAllJobs()
        setJobs(data)
        setFiltered(data)
      } catch { toast.error('Failed to load jobs') }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  useEffect(() => {
    let result = jobs
    if (search) result = result.filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.company?.companyName?.toLowerCase().includes(search.toLowerCase()))
    if (typeFilter !== 'All') result = result.filter(j => j.jobType === typeFilter)
    setFiltered(result)
  }, [search, typeFilter, jobs])

  const handleApply = async (jobId) => {
    setApplying(jobId)
    try {
      await applyForJob(jobId)
      toast.success('Application submitted successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply')
    } finally {
      setApplying(null)
    }
  }

  // Format salary to remove any dollar signs
  const formatSalary = (salary) => {
    if (!salary) return ''
    return String(salary).replace(/\$/g, '').trim()
  }

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent"></div></div></Layout>

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Browse Jobs</h1>
          <p className="text-navy-400 mt-1">{filtered.length} opportunities available</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-2.5 text-navy-400" />
            <input type="text" className="input-field pl-10" placeholder="Search jobs or companies..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field sm:w-48" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="All">All Types</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Internship">Internship</option>
            <option value="Part-Time">Part-Time</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Briefcase className="mx-auto text-navy-500 mb-3" size={48} />
            <p className="text-navy-400 font-medium">No jobs found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map(job => (
              <div key={job._id} className="card hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedJob(selectedJob?._id === job._id ? null : job)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{job.title}</h3>
                    <p className="text-gold-400 text-sm font-medium">{job.company?.companyName}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    job.jobType === 'Full-Time' ? 'bg-green-500/15 text-green-300' :
                    job.jobType === 'Internship' ? 'bg-blue-500/15 text-blue-300' : 'bg-purple-500/15 text-purple-300'
                  }`}>{job.jobType}</span>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-navy-400 mb-3">
                  {job.location && <span className="flex items-center gap-1"><MapPin size={14} />{job.location}</span>}
                  {job.salary && <span className="flex items-center font-medium text-navy-300">{formatSalary(job.salary)}</span>}
                  {job.deadline && <span className="flex items-center gap-1"><Clock size={14} />Deadline: {formatDate(job.deadline)}</span>}
                </div>

                <p className="text-sm text-navy-300 mb-4">{truncate(job.description, 120)}</p>

                {job.eligibility?.minCGPA > 0 && (
                  <p className="text-xs text-gold-300 font-medium mb-3">Min CGPA: {job.eligibility.minCGPA}</p>
                )}

                {selectedJob?._id === job._id && (
                  <div className="border-t border-navy-700 pt-3 mb-3">
                    <p className="text-sm text-navy-200 whitespace-pre-line">{job.description}</p>
                  </div>
                )}

                <button
                  onClick={(e) => { e.stopPropagation(); handleApply(job._id) }}
                  disabled={applying === job._id}
                  className="btn-primary w-full py-2 text-sm"
                >
                  {applying === job._id ? 'Applying...' : 'Apply Now'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Jobs