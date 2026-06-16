import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[100dvh] p-6 text-center">
      <h1 className="aurora-text" style={{ fontSize: '2rem', marginBottom: '8px' }}>Aurora Night</h1>
      <p className="text-muted mb-8">60-Day Discipline Challenge</p>

      <form onSubmit={handleLogin} className="w-full flex flex-col gap-4 max-w-sm">
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          required
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          required
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button type="submit" className="btn-primary mt-2" disabled={loading}>
          {loading ? 'Logging in...' : 'Enter Arena'}
        </button>
      </form>
    </div>
  )
}
