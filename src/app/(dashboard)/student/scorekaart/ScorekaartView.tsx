'use client'

import { useState } from 'react'
import { BEENTJES, BEENTJE_LABELS, NIVEAUS, getVeldNaam, BEENTJE_VEREIST_VELD, BEENTJES_MET_NIVEAU } from '@/lib/beentjes'
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

export type OpleidingTarget = {
  doelNiveau1: number
  doelNiveau2: number
  doelNiveau3: number
  doelNiveau4: number
  passieVereist: boolean
  ondernemendVereist: boolean
  samenwerkingVereist: boolean
  multidisciplinairVereist: boolean
  reflectieVereist: boolean
  duurzaamheidVereist: boolean
}

type ScorekaartData = {
  schooljaar: string
  voortgang: Record<string, number> | null
  target: OpleidingTarget | null
  inschrijvingen: Inschrijving[]
}

// Helper: totaal activiteiten voor een beentje (alle niveaus)
function totaalVoorBeentje(beentje: string, voortgang: Record<string, number> | null): number {
  return NIVEAUS.reduce((sum, n) => sum + (voortgang?.[getVeldNaam(beentje, n)] ?? 0), 0)
}

// Helper: totaal activiteiten op een niveau (alle beentjes)
function totaalVoorNiveau(niveau: number, voortgang: Record<string, number> | null): number {
  return BEENTJES_MET_NIVEAU.reduce((sum, b) => sum + (voortgang?.[getVeldNaam(b, niveau)] ?? 0), 0)
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

  const totaalBehaald = inschrijvingen.length

  // Aggregeer duurzaamheidsthema's
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
  const heeftDuurzaamheid = duurzaamheidLijst.length > 0

  // Bereken behaalde beentjes (vereist + ≥ 1 activiteit)
  const behaaldBeentjes = BEENTJES.filter((beentje) => {
    const vereistVeld = BEENTJE_VEREIST_VELD[beentje] as keyof OpleidingTarget
    if (!target?.[vereistVeld]) return false
    return totaalVoorBeentje(beentje, voortgang) >= 1
  })
  const duurzaamheidBehaald = (target?.duurzaamheidVereist ?? false) && heeftDuurzaamheid

  // Beentjes vereist tellen voor de badge
  const beentjesVereist = BEENTJES.filter((b) => {
    const veld = BEENTJE_VEREIST_VELD[b] as keyof OpleidingTarget
    return target?.[veld] ?? false
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
              <div className="font-bold text-pxl-black">
                {behaaldBeentjes.length} van {beentjesVereist.length} vereist
              </div>
            </div>
          </div>

          <div className="card-flat">
            <div className="text-xs text-pxl-black-light uppercase tracking-wide mb-3">Voortgang beentjes</div>
            {beentjesVereist.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nog geen beentjes ingesteld.</p>
            ) : (
              <div className="space-y-2">
                {BEENTJES.map((b) => {
                  const veld = BEENTJE_VEREIST_VELD[b] as keyof OpleidingTarget
                  const vereist = target?.[veld] ?? false
                  const behaald = behaaldBeentjes.includes(b)
                  if (!vereist) return null
                  return (
                    <div key={b} className="flex items-center gap-2">
                      {behaald
                        ? <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</span>
                        : <span className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                      }
                      <span className={`text-sm font-medium ${behaald ? 'text-pxl-black' : 'text-gray-500'}`}>
                        {BEENTJE_LABELS[b]}
                      </span>
                    </div>
                  )
                })}
                {target?.duurzaamheidVereist && (
                  <div className="flex items-center gap-2">
                    {duurzaamheidBehaald
                      ? <span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold shrink-0">✓</span>
                      : <span className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                    }
                    <span className={`text-sm font-medium ${duurzaamheidBehaald ? 'text-pxl-black' : 'text-gray-500'}`}>
                      Duurzaamheid
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rechter kolom: SVG visual */}
        <div className="card p-3">
          <XFactorVisual
            voortgang={voortgang}
            target={target}
            heeftDuurzaamheid={heeftDuurzaamheid}
          />
        </div>
      </div>

      {/* Voortgangstabel */}
      <div className="card overflow-x-auto">
        <h2 className="font-heading font-bold text-xl text-pxl-black mb-4">Voortgang X-Factor</h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left py-2 px-3 font-semibold text-gray-700 border border-gray-200 w-44"></th>
              {NIVEAUS.map((n) => (
                <th key={n} className="text-center py-2 px-3 font-semibold text-gray-700 border border-gray-200">
                  Niveau {n}
                </th>
              ))}
              <th className="text-center py-2 px-3 font-semibold text-gray-700 border border-gray-200 bg-gray-100">TOTAAL</th>
              <th className="text-center py-2 px-3 font-semibold text-gray-500 italic border border-gray-200">Te behalen</th>
            </tr>
          </thead>
          <tbody>
            {/* Rijen per beentje (zonder Reflectie) */}
            {BEENTJES_MET_NIVEAU.map((beentje) => {
              const totaal = totaalVoorBeentje(beentje, voortgang)
              const vereist = (target?.[BEENTJE_VEREIST_VELD[beentje] as keyof OpleidingTarget] ?? false) as boolean
              const behaald = vereist && totaal >= 1
              return (
                <tr key={beentje} className="border-t">
                  <td className="py-2 px-3 text-center text-gray-800 border border-gray-200 text-xs font-medium">
                    {BEENTJE_LABELS[beentje]}
                  </td>
                  {NIVEAUS.map((n) => (
                    <td key={n} className="py-2 px-3 text-center text-gray-700 border border-gray-200">
                      {voortgang?.[getVeldNaam(beentje, n)] ?? 0}
                    </td>
                  ))}
                  <td className={`py-2 px-3 text-center font-bold border border-gray-200 bg-gray-50 ${behaald ? 'text-green-600' : 'text-gray-700'}`}>
                    {totaal}
                    {behaald && ' ✓'}
                  </td>
                  <td className="py-2 px-3 text-center italic text-gray-500 border border-gray-200">
                    {vereist ? 1 : '—'}
                  </td>
                </tr>
              )
            })}

            {/* TOTAAL rij */}
            <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
              <td className="py-2 px-3 text-center text-gray-800 border border-gray-200">TOTAAL</td>
              {NIVEAUS.map((n) => (
                <td key={n} className="py-2 px-3 text-center text-gray-800 border border-gray-200">
                  {totaalVoorNiveau(n, voortgang)}
                </td>
              ))}
              <td className="border border-gray-200" />
              <td className="border border-gray-200" />
            </tr>

            {/* Te behalen rij */}
            <tr className="italic text-gray-500">
              <td className="py-2 px-3 text-center border border-gray-200">Te behalen</td>
              {NIVEAUS.map((n) => {
                const doel = (target?.[`doelNiveau${n}` as keyof OpleidingTarget] ?? 0) as number
                const behaaldN = totaalVoorNiveau(n, voortgang)
                return (
                  <td key={n} className={`py-2 px-3 text-center border border-gray-200 ${doel > 0 && behaaldN >= doel ? 'text-green-600 font-bold not-italic' : ''}`}>
                    {doel > 0 ? doel : '—'}
                  </td>
                )
              })}
              <td className="border border-gray-200" />
              <td className="border border-gray-200" />
            </tr>
          </tbody>
        </table>

        {/* Reflectie rij */}
        {(() => {
          const reflectieVereist = target?.reflectieVereist ?? false
          const reflectieTotaal = totaalVoorBeentje('REFLECTIE', voortgang)
          const reflectieBehaald = reflectieVereist && reflectieTotaal >= 1
          return (
            <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded border border-gray-200">
              <span className="text-sm font-semibold text-gray-700 w-44">Reflectie</span>
              <span className="text-sm text-gray-600">
                {reflectieTotaal} activiteit{reflectieTotaal !== 1 ? 'en' : ''}
              </span>
              {reflectieVereist ? (
                reflectieBehaald
                  ? <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">✓ Behaald</span>
                  : <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full">Nog te behalen</span>
              ) : (
                <span className="ml-2 text-xs text-gray-400 italic">Niet vereist</span>
              )}
            </div>
          )
        })()}

        {/* Duurzaamheid rij */}
        <div className="mt-2">
          <table className="text-sm border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-center py-2 px-4 font-semibold text-gray-700 border border-gray-200 w-44"></th>
                <th className="text-center py-2 px-4 font-semibold text-gray-700 border border-gray-200 bg-gray-100">TOTAAL</th>
                <th className="text-center py-2 px-4 font-semibold text-gray-500 italic border border-gray-200">Te behalen</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 text-center text-gray-800 border border-gray-200 font-medium">Duurzaamheid</td>
                <td className={`py-2 px-4 text-center font-bold border border-gray-200 bg-gray-50 ${duurzaamheidBehaald ? 'text-green-600' : 'text-gray-700'}`}>
                  {duurzaamheidLijst.length}{duurzaamheidBehaald && ' ✓'}
                </td>
                <td className="py-2 px-4 text-center italic text-gray-500 border border-gray-200">
                  {target?.duurzaamheidVereist ? 1 : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Duurzaamheid thema's */}
      {duurzaamheidLijst.length > 0 && (
        <Accordion
          title="Duurzaamheid thema's"
          badge={
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
              {duurzaamheidLijst.length} thema{duurzaamheidLijst.length !== 1 ? "'s" : ''}
            </span>
          }
        >
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
        </Accordion>
      )}

      {/* Activiteiten Lijst */}
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
