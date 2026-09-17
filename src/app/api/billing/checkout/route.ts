import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const products: Record<string, string | undefined> = {
  'solo-monthly': process.env.DODO_PRODUCT_ID_SOLO_MONTHLY,
  'solo-yearly': process.env.DODO_PRODUCT_ID_SOLO_YEARLY,
  'agency-monthly': process.env.DODO_PRODUCT_ID_AGENCY_MONTHLY,
  'agency-yearly': process.env.DODO_PRODUCT_ID_AGENCY_YEARLY,
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const workspaceId = typeof body?.workspaceId === 'string' ? body.workspaceId : ''
  const plan = typeof body?.plan === 'string' ? body.plan : ''
  const productId = products[plan]
  if (!workspaceId || !productId) return NextResponse.json({ error: 'Invalid billing selection' }, { status: 400 })

  const { data: membership } = await supabase.from('workspace_members').select('workspace_id').eq('workspace_id', workspaceId).eq('user_id', user.id).maybeSingle()
  if (!membership) return NextResponse.json({ error: 'Workspace access denied' }, { status: 403 })

  const apiKey = process.env.DODO_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Billing is not configured' }, { status: 503 })
  const origin = process.env.APP_URL ?? request.nextUrl.origin
  const response = await fetch('https://api.dodopayments.com/checkouts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_cart: [{ product_id: productId, quantity: 1 }], return_url: `${origin}/app/settings?billing=success`, metadata: { workspace_id: workspaceId, user_id: user.id, plan } }),
    cache: 'no-store',
  })
  if (!response.ok) return NextResponse.json({ error: 'Could not create checkout' }, { status: 502 })
  const checkout = await response.json()
  return NextResponse.json({ checkoutUrl: checkout.checkout_url })
}
