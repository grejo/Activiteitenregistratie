CREATE TABLE "NiveauWijzigingLog" (
    "id" TEXT NOT NULL,
    "vanNiveau" INTEGER,
    "naarNiveau" INTEGER NOT NULL,
    "reden" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activiteitId" TEXT NOT NULL,
    "gewijzigdDoorId" TEXT NOT NULL,
    CONSTRAINT "NiveauWijzigingLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "NiveauWijzigingLog_activiteitId_idx" ON "NiveauWijzigingLog"("activiteitId");
ALTER TABLE "NiveauWijzigingLog" ADD CONSTRAINT "NiveauWijzigingLog_activiteitId_fkey" FOREIGN KEY ("activiteitId") REFERENCES "Activiteit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NiveauWijzigingLog" ADD CONSTRAINT "NiveauWijzigingLog_gewijzigdDoorId_fkey" FOREIGN KEY ("gewijzigdDoorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
