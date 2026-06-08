import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PresidentConsolePage() {
  // Redirect to the default sub-route (approvals)
  redirect('/dashboard/president/approvals')
}

