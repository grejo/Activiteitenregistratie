import type { Metadata } from 'next'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Prikbord — Xfactorapp',
  description: 'Publieke embedbare weergave van het activiteitenprikbord.',
  robots: { index: false, follow: false },
}

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="nl">
      <body className="bg-transparent">
        {children}
      </body>
    </html>
  )
}
