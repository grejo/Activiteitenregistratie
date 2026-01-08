import { type ClassValue, clsx } from 'clsx'

/**
 * Combineert class names met clsx (simpele versie zonder tailwind-merge)
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

/**
 * Berekent het aantal uren tussen twee tijden
 * @param startuur - Starttijd in "HH:mm" formaat
 * @param einduur - Eindtijd in "HH:mm" formaat
 * @returns Aantal uren (met 2 decimalen)
 */
export function berekenUren(startuur: string, einduur: string): number {
  const [startH, startM] = startuur.split(':').map(Number)
  const [eindH, eindM] = einduur.split(':').map(Number)

  const startMinuten = startH * 60 + startM
  const eindMinuten = eindH * 60 + eindM

  const diffMinuten = eindMinuten - startMinuten
  const uren = diffMinuten / 60

  return Math.round(uren * 100) / 100
}

/**
 * Formatteert een datum naar Nederlands formaat
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Formatteert een datum en tijd naar Nederlands formaat
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('nl-BE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatteert uren voor weergave
 */
export function formatUren(uren: number): string {
  if (uren === 0) return '0'
  const formatted = uren.toFixed(1)
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted
}

/**
 * Haalt het huidige schooljaar op (bijv. "2024-2025")
 */
export function getCurrentSchooljaar(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1 // 0-indexed

  // Schooljaar begint in september
  if (month >= 9) {
    return `${year}-${year + 1}`
  } else {
    return `${year - 1}-${year}`
  }
}

/**
 * Genereert een slug van een string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Verwijder diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

/**
 * Truncateert een string naar een maximum lengte
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}

/**
 * Controleert of een activiteit al gestart is
 */
export function isActiviteitGestart(datum: Date | string, startuur: string): boolean {
  const d = typeof datum === 'string' ? new Date(datum) : datum
  const [hours, minutes] = startuur.split(':').map(Number)
  const startMoment = new Date(d)
  startMoment.setHours(hours, minutes, 0, 0)
  return new Date() >= startMoment
}

/**
 * Valideert een email adres
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Genereert een willekeurig wachtwoord
 */
export function generatePassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

/**
 * Wacht een bepaald aantal milliseconden
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
