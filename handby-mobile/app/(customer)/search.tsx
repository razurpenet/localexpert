import { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { FilterChips } from '../../components/search/FilterChips'
import { ProviderResultCard } from '../../components/search/ProviderResultCard'

interface Result {
  id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  provider_details: {
    business_name: string
    is_available: boolean
    avg_rating: number
    review_count: number
    completion_count?: number
    response_time_mins?: number | null
    badge_level?: 'new' | 'rising' | 'top'
    is_verified?: boolean
  }
  primary_category: string | null
  min_price: number | null
  credential_badges: string[]
}

const CATEGORY_LABELS: Record<string, string> = {
  'plumbing': 'Plumbing', 'electrical': 'Electrical', 'cleaning': 'Cleaning',
  'painting': 'Painting', 'carpentry': 'Carpentry', 'catering': 'Catering',
  'gardening': 'Gardening', 'moving-removals': 'Moving & Removals',
  'beauty-wellness': 'Beauty & Wellness', 'photography': 'Photography & Videography',
  'tutoring': 'Tutoring & Mentoring', 'it-tech-support': 'IT & Tech Support',
  'locksmith': 'Locksmith', 'roofing': 'Roofing', 'appliance-repair': 'Appliance Repair',
  'mobile-mechanic': 'Mobile Mechanic', 'pet-care': 'Pet Care',
  'home-care': 'Home & Elderly Care', 'childcare': 'Childcare',
  'personal-training': 'Personal Training', 'pest-control': 'Pest Control',
  'solar-ev': 'Solar & EV Install', 'event-planning': 'Event Planning',
  'driving-instruction': 'Driving Instruction',
  'african-hair-braiding': 'African Hair Braiding', 'afro-caribbean-catering': 'Afro-Caribbean Catering',
  'african-tailoring': 'African Tailoring', 'celebration-cakes': 'Celebration Cakes',
  'event-decoration': 'Event Decoration', 'gele-headwrap': 'Gele & Headwrap Styling',
  'makeup-artist': 'Makeup Artist', 'afro-barber': 'Barber (Afro Specialist)',
  'home-cooking': 'Home Cooking & Meal Prep', 'dj-entertainment': 'DJ & Entertainment',
  'translation': 'Translation & Interpreting', 'immigration-consulting': 'Immigration Consulting',
  'laundry-ironing': 'Laundry & Ironing', 'party-planning': 'Party Planning',
}

function calculateRankScore(provider: Result & { lat?: number | null; lng?: number | null }, customerLat?: number | null, customerLng?: number | null): number {
  const d = provider.provider_details
  if (!d) return 0

  const ratingScore = (d.avg_rating ?? 0) / 5
  const mins = d.response_time_mins
  const speedScore = mins == null ? 0 : mins < 30 ? 1.0 : mins < 120 ? 0.7 : mins < 1440 ? 0.3 : 0.1
  const completionScore = Math.min((d.completion_count ?? 0) / 20, 1.0)
  const availScore = d.is_available ? 1.0 : 0.0

  let distScore = 0.5
  if (customerLat != null && customerLng != null && provider.lat != null && provider.lng != null) {
    const dist = haversineKm(customerLat, customerLng, provider.lat, provider.lng)
    distScore = Math.max(0, 1 - dist / 50)
  }

  return (ratingScore * 0.30) + (speedScore * 0.25) + (completionScore * 0.20) + (availScore * 0.15) + (distScore * 0.10)
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export default function SearchScreen() {
  const { category } = useLocalSearchParams<{ category?: string }>()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(category ?? null)
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (category) setCategoryFilter(category)
  }, [category])

  useEffect(() => {
    fetchProviders()
  }, [query, filter, categoryFilter])

  async function fetchProviders() {
    setLoading(true)
    let q = supabase
      .from('profiles')
      .select('id, full_name, avatar_url, city, lat, lng, provider_details(business_name, is_available, avg_rating, review_count, completion_count, response_time_mins, badge_level, is_verified)')
      .eq('role', 'provider')
      .not('provider_details', 'is', null)
      .limit(48)

    if (query.trim()) {
      q = q.or(`full_name.ilike.%${query}%,city.ilike.%${query}%`)
    }

    const { data } = await q

    if (!data) { setResults([]); setLoading(false); return }

    // Enrich with primary category, min price, and credential badges
    const providerIds = data.map(p => p.id)

    const [servicesRes, credentialsRes] = await Promise.all([
      supabase
        .from('services')
        .select('provider_id, price_from, category_id, categories(name, slug)')
        .in('provider_id', providerIds)
        .eq('is_active', true),
      supabase
        .from('credentials')
        .select('provider_id, type, label, verified')
        .in('provider_id', providerIds)
        .eq('verified', true),
    ])

    const services = servicesRes.data ?? []
    const credentials = credentialsRes.data ?? []

    const enriched = data.map(p => {
      const provServices = services.filter(s => s.provider_id === p.id)
      const prices = provServices.map(s => s.price_from).filter(Boolean) as number[]
      const firstCat = provServices.find(s => s.categories)?.categories as unknown as { name: string; slug: string } | undefined

      // Build credential badge labels
      const provCreds = credentials.filter(c => c.provider_id === p.id)
      const credBadges: string[] = []
      if (provCreds.some(c => c.label?.toLowerCase().includes('gas safe') || c.type === 'certification' && c.label?.toLowerCase().includes('gas'))) {
        credBadges.push('Gas Safe')
      }
      if (provCreds.some(c => c.label?.toLowerCase().includes('dbs') || c.label?.toLowerCase().includes('background'))) {
        credBadges.push('DBS Checked')
      }
      if (provCreds.some(c => c.type === 'insurance')) {
        credBadges.push('Insured')
      }
      // Any other verified credentials
      provCreds.forEach(c => {
        const label = c.label?.trim()
        if (label && !credBadges.includes(label) && credBadges.length < 4) {
          if (!label.toLowerCase().includes('gas') && !label.toLowerCase().includes('dbs') && c.type !== 'insurance') {
            credBadges.push(label)
          }
        }
      })

      return {
        ...p,
        provider_details: (Array.isArray(p.provider_details) ? p.provider_details[0] : p.provider_details) as Result['provider_details'],
        primary_category: firstCat?.name ?? null,
        min_price: prices.length ? Math.min(...prices) : null,
        credential_badges: credBadges,
        _categorySlugs: provServices.map(s => (s.categories as unknown as { slug: string })?.slug).filter(Boolean),
      }
    })

    // Apply filters
    let filtered = enriched.filter(p => p.provider_details)

    // Apply smart ranking as default sort
    filtered.forEach(p => {
      (p as any)._rankScore = calculateRankScore(p as any, null, null)
    })
    filtered.sort((a, b) => ((b as any)._rankScore ?? 0) - ((a as any)._rankScore ?? 0))

    if (categoryFilter) {
      filtered = filtered.filter(p => p._categorySlugs.includes(categoryFilter))
    }

    if (filter === 'available') {
      filtered = filtered.filter(p => p.provider_details.is_available)
    }
    if (filter === 'rating') {
      filtered.sort((a, b) => (b.provider_details.avg_rating ?? 0) - (a.provider_details.avg_rating ?? 0))
    }
    if (filter === 'price') {
      filtered.sort((a, b) => (a.min_price ?? 999) - (b.min_price ?? 999))
    }
    if (filter === 'fastest') {
      filtered.sort((a, b) => (a.provider_details.response_time_mins ?? 999) - (b.provider_details.response_time_mins ?? 999))
    }
    if (filter === 'top_rated') {
      filtered = filtered.filter(p => p.provider_details.badge_level === 'top' || p.provider_details.badge_level === 'rising')
    }
    if (filter === 'verified') {
      filtered = filtered.filter(p => p.credential_badges.length > 0)
    }

    setResults(filtered)
    setLoading(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          style={styles.input}
          placeholder="Search services, areas..."
          placeholderTextColor="#94A3B8"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {categoryFilter && (
        <View style={styles.categoryChip}>
          <Text style={styles.categoryChipText}>{CATEGORY_LABELS[categoryFilter] ?? categoryFilter}</Text>
          <TouchableOpacity onPress={() => setCategoryFilter(null)}>
            <Ionicons name="close-circle" size={18} color="#1E40AF" />
          </TouchableOpacity>
        </View>
      )}

      <FilterChips activeFilter={filter} onSelect={setFilter} />

      {loading ? (
        <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <ProviderResultCard
              id={item.id}
              full_name={item.full_name}
              avatar_url={item.avatar_url}
              city={item.city}
              business_name={item.provider_details?.business_name ?? null}
              avg_rating={item.provider_details?.avg_rating ?? 0}
              review_count={item.provider_details?.review_count ?? 0}
              is_available={item.provider_details?.is_available ?? false}
              primary_category={item.primary_category}
              min_price={item.min_price}
              completion_count={item.provider_details?.completion_count ?? 0}
              response_time_mins={item.provider_details?.response_time_mins ?? null}
              badge_level={item.provider_details?.badge_level as any ?? 'new'}
              credential_badges={item.credential_badges}
              is_verified={item.provider_details?.is_verified ?? false}
              isTopMatch={index === 0 && !filter}
            />
          )}
          ListHeaderComponent={
            <Text style={styles.count}>{results.length} result{results.length !== 1 ? 's' : ''}</Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyText}>No providers found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16,
    borderWidth: 1, borderColor: '#E0E7FF',
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#1E3A8A' },
  count: { fontSize: 14, color: '#475569', paddingHorizontal: 16, paddingBottom: 12 },
  list: { paddingBottom: 32 },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#475569' },
  emptySubtext: { fontSize: 14, color: '#94A3B8' },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#DBEAFE', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    marginHorizontal: 16, marginTop: 8, alignSelf: 'flex-start',
  },
  categoryChipText: { fontSize: 14, fontWeight: '600', color: '#1E40AF' },
})
