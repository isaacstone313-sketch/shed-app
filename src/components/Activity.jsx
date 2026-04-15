import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Avatar, formatDuration } from './SessionCard'
import { checkBadges } from '../utils/badges'
import { useBadgeToast } from '../context/BadgeContext'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function actionText(type, instrument) {
  switch (type) {
    case 'follow':  return 'followed you'
    case 'kudo':    return `gave your ${instrument ?? 'session'} a kudo`
    case 'comment': return `commented on your ${instrument ?? 'session'}`
    case 'reply':   return 'replied to your comment'
    default:        return ''
  }
}

function navTarget(n) {
  switch (n.type) {
    case 'follow':
      return { type: 'user', userId: n.actor_id }
    case 'kudo':
      return { type: 'session', sessionId: n.session_id, expandComments: false }
    case 'comment':
    case 'reply':
      return { type: 'session', sessionId: n.session_id, expandComments: true }
    default:
      return null
  }
}

export default function Activity({ userId, onRead, onNavigate }) {
  const showBadgeToast = useBadgeToast()
  const [notifications, setNotifications] = useState([])
  const [shoutouts,     setShoutouts]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [shoutoutsLoading, setShoutoutsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(username, avatar_url),
          sessions(instrument, notes)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      setNotifications(data ?? [])
      setLoading(false)

      const unreadIds = (data ?? []).filter(n => !n.read).map(n => n.id)
      if (unreadIds.length) {
        await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
        onRead?.()
      }
    }
    load()
  }, [userId])

  useEffect(() => {
    async function loadShoutouts() {
      const { data } = await supabase
        .from('session_shoutouts')
        .select(`
          *,
          sessions(instrument, duration_minutes, notes, mood),
          tagger:profiles!session_shoutouts_tagged_by_user_id_fkey(username, avatar_url)
        `)
        .eq('tagged_user_id', userId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
      setShoutouts(data ?? [])
      setShoutoutsLoading(false)
    }
    loadShoutouts()
  }, [userId])

  async function handleAccept(shoutout) {
    // Optimistic remove from list
    setShoutouts(prev => prev.filter(s => s.id !== shoutout.id))

    await supabase
      .from('session_shoutouts')
      .update({ status: 'accepted' })
      .eq('id', shoutout.id)

    await supabase.from('sessions').insert({
      user_id:          userId,
      instrument:       shoutout.sessions.instrument,
      duration_minutes: shoutout.sessions.duration_minutes,
      notes:            shoutout.sessions.notes ?? '',
      mood:             shoutout.sessions.mood ?? null,
      shoutout_id:      shoutout.id,
    })

    checkBadges(userId).then(earned => earned.forEach(b => showBadgeToast(b)))
  }

  async function handleDecline(shoutoutId) {
    setShoutouts(prev => prev.filter(s => s.id !== shoutoutId))
    await supabase
      .from('session_shoutouts')
      .update({ status: 'declined' })
      .eq('id', shoutoutId)
  }

  if (loading || shoutoutsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-[#16161F] border border-white/[0.06] rounded-2xl p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-white/5 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/5 rounded w-2/3" />
                <div className="h-2.5 bg-white/5 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (notifications.length === 0 && shoutouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <p className="text-slate-400 font-medium text-sm">No activity yet</p>
        <p className="text-slate-600 text-xs mt-1 max-w-[240px] leading-relaxed">
          Invite some friends to start shedding
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Activity</h2>
        <p className="text-slate-500 text-sm mt-0.5">Your recent interactions</p>
      </div>

      {/* ── Co-session invites ── */}
      {shoutouts.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em]">
            Co-session invites
          </p>
          {shoutouts.map(s => (
            <div
              key={s.id}
              className="bg-[#16161F] border border-amber-500/20 rounded-2xl overflow-hidden"
            >
              {/* Amber accent bar */}
              <div className="h-0.5 bg-amber-500/40 w-full" />
              <div className="px-4 py-3.5 space-y-3">
                {/* Who tagged you */}
                <div className="flex items-center gap-2.5">
                  <Avatar username={s.tagger?.username} avatarUrl={s.tagger?.avatar_url} size="sm" />
                  <p className="text-sm text-slate-300 leading-snug">
                    <span className="font-bold" style={{ color: '#F59E0B' }}>@{s.tagger?.username}</span>
                    {' '}tagged you in a practice session
                  </p>
                </div>
                {/* Session details */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white/5 text-slate-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {s.sessions?.instrument}
                  </span>
                  <span className="text-slate-700 text-xs">·</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {formatDuration(s.sessions?.duration_minutes ?? 0)}
                  </span>
                  {s.sessions?.notes && (
                    <>
                      <span className="text-slate-700 text-xs">·</span>
                      <span className="text-xs text-slate-600 line-clamp-1 max-w-[180px]">
                        {s.sessions.notes}
                      </span>
                    </>
                  )}
                </div>
                {/* Accept / Decline */}
                <div className="flex gap-2 pt-0.5">
                  <button
                    onClick={() => handleAccept(s)}
                    className="flex-1 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold hover:bg-amber-500/20 transition"
                  >
                    Yes, I was there
                  </button>
                  <button
                    onClick={() => handleDecline(s.id)}
                    className="flex-1 py-2 rounded-xl border border-white/10 text-slate-500 text-xs font-medium hover:border-white/20 hover:text-slate-400 transition"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Notifications ── */}
      <div className="space-y-2">
        {notifications.map(n => {
          const username   = n.actor?.username ?? 'someone'
          const instrument = n.sessions?.instrument
          const unread     = !n.read
          const target     = navTarget(n)

          return (
            <button
              key={n.id}
              onClick={() => target && onNavigate?.(target)}
              className={`relative w-full text-left bg-[#16161F] border rounded-2xl overflow-hidden transition active:bg-white/[0.04] active:scale-[0.99] ${
                unread ? 'border-amber-500/20' : 'border-white/[0.06]'
              } ${target ? 'cursor-pointer hover:border-white/10' : 'cursor-default'}`}
            >
              {/* Unread accent bar */}
              {unread && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/60 rounded-l-2xl" />
              )}

              <div className={`flex items-center gap-3 px-4 py-3.5 ${unread ? 'pl-5' : ''}`}>
                <Avatar username={username} avatarUrl={n.actor?.avatar_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 leading-snug">
                    <span className="font-bold" style={{ color: '#F59E0B' }}>{username}</span>
                    {' '}
                    <span>{actionText(n.type, instrument)}</span>
                  </p>
                  {(n.type === 'comment' || n.type === 'reply') && n.sessions?.notes && (
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                      "{n.sessions.notes}"
                    </p>
                  )}
                  <p className="text-[11px] text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {unread && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                  {target && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
