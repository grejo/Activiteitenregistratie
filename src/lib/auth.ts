import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import MicrosoftEntraId from 'next-auth/providers/microsoft-entra-id'
import type { NextAuthConfig } from 'next-auth'

const prisma = new PrismaClient()

export type UserRole = 'superadmin' | 'admin' | 'docent' | 'student'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    naam: string
    role: UserRole
    opleidingId?: string | null
    opleidingNaam?: string | null
    adminOpleidingIds?: string[]
  }

  interface Session {
    user: User & {
      id: string
      role: UserRole
      opleidingId?: string | null
      opleidingNaam?: string | null
      adminOpleidingIds?: string[]
    }
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    id: string
    role: UserRole
    naam: string
    opleidingId?: string | null
    opleidingNaam?: string | null
    adminOpleidingIds?: string[]
  }
}

const azureProviders =
  process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID
    ? [
        MicrosoftEntraId({
          clientId: process.env.AZURE_AD_CLIENT_ID,
          clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
          issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
          authorization: {
            params: { scope: 'openid email profile User.Read' },
          },
        }),
      ]
    : []

// Credentials-login (email + wachtwoord) is uitsluitend beschikbaar in development
// voor lokaal testen met seed-accounts. In productie kan er enkel via PXL SSO
// worden aangemeld.
const credentialsProvider =
  process.env.NODE_ENV === 'production'
    ? []
    : [
        Credentials({
          name: 'credentials',
          credentials: {
            email: { label: 'Email', type: 'email' },
            password: { label: 'Wachtwoord', type: 'password' },
          },
          async authorize(credentials) {
            if (!credentials?.email || !credentials?.password) {
              return null
            }

            const email = credentials.email as string
            const password = credentials.password as string

            const user = await prisma.user.findUnique({
              where: { email },
              include: { opleiding: true, adminOpleidingen: true },
            })

            if (!user || !user.actief || !user.passwordHash) {
              return null
            }

            const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

            if (!isPasswordValid) {
              return null
            }

            return {
              id: user.id,
              email: user.email,
              naam: user.naam,
              role: user.role as UserRole,
              opleidingId: user.opleidingId,
              opleidingNaam: user.opleiding?.naam || null,
              adminOpleidingIds: user.adminOpleidingen.map((o) => o.opleidingId),
            }
          },
        }),
      ]

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [...azureProviders, ...credentialsProvider],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'microsoft-entra-id' && profile) {
        const p = profile as Record<string, unknown>

        // Log alle beschikbare profielvelden voor debugging
        console.log('[AUTH] Microsoft profile keys:', Object.keys(p))
        console.log('[AUTH] profile.email:', profile.email)
        console.log('[AUTH] preferred_username:', p.preferred_username)
        console.log('[AUTH] upn:', p.upn)
        console.log('[AUTH] unique_name:', p.unique_name)
        console.log('[AUTH] department:', p.department)

        const email = (
          profile.email ||
          p.preferred_username ||
          p.upn ||
          p.unique_name
        ) as string | undefined

        const azureAdId = (p.oid as string | undefined) || profile.sub
        const naam = (profile.name as string | undefined) || email || 'Onbekend'
        const department = p.department as string | undefined

        console.log('[AUTH] resolved email:', email, '| naam:', naam, '| department:', department)

        if (!email) {
          console.error('[AUTH] Geen email gevonden in profiel, login geblokkeerd')
          return false
        }

        const normalizedEmail = email.toLowerCase()

        try {
          // Zoek opleiding op basis van department-code (indien aanwezig).
          // Eerst op de primaire code, daarna op de extra OpleidingCode-mappings
          // (bv. afstandsstudenten 'pbboa', EMA, management).
          let opleidingId: string | null = null
          if (department) {
            const opleiding = await prisma.opleiding.findFirst({
              where: { code: { equals: department, mode: 'insensitive' } },
              select: { id: true },
            })
            if (opleiding) {
              opleidingId = opleiding.id
              console.log('[AUTH] Opleiding gevonden via primaire code:', department, '→', opleidingId)
            } else {
              const extra = await prisma.opleidingCode.findFirst({
                where: { code: { equals: department, mode: 'insensitive' } },
                select: { opleidingId: true },
              })
              if (extra) {
                opleidingId = extra.opleidingId
                console.log('[AUTH] Opleiding gevonden via extra code:', department, '→', opleidingId)
              } else {
                console.log('[AUTH] Geen opleiding gevonden voor department:', department)
              }
            }
          }

          // 1. Zoek op email (case-insensitive)
          let existing = await prisma.user.findFirst({
            where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
          })

          // 2. Niet gevonden op email? Zoek op azureAdId
          if (!existing && azureAdId) {
            existing = await prisma.user.findFirst({ where: { azureAdId } })
            if (existing) {
              console.log('[AUTH] Gevonden via azureAdId, email updaten naar:', normalizedEmail)
            }
          }

          if (!existing) {
            await prisma.user.create({
              data: {
                email: normalizedEmail,
                naam,
                role: 'student',
                azureAdId: azureAdId ?? null,
                opleidingId,
              },
            })
            console.log('[AUTH] Nieuw account aangemaakt:', normalizedEmail, '| opleiding:', opleidingId)
          } else {
            // Update email, azureAdId en opleidingId indien nodig
            const needsUpdate =
              existing.email !== normalizedEmail ||
              (!existing.azureAdId && azureAdId) ||
              (!existing.opleidingId && opleidingId)
            if (needsUpdate) {
              await prisma.user.update({
                where: { id: existing.id },
                data: {
                  email: normalizedEmail,
                  azureAdId: existing.azureAdId ?? azureAdId ?? undefined,
                  opleidingId: existing.opleidingId ?? opleidingId ?? undefined,
                },
              })
            }
            console.log('[AUTH] Bestaand account ingelogd:', normalizedEmail)
          }
        } catch (err) {
          console.error('[AUTH] DB fout tijdens signIn:', err)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account, profile }) {
      // SSO login: haal user op via email of azureAdId
      if (account?.provider === 'microsoft-entra-id' && profile) {
        const p = profile as Record<string, unknown>
        const email = (
          profile.email || p.preferred_username || p.upn || p.unique_name
        ) as string | undefined
        const azureAdId = (p.oid as string | undefined) || profile.sub

        let dbUser = null

        // 1. Zoek op email (case-insensitive)
        if (email) {
          dbUser = await prisma.user.findFirst({
            where: { email: { equals: email.toLowerCase(), mode: 'insensitive' } },
            include: { opleiding: true, adminOpleidingen: true },
          })
        }

        // 2. Niet gevonden via email? Probeer azureAdId
        if (!dbUser && azureAdId) {
          dbUser = await prisma.user.findFirst({
            where: { azureAdId },
            include: { opleiding: true, adminOpleidingen: true },
          })
        }

        if (dbUser) {
          token.id = dbUser.id
          token.role = (dbUser.role || 'student') as UserRole
          token.naam = dbUser.naam
          token.opleidingId = dbUser.opleidingId
          token.opleidingNaam = (dbUser as any).opleiding?.naam || null
          token.adminOpleidingIds = (dbUser as any).adminOpleidingen?.map(
            (o: { opleidingId: string }) => o.opleidingId
          ) ?? []
          console.log('[JWT] User gevonden:', dbUser.email, '| role:', token.role)
        } else {
          console.error('[JWT] Geen user gevonden voor email:', email, 'azureAdId:', azureAdId)
        }
      }

      // Credentials login (niet voor OAuth — die verwerkt het blok hierboven)
      if (user && account?.type === 'credentials') {
        token.id = user.id
        token.role = user.role
        token.naam = user.naam
        token.opleidingId = user.opleidingId
        token.opleidingNaam = user.opleidingNaam
        token.adminOpleidingIds = user.adminOpleidingIds ?? []
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.naam = token.naam
        session.user.opleidingId = token.opleidingId
        session.user.opleidingNaam = token.opleidingNaam
        session.user.adminOpleidingIds = token.adminOpleidingIds ?? []
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Leesbare labels per rol (UI). Superadmin = departementaal, admin = opleidingsniveau.
export const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin (departement)',
  admin: 'Admin (opleiding)',
  docent: 'Docent',
  student: 'Student',
}

export function getRoleLabel(role?: string | null): string {
  return ROLE_LABELS[(role ?? '') as UserRole] ?? (role ?? '')
}

// Helper function to get current user server-side
export async function getCurrentUser() {
  const session = await auth()
  return session?.user || null
}

// Helper to check if user has specific role
export function hasRole(user: { role: UserRole } | null, roles: UserRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

// Superadmin = departementaal niveau (globale toegang tot alle opleidingen)
export function isSuperadmin(role?: string | null): boolean {
  return role === 'superadmin'
}

// Admin-niveau toegang: zowel opleidingsadmin als superadmin.
// Gebruik dit overal waar voorheen `role === 'admin'` een admin-bypass was.
export function isAdmin(role?: string | null): boolean {
  return role === 'admin' || role === 'superadmin'
}

// Staff = iedereen die activiteiten/inschrijvingen mag beheren
export function isStaff(role?: string | null): boolean {
  return role === 'docent' || role === 'admin' || role === 'superadmin'
}

// Geeft de opleiding-ids die een gebruiker beheert.
// - superadmin: null  → betekent "alle opleidingen" (geen filter)
// - admin: gekoppelde AdminOpleiding-ids
// - docent: gekoppelde DocentOpleiding-ids
// - student: eigen opleiding (of leeg)
export async function getBeheerdeOpleidingIds(userId: string): Promise<string[] | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { adminOpleidingen: true, docentOpleidingen: true },
  })

  if (!user) return []
  if (user.role === 'superadmin') return null
  if (user.role === 'admin') return user.adminOpleidingen.map((o) => o.opleidingId)
  if (user.role === 'docent') return user.docentOpleidingen.map((o) => o.opleidingId)
  if (user.role === 'student') return user.opleidingId ? [user.opleidingId] : []
  return []
}

// Helper to check if user can access opleiding
export async function canAccessOpleiding(userId: string, opleidingId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      docentOpleidingen: true,
      adminOpleidingen: true,
    },
  })

  if (!user) return false

  // Superadmin kan alles
  if (user.role === 'superadmin') return true

  // Admin kan zijn gekoppelde opleidingen
  if (user.role === 'admin') {
    return user.adminOpleidingen.some((o) => o.opleidingId === opleidingId)
  }

  // Student kan alleen eigen opleiding
  if (user.role === 'student') {
    return user.opleidingId === opleidingId
  }

  // Docent kan gekoppelde opleidingen
  if (user.role === 'docent') {
    return user.docentOpleidingen.some((o) => o.opleidingId === opleidingId)
  }

  return false
}
