import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/search/SearchBar'
import { ProviderCard } from '@/components/provider/ProviderCard'
import PublicNavbar from '@/components/shared/PublicNavbar'
import SearchLoading from './loading'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    city?: string
    category?: string
    lat?: string
    lng?: string
    radius?: string
    sort?: string
    available?: string
  }>
}

// Haversine distance in miles
function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 3958.8
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, city, category, lat, lng, radius, sort, available } = await searchParams
  const supabase = await createClient()

  const userLat      = lat    ? parseFloat(lat)    : null
  const userLng      = lng    ? parseFloat(lng)    : null
  const radiusMi     = radius ? parseFloat(radius) : 10
  const useGeoFilter = userLat !== null && userLng !== null
  const availOnly    = available === 'true'
  const sortBy       = sort ?? (useGeoFilter ? 'distance' : 'rating')

  // Fetch categories for the filter bar
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug')
    .order('name')

  // If category filter, resolve to provider IDs first
  let categoryProviderIds: string[] | null = null
  if (category) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single()

    if (cat) {
      const { data: svcs } = await supabase
        .from('services')
        .select('provider_id')
        .eq('category_id', cat.id)
        .eq('is_active', true)

      categoryProviderIds = [...new Set(svcs?.map((s) => s.provider_id) ?? [])]
    }
  }

  // Main provider query — include lat/lng for distance calculation
  let query = supabase
    .from('profiles')
    .select('id, full_name, avatar_url, city, lat, lng, provider_details!inner(business_name, is_available, avg_rating, review_count)')
    .eq('role', 'provider')

  if (q?.trim()) {
    query = query.textSearch('fts', q.trim(), { type: 'plain' })
  }
  if (city?.trim() && !useGeoFilter) {
    query = query.ilike('city', `%${city.trim()}%`)
  }
  if (categoryProviderIds !== null) {
    if (categoryProviderIds.length === 0) {
      return (
        <PageShell categories={categories ?? []} q={q} city={city} category={category} sort={sortBy} available={availOnly}>
          <EmptyState q={q} category={category} />
        </PageShell>
      )
    }
    query = query.in('id', categoryProviderIds)
  }

  const { data: rawProviders } = await query.limit(200)

  // Batch-fetch min prices for all providers (single query, avoids N+1)
  const providerIds = rawProviders?.map((p) => p.id) ?? []
  const { data: priceRows } = providerIds.length > 0
    ? await supabase
        .from('services')
        .select('provider_id, price_from')
        .in('provider_id', providerIds)
        .eq('is_active', true)
        .not('price_from', 'is', null)
    : { data: [] }

  const priceMap: Record<string, number> = {}
  for (const row of (priceRows ?? [])) {
    const cur = priceMap[row.provider_id]
    if (cur === undefined || row.price_from < cur) {
      priceMap[row.provider_id] = row.price_from
    }
  }

  // Enrich with primary category + distance + min price
  const enriched = await Promise.all(
    (rawProviders ?? []).map(async (p) => {
      const { data: svc } = await supabase
        .from('services')
        .select('categories(name)')
        .eq('provider_id', p.id)
        .eq('is_active', true)
        .limit(1)
        .single()

      const distMi = (useGeoFilter && p.lat && p.lng)
        ? distanceMiles(userLat!, userLng!, Number(p.lat), Number(p.lng))
        : null

      return {
        ...p,
        provider_details: Array.isArray(p.provider_details)
          ? p.provider_details[0]
          : p.provider_details,
        primary_category: (svc?.categories as unknown as { name: string } | null)?.name ?? null,
        distance_miles:   distMi,
        min_price:        priceMap[p.id] ?? null,
      }
    })
  )

  // Filter by radius when geo is active
  let providers = useGeoFilter
    ? enriched.filter((p) => p.distance_miles === null || p.distance_miles <= radiusMi)
    : enriched

  // Filter by availability
  if (availOnly) {
    providers = providers.filter((p) => p.provider_details?.is_available)
  }

  // Sort
  if (sortBy === 'distance' && useGeoFilter) {
    providers.sort((a, b) => {
      if (a.distance_miles === null) return 1
      if (b.distance_miles === null) return -1
      return a.distance_miles - b.distance_miles
    })
  } else if (sortBy === 'reviews') {
    providers.sort((a, b) =>
      (Number(b.provider_details?.review_count) ?? 0) -
      (Number(a.provider_details?.review_count) ?? 0)
    )
  } else {
    providers.sort((a, b) =>
      (Number(b.provider_details?.avg_rating) ?? 0) -
      (Number(a.provider_details?.avg_rating) ?? 0)
    )
  }

  // Cap display at 48
  providers = providers.slice(0, 48)

  return (
    <PageShell categories={categories ?? []} q={q} city={city} category={category} sort={sortBy} available={availOnly}>
      {providers.length === 0 ? (
        <EmptyState q={q} category={category} geoActive={useGeoFilter} radiusMi={radiusMi} availOnly={availOnly} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {providers.length} provider{providers.length !== 1 ? 's' : ''} found
            {useGeoFilter ? ` within ${radiusMi} miles` : city ? ` in ${city}` : ''}
            {category ? ` for ${category}` : ''}
            {availOnly ? ' · available now' : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {providers.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                distanceMiles={p.distance_miles ?? undefined}
                minPrice={p.min_price ?? undefined}
              />
            ))}
          </div>
        </>
      )}
    </PageShell>
  )
}

function PageShell({
  children,
  categories,
  sort,
  available,
}: {
  children: React.ReactNode
  categories: { id: number; name: string; slug: string }[]
  q?: string
  city?: string
  category?: string
  sort?: string
  available?: boolean
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Find a local professional</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse verified providers near you
          </p>
        </div>
        <Suspense fallback={<SearchLoading />}>
          <SearchBar categories={categories} sort={sort} available={available} />
        </Suspense>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  )
}

function EmptyState({ q, category, geoActive, radiusMi, availOnly }: {
  q?: string
  category?: string
  geoActive?: boolean
  radiusMi?: number
  availOnly?: boolean
}) {
  return (
    <div className="text-center py-16 space-y-2">
      <p className="text-lg font-medium">No providers found</p>
      <p className="text-sm text-muted-foreground">
        {availOnly
          ? 'No available providers match your search. Try turning off the "Available now" filter.'
          : geoActive
          ? `No providers within ${radiusMi} miles. Try increasing the radius.`
          : q || category
          ? 'Try adjusting your search or clearing the filters.'
          : 'No providers have signed up yet.'}
      </p>
    </div>
  )
}
