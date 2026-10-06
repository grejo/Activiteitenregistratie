-- AlterTable
-- Bewaart wie een studentaanvraag goed- of afkeurde en wanneer, zodat
-- docenten/admins hun historiek kunnen raadplegen op de Aanvragen-pagina.
ALTER TABLE "Activiteit" ADD COLUMN "beoordeeldDoorId" TEXT;
ALTER TABLE "Activiteit" ADD COLUMN "beoordeeldOp" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Activiteit_beoordeeldDoorId_beoordeeldOp_idx" ON "Activiteit"("beoordeeldDoorId", "beoordeeldOp");

-- AddForeignKey
ALTER TABLE "Activiteit" ADD CONSTRAINT "Activiteit_beoordeeldDoorId_fkey" FOREIGN KEY ("beoordeeldDoorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
