import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Landing from './components/Landing'
import Auth from './components/Auth'
import UsernameSetup from './components/UsernameSetup'
import Nav from './components/Nav'
import BottomNav from './components/BottomNav'
import LogSessionFlow from './components/LogSessionFlow'
import Feed from './components/Feed'
import Discover from './components/Discover'
import Groups from './components/Groups'
import Profile from './components/Profile'

export default function App() {
  const [session, setSession] = useState(undefined)  // undefined = loading
  const [profile, setProfile] = useState(null)
  const [view, setView] = useState('feed')
  const [authMode, setAuthMode] = useState(null)     // null | 'signup' | 'signin'

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
      <Nav />
      <main className="max-w-2xl mx-auto px-4 pt-6 pb-36">
        {view === 'feed'     && <Feed      userId={session.user.id} />}
        {view === 'discover' && <Discover  userId={session.user.id} />}
        {view === 'log'      && <LogSessionFlow userId={session.user.id} />}
        {view === 'groups'   && <Groups    userId={session.user.id} profile={profile} />}
        {view === 'profile'  && <Profile   userId={session.user.id} />}
      </main>
      <BottomNav view={view} setView={setView} />
    </div>
  )
}
