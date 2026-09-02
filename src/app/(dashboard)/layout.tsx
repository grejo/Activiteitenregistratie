import { redirect } from 'next/navigation'
import { auth, isStaff } from '@/lib/auth'
import { Navbar } from '@/components/layout/Navbar'
import DemoBanner from '@/components/demo/DemoBanner'
import StartDemoButton from '@/components/demo/StartDemoButton'

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
  // De start-knop staat in-context van de ECHTE gebruiker, niet van de
  // demo-overlay. Zolang we in demo zitten toont de banner al de acties.
  const showStartButton = !inDemo && isStaff(session.user.role)

  return (
    <div className="min-h-screen flex flex-col bg-pxl-gray-light">
      {inDemo && (
        <DemoBanner
          demoNaam={session.user.naam}
          demoRol={session.user.role === 'docent' ? 'docent' : 'student'}
        />
      )}
      {/* Rol/naam komen van de server-sessie (incl. demo-overlay) i.p.v. uit
          useSession(): die client-cache loopt achter na start/stop van een demo. */}
      <Navbar role={session.user.role} naam={session.user.naam} isDemo={inDemo} />
      {showStartButton && (
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-end">
            <StartDemoButton />
          </div>
        </div>
      )}
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
