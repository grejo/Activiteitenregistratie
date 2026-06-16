import prisma from '@/lib/prisma'
import { config } from '@/lib/config'
import {
  buildPrikbordEmail,
  buildAanvraagBeoordeeldEmail,
  buildBewijsBeoordeeldEmail,
  buildNieuweAanvraagEmail,
  buildActiviteitWijzigingEmail,
} from '@/lib/emailTemplate'

/**
 * Mailing-tussenoplossing via een Power Automate webhook (POWER_AUTOMATE_WEBHOOK_URL).
 * De app bouwt subject + PXL-HTML en stuurt een payload met de ontvangers; Power
 * Automate verstuurt de mail. Alle mailtypes gebruiken dezelfde payload-vorm
 * (subject, htmlBody, activiteit, ontvangers) zodat het flow-schema niet wijzigt.
 * Faalt altijd zacht: een mislukte mail mag een actie nooit blokkeren.
 */

type Ontvanger = { email: string; naam: string }

type ActiviteitMeta = {
  id: string
  titel: string
  omschrijving: string
  datum: string
  startuur: string
  einduur: string
  locatie: string
  weblink: string
  opleidingen: string[]
  prikbordUrl: string
}

function mailingEnabled(): boolean {
  if (!config.mail.powerAutomateWebhookUrl) {
    console.log('[MAIL] Geen POWER_AUTOMATE_WEBHOOK_URL — mailing overgeslagen')
    return false
  }
  return true
}

function dedupeOntvangers(ontvangers: Ontvanger[]): Ontvanger[] {
  const seen = new Set<string>()
  const out: Ontvanger[] = []
  for (const o of ontvangers) {
    const key = o.email.toLowerCase()
    if (o.email && !seen.has(key)) {
      seen.add(key)
      out.push(o)
    }
  }
  return out
}

// Lage-niveau verzending. Geeft true terug bij een geslaagde POST.
async function deliver(
  subject: string,
  html: string,
  ontvangers: Ontvanger[],
  meta: ActiviteitMeta
): Promise<boolean> {
  const webhookUrl = config.mail.powerAutomateWebhookUrl
  if (!webhookUrl) return false
  if (ontvangers.length === 0) {
    console.log('[MAIL] Geen ontvangers — niets verstuurd:', subject)
    return false
  }

  const payload = { subject, htmlBody: html, activiteit: meta, ontvangers }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    console.error('[MAIL] Webhook gaf status', res.status, await res.text().catch(() => ''))
    return false
  }
  console.log(`[MAIL] "${subject}" verstuurd naar ${ontvangers.length} ontvanger(s)`)
  return true
}

function metaFrom(a: {
  id: string
  titel: string
  omschrijving: string | null
  datum: Date
  startuur: string
  einduur: string
  locatie: string | null
  weblink: string | null
}, opleidingNamen: string[]): ActiviteitMeta {
  return {
    id: a.id,
    titel: a.titel,
    omschrijving: a.omschrijving ?? '',
    datum: a.datum.toISOString(),
    startuur: a.startuur,
    einduur: a.einduur,
    locatie: a.locatie ?? '',
    weblink: a.weblink ?? '',
    opleidingen: opleidingNamen,
    prikbordUrl: `${config.appUrl}/student/prikbord`,
  }
}

/**
 * Verwittig alle studenten van de gekoppelde opleiding(en) bij publicatie op het
 * prikbord. Enkel bij expliciete goedkeuring (verwittigPerMail), op een
 * gepubliceerde activiteit, en nooit twee keer (mailVerstuurdOp).
 */
export async function notifyPublicatie(activiteitId: string): Promise<void> {
  if (!mailingEnabled()) return
  try {
    const activiteit = await prisma.activiteit.findUnique({
      where: { id: activiteitId },
      include: { opleiding: true, opleidingen: { include: { opleiding: true } } },
    })
    if (!activiteit) return

    if (activiteit.status !== 'gepubliceerd') return
    if (!activiteit.verwittigPerMail) {
      console.log('[MAIL] verwittigPerMail staat uit — geen mail:', activiteitId)
      return
    }
    if (activiteit.mailVerstuurdOp) {
      console.log('[MAIL] Mail al verstuurd — overslaan:', activiteitId)
      return
    }

    const opleidingIds = Array.from(
      new Set([
        ...activiteit.opleidingen.map((o) => o.opleidingId),
        ...(activiteit.opleidingId ? [activiteit.opleidingId] : []),
      ])
    )
    const opleidingNamen = Array.from(
      new Set([
        ...activiteit.opleidingen.map((o) => o.opleiding.naam),
        ...(activiteit.opleiding ? [activiteit.opleiding.naam] : []),
      ])
    )

    const studenten = await prisma.user.findMany({
      where: {
        role: 'student',
        actief: true,
        gearchiveerdOp: null,
        ...(opleidingIds.length > 0 ? { opleidingId: { in: opleidingIds } } : {}),
      },
      select: { email: true, naam: true },
    })

    const { subject, html } = buildPrikbordEmail({
      titel: activiteit.titel,
      datumISO: activiteit.datum.toISOString(),
      startuur: activiteit.startuur,
      einduur: activiteit.einduur,
      locatie: activiteit.locatie,
      omschrijving: activiteit.omschrijving,
      weblink: activiteit.weblink,
      opleidingNamen,
      prikbordUrl: `${config.appUrl}/student/prikbord`,
    })

    const verstuurd = await deliver(subject, html, dedupeOntvangers(studenten), metaFrom(activiteit, opleidingNamen))
    if (verstuurd) {
      await prisma.activiteit.update({
        where: { id: activiteit.id },
        data: { mailVerstuurdOp: new Date() },
      })
    }
  } catch (err) {
    console.error('[MAIL] Fout bij prikbord-notificatie:', err)
  }
}

/** Naar de student die de aanvraag indiende: goedgekeurd of afgekeurd. */
export async function notifyAanvraagBeoordeeld(activiteitId: string): Promise<void> {
  if (!mailingEnabled()) return
  try {
    const a = await prisma.activiteit.findUnique({
      where: { id: activiteitId },
      include: { aangemaaktDoor: { select: { email: true, naam: true } }, opleiding: true },
    })
    if (!a || !a.aangemaaktDoor?.email) return

    const goedgekeurd = a.status !== 'afgekeurd'
    const { subject, html } = buildAanvraagBeoordeeldEmail({
      titel: a.titel,
      goedgekeurd,
      feedback: a.opmerkingen,
      aanvragenUrl: `${config.appUrl}/student/aanvragen`,
    })
    await deliver(
      subject,
      html,
      [{ email: a.aangemaaktDoor.email, naam: a.aangemaaktDoor.naam }],
      metaFrom(a, a.opleiding ? [a.opleiding.naam] : [])
    )
  } catch (err) {
    console.error('[MAIL] Fout bij aanvraag-beoordeeld-notificatie:', err)
  }
}

/** Naar de student: zijn ingediende bewijsstuk is goedgekeurd of afgekeurd. */
export async function notifyBewijsBeoordeeld(inschrijvingId: string): Promise<void> {
  if (!mailingEnabled()) return
  try {
    const i = await prisma.inschrijving.findUnique({
      where: { id: inschrijvingId },
      include: {
        student: { select: { email: true, naam: true } },
        activiteit: { include: { opleiding: true } },
      },
    })
    if (!i || !i.student?.email) return

    const goedgekeurd = i.bewijsStatus === 'goedgekeurd'
    const { subject, html } = buildBewijsBeoordeeldEmail({
      activiteitTitel: i.activiteit.titel,
      goedgekeurd,
      feedback: i.bewijsFeedback,
      bewijsUrl: `${config.appUrl}/student/bewijsstukken`,
    })
    await deliver(
      subject,
      html,
      [{ email: i.student.email, naam: i.student.naam }],
      metaFrom(i.activiteit, i.activiteit.opleiding ? [i.activiteit.opleiding.naam] : [])
    )
  } catch (err) {
    console.error('[MAIL] Fout bij bewijs-beoordeeld-notificatie:', err)
  }
}

/** Naar de docenten/admins van de opleiding: een nieuwe aanvraag wacht op goedkeuring. */
export async function notifyNieuweAanvraag(activiteitId: string): Promise<void> {
  if (!mailingEnabled()) return
  try {
    const a = await prisma.activiteit.findUnique({
      where: { id: activiteitId },
      include: { aangemaaktDoor: { select: { naam: true } }, opleiding: true },
    })
    if (!a) return

    // Beoordelaars: docenten + admins gekoppeld aan de opleiding, plus alle superadmins
    const beoordelaars = await prisma.user.findMany({
      where: {
        actief: true,
        OR: [
          ...(a.opleidingId
            ? [
                { role: 'docent', docentOpleidingen: { some: { opleidingId: a.opleidingId } } },
                { role: 'admin', adminOpleidingen: { some: { opleidingId: a.opleidingId } } },
              ]
            : []),
          { role: 'superadmin' },
        ],
      },
      select: { email: true, naam: true },
    })
    if (beoordelaars.length === 0) return

    const { subject, html } = buildNieuweAanvraagEmail({
      titel: a.titel,
      studentNaam: a.aangemaaktDoor?.naam ?? 'Een student',
      opleidingNaam: a.opleiding?.naam,
      datumISO: a.datum.toISOString(),
      startuur: a.startuur,
      einduur: a.einduur,
      locatie: a.locatie,
      reviewUrl: `${config.appUrl}/docent/aanvragen`,
    })
    await deliver(subject, html, dedupeOntvangers(beoordelaars), metaFrom(a, a.opleiding ? [a.opleiding.naam] : []))
  } catch (err) {
    console.error('[MAIL] Fout bij nieuwe-aanvraag-notificatie:', err)
  }
}

/**
 * Naar de ingeschreven studenten: de activiteit is gewijzigd of geannuleerd.
 * Bij annulering MOET dit aangeroepen worden vóór het verwijderen van de activiteit
 * (de inschrijvingen worden mee verwijderd).
 */
export async function notifyActiviteitWijziging(
  activiteitId: string,
  opts: { geannuleerd?: boolean; wijzigingen?: string[] }
): Promise<void> {
  if (!mailingEnabled()) return
  try {
    const a = await prisma.activiteit.findUnique({
      where: { id: activiteitId },
      include: {
        opleiding: true,
        inschrijvingen: {
          where: { inschrijvingsstatus: 'ingeschreven' },
          include: { student: { select: { email: true, naam: true } } },
        },
      },
    })
    if (!a) return

    const ontvangers = dedupeOntvangers(
      a.inschrijvingen.map((i) => ({ email: i.student.email, naam: i.student.naam }))
    )
    if (ontvangers.length === 0) return

    const { subject, html } = buildActiviteitWijzigingEmail({
      titel: a.titel,
      geannuleerd: opts.geannuleerd === true,
      wijzigingen: opts.wijzigingen,
      datumISO: a.datum.toISOString(),
      startuur: a.startuur,
      einduur: a.einduur,
      locatie: a.locatie,
      prikbordUrl: `${config.appUrl}/student/prikbord`,
    })
    await deliver(subject, html, ontvangers, metaFrom(a, a.opleiding ? [a.opleiding.naam] : []))
  } catch (err) {
    console.error('[MAIL] Fout bij activiteit-wijziging-notificatie:', err)
  }
}
