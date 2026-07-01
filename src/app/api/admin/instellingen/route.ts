import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

const WEBHOOK_KEY = 'power_automate_webhook_url'

export async function GET() {
  const session = await auth()
  if (session?.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Niet toegestaan' }, { status: 403 })
  }

  const setting = await prisma.systemSetting.findUnique({ where: { key: WEBHOOK_KEY } })
  return NextResponse.json({ url: setting?.value ?? '' })
}

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Niet toegestaan' }, { status: 403 })
  }

  const { url, test } = await request.json()

  if (test) {
    const setting = await prisma.systemSetting.findUnique({ where: { key: WEBHOOK_KEY } })
    const webhookUrl = setting?.value || process.env.POWER_AUTOMATE_WEBHOOK_URL
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Geen webhook-URL ingesteld' }, { status: 400 })
    }
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: 'Testbericht Xfactorapp',
          htmlBody: '<p>Dit is een testbericht van Xfactorapp. De webhook-verbinding werkt correct.</p>',
          ontvangers: [{ email: session.user.email, naam: session.user.naam }],
        }),
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return NextResponse.json({ ok: true })
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 502 })
    }
  }

  if (url !== undefined) {
    const trimmed = (url as string).trim()
    if (trimmed && !trimmed.startsWith('https://')) {
      return NextResponse.json({ error: 'URL moet beginnen met https://' }, { status: 400 })
    }
    await prisma.systemSetting.upsert({
      where: { key: WEBHOOK_KEY },
      update: { value: trimmed },
      create: { key: WEBHOOK_KEY, value: trimmed },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Ongeldig verzoek' }, { status: 400 })
}
