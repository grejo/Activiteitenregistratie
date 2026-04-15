# Design: Docent-Opleiding Koppeling & Activiteiten Zichtbaarheid

**Datum:** 2026-04-15  
**Status:** Goedgekeurd

## Probleemstelling

1. Er bestaat geen UI om een docent aan een opleiding te koppelen. Het `DocentOpleiding` model bestaat al in de database, maar is enkel via read-only weergave zichtbaar op de opleidingenpagina.
2. Docenten kunnen activiteiten aanmaken zonder opleiding te kiezen (`opleidingId: null`), waardoor die activiteiten zichtbaar zijn voor studenten van **alle** opleidingen.

## Beslissingen

- Admin kan docenten koppelen vanuit zowel de opleidingenpagina als de docent-detailpagina.
- Docenten moeten altijd een opleiding kiezen bij het aanmaken van een activiteit — "alle opleidingen" is geen optie meer.
- Activiteiten zonder `opleidingId` van een docent worden niet meer aangemaakt.

---

## Deel 1: Docent-Opleiding Koppeling via Admin UI

### API

Twee nieuwe endpoints (schrijven naar `DocentOpleiding` tabel):

**`POST /api/admin/opleidingen/[id]/docenten`**
- Body: `{ docentId: string }`
- Maakt een `DocentOpleiding` record aan
- Valideert: docent bestaat, heeft role `docent`, is nog niet gekoppeld aan deze opleiding

**`DELETE /api/admin/opleidingen/[id]/docenten/[docentId]`**
- Verwijdert het `DocentOpleiding` record

### UI — Opleidingenpagina (`/admin/opleidingen`)

In de bestaande `OpleidingenGrid.tsx` modal — de read-only docentenlijst per opleiding wordt uitgebreid:
- Verwijderknop (×) per gekoppelde docent
- Dropdown "Docent toevoegen" met alle docenten die nog niet gekoppeld zijn aan deze opleiding
- "Toevoegen" knop

### UI — Docent-detailpagina (`/admin/users/[id]`)

In `EditUserForm.tsx`, nieuwe sectie "Opleidingen" zichtbaar enkel voor `role === 'docent'`:
- Lijst van gekoppelde opleidingen met verwijderknop
- Dropdown "Opleiding toevoegen" met alle actieve opleidingen die nog niet gekoppeld zijn
- "Toevoegen" knop

---

## Deel 2: Activiteiten Enkel voor Eigen Opleiding

### Formulier (`DocentActiviteitForm.tsx`)

- De opleiding-dropdown toont enkel de opleidingen waar de docent aan gekoppeld is
- `opleidingId` wordt verplicht (required validatie, zowel client- als server-side)
- De fallback "toon alle opleidingen als docent geen koppeling heeft" vervalt

### API (`POST /api/activiteiten` of gelijkaardig)

- Server-side: als `typeAanvraag === 'docent'` en `opleidingId` ontbreekt → 400 fout
- Server-side: docent mag enkel een opleiding kiezen waarvoor ze gekoppeld zijn

### Prikbord (`/student/prikbord/page.tsx`)

- De huidige query bevat `{ opleidingId: null }` als optie voor docent-activiteiten (zichtbaar voor iedereen)
- Dit wordt verwijderd: docent-activiteiten zijn enkel zichtbaar via `{ opleidingId: student.opleidingId }`

---

## Niet in scope

- `isCoordinator` vlag beheren via UI
- Docenten aan meerdere opleidingen koppelen in één handeling (bulk)
- Bestaande activiteiten met `opleidingId: null` retroactief toewijzen
