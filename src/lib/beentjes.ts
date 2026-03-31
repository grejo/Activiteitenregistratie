export const BEENTJE_LABELS: Record<string, string> = {
  PASSIE: '(Em)passie',
  ONDERNEMEND: 'Ondernemend en innovatief',
  SAMENWERKING: '(Internationaal) samenwerking',
  MULTIDISCIPLINAIR: 'Multi- & disciplinariteit',
  REFLECTIE: 'Reflectie',
}

export const BEENTJES = [
  'PASSIE',
  'ONDERNEMEND',
  'SAMENWERKING',
  'MULTIDISCIPLINAIR',
  'REFLECTIE',
] as const

export type BeentjeType = (typeof BEENTJES)[number]

export const NIVEAUS = [1, 2, 3, 4] as const

export type NiveauType = (typeof NIVEAUS)[number]

/** Geeft de veldnaam in StudentVoortgang terug (bijv. 'aantalPassieN1') */
export function getVeldNaam(beentje: string, niveau: number): string {
  const map: Record<string, string> = {
    PASSIE: 'Passie',
    ONDERNEMEND: 'Ondernemend',
    SAMENWERKING: 'Samenwerking',
    MULTIDISCIPLINAIR: 'Multidisciplinair',
    REFLECTIE: 'Reflectie',
  }
  return `aantal${map[beentje]}N${niveau}`
}

/** Vereist-veldnaam in OpleidingTarget (bijv. 'passieVereist') */
export const BEENTJE_VEREIST_VELD: Record<string, string> = {
  PASSIE: 'passieVereist',
  ONDERNEMEND: 'ondernemendVereist',
  SAMENWERKING: 'samenwerkingVereist',
  MULTIDISCIPLINAIR: 'multidisciplinairVereist',
  REFLECTIE: 'reflectieVereist',
}

/** De 4 beentjes met niveau-uitsplitsing (Reflectie heeft geen niveaus) */
export const BEENTJES_MET_NIVEAU = ['PASSIE', 'ONDERNEMEND', 'SAMENWERKING', 'MULTIDISCIPLINAIR'] as const
