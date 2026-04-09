import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SessionCard from './SessionCard'

export default function SessionDetail({ sessionId, expandComments, currentUserId, onBack }) {
  const [session, setSession]       = useState(null)
  const [followingIds, setFollowingIds] = useState(new Set())
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: sessionData }, { data: followData }] = await Promise.all([
        supabase.from('sessions')
          .select('*, profiles(username, avatar_url), comments(count)')
          .eq('id', sessionId)
          .single(),
        supabase.from('follows')
          .select('following_id')
          .eq('follower_id', currentUserId),
      ])

      setFollowingIds(new Set((followData ?? []).map(f => f.following_id)))

      if (sessionData) {
        const { data: kudosData } = await supabase
          .from('kudos').select('session_id, user_id').eq('session_id', sessionId)
        const kudos = kudosData ?? []
        setSession({
          ...sessionData,
          kudosCount:   kudos.length,
          hasKudosed:   kudos.some(k => k.user_id === currentUserId),
          commentCount: sessionData.comments?.[0]?.count ?? 0,
        })
      }
      setLoading(false)
    }
    load()
  }, [sessionId, currentUserId])

  function handleFollowChange(targetId, nowFollowing) {
    setFollowingIds(prev => {
      const next = new Set(prev)
      nowFollowing ? next.add(targetId) : next.delete(targetId)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      {loading ? (
        <div className="bg-[#16161F] border border-white/[0.06] rounded-2xl p-4 animate-pulse">
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
      ) : session ? (
        <SessionCard
          session={session}
          userId={currentUserId}
          isFollowing={followingIds.has(session.user_id)}
          onFollowChange={handleFollowChange}
          autoExpandComments={expandComments}
        />
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-slate-500 text-sm">Session not found.</p>
          <button onClick={onBack} className="mt-4 text-amber-500 text-sm hover:text-amber-400 transition">
            Go back
          </button>
        </div>
      )}
    </div>
  )
}
