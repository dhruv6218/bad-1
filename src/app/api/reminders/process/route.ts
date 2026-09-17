import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const configuredSecret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')

  if (!configuredSecret || authorization !== `Bearer ${configuredSecret}`) {
    return NextResponse.json({ error: 'Unauthorized', requestId }, { status: 401 })
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
      requestId,
      status: 'ready',
      provider: 'email-not-configured',
      eligibleCount: invoices?.length ?? 0,
      message: 'Reminder candidates identified. Connect an email provider before sending.',
    })
  } catch (error) {
    console.error('[reminders.process]', { requestId, error })
    return NextResponse.json({ error: 'Unable to process reminders', requestId }, { status: 500 })
  }
}
