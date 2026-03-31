'use client'

import { NIVEAUS, getVeldNaam, BEENTJE_VEREIST_VELD, BEENTJES_MET_NIVEAU } from '@/lib/beentjes'
import type { OpleidingTarget } from './ScorekaartView'

const GOLD = '#C8973B'
const GREEN = '#16a34a'
const GRAY = '#e5e7eb'
const DARK = '#111827'

// SVG viewport
const VW = 720
const VH = 510
// Circle centre
const CX = 360
const CY = 238
// Outer visible ring (stroke only) and inner filled circle
const RING_R = 138
const CIRCLE_R = 120

interface Props {
  voortgang: Record<string, number> | null
  target: OpleidingTarget | null
  heeftDuurzaamheid: boolean
}

// ---------- helpers ----------

function isBehaald(beentje: string, voortgang: Record<string, number> | null, target: OpleidingTarget | null): boolean {
  const vereistVeld = BEENTJE_VEREIST_VELD[beentje] as keyof OpleidingTarget
  if (!target?.[vereistVeld]) return false
  const totaal = NIVEAUS.reduce((sum, n) => sum + (voortgang?.[getVeldNaam(beentje, n)] ?? 0), 0)
  return totaal >= 1
}

function Checkmark({ cx, cy, r = 9 }: { cx: number; cy: number; r?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={GREEN} />
      <path
        d={`M${cx - r * 0.45},${cy + r * 0.05} L${cx - r * 0.05},${cy + r * 0.42} L${cx + r * 0.5},${cy - r * 0.32}`}
        stroke="white"
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}

// 4 horizontal bars (one per niveau) — shows actual count, gold if > 0
function ProgressBars({
  beentje,
  voortgang,
  cx,
  cy,
}: {
  beentje: string
  voortgang: Record<string, number> | null
  cx: number
  cy: number
}) {
  const W = 30
  const H = 8
  const GAP = 4
  const total = 4 * W + 3 * GAP
  const sx = cx - total / 2

  return (
    <g>
      {NIVEAUS.map((niveau, i) => {
        const veld = getVeldNaam(beentje, niveau)
        const behaald = voortgang?.[veld] ?? 0
        const hasActivities = behaald > 0
        const bx = sx + i * (W + GAP)
        return (
          <g key={niveau}>
            <rect x={bx} y={cy} width={W} height={H} rx={2.5} fill={GRAY} />
            {hasActivities && (
              <rect x={bx} y={cy} width={W} height={H} rx={2.5} fill={GOLD} />
            )}
          </g>
        )
      })}
    </g>
  )
}

// Label box + checkmark + bars below
function BeentjeLabel({
  x, y, w, h,
  lines,
  beentje,
  voortgang,
  target,
}: {
  x: number; y: number; w: number; h: number
  lines: string[]
  beentje: string
  voortgang: Record<string, number> | null
  target: OpleidingTarget | null
}) {
  const achieved = isBehaald(beentje, voortgang, target)
  const lh = 14
  const textH = lines.length * lh
  const textY = y + (h - textH) / 2 + lh * 0.8

  return (
    <g>
      {/* Box */}
      <rect x={x} y={y} width={w} height={h} rx={8} fill="white" stroke="#c4c4c4" strokeWidth={1.5} />
      {/* Text */}
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={textY + i * lh}
          textAnchor="middle"
          fontSize={11}
          fontWeight="700"
          fill={DARK}
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {line}
        </text>
      ))}
      {/* Checkmark overlay */}
      {achieved && <Checkmark cx={x + w - 12} cy={y + 12} r={9} />}
      {/* Bars below box — only for beentjes with niveau breakdown */}
      {BEENTJES_MET_NIVEAU.includes(beentje as typeof BEENTJES_MET_NIVEAU[number]) && (
        <ProgressBars
          beentje={beentje}
          voortgang={voortgang}
          cx={x + w / 2}
          cy={y + h + 5}
        />
      )}
    </g>
  )
}

// ---------- main component ----------

export default function XFactorVisual({ voortgang, target, heeftDuurzaamheid }: Props) {
  const boxes = [
    // REFLECTIE – top centre
    { beentje: 'REFLECTIE',       lines: ['REFLECTIE'],                            x: 254, y: 10,  w: 212, h: 42 },
    // PASSIE – left middle
    { beentje: 'PASSIE',          lines: ['(em)passie'],                           x: 10,  y: 218, w: 158, h: 42 },
    // ONDERNEMEND – right middle
    { beentje: 'ONDERNEMEND',     lines: ['ondernemend', '& innovatief'],           x: 552, y: 210, w: 158, h: 54 },
    // SAMENWERKING – bottom left
    { beentje: 'SAMENWERKING',    lines: ['(internationaal)', 'samen(net)werken'],  x: 10,  y: 368, w: 208, h: 54 },
    // MULTIDISCIPLINAIR – bottom right
    { beentje: 'MULTIDISCIPLINAIR', lines: ['multi- &', 'disciplinariteit'],        x: 502, y: 368, w: 208, h: 54 },
  ]

  const connectors: [number, number, number, number][] = [
    [CX,            10 + 42,   CX,            CY - RING_R],
    [10 + 158,      218 + 21,  CX - RING_R,  CY],
    [552,           210 + 27,  CX + RING_R,  CY],
    [10 + 208,      368,       CX - 0.707 * RING_R, CY + 0.707 * RING_R],
    [502,           368,       CX + 0.707 * RING_R, CY + 0.707 * RING_R],
    [CX,            CY + RING_R, CX, 443],
  ]

  const duurzX = 290, duurzY = 443, duurzW = 140, duurzH = 34
  const duurzaamheidBehaald = (target?.duurzaamheidVereist ?? false) && heeftDuurzaamheid

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full h-auto"
        aria-label="X-Factor voortgang visualisatie"
      >
        <defs>
          <marker id="xf-arrow-end" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5 z" fill="#888" />
          </marker>
          <marker id="xf-arrow-start" markerWidth="5" markerHeight="5" refX="1" refY="2.5" orient="auto-start-reverse">
            <path d="M0,0 L5,2.5 L0,5 z" fill="#888" />
          </marker>
          <clipPath id="xf-clip">
            <circle cx={CX} cy={CY} r={CIRCLE_R} />
          </clipPath>
        </defs>

        {/* Connectorlijnen */}
        {connectors.map(([x1, y1, x2, y2], i) => (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#888"
            strokeWidth={1.5}
            markerEnd="url(#xf-arrow-end)"
            markerStart="url(#xf-arrow-start)"
          />
        ))}

        {/* Buitenste ring */}
        <circle cx={CX} cy={CY} r={RING_R} fill="none" stroke="#111" strokeWidth={1.5} />

        {/* Gevulde zwarte cirkel + X-logo */}
        <g clipPath="url(#xf-clip)">
          <circle cx={CX} cy={CY} r={CIRCLE_R} fill={DARK} />
          <line x1={CX - 80} y1={CY - 90} x2={CX + 80} y2={CY + 90} stroke="white" strokeWidth={56} strokeLinecap="butt" />
          <line x1={CX + 80} y1={CY - 90} x2={CX - 80} y2={CY + 90} stroke="white" strokeWidth={56} strokeLinecap="butt" />
          <circle cx={CX} cy={CY} r={26} fill={DARK} />
        </g>

        {/* PXL tekst */}
        <text
          x={CX} y={CY + 5}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={13}
          fontWeight="700"
          fill="white"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          PXL
        </text>

        {/* 5 Beentje labels */}
        {boxes.map((box) => (
          <BeentjeLabel
            key={box.beentje}
            {...box}
            voortgang={voortgang}
            target={target}
          />
        ))}

        {/* DUURZAAM label */}
        <rect x={duurzX} y={duurzY} width={duurzW} height={duurzH} rx={8} fill="white" stroke="#c4c4c4" strokeWidth={1.5} />
        <text
          x={duurzX + duurzW / 2} y={duurzY + duurzH / 2 + 4}
          textAnchor="middle"
          fontSize={11} fontWeight="800" fill={DARK}
          letterSpacing={1.5}
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          DUURZAAM
        </text>
        {duurzaamheidBehaald && (
          <Checkmark cx={duurzX + duurzW - 12} cy={duurzY + duurzH / 2} r={9} />
        )}
      </svg>
    </div>
  )
}
