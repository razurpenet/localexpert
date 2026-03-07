'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function deleteAccount() {
  const supabase      = await createClient()
  const adminSupabase = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const id = user.id

  // Delete user data in order (FK constraints: children first)
  await adminSupabase.from('reviews').delete().eq('reviewer_id', id)
  await adminSupabase.from('quote_requests').delete().eq('customer_id', id)
  await adminSupabase.from('quote_requests').delete().eq('provider_id', id)
  await adminSupabase.from('portfolio_items').delete().eq('provider_id', id)
  await adminSupabase.from('services').delete().eq('provider_id', id)
  await adminSupabase.from('provider_details').delete().eq('id', id)
  await adminSupabase.from('profiles').delete().eq('id', id)

  // Delete the auth user — must be last
  await adminSupabase.auth.admin.deleteUser(id)

  // Sign out the session and send to home
  await supabase.auth.signOut()
  redirect('/')
}
