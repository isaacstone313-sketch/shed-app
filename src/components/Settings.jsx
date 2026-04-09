import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import imageCompression from 'browser-image-compression'
import { Avatar } from './SessionCard'
import { usePushNotifications } from '../hooks/usePushNotifications'

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
      <div className="card space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-400">{label}</label>
      {children}
    </div>
  )
}

export default function Settings({ userId, profile, onProfileUpdate, onClose }) {
  // Profile section
  const [username, setUsername]   = useState(profile?.username ?? '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [usernameMsg, setUsernameMsg] = useState('')
  const fileInputRef = useRef(null)

  // Account section
  const [newEmail, setNewEmail]       = useState('')
  const [emailMsg, setEmailMsg]       = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwMsg, setPwMsg]             = useState('')

  // Push notifications
  const push = usePushNotifications(userId)

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting]           = useState(false)

  // ── Avatar upload ────────────────────────────────────────────────────────────
  async function handleAvatarSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    setAvatarError('')
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
        useWebWorker: true,
      })
      const ext  = (file.name?.split('.').pop() || 'jpg').toLowerCase()
      const path = `${userId}/avatar.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, compressed, { contentType: compressed.type, upsert: true })
      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const urlWithBust = `${publicUrl}?v=${Date.now()}`

      const { error: updateErr } = await supabase
        .from('profiles').update({ avatar_url: urlWithBust }).eq('id', userId)
      if (updateErr) throw updateErr

      onProfileUpdate({ ...profile, avatar_url: urlWithBust })
    } catch (err) {
      setAvatarError(err.message ?? 'Upload failed')
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // ── Username save ────────────────────────────────────────────────────────────
  async function handleUsernameSave() {
    const trimmed = username.trim()
    if (!trimmed || trimmed === profile?.username) return
    setUsernameMsg('')
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('username', trimmed).neq('id', userId).maybeSingle()
    if (existing) { setUsernameMsg('Username is already taken.'); return }
    const { error } = await supabase.from('profiles').update({ username: trimmed }).eq('id', userId)
    if (error) { setUsernameMsg(error.message); return }
    onProfileUpdate({ ...profile, username: trimmed })
    setUsernameMsg('Saved!')
    setTimeout(() => setUsernameMsg(''), 2000)
  }

  // ── Email change ─────────────────────────────────────────────────────────────
  async function handleEmailChange() {
    if (!newEmail.trim()) return
    setEmailMsg('')
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    if (error) { setEmailMsg(error.message); return }
    setEmailMsg('Confirmation email sent. Check both inboxes.')
    setNewEmail('')
  }

  // ── Password change ──────────────────────────────────────────────────────────
  async function handlePasswordChange() {
    if (newPassword.length < 6) { setPwMsg('Password must be at least 6 characters.'); return }
    setPwMsg('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setPwMsg(error.message); return }
    setPwMsg('Password updated!')
    setNewPassword('')
    setTimeout(() => setPwMsg(''), 2000)
  }

  // ── Delete account ───────────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    setDeleting(true)
    await supabase.rpc('delete_account')
    await supabase.auth.signOut()
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0D0D14] overflow-y-auto animate-slide-in-panel">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0D0D14]/95 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1 -ml-1 text-slate-500 hover:text-slate-300 transition"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="font-semibold text-white">Settings</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24 space-y-7">

        {/* ── Profile ── */}
        <Section title="Profile">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar
                username={profile?.username}
                avatarUrl={profile?.avatar_url}
                size="lg"
              />
              {avatarUploading && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="btn-secondary text-sm py-2 px-4 disabled:opacity-50"
              >
                {avatarUploading ? 'Uploading…' : 'Change photo'}
              </button>
              <p className="text-[11px] text-slate-600 mt-2 leading-snug">
                Keep it appropriate — profile photos are visible to all users
              </p>
              {avatarError && <p className="text-xs text-red-400 mt-1">{avatarError}</p>}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>

          {/* Username */}
          <Field label="Username">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={username}
                onChange={e => setUsername(e.target.value)}
                maxLength={30}
                onKeyDown={e => e.key === 'Enter' && handleUsernameSave()}
              />
              <button
                onClick={handleUsernameSave}
                disabled={!username.trim() || username.trim() === profile?.username}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
              >
                Save
              </button>
            </div>
            {usernameMsg && (
              <p className={`text-xs mt-1 ${usernameMsg === 'Saved!' ? 'text-emerald-400' : 'text-red-400'}`}>
                {usernameMsg}
              </p>
            )}
          </Field>
        </Section>

        {/* ── Account ── */}
        <Section title="Account">
          <Field label="Change email">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                type="email"
                placeholder="New email address"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
              <button
                onClick={handleEmailChange}
                disabled={!newEmail.trim()}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
              >
                Update
              </button>
            </div>
            {emailMsg && <p className="text-xs text-slate-400 mt-1">{emailMsg}</p>}
          </Field>

          <Field label="Change password">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                type="password"
                placeholder="New password (min. 6 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <button
                onClick={handlePasswordChange}
                disabled={newPassword.length < 6}
                className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
              >
                Update
              </button>
            </div>
            {pwMsg && (
              <p className={`text-xs mt-1 ${pwMsg === 'Password updated!' ? 'text-emerald-400' : 'text-red-400'}`}>
                {pwMsg}
              </p>
            )}
          </Field>

          <div className="pt-1">
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-slate-500 hover:text-slate-300 transition font-medium"
            >
              Sign out
            </button>
          </div>
        </Section>

        {/* ── Notifications ── */}
        {push.isSupported && (
          <Section title="Notifications">
            <div className="flex items-center gap-4">
              {/* Bell icon */}
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200">Push notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">Kudos, comments, and follows</p>
              </div>
              {/* Toggle */}
              {push.permission === 'denied' ? null : (
                <button
                  onClick={push.isSubscribed ? push.unsubscribe : push.subscribe}
                  disabled={push.loading}
                  className={`relative shrink-0 w-12 h-6 rounded-full border transition-colors duration-200 disabled:opacity-50 ${
                    push.isSubscribed
                      ? 'bg-amber-500 border-amber-500'
                      : 'bg-transparent border-white/20'
                  }`}
                  aria-label="Toggle push notifications"
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    push.isSubscribed ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              )}
            </div>
            {push.permission === 'denied' && (
              <p className="text-xs text-slate-500 leading-relaxed">
                Notifications are blocked. To enable them, open your browser settings, find Shed under site permissions, and set Notifications to Allow.
              </p>
            )}
          </Section>
        )}

        {/* ── Danger zone ── */}
        <Section title="Danger zone">
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="text-sm text-red-400 hover:text-red-300 transition font-medium"
            >
              Delete account…
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-300 leading-relaxed">
                This permanently deletes your account, sessions, and all data. There's no undo.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/20 transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting…' : 'Yes, delete my account'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:border-white/20 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
