# Design: Student Archivering

**Datum:** 2026-04-15  
**Status:** Goedgekeurd

## Probleemstelling

Wanneer een student afstudeert, moeten de gegevens bewaard blijven in een archief. De detailgegevens (inschrijvingen, activiteiten, voortgang/scores) blijven beschikbaar voor de admin, maar de bewijsstukbestanden (foto's, pdf's) worden permanent verwijderd om opslagruimte vrij te maken.

## Beslissingen

- Archiveren wordt manueel getriggerd door een admin per student
- Alle inschrijvingen en activiteiten blijven zichtbaar, zonder bewijsstukbestanden
- Het account van de student wordt gedeactiveerd (kan niet meer inloggen)

## Datamodel

Eén nieuw veld op het `User` model:

```prisma
gearchiveerdOp  DateTime?
```

- `null` → niet gearchiveerd
- Datum aanwezig → gearchiveerd op die datum

Bij archivering worden ook ingesteld:
- `actief = false` → blokkeert login
- `gearchiveerdOp = now()` → markeert als gearchiveerd

Bestaande queries op `actief` blijven ongewijzigd werken. De UI gebruikt `gearchiveerdOp != null` om onderscheid te maken tussen "inactief" en "gearchiveerd".

## API

**Nieuw endpoint:** `POST /api/admin/studenten/[id]/archiveer`

Vereisten:
- Alleen toegankelijk voor admins
- Voert alle stappen uit in één Prisma-transactie

Stappen:
1. Haal alle `Bewijsstuk` records op van de student (via `Inschrijving`)
2. Verwijder elk bestand van schijf (`/public/uploads/bewijsstukken/`)
3. Verwijder alle `Bewijsstuk` records uit de database
4. Zet `actief = false` en `gearchiveerdOp = now()` op de `User`

Foutafhandeling:
- Als een bestand niet bestaat op schijf → doorgaan, niet blokkeren, wel loggen
- Als de database-transactie faalt → rollback, bestanden die al verwijderd zijn kunnen niet teruggeplaatst worden (acceptabel risico, wordt gedocumenteerd)

## UI

### Studentenlijst (admin)
- Extra filteroptie "Gearchiveerd" naast de bestaande filters (Actief / Inactief)
- Gearchiveerde studenten tonen een badge "Gearchiveerd" + de datum

### Studentendetail (admin)
- Aparte "Archiveer" knop naast de bestaande "Deactiveer" knop
- Bevestigingsdialoog vóór archivering: *"Alle bewijsstukken worden permanent verwijderd. Dit kan niet ongedaan gemaakt worden."*
- Na archivering: melding op de pagina dat bewijsstukken verwijderd zijn

### Wat blijft zichtbaar na archivering
- Alle inschrijvingen en activiteiten (volledig)
- Voortgang en scores per niveau
- Studentbasisgegevens (naam, email, opleiding)
- **Niet:** bewijsstukbestanden en hun metadata

## Niet in scope

- Automatisch archiveren op basis van datum
- Bulk-archivering van meerdere studenten tegelijk
- Export van bewijsstukken vóór verwijdering
- Dearchivering (ongedaan maken)
