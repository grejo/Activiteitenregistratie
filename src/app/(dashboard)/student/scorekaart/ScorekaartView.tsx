'use client'

import { useState } from 'react'

type Activiteit = {
  id: string
  titel: string
  typeActiviteit: string
  datum: string
  startuur: string
  einduur: string
  locatie: string | null
  opleiding: { naam: string } | null
  duurzaamheid: {
    duurzaamheid: { naam: string }
  }[]
  evaluaties: {
    criterium: {
      id: string
      naam: string
      sectie: { naam: string }
    }
    niveau: { naam: string; scoreWaarde: number | null } | null
  }[]
}

type Inschrijving = {
  id: string
  effectieveDeelname: boolean
  activiteit: Activiteit
}

type UrenVoortgang = {
  urenNiveau1: number
  urenNiveau2: number
  urenNiveau3: number
  urenNiveau4: number
  urenDuurzaamheid: number
  lastCalculated: string
}

type UrenTargets = {
  urenNiveau1: number
  urenNiveau2: number
  urenNiveau3: number
  urenNiveau4: number
  urenDuurzaamheid: number
}

type RubricSectie = {
  id: string
  naam: string
  gewichtPercentage: number
  criteria: {
    id: string
    naam: string
    gewichtPercentage: number
  }[]
}

type Rubric = {
  id: string
  naam: string
  secties: RubricSectie[]
  niveaus: {
    id: string
    naam: string
    scoreWaarde: number | null
    volgorde: number
  }[]
}

type CriteriumUren = {
  criteriumId: string
  urenNiveau1: number
  urenNiveau2: number
  urenNiveau3: number
  urenNiveau4: number
  urenTotaal: number
  criterium: {
    naam: string
    sectie: { naam: string }
  }
}

type ScorekaartData = {
  schooljaar: string
  urenVoortgang: UrenVoortgang | null
  urenTargets: UrenTargets | null
  inschrijvingen: Inschrijving[]
  rubric: Rubric | null
  criteriumUren: CriteriumUren[]
}

function ProgressBar({
  current,
  target,
  label,
  color = 'pxl-gold',
}: {
  current: number
  target: number
  label: string
  color?: string
}) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0
  const isComplete = current >= target && target > 0

  const colorClasses: Record<string, string> = {
    'pxl-gold': 'bg-pxl-gold',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  }

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className={isComplete ? 'text-green-600 font-semibold' : 'text-gray-600'}>
          {current.toFixed(1)} / {target.toFixed(1)} uur
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${
            isComplete ? 'bg-green-500' : colorClasses[color] || 'bg-pxl-gold'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1 text-right">{percentage.toFixed(0)}%</div>
    </div>
  )
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

  const { urenVoortgang, urenTargets, inschrijvingen, rubric, criteriumUren, schooljaar } = data

  // Calculate totals
  const totaalUren =
    (urenVoortgang?.urenNiveau1 || 0) +
    (urenVoortgang?.urenNiveau2 || 0) +
    (urenVoortgang?.urenNiveau3 || 0) +
    (urenVoortgang?.urenNiveau4 || 0)

  const totaalTarget =
    (urenTargets?.urenNiveau1 || 0) +
    (urenTargets?.urenNiveau2 || 0) +
    (urenTargets?.urenNiveau3 || 0) +
    (urenTargets?.urenNiveau4 || 0)

  const totaalPercentage = totaalTarget > 0 ? Math.round((totaalUren / totaalTarget) * 100) : 0

  // Calculate duration of an activity in hours
  const calculateDuration = (startuur: string, einduur: string): number => {
    const [startH, startM] = startuur.split(':').map(Number)
    const [endH, endM] = einduur.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    return (endMinutes - startMinutes) / 60
  }

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

      {/* Overall Progress */}
      <div className="card">
        <h2 className="font-heading font-bold text-xl text-pxl-black mb-4">Totale Voortgang</h2>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className={`h-6 rounded-full transition-all duration-500 flex items-center justify-center text-white text-sm font-semibold ${
                  totaalPercentage >= 100 ? 'bg-green-500' : 'bg-pxl-gold'
                }`}
                style={{ width: `${Math.max(totaalPercentage, 10)}%` }}
              >
                {totaalPercentage}%
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-pxl-gold">{totaalUren.toFixed(1)}</div>
            <div className="text-sm text-gray-500">van {totaalTarget.toFixed(1)} uur</div>
          </div>
        </div>
        {totaalPercentage >= 100 && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
            Gefeliciteerd! Je hebt je uren target behaald voor dit schooljaar.
          </div>
        )}
      </div>

      {/* Uren per Niveau */}
      <div className="card">
        <h2 className="font-heading font-bold text-xl text-pxl-black mb-6">Uren per Niveau</h2>
        <div className="space-y-6">
          <ProgressBar
            current={urenVoortgang?.urenNiveau1 || 0}
            target={urenTargets?.urenNiveau1 || 0}
            label="Niveau 1 - Oriënteren"
            color="blue"
          />
          <ProgressBar
            current={urenVoortgang?.urenNiveau2 || 0}
            target={urenTargets?.urenNiveau2 || 0}
            label="Niveau 2 - Kennen"
            color="green"
          />
          <ProgressBar
            current={urenVoortgang?.urenNiveau3 || 0}
            target={urenTargets?.urenNiveau3 || 0}
            label="Niveau 3 - Toepassen"
            color="orange"
          />
          <ProgressBar
            current={urenVoortgang?.urenNiveau4 || 0}
            target={urenTargets?.urenNiveau4 || 0}
            label="Niveau 4 - Integreren"
            color="purple"
          />
        </div>
      </div>

      {/* Duurzaamheid */}
      <div className="card">
        <h2 className="font-heading font-bold text-xl text-pxl-black mb-6">Duurzaamheid</h2>
        <ProgressBar
          current={urenVoortgang?.urenDuurzaamheid || 0}
          target={urenTargets?.urenDuurzaamheid || 0}
          label="Duurzaamheidsuren"
          color="green"
        />
        <p className="text-sm text-gray-500 mt-3">
          Activiteiten met een duurzaamheidsthema tellen mee voor je duurzaamheidsuren.
        </p>
      </div>

      {/* Rubric Progress (if available) */}
      {rubric && criteriumUren.length > 0 && (
        <div className="card">
          <h2 className="font-heading font-bold text-xl text-pxl-black mb-6">
            Voortgang per Criterium
          </h2>
          <div className="space-y-6">
            {rubric.secties.map((sectie) => {
              const sectieCriteria = criteriumUren.filter(
                (cu) => cu.criterium.sectie.naam === sectie.naam
              )
              if (sectieCriteria.length === 0) return null

              return (
                <div key={sectie.id}>
                  <h3 className="font-semibold text-gray-700 mb-3">{sectie.naam}</h3>
                  <div className="space-y-3 pl-4">
                    {sectieCriteria.map((cu) => (
                      <div key={cu.criteriumId} className="text-sm">
                        <div className="flex justify-between mb-1">
                          <span>{cu.criterium.naam}</span>
                          <span className="text-gray-500">{cu.urenTotaal.toFixed(1)} uur</span>
                        </div>
                        <div className="flex gap-1">
                          {cu.urenNiveau1 > 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                              N1: {cu.urenNiveau1.toFixed(1)}u
                            </span>
                          )}
                          {cu.urenNiveau2 > 0 && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                              N2: {cu.urenNiveau2.toFixed(1)}u
                            </span>
                          )}
                          {cu.urenNiveau3 > 0 && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                              N3: {cu.urenNiveau3.toFixed(1)}u
                            </span>
                          )}
                          {cu.urenNiveau4 > 0 && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                              N4: {cu.urenNiveau4.toFixed(1)}u
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Deelgenomen Activiteiten */}
      <div className="card">
        <h2 className="font-heading font-bold text-xl text-pxl-black mb-4">
          Deelgenomen Activiteiten ({inschrijvingen.length})
        </h2>

        {inschrijvingen.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activiteit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thema&apos;s
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inschrijvingen.map((inschrijving) => {
                  const activiteit = inschrijving.activiteit
                  const duration = calculateDuration(activiteit.startuur, activiteit.einduur)

                  return (
                    <tr key={inschrijving.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(activiteit.datum).toLocaleDateString('nl-BE')}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-gray-900">{activiteit.titel}</div>
                        {activiteit.locatie && (
                          <div className="text-sm text-gray-500">{activiteit.locatie}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {activiteit.typeActiviteit}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {duration.toFixed(1)} uur
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {activiteit.duurzaamheid.length > 0 ? (
                            activiteit.duurzaamheid.map((d, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs"
                              >
                                {d.duurzaamheid.naam}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedActiviteit(activiteit)}
                          className="text-pxl-gold hover:text-pxl-gold-dark font-medium"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-500">
              Je hebt nog geen activiteiten met effectieve deelname.
            </p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-flat text-center">
          <div className="text-3xl font-bold text-pxl-gold">{inschrijvingen.length}</div>
          <div className="text-sm text-gray-500">Activiteiten</div>
        </div>
        <div className="card-flat text-center">
          <div className="text-3xl font-bold text-blue-600">{totaalUren.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Totaal Uren</div>
        </div>
        <div className="card-flat text-center">
          <div className="text-3xl font-bold text-green-600">
            {(urenVoortgang?.urenDuurzaamheid || 0).toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">Duurzaamheidsuren</div>
        </div>
        <div className="card-flat text-center">
          <div className="text-3xl font-bold text-purple-600">{totaalPercentage}%</div>
          <div className="text-sm text-gray-500">Voortgang</div>
        </div>
      </div>

      {/* Activity Detail Modal */}
      {selectedActiviteit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="font-heading font-bold text-xl text-pxl-black">
                Activiteit Details
              </h2>
              <button
                onClick={() => setSelectedActiviteit(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              <h3 className="font-heading font-bold text-xl text-pxl-black">
                {selectedActiviteit.titel}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Datum</div>
                  <div className="font-medium">
                    {new Date(selectedActiviteit.datum).toLocaleDateString('nl-BE', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Tijd</div>
                  <div className="font-medium">
                    {selectedActiviteit.startuur} - {selectedActiviteit.einduur}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Type</div>
                  <div className="font-medium capitalize">{selectedActiviteit.typeActiviteit}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Duur</div>
                  <div className="font-medium">
                    {calculateDuration(selectedActiviteit.startuur, selectedActiviteit.einduur).toFixed(1)} uur
                  </div>
                </div>
                {selectedActiviteit.locatie && (
                  <div className="col-span-2">
                    <div className="text-sm text-gray-500">Locatie</div>
                    <div className="font-medium">{selectedActiviteit.locatie}</div>
                  </div>
                )}
              </div>

              {/* Duurzaamheidsthema's */}
              {selectedActiviteit.duurzaamheid.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Duurzaamheidsthema&apos;s</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedActiviteit.duurzaamheid.map((d, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {d.duurzaamheid.naam}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluaties */}
              {selectedActiviteit.evaluaties.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Evaluatie</div>
                  <div className="space-y-2">
                    {selectedActiviteit.evaluaties.map((ev, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 rounded p-3">
                        <div>
                          <div className="font-medium text-sm">{ev.criterium.naam}</div>
                          <div className="text-xs text-gray-500">{ev.criterium.sectie.naam}</div>
                        </div>
                        {ev.niveau && (
                          <span className="px-3 py-1 bg-pxl-gold-light text-pxl-black rounded text-sm font-medium">
                            {ev.niveau.naam}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedActiviteit(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 font-medium transition-colors"
              >
                Sluiten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
