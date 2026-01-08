import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

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
      autoGoedkeuringStudentActiviteiten: true, // Auto-goedkeuring aan voor IT
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

  const duurzaamheidsThemas = [
    { naam: 'SDG 7 - Betaalbare en duurzame energie', icoon: '⚡', opleiding: bouw },
    { naam: 'SDG 9 - Industrie, innovatie en infrastructuur', icoon: '🏭', opleiding: bouw },
    { naam: 'SDG 11 - Duurzame steden en gemeenschappen', icoon: '🏙️', opleiding: bouw },
    { naam: 'SDG 12 - Verantwoorde consumptie en productie', icoon: '♻️', opleiding: bouw },
    { naam: 'Circulaire economie', icoon: '🔄', opleiding: bouw },
    { naam: 'SDG 4 - Kwaliteitsonderwijs', icoon: '📚', opleiding: it },
    { naam: 'SDG 9 - Industrie, innovatie en infrastructuur', icoon: '💡', opleiding: it },
    { naam: 'SDG 10 - Ongelijkheid verminderen', icoon: '⚖️', opleiding: it },
    { naam: 'Digitale inclusie', icoon: '🌐', opleiding: it },
  ]

  for (let index = 0; index < duurzaamheidsThemas.length; index++) {
    const thema = duurzaamheidsThemas[index]
    await prisma.duurzaamheidsThema.upsert({
      where: {
        id: `seed-duurzaamheid-${thema.opleiding.code}-${index}`,
      },
      update: {},
      create: {
        id: `seed-duurzaamheid-${thema.opleiding.code}-${index}`,
        naam: thema.naam,
        icoon: thema.icoon,
        volgorde: index,
        opleidingId: thema.opleiding.id,
      },
    })
  }

  console.log('✅ Duurzaamheidsthemas aangemaakt')

  // ============================================
  // EVALUATIE RUBRIC (voor Bouwkunde)
  // ============================================
  console.log('📊 Creating evaluatie rubric...')

  const rubric = await prisma.evaluatieRubric.upsert({
    where: { id: 'seed-rubric-bouw' },
    update: {},
    create: {
      id: 'seed-rubric-bouw',
      naam: 'Talent@work Evaluatie 2024-2025',
      beschrijving: 'Evaluatiecriteria voor Talent@work activiteiten',
      schooljaar: '2024-2025',
      actief: true,
      opleidingId: bouw.id,
    },
  })

  // Niveaus (kolommen)
  const niveaus = [
    { naam: 'Niveau 4', scoreWaarde: 4.0, volgorde: 1 },
    { naam: 'Niveau 3', scoreWaarde: 3.0, volgorde: 2 },
    { naam: 'Niveau 2', scoreWaarde: 2.0, volgorde: 3 },
    { naam: 'Niveau 1', scoreWaarde: 1.0, volgorde: 4 },
  ]

  const createdNiveaus: Record<string, string> = {}
  for (const niveau of niveaus) {
    const created = await prisma.rubricNiveau.upsert({
      where: { id: `seed-niveau-${niveau.volgorde}` },
      update: {},
      create: {
        id: `seed-niveau-${niveau.volgorde}`,
        naam: niveau.naam,
        scoreWaarde: niveau.scoreWaarde,
        volgorde: niveau.volgorde,
        rubricId: rubric.id,
      },
    })
    createdNiveaus[niveau.naam] = created.id
  }

  // Sectie met criteria
  const sectie = await prisma.rubricSectie.upsert({
    where: { id: 'seed-sectie-criteria' },
    update: {},
    create: {
      id: 'seed-sectie-criteria',
      naam: 'Evaluatiecriteria',
      gewichtPercentage: 100,
      volgorde: 1,
      rubricId: rubric.id,
    },
  })

  // Criteria (rijen)
  const criteria = [
    { naam: '(Em)passie', gewicht: 0.25 },
    { naam: 'Ondernemend en innovatief', gewicht: 0.25 },
    { naam: '(Internationaal) samen(net)werking', gewicht: 0.25 },
    { naam: 'Multi- & disciplinariteit', gewicht: 0.25 },
  ]

  for (let index = 0; index < criteria.length; index++) {
    const criterium = criteria[index]
    await prisma.rubricCriterium.upsert({
      where: { id: `seed-criterium-${index}` },
      update: {},
      create: {
        id: `seed-criterium-${index}`,
        naam: criterium.naam,
        gewichtPercentage: criterium.gewicht,
        volgorde: index,
        sectieId: sectie.id,
      },
    })
  }

  console.log('✅ Evaluatie rubric aangemaakt')

  // ============================================
  // UREN TARGETS
  // ============================================
  console.log('⏱️ Creating uren targets...')

  await prisma.opleidingUrenTarget.upsert({
    where: {
      opleidingId_schooljaar: {
        opleidingId: bouw.id,
        schooljaar: '2024-2025',
      },
    },
    update: {},
    create: {
      opleidingId: bouw.id,
      schooljaar: '2024-2025',
      urenNiveau1: 5.0,
      urenNiveau2: 3.0,
      urenNiveau3: 2.0,
      urenNiveau4: 1.0,
      urenDuurzaamheid: 1.0,
    },
  })

  await prisma.opleidingUrenTarget.upsert({
    where: {
      opleidingId_schooljaar: {
        opleidingId: it.id,
        schooljaar: '2024-2025',
      },
    },
    update: {},
    create: {
      opleidingId: it.id,
      schooljaar: '2024-2025',
      urenNiveau1: 4.0,
      urenNiveau2: 3.0,
      urenNiveau3: 2.0,
      urenNiveau4: 1.0,
      urenDuurzaamheid: 2.0,
    },
  })

  console.log('✅ Uren targets aangemaakt')

  // ============================================
  // GEBRUIKERS
  // ============================================
  console.log('👥 Creating users...')

  const hashedAdmin = await bcrypt.hash('admin123', 10)
  const hashedDocent = await bcrypt.hash('docent123', 10)
  const hashedStudent = await bcrypt.hash('student123', 10)

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pxl.be' },
    update: {},
    create: {
      email: 'admin@pxl.be',
      passwordHash: hashedAdmin,
      naam: 'Systeem Beheerder',
      role: 'admin',
    },
  })
  console.log('  ✅ Admin:', admin.email)

  // Docent Bouwkunde
  const docentBouw = await prisma.user.upsert({
    where: { email: 'docent.bouw@pxl.be' },
    update: {},
    create: {
      email: 'docent.bouw@pxl.be',
      passwordHash: hashedDocent,
      naam: 'Jan Docent',
      role: 'docent',
    },
  })

  await prisma.docentOpleiding.upsert({
    where: {
      docentId_opleidingId: {
        docentId: docentBouw.id,
        opleidingId: bouw.id,
      },
    },
    update: {},
    create: {
      docentId: docentBouw.id,
      opleidingId: bouw.id,
      isCoordinator: false,
    },
  })
  console.log('  ✅ Docent Bouw:', docentBouw.email)

  // Docent Multi (IT + Bouwkunde, coördinator IT)
  const docentMulti = await prisma.user.upsert({
    where: { email: 'docent.multi@pxl.be' },
    update: {},
    create: {
      email: 'docent.multi@pxl.be',
      passwordHash: hashedDocent,
      naam: 'Piet Coordinator',
      role: 'docent',
    },
  })

  await prisma.docentOpleiding.upsert({
    where: {
      docentId_opleidingId: {
        docentId: docentMulti.id,
        opleidingId: it.id,
      },
    },
    update: {},
    create: {
      docentId: docentMulti.id,
      opleidingId: it.id,
      isCoordinator: true,
    },
  })

  await prisma.docentOpleiding.upsert({
    where: {
      docentId_opleidingId: {
        docentId: docentMulti.id,
        opleidingId: bouw.id,
      },
    },
    update: {},
    create: {
      docentId: docentMulti.id,
      opleidingId: bouw.id,
      isCoordinator: false,
    },
  })
  console.log('  ✅ Docent Multi:', docentMulti.email, '(IT coördinator)')

  // Student Bouwkunde
  const studentBouw = await prisma.user.upsert({
    where: { email: 'student.bouw@student.pxl.be' },
    update: {},
    create: {
      email: 'student.bouw@student.pxl.be',
      passwordHash: hashedStudent,
      naam: 'Lisa Student',
      role: 'student',
      opleidingId: bouw.id,
    },
  })
  console.log('  ✅ Student Bouw:', studentBouw.email)

  // Student IT
  const studentIT = await prisma.user.upsert({
    where: { email: 'student.it@student.pxl.be' },
    update: {},
    create: {
      email: 'student.it@student.pxl.be',
      passwordHash: hashedStudent,
      naam: 'Tom Developer',
      role: 'student',
      opleidingId: it.id,
    },
  })
  console.log('  ✅ Student IT:', studentIT.email)

  // Extra studenten voor demo
  const extraStudenten = [
    { email: 'emma.janssen@student.pxl.be', naam: 'Emma Janssen', opleiding: bouw },
    { email: 'lucas.peeters@student.pxl.be', naam: 'Lucas Peeters', opleiding: bouw },
    { email: 'sophie.claes@student.pxl.be', naam: 'Sophie Claes', opleiding: it },
    { email: 'noah.willems@student.pxl.be', naam: 'Noah Willems', opleiding: it },
  ]

  for (const student of extraStudenten) {
    await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        email: student.email,
        passwordHash: hashedStudent,
        naam: student.naam,
        role: 'student',
        opleidingId: student.opleiding.id,
      },
    })
  }
  console.log('  ✅ Extra studenten aangemaakt')

  // ============================================
  // DEMO ACTIVITEITEN
  // ============================================
  console.log('📅 Creating demo activiteiten...')

  // Docent activiteit (gepubliceerd)
  const workshopBIM = await prisma.activiteit.upsert({
    where: { id: 'seed-activiteit-1' },
    update: {},
    create: {
      id: 'seed-activiteit-1',
      titel: 'Workshop BIM Modellering',
      typeActiviteit: 'Workshop',
      omschrijving:
        'Leer de basis van Building Information Modeling (BIM) en hoe je dit kunt toepassen in bouwprojecten. We werken met Revit en bekijken praktijkvoorbeelden.',
      datum: new Date('2025-02-15'),
      startuur: '14:00',
      einduur: '17:00',
      locatie: 'PXL Tech, Lokaal B201',
      organisatorPxl: 'Jan Docent',
      verplichtProfiel: 'Bouw',
      maxPlaatsen: 20,
      aantalIngeschreven: 2,
      status: 'gepubliceerd',
      typeAanvraag: 'docent',
      aangemaaktDoorId: docentBouw.id,
      opleidingId: bouw.id,
    },
  })

  // Voeg inschrijvingen toe
  await prisma.inschrijving.upsert({
    where: {
      activiteitId_studentId: {
        activiteitId: workshopBIM.id,
        studentId: studentBouw.id,
      },
    },
    update: {},
    create: {
      activiteitId: workshopBIM.id,
      studentId: studentBouw.id,
      inschrijvingsstatus: 'ingeschreven',
    },
  })

  // Tweede docent activiteit
  await prisma.activiteit.upsert({
    where: { id: 'seed-activiteit-2' },
    update: {},
    create: {
      id: 'seed-activiteit-2',
      titel: 'Bedrijfsbezoek: Bouwwerf Hasselt Centrum',
      typeActiviteit: 'Bedrijfsbezoek',
      omschrijving:
        'Bezoek aan de bouwwerf van het nieuwe winkelcentrum in Hasselt. Je krijgt uitleg over de constructietechnieken en projectplanning.',
      datum: new Date('2025-03-01'),
      startuur: '09:00',
      einduur: '12:00',
      locatie: 'Hasselt Centrum (exacte locatie volgt)',
      organisatorExtern: 'Bouwbedrijf XYZ',
      verplichtProfiel: 'Bouw',
      maxPlaatsen: 15,
      aantalIngeschreven: 0,
      status: 'gepubliceerd',
      typeAanvraag: 'docent',
      aangemaaktDoorId: docentBouw.id,
      opleidingId: bouw.id,
    },
  })

  // IT activiteit
  await prisma.activiteit.upsert({
    where: { id: 'seed-activiteit-3' },
    update: {},
    create: {
      id: 'seed-activiteit-3',
      titel: 'Hackathon: AI for Good',
      typeActiviteit: 'Project',
      omschrijving:
        '24-uurs hackathon waar je in teams werkt aan AI-oplossingen voor maatschappelijke problemen. Prijzen voor de beste projecten!',
      datum: new Date('2025-03-15'),
      startuur: '10:00',
      einduur: '10:00', // 24 uur later
      locatie: 'PXL Innovation Lab',
      organisatorPxl: 'Piet Coordinator',
      maxPlaatsen: 50,
      aantalIngeschreven: 1,
      status: 'gepubliceerd',
      typeAanvraag: 'docent',
      aangemaaktDoorId: docentMulti.id,
      opleidingId: it.id,
    },
  })

  // Student aanvraag (in review)
  await prisma.activiteit.upsert({
    where: { id: 'seed-activiteit-4' },
    update: {},
    create: {
      id: 'seed-activiteit-4',
      titel: 'Vrijwilligerswerk: Bouwkamp voor Jongeren',
      typeActiviteit: 'Vrijwilligerswerk',
      aard: 'Sociaal',
      omschrijving:
        'Ik ga meehelpen met een bouwkamp waar jongeren leren timmeren en metselen. Een weekend lang begeleid ik workshops.',
      datum: new Date('2025-04-12'),
      startuur: '09:00',
      einduur: '17:00',
      locatie: 'Jeugdcentrum Genk',
      organisatorExtern: 'Jeugdwerk Genk vzw',
      bewijslink: 'https://jeugdwerkgenk.be/bouwkamp2025',
      status: 'in_review',
      typeAanvraag: 'student',
      aangemaaktDoorId: studentBouw.id,
      opleidingId: bouw.id,
    },
  })

  // Student aanvraag (goedgekeurd - IT heeft auto-goedkeuring)
  await prisma.activiteit.upsert({
    where: { id: 'seed-activiteit-5' },
    update: {},
    create: {
      id: 'seed-activiteit-5',
      titel: 'Online cursus: React Advanced Patterns',
      typeActiviteit: 'Cursus',
      aard: 'Zelfstudie',
      omschrijving: 'Ik volg een gevorderde React cursus op Udemy over state management en performance optimalisatie.',
      datum: new Date('2025-02-01'),
      startuur: '19:00',
      einduur: '21:00',
      weblink: 'https://udemy.com/react-advanced',
      bewijslink: 'https://udemy.com/certificate/xxx',
      status: 'goedgekeurd',
      typeAanvraag: 'student',
      aangemaaktDoorId: studentIT.id,
      opleidingId: it.id,
    },
  })

  console.log('✅ Demo activiteiten aangemaakt')

  // ============================================
  // SYSTEEM INSTELLINGEN
  // ============================================
  console.log('⚙️ Creating system settings...')

  const defaultSettings = [
    {
      key: 'activity_types',
      value: JSON.stringify([
        'Workshop',
        'Lezing',
        'Bedrijfsbezoek',
        'Netwerkevent',
        'Vrijwilligerswerk',
        'Cursus',
        'Project',
        'Anders',
      ]),
    },
    {
      key: 'evaluation_levels',
      value: JSON.stringify(['Kennismaking', 'Verdieping', 'Expert']),
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
  console.log('Test accounts:')
  console.log('┌─────────────────────────────────────────────────────────┐')
  console.log('│ Role     │ Email                        │ Wachtwoord   │')
  console.log('├─────────────────────────────────────────────────────────┤')
  console.log('│ Admin    │ admin@pxl.be                 │ admin123     │')
  console.log('│ Docent   │ docent.bouw@pxl.be           │ docent123    │')
  console.log('│ Docent   │ docent.multi@pxl.be          │ docent123    │')
  console.log('│ Student  │ student.bouw@student.pxl.be  │ student123   │')
  console.log('│ Student  │ student.it@student.pxl.be    │ student123   │')
  console.log('└─────────────────────────────────────────────────────────┘')
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
