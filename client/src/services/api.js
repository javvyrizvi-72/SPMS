import axios from 'axios'

// ---- Where is the API? ------------------------------------------------------------------
// 1) VITE_API_URL if set (client/.env locally, Environment Variables on Vercel). An explicit value is always respected.
// 2) otherwise: http://localhost:5000/api when running on localhost, the deployed API everywhere else.
//    (Only in this "nothing configured" case: if the local API is not running, requests fall back to the deployed API.)
export const PROD_API = 'https://placement-management-system-pe0o.onrender.com/api'
const LOCAL_API = 'http://localhost:5000/api'
const trim = (u) => String(u || '').trim().replace(/\/+$/, '')
const onLocalhost = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const isLocalUrl = (u) => /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(u)

const explicitUrl = trim(import.meta.env.VITE_API_URL)
export const API_URL = explicitUrl || (onLocalhost ? LOCAL_API : PROD_API)
const canFallback = !explicitUrl && onLocalhost
let currentBase = API_URL // kept in memory only, so a page refresh always starts from the configured API

export const getApiBase = () => currentBase

const API = axios.create({ baseURL: currentBase, timeout: 60000 }) // Render free tier can need ~50s to wake up

const isAuthCall = (url = '') =>
  url.includes('/auth/login') ||
  url.includes('/auth/register') ||
  url.includes('/auth/forgot-password') ||
  url.includes('/auth/reset-password-otp')

API.interceptors.request.use((req) => {
  req.baseURL = currentBase
  const token = localStorage.getItem('token')
  if (token) req.headers.Authorization = `Bearer ${token}`
  return req
})

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const cfg = err.config
    if (!err.response && cfg && canFallback && !cfg._retriedOnProd && currentBase !== PROD_API) {
      cfg._retriedOnProd = true
      currentBase = PROD_API
      console.warn('Local API not reachable, using deployed API:', PROD_API)
      return API(cfg)
    }
    // expired / invalid session (but never for a failed login or registration attempt)
    if (err.response?.status === 401 && !isAuthCall(cfg?.url)) {
      localStorage.removeItem('token')
      if (window.location.pathname !== '/login') window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Human friendly message for toasts / forms
export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err?.response?.data?.message) return err.response.data.message
  if (err?.code === 'ECONNABORTED') return 'The server is taking too long to respond. Please try again in a moment.'
  if (!err?.response) {
    return isLocalUrl(currentBase)
      ? `Cannot reach the API at ${currentBase}. Start the backend (cd server, npm run dev) and make sure MongoDB is running.`
      : `Cannot reach the server (${currentBase}). It may be waking up: wait about 30 seconds and try again. If it keeps failing, the server may not allow this website address (CORS).`
  }
  return fallback
}

// Wakes the (free-tier) server in the background as soon as the app opens
export const warmUpServer = () => {
  try { fetch(`${currentBase}/health`, { method: 'GET' }).catch(() => {}) } catch (e) { /* ignore */ }
}

// Used by the connection indicator on the login/register pages
export const checkServer = async () => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 65000)
  try {
    const res = await fetch(`${currentBase}/health`, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

// Auth
export const registerUser = (data) => API.post('/auth/register', data)
export const loginUser = (data) => API.post('/auth/login', data)
export const getMe = () => API.get('/auth/me')
export const updateUserProfile = (data) => API.put('/auth/profile', data)
export const forgotPassword = (data) => API.post('/auth/forgot-password', data)
export const resetPasswordWithOtp = (data) => API.post('/auth/reset-password-otp', data)

// Student
export const getStudentProfile = () => API.get('/students/profile')
export const updateStudentProfile = (data) => API.put('/students/profile', data)
export const uploadResume = (data) => API.post('/students/resume', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const getMyApplications = () => API.get('/jobs/my/applications')

// Jobs & Applications
export const getAllJobs = () => API.get('/jobs')
export const getJobById = (id) => API.get(`/jobs/${id}`)
export const applyForJob = (id) => API.post(`/jobs/${id}/apply`)
export const createJob = (data) => API.post('/jobs', data)
export const updateJob = (id, data) => API.put(`/jobs/${id}`, data)
export const deleteJob = (id) => API.delete(`/jobs/${id}`)
export const getJobApplications = (id) => API.get(`/jobs/${id}/applications`)
export const updateApplicationStatus = (id, data) => API.put(`/applications/${id}/status`, data)
export const scheduleInterview = (data) => API.post('/applications/interview', data)

// Company
export const getCompanyProfile = () => API.get('/companies/profile')
export const updateCompanyProfile = (data) => API.put('/companies/profile', data)
export const getCompanyJobs = () => API.get('/jobs/company/my-jobs')

// Admin
export const getDashboardStats = () => API.get('/admin/stats')
export const getAllStudents = () => API.get('/students/all')
export const getAllCompanies = () => API.get('/companies/all')
export const approveStudent = (id) => API.put(`/admin/student/${id}/approve`)
export const approveCompany = (id) => API.put(`/admin/company/${id}/approve`)
export const deleteUser = (id) => API.delete(`/admin/user/${id}`)
export const getAllApplications = () => API.get('/admin/applications')

// Notifications
export const getNotifications = () => API.get('/notifications')
export const markNotificationRead = (id) => API.put(`/notifications/${id}/read`)

// Assistant chat
export const sendChat = (message, history) => API.post('/chat', { message, history })
export const getChatInfo = () => API.get('/chat')

export default API