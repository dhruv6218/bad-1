import { generateText } from 'ai'
import { createGateway } from '@ai-sdk/gateway'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const gateway = createGateway()

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const samples = typeof body?.sampleEmails === 'string' ? body.sampleEmails.trim() : ''
  const toneLevel = Number(body?.toneLevel)
  if (samples.length < 20 || samples.length > 12000 || !Number.isInteger(toneLevel) || toneLevel < 1 || toneLevel > 5) {
    return NextResponse.json({ error: 'Provide valid sample emails and tone level.' }, { status: 400 })
  }

  try {
    const { text } = await generateText({
      model: gateway('google/gemini-3-flash'),
      system: 'You write concise, professional invoice follow-up emails. Never invent personal details, payment links, dates, or amounts. Return only the email body.',
      prompt: `Analyze the following writing samples and draft one invoice reminder in the same voice. Tone level ${toneLevel}/5, where 1 is warm and gentle and 5 is firm and direct. Use placeholders [Client Name], [Invoice Number], [Amount], [Due Date], and [Payment Link].\n\nSamples:\n${samples}`,
      maxOutputTokens: 500,
    })
    return NextResponse.json({ preview: text.trim() })
  } catch (error) {
    console.error('[onboarding-tone-preview]', error)
    return NextResponse.json({ error: 'AI preview is temporarily unavailable.' }, { status: 503 })
  }
}
