import { useEffect, useState, useCallback, useRef } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { StatusToast } from '../../components/ui/StatusToast'
import { ReviewModal } from '../../components/ui/ReviewModal'

type JobStatus = 'pending' | 'accepted' | 'declined' | 'confirmed' | 'en_route' | 'in_progress' | 'completed' | 'cancelled'

interface Booking {
  id: string
  provider_id: string
  message: string
  status: JobStatus
  created_at: string
  confirmed_at: string | null
  en_route_at: string | null
  started_at: string | null
  completed_at: string | null
  profiles: { full_name: string; avatar_url: string | null }
  services: { title: string } | null
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  pending:     { bg: '#FEF3C7', text: '#D97706', icon: 'time-outline',         label: 'Awaiting Response' },
  accepted:    { bg: '#DCFCE7', text: '#16A34A', icon: 'checkmark-circle',     label: 'Accepted' },
  confirmed:   { bg: '#DBEAFE', text: '#2563EB', icon: 'calendar-outline',     label: 'Confirmed' },
  en_route:    { bg: '#E0E7FF', text: '#4F46E5', icon: 'navigate-outline',     label: 'En Route' },
  in_progress: { bg: '#FEF3C7', text: '#D97706', icon: 'construct-outline',    label: 'In Progress' },
  completed:   { bg: '#DCFCE7', text: '#16A34A', icon: 'checkmark-done-circle', label: 'Completed' },
  declined:    { bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle-outline', label: 'Declined' },
  cancelled:   { bg: '#E0E7FF', text: '#475569', icon: 'ban-outline',          label: 'Cancelled' },
}

const TIMELINE_STEPS: { key: JobStatus; label: string }[] = [
  { key: 'pending',     label: 'Requested' },
  { key: 'accepted',    label: 'Accepted' },
  { key: 'confirmed',   label: 'Confirmed' },
  { key: 'en_route',    label: 'En Route' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed',   label: 'Complete' },
]

const ACTIVE_TABS = ['active', 'completed', 'all'] as const

function getStepIndex(status: JobStatus): number {
  const idx = TIMELINE_STEPS.findIndex(s => s.key === status)
  return idx >= 0 ? idx : 0
}

function isActiveJob(status: JobStatus): boolean {
  return ['pending', 'accepted', 'confirmed', 'en_route', 'in_progress'].includes(status)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function BookingsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tab, setTab] = useState<typeof ACTIVE_TABS[number]>('active')

  // Toast notification state
  const [toast, setToast] = useState<{ visible: boolean; providerName: string; status: string }>({
    visible: false, providerName: '', status: '',
  })
  const bookingsRef = useRef<Booking[]>([])

  // Track which requests already have reviews
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set())

  // Review modal state
  const [reviewTarget, setReviewTarget] = useState<{ requestId: string; providerId: string; providerName: string } | null>(null)

  const fetchBookings = useCallback(async () => {
    if (!user) return
    const [bookingsRes, reviewsRes] = await Promise.all([
      supabase
        .from('quote_requests')
        .select('id, provider_id, message, status, created_at, confirmed_at, en_route_at, started_at, completed_at, profiles!quote_requests_provider_id_fkey(full_name, avatar_url), services(title)')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('reviews')
        .select('request_id')
        .eq('reviewer_id', user.id),
    ])

    const result = (bookingsRes.data as unknown as Booking[]) ?? []
    bookingsRef.current = result
    setBookings(result)

    const ids = new Set((reviewsRes.data ?? []).map((r: any) => r.request_id))
    setReviewedIds(ids)

    setLoading(false)
    setRefreshing(false)
  }, [user])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // Real-time subscription for status changes
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('booking-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quote_requests', filter: `customer_id=eq.${user.id}` },
        (payload) => {
          const newStatus = payload.new.status as string
          const oldBooking = bookingsRef.current.find(b => b.id === payload.new.id)
          const oldStatus = oldBooking?.status

          // Show toast notification if status actually changed
          if (oldStatus && oldStatus !== newStatus) {
            const providerName = oldBooking?.profiles?.full_name ?? 'Your provider'
            setToast({ visible: true, providerName, status: newStatus })
          }

          // Full refetch to get complete data with joins
          fetchBookings()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchBookings])

  const onRefresh = () => { setRefreshing(true); fetchBookings() }

  const filtered = bookings.filter(b => {
    if (tab === 'active') return isActiveJob(b.status)
    if (tab === 'completed') return ['completed', 'declined', 'cancelled'].includes(b.status)
    return true
  })

  const activeCount = bookings.filter(b => isActiveJob(b.status)).length

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 60 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* In-app notification toast */}
      <StatusToast
        visible={toast.visible}
        providerName={toast.providerName}
        status={toast.status}
        onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      <View style={styles.headerRow}>
        <Text style={styles.title}>My Bookings</Text>
        {activeCount > 0 && (
          <View style={styles.activeCountBadge}>
            <Text style={styles.activeCountText}>{activeCount} active</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {ACTIVE_TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'active' ? 'Active' : t === 'completed' ? 'Past' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        renderItem={({ item }) => {
          const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending
          const stepIdx = getStepIndex(item.status)
          const showTimeline = isActiveJob(item.status)

          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/chat/${item.id}`)}>
              {/* Header row */}
              <View style={styles.cardHeader}>
                <Avatar uri={item.profiles?.avatar_url ?? null} name={item.profiles?.full_name ?? '?'} size={44} />
                <View style={styles.cardInfo}>
                  <Text style={styles.providerName}>{item.profiles?.full_name}</Text>
                  {item.services?.title && <Text style={styles.service}>{item.services.title}</Text>}
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.icon as any} size={12} color={config.text} />
                    <Text style={[styles.statusText, { color: config.text }]}>{config.label}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
                </View>
              </View>

              {/* Message preview */}
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>

              {/* Timeline tracker for active jobs */}
              {showTimeline && (
                <View style={styles.timeline}>
                  {TIMELINE_STEPS.map((step, i) => {
                    const isComplete = i <= stepIdx
                    const isCurrent = i === stepIdx
                    const isLast = i === TIMELINE_STEPS.length - 1

                    return (
                      <View key={step.key} style={styles.timelineStep}>
                        <View style={styles.timelineDotCol}>
                          <View style={[
                            styles.timelineDot,
                            isComplete && styles.timelineDotComplete,
                            isCurrent && styles.timelineDotCurrent,
                          ]}>
                            {isComplete && <Ionicons name="checkmark" size={8} color="#FFFFFF" />}
                          </View>
                          {!isLast && (
                            <View style={[
                              styles.timelineLine,
                              isComplete && i < stepIdx && styles.timelineLineComplete,
                            ]} />
                          )}
                        </View>
                        <Text style={[
                          styles.timelineLabel,
                          isComplete && styles.timelineLabelComplete,
                          isCurrent && styles.timelineLabelCurrent,
                        ]}>
                          {step.label}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              )}

              {/* Completed footer with review button */}
              {item.status === 'completed' && (
                <View style={styles.completedFooter}>
                  <View style={styles.completedRow}>
                    <Ionicons name="checkmark-done-circle" size={14} color="#16A34A" />
                    <Text style={styles.completedText}>
                      Completed {item.completed_at ? new Date(item.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                    </Text>
                  </View>
                  {reviewedIds.has(item.id) ? (
                    <View style={styles.reviewedBadge}>
                      <Ionicons name="star" size={12} color="#D97706" />
                      <Text style={styles.reviewedText}>Reviewed</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.reviewBtn}
                      onPress={(e) => {
                        e.stopPropagation?.()
                        setReviewTarget({
                          requestId: item.id,
                          providerId: item.provider_id,
                          providerName: item.profiles?.full_name ?? 'this provider',
                        })
                      }}
                    >
                      <Ionicons name="star-outline" size={14} color="#2563EB" />
                      <Text style={styles.reviewBtnText}>Leave Review</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name={tab === 'active' ? 'flash-outline' : 'calendar-outline'} size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>
              {tab === 'active' ? 'No active bookings' : tab === 'completed' ? 'No past bookings' : 'No bookings yet'}
            </Text>
            <Text style={styles.emptySubtext}>Find a provider and request a quote to get started</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          visible={!!reviewTarget}
          requestId={reviewTarget.requestId}
          providerId={reviewTarget.providerId}
          providerName={reviewTarget.providerName}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            setReviewTarget(null)
            fetchBookings()
          }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#1E3A8A' },
  activeCountBadge: { backgroundColor: '#DBEAFE', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  activeCountText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF' },
  tabActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#475569' },
  tabTextActive: { color: '#FFFFFF' },
  list: { paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', gap: 12 },
  cardInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: '600', color: '#1E3A8A' },
  service: { fontSize: 13, color: '#2563EB', marginTop: 2 },
  message: { fontSize: 13, color: '#475569', marginTop: 10 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  dateText: { fontSize: 11, color: '#94A3B8' },
  timeline: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E0E7FF' },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDotCol: { alignItems: 'center', height: 20, marginBottom: 4 },
  timelineDot: {
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#E0E7FF',
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  timelineDotComplete: { backgroundColor: '#2563EB' },
  timelineDotCurrent: { backgroundColor: '#2563EB', borderWidth: 2, borderColor: '#93C5FD' },
  timelineLine: {
    position: 'absolute', top: 7, left: 16, right: -16, height: 2, backgroundColor: '#E0E7FF',
    width: '100%',
  },
  timelineLineComplete: { backgroundColor: '#2563EB' },
  timelineLabel: { fontSize: 9, color: '#94A3B8', textAlign: 'center' },
  timelineLabelComplete: { color: '#2563EB' },
  timelineLabelCurrent: { color: '#2563EB', fontWeight: '700' },
  completedFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0E7FF' },
  completedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  completedText: { fontSize: 13, color: '#16A34A', fontWeight: '500' },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  reviewBtnText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  reviewedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  reviewedText: { fontSize: 12, fontWeight: '600', color: '#D97706' },
  empty: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#475569' },
  emptySubtext: { fontSize: 14, color: '#94A3B8' },
})
