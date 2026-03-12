import { useEffect, useState } from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { OnboardingChecklist } from '../../components/provider/OnboardingChecklist'
import { Avatar } from '../../components/ui/Avatar'

interface Request {
  id: string
  message: string
  status: string
  created_at: string
  profiles: { full_name: string; avatar_url: string | null }
  services: { title: string } | null
}

export default function ProviderDashboard() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [serviceCount, setServiceCount] = useState(0)
  const [portfolioCount, setPortfolioCount] = useState(0)

  useEffect(() => {
    if (!user) return

    // Fetch provider details
    supabase.from('provider_details').select('*').eq('id', user.id).single()
      .then(({ data }) => setDetails(data))

    // Fetch recent requests
    supabase
      .from('quote_requests')
      .select('id, message, status, created_at, profiles!quote_requests_customer_id_fkey(full_name, avatar_url), services(title)')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setRequests((data as unknown as Request[]) ?? [])
        setLoading(false)
      })

    // Fetch service count for checklist
    supabase.from('services').select('id', { count: 'exact', head: true })
      .eq('provider_id', user.id).eq('is_active', true)
      .then(({ count }) => setServiceCount(count ?? 0))

    // Fetch portfolio count for checklist
    supabase.from('portfolio_items').select('id', { count: 'exact', head: true })
      .eq('provider_id', user.id)
      .then(({ count }) => setPortfolioCount(count ?? 0))
  }, [user])

  const checklistItems = [
    { label: 'Add a profile photo', done: !!profile?.avatar_url },
    { label: 'Set your business name', done: !!details?.business_name },
    { label: 'Add your first service', done: serviceCount > 0 },
    { label: 'Upload portfolio photos', done: portfolioCount > 0 },
    { label: 'Get your first review', done: (details?.review_count ?? 0) > 0 },
  ]

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Dashboard</Text>
            <Text style={styles.subtitle}>{profile?.full_name}</Text>
          </View>
          <Ionicons name="notifications-outline" size={24} color="#1E3A8A" />
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{details?.avg_rating?.toFixed(1) ?? '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{details?.review_count ?? 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        <OnboardingChecklist items={checklistItems} />

        {/* Recent requests */}
        <Text style={styles.sectionTitle}>Recent Requests</Text>
        {loading ? (
          <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 20 }} />
        ) : requests.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No requests yet</Text>
          </View>
        ) : (
          requests.slice(0, 5).map(req => (
            <TouchableOpacity key={req.id} style={styles.reqCard} onPress={() => router.push(`/chat/${req.id}`)}>
              <Avatar uri={req.profiles?.avatar_url ?? null} name={req.profiles?.full_name ?? '?'} size={40} />
              <View style={styles.reqInfo}>
                <Text style={styles.reqName}>{req.profiles?.full_name}</Text>
                <Text style={styles.reqMessage} numberOfLines={1}>{req.message}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: req.status === 'pending' ? '#FEF3C7' : '#DCFCE7' }]}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: req.status === 'pending' ? '#D97706' : '#16A34A' }}>
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8,
  },
  greeting: { fontSize: 24, fontWeight: '700', color: '#1E3A8A' },
  subtitle: { fontSize: 14, color: '#475569', marginTop: 2 },
  statsRow: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 20,
  },
  stat: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1,
  },
  statNum: { fontSize: 24, fontWeight: '700', color: '#2563EB' },
  statLabel: { fontSize: 12, color: '#475569', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A8A', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  reqCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 8,
  },
  reqInfo: { flex: 1 },
  reqName: { fontSize: 15, fontWeight: '600', color: '#1E3A8A' },
  reqMessage: { fontSize: 13, color: '#475569', marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  empty: { alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#94A3B8', fontSize: 14 },
})
