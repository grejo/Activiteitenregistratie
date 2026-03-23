-- CreateTable
CREATE TABLE "Opleiding" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "beschrijving" TEXT,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "autoGoedkeuringStudentActiviteiten" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opleiding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "azureAdId" TEXT,
    "role" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opleidingId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocentOpleiding" (
    "id" TEXT NOT NULL,
    "isCoordinator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "docentId" TEXT NOT NULL,
    "opleidingId" TEXT NOT NULL,

    CONSTRAINT "DocentOpleiding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpersonationLog" (
    "id" TEXT NOT NULL,
    "actie" TEXT NOT NULL,
    "details" TEXT,
    "ipAdres" TEXT,
    "userAgent" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,

    CONSTRAINT "ImpersonationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuurzaamheidsThema" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "beschrijving" TEXT,
    "icoon" TEXT,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opleidingId" TEXT NOT NULL,

    CONSTRAINT "DuurzaamheidsThema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluatieRubric" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "beschrijving" TEXT,
    "schooljaar" TEXT,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opleidingId" TEXT NOT NULL,

    CONSTRAINT "EvaluatieRubric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricSectie" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "gewichtPercentage" DOUBLE PRECISION NOT NULL,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rubricId" TEXT NOT NULL,

    CONSTRAINT "RubricSectie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricNiveau" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "scoreWaarde" DOUBLE PRECISION,
    "multiplicator" DOUBLE PRECISION,
    "volgorde" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rubricId" TEXT NOT NULL,

    CONSTRAINT "RubricNiveau_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricCriterium" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "gewichtPercentage" DOUBLE PRECISION NOT NULL,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sectieId" TEXT NOT NULL,

    CONSTRAINT "RubricCriterium_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricNiveauBeschrijving" (
    "id" TEXT NOT NULL,
    "beschrijving" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "criteriumId" TEXT NOT NULL,
    "niveauId" TEXT NOT NULL,

    CONSTRAINT "RubricNiveauBeschrijving_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activiteit" (
    "id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "typeActiviteit" TEXT NOT NULL,
    "aard" TEXT,
    "omschrijving" TEXT,
    "datum" TIMESTAMP(3) NOT NULL,
    "startuur" TEXT NOT NULL,
    "einduur" TEXT NOT NULL,
    "locatie" TEXT,
    "weblink" TEXT,
    "organisatorPxl" TEXT,
    "organisatorExtern" TEXT,
    "bewijslink" TEXT,
    "verplichtProfiel" TEXT,
    "maxPlaatsen" INTEGER,
    "aantalIngeschreven" INTEGER NOT NULL DEFAULT 0,
    "niveau" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'concept',
    "opmerkingen" TEXT,
    "typeAanvraag" TEXT NOT NULL,
    "afgekeurdBekekenOp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aangemaaktDoorId" TEXT NOT NULL,
    "opleidingId" TEXT,

    CONSTRAINT "Activiteit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiviteitDuurzaamheid" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activiteitId" TEXT NOT NULL,
    "duurzaamheidId" TEXT NOT NULL,

    CONSTRAINT "ActiviteitDuurzaamheid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActiviteitEvaluatie" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activiteitId" TEXT NOT NULL,
    "criteriumId" TEXT NOT NULL,
    "niveauId" TEXT,

    CONSTRAINT "ActiviteitEvaluatie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inschrijving" (
    "id" TEXT NOT NULL,
    "inschrijvingsstatus" TEXT NOT NULL DEFAULT 'ingeschreven',
    "effectieveDeelname" BOOLEAN NOT NULL DEFAULT false,
    "pxlBegeleider" TEXT,
    "uitgeschrevenOp" TIMESTAMP(3),
    "uitschrijfReden" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bewijsStatus" TEXT NOT NULL DEFAULT 'niet_ingediend',
    "bewijsIngediendOp" TIMESTAMP(3),
    "bewijsBeoordeeldOp" TIMESTAMP(3),
    "bewijsFeedback" TEXT,
    "bewijsAfgekeurdBekekenOp" TIMESTAMP(3),
    "activiteitId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,

    CONSTRAINT "Inschrijving_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bewijsstuk" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bestandsnaam" TEXT NOT NULL,
    "bestandspad" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inschrijvingId" TEXT NOT NULL,

    CONSTRAINT "Bewijsstuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpleidingUrenTarget" (
    "id" TEXT NOT NULL,
    "schooljaar" TEXT NOT NULL,
    "urenNiveau1" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "urenNiveau2" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "urenNiveau3" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "urenNiveau4" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "urenNiveau5" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "urenDuurzaamheid" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "criteriumTargets" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "opleidingId" TEXT NOT NULL,

    CONSTRAINT "OpleidingUrenTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentUrenVoortgang" (
    "id" TEXT NOT NULL,
    "schooljaar" TEXT NOT NULL,
    "urenNiveau1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urenNiveau2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urenNiveau3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urenNiveau4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urenNiveau5" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urenDuurzaamheid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "opleidingId" TEXT NOT NULL,

    CONSTRAINT "StudentUrenVoortgang_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentCriteriumUren" (
    "id" TEXT NOT NULL,
    "schooljaar" TEXT NOT NULL,
    "urenNiveau1" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urenNiveau2" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urenNiveau3" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urenNiveau4" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urenNiveau5" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "urenTotaal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "criteriumId" TEXT NOT NULL,

    CONSTRAINT "StudentCriteriumUren_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Opleiding_code_key" ON "Opleiding"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_azureAdId_key" ON "User"("azureAdId");

-- CreateIndex
CREATE UNIQUE INDEX "DocentOpleiding_docentId_opleidingId_key" ON "DocentOpleiding"("docentId", "opleidingId");

-- CreateIndex
CREATE UNIQUE INDEX "RubricNiveauBeschrijving_criteriumId_niveauId_key" ON "RubricNiveauBeschrijving"("criteriumId", "niveauId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiviteitDuurzaamheid_activiteitId_duurzaamheidId_key" ON "ActiviteitDuurzaamheid"("activiteitId", "duurzaamheidId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiviteitEvaluatie_activiteitId_criteriumId_key" ON "ActiviteitEvaluatie"("activiteitId", "criteriumId");

-- CreateIndex
CREATE UNIQUE INDEX "Inschrijving_activiteitId_studentId_key" ON "Inschrijving"("activiteitId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "OpleidingUrenTarget_opleidingId_schooljaar_key" ON "OpleidingUrenTarget"("opleidingId", "schooljaar");

-- CreateIndex
CREATE UNIQUE INDEX "StudentUrenVoortgang_studentId_schooljaar_key" ON "StudentUrenVoortgang"("studentId", "schooljaar");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCriteriumUren_studentId_criteriumId_schooljaar_key" ON "StudentCriteriumUren"("studentId", "criteriumId", "schooljaar");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocentOpleiding" ADD CONSTRAINT "DocentOpleiding_docentId_fkey" FOREIGN KEY ("docentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocentOpleiding" ADD CONSTRAINT "DocentOpleiding_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationLog" ADD CONSTRAINT "ImpersonationLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationLog" ADD CONSTRAINT "ImpersonationLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuurzaamheidsThema" ADD CONSTRAINT "DuurzaamheidsThema_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluatieRubric" ADD CONSTRAINT "EvaluatieRubric_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricSectie" ADD CONSTRAINT "RubricSectie_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "EvaluatieRubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricNiveau" ADD CONSTRAINT "RubricNiveau_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "EvaluatieRubric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricCriterium" ADD CONSTRAINT "RubricCriterium_sectieId_fkey" FOREIGN KEY ("sectieId") REFERENCES "RubricSectie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricNiveauBeschrijving" ADD CONSTRAINT "RubricNiveauBeschrijving_criteriumId_fkey" FOREIGN KEY ("criteriumId") REFERENCES "RubricCriterium"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricNiveauBeschrijving" ADD CONSTRAINT "RubricNiveauBeschrijving_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "RubricNiveau"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activiteit" ADD CONSTRAINT "Activiteit_aangemaaktDoorId_fkey" FOREIGN KEY ("aangemaaktDoorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activiteit" ADD CONSTRAINT "Activiteit_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiviteitDuurzaamheid" ADD CONSTRAINT "ActiviteitDuurzaamheid_activiteitId_fkey" FOREIGN KEY ("activiteitId") REFERENCES "Activiteit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiviteitDuurzaamheid" ADD CONSTRAINT "ActiviteitDuurzaamheid_duurzaamheidId_fkey" FOREIGN KEY ("duurzaamheidId") REFERENCES "DuurzaamheidsThema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiviteitEvaluatie" ADD CONSTRAINT "ActiviteitEvaluatie_activiteitId_fkey" FOREIGN KEY ("activiteitId") REFERENCES "Activiteit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiviteitEvaluatie" ADD CONSTRAINT "ActiviteitEvaluatie_criteriumId_fkey" FOREIGN KEY ("criteriumId") REFERENCES "RubricCriterium"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiviteitEvaluatie" ADD CONSTRAINT "ActiviteitEvaluatie_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "RubricNiveau"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inschrijving" ADD CONSTRAINT "Inschrijving_activiteitId_fkey" FOREIGN KEY ("activiteitId") REFERENCES "Activiteit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inschrijving" ADD CONSTRAINT "Inschrijving_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bewijsstuk" ADD CONSTRAINT "Bewijsstuk_inschrijvingId_fkey" FOREIGN KEY ("inschrijvingId") REFERENCES "Inschrijving"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpleidingUrenTarget" ADD CONSTRAINT "OpleidingUrenTarget_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentUrenVoortgang" ADD CONSTRAINT "StudentUrenVoortgang_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentUrenVoortgang" ADD CONSTRAINT "StudentUrenVoortgang_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCriteriumUren" ADD CONSTRAINT "StudentCriteriumUren_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCriteriumUren" ADD CONSTRAINT "StudentCriteriumUren_criteriumId_fkey" FOREIGN KEY ("criteriumId") REFERENCES "RubricCriterium"("id") ON DELETE CASCADE ON UPDATE CASCADE;
