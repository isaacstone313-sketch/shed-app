import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Avatar, formatDuration } from './SessionCard'
import SessionCard from './SessionCard'

function formatJoined(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function UserProfile({ viewUserId, currentUserId, onBack }) {
  const [profile, setProfile]         = useState(null)
  const [sessions, setSessions]       = useState([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followPending, setFollowPending] = useState(false)
  const [followers, setFollowers]     = useState(0)
  const [following, setFollowing]     = useState(0)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { data: profileData },
        { data: sessionsData },
        { data: followCheck },
        { data: followersData },
        { data: followingData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', viewUserId).single(),
        supabase.from('sessions')
          .select('*, profiles(username, avatar_url), comments(count)')
          .eq('user_id', viewUserId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('follows').select('id')
          .eq('follower_id', currentUserId).eq('following_id', viewUserId),
        supabase.from('follows').select('id').eq('following_id', viewUserId),
        supabase.from('follows').select('id').eq('follower_id', viewUserId),
      ])

      setProfile(profileData)
      setIsFollowing((followCheck?.length ?? 0) > 0)
      setFollowers(followersData?.length ?? 0)
      setFollowing(followingData?.length ?? 0)

      if (sessionsData?.length) {
        const sessionIds = sessionsData.map(s => s.id)
        const { data: kudosData } = await supabase
          .from('kudos').select('session_id, user_id').in('session_id', sessionIds)
        const kudos = kudosData ?? []
        setSessions(sessionsData.map(s => ({
          ...s,
          kudosCount:   kudos.filter(k => k.session_id === s.id).length,
          hasKudosed:   kudos.some(k => k.session_id === s.id && k.user_id === currentUserId),
          commentCount: s.comments?.[0]?.count ?? 0,
        })))
      }
      setLoading(false)
    }
    load()
  }, [viewUserId, currentUserId])

  async function handleFollow() {
    if (followPending) return
    const willFollow = !isFollowing
    setIsFollowing(willFollow)
    setFollowers(c => willFollow ? c + 1 : c - 1)
    setFollowPending(true)
    try {
      if (willFollow) {
        const { error } = await supabase.from('follows')
          .insert({ follower_id: currentUserId, following_id: viewUserId })
        if (error) throw error
      } else {
        const { error } = await supabase.from('follows').delete()
          .eq('follower_id', currentUserId).eq('following_id', viewUserId)
        if (error) throw error
      }
    } catch {
      setIsFollowing(!willFollow)
      setFollowers(c => willFollow ? c - 1 : c + 1)
    } finally {
      setFollowPending(false)
    }
  }

  const isOwnProfile = viewUserId === currentUserId

  return (
    <div className="space-y-5">
      {/* Back */}
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
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/10 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-white/10 rounded w-28" />
              <div className="h-3 bg-white/5 rounded w-20" />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="flex items-start gap-4">
            <div className="ring-2 ring-amber-500/30 ring-offset-2 ring-offset-[#0D0D14] rounded-full shrink-0">
              <Avatar
                username={profile?.username}
                avatarUrl={profile?.avatar_url}
                size="lg"
              />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2 className="text-lg font-semibold text-white truncate">{profile?.username}</h2>
              <p className="text-slate-600 text-xs mt-0.5">Joined {formatJoined(profile?.created_at)}</p>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="text-slate-500">
                  <strong className="text-white font-semibold">{following}</strong> following
                </span>
                <span className="text-slate-700">·</span>
                <span className="text-slate-500">
                  <strong className="text-white font-semibold">{followers}</strong> followers
                </span>
              </div>
            </div>
            {!isOwnProfile && (
              <button
                onClick={handleFollow}
                disabled={followPending}
                className={`shrink-0 mt-1 text-xs font-semibold px-4 py-2 rounded-full border transition disabled:opacity-50 ${
                  isFollowing
                    ? 'border-white/10 text-slate-500 hover:border-red-500/30 hover:text-red-400'
                    : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          {/* Sessions */}
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-slate-500 text-sm">No sessions logged yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Sessions · {sessions.length}
              </p>
              {sessions.map(s => (
                <SessionCard
                  key={s.id}
                  session={s}
                  userId={currentUserId}
                  isFollowing={isFollowing}
                  onFollowChange={() => {}}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
