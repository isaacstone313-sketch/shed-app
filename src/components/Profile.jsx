import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { computeStats } from '../utils/stats'
import { avatarColor } from './SessionCard'
import GeoBg from './GeoBg'

function formatHours(minutes) {
  if (minutes === 0) return '0h'
  if (minutes < 60) return `${minutes}m`
  const h = minutes / 60
  return h < 10 ? `${h.toFixed(1)}h` : `${Math.round(h)}h`
}

function formatJoined(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function StatCell({ label, value, accent }) {
  return (
    <div className="flex-1 py-4 text-center border-r last:border-r-0 border-white/[0.06]">
      <div className={`text-xl font-semibold leading-tight ${accent ? 'text-amber-500' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  )
}

export default function Profile({ userId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: profile }, { data: sessions }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('sessions').select('id, duration_minutes, created_at').eq('user_id', userId),
      ])

      const sessionList = sessions ?? []
      const sessionIds = sessionList.map(s => s.id)

      const [{ data: kudosData }, { data: followingData }, { data: followersData }] = await Promise.all([
        sessionIds.length
          ? supabase.from('kudos').select('id').in('session_id', sessionIds)
          : Promise.resolve({ data: [] }),
        supabase.from('follows').select('id').eq('follower_id', userId),
        supabase.from('follows').select('id').eq('following_id', userId),
      ])

      const stats = computeStats(sessionList)

      setData({
        profile,
        stats,
        kudosReceived: kudosData?.length ?? 0,
        following: followingData?.length ?? 0,
        followers: followersData?.length ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [userId])

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center py-10 animate-pulse">
          <div className="w-20 h-20 rounded-full bg-white/10" />
          <div className="mt-3 h-5 w-28 bg-white/10 rounded" />
          <div className="mt-2 h-3 w-20 bg-white/5 rounded" />
        </div>
      </div>
    )
  }

  const { profile, stats, kudosReceived, following, followers } = data
  const username = profile?.username ?? '?'
  const initials = username.slice(0, 2).toUpperCase()

  return (
    <div className="space-y-6">

      {/* Hero */}
      <div className="relative -mx-4 -mt-4 px-4 pt-8 pb-4 overflow-hidden flex flex-col items-center">
        <GeoBg rings={3} ringSize={360} dotOpacity={0.05} />
        <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ring-2 ring-amber-500/40 ${avatarColor(username)}`}>
          {initials}
        </div>

        <h2 className="relative z-10 mt-3 text-xl font-semibold text-white">{username}</h2>
        <p className="relative z-10 text-slate-500 text-xs mt-0.5">Joined {formatJoined(profile?.created_at)}</p>

        <div className="relative z-10 flex items-center gap-4 mt-3 text-sm">
          <span className="text-slate-500">
            <strong className="text-white font-semibold">{following}</strong> following
          </span>
          <span className="text-slate-700">·</span>
          <span className="text-slate-500">
            <strong className="text-white font-semibold">{followers}</strong> followers
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="border border-white/[0.06] rounded-2xl overflow-hidden flex bg-[#16161F]">
        <StatCell label="Hours" value={formatHours(stats.totalMinutes)} />
        <StatCell label="Streak" value={`${stats.streak} 🔥`} accent />
        <StatCell label="Sessions" value={stats.sessionCount} />
        <StatCell label="Kudos" value={kudosReceived} />
      </div>

      {/* Account section */}
      <div className="card space-y-1">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Account</h3>
        <div className="flex items-center justify-between py-1">
          <span className="text-sm text-slate-400">Email</span>
          <span className="text-sm text-slate-600 truncate max-w-[180px]">{profile?.id ? '••••••••' : '—'}</span>
        </div>
        <div className="border-t border-white/5 pt-3 mt-2">
          <button
            onClick={handleSignOut}
            className="text-sm text-red-400 hover:text-red-300 transition font-medium"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
