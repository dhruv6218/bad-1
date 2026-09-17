import { NextRequest, NextResponse } from 'next/server'
import { clientKey, pruneRateLimitBuckets, rateLimit, requestId, verifyHmacSha256 } from '@/lib/server/security'
import { createAdminClient } from '@/lib/supabase/admin'
import { createHash } from 'node:crypto'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const id = requestId()
  pruneRateLimitBuckets()
  const limit = rateLimit(clientKey(request, 'dodo-webhook'), 120, 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Too many requests', requestId: id }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })

  const secret = process.env.DODO_WEBHOOK_SECRET
  const signature = request.headers.get('webhook-signature') || request.headers.get('webhook-signature-v1')
  if (!secret || !signature) return NextResponse.json({ error: 'Webhook is not configured', requestId: id }, { status: 503 })

  const body = await request.text()
  const timestamp = request.headers.get('webhook-timestamp')
  if (!timestamp || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return NextResponse.json({ error: 'Invalid webhook signature', requestId: id }, { status: 400 })
  const valid = await verifyHmacSha256(secret, `${timestamp}.${body}`, signature.replace(/^v1,/, ''))
  if (!valid) return NextResponse.json({ error: 'Invalid webhook signature', requestId: id }, { status: 400 })

  let payload: Record<string, any>
  try { payload = JSON.parse(body) } catch { return NextResponse.json({ error: 'Invalid webhook payload', requestId: id }, { status: 400 }) }

  const eventId = String(payload.event_id ?? payload.id ?? request.headers.get('webhook-id') ?? createHash('sha256').update(body).digest('hex'))
  const eventType = String(payload.type ?? payload.event_type ?? 'unknown')
  const admin = createAdminClient()
  const hash = createHash('sha256').update(body).digest('hex')
  const { data: event, error: eventError } = await admin.from('webhook_events').upsert({ provider: 'dodo', event_id: eventId, event_type: eventType, payload_hash: hash }, { onConflict: 'provider,event_id', ignoreDuplicates: true }).select('id,processed_at').maybeSingle()
  if (eventError) return NextResponse.json({ error: 'Webhook persistence failed', requestId: id }, { status: 500 })
  if (!event || event.processed_at) return NextResponse.json({ received: true, duplicate: true, requestId: id })

  const data = payload.data ?? payload
  const workspaceId = data.workspace_id ?? data.metadata?.workspace_id
  if (workspaceId) {
    const status = String(data.status ?? (eventType.includes('cancel') ? 'canceled' : eventType.includes('active') ? 'active' : 'pending')).toLowerCase()
    const productId = data.product_id ?? data.product?.id
    await admin.from('billing_subscriptions').upsert({ workspace_id: workspaceId, provider: 'dodo', provider_customer_id: data.customer_id ?? data.customer?.id, provider_subscription_id: data.subscription_id ?? data.subscription?.id, product_id: productId, plan: data.metadata?.plan ?? data.plan ?? 'unknown', status, current_period_start: data.current_period_start ?? null, current_period_end: data.current_period_end ?? null, cancel_at_period_end: Boolean(data.cancel_at_period_end), updated_at: new Date().toISOString() }, { onConflict: 'provider,provider_subscription_id' })
  }
  await admin.from('webhook_events').update({ processed_at: new Date().toISOString(), status: 'processed' }).eq('id', event.id)
  return NextResponse.json({ received: true, requestId: id })
}
