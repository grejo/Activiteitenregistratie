import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Huidig schooljaar (maart 2026 → 2025-2026)
const SCHOOLJAAR = '2025-2026'

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================
  // OPLEIDINGEN
  // ============================================
  console.log('📚 Creating opleidingen...')

  const bouw = await prisma.opleiding.upsert({
    where: { code: 'BOUW' },
    update: {},
    create: {
      naam: 'Bouwkunde',
      code: 'BOUW',
      beschrijving: 'Opleiding Bouwkunde - Leer alles over constructie, architectuur en projectmanagement',
      autoGoedkeuringStudentActiviteiten: false,
    },
  })

  const it = await prisma.opleiding.upsert({
    where: { code: 'IT' },
    update: {},
    create: {
      naam: 'Informatica',
      code: 'IT',
      beschrijving: 'Opleiding Informatica - Software development, AI en cybersecurity',
      autoGoedkeuringStudentActiviteiten: true,
    },
  })

  const elek = await prisma.opleiding.upsert({
    where: { code: 'ELEK' },
    update: {},
    create: {
      naam: 'Elektromechanica',
      code: 'ELEK',
      beschrijving: 'Opleiding Elektromechanica - Elektronica, automatisering en mechanica',
      autoGoedkeuringStudentActiviteiten: false,
    },
  })

  console.log('✅ Opleidingen aangemaakt:', bouw.naam, it.naam, elek.naam)

  // ============================================
  // DUURZAAMHEIDSTHEMAS
  // ============================================
  console.log('🌱 Creating duurzaamheidsthemas...')

  const themasBouw = [
    { id: 'seed-dt-bouw-0', naam: 'SDG 7 - Betaalbare en duurzame energie', icoon: '⚡', volgorde: 0 },
    { id: 'seed-dt-bouw-1', naam: 'SDG 9 - Industrie, innovatie en infrastructuur', icoon: '🏭', volgorde: 1 },
    { id: 'seed-dt-bouw-2', naam: 'SDG 11 - Duurzame steden en gemeenschappen', icoon: '🏙️', volgorde: 2 },
    { id: 'seed-dt-bouw-3', naam: 'SDG 12 - Verantwoorde consumptie en productie', icoon: '♻️', volgorde: 3 },
    { id: 'seed-dt-bouw-4', naam: 'Circulaire economie', icoon: '🔄', volgorde: 4 },
  ]
  const themasIT = [
    { id: 'seed-dt-it-0', naam: 'SDG 4 - Kwaliteitsonderwijs', icoon: '📚', volgorde: 0 },
    { id: 'seed-dt-it-1', naam: 'SDG 9 - Industrie, innovatie en infrastructuur', icoon: '💡', volgorde: 1 },
    { id: 'seed-dt-it-2', naam: 'SDG 10 - Ongelijkheid verminderen', icoon: '⚖️', volgorde: 2 },
    { id: 'seed-dt-it-3', naam: 'Digitale inclusie', icoon: '🌐', volgorde: 3 },
  ]

  for (const t of themasBouw) {
    await prisma.duurzaamheidsThema.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, opleidingId: bouw.id },
    })
  }
  for (const t of themasIT) {
    await prisma.duurzaamheidsThema.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, opleidingId: it.id },
    })
  }
  console.log('✅ Duurzaamheidsthemas aangemaakt')

  // ============================================
  // OPLEIDING TARGETS (beentje × niveau)
  // ============================================
  console.log('🎯 Creating opleiding targets...')

  // Standaard targets: 5 activiteiten N1, 3 N2, 2 N3, 1 N4 — alle beentjes vereist
  const defaultTargets = {
    doelNiveau1: 5, doelNiveau2: 3, doelNiveau3: 2, doelNiveau4: 1,
    passieVereist: true, ondernemendVereist: true, samenwerkingVereist: true,
    multidisciplinairVereist: true, reflectieVereist: true, duurzaamheidVereist: true,
  }

  for (const opleiding of [bouw, it, elek]) {
    await prisma.opleidingTarget.upsert({
      where: { opleidingId_schooljaar: { opleidingId: opleiding.id, schooljaar: SCHOOLJAAR } },
      create: { opleidingId: opleiding.id, schooljaar: SCHOOLJAAR, ...defaultTargets },
      update: defaultTargets,
    })
  }
  console.log('✅ Opleiding targets aangemaakt')

  // ============================================
  // GEBRUIKERS
  // ============================================
  console.log('👥 Creating users...')

  const hashedAdmin = await bcrypt.hash('admin123', 10)
  const hashedDocent = await bcrypt.hash('docent123', 10)
  const hashedStudent = await bcrypt.hash('student123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pxl.be' },
    update: {},
    create: { email: 'admin@pxl.be', passwordHash: hashedAdmin, naam: 'Systeem Beheerder', role: 'admin' },
  })
  console.log('  ✅ Admin:', admin.email)

  // Docenten
  const docentBouw = await prisma.user.upsert({
    where: { email: 'docent.bouw@pxl.be' },
    update: {},
    create: { email: 'docent.bouw@pxl.be', passwordHash: hashedDocent, naam: 'Jan Docent', role: 'docent' },
  })
  await prisma.docentOpleiding.upsert({
    where: { docentId_opleidingId: { docentId: docentBouw.id, opleidingId: bouw.id } },
    update: {},
    create: { docentId: docentBouw.id, opleidingId: bouw.id, isCoordinator: false },
  })

  const docentMulti = await prisma.user.upsert({
    where: { email: 'docent.multi@pxl.be' },
    update: {},
    create: { email: 'docent.multi@pxl.be', passwordHash: hashedDocent, naam: 'Piet Coordinator', role: 'docent' },
  })
  await prisma.docentOpleiding.upsert({
    where: { docentId_opleidingId: { docentId: docentMulti.id, opleidingId: it.id } },
    update: {},
    create: { docentId: docentMulti.id, opleidingId: it.id, isCoordinator: true },
  })
  await prisma.docentOpleiding.upsert({
    where: { docentId_opleidingId: { docentId: docentMulti.id, opleidingId: bouw.id } },
    update: {},
    create: { docentId: docentMulti.id, opleidingId: bouw.id, isCoordinator: false },
  })
  console.log('  ✅ Docenten aangemaakt')

  // Studenten
  const studentBouw = await prisma.user.upsert({
    where: { email: 'student.bouw@student.pxl.be' },
    update: {},
    create: { email: 'student.bouw@student.pxl.be', passwordHash: hashedStudent, naam: 'Lisa Student', role: 'student', opleidingId: bouw.id },
  })

  const studentIT = await prisma.user.upsert({
    where: { email: 'student.it@student.pxl.be' },
    update: {},
    create: { email: 'student.it@student.pxl.be', passwordHash: hashedStudent, naam: 'Tom Developer', role: 'student', opleidingId: it.id },
  })

  const extraStudenten = [
    { email: 'emma.janssen@student.pxl.be', naam: 'Emma Janssen', opleidingId: bouw.id },
    { email: 'lucas.peeters@student.pxl.be', naam: 'Lucas Peeters', opleidingId: bouw.id },
    { email: 'sophie.claes@student.pxl.be', naam: 'Sophie Claes', opleidingId: it.id },
    { email: 'noah.willems@student.pxl.be', naam: 'Noah Willems', opleidingId: it.id },
  ]
  for (const s of extraStudenten) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, passwordHash: hashedStudent, naam: s.naam, role: 'student', opleidingId: s.opleidingId },
    })
  }
  console.log('  ✅ Studenten aangemaakt')

  // ============================================
  // ACTIVITEITEN (docent-gepubliceerd)
  // ============================================
  console.log('📅 Creating activiteiten...')

  // Helper: maak een activiteit aan of haal op
  type ActData = {
    id: string
    titel: string
    typeActiviteit: string
    omschrijving: string
    datum: Date
    startuur: string
    einduur: string
    locatie?: string
    organisatorPxl?: string
    organisatorExtern?: string
    beentje: 'PASSIE' | 'ONDERNEMEND' | 'SAMENWERKING' | 'MULTIDISCIPLINAIR' | 'REFLECTIE'
    niveau: number
    maxPlaatsen?: number
    aantalIngeschreven?: number
    aangemaaktDoorId: string
    opleidingId: string
    status?: string
    typeAanvraag?: string
    verplichtProfiel?: string
    aard?: string
    weblink?: string
    bewijslink?: string
    opmerkingen?: string
  }

  const acts: ActData[] = [
    // ---- BOUW: PASSIE ----
    {
      id: 'seed-act-passie-n1-a',
      titel: 'Gastlezing: Passie voor Bouwen',
      typeActiviteit: 'Lezing',
      omschrijving: 'Architect Luc Janssen deelt zijn passie voor duurzaam bouwen en vertelt over zijn meest uitdagende projecten.',
      datum: new Date('2025-10-10'),
      startuur: '13:00', einduur: '15:00',
      locatie: 'PXL Tech, Aula A',
      organisatorPxl: 'Jan Docent',
      beentje: 'PASSIE', niveau: 1,
      maxPlaatsen: 60, aantalIngeschreven: 4,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-passie-n1-b',
      titel: 'Workshop: Duurzaam Bouwen in de Praktijk',
      typeActiviteit: 'Workshop',
      omschrijving: 'Hands-on workshop over circulaire bouwmaterialen en duurzame constructietechnieken.',
      datum: new Date('2025-11-05'),
      startuur: '14:00', einduur: '17:00',
      locatie: 'PXL Tech, Lokaal B201',
      organisatorPxl: 'Jan Docent',
      beentje: 'PASSIE', niveau: 1,
      maxPlaatsen: 20, aantalIngeschreven: 3,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-passie-n1-c',
      titel: 'Bezoek Architectenbureau EVR Architecten',
      typeActiviteit: 'Bedrijfsbezoek',
      omschrijving: 'Excursie naar EVR Architecten in Gent. Je krijgt een rondleiding en uitleg over hun werkmethode.',
      datum: new Date('2025-11-20'),
      startuur: '09:00', einduur: '12:00',
      locatie: 'Gent',
      organisatorExtern: 'EVR Architecten',
      beentje: 'PASSIE', niveau: 1,
      maxPlaatsen: 15, aantalIngeschreven: 2,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-passie-n2-a',
      titel: 'Lezingreeks: Architectuurgeschiedenis België',
      typeActiviteit: 'Lezing',
      omschrijving: 'Reeks van 3 lezingen over de evolutie van de Belgische bouwstijlen van 1900 tot heden.',
      datum: new Date('2025-12-03'),
      startuur: '17:00', einduur: '19:00',
      locatie: 'PXL Tech, Aula A',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'PASSIE', niveau: 2,
      maxPlaatsen: 80, aantalIngeschreven: 3,
      aangemaaktDoorId: docentMulti.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-passie-n2-b',
      titel: 'Design Thinking Workshop voor Bouwers',
      typeActiviteit: 'Workshop',
      omschrijving: 'Leer de Design Thinking methode toepassen op bouwkundige vraagstukken.',
      datum: new Date('2026-01-14'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Innovation Lab',
      organisatorPxl: 'Jan Docent',
      beentje: 'PASSIE', niveau: 2,
      maxPlaatsen: 25, aantalIngeschreven: 2,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-passie-n3-a',
      titel: 'Masterclass: Duurzame Architectuur van Morgen',
      typeActiviteit: 'Workshop',
      omschrijving: 'Intensieve masterclass met internationale sprekers over de toekomst van duurzame architectuur.',
      datum: new Date('2026-02-18'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Tech, Conferentiezaal',
      organisatorPxl: 'Jan Docent',
      beentje: 'PASSIE', niveau: 3,
      maxPlaatsen: 30, aantalIngeschreven: 1,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },

    // ---- BOUW: SAMENWERKING ----
    {
      id: 'seed-act-samen-n1-a',
      titel: 'Teamproject: Woningontwerp voor Senioren',
      typeActiviteit: 'Project',
      omschrijving: 'Interdisciplinair teamproject waarbij je een toegankelijke woning ontwerpt in samenwerking met ergotherapie-studenten.',
      datum: new Date('2025-10-22'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Tech',
      organisatorPxl: 'Jan Docent',
      beentje: 'SAMENWERKING', niveau: 1,
      maxPlaatsen: 30, aantalIngeschreven: 4,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-samen-n1-b',
      titel: 'Workshop: Communicatie in Bouwteams',
      typeActiviteit: 'Workshop',
      omschrijving: 'Leer effectief communiceren in een diverse bouwploeg. Simulaties en rollenspelen.',
      datum: new Date('2025-11-12'),
      startuur: '13:00', einduur: '17:00',
      locatie: 'PXL Tech, B301',
      organisatorPxl: 'Jan Docent',
      beentje: 'SAMENWERKING', niveau: 1,
      maxPlaatsen: 20, aantalIngeschreven: 3,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-samen-n1-c',
      titel: 'Bedrijfsbezoek: Internationaal Bouwproject Rotterdam',
      typeActiviteit: 'Bedrijfsbezoek',
      omschrijving: 'Bezoek aan een groot internationaal bouwproject in Rotterdam Centraal.',
      datum: new Date('2025-12-10'),
      startuur: '08:00', einduur: '18:00',
      locatie: 'Rotterdam, Nederland',
      organisatorExtern: 'Ballast Nedam NV',
      beentje: 'SAMENWERKING', niveau: 1,
      maxPlaatsen: 20, aantalIngeschreven: 2,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-samen-n2-a',
      titel: 'Internationaal Studiebezoek Duitsland',
      typeActiviteit: 'Bedrijfsbezoek',
      omschrijving: 'Driedaagse studiereis naar Stuttgart met bezoeken aan duurzame bouwprojecten en samenwerking met Duitse studenten.',
      datum: new Date('2026-01-21'),
      startuur: '07:00', einduur: '20:00',
      locatie: 'Stuttgart, Duitsland',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'SAMENWERKING', niveau: 2,
      maxPlaatsen: 20, aantalIngeschreven: 2,
      aangemaaktDoorId: docentMulti.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-samen-n2-b',
      titel: 'Cross-functioneel Bouwproject: Smart Campus',
      typeActiviteit: 'Project',
      omschrijving: 'Samenwerking met IT en Elektro-studenten om een smart campus te ontwerpen.',
      datum: new Date('2026-02-11'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Campus',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'SAMENWERKING', niveau: 2,
      maxPlaatsen: 40, aantalIngeschreven: 2,
      aangemaaktDoorId: docentMulti.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-samen-n3-a',
      titel: 'European Building Summit Leuven',
      typeActiviteit: 'Netwerkevent',
      omschrijving: 'Europese conferentie over duurzame stedenbouw. Je vertegenwoordigt PXL en netwerkt met studenten uit 10 landen.',
      datum: new Date('2026-02-25'),
      startuur: '09:00', einduur: '18:00',
      locatie: 'KU Leuven',
      organisatorExtern: 'European Building Network',
      beentje: 'SAMENWERKING', niveau: 3,
      maxPlaatsen: 10, aantalIngeschreven: 1,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-samen-n4-a',
      titel: 'Internationaal Stageprogramma Spanje',
      typeActiviteit: 'Project',
      omschrijving: 'Tweeweekse internationale stage bij een Spaans architectenbureau in Barcelona.',
      datum: new Date('2026-03-04'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'Barcelona, Spanje',
      organisatorExtern: 'Estudio Carme Pinós',
      beentje: 'SAMENWERKING', niveau: 4,
      maxPlaatsen: 5, aantalIngeschreven: 1,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },

    // ---- BOUW: MULTIDISCIPLINAIR ----
    {
      id: 'seed-act-multi-n1-a',
      titel: 'Workshop BIM Modellering',
      typeActiviteit: 'Workshop',
      omschrijving: 'Leer de basis van Building Information Modeling (BIM) en hoe je dit kunt toepassen in bouwprojecten.',
      datum: new Date('2025-10-15'),
      startuur: '14:00', einduur: '17:00',
      locatie: 'PXL Tech, Lokaal B201',
      organisatorPxl: 'Jan Docent',
      beentje: 'MULTIDISCIPLINAIR', niveau: 1,
      maxPlaatsen: 20, aantalIngeschreven: 3,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-multi-n1-b',
      titel: 'Lezing: Engineering & Architectuur Samen',
      typeActiviteit: 'Lezing',
      omschrijving: 'Samenspel tussen ingenieur en architect: hoe communiceer je over structurele en esthetische keuzes?',
      datum: new Date('2025-11-26'),
      startuur: '16:00', einduur: '18:00',
      locatie: 'PXL Tech, Aula B',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'MULTIDISCIPLINAIR', niveau: 1,
      maxPlaatsen: 50, aantalIngeschreven: 3,
      aangemaaktDoorId: docentMulti.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-multi-n1-c',
      titel: 'Project: Infrastructuur & Stadsdesign',
      typeActiviteit: 'Project',
      omschrijving: 'Samenwerkingsproject met mobiliteitsdeskundigen en stedenbouwkundigen.',
      datum: new Date('2026-01-28'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Tech',
      organisatorPxl: 'Jan Docent',
      beentje: 'MULTIDISCIPLINAIR', niveau: 1,
      maxPlaatsen: 25, aantalIngeschreven: 2,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-multi-n2-a',
      titel: 'Interdisciplinair Bouwproject: Renovatie Stadhuis',
      typeActiviteit: 'Project',
      omschrijving: 'Volwaardig interdisciplinair project met studenten bouwkunde, architectuur en ingenieurswetenschap.',
      datum: new Date('2026-02-04'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Innovation Lab',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'MULTIDISCIPLINAIR', niveau: 2,
      maxPlaatsen: 20, aantalIngeschreven: 2,
      aangemaaktDoorId: docentMulti.id, opleidingId: bouw.id,
    },

    // ---- BOUW: REFLECTIE ----
    {
      id: 'seed-act-reflectie-n1-bouw-a',
      titel: 'Reflectiedag Bouwkunde: Terugkijken op Semester 1',
      typeActiviteit: 'Workshop',
      omschrijving: 'Begeleide reflectiedag over je leerervaringen in het eerste semester.',
      datum: new Date('2026-01-07'),
      startuur: '09:00', einduur: '12:00',
      locatie: 'PXL Tech, B101',
      organisatorPxl: 'Jan Docent',
      beentje: 'REFLECTIE', niveau: 1,
      maxPlaatsen: 30, aantalIngeschreven: 3,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-reflectie-n1-bouw-b',
      titel: 'Portfolio Workshop: Jouw Verhaal als Bouwer',
      typeActiviteit: 'Workshop',
      omschrijving: 'Workshop over het samenstellen van een professioneel portfolio als bouwkundestudent.',
      datum: new Date('2026-02-19'),
      startuur: '13:00', einduur: '17:00',
      locatie: 'PXL Tech, A202',
      organisatorPxl: 'Jan Docent',
      beentje: 'REFLECTIE', niveau: 1,
      maxPlaatsen: 20, aantalIngeschreven: 2,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },

    // ---- BOUW: ONDERNEMEND (toekomstig - op prikbord) ----
    {
      id: 'seed-act-ondernemend-n1-bouw-a',
      titel: 'Startup Workshop: Bouwtech Innovaties',
      typeActiviteit: 'Workshop',
      omschrijving: 'Ontdek hoe je een startup kunt opzetten in de bouwsector. Van idee tot businessplan.',
      datum: new Date('2026-04-15'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Innovation Lab',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'ONDERNEMEND', niveau: 1,
      maxPlaatsen: 25, aantalIngeschreven: 0,
      aangemaaktDoorId: docentMulti.id, opleidingId: bouw.id,
    },
    {
      id: 'seed-act-ondernemend-n2-bouw-a',
      titel: 'Bedrijfssimulatie: Bouwproject Managen',
      typeActiviteit: 'Project',
      omschrijving: 'Simuleer een volledig bouwproject als projectmanager: van offerte tot oplevering.',
      datum: new Date('2026-05-06'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Tech',
      organisatorPxl: 'Jan Docent',
      beentje: 'ONDERNEMEND', niveau: 2,
      maxPlaatsen: 20, aantalIngeschreven: 0,
      aangemaaktDoorId: docentBouw.id, opleidingId: bouw.id,
    },

    // ---- IT: REFLECTIE ----
    {
      id: 'seed-act-reflectie-n1-it-a',
      titel: 'IT Reflectie Workshop: Code Review Culture',
      typeActiviteit: 'Workshop',
      omschrijving: 'Leer reflecteren op je code en ontvang constructieve feedback van peers.',
      datum: new Date('2025-10-08'),
      startuur: '13:00', einduur: '16:00',
      locatie: 'PXL Tech, IT Lab',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'REFLECTIE', niveau: 1,
      maxPlaatsen: 20, aantalIngeschreven: 3,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },
    {
      id: 'seed-act-reflectie-n1-it-b',
      titel: 'Retrospective Bootcamp: Agile Werken',
      typeActiviteit: 'Workshop',
      omschrijving: 'Sprint retrospectives en persoonlijke reflectie in een Agile/Scrum omgeving.',
      datum: new Date('2025-11-19'),
      startuur: '09:00', einduur: '13:00',
      locatie: 'PXL Innovation Lab',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'REFLECTIE', niveau: 1,
      maxPlaatsen: 25, aantalIngeschreven: 3,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },
    {
      id: 'seed-act-reflectie-n1-it-c',
      titel: 'Portfolio Review Day: IT Profiel',
      typeActiviteit: 'Workshop',
      omschrijving: 'Presenteer je digitaal portfolio aan medestudenten en docenten.',
      datum: new Date('2026-01-21'),
      startuur: '09:00', einduur: '12:00',
      locatie: 'PXL Tech, IT Lab',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'REFLECTIE', niveau: 1,
      maxPlaatsen: 20, aantalIngeschreven: 2,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },
    {
      id: 'seed-act-reflectie-n2-it-a',
      titel: 'Advanced Reflection: Van Junior naar Medior Developer',
      typeActiviteit: 'Workshop',
      omschrijving: 'Diepgaande reflectie op je groei als developer. Assessment van technische en soft skills.',
      datum: new Date('2025-12-11'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Tech, IT Lab',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'REFLECTIE', niveau: 2,
      maxPlaatsen: 15, aantalIngeschreven: 2,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },
    {
      id: 'seed-act-reflectie-n2-it-b',
      titel: 'Zelfreflectie & Loopbaanoriëntatie IT',
      typeActiviteit: 'Workshop',
      omschrijving: 'Waar wil je naartoe als IT-professional? Waarden, sterktes en zwaktes in kaart brengen.',
      datum: new Date('2026-02-04'),
      startuur: '13:00', einduur: '17:00',
      locatie: 'PXL Innovation Lab',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'REFLECTIE', niveau: 2,
      maxPlaatsen: 20, aantalIngeschreven: 2,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },
    {
      id: 'seed-act-reflectie-n3-it-a',
      titel: 'Reflectie Masterclass: Technologie & Samenleving',
      typeActiviteit: 'Workshop',
      omschrijving: 'Diepgaande masterclass over de maatschappelijke impact van technologie en jouw rol daarin.',
      datum: new Date('2026-02-25'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Tech, Conferentiezaal',
      organisatorExtern: 'imec',
      beentje: 'REFLECTIE', niveau: 3,
      maxPlaatsen: 20, aantalIngeschreven: 1,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },
    {
      id: 'seed-act-reflectie-n4-it-a',
      titel: 'Capstone Reflectie: Jouw Impact als IT-Professional',
      typeActiviteit: 'Project',
      omschrijving: 'Afsluiting van het reflectietraject: presenteer jouw groei en toekomstvisie aan een jury.',
      datum: new Date('2026-03-11'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Tech, Aula A',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'REFLECTIE', niveau: 4,
      maxPlaatsen: 20, aantalIngeschreven: 1,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },

    // ---- IT: ONDERNEMEND ----
    {
      id: 'seed-act-ondernemend-n1-it-a',
      titel: 'Hackathon: AI for Good',
      typeActiviteit: 'Project',
      omschrijving: '24-uurs hackathon waar je in teams werkt aan AI-oplossingen voor maatschappelijke problemen.',
      datum: new Date('2025-10-25'),
      startuur: '10:00', einduur: '10:00',
      locatie: 'PXL Innovation Lab',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'ONDERNEMEND', niveau: 1,
      maxPlaatsen: 50, aantalIngeschreven: 3,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },
    {
      id: 'seed-act-ondernemend-n1-it-b',
      titel: 'Startup Weekend Hasselt',
      typeActiviteit: 'Netwerkevent',
      omschrijving: '54 uur lang van idee naar startup. Pitch je concept op vrijdagavond, werk het weekend door.',
      datum: new Date('2025-11-14'),
      startuur: '18:00', einduur: '18:00',
      locatie: 'Corda Campus Hasselt',
      organisatorExtern: 'Startup Weekend Belgium',
      beentje: 'ONDERNEMEND', niveau: 1,
      maxPlaatsen: 60, aantalIngeschreven: 2,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },
    {
      id: 'seed-act-ondernemend-n1-it-c',
      titel: 'Pitching Workshop: Van Idee naar Investeerder',
      typeActiviteit: 'Workshop',
      omschrijving: 'Leer hoe je een overtuigend technisch idee presenteert aan een niet-technisch publiek.',
      datum: new Date('2026-01-14'),
      startuur: '13:00', einduur: '17:00',
      locatie: 'PXL Innovation Lab',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'ONDERNEMEND', niveau: 1,
      maxPlaatsen: 30, aantalIngeschreven: 2,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },
    {
      id: 'seed-act-ondernemend-n2-it-a',
      titel: 'Business Model Canvas voor Tech Startups',
      typeActiviteit: 'Workshop',
      omschrijving: 'Diepgaande workshop over businessmodellen voor tech-gedreven ondernemingen.',
      datum: new Date('2026-02-11'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Innovation Lab',
      organisatorExtern: 'Flanders Investment & Trade',
      beentje: 'ONDERNEMEND', niveau: 2,
      maxPlaatsen: 25, aantalIngeschreven: 2,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },

    // ---- IT: PASSIE ----
    {
      id: 'seed-act-passie-n1-it-a',
      titel: 'Gastlezing: Van Hobbyproject naar Tech Startup',
      typeActiviteit: 'Lezing',
      omschrijving: 'Succesvolle Hasseltse ondernemer deelt hoe zijn passie voor coding leidde tot een succesvol softwarebedrijf.',
      datum: new Date('2025-10-29'),
      startuur: '16:00', einduur: '18:00',
      locatie: 'PXL Tech, Aula IT',
      organisatorExtern: 'Pliik NV',
      beentje: 'PASSIE', niveau: 1,
      maxPlaatsen: 80, aantalIngeschreven: 2,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },

    // ---- IT: SAMENWERKING (toekomstig - op prikbord) ----
    {
      id: 'seed-act-samen-n1-it-a',
      titel: 'Open Source Contribution Day',
      typeActiviteit: 'Project',
      omschrijving: 'Contribute samen aan open source projecten. Leer werken met Git, Pull Requests en code review.',
      datum: new Date('2026-04-22'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'PXL Tech, IT Lab',
      organisatorPxl: 'Piet Coordinator',
      beentje: 'SAMENWERKING', niveau: 1,
      maxPlaatsen: 30, aantalIngeschreven: 0,
      aangemaaktDoorId: docentMulti.id, opleidingId: it.id,
    },
  ]

  for (const act of acts) {
    await prisma.activiteit.upsert({
      where: { id: act.id },
      update: { aantalIngeschreven: act.aantalIngeschreven ?? 0 },
      create: {
        id: act.id,
        titel: act.titel,
        typeActiviteit: act.typeActiviteit,
        aard: act.aard,
        omschrijving: act.omschrijving,
        datum: act.datum,
        startuur: act.startuur,
        einduur: act.einduur,
        locatie: act.locatie,
        organisatorPxl: act.organisatorPxl,
        organisatorExtern: act.organisatorExtern,
        bewijslink: act.bewijslink,
        weblink: act.weblink,
        verplichtProfiel: act.verplichtProfiel,
        maxPlaatsen: act.maxPlaatsen,
        aantalIngeschreven: act.aantalIngeschreven ?? 0,
        beentje: act.beentje,
        niveau: act.niveau,
        status: 'gepubliceerd',
        typeAanvraag: 'docent',
        aangemaaktDoorId: act.aangemaaktDoorId,
        opleidingId: act.opleidingId,
      },
    })
  }

  console.log(`✅ ${acts.length} activiteiten aangemaakt`)

  // ============================================
  // DUURZAAMHEID KOPPELINGEN
  // ============================================
  console.log('🌿 Linking duurzaamheidsthemas to activiteiten...')

  // [activiteitId, duurzaamheidsThemaId]
  const duurzaamheidLinks: [string, string][] = [
    // BOUW activiteiten
    ['seed-act-passie-n1-a', 'seed-dt-bouw-2'],  // SDG 11 steden
    ['seed-act-passie-n1-a', 'seed-dt-bouw-4'],  // Circulaire economie
    ['seed-act-passie-n1-b', 'seed-dt-bouw-0'],  // SDG 7 energie
    ['seed-act-passie-n1-b', 'seed-dt-bouw-3'],  // SDG 12 consumptie
    ['seed-act-passie-n1-b', 'seed-dt-bouw-4'],  // Circulaire economie
    ['seed-act-passie-n1-c', 'seed-dt-bouw-2'],  // SDG 11 steden
    ['seed-act-passie-n2-a', 'seed-dt-bouw-2'],  // SDG 11 steden
    ['seed-act-passie-n2-b', 'seed-dt-bouw-1'],  // SDG 9 industrie
    ['seed-act-passie-n3-a', 'seed-dt-bouw-0'],  // SDG 7 energie
    ['seed-act-passie-n3-a', 'seed-dt-bouw-2'],  // SDG 11 steden
    ['seed-act-samen-n1-a', 'seed-dt-bouw-2'],   // SDG 11 steden
    ['seed-act-samen-n1-c', 'seed-dt-bouw-1'],   // SDG 9 industrie
    ['seed-act-samen-n2-a', 'seed-dt-bouw-2'],   // SDG 11 steden
    ['seed-act-samen-n2-b', 'seed-dt-bouw-1'],   // SDG 9 industrie
    ['seed-act-samen-n2-b', 'seed-dt-bouw-2'],   // SDG 11 steden
    ['seed-act-samen-n3-a', 'seed-dt-bouw-2'],   // SDG 11 steden
    ['seed-act-samen-n4-a', 'seed-dt-bouw-2'],   // SDG 11 steden
    ['seed-act-multi-n1-a', 'seed-dt-bouw-1'],   // SDG 9 industrie
    ['seed-act-multi-n1-b', 'seed-dt-bouw-1'],   // SDG 9 industrie
    ['seed-act-multi-n1-c', 'seed-dt-bouw-1'],   // SDG 9 industrie
    ['seed-act-multi-n1-c', 'seed-dt-bouw-2'],   // SDG 11 steden
    ['seed-act-multi-n2-a', 'seed-dt-bouw-1'],   // SDG 9 industrie
    ['seed-act-multi-n2-a', 'seed-dt-bouw-4'],   // Circulaire economie
    // IT activiteiten
    ['seed-act-reflectie-n1-it-a', 'seed-dt-it-0'],   // SDG 4 onderwijs
    ['seed-act-reflectie-n1-it-b', 'seed-dt-it-0'],   // SDG 4 onderwijs
    ['seed-act-reflectie-n1-it-c', 'seed-dt-it-0'],   // SDG 4 onderwijs
    ['seed-act-reflectie-n2-it-a', 'seed-dt-it-0'],   // SDG 4 onderwijs
    ['seed-act-reflectie-n2-it-b', 'seed-dt-it-0'],   // SDG 4 onderwijs
    ['seed-act-reflectie-n3-it-a', 'seed-dt-it-0'],   // SDG 4 onderwijs
    ['seed-act-reflectie-n3-it-a', 'seed-dt-it-2'],   // SDG 10 ongelijkheid
    ['seed-act-reflectie-n4-it-a', 'seed-dt-it-0'],   // SDG 4 onderwijs
    ['seed-act-ondernemend-n1-it-a', 'seed-dt-it-1'], // SDG 9 industrie
    ['seed-act-ondernemend-n1-it-a', 'seed-dt-it-2'], // SDG 10 ongelijkheid
    ['seed-act-ondernemend-n1-it-b', 'seed-dt-it-1'], // SDG 9 industrie
    ['seed-act-ondernemend-n1-it-c', 'seed-dt-it-1'], // SDG 9 industrie
    ['seed-act-ondernemend-n2-it-a', 'seed-dt-it-1'], // SDG 9 industrie
    ['seed-act-passie-n1-it-a', 'seed-dt-it-1'],      // SDG 9 industrie
    ['seed-act-passie-n1-it-a', 'seed-dt-it-3'],      // Digitale inclusie
    ['seed-aanvraag-tom-1', 'seed-dt-it-0'],           // SDG 4 onderwijs
    ['seed-aanvraag-tom-1', 'seed-dt-it-1'],           // SDG 9 industrie
  ]

  let duurzaamheidLinksCount = 0
  for (const [activiteitId, duurzaamheidId] of duurzaamheidLinks) {
    await prisma.activiteitDuurzaamheid.upsert({
      where: { activiteitId_duurzaamheidId: { activiteitId, duurzaamheidId } },
      update: {},
      create: { activiteitId, duurzaamheidId },
    })
    duurzaamheidLinksCount++
  }
  console.log(`✅ ${duurzaamheidLinksCount} duurzaamheid koppelingen aangemaakt`)

  // ============================================
  // STUDENT AANVRAGEN (typeAanvraag = student)
  // ============================================
  console.log('📝 Creating student aanvragen...')

  // Lisa: aanvraag in review
  await prisma.activiteit.upsert({
    where: { id: 'seed-aanvraag-lisa-1' },
    update: {},
    create: {
      id: 'seed-aanvraag-lisa-1',
      titel: 'Vrijwilligerswerk: Bouwkamp voor Jongeren',
      typeActiviteit: 'Vrijwilligerswerk',
      aard: 'Sociaal',
      omschrijving: 'Ik ga meehelpen met een bouwkamp waar jongeren leren timmeren en metselen.',
      datum: new Date('2026-04-12'),
      startuur: '09:00', einduur: '17:00',
      locatie: 'Jeugdcentrum Genk',
      organisatorExtern: 'Jeugdwerk Genk vzw',
      bewijslink: 'https://jeugdwerkgenk.be/bouwkamp2026',
      status: 'in_review',
      typeAanvraag: 'student',
      beentje: 'PASSIE',
      niveau: 2,
      aangemaaktDoorId: studentBouw.id,
      opleidingId: bouw.id,
    },
  })

  // Lisa: aanvraag goedgekeurd (maar bewijs nog in te dienen)
  await prisma.activiteit.upsert({
    where: { id: 'seed-aanvraag-lisa-2' },
    update: {},
    create: {
      id: 'seed-aanvraag-lisa-2',
      titel: 'Rondleiding Stadhuis Hasselt: Historische Bouwtechnieken',
      typeActiviteit: 'Bedrijfsbezoek',
      aard: 'Cultureel',
      omschrijving: 'Privé rondleiding in het stadhuis van Hasselt met focus op historische bouwtechnieken en restauratie.',
      datum: new Date('2026-01-10'),
      startuur: '10:00', einduur: '12:00',
      locatie: 'Stadhuis Hasselt',
      organisatorExtern: 'Toerisme Hasselt',
      bewijslink: 'https://toerisme.hasselt.be/stadhuisrondleiding',
      status: 'goedgekeurd',
      typeAanvraag: 'student',
      beentje: 'MULTIDISCIPLINAIR',
      niveau: 1,
      aangemaaktDoorId: studentBouw.id,
      opleidingId: bouw.id,
    },
  })

  // Tom: aanvraag goedgekeurd + bewijs goedgekeurd (volledig doorlopen flow)
  await prisma.activiteit.upsert({
    where: { id: 'seed-aanvraag-tom-1' },
    update: {},
    create: {
      id: 'seed-aanvraag-tom-1',
      titel: 'Online cursus: React Advanced Patterns',
      typeActiviteit: 'Cursus',
      aard: 'Zelfstudie',
      omschrijving: 'Gevorderde React cursus op Udemy over state management en performance optimalisatie.',
      datum: new Date('2025-10-01'),
      startuur: '19:00', einduur: '21:00',
      weblink: 'https://udemy.com/react-advanced',
      bewijslink: 'https://udemy.com/certificate/uc-abc123',
      status: 'goedgekeurd',
      typeAanvraag: 'student',
      beentje: 'REFLECTIE',
      niveau: 1,
      aangemaaktDoorId: studentIT.id,
      opleidingId: it.id,
    },
  })

  // Tom: aanvraag afgekeurd (voorbeeld)
  await prisma.activiteit.upsert({
    where: { id: 'seed-aanvraag-tom-2' },
    update: {},
    create: {
      id: 'seed-aanvraag-tom-2',
      titel: 'YouTube cursus: Random Gaming Project',
      typeActiviteit: 'Cursus',
      aard: 'Zelfstudie',
      omschrijving: 'Ik wil mijn gaming project aanvragen als activiteit.',
      datum: new Date('2025-09-20'),
      startuur: '20:00', einduur: '22:00',
      status: 'afgekeurd',
      typeAanvraag: 'student',
      beentje: 'PASSIE',
      niveau: 1,
      opmerkingen: 'Deze activiteit voldoet niet aan de criteria voor de X-Factor beentjes.',
      aangemaaktDoorId: studentIT.id,
      opleidingId: it.id,
    },
  })

  console.log('✅ Student aanvragen aangemaakt')

  // ============================================
  // INSCHRIJVINGEN + BEWIJSSTUKKEN
  // ============================================
  console.log('📋 Creating inschrijvingen...')

  // Helper: maak inschrijving met optioneel bewijs
  type InschrijvingConfig = {
    id: string
    activiteitId: string
    studentId: string
    status?: string
    effectieveDeelname?: boolean
    bewijsStatus?: string
    bewijsIngediendOp?: Date
    bewijsBeoordeeldOp?: Date
    bewijsFeedback?: string
    bewijsstukken?: { type: string; naam: string; pad: string }[]
  }

  const inschrijvingen: InschrijvingConfig[] = [
    // ============================================================
    // LISA (Bouwkunde) - gevorderd, goedgekeurde bewijzen voor:
    //   PASSIE N1 (3x), N2 (2x), N3 (1x)  → PASSIE volledig behaald
    //   SAMENWERKING N1 (3x), N2 (2x), N3 (1x), N4 (1x)  → SAMENWERKING VOLLEDIG
    //   MULTIDISCIPLINAIR N1 (3x), N2 (1x)  → deels
    //   REFLECTIE N1 (2x)  → deels
    // ============================================================

    // PASSIE N1 ×3
    { id: 'seed-insch-lisa-passie-n1-a', activiteitId: 'seed-act-passie-n1-a', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-10-12'), bewijsBeoordeeldOp: new Date('2025-10-15'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'aanwezigheidsattest.jpg', pad: '/uploads/seed/lisa-passie-n1-a.jpg' }] },
    { id: 'seed-insch-lisa-passie-n1-b', activiteitId: 'seed-act-passie-n1-b', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-11-07'), bewijsBeoordeeldOp: new Date('2025-11-10'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'workshop_bewijs.jpg', pad: '/uploads/seed/lisa-passie-n1-b.jpg' }] },
    { id: 'seed-insch-lisa-passie-n1-c', activiteitId: 'seed-act-passie-n1-c', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-11-22'), bewijsBeoordeeldOp: new Date('2025-11-25'),
      bewijsstukken: [{ type: 'pdf', naam: 'bezoek_bewijs.pdf', pad: '/uploads/seed/lisa-passie-n1-c.pdf' }] },

    // PASSIE N2 ×2
    { id: 'seed-insch-lisa-passie-n2-a', activiteitId: 'seed-act-passie-n2-a', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-12-05'), bewijsBeoordeeldOp: new Date('2025-12-08'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'lezing_foto.jpg', pad: '/uploads/seed/lisa-passie-n2-a.jpg' }] },
    { id: 'seed-insch-lisa-passie-n2-b', activiteitId: 'seed-act-passie-n2-b', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-01-16'), bewijsBeoordeeldOp: new Date('2026-01-19'),
      bewijsstukken: [{ type: 'pdf', naam: 'design_thinking_reflectie.pdf', pad: '/uploads/seed/lisa-passie-n2-b.pdf' }] },

    // PASSIE N3 ×1
    { id: 'seed-insch-lisa-passie-n3-a', activiteitId: 'seed-act-passie-n3-a', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-02-20'), bewijsBeoordeeldOp: new Date('2026-02-22'),
      bewijsstukken: [{ type: 'pdf', naam: 'masterclass_bewijs.pdf', pad: '/uploads/seed/lisa-passie-n3-a.pdf' }] },

    // SAMENWERKING N1 ×3
    { id: 'seed-insch-lisa-samen-n1-a', activiteitId: 'seed-act-samen-n1-a', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-10-24'), bewijsBeoordeeldOp: new Date('2025-10-27'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'teamproject_foto.jpg', pad: '/uploads/seed/lisa-samen-n1-a.jpg' }] },
    { id: 'seed-insch-lisa-samen-n1-b', activiteitId: 'seed-act-samen-n1-b', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-11-14'), bewijsBeoordeeldOp: new Date('2025-11-17'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'communicatie_workshop.jpg', pad: '/uploads/seed/lisa-samen-n1-b.jpg' }] },
    { id: 'seed-insch-lisa-samen-n1-c', activiteitId: 'seed-act-samen-n1-c', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-12-12'), bewijsBeoordeeldOp: new Date('2025-12-15'),
      bewijsstukken: [{ type: 'pdf', naam: 'rotterdam_verslag.pdf', pad: '/uploads/seed/lisa-samen-n1-c.pdf' }] },

    // SAMENWERKING N2 ×2
    { id: 'seed-insch-lisa-samen-n2-a', activiteitId: 'seed-act-samen-n2-a', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-01-23'), bewijsBeoordeeldOp: new Date('2026-01-26'),
      bewijsstukken: [{ type: 'pdf', naam: 'stuttgart_verslag.pdf', pad: '/uploads/seed/lisa-samen-n2-a.pdf' }] },
    { id: 'seed-insch-lisa-samen-n2-b', activiteitId: 'seed-act-samen-n2-b', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-02-13'), bewijsBeoordeeldOp: new Date('2026-02-16'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'smart_campus_foto.jpg', pad: '/uploads/seed/lisa-samen-n2-b.jpg' }] },

    // SAMENWERKING N3 ×1
    { id: 'seed-insch-lisa-samen-n3-a', activiteitId: 'seed-act-samen-n3-a', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-02-27'), bewijsBeoordeeldOp: new Date('2026-03-01'),
      bewijsstukken: [{ type: 'pdf', naam: 'summit_bewijs.pdf', pad: '/uploads/seed/lisa-samen-n3-a.pdf' }] },

    // SAMENWERKING N4 ×1
    { id: 'seed-insch-lisa-samen-n4-a', activiteitId: 'seed-act-samen-n4-a', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-03-06'), bewijsBeoordeeldOp: new Date('2026-03-09'),
      bewijsstukken: [{ type: 'pdf', naam: 'barcelona_stage_certificaat.pdf', pad: '/uploads/seed/lisa-samen-n4-a.pdf' }] },

    // MULTIDISCIPLINAIR N1 ×3
    { id: 'seed-insch-lisa-multi-n1-a', activiteitId: 'seed-act-multi-n1-a', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-10-17'), bewijsBeoordeeldOp: new Date('2025-10-20'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'bim_workshop.jpg', pad: '/uploads/seed/lisa-multi-n1-a.jpg' }] },
    { id: 'seed-insch-lisa-multi-n1-b', activiteitId: 'seed-act-multi-n1-b', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-11-28'), bewijsBeoordeeldOp: new Date('2025-12-01'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'lezing_engineering.jpg', pad: '/uploads/seed/lisa-multi-n1-b.jpg' }] },
    { id: 'seed-insch-lisa-multi-n1-c', activiteitId: 'seed-act-multi-n1-c', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-01-30'), bewijsBeoordeeldOp: new Date('2026-02-02'),
      bewijsstukken: [{ type: 'pdf', naam: 'infra_project.pdf', pad: '/uploads/seed/lisa-multi-n1-c.pdf' }] },

    // MULTIDISCIPLINAIR N2 ×1 (deels - target is 2)
    { id: 'seed-insch-lisa-multi-n2-a', activiteitId: 'seed-act-multi-n2-a', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-02-06'), bewijsBeoordeeldOp: new Date('2026-02-09'),
      bewijsstukken: [{ type: 'pdf', naam: 'inter_bouwproject.pdf', pad: '/uploads/seed/lisa-multi-n2-a.pdf' }] },

    // REFLECTIE N1 ×2 (deels - target is 3)
    { id: 'seed-insch-lisa-reflectie-n1-a', activiteitId: 'seed-act-reflectie-n1-bouw-a', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-01-09'), bewijsBeoordeeldOp: new Date('2026-01-12'),
      bewijsstukken: [{ type: 'pdf', naam: 'reflectieverslag.pdf', pad: '/uploads/seed/lisa-reflectie-n1-a.pdf' }] },
    { id: 'seed-insch-lisa-reflectie-n1-b', activiteitId: 'seed-act-reflectie-n1-bouw-b', studentId: studentBouw.id,
      effectieveDeelname: true, bewijsStatus: 'ingediend',
      bewijsIngediendOp: new Date('2026-02-21'),
      bewijsstukken: [{ type: 'pdf', naam: 'portfolio_opdracht.pdf', pad: '/uploads/seed/lisa-reflectie-n1-b.pdf' }] },

    // Toekomstige activiteit: Lisa ingeschreven maar nog geen bewijs
    { id: 'seed-insch-lisa-toekomst-1', activiteitId: 'seed-act-ondernemend-n1-bouw-a', studentId: studentBouw.id,
      status: 'ingeschreven', effectieveDeelname: false, bewijsStatus: 'niet_ingediend' },

    // ============================================================
    // TOM (Informatica) - REFLECTIE volledig behaald, ONDERNEMEND bijna
    // REFLECTIE N1 (3x), N2 (2x), N3 (1x), N4 (1x)  → REFLECTIE VOLLEDIG
    // ONDERNEMEND N1 (3x), N2 (1x)  → ONDERNEMEND N1 volledig, N2 deels
    // PASSIE N1 (1x)  → deels
    // ============================================================

    // REFLECTIE N1 ×3
    { id: 'seed-insch-tom-reflectie-n1-a', activiteitId: 'seed-act-reflectie-n1-it-a', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-10-10'), bewijsBeoordeeldOp: new Date('2025-10-13'),
      bewijsstukken: [{ type: 'pdf', naam: 'code_review_reflectie.pdf', pad: '/uploads/seed/tom-reflectie-n1-a.pdf' }] },
    { id: 'seed-insch-tom-reflectie-n1-b', activiteitId: 'seed-act-reflectie-n1-it-b', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-11-21'), bewijsBeoordeeldOp: new Date('2025-11-24'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'retrospective_notes.jpg', pad: '/uploads/seed/tom-reflectie-n1-b.jpg' }] },
    { id: 'seed-insch-tom-reflectie-n1-c', activiteitId: 'seed-act-reflectie-n1-it-c', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-01-23'), bewijsBeoordeeldOp: new Date('2026-01-26'),
      bewijsstukken: [{ type: 'pdf', naam: 'portfolio_presentatie.pdf', pad: '/uploads/seed/tom-reflectie-n1-c.pdf' }] },

    // REFLECTIE (via student aanvraag - goedgekeurd)
    { id: 'seed-insch-tom-reflectie-aanvraag', activiteitId: 'seed-aanvraag-tom-1', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-10-03'), bewijsBeoordeeldOp: new Date('2025-10-06'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'udemy_certificaat.jpg', pad: '/uploads/seed/tom-reflectie-aanvraag.jpg' }] },

    // REFLECTIE N2 ×2
    { id: 'seed-insch-tom-reflectie-n2-a', activiteitId: 'seed-act-reflectie-n2-it-a', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-12-13'), bewijsBeoordeeldOp: new Date('2025-12-16'),
      bewijsstukken: [{ type: 'pdf', naam: 'advanced_reflectie.pdf', pad: '/uploads/seed/tom-reflectie-n2-a.pdf' }] },
    { id: 'seed-insch-tom-reflectie-n2-b', activiteitId: 'seed-act-reflectie-n2-it-b', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-02-06'), bewijsBeoordeeldOp: new Date('2026-02-09'),
      bewijsstukken: [{ type: 'pdf', naam: 'loopbaanreflectie.pdf', pad: '/uploads/seed/tom-reflectie-n2-b.pdf' }] },

    // REFLECTIE N3 ×1
    { id: 'seed-insch-tom-reflectie-n3-a', activiteitId: 'seed-act-reflectie-n3-it-a', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-02-27'), bewijsBeoordeeldOp: new Date('2026-03-02'),
      bewijsstukken: [{ type: 'pdf', naam: 'masterclass_verslag.pdf', pad: '/uploads/seed/tom-reflectie-n3-a.pdf' }] },

    // REFLECTIE N4 ×1
    { id: 'seed-insch-tom-reflectie-n4-a', activiteitId: 'seed-act-reflectie-n4-it-a', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-03-13'), bewijsBeoordeeldOp: new Date('2026-03-16'),
      bewijsstukken: [{ type: 'pdf', naam: 'capstone_presentatie.pdf', pad: '/uploads/seed/tom-reflectie-n4-a.pdf' }] },

    // ONDERNEMEND N1 ×3
    { id: 'seed-insch-tom-ondernemend-n1-a', activiteitId: 'seed-act-ondernemend-n1-it-a', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-10-27'), bewijsBeoordeeldOp: new Date('2025-10-30'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'hackathon_foto.jpg', pad: '/uploads/seed/tom-ondernemend-n1-a.jpg' }] },
    { id: 'seed-insch-tom-ondernemend-n1-b', activiteitId: 'seed-act-ondernemend-n1-it-b', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-11-17'), bewijsBeoordeeldOp: new Date('2025-11-20'),
      bewijsstukken: [{ type: 'pdf', naam: 'startup_weekend_bewijs.pdf', pad: '/uploads/seed/tom-ondernemend-n1-b.pdf' }] },
    { id: 'seed-insch-tom-ondernemend-n1-c', activiteitId: 'seed-act-ondernemend-n1-it-c', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-01-16'), bewijsBeoordeeldOp: new Date('2026-01-19'),
      bewijsstukken: [{ type: 'pdf', naam: 'pitching_feedback.pdf', pad: '/uploads/seed/tom-ondernemend-n1-c.pdf' }] },

    // ONDERNEMEND N2 ×1 (deels - target is 2)
    { id: 'seed-insch-tom-ondernemend-n2-a', activiteitId: 'seed-act-ondernemend-n2-it-a', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2026-02-13'), bewijsBeoordeeldOp: new Date('2026-02-16'),
      bewijsstukken: [{ type: 'pdf', naam: 'bmc_opdracht.pdf', pad: '/uploads/seed/tom-ondernemend-n2-a.pdf' }] },

    // PASSIE N1 ×1 (deels - target is 3)
    { id: 'seed-insch-tom-passie-n1-a', activiteitId: 'seed-act-passie-n1-it-a', studentId: studentIT.id,
      effectieveDeelname: true, bewijsStatus: 'goedgekeurd',
      bewijsIngediendOp: new Date('2025-10-31'), bewijsBeoordeeldOp: new Date('2025-11-03'),
      bewijsstukken: [{ type: 'afbeelding', naam: 'gastlezing_bewijs.jpg', pad: '/uploads/seed/tom-passie-n1-a.jpg' }] },

    // Tom: ingeschreven voor toekomstige activiteit (op prikbord)
    { id: 'seed-insch-tom-toekomst-1', activiteitId: 'seed-act-samen-n1-it-a', studentId: studentIT.id,
      status: 'ingeschreven', effectieveDeelname: false, bewijsStatus: 'niet_ingediend' },
  ]

  let bewijsstukkenCount = 0
  for (const insch of inschrijvingen) {
    const created = await prisma.inschrijving.upsert({
      where: {
        activiteitId_studentId: {
          activiteitId: insch.activiteitId,
          studentId: insch.studentId,
        },
      },
      update: {},
      create: {
        id: insch.id,
        activiteitId: insch.activiteitId,
        studentId: insch.studentId,
        inschrijvingsstatus: insch.status ?? 'ingeschreven',
        effectieveDeelname: insch.effectieveDeelname ?? false,
        bewijsStatus: insch.bewijsStatus ?? 'niet_ingediend',
        bewijsIngediendOp: insch.bewijsIngediendOp,
        bewijsBeoordeeldOp: insch.bewijsBeoordeeldOp,
        bewijsFeedback: insch.bewijsStatus === 'goedgekeurd' ? 'Goed ingediend, bewijs goedgekeurd.' : undefined,
      },
    })

    // Voeg bewijsstukken toe
    if (insch.bewijsstukken) {
      for (const bw of insch.bewijsstukken) {
        const existing = await prisma.bewijsstuk.findFirst({
          where: { inschrijvingId: created.id, bestandsnaam: bw.naam },
        })
        if (!existing) {
          await prisma.bewijsstuk.create({
            data: {
              type: bw.type,
              bestandsnaam: bw.naam,
              bestandspad: bw.pad,
              inschrijvingId: created.id,
            },
          })
          bewijsstukkenCount++
        }
      }
    }
  }
  console.log(`✅ ${inschrijvingen.length} inschrijvingen aangemaakt, ${bewijsstukkenCount} bewijsstukken`)

  // ============================================
  // STUDENT VOORTGANG
  // ============================================
  console.log('📊 Creating student voortgang...')

  // Lisa Bouwkunde voortgang (berekend op basis van goedgekeurde inschrijvingen):
  // PASSIE: N1=3, N2=2, N3=1, N4=0
  // SAMENWERKING: N1=3, N2=2, N3=1, N4=1
  // MULTIDISCIPLINAIR: N1=3, N2=1, N3=0, N4=0
  // REFLECTIE: N1=1 (1 goedgekeurd, 1 ingediend), N2=0, N3=0, N4=0
  // ONDERNEMEND: N1=0, N2=0, N3=0, N4=0
  await prisma.studentVoortgang.upsert({
    where: { studentId_schooljaar: { studentId: studentBouw.id, schooljaar: SCHOOLJAAR } },
    update: {
      aantalPassieN1: 3, aantalPassieN2: 2, aantalPassieN3: 1, aantalPassieN4: 0,
      aantalOndernemendN1: 0, aantalOndernemendN2: 0, aantalOndernemendN3: 0, aantalOndernemendN4: 0,
      aantalSamenwerkingN1: 3, aantalSamenwerkingN2: 2, aantalSamenwerkingN3: 1, aantalSamenwerkingN4: 1,
      aantalMultidisciplinairN1: 3, aantalMultidisciplinairN2: 1, aantalMultidisciplinairN3: 0, aantalMultidisciplinairN4: 0,
      aantalReflectieN1: 1, aantalReflectieN2: 0, aantalReflectieN3: 0, aantalReflectieN4: 0,
    },
    create: {
      studentId: studentBouw.id,
      opleidingId: bouw.id,
      schooljaar: SCHOOLJAAR,
      aantalPassieN1: 3, aantalPassieN2: 2, aantalPassieN3: 1, aantalPassieN4: 0,
      aantalOndernemendN1: 0, aantalOndernemendN2: 0, aantalOndernemendN3: 0, aantalOndernemendN4: 0,
      aantalSamenwerkingN1: 3, aantalSamenwerkingN2: 2, aantalSamenwerkingN3: 1, aantalSamenwerkingN4: 1,
      aantalMultidisciplinairN1: 3, aantalMultidisciplinairN2: 1, aantalMultidisciplinairN3: 0, aantalMultidisciplinairN4: 0,
      aantalReflectieN1: 1, aantalReflectieN2: 0, aantalReflectieN3: 0, aantalReflectieN4: 0,
    },
  })

  // Tom IT voortgang:
  // REFLECTIE: N1=4 (3 docent + 1 aanvraag), N2=2, N3=1, N4=1  → REFLECTIE VOLLEDIG
  // ONDERNEMEND: N1=3, N2=1, N3=0, N4=0
  // PASSIE: N1=1, N2=0, N3=0, N4=0
  await prisma.studentVoortgang.upsert({
    where: { studentId_schooljaar: { studentId: studentIT.id, schooljaar: SCHOOLJAAR } },
    update: {
      aantalPassieN1: 1, aantalPassieN2: 0, aantalPassieN3: 0, aantalPassieN4: 0,
      aantalOndernemendN1: 3, aantalOndernemendN2: 1, aantalOndernemendN3: 0, aantalOndernemendN4: 0,
      aantalSamenwerkingN1: 0, aantalSamenwerkingN2: 0, aantalSamenwerkingN3: 0, aantalSamenwerkingN4: 0,
      aantalMultidisciplinairN1: 0, aantalMultidisciplinairN2: 0, aantalMultidisciplinairN3: 0, aantalMultidisciplinairN4: 0,
      aantalReflectieN1: 4, aantalReflectieN2: 2, aantalReflectieN3: 1, aantalReflectieN4: 1,
    },
    create: {
      studentId: studentIT.id,
      opleidingId: it.id,
      schooljaar: SCHOOLJAAR,
      aantalPassieN1: 1, aantalPassieN2: 0, aantalPassieN3: 0, aantalPassieN4: 0,
      aantalOndernemendN1: 3, aantalOndernemendN2: 1, aantalOndernemendN3: 0, aantalOndernemendN4: 0,
      aantalSamenwerkingN1: 0, aantalSamenwerkingN2: 0, aantalSamenwerkingN3: 0, aantalSamenwerkingN4: 0,
      aantalMultidisciplinairN1: 0, aantalMultidisciplinairN2: 0, aantalMultidisciplinairN3: 0, aantalMultidisciplinairN4: 0,
      aantalReflectieN1: 4, aantalReflectieN2: 2, aantalReflectieN3: 1, aantalReflectieN4: 1,
    },
  })

  console.log('✅ Student voortgang aangemaakt')

  // ============================================
  // SYSTEEM INSTELLINGEN
  // ============================================
  console.log('⚙️ Creating system settings...')

  const defaultSettings = [
    {
      key: 'activity_types',
      value: JSON.stringify(['Workshop', 'Lezing', 'Bedrijfsbezoek', 'Netwerkevent', 'Vrijwilligerswerk', 'Cursus', 'Project', 'Anders']),
    },
    {
      key: 'activity_aard',
      value: JSON.stringify(['Sociaal', 'Technisch', 'Cultureel', 'Sportief', 'Zelfstudie', 'Anders']),
    },
    {
      key: 'verplicht_profiel',
      value: JSON.stringify(['Bouw', 'Tech', 'Beide', 'Geen']),
    },
  ]

  for (const setting of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log('✅ System settings aangemaakt')

  // ============================================
  // SAMENVATTING
  // ============================================
  console.log('')
  console.log('============================================')
  console.log('🎉 SEEDING COMPLETE!')
  console.log('============================================')
  console.log('')
  console.log(`📅 Schooljaar: ${SCHOOLJAAR}`)
  console.log('')
  console.log('Test accounts:')
  console.log('┌─────────────────────────────────────────────────────────────────────────────────┐')
  console.log('│ Role     │ Email                            │ Wachtwoord │ Info                  │')
  console.log('├─────────────────────────────────────────────────────────────────────────────────┤')
  console.log('│ Admin    │ admin@pxl.be                     │ admin123   │                       │')
  console.log('│ Docent   │ docent.bouw@pxl.be               │ docent123  │ Bouwkunde             │')
  console.log('│ Docent   │ docent.multi@pxl.be              │ docent123  │ IT coördinator + Bouw │')
  console.log('│ Student  │ student.bouw@student.pxl.be      │ student123 │ Lisa - Bouwkunde      │')
  console.log('│ Student  │ student.it@student.pxl.be        │ student123 │ Tom - Informatica     │')
  console.log('│ Student  │ emma.janssen@student.pxl.be      │ student123 │ Bouwkunde             │')
  console.log('│ Student  │ lucas.peeters@student.pxl.be     │ student123 │ Bouwkunde             │')
  console.log('│ Student  │ sophie.claes@student.pxl.be      │ student123 │ Informatica           │')
  console.log('│ Student  │ noah.willems@student.pxl.be      │ student123 │ Informatica           │')
  console.log('└─────────────────────────────────────────────────────────────────────────────────┘')
  console.log('')
  console.log('Scorekaart voortgang:')
  console.log('  Lisa (Bouwkunde):')
  console.log('    ✅ PASSIE: N1=3/3, N2=2/2, N3=1/1, N4=0/1  (3/4 niveaus volledig)')
  console.log('    ✅ SAMENWERKING: N1=3/3, N2=2/2, N3=1/1, N4=1/1  → VOLLEDIG BEHAALD 🏆')
  console.log('    ⏳ MULTIDISCIPLINAIR: N1=3/3, N2=1/2, N3=0/1, N4=0/1  (deels)')
  console.log('    ⏳ REFLECTIE: N1=1/3, rest 0  (deels)')
  console.log('    ❌ ONDERNEMEND: 0/3  (niet begonnen)')
  console.log('  Tom (Informatica):')
  console.log('    ✅ REFLECTIE: N1=4/3, N2=2/2, N3=1/1, N4=1/1  → VOLLEDIG BEHAALD 🏆')
  console.log('    ⏳ ONDERNEMEND: N1=3/3, N2=1/2, N3=0/1, N4=0/1  (deels)')
  console.log('    ⏳ PASSIE: N1=1/3  (deels)')
  console.log('    ❌ SAMENWERKING: 0  (niet begonnen)')
  console.log('    ❌ MULTIDISCIPLINAIR: 0  (niet begonnen)')
  console.log('')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
