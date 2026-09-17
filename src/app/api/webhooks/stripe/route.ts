import { NextRequest, NextResponse } from 'next/server'
import { clientKey, pruneRateLimitBuckets, rateLimit, requestId, verifyHmacSha256 } from '@/lib/server/security'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const id = requestId()
  pruneRateLimitBuckets()
  const limit = rateLimit(clientKey(request, 'stripe-webhook'), 120, 60_000)
  if (!limit.allowed) return NextResponse.json({ error: 'Too many requests', id: id }, { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } })
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: 'Webhook is not configured', id }, { status: 503 })
  }

  const body = await request.text()
  const timestamp = signature.match(/(?:^|,)t=(\d+)/)?.[1]
  const signedValue = signature.match(/(?:^|,)v1=([^,]+)/)?.[1]

  if (!timestamp || !signedValue || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return NextResponse.json({ error: 'Invalid webhook signature', id }, { status: 400 })
  }

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(webhookSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${body}`))
  const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')

  let matches = expected.length === signedValue.length
  for (let index = 0; index < expected.length; index += 1) {
    matches = matches && expected.charCodeAt(index) === signedValue.charCodeAt(index)
  }

  if (!matches) {
    return NextResponse.json({ error: 'Invalid webhook signature', id }, { status: 400 })
  }

  try {
    JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload', id }, { status: 400 })
  }

  return NextResponse.json({ received: true, id })
}
