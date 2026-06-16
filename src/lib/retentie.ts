import { unlink } from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma'

/**
 * Retentiebeleid bewijsstukken.
 *
 * Verwijdert de fysieke bestanden (foto's, PDF's) van een student, maar bewaart de
 * metadata: het Bewijsstuk-record blijft bestaan met `type`, `bestandsnaam` en
 * `uploadedAt`. `bestandspad` wordt leeggemaakt en `bestandVerwijderdOp` gezet.
 *
 * Gebruikt bij uitschrijving/afstuderen van een student (zie de opschoningspagina)
 * en bij het archiveren van een student.
 *
 * @returns aantal bestanden waarvan het fysieke bestand verwijderd is
 */
export async function verwijderBestandenVanStudent(studentId: string): Promise<number> {
  const bewijsstukken = await prisma.bewijsstuk.findMany({
    where: {
      inschrijving: { studentId },
      bestandVerwijderdOp: null,
    },
  })

  let verwijderd = 0
  for (const bewijs of bewijsstukken) {
    // Verwijder het fysieke bestand (lokale opslag onder public/)
    try {
      if (bewijs.bestandspad) {
        const filePath = path.join(process.cwd(), 'public', bewijs.bestandspad)
        await unlink(filePath)
      }
    } catch (err) {
      // Doorgaan ook als het bestand al weg is
      console.error(`[RETENTIE] Bestand niet gevonden of al verwijderd: ${bewijs.bestandspad}`, err)
    }

    // Metadata behouden, bestand markeren als verwijderd
    await prisma.bewijsstuk.update({
      where: { id: bewijs.id },
      data: { bestandspad: '', bestandVerwijderdOp: new Date() },
    })
    verwijderd++
  }

  return verwijderd
}
