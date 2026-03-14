import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Heart, MessageCircleOff, Repeat2, ThumbsDown, UserMinus } from 'lucide-react'

export default async function CustomerHealthPage() {
  const admin = createAdminClient()

  // All customers
  const { data: customers } = await admin
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .is('suspended_at', null)
    .order('created_at', { ascending: false })

  // All quote requests
  const { data: requests } = await admin
    .from('quote_requests')
    .select('customer_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5000)

  // All reviews by customers
  const { data: reviews } = await admin
    .from('reviews')
    .select('reviewer_id, rating, created_at, body')
    .order('created_at', { ascending: false })
    .limit(2000)

  // Build per-customer stats
  const customerRequests: Record<string, { total: number; pending: number; declined: number; completed: number }> = {}
  requests?.forEach((r) => {
    if (!customerRequests[r.customer_id]) {
      customerRequests[r.customer_id] = { total: 0, pending: 0, declined: 0, completed: 0 }
    }
    const s = customerRequests[r.customer_id]
    s.total++
    if (r.status === 'pending') s.pending++
    if (r.status === 'declined') s.declined++
    if (r.status === 'completed') s.completed++
  })

  // No-response: all requests are pending or declined (none accepted/completed)
  const noResponse = (customers ?? []).filter(c => {
    const s = customerRequests[c.id]
    if (!s || s.total === 0) return false
    return s.completed === 0 && s.total > 0 && (s.pending + s.declined) === s.total
  })

  // Repeat bookers: 2+ completed jobs
  const repeatBookers = (customers ?? []).filter(c => {
    const s = customerRequests[c.id]
    return s && s.completed >= 2
  }).sort((a, b) => (customerRequests[b.id]?.completed ?? 0) - (customerRequests[a.id]?.completed ?? 0))

  // Negative reviewers: left a 1-2 star review
  const negativeReviewerIds = new Set(
    reviews?.filter(r => r.rating <= 2).map(r => r.reviewer_id) ?? []
  )
  const negativeReviewers = (customers ?? []).filter(c => negativeReviewerIds.has(c.id))

  // Inactive: signed up but 0 requests ever
  const inactive = (customers ?? []).filter(c => !customerRequests[c.id])

  function CustomerRow({ user, detail }: { user: any; detail: string }) {
    const stats = customerRequests[user.id]
    return (
      <div className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="font-medium text-sm">{user.full_name ?? 'No name'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {user.city && <p className="text-xs text-muted-foreground">{user.city}{user.postcode ? `, ${user.postcode}` : ''}</p>}
          <p className="text-xs text-amber-600 font-medium">{detail}</p>
        </div>
        <div className="text-right space-y-0.5">
          {stats && <p className="text-xs text-muted-foreground">{stats.total} requests · {stats.completed} completed</p>}
          <p className="text-xs text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString('en-GB')}</p>
        </div>
      </div>
    )
  }

  const sections = [
    {
      title: 'No Provider Response',
      subtitle: 'Sent requests but none were accepted — supply gap',
      icon: MessageCircleOff,
      items: noResponse,
      color: 'text-red-500',
      renderDetail: (c: any) => {
        const s = customerRequests[c.id]
        return `${s.total} requests, ${s.declined} declined, ${s.pending} still pending`
      },
    },
    {
      title: 'Inactive (Never Requested)',
      subtitle: 'Signed up but never sent a quote request',
      icon: UserMinus,
      items: inactive.slice(0, 50),
      color: 'text-slate-500',
      totalCount: inactive.length,
      renderDetail: (c: any) => {
        const days = Math.round((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24))
        return `Joined ${days} days ago — no requests`
      },
    },
    {
      title: 'Negative Reviewers',
      subtitle: 'Left 1-2 star reviews — follow up for retention',
      icon: ThumbsDown,
      items: negativeReviewers,
      color: 'text-orange-500',
      renderDetail: () => 'Left a negative review — check for unresolved issue',
    },
    {
      title: 'Repeat Bookers',
      subtitle: '2+ completed jobs — loyal customers',
      icon: Repeat2,
      items: repeatBookers,
      color: 'text-emerald-500',
      renderDetail: (c: any) => {
        const s = customerRequests[c.id]
        return `${s.completed} completed jobs`
      },
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          Customer Health
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Customer retention signals — who needs attention and who is thriving.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sections.map((s) => {
          const displayCount = 'totalCount' in s ? (s as any).totalCount : s.items.length
          return (
            <Card key={s.title} className={s.title === 'Repeat Bookers' ? 'border-emerald-300 bg-emerald-50/50' : displayCount > 0 ? 'border-amber-300 bg-amber-50/50' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
                <s.icon className={`h-4 w-4 ${displayCount > 0 ? s.color : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{displayCount}</p></CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detail sections */}
      {sections.map((s) => (
        s.items.length > 0 && (
          <section key={s.title} className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {s.title} ({'totalCount' in s ? `${(s as any).totalCount} total, showing ${s.items.length}` : s.items.length}) — {s.subtitle}
            </h2>
            {s.items.map((c) => (
              <CustomerRow key={c.id} user={c} detail={s.renderDetail(c)} />
            ))}
          </section>
        )
      ))}
    </div>
  )
}
