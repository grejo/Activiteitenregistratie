import type { Metadata } from 'next'
import { Raleway } from 'next/font/google'
import { Providers } from '@/components/Providers'
import { EnvironmentBanner } from '@/components/EnvironmentBanner'
import './globals.css'

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Activiteitenregistratie - PXL Hogeschool',
  description: 'Registratie en beheer van buitenlesactiviteiten voor PXL studenten en docenten',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl" className={raleway.variable}>
      <body className="min-h-screen bg-pxl-white">
        <Providers>
          {children}
          <EnvironmentBanner />
        </Providers>
      </body>
    </html>
  )
}
