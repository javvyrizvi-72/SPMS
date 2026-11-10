import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/common/Loader'

import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import StudentDashboard from '../pages/student/Dashboard'
import StudentProfile from '../pages/student/Profile'
import Jobs from '../pages/student/Jobs'
import Applications from '../pages/student/Applications'
import CompanyDashboard from '../pages/company/Dashboard'
import CompanyProfile from '../pages/company/Profile'
import PostJob from '../pages/company/PostJob'
import Applicants from '../pages/company/Applicants'
import AdminDashboard from '../pages/admin/Dashboard'
import AdminProfile from '../pages/admin/Profile'
import Students from '../pages/admin/Students'
import Companies from '../pages/admin/Companies'
import Reports from '../pages/admin/Reports'

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth()
  if (loading) return <Loader />
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

const AppRoutes = () => {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={
        user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Navigate to="/login" replace />
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute role="student"><StudentProfile /></ProtectedRoute>} />
      <Route path="/student/jobs" element={<ProtectedRoute role="student"><Jobs /></ProtectedRoute>} />
      <Route path="/student/applications" element={<ProtectedRoute role="student"><Applications /></ProtectedRoute>} />

      <Route path="/company/dashboard" element={<ProtectedRoute role="company"><CompanyDashboard /></ProtectedRoute>} />
      <Route path="/company/profile" element={<ProtectedRoute role="company"><CompanyProfile /></ProtectedRoute>} />
      <Route path="/company/post-job" element={<ProtectedRoute role="company"><PostJob /></ProtectedRoute>} />
      <Route path="/company/applicants" element={<ProtectedRoute role="company"><Applicants /></ProtectedRoute>} />

      <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute role="admin"><AdminProfile /></ProtectedRoute>} />
      <Route path="/admin/students" element={<ProtectedRoute role="admin"><Students /></ProtectedRoute>} />
      <Route path="/admin/companies" element={<ProtectedRoute role="admin"><Companies /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute role="admin"><Reports /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRoutes