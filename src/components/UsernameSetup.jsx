import { useState } from 'react'
import { supabase } from '../lib/supabase'
import GeoBg from './GeoBg'

export default function UsernameSetup({ userId, onComplete }) {
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const clean = username.toLowerCase().trim().replace(/\s+/g, '_')
    if (clean.length < 2) return setError('Username must be at least 2 characters.')
    if (!/^[a-z0-9_]+$/.test(clean)) return setError('Only letters, numbers, and underscores.')

    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userId, username: clean })
      .select()
      .single()

    if (error) {
      setError(error.message.includes('unique') ? 'That username is taken.' : error.message)
    } else {
      onComplete(data)
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen bg-[#0D0D14] flex items-center justify-center px-4 overflow-hidden">
      <GeoBg rings={4} ringSize={520} dotOpacity={0.06} />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Shed</h1>
          <p className="text-slate-500 text-sm mt-1">Pick a username to get started</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="input"
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? 'Saving…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
