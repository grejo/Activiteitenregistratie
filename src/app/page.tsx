import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-pxl-black text-pxl-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading font-black text-2xl text-pxl-white">
            Activiteitenregistratie
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center bg-gradient-to-br from-pxl-white to-pxl-gray-light">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="font-heading font-black text-5xl text-pxl-black mb-6 gold-underline inline-block">
            Welkom bij PXL Activiteitenregistratie
          </h2>
          <p className="text-xl text-pxl-black-light mb-8 max-w-2xl mx-auto">
            Registreer, beheer en volg je buitenlesactiviteiten. Schrijf je in voor workshops,
            bedrijfsbezoeken en meer.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="btn-primary text-lg">
              Inloggen
            </Link>
            <Link href="/login" className="btn-secondary text-lg">
              Meer informatie
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="card">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="font-heading font-bold text-xl mb-2">Activiteiten</h3>
              <p className="text-pxl-black-light">
                Bekijk het prikbord met alle beschikbare activiteiten en schrijf je in.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-heading font-bold text-xl mb-2">Voortgang</h3>
              <p className="text-pxl-black-light">
                Volg je scorekaart en bekijk hoeveel uren je al hebt behaald.
              </p>
            </div>

            <div className="card">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="font-heading font-bold text-xl mb-2">Validatie</h3>
              <p className="text-pxl-black-light">
                Upload bewijsstukken en krijg je deelname gevalideerd door docenten.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-pxl-black text-pxl-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} PXL Hogeschool - Activiteitenregistratie
          </p>
        </div>
      </footer>
    </main>
  )
}
