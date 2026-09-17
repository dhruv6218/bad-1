import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const requestId = crypto.randomUUID()
  const startedAt = Date.now()

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('workspaces').select('id').limit(1)

    if (error) {
      console.error('[health]', { requestId, error: error.message })
      return NextResponse.json({ status: 'degraded', requestId }, { status: 503 })
    }

    return NextResponse.json({ status: 'ok', requestId, latencyMs: Date.now() - startedAt })
  } catch (error) {
    console.error('[health]', { requestId, error })
    return NextResponse.json({ status: 'degraded', requestId }, { status: 503 })
  }
}
