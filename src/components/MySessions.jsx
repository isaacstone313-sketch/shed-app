import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { instrumentAccent, formatTimestamp, formatDuration } from './SessionCard'

const MOOD_EMOJI = {
  grinding: '💪',
  solid:    '👊',
  flow:     '⚡',
  rough:    '😮‍💨',
}

function spotifyTrackId(url) {
  if (!url) return null
  const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/)
  return match ? match[1] : null
}

function Chevron({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function MySessionCard({ session }) {
  const [spotifyOpen, setSpotifyOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const accent  = instrumentAccent(session.instrument)
  const trackId = spotifyTrackId(session.spotify_url)

  return (
    <div className="relative bg-[#16161F] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition">
      {/* Instrument accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ background: accent }}
      />

      <div className="pl-5">
        {/* Meta row */}
        <div className="pr-4 pt-4 pb-3 flex items-center gap-2.5 flex-wrap">
          <span className="bg-white/5 text-slate-400 text-xs font-semibold px-3 py-1 rounded-full">
            {session.instrument}
          </span>
          <span className="text-slate-700 text-sm">·</span>
          <span className="text-sm font-medium text-slate-400">{formatDuration(session.duration_minutes)}</span>
          {session.mood && MOOD_EMOJI[session.mood] && (
            <>
              <span className="text-slate-700 text-sm">·</span>
              <span className="text-base leading-none" title={session.mood}>{MOOD_EMOJI[session.mood]}</span>
            </>
          )}
          <span className="ml-auto text-xs text-slate-600">{formatTimestamp(session.created_at)}</span>
        </div>

        {/* Notes */}
        {session.notes && (
          <div className="pr-4 pb-4">
            <p className="text-[15px] text-slate-300 leading-relaxed">{session.notes}</p>
          </div>
        )}

        {/* Photo */}
        {session.photo_url && (
          <div className="pr-4 pb-3">
            <img
              src={session.photo_url}
              alt=""
              className="w-full rounded-xl object-cover max-h-72 cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
          </div>
        )}

        {/* Spotify embed (collapsible) */}
        {trackId && (
          <div className="border-t border-white/5">
            <button
              onClick={() => setSpotifyOpen(o => !o)}
              className="w-full pr-4 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition"
            >
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#1DB954">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
                <span className="text-xs font-semibold text-[#1DB954]/80 uppercase tracking-wide">Now playing</span>
              </div>
              <Chevron open={spotifyOpen} />
            </button>
            {spotifyOpen && (
              <div className="pr-4 pb-3">
                <iframe
                  src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="80"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-lg"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Photo lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={session.photo_url}
            alt=""
            className="max-w-full max-h-full rounded-xl object-contain"
          />
        </div>
      )}
    </div>
  )
}

export default function MySessions({ userId, onBack }) {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase
      .from('sessions')
      .select('id, instrument, duration_minutes, created_at, notes, mood, photo_url, spotify_url, user_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSessions(data ?? [])
        setLoading(false)
      })
  }, [userId])

  return (
    <div className="space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back
      </button>

      <div>
        <h2 className="text-xl font-semibold text-white">My Sessions</h2>
        {!loading && sessions.length > 0 && (
          <p className="text-slate-500 text-sm mt-0.5">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#16161F] border border-white/[0.06] rounded-2xl p-4 animate-pulse">
              <div className="flex gap-2 mb-3">
                <div className="h-6 bg-white/10 rounded-full w-20" />
                <div className="h-6 bg-white/5 rounded w-14" />
              </div>
              <div className="h-3 bg-white/5 rounded w-full mb-2" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium text-sm">No sessions yet — get to the woodshed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <MySessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  )
}
