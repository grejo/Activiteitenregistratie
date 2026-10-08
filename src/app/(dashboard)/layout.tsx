import { redirect } from 'next/navigation'
import { auth, isStaff } from '@/lib/auth'
import { Navbar } from '@/components/layout/Navbar'
import DemoBanner from '@/components/demo/DemoBanner'
import ImpersonatieBanner from '@/components/impersonatie/ImpersonatieBanner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const inDemo = session.isDemo === true
  const alsAnder = session.isImpersonatie === true
  // De start-knop staat in-context van de ECHTE gebruiker, niet van de
  // demo-overlay. Zolang we in demo zitten toont de banner al de acties.
  const showStartButton = !inDemo && !alsAnder && isStaff(session.user.role)

  return (
    <div className="min-h-screen flex flex-col bg-pxl-gray-light">
      {alsAnder && (
        <ImpersonatieBanner
          naam={session.user.naam}
          email={session.user.email}
          rol={session.user.role}
        />
      )}
      {inDemo && (
        <DemoBanner
          demoNaam={session.user.naam}
          demoRol={session.user.role === 'docent' ? 'docent' : 'student'}
        />
      )}
      {/* Rol/naam komen van de server-sessie (incl. demo-overlay) i.p.v. uit
          useSession(): die client-cache loopt achter na start/stop van een demo. */}
      <Navbar
        role={session.user.role}
        naam={session.user.naam}
        isDemo={inDemo}
        canStartDemo={showStartButton}
      />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
      <footer className="bg-pxl-black text-pxl-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} PXL Hogeschool - Xfactorapp
          </p>
        </div>
      </footer>
    </div>
  )
}
