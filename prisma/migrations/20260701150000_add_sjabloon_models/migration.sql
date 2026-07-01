CREATE TABLE "Sjabloon" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "beschrijving" TEXT,
    "bestandspad" TEXT,
    "bestandsnaam" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opleidingId" TEXT NOT NULL,
    CONSTRAINT "Sjabloon_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "Sjabloon" ADD CONSTRAINT "Sjabloon_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ActiviteitSjabloon" (
    "activiteitId" TEXT NOT NULL,
    "sjabloonId" TEXT NOT NULL,
    "verplicht" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActiviteitSjabloon_pkey" PRIMARY KEY ("activiteitId","sjabloonId")
);
CREATE INDEX "ActiviteitSjabloon_sjabloonId_idx" ON "ActiviteitSjabloon"("sjabloonId");
ALTER TABLE "ActiviteitSjabloon" ADD CONSTRAINT "ActiviteitSjabloon_activiteitId_fkey" FOREIGN KEY ("activiteitId") REFERENCES "Activiteit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActiviteitSjabloon" ADD CONSTRAINT "ActiviteitSjabloon_sjabloonId_fkey" FOREIGN KEY ("sjabloonId") REFERENCES "Sjabloon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
