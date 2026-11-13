import { useEffect, useState } from 'react'
import Layout from '../../components/common/Layout'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { Trash2, CheckCircle, Clock, Check, X } from 'lucide-react'

const Students = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  const fetchStudents = async () => {
    try {
      const res = await api.get('/admin/students')
      const data = Array.isArray(res.data) ? res.data : (res.data?.students || res.data?.data || [])
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

  const handleStatusToggle = async (student) => {
    const targetId = student._id || student.userId || student.id
    const newStatus = student.status === 'Approved' ? 'Pending' : 'Approved'
    const newApproval = newStatus === 'Approved'

    setUpdatingId(targetId)
    try {
      await api.put(`/admin/students/${targetId}/status`, { 
        status: newStatus,
        isApproved: newApproval 
      })
      toast.success(`Student status updated to ${newStatus}`)
      setStudents(prev => prev.map(s => {
        const sid = s._id || s.userId || s.id
        return sid === targetId ? { ...s, status: newStatus, isApproved: newApproval } : s
      }))
    } catch (err) {
      console.error('Status update failed:', err)
      toast.error(err.response?.data?.message || 'Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDelete = async (student) => {
    const targetId = student._id || student.userId || student.id

    if (!targetId) {
      toast.error('Student ID not found')
      return
    }

    if (!window.confirm(`Are you sure you want to delete ${getStudentName(student)}?`)) {
      return
    }

    setDeletingId(targetId)

    try {
      await api.delete(`/admin/students/${targetId}`)
      toast.success('Student deleted successfully')
      setStudents(prev => prev.filter(s => {
        const sid = s._id || s.userId || s.id
        return sid !== targetId
      }))
    } catch (err) {
      console.error('Delete student request failed:', err)
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const getStudentName = (s) => {
    if (s.name && typeof s.name === 'string') return s.name
    if (s.user?.name) return s.user.name
    if (s.fullName) return s.fullName
    return 'Student'
  }

  const getStudentEmail = (s) => {
    return s.email || s.user?.email || 'N/A'
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Students</h1>
          <p className="text-slate-400 mt-1">{students.length} registered students</p>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/80">
                  <th className="py-4 px-6">Name & Email</th>
                  <th className="py-4 px-6">College</th>
                  <th className="py-4 px-6">CGPA</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      No students found
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => {
                    const sid = student._id || student.userId || student.id || index
                    const isApproved = student.status === 'Approved' || student.isApproved

                    return (
                      <tr key={sid} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-white">{getStudentName(student)}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{getStudentEmail(student)}</p>
                        </td>
                        <td className="py-4 px-6 text-slate-300">
                          {student.college || student.department || 'Presidency'}
                        </td>
                        <td className="py-4 px-6 font-semibold text-amber-400">
                          {student.cgpa || 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {isApproved ? <CheckCircle size={13} /> : <Clock size={13} />}
                            {isApproved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => handleStatusToggle(student)}
                            disabled={updatingId === sid}
                            className={`p-2 rounded-lg transition-colors border ${
                              isApproved 
                                ? 'text-amber-400 hover:bg-amber-500/10 border-amber-500/20' 
                                : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'
                            }`}
                            title={isApproved ? "Mark Pending" : "Approve Student"}
                          >
                            {isApproved ? <X size={15} /> : <Check size={15} />}
                          </button>

                          <button
                            onClick={() => handleDelete(student)}
                            disabled={deletingId === sid}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
                            title="Delete student"
                          >
                            <Trash2 size={15} />
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