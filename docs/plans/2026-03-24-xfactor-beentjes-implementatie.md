# X-Factor Beentjes Redesign — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Vervang het uren-gebaseerde scoringssysteem door een aantallen-per-beentje-per-niveau systeem waarbij studenten zelf hun beentje (X-factor categorie) en niveau (1-4) kiezen bij elke activiteit.

**Architecture:** Prisma schema volledig herstructureren (oude rubric/uren-tabellen weg, nieuwe OpleidingTarget en StudentVoortgang), nieuwe berekeningslogica die activiteiten telt per beentje×niveau, scorekaart toont 5×4 balkjes.

**Tech Stack:** Next.js 15, Prisma 5, PostgreSQL, TypeScript, Tailwind CSS

---

## Shared Constants (referentie voor alle taken)

Beentje labels (gebruik overal):
```typescript
export const BEENTJE_LABELS: Record<string, string> = {
  PASSIE: '(Em)passie',
  ONDERNEMEND: 'Ondernemend en innovatief',
  SAMENWERKING: '(Internationaal) samenwerking',
  MULTIDISCIPLINAIR: 'Multi- & disciplinariteit',
  REFLECTIE: 'Reflectie',
}
export const BEENTJES = ['PASSIE', 'ONDERNEMEND', 'SAMENWERKING', 'MULTIDISCIPLINAIR', 'REFLECTIE'] as const
export const NIVEAUS = [1, 2, 3, 4] as const
```

---

## Task 1: Prisma Schema Redesign

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Vervang het volledige schema**

Schrijf `prisma/schema.prisma` volledig opnieuw. Verwijder:
- `EvaluatieRubric`, `RubricSectie`, `RubricNiveau`, `RubricCriterium`, `RubricNiveauBeschrijving`
- `ActiviteitEvaluatie`
- `OpleidingUrenTarget`, `StudentUrenVoortgang`, `StudentCriteriumUren`

Voeg toe / wijzig:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Beentje {
  PASSIE
  ONDERNEMEND
  SAMENWERKING
  MULTIDISCIPLINAIR
  REFLECTIE
}

model Opleiding {
  id                                 String   @id @default(uuid())
  naam                               String
  code                               String   @unique
  beschrijving                       String?
  actief                             Boolean  @default(true)
  autoGoedkeuringStudentActiviteiten Boolean  @default(false)
  createdAt                          DateTime @default(now())
  updatedAt                          DateTime @updatedAt

  studenten           User[]               @relation("StudentOpleiding")
  docenten            DocentOpleiding[]
  activiteiten        Activiteit[]
  duurzaamheidsThemas DuurzaamheidsThema[]
  targets             OpleidingTarget[]
  studentVoortgang    StudentVoortgang[]
}

model User {
  id           String  @id @default(uuid())
  email        String  @unique
  passwordHash String?
  azureAdId    String? @unique
  role         String
  naam         String
  actief       Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  opleidingId String?
  opleiding   Opleiding? @relation("StudentOpleiding", fields: [opleidingId], references: [id])

  docentOpleidingen DocentOpleiding[]
  activiteiten      Activiteit[]
  inschrijvingen    Inschrijving[]
  voortgang         StudentVoortgang[]

  impersonationsByAdmin  ImpersonationLog[] @relation("AdminImpersonations")
  impersonationsAsTarget ImpersonationLog[] @relation("TargetImpersonations")
}

model DocentOpleiding {
  id            String   @id @default(uuid())
  isCoordinator Boolean  @default(false)
  createdAt     DateTime @default(now())

  docentId    String
  docent      User      @relation(fields: [docentId], references: [id], onDelete: Cascade)
  opleidingId String
  opleiding   Opleiding @relation(fields: [opleidingId], references: [id], onDelete: Cascade)

  @@unique([docentId, opleidingId])
}

model ImpersonationLog {
  id        String    @id @default(uuid())
  actie     String
  details   String?
  ipAdres   String?
  userAgent String?
  startedAt DateTime  @default(now())
  endedAt   DateTime?

  adminId      String
  admin        User @relation("AdminImpersonations", fields: [adminId], references: [id])
  targetUserId String
  targetUser   User @relation("TargetImpersonations", fields: [targetUserId], references: [id])
}

model DuurzaamheidsThema {
  id           String   @id @default(uuid())
  naam         String
  beschrijving String?
  icoon        String?
  volgorde     Int      @default(0)
  actief       Boolean  @default(true)
  createdAt    DateTime @default(now())

  opleidingId String
  opleiding   Opleiding @relation(fields: [opleidingId], references: [id], onDelete: Cascade)

  activiteiten ActiviteitDuurzaamheid[]
}

model Activiteit {
  id                String   @id @default(uuid())
  titel             String
  typeActiviteit    String
  aard              String?
  omschrijving      String?
  datum             DateTime
  startuur          String
  einduur           String
  locatie           String?
  weblink           String?
  organisatorPxl    String?
  organisatorExtern String?
  bewijslink        String?
  verplichtProfiel  String?
  maxPlaatsen       Int?
  aantalIngeschreven Int     @default(0)

  beentje Beentje?
  niveau  Int?     // 1-4

  status             String    @default("concept")
  opmerkingen        String?
  typeAanvraag       String
  afgekeurdBekekenOp DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  aangemaaktDoorId String
  aangemaaktDoor   User       @relation(fields: [aangemaaktDoorId], references: [id])
  opleidingId      String?
  opleiding        Opleiding? @relation(fields: [opleidingId], references: [id])

  inschrijvingen Inschrijving[]
  duurzaamheid   ActiviteitDuurzaamheid[]
}

model ActiviteitDuurzaamheid {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())

  activiteitId   String
  activiteit     Activiteit         @relation(fields: [activiteitId], references: [id], onDelete: Cascade)
  duurzaamheidId String
  duurzaamheid   DuurzaamheidsThema @relation(fields: [duurzaamheidId], references: [id], onDelete: Cascade)

  @@unique([activiteitId, duurzaamheidId])
}

model Inschrijving {
  id                  String    @id @default(uuid())
  inschrijvingsstatus String    @default("ingeschreven")
  effectieveDeelname  Boolean   @default(false)
  pxlBegeleider       String?
  uitgeschrevenOp     DateTime?
  uitschrijfReden     String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  bewijsStatus             String    @default("niet_ingediend")
  bewijsIngediendOp        DateTime?
  bewijsBeoordeeldOp       DateTime?
  bewijsFeedback           String?
  bewijsAfgekeurdBekekenOp DateTime?

  activiteitId String
  activiteit   Activiteit @relation(fields: [activiteitId], references: [id], onDelete: Cascade)
  studentId    String
  student      User       @relation(fields: [studentId], references: [id], onDelete: Cascade)

  bewijsstukken Bewijsstuk[]

  @@unique([activiteitId, studentId])
}

model Bewijsstuk {
  id           String   @id @default(uuid())
  type         String
  bestandsnaam String
  bestandspad  String
  uploadedAt   DateTime @default(now())

  inschrijvingId String
  inschrijving   Inschrijving @relation(fields: [inschrijvingId], references: [id], onDelete: Cascade)
}

model OpleidingTarget {
  id         String @id @default(uuid())
  schooljaar String

  aantalPassieN1            Int @default(0)
  aantalPassieN2            Int @default(0)
  aantalPassieN3            Int @default(0)
  aantalPassieN4            Int @default(0)
  aantalOndernemendN1       Int @default(0)
  aantalOndernemendN2       Int @default(0)
  aantalOndernemendN3       Int @default(0)
  aantalOndernemendN4       Int @default(0)
  aantalSamenwerkingN1      Int @default(0)
  aantalSamenwerkingN2      Int @default(0)
  aantalSamenwerkingN3      Int @default(0)
  aantalSamenwerkingN4      Int @default(0)
  aantalMultidisciplinairN1 Int @default(0)
  aantalMultidisciplinairN2 Int @default(0)
  aantalMultidisciplinairN3 Int @default(0)
  aantalMultidisciplinairN4 Int @default(0)
  aantalReflectieN1         Int @default(0)
  aantalReflectieN2         Int @default(0)
  aantalReflectieN3         Int @default(0)
  aantalReflectieN4         Int @default(0)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  opleidingId String
  opleiding   Opleiding @relation(fields: [opleidingId], references: [id], onDelete: Cascade)

  @@unique([opleidingId, schooljaar])
}

model StudentVoortgang {
  id         String @id @default(uuid())
  schooljaar String

  aantalPassieN1            Int @default(0)
  aantalPassieN2            Int @default(0)
  aantalPassieN3            Int @default(0)
  aantalPassieN4            Int @default(0)
  aantalOndernemendN1       Int @default(0)
  aantalOndernemendN2       Int @default(0)
  aantalOndernemendN3       Int @default(0)
  aantalOndernemendN4       Int @default(0)
  aantalSamenwerkingN1      Int @default(0)
  aantalSamenwerkingN2      Int @default(0)
  aantalSamenwerkingN3      Int @default(0)
  aantalSamenwerkingN4      Int @default(0)
  aantalMultidisciplinairN1 Int @default(0)
  aantalMultidisciplinairN2 Int @default(0)
  aantalMultidisciplinairN3 Int @default(0)
  aantalMultidisciplinairN4 Int @default(0)
  aantalReflectieN1         Int @default(0)
  aantalReflectieN2         Int @default(0)
  aantalReflectieN3         Int @default(0)
  aantalReflectieN4         Int @default(0)

  lastCalculated DateTime @default(now())

  studentId   String
  student     User      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  opleidingId String
  opleiding   Opleiding @relation(fields: [opleidingId], references: [id], onDelete: Cascade)

  @@unique([studentId, schooljaar])
}

model SystemSetting {
  id        String   @id @default(uuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}
```

**Step 2: Pas database aan**

```bash
npx prisma db push
```
Verwacht: "Your database is now in sync with your Prisma schema."

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "refactor: vervang uren/rubric schema door beentje/niveau systeem"
```

---

## Task 2: Shared Constants Bestand

**Files:**
- Create: `src/lib/beentjes.ts`

**Step 1: Maak constants bestand aan**

```typescript
// src/lib/beentjes.ts

export const BEENTJE_LABELS: Record<string, string> = {
  PASSIE: '(Em)passie',
  ONDERNEMEND: 'Ondernemend en innovatief',
  SAMENWERKING: '(Internationaal) samenwerking',
  MULTIDISCIPLINAIR: 'Multi- & disciplinariteit',
  REFLECTIE: 'Reflectie',
}

export const BEENTJES = [
  'PASSIE',
  'ONDERNEMEND',
  'SAMENWERKING',
  'MULTIDISCIPLINAIR',
  'REFLECTIE',
] as const

export type BeentjeType = (typeof BEENTJES)[number]

export const NIVEAUS = [1, 2, 3, 4] as const

export type NiveauType = (typeof NIVEAUS)[number]

/** Geeft de veldnaam in OpleidingTarget/StudentVoortgang terug */
export function getVeldNaam(beentje: string, niveau: number): string {
  const b = beentje.charAt(0).toUpperCase() + beentje.slice(1).toLowerCase()
  // Speciale gevallen voor samengestelde namen
  const map: Record<string, string> = {
    PASSIE: 'Passie',
    ONDERNEMEND: 'Ondernemend',
    SAMENWERKING: 'Samenwerking',
    MULTIDISCIPLINAIR: 'Multidisciplinair',
    REFLECTIE: 'Reflectie',
  }
  return `aantal${map[beentje]}N${niveau}`
}
```

**Step 2: Commit**

```bash
git add src/lib/beentjes.ts
git commit -m "feat: voeg beentje constants toe"
```

---

## Task 3: recalculateStudentVoortgang

**Files:**
- Create: `src/lib/recalculateStudentVoortgang.ts`
- Delete: `src/lib/recalculateStudentUren.ts` (na update van alle imports)

**Step 1: Maak nieuwe berekeningsfunctie**

```typescript
// src/lib/recalculateStudentVoortgang.ts
import prisma from '@/lib/prisma'
import { getCurrentSchooljaar } from '@/lib/utils'
import { BEENTJES, NIVEAUS, getVeldNaam } from '@/lib/beentjes'

/**
 * Telt goedgekeurde activiteiten per beentje×niveau voor een student
 * en update de StudentVoortgang tabel.
 * Aanroepen na elke goedkeuring van bewijsstuk of wijziging beentje/niveau.
 */
export async function recalculateStudentVoortgang(studentId: string): Promise<void> {
  const schooljaar = getCurrentSchooljaar()

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { opleidingId: true },
  })

  if (!student?.opleidingId) {
    console.log(`Student ${studentId} heeft geen opleiding, skip voortgang`)
    return
  }

  // Haal alle goedgekeurde inschrijvingen op
  const inschrijvingen = await prisma.inschrijving.findMany({
    where: {
      studentId,
      effectieveDeelname: true,
      bewijsStatus: 'goedgekeurd',
    },
    include: {
      activiteit: {
        select: { beentje: true, niveau: true, datum: true },
      },
    },
  })

  // Filter op schooljaar (aktiviteiten in huidig schooljaar)
  const schooljaarStart = parseInt(schooljaar.split('-')[0])
  const inSchoolJaar = inschrijvingen.filter((i) => {
    const jaar = new Date(i.activiteit.datum).getFullYear()
    const maand = new Date(i.activiteit.datum).getMonth() + 1
    // Schooljaar loopt van september tot augustus
    if (maand >= 9) return jaar === schooljaarStart
    return jaar === schooljaarStart + 1
  })

  // Tel per beentje × niveau
  const tellers: Record<string, number> = {}
  for (const beentje of BEENTJES) {
    for (const niveau of NIVEAUS) {
      tellers[getVeldNaam(beentje, niveau)] = 0
    }
  }

  for (const inschrijving of inSchoolJaar) {
    const { beentje, niveau } = inschrijving.activiteit
    if (!beentje || !niveau) continue
    const veld = getVeldNaam(beentje, niveau)
    if (veld in tellers) {
      tellers[veld]++
    }
  }

  await prisma.studentVoortgang.upsert({
    where: { studentId_schooljaar: { studentId, schooljaar } },
    create: {
      studentId,
      opleidingId: student.opleidingId,
      schooljaar,
      ...tellers,
      lastCalculated: new Date(),
    },
    update: {
      ...tellers,
      lastCalculated: new Date(),
    },
  })

  console.log(`Voortgang herberekend voor student ${studentId}:`, tellers)
}
```

**Step 2: Verifieer TypeScript compileert**

```bash
npx tsc --noEmit
```
Verwacht: geen output (geen fouten)

**Step 3: Commit**

```bash
git add src/lib/recalculateStudentVoortgang.ts
git commit -m "feat: voeg recalculateStudentVoortgang toe (vervangt recalculateStudentUren)"
```

---

## Task 4: Seed Data Update

**Files:**
- Modify: `prisma/seed.ts`

**Step 1: Zoek in seed.ts alle rubric/uren-gerelateerde seeding**

Verwijder:
- Aanmaken van `EvaluatieRubric`, `RubricSectie`, `RubricNiveau`, `RubricCriterium`, `RubricNiveauBeschrijving`
- Aanmaken van `OpleidingUrenTarget`

Voeg toe — OpleidingTarget voor elke opleiding (na het aanmaken van opleidingen):

```typescript
// Na het aanmaken van opleidingen in seed.ts
console.log('⏱️ Creating opleiding targets...')
const schooljaar = '2024-2025'

// Standaard targets: N1=3, N2=2, N3=1, N4=1 per beentje
const defaultTargets = {
  aantalPassieN1: 3, aantalPassieN2: 2, aantalPassieN3: 1, aantalPassieN4: 1,
  aantalOndernemendN1: 3, aantalOndernemendN2: 2, aantalOndernemendN3: 1, aantalOndernemendN4: 1,
  aantalSamenwerkingN1: 3, aantalSamenwerkingN2: 2, aantalSamenwerkingN3: 1, aantalSamenwerkingN4: 1,
  aantalMultidisciplinairN1: 3, aantalMultidisciplinairN2: 2, aantalMultidisciplinairN3: 1, aantalMultidisciplinairN4: 1,
  aantalReflectieN1: 3, aantalReflectieN2: 2, aantalReflectieN3: 1, aantalReflectieN4: 1,
}

for (const opleiding of [bouwkunde, informatica, elektromechanica]) {
  await prisma.opleidingTarget.upsert({
    where: { opleidingId_schooljaar: { opleidingId: opleiding.id, schooljaar } },
    create: { opleidingId: opleiding.id, schooljaar, ...defaultTargets },
    update: defaultTargets,
  })
}
console.log('✅ Opleiding targets aangemaakt')
```

Update ook de demo activiteiten — voeg `beentje` en `niveau` toe aan elke aanmake:

```typescript
// Voorbeeld voor een demo activiteit:
await prisma.activiteit.create({
  data: {
    // ... bestaande velden ...
    beentje: 'PASSIE',  // of ONDERNEMEND, SAMENWERKING, etc.
    niveau: 1,
    // ...
  }
})
```
Verspreid de 5 beentjes en niveaus 1-4 over de demo activiteiten.

**Step 2: Voer seed uit**

```bash
npx prisma db seed
```
Verwacht: "🎉 SEEDING COMPLETE!" zonder fouten

**Step 3: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: update seed data voor beentje/niveau systeem"
```

---

## Task 5: API — Student Aanvragen (beentje + niveau)

**Files:**
- Modify: `src/app/api/student/aanvragen/route.ts`

**Step 1: Voeg `beentje` toe aan POST handler**

In de POST handler, voeg `beentje` toe aan de destructuring en validatie:

```typescript
// Destructure beentje uit body (naast niveau)
const { ..., niveau, beentje, ... } = body

// Validatie: beentje is verplicht
const geldigeBeentjes = ['PASSIE', 'ONDERNEMEND', 'SAMENWERKING', 'MULTIDISCIPLINAIR', 'REFLECTIE']
if (!beentje || !geldigeBeentjes.includes(beentje)) {
  return NextResponse.json(
    { error: 'Beentje is verplicht (PASSIE, ONDERNEMEND, SAMENWERKING, MULTIDISCIPLINAIR, of REFLECTIE)' },
    { status: 400 }
  )
}
if (!niveau || niveau < 1 || niveau > 4) {
  return NextResponse.json(
    { error: 'Niveau moet 1, 2, 3 of 4 zijn' },
    { status: 400 }
  )
}
```

In `prisma.activiteit.create`:
```typescript
data: {
  // ... bestaande velden ...
  beentje: beentje as Beentje,
  niveau: parseInt(niveau),
}
```

Voeg import toe bovenaan: `import { Beentje } from '@prisma/client'`

**Step 2: Verifieer TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/app/api/student/aanvragen/route.ts
git commit -m "feat: voeg beentje toe aan student aanvraag API"
```

---

## Task 6: API — Docent Aanvraag Validatie (beentje/niveau aanpassen)

**Files:**
- Modify: `src/app/api/docent/aanvragen/[id]/route.ts`

**Step 1: Voeg beentje/niveau aanpassing toe + herberekening**

```typescript
import { recalculateStudentVoortgang } from '@/lib/recalculateStudentVoortgang'
import { Beentje } from '@prisma/client'

// In de PATCH handler, naast status en opmerkingen ook beentje + niveau accepteren:
const { status, opmerkingen, beentje, niveau } = body

// Bouw updateData op:
const updateData: Record<string, unknown> = {
  status,
  opmerkingen: opmerkingen || null,
}

if (beentje) {
  const geldig = ['PASSIE', 'ONDERNEMEND', 'SAMENWERKING', 'MULTIDISCIPLINAIR', 'REFLECTIE']
  if (!geldig.includes(beentje)) {
    return NextResponse.json({ error: 'Ongeldig beentje' }, { status: 400 })
  }
  updateData.beentje = beentje as Beentje
}

if (niveau !== undefined) {
  if (![1, 2, 3, 4].includes(parseInt(niveau))) {
    return NextResponse.json({ error: 'Niveau moet 1-4 zijn' }, { status: 400 })
  }
  updateData.niveau = parseInt(niveau)
}

const updatedAanvraag = await prisma.activiteit.update({
  where: { id },
  data: updateData,
  include: {
    inschrijvingen: { select: { studentId: true } },
  },
})

// Herbereken voortgang voor alle ingeschreven studenten bij goedkeuring
if (status === 'goedgekeurd' || beentje || niveau) {
  for (const inschrijving of updatedAanvraag.inschrijvingen) {
    await recalculateStudentVoortgang(inschrijving.studentId)
  }
}
```

**Step 2: Verifieer TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/app/api/docent/aanvragen/[id]/route.ts src/lib/recalculateStudentVoortgang.ts
git commit -m "feat: docent kan beentje/niveau aanpassen bij validatie + herberekening voortgang"
```

---

## Task 7: API — Bewijsstuk Goedkeuring Triggert Herberekening

**Files:**
- Zoek: `src/app/api/` naar de route die `bewijsStatus: 'goedgekeurd'` zet
  (waarschijnlijk `src/app/api/docent/bewijsstukken/[id]/route.ts` of vergelijkbaar)

**Step 1: Vervang recalculateStudentUren door recalculateStudentVoortgang**

Zoek in de codebase naar alle imports van `recalculateStudentUren`:

```bash
grep -r "recalculateStudentUren" src/ --include="*.ts" --include="*.tsx"
```

Voor elk bestand dat het importeert:
- Vervang `import { recalculateStudentUren }` → `import { recalculateStudentVoortgang }`
- Vervang alle aanroepen `recalculateStudentUren(...)` → `recalculateStudentVoortgang(...)`

**Step 2: Verwijder oude bestand**

```bash
rm src/lib/recalculateStudentUren.ts
```

**Step 3: Verifieer TypeScript**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: vervang recalculateStudentUren door recalculateStudentVoortgang overal"
```

---

## Task 8: Admin API — OpleidingTarget (vervangt OpleidingUrenTarget)

**Files:**
- Modify: `src/app/api/admin/opleidingen/[id]/route.ts`

**Step 1: Vervang OpleidingUrenTarget door OpleidingTarget in PATCH**

```typescript
// Vervang de urenTargets sectie volledig:
if (targets && schooljaar) {
  await prisma.opleidingTarget.upsert({
    where: { opleidingId_schooljaar: { opleidingId: id, schooljaar } },
    create: { opleidingId: id, schooljaar, ...targets },
    update: targets,
  })
}
```

De body verwacht nu `targets` (object met 20 aantalXxxNy velden) ipv `urenTargets`.

**Step 2: Commit**

```bash
git add src/app/api/admin/opleidingen/[id]/route.ts
git commit -m "feat: update opleiding API voor OpleidingTarget (aanpak beentjes)"
```

---

## Task 9: Admin UI — Opleiding Targets Grid

**Files:**
- Modify: `src/app/(dashboard)/admin/opleidingen/[id]/EditOpleidingForm.tsx`
- Modify: `src/app/(dashboard)/admin/opleidingen/[id]/page.tsx` (data fetching)

**Step 1: Update page.tsx — fetch OpleidingTarget ipv OpleidingUrenTarget**

In de server component, vervang de query:
```typescript
// Vervang in de include/select:
targets: {
  where: { schooljaar },
  take: 1,
}
// ipv:
urenTargets: { ... }
```

**Step 2: Herschrijf het targets-gedeelte in EditOpleidingForm.tsx**

Verwijder de uren-sectie volledig. Voeg toe:

```typescript
import { BEENTJES, BEENTJE_LABELS, NIVEAUS, getVeldNaam } from '@/lib/beentjes'

// State voor targets (20 velden):
const initTargets: Record<string, number> = {}
for (const b of BEENTJES) {
  for (const n of NIVEAUS) {
    initTargets[getVeldNaam(b, n)] = opleiding.targets?.[getVeldNaam(b, n)] ?? 0
  }
}
const [targets, setTargets] = useState(initTargets)

// In handleSubmit: stuur `targets` ipv `urenTargets`

// UI — 5×4 grid:
<div className="border-t pt-6 mt-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-2">Activiteiten Targets per Beentje</h3>
  <p className="text-sm text-gray-600 mb-4">
    Minimum aantal activiteiten per beentje en niveau voor schooljaar <strong>{schooljaar}</strong>.
  </p>
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th className="text-left py-2 pr-4 font-medium text-gray-700">Beentje</th>
          {NIVEAUS.map(n => (
            <th key={n} className="text-center py-2 px-2 font-medium text-gray-700">N{n}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {BEENTJES.map(beentje => (
          <tr key={beentje} className="border-t">
            <td className="py-2 pr-4 font-medium text-gray-800">{BEENTJE_LABELS[beentje]}</td>
            {NIVEAUS.map(niveau => {
              const veld = getVeldNaam(beentje, niveau)
              return (
                <td key={niveau} className="py-2 px-2">
                  <input
                    type="number"
                    min="0"
                    value={targets[veld]}
                    onChange={e => setTargets(prev => ({
                      ...prev,
                      [veld]: parseInt(e.target.value) || 0
                    }))}
                    className="w-16 text-center input-field"
                  />
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

**Step 3: Verifieer visueel in dev server**
- Ga naar `/admin/opleidingen/[id]`
- Controleer dat het 5×4 grid zichtbaar is met invoervelden
- Sla op en controleer dat data bewaard wordt

**Step 4: Commit**

```bash
git add src/app/(dashboard)/admin/opleidingen/
git commit -m "feat: vervang uren targets UI door beentje/niveau grid in admin opleiding"
```

---

## Task 10: Student UI — Aanvraag Formulier (beentje + niveau)

**Files:**
- Zoek het formulier dat een nieuwe aanvraag aanmaakt (waarschijnlijk via `?openNew=true` modal)
  - Waarschijnlijk: `src/app/(dashboard)/student/aanvragen/AanvraagForm.tsx` of vergelijkbaar
  - Zoek: `grep -r "niveau" src/app/(dashboard)/student/ --include="*.tsx" -l`

**Step 1: Voeg beentje-selector toe**

Zoek het invoerveld voor `niveau`. Voeg **vóór** het niveau-veld een beentje-dropdown toe:

```tsx
import { BEENTJES, BEENTJE_LABELS } from '@/lib/beentjes'

// State:
const [beentje, setBeentje] = useState('')

// UI:
<div>
  <label htmlFor="beentje" className="label">
    Beentje *
  </label>
  <select
    id="beentje"
    value={beentje}
    onChange={e => setBeentje(e.target.value)}
    className="input-field"
    required
  >
    <option value="">Kies een beentje...</option>
    {BEENTJES.map(b => (
      <option key={b} value={b}>{BEENTJE_LABELS[b]}</option>
    ))}
  </select>
</div>
```

Pas het niveau-veld aan — toon alleen waarden 1–4:

```tsx
<div>
  <label htmlFor="niveau" className="label">
    Niveau *
  </label>
  <select
    id="niveau"
    value={niveau}
    onChange={e => setNiveau(e.target.value)}
    className="input-field"
    required
  >
    <option value="">Kies niveau...</option>
    <option value="1">Niveau 1</option>
    <option value="2">Niveau 2</option>
    <option value="3">Niveau 3</option>
    <option value="4">Niveau 4</option>
  </select>
</div>
```

Voeg `beentje` toe aan de POST body:
```typescript
body: JSON.stringify({ ..., beentje, niveau, ... })
```

**Step 2: Verifieer visueel**
- Ga naar `/student/aanvragen` → maak nieuwe aanvraag
- Controleer dat beentje-dropdown en niveau 1-4 zichtbaar zijn
- Dien in → controleer in DB dat `beentje` en `niveau` gezet zijn

**Step 3: Commit**

```bash
git add src/app/(dashboard)/student/
git commit -m "feat: voeg beentje-selector toe aan student aanvraag formulier"
```

---

## Task 11: Docent UI — Aanvraag Validatie (beentje/niveau aanpassen)

**Files:**
- Zoek: `src/app/(dashboard)/docent/aanvragen/[id]/` (AanvraagDetails component of page)

**Step 1: Toon huidig beentje + niveau**

In de aanvraagdetails, toon het gekozen beentje en niveau van de student:

```tsx
import { BEENTJE_LABELS } from '@/lib/beentjes'

<div className="grid grid-cols-2 gap-4 mt-4">
  <div>
    <span className="label">Beentje (student)</span>
    <p className="font-medium">{BEENTJE_LABELS[aanvraag.beentje] ?? '—'}</p>
  </div>
  <div>
    <span className="label">Niveau (student)</span>
    <p className="font-medium">{aanvraag.niveau ? `Niveau ${aanvraag.niveau}` : '—'}</p>
  </div>
</div>
```

**Step 2: Voeg bewerkbare dropdowns toe bij validatie**

Bij de goedkeur-actie, voeg bewerkbare beentje/niveau velden toe:

```tsx
const [beentjeOverride, setBeentjeOverride] = useState(aanvraag.beentje ?? '')
const [niveauOverride, setNiveauOverride] = useState(aanvraag.niveau?.toString() ?? '')

// Bij submit van goedkeuring:
body: JSON.stringify({
  status: 'goedgekeurd',
  beentje: beentjeOverride || undefined,
  niveau: niveauOverride ? parseInt(niveauOverride) : undefined,
})
```

```tsx
// UI boven de goedkeur-knop:
<div className="grid grid-cols-2 gap-4 mb-4">
  <div>
    <label className="label">Beentje aanpassen</label>
    <select
      value={beentjeOverride}
      onChange={e => setBeentjeOverride(e.target.value)}
      className="input-field"
    >
      {BEENTJES.map(b => <option key={b} value={b}>{BEENTJE_LABELS[b]}</option>)}
    </select>
  </div>
  <div>
    <label className="label">Niveau aanpassen</label>
    <select
      value={niveauOverride}
      onChange={e => setNiveauOverride(e.target.value)}
      className="input-field"
    >
      {[1,2,3,4].map(n => <option key={n} value={n}>Niveau {n}</option>)}
    </select>
  </div>
</div>
```

**Step 3: Commit**

```bash
git add src/app/(dashboard)/docent/
git commit -m "feat: docent kan beentje/niveau aanpassen bij validatie aanvraag"
```

---

## Task 12: Scorekaart Redesign

**Files:**
- Modify: `src/app/(dashboard)/student/scorekaart/ScorekaartView.tsx`
- Modify: `src/app/(dashboard)/student/scorekaart/page.tsx` (data fetching)
- Modify: `src/app/(dashboard)/admin/users/[id]/scorekaart/page.tsx`
- Modify: `src/app/(dashboard)/docent/studenten/[id]/scorekaart/page.tsx`

**Step 1: Update data fetching in alle scorekaart pages**

Vervang de query die `StudentUrenVoortgang` en `OpleidingUrenTarget` ophaalt:

```typescript
// Haal StudentVoortgang op
const voortgang = await prisma.studentVoortgang.findUnique({
  where: { studentId_schooljaar: { studentId, schooljaar } },
})

// Haal OpleidingTarget op
const target = student?.opleidingId
  ? await prisma.opleidingTarget.findUnique({
      where: { opleidingId_schooljaar: { opleidingId: student.opleidingId, schooljaar } },
    })
  : null
```

**Step 2: Herschrijf ScorekaartView.tsx**

Vervang de gehele inhoud van `ScorekaartView.tsx`. De component krijgt `voortgang` en `target` als props:

```tsx
'use client'

import { BEENTJES, BEENTJE_LABELS, NIVEAUS, getVeldNaam } from '@/lib/beentjes'

type Props = {
  voortgang: Record<string, number> | null
  target: Record<string, number> | null
  // ... andere bestaande props (student info, inschrijvingen lijst)
}

export function ScorekaartView({ voortgang, target, student, inschrijvingen }: Props) {
  return (
    <div className="space-y-6">
      {/* 5 beentje-blokken */}
      {BEENTJES.map(beentje => (
        <div key={beentje} className="card">
          <h3 className="font-heading font-bold text-lg mb-4">
            {BEENTJE_LABELS[beentje]}
          </h3>
          <div className="space-y-3">
            {NIVEAUS.map(niveau => {
              const veld = getVeldNaam(beentje, niveau)
              const behaald = voortgang?.[veld] ?? 0
              const doel = target?.[veld] ?? 0
              if (doel === 0) return null // Verberg balken zonder target
              const pct = doel > 0 ? Math.min(100, (behaald / doel) * 100) : 0
              const volledig = behaald >= doel
              return (
                <div key={niveau}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Niveau {niveau}</span>
                    <span className={volledig ? 'text-green-600 font-bold' : 'text-gray-600'}>
                      {behaald} / {doel} activiteiten
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        volledig ? 'bg-green-500' : 'bg-pxl-gold'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Activiteiten tabel (behoud bestaande structuur) */}
      {/* ... */}
    </div>
  )
}
```

**Step 3: Verifieer visueel in dev server**
- Log in als student → ga naar `/student/scorekaart`
- Controleer dat 5 beentje-blokken zichtbaar zijn met balkjes
- Controleer dat getallen kloppen (balken tonen 0/3 als geen activiteiten)

**Step 4: Commit**

```bash
git add src/app/(dashboard)/student/scorekaart/ \
        src/app/(dashboard)/admin/users/ \
        src/app/(dashboard)/docent/studenten/
git commit -m "feat: scorekaart toont aantallen per beentje/niveau ipv uren"
```

---

## Task 13: Cleanup

**Files:**
- Remove: `src/lib/recalculateStudentUren.ts` (als nog niet gedaan in Task 7)
- Zoek en verwijder API routes voor rubrics die niet meer bestaan

**Step 1: Verwijder rubric API routes**

```bash
grep -r "EvaluatieRubric\|RubricSectie\|ActiviteitEvaluatie\|OpleidingUrenTarget\|StudentUrenVoortgang\|StudentCriteriumUren" src/ --include="*.ts" --include="*.tsx" -l
```

Verwijder of update elk gevonden bestand.

**Step 2: Verwijder rubric UI componenten**

```bash
grep -r "evaluatieRubric\|rubricSectie\|activiteitEvaluatie\|urenVoortgang\|criteriumUren" src/ --include="*.tsx" -l
```

Verwijder alle referenties.

**Step 3: Finale TypeScript check**

```bash
npx tsc --noEmit
```
Verwacht: geen fouten

**Step 4: Test lokaal**

1. `npm run dev`
2. Log in als admin → `/admin/opleidingen/[id]` → controleer targets grid
3. Log in als student → maak nieuwe aanvraag → kies beentje + niveau
4. Log in als docent → valideer aanvraag → pas beentje/niveau aan
5. Log in als student → bekijk scorekaart → controleer balkjes

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: verwijder alle restanten van uren/rubric systeem"
```

---

## Verificatie Checklist

- [ ] `npx tsc --noEmit` geeft geen fouten
- [ ] `npx prisma db push` succesvol
- [ ] `npx prisma db seed` succesvol
- [ ] Student kan aanvraag indienen met beentje + niveau
- [ ] Docent kan beentje/niveau aanpassen bij validatie
- [ ] Scorekaart toont 5 beentje-blokken met N1-N4 balkjes
- [ ] Admin kan targets instellen via 5×4 grid
- [ ] Voortgang wordt herberekend na goedkeuring bewijsstuk
