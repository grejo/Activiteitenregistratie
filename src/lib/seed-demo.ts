/**
 * Shared seed-logica voor de DEMO-omgeving.
 * Wordt gebruikt door zowel het CLI-script (`npm run demo:seed`) als het
 * admin-only HTTP endpoint (`POST /api/admin/demo/seed`). Gebruikt de
 * gedeelde Prisma-singleton uit `@/lib/prisma`.
 */
import prisma from '@/lib/prisma'

export const DEMO_CODE = 'DEMO'

function currentSchooljaar(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  return m >= 9 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

export async function seedDemo(): Promise<void> {
  const opleiding = await prisma.opleiding.upsert({
    where: { code: DEMO_CODE },
    update: { naam: 'Demo Opleiding', actief: true },
    create: {
      code: DEMO_CODE,
      naam: 'Demo Opleiding',
      beschrijving: 'Sandbox-opleiding voor de demo-modus — data staat los van echte opleidingen.',
      autoGoedkeuringStudentActiviteiten: false,
    },
  })

  const student = await prisma.user.upsert({
    where: { email: 'demo.student@demo.local' },
    update: {
      naam: 'Lisa Demo',
      role: 'student',
      opleidingId: opleiding.id,
      actief: true,
      passwordHash: null,
      azureAdId: null,
    },
    create: {
      email: 'demo.student@demo.local',
      naam: 'Lisa Demo',
      role: 'student',
      opleidingId: opleiding.id,
      actief: true,
    },
  })

  const docent = await prisma.user.upsert({
    where: { email: 'demo.docent@demo.local' },
    update: {
      naam: 'Piet Demo',
      role: 'docent',
      actief: true,
      passwordHash: null,
      azureAdId: null,
    },
    create: {
      email: 'demo.docent@demo.local',
      naam: 'Piet Demo',
      role: 'docent',
      actief: true,
    },
  })

  await prisma.docentOpleiding.upsert({
    where: { docentId_opleidingId: { docentId: docent.id, opleidingId: opleiding.id } },
    update: { isCoordinator: true },
    create: { docentId: docent.id, opleidingId: opleiding.id, isCoordinator: true },
  })

  const schooljaar = currentSchooljaar()
  await prisma.opleidingTarget.upsert({
    where: { opleidingId_schooljaar: { opleidingId: opleiding.id, schooljaar } },
    update: {},
    create: {
      opleidingId: opleiding.id,
      schooljaar,
      doelNiveau1: 5,
      doelNiveau2: 3,
      doelNiveau3: 2,
      doelNiveau4: 1,
      passieVereist: true,
      ondernemendVereist: true,
      samenwerkingVereist: true,
      multidisciplinairVereist: true,
      reflectieVereist: true,
      duurzaamheidVereist: true,
    },
  })

  const themas = [
    { id: 'seed-dt-demo-0', naam: 'SDG 4 - Kwaliteitsonderwijs', icoon: '📚', volgorde: 0 },
    { id: 'seed-dt-demo-1', naam: 'SDG 9 - Innovatie & infrastructuur', icoon: '💡', volgorde: 1 },
    { id: 'seed-dt-demo-2', naam: 'SDG 12 - Verantwoorde consumptie', icoon: '♻️', volgorde: 2 },
  ]
  for (const t of themas) {
    await prisma.duurzaamheidsThema.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, opleidingId: opleiding.id },
    })
  }

  const nu = new Date()
  const overEenWeek = new Date(nu.getTime() + 7 * 24 * 3600 * 1000)
  const overTweeWeken = new Date(nu.getTime() + 14 * 24 * 3600 * 1000)
  const overMaand = new Date(nu.getTime() + 30 * 24 * 3600 * 1000)
  const geleden = new Date(nu.getTime() - 21 * 24 * 3600 * 1000)

  const acts = [
    {
      id: 'seed-act-demo-passie-1',
      titel: '🎬 DEMO — Gastlezing "Bouwen aan je toekomst"',
      typeActiviteit: 'Lezing',
      omschrijving: 'Demo-activiteit: gastspreker deelt hun carrière-inzichten. Ideaal voor de PASSIE-pijler.',
      datum: overEenWeek,
      startuur: '13:00',
      einduur: '15:00',
      locatie: 'Demo Auditorium',
      organisator: 'Demo Docent',
      beentje: 'PASSIE' as const,
      niveau: 1,
      maxPlaatsen: 40,
    },
    {
      id: 'seed-act-demo-samen-1',
      titel: '🎬 DEMO — Teamworkshop Design Thinking',
      typeActiviteit: 'Workshop',
      omschrijving: 'Demo-activiteit: hands-on teamworkshop rond design thinking. SAMENWERKING N2.',
      datum: overTweeWeken,
      startuur: '09:00',
      einduur: '16:00',
      locatie: 'Demo Lokaal B12',
      organisator: 'Piet Demo',
      beentje: 'SAMENWERKING' as const,
      niveau: 2,
      maxPlaatsen: 25,
    },
    {
      id: 'seed-act-demo-multi-1',
      titel: '🎬 DEMO — Interdisciplinair project met Zorgstudenten',
      typeActiviteit: 'Project',
      omschrijving: 'Demo-activiteit: samenwerking met andere richting. MULTIDISCIPLINAIR N1.',
      datum: overMaand,
      startuur: '10:00',
      einduur: '17:00',
      locatie: 'Demo Campus',
      organisator: 'Piet Demo',
      beentje: 'MULTIDISCIPLINAIR' as const,
      niveau: 1,
      maxPlaatsen: 30,
    },
    {
      id: 'seed-act-demo-onder-1',
      titel: '🎬 DEMO — Startup Weekend',
      typeActiviteit: 'Workshop',
      omschrijving: 'Demo-activiteit: 48u je eigen idee ontwikkelen. ONDERNEMEND N2.',
      datum: overMaand,
      startuur: '18:00',
      einduur: '20:00',
      locatie: 'Demo Innovation Lab',
      organisator: 'Startup Demo vzw',
      beentje: 'ONDERNEMEND' as const,
      niveau: 2,
      maxPlaatsen: 20,
    },
    {
      id: 'seed-act-demo-reflectie-1',
      titel: '🎬 DEMO — Loopbaanreflectie workshop',
      typeActiviteit: 'Workshop',
      omschrijving: 'Demo-activiteit: reflectie op eigen leertraject. REFLECTIE N1.',
      datum: overEenWeek,
      startuur: '14:00',
      einduur: '16:00',
      locatie: 'Demo Lokaal A2',
      organisator: 'Piet Demo',
      beentje: 'REFLECTIE' as const,
      niveau: 1,
      maxPlaatsen: 20,
    },
    {
      id: 'seed-act-demo-voorbij-1',
      titel: '🎬 DEMO — Vrijwilligerswerk buurtbouw (reeds voorbij)',
      typeActiviteit: 'Vrijwilligerswerk',
      omschrijving: 'Demo-activiteit die reeds heeft plaatsgevonden — geschikt voor bewijs-scenario.',
      datum: geleden,
      startuur: '09:00',
      einduur: '17:00',
      locatie: 'Demo Buurthuis',
      organisator: 'Buurtwerk Demo vzw',
      beentje: 'PASSIE' as const,
      niveau: 2,
      maxPlaatsen: 15,
    },
    {
      id: 'seed-act-demo-aftekenlijst-1',
      titel: '🎬 DEMO — Bedrijfsbezoek innovatielab (aftekenlijst)',
      typeActiviteit: 'Bedrijfsbezoek',
      omschrijving:
        'Demo-activiteit met verplichte aftekenlijst — geschikt om het aftekendocument en een nog niet ingediend bewijs te tonen.',
      datum: geleden,
      startuur: '13:00',
      einduur: '16:00',
      locatie: 'Demo Innovatielab',
      organisator: 'Piet Demo',
      beentje: 'ONDERNEMEND' as const,
      niveau: 1,
      maxPlaatsen: 20,
      aftekenlijstVereist: true,
    },
  ]

  for (const a of acts) {
    await prisma.activiteit.upsert({
      where: { id: a.id },
      update: {
        titel: a.titel,
        omschrijving: a.omschrijving,
        datum: a.datum,
        startuur: a.startuur,
        einduur: a.einduur,
        locatie: a.locatie,
        organisator: a.organisator,
        beentje: a.beentje,
        niveau: a.niveau,
        maxPlaatsen: a.maxPlaatsen,
        status: 'gepubliceerd',
        aftekenlijstVereist: 'aftekenlijstVereist' in a ? a.aftekenlijstVereist : false,
        opleidingId: opleiding.id,
      },
      create: {
        id: a.id,
        titel: a.titel,
        typeActiviteit: a.typeActiviteit,
        omschrijving: a.omschrijving,
        datum: a.datum,
        startuur: a.startuur,
        einduur: a.einduur,
        locatie: a.locatie,
        organisator: a.organisator,
        beentje: a.beentje,
        niveau: a.niveau,
        maxPlaatsen: a.maxPlaatsen,
        status: 'gepubliceerd',
        aftekenlijstVereist: 'aftekenlijstVereist' in a ? a.aftekenlijstVereist : false,
        typeAanvraag: 'docent',
        aangemaaktDoorId: docent.id,
        opleidingId: opleiding.id,
      },
    })
  }

  const dtLinks: [string, string][] = [
    ['seed-act-demo-passie-1', 'seed-dt-demo-0'],
    ['seed-act-demo-multi-1', 'seed-dt-demo-1'],
    ['seed-act-demo-onder-1', 'seed-dt-demo-2'],
  ]
  for (const [aid, tid] of dtLinks) {
    await prisma.activiteitDuurzaamheid.upsert({
      where: { activiteitId_duurzaamheidId: { activiteitId: aid, duurzaamheidId: tid } },
      update: {},
      create: { activiteitId: aid, duurzaamheidId: tid },
    })
  }

  const insch = await prisma.inschrijving.upsert({
    where: {
      activiteitId_studentId: {
        activiteitId: 'seed-act-demo-voorbij-1',
        studentId: student.id,
      },
    },
    update: {
      effectieveDeelname: true,
      bewijsStatus: 'ingediend',
      bewijsIngediendOp: new Date(),
    },
    create: {
      id: 'seed-insch-demo-voorbij-1',
      activiteitId: 'seed-act-demo-voorbij-1',
      studentId: student.id,
      inschrijvingsstatus: 'ingeschreven',
      effectieveDeelname: true,
      bewijsStatus: 'ingediend',
      bewijsIngediendOp: new Date(),
    },
  })

  const bewijsBestaat = await prisma.bewijsstuk.findFirst({
    where: { inschrijvingId: insch.id, bestandsnaam: 'demo-bewijs.pdf' },
  })
  if (!bewijsBestaat) {
    await prisma.bewijsstuk.create({
      data: {
        type: 'pdf',
        bestandsnaam: 'demo-bewijs.pdf',
        bestandspad: '/uploads/demo/lisa-demo-bewijs.pdf',
        inschrijvingId: insch.id,
      },
    })
  }

  // Inschrijving voor Lisa op de aftekenlijst-activiteit, bewust zonder bewijsstuk
  // en op 'niet_ingediend' — toont "aftekenlijst vereist" + "student heeft nog niets
  // ingediend" samen op één rij in de student-weergave.
  await prisma.inschrijving.upsert({
    where: {
      activiteitId_studentId: {
        activiteitId: 'seed-act-demo-aftekenlijst-1',
        studentId: student.id,
      },
    },
    update: {
      effectieveDeelname: true,
      bewijsStatus: 'niet_ingediend',
      bewijsIngediendOp: null,
    },
    create: {
      id: 'seed-insch-demo-aftekenlijst-1',
      activiteitId: 'seed-act-demo-aftekenlijst-1',
      studentId: student.id,
      inschrijvingsstatus: 'ingeschreven',
      effectieveDeelname: true,
      bewijsStatus: 'niet_ingediend',
    },
  })
}
