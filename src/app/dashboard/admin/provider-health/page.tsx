import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HeartPulse, AlertTriangle, ThumbsDown, Clock, UserX } from 'lucide-react'

export default async function ProviderHealthPage() {
  const admin = createAdminClient()
  const now = new Date()
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Get all providers with their details
  const { data: providers } = await admin
    .from('profiles')
    .select('*, provider_details(*)')
    .eq('role', 'provider')
    .is('suspended_at', null)
    .order('created_at', { ascending: false })

  // Get recent quote_requests for activity analysis
  const { data: recentRequests } = await admin
    .from('quote_requests')
    .select('provider_id, status, created_at, updated_at')
    .order('created_at', { ascending: false })
    .limit(2000)

  // Build per-provider stats
  const providerStats: Record<string, { lastActivity: string | null; total: number; declined: number; accepted: number }> = {}
  recentRequests?.forEach((r) => {
    if (!providerStats[r.provider_id]) {
      providerStats[r.provider_id] = { lastActivity: null, total: 0, declined: 0, accepted: 0 }
    }
    const s = providerStats[r.provider_id]
    s.total++
    if (r.status === 'declined') s.declined++
    if (['accepted', 'confirmed', 'en_route', 'in_progress', 'completed'].includes(r.status)) s.accepted++
    const actDate = r.updated_at ?? r.created_at
    if (!s.lastActivity || actDate > s.lastActivity) s.lastActivity = actDate
  })

  const allProviders = providers ?? []

  // ── Flag categories ──
  const inactive = allProviders.filter((p) => {
    const d = p.provider_details as any
    if (!d?.is_available) return false
    const stats = providerStats[p.id]
    if (!stats) return true
    return stats.lastActivity && stats.lastActivity < fourteenDaysAgo
  })

  const lowRating = allProviders.filter((p) => {
    const d = p.provider_details as any
    return d && d.review_count >= 3 && Number(d.avg_rating) < 3.5
  })

  const highDecline = allProviders.filter((p) => {
    const stats = providerStats[p.id]
    if (!stats || stats.total < 5) return false
    return (stats.declined / stats.total) > 0.5
  })

  const stalledOnboarding = allProviders.filter((p) => {
    const d = p.provider_details as any
    if (!d) return false
    return p.created_at < thirtyDaysAgo && (d.completion_count ?? 0) === 0
  })

  function ProviderRow({ user, detail }: { user: any; detail: string }) {
    const d = user.provider_details as any
    return (
      <div className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="font-medium text-sm">{user.full_name ?? 'No name'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {user.city && <p className="text-xs text-muted-foreground">{user.city}{user.postcode ? `, ${user.postcode}` : ''}</p>}
          <p className="text-xs text-amber-600 font-medium">{detail}</p>
        </div>
        <div className="text-right space-y-0.5">
          {d && (
            <p className="text-xs text-muted-foreground">{d.avg_rating ? `${Number(d.avg_rating).toFixed(1)} stars` : 'No rating'} · {d.review_count ?? 0} reviews · {d.completion_count ?? 0} jobs</p>
          )}
          <p className="text-xs text-muted-foreground">Joined {new Date(user.created_at).toLocaleDateString('en-GB')}</p>
        </div>
      </div>
    )
  }

  const sections = [
    {
      title: 'Inactive Providers',
      subtitle: 'Available but no activity in 14+ days',
      icon: Clock,
      items: inactive,
      color: 'text-amber-500',
      renderDetail: (p: any) => {
        const stats = providerStats[p.id]
        return stats?.lastActivity
          ? `Last active: ${new Date(stats.lastActivity).toLocaleDateString('en-GB')}`
          : 'No activity recorded'
      },
    },
    {
      title: 'Low Rating',
      subtitle: 'Below 3.5 stars with 3+ reviews',
      icon: ThumbsDown,
      items: lowRating,
      color: 'text-red-500',
      renderDetail: (p: any) => {
        const d = p.provider_details as any
        return `Rating: ${Number(d.avg_rating).toFixed(1)} from ${d.review_count} reviews`
      },
    },
    {
      title: 'High Decline Rate',
      subtitle: 'Declined >50% of requests (min 5)',
      icon: UserX,
      items: highDecline,
      color: 'text-orange-500',
      renderDetail: (p: any) => {
        const stats = providerStats[p.id]
        if (!stats) return ''
        return `Declined ${stats.declined}/${stats.total} requests (${Math.round((stats.declined / stats.total) * 100)}%)`
      },
    },
    {
      title: 'Stalled Onboarding',
      subtitle: '30+ days since signup, 0 completed jobs',
      icon: AlertTriangle,
      items: stalledOnboarding,
      color: 'text-slate-500',
      renderDetail: (p: any) => {
        const days = Math.round((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24))
        return `Signed up ${days} days ago — no completed jobs`
      },
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-primary" />
          Provider Health
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Providers who need attention — inactive, low-rated, high-decline, or stalled onboarding.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {sections.map((s) => (
          <Card key={s.title} className={s.items.length > 0 ? 'border-amber-300 bg-amber-50/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.items.length > 0 ? s.color : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{s.items.length}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Detail sections */}
      {sections.map((s) => (
        s.items.length > 0 && (
          <section key={s.title} className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {s.title} ({s.items.length}) — {s.subtitle}
            </h2>
            {s.items.map((p) => (
              <ProviderRow key={p.id} user={p} detail={s.renderDetail(p)} />
            ))}
          </section>
        )
      ))}

      {sections.every(s => s.items.length === 0) && (
        <p className="text-sm text-muted-foreground py-8 text-center">All providers are healthy. No flags raised.</p>
      )}
    </div>
  )
}
