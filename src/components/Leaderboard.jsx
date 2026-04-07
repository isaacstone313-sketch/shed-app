import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { computeStats } from '../utils/stats'

const METRICS = [
  { id: 'totalMinutes', label: 'Minutes', format: m => `${m}m` },
  { id: 'streak', label: 'Streak', format: s => `${s}d` },
  { id: 'sessionCount', label: 'Sessions', format: n => `${n}` },
]

export default function Leaderboard({ group, currentUserId, onBack }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [metric, setMetric] = useState('totalMinutes')

  useEffect(() => {
    async function load() {
      setLoading(true)

      // Get all members of this group
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id, profiles(username)')
        .eq('group_id', group.id)

      if (!members?.length) {
        setRows([])
        setLoading(false)
        return
      }

      const memberIds = members.map(m => m.user_id)

      // Get all sessions for these members
      const { data: sessions } = await supabase
        .from('sessions')
        .select('user_id, duration_minutes, created_at')
        .in('user_id', memberIds)

      // Compute stats per user
      const leaderboard = members.map(member => {
        const userSessions = (sessions || []).filter(s => s.user_id === member.user_id)
        const stats = computeStats(userSessions)
        return {
          userId: member.user_id,
          username: member.profiles?.username ?? 'Unknown',
          ...stats,
        }
      })

      setRows(leaderboard)
      setLoading(false)
    }

    load()
  }, [group.id])

  const sorted = [...rows].sort((a, b) => b[metric] - a[metric])

  const activeMetric = METRICS.find(m => m.id === metric)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-300 transition text-sm">
          ← Back
        </button>
        <div>
          <h3 className="font-semibold text-white">{group.name}</h3>
          <p className="text-xs text-slate-500">
            Invite code:{' '}
            <span className="font-mono font-medium text-amber-400">{group.invite_code}</span>
          </p>
        </div>
      </div>

      {/* Metric tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-lg w-fit">
        {METRICS.map(m => (
          <button
            key={m.id}
            onClick={() => setMetric(m.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              metric === m.id ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm text-center py-8">Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="text-slate-500 text-sm text-center py-8">No members yet.</div>
      ) : (
        <div className="space-y-2">
          {sorted.map((row, i) => (
            <div
              key={row.userId}
              className={`card flex items-center gap-4 ${
                row.userId === currentUserId ? 'border-amber-500/20 bg-amber-500/5' : ''
              }`}
            >
              <span
                className={`text-sm font-semibold w-5 text-center ${
                  i === 0 ? 'text-amber-500' : 'text-slate-500'
                }`}
              >
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-white">
                {row.username}
                {row.userId === currentUserId && (
                  <span className="ml-1.5 text-xs text-amber-500">(you)</span>
                )}
              </span>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">
                  {activeMetric.format(row[metric])}
                </div>
                <div className="text-xs text-slate-500">{activeMetric.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
