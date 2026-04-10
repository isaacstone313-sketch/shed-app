import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Avatar } from './SessionCard'

async function fetchRecommendations(userId, followingIds) {
  // Profiles with session counts, excluding self
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, sessions(count)')
    .neq('id', userId)
    .limit(20)

  if (!profilesData?.length) return []

  // Most recent instrument per user
  const ids = profilesData.map(p => p.id)
  const { data: sessionData } = await supabase
    .from('sessions')
    .select('user_id, instrument')
    .in('user_id', ids)
    .order('created_at', { ascending: false })
    .limit(200)

  const instrumentMap = {}
  for (const s of sessionData ?? []) {
    if (!instrumentMap[s.user_id]) instrumentMap[s.user_id] = s.instrument
  }

  return profilesData
    .filter(p => !followingIds.has(p.id))
    .map(p => ({
      id:           p.id,
      username:     p.username,
      avatarUrl:    p.avatar_url ?? null,
      sessionCount: p.sessions?.[0]?.count ?? 0,
      instrument:   instrumentMap[p.id] ?? null,
    }))
    .filter(p => p.sessionCount > 0)
    .sort((a, b) => b.sessionCount - a.sessionCount)
    .slice(0, 10)
}

// ── Single recommendation card ────────────────────────────────────────────────

function RecoCard({ profile, userId, onFollowChange, onRemove }) {
  const [pending,  setPending]  = useState(false)
  const [followed, setFollowed] = useState(false) // true once follow is confirmed
  const [removing, setRemoving] = useState(false)

  async function handleFollow() {
    if (pending || followed) return
    setPending(true)
    try {
      const { error } = await supabase.from('follows')
        .insert({ follower_id: userId, following_id: profile.id })
      if (error) throw error
      setFollowed(true)
      onFollowChange?.(profile.id, true)
      // Start exit animation, then remove from DOM after it completes
      setRemoving(true)
      setTimeout(() => onRemove?.(profile.id), 380)
    } catch {
      // insert failed — nothing to revert since we haven't set followed yet
    } finally {
      setPending(false)
    }
  }

  return (
    // Outer wrapper collapses its own width + right-margin so adjacent cards
    // slide smoothly into the vacated space with no residual gap.
    <div
      style={{
        width:       removing ? 0 : '9rem',   // w-36
        marginRight: removing ? 0 : '0.75rem', // gap-3 equivalent
        opacity:     removing ? 0 : 1,
        overflow:    'hidden',
        flexShrink:  0,
        transition:  'width 0.35s ease, margin 0.35s ease, opacity 0.2s ease',
      }}
    >
      <div className="w-36 bg-[#1A1A27] border border-white/[0.06] rounded-2xl p-3.5 flex flex-col items-center gap-2 text-center">
        <Avatar username={profile.username} avatarUrl={profile.avatarUrl} />
        <div className="w-full">
          <p className="text-sm font-semibold text-white leading-tight truncate">{profile.username}</p>
          {profile.instrument && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{profile.instrument}</p>
          )}
          <p className="text-xs text-slate-600 mt-0.5">{profile.sessionCount} sessions</p>
        </div>
        <button
          onClick={handleFollow}
          disabled={pending || followed}
          className={`w-full text-xs font-semibold px-3 py-1.5 rounded-full border transition disabled:opacity-60 ${
            followed
              ? 'border-white/10 text-slate-500'
              : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
          }`}
        >
          {followed ? 'Following' : pending ? '…' : 'Follow'}
        </button>
      </div>
    </div>
  )
}

// ── Row wrapper ───────────────────────────────────────────────────────────────

export default function RecoRow({ userId, followingIds, onFollowChange, title = 'People to follow' }) {
  const [profiles, setProfiles] = useState([])
  const [ready,    setReady]    = useState(false)

  useEffect(() => {
    fetchRecommendations(userId, followingIds).then(recs => {
      setProfiles(recs)
      setReady(true)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // fetch once on mount with the snapshot of followingIds

  function removeProfile(id) {
    setProfiles(prev => prev.filter(p => p.id !== id))
  }

  if (!ready || profiles.length === 0) return null

  return (
    <div className="space-y-2.5 py-1">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em]">{title}</p>
      {/* No gap on the flex container — each card owns its own right margin so
          collapsing a card's width + margin leaves no residual hole */}
      <div
        className="flex overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {profiles.map(p => (
          <RecoCard
            key={p.id}
            profile={p}
            userId={userId}
            onFollowChange={onFollowChange}
            onRemove={removeProfile}
          />
        ))}
        {/* Trailing spacer so last card isn't flush with edge */}
        <div className="w-1 shrink-0" />
      </div>
    </div>
  )
}
