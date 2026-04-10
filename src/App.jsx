import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './lib/supabase'
import Landing from './components/Landing'
import Auth from './components/Auth'
import UsernameSetup from './components/UsernameSetup'
import Nav from './components/Nav'
import BottomNav from './components/BottomNav'
import LogSessionFlow from './components/LogSessionFlow'
import Feed from './components/Feed'
import Discover from './components/Discover'
import Activity from './components/Activity'
import Groups from './components/Groups'
import Profile from './components/Profile'
import Settings from './components/Settings'
import SessionDetail from './components/SessionDetail'
import UserProfile from './components/UserProfile'
import MySessions from './components/MySessions'

export default function App() {
  const [session, setSession]         = useState(undefined)  // undefined = loading
  const [profile, setProfile]         = useState(null)
  const [view, setView]               = useState('home')
  const [authMode, setAuthMode]       = useState(null)       // null | 'signup' | 'signin'
  const [unreadCount, setUnreadCount]   = useState(0)
  const [activityOpen, setActivityOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // notification navigation
  const [navDetail, setNavDetail] = useState(null) // { type:'session', sessionId, expandComments } | { type:'user', userId } | null
  const [prevView, setPrevView]   = useState('home')
  // live session timer
  const [activeTimer, setActiveTimer]     = useState(null)   // { startTime } | null
  const [abandonConfirm, setAbandonConfirm] = useState(null) // null | targetView

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        fetchProfile(session.user.id)
        setAuthMode(null)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data ?? null)
  }

  const fetchUnreadCount = useCallback(async (userId) => {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    setUnreadCount(count ?? 0)
  }, [])

  useEffect(() => {
    if (session?.user?.id) fetchUnreadCount(session.user.id)
  }, [session, fetchUnreadCount])

  // Still resolving session
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D14]">
        <span className="text-slate-600 text-sm">Loading…</span>
      </div>
    )
  }

  // Not logged in — show landing or auth
  if (!session) {
    if (authMode) {
      return (
        <Auth
          initialMode={authMode}
          onBack={() => setAuthMode(null)}
        />
      )
    }
    return (
      <Landing
        onSignUp={() => setAuthMode('signup')}
        onSignIn={() => setAuthMode('signin')}
      />
    )
  }

  // Logged in, no username yet
  if (!profile) {
    return <UsernameSetup userId={session.user.id} onComplete={setProfile} />
  }

  // Full app
  return (
    <div className="min-h-screen bg-[#0D0D14]">
      <Nav
        unreadCount={unreadCount}
        onBellClick={() => { setActivityOpen(o => !o); setSettingsOpen(false) }}
        onGearClick={() => { setSettingsOpen(true); setActivityOpen(false) }}
      />


      {/* Activity slide-down panel */}
      {activityOpen && (
        <>
          <div
            className="fixed inset-0 z-20 bg-black/50"
            onClick={() => setActivityOpen(false)}
          />
          <div className="fixed top-12 inset-x-0 z-30 max-w-2xl mx-auto bg-[#0D0D14] border-b border-x border-white/[0.08] rounded-b-2xl shadow-2xl max-h-[75vh] overflow-y-auto animate-slide-down">
            <div className="px-4 pt-4 pb-6">
              <Activity
                userId={session.user.id}
                onRead={() => setUnreadCount(0)}
                onNavigate={target => {
                  setActivityOpen(false)
                  setPrevView(view)
                  setNavDetail(target)
                  setView(target.type === 'user' ? 'userProfile' : 'sessionDetail')
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Active session banner — shown when timer is running and user is on another tab */}
      {activeTimer && view !== 'log' && (
        <TimerBanner startTime={activeTimer.startTime} onClick={() => setView('log')} />
      )}

      <main className={`max-w-2xl mx-auto px-4 pb-36 ${activeTimer && view !== 'log' ? 'pt-14' : 'pt-6'}`}>
        {view === 'home'          && <Feed            userId={session.user.id} />}
        {view === 'discover'      && <Discover        userId={session.user.id} />}
        {view === 'log'           && (
          <LogSessionFlow
            userId={session.user.id}
            activeTimer={activeTimer}
            onTimerStart={t => setActiveTimer(t)}
            onTimerStop={() => setActiveTimer(null)}
          />
        )}
        {view === 'groups'        && <Groups          userId={session.user.id} profile={profile} />}
        {view === 'profile'       && <Profile         userId={session.user.id} profile={profile} onViewSessions={() => { setPrevView('profile'); setView('mySessions') }} />}
        {view === 'mySessions'    && <MySessions      userId={session.user.id} onBack={() => setView('profile')} />}
        {view === 'sessionDetail' && navDetail?.type === 'session' && (
          <SessionDetail
            sessionId={navDetail.sessionId}
            expandComments={navDetail.expandComments}
            currentUserId={session.user.id}
            onBack={() => { setView(prevView); setNavDetail(null) }}
          />
        )}
        {view === 'userProfile' && navDetail?.type === 'user' && (
          <UserProfile
            viewUserId={navDetail.userId}
            currentUserId={session.user.id}
            onBack={() => { setView(prevView); setNavDetail(null) }}
          />
        )}
      </main>

      <BottomNav
        view={view}
        setView={v => {
          // Intercept navigation away from log while timer is running
          if (activeTimer && view === 'log' && v !== 'log') {
            setAbandonConfirm(v)
            return
          }
          setView(v)
          setActivityOpen(false)
          setSettingsOpen(false)
          setNavDetail(null)
        }}
      />

      {settingsOpen && (
        <Settings
          userId={session.user.id}
          profile={profile}
          onProfileUpdate={setProfile}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Abandon session confirmation */}
      {abandonConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setAbandonConfirm(null)} />
          <div className="relative z-10 w-full max-w-sm bg-[#16161F] border border-white/[0.08] rounded-3xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Abandon session?</h3>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                Your timer is still running. This will discard your session.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setAbandonConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:border-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setActiveTimer(null)
                  setView(abandonConfirm)
                  setAbandonConfirm(null)
                  setActivityOpen(false)
                  setSettingsOpen(false)
                  setNavDetail(null)
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition"
              >
                Abandon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Timer banner component ─────────────────────────────────────────────────────

function TimerBanner({ startTime, onClick }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const secs = Math.max(0, Math.floor((Date.now() - startTime) / 1000))
  const m = Math.floor(secs / 60)
  const s = secs % 60
  const display = `${m}:${String(s).padStart(2, '0')}`

  return (
    <button
      onClick={onClick}
      className="sticky top-12 z-10 w-full bg-amber-500/10 border-b border-amber-500/20 hover:bg-amber-500/15 transition"
    >
      <div className="max-w-2xl mx-auto px-4 h-8 flex items-center gap-2 justify-center">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-amber-400 text-xs font-medium">Session in progress</span>
        <span className="text-amber-500 text-xs font-mono font-semibold">{display}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1 opacity-60">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </button>
  )
}
