# P1 Admin: KPI Dashboard, Provider Health, Supply/Demand & Customer Health

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 4 P1 admin features — KPI dashboard with Maidstone launch tracker, provider health metrics, supply/demand gap analysis, and customer health metrics — so Handby can manage growth and spot problems from week 1.

**Architecture:** New pages under the existing `/dashboard/admin/*` layout. All queries use `createAdminClient()` (service role, bypasses RLS). No new database tables needed — all metrics are derived from existing `quote_requests`, `profiles`, `provider_details`, `services`, `categories`, `reviews`, and `credentials` tables via aggregate queries. One small migration adds a `searches` table to track demand signals.

**Tech Stack:** Next.js 16 App Router, Server Components, Supabase (service role client), shadcn/ui (Card, Badge), Tailwind CSS 4, Lucide icons.

---

## Task 1: Migration — Search Analytics Table

**Files:**
- Create: `supabase/migrations/20260314_search_analytics.sql`

**Why:** To power the demand heatmap and "searches with 0 results" metric, we need to log what customers search for. No existing table tracks this.

**Step 1: Write the migration**

```sql
-- Migration: Search Analytics
-- Date: 2026-03-14
-- Adds: searches table to track customer search behaviour for demand analysis
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),          -- nullable for anonymous
  query text,                                        -- what they typed
  category_id integer REFERENCES categories(id),     -- category filter used
  city text,                                         -- location searched
  postcode text,                                     -- postcode searched
  result_count integer DEFAULT 0,                    -- how many providers returned
  led_to_request boolean DEFAULT false,              -- did they send a quote request?
  created_at timestamptz DEFAULT now()
);

ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

-- Users can insert their own searches
CREATE POLICY "searches_insert" ON searches FOR INSERT
  WITH CHECK (true);

-- Only service role can read (admin analytics)
-- No user-facing SELECT policy
```

**Step 2: Run in Supabase Dashboard SQL Editor**

**Step 3: Log searches from the search page**

Modify: `handby-mobile/components/home/CategoryGrid.tsx` (or wherever search happens)

This is a lightweight fire-and-forget insert when a customer performs a search. We'll wire this up in a later task — for now the table exists and the admin pages query it.

**Step 4: Commit**

```bash
git add supabase/migrations/20260314_search_analytics.sql
git commit -m "feat: add searches table for demand analytics"
```

---

## Task 2: KPI Dashboard Page

**Files:**
- Create: `src/app/dashboard/admin/kpis/page.tsx`

**Step 1: Create the KPI page**

This page shows 4 sections:
1. **Growth metrics** — signups this week/month, split by role
2. **Quality metrics** — avg rating, completion rate, response time, review rate
3. **Maidstone launch tracker** — provider count vs target, category coverage in ME postcodes
4. **Activity metrics** — DAU/WAU proxies based on quote_requests activity

```typescript
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
    ? (ratingData.reduce((sum, p) => sum + Number(p.avg_rating), 0) / ratingData.length).toFixed(1)
    : '—'
  const avgResponseMins = ratingData && ratingData.length > 0
    ? Math.round(ratingData.filter(p => p.response_time_mins).reduce((sum, p) => sum + (p.response_time_mins ?? 0), 0) / ratingData.filter(p => p.response_time_mins).length) || '—'
    : '—'
  const completionRate = pct(completedJobs ?? 0, (totalJobs ?? 0))
  const reviewRate = pct(reviewCount ?? 0, completedJobs ?? 0)

  // ── Maidstone Launch ──
  const maidstonePostcodes = ['ME14', 'ME15', 'ME16', 'ME17', 'ME20']
  const { count: maidstoneProviders } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'provider')
    .or(maidstonePostcodes.map(p => `postcode.ilike.${p}%`).join(','))

  const { count: maidstoneCustomers } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')
    .or(maidstonePostcodes.map(p => `postcode.ilike.${p}%`).join(','))

  const { data: maidstoneServices } = await admin
    .from('services')
    .select('category_id, categories(name), provider:profiles!services_provider_id_fkey(postcode)')
    .eq('is_active', true)

  // Count unique categories with at least one Maidstone provider
  const maidstoneCategories = new Set<string>()
  const categoryProviderCounts: Record<string, number> = {}
  maidstoneServices?.forEach((s: any) => {
    const postcode = s.provider?.postcode ?? ''
    if (maidstonePostcodes.some(p => postcode.toUpperCase().startsWith(p))) {
      const catName = s.categories?.name ?? 'Unknown'
      maidstoneCategories.add(catName)
      categoryProviderCounts[catName] = (categoryProviderCounts[catName] ?? 0) + 1
    }
  })

  const { count: totalCategories } = await admin.from('categories').select('*', { count: 'exact', head: true })

  // ── Activity (last 7 days) ──
  const { count: requestsThisWeek } = await admin
    .from('quote_requests')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo)

  const { count: completedThisWeek } = await admin
    .from('quote_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', weekAgo)

  const { count: reviewsThisWeek } = await admin
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo)

  // Sort categories by provider count for the launch tracker
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
            { label: 'Avg Response', value: typeof avgResponseMins === 'number' ? `${avgResponseMins}m` : '—' },
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

        {/* Category breakdown */}
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
```

**Step 2: Add KPIs to sidebar nav**

Modify: `src/app/dashboard/admin/layout.tsx`

Add to NAV_ITEMS array:
```typescript
{ href: '/dashboard/admin/kpis', label: 'KPIs', icon: BarChart3 },
```

**Step 3: Commit**

```bash
git add src/app/dashboard/admin/kpis/ src/app/dashboard/admin/layout.tsx
git commit -m "feat: add KPI dashboard with Maidstone launch tracker"
```

---

## Task 3: Provider Health Page

**Files:**
- Create: `src/app/dashboard/admin/provider-health/page.tsx`

**Step 1: Create the provider health page**

This page flags problematic providers in 4 categories:
1. **Inactive** — `is_available = true` but no quote_request response in 14+ days
2. **Low rating** — avg_rating below 3.5 with 3+ reviews
3. **High decline rate** — declined > 50% of requests (min 5 requests)
4. **Stalled onboarding** — signed up 30+ days ago, 0 completed jobs

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HeartPulse, AlertTriangle, ThumbsDown, Clock, UserX } from 'lucide-react'
import Link from 'next/link'

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
    if (!stats) return true // available but never received a request — could be new
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

  function ProviderRow({ user, detail, extra }: { user: any; detail?: string; extra?: string }) {
    const d = user.provider_details as any
    return (
      <div className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="font-medium text-sm">{user.full_name ?? 'No name'}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {user.city && <p className="text-xs text-muted-foreground">{user.city}{user.postcode ? `, ${user.postcode}` : ''}</p>}
          {detail && <p className="text-xs text-amber-600 font-medium">{detail}</p>}
        </div>
        <div className="text-right space-y-0.5">
          {d && (
            <>
              <p className="text-xs text-muted-foreground">{d.avg_rating ? `${Number(d.avg_rating).toFixed(1)} stars` : 'No rating'} · {d.review_count ?? 0} reviews · {d.completion_count ?? 0} jobs</p>
              {extra && <p className="text-xs text-muted-foreground">{extra}</p>}
            </>
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
```

**Step 2: Add to sidebar nav**

Modify: `src/app/dashboard/admin/layout.tsx`

Add to NAV_ITEMS:
```typescript
{ href: '/dashboard/admin/provider-health', label: 'Provider Health', icon: HeartPulse },
```

**Step 3: Commit**

```bash
git add src/app/dashboard/admin/provider-health/ src/app/dashboard/admin/layout.tsx
git commit -m "feat: add provider health dashboard with inactive/low-rating/decline/stalled flags"
```

---

## Task 4: Supply & Demand Gap Page

**Files:**
- Create: `src/app/dashboard/admin/supply/page.tsx`

**Step 1: Create the supply/demand page**

Shows:
1. **Category coverage by ME postcode** — table of categories × postcodes with provider counts
2. **Gap alerts** — categories with 0 providers in target postcodes
3. **Search demand** — top searched categories and 0-result searches (once search logging is active)

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Map, AlertTriangle, TrendingUp } from 'lucide-react'

const TARGET_POSTCODES = ['ME14', 'ME15', 'ME16', 'ME17', 'ME20']

export default async function SupplyDemandPage() {
  const admin = createAdminClient()

  // Get all categories
  const { data: categories } = await admin
    .from('categories')
    .select('id, name, slug')
    .order('name')

  // Get all active services with provider postcode
  const { data: services } = await admin
    .from('services')
    .select('category_id, provider:profiles!services_provider_id_fkey(postcode, id)')
    .eq('is_active', true)

  // Build coverage matrix: category → postcode → Set of provider IDs
  const coverage: Record<number, Record<string, Set<string>>> = {}
  categories?.forEach(c => { coverage[c.id] = {} })

  services?.forEach((s: any) => {
    const postcode = (s.provider?.postcode ?? '').toUpperCase()
    const providerId = s.provider?.id
    if (!postcode || !providerId) return

    const matchedPrefix = TARGET_POSTCODES.find(p => postcode.startsWith(p))
    if (!matchedPrefix) return

    if (!coverage[s.category_id]) return
    if (!coverage[s.category_id][matchedPrefix]) coverage[s.category_id][matchedPrefix] = new Set()
    coverage[s.category_id][matchedPrefix].add(providerId)
  })

  // Find gaps: categories with 0 providers across all target postcodes
  const gaps = categories?.filter(c => {
    return TARGET_POSTCODES.every(p => !coverage[c.id]?.[p] || coverage[c.id][p].size === 0)
  }) ?? []

  // Find partially covered: have some postcodes but not all
  const partial = categories?.filter(c => {
    const coveredCount = TARGET_POSTCODES.filter(p => coverage[c.id]?.[p]?.size > 0).length
    return coveredCount > 0 && coveredCount < TARGET_POSTCODES.length
  }) ?? []

  // Total providers per postcode
  const postcodeTotals: Record<string, number> = {}
  TARGET_POSTCODES.forEach(p => {
    const uniqueProviders = new Set<string>()
    Object.values(coverage).forEach(catMap => {
      catMap[p]?.forEach(id => uniqueProviders.add(id))
    })
    postcodeTotals[p] = uniqueProviders.size
  })

  // Search demand (if table exists and has data)
  let topSearches: { category: string; count: number }[] = []
  let zeroResultSearches = 0
  try {
    const { data: searchData } = await admin
      .from('searches')
      .select('category_id, result_count, categories(name)')
      .order('created_at', { ascending: false })
      .limit(500)

    if (searchData && searchData.length > 0) {
      zeroResultSearches = searchData.filter((s: any) => s.result_count === 0).length
      const catCounts: Record<string, number> = {}
      searchData.forEach((s: any) => {
        const name = s.categories?.name ?? 'Unknown'
        catCounts[name] = (catCounts[name] ?? 0) + 1
      })
      topSearches = Object.entries(catCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([category, count]) => ({ category, count }))
    }
  } catch {
    // searches table may not exist yet
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Map className="h-6 w-6 text-primary" />
          Supply & Demand
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Category coverage across Maidstone postcodes. Spot gaps and prioritise recruitment.
        </p>
      </div>

      {/* Postcode overview */}
      <div className="grid grid-cols-5 gap-3">
        {TARGET_POSTCODES.map(p => (
          <Card key={p} className={postcodeTotals[p] === 0 ? 'border-red-300 bg-red-50/50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{p}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{postcodeTotals[p]}</p>
              <p className="text-xs text-muted-foreground">providers</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gap alerts */}
      {gaps.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-red-600 uppercase tracking-wide flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Zero Coverage ({gaps.length} categories)
          </h2>
          <div className="flex flex-wrap gap-2">
            {gaps.map(c => (
              <span key={c.id} className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 font-medium border border-red-200">
                {c.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Partial coverage */}
      {partial.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-amber-600 uppercase tracking-wide">
            Partial Coverage ({partial.length} categories)
          </h2>
          <div className="flex flex-wrap gap-2">
            {partial.map(c => {
              const coveredPostcodes = TARGET_POSTCODES.filter(p => coverage[c.id]?.[p]?.size > 0)
              return (
                <span key={c.id} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
                  {c.name} ({coveredPostcodes.join(', ')})
                </span>
              )
            })}
          </div>
        </section>
      )}

      {/* Coverage matrix */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Full Coverage Matrix
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Category</th>
                {TARGET_POSTCODES.map(p => (
                  <th key={p} className="text-center py-2 px-3 font-medium text-muted-foreground">{p}</th>
                ))}
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">Total</th>
              </tr>
            </thead>
            <tbody>
              {categories?.map(c => {
                const total = TARGET_POSTCODES.reduce((sum, p) => sum + (coverage[c.id]?.[p]?.size ?? 0), 0)
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-4 font-medium">{c.name}</td>
                    {TARGET_POSTCODES.map(p => {
                      const count = coverage[c.id]?.[p]?.size ?? 0
                      return (
                        <td key={p} className="text-center py-2 px-3">
                          <span className={`inline-block min-w-[1.5rem] rounded-full px-1.5 py-0.5 text-xs font-medium ${
                            count === 0 ? 'bg-red-50 text-red-400' : count < 3 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {count}
                          </span>
                        </td>
                      )
                    })}
                    <td className="text-center py-2 px-3 font-bold">{total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Search demand */}
      {topSearches.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" /> Search Demand (Recent)
          </h2>
          {zeroResultSearches > 0 && (
            <p className="text-sm text-red-600 font-medium">{zeroResultSearches} searches returned 0 results</p>
          )}
          <div className="flex flex-wrap gap-2">
            {topSearches.map(s => (
              <span key={s.category} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                {s.category} ({s.count})
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
```

**Step 2: Add to sidebar nav**

Modify: `src/app/dashboard/admin/layout.tsx`

Add to NAV_ITEMS:
```typescript
{ href: '/dashboard/admin/supply', label: 'Supply/Demand', icon: Map },
```

**Step 3: Commit**

```bash
git add src/app/dashboard/admin/supply/ supabase/migrations/20260314_search_analytics.sql src/app/dashboard/admin/layout.tsx
git commit -m "feat: add supply/demand gap analysis with Maidstone postcode coverage matrix"
```

---

## Task 5: Customer Health Page

**Files:**
- Create: `src/app/dashboard/admin/customer-health/page.tsx`

**Step 1: Create the customer health page**

Shows:
1. **No-response customers** — sent a request but never got a provider response
2. **Repeat bookers** — customers with 2+ completed jobs (loyalty signal)
3. **Negative reviewers** — customers who left 1-2 star reviews (retention risk)
4. **Inactive customers** — signed up but never sent a request

```typescript
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
  const customerRequests: Record<string, { total: number; pending: number; declined: number; completed: number; noResponse: number }> = {}
  requests?.forEach((r) => {
    if (!customerRequests[r.customer_id]) {
      customerRequests[r.customer_id] = { total: 0, pending: 0, declined: 0, completed: 0, noResponse: 0 }
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

  // Recent negative reviews for display
  const recentNegativeReviews = reviews?.filter(r => r.rating <= 2).slice(0, 10) ?? []

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
      items: inactive.slice(0, 50), // cap display
      color: 'text-slate-500',
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
        {sections.map((s) => (
          <Card key={s.title} className={s.title === 'Repeat Bookers' ? 'border-emerald-300 bg-emerald-50/50' : s.items.length > 0 ? 'border-amber-300 bg-amber-50/50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.title}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.items.length > 0 ? s.color : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{s.title === 'Inactive (Never Requested)' ? inactive.length : s.items.length}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Detail sections */}
      {sections.map((s) => (
        s.items.length > 0 && (
          <section key={s.title} className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {s.title} ({s.title === 'Inactive (Never Requested)' ? `${inactive.length} total, showing 50` : s.items.length}) — {s.subtitle}
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
```

**Step 2: Add to sidebar nav**

Modify: `src/app/dashboard/admin/layout.tsx`

Add to NAV_ITEMS:
```typescript
{ href: '/dashboard/admin/customer-health', label: 'Customer Health', icon: Heart },
```

**Step 3: Commit**

```bash
git add src/app/dashboard/admin/customer-health/ src/app/dashboard/admin/layout.tsx
git commit -m "feat: add customer health dashboard with retention signals"
```

---

## Task 6: Update Admin Layout with All P1 Nav Items

**Files:**
- Modify: `src/app/dashboard/admin/layout.tsx`

**Step 1: Final nav with all P1 items**

The layout NAV_ITEMS should be:

```typescript
import { Shield, Award, GitPullRequest, Users, BarChart3, HeartPulse, Map, Heart } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard/admin',                label: 'Overview',         icon: BarChart3 },
  { href: '/dashboard/admin/rtw',            label: 'RTW Queue',        icon: Shield },
  { href: '/dashboard/admin/credentials',    label: 'Credentials',      icon: Award },
  { href: '/dashboard/admin/pipeline',       label: 'Pipeline',         icon: GitPullRequest },
  { href: '/dashboard/admin/users',          label: 'Users',            icon: Users },
  { href: '/dashboard/admin/kpis',           label: 'KPIs',             icon: BarChart3 },
  { href: '/dashboard/admin/provider-health',label: 'Provider Health',  icon: HeartPulse },
  { href: '/dashboard/admin/supply',         label: 'Supply/Demand',    icon: Map },
  { href: '/dashboard/admin/customer-health',label: 'Customer Health',  icon: Heart },
]
```

**Step 2: Commit**

```bash
git add src/app/dashboard/admin/layout.tsx
git commit -m "feat: add P1 nav items to admin sidebar"
```

---

## Summary

| Task | Page | What it shows |
|------|------|---------------|
| 1 | Migration | `searches` table for demand tracking |
| 2 | `/admin/kpis` | Growth, quality metrics, Maidstone launch tracker |
| 3 | `/admin/provider-health` | Inactive, low-rating, high-decline, stalled onboarding |
| 4 | `/admin/supply` | Category × postcode coverage matrix, gap alerts |
| 5 | `/admin/customer-health` | No-response, inactive, negative reviewers, repeat bookers |
| 6 | Layout update | All P1 nav items in sidebar |
