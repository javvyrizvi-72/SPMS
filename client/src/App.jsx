import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import ChatBot from './components/common/ChatBot'
import { warmUpServer } from './services/api'

function App() {
  useEffect(() => { warmUpServer() }, [])

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: { background: '#12263f', color: '#eaf1fb', border: '1px solid #254a78', pointerEvents: 'none' },
            success: { iconTheme: { primary: '#c9a227', secondary: '#08121f' } },
          }}
        />
        <AppRoutes />
        <ChatBot />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
