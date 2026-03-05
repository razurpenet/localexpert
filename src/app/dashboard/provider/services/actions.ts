'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function addService(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const price_from = formData.get('price_from')

  const { error } = await supabase.from('services').insert({
    provider_id: user.id,
    category_id: parseInt(formData.get('category_id') as string),
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    price_from: price_from ? parseFloat(price_from as string) : null,
    price_type: (formData.get('price_type') as string) || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/provider/services')
}

export async function deleteService(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('services').delete().eq('id', id).eq('provider_id', user.id)

  revalidatePath('/dashboard/provider/services')
}
