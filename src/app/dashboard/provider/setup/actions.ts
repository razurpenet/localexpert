'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleAvailability(isAvailable: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  await supabase
    .from('provider_details')
    .update({ is_available: isAvailable })
    .eq('id', user.id)
  revalidatePath('/dashboard/provider')
}

export async function saveProviderDetails(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const years_exp = formData.get('years_exp')
  const lat       = formData.get('lat')
  const lng       = formData.get('lng')
  const postcode  = (formData.get('postcode') as string)?.trim().toUpperCase() || null

  const { error } = await supabase.from('provider_details').upsert({
    id: user.id,
    business_name: formData.get('business_name') as string,
    years_exp: years_exp ? parseInt(years_exp as string) : null,
    website_url: (formData.get('website_url') as string) || null,
    is_available: formData.get('is_available') === 'on',
  })

  if (error) return { error: error.message }

  // Save location fields to profiles
  const locationUpdate: Record<string, unknown> = { postcode }
  if (lat) locationUpdate.lat = parseFloat(lat as string)
  if (lng) locationUpdate.lng = parseFloat(lng as string)
  await supabase.from('profiles').update(locationUpdate).eq('id', user.id)

  redirect('/dashboard/provider')
}
