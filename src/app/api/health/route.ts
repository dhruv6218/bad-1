import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clientKey, pruneRateLimitBuckets, rateLimit, requestId } from '@/lib/server/security'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const id = requestId()
  pruneRateLimitBuckets()
  const limit = rateLimit(clientKey(request, 'health'), 60, 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Too many requests', id: id }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })
  const startedAt = Date.now()

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('workspaces').select('id').limit(1)

    if (error) {
      console.error('[health]', { id, error: error.message })
      return NextResponse.json({ status: 'degraded', id }, { status: 503 })
    }

    return NextResponse.json({ status: 'ok', id, latencyMs: Date.now() - startedAt })
  } catch (error) {
    console.error('[health]', { id, error })
    return NextResponse.json({ status: 'degraded', id }, { status: 503 })
  }
}
