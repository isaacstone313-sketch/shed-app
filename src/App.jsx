import { useState, useEffect, useCallback } from 'react'
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

      <main className="max-w-2xl mx-auto px-4 pt-6 pb-36">
        {view === 'home'          && <Feed            userId={session.user.id} />}
        {view === 'discover'      && <Discover        userId={session.user.id} />}
        {view === 'log'           && <LogSessionFlow  userId={session.user.id} />}
        {view === 'groups'        && <Groups          userId={session.user.id} profile={profile} />}
        {view === 'profile'       && <Profile         userId={session.user.id} profile={profile} />}
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

      <BottomNav view={view} setView={v => { setView(v); setActivityOpen(false); setSettingsOpen(false); setNavDetail(null) }} />

      {settingsOpen && (
        <Settings
          userId={session.user.id}
          profile={profile}
          onProfileUpdate={setProfile}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
