'use client'

import { useState } from 'react'
import { BEENTJES, BEENTJE_LABELS, NIVEAUS, getVeldNaam } from '@/lib/beentjes'

type Activiteit = {
  id: string
  titel: string
  typeActiviteit: string
  datum: string
  startuur: string
  einduur: string
  locatie: string | null
  beentje: string | null
  niveau: number | null
  opleiding: { naam: string } | null
  duurzaamheid: {
    duurzaamheid: { naam: string }
  }[]
}

type Inschrijving = {
  id: string
  effectieveDeelname: boolean
  activiteit: Activiteit
}

type ScorekaartData = {
  schooljaar: string
  voortgang: Record<string, number> | null
  target: Record<string, number> | null
  inschrijvingen: Inschrijving[]
}

export default function ScorekaartView({
  data,
  studentNaam,
  opleidingNaam,
}: {
  data: ScorekaartData
  studentNaam: string
  opleidingNaam: string | null
}) {
  const [selectedActiviteit, setSelectedActiviteit] = useState<Activiteit | null>(null)

  const { voortgang, target, inschrijvingen, schooljaar } = data

  // Bereken totaal behaalde activiteiten
  const totaalBehaald = inschrijvingen.length

  // Bereken hoeveel beentjes volledig zijn (alle niveaus met target > 0 gehaald)
  const behaaldBeentjes = BEENTJES.filter((beentje) => {
    const niveausMetTarget = NIVEAUS.filter((n) => (target?.[getVeldNaam(beentje, n)] ?? 0) > 0)
    if (niveausMetTarget.length === 0) return false
    return niveausMetTarget.every(
      (n) => (voortgang?.[getVeldNaam(beentje, n)] ?? 0) >= (target?.[getVeldNaam(beentje, n)] ?? 0)
    )
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Scorekaart
        </h1>
        <p className="text-pxl-black-light mt-4">
          Bekijk je voortgang voor schooljaar {schooljaar}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-pxl-gold-light text-pxl-black rounded-full text-sm font-medium">
            {studentNaam}
          </span>
          {opleidingNaam && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {opleidingNaam}
            </span>
          )}
        </div>
      </div>

      {/* Overzicht */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-flat text-center">
          <div className="text-sm text-pxl-black-light">Activiteiten</div>
          <div className="text-3xl font-bold text-pxl-gold">{totaalBehaald}</div>
        </div>
        <div className="card-flat text-center">
          <div className="text-sm text-pxl-black-light">Beentjes behaald</div>
          <div className="text-3xl font-bold text-green-600">{behaaldBeentjes.length} / {BEENTJES.length}</div>
        </div>
        {behaaldBeentjes.length > 0 && (
          <div className="card-flat col-span-2">
            <div className="text-sm text-pxl-black-light mb-2">Voltooid</div>
            <div className="flex flex-wrap gap-1">
              {behaaldBeentjes.map((b) => (
                <span key={b} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  ✓ {BEENTJE_LABELS[b]}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5 Beentje blokken */}
      <div className="space-y-4">
        <h2 className="font-heading font-bold text-xl text-pxl-black">Voortgang per Beentje</h2>
        {BEENTJES.map((beentje) => {
          const niveausMetTarget = NIVEAUS.filter(
            (n) => (target?.[getVeldNaam(beentje, n)] ?? 0) > 0
          )

          return (
            <div key={beentje} className="card">
              <h3 className="font-heading font-bold text-lg text-pxl-black mb-4">
                {BEENTJE_LABELS[beentje]}
              </h3>
              {niveausMetTarget.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Geen targets ingesteld voor dit beentje.</p>
              ) : (
                <div className="space-y-3">
                  {niveausMetTarget.map((niveau) => {
                    const veld = getVeldNaam(beentje, niveau)
                    const behaald = voortgang?.[veld] ?? 0
                    const doel = target?.[veld] ?? 0
                    const pct = doel > 0 ? Math.min(100, (behaald / doel) * 100) : 0
                    const volledig = behaald >= doel

                    return (
                      <div key={niveau}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">Niveau {niveau}</span>
                          <span className={volledig ? 'text-green-600 font-bold' : 'text-gray-600'}>
                            {behaald} / {doel} activiteiten
                          </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              volledig ? 'bg-green-500' : 'bg-pxl-gold'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Activiteiten Lijst */}
      {inschrijvingen.length > 0 && (
        <div className="card">
          <h2 className="font-heading font-bold text-xl text-pxl-black mb-4">
            Goedgekeurde Activiteiten
          </h2>
          <div className="space-y-3">
            {inschrijvingen.map((i) => (
              <div
                key={i.id}
                className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() =>
                  setSelectedActiviteit(
                    selectedActiviteit?.id === i.activiteit.id ? null : i.activiteit
                  )
                }
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{i.activiteit.titel}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(i.activiteit.datum).toLocaleDateString('nl-BE')} •{' '}
                    {i.activiteit.typeActiviteit}
                    {i.activiteit.beentje && (
                      <>
                        {' '}•{' '}
                        <span className="text-pxl-gold font-medium">
                          {BEENTJE_LABELS[i.activiteit.beentje]}
                        </span>
                        {i.activiteit.niveau && ` N${i.activiteit.niveau}`}
                      </>
                    )}
                  </div>
                  {selectedActiviteit?.id === i.activiteit.id && (
                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      {i.activiteit.locatie && <div>📍 {i.activiteit.locatie}</div>}
                      {i.activiteit.opleiding && <div>🎓 {i.activiteit.opleiding.naam}</div>}
                    </div>
                  )}
                </div>
                <div className="ml-4 text-green-600 font-bold text-lg">✓</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {inschrijvingen.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="font-heading font-bold text-xl text-pxl-black mb-2">
            Nog geen goedgekeurde activiteiten
          </h3>
          <p className="text-pxl-black-light">
            Dien bewijsstukken in voor je activiteiten om je scorekaart te vullen.
          </p>
        </div>
      )}
    </div>
  )
}
