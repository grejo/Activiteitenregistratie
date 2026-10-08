import { auth, isStaff } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMailVoorkeuren } from '@/lib/mailVoorkeuren'
import MailVoorkeurenForm from '@/components/mail/MailVoorkeurenForm'

export const metadata = { title: 'Mailmeldingen' }

export default async function MailmeldingenPage() {
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    redirect('/dashboard')
  }

  const voorkeuren = await getMailVoorkeuren(session.user.id)
  if (!voorkeuren) redirect('/dashboard')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading font-black text-3xl text-pxl-black gold-underline inline-block">
          Mailmeldingen
        </h1>
        <p className="text-pxl-black-light mt-4">
          Kies welke mails je van de X-FactorApp ontvangt. Mails naar studenten stel je per
          activiteit in.
        </p>
      </div>

      <div className="card max-w-2xl">
        <MailVoorkeurenForm initieel={voorkeuren} endpoint="/api/me/mailvoorkeuren" />
      </div>
    </div>
  )
}
