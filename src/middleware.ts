import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

// Routes die publiek toegankelijk zijn
const publicRoutes = ['/', '/login']

// Routes per rol
const roleRoutes: Record<string, string[]> = {
  admin: ['/admin', '/dashboard'],
  docent: ['/docent', '/dashboard'],
  student: ['/student', '/dashboard'],
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip voor publieke routes en API routes
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Haal sessie op
  const session = await auth()

  // Niet ingelogd? Redirect naar login
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const userRole = session.user.role

  // /dashboard redirect naar rol-specifieke dashboard
  if (pathname === '/dashboard') {
    const dashboardUrl = new URL(`/${userRole}`, request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  // Check rol-gebaseerde toegang
  if (pathname.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL(`/${userRole}`, request.url))
  }

  if (pathname.startsWith('/docent') && userRole !== 'docent' && userRole !== 'admin') {
    return NextResponse.redirect(new URL(`/${userRole}`, request.url))
  }

  if (pathname.startsWith('/student') && userRole !== 'student' && userRole !== 'admin') {
    return NextResponse.redirect(new URL(`/${userRole}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
}
