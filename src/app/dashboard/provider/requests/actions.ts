'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateRequestStatus(requestId: string, status: 'accepted' | 'declined' | 'completed') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('quote_requests')
    .update({ status })
    .eq('id', requestId)
    .eq('provider_id', user.id)

  if (status === 'accepted') {
    redirect(`/dashboard/chat/${requestId}`)
  }

  revalidatePath('/dashboard/provider/requests')
}
