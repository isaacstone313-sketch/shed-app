import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getSessionFeedback } from '../lib/feedback'

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
  const [feedback, setFeedback] = useState(null)
  const [streamingFeedback, setStreamingFeedback] = useState('')
  const [error, setError] = useState('')
  const feedbackRef = useRef(null)

  const resolvedInstrument = instrument === 'Other' ? customInstrument : instrument

  async function handleSubmit(e) {
    e.preventDefault()
    if (!resolvedInstrument.trim()) return setError('Please enter an instrument.')
    setError('')
    setLoading(true)
    setFeedback(null)
    setStreamingFeedback('')

    const sessionData = {
      user_id: userId,
      instrument: resolvedInstrument.trim(),
      duration_minutes: parseInt(duration),
      notes: notes.trim(),
    }

    // Fetch recent sessions for context
    const { data: recentSessions } = await supabase
      .from('sessions')
      .select('instrument, duration_minutes, notes, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Insert session
    const { data: inserted, error: insertError } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    // Stream AI feedback
    let fullFeedback = ''
    await getSessionFeedback(
      { instrument: sessionData.instrument, duration_minutes: sessionData.duration_minutes, notes: sessionData.notes },
      recentSessions || [],
      chunk => {
        fullFeedback += chunk
        setStreamingFeedback(prev => prev + chunk)
        if (feedbackRef.current) {
          feedbackRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }
    )

    // Save feedback to session record
    if (fullFeedback) {
      await supabase
        .from('sessions')
        .update({ ai_feedback: fullFeedback })
        .eq('id', inserted.id)
    }

    setFeedback(fullFeedback)
    setStreamingFeedback('')
    setInstrument('')
    setCustomInstrument('')
    setDuration('')
    setNotes('')
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Log a session</h2>
        <p className="text-stone-500 text-sm mt-0.5">What did you work on today?</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Instrument</label>
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS.map(inst => (
              <button
                key={inst}
                type="button"
                onClick={() => setInstrument(inst)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                  instrument === inst
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'border-stone-200 hover:border-stone-300 text-stone-700'
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
          <label className="block text-sm font-medium mb-1.5">Duration (minutes)</label>
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
          <label className="block text-sm font-medium mb-1.5">What did you work on?</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Scales, a specific song, sight-reading, improvisation…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Log session'}
        </button>
      </form>

      {(streamingFeedback || feedback) && (
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
      )}
    </div>
  )
}
