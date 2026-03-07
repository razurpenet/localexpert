import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { ArrowLeft, MessageCircle } from 'lucide-react'

export default async function ChatPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: request } = await supabase
    .from('quote_requests')
    .select(`
      id, status, message,
      customer:profiles!quote_requests_customer_id_fkey(id, full_name),
      provider:profiles!quote_requests_provider_id_fkey(id, full_name, provider_details(business_name))
    `)
    .eq('id', requestId)
    .single()

  if (!request) notFound()

  const customer = request.customer as { id: string; full_name: string }
  const provider = request.provider as { id: string; full_name: string; provider_details: { business_name: string } | null }

  const isCustomer = customer.id === user.id
  const isProvider = provider.id === user.id

  if (!isCustomer && !isProvider) notFound()

  if (request.status !== 'accepted') {
    redirect(isProvider ? '/dashboard/provider/requests' : '/dashboard/customer/requests')
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('request_id', request.id)
    .order('created_at', { ascending: true })

  const providerName = provider.provider_details?.business_name ?? provider.full_name
  const customerName = customer.full_name
  const otherPartyName = isCustomer ? providerName : customerName
  const backHref = isProvider ? '/dashboard/provider/requests' : '/dashboard/customer/requests'

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <MessageCircle className="h-5 w-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">Chat with {otherPartyName}</h1>
            <p className="text-xs text-muted-foreground truncate">
              {request.message.slice(0, 90)}{request.message.length > 90 ? '…' : ''}
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ChatWindow
            requestId={request.id}
            currentUserId={user.id}
            currentUserRole={isProvider ? 'provider' : 'customer'}
            providerId={provider.id}
            providerName={providerName}
            customerName={customerName}
            initialMessages={messages ?? []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
