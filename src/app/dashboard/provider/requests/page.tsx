import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateRequestStatus } from './actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  declined:  'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default async function ProviderRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: requests } = await supabase
    .from('quote_requests')
    .select('*, profiles!quote_requests_customer_id_fkey(full_name, city), services(title)')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false })

  const pending   = requests?.filter((r) => r.status === 'pending')   ?? []
  const active    = requests?.filter((r) => r.status === 'accepted')  ?? []
  const past      = requests?.filter((r) => ['declined', 'completed'].includes(r.status)) ?? []

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Customer Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Respond to customer enquiries below.
        </p>
      </div>

      <RequestGroup title="New requests" requests={pending} showActions />
      <RequestGroup title="Active jobs" requests={active} showComplete showChat />
      <RequestGroup title="Past requests" requests={past} />
    </div>
  )
}

function RequestGroup({
  title,
  requests,
  showActions = false,
  showComplete = false,
  showChat = false,
}: {
  title: string
  requests: any[]
  showActions?: boolean
  showComplete?: boolean
  showChat?: boolean
}) {
  if (requests.length === 0) return null

  return (
    <section className="space-y-3">
      <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        {title} ({requests.length})
      </h2>
      {requests.map((r) => {
        const customer = r.profiles as { full_name: string; city: string | null } | null
        const service  = r.services  as { title: string } | null

        return (
          <div key={r.id} className="bg-white rounded-xl border border-border p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <p className="font-medium">{customer?.full_name ?? 'Customer'}</p>
                {customer?.city && <p className="text-xs text-muted-foreground">{customer.city}</p>}
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[r.status]}`}>
                {r.status}
              </span>
            </div>

            {service && (
              <p className="text-xs text-muted-foreground">
                Service: <span className="font-medium text-foreground">{service.title}</span>
              </p>
            )}

            <p className="text-sm text-muted-foreground bg-slate-50 rounded-lg p-3">
              {r.message}
            </p>

            <p className="text-xs text-muted-foreground">
              {new Date(r.created_at).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>

            {showActions && (
              <div className="flex gap-2">
                <form action={updateRequestStatus.bind(null, r.id, 'accepted')}>
                  <Button type="submit" size="sm">Accept</Button>
                </form>
                <form action={updateRequestStatus.bind(null, r.id, 'declined')}>
                  <Button type="submit" size="sm" variant="outline">Decline</Button>
                </form>
              </div>
            )}

            {showComplete && (
              <div className="flex gap-2 items-center">
                <form action={updateRequestStatus.bind(null, r.id, 'completed')}>
                  <Button type="submit" size="sm" variant="outline">Mark as completed</Button>
                </form>
                {showChat && (
                  <Button asChild size="sm">
                    <Link href={`/dashboard/chat/${r.id}`}>
                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                      Open Chat
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
