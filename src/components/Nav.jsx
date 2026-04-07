import { supabase } from '../lib/supabase'

const TABS = [
  { id: 'log', label: 'Log' },
  { id: 'feed', label: 'Feed' },
  { id: 'groups', label: 'Groups' },
]

export default function Nav({ view, setView, profile }) {
  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-10">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-semibold tracking-tight">Shed</span>

        <nav className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                view === tab.id
                  ? 'bg-amber-500 text-white'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500 hidden sm:block">{profile?.username}</span>
          <button
            onClick={handleSignOut}
            className="text-xs text-stone-400 hover:text-stone-600 transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
