import { NextRequest, NextResponse } from 'next/server'
import { clientKey, pruneRateLimitBuckets, rateLimit, requestId, verifyHmacSha256 } from '@/lib/server/security'

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

  try { JSON.parse(body) } catch { return NextResponse.json({ error: 'Invalid webhook payload', requestId: id }, { status: 400 }) }
  return NextResponse.json({ received: true, requestId: id })
}
