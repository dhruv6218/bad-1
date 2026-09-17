import { verifyHmacSha256 } from '@/lib/server/security'

export type ProviderStatus = 'configured' | 'not_configured'

export interface EmailProvider {
  readonly status: ProviderStatus
  sendReminder(input: { to: string; subject: string; html: string; idempotencyKey: string }): Promise<{ providerMessageId: string }>
}

export interface AiProvider {
  readonly status: ProviderStatus
  draftReminder(input: { clientName: string; amount: number; currency: string; toneLevel: number }): Promise<{ subject: string; html: string }>
}

export interface PaymentProvider {
  readonly status: ProviderStatus
  verifyEvent(payload: string, signature: string): Promise<boolean>
}

const resendKey = process.env.RESEND_API_KEY
const resendFrom = process.env.RESEND_FROM_EMAIL

export const emailProvider: EmailProvider = {
  status: resendKey && resendFrom ? 'configured' : 'not_configured',
  async sendReminder(input) {
    if (!resendKey || !resendFrom) throw new Error('Email provider is not configured')
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': input.idempotencyKey,
      },
      body: JSON.stringify({ from: resendFrom, to: [input.to], subject: input.subject, html: input.html }),
    })
    if (!response.ok) throw new Error(`Email provider request failed (${response.status})`)
    const result = await response.json() as { id?: string }
    if (!result.id) throw new Error('Email provider returned no message id')
    return { providerMessageId: result.id }
  },
}

export const aiProvider: AiProvider = {
  status: process.env.AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_URL ? 'configured' : 'not_configured',
  async draftReminder(input) {
    const gatewayUrl = process.env.AI_GATEWAY_URL
    if (!gatewayUrl) throw new Error('AI provider is not configured')
    const response = await fetch(gatewayUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(process.env.AI_GATEWAY_API_KEY ? { Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}` } : {}) },
      body: JSON.stringify({ prompt: `Write a concise professional payment reminder for ${input.clientName}. Amount due: ${input.currency} ${input.amount}. Tone level: ${input.toneLevel}/5. Return JSON with subject and html.` }),
    })
    if (!response.ok) throw new Error(`AI provider request failed (${response.status})`)
    const result = await response.json() as { subject?: string; html?: string; output?: { subject?: string; html?: string } }
    const draft = result.output ?? result
    if (!draft.subject || !draft.html) throw new Error('AI provider returned an invalid draft')
    return { subject: draft.subject, html: draft.html }
  },
}

export const paymentProvider: PaymentProvider = {
  status: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'not_configured',
  async verifyEvent(payload, signature) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET
    if (!secret) return false
    const timestamp = signature.match(/(?:^|,)t=(\\d+)/)?.[1]
    const signed = signature.match(/(?:^|,)v1=([^,]+)/)?.[1]
    if (!timestamp || !signed || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false
    return verifyHmacSha256(`${timestamp}.${payload}`, signed, secret)
  },
}
