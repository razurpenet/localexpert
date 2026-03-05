'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function submitQuoteRequest(providerId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'customer') {
    return { error: 'Only customers can send quote requests.' }
  }

  const message = (formData.get('message') as string)?.trim()
  if (!message) return { error: 'Please enter a message.' }

  const service_id = formData.get('service_id') as string | null

  const { error } = await supabase.from('quote_requests').insert({
    customer_id: user.id,
    provider_id: providerId,
    service_id: service_id || null,
    message,
  })

  if (error) return { error: error.message }

  return { success: true }
}
