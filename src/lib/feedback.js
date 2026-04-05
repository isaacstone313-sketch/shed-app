import Anthropic from '@anthropic-ai/sdk'

export async function getSessionFeedback(session, recentSessions, onChunk) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    onChunk('(Set VITE_ANTHROPIC_API_KEY in .env.local to enable AI coaching feedback.)')
    return
  }

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  const history = recentSessions
    .slice(0, 5)
    .map(s => `• ${s.instrument}, ${s.duration_minutes}min — ${s.notes}`)
    .join('\n')

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `You are an encouraging music practice coach giving feedback after a session.

Today's session:
Instrument: ${session.instrument}
Duration: ${session.duration_minutes} minutes
What was practiced: ${session.notes}

${history ? `Recent sessions (for context):\n${history}` : 'No previous sessions on record.'}

Respond with 2–3 sentences. Acknowledge what they worked on specifically, suggest one concrete thing to focus on next time, and keep the tone warm and direct. No greeting or sign-off.`,
      },
    ],
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text)
    }
  }
}
