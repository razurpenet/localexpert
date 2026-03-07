import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { ReviewSection } from '@/components/shared/ReviewSection'

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  accepted:  'bg-emerald-100 text-emerald-700',
  declined:  'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Awaiting response',
  accepted:  'Accepted',
  declined:  'Declined',
  completed: 'Completed',
}

export default async function CustomerRequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: requests } = await supabase
    .from('quote_requests')
    .select(`
      *,
      services(title),
      profiles!quote_requests_provider_id_fkey(id, full_name, provider_details(business_name))
    `)
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  // Get request IDs that already have a review
  const completedIds = requests?.filter((r) => r.status === 'completed').map((r) => r.id) ?? []
  const { data: existingReviews } = completedIds.length > 0
    ? await supabase.from('reviews').select('request_id').in('request_id', completedIds)
    : { data: [] }

  const reviewedRequestIds = new Set(existingReviews?.map((r) => r.request_id) ?? [])

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Requests</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track all your quote requests here.
        </p>
      </div>

      {!requests || requests.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">You haven&apos;t sent any requests yet.</p>
          <Button asChild>
            <Link href="/search">Find a professional</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const provider = r.profiles as {
              id: string
              full_name: string
              provider_details: { business_name: string } | null
            } | null
            const service    = r.services as { title: string } | null
            const canReview  = r.status === 'completed' && !reviewedRequestIds.has(r.id)
            const hasReview  = r.status === 'completed' && reviewedRequestIds.has(r.id)

            return (
              <div key={r.id} className="bg-white rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {provider?.provider_details?.business_name ?? provider?.full_name ?? 'Provider'}
                    </p>
                    {service && (
                      <p className="text-xs text-muted-foreground mt-0.5">{service.title}</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[r.status]}`}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground bg-slate-50 rounded-lg p-3 line-clamp-3">
                  {r.message}
                </p>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                  <div className="flex items-center gap-1">
                    {r.status === 'accepted' && (
                      <Button asChild size="sm" className="text-xs">
                        <Link href={`/dashboard/chat/${r.id}`}>
                          <MessageCircle className="h-3 w-3 mr-1.5" />
                          Open Chat
                        </Link>
                      </Button>
                    )}
                    {provider?.id && (
                      <Button asChild variant="ghost" size="sm" className="text-xs">
                        <Link href={`/providers/${provider.id}`}>
                          View profile <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Review section */}
                {canReview && provider?.id && (
                  <ReviewSection requestId={r.id} providerId={provider.id} />
                )}
                {hasReview && (
                  <p className="text-xs text-emerald-600 font-medium">✓ Review submitted</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
