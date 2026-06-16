-- AlterTable
ALTER TABLE "Bewijsstuk" ADD COLUMN     "bestandVerwijderdOp" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Opleiding" ADD COLUMN     "niveau1Beschrijving" TEXT,
ADD COLUMN     "niveau2Beschrijving" TEXT,
ADD COLUMN     "niveau3Beschrijving" TEXT,
ADD COLUMN     "niveau4Beschrijving" TEXT;

-- CreateTable
CREATE TABLE "OpleidingCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "omschrijving" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opleidingId" TEXT NOT NULL,

    CONSTRAINT "OpleidingCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminOpleiding" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adminId" TEXT NOT NULL,
    "opleidingId" TEXT NOT NULL,

    CONSTRAINT "AdminOpleiding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiviteitOpleiding" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activiteitId" TEXT NOT NULL,
    "opleidingId" TEXT NOT NULL,

    CONSTRAINT "ActiviteitOpleiding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpleidingCode_code_key" ON "OpleidingCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AdminOpleiding_adminId_opleidingId_key" ON "AdminOpleiding"("adminId", "opleidingId");

-- CreateIndex
CREATE INDEX "ActiviteitOpleiding_opleidingId_idx" ON "ActiviteitOpleiding"("opleidingId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiviteitOpleiding_activiteitId_opleidingId_key" ON "ActiviteitOpleiding"("activiteitId", "opleidingId");

-- AddForeignKey
ALTER TABLE "OpleidingCode" ADD CONSTRAINT "OpleidingCode_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminOpleiding" ADD CONSTRAINT "AdminOpleiding_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminOpleiding" ADD CONSTRAINT "AdminOpleiding_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiviteitOpleiding" ADD CONSTRAINT "ActiviteitOpleiding_activiteitId_fkey" FOREIGN KEY ("activiteitId") REFERENCES "Activiteit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiviteitOpleiding" ADD CONSTRAINT "ActiviteitOpleiding_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

