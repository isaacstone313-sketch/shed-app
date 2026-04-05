export function calculateStreak(sessions) {
  if (!sessions.length) return 0

  const uniqueDates = [
    ...new Set(
      sessions.map(s => new Date(s.created_at).toLocaleDateString('en-CA'))
    ),
  ].sort((a, b) => b.localeCompare(a))

  const today = new Date().toLocaleDateString('en-CA')
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-CA')

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1])
    const curr = new Date(uniqueDates[i])
    const diffDays = Math.round((prev - curr) / 86400000)
    if (diffDays === 1) streak++
    else break
  }

  return streak
}

export function computeStats(sessions) {
  return {
    totalMinutes: sessions.reduce((sum, s) => sum + s.duration_minutes, 0),
    sessionCount: sessions.length,
    streak: calculateStreak(sessions),
  }
}
