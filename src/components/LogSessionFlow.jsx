import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import imageCompression from 'browser-image-compression'
import { checkBadges } from '../utils/badges'
import { useBadgeToast } from '../context/BadgeContext'

const INSTRUMENTS = [
  'Guitar', 'Bass', 'Piano', 'Drums', 'Violin', 'Cello',
  'Vocals', 'Saxophone', 'Trumpet', 'Flute', 'Other',
]

const MOODS = [
  { id: 'grinding', label: 'Grinding',    emoji: '💪', desc: 'Head down, putting in reps'    },
  { id: 'solid',    label: 'Solid',       emoji: '👊', desc: 'Good session, felt focused'    },
  { id: 'flow',     label: 'Flow state',  emoji: '⚡', desc: 'Everything clicked today'      },
  { id: 'rough',    label: 'Rough day',   emoji: '😮‍💨', desc: 'Struggled but showed up'      },
]

const MOOD_LABELS = {
  grinding: '💪 Grinding',
  solid:    '👊 Solid',
  flow:     '⚡ Flow state',
  rough:    '😮‍💨 Rough day',
}

const TOTAL_STEPS = 6

function parseSpotifyUrl(url) {
  const match = url.trim().match(/spotify\.com\/track\/([a-zA-Z0-9]+)/)
  return match ? `https://open.spotify.com/track/${match[1]}` : null
}

// ── Elapsed time display (live, 1s interval) ──────────────────────────────────

function ElapsedDisplay({ startTime, large }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const secs = Math.max(0, Math.floor((Date.now() - startTime) / 1000))
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  const display = h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`

  if (large) {
    return (
      <div className="text-7xl font-bold text-amber-400 tabular-nums tracking-tight leading-none">
        {display}
      </div>
    )
  }
  return <span className="font-mono font-semibold text-amber-500">{display}</span>
}

// ── Mode selection screen ─────────────────────────────────────────────────────

function ModeSelect({ onManual, onTimer }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Ready to practice?</h2>
        <p className="text-slate-500 text-sm mt-1">How do you want to log today's session?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Manual */}
        <button
          onClick={onManual}
          className="flex flex-col items-start gap-3 p-5 rounded-2xl border border-white/[0.08] bg-[#16161F] hover:border-white/20 text-left transition active:scale-[0.97]"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-0.5">Log Session</div>
            <div className="text-xs text-slate-500 leading-snug">Enter duration manually after you're done</div>
          </div>
        </button>

        {/* Timer */}
        <button
          onClick={onTimer}
          className="flex flex-col items-start gap-3 p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50 hover:bg-amber-500/10 text-left transition active:scale-[0.97]"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white mb-0.5">Start Timer</div>
            <div className="text-xs text-slate-500 leading-snug">Timer runs live while you practice</div>
          </div>
        </button>
      </div>
    </div>
  )
}

// ── Abandon confirmation modal ────────────────────────────────────────────────

function AbandonModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm bg-[#16161F] border border-white/[0.08] rounded-3xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Abandon session?</h3>
          <p className="text-slate-400 text-sm mt-1 leading-relaxed">
            Your timer will stop and the session won't be saved.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:border-white/20 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition"
          >
            Abandon
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Timer screen ──────────────────────────────────────────────────────────────

function TimerScreen({ startTime, instrument, customInstrument, setCustomInstrument, onInstrument, notes, setNotes, onFinish, onAbandonRequest }) {
  const resolvedInstrument = instrument === 'Other' ? customInstrument.trim() : instrument

  return (
    <div className="flex flex-col gap-6">
      {/* Timer display */}
      <div className="text-center py-6">
        <ElapsedDisplay startTime={startTime} large />
        <div className="text-slate-600 text-[11px] mt-3 uppercase tracking-widest font-medium">
          session in progress
        </div>
      </div>

      {/* Instrument */}
      <div className="space-y-2.5">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          What are you playing?
        </p>
        <div className="flex flex-wrap gap-2">
          {INSTRUMENTS.map(inst => (
            <button
              key={inst}
              onClick={() => onInstrument(inst)}
              className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition active:scale-95 ${
                instrument === inst
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-white/10 text-slate-300 hover:border-white/20'
              }`}
            >
              {inst}
            </button>
          ))}
        </div>
        {instrument === 'Other' && (
          <input
            className="input mt-1"
            placeholder="What instrument?"
            value={customInstrument}
            onChange={e => setCustomInstrument(e.target.value)}
            autoFocus
          />
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          What are you working on?
        </p>
        <textarea
          className="input resize-none"
          rows={4}
          placeholder="Scales, repertoire, technique…"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="space-y-2 pb-2">
        <button
          onClick={onFinish}
          disabled={!resolvedInstrument}
          className="btn-primary w-full py-4 text-base font-semibold disabled:opacity-40"
        >
          Finish Session
        </button>
        <button
          onClick={onAbandonRequest}
          className="w-full text-sm text-slate-600 hover:text-red-400 transition py-2"
        >
          Abandon session
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LogSessionFlow({ userId, activeTimer, onTimerStart, onTimerStop }) {
  const showBadgeToast = useBadgeToast()
  const [step, setStep]               = useState(0)
  const [direction, setDirection]     = useState('forward')

  // Mode state
  const [mode, setMode]               = useState(null)         // null | 'manual' | 'timer'
  const [timerStartTime, setTimerStartTime] = useState(null)
  const [timerDone, setTimerDone]     = useState(false)
  const [abandonOpen, setAbandonOpen] = useState(false)

  // Form data
  const [instrument, setInstrument]           = useState('')
  const [customInstrument, setCustomInstrument] = useState('')
  const [duration, setDuration]               = useState(30)
  const [notes, setNotes]                     = useState('')
  const [spotifyUrl, setSpotifyUrl]           = useState('')
  const [showSpotify, setShowSpotify]         = useState(false)
  const [mood, setMood]                       = useState('')
  const [photoFile, setPhotoFile]             = useState(null)
  const [photoPreview, setPhotoPreview]       = useState(null)

  // UI state
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [avgDuration, setAvgDuration] = useState(null)

  const fileInputRef  = useRef(null)
  const notesRef      = useRef(null)
  const previewUrlRef = useRef(null)

  const resolvedInstrument = instrument === 'Other' ? customInstrument.trim() : instrument

  // Restore timer if user navigated away and back
  useEffect(() => {
    if (activeTimer) {
      setMode('timer')
      setTimerStartTime(activeTimer.startTime)
    }
  }, []) // intentionally run only on mount

  // Load average session duration hint (for manual mode)
  useEffect(() => {
    supabase.from('sessions').select('duration_minutes').eq('user_id', userId)
      .then(({ data }) => {
        if (data?.length >= 3) {
          const raw = data.reduce((s, r) => s + r.duration_minutes, 0) / data.length
          setAvgDuration(Math.round(raw / 5) * 5)
        }
      })
  }, [userId])

  // Auto-focus notes textarea on step 2
  useEffect(() => {
    if (step === 2) {
      const t = setTimeout(() => notesRef.current?.focus(), 240)
      return () => clearTimeout(t)
    }
  }, [step])

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  // ── Navigation helpers ──

  function goNext() {
    setDirection('forward')
    setStep(s => s + 1)
  }

  function goBack() {
    setDirection('back')
    setStep(s => s - 1)
  }

  function selectInstrument(inst) {
    setInstrument(inst)
    if (inst !== 'Other') setTimeout(goNext, 160)
  }

  function selectMood(m) {
    setMood(m)
    setTimeout(goNext, 160)
  }

  // ── Timer controls ──

  function startTimer() {
    const startTime = Date.now()
    setTimerStartTime(startTime)
    setMode('timer')
    onTimerStart?.({ startTime })
  }

  function handleTimerFinish() {
    const elapsedMs   = Date.now() - timerStartTime
    const elapsedMins = Math.max(1, Math.round(elapsedMs / 60000))
    setDuration(elapsedMins)
    setTimerDone(true)
    setStep(2)           // land on Notes/Spotify so Spotify is still accessible
    setDirection('forward')
    onTimerStop?.()      // clear App.jsx banner immediately
  }

  function handleAbandon() {
    onTimerStop?.()
    setMode(null)
    setTimerStartTime(null)
    setTimerDone(false)
    setAbandonOpen(false)
    setInstrument('')
    setCustomInstrument('')
    setNotes('')
  }

  // ── Photo ──

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
      })
      const url = URL.createObjectURL(compressed)
      previewUrlRef.current = url
      setPhotoFile(compressed)
      setPhotoPreview(url)
    } catch {
      const url = URL.createObjectURL(file)
      previewUrlRef.current = url
      setPhotoFile(file)
      setPhotoPreview(url)
    }
  }

  // ── Reset ──

  function resetForm() {
    setStep(0); setDirection('forward')
    setMode(null); setTimerStartTime(null); setTimerDone(false); setAbandonOpen(false)
    setInstrument(''); setCustomInstrument('')
    setDuration(30); setNotes(''); setSpotifyUrl(''); setShowSpotify(false)
    setMood(''); setPhotoFile(null); setPhotoPreview(null)
    setError(''); setSuccess(false)
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null }
  }

  // ── Submit ──

  async function handleSubmit() {
    if (!resolvedInstrument) return setError('Please select an instrument.')
    const cleanSpotify = spotifyUrl.trim()
    if (cleanSpotify && !parseSpotifyUrl(cleanSpotify)) {
      return setError('Invalid Spotify track URL.')
    }
    setError('')
    setLoading(true)

    let uploadedPhotoUrl = null
    if (photoFile) {
      const ext  = (photoFile.name?.split('.').pop() || 'jpg').toLowerCase()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('session-photos')
        .upload(path, photoFile, { contentType: photoFile.type })
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage
          .from('session-photos').getPublicUrl(path)
        uploadedPhotoUrl = publicUrl
      }
    }

    const { error: insertError } = await supabase.from('sessions').insert({
      user_id:          userId,
      instrument:       resolvedInstrument,
      duration_minutes: duration,
      notes:            notes.trim(),
      spotify_url:      cleanSpotify ? parseSpotifyUrl(cleanSpotify) : null,
      mood:             mood || null,
      photo_url:        uploadedPhotoUrl,
    })

    setLoading(false)
    if (insertError) { setError(insertError.message); return }
    setSuccess(true)
    // Check for newly earned badges (fire-and-forget, non-blocking)
    checkBadges(userId).then(earned => {
      earned.forEach(badge => showBadgeToast(badge))
    })
  }

  // ── Success screen ──

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="text-5xl mb-5">🎸</div>
        <h2 className="text-2xl font-bold text-white mb-2">Session logged!</h2>
        <p className="text-slate-500 text-sm mb-10">Another day in the woodshed.</p>
        <button onClick={resetForm} className="btn-primary px-10 py-3">
          Log another
        </button>
      </div>
    )
  }

  // ── Mode selection ──

  if (mode === null) {
    return <ModeSelect onManual={() => setMode('manual')} onTimer={startTimer} />
  }

  // ── Active timer screen ──

  if (mode === 'timer' && !timerDone) {
    return (
      <>
        <TimerScreen
          startTime={timerStartTime}
          instrument={instrument}
          customInstrument={customInstrument}
          setCustomInstrument={setCustomInstrument}
          onInstrument={setInstrument}
          notes={notes}
          setNotes={setNotes}
          onFinish={handleTimerFinish}
          onAbandonRequest={() => setAbandonOpen(true)}
        />
        {abandonOpen && (
          <AbandonModal
            onCancel={() => setAbandonOpen(false)}
            onConfirm={handleAbandon}
          />
        )}
      </>
    )
  }

  // ── Step flow (manual mode OR post-timer) ──

  // In timerDone mode: steps 2-5. Progress = (step-2)/3.
  // In manual mode:    steps 0-5. Progress = step/5.
  const progressPct = timerDone
    ? ((step - 2) / 3) * 100
    : (step / (TOTAL_STEPS - 1)) * 100

  // Back: in timerDone mode, don't allow back past step 2 (notes = first post-timer step)
  const showBack = timerDone ? step > 2 : step > 0

  return (
    <div>
      {/* Progress bar */}
      <div className="h-0.5 bg-white/5 rounded-full mb-7">
        <div
          className="h-full bg-amber-500 rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Back button */}
      <div className="min-h-[28px] mb-5">
        {showBack && (
          <button
            onClick={goBack}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        )}
        {/* Timer-done breadcrumb on first post-timer step */}
        {timerDone && step === 2 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {duration} min timed
          </div>
        )}
      </div>

      {/* Animated step container */}
      <div key={step} className={direction === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'}>
        {step === 0 && (
          <StepInstrument
            instrument={instrument}
            customInstrument={customInstrument}
            setCustomInstrument={setCustomInstrument}
            onSelect={selectInstrument}
            onNext={goNext}
          />
        )}
        {step === 1 && (
          <StepDuration
            duration={duration}
            setDuration={setDuration}
            avgDuration={avgDuration}
            onNext={goNext}
          />
        )}
        {step === 2 && (
          <StepNotes
            notes={notes}
            setNotes={setNotes}
            spotifyUrl={spotifyUrl}
            setSpotifyUrl={setSpotifyUrl}
            showSpotify={showSpotify}
            setShowSpotify={setShowSpotify}
            notesRef={notesRef}
            onNext={goNext}
          />
        )}
        {step === 3 && (
          <StepMood mood={mood} onSelect={selectMood} onNext={goNext} />
        )}
        {step === 4 && (
          <StepPhoto
            photoPreview={photoPreview}
            fileInputRef={fileInputRef}
            onSelect={handlePhotoSelect}
            onNext={goNext}
          />
        )}
        {step === 5 && (
          <StepConfirm
            instrument={resolvedInstrument}
            duration={duration}
            notes={notes}
            mood={mood}
            photoPreview={photoPreview}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            timerDone={timerDone}
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />
    </div>
  )
}

// ── Step 1: Instrument ────────────────────────────────────────────────────────

function StepInstrument({ instrument, customInstrument, setCustomInstrument, onSelect, onNext }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">What are you playing?</h2>
        <p className="text-slate-500 text-sm mt-1">Select your instrument</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {INSTRUMENTS.map(inst => (
          <button
            key={inst}
            onClick={() => onSelect(inst)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition active:scale-95 ${
              instrument === inst
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'border-white/10 text-slate-300 hover:border-white/20'
            }`}
          >
            {inst}
          </button>
        ))}
      </div>
      {instrument === 'Other' && (
        <div className="space-y-3 pt-1">
          <input
            className="input"
            placeholder="What instrument?"
            value={customInstrument}
            onChange={e => setCustomInstrument(e.target.value)}
            autoFocus
          />
          <button
            className="btn-primary w-full"
            onClick={onNext}
            disabled={!customInstrument.trim()}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step 2: Duration ──────────────────────────────────────────────────────────

function StepDuration({ duration, setDuration, avgDuration, onNext }) {
  function adjust(delta) {
    setDuration(d => Math.min(720, Math.max(5, d + delta)))
  }
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white">How long did you practice?</h2>
        {avgDuration && (
          <p className="text-slate-600 text-sm mt-1.5">Your average session is {avgDuration} min</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-8 py-10">
        <button
          onClick={() => adjust(-5)}
          disabled={duration <= 5}
          className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center text-slate-400 hover:border-white/20 hover:text-white active:bg-white/5 transition disabled:opacity-25 text-3xl font-light"
        >
          −
        </button>
        <div className="text-center min-w-[140px]">
          <div className="text-7xl font-bold text-white tabular-nums leading-none">{duration}</div>
          <div className="text-slate-500 text-sm mt-2.5 uppercase tracking-wide">minutes</div>
        </div>
        <button
          onClick={() => adjust(5)}
          disabled={duration >= 720}
          className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center text-slate-400 hover:border-white/20 hover:text-white active:bg-white/5 transition disabled:opacity-25 text-3xl font-light"
        >
          +
        </button>
      </div>

      <button className="btn-primary w-full py-3" onClick={onNext}>
        Continue
      </button>
    </div>
  )
}

// ── Step 3: Notes + Spotify ───────────────────────────────────────────────────

function StepNotes({ notes, setNotes, spotifyUrl, setSpotifyUrl, showSpotify, setShowSpotify, notesRef, onNext }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white">What did you work on?</h2>
        <p className="text-slate-500 text-sm mt-1">Scales, repertoire, technique…</p>
      </div>

      <textarea
        ref={notesRef}
        className="input resize-none"
        rows={6}
        placeholder="Describe what you practiced…"
        value={notes}
        onChange={e => setNotes(e.target.value)}
      />

      {/* Spotify (collapsed by default) */}
      <div>
        <button
          type="button"
          onClick={() => setShowSpotify(s => !s)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition py-1"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="text-[#1DB954]/60 shrink-0">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          {showSpotify ? 'Hide Spotify link' : 'Add what you were listening to'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${showSpotify ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {showSpotify && (
          <div className="relative mt-2">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1DB954]/50 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <input
              className="input pl-9"
              type="url"
              placeholder="https://open.spotify.com/track/…"
              value={spotifyUrl}
              onChange={e => setSpotifyUrl(e.target.value)}
            />
          </div>
        )}
      </div>

      <button
        className="btn-primary w-full py-3"
        onClick={onNext}
        disabled={!notes.trim()}
      >
        Continue
      </button>
    </div>
  )
}

// ── Step 4: Mood ──────────────────────────────────────────────────────────────

function StepMood({ mood, onSelect, onNext }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">How did it feel?</h2>
        <p className="text-slate-500 text-sm mt-1">Be honest</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {MOODS.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            className={`flex flex-col items-start gap-2.5 p-4 rounded-2xl border text-left transition active:scale-95 ${
              mood === m.id
                ? 'bg-amber-500/10 border-amber-500/40'
                : 'border-white/[0.06] bg-[#16161F] hover:border-white/10'
            }`}
          >
            <span className="text-3xl leading-none">{m.emoji}</span>
            <div>
              <div className="text-sm font-semibold text-white">{m.label}</div>
              <div className="text-xs text-slate-500 mt-0.5 leading-snug">{m.desc}</div>
            </div>
          </button>
        ))}
      </div>
      <button onClick={onNext} className="btn-secondary w-full text-sm">
        Skip
      </button>
    </div>
  )
}

// ── Step 5: Photo ─────────────────────────────────────────────────────────────

function StepPhoto({ photoPreview, fileInputRef, onSelect, onNext }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Add a photo</h2>
        <p className="text-slate-500 text-sm mt-1">Optional — show off your setup or sheet music</p>
      </div>

      {photoPreview ? (
        <div className="space-y-3">
          <img
            src={photoPreview}
            alt="Preview"
            className="w-full rounded-2xl object-cover max-h-64"
          />
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex-1"
            >
              Change
            </button>
            <button onClick={onNext} className="btn-primary flex-1">
              Continue
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-white/10 rounded-2xl py-14 flex flex-col items-center gap-3 text-slate-500 hover:border-white/20 hover:text-slate-400 transition"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-sm font-medium">Tap to add a photo</span>
            <span className="text-xs text-slate-600">Compressed automatically</span>
          </button>
          <button onClick={onNext} className="btn-secondary w-full">
            Skip
          </button>
        </div>
      )}
    </div>
  )
}

// ── Step 6: Confirm ───────────────────────────────────────────────────────────

function StepConfirm({ instrument, duration, notes, mood, photoPreview, loading, error, onSubmit, timerDone }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">Ready to log?</h2>
        <p className="text-slate-500 text-sm mt-1">Here's your session</p>
      </div>

      <div className="card space-y-0 divide-y divide-white/5">
        <div className="flex items-center justify-between py-3.5">
          <span className="text-slate-500 text-sm">Instrument</span>
          <span className="text-white font-medium text-sm">{instrument}</span>
        </div>
        <div className="flex items-center justify-between py-3.5">
          <span className="text-slate-500 text-sm">Duration</span>
          <span className="text-white font-medium text-sm flex items-center gap-1.5">
            {duration} min
            {timerDone && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" title="Timed session">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            )}
          </span>
        </div>
        {mood && (
          <div className="flex items-center justify-between py-3.5">
            <span className="text-slate-500 text-sm">Mood</span>
            <span className="text-white font-medium text-sm">{MOOD_LABELS[mood]}</span>
          </div>
        )}
        {notes && (
          <div className="py-3.5">
            <span className="text-slate-500 text-sm block mb-1.5">Notes</span>
            <p className="text-slate-300 text-sm leading-relaxed line-clamp-3">{notes}</p>
          </div>
        )}
        {photoPreview && (
          <div className="pt-3.5 pb-0">
            <img src={photoPreview} alt="" className="w-full rounded-xl object-cover max-h-48" />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        className="btn-primary w-full py-4 text-base font-semibold"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? 'Logging…' : 'Log it →'}
      </button>

      <p className="text-center text-slate-600 text-xs pb-2">Another day in the woodshed.</p>
    </div>
  )
}
