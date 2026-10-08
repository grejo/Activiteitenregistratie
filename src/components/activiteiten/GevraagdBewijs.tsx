export type GekoppeldSjabloon = {
  sjabloon: { id: string; naam: string; bestandsnaam: string | null }
}

/**
 * Toont aan de student welk bewijs de docent/admin vraagt (vrije instructie)
 * en de sjablonen die bij de activiteit horen. Rendert niets als er geen van beide is.
 */
export default function GevraagdBewijs({
  bewijsInstructie,
  sjablonen = [],
  className = '',
}: {
  bewijsInstructie?: string | null
  sjablonen?: GekoppeldSjabloon[]
  className?: string
}) {
  if (!bewijsInstructie && sjablonen.length === 0) return null

  return (
    <div className={`p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <p className="font-semibold text-pxl-black text-sm">Gevraagd bewijs</p>
      {bewijsInstructie && (
        <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{bewijsInstructie}</p>
      )}
      {sjablonen.length > 0 && (
        <ul className="mt-2 space-y-1">
          {sjablonen.map(({ sjabloon }) => (
            <li key={sjabloon.id}>
              <a
                href={`/api/sjablonen/${sjabloon.id}/download`}
                className="text-sm text-blue-700 hover:underline"
              >
                ⬇︎ {sjabloon.naam}
                {sjabloon.bestandsnaam && (
                  <span className="text-xs text-gray-500"> ({sjabloon.bestandsnaam})</span>
                )}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
