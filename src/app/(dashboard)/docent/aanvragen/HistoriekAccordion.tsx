'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatPeriode } from '@/lib/utils'

export type HistoriekItem = {
  id: string
  titel: string
  status: string
  datum: string
  einddatum: string | null
  opmerkingen: string | null
  beoordeeldOp: string | null
  aangemaaktDoor: {
    naam: string
    email: string
  }
  opleiding: {
    naam: string
  } | null
}

type Filter = 'alle' | 'goedgekeurd' | 'afgekeurd'

const isGoedgekeurd = (status: string) => status === 'goedgekeurd' || status === 'gepubliceerd'

function formatDatum(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('nl-BE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function HistoriekAccordion({ historiek }: { historiek: HistoriekItem[] }) {
  const [filter, setFilter] = useState<Filter>('goedgekeurd')
  const [zoekterm, setZoekterm] = useState('')

  const aantalGoedgekeurd = historiek.filter((h) => isGoedgekeurd(h.status)).length
  const aantalAfgekeurd = historiek.length - aantalGoedgekeurd

  const gefilterd = useMemo(() => {
    const term = zoekterm.trim().toLowerCase()
    return historiek.filter((h) => {
      if (filter === 'goedgekeurd' && !isGoedgekeurd(h.status)) return false
      if (filter === 'afgekeurd' && isGoedgekeurd(h.status)) return false
      if (!term) return true
      return (
        h.titel.toLowerCase().includes(term) ||
        h.aangemaaktDoor.naam.toLowerCase().includes(term) ||
        h.aangemaaktDoor.email.toLowerCase().includes(term)
      )
    })
  }, [historiek, filter, zoekterm])

  const filterKnoppen: { key: Filter; label: string; aantal: number }[] = [
    { key: 'goedgekeurd', label: 'Goedgekeurd', aantal: aantalGoedgekeurd },
    { key: 'afgekeurd', label: 'Afgekeurd', aantal: aantalAfgekeurd },
    { key: 'alle', label: 'Alle', aantal: historiek.length },
  ]

  return (
    <details className="card group/historiek">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 select-none">
        <div>
          <h2 className="font-heading font-bold text-xl text-pxl-black">
            Historiek van mijn beoordelingen
          </h2>
          <p className="text-sm text-pxl-black-light mt-1">
            {aantalGoedgekeurd} goedgekeurd · {aantalAfgekeurd} afgekeurd
          </p>
        </div>
        <span
          aria-hidden
          className="text-pxl-gold text-xl transition-transform group-open/historiek:rotate-180"
        >
          &#9662;
        </span>
      </summary>

      <div className="mt-6 space-y-4">
        {historiek.length === 0 ? (
          <p className="text-sm text-gray-500">
            Je hebt nog geen aanvragen beoordeeld.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2">
                {filterKnoppen.map((k) => (
                  <button
                    key={k.key}
                    type="button"
                    onClick={() => setFilter(k.key)}
                    className={`px-3 py-1.5 rounded text-sm font-medium border transition-colors ${
                      filter === k.key
                        ? 'bg-pxl-gold border-pxl-gold text-white'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {k.label} ({k.aantal})
                  </button>
                ))}
              </div>
              <input
                type="search"
                value={zoekterm}
                onChange={(e) => setZoekterm(e.target.value)}
                placeholder="Zoek op activiteit of student..."
                className="input-field w-full md:w-72"
              />
            </div>

            {gefilterd.length === 0 ? (
              <p className="text-sm text-gray-500">Geen beoordelingen gevonden.</p>
            ) : (
              <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
                {gefilterd.map((item) => (
                  <details key={item.id} className="group/item">
                    <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3 hover:bg-gray-50">
                      <span
                        aria-hidden
                        className="text-gray-400 text-xs transition-transform group-open/item:rotate-90"
                      >
                        &#9654;
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">{item.titel}</div>
                        <div className="text-sm text-gray-500 truncate">{item.aangemaaktDoor.naam}</div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isGoedgekeurd(item.status)
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {isGoedgekeurd(item.status) ? 'Goedgekeurd' : 'Afgekeurd'}
                      </span>
                      <span className="hidden shrink-0 text-sm text-gray-500 sm:block">
                        {formatDatum(item.beoordeeldOp)}
                      </span>
                    </summary>

                    <div className="bg-gray-50 px-4 py-4 pl-11 space-y-3 text-sm">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="text-gray-500">Student</div>
                          <div className="font-medium">{item.aangemaaktDoor.naam}</div>
                          <div className="text-gray-500">{item.aangemaaktDoor.email}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Datum activiteit</div>
                          <div className="font-medium">{formatPeriode(item.datum, item.einddatum)}</div>
                        </div>
                        {item.opleiding && (
                          <div>
                            <div className="text-gray-500">Opleiding</div>
                            <div className="font-medium">{item.opleiding.naam}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-gray-500">Beoordeeld op</div>
                          <div className="font-medium">{formatDatum(item.beoordeeldOp)}</div>
                        </div>
                      </div>
                      {item.opmerkingen && (
                        <div>
                          <div className="text-gray-500">Opmerkingen</div>
                          <p className="text-gray-700 whitespace-pre-wrap">{item.opmerkingen}</p>
                        </div>
                      )}
                      <Link
                        href={`/docent/aanvragen/${item.id}`}
                        className="inline-block text-pxl-gold hover:underline font-medium"
                      >
                        Volledige details bekijken &rarr;
                      </Link>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </details>
  )
}
