import { useState } from 'react'
import { supabase } from '../lib/supabase'
// import { getSessionFeedback } from '../lib/feedback'  // AI coaching — disabled for now

const INSTRUMENTS = [
  'Guitar', 'Bass', 'Piano', 'Drums', 'Violin', 'Cello',
  'Vocals', 'Saxophone', 'Trumpet', 'Flute', 'Other',
]

export default function LogSession({ userId }) {
  const [instrument, setInstrument] = useState('')
  const [customInstrument, setCustomInstrument] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // AI coaching state — kept for re-enabling later
  // const [feedback, setFeedback] = useState(null)
  // const [streamingFeedback, setStreamingFeedback] = useState('')
  // const feedbackRef = useRef(null)

  const resolvedInstrument = instrument === 'Other' ? customInstrument : instrument

  async function handleSubmit(e) {
    e.preventDefault()
    if (!resolvedInstrument.trim()) return setError('Please enter an instrument.')
    setError('')
    setLoading(true)

    // AI coaching — disabled for now
    // setFeedback(null)
    // setStreamingFeedback('')

    const sessionData = {
      user_id: userId,
      instrument: resolvedInstrument.trim(),
      duration_minutes: parseInt(duration),
      notes: notes.trim(),
    }

    // AI coaching — fetch recent sessions for context (kept for later)
    // const { data: recentSessions } = await supabase
    //   .from('sessions')
    //   .select('instrument, duration_minutes, notes, created_at')
    //   .eq('user_id', userId)
    //   .order('created_at', { ascending: false })
    //   .limit(5)

    const { error: insertError } = await supabase
      .from('sessions')
      .insert(sessionData)

    setLoading(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    // AI coaching — stream feedback and save to session record (kept for later)
    // let fullFeedback = ''
    // await getSessionFeedback(
    //   { instrument: sessionData.instrument, duration_minutes: sessionData.duration_minutes, notes: sessionData.notes },
    //   recentSessions || [],
    //   chunk => {
    //     fullFeedback += chunk
    //     setStreamingFeedback(prev => prev + chunk)
    //     if (feedbackRef.current) feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    //   }
    // )
    // if (fullFeedback) {
    //   await supabase.from('sessions').update({ ai_feedback: fullFeedback }).eq('id', inserted.id)
    // }
    // setFeedback(fullFeedback)
    // setStreamingFeedback('')

    setInstrument('')
    setCustomInstrument('')
    setDuration('')
    setNotes('')
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2400)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Log a session</h2>
        <p className="text-slate-500 text-sm mt-0.5">What did you work on today?</p>
      </div>

      {success && (
        <div className="animate-fade-in-out flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <span className="text-sm font-medium text-emerald-400">Session logged!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Instrument</label>
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS.map(inst => (
              <button
                key={inst}
                type="button"
                onClick={() => setInstrument(inst)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  instrument === inst
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'border-white/10 hover:border-white/20 text-slate-400'
                }`}
              >
                {inst}
              </button>
            ))}
          </div>
          {instrument === 'Other' && (
            <input
              className="input mt-2"
              placeholder="What instrument?"
              value={customInstrument}
              onChange={e => setCustomInstrument(e.target.value)}
              autoFocus
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Duration (minutes)</label>
          <input
            className="input"
            type="number"
            placeholder="e.g. 45"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min="1"
            max="720"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">What did you work on?</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Scales, a specific song, sight-reading, improvisation…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Log session'}
        </button>
      </form>

      {/* AI coaching feedback panel — re-enable when AI call is turned back on */}
      {/* {(streamingFeedback || feedback) && (
        <div ref={feedbackRef} className="card border-amber-200 bg-amber-50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600 text-xs font-semibold uppercase tracking-wide">
              Coaching feedback
            </span>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            {streamingFeedback || feedback}
            {streamingFeedback && (
              <span className="inline-block w-0.5 h-4 bg-amber-500 ml-0.5 animate-pulse align-text-bottom" />
            )}
          </p>
        </div>
      )} */}
    </div>
  )
}
