import { useState } from 'react'
import { supabase } from '../lib/supabase'
import GeoBg from './GeoBg'

export default function Auth({ initialMode = 'signin', onBack }) {
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } =
      mode === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else if (mode === 'signup') {
      setMessage({ type: 'success', text: 'Check your email to confirm your account.' })
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen bg-[#0D0D14] flex items-center justify-center px-4 overflow-hidden">
      <GeoBg rings={4} ringSize={520} dotOpacity={0.06} />

      <div className="relative z-10 w-full max-w-sm">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-6 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        )}

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Shed</h1>
          <p className="text-slate-500 text-sm mt-1">Your music practice log</p>
        </div>

        <div className="card">
          <h2 className="font-semibold text-white mb-4">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              className="input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {message && (
              <p className={`text-sm ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                {message.text}
              </p>
            )}
            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Loading…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <p className="text-sm text-slate-500 mt-4 text-center">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              className="text-amber-400 hover:text-amber-300 font-medium transition"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage(null) }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
