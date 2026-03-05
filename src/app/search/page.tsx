import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { SearchBar } from '@/components/search/SearchBar'
import { ProviderCard } from '@/components/provider/ProviderCard'
import SearchLoading from './loading'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; city?: string; category?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, city, category } = await searchParams
  const supabase = await createClient()

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

  // Main provider query
  let query = supabase
    .from('profiles')
    .select('id, full_name, avatar_url, city, provider_details!inner(business_name, is_available, avg_rating, review_count)')
    .eq('role', 'provider')

  if (q?.trim()) {
    query = query.textSearch('fts', q.trim(), { type: 'plain' })
  }
  if (city?.trim()) {
    query = query.ilike('city', `%${city.trim()}%`)
  }
  if (categoryProviderIds !== null) {
    if (categoryProviderIds.length === 0) {
      // Category exists but no providers — return empty
      return (
        <PageShell categories={categories ?? []} q={q} city={city} category={category}>
          <EmptyState q={q} category={category} />
        </PageShell>
      )
    }
    query = query.in('id', categoryProviderIds)
  }

  const { data: rawProviders } = await query.limit(48)

  // Get primary category per provider (first active service)
  const providers = await Promise.all(
    (rawProviders ?? []).map(async (p) => {
      const { data: svc } = await supabase
        .from('services')
        .select('categories(name)')
        .eq('provider_id', p.id)
        .eq('is_active', true)
        .limit(1)
        .single()

      return {
        ...p,
        provider_details: Array.isArray(p.provider_details)
          ? p.provider_details[0]
          : p.provider_details,
        primary_category: (svc?.categories as { name: string } | null)?.name ?? null,
      }
    })
  )

  // Sort by avg_rating descending
  providers.sort((a, b) =>
    (Number(b.provider_details?.avg_rating) ?? 0) -
    (Number(a.provider_details?.avg_rating) ?? 0)
  )

  return (
    <PageShell categories={categories ?? []} q={q} city={city} category={category}>
      {providers.length === 0 ? (
        <EmptyState q={q} category={category} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {providers.length} provider{providers.length !== 1 ? 's' : ''} found
            {city ? ` in ${city}` : ''}
            {category ? ` for ${category}` : ''}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {providers.map((p) => (
              <ProviderCard key={p.id} provider={p} />
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
  q, city, category,
}: {
  children: React.ReactNode
  categories: { id: number; name: string; slug: string }[]
  q?: string
  city?: string
  category?: string
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Find a local professional</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse verified providers near you
          </p>
        </div>
        <Suspense fallback={<SearchLoading />}>
          <SearchBar categories={categories} />
        </Suspense>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  )
}

function EmptyState({ q, category }: { q?: string; category?: string }) {
  return (
    <div className="text-center py-16 space-y-2">
      <p className="text-lg font-medium">No providers found</p>
      <p className="text-sm text-muted-foreground">
        {q || category
          ? 'Try adjusting your search or clearing the filters.'
          : 'No providers have signed up yet.'}
      </p>
    </div>
  )
}
