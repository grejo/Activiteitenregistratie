import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Routes die publiek toegankelijk zijn (geen login vereist)
const publicRoutes = ['/', '/login', '/no-access']

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Publieke routes, API routes en statische bestanden: altijd doorgaan
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Sessie ophalen
  let session = null
  try {
    session = await auth()
  } catch {
    // Auth fout: stuur naar login
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Niet ingelogd → naar login
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Ingelogd: doorgaan (elke page doet zelf de rol-check)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
}
