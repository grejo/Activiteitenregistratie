-- AlterTable
-- Voegt een optionele einddatum en een optioneel aantal uren toe aan Activiteit,
-- zodat activiteiten die over meerdere dagen lopen (bv. 15u of 30u trajecten)
-- correct geregistreerd kunnen worden. `einddatum` is NULL voor activiteiten van
-- één dag; `einduur` blijft dan gelden op `datum`.
ALTER TABLE "Activiteit" ADD COLUMN "einddatum" TIMESTAMP(3);
ALTER TABLE "Activiteit" ADD COLUMN "aantalUren" DOUBLE PRECISION;
