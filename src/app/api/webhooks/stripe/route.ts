import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: 'Webhook is not configured', requestId }, { status: 503 })
  }

  const body = await request.text()
  const timestamp = signature.match(/(?:^|,)t=(\d+)/)?.[1]
  const signedValue = signature.match(/(?:^|,)v1=([^,]+)/)?.[1]

  if (!timestamp || !signedValue || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return NextResponse.json({ error: 'Invalid webhook signature', requestId }, { status: 400 })
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
    return NextResponse.json({ error: 'Invalid webhook signature', requestId }, { status: 400 })
  }

  try {
    JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload', requestId }, { status: 400 })
  }

  return NextResponse.json({ received: true, requestId })
}
