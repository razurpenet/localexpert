import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'

const TABS = ['Active', 'Pending', 'Completed', 'All'] as const
type Tab = typeof TABS[number]

type JobStatus = 'pending' | 'accepted' | 'declined' | 'confirmed' | 'en_route' | 'in_progress' | 'completed' | 'cancelled'

interface Request {
  id: string
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
  pending:     { bg: '#FEF3C7', text: '#D97706', icon: 'time-outline',          label: 'Pending' },
  accepted:    { bg: '#DCFCE7', text: '#16A34A', icon: 'checkmark-circle',      label: 'Accepted' },
  confirmed:   { bg: '#DBEAFE', text: '#1E40AF', icon: 'calendar',              label: 'Confirmed' },
  en_route:    { bg: '#E0E7FF', text: '#4F46E5', icon: 'navigate',              label: 'En Route' },
  in_progress: { bg: '#FEF3C7', text: '#D97706', icon: 'construct',             label: 'In Progress' },
  completed:   { bg: '#DCFCE7', text: '#16A34A', icon: 'checkmark-done-circle', label: 'Completed' },
  declined:    { bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle',          label: 'Declined' },
  cancelled:   { bg: '#E0E7FF', text: '#475569', icon: 'ban',                   label: 'Cancelled' },
}

// The next action the provider can take for each status
const NEXT_ACTIONS: Record<string, { status: JobStatus; label: string; icon: string; bg: string; text: string; timestampField?: string }[]> = {
  pending:     [
    { status: 'accepted', label: 'Accept', icon: 'checkmark', bg: '#F97316', text: '#FFFFFF' },
    { status: 'declined', label: 'Decline', icon: 'close', bg: '#FEE2E2', text: '#DC2626' },
  ],
  accepted:    [
    { status: 'confirmed', label: 'Confirm Job', icon: 'calendar', bg: '#F97316', text: '#FFFFFF', timestampField: 'confirmed_at' },
  ],
  confirmed:   [
    { status: 'en_route', label: 'On My Way', icon: 'navigate', bg: '#E0E7FF', text: '#4F46E5', timestampField: 'en_route_at' },
  ],
  en_route:    [
    { status: 'in_progress', label: 'Start Job', icon: 'construct', bg: '#FEF3C7', text: '#D97706', timestampField: 'started_at' },
  ],
  in_progress: [
    { status: 'completed', label: 'Complete Job', icon: 'checkmark-done', bg: '#DCFCE7', text: '#16A34A', timestampField: 'completed_at' },
  ],
}

function isActiveJob(status: string): boolean {
  return ['pending', 'accepted', 'confirmed', 'en_route', 'in_progress'].includes(status)
}

export default function RequestsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('Active')

  const fetchRequests = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('quote_requests')
      .select('id, message, status, created_at, confirmed_at, en_route_at, started_at, completed_at, profiles!quote_requests_customer_id_fkey(full_name, avatar_url), services(title)')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })

    setRequests((data as unknown as Request[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  // Real-time updates
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('provider-requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quote_requests', filter: `provider_id=eq.${user.id}` },
        () => fetchRequests()
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [user, fetchRequests])

  async function updateStatus(id: string, status: JobStatus, timestampField?: string) {
    const updateData: any = { status }
    if (timestampField) {
      updateData[timestampField] = new Date().toISOString()
    }

    const { data, error, count } = await supabase
      .from('quote_requests')
      .update(updateData)
      .eq('id', id)
      .select()

    console.log('[updateStatus]', { id, status, data, error, count })

    if (error) {
      const msg = `Update failed: ${error.message} (${error.code})`
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Error', msg)
      return
    }

    if (!data || data.length === 0) {
      const msg = 'Update had no effect — you may not have permission to update this request.'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Error', msg)
      return
    }

    fetchRequests()
  }

  function confirmAction(id: string, status: JobStatus, label: string, timestampField?: string) {
    if (Platform.OS === 'web') {
      if (window.confirm(`${label}?`)) updateStatus(id, status, timestampField)
    } else {
      Alert.alert(label, `Are you sure?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: label, onPress: () => updateStatus(id, status, timestampField) },
      ])
    }
  }

  const filtered = requests.filter(r => {
    if (tab === 'Active') return isActiveJob(r.status)
    if (tab === 'Pending') return r.status === 'pending'
    if (tab === 'Completed') return ['completed', 'declined', 'cancelled'].includes(r.status)
    return true
  })

  const activeCount = requests.filter(r => isActiveJob(r.status)).length
  const pendingCount = requests.filter(r => r.status === 'pending').length

  if (loading) {
    return <SafeAreaView style={styles.safe} edges={['top']}><ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 60 }} /></SafeAreaView>
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Requests</Text>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount} new</Text>
          </View>
        )}
      </View>

      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t}{t === 'Active' && activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        onRefresh={fetchRequests}
        refreshing={loading}
        renderItem={({ item }) => {
          const config = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.pending
          const actions = NEXT_ACTIONS[item.status] ?? []

          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/chat/${item.id}`)}>
              {/* Status indicator strip */}
              <View style={[styles.statusStrip, { backgroundColor: config.bg }]}>
                <View style={[styles.statusDot, { backgroundColor: config.text }]} />
                <Text style={[styles.statusStripText, { color: config.text }]}>{config.label}</Text>
              </View>

              <View style={styles.cardRow}>
                <Avatar uri={item.profiles?.avatar_url ?? null} name={item.profiles?.full_name ?? '?'} size={44} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.profiles?.full_name}</Text>
                  {item.services?.title && <Text style={styles.cardService}>{item.services.title}</Text>}
                  <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
                  <Text style={styles.cardDate}>
                    {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <TouchableOpacity style={styles.chatBtn} onPress={() => router.push(`/chat/${item.id}`)}>
                  <Ionicons name="chatbubble-outline" size={20} color="#1E40AF" />
                </TouchableOpacity>
              </View>

              {/* Action buttons */}
              {actions.length > 0 && (
                <View style={styles.actions}>
                  {actions.map(action => (
                    <TouchableOpacity
                      key={action.status}
                      style={[styles.actionBtn, { backgroundColor: action.bg }]}
                      onPress={() => confirmAction(item.id, action.status, action.label, action.timestampField)}
                    >
                      <Ionicons name={action.icon as any} size={16} color={action.text} />
                      <Text style={[styles.actionText, { color: action.text }]}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mail-open-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No {tab.toLowerCase()} requests</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '700', color: '#1E3A8A' },
  pendingBadge: { backgroundColor: '#FEF3C7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pendingBadgeText: { fontSize: 13, fontWeight: '600', color: '#D97706' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF' },
  tabActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  tabTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', marginBottom: 12,
    borderWidth: 1, borderColor: '#E0E7FF',
    shadowColor: '#1E40AF', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1,
  },
  statusStrip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 9999, paddingHorizontal: 16, paddingVertical: 8 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusStripText: { fontSize: 12, fontWeight: '700' },
  cardRow: { flexDirection: 'row', gap: 12, padding: 16, paddingTop: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#1E3A8A' },
  cardService: { fontSize: 13, color: '#1E40AF', marginTop: 2 },
  cardMessage: { fontSize: 13, color: '#475569', marginTop: 4 },
  cardDate: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  chatBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 12 },
  actionText: { fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#94A3B8' },
})
