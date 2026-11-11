import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Trash2, CheckCircle, Clock } from 'lucide-react'

const Students = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students')
      const data = Array.isArray(res.data) ? res.data : (res.data?.students || [])
      setStudents(data)
    } catch (err) {
      console.error('Failed to load students:', err)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  const handleDelete = async (student) => {
    // Determine the exact ID to send
    const targetId = student._id || student.userId || student.id

    if (!targetId) {
      toast.error('Student ID not found')
      return
    }

    if (!window.confirm(`Are you sure you want to delete ${student.name || 'this student'}?`)) {
      return
    }

    setDeletingId(targetId)

    try {
      await api.delete(`/admin/students/${targetId}`)
      toast.success('Student deleted successfully')
      // Remove immediately from UI state
      setStudents(prev => prev.filter(s => {
        const sid = s._id || s.userId || s.id
        return sid !== targetId
      }))
    } catch (err) {
      console.error('Delete student request failed:', err)
      const errorMsg = err.response?.data?.message || 'Failed to delete'
      toast.error(errorMsg)
    } finally {
      setDeletingId(null)
    }
  }

  const getStudentName = (s) => {
    if (s.name && typeof s.name === 'string') return s.name
    if (s.user?.name) return s.user.name
    if (s.fullName) return s.fullName
    return 'Presidency Student'
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
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-navy-400 mt-1">{students.length} registered students</p>
        </div>

        <div className="card bg-navy-900/60 border border-navy-700/60 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-navy-700/60 text-navy-400 text-xs uppercase tracking-wider bg-navy-800/40">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">College</th>
                  <th className="py-3 px-4">CGPA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/60 text-sm">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-navy-400">
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => {
                    const sid = student._id || student.userId || student.id || index
                    return (
                      <tr key={sid} className="hover:bg-navy-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium text-white">{getStudentName(student)}</p>
                          <p className="text-xs text-navy-400">{student.email || 'N/A'}</p>
                        </td>
                        <td className="py-3 px-4 text-navy-300">
                          {student.college || 'Presidency'}
                        </td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {student.cgpa || '9.5'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                            student.status === 'Approved'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}>
                            {student.status === 'Approved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                            {student.status || 'Approved'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDelete(student)}
                            disabled={deletingId === (student._id || student.userId || student.id)}
                            className="p-1.5 text-navy-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-500/10"
                            title="Delete student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Students