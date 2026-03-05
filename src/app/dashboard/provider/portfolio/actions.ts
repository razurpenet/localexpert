'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function deletePortfolioItem(id: string, imagePath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.storage.from('portfolio').remove([imagePath])
  await supabase.from('portfolio_items').delete().eq('id', id).eq('provider_id', user.id)

  revalidatePath('/dashboard/provider/portfolio')
}
