import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clientKey, pruneRateLimitBuckets, rateLimit, requestId } from '@/lib/server/security'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const id = requestId()
  pruneRateLimitBuckets()
  const limit = rateLimit(clientKey(request, 'reminders'), 10, 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Too many requests', id: id }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })
  const configuredSecret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')

  if (!configuredSecret || authorization !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ error: 'Unauthorized', id }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const today = new Date().toISOString().slice(0, 10)
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, workspace_id, client_name, client_email, amount, currency, due_date, reminder_count')
      .eq('status', 'pending')
      .lt('due_date', today)
      .is('last_chased_at', null)
      .limit(100)

    if (error) throw error

    return NextResponse.json({
      id,
      status: 'ready',
      provider: 'email-not-configured',
      eligibleCount: invoices?.length ?? 0,
      message: 'Reminder candidates identified. Connect an email provider before sending.',
    })
  } catch (error) {
    console.error('[reminders.process]', { id, error })
    return NextResponse.json({ error: 'Unable to process reminders', id }, { status: 500 })
  }
}
