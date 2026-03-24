# X-Factor Beentjes Redesign

**Datum:** 2026-03-24
**Status:** Goedgekeurd

## Context

Op basis van een departementaal besluit wordt het scoringssysteem herzien:
- Van **uren** naar **aantallen activiteiten**
- Van docent-rubric evaluatie naar **student-gekozen beentje + niveau**
- 4 standaard X-factor beentjes + 1 Reflectie beentje (altijd actief)
- 4 niveaus (1 t/m 4), targets per beentje per niveau per opleiding

## Beentjes

| Enum waarde       | Weergavenaam               |
|-------------------|----------------------------|
| PASSIE            | (Em)passie                 |
| ONDERNEMEND       | Ondernemend en innovatief  |
| SAMENWERKING      | (Internationaal) samenwerking |
| MULTIDISCIPLINAIR | Multi- & disciplinariteit  |
| REFLECTIE         | Reflectie                  |

## Databasiswijzigingen

### Verwijderd
- `EvaluatieRubric`, `RubricSectie`, `RubricCriterium`, `RubricNiveau`, `RubricNiveauBeschrijving`
- `ActiviteitEvaluatie`
- `StudentUrenVoortgang`, `StudentCriteriumUren`
- `OpleidingUrenTarget`

### Aangepast: `Activiteit`
- `beentje` toegevoegd: enum `Beentje` (PASSIE | ONDERNEMEND | SAMENWERKING | MULTIDISCIPLINAIR | REFLECTIE)
- `niveau` blijft: Int 1–4
- Alle uren-velden verwijderd

### Nieuw: `OpleidingTarget`
Targets per opleiding per schooljaar — 20 velden (5 beentjes × 4 niveaus):
```
opleidingId + schooljaar (uniek)
aantalPassieN1..N4
aantalOndernemendN1..N4
aantalSamenwerkingN1..N4
aantalMultidisciplinairN1..N4
aantalReflectieN1..N4
```

### Nieuw: `StudentVoortgang`
Voortgang per student per schooljaar — 20 tellers:
```
studentId + schooljaar (uniek)
aantalPassieN1..N4
aantalOndernemendN1..N4
aantalSamenwerkingN1..N4
aantalMultidisciplinairN1..N4
aantalReflectieN1..N4
```

## UI-wijzigingen

### Student — Activiteit aanmaken/bewerken
- Dropdown "Beentje": 5 opties
- Dropdown "Niveau": 1 / 2 / 3 / 4
- Geen uren-velden meer

### Docent — Aanvraag valideren
- Toont gekozen beentje + niveau van student
- Docent kan beide aanpassen vóór goedkeuring

### Scorekaart (student/docent/admin)
- 5 blokken, één per beentje
- Per blok: 4 balken (N1–N4), elk `X / Y activiteiten`
- Target Y = opleiding-specifiek, 0 = balk niet tonen
- Totaaloverzicht bovenaan: behaalde beentjes

### Admin — Opleiding instellingen
- 5×4 grid voor targets (rijen = beentjes, kolommen = niveaus)
- Per schooljaar instelbaar

## Logica

### `recalculateStudentVoortgang` (vervangt `recalculateStudentUren`)
1. Haal alle goedgekeurde inschrijvingen op van student voor schooljaar
2. Tel per `beentje` + `niveau` combinatie
3. Sla op in `StudentVoortgang`

**Triggers:**
- Inschrijving goedgekeurd (bewijsstuk + aanwezigheid)
- Docent past beentje/niveau aan op activiteit → herberekening voor alle ingeschreven studenten

## Seed data (nieuw)
- Voorbeeldtargets Bouwkunde: N1=3, N2=2, N3=1, N4=1 per beentje
- Demo-activiteiten krijgen beentje + niveau toegewezen
