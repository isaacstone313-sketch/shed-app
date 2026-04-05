import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { computeStats } from '../utils/stats'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDuration(min) {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function History({ userId }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    async function fetchSessions() {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setSessions(data || [])
      setLoading(false)
    }
    fetchSessions()
  }, [userId])

  if (loading) {
    return <div className="text-stone-400 text-sm py-8 text-center">Loading…</div>
  }

  if (!sessions.length) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-400 text-sm">No sessions yet. Log your first practice!</p>
      </div>
    )
  }

  const stats = computeStats(sessions)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">History</h2>
        <p className="text-stone-500 text-sm mt-0.5">{sessions.length} sessions logged</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center">
          <div className="text-xl font-semibold">{formatDuration(stats.totalMinutes)}</div>
          <div className="text-xs text-stone-500 mt-0.5">Total time</div>
        </div>
        <div className="card text-center">
          <div className="text-xl font-semibold">{stats.streak}</div>
          <div className="text-xs text-stone-500 mt-0.5">Day streak</div>
        </div>
        <div className="card text-center">
          <div className="text-xl font-semibold">{stats.sessionCount}</div>
          <div className="text-xs text-stone-500 mt-0.5">Sessions</div>
        </div>
      </div>

      {/* Session list */}
      <div className="space-y-2">
        {sessions.map(session => (
          <div
            key={session.id}
            className="card cursor-pointer hover:border-stone-300 transition"
            onClick={() => setExpanded(expanded === session.id ? null : session.id)}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium text-sm">{session.instrument}</span>
                <span className="text-amber-600 text-sm font-medium">
                  {formatDuration(session.duration_minutes)}
                </span>
              </div>
              <span className="text-xs text-stone-400 shrink-0">{formatDate(session.created_at)}</span>
            </div>

            {session.notes && (
              <p className="text-sm text-stone-500 mt-1 truncate">
                {expanded === session.id ? session.notes : session.notes}
              </p>
            )}

            {expanded === session.id && session.ai_feedback && (
              <div className="mt-3 pt-3 border-t border-stone-100">
                <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">
                  Coaching
                </p>
                <p className="text-sm text-stone-600 leading-relaxed">{session.ai_feedback}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
