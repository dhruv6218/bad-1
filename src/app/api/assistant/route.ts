import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clientKey, pruneRateLimitBuckets, rateLimit, requestId } from '@/lib/server/security'

export async function POST(request: Request) {
  const id = requestId()
  pruneRateLimitBuckets()
  const limit = rateLimit(clientKey(request, 'assistant'), 20, 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Too many requests. Try again shortly.', requestId: id }, { status: 429 })
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required.', requestId: id }, { status: 401 })
  const body = await request.json().catch(() => null) as { question?: string; workspaceId?: string; context?: string } | null
  const question = body?.question?.trim()
  if (!question || question.length > 2000 || !body?.workspaceId) return NextResponse.json({ error: 'A valid question and workspace are required.', requestId: id }, { status: 400 })
  const { data: membership } = await supabase.from('workspace_members').select('workspace_id').eq('workspace_id', body.workspaceId).eq('user_id', user.id).maybeSingle()
  if (!membership) return NextResponse.json({ error: 'You do not have access to this workspace.', requestId: id }, { status: 403 })
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  if (!apiKey) return NextResponse.json({ error: 'AI assistant is not configured yet.', requestId: id }, { status: 503 })
  const prompt = `You are Astrix Assistant. Answer only from the supplied workspace context. If the context does not contain the answer, say so. Never invent records, totals, permissions, or actions. Keep the answer concise and useful.\n\nWorkspace context:\n${(body.context || '').slice(0, 12000)}\n\nUser question: ${question}`
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 700 } }) })
  if (!response.ok) return NextResponse.json({ error: 'AI assistant is temporarily unavailable.', requestId: id }, { status: 502 })
  const result = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const answer = result.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim()
  if (!answer) return NextResponse.json({ error: 'AI assistant returned no answer.', requestId: id }, { status: 502 })
  return NextResponse.json({ answer, requestId: id })
}
