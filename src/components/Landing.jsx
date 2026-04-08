import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { instrumentAccent, avatarColor } from './SessionCard'

// ── Geometric hero background ──────────────────────────────────────────────────

function HeroBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Concentric rings — top right */}
      {[640, 500, 380, 270, 170].map((size, i) => (
        <div
          key={i}
          className="absolute rounded-full border border-slate-600/25"
          style={{
            width: size,
            height: size,
            top: -size / 2.6,
            right: -size / 3.5,
          }}
        />
      ))}
      {/* Horizontal staff lines */}
      {[38, 44, 50, 56, 62].map(pct => (
        <div
          key={pct}
          className="absolute left-0 right-0 h-px bg-slate-700/30"
          style={{ top: `${pct}%` }}
        />
      ))}
      {/* Amber accent dots */}
      <div className="absolute w-2 h-2 rounded-full bg-amber-500/70" style={{ top: '22%', left: '58%' }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-500/50" style={{ top: '68%', left: '72%' }} />
      <div className="absolute w-1 h-1 rounded-full bg-amber-400/60" style={{ top: '35%', left: '82%' }} />
      <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-500/30" style={{ top: '78%', left: '40%' }} />
      <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-300/40" style={{ top: '15%', left: '35%' }} />
      {/* Vertical tick marks suggesting a metronome */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <div
          key={i}
          className="absolute w-px bg-slate-600/20"
          style={{ height: i % 3 === 0 ? 24 : 14, left: `${10 + i * 3.5}%`, bottom: '18%' }}
        />
      ))}
    </div>
  )
}

// ── Scrolling nav ──────────────────────────────────────────────────────────────

function LandingNav({ onSignUp, onSignIn }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-[#0D0D14]/95 backdrop-blur-sm border-b border-slate-800' : ''
    }`}>
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="font-semibold text-white tracking-tight">Shed</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onSignIn}
            className="text-slate-400 hover:text-white text-sm font-medium transition px-3 py-1.5"
          >
            Sign in
          </button>
          <button
            onClick={onSignUp}
            className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
          >
            Sign up
          </button>
        </div>
      </div>
    </nav>
  )
}

// ── Mock feed cards ────────────────────────────────────────────────────────────

const MOCK_SESSIONS = [
  {
    instrument: 'Guitar',
    username: 'jordanm',
    duration: '45 min',
    notes: 'Finally nailed the fingerpicking pattern in the Blackbird bridge. Took 20 minutes of slow practice but it clicked.',
    kudos: 6,
    time: 'Today at 4:12 PM',
  },
  {
    instrument: 'Piano',
    username: 'sarah_keys',
    duration: '1h',
    notes: 'Chopin nocturne op. 9 no. 2 — working on the ornaments in the right hand. Getting closer to tempo.',
    kudos: 11,
    time: 'Today at 2:30 PM',
  },
  {
    instrument: 'Vocals',
    username: 'marc_sings',
    duration: '30 min',
    notes: 'Morning warmup + worked on head voice transitions. The break around E4 is getting smoother.',
    kudos: 4,
    time: 'Yesterday at 9:05 AM',
  },
]

function MockCard({ session }) {
  const accent = instrumentAccent(session.instrument)
  const initials = session.username.slice(0, 2).toUpperCase()
  const color = avatarColor(session.username)

  return (
    <div className="relative bg-white border border-stone-200 rounded-2xl overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: accent }} />
      <div className="pl-4">
        <div className="pr-4 pt-3.5 pb-2.5 flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white ${color}`}>
            {initials}
          </div>
          <div>
            <div className="text-sm font-semibold text-stone-900">{session.username}</div>
            <div className="text-xs text-stone-400">{session.time}</div>
          </div>
        </div>
        <div className="pr-4 pb-2.5 flex items-center gap-2">
          <span className="bg-stone-100 text-stone-600 text-xs font-semibold px-2.5 py-1 rounded-full">
            {session.instrument}
          </span>
          <span className="text-stone-300 text-xs">·</span>
          <span className="text-sm font-medium text-stone-600">{session.duration}</span>
        </div>
        <div className="pr-4 pb-3.5">
          <p className="text-sm text-stone-600 leading-relaxed line-clamp-2">{session.notes}</p>
        </div>
        <div className="border-t border-stone-100 pr-4 py-2 flex items-center gap-1.5 text-stone-400">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          <span className="text-xs font-semibold">{session.kudos}</span>
        </div>
      </div>
    </div>
  )
}

// ── Live stats ─────────────────────────────────────────────────────────────────

function usePublicStats() {
  const [stats, setStats] = useState(null)
  useEffect(() => {
    supabase.rpc('get_public_stats').then(({ data }) => {
      if (data) setStats(data)
    })
  }, [])
  return stats
}

function formatBigNumber(n) {
  if (!n) return null
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

function formatMinutes(m) {
  if (!m) return null
  const hours = Math.round(m / 60)
  return formatBigNumber(hours)
}

// ── Section components ─────────────────────────────────────────────────────────

function HowItWorksStep({ num, icon, title, description }) {
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-100 mb-4">
        {icon}
      </div>
      <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Step {num}</div>
      <h3 className="text-lg font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-500 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function Landing({ onSignUp, onSignIn }) {
  const stats = usePublicStats()
  const hasStats = stats && stats.sessions > 0

  return (
    <div className="bg-white overflow-x-hidden">
      <LandingNav onSignUp={onSignUp} onSignIn={onSignIn} />

      {/* ── Hero ── */}
      <section className="relative min-h-screen bg-[#0D0D14] flex items-center">
        <HeroBg />
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Practice · Progress · Community
            </div>
            <h1 className="text-[clamp(3rem,8vw,6rem)] font-bold text-white leading-[0.95] tracking-tight">
              Hit the<br />
              <span className="text-amber-500">woodshed.</span>
            </h1>
            <p className="text-lg text-slate-400 mt-8 leading-relaxed max-w-lg">
              Build a practice habit that compounds. Log your sessions, track your streaks, get AI coaching, and keep pace with your musical crew.
            </p>
            <div className="flex flex-wrap gap-3 mt-10">
              <button
                onClick={onSignUp}
                className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition"
              >
                Start shedding →
              </button>
              <a
                href="#how"
                className="border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition"
              >
                See how it works
              </a>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-slate-600" />
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-14">
            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">How it works</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
              Three steps to a<br />stronger practice habit.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-10">
            <HowItWorksStep
              num="01"
              title="Log your practice"
              description="Pick your instrument, note how long you played, and describe what you worked on. Takes 20 seconds."
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              }
            />
            <HowItWorksStep
              num="02"
              title="See your progress"
              description="Watch your streak grow, your total hours stack up, and get personalized AI coaching after each session."
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              }
            />
            <HowItWorksStep
              num="03"
              title="Compete with your crew"
              description="Create a group, share the invite code, and race your friends on the leaderboard — minutes, streaks, and sessions."
              icon={
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#78716c" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 px-6 bg-amber-500">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-10 text-center">
            <div>
              <div className="text-5xl sm:text-6xl font-bold text-white leading-none">
                {hasStats ? formatMinutes(stats.minutes) : '∞'}
              </div>
              <div className="text-amber-200 font-medium mt-2 text-sm uppercase tracking-wide">
                {hasStats ? 'Hours practiced' : 'Hours ahead of you'}
              </div>
            </div>
            <div>
              <div className="text-5xl sm:text-6xl font-bold text-white leading-none">
                {hasStats ? formatBigNumber(stats.sessions) : '0'}
              </div>
              <div className="text-amber-200 font-medium mt-2 text-sm uppercase tracking-wide">Sessions logged</div>
            </div>
            <div>
              <div className="text-5xl sm:text-6xl font-bold text-white leading-none">
                {hasStats ? formatBigNumber(stats.musicians) : 'You'}
              </div>
              <div className="text-amber-200 font-medium mt-2 text-sm uppercase tracking-wide">
                {hasStats ? 'Musicians growing' : 'Could be first'}
              </div>
            </div>
          </div>
          {!hasStats && (
            <p className="text-center text-amber-200/70 text-xs mt-8">
              Be among the first to log a session.
            </p>
          )}
        </div>
      </section>

      {/* ── Feed preview ── */}
      <section className="py-24 px-6 bg-stone-50">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-xl mb-14">
            <div className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3">The feed</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 leading-tight">
              Practice becomes visible.<br />Progress becomes social.
            </h2>
            <p className="text-stone-500 mt-4 leading-relaxed">
              Every session is a signal. Your crew sees when you're putting in the work — and they can give you kudos for it.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 max-w-4xl">
            {MOCK_SESSIONS.map((s, i) => (
              <MockCard key={i} session={s} />
            ))}
          </div>

          <div className="mt-10">
            <button
              onClick={onSignUp}
              className="bg-stone-900 hover:bg-stone-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition"
            >
              Join the feed →
            </button>
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="py-28 px-6 bg-[#0D0D14]">
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="text-4xl font-bold mb-1 leading-[1.1]"
            style={{ color: '#f59e0b' }}
          >
            "
          </div>
          <p className="text-xl sm:text-2xl text-slate-200 leading-relaxed font-light">
            Shed comes from the musician's tradition of <em className="text-white not-italic font-medium">hitting the woodshed</em> — disappearing to put in the hours, to chip away at your craft until it clicks.
          </p>
          <p className="text-slate-500 mt-8 leading-relaxed max-w-lg mx-auto text-sm">
            We built Shed to make that private discipline visible, social, and motivating. Whether you practice alone or with a crew, consistency compounds. Every session counts.
          </p>
          <button
            onClick={onSignUp}
            className="mt-10 bg-amber-500 hover:bg-amber-400 text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition inline-block"
          >
            Start shedding
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 bg-[#0D0D14] border-t border-slate-800/60">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="font-semibold text-white">Shed</div>
            <div className="text-slate-600 text-xs mt-1">Foster growth through consistency.</div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <button onClick={onSignUp} className="text-slate-400 hover:text-white transition font-medium">
              Sign up
            </button>
            <button onClick={onSignIn} className="text-slate-400 hover:text-white transition font-medium">
              Log in
            </button>
            <a href="/privacy" className="text-slate-600 hover:text-slate-400 transition">
              Privacy
            </a>
            <a href="/terms" className="text-slate-600 hover:text-slate-400 transition">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
