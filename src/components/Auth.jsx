import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Shed</h1>
          <p className="text-stone-500 text-sm mt-1">Your music practice log</p>
        </div>

        <div className="card">
          <h2 className="font-medium mb-4">
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
              <p
                className={`text-sm ${
                  message.type === 'error' ? 'text-red-500' : 'text-emerald-600'
                }`}
              >
                {message.text}
              </p>
            )}
            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Loading…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          </form>

          <p className="text-sm text-stone-500 mt-4 text-center">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              className="text-amber-600 hover:underline font-medium"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setMessage(null)
              }}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
