import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import MicrosoftEntraId from 'next-auth/providers/microsoft-entra-id'
import type { NextAuthConfig } from 'next-auth'

const prisma = new PrismaClient()

export type UserRole = 'admin' | 'docent' | 'student'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    naam: string
    role: UserRole
    opleidingId?: string | null
    opleidingNaam?: string | null
  }

  interface Session {
    user: User & {
      id: string
      role: UserRole
      opleidingId?: string | null
      opleidingNaam?: string | null
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

export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    ...azureProviders,
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
          include: { opleiding: true },
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
        }
      },
    }),
  ],
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

        const email = (
          profile.email ||
          p.preferred_username ||
          p.upn ||
          p.unique_name
        ) as string | undefined

        const azureAdId = (p.oid as string | undefined) || profile.sub
        const naam = (profile.name as string | undefined) || email || 'Onbekend'

        console.log('[AUTH] resolved email:', email, '| naam:', naam)

        if (!email) {
          console.error('[AUTH] Geen email gevonden in profiel, login geblokkeerd')
          return false
        }

        const normalizedEmail = email.toLowerCase()

        try {
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
              data: { email: normalizedEmail, naam, role: 'student', azureAdId: azureAdId ?? null },
            })
            console.log('[AUTH] Nieuw account aangemaakt:', normalizedEmail)
          } else {
            // Update email naar lowercase en azureAdId indien nodig
            const needsUpdate =
              existing.email !== normalizedEmail || (!existing.azureAdId && azureAdId)
            if (needsUpdate) {
              await prisma.user.update({
                where: { id: existing.id },
                data: {
                  email: normalizedEmail,
                  azureAdId: existing.azureAdId ?? azureAdId ?? undefined,
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
            include: { opleiding: true },
          })
        }

        // 2. Niet gevonden via email? Probeer azureAdId
        if (!dbUser && azureAdId) {
          dbUser = await prisma.user.findFirst({
            where: { azureAdId },
            include: { opleiding: true },
          })
        }

        if (dbUser) {
          token.id = dbUser.id
          token.role = (dbUser.role || 'student') as UserRole
          token.naam = dbUser.naam
          token.opleidingId = dbUser.opleidingId
          token.opleidingNaam = (dbUser as any).opleiding?.naam || null
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

// Helper to check if user can access opleiding
export async function canAccessOpleiding(userId: string, opleidingId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      docentOpleidingen: true,
    },
  })

  if (!user) return false

  // Admin kan alles
  if (user.role === 'admin') return true

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
