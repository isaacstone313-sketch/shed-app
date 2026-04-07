import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { computeStats } from '../utils/stats'

// ── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-amber-400 text-white',
  'bg-orange-400 text-white',
  'bg-rose-400 text-white',
  'bg-violet-400 text-white',
  'bg-blue-400 text-white',
  'bg-teal-400 text-white',
  'bg-emerald-400 text-white',
  'bg-pink-400 text-white',
]

function avatarColor(username = '') {
  const hash = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function formatTimestamp(iso) {
  const date = new Date(iso)
  const now = new Date()
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (date.toDateString() === now.toDateString()) return `Today at ${time}`
  const yesterday = new Date(now - 86400000)
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`
  const daysAgo = Math.floor((now - date) / 86400000)
  if (daysAgo < 7) {
    return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${time}`
  }
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`
}

function formatDuration(min) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m} min` : `${h}h`
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ username }) {
  const initials = (username ?? '?').slice(0, 2).toUpperCase()
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(username)}`}
    >
      {initials}
    </div>
  )
}

function ThumbsUp({ filled }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function Chevron({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function SessionCard({ session, currentUserId, onKudos }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const username = session.profiles?.username ?? 'unknown'
  const isOwn = session.user_id === currentUserId

  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden hover:border-stone-300 transition">
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar username={username} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-stone-900 truncate">{username}</span>
              {isOwn && (
                <span className="text-xs text-stone-400 shrink-0">you</span>
              )}
            </div>
            <span className="text-xs text-stone-400">{formatTimestamp(session.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Activity meta */}
      <div className="px-4 pb-3 flex items-center gap-2">
        <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          {session.instrument}
        </span>
        <span className="text-stone-400 text-xs">·</span>
        <span className="text-sm font-medium text-stone-700">{formatDuration(session.duration_minutes)}</span>
      </div>

      {/* Notes */}
      {session.notes && (
        <div className="px-4 pb-4">
          <p className="text-sm text-stone-700 leading-relaxed">{session.notes}</p>
        </div>
      )}

      {/* AI Coaching (collapsible) */}
      {session.ai_feedback && (
        <div className="border-t border-stone-100">
          <button
            onClick={() => setFeedbackOpen(o => !o)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-stone-50 transition"
          >
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
              AI Coaching
            </span>
            <Chevron open={feedbackOpen} />
          </button>
          {feedbackOpen && (
            <div className="px-4 pb-4">
              <p className="text-sm text-stone-600 leading-relaxed">{session.ai_feedback}</p>
            </div>
          )}
        </div>
      )}

      {/* Kudos bar */}
      <div className="border-t border-stone-100 px-4 py-2.5 flex items-center">
        <button
          onClick={() => onKudos(session)}
          disabled={isOwn}
          className={`flex items-center gap-1.5 transition rounded-lg px-2 py-1 -ml-2 ${
            isOwn
              ? 'text-stone-300 cursor-default'
              : session.hasKudosed
              ? 'text-amber-500 hover:text-amber-600'
              : 'text-stone-400 hover:text-amber-500'
          }`}
        >
          <ThumbsUp filled={session.hasKudosed} />
          {session.kudosCount > 0 && (
            <span className="text-xs font-semibold">{session.kudosCount}</span>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Feed({ userId }) {
  const [sessions, setSessions] = useState([])
  const [myStats, setMyStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(async () => {
    // Find all group members the current user shares groups with
    const { data: myGroupRows } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)

    let memberIds = [userId]
    if (myGroupRows?.length) {
      const groupIds = myGroupRows.map(r => r.group_id)
      const { data: allMembers } = await supabase
        .from('group_members')
        .select('user_id')
        .in('group_id', groupIds)
      memberIds = [...new Set((allMembers ?? []).map(m => m.user_id))]
    }

    // Fetch sessions with profile info
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*, profiles(username)')
      .in('user_id', memberIds)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!sessionsData?.length) {
      setSessions([])
      setMyStats(computeStats([]))
      setLoading(false)
      return
    }

    // Fetch kudos for these sessions
    const sessionIds = sessionsData.map(s => s.id)
    const { data: kudosData } = await supabase
      .from('kudos')
      .select('session_id, user_id')
      .in('session_id', sessionIds)

    const kudos = kudosData ?? []

    const enriched = sessionsData.map(s => ({
      ...s,
      kudosCount: kudos.filter(k => k.session_id === s.id).length,
      hasKudosed: kudos.some(k => k.session_id === s.id && k.user_id === userId),
    }))

    setSessions(enriched)
    setMyStats(computeStats(sessionsData.filter(s => s.user_id === userId)))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  async function handleKudos(session) {
    // Optimistic update
    setSessions(prev =>
      prev.map(s => {
        if (s.id !== session.id) return s
        return {
          ...s,
          hasKudosed: !s.hasKudosed,
          kudosCount: s.hasKudosed ? s.kudosCount - 1 : s.kudosCount + 1,
        }
      })
    )

    if (session.hasKudosed) {
      await supabase.from('kudos').delete()
        .eq('session_id', session.id)
        .eq('user_id', userId)
    } else {
      await supabase.from('kudos').insert({ session_id: session.id, user_id: userId })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Feed</h2>
          <p className="text-stone-500 text-sm mt-0.5">Activity from you and your groups</p>
        </div>
        {myStats && (
          <div className="flex gap-3 text-right shrink-0">
            <div>
              <div className="text-base font-semibold leading-tight">{myStats.streak}</div>
              <div className="text-xs text-stone-400">streak</div>
            </div>
            <div>
              <div className="text-base font-semibold leading-tight">{myStats.totalMinutes}m</div>
              <div className="text-xs text-stone-400">total</div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white border border-stone-200 rounded-2xl p-4 animate-pulse">
              <div className="flex gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-stone-100 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-stone-100 rounded w-24" />
                  <div className="h-2.5 bg-stone-100 rounded w-32" />
                </div>
              </div>
              <div className="h-3 bg-stone-100 rounded w-full mb-2" />
              <div className="h-3 bg-stone-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-400 text-sm">No sessions yet.</p>
          <p className="text-stone-400 text-xs mt-1">Log a session or join a group to see activity here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              currentUserId={userId}
              onKudos={handleKudos}
            />
          ))}
        </div>
      )}
    </div>
  )
}
