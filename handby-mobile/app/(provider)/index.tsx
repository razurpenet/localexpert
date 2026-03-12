import { useEffect, useState, useCallback } from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { OnboardingChecklist } from '../../components/provider/OnboardingChecklist'
import { Avatar } from '../../components/ui/Avatar'
import { colors, radius, shadow } from '../../lib/theme'

interface Request {
  id: string
  message: string
  status: string
  created_at: string
  profiles: { full_name: string; avatar_url: string | null }
  services: { title: string } | null
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending:     { bg: '#FEF3C7', text: '#D97706', label: 'Pending' },
  accepted:    { bg: '#DCFCE7', text: '#16A34A', label: 'Accepted' },
  confirmed:   { bg: '#DBEAFE', text: '#1E40AF', label: 'Confirmed' },
  en_route:    { bg: '#E0E7FF', text: '#4F46E5', label: 'En Route' },
  in_progress: { bg: '#FEF3C7', text: '#D97706', label: 'In Progress' },
  completed:   { bg: '#DCFCE7', text: '#16A34A', label: 'Completed' },
  declined:    { bg: '#FEE2E2', text: '#DC2626', label: 'Declined' },
  cancelled:   { bg: '#E0E7FF', text: '#475569', label: 'Cancelled' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function ProviderDashboard() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [serviceCount, setServiceCount] = useState(0)
  const [portfolioCount, setPortfolioCount] = useState(0)

  const fetchAll = useCallback(async () => {
    if (!user) return

    const [detailsRes, requestsRes, servicesRes, portfolioRes] = await Promise.all([
      supabase.from('provider_details').select('*').eq('id', user.id).single(),
      supabase
        .from('quote_requests')
        .select('id, message, status, created_at, profiles!quote_requests_customer_id_fkey(full_name, avatar_url), services(title)')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('services').select('id', { count: 'exact', head: true })
        .eq('provider_id', user.id).eq('is_active', true),
      supabase.from('portfolio_items').select('id', { count: 'exact', head: true })
        .eq('provider_id', user.id),
    ])

    setDetails(detailsRes.data)
    setRequests((requestsRes.data as unknown as Request[]) ?? [])
    setServiceCount(servicesRes.count ?? 0)
    setPortfolioCount(portfolioRes.count ?? 0)
    setLoading(false)
    setRefreshing(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Real-time: quote_requests changes
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('dashboard-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quote_requests',
        filter: `provider_id=eq.${user.id}`,
      }, () => { fetchAll() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchAll])

  // Real-time: provider_details changes (trigger updates rating/review_count)
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('dashboard-details')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'provider_details',
        filter: `id=eq.${user.id}`,
      }, () => { fetchAll() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchAll])

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const checklistItems = [
    { label: 'Add a profile photo', done: !!profile?.avatar_url },
    { label: 'Set your business name', done: !!details?.business_name },
    { label: 'Add your first service', done: serviceCount > 0 },
    { label: 'Upload portfolio photos', done: portfolioCount > 0 },
    { label: 'Get your first review', done: (details?.review_count ?? 0) > 0 },
    { label: 'Get Handby Verified (3+ reviews, verified credential, complete profile)', done: details?.is_verified === true },
  ]

  const onRefresh = () => { setRefreshing(true); fetchAll() }

  const quickActions: { icon: string; label: string; route: string }[] = [
    { icon: 'mail', label: 'Requests', route: '/(provider)/requests' },
    { icon: 'cash-outline', label: 'Earnings', route: '/(provider)/earnings' },
    { icon: 'construct', label: 'Services', route: '/(provider)/manage-services' },
    { icon: 'shield-checkmark', label: 'Credentials', route: '/(provider)/credentials' },
  ]

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar uri={profile?.avatar_url ?? null} name={profile?.full_name ?? '?'} size={44} />
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{profile?.full_name?.split(' ')[0]}</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Stats 2x2 Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statCard, pendingCount > 0 && styles.statCardAlert]} onPress={() => router.push('/(provider)/requests')}>
            <Ionicons name="time-outline" size={22} color={pendingCount > 0 ? colors.cta : colors.primary} />
            <Text style={[styles.statNum, pendingCount > 0 && { color: colors.cta }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(provider)/reviews')}>
            <Ionicons name="star" size={22} color={colors.star} />
            <Text style={styles.statNum}>{details?.avg_rating?.toFixed(1) ?? '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(provider)/reviews')}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
            <Text style={styles.statNum}>{details?.review_count ?? 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-done-circle-outline" size={22} color={colors.success} />
            <Text style={styles.statNum}>{details?.completion_count ?? 0}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
        </View>

        {/* Onboarding Checklist (auto-hides when complete) */}
        <OnboardingChecklist items={checklistItems} />

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map(action => (
            <TouchableOpacity key={action.label} style={styles.actionCard} onPress={() => router.push(action.route as any)}>
              <Ionicons name={action.icon as any} size={24} color={colors.primary} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Requests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/requests')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {requests.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="mail-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No requests yet</Text>
          </View>
        ) : (
          requests.slice(0, 5).map(req => {
            const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending
            return (
              <TouchableOpacity key={req.id} style={styles.reqCard} onPress={() => router.push(`/chat/${req.id}`)}>
                <Avatar uri={req.profiles?.avatar_url ?? null} name={req.profiles?.full_name ?? '?'} size={42} />
                <View style={styles.reqInfo}>
                  <Text style={styles.reqName}>{req.profiles?.full_name}</Text>
                  <Text style={styles.reqService} numberOfLines={1}>{req.services?.title ?? 'General enquiry'}</Text>
                </View>
                <View style={styles.reqRight}>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: cfg.text }]} />
                    <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                  </View>
                  <Text style={styles.reqTime}>{timeAgo(req.created_at)}</Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryBg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 14, color: colors.textBody },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16, marginTop: 20,
  },
  statCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  statCardAlert: {
    borderColor: colors.cta, borderWidth: 1.5,
  },
  statNum: { fontSize: 26, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textBody },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingRight: 16, marginBottom: 12,
  },
  seeAll: { fontSize: 14, fontWeight: '600', color: colors.primaryLight },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16, marginTop: 12,
  },
  actionCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  reqCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14,
    marginHorizontal: 16, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  reqInfo: { flex: 1 },
  reqName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  reqService: { fontSize: 13, color: colors.textBody, marginTop: 2 },
  reqRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  reqTime: { fontSize: 11, color: colors.textMuted },
  empty: { alignItems: 'center', marginTop: 32, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
})
