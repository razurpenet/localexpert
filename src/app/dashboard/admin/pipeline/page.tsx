import { createAdminClient } from '@/lib/supabase/admin'
import { GitPullRequest, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-700',
  accepted:    'bg-emerald-100 text-emerald-700',
  declined:    'bg-red-100 text-red-700',
  confirmed:   'bg-blue-100 text-blue-700',
  en_route:    'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed:   'bg-slate-100 text-slate-700',
  cancelled:   'bg-slate-100 text-slate-500',
}

function hoursAgo(dateStr: string) {
  return Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60))
}

export default async function AdminPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const params = await searchParams
  const admin = createAdminClient()

  const { data: rawRequests } = await admin
    .from('quote_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  // Batch-fetch related profiles and services
  const customerIds = [...new Set((rawRequests ?? []).map((r) => r.customer_id).filter(Boolean))]
  const providerIds = [...new Set((rawRequests ?? []).map((r) => r.provider_id).filter(Boolean))]
  const serviceIds  = [...new Set((rawRequests ?? []).map((r) => r.service_id).filter(Boolean))]
  const allProfileIds = [...new Set([...customerIds, ...providerIds])]

  const [{ data: pipelineProfiles }, { data: pipelineServices }] = await Promise.all([
    allProfileIds.length
      ? admin.from('profiles').select('id, full_name, city').in('id', allProfileIds)
      : { data: [] as any[] },
    serviceIds.length
      ? admin.from('services').select('id, title, category_id, categories(name)').in('id', serviceIds)
      : { data: [] as any[] },
  ])

  const pipelineEmailMap = new Map<string, string>()
  for (const pid of allProfileIds) {
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(pid)
    if (authUser?.email) pipelineEmailMap.set(pid, authUser.email)
  }

  const profileMap = new Map((pipelineProfiles ?? []).map((p: any) => [p.id, { ...p, email: pipelineEmailMap.get(p.id) ?? null }]))
  const serviceMap = new Map((pipelineServices ?? []).map((s: any) => [s.id, s]))

  const allRequests = (rawRequests ?? []).map((r) => ({
    ...r,
    customer: profileMap.get(r.customer_id) ?? null,
    provider: profileMap.get(r.provider_id) ?? null,
    services: serviceMap.get(r.service_id) ?? null,
  }))

  const pending   = allRequests.filter((r) => r.status === 'pending')
  const accepted  = allRequests.filter((r) => r.status === 'accepted')
  const confirmed = allRequests.filter((r) => r.status === 'confirmed')
  const active    = allRequests.filter((r) => ['en_route', 'in_progress'].includes(r.status))
  const completed = allRequests.filter((r) => r.status === 'completed')
  const declined  = allRequests.filter((r) => r.status === 'declined')
  const stale     = pending.filter((r) => hoursAgo(r.created_at) >= 24)

  let displayRequests = allRequests
  if (params.filter === 'stale') displayRequests = stale
  else if (params.filter === 'completed') displayRequests = completed
  else if (params.filter === 'pending') displayRequests = pending

  const total = allRequests.length
  const funnelSteps = [
    { label: 'Total',      count: total,            color: 'bg-slate-100 text-slate-700' },
    { label: 'Pending',    count: pending.length,   color: 'bg-amber-100 text-amber-700',   href: '?filter=pending' },
    { label: 'Stale >24h', count: stale.length,     color: stale.length > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600', href: '?filter=stale' },
    { label: 'Accepted',   count: accepted.length,  color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Confirmed',  count: confirmed.length, color: 'bg-blue-100 text-blue-700' },
    { label: 'Active',     count: active.length,    color: 'bg-purple-100 text-purple-700' },
    { label: 'Completed',  count: completed.length, color: 'bg-slate-100 text-slate-700',    href: '?filter=completed' },
    { label: 'Declined',   count: declined.length,  color: 'bg-red-50 text-red-600' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitPullRequest className="h-6 w-6 text-primary" />
          Quote Request Pipeline
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track all customer requests through the marketplace funnel.
          {params.filter && (
            <> — Filtered by: <strong className="capitalize">{params.filter}</strong> <Link href="/dashboard/admin/pipeline" className="text-primary hover:underline ml-1">Clear</Link></>
          )}
        </p>
      </div>

      {/* Funnel stats */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {funnelSteps.map((step) => {
          const inner = (
            <div className={`rounded-xl px-3 py-2.5 text-center ${step.color}`}>
              <p className="text-lg font-bold">{step.count}</p>
              <p className="text-xs font-medium">{step.label}</p>
            </div>
          )
          return step.href ? (
            <Link key={step.label} href={step.href}>{inner}</Link>
          ) : (
            <div key={step.label}>{inner}</div>
          )
        })}
      </div>

      {/* Conversion rates */}
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span>Accept rate: <strong className="text-foreground">{total > 0 ? Math.round(((accepted.length + confirmed.length + completed.length + active.length) / total) * 100) : 0}%</strong></span>
        <span>Completion rate: <strong className="text-foreground">{total > 0 ? Math.round((completed.length / total) * 100) : 0}%</strong></span>
        <span>Decline rate: <strong className="text-foreground">{total > 0 ? Math.round((declined.length / total) * 100) : 0}%</strong></span>
      </div>

      {/* Request list */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          {params.filter ? `${params.filter} requests` : 'All Requests'} ({displayRequests.length})
        </h2>
        {displayRequests.map((r) => {
          const customer = r.customer as any
          const provider = r.provider as any
          const service  = r.services as any
          const isStale  = r.status === 'pending' && hoursAgo(r.created_at) >= 24

          return (
            <div key={r.id} className={`bg-white rounded-xl border p-4 space-y-2 ${isStale ? 'border-red-300 bg-red-50/30' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{customer?.full_name ?? 'Customer'}</p>
                    <span className="text-muted-foreground text-xs">→</span>
                    <p className="font-medium text-sm">{provider?.full_name ?? 'Provider'}</p>
                  </div>
                  {service && (
                    <p className="text-xs text-muted-foreground">
                      {service.categories?.name ?? ''} — {service.title}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{customer?.city ?? ''}{provider?.city ? ` → ${provider.city}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isStale && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground bg-slate-50 rounded-lg p-3 line-clamp-2">
                {r.message}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Created: {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                {r.status === 'pending' && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {hoursAgo(r.created_at)}h ago</span>}
                {r.quoted_price && <span>Quoted: £{r.quoted_price}</span>}
                {r.urgency && r.urgency !== 'flexible' && <span className="text-amber-600 font-medium capitalize">{r.urgency.replace('_', ' ')}</span>}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
