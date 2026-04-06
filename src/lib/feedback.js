import { supabase } from './supabase'

export async function getSessionFeedback(session, recentSessions, onChunk) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  const { data: { session: authSession } } = await supabase.auth.getSession()
  const token = authSession?.access_token ?? supabaseAnonKey

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': supabaseAnonKey,
    },
    body: JSON.stringify({
      instrument: session.instrument,
      duration_minutes: session.duration_minutes,
      notes: session.notes,
      recent_sessions: recentSessions,
    }),
  })

  if (!response.ok) {
    const msg = await response.text()
    throw new Error(`Feedback error: ${msg}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    onChunk(decoder.decode(value, { stream: true }))
  }
}
