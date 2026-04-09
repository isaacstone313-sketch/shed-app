import { useState } from 'react'
import { supabase } from '../lib/supabase'
import CommentThread from './CommentThread'

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

export function Avatar({ username, size = 'md', avatarUrl }) {
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[10px]'
    : size === 'lg' ? 'w-20 h-20 text-2xl'
    : 'w-9 h-9 text-xs'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username ?? ''}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    )
  }

  const initials = (username ?? '?').slice(0, 2).toUpperCase()
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold shrink-0 ${avatarColor(username)}`}>
      {initials}
    </div>
  )
}

const MOOD_EMOJI = {
  grinding: '💪',
  solid:    '👊',
  flow:     '⚡',
  rough:    '😮‍💨',
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

function spotifyTrackId(url) {
  if (!url) return null
  const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
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
  const [spotifyOpen, setSpotifyOpen] = useState(false)
  const [hasKudosed, setHasKudosed] = useState(session.hasKudosed)
  const [kudosCount, setKudosCount] = useState(session.kudosCount)
  const [kudosPending, setKudosPending] = useState(false)
  const [pop, setPop] = useState(false)
  const [followPending, setFollowPending] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentCount, setCommentCount] = useState(session.commentCount ?? 0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const username  = session.profiles?.username ?? 'unknown'
  const avatarUrl = session.profiles?.avatar_url ?? null
  const isOwn = session.user_id === userId
  const showFollow = !isOwn && onFollowChange != null && isFollowing != null
  const accent = instrumentAccent(session.instrument)
  const trackId = spotifyTrackId(session.spotify_url)

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
          <Avatar username={username} avatarUrl={avatarUrl} />
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
        <div className="pr-4 pb-3 flex items-center gap-2.5 flex-wrap">
          <span className="bg-white/5 text-slate-400 text-xs font-semibold px-3 py-1 rounded-full">
            {session.instrument}
          </span>
          <span className="text-slate-700 text-sm">·</span>
          <span className="text-sm font-medium text-slate-400">{formatDuration(session.duration_minutes)}</span>
          {session.mood && MOOD_EMOJI[session.mood] && (
            <>
              <span className="text-slate-700 text-sm">·</span>
              <span className="text-base leading-none" title={session.mood}>{MOOD_EMOJI[session.mood]}</span>
            </>
          )}
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="pr-4 pb-4">
            <p className="text-[15px] text-slate-300 leading-relaxed">{session.notes}</p>
          </div>
        )}

        {/* Photo */}
        {session.photo_url && (
          <div className="pr-4 pb-3">
            <img
              src={session.photo_url}
              alt=""
              className="w-full rounded-xl object-cover max-h-72 cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
          </div>
        )}

        {/* Spotify embed (collapsible) */}
        {trackId && (
          <div className="border-t border-white/5">
            <button
              onClick={() => setSpotifyOpen(o => !o)}
              className="w-full pr-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition"
            >
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#1DB954">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <span className="text-xs font-semibold text-[#1DB954]/80 uppercase tracking-wide">Now playing</span>
              </div>
              <Chevron open={spotifyOpen} />
            </button>
            {spotifyOpen && (
              <div className="pr-4 pb-3">
                <iframe
                  src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-lg"
                />
              </div>
            )}
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

        {/* Kudos + Comments bar */}
        <div className="border-t border-white/5 pr-4 py-2.5 flex items-center gap-1">
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

          <button
            onClick={() => setCommentsOpen(o => !o)}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1 transition ${
              commentsOpen ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {commentCount > 0 && <span className="text-xs font-semibold">{commentCount}</span>}
          </button>
        </div>

        {commentsOpen && (
          <CommentThread
            sessionId={session.id}
            userId={userId}
          />
        )}
      </div>

      {/* Photo lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={session.photo_url}
            alt=""
            className="max-w-full max-h-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  )
}
