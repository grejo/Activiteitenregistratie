'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import StartDemoMenuItems from '@/components/demo/StartDemoMenuItems'

interface NavLink {
  href: string
  label: string
  badgeKey?: 'aanvragen' | 'bewijsstukken'
}

interface NavGroup {
  label: string
  children: NavLink[]
}

type NavItem = NavLink | NavGroup

const isGroup = (item: NavItem): item is NavGroup => 'children' in item

interface PendingCounts {
  aanvragen: number
  bewijsstukken: number
}

interface NavbarProps {
  /**
   * Rol zoals de server die ziet — inclusief de demo-overlay. Bewust een prop
   * en geen useSession(): de client-side sessiecache van next-auth wordt na
   * het starten/stoppen van een demo niet ververst, waardoor de balk anders
   * de oude rol bleef tonen.
   */
  role: string
  naam: string
  isDemo?: boolean
  /** Toont de demo-startknoppen in het gebruikersmenu (enkel echte staff, niet in demo/impersonatie) */
  canStartDemo?: boolean
}

export function Navbar({ role, naam, isDemo = false, canStartDemo = false }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Welke desktop-dropdown open staat: een groepslabel of 'user'
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const [pendingCounts, setPendingCounts] = useState<PendingCounts>({
    aanvragen: 0,
    bewijsstukken: 0,
  })

  const fetchPendingCounts = useCallback(async () => {
    if (!role) return

    try {
      // Bepaal de juiste API endpoint op basis van rol
      let endpoint = ''
      if (role === 'docent' || role === 'admin' || role === 'superadmin') {
        endpoint = '/api/docent/counts'
      } else if (role === 'student') {
        endpoint = '/api/student/counts'
      } else {
        return
      }

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setPendingCounts(data)
      }
    } catch (error) {
      console.error('Error fetching pending counts:', error)
    }
  }, [role])

  useEffect(() => {
    fetchPendingCounts()
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchPendingCounts, 30000)
    return () => clearInterval(interval)
  }, [fetchPendingCounts])

  // Refresh counts when navigating
  useEffect(() => {
    fetchPendingCounts()
  }, [pathname, fetchPendingCounts])

  // Listen for refresh-counts event (triggered after bewijsstukken/aanvragen actions)
  useEffect(() => {
    const handleRefreshCounts = () => {
      fetchPendingCounts()
    }
    window.addEventListener('refresh-counts', handleRefreshCounts)
    return () => window.removeEventListener('refresh-counts', handleRefreshCounts)
  }, [fetchPendingCounts])

  const getNavItems = (): NavItem[] => {
    if (!role) return []

    switch (role) {
      case 'superadmin':
      case 'admin':
        return [
          { href: '/admin', label: 'Dashboard' },
          { href: '/docent/aanvragen', label: 'Aanvragen', badgeKey: 'aanvragen' },
          { href: '/docent/bewijsstukken', label: 'Bewijsstukken', badgeKey: 'bewijsstukken' },
          {
            label: 'Beheer',
            children: [
              { href: '/admin/users', label: 'Gebruikers' },
              { href: '/admin/studenten', label: 'Studenten' },
              { href: '/admin/opleidingen', label: 'Opleidingen' },
              { href: '/admin/activiteiten', label: 'Activiteiten' },
              ...(role === 'superadmin'
                ? [{ href: '/admin/instellingen', label: 'Instellingen' }]
                : []),
            ],
          },
        ]
      case 'docent':
        return [
          { href: '/docent', label: 'Dashboard' },
          { href: '/docent/activiteiten', label: 'Mijn Activiteiten' },
          { href: '/docent/aanvragen', label: 'Aanvragen', badgeKey: 'aanvragen' },
          { href: '/docent/bewijsstukken', label: 'Bewijsstukken', badgeKey: 'bewijsstukken' },
          { href: '/docent/studenten', label: 'Studenten' },
        ]
      case 'student':
      default:
        return [
          { href: '/student', label: 'Dashboard' },
          { href: '/student/prikbord', label: 'Prikbord' },
          { href: '/student/inschrijvingen', label: 'Mijn Inschrijvingen' },
          { href: '/student/aanvragen', label: 'Mijn Aanvragen', badgeKey: 'aanvragen' },
          { href: '/student/bewijsstukken', label: 'Bewijsstukken', badgeKey: 'bewijsstukken' },
        ]
    }
  }

  const navItems = getNavItems()

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/docent' || href === '/student') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  const isGroupActive = (group: NavGroup) => group.children.some((c) => isActive(c.href))

  // Dropdowns sluiten bij navigatie, klik erbuiten of Escape
  useEffect(() => {
    setOpenMenu(null)
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!openMenu) return
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [openMenu])

  const roleLabel =
    role === 'superadmin' ? 'Superadmin' : role.charAt(0).toUpperCase() + role.slice(1)

  const initials = naam
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const renderBadge = (count: number, mobile = false) =>
    count > 0 && (
      <span
        className={
          mobile
            ? 'min-w-[20px] h-[20px] flex items-center justify-center px-1.5 text-xs font-bold text-white bg-red-500 rounded-full'
            : 'ml-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center px-1 text-[10px] font-bold text-white bg-red-500 rounded-full'
        }
      >
        {count > 99 ? '99+' : count}
      </span>
    )

  const chevron = (open: boolean) => (
    <svg
      className={`w-4 h-4 ml-1 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )

  const dropdownItemClass = (active: boolean) =>
    `block px-4 py-2 text-sm transition-colors ${
      active ? 'bg-pxl-gold text-pxl-black font-semibold' : 'text-gray-200 hover:bg-gray-800 hover:text-pxl-gold'
    }`

  const handleSignOut = async () => {
    // Tijdens een demo mag "Uitloggen" de echte SSO-sessie niet beëindigen:
    // één misklik zou midden in een presentatie een volledige herlogin kosten.
    // We stoppen dan enkel de demo en keren terug naar het eigen account.
    if (isDemo) {
      await fetch('/api/demo/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: false }),
      }).catch(() => {
        /* faalt zacht — hieronder navigeren we sowieso terug */
      })
      router.push('/dashboard')
      router.refresh()
      return
    }
    await signOut({ callbackUrl: '/login' })
  }

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'superadmin':
        return 'bg-purple-700'
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
    <nav ref={navRef} className="bg-pxl-black text-pxl-white sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Logo */}
          <Link
            href={role ? (role === 'superadmin' ? '/admin' : `/${role}`) : '/'}
            className="font-heading font-black text-xl hover:text-pxl-gold transition-colors shrink-0"
          >
            Xfactorapp
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 flex-1">
            {navItems.map((item) => {
              if (isGroup(item)) {
                const open = openMenu === item.label
                return (
                  <div key={item.label} className="relative">
                    <button
                      type="button"
                      onClick={() => setOpenMenu(open ? null : item.label)}
                      aria-expanded={open}
                      aria-haspopup="menu"
                      className={`nav-link inline-flex items-center ${
                        isGroupActive(item) ? 'nav-link-active' : 'nav-link-inactive'
                      }`}
                    >
                      {item.label}
                      {chevron(open)}
                    </button>
                    {open && (
                      <div
                        role="menu"
                        className="absolute left-0 mt-2 w-52 py-1 bg-pxl-black border border-gray-700 rounded-md shadow-xl"
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            role="menuitem"
                            className={dropdownItemClass(isActive(child.href))}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              const badgeCount = item.badgeKey ? pendingCounts[item.badgeKey] : 0
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link inline-flex items-center ${
                    isActive(item.href) ? 'nav-link-active' : 'nav-link-inactive'
                  }`}
                >
                  {item.label}
                  {renderBadge(badgeCount)}
                </Link>
              )
            })}
          </div>

          {/* Gebruikersmenu */}
          {role && (
            <div className="hidden lg:block relative shrink-0">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'user' ? null : 'user')}
                aria-expanded={openMenu === 'user'}
                aria-haspopup="menu"
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-gray-800 transition-colors"
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRoleBadgeColor()}`}
                >
                  {initials || '?'}
                </span>
                <span className="text-sm text-gray-200 max-w-[10rem] truncate">{naam}</span>
                {chevron(openMenu === 'user')}
              </button>
              {openMenu === 'user' && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 py-1 bg-pxl-black border border-gray-700 rounded-md shadow-xl"
                >
                  <div className="px-4 py-3 border-b border-gray-800">
                    <div className="text-sm font-semibold truncate">{naam}</div>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded ${getRoleBadgeColor()}`}
                    >
                      {roleLabel}
                    </span>
                  </div>
                  {role !== 'student' && (
                    <Link
                      href="/mailmeldingen"
                      role="menuitem"
                      title="Kies welke systeemmails je ontvangt"
                      className={dropdownItemClass(isActive('/mailmeldingen'))}
                    >
                      Mailmeldingen
                    </Link>
                  )}
                  {canStartDemo && (
                    <div className="border-t border-gray-800 mt-1 pt-1">
                      <StartDemoMenuItems
                        headingClassName="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500"
                        itemClassName={dropdownItemClass(false)}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className={`w-full text-left border-t border-gray-800 mt-1 ${dropdownItemClass(false)}`}
                  >
                    Uitloggen
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile menu button */}
          <div className="lg:hidden">
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
        <div className="lg:hidden bg-pxl-black border-t border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const links = isGroup(item) ? item.children : [item]
              return (
                <div key={isGroup(item) ? item.label : item.href}>
                  {isGroup(item) && (
                    <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {item.label}
                    </div>
                  )}
                  {links.map((link) => {
                    const badgeCount = link.badgeKey ? pendingCounts[link.badgeKey] : 0
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-base font-medium ${
                          isActive(link.href)
                            ? 'bg-pxl-gold text-pxl-black'
                            : 'hover:bg-gray-800 hover:text-pxl-gold'
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                        {renderBadge(badgeCount, true)}
                      </Link>
                    )
                  })}
                </div>
              )
            })}

            {role && (
              <>
                <div className="border-t border-gray-800 mt-2 pt-2">
                  <div className="px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                    Ingelogd als {naam}
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded text-white ${getRoleBadgeColor()}`}
                    >
                      {roleLabel}
                    </span>
                  </div>
                </div>
                {role !== 'student' && (
                  <Link
                    href="/mailmeldingen"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800 hover:text-pxl-gold"
                  >
                    Mailmeldingen
                  </Link>
                )}
                {canStartDemo && (
                  <StartDemoMenuItems
                    headingClassName="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-500"
                    itemClassName="block px-3 py-2 rounded-md text-base font-medium hover:bg-gray-800 hover:text-pxl-gold"
                  />
                )}
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
