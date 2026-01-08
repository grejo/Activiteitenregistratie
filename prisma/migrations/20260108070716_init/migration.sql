-- CreateTable
CREATE TABLE "Opleiding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "naam" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "beschrijving" TEXT,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "autoGoedkeuringStudentActiviteiten" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "opleidingId" TEXT,
    CONSTRAINT "User_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocentOpleiding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isCoordinator" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "docentId" TEXT NOT NULL,
    "opleidingId" TEXT NOT NULL,
    CONSTRAINT "DocentOpleiding_docentId_fkey" FOREIGN KEY ("docentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocentOpleiding_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImpersonationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actie" TEXT NOT NULL,
    "details" TEXT,
    "ipAdres" TEXT,
    "userAgent" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "adminId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    CONSTRAINT "ImpersonationLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ImpersonationLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DuurzaamheidsThema" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "naam" TEXT NOT NULL,
    "beschrijving" TEXT,
    "icoon" TEXT,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opleidingId" TEXT NOT NULL,
    CONSTRAINT "DuurzaamheidsThema_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvaluatieRubric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "naam" TEXT NOT NULL,
    "beschrijving" TEXT,
    "schooljaar" TEXT,
    "actief" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "opleidingId" TEXT NOT NULL,
    CONSTRAINT "EvaluatieRubric_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RubricSectie" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "naam" TEXT NOT NULL,
    "gewichtPercentage" REAL NOT NULL,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rubricId" TEXT NOT NULL,
    CONSTRAINT "RubricSectie_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "EvaluatieRubric" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RubricNiveau" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "naam" TEXT NOT NULL,
    "scoreWaarde" REAL,
    "multiplicator" REAL,
    "volgorde" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rubricId" TEXT NOT NULL,
    CONSTRAINT "RubricNiveau_rubricId_fkey" FOREIGN KEY ("rubricId") REFERENCES "EvaluatieRubric" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RubricCriterium" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "naam" TEXT NOT NULL,
    "gewichtPercentage" REAL NOT NULL,
    "volgorde" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sectieId" TEXT NOT NULL,
    CONSTRAINT "RubricCriterium_sectieId_fkey" FOREIGN KEY ("sectieId") REFERENCES "RubricSectie" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RubricNiveauBeschrijving" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "beschrijving" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "criteriumId" TEXT NOT NULL,
    "niveauId" TEXT NOT NULL,
    CONSTRAINT "RubricNiveauBeschrijving_criteriumId_fkey" FOREIGN KEY ("criteriumId") REFERENCES "RubricCriterium" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RubricNiveauBeschrijving_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "RubricNiveau" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activiteit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titel" TEXT NOT NULL,
    "typeActiviteit" TEXT NOT NULL,
    "aard" TEXT,
    "omschrijving" TEXT,
    "datum" DATETIME NOT NULL,
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
    "status" TEXT NOT NULL DEFAULT 'concept',
    "opmerkingen" TEXT,
    "typeAanvraag" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "aangemaaktDoorId" TEXT NOT NULL,
    "opleidingId" TEXT,
    CONSTRAINT "Activiteit_aangemaaktDoorId_fkey" FOREIGN KEY ("aangemaaktDoorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Activiteit_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActiviteitDuurzaamheid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activiteitId" TEXT NOT NULL,
    "duurzaamheidId" TEXT NOT NULL,
    CONSTRAINT "ActiviteitDuurzaamheid_activiteitId_fkey" FOREIGN KEY ("activiteitId") REFERENCES "Activiteit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActiviteitDuurzaamheid_duurzaamheidId_fkey" FOREIGN KEY ("duurzaamheidId") REFERENCES "DuurzaamheidsThema" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActiviteitEvaluatie" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "activiteitId" TEXT NOT NULL,
    "criteriumId" TEXT NOT NULL,
    "niveauId" TEXT,
    CONSTRAINT "ActiviteitEvaluatie_activiteitId_fkey" FOREIGN KEY ("activiteitId") REFERENCES "Activiteit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActiviteitEvaluatie_criteriumId_fkey" FOREIGN KEY ("criteriumId") REFERENCES "RubricCriterium" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActiviteitEvaluatie_niveauId_fkey" FOREIGN KEY ("niveauId") REFERENCES "RubricNiveau" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inschrijving" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inschrijvingsstatus" TEXT NOT NULL DEFAULT 'ingeschreven',
    "effectieveDeelname" BOOLEAN NOT NULL DEFAULT false,
    "pxlBegeleider" TEXT,
    "uitgeschrevenOp" DATETIME,
    "uitschrijfReden" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "activiteitId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "Inschrijving_activiteitId_fkey" FOREIGN KEY ("activiteitId") REFERENCES "Activiteit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inschrijving_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bewijsstuk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "bestandsnaam" TEXT NOT NULL,
    "bestandspad" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inschrijvingId" TEXT NOT NULL,
    CONSTRAINT "Bewijsstuk_inschrijvingId_fkey" FOREIGN KEY ("inschrijvingId") REFERENCES "Inschrijving" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OpleidingUrenTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schooljaar" TEXT NOT NULL,
    "urenNiveau1" REAL NOT NULL DEFAULT 5.0,
    "urenNiveau2" REAL NOT NULL DEFAULT 3.0,
    "urenNiveau3" REAL NOT NULL DEFAULT 2.0,
    "urenNiveau4" REAL NOT NULL DEFAULT 1.0,
    "urenDuurzaamheid" REAL NOT NULL DEFAULT 1.0,
    "criteriumTargets" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "opleidingId" TEXT NOT NULL,
    CONSTRAINT "OpleidingUrenTarget_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentUrenVoortgang" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schooljaar" TEXT NOT NULL,
    "urenNiveau1" REAL NOT NULL DEFAULT 0,
    "urenNiveau2" REAL NOT NULL DEFAULT 0,
    "urenNiveau3" REAL NOT NULL DEFAULT 0,
    "urenNiveau4" REAL NOT NULL DEFAULT 0,
    "urenDuurzaamheid" REAL NOT NULL DEFAULT 0,
    "lastCalculated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentId" TEXT NOT NULL,
    "opleidingId" TEXT NOT NULL,
    CONSTRAINT "StudentUrenVoortgang_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentUrenVoortgang_opleidingId_fkey" FOREIGN KEY ("opleidingId") REFERENCES "Opleiding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StudentCriteriumUren" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "schooljaar" TEXT NOT NULL,
    "urenNiveau1" REAL NOT NULL DEFAULT 0,
    "urenNiveau2" REAL NOT NULL DEFAULT 0,
    "urenNiveau3" REAL NOT NULL DEFAULT 0,
    "urenNiveau4" REAL NOT NULL DEFAULT 0,
    "urenTotaal" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    "studentId" TEXT NOT NULL,
    "criteriumId" TEXT NOT NULL,
    CONSTRAINT "StudentCriteriumUren_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentCriteriumUren_criteriumId_fkey" FOREIGN KEY ("criteriumId") REFERENCES "RubricCriterium" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Opleiding_code_key" ON "Opleiding"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

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
