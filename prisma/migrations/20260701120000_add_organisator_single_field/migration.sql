-- Add unified organisator field
ALTER TABLE "Activiteit" ADD COLUMN "organisator" TEXT;

-- Backfill from the two deprecated columns: prefer combining both when present,
-- else fall back to whichever is filled in.
UPDATE "Activiteit"
SET "organisator" = NULLIF(
  TRIM(
    CONCAT_WS(
      ' / ',
      NULLIF(TRIM(COALESCE("organisatorPxl", '')), ''),
      NULLIF(TRIM(COALESCE("organisatorExtern", '')), '')
    )
  ),
  ''
)
WHERE "organisatorPxl" IS NOT NULL OR "organisatorExtern" IS NOT NULL;
