# Student-activiteit openstellen voor medestudenten — Implementatieplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Studenten kunnen hun eigen aanvraag openstellen voor medestudenten van dezelfde opleiding; na goedkeuring verschijnt de activiteit op het prikbord met een visuele onderscheiding van docent-activiteiten.

**Architecture:** Eén nieuw boolean veld `openVoorMedestudenten` op `Activiteit`. Bij docent-goedkeuring + vlag = true: status → `gepubliceerd` + auto-inschrijving voor indiener. Prikbord-query includeert goedgekeurde student-activiteiten gefilterd op dezelfde opleiding.

**Tech Stack:** Next.js 15 App Router, Prisma 5, PostgreSQL, TypeScript strict, Tailwind CSS

---

## Overzicht bestaande code (lees dit eerst)

| Pad | Beschrijving |
|---|---|
| `prisma/schema.prisma` | Datamodel — `Activiteit` model staat hier |
| `src/app/api/student/aanvragen/route.ts` | POST (aanmaken) + GET (ophalen) student-aanvragen — `typeAanvraag: 'student'` |
| `src/app/api/docent/aanvragen/[id]/route.ts` | PATCH docent-beoordeling — zet status op `'goedgekeurd'` of `'afgekeurd'` |
| `src/app/(dashboard)/student/prikbord/page.tsx` | Server component — haalt `typeAanvraag: 'docent'` activiteiten op |
| `src/app/(dashboard)/student/prikbord/PrikbordTable.tsx` | Client component — kaartgrid met inschrijf-logica |
| `src/app/(dashboard)/student/aanvragen/AanvragenTable.tsx` | Client component — formulier voor nieuwe aanvraag + overzicht |

**Belangrijk:** `typeAanvraag` heeft twee waarden in de database: `'docent'` (docent maakt activiteit aan) en `'student'` (student dient aanvraag in). Gebruik deze exacte strings.

---

## Task 1: Schema — `openVoorMedestudenten` toevoegen

**Files:**
- Modify: `prisma/schema.prisma` (Activiteit model, na `niveau Int?`)

**Step 1: Voeg het veld toe aan het schema**

Voeg na `niveau  Int?     // 1-4` toe in het `Activiteit` model:

```prisma
openVoorMedestudenten Boolean  @default(false)
```

**Step 2: Genereer en run de migratie**

```bash
cd /Users/joachimgregoor/Documents/Github/Activiteitenregistratie
npx prisma migrate dev --name add-open-voor-medestudenten
```

Verwacht output: `The following migration(s) have been created and applied`

**Step 3: Genereer Prisma client**

```bash
npx prisma generate
```

**Step 4: Verifieer TypeScript compileert**

```bash
npx tsc --noEmit
```

Verwacht: geen errors

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: voeg openVoorMedestudenten toe aan Activiteit schema"
```

---

## Task 2: API — POST student aanvraag accepteert `openVoorMedestudenten`

**Files:**
- Modify: `src/app/api/student/aanvragen/route.ts`

**Step 1: Destructure het nieuwe veld uit body**

Voeg `openVoorMedestudenten` toe aan de destructuring (na `duurzaamheidId`):

```typescript
const {
  titel,
  typeActiviteit,
  aard,
  omschrijving,
  datum,
  startuur,
  einduur,
  locatie,
  weblink,
  organisatorPxl,
  organisatorExtern,
  niveau,
  beentje,
  duurzaamheidId,
  openVoorMedestudenten,  // NIEUW
} = body
```

**Step 2: Pas de status-logica aan voor auto-goedkeuring + openVoorMedestudenten**

Vervang het bestaande `initialStatus` blok:

```typescript
let initialStatus = 'in_review'
if (student?.opleiding?.autoGoedkeuringStudentActiviteiten) {
  // Open voor medestudenten → gepubliceerd, anders goedgekeurd
  initialStatus = openVoorMedestudenten ? 'gepubliceerd' : 'goedgekeurd'
}
```

**Step 3: Voeg het veld toe aan `prisma.activiteit.create()`**

Voeg in de `data` van `prisma.activiteit.create()` toe (na `opleidingId`):

```typescript
openVoorMedestudenten: openVoorMedestudenten === true,
```

**Step 4: Pas de auto-inschrijving aan voor `gepubliceerd` status**

Vervang de bestaande auto-inschrijving check:

```typescript
// Als auto-goedgekeurd of gepubliceerd, maak inschrijving aan
if (initialStatus === 'goedgekeurd' || initialStatus === 'gepubliceerd') {
  await prisma.inschrijving.create({
    data: {
      activiteitId: aanvraag.id,
      studentId: session.user.id,
      inschrijvingsstatus: 'ingeschreven',
      effectieveDeelname: true,
    },
  })
}
```

**Step 5: Verifieer TypeScript**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add src/app/api/student/aanvragen/route.ts
git commit -m "feat: POST student aanvraag accepteert openVoorMedestudenten"
```

---

## Task 3: API — PATCH student aanvraag aanpassen (nieuw endpoint)

**Files:**
- Modify: `src/app/api/student/aanvragen/route.ts` (voeg PATCH toe onderaan)

**Step 1: Voeg PATCH handler toe aan het einde van het bestand**

```typescript
export async function PATCH(request: Request) {
  try {
    const session = await auth()

    if (!session?.user || (session.user.role !== 'student' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, openVoorMedestudenten } = body

    if (!id || typeof openVoorMedestudenten !== 'boolean') {
      return NextResponse.json(
        { error: 'id en openVoorMedestudenten zijn verplicht' },
        { status: 400 }
      )
    }

    // Controleer eigenaarschap en status
    const aanvraag = await prisma.activiteit.findFirst({
      where: {
        id,
        aangemaaktDoorId: session.user.id,
        typeAanvraag: 'student',
      },
    })

    if (!aanvraag) {
      return NextResponse.json(
        { error: 'Aanvraag niet gevonden of geen toegang' },
        { status: 404 }
      )
    }

    // Alleen aanpasbaar als nog niet goedgekeurd of afgekeurd
    if (!['concept', 'in_review'].includes(aanvraag.status)) {
      return NextResponse.json(
        { error: 'Aanvraag kan niet meer aangepast worden' },
        { status: 400 }
      )
    }

    const updated = await prisma.activiteit.update({
      where: { id },
      data: { openVoorMedestudenten },
    })

    return NextResponse.json({ success: true, openVoorMedestudenten: updated.openVoorMedestudenten })
  } catch (error) {
    console.error('Error updating aanvraag:', error)
    return NextResponse.json({ error: 'Er is een fout opgetreden' }, { status: 500 })
  }
}
```

**Step 2: Verifieer TypeScript**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/app/api/student/aanvragen/route.ts
git commit -m "feat: PATCH endpoint voor student openVoorMedestudenten aanpassen"
```

---

## Task 4: API — Docent goedkeuring publiceert open activiteiten

**Files:**
- Modify: `src/app/api/docent/aanvragen/[id]/route.ts`

**Step 1: Haal `openVoorMedestudenten` op bij de aanvraag-fetch**

Voeg `openVoorMedestudenten: true` toe aan de `findFirst` select, of haal het op via het `aanvraag` object dat al bestaat. Het veld staat automatisch op de `aanvraag` na de Prisma generate.

**Step 2: Pas de status-bepaling aan**

Vervang de regel `status` in `updateData`:

```typescript
// Bepaal finale status: open aanvragen worden gepubliceerd
const finaleStatus =
  status === 'goedgekeurd' && aanvraag.openVoorMedestudenten
    ? 'gepubliceerd'
    : status

const updateData: Record<string, unknown> = {
  status: finaleStatus,
  opmerkingen: opmerkingen || null,
}
```

**Step 3: Maak auto-inschrijving aan bij publicatie**

Voeg na het `prisma.activiteit.update()` blok toe:

```typescript
// Bij publicatie: maak auto-inschrijving voor indiener aan (als die nog niet bestaat)
if (finaleStatus === 'gepubliceerd') {
  await prisma.inschrijving.upsert({
    where: {
      activiteitId_studentId: {
        activiteitId: id,
        studentId: updatedAanvraag.aangemaaktDoorId,
      },
    },
    create: {
      activiteitId: id,
      studentId: updatedAanvraag.aangemaaktDoorId,
      inschrijvingsstatus: 'ingeschreven',
      effectieveDeelname: true,
    },
    update: {},
  })
}
```

Voeg `aangemaaktDoorId: true` toe aan de `include` van `prisma.activiteit.update()`:

```typescript
const updatedAanvraag = await prisma.activiteit.update({
  where: { id },
  data: updateData,
  include: {
    inschrijvingen: { select: { studentId: true } },
    aangemaaktDoor: { select: { id: true } },  // NIEUW
  },
})
```

En gebruik `updatedAanvraag.aangemaaktDoor.id` in de upsert:

```typescript
studentId: updatedAanvraag.aangemaaktDoor.id,
```

**Step 4: Herbereken voortgang ook bij `gepubliceerd`**

De bestaande check `if (status === 'goedgekeurd' || ...)` aanpassen:

```typescript
if (finaleStatus === 'goedgekeurd' || finaleStatus === 'gepubliceerd' || beentje !== undefined || niveau !== undefined) {
```

**Step 5: Verifieer TypeScript**

```bash
npx tsc --noEmit
```

**Step 6: Commit**

```bash
git add src/app/api/docent/aanvragen/[id]/route.ts
git commit -m "feat: docent goedkeuring publiceert open student-activiteiten + auto-inschrijving"
```

---

## Task 5: Prikbord query — student-activiteiten includeren

**Files:**
- Modify: `src/app/(dashboard)/student/prikbord/page.tsx`

**Step 1: Voeg `openVoorMedestudenten` en `typeAanvraag` toe aan de query**

Vervang de `getActiviteiten` functie volledig:

```typescript
async function getActiviteiten(opleidingId: string | null, userId: string) {
  const activiteiten = await prisma.activiteit.findMany({
    where: {
      datum: { gte: new Date() },
      OR: [
        // Docent-activiteiten (huidig gedrag)
        {
          status: 'gepubliceerd',
          typeAanvraag: 'docent',
          OR: [
            { opleidingId: null },
            { opleidingId: opleidingId || undefined },
          ],
        },
        // Student-activiteiten opengesteld voor medestudenten
        {
          status: 'gepubliceerd',
          typeAanvraag: 'student',
          openVoorMedestudenten: true,
          opleidingId: opleidingId || undefined,
          aangemaaktDoorId: { not: userId }, // Indiener ziet zijn eigen activiteit niet
        },
      ],
    },
    include: {
      opleiding: true,
      aangemaaktDoor: {
        select: { naam: true },
      },
      _count: {
        select: {
          inschrijvingen: {
            where: { inschrijvingsstatus: 'ingeschreven' },
          },
        },
      },
    },
    orderBy: { datum: 'asc' },
  })

  return activiteiten.map((a) => ({
    ...a,
    datum: a.datum.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }))
}
```

**Step 2: Geef `userId` mee vanuit de page component**

Pas de aanroep aan:

```typescript
const [activiteiten, mijnInschrijvingen] = await Promise.all([
  getActiviteiten(session.user.opleidingId || null, session.user.id),
  getMijnInschrijvingen(session.user.id),
])
```

**Step 3: Verifieer TypeScript**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add "src/app/(dashboard)/student/prikbord/page.tsx"
git commit -m "feat: prikbord toont ook goedgekeurde open student-activiteiten"
```

---

## Task 6: PrikbordTable — visuele distinctie docent vs medestudent

**Files:**
- Modify: `src/app/(dashboard)/student/prikbord/PrikbordTable.tsx`

**Step 1: Voeg `typeAanvraag` toe aan het `Activiteit` type**

```typescript
type Activiteit = {
  id: string
  titel: string
  omschrijving: string | null
  datum: string
  startuur: string
  einduur: string
  locatie: string | null
  weblink: string | null
  typeActiviteit: string
  typeAanvraag: string          // NIEUW
  maxPlaatsen: number | null
  opleiding: { naam: string } | null
  aangemaaktDoor: { naam: string }
  _count: { inschrijvingen: number }
}
```

**Step 2: Voeg bronfilter toe aan state en filtering**

Voeg na `const [typeFilter, setTypeFilter] = useState<string>('all')` toe:

```typescript
const [bronFilter, setBronFilter] = useState<string>('all')
```

Voeg in `filteredActiviteiten` (na typeFilter) toe:

```typescript
if (bronFilter !== 'all') {
  filtered = filtered.filter((a) =>
    bronFilter === 'docent' ? a.typeAanvraag === 'docent' : a.typeAanvraag === 'student'
  )
}
```

**Step 3: Voeg bronfilter UI toe aan de filters sectie**

Voeg na de type-filter `<div>` toe:

```tsx
<div className="flex items-center gap-2">
  <label className="text-sm font-medium text-gray-700">Bron:</label>
  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
    {[
      { value: 'all', label: 'Alle' },
      { value: 'docent', label: '👨‍🏫 Docent' },
      { value: 'student', label: '👩‍🎓 Medestudent' },
    ].map(({ value, label }) => (
      <button
        key={value}
        onClick={() => setBronFilter(value)}
        className={`px-3 py-1.5 text-sm font-medium transition-colors ${
          bronFilter === value
            ? 'bg-pxl-gold text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        {label}
      </button>
    ))}
  </div>
</div>
```

**Step 4: Voeg visuele distinctie toe aan de kaart**

Vervang het kaart-element `<div key={activiteit.id} className="card flex flex-col">`:

```tsx
<div
  key={activiteit.id}
  className={`flex flex-col rounded-lg border-2 p-5 shadow-sm ${
    activiteit.typeAanvraag === 'student'
      ? 'border-amber-300 bg-amber-50'
      : 'border-gray-100 bg-white'
  }`}
>
```

**Step 5: Vervang de bestaande type-badge door een bron-badge**

Vervang de bestaande badges in de kaart-header:

```tsx
<div className="flex justify-between items-start mb-3">
  <div className="flex gap-2">
    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize">
      {activiteit.typeActiviteit}
    </span>
    {activiteit.typeAanvraag === 'student' ? (
      <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
        👩‍🎓 Medestudent
      </span>
    ) : (
      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
        👨‍🏫 Docent
      </span>
    )}
  </div>
  {ingeschreven && (
    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
      Ingeschreven
    </span>
  )}
  {!ingeschreven && vol && (
    <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
      Volzet
    </span>
  )}
</div>
```

**Step 6: Voeg organisator-info toe in de detailmodal**

Voeg in de detailmodal badge-sectie een bron-badge toe (zelfde patroon als stap 5).

Voeg in de Details Grid van de modal toe (na "Organisator"):

```tsx
<div>
  <div className="text-sm text-gray-500">Type</div>
  <div className="font-medium">
    {selectedActiviteit.typeAanvraag === 'student'
      ? '👩‍🎓 Door medestudent georganiseerd'
      : '👨‍🏫 Door docent georganiseerd'}
  </div>
</div>
```

**Step 7: Verifieer TypeScript**

```bash
npx tsc --noEmit
```

**Step 8: Commit**

```bash
git add "src/app/(dashboard)/student/prikbord/PrikbordTable.tsx"
git commit -m "feat: prikbord visueel onderscheid docent vs medestudent activiteiten"
```

---

## Task 7: Student aanvraagformulier — checkbox `openVoorMedestudenten`

**Files:**
- Modify: `src/app/(dashboard)/student/aanvragen/AanvragenTable.tsx`

**Step 1: Voeg `openVoorMedestudenten` toe aan `initialFormData`**

Zoek `const initialFormData` en voeg toe:

```typescript
openVoorMedestudenten: false,
```

**Step 2: Voeg `openVoorMedestudenten` toe aan het `Aanvraag` type**

```typescript
type Aanvraag = {
  // ... bestaande velden ...
  openVoorMedestudenten: boolean  // NIEUW
}
```

**Step 3: Voeg checkbox toe aan het formulier**

Voeg onderaan het formulier (voor de submit-knop) toe:

```tsx
{/* Open stellen voor medestudenten */}
<div className="border-t pt-4 mt-2">
  <label className="flex items-start gap-3 cursor-pointer group">
    <input
      type="checkbox"
      checked={formData.openVoorMedestudenten as boolean}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, openVoorMedestudenten: e.target.checked }))
      }
      className="mt-1 h-4 w-4 rounded border-gray-300 text-pxl-gold focus:ring-pxl-gold"
    />
    <div>
      <span className="text-sm font-medium text-gray-900">
        Openstellen voor medestudenten van mijn opleiding
      </span>
      <p className="text-xs text-gray-500 mt-0.5">
        Andere studenten van jouw opleiding kunnen zich dan inschrijven zodra je aanvraag goedgekeurd is.
      </p>
    </div>
  </label>
</div>
```

**Step 4: Stuur het veld mee in de POST**

In de `handleSubmit` (of equivalent), voeg `openVoorMedestudenten` toe aan de request body.

**Step 5: Voeg toggle toe voor bestaande aanvragen (status concept/in_review)**

In het aanvragen-overzicht, toon een toggle knop voor aanvragen met status `concept` of `in_review`:

```tsx
{(aanvraag.status === 'concept' || aanvraag.status === 'in_review') && (
  <button
    onClick={() => handleToggleOpenVoorMedestudenten(aanvraag.id, aanvraag.openVoorMedestudenten)}
    className={`text-xs px-2 py-1 rounded transition-colors ${
      aanvraag.openVoorMedestudenten
        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`}
  >
    {aanvraag.openVoorMedestudenten ? '👩‍🎓 Open voor medestudenten' : 'Alleen voor mij'}
  </button>
)}
```

**Step 6: Implementeer `handleToggleOpenVoorMedestudenten`**

```typescript
const handleToggleOpenVoorMedestudenten = async (id: string, huidig: boolean) => {
  try {
    const response = await fetch('/api/student/aanvragen', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, openVoorMedestudenten: !huidig }),
    })
    if (!response.ok) throw new Error('Aanpassen mislukt')
    router.refresh()
  } catch (err) {
    console.error(err)
  }
}
```

**Step 7: Verifieer TypeScript**

```bash
npx tsc --noEmit
```

**Step 8: Commit**

```bash
git add "src/app/(dashboard)/student/aanvragen/AanvragenTable.tsx"
git commit -m "feat: student kan activiteit openstellen voor medestudenten"
```

---

## Task 8: Push naar GitHub

```bash
git push origin main
```

Verwacht: deployment triggert automatisch op Vercel/Azure.

---

## Verificatie na implementatie

1. Log in als student → dien aanvraag in met checkbox aangevinkt
2. Log in als docent → keur de aanvraag goed
3. Controleer: status in DB = `gepubliceerd`, inschrijving aangemaakt voor indiener
4. Log in als tweede student (zelfde opleiding) → prikbord toont de activiteit met amber badge
5. Tweede student schrijft in → inschrijving aangemaakt
6. Controleer bronfilter: `Medestudent` toont alleen amber kaarten
