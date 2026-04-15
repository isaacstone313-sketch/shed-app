import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import BadgeIcon from '../components/BadgeIcon'

const BadgeContext = createContext(null)

/** Call inside any component wrapped by BadgeProvider to get showBadgeToast */
export function useBadgeToast() {
  return useContext(BadgeContext)
}

// ── Toast renderer ────────────────────────────────────────────────────────────

function BadgeToast({ badge }) {
  return (
    <div className="fixed bottom-20 inset-x-0 z-[80] flex justify-center pointer-events-none px-4">
      <div className="animate-badge-toast flex items-center gap-3.5 bg-[#1C1C2A] border border-white/[0.10] rounded-2xl px-4 py-3.5 shadow-2xl max-w-sm w-full">
        <BadgeIcon badge={badge} earned size={48} />
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.12em]">
            Badge Unlocked
          </p>
          <p className="text-sm font-semibold text-white mt-0.5 leading-tight">{badge.name}</p>
          <p className="text-xs text-slate-400 mt-0.5 leading-tight truncate">{badge.description}</p>
        </div>
      </div>
    </div>
  )
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function BadgeProvider({ children }) {
  const [current, setCurrent] = useState(null)
  const queueRef  = useRef([])
  const timerRef  = useRef(null)
  const activeRef = useRef(false) // prevents showing next before animation out

  function showNext() {
    if (queueRef.current.length === 0) { activeRef.current = false; return }
    const next = queueRef.current.shift()
    activeRef.current = true
    setCurrent(next)
    timerRef.current = setTimeout(() => {
      setCurrent(null)
      // Small gap between toasts so exit animation is visible
      setTimeout(showNext, 350)
    }, 4000)
  }

  const showBadgeToast = useCallback((badge) => {
    queueRef.current.push(badge)
    if (!activeRef.current) showNext()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <BadgeContext.Provider value={showBadgeToast}>
      {children}
      {current && <BadgeToast badge={current} />}
    </BadgeContext.Provider>
  )
}
