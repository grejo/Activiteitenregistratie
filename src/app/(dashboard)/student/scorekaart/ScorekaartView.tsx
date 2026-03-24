'use client'

import { useState } from 'react'
import { BEENTJES, BEENTJE_LABELS, NIVEAUS, getVeldNaam } from '@/lib/beentjes'
import XFactorVisual from './XFactorVisual'

function Accordion({
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string
  badge?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between text-left py-1"
        type="button"
      >
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-lg text-pxl-black">{title}</span>
          {badge}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  )
}

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
    duurzaamheid: { naam: string; icoon: string | null }
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

  // Aggregeer duurzaamheidsthema's over alle goedgekeurde activiteiten
  const duurzaamheidCounts = new Map<string, { naam: string; icoon: string | null; aantal: number }>()
  for (const i of inschrijvingen) {
    for (const d of i.activiteit.duurzaamheid) {
      const key = d.duurzaamheid.naam
      const existing = duurzaamheidCounts.get(key)
      if (existing) {
        existing.aantal++
      } else {
        duurzaamheidCounts.set(key, { naam: d.duurzaamheid.naam, icoon: d.duurzaamheid.icoon, aantal: 1 })
      }
    }
  }
  const duurzaamheidLijst = Array.from(duurzaamheidCounts.values()).sort((a, b) => b.aantal - a.aantal)

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

      {/* X-Factor Visual – 2 kolommen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Linker kolom: statistieken */}
        <div className="space-y-4">
          <div className="card-flat flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-pxl-gold-light flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-pxl-gold">{totaalBehaald}</span>
            </div>
            <div>
              <div className="text-xs text-pxl-black-light uppercase tracking-wide">Activiteiten</div>
              <div className="font-bold text-pxl-black">goedgekeurde activiteiten</div>
            </div>
          </div>

          <div className="card-flat flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black text-green-600">{behaaldBeentjes.length}</span>
            </div>
            <div>
              <div className="text-xs text-pxl-black-light uppercase tracking-wide">Beentjes behaald</div>
              <div className="font-bold text-pxl-black">{behaaldBeentjes.length} van {BEENTJES.length} voltooid</div>
            </div>
          </div>

          <div className="card-flat">
            <div className="text-xs text-pxl-black-light uppercase tracking-wide mb-3">Voltooid</div>
            {behaaldBeentjes.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nog geen beentjes volledig behaald.</p>
            ) : (
              <div className="space-y-2">
                {behaaldBeentjes.map((b) => (
                  <div key={b} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</span>
                    <span className="text-sm font-medium text-pxl-black">{BEENTJE_LABELS[b]}</span>
                  </div>
                ))}
                {BEENTJES.filter((b) => !behaaldBeentjes.includes(b)).map((b) => (
                  <div key={b} className="flex items-center gap-2 opacity-40">
                    <span className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                    <span className="text-sm text-gray-500">{BEENTJE_LABELS[b]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Rechter kolom: SVG visual */}
        <div className="card p-3">
          <XFactorVisual
            voortgang={voortgang}
            target={target}
            heeftDuurzaamheid={duurzaamheidLijst.length > 0}
          />
        </div>
      </div>

      {/* 5 Beentje blokken – accordion */}
      <div className="space-y-2">
        <h2 className="font-heading font-bold text-xl text-pxl-black">Voortgang per Beentje</h2>
        {BEENTJES.map((beentje) => {
          const niveausMetTarget = NIVEAUS.filter(
            (n) => (target?.[getVeldNaam(beentje, n)] ?? 0) > 0
          )
          const behaaldCount = niveausMetTarget.filter(
            (n) => (voortgang?.[getVeldNaam(beentje, n)] ?? 0) >= (target?.[getVeldNaam(beentje, n)] ?? 1)
          ).length
          const isVolledig = niveausMetTarget.length > 0 && behaaldCount === niveausMetTarget.length

          return (
            <Accordion
              key={beentje}
              title={BEENTJE_LABELS[beentje]}
              badge={
                isVolledig ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Behaald</span>
                ) : niveausMetTarget.length > 0 ? (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                    {behaaldCount}/{niveausMetTarget.length}
                  </span>
                ) : null
              }
            >
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
            </Accordion>
          )
        })}
      </div>

      {/* Duurzaamheid – accordion */}
      <Accordion
        title="Duurzaamheid"
        badge={
          duurzaamheidLijst.length > 0 ? (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              {duurzaamheidLijst.length} thema{duurzaamheidLijst.length !== 1 ? "'s" : ''}
            </span>
          ) : undefined
        }
      >
        {duurzaamheidLijst.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            Nog geen activiteiten met duurzaamheidsthema&apos;s goedgekeurd.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {duurzaamheidLijst.map((d) => (
              <div key={d.naam} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {d.icoon && <span className="text-2xl">{d.icoon}</span>}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 leading-tight">{d.naam}</div>
                </div>
                <span className="ml-2 shrink-0 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                  {d.aantal}×
                </span>
              </div>
            ))}
          </div>
        )}
      </Accordion>

      {/* Activiteiten Lijst – accordion */}
      {inschrijvingen.length > 0 ? (
        <Accordion
          title="Goedgekeurde Activiteiten"
          badge={
            <span className="px-2 py-0.5 bg-pxl-gold-light text-pxl-black text-xs font-semibold rounded-full">
              {inschrijvingen.length}
            </span>
          }
        >
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
        </Accordion>
      ) : (
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
