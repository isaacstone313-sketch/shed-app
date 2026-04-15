import { supabase } from '../lib/supabase'
import { calculateBestStreak } from './stats'

/**
 * Checks which badges the user has newly earned since the last check,
 * inserts them into user_badges, and returns the newly earned badge rows.
 *
 * Safe to call after any action (log session, follow, comment, join group).
 * Returns [] if nothing new was earned or if any fetch fails.
 */
export async function checkBadges(userId) {
  // Fetch badge definitions + already-earned badge IDs in parallel
  const [{ data: allBadges }, { data: earnedRows }] = await Promise.all([
    supabase.from('badges').select('*'),
    supabase.from('user_badges').select('badge_id').eq('user_id', userId),
  ])

  if (!allBadges?.length) return []

  const earnedIds = new Set((earnedRows ?? []).map(r => r.badge_id))
  const unearned  = allBadges.filter(b => !earnedIds.has(b.id))
  if (!unearned.length) return []

  // Fetch user stats needed for all category checks
  const [
    { data: sessions },
    { data: follows },
    { count: commentCount },
  ] = await Promise.all([
    supabase.from('sessions').select('id, duration_minutes, created_at').eq('user_id', userId),
    supabase.from('follows').select('id').eq('follower_id', userId),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const sessionList  = sessions ?? []
  const totalMinutes = sessionList.reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0)
  const sessionCount = sessionList.length
  const followCount  = (follows ?? []).length
  const bestStreak   = calculateBestStreak(sessionList)

  // Determine which unearned badges are now qualified
  const newlyEarned = unearned.filter(badge => {
    switch (badge.category) {
      case 'time':
        return totalMinutes >= badge.threshold
      case 'streak':
        return bestStreak >= badge.threshold
      case 'social':
        if (badge.slug === 'first-comment') return (commentCount ?? 0) >= badge.threshold
        return followCount >= badge.threshold
      case 'sessions':
        return sessionCount >= badge.threshold
      default:
        return false
    }
  })

  if (!newlyEarned.length) return []

  // Insert newly earned badges (ignore conflicts from race conditions)
  await supabase.from('user_badges').insert(
    newlyEarned.map(b => ({ user_id: userId, badge_id: b.id }))
  )

  return newlyEarned
}
