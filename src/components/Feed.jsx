import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { computeStats } from '../utils/stats'
import SessionCard from './SessionCard'
import RecoRow from './RecoRow'

function groupByDate(sessions) {
  const now = new Date()
  const today = now.toDateString()
  const yesterday = new Date(now - 86400000).toDateString()
  const weekAgo = new Date(now - 7 * 86400000)

  const buckets = { Today: [], Yesterday: [], 'This Week': [], Earlier: [] }
  for (const s of sessions) {
    const d = new Date(s.created_at)
    if (d.toDateString() === today) buckets.Today.push(s)
    else if (d.toDateString() === yesterday) buckets.Yesterday.push(s)
    else if (d > weekAgo) buckets['This Week'].push(s)
    else buckets.Earlier.push(s)
  }
  return Object.entries(buckets).filter(([, items]) => items.length > 0)
}

// Build a flat list of render items, inserting a reco placeholder after every 4th session
function buildFeedItems(groups) {
  const items = []
  let sessionCount = 0
  for (const [label, sessions] of groups) {
    items.push({ type: 'divider', label })
    for (const session of sessions) {
      items.push({ type: 'session', session })
      sessionCount++
      if (sessionCount % 4 === 0) {
        items.push({ type: 'reco', key: `reco-${sessionCount}` })
      }
    }
  }
  return items
}

function DateDivider({ label }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-white/5" />
      <span className="text-xs font-bold text-amber-500/60 uppercase tracking-[0.15em] shrink-0">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/5" />
    </div>
  )
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <p className="text-slate-400 font-medium text-sm">Nothing here yet</p>
      <p className="text-slate-600 text-xs mt-1 max-w-[220px] leading-relaxed">
        Log a session, join a group, or follow people to fill your feed.
      </p>
    </div>
  )
}

export default function Feed({ userId }) {
  const [sessions, setSessions]     = useState([])
  const [myStats, setMyStats]       = useState(null)
  const [followingIds, setFollowingIds] = useState(new Set())
  const [loading, setLoading]       = useState(true)

  const loadFeed = useCallback(async () => {
    const [groupRows, followRows] = await Promise.all([
      supabase.from('group_members').select('group_id').eq('user_id', userId),
      supabase.from('follows').select('following_id').eq('follower_id', userId),
    ])

    const myFollowingIds = (followRows.data ?? []).map(f => f.following_id)
    setFollowingIds(new Set(myFollowingIds))

    let memberIds = [userId, ...myFollowingIds]
    if (groupRows.data?.length) {
      const groupIds = groupRows.data.map(r => r.group_id)
      const { data: allMembers } = await supabase
        .from('group_members').select('user_id').in('group_id', groupIds)
      memberIds = [...new Set([...memberIds, ...(allMembers ?? []).map(m => m.user_id)])]
    }

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*, profiles(username, avatar_url), comments(count)')
      .in('user_id', memberIds)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!sessionsData?.length) {
      setSessions([])
      setMyStats(computeStats([]))
      setLoading(false)
      return
    }

    const sessionIds = sessionsData.map(s => s.id)
    const { data: kudosData } = await supabase
      .from('kudos').select('session_id, user_id').in('session_id', sessionIds)

    const kudos = kudosData ?? []
    const enriched = sessionsData.map(s => ({
      ...s,
      kudosCount:   kudos.filter(k => k.session_id === s.id).length,
      hasKudosed:   kudos.some(k => k.session_id === s.id && k.user_id === userId),
      commentCount: s.comments?.[0]?.count ?? 0,
    }))

    setSessions(enriched)
    setMyStats(computeStats(sessionsData.filter(s => s.user_id === userId)))
    setLoading(false)
  }, [userId])

  useEffect(() => { loadFeed() }, [loadFeed])

  function handleFollowChange(targetUserId, nowFollowing) {
    setFollowingIds(prev => {
      const next = new Set(prev)
      nowFollowing ? next.add(targetUserId) : next.delete(targetUserId)
      return next
    })
  }

  const groups = groupByDate(sessions)
  const feedItems = buildFeedItems(groups)

  return (
    <div className="space-y-4">
      {/* My stats strip */}
      {myStats && myStats.sessionCount > 0 && (
        <div className="flex gap-2 mb-2">
          <div className="flex-1 bg-[#16161F] border border-white/[0.06] rounded-2xl py-4 text-center">
            <div className="text-2xl font-bold text-amber-500 leading-none">{myStats.streak}</div>
            <div className="text-[11px] text-slate-500 mt-1.5 uppercase tracking-wide">day streak 🔥</div>
          </div>
          <div className="flex-1 bg-[#16161F] border border-white/[0.06] rounded-2xl py-4 text-center">
            <div className="text-2xl font-bold text-white leading-none">{myStats.totalMinutes}<span className="text-base font-semibold text-slate-500">m</span></div>
            <div className="text-[11px] text-slate-500 mt-1.5 uppercase tracking-wide">total</div>
          </div>
          <div className="flex-1 bg-[#16161F] border border-white/[0.06] rounded-2xl py-4 text-center">
            <div className="text-2xl font-bold text-white leading-none">{myStats.sessionCount}</div>
            <div className="text-[11px] text-slate-500 mt-1.5 uppercase tracking-wide">sessions</div>
          </div>
        </div>
      )}

      {loading ? (
        <FeedSkeleton />
      ) : sessions.length === 0 ? (
        <EmptyFeed />
      ) : (
        <div className="space-y-3">
          {feedItems.map((item, i) => {
            if (item.type === 'divider') {
              return <DateDivider key={`d-${item.label}`} label={item.label} />
            }
            if (item.type === 'reco') {
              return (
                <RecoRow
                  key={item.key}
                  userId={userId}
                  followingIds={followingIds}
                  onFollowChange={handleFollowChange}
                />
              )
            }
            return (
              <SessionCard
                key={item.session.id}
                session={item.session}
                userId={userId}
                isFollowing={followingIds.has(item.session.user_id)}
                onFollowChange={handleFollowChange}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-[#16161F] border border-white/[0.06] rounded-2xl p-4 animate-pulse">
          <div className="flex gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-full bg-white/5 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 bg-white/5 rounded w-24" />
              <div className="h-2.5 bg-white/5 rounded w-32" />
            </div>
          </div>
          <div className="h-3 bg-white/5 rounded w-full mb-2" />
          <div className="h-3 bg-white/5 rounded w-2/3" />
        </div>
      ))}
    </div>
  )
}
