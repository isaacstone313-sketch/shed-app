import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// VAPID public key — must match VAPID_PUBLIC_KEY secret in Supabase
const VAPID_PUBLIC_KEY = 'BK28U5qGSzSl-e-BqaI6N6ekj8gFApj5zVTRrACv9cFwle6w50FBM3pmQVeKWdHJvnx8XTEnU4mC0rZ27xA1ZXo'

function urlBase64ToUint8Array(b64) {
  const padding = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64  = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

export function usePushNotifications(userId) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isSupported,  setIsSupported]  = useState(false)
  const [permission,   setPermission]   = useState('default')
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)
    if (!supported) { setLoading(false); return }

    setPermission(Notification.permission)

    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => {
        setIsSubscribed(!!sub)
        setLoading(false)
      })
    )
  }, [])

  async function subscribe() {
    if (!isSupported) return
    const reg  = await navigator.serviceWorker.ready
    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm !== 'granted') return

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })

    const { error } = await supabase.from('push_subscriptions').insert({
      user_id:      userId,
      subscription: sub.toJSON(),
    })
    if (!error) setIsSubscribed(true)
  }

  async function unsubscribe() {
    if (!isSupported) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await sub.unsubscribe()
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
    }
    setIsSubscribed(false)
  }

  return { isSubscribed, isSupported, permission, loading, subscribe, unsubscribe }
}
