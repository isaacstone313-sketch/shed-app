import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify the caller is an authenticated Supabase user
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const anonClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await anonClient.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const { userId, title, body, url } = await req.json()
  if (!userId || !title || !body) {
    return new Response('Missing required fields', { status: 400, headers: corsHeaders })
  }

  // Look up sender's username to personalise the notification body
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Fetch the target user's push subscription(s)
  const { data: rows, error: subErr } = await serviceClient
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', userId)

  if (subErr || !rows?.length) {
    // No subscription — not an error, just nothing to send
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const vapidPublicKey  = Deno.env.get('VAPID_PUBLIC_KEY')!
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

  webpush.setVapidDetails(
    'mailto:hello@shed.app',
    vapidPublicKey,
    vapidPrivateKey
  )

  const payload = JSON.stringify({ title, body, url: url ?? '/' })

  const results = await Promise.allSettled(
    rows.map(row => webpush.sendNotification(row.subscription, payload))
  )

  // Remove subscriptions that have expired or are invalid (410 Gone)
  const expiredEndpoints: string[] = []
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'rejected' && (r.reason?.statusCode === 410 || r.reason?.statusCode === 404)) {
      expiredEndpoints.push(rows[i].subscription.endpoint)
    }
  }
  if (expiredEndpoints.length) {
    for (const endpoint of expiredEndpoints) {
      await serviceClient
        .from('push_subscriptions')
        .delete()
        .filter('subscription->>endpoint', 'eq', endpoint)
    }
  }

  const sent = results.filter(r => r.status === 'fulfilled').length
  return new Response(JSON.stringify({ sent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
