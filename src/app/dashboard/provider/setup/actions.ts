'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function saveProviderDetails(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const years_exp = formData.get('years_exp')

  const { error } = await supabase.from('provider_details').upsert({
    id: user.id,
    business_name: formData.get('business_name') as string,
    years_exp: years_exp ? parseInt(years_exp as string) : null,
    website_url: (formData.get('website_url') as string) || null,
    is_available: formData.get('is_available') === 'on',
  })

  if (error) return { error: error.message }

  redirect('/dashboard/provider')
}
