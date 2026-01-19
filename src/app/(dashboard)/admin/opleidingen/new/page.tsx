import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NewOpleidingForm from './NewOpleidingForm'

export const metadata = {
  title: 'Nieuwe Opleiding - Admin',
}

export default async function NewOpleidingPage() {
  const session = await auth()

  if (session?.user.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Nieuwe Opleiding
        </h1>
        <p className="text-pxl-black-light mt-4">
          Maak een nieuwe opleiding aan in het systeem
        </p>
      </div>

      {/* Form */}
      <div className="card max-w-2xl">
        <NewOpleidingForm />
      </div>
    </div>
  )
}
