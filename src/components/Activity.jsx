import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Avatar } from './SessionCard'

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

export default function Activity({ userId, onRead }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading]             = useState(true)

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

      // Mark all as read
      const unreadIds = (data ?? []).filter(n => !n.read).map(n => n.id)
      if (unreadIds.length) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds)
        onRead?.()
      }
    }
    load()
  }, [userId])

  if (loading) {
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

  if (notifications.length === 0) {
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

      <div className="space-y-2">
        {notifications.map(n => {
          const username   = n.actor?.username ?? 'someone'
          const instrument = n.sessions?.instrument
          const unread     = !n.read

          return (
            <div
              key={n.id}
              className={`relative bg-[#16161F] border rounded-2xl overflow-hidden transition ${
                unread
                  ? 'border-amber-500/20'
                  : 'border-white/[0.06]'
              }`}
            >
              {/* Unread accent bar */}
              {unread && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500/60 rounded-l-2xl" />
              )}

              <div className={`flex items-start gap-3 px-4 py-3.5 ${unread ? 'pl-5' : ''}`}>
                <Avatar username={username} avatarUrl={n.actor?.avatar_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300 leading-snug">
                    <span className="font-bold" style={{ color: '#F59E0B' }}>{username}</span>
                    {' '}
                    <span>{actionText(n.type, instrument)}</span>
                  </p>
                  {(n.type === 'comment') && n.sessions?.notes && (
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                      "{n.sessions.notes}"
                    </p>
                  )}
                  <p className="text-[11px] text-slate-600 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {unread && (
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
