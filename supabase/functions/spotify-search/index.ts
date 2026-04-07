import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Verify caller is an authenticated Supabase user
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const { query } = await req.json()

  if (!query?.trim()) {
    return new Response(JSON.stringify([]), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Get Spotify access token via Client Credentials flow
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
  const credentials = btoa(`${clientId}:${clientSecret}`)

  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!tokenRes.ok) {
    return new Response(JSON.stringify({ error: 'Spotify auth failed' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { access_token } = await tokenRes.json()

  // Search for tracks
  const searchRes = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query.trim())}&type=track&limit=5`,
    { headers: { 'Authorization': `Bearer ${access_token}` } }
  )

  if (!searchRes.ok) {
    return new Response(JSON.stringify({ error: 'Spotify search failed' }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const searchData = await searchRes.json()

  const tracks = (searchData.tracks?.items ?? []).map((track: any) => ({
    id: track.id,
    name: track.name,
    artist: track.artists.map((a: any) => a.name).join(', '),
    album: track.album.name,
    // Prefer the smallest image (index 2 = ~64px), fall back to largest
    artwork: track.album.images[2]?.url ?? track.album.images[0]?.url ?? null,
    duration_ms: track.duration_ms,
    url: `https://open.spotify.com/track/${track.id}`,
  }))

  return new Response(JSON.stringify(tracks), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
