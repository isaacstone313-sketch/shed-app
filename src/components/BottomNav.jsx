const TABS = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'discover',
    label: 'Discover',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: 'log',
    label: 'Log',
    primary: true,
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    ),
  },
  {
    id: 'groups',
    label: 'Groups',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function BottomNav({ view, setView }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-[#0D0D14]/95 backdrop-blur-sm border-t border-white/5">
      <div className="max-w-2xl mx-auto flex items-end justify-around px-2 pb-safe" style={{ minHeight: 64 }}>
        {TABS.map(tab => {
          const active = view === tab.id
          if (tab.primary) {
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                className="flex flex-col items-center gap-1 px-5 py-3 -mt-4"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
                  active
                    ? 'bg-amber-600 shadow-amber-900/60'
                    : 'bg-amber-500 shadow-amber-900/30'
                }`}>
                  <span className="text-white">{tab.icon}</span>
                </div>
                <span className={`text-[12px] font-medium ${active ? 'text-amber-500' : 'text-slate-600'}`}>
                  {tab.label}
                </span>
              </button>
            )
          }
          return (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className="relative flex flex-col items-center gap-1 px-4 py-3 transition-colors"
            >
              <span className={`transition-colors ${active ? 'text-amber-500' : 'text-slate-600'}`}>
                {tab.icon}
              </span>
              <span className={`text-[12px] font-medium ${active ? 'text-amber-500' : 'text-slate-600'}`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-amber-500 shadow-[0_0_6px_2px_rgba(245,158,11,0.5)]" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
