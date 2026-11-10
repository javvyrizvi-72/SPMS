export const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

export const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export const getStatusBadge = (status) => {
  const map = {
    Applied: 'badge-applied',
    Shortlisted: 'badge-shortlisted',
    Interview: 'badge-interview',
    Selected: 'badge-selected',
    Rejected: 'badge-rejected',
  }
  return map[status] || 'badge-applied'
}

export const truncate = (text, len = 100) =>
  text?.length > len ? text.slice(0, len) + '...' : text || ''

export const getInitials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'

export const getDashboardPath = (role) =>
  role === 'student' ? '/student/dashboard' : role === 'company' ? '/company/dashboard' : '/admin/dashboard'

export const timeAgoShort = (date) => {
  if (!date) return ''
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  return `${Math.floor(hrs / 24)} d ago`
}
