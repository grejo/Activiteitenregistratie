'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface NavLink {
  href: string
  label: string
}

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const getNavLinks = (): NavLink[] => {
    if (!session) return []

    switch (session.user.role) {
      case 'admin':
        return [
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/users', label: 'Gebruikers' },
          { href: '/admin/opleidingen', label: 'Opleidingen' },
          { href: '/admin/activiteiten', label: 'Activiteiten' },
        ]
      case 'docent':
        return [
          { href: '/docent', label: 'Dashboard' },
          { href: '/docent/activiteiten', label: 'Mijn Activiteiten' },
          { href: '/docent/aanvragen', label: 'Aanvragen' },
          { href: '/docent/studenten', label: 'Studenten' },
        ]
      case 'student':
      default:
        return [
          { href: '/student', label: 'Dashboard' },
          { href: '/student/prikbord', label: 'Prikbord' },
          { href: '/student/inschrijvingen', label: 'Mijn Inschrijvingen' },
          { href: '/student/aanvragen', label: 'Mijn Aanvragen' },
        ]
    }
  }

  const navLinks = getNavLinks()

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/docent' || href === '/student') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const getRoleBadgeColor = () => {
    switch (session?.user.role) {
      case 'admin':
        return 'bg-purple-500'
      case 'docent':
        return 'bg-green-500'
      case 'student':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <nav className="bg-pxl-black text-pxl-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={session ? `/${session.user.role}` : '/'}
              className="font-heading font-black text-xl hover:text-pxl-gold transition-colors"
            >
              Activiteitenregistratie
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${
                  isActive(link.href) ? 'nav-link-active' : 'nav-link-inactive'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User info & Logout */}
          {session && (
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">
                  {session.user.naam}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs font-semibold rounded ${getRoleBadgeColor()}`}
                >
                  {session.user.role.charAt(0).toUpperCase() + session.user.role.slice(1)}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="nav-link nav-link-inactive"
              >
                Uitloggen
              </button>
            </div>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md hover:bg-gray-800 transition-colors"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-pxl-black border-t border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.href)
                    ? 'bg-pxl-gold text-pxl-black'
                    : 'hover:bg-gray-800 hover:text-pxl-gold'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {session && (
              <>
                <div className="border-t border-gray-800 mt-2 pt-2">
                  <div className="px-3 py-2 text-sm text-gray-400">
                    Ingelogd als {session.user.naam}
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800 hover:text-pxl-gold"
                >
                  Uitloggen
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
