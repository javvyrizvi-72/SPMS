import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import { getAllJobs, applyForJob } from '../../services/api'
import toast from 'react-hot-toast'
import { Briefcase, MapPin, Clock, Search, Building2 } from 'lucide-react'
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
        const response = await getAllJobs()
        const rawData = response?.data
        let jobsList = []

        if (Array.isArray(rawData)) {
          jobsList = rawData
        } else if (rawData && Array.isArray(rawData.jobs)) {
          jobsList = rawData.jobs
        } else if (rawData && Array.isArray(rawData.data)) {
          jobsList = rawData.data
        } else if (Array.isArray(response)) {
          jobsList = response
        }

        // Title ke base par duplicate remove karo aur sirf latest 10 jobs lo
        const uniqueJobsMap = new Map()
        jobsList.forEach(item => {
          const key = (item.title || '').trim().toLowerCase()
          if (key && !uniqueJobsMap.has(key)) {
            uniqueJobsMap.set(key, item)
          } else if (!key) {
            uniqueJobsMap.set(item._id, item)
          }
        })

        const cleanLatest10 = Array.from(uniqueJobsMap.values()).slice(0, 10)

        setJobs(cleanLatest10)
        setFiltered(cleanLatest10)
      } catch (err) {
        console.error('Failed to load jobs:', err)
        toast.error('Failed to load jobs')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    let result = jobs

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(j => {
        const titleMatch = j.title?.toLowerCase().includes(q)
        const companyName = j.companyName || j.company?.companyName || j.company?.name || ''
        const companyMatch = companyName.toLowerCase().includes(q)
        const locationMatch = j.location?.toLowerCase().includes(q)
        return titleMatch || companyMatch || locationMatch
      })
    }

    if (typeFilter !== 'All') {
      result = result.filter(j => (j.jobType || '').toLowerCase() === typeFilter.toLowerCase())
    }

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

  const formatSalary = (salary) => {
    if (!salary) return ''
    return String(salary).replace(/\$/g, '').trim()
  }

  const getCompanyName = (job) => {
    return job.companyName || job.company?.companyName || job.company?.name || 'Top Company'
  }

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
          <h1 className="text-2xl font-bold text-white">Browse Jobs</h1>
          <p className="text-navy-400 mt-1">{filtered.length} opportunities available</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-2.5 text-navy-400" />
            <input
              type="text"
              className="input-field pl-10 w-full"
              placeholder="Search jobs, companies, or locations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field sm:w-48"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
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
              <div
                key={job._id}
                className="card hover:shadow-md transition-shadow cursor-pointer bg-navy-900/60 border border-navy-700/60 p-5 rounded-xl"
                onClick={() => setSelectedJob(selectedJob?._id === job._id ? null : job)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{job.title}</h3>
                    <p className="text-gold-400 text-sm font-medium flex items-center gap-1.5 mt-0.5">
                      <Building2 size={15} />
                      {getCompanyName(job)}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    (job.jobType || '').toLowerCase() === 'full-time'
                      ? 'bg-green-500/15 text-green-300'
                      : (job.jobType || '').toLowerCase() === 'internship'
                      ? 'bg-blue-500/15 text-blue-300'
                      : 'bg-purple-500/15 text-purple-300'
                  }`}>
                    {job.jobType || 'Full-Time'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-sm text-navy-400 mb-3">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />{job.location}
                    </span>
                  )}
                  {job.salary && (
                    <span className="flex items-center font-medium text-navy-300">
                      ₹ {formatSalary(job.salary)}
                    </span>
                  )}
                  {job.deadline && (
                    <span className="flex items-center gap-1">
                      <Clock size={14} />Deadline: {formatDate(job.deadline)}
                    </span>
                  )}
                </div>

                <p className="text-sm text-navy-300 mb-4">{truncate(job.description, 120)}</p>

                {(job.eligibility?.minCGPA > 0 || job.minCgpa > 0) && (
                  <p className="text-xs text-gold-300 font-medium mb-3">
                    Min CGPA: {job.eligibility?.minCGPA || job.minCgpa}
                  </p>
                )}

                {selectedJob?._id === job._id && (
                  <div className="border-t border-navy-700 pt-3 mb-3">
                    <p className="text-sm text-navy-200 whitespace-pre-line">{job.description}</p>
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleApply(job._id)
                  }}
                  disabled={applying === job._id}
                  className="btn-primary w-full py-2 text-sm font-medium mt-2"
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