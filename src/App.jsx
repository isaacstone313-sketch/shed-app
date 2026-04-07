import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import UsernameSetup from './components/UsernameSetup'
import Nav from './components/Nav'
import LogSession from './components/LogSession'
import Feed from './components/Feed'
import Groups from './components/Groups'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [profile, setProfile] = useState(null)

  const [view, setView] = useState('log')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchProfile(session.user.id)
      else setProfile(null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
  }

  // Loading
  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-stone-400 text-sm">Loading…</span>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return <Auth />
  }

  // Authenticated but no username yet
  if (!profile) {
    return (
      <UsernameSetup
        userId={session.user.id}
        onComplete={setProfile}
      />
    )
  }

  return (
    <div className="min-h-screen">
      <Nav view={view} setView={setView} profile={profile} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {view === 'log' && <LogSession userId={session.user.id} />}
        {view === 'feed' && <Feed userId={session.user.id} />}
        {view === 'groups' && <Groups userId={session.user.id} profile={profile} />}
      </main>
    </div>
  )
}
