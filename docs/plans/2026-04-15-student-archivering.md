# Student Archivering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Een admin kan een afgestudeerde student archiveren: alle bewijsstukbestanden worden permanent verwijderd, de overige gegevens blijven bewaard, en het account wordt gedeactiveerd.

**Architecture:** Voeg `gearchiveerdOp DateTime?` toe aan het `User` model. Een nieuw API-endpoint `POST /api/admin/studenten/[id]/archiveer` verwijdert alle bewijsstukken van schijf + database en zet `actief = false` en `gearchiveerdOp = now()`. De admin-UI krijgt een "Archiveer" knop op de detailpagina en een extra filter in de studentenlijst.

**Tech Stack:** Next.js 15 App Router, Prisma ORM, PostgreSQL, TypeScript, Tailwind CSS

---

### Task 1: Prisma schema — voeg `gearchiveerdOp` toe aan User

**Files:**
- Modify: `prisma/schema.prisma:51` (na `actief` veld)

**Step 1: Voeg het veld toe**

In `prisma/schema.prisma`, voeg na `actief Boolean @default(true)` toe:
```prisma
gearchiveerdOp  DateTime?
```

Het User model ziet er daarna zo uit:
```prisma
model User {
  id             String    @id @default(uuid())
  email          String    @unique
  passwordHash   String?
  azureAdId      String?   @unique
  role           String
  naam           String
  actief         Boolean   @default(true)
  gearchiveerdOp DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  // ... rest unchanged
```

**Step 2: Maak de migratie aan**

```bash
npx prisma migrate dev --name add_gearchiveerd_op_to_user
```

Verwacht output: `The following migration(s) have been created and applied`

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: voeg gearchiveerdOp veld toe aan User model"
```

---

### Task 2: API endpoint — archiveer student

**Files:**
- Create: `src/app/api/admin/studenten/[id]/archiveer/route.ts`

**Step 1: Maak de map aan en schrijf het endpoint**

```typescript
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (session?.user.role !== 'admin') {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 })
    }

    const { id } = await params

    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        inschrijvingen: {
          include: {
            bewijsstukken: true,
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student niet gevonden' }, { status: 404 })
    }

    if (student.gearchiveerdOp) {
      return NextResponse.json({ error: 'Student is al gearchiveerd' }, { status: 400 })
    }

    // Verzamel alle bewijsstukken
    const alleBewijsstukken = student.inschrijvingen.flatMap((i) => i.bewijsstukken)

    // Verwijder bestanden van schijf
    for (const bewijs of alleBewijsstukken) {
      try {
        const filePath = path.join(process.cwd(), 'public', bewijs.bestandspad)
        await unlink(filePath)
      } catch (fileError) {
        console.error(`Bestand niet gevonden of al verwijderd: ${bewijs.bestandspad}`, fileError)
        // Doorgaan ook als bestand niet bestaat
      }
    }

    // Verwijder database-records en archiveer student in één transactie
    await prisma.$transaction([
      prisma.bewijsstuk.deleteMany({
        where: {
          inschrijving: {
            studentId: id,
          },
        },
      }),
      prisma.user.update({
        where: { id },
        data: {
          actief: false,
          gearchiveerdOp: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      verwijderdeBewijsstukken: alleBewijsstukken.length,
    })
  } catch (error) {
    console.error('Error archiving student:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het archiveren' },
      { status: 500 }
    )
  }
}
```

**Step 2: Controleer of het endpoint bereikbaar is**

Start de dev server en controleer via de browser of `POST /api/admin/studenten/[id]/archiveer` een 401 teruggeeft als je niet ingelogd bent.

**Step 3: Commit**

```bash
git add src/app/api/admin/studenten/[id]/archiveer/route.ts
git commit -m "feat: voeg archiveer API endpoint toe voor studenten"
```

---

### Task 3: Student detailpagina — voeg "Archiveer" knop toe

**Files:**
- Modify: `src/app/(dashboard)/admin/users/[id]/EditUserForm.tsx`

**Step 1: Voeg `gearchiveerdOp` toe aan het User type**

Bovenaan de component, pas de `user` prop-type aan. Zoek het type-definitie van `user` (rond lijn 1-30) en voeg het veld toe:
```typescript
gearchiveerdOp: string | null
```

**Step 2: Voeg archiveer-state toe**

Na de bestaande `useState` declaraties (rond lijn 15-20), voeg toe:
```typescript
const [showArchiveerConfirm, setShowArchiveerConfirm] = useState(false)
const [isArchivering, setIsArchivering] = useState(false)
```

**Step 3: Voeg de `handleArchiveer` functie toe**

Na de bestaande `handleDelete` functie, voeg toe:
```typescript
const handleArchiveer = async () => {
  setIsArchivering(true)
  try {
    const res = await fetch(`/api/admin/studenten/${user.id}/archiveer`, {
      method: 'POST',
    })
    if (res.ok) {
      router.push('/admin/studenten')
      router.refresh()
    } else {
      const data = await res.json()
      alert(data.error || 'Er is een fout opgetreden')
    }
  } catch {
    alert('Er is een fout opgetreden')
  } finally {
    setIsArchivering(false)
  }
}
```

**Step 4: Voeg de Archiveer-sectie toe in de JSX**

Voeg vóór de "Gevaarlijke Zone" sectie (voor de `<div className="pt-6 border-t...">` met de delete-knop, rond lijn 250) een nieuwe sectie toe:

```tsx
{/* Archiveer sectie — alleen voor studenten die nog niet gearchiveerd zijn */}
{user.role === 'student' && !user.gearchiveerdOp && (
  <div className="pt-6 border-t border-gray-200">
    <h3 className="text-lg font-medium text-amber-600 mb-2">Student Archiveren</h3>
    <p className="text-sm text-gray-600 mb-4">
      Archiveer deze student na het afstuderen. Alle bewijsstukken worden permanent
      verwijderd. De overige gegevens blijven bewaard.
    </p>
    {!showArchiveerConfirm ? (
      <button
        type="button"
        onClick={() => setShowArchiveerConfirm(true)}
        className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
        disabled={isLoading}
      >
        Student Archiveren
      </button>
    ) : (
      <div className="bg-amber-50 border border-amber-200 p-4 rounded space-y-3">
        <p className="text-sm text-amber-800 font-medium">
          Weet je zeker dat je deze student wilt archiveren?
        </p>
        <p className="text-sm text-amber-700">
          Alle bewijsstukbestanden (foto&apos;s, pdf&apos;s) worden permanent verwijderd.
          Dit kan niet ongedaan gemaakt worden. De overige gegevens blijven bewaard.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleArchiveer}
            disabled={isArchivering}
            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
          >
            {isArchivering ? 'Bezig...' : 'Ja, Archiveren'}
          </button>
          <button
            type="button"
            onClick={() => setShowArchiveerConfirm(false)}
            disabled={isArchivering}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Annuleren
          </button>
        </div>
      </div>
    )}
  </div>
)}

{/* Toon badge als student al gearchiveerd is */}
{user.gearchiveerdOp && (
  <div className="pt-6 border-t border-gray-200">
    <div className="bg-gray-50 border border-gray-200 p-4 rounded">
      <p className="text-sm text-gray-700 font-medium">
        Deze student is gearchiveerd op{' '}
        {new Date(user.gearchiveerdOp).toLocaleDateString('nl-BE', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
        .
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Alle bewijsstukken zijn verwijderd. De overige gegevens blijven bewaard.
      </p>
    </div>
  </div>
)}
```

**Step 5: Commit**

```bash
git add src/app/(dashboard)/admin/users/[id]/EditUserForm.tsx
git commit -m "feat: voeg archiveer knop toe op student detailpagina"
```

---

### Task 4: Studentenlijst — voeg `gearchiveerdOp` toe aan data en types

**Files:**
- Modify: `src/app/(dashboard)/admin/studenten/page.tsx`
- Modify: `src/app/(dashboard)/admin/studenten/AdminStudentenTable.tsx`

**Step 1: Voeg `gearchiveerdOp` toe aan de Prisma-query in `page.tsx`**

Het veld `gearchiveerdOp` is automatisch aanwezig via `findMany` (Prisma selecteert alle scalaire velden). Voeg wel de serialisatie toe in de `map`-functie (rond lijn 49-63):

```typescript
return studenten.map((s) => ({
  ...s,
  createdAt: s.createdAt.toISOString(),
  updatedAt: s.updatedAt.toISOString(),
  gearchiveerdOp: s.gearchiveerdOp?.toISOString() || null,  // <-- toevoegen
  inschrijvingen: s.inschrijvingen.map((i) => ({
    // ... rest unchanged
  })),
}))
```

**Step 2: Pas het `Student` type aan in `AdminStudentenTable.tsx`**

Voeg `gearchiveerdOp: string | null` toe aan het `Student` type (rond lijn 19-33):
```typescript
type Student = {
  id: string
  naam: string
  email: string
  actief: boolean
  gearchiveerdOp: string | null  // <-- toevoegen
  createdAt: string
  // ... rest unchanged
}
```

**Step 3: Pas de statusfilter logica aan (lijn 65-69)**

Vervang de bestaande filter logica:
```typescript
if (statusFilter !== 'all') {
  filtered = filtered.filter((s) =>
    statusFilter === 'actief' ? s.actief : !s.actief
  )
}
```

Door:
```typescript
if (statusFilter !== 'all') {
  filtered = filtered.filter((s) => {
    if (statusFilter === 'actief') return s.actief
    if (statusFilter === 'gearchiveerd') return !!s.gearchiveerdOp
    if (statusFilter === 'inactief') return !s.actief && !s.gearchiveerdOp
    return true
  })
}
```

**Step 4: Voeg "Gearchiveerd" optie toe aan de filter-dropdown**

Zoek de `<select>` voor statusfilter (rond lijn 172-182) en voeg een optie toe:
```tsx
<option value="all">Alle</option>
<option value="actief">Actief</option>
<option value="inactief">Inactief</option>
<option value="gearchiveerd">Gearchiveerd</option>  {/* <-- toevoegen */}
```

**Step 5: Voeg "Gearchiveerd" stat toe en pas badge aan**

In de `stats` berekening (rond lijn 94-101), voeg toe:
```typescript
const stats = useMemo(() => {
  const totalStudenten = studenten.length
  const actiefStudenten = studenten.filter((s) => s.actief).length
  const gearchiveerdStudenten = studenten.filter((s) => !!s.gearchiveerdOp).length  // <-- toevoegen
  const totalDeelnames = studenten.reduce((sum, s) => sum + s._count.inschrijvingen, 0)
  const zonderOpleiding = studenten.filter((s) => !s.opleiding).length
  return { totalStudenten, actiefStudenten, gearchiveerdStudenten, totalDeelnames, zonderOpleiding }
}, [studenten])
```

**Step 6: Pas de statusbadge aan per rij**

Zoek de badge-weergave (rond lijn 240-250) en pas aan:
```tsx
{s.gearchiveerdOp ? (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
    Gearchiveerd
  </span>
) : s.actief ? (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
    Actief
  </span>
) : (
  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
    Inactief
  </span>
)}
```

**Step 7: Commit**

```bash
git add src/app/(dashboard)/admin/studenten/page.tsx src/app/(dashboard)/admin/studenten/AdminStudentenTable.tsx
git commit -m "feat: voeg gearchiveerd filter en badge toe in studentenlijst"
```

---

### Task 5: User detailpagina — zorg dat `gearchiveerdOp` doorgegeven wordt

**Files:**
- Modify: `src/app/(dashboard)/admin/users/[id]/page.tsx` (of gelijkaardig server component dat `EditUserForm` rendert)

**Step 1: Zoek het server component**

```bash
find src/app -path "*/admin/users/*/page.tsx" | head -5
```

**Step 2: Controleer of `gearchiveerdOp` in de Prisma-query staat**

Prisma selecteert standaard alle scalaire velden, dus `gearchiveerdOp` zit automatisch in het resultaat. Controleer alleen of het serialiseerd wordt (`.toISOString()`) als het als prop doorgegeven wordt. Voeg toe indien nodig:
```typescript
gearchiveerdOp: user.gearchiveerdOp?.toISOString() || null,
```

**Step 3: Commit enkel als er wijzigingen zijn**

```bash
git add src/app/(dashboard)/admin/users/[id]/page.tsx
git commit -m "fix: geef gearchiveerdOp door aan EditUserForm"
```

---

### Task 6: Handmatig testen

**Step 1: Start de dev server**
```bash
npm run dev
```

**Step 2: Test het archiveerproces**

1. Ga naar `/admin/studenten`
2. Klik op een teststudent met bewijsstukken
3. Klik op "Student Archiveren"
4. Bevestig in de dialoog
5. Controleer dat je teruggeleid wordt naar de studentenlijst
6. Controleer dat de student badge "Gearchiveerd" toont
7. Controleer dat de bewijsstukbestanden verdwenen zijn uit `/public/uploads/bewijsstukken/`
8. Ga terug naar de detailpagina: bevestig dat de gearchiveerd-melding zichtbaar is en de archiveer-knop weg is

**Step 3: Test de filter**

1. Ga naar `/admin/studenten`
2. Selecteer filter "Gearchiveerd"
3. Bevestig dat alleen gearchiveerde studenten getoond worden

**Step 4: Commit (geen code-wijzigingen, enkel als er fixes nodig waren)**
