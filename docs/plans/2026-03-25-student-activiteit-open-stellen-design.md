# Design: Student-activiteit openstellen voor medestudenten

**Datum:** 2026-03-25
**Status:** Goedgekeurd
**Aanpak:** Optie A — boolean veld `openVoorMedestudenten`

---

## Probleemstelling

Studenten kunnen momenteel een eigen activiteit indienen als aanvraag. Na goedkeuring door de docent is die activiteit alleen voor henzelf zichtbaar. Er is geen manier om medestudenten te laten inschrijven op een door een student georganiseerde activiteit.

---

## Oplossing

Voeg een opt-in veld toe waarmee de student aangeeft dat zijn activiteit ook voor andere studenten van dezelfde opleiding open staat. Na goedkeuring door de docent verschijnt de activiteit op het prikbord, visueel onderscheiden van docent-activiteiten.

---

## Scope

- Alleen studenten van **dezelfde opleiding** kunnen inschrijven
- De indiener is **automatisch ingeschreven** bij goedkeuring
- Keuze aanpasbaar zolang status `concept` of `in_review` is

---

## Wijzigingen per laag

### 1. Schema (`prisma/schema.prisma`)

```prisma
model Activiteit {
  // ... bestaande velden ...
  openVoorMedestudenten Boolean @default(false)  // NIEUW
}
```

Prisma-migratie vereist.

### 2. API — Student aanvragen (`POST /api/student/aanvragen`)

- Accepteer `openVoorMedestudenten: boolean` in request body
- Sla op bij aanmaken activiteit

### 3. API — Student aanvraag aanpassen (`PATCH /api/student/aanvragen/[id]`)

- Nieuw endpoint (of uitbreiding bestaand)
- Staat `openVoorMedestudenten` aanpassen toe zolang `status` in `['concept', 'in_review']`

### 4. API — Docent goedkeuring (`PATCH /api/docent/aanvragen/[id]`)

Bij goedkeuren van een student-aanvraag:

| `openVoorMedestudenten` | Actie |
|---|---|
| `false` | Status → `goedgekeurd` (huidig gedrag) |
| `true` | Status → `gepubliceerd` + auto-`Inschrijving` aanmaken voor indiener |

### 5. Prikbord query (`/student/prikbord/page.tsx`)

Voeg tweede OR-clause toe aan query:

```ts
OR: [
  // Docent-activiteiten (huidig)
  { typeAanvraag: 'docent', status: 'gepubliceerd' },
  // Student-activiteiten open voor medestudenten (nieuw)
  {
    typeAanvraag: 'student_aanvraag',
    status: 'gepubliceerd',
    openVoorMedestudenten: true,
    opleidingId: opleidingId,
  },
]
```

Indiener ziet zijn eigen activiteit **niet** (al ingeschreven, filter op `aangemaaktDoorId !== userId`).

### 6. Prikbord UI (`PrikbordTable.tsx`)

**Kaartonderscheid:**

| Bron | Badge | Kaartkader |
|---|---|---|
| Docent | `👨‍🏫 Docent` (blauw) | border-blue-200 |
| Medestudent | `👩‍🎓 Medestudent` (amber) | border-amber-300 + bg-amber-50 |

**Extra filteroptie:**
```
Alle | Docent | Medestudent
```

**Detailmodal:** toon "Georganiseerd door: [naam]" bij student-activiteiten.

### 7. Student aanvraagformulier (`AanvragenTable.tsx`)

- Checkbox onderaan het formulier: *"Mijn activiteit openstellen voor medestudenten van mijn opleiding"*
- Zichtbaar en aanpasbaar bij `status: concept` of `in_review`
- Disabled/verborgen bij `status: goedgekeurd` of `afgekeurd`

---

## Dataflow samenvatting

```
Student dient aanvraag in (openVoorMedestudenten = true)
  → status: in_review
  → Student kan keuze nog aanpassen

Docent keurt goed
  → status: gepubliceerd
  → Auto-inschrijving voor indiener aangemaakt
  → Activiteit verschijnt op prikbord (gefilterd op zelfde opleiding)
  → Andere studenten kunnen inschrijven

Overige studenten schrijven in → zelfde flow als docent-activiteit
  (deelname → bewijs → beoordeling → voortgang)
```

---

## Niet in scope

- Cross-opleiding activiteiten
- Student kan zelf andere studenten uitnodigen
- Wachtlijst bij volzette student-activiteiten
