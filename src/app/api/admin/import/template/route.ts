import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/admin/import/template?type=activiteiten|gebruikers
// Genereert een leeg Excel-sjabloon met:
// - dropdowns (data-validation lists) waar mogelijk
// - datum/tijd-cellen met numFmt "yyyy-mm-dd hh:mm" en date-validation
// - een tweede tab "Uitleg" met wat elke kolom verwacht
export async function GET(request: Request) {
  const session = await auth()
  if (session?.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const type = url.searchParams.get('type') === 'gebruikers' ? 'gebruikers' : 'activiteiten'

  const opleidingen = await prisma.opleiding.findMany({
    where: { actief: true },
    orderBy: { naam: 'asc' },
    select: { naam: true },
  })
  const opleidingNamen = opleidingen.map((o) => o.naam)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Xfactorapp'
  wb.created = new Date()

  if (type === 'gebruikers') {
    await buildGebruikersSheet(wb, opleidingNamen)
  } else {
    await buildActiviteitenSheet(wb, opleidingNamen)
  }

  const arrayBuf = await wb.xlsx.writeBuffer()
  const body = new Uint8Array(arrayBuf)
  const filename =
    type === 'gebruikers'
      ? 'xfactorapp-import-gebruikers-sjabloon.xlsx'
      : 'xfactorapp-import-activiteiten-sjabloon.xlsx'

  return new NextResponse(body, {
    status: 200,
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}

// ---------------- helpers ----------------

// Excel data-validation list met inline waarden mag max ~255 tekens zijn.
// Voor lange lijsten schrijven we ze naar een verborgen Lookups-tab en
// verwijzen we via een range-formule.
function makeListValidation(
  values: string[],
  formulaeIfInline?: string
): ExcelJS.DataValidation {
  return {
    type: 'list',
    allowBlank: true,
    showErrorMessage: true,
    errorTitle: 'Ongeldige waarde',
    error: 'Kies een waarde uit de dropdown.',
    formulae: [formulaeIfInline ?? `"${values.join(',')}"`],
  }
}

// Bereken formule-verwijzingen (`=Lookups!$X$2:$X$n`) zonder het sheet al aan
// te maken. Zo kunnen we de refs meteen in de Data-sheet gebruiken en pas
// helemaal op het einde het Lookups-sheet toevoegen (laatste tab).
function computeLookupRefs(
  lists: Record<string, string[]>
): Record<string, string> {
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const refs: Record<string, string> = {}
  let col = 0
  for (const [name, values] of Object.entries(lists)) {
    const L = LETTERS[col]
    refs[name] = `=Lookups!$${L}$2:$${L}$${values.length + 1}`
    col++
  }
  return refs
}

// Voeg als laatste sheet in het workbook een beveiligd Lookups-blad toe.
// Het sheet wordt verborgen én beveiligd met een wachtwoord — Excel weigert
// bewerken en zichtbaar maken tenzij de gebruiker het wachtwoord opgeeft.
async function appendLookupsSheet(
  wb: ExcelJS.Workbook,
  lists: Record<string, string[]>
) {
  const ws = wb.addWorksheet('Lookups', { state: 'hidden' })
  let col = 1
  for (const [, values] of Object.entries(lists)) {
    const colLetter = ws.getColumn(col).letter
    ws.getCell(`${colLetter}1`).value = Object.keys(lists)[col - 1]
    ws.getCell(`${colLetter}1`).font = { bold: true }
    values.forEach((v, i) => {
      ws.getCell(`${colLetter}${i + 2}`).value = v
    })
    ws.getColumn(col).width = Math.min(
      Math.max(...values.map((v) => v.length + 2), 12),
      40
    )
    col++
  }

  // Beveilig alle cellen (default protection). Wachtwoord voor unlock.
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      cell.protection = { locked: true }
    })
  })
  await ws.protect('xfactorapp', {
    selectLockedCells: false,
    selectUnlockedCells: false,
    formatCells: false,
    formatColumns: false,
    formatRows: false,
    insertColumns: false,
    insertRows: false,
    deleteColumns: false,
    deleteRows: false,
    sort: false,
    autoFilter: false,
    pivotTables: false,
  })
}

function stylizeHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF030203' },
    }
    cell.alignment = { vertical: 'middle', wrapText: true }
  })
  row.height = 22
}

// ---------------- activiteiten ----------------

async function buildActiviteitenSheet(wb: ExcelJS.Workbook, opleidingNamen: string[]) {
  const AARD_LIST = [
    'Workshop',
    'Lezing',
    'Excursie',
    'Vorming',
    'Studiebezoek',
    'Vergadering',
    'Internationaal',
    'Andere',
  ]
  const BEENTJE_LIST = [
    'PASSIE N1', 'PASSIE N2', 'PASSIE N3', 'PASSIE N4',
    'ONDERNEMEND N1', 'ONDERNEMEND N2', 'ONDERNEMEND N3', 'ONDERNEMEND N4',
    'SAMENWERKING N1', 'SAMENWERKING N2', 'SAMENWERKING N3', 'SAMENWERKING N4',
    'MULTIDISCIPLINAIR N1', 'MULTIDISCIPLINAIR N2', 'MULTIDISCIPLINAIR N3', 'MULTIDISCIPLINAIR N4',
    'REFLECTIE N1', 'REFLECTIE N2', 'REFLECTIE N3', 'REFLECTIE N4',
  ]

  const lookups = {
    aard: AARD_LIST,
    beentjeNiveau: BEENTJE_LIST,
    opleiding: opleidingNamen,
  }
  const refs = computeLookupRefs(lookups)

  const ws = wb.addWorksheet('Data')
  ws.columns = [
    { header: 'Titel', key: 'titel', width: 34 },
    { header: 'Aard activiteit', key: 'aard', width: 18 },
    { header: 'Omschrijving activiteit', key: 'omschrijving', width: 40 },
    { header: 'Begindatum en beginuur activiteit', key: 'begin', width: 24 },
    { header: 'Einddatum en einduur activiteit', key: 'eind', width: 24 },
    { header: 'Locatie activiteit', key: 'locatie', width: 28 },
    { header: 'Weblink activiteit', key: 'weblink', width: 30 },
    { header: 'Aanwezige PXL-begeleider(s)', key: 'begeleider', width: 24 },
    { header: 'Deelnemer(s) activiteit', key: 'deelnemers', width: 40 },
    { header: 'Effectieve deelnemer(s) activiteit', key: 'effectief', width: 40 },
    { header: 'Organisator(en) activiteit', key: 'organisator', width: 24 },
    { header: 'Code deelnemer(s)', key: 'code', width: 24 },
    { header: 'Opmerkingen activiteit', key: 'opmerkingen', width: 30 },
    { header: 'Opleiding', key: 'opleiding', width: 20 },
  ]
  stylizeHeader(ws.getRow(1))

  // Voorbeeldrij
  ws.addRow({
    titel: 'Duurzaamheidsworkshop – Circulair bouwen',
    aard: 'Workshop',
    omschrijving: 'Halve dag workshop rond circulair bouwen.',
    begin: new Date(2026, 5, 28, 13, 0),
    eind: new Date(2026, 5, 28, 17, 0),
    locatie: 'PXL Corda Campus – Lokaal C104',
    weblink: 'https://pxl.be/duurzaamheid',
    begeleider: 'Jan Docent',
    deelnemers: 'lisa.student@student.pxl.be;jan.jansen@student.pxl.be',
    effectief: 'lisa.student@student.pxl.be',
    organisator: 'PXL Green Team',
    code: 'MULTIDISCIPLINAIR N2',
    opmerkingen: 'Verplicht voor 2de bachelor',
    opleiding: opleidingNamen[0] ?? '',
  })

  // Data-validation + numFmt op ~500 lege rijen zodat het meteen werkt bij invullen.
  const LAST = 502
  const dateFmt = 'yyyy-mm-dd hh:mm'

  // Datum/tijd-cellen
  for (const col of ['D', 'E']) {
    for (let r = 2; r <= LAST; r++) {
      const cell = ws.getCell(`${col}${r}`)
      cell.numFmt = dateFmt
      cell.dataValidation = {
        type: 'date',
        allowBlank: true,
        operator: 'greaterThan',
        showErrorMessage: true,
        errorTitle: 'Ongeldige datum',
        error: 'Voer een geldige datum + uur in (formaat 2026-06-28 13:00).',
        formulae: [new Date(2000, 0, 1)],
      }
    }
  }

  // Dropdowns
  applyValidationToRange(ws, 'B', 2, LAST, makeListValidation(AARD_LIST))
  applyValidationToRange(ws, 'L', 2, LAST, makeListValidation(BEENTJE_LIST, refs.beentjeNiveau))
  if (opleidingNamen.length > 0) {
    applyValidationToRange(
      ws,
      'N',
      2,
      LAST,
      makeListValidation(opleidingNamen, refs.opleiding)
    )
  }

  // Frozen header + auto-filter
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } }

  addUitlegSheet(wb, [
    ['Titel', 'Volledige naam van de activiteit.'],
    ['Aard activiteit', 'Kies uit de dropdown (Workshop, Lezing, Excursie, …).'],
    ['Omschrijving activiteit', 'Korte tekst voor het prikbord.'],
    [
      'Begindatum en beginuur activiteit',
      'Datum + uur in één cel. Cel is als datum-tijd geformatteerd; typ bv. "2026-06-28 13:00" of gebruik de vinkjes van Excel.',
    ],
    [
      'Einddatum en einduur activiteit',
      'Zelfde formaat als begindatum. Moet op dezelfde dag zijn.',
    ],
    ['Locatie activiteit', 'Fysieke locatie of "Online".'],
    ['Weblink activiteit', 'Optionele URL. Kolom "URL" wordt ook geaccepteerd.'],
    ['Aanwezige PXL-begeleider(s)', 'Wordt overgenomen in het veld Organisator van de activiteit.'],
    [
      'Deelnemer(s) activiteit',
      'E-mails gescheiden door ; of ,. De user accounts moeten al bestaan.',
    ],
    [
      'Effectieve deelnemer(s) activiteit',
      'Subset — studenten die effectief hebben deelgenomen.',
    ],
    ['Organisator(en) activiteit', 'Vrije tekst — extern of intern.'],
    [
      'Code deelnemer(s)',
      'Kies uit de dropdown. Bepaalt het beentje + niveau van de activiteit.',
    ],
    ['Opmerkingen activiteit', 'Vrije notitie voor admins.'],
    ['Opleiding', 'Kies uit de dropdown. Bepaalt bij welke opleiding de activiteit hoort.'],
  ])

  // Beveiligd Lookups-sheet als laatste tab
  await appendLookupsSheet(wb, lookups)
}

// ---------------- gebruikers ----------------

async function buildGebruikersSheet(wb: ExcelJS.Workbook, opleidingNamen: string[]) {
  const ROLE_LIST = ['student', 'docent', 'admin', 'superadmin']
  const ACTIEF_LIST = ['ja', 'nee']

  const lookups = { opleiding: opleidingNamen }
  const refs = computeLookupRefs(lookups)

  const ws = wb.addWorksheet('Data')
  ws.columns = [
    { header: 'Naam', key: 'naam', width: 28 },
    { header: 'E-mail', key: 'email', width: 34 },
    { header: 'Rol', key: 'rol', width: 14 },
    { header: 'Opleiding', key: 'opleiding', width: 24 },
    { header: 'Studentnummer', key: 'studentnummer', width: 16 },
    { header: 'Actief', key: 'actief', width: 10 },
  ]
  stylizeHeader(ws.getRow(1))

  ws.addRow({
    naam: 'Lisa Student',
    email: 'lisa.student@student.pxl.be',
    rol: 'student',
    opleiding: opleidingNamen[0] ?? '',
    studentnummer: 'r0123456',
    actief: 'ja',
  })

  const LAST = 502

  applyValidationToRange(ws, 'C', 2, LAST, makeListValidation(ROLE_LIST))
  applyValidationToRange(ws, 'F', 2, LAST, makeListValidation(ACTIEF_LIST))
  if (opleidingNamen.length > 0) {
    applyValidationToRange(
      ws,
      'D',
      2,
      LAST,
      makeListValidation(opleidingNamen, refs.opleiding)
    )
  }

  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } }

  addUitlegSheet(wb, [
    ['Naam', 'Volledige naam (voornaam + familienaam).'],
    ['E-mail', 'Uniek e-mailadres. Wordt gebruikt om in te loggen.'],
    ['Rol', 'Kies uit dropdown: student, docent, admin, superadmin.'],
    ['Opleiding', 'Kies uit dropdown. Vereist voor studenten.'],
    ['Studentnummer', 'Optioneel — enkel voor studenten.'],
    ['Actief', 'ja/nee. Standaard ja.'],
  ])

  // Beveiligd Lookups-sheet als laatste tab
  await appendLookupsSheet(wb, lookups)
}

// ---------------- common ----------------

function applyValidationToRange(
  ws: ExcelJS.Worksheet,
  colLetter: string,
  from: number,
  to: number,
  validation: ExcelJS.DataValidation
) {
  for (let r = from; r <= to; r++) {
    ws.getCell(`${colLetter}${r}`).dataValidation = validation
  }
}

function addUitlegSheet(wb: ExcelJS.Workbook, rows: string[][]) {
  const ws = wb.addWorksheet('Uitleg')
  ws.columns = [
    { header: 'Kolom', key: 'kolom', width: 34 },
    { header: 'Uitleg', key: 'uitleg', width: 80 },
  ]
  stylizeHeader(ws.getRow(1))
  for (const [kolom, uitleg] of rows) {
    const row = ws.addRow({ kolom, uitleg })
    row.getCell('uitleg').alignment = { wrapText: true, vertical: 'top' }
  }
}
