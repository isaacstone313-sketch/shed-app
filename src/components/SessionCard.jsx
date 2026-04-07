import { useState } from 'react'
import { supabase } from '../lib/supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-400 text-white',
  'bg-violet-400 text-white',
  'bg-rose-400 text-white',
  'bg-emerald-400 text-white',
  'bg-orange-400 text-white',
  'bg-teal-400 text-white',
  'bg-pink-400 text-white',
  'bg-indigo-400 text-white',
]

// Instrument → accent bar color (hex for inline style)
const INSTRUMENT_ACCENT = {
  Guitar:    '#60a5fa', // blue-400
  Bass:      '#a78bfa', // violet-400
  Piano:     '#818cf8', // indigo-400
  Drums:     '#fb923c', // orange-400
  Violin:    '#fb7185', // rose-400
  Cello:     '#34d399', // emerald-400
  Vocals:    '#f472b6', // pink-400
  Saxophone: '#facc15', // yellow-400
  Trumpet:   '#f87171', // red-400
  Flute:     '#2dd4bf', // teal-400
}
const DEFAULT_ACCENT = '#94a3b8' // slate-400

export function instrumentAccent(instrument = '') {
  return INSTRUMENT_ACCENT[instrument] ?? DEFAULT_ACCENT
}

export function avatarColor(username = '') {
  const hash = username.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

export function formatTimestamp(iso) {
  const date = new Date(iso)
  const now = new Date()
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (date.toDateString() === now.toDateString()) return `Today at ${time}`
  const yesterday = new Date(now - 86400000)
  if (date.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`
  const daysAgo = Math.floor((now - date) / 86400000)
  if (daysAgo < 7) return `${date.toLocaleDateString('en-US', { weekday: 'long' })} at ${time}`
  return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${time}`
}

export function formatDuration(min) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m} min` : `${h}h`
}

// ── Icons ─────────────────────────────────────────────────────────────────────

export function Avatar({ username }) {
  const initials = (username ?? '?').slice(0, 2).toUpperCase()
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(username)}`}>
      {initials}
    </div>
  )
}

function ThumbsUp({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

function Chevron({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

/**
 * Props:
 *   session        – session row with .profiles.username, .hasKudosed, .kudosCount
 *   userId         – current logged-in user's ID
 *   isFollowing    – boolean | null (null = hide follow button)
 *   onFollowChange – (targetUserId, nowFollowing) => void
 */
export default function SessionCard({ session, userId, isFollowing, onFollowChange }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [hasKudosed, setHasKudosed] = useState(session.hasKudosed)
  const [kudosCount, setKudosCount] = useState(session.kudosCount)
  const [kudosPending, setKudosPending] = useState(false)
  const [pop, setPop] = useState(false)
  const [followPending, setFollowPending] = useState(false)

  const username = session.profiles?.username ?? 'unknown'
  const isOwn = session.user_id === userId
  const showFollow = !isOwn && onFollowChange != null && isFollowing != null
  const accent = instrumentAccent(session.instrument)

  // ── Kudos ──
  async function handleKudos() {
    if (kudosPending) return
    const wasKudosed = hasKudosed
    setHasKudosed(!wasKudosed)
    setKudosCount(c => wasKudosed ? c - 1 : c + 1)
    if (!wasKudosed) { setPop(true); setTimeout(() => setPop(false), 250) }
    setKudosPending(true)
    try {
      if (wasKudosed) {
        const { error } = await supabase.from('kudos').delete()
          .eq('session_id', session.id).eq('user_id', userId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('kudos').insert({ session_id: session.id, user_id: userId })
        if (error) throw error
      }
    } catch {
      setHasKudosed(wasKudosed)
      setKudosCount(c => wasKudosed ? c + 1 : c - 1)
    } finally {
      setKudosPending(false)
    }
  }

  // ── Follow ──
  async function handleFollow() {
    if (followPending) return
    const willFollow = !isFollowing
    onFollowChange(session.user_id, willFollow)
    setFollowPending(true)
    try {
      if (willFollow) {
        const { error } = await supabase.from('follows')
          .insert({ follower_id: userId, following_id: session.user_id })
        if (error) throw error
      } else {
        const { error } = await supabase.from('follows').delete()
          .eq('follower_id', userId).eq('following_id', session.user_id)
        if (error) throw error
      }
    } catch {
      onFollowChange(session.user_id, !willFollow)
    } finally {
      setFollowPending(false)
    }
  }

  return (
    <div className="relative bg-[#16161F] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition">
      {/* Instrument accent bar — 6px wide */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ background: accent }}
      />

      <div className="pl-5">
        {/* Header */}
        <div className="pr-4 pt-4 pb-3 flex items-start gap-3">
          <Avatar username={username} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[15px] font-semibold text-white">{username}</span>
              {isOwn && <span className="text-xs text-slate-500">you</span>}
            </div>
            <span className="text-xs text-slate-500 mt-0.5 block">{formatTimestamp(session.created_at)}</span>
          </div>
          {showFollow && (
            <button
              onClick={handleFollow}
              disabled={followPending}
              className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition disabled:opacity-50 ${
                isFollowing
                  ? 'border-white/10 text-slate-500 hover:border-red-500/30 hover:text-red-400'
                  : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </button>
          )}
        </div>

        {/* Activity meta */}
        <div className="pr-4 pb-3 flex items-center gap-2.5">
          <span className="bg-white/5 text-slate-400 text-xs font-semibold px-3 py-1 rounded-full">
            {session.instrument}
          </span>
          <span className="text-slate-700 text-sm">·</span>
          <span className="text-sm font-medium text-slate-400">{formatDuration(session.duration_minutes)}</span>
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="pr-4 pb-4">
            <p className="text-[15px] text-slate-300 leading-relaxed">{session.notes}</p>
          </div>
        )}

        {/* AI Coaching (collapsible) */}
        {session.ai_feedback && (
          <div className="border-t border-white/5">
            <button
              onClick={() => setFeedbackOpen(o => !o)}
              className="w-full pr-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition"
            >
              <span className="text-xs font-semibold text-amber-500/70 uppercase tracking-wide">AI Coaching</span>
              <Chevron open={feedbackOpen} />
            </button>
            {feedbackOpen && (
              <div className="pr-4 pb-4">
                <p className="text-[15px] text-slate-400 leading-relaxed">{session.ai_feedback}</p>
              </div>
            )}
          </div>
        )}

        {/* Kudos bar */}
        <div className="border-t border-white/5 pr-4 py-2.5 flex items-center">
          {isOwn ? (
            <div className="flex items-center gap-2 px-2 py-1 -ml-2 text-slate-600">
              <ThumbsUp filled={false} />
              {kudosCount > 0 && <span className="text-xs font-semibold text-slate-500">{kudosCount}</span>}
            </div>
          ) : (
            <button
              onClick={handleKudos}
              disabled={kudosPending}
              style={{ transform: pop ? 'scale(1.3)' : 'scale(1)', transition: 'transform 150ms ease, color 150ms ease' }}
              className={`flex items-center gap-2 rounded-lg px-2 py-1 -ml-2 disabled:opacity-60 ${
                hasKudosed ? 'text-amber-500 hover:text-amber-400' : 'text-slate-600 hover:text-amber-500'
              }`}
            >
              <ThumbsUp filled={hasKudosed} />
              {kudosCount > 0 && <span className="text-xs font-semibold">{kudosCount}</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
