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

export const emailProvider: EmailProvider = {
  status: process.env.RESEND_API_KEY ? 'configured' : 'not_configured',
  async sendReminder() {
    throw new Error('Email provider is not configured')
  },
}

export const aiProvider: AiProvider = {
  status: process.env.AI_GATEWAY_API_KEY ? 'configured' : 'not_configured',
  async draftReminder() {
    throw new Error('AI provider is not configured')
  },
}

export const paymentProvider: PaymentProvider = {
  status: process.env.STRIPE_WEBHOOK_SECRET ? 'configured' : 'not_configured',
  async verifyEvent() {
    return false
  },
}
