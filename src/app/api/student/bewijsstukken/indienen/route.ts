import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Student dient bewijsstukken in ter goedkeuring
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Alleen studenten kunnen bewijsstukken indienen' }, { status: 403 })
    }

    const { inschrijvingId } = await request.json()

    if (!inschrijvingId) {
      return NextResponse.json({ error: 'inschrijvingId is verplicht' }, { status: 400 })
    }

    // Haal inschrijving op en controleer eigenaarschap
    const inschrijving = await prisma.inschrijving.findUnique({
      where: { id: inschrijvingId },
      include: {
        bewijsstukken: true,
        activiteit: true,
      },
    })

    if (!inschrijving) {
      return NextResponse.json({ error: 'Inschrijving niet gevonden' }, { status: 404 })
    }

    if (inschrijving.studentId !== session.user.id) {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
    }

    // Controleer of er bewijsstukken zijn
    if (inschrijving.bewijsstukken.length === 0) {
      return NextResponse.json(
        { error: 'Upload eerst minimaal één bewijsstuk voordat je indient' },
        { status: 400 }
      )
    }

    // Controleer of de activiteit goedgekeurd is
    if (inschrijving.activiteit.status !== 'goedgekeurd' && inschrijving.activiteit.status !== 'gepubliceerd') {
      return NextResponse.json(
        { error: 'Je kunt alleen bewijsstukken indienen voor goedgekeurde activiteiten' },
        { status: 400 }
      )
    }

    // Controleer of er al bewijsstukken zijn ingediend die wachten op goedkeuring
    if (inschrijving.bewijsStatus === 'ingediend') {
      return NextResponse.json(
        { error: 'Bewijsstukken zijn al ingediend en wachten op goedkeuring' },
        { status: 400 }
      )
    }

    // Update de inschrijving
    const updatedInschrijving = await prisma.inschrijving.update({
      where: { id: inschrijvingId },
      data: {
        bewijsStatus: 'ingediend',
        bewijsIngediendOp: new Date(),
        bewijsFeedback: null, // Reset eventuele eerdere feedback
      },
      include: {
        bewijsstukken: true,
        activiteit: true,
      },
    })

    return NextResponse.json(updatedInschrijving)
  } catch (error) {
    console.error('Error submitting bewijsstukken:', error)
    return NextResponse.json(
      { error: 'Er is een fout opgetreden' },
      { status: 500 }
    )
  }
}
