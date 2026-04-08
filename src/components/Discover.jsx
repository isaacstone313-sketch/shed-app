import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import SessionCard, { Avatar } from './SessionCard'

const PAGE_SIZE = 20

export default function Discover({ userId }) {
  const [sessions, setSessions] = useState([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [followingIds, setFollowingIds] = useState(new Set())

  // Search
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const debounceRef = useRef(null)

  // Load follows once
  useEffect(() => {
    supabase.from('follows').select('following_id').eq('follower_id', userId)
      .then(({ data }) => setFollowingIds(new Set((data ?? []).map(f => f.following_id))))
  }, [userId])

  const loadSessions = useCallback(async (fromOffset, replace) => {
    if (replace) setLoading(true)
    else setLoadingMore(true)

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*, profiles(username), comments(count)')
      .order('created_at', { ascending: false })
      .range(fromOffset, fromOffset + PAGE_SIZE - 1)

    const data = sessionsData ?? []

    if (data.length) {
      const sessionIds = data.map(s => s.id)
      const { data: kudosData } = await supabase
        .from('kudos').select('session_id, user_id').in('session_id', sessionIds)
      const kudos = kudosData ?? []
      const enriched = data.map(s => ({
        ...s,
        kudosCount:   kudos.filter(k => k.session_id === s.id).length,
        hasKudosed:   kudos.some(k => k.session_id === s.id && k.user_id === userId),
        commentCount: s.comments?.[0]?.count ?? 0,
      }))
      replace ? setSessions(enriched) : setSessions(prev => [...prev, ...enriched])
    } else if (replace) {
      setSessions([])
    }

    setHasMore(data.length === PAGE_SIZE)
    setOffset(fromOffset + PAGE_SIZE)
    replace ? setLoading(false) : setLoadingMore(false)
  }, [userId])

  useEffect(() => { loadSessions(0, true) }, [loadSessions])

  // Debounced username search
  useEffect(() => {
    clearTimeout(debounceRef.current)
    if (!query.trim()) { setSearchResults([]); return }
    setSearchLoading(true)
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${query.trim()}%`)
        .neq('id', userId)
        .limit(10)
      setSearchResults(data ?? [])
      setSearchLoading(false)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [query, userId])

  function handleFollowChange(targetUserId, nowFollowing) {
    setFollowingIds(prev => {
      const next = new Set(prev)
      nowFollowing ? next.add(targetUserId) : next.delete(targetUserId)
      return next
    })
  }

  const isSearching = query.trim().length > 0

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Discover</h2>
        <p className="text-slate-500 text-sm mt-0.5">The global practice stream</p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="input pl-9"
          placeholder="Search by username…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Search results */}
      {isSearching && (
        <div className="space-y-2">
          {searchLoading ? (
            <div className="text-slate-500 text-sm text-center py-4">Searching…</div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-slate-400 text-sm font-medium">No musicians found</p>
              <p className="text-slate-600 text-xs mt-1">Try a different username</p>
            </div>
          ) : (
            searchResults.map(profile => (
              <UserRow
                key={profile.id}
                profile={profile}
                userId={userId}
                isFollowing={followingIds.has(profile.id)}
                onFollowChange={handleFollowChange}
              />
            ))
          )}
        </div>
      )}

      {/* Public feed */}
      {!isSearching && (
        <>
          {loading ? (
            <FeedSkeleton />
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium text-sm">No sessions yet</p>
              <p className="text-slate-600 text-xs mt-1">Be the first to log a practice session.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
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

              {hasMore && (
                <button
                  onClick={() => loadSessions(offset, false)}
                  disabled={loadingMore}
                  className="btn-secondary w-full"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

function UserRow({ profile, userId, isFollowing, onFollowChange }) {
  const [pending, setPending] = useState(false)

  async function handleFollow() {
    if (pending) return
    const willFollow = !isFollowing
    onFollowChange(profile.id, willFollow)
    setPending(true)
    try {
      if (willFollow) {
        const { error } = await supabase.from('follows')
          .insert({ follower_id: userId, following_id: profile.id })
        if (error) throw error
      } else {
        const { error } = await supabase.from('follows').delete()
          .eq('follower_id', userId).eq('following_id', profile.id)
        if (error) throw error
      }
    } catch {
      onFollowChange(profile.id, !willFollow)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="bg-[#16161F] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center gap-3">
      <Avatar username={profile.username} />
      <span className="flex-1 text-sm font-medium text-white">{profile.username}</span>
      <button
        onClick={handleFollow}
        disabled={pending}
        className={`text-xs font-medium px-2.5 py-1 rounded-full border transition disabled:opacity-50 ${
          isFollowing
            ? 'border-white/10 text-slate-500 hover:border-red-500/30 hover:text-red-400'
            : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10'
        }`}
      >
        {isFollowing ? 'Following' : 'Follow'}
      </button>
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
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
          <div className="h-3 bg-white/5 rounded w-3/4" />
        </div>
      ))}
    </div>
  )
}
