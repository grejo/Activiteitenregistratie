import { redirect } from 'next/navigation'

// This page redirects to the main aanvragen page with openNew param
// The AanvragenTable component will detect this and open the new modal
export default function NewAanvraagPage() {
  redirect('/student/aanvragen?openNew=true')
}
