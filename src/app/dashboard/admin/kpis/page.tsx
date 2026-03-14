import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, MapPin, Activity } from 'lucide-react'

function pct(numerator: number, denominator: number) {
  if (denominator === 0) return '0%'
  return `${Math.round((numerator / denominator) * 100)}%`
}

export default async function AdminKpiPage() {
  const admin = createAdminClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // ── Growth ──
  const [
    { count: newProvidersWeek },
    { count: newCustomersWeek },
    { count: newProvidersMonth },
    { count: newCustomersMonth },
    { count: totalProviders },
    { count: totalCustomers },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider').gte('created_at', weekAgo),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer').gte('created_at', weekAgo),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider').gte('created_at', monthAgo),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer').gte('created_at', monthAgo),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
  ])

  // ── Quality ──
  const [
    { data: ratingData },
    { count: completedJobs },
    { count: totalJobs },
    { count: reviewCount },
    { count: cancelledJobs },
  ] = await Promise.all([
    admin.from('provider_details').select('avg_rating, response_time_mins').gt('review_count', 0),
    admin.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    admin.from('quote_requests').select('*', { count: 'exact', head: true }).not('status', 'in', '("cancelled")'),
    admin.from('reviews').select('*', { count: 'exact', head: true }),
    admin.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
  ])

  const avgRating = ratingData && ratingData.length > 0
    ? (ratingData.reduce((sum: number, p: any) => sum + Number(p.avg_rating), 0) / ratingData.length).toFixed(1)
    : '—'
  const responseTimes = ratingData?.filter((p: any) => p.response_time_mins) ?? []
  const avgResponseMins = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((sum: number, p: any) => sum + (p.response_time_mins ?? 0), 0) / responseTimes.length)
    : null
  const completionRate = pct(completedJobs ?? 0, totalJobs ?? 0)
  const reviewRate = pct(reviewCount ?? 0, completedJobs ?? 0)

  // ── Maidstone Launch ──
  const maidstonePostcodes = ['ME14', 'ME15', 'ME16', 'ME17', 'ME20']
  const postcodeFilter = maidstonePostcodes.map(p => `postcode.ilike.${p}%`).join(',')

  const [
    { count: maidstoneProviders },
    { count: maidstoneCustomers },
    { data: maidstoneServices },
    { count: totalCategories },
  ] = await Promise.all([
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider').or(postcodeFilter),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer').or(postcodeFilter),
    admin.from('services').select('category_id, categories(name), provider:profiles!services_provider_id_fkey(postcode)').eq('is_active', true),
    admin.from('categories').select('*', { count: 'exact', head: true }),
  ])

  // Count unique categories with at least one Maidstone provider
  const maidstoneCategories = new Set<string>()
  const categoryProviderCounts: Record<string, number> = {}
  maidstoneServices?.forEach((s: any) => {
    const postcode = (s.provider?.postcode ?? '').toUpperCase()
    if (maidstonePostcodes.some(p => postcode.startsWith(p))) {
      const catName = s.categories?.name ?? 'Unknown'
      maidstoneCategories.add(catName)
      categoryProviderCounts[catName] = (categoryProviderCounts[catName] ?? 0) + 1
    }
  })

  // ── Activity (last 7 days) ──
  const [
    { count: requestsThisWeek },
    { count: completedThisWeek },
    { count: reviewsThisWeek },
  ] = await Promise.all([
    admin.from('quote_requests').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
    admin.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed').gte('completed_at', weekAgo),
    admin.from('reviews').select('*', { count: 'exact', head: true }).gte('created_at', weekAgo),
  ])

  const sortedCategories = Object.entries(categoryProviderCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Platform KPIs
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Key performance indicators and Maidstone launch tracker.</p>
      </div>

      {/* Growth */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4" /> Growth
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Providers', value: totalProviders ?? 0 },
            { label: 'Total Customers', value: totalCustomers ?? 0 },
            { label: 'Ratio', value: `1:${totalProviders ? Math.round((totalCustomers ?? 0) / (totalProviders ?? 1)) : '—'}` },
            { label: 'New Providers (7d)', value: newProvidersWeek ?? 0 },
            { label: 'New Customers (7d)', value: newCustomersWeek ?? 0 },
            { label: 'New Providers (30d)', value: newProvidersMonth ?? 0 },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quality */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Activity className="h-4 w-4" /> Quality
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Avg Rating', value: avgRating },
            { label: 'Completion Rate', value: completionRate },
            { label: 'Review Rate', value: reviewRate },
            { label: 'Avg Response', value: avgResponseMins ? `${avgResponseMins}m` : '—' },
            { label: 'Completed Jobs', value: completedJobs ?? 0 },
            { label: 'Cancelled Jobs', value: cancelledJobs ?? 0 },
            { label: 'Total Reviews', value: reviewCount ?? 0 },
            { label: 'Requests (7d)', value: requestsThisWeek ?? 0 },
          ].map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Maidstone Launch Tracker */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> Maidstone Soft Launch
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className={(maidstoneProviders ?? 0) < 50 ? 'border-amber-300 bg-amber-50/50' : 'border-emerald-300 bg-emerald-50/50'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Maidstone Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{maidstoneProviders ?? 0} <span className="text-sm font-normal text-muted-foreground">/ 50 target</span></p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Maidstone Customers</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{maidstoneCustomers ?? 0}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Category Coverage</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{maidstoneCategories.size} <span className="text-sm font-normal text-muted-foreground">/ {totalCategories ?? 0}</span></p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed (7d)</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{completedThisWeek ?? 0}</p></CardContent>
          </Card>
        </div>

        {sortedCategories.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">CATEGORIES WITH MAIDSTONE PROVIDERS</p>
            <div className="flex flex-wrap gap-2">
              {sortedCategories.map(([name, count]) => (
                <span key={name} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                  {name} ({count})
                </span>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
