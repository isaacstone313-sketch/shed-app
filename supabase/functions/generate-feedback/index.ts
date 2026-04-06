import Anthropic from 'npm:@anthropic-ai/sdk@0.39.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const { instrument, duration_minutes, notes, recent_sessions } = await req.json()

  if (!instrument || !duration_minutes || !notes) {
    return new Response('Missing required fields', { status: 400, headers: corsHeaders })
  }

  const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

  const history = (recent_sessions ?? [])
    .slice(0, 5)
    .map((s: { instrument: string; duration_minutes: number; notes: string }) =>
      `• ${s.instrument}, ${s.duration_minutes}min — ${s.notes}`
    )
    .join('\n')

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are an encouraging music practice coach giving feedback after a session.

Today's session:
Instrument: ${instrument}
Duration: ${duration_minutes} minutes
What was practiced: ${notes}

${history ? `Recent sessions (for context):\n${history}` : 'No previous sessions on record.'}

Respond with 2–3 sentences. Acknowledge what they worked on specifically, suggest one concrete thing to focus on next time, and keep the tone warm and direct. No greeting or sign-off.`,
      },
    ],
  })

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(new TextEncoder().encode(event.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
})
