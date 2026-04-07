import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { computeStats } from '../utils/stats'
import SessionCard from './SessionCard'

export default function Feed({ userId }) {
  const [sessions, setSessions] = useState([])
  const [myStats, setMyStats] = useState(null)
  const [followingIds, setFollowingIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(async () => {
    // Collect IDs: own + group members + people I follow
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

    const sessionIds = sessionsData.map(s => s.id)
    const { data: kudosData } = await supabase
      .from('kudos').select('session_id, user_id').in('session_id', sessionIds)

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

  useEffect(() => { loadFeed() }, [loadFeed])

  function handleFollowChange(targetUserId, nowFollowing) {
    setFollowingIds(prev => {
      const next = new Set(prev)
      nowFollowing ? next.add(targetUserId) : next.delete(targetUserId)
      return next
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Feed</h2>
          <p className="text-stone-500 text-sm mt-0.5">You, your groups, and people you follow</p>
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
        <FeedSkeleton />
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-stone-400 text-sm">No sessions yet.</p>
          <p className="text-stone-400 text-xs mt-1">Log a session, join a group, or follow people to see activity here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              userId={userId}
              isFollowing={followingIds.has(session.user_id)}
              onFollowChange={handleFollowChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FeedSkeleton() {
  return (
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
  )
}
