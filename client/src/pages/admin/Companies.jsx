import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import { getAllCompanies, approveCompany, deleteUser } from '../../services/api'
import { CheckCircle, Trash2, Search, Building2, Globe, MapPin, Mail, ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const Companies = () => {
  const [companies, setCompanies] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'pending' | 'approved'
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getAllCompanies()
        setCompanies(data)
        setFiltered(data)
      } catch { 
        toast.error('Failed to load companies') 
      } finally { 
        setLoading(false) 
      }
    }
    fetch()
  }, [])

  useEffect(() => {
    let list = companies.filter(c =>
      c.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase()) ||
      c.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.location?.toLowerCase().includes(search.toLowerCase())
    )

    if (filterTab === 'pending') list = list.filter(c => !c.isApproved)
    if (filterTab === 'approved') list = list.filter(c => c.isApproved)

    setFiltered(list)
  }, [search, filterTab, companies])

  const handleApprove = async (id) => {
    setActionId(id)
    try {
      await approveCompany(id)
      setCompanies(prev => prev.map(c => c._id === id ? { ...c, isApproved: true } : c))
      toast.success('Company verified and approved!')
    } catch { 
      toast.error('Failed to approve company') 
    } finally {
      setActionId(null)
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this company? All posted jobs will be removed.')) return
    setActionId(userId)
    try {
      await deleteUser(userId)
      setCompanies(prev => prev.filter(c => c.user?._id !== userId))
      toast.success('Company deleted successfully')
    } catch { 
      toast.error('Failed to delete') 
    } finally {
      setActionId(null)
    }
  }

  const pendingCount = companies.filter(c => !c.isApproved).length

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
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Company Verifications</h1>
            <p className="text-navy-400 mt-1">Review credentials, website, and authorize recruiter accounts</p>
          </div>
          {pendingCount > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 self-start">
              <AlertTriangle size={16} />
              <span>{pendingCount} Pending Verification</span>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-2.5 text-navy-400" />
            <input 
              type="text" 
              className="input-field pl-10" 
              placeholder="Search by company name, industry, email, location..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <div className="flex bg-navy-900 border border-navy-700 rounded-lg p-1">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterTab === 'all' ? 'bg-navy-800 text-white shadow-sm' : 'text-navy-400 hover:text-white'}`}
            >
              All ({companies.length})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterTab === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : 'text-navy-400 hover:text-white'}`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterTab('approved')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filterTab === 'approved' ? 'bg-green-500/20 text-green-300' : 'text-navy-400 hover:text-white'}`}
            >
              Verified ({companies.length - pendingCount})
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Building2 className="mx-auto text-navy-500 mb-2" size={48} />
            <p className="text-navy-400 font-medium">No matching companies found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(company => {
              const isGmail = company.user?.email?.endsWith('@gmail.com') || company.user?.email?.endsWith('@yahoo.com')

              return (
                <div key={company._id} className="card flex flex-col md:flex-row md:items-center justify-between gap-5 border border-navy-800 hover:border-navy-700 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-semibold text-white text-lg">{company.companyName}</h3>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                        company.isApproved ? 'bg-green-500/15 text-green-300 border border-green-500/20' : 'bg-yellow-500/15 text-yellow-300 border border-yellow-500/20'
                      }`}>
                        {company.isApproved ? <><ShieldCheck size={12} /> Verified</> : <><AlertTriangle size={12} /> Needs Approval</>}
                      </span>
                    </div>

                    {/* Email & Warning */}
                    <div className="flex items-center gap-2 text-sm text-navy-300 flex-wrap">
                      <span className="flex items-center gap-1 text-navy-400">
                        <Mail size={14} />
                        {company.user?.email || 'No email provided'}
                      </span>
                      {isGmail && (
                        <span className="text-[11px] bg-red-500/10 text-red-300 px-2 py-0.5 rounded border border-red-500/20">
                          Personal Domain (Review Carefully)
                        </span>
                      )}
                    </div>

                    {/* Details Badges */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {company.industry && (
                        <span className="bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-md border border-blue-500/20">
                          {company.industry}
                        </span>
                      )}
                      {company.location && (
                        <span className="bg-navy-800 text-navy-300 px-2.5 py-1 rounded-md flex items-center gap-1">
                          <MapPin size={12} /> {company.location}
                        </span>
                      )}
                      {company.website ? (
                        <a 
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors"
                        >
                          <Globe size={12} /> {company.website.replace(/^https?:\/\//, '')} <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span className="text-navy-500 italic py-1">No website listed</span>
                      )}
                    </div>

                    {company.description && (
                      <p className="text-xs text-navy-400 line-clamp-2 max-w-2xl pt-1">
                        {company.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-navy-800">
                    {!company.isApproved && (
                      <button 
                        onClick={() => handleApprove(company._id)} 
                        disabled={actionId === company._id}
                        className="btn-primary py-2 px-4 text-sm flex items-center gap-2 whitespace-nowrap shadow-md"
                      >
                        {actionId === company._id ? (
                          <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCircle size={16} />
                        )}
                        Authorize Recruiter
                      </button>
                    )}

                    <button 
                      onClick={() => handleDelete(company.user?._id)} 
                      disabled={actionId === company.user?._id}
                      title="Delete Company"
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Companies