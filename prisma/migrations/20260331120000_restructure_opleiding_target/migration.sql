-- Herstructureer OpleidingTarget: verwijder per-beentje niveau kolommen,
-- voeg totaal-per-niveau doelen + per-beentje vereist booleans toe

-- Voeg nieuwe kolommen toe
ALTER TABLE "OpleidingTarget"
  ADD COLUMN "doelNiveau1"              INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "doelNiveau2"              INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "doelNiveau3"              INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "doelNiveau4"              INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "passieVereist"            BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "ondernemendVereist"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "samenwerkingVereist"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "multidisciplinairVereist" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reflectieVereist"         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "duurzaamheidVereist"      BOOLEAN NOT NULL DEFAULT false;

-- Verwijder oude per-beentje niveau kolommen
ALTER TABLE "OpleidingTarget"
  DROP COLUMN IF EXISTS "aantalPassieN1",
  DROP COLUMN IF EXISTS "aantalPassieN2",
  DROP COLUMN IF EXISTS "aantalPassieN3",
  DROP COLUMN IF EXISTS "aantalPassieN4",
  DROP COLUMN IF EXISTS "aantalOndernemendN1",
  DROP COLUMN IF EXISTS "aantalOndernemendN2",
  DROP COLUMN IF EXISTS "aantalOndernemendN3",
  DROP COLUMN IF EXISTS "aantalOndernemendN4",
  DROP COLUMN IF EXISTS "aantalSamenwerkingN1",
  DROP COLUMN IF EXISTS "aantalSamenwerkingN2",
  DROP COLUMN IF EXISTS "aantalSamenwerkingN3",
  DROP COLUMN IF EXISTS "aantalSamenwerkingN4",
  DROP COLUMN IF EXISTS "aantalMultidisciplinairN1",
  DROP COLUMN IF EXISTS "aantalMultidisciplinairN2",
  DROP COLUMN IF EXISTS "aantalMultidisciplinairN3",
  DROP COLUMN IF EXISTS "aantalMultidisciplinairN4",
  DROP COLUMN IF EXISTS "aantalReflectieN1",
  DROP COLUMN IF EXISTS "aantalReflectieN2",
  DROP COLUMN IF EXISTS "aantalReflectieN3",
  DROP COLUMN IF EXISTS "aantalReflectieN4";
