import prisma from '@/lib/prisma'
import { koppelOpleidingslozeAanvragen } from '@/lib/opleidingKoppeling'
import { recalculateStudentVoortgang } from '@/lib/recalculateStudentVoortgang'

/**
 * Bouwt een opzoektabel department-code (lowercase) → opleidingId, op basis van
 * de primaire opleidingscodes én de extra OpleidingCode-mappings
 * (afstandstrajecten, EMA, management, …). Primaire codes hebben voorrang.
 */
export async function laadDepartmentMapping(): Promise<Map<string, string>> {
  const [opleidingen, extra] = await Promise.all([
    prisma.opleiding.findMany({ select: { id: true, code: true } }),
    prisma.opleidingCode.findMany({ select: { code: true, opleidingId: true } }),
  ])
  const mapping = new Map<string, string>()
  for (const c of extra) mapping.set(c.code.trim().toLowerCase(), c.opleidingId)
  for (const o of opleidingen) mapping.set(o.code.trim().toLowerCase(), o.id)
  return mapping
}

/**
 * De SSO-department van een student heeft de vorm "<jaar> - <opleidingscode>
 * - <afstudeerrichting>", bv. "1 - PBABT - GRM" of "1 - GRHEN". Geeft de
 * kandidaten terug om op te zoeken, van specifiek naar algemeen:
 *   "1 - PBABT - GRM" → ["1 - PBABT - GRM", "PBABT - GRM", "PBABT"]
 * Zo kan een afstudeerrichting desgewenst apart gemapt worden, maar volstaat
 * de opleidingscode normaal.
 */
export function departmentKandidaten(department: string): string[] {
  const volledig = department.trim()
  const delen = volledig.split(/\s+-\s+/).map((d) => d.trim()).filter(Boolean)
  const zonderJaar = /^\d+$/.test(delen[0] ?? '') ? delen.slice(1) : delen
  const kandidaten = [volledig, zonderJaar.join(' - '), zonderJaar[0] ?? '']
  return [...new Set(kandidaten.filter(Boolean))]
}

/** De opleidingscode uit een SSO-department, bv. "1 - PBABT - GRM" → "PBABT". */
export function opleidingscodeUitDepartment(department: string): string {
  const k = departmentKandidaten(department)
  return k[k.length - 1] ?? department.trim()
}

export function opleidingVoorDepartment(
  mapping: Map<string, string>,
  department: string | null | undefined
): string | null {
  if (!department) return null
  for (const kandidaat of departmentKandidaten(department)) {
    const id = mapping.get(kandidaat.toLowerCase())
    if (id) return id
  }
  return null
}

/**
 * Zet de opleiding van een student op de opleiding die bij zijn SSO-department
 * hoort. De SSO is de bron van waarheid: een afwijkende koppeling wordt
 * overschreven. Zonder gekende mapping blijft de huidige opleiding behouden.
 * Geeft true terug als er iets gewijzigd werd.
 */
export async function koppelStudentAanOpleiding(
  student: { id: string; opleidingId: string | null },
  nieuweOpleidingId: string
): Promise<boolean> {
  if (student.opleidingId === nieuweOpleidingId) return false

  await prisma.user.update({
    where: { id: student.id },
    data: { opleidingId: nieuweOpleidingId },
  })
  if (!student.opleidingId) {
    await koppelOpleidingslozeAanvragen(student.id, nieuweOpleidingId)
  }
  await recalculateStudentVoortgang(student.id)
  console.log(
    `[OPLEIDING] Student ${student.id} gekoppeld aan opleiding ${nieuweOpleidingId} (was ${student.opleidingId ?? 'geen'})`
  )
  return true
}

export type SyncResultaat = {
  gecontroleerd: number
  gewijzigd: number
  nieuwGekoppeld: number
  zonderOpleiding: number
  zonderDepartment: number
  onbekendeDepartments: { department: string; aantal: number }[]
}

/**
 * Koppelt alle (niet-gearchiveerde) studenten opnieuw aan de opleiding die bij
 * hun laatst gekende SSO-department hoort. Studenten die sinds het bewaren van
 * de department nog niet ingelogd hebben, worden bij hun volgende login gekoppeld.
 */
export async function synchroniseerStudentOpleidingen(
  opties: { dryRun?: boolean; extraDepartments?: Map<string, string> } = {}
): Promise<SyncResultaat> {
  const mapping = await laadDepartmentMapping()
  const studenten = await prisma.user.findMany({
    where: { role: 'student', gearchiveerdOp: null },
    select: { id: true, opleidingId: true, ssoDepartment: true },
  })

  let gewijzigd = 0
  let nieuwGekoppeld = 0
  let zonderDepartment = 0
  const onbekend = new Map<string, number>()

  for (const s of studenten) {
    // Prognose: department die (nog) niet bewaard is maar wel uit het logboek komt
    const extra = opties.extraDepartments?.get(s.id)
    if (extra) s.ssoDepartment = extra
    if (!s.ssoDepartment) {
      zonderDepartment++
      continue
    }
    const doel = opleidingVoorDepartment(mapping, s.ssoDepartment)
    if (!doel) {
      // Groepeer op opleidingscode, want die moet de beheerder toevoegen
      const key = opleidingscodeUitDepartment(s.ssoDepartment)
      onbekend.set(key, (onbekend.get(key) ?? 0) + 1)
      continue
    }
    if (doel === s.opleidingId) continue
    if (!opties.dryRun) await koppelStudentAanOpleiding(s, doel)
    gewijzigd++
    if (!s.opleidingId) nieuwGekoppeld++
  }

  const zonderOpleiding = studenten.filter((s) => !s.opleidingId).length - (opties.dryRun ? 0 : nieuwGekoppeld)

  return {
    gecontroleerd: studenten.length,
    gewijzigd,
    nieuwGekoppeld,
    zonderOpleiding,
    zonderDepartment,
    onbekendeDepartments: [...onbekend.entries()]
      .map(([department, aantal]) => ({ department, aantal }))
      .sort((a, b) => b.aantal - a.aantal),
  }
}

export type LogboekDepartment = { email: string; department: string; op: Date | null }

// department loopt tot het einde van de regel (of tot een " in CSV-exports),
// want ze bevat spaties: "1 - PBABT - GRM"
const LOGIN_REGEL =
  /\[AUTH\] resolved email:\s*([^\s|"]+@[^\s|"]+)\s*\|\s*naam:.*?\|\s*department:\s*([^|"\r\n]+)/
const TIJDSTIP = /(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)/

/**
 * Haalt per e-mailadres de laatst gelogde department-code uit de serverlogs.
 * Zoekt naar de regel die auth.ts bij elke SSO-login schrijft:
 *   [AUTH] resolved email: x@student.pxl.be | naam: … | department: 1 - PBABT - GRM
 * Werkt op ruwe App Service-logs, de log stream en CSV-exports (de regel mag
 * overal in een lijn staan). Bij meerdere logins telt de recentste.
 */
export function leesDepartmentsUitLogboek(tekst: string): LogboekDepartment[] {
  const perEmail = new Map<string, LogboekDepartment>()
  for (const lijn of tekst.split(/\r?\n/)) {
    const m = LOGIN_REGEL.exec(lijn)
    if (!m) continue
    const email = m[1].toLowerCase()
    const department = m[2].trim()
    if (!department || department === 'undefined' || department === 'null') continue

    const t = TIJDSTIP.exec(lijn)
    const op = t ? new Date(t[1].replace(' ', 'T')) : null
    const geldigOp = op && !isNaN(op.getTime()) ? op : null

    const vorige = perEmail.get(email)
    // Zonder tijdstempels geldt de volgorde in het bestand (laatste regel wint)
    if (!vorige || !geldigOp || !vorige.op || geldigOp >= vorige.op) {
      perEmail.set(email, { email, department, op: geldigOp })
    }
  }
  return [...perEmail.values()]
}

export type LogboekImportResultaat = {
  gevonden: number
  bijgewerkt: number
  alGekend: number
  onbekendeGebruikers: string[]
  sync: SyncResultaat
}

/**
 * Vult User.ssoDepartment aan met de codes uit het logboek en koppelt daarna
 * alle studenten aan de juiste opleiding. Een code die al via een recentere
 * login gekend is, wordt niet overschreven. Met dryRun wordt niets gewijzigd.
 */
export async function importeerDepartmentsUitLogboek(
  regels: LogboekDepartment[],
  opties: { dryRun?: boolean } = {}
): Promise<LogboekImportResultaat> {
  const gebruikers = await prisma.user.findMany({
    where: { email: { in: regels.map((r) => r.email), mode: 'insensitive' } },
    select: { id: true, email: true, ssoDepartment: true, ssoDepartmentOp: true },
  })
  const perEmail = new Map(gebruikers.map((g) => [g.email.toLowerCase(), g]))

  let bijgewerkt = 0
  let alGekend = 0
  const onbekendeGebruikers: string[] = []
  // Bij een dry run houden we de nieuwe codes in het geheugen bij voor de prognose
  const prognose = new Map<string, string>()

  for (const r of regels) {
    const g = perEmail.get(r.email)
    if (!g) {
      onbekendeGebruikers.push(r.email)
      continue
    }
    const recenter = g.ssoDepartmentOp && (!r.op || g.ssoDepartmentOp >= r.op)
    if (g.ssoDepartment && recenter) {
      alGekend++
      continue
    }
    if (g.ssoDepartment === r.department) {
      alGekend++
      continue
    }
    bijgewerkt++
    prognose.set(g.id, r.department)
    if (!opties.dryRun) {
      await prisma.user.update({
        where: { id: g.id },
        data: { ssoDepartment: r.department, ssoDepartmentOp: r.op },
      })
    }
  }

  const sync = await synchroniseerStudentOpleidingen({
    dryRun: opties.dryRun,
    extraDepartments: opties.dryRun ? prognose : undefined,
  })

  return { gevonden: regels.length, bijgewerkt, alGekend, onbekendeGebruikers, sync }
}
