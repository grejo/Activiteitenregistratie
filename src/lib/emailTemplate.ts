// PXL-gestylede HTML-mails. Dependency-vrij en e-mailveilig
// (table-based layout, inline CSS, web-safe fonts).

// PXL-huisstijl (zie tailwind.config.ts)
const GOUD = '#AE9A64'
const GOUD_HOVER = '#9A8756'
const GOUD_LICHT = '#F5F0E6'
const ZWART = '#030203'
const GRIJS_TEKST = '#333333'
const GRIJS_LICHT = '#F5F5F5'
const GRIJS_RAND = '#E0E0E0'
const GRIJS_MUTED = '#888780'
const LABEL_GRIJS = '#5F5E5A'

type BadgeKind = 'success' | 'danger' | 'info'

const BADGE_STIJL: Record<BadgeKind, { bg: string; tekst: string }> = {
  success: { bg: '#E7F2E3', tekst: '#2E6B1F' },
  danger: { bg: '#FBEAEA', tekst: '#A32D2D' },
  info: { bg: GOUD_LICHT, tekst: GOUD_HOVER },
}

export type EmailContent = {
  subject: string
  eyebrow: string
  heading: string
  intro: string
  badge?: { text: string; kind: BadgeKind }
  detailRows?: { label: string; waarde: string }[]
  feedback?: string | null
  ctaLabel?: string
  ctaUrl?: string
  secondaryLink?: { label: string; url: string } | null
  footerNote?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatDatum(datumISO: string): string {
  try {
    return new Intl.DateTimeFormat('nl-BE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Brussels',
    }).format(new Date(datumISO))
  } catch {
    return datumISO
  }
}

// Generieke PXL-mailshell. Tekstvelden worden veilig ge-escaped.
export function renderEmail(c: EmailContent): { subject: string; html: string } {
  const intro = escapeHtml(c.intro).replace(/\n/g, '<br>')

  const badge = c.badge
    ? `<div style="display:inline-block;margin-bottom:14px;padding:5px 12px;border-radius:6px;font-size:12px;font-weight:bold;background:${BADGE_STIJL[c.badge.kind].bg};color:${BADGE_STIJL[c.badge.kind].tekst};">${escapeHtml(c.badge.text)}</div><br>`
    : ''

  const detailBox =
    c.detailRows && c.detailRows.length > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GOUD_LICHT};border-radius:8px;margin:0 0 22px;">
        <tr><td style="padding:18px 20px;border-left:4px solid ${GOUD};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${c.detailRows
              .map(
                (r) =>
                  `<tr><td style="padding:5px 0;color:${LABEL_GRIJS};width:120px;font-size:14px;">${escapeHtml(r.label)}</td><td style="padding:5px 0;font-weight:bold;font-size:14px;color:${ZWART};">${escapeHtml(r.waarde)}</td></tr>`
              )
              .join('')}
          </table>
        </td></tr>
      </table>`
      : ''

  const feedbackBox = c.feedback
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;"><tr><td style="padding:14px 18px;background:${GRIJS_LICHT};border-left:4px solid ${GRIJS_RAND};border-radius:8px;">
        <div style="font-size:12px;color:${LABEL_GRIJS};margin-bottom:4px;">Feedback</div>
        <div style="font-size:14px;color:${GRIJS_TEKST};line-height:1.5;">${escapeHtml(c.feedback).replace(/\n/g, '<br>')}</div>
      </td></tr></table>`
    : ''

  const cta =
    c.ctaLabel && c.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 8px;"><tr><td style="background:${GOUD};border-radius:6px;">
        <a href="${c.ctaUrl}" style="display:inline-block;padding:14px 30px;font-size:15px;font-weight:bold;color:${ZWART};text-decoration:none;">${escapeHtml(c.ctaLabel)}</a>
      </td></tr></table>`
      : ''

  const secondary = c.secondaryLink
    ? `<p style="font-size:13px;margin:14px 0 0;"><a href="${c.secondaryLink.url}" style="color:${GOUD_HOVER};">${escapeHtml(c.secondaryLink.label)} &rsaquo;</a></p>`
    : ''

  const footerNote = escapeHtml(
    c.footerNote || 'Dit is een automatisch bericht — beantwoorden is niet nodig.'
  )

  const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${GRIJS_LICHT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${GRIJS_LICHT};">
<tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:8px;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif;color:${ZWART};">
    <tr><td style="background:${ZWART};padding:22px 32px;">
      <span style="color:#FFFFFF;font-size:20px;font-weight:bold;letter-spacing:0.3px;">X-Factor<span style="color:${GOUD};">Tool</span></span>
    </td></tr>
    <tr><td style="height:4px;line-height:4px;font-size:0;background:${GOUD};">&nbsp;</td></tr>
    <tr><td style="padding:32px;">
      <div style="font-size:12px;font-weight:bold;color:${GOUD};letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">${escapeHtml(c.eyebrow)}</div>
      ${badge}
      <div style="font-size:24px;font-weight:bold;line-height:1.25;margin-bottom:14px;">${escapeHtml(c.heading)}</div>
      <p style="font-size:15px;line-height:1.6;color:${GRIJS_TEKST};margin:0 0 22px;">${intro}</p>
      ${detailBox}
      ${feedbackBox}
      ${cta}
      ${secondary}
    </td></tr>
    <tr><td style="border-top:1px solid ${GRIJS_RAND};padding:20px 32px;">
      <p style="font-size:12px;line-height:1.5;color:${GRIJS_MUTED};margin:0;">${footerNote}</p>
      <p style="font-size:12px;color:${GRIJS_MUTED};margin:8px 0 0;">&copy; 2026 Hogeschool PXL</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`

  return { subject: c.subject, html }
}

// ----- Builders per mailtype -----

type ActiviteitKern = {
  titel: string
  datumISO: string
  startuur: string
  einduur: string
  locatie?: string | null
}

function activiteitDetailRows(a: ActiviteitKern, opleidingen?: string[]): { label: string; waarde: string }[] {
  const rows = [
    { label: 'Datum', waarde: formatDatum(a.datumISO) },
    { label: 'Tijd', waarde: `${a.startuur} – ${a.einduur}` },
  ]
  if (a.locatie) rows.push({ label: 'Locatie', waarde: a.locatie })
  if (opleidingen && opleidingen.length > 0) rows.push({ label: 'Opleiding', waarde: opleidingen.join(', ') })
  return rows
}

// 1. Prikbord: nieuwe activiteit voor studenten
export function buildPrikbordEmail(data: {
  titel: string
  datumISO: string
  startuur: string
  einduur: string
  locatie?: string | null
  omschrijving?: string | null
  weblink?: string | null
  opleidingNamen: string[]
  prikbordUrl: string
}): { subject: string; html: string } {
  const weblink = data.weblink && /^https?:\/\//i.test(data.weblink) ? data.weblink : null
  return renderEmail({
    subject: `Nieuwe activiteit: ${data.titel}`,
    eyebrow: 'Nieuwe activiteit op het prikbord',
    heading: data.titel,
    intro: 'Beste student,\nEr staat een nieuwe activiteit klaar voor jouw opleiding. Hieronder vind je de details.',
    detailRows: activiteitDetailRows(data, data.opleidingNamen),
    feedback: data.omschrijving || null,
    ctaLabel: 'Bekijk op het prikbord',
    ctaUrl: data.prikbordUrl,
    secondaryLink: weblink ? { label: 'Meer informatie over deze activiteit', url: weblink } : null,
  })
}

// 2. Aanvraag beoordeeld (naar de student die de aanvraag indiende)
export function buildAanvraagBeoordeeldEmail(data: {
  titel: string
  goedgekeurd: boolean
  feedback?: string | null
  aanvragenUrl: string
}): { subject: string; html: string } {
  return renderEmail({
    subject: data.goedgekeurd
      ? `Je aanvraag is goedgekeurd: ${data.titel}`
      : `Je aanvraag is afgekeurd: ${data.titel}`,
    eyebrow: 'Beoordeling van je aanvraag',
    badge: data.goedgekeurd
      ? { text: 'Goedgekeurd', kind: 'success' }
      : { text: 'Afgekeurd', kind: 'danger' },
    heading: data.titel,
    intro: data.goedgekeurd
      ? 'Beste student,\nJe aangevraagde activiteit is goedgekeurd. Ze telt mee voor je scorekaart.'
      : 'Beste student,\nJe aangevraagde activiteit is helaas afgekeurd. Bekijk de feedback hieronder.',
    feedback: data.feedback || null,
    ctaLabel: 'Bekijk je aanvragen',
    ctaUrl: data.aanvragenUrl,
  })
}

// 3. Bewijsstuk beoordeeld (naar de student)
export function buildBewijsBeoordeeldEmail(data: {
  activiteitTitel: string
  goedgekeurd: boolean
  feedback?: string | null
  bewijsUrl: string
}): { subject: string; html: string } {
  return renderEmail({
    subject: data.goedgekeurd
      ? `Je bewijsstuk is goedgekeurd: ${data.activiteitTitel}`
      : `Je bewijsstuk is afgekeurd: ${data.activiteitTitel}`,
    eyebrow: 'Beoordeling van je bewijsstuk',
    badge: data.goedgekeurd
      ? { text: 'Goedgekeurd', kind: 'success' }
      : { text: 'Afgekeurd', kind: 'danger' },
    heading: data.activiteitTitel,
    intro: data.goedgekeurd
      ? 'Beste student,\nJe ingediende bewijsstuk is goedgekeurd. Je deelname is geregistreerd.'
      : 'Beste student,\nJe ingediende bewijsstuk is afgekeurd. Bekijk de feedback en dien eventueel een nieuw bewijsstuk in.',
    feedback: data.feedback || null,
    ctaLabel: 'Bekijk je bewijsstukken',
    ctaUrl: data.bewijsUrl,
  })
}

// 4. Nieuwe aanvraag te beoordelen (naar docenten van de opleiding)
export function buildNieuweAanvraagEmail(data: {
  titel: string
  studentNaam: string
  opleidingNaam?: string | null
  datumISO: string
  startuur: string
  einduur: string
  locatie?: string | null
  reviewUrl: string
}): { subject: string; html: string } {
  const rows = [
    { label: 'Student', waarde: data.studentNaam },
    ...(data.opleidingNaam ? [{ label: 'Opleiding', waarde: data.opleidingNaam }] : []),
    { label: 'Datum', waarde: formatDatum(data.datumISO) },
    { label: 'Tijd', waarde: `${data.startuur} – ${data.einduur}` },
    ...(data.locatie ? [{ label: 'Locatie', waarde: data.locatie }] : []),
  ]
  return renderEmail({
    subject: `Nieuwe aanvraag te beoordelen: ${data.titel}`,
    eyebrow: 'Nieuwe aanvraag ter goedkeuring',
    heading: data.titel,
    intro: `Beste,\n${data.studentNaam} heeft een nieuwe activiteit aangevraagd die op je goedkeuring wacht.`,
    detailRows: rows,
    ctaLabel: 'Aanvraag beoordelen',
    ctaUrl: data.reviewUrl,
  })
}

// 5. Activiteit geannuleerd of gewijzigd (naar ingeschreven studenten)
export function buildActiviteitWijzigingEmail(data: {
  titel: string
  geannuleerd: boolean
  wijzigingen?: string[]
  datumISO: string
  startuur: string
  einduur: string
  locatie?: string | null
  prikbordUrl: string
}): { subject: string; html: string } {
  if (data.geannuleerd) {
    return renderEmail({
      subject: `Activiteit geannuleerd: ${data.titel}`,
      eyebrow: 'Activiteit geannuleerd',
      badge: { text: 'Geannuleerd', kind: 'danger' },
      heading: data.titel,
      intro:
        'Beste student,\nEen activiteit waarvoor je ingeschreven was, is geannuleerd. Je hoeft niets te doen — je inschrijving vervalt automatisch.',
      detailRows: activiteitDetailRows(data),
    })
  }
  const wijzigingTekst =
    data.wijzigingen && data.wijzigingen.length > 0
      ? `De volgende gegevens zijn aangepast: ${data.wijzigingen.join(', ')}.`
      : 'De gegevens van deze activiteit zijn aangepast.'
  return renderEmail({
    subject: `Activiteit gewijzigd: ${data.titel}`,
    eyebrow: 'Activiteit gewijzigd',
    badge: { text: 'Gewijzigd', kind: 'info' },
    heading: data.titel,
    intro: `Beste student,\nEen activiteit waarvoor je ingeschreven bent, is gewijzigd. ${wijzigingTekst} Hieronder vind je de actuele gegevens.`,
    detailRows: activiteitDetailRows(data),
    ctaLabel: 'Bekijk op het prikbord',
    ctaUrl: data.prikbordUrl,
  })
}
