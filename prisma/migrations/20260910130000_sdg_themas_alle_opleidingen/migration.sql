-- DataMigration
-- Zorgt dat elke opleiding alle 17 duurzame-ontwikkelingsdoelstellingen (SDG's)
-- als duurzaamheidsthema heeft, in plaats van de handmatig gekozen deelverzameling
-- die tot nu toe geseed werd. Idempotent: opnieuw draaien geeft geen duplicaten.
--
-- Stap 1: bestaande thema's die al "SDG <n>" heten krijgen de officiële naam,
--         de volgorde = SDG-nummer, en worden actief gezet. Koppelingen naar
--         ActiviteitDuurzaamheid blijven intact (die verwijzen naar het id).
-- Stap 2: als een opleiding voor eenzelfde SDG per ongeluk meerdere thema's
--         heeft (bv. door eerdere handmatige seeds), wordt de oudste bewaard;
--         koppelingen worden verplaatst en de overtollige rij(en) verwijderd.
-- Stap 3: voor elke opleiding × SDG waarvoor nog geen thema bestaat, wordt er
--         één aangemaakt.
-- Stap 4: overige (niet-SDG) thema's blijven bestaan, maar komen na de 17 SDG's
--         te staan door er 100 bij hun volgorde op te tellen.

WITH sdg_lijst("nummer", "naam", "icoon") AS (
  VALUES
    (1,  'SDG 1 - Geen armoede', '🚫'),
    (2,  'SDG 2 - Geen honger', '🌾'),
    (3,  'SDG 3 - Goede gezondheid en welzijn', '❤️'),
    (4,  'SDG 4 - Kwaliteitsonderwijs', '📚'),
    (5,  'SDG 5 - Gendergelijkheid', '⚧️'),
    (6,  'SDG 6 - Schoon water en sanitair', '💧'),
    (7,  'SDG 7 - Betaalbare en duurzame energie', '⚡'),
    (8,  'SDG 8 - Waardig werk en economische groei', '📈'),
    (9,  'SDG 9 - Industrie, innovatie en infrastructuur', '🏭'),
    (10, 'SDG 10 - Ongelijkheid verminderen', '⚖️'),
    (11, 'SDG 11 - Duurzame steden en gemeenschappen', '🏙️'),
    (12, 'SDG 12 - Verantwoorde consumptie en productie', '♻️'),
    (13, 'SDG 13 - Klimaatactie', '🌍'),
    (14, 'SDG 14 - Leven in het water', '🐟'),
    (15, 'SDG 15 - Leven op het land', '🌳'),
    (16, 'SDG 16 - Vrede, justitie en sterke publieke diensten', '🕊️'),
    (17, 'SDG 17 - Partnerschap om doelstellingen te bereiken', '🤝')
)

-- Stap 1: bestaande "SDG <n>"-thema's normaliseren
UPDATE "DuurzaamheidsThema" dt
SET
  "naam" = s."naam",
  "icoon" = s."icoon",
  "volgorde" = s."nummer",
  "actief" = true
FROM sdg_lijst s
WHERE dt."naam" ~ ('^SDG\s+' || s."nummer" || '\y');

-- Stap 2: dubbele SDG-thema's binnen een opleiding samenvoegen (oudste id wint)
WITH gerangschikt AS (
  SELECT
    "id",
    "opleidingId",
    "naam",
    row_number() OVER (PARTITION BY "opleidingId", "naam" ORDER BY "id") AS rn
  FROM "DuurzaamheidsThema"
  WHERE "naam" ~ '^SDG\s+\d+\y'
),
dubbels AS (
  SELECT g."id" AS dup_id, keeper."id" AS keeper_id
  FROM gerangschikt g
  JOIN gerangschikt keeper
    ON keeper."opleidingId" = g."opleidingId" AND keeper."naam" = g."naam" AND keeper.rn = 1
  WHERE g.rn > 1
)
UPDATE "ActiviteitDuurzaamheid" ad
SET "duurzaamheidId" = d.keeper_id
FROM dubbels d
WHERE ad."duurzaamheidId" = d.dup_id
  AND NOT EXISTS (
    SELECT 1 FROM "ActiviteitDuurzaamheid" ad2
    WHERE ad2."activiteitId" = ad."activiteitId" AND ad2."duurzaamheidId" = d.keeper_id
  );

WITH gerangschikt AS (
  SELECT
    "id",
    "opleidingId",
    "naam",
    row_number() OVER (PARTITION BY "opleidingId", "naam" ORDER BY "id") AS rn
  FROM "DuurzaamheidsThema"
  WHERE "naam" ~ '^SDG\s+\d+\y'
)
-- De cascade op ActiviteitDuurzaamheid.duurzaamheidId ruimt automatisch de
-- resterende koppelingen op die hierboven niet konden verplaatsen (want de
-- activiteit was al aan de bewaarde rij gekoppeld).
DELETE FROM "DuurzaamheidsThema"
WHERE "id" IN (SELECT "id" FROM gerangschikt WHERE rn > 1);

-- Stap 3: ontbrekende SDG-thema's per opleiding aanmaken
WITH sdg_lijst("nummer", "naam", "icoon") AS (
  VALUES
    (1,  'SDG 1 - Geen armoede', '🚫'),
    (2,  'SDG 2 - Geen honger', '🌾'),
    (3,  'SDG 3 - Goede gezondheid en welzijn', '❤️'),
    (4,  'SDG 4 - Kwaliteitsonderwijs', '📚'),
    (5,  'SDG 5 - Gendergelijkheid', '⚧️'),
    (6,  'SDG 6 - Schoon water en sanitair', '💧'),
    (7,  'SDG 7 - Betaalbare en duurzame energie', '⚡'),
    (8,  'SDG 8 - Waardig werk en economische groei', '📈'),
    (9,  'SDG 9 - Industrie, innovatie en infrastructuur', '🏭'),
    (10, 'SDG 10 - Ongelijkheid verminderen', '⚖️'),
    (11, 'SDG 11 - Duurzame steden en gemeenschappen', '🏙️'),
    (12, 'SDG 12 - Verantwoorde consumptie en productie', '♻️'),
    (13, 'SDG 13 - Klimaatactie', '🌍'),
    (14, 'SDG 14 - Leven in het water', '🐟'),
    (15, 'SDG 15 - Leven op het land', '🌳'),
    (16, 'SDG 16 - Vrede, justitie en sterke publieke diensten', '🕊️'),
    (17, 'SDG 17 - Partnerschap om doelstellingen te bereiken', '🤝')
)
INSERT INTO "DuurzaamheidsThema" ("id", "naam", "icoon", "volgorde", "actief", "opleidingId")
SELECT
  gen_random_uuid()::text,
  s."naam",
  s."icoon",
  s."nummer",
  true,
  o."id"
FROM "Opleiding" o
CROSS JOIN sdg_lijst s
WHERE NOT EXISTS (
  SELECT 1 FROM "DuurzaamheidsThema" dt
  WHERE dt."opleidingId" = o."id"
    AND dt."naam" ~ ('^SDG\s+' || s."nummer" || '\y')
);

-- Stap 4: niet-SDG-thema's na de 17 SDG's laten staan
UPDATE "DuurzaamheidsThema"
SET "volgorde" = "volgorde" + 100
WHERE "naam" !~ '^SDG\s+\d+\y';
