'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function submitReview(requestId: string, providerId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const rating = parseInt(formData.get('rating') as string)
  const body   = (formData.get('body') as string)?.trim() || null

  if (!rating || rating < 1 || rating > 5) return { error: 'Please select a rating.' }

  // Verify the request belongs to this customer and is completed
  const { data: request } = await supabase
    .from('quote_requests')
    .select('id')
    .eq('id', requestId)
    .eq('customer_id', user.id)
    .eq('status', 'completed')
    .single()

  if (!request) return { error: 'You can only review completed jobs.' }

  const { error } = await supabase.from('reviews').insert({
    request_id:  requestId,
    reviewer_id: user.id,
    provider_id: providerId,
    rating,
    body,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/customer/requests')
  return { success: true }
}
