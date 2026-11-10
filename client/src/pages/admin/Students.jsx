import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import { getAllStudents, approveStudent, deleteUser } from '../../services/api'
import { CheckCircle, Trash2, Search, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'

const Students = () => {
  const [students, setStudents] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await getAllStudents()
        setStudents(data)
        setFiltered(data)
      } catch { toast.error('Failed to load students') }
      finally { setLoading(false) }
    }
    fetch()
  }, [])

  useEffect(() => {
    setFiltered(students.filter(s =>
      s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.college?.toLowerCase().includes(search.toLowerCase())
    ))
  }, [search, students])

  const handleApprove = async (id) => {
    try {
      await approveStudent(id)
      setStudents(prev => prev.map(s => s._id === id ? { ...s, isApproved: true } : s))
      toast.success('Student approved!')
    } catch { toast.error('Failed to approve') }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Delete this student?')) return
    try {
      await deleteUser(userId)
      setStudents(prev => prev.filter(s => s.user?._id !== userId))
      toast.success('Student deleted')
    } catch { toast.error('Failed to delete') }
  }

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-4 border-gold-500 border-t-transparent"></div></div></Layout>

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Students</h1>
            <p className="text-navy-400 mt-1">{filtered.length} registered students</p>
          </div>
        </div>

        <div className="relative">
          <Search size={18} className="absolute left-3 top-2.5 text-navy-400" />
          <input type="text" className="input-field pl-10" placeholder="Search by name, email, college..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? (
          <div className="card text-center py-16"><GraduationCap className="mx-auto text-navy-500 mb-2" size={48} /><p className="text-navy-400">No students found</p></div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-navy-900 border-b border-navy-700">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300">Name</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300 hidden md:table-cell">College</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300 hidden sm:table-cell">CGPA</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-semibold text-navy-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-700">
                  {filtered.map(student => (
                    <tr key={student._id} className="hover:bg-navy-700">
                      <td className="py-4 px-6">
                        <p className="font-medium text-white">{student.user?.name}</p>
                        <p className="text-xs text-navy-400">{student.user?.email}</p>
                      </td>
                      <td className="py-4 px-6 text-sm text-navy-300 hidden md:table-cell">{student.college || 'N/A'}</td>
                      <td className="py-4 px-6 text-sm text-navy-300 hidden sm:table-cell">{student.cgpa || 'N/A'}</td>
                      <td className="py-4 px-6">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${student.isApproved ? 'bg-green-500/15 text-green-300' : 'bg-yellow-500/15 text-yellow-300'}`}>
                          {student.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          {!student.isApproved && (
                            <button onClick={() => handleApprove(student._id)} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="Approve">
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button onClick={() => handleDelete(student.user?._id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Students
