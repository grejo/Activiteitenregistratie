export type AftekendocumentData = {
  student: {
    naam: string
    studentnummer: string | null
    academiejaar: string
    opleiding: string | null
  }
  activiteit: {
    titel: string
    doelstelling: string | null
    beoordelaar: string | null
    datum: string // "DD/MM/YYYY"
    locatie: string | null
    organisator: string | null
    geschatteUren: number | string | null
    verslagMaken: string | null
    andereDoc: string | null
  }
}
