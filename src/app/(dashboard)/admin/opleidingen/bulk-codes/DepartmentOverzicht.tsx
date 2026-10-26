'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DepartmentOverzichtRij } from '@/lib/opleidingSso'

export default function DepartmentOverzicht({ rijen }: { rijen: DepartmentOverzichtRij[] }) {
  const [filter, setFilter] = useState('')
  const f = filter.trim().toLowerCase()
  const zichtbaar = f
    ? rijen.filter(
        (r) =>
          r.department.toLowerCase().includes(f) ||
          r.doelOpleiding?.naam.toLowerCase().includes(f) ||
          r.huidig.some((h) => h.naam?.toLowerCase().includes(f))
      )
    : rijen

  return (
    <div className="card space-y-4">
      <div>
        <h2 className="font-heading font-bold text-lg text-pxl-black">SSO-afdelingen van studenten</h2>
        <p className="text-sm text-gray-600 mt-1 max-w-3xl">
          Per afdeling uit de SSO (bv. <code className="text-xs">1 - PBABT - GRM</code>): hoeveel studenten, naar
          welke opleiding de codes wijzen en waar ze nu gekoppeld zijn. Wijst een afstudeerrichting naar de
          verkeerde opleiding, voeg dan bij de juiste opleiding een extra code toe met de afstudeerrichting
          erbij (bv. <code className="text-xs">PBABT - GRM</code>). Die heeft voorrang op de algemene code.
          Bij het opslaan worden de studenten opnieuw gekoppeld.
        </p>
      </div>

      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter op afdeling of opleiding, bv. PBABT"
        className="input-field max-w-sm"
      />

      {zichtbaar.length === 0 ? (
        <p className="text-sm text-gray-500">Geen afdelingen gevonden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-500">SSO-afdeling</th>
                <th className="px-3 py-2 text-right font-medium text-gray-500">Studenten</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Mapping → opleiding</th>
                <th className="px-3 py-2 text-left font-medium text-gray-500">Nu gekoppeld aan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {zichtbaar.map((r) => {
                const afwijkend = r.huidig.some((h) => h.opleidingId !== (r.doelOpleiding?.id ?? null))
                return (
                  <tr key={r.department} className={afwijkend ? 'bg-yellow-50' : undefined}>
                    <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{r.department}</td>
                    <td className="px-3 py-2 text-right">{r.aantal}</td>
                    <td className="px-3 py-2">
                      {r.doelOpleiding ? (
                        <>
                          <Link
                            href={`/admin/opleidingen/${r.doelOpleiding.id}`}
                            className="text-pxl-gold hover:underline"
                          >
                            {r.doelOpleiding.naam}
                          </Link>
                          <span className="text-xs text-gray-500"> via code {r.gematchteCode}</span>
                        </>
                      ) : (
                        <span className="text-red-700">Geen opleiding met deze code</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {r.huidig.map((h) => (
                        <div key={h.opleidingId ?? 'geen'}>
                          {h.naam ?? <span className="text-gray-500">geen opleiding</span>}{' '}
                          <span className="text-xs text-gray-500">({h.aantal})</span>
                        </div>
                      ))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-500">
        Geel gemarkeerd: studenten die (nog) niet gekoppeld zijn aan de opleiding waar de mapping naar wijst.
        Ze worden bij hun volgende login of bij het opslaan van de codes opnieuw gekoppeld.
      </p>
    </div>
  )
}
