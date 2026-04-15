import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { computeStats, calculateBestStreak } from '../utils/stats'
import { Avatar } from './SessionCard'
import GeoBg from './GeoBg'
import BadgeIcon from './BadgeIcon'

function formatJoined(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function getWeekBounds() {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const daysFromMonday = (dayOfWeek + 6) % 7
  const start = new Date(now)
  start.setDate(now.getDate() - daysFromMonday)
  start.setHours(0, 0, 0, 0)
  return start
}

// ── Practice Calendar ─────────────────────────────────────────────────────────

function PracticeCalendar({ userId }) {
  const today = new Date()
  const [displayDate, setDisplayDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [monthSessions, setMonthSessions] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)

  const year  = displayDate.getFullYear()
  const month = displayDate.getMonth()

  useEffect(() => {
    setSelectedDay(null)
    const start = new Date(year, month, 1).toISOString()
    const end   = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString()
    supabase.from('sessions')
      .select('id, instrument, duration_minutes, created_at')
      .eq('user_id', userId)
      .gte('created_at', start)
      .lte('created_at', end)
      .then(({ data }) => setMonthSessions(data ?? []))
  }, [year, month, userId])

  const sessionsByDay = {}
  for (const s of monthSessions) {
    const d = new Date(s.created_at).getDate()
    if (!sessionsByDay[d]) sessionsByDay[d] = []
    sessionsByDay[d].push(s)
  }

  const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7 // 0=Mon
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const monthLabel = displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const cells = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="card">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setDisplayDate(new Date(year, month - 1, 1))}
          className="p-1.5 text-slate-500 hover:text-white transition rounded-lg hover:bg-white/5"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-white">{monthLabel}</span>
        <button
          onClick={() => setDisplayDate(new Date(year, month + 1, 1))}
          disabled={isCurrentMonth}
          className="p-1.5 text-slate-500 hover:text-white transition rounded-lg hover:bg-white/5 disabled:opacity-20 disabled:pointer-events-none"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1.5">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e${i}`} />
          const sessions    = sessionsByDay[day] ?? []
          const hasSessions = sessions.length > 0
          const isToday     = isCurrentMonth && today.getDate() === day
          const isSelected  = selectedDay === day

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(hasSessions ? (isSelected ? null : day) : null)}
              className={`relative flex flex-col items-center py-1.5 rounded-lg transition ${
                isToday    ? 'ring-1 ring-amber-500/50'    : ''
              } ${isSelected ? 'bg-amber-500/10' : hasSessions ? 'hover:bg-white/[0.03]' : ''}`}
            >
              <span className={`text-xs leading-none ${
                isToday ? 'text-amber-400 font-semibold'
                  : hasSessions ? 'text-slate-300'
                  : 'text-slate-600'
              }`}>
                {day}
              </span>
              {hasSessions && (
                <span className={`mt-1 rounded-full bg-amber-500 ${
                  sessions.length >= 2 ? 'w-2 h-2 opacity-100' : 'w-1.5 h-1.5 opacity-80'
                }`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Day popover */}
      {selectedDay != null && sessionsByDay[selectedDay] && (
        <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            {new Date(year, month, selectedDay).toLocaleDateString('en-US', {
              weekday: 'long', month: 'short', day: 'numeric',
            })}
          </p>
          {sessionsByDay[selectedDay].map(s => (
            <div key={s.id} className="flex items-center gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-sm text-slate-300 font-medium">{s.instrument}</span>
              <span className="text-xs text-slate-600">·</span>
              <span className="text-xs text-slate-500">{s.duration_minutes} min</span>
              <span className="ml-auto text-xs text-slate-600">
                {new Date(s.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Profile component ────────────────────────────────────────────────────

export default function Profile({ userId, profile: profileProp, onViewSessions }) {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [allBadges, setAllBadges]     = useState([])
  const [earnedIds, setEarnedIds]     = useState(new Set())
  const [badgesLoading, setBadgesLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: profileData }, { data: sessions }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('sessions')
          .select('id, duration_minutes, created_at')
          .eq('user_id', userId),
      ])

      const sessionList = sessions ?? []
      const [{ data: followingData }, { data: followersData }] = await Promise.all([
        supabase.from('follows').select('id').eq('follower_id', userId),
        supabase.from('follows').select('id').eq('following_id', userId),
      ])

      const stats     = computeStats(sessionList)
      const bestStreak = calculateBestStreak(sessionList)
      const weekStart = getWeekBounds()
      const weekSessions = sessionList.filter(s => new Date(s.created_at) >= weekStart)

      setData({
        profile:      profileData,
        stats,
        bestStreak,
        weekMinutes:  weekSessions.reduce((sum, s) => sum + s.duration_minutes, 0),
        weekSessions: weekSessions.length,
        following:    followingData?.length ?? 0,
        followers:    followersData?.length ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [userId, profileProp]) // re-load when profileProp changes (e.g. avatar update)

  useEffect(() => {
    async function loadBadges() {
      const [{ data: badges }, { data: earned }] = await Promise.all([
        supabase.from('badges').select('*').order('category').order('threshold'),
        supabase.from('user_badges').select('badge_id').eq('user_id', userId),
      ])
      setAllBadges(badges ?? [])
      setEarnedIds(new Set((earned ?? []).map(r => r.badge_id)))
      setBadgesLoading(false)
    }
    loadBadges()
  }, [userId])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col items-center py-10">
          <div className="w-20 h-20 rounded-full bg-white/10" />
          <div className="mt-3 h-5 w-28 bg-white/10 rounded" />
          <div className="mt-2 h-3 w-20 bg-white/5 rounded" />
        </div>
      </div>
    )
  }

  const { profile, stats, bestStreak, weekMinutes, weekSessions, following, followers } = data
  const username  = profile?.username ?? '?'
  const avatarUrl = profile?.avatar_url ?? profileProp?.avatar_url ?? null

  const totalHours = Math.round(stats.totalMinutes / 60)

  return (
    <div className="space-y-5">

      {/* ── Hero ── */}
      <div className="relative -mx-4 -mt-4 px-4 pt-10 pb-6 overflow-hidden flex flex-col items-center text-center">
        <GeoBg rings={3} ringSize={360} dotOpacity={0.05} />

        <div className="relative z-10 ring-2 ring-amber-500/50 ring-offset-2 ring-offset-[#0D0D14] rounded-full">
          <Avatar username={username} avatarUrl={avatarUrl} size="lg" />
        </div>

        <h2 className="relative z-10 mt-4 text-xl font-semibold text-white">{username}</h2>
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

      {/* ── This week ── */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">This week</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-[#16161F] border border-white/[0.06] rounded-2xl py-4 text-center">
            <div className="text-2xl font-bold text-amber-500 leading-none">{weekMinutes}<span className="text-base font-semibold text-amber-600/70">m</span></div>
            <div className="text-[11px] text-slate-500 mt-1.5 uppercase tracking-wide">minutes</div>
          </div>
          <button
            onClick={() => onViewSessions?.()}
            className="flex-1 bg-[#16161F] border border-white/[0.06] rounded-2xl py-4 text-center hover:border-white/10 transition active:scale-[0.97]"
          >
            <div className="text-2xl font-bold text-white leading-none">{weekSessions}</div>
            <div className="text-[11px] text-slate-500 mt-1.5 uppercase tracking-wide">sessions</div>
          </button>
          <div className="flex-1 bg-[#16161F] border border-white/[0.06] rounded-2xl py-4 text-center">
            <div className="text-2xl font-bold text-amber-500 leading-none">{stats.streak}</div>
            <div className="text-[11px] text-slate-500 mt-1.5 uppercase tracking-wide">streak 🔥</div>
          </div>
        </div>
      </div>

      {/* ── Practice calendar ── */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Practice calendar</p>
        <PracticeCalendar userId={userId} />
      </div>

      {/* ── Lifetime stats ── */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">All time</p>
        <div className="flex gap-2">
          <button
            onClick={() => onViewSessions?.()}
            className="flex-1 bg-[#16161F] border border-white/[0.06] rounded-2xl py-5 px-4 text-center hover:border-white/10 transition active:scale-[0.97]"
          >
            <div className="text-3xl font-bold text-white leading-none">{bestStreak}</div>
            <div className="text-[11px] text-slate-500 mt-2 uppercase tracking-wide">best streak 🏆</div>
          </button>
          <button
            onClick={() => onViewSessions?.()}
            className="flex-1 bg-[#16161F] border border-white/[0.06] rounded-2xl py-5 px-4 text-center hover:border-white/10 transition active:scale-[0.97]"
          >
            <div className="text-3xl font-bold text-white leading-none">{totalHours}<span className="text-xl font-semibold text-slate-500">h</span></div>
            <div className="text-[11px] text-slate-500 mt-2 uppercase tracking-wide">total hours</div>
          </button>
        </div>
      </div>

      {/* ── Badges ── */}
      {!badgesLoading && allBadges.length > 0 && (
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
            Badges{' '}
            <span className="text-slate-600 normal-case font-medium tracking-normal">
              · {earnedIds.size}/{allBadges.length}
            </span>
          </p>
          <div className="card">
            {['time', 'streak', 'social', 'sessions'].map(cat => {
              const catBadges = allBadges.filter(b => b.category === cat)
              if (!catBadges.length) return null
              const LABEL = { time: 'Time', streak: 'Streak', social: 'Social', sessions: 'Sessions' }
              return (
                <div key={cat} className="mb-5 last:mb-0">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
                    {LABEL[cat]}
                  </p>
                  <div className="grid grid-cols-4 gap-y-3">
                    {catBadges.map(badge => {
                      const earned = earnedIds.has(badge.id)
                      return (
                        <div key={badge.id} className="flex flex-col items-center gap-1.5">
                          <BadgeIcon badge={badge} earned={earned} size={52} />
                          <p className={`text-[10px] text-center leading-tight px-0.5 ${earned ? 'text-slate-300' : 'text-slate-600'}`}>
                            {badge.name}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
