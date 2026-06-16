import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { BottomNav } from './components/BottomNav'
import { Login } from './components/Login'
import { Today } from './components/Today'

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-muted">Initializing Aurora Night...</div>
  }

  if (!session) {
    return <Login />
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="content-area">
          <Routes>
            <Route path="/" element={<Today userId={session.user.id} />} />
            <Route path="/progress" element={<div className="p-4 text-center mt-10 text-muted">Progress Screen (Next Stage)</div>} />
            <Route path="/versus" element={<div className="p-4 text-center mt-10 text-muted">Versus Screen (Coming Soon)</div>} />
            <Route path="/challenges" element={<div className="p-4 text-center mt-10 text-muted">Manage Challenges (Coming Soon)</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}

export default App
