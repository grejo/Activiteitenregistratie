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

export function opleidingVoorDepartment(
  mapping: Map<string, string>,
  department: string | null | undefined
): string | null {
  if (!department) return null
  return mapping.get(department.trim().toLowerCase()) ?? null
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
  opties: { dryRun?: boolean } = {}
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
    if (!s.ssoDepartment) {
      zonderDepartment++
      continue
    }
    const doel = opleidingVoorDepartment(mapping, s.ssoDepartment)
    if (!doel) {
      const key = s.ssoDepartment.trim()
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
