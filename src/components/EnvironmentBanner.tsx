'use client'

export function EnvironmentBanner() {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT

  // Toon niets in productie
  if (env === 'production' || !env) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-orange-500 text-white text-center py-1 text-sm font-semibold">
      {env.toUpperCase()} OMGEVING - Dit is niet de live website
    </div>
  )
}
