import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Leaderboard from './Leaderboard'
import { Avatar } from './SessionCard'
import { checkBadges } from '../utils/badges'
import { useBadgeToast } from '../context/BadgeContext'

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export default function Groups({ userId, profile, onViewUser }) {
  const showBadgeToast = useBadgeToast()
  const [following, setFollowing] = useState([])  // { id, username, avatar_url }
  const [followsLoading, setFollowsLoading] = useState(true)

  const [myGroups, setMyGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState(null)

  // Create group state
  const [createName, setCreateName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState('')

  // Join group state
  const [joinCode, setJoinCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState('')

  useEffect(() => {
    supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, avatar_url)')
      .eq('follower_id', userId)
      .then(({ data }) => {
        setFollowing((data ?? []).map(r => r.profiles).filter(Boolean))
        setFollowsLoading(false)
      })
  }, [userId])

  const fetchGroups = useCallback(async () => {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, invite_code, created_by, created_at)')
      .eq('user_id', userId)
    setMyGroups((data || []).map(d => d.groups).filter(Boolean))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)

    const code = generateInviteCode()
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: createName.trim(), invite_code: code, created_by: userId })
      .select()
      .single()

    if (groupError) {
      setCreateError(groupError.message)
      setCreateLoading(false)
      return
    }

    // Auto-join the group as creator
    await supabase.from('group_members').insert({ group_id: group.id, user_id: userId })

    setCreateName('')
    setCreateLoading(false)
    await fetchGroups()
  }

  async function handleJoin(e) {
    e.preventDefault()
    setJoinError('')
    setJoinSuccess('')
    setJoinLoading(true)

    const code = joinCode.trim().toUpperCase()
    const { data: group, error: findError } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', code)
      .single()

    if (findError || !group) {
      setJoinError('Group not found. Double-check the invite code.')
      setJoinLoading(false)
      return
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single()

    if (existing) {
      setJoinError("You're already in this group.")
      setJoinLoading(false)
      return
    }

    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId })

    if (joinError) {
      setJoinError(joinError.message)
    } else {
      setJoinCode('')
      setJoinSuccess(`Joined "${group.name}"!`)
      await fetchGroups()
      checkBadges(userId).then(earned => earned.forEach(b => showBadgeToast(b)))
    }
    setJoinLoading(false)
  }

  async function handleLeave(groupId) {
    if (!confirm('Leave this group?')) return
    await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId)
    await fetchGroups()
    if (selectedGroup?.id === groupId) setSelectedGroup(null)
  }

  if (selectedGroup) {
    return (
      <Leaderboard
        group={selectedGroup}
        currentUserId={userId}
        onBack={() => setSelectedGroup(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Groups</h2>
        <p className="text-slate-500 text-sm mt-0.5">Compete with friends on practice time</p>
      </div>

      {/* ── Friends ── */}
      {!followsLoading && (
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em]">
            Following{following.length > 0 ? ` · ${following.length}` : ''}
          </p>
          {following.length === 0 ? (
            <p className="text-slate-600 text-sm">Follow musicians to see them here</p>
          ) : (
            <div
              className="flex overflow-x-auto pb-1 gap-4"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
            >
              {following.map(f => (
                <button
                  key={f.id}
                  onClick={() => onViewUser?.(f.id)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <div className="ring-2 ring-transparent group-hover:ring-amber-500/40 rounded-full transition">
                    <Avatar username={f.username} avatarUrl={f.avatar_url} size="md" />
                  </div>
                  <span className="text-[11px] text-slate-400 max-w-[56px] truncate leading-tight">
                    {f.username}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My groups */}
      {loading ? (
        <div className="text-slate-500 text-sm text-center py-4">Loading…</div>
      ) : myGroups.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm font-medium">No groups yet</p>
          <p className="text-slate-600 text-xs mt-1 max-w-[200px]">Create a group or join one with an invite code below.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {myGroups.map(group => (
            <div
              key={group.id}
              className="card flex items-center justify-between gap-4 cursor-pointer hover:border-white/10 transition"
              onClick={() => setSelectedGroup(group)}
            >
              <div>
                <div className="font-medium text-sm text-white">{group.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Code:{' '}
                  <span className="font-mono font-medium text-amber-400">{group.invite_code}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-medium">Leaderboard →</span>
                <button
                  onClick={e => {
                    e.stopPropagation()
                    handleLeave(group.id)
                  }}
                  className="text-xs text-slate-600 hover:text-red-400 transition"
                >
                  Leave
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create + Join side by side */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Create group */}
        <div className="card">
          <h3 className="font-medium text-sm text-white mb-3">Create a group</h3>
          <form onSubmit={handleCreate} className="space-y-2">
            <input
              className="input"
              placeholder="Group name"
              value={createName}
              onChange={e => setCreateName(e.target.value)}
              required
            />
            {createError && <p className="text-xs text-red-400">{createError}</p>}
            <button className="btn-primary w-full" disabled={createLoading}>
              {createLoading ? 'Creating…' : 'Create'}
            </button>
          </form>
        </div>

        {/* Join group */}
        <div className="card">
          <h3 className="font-medium text-sm text-white mb-3">Join a group</h3>
          <form onSubmit={handleJoin} className="space-y-2">
            <input
              className="input font-mono uppercase"
              placeholder="Invite code"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              required
              maxLength={6}
            />
            {joinError && <p className="text-xs text-red-400">{joinError}</p>}
            {joinSuccess && <p className="text-xs text-emerald-400">{joinSuccess}</p>}
            <button className="btn-primary w-full" disabled={joinLoading}>
              {joinLoading ? 'Joining…' : 'Join'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
