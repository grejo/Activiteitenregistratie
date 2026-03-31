-- CreateTable
CREATE TABLE "OpleidingTarget" (
    "id" TEXT NOT NULL,
    "schooljaar" TEXT NOT NULL,
    "aantalPassieN1" INTEGER NOT NULL DEFAULT 0,
    "aantalPassieN2" INTEGER NOT NULL DEFAULT 0,
    "aantalPassieN3" INTEGER NOT NULL DEFAULT 0,
    "aantalPassieN4" INTEGER NOT NULL DEFAULT 0,
    "aantalOndernemendN1" INTEGER NOT NULL DEFAULT 0,
    "aantalOndernemendN2" INTEGER NOT NULL DEFAULT 0,
    "aantalOndernemendN3" INTEGER NOT NULL DEFAULT 0,
    "aantalOndernemendN4" INTEGER NOT NULL DEFAULT 0,
    "aantalSamenwerkingN1" INTEGER NOT NULL DEFAULT 0,
    "aantalSamenwerkingN2" INTEGER NOT NULL DEFAULT 0,
    "aantalSamenwerkingN3" INTEGER NOT NULL DEFAULT 0,
    "aantalSamenwerkingN4" INTEGER NOT NULL DEFAULT 0,
    "aantalMultidisciplinairN1" INTEGER NOT NULL DEFAULT 0,
    "aantalMultidisciplinairN2" INTEGER NOT NULL DEFAULT 0,
    "aantalMultidisciplinairN3" INTEGER NOT NULL DEFAULT 0,
    "aantalMultidisciplinairN4" INTEGER NOT NULL DEFAULT 0,
    "aantalReflectieN1" INTEGER NOT NULL DEFAULT 0,
    "aantalReflectieN2" INTEGER NOT NULL DEFAULT 0,
    "aantalReflectieN3" INTEGER NOT NULL DEFAULT 0,
    "aantalReflectieN4" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opleidingId" TEXT NOT NULL,

    CONSTRAINT "OpleidingTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentVoortgang" (
    "id" TEXT NOT NULL,
    "schooljaar" TEXT NOT NULL,
    "aantalPassieN1" INTEGER NOT NULL DEFAULT 0,
    "aantalPassieN2" INTEGER NOT NULL DEFAULT 0,
    "aantalPassieN3" INTEGER NOT NULL DEFAULT 0,
    "aantalPassieN4" INTEGER NOT NULL DEFAULT 0,
    "aantalOndernemendN1" INTEGER NOT NULL DEFAULT 0,
    "aantalOndernemendN2" INTEGER NOT NULL DEFAULT 0,
    "aantalOndernemendN3" INTEGER NOT NULL DEFAULT 0,
    "aantalOndernemendN4" INTEGER NOT NULL DEFAULT 0,
    "aantalSamenwerkingN1" INTEGER NOT NULL DEFAULT 0,
    "aantalSamenwerkingN2" INTEGER NOT NULL DEFAULT 0,
    "aantalSamenwerkingN3" INTEGER NOT NULL DEFAULT 0,
    "aantalSamenwerkingN4" INTEGER NOT NULL DEFAULT 0,
    "aantalMultidisciplinairN1" INTEGER NOT NULL DEFAULT 0,
    "aantalMultidisciplinairN2" INTEGER NOT NULL DEFAULT 0,
    "aantalMultidisciplinairN3" INTEGER NOT NULL DEFAULT 0,
    "aantalMultidisciplinairN4" INTEGER NOT NULL DEFAULT 0,
    "aantalReflectieN1" INTEGER NOT NULL DEFAULT 0,
    "aantalReflectieN2" INTEGER NOT NULL DEFAULT 0,
    "aantalReflectieN3" INTEGER NOT NULL DEFAULT 0,
    "aantalReflectieN4" INTEGER NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "opleidingId" TEXT NOT NULL,

    CONSTRAINT "StudentVoortgang_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OpleidingTarget_opleidingId_schooljaar_key" ON "OpleidingTarget"("opleidingId", "schooljaar");

-- CreateIndex
CREATE UNIQUE INDEX "StudentVoortgang_studentId_schooljaar_key" ON "StudentVoortgang"("studentId", "schooljaar");

-- AddForeignKey
ALTER TABLE "OpleidingTarget" ADD CONSTRAINT "OpleidingTarget_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentVoortgang" ADD CONSTRAINT "StudentVoortgang_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentVoortgang" ADD CONSTRAINT "StudentVoortgang_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE CASCADE ON UPDATE CASCADE;
