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
