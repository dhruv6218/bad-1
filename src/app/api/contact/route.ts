import { NextResponse } from 'next/server'

const limit = (value: string, max: number) => value.trim().slice(0, max)

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const firstName = limit(typeof body?.firstName === 'string' ? body.firstName : '', 80)
  const lastName = limit(typeof body?.lastName === 'string' ? body.lastName : '', 80)
  const email = limit(typeof body?.email === 'string' ? body.email : '', 200).toLowerCase()
  const subject = limit(typeof body?.subject === 'string' ? body.subject : '', 120)
  const message = limit(typeof body?.message === 'string' ? body.message : '', 5000)
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email) || !subject || message.length < 10) return NextResponse.json({ error: 'Please complete all fields.' }, { status: 400 })
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Email service is not configured.' }, { status: 503 })
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [process.env.SUPPORT_EMAIL], reply_to: email, subject: `[Contact] ${subject}`, text: `${firstName} ${lastName} <${email}>\n\n${message}` }) })
  if (!response.ok) return NextResponse.json({ error: 'Unable to send your message right now.' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
