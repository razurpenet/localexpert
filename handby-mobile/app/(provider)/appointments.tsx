import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'

const TABS = ['Upcoming', 'Completed', 'Cancelled'] as const

interface AppointmentItem {
  id: string
  request_id: string
  date: string
  time_slot: string
  notes: string | null
  status: string
  profiles: { full_name: string; avatar_url: string | null }
}

export default function AppointmentsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [appts, setAppts] = useState<AppointmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<typeof TABS[number]>('Upcoming')

  const fetchAppts = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('appointments')
      .select('id, request_id, date, time_slot, notes, status, profiles!appointments_customer_id_fkey(full_name, avatar_url)')
      .eq('provider_id', user.id)
      .order('date', { ascending: true })
    setAppts((data as unknown as AppointmentItem[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchAppts() }, [fetchAppts])

  async function updateStatus(id: string, status: string) {
    await supabase.from('appointments').update({ status }).eq('id', id)
    fetchAppts()
  }

  function confirmStatus(id: string, status: string, label: string) {
    if (Platform.OS === 'web') {
      if (window.confirm(`${label} this appointment?`)) updateStatus(id, status)
    } else {
      Alert.alert(label, `${label} this appointment?`, [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => updateStatus(id, status) },
      ])
    }
  }

  const filtered = appts.filter(a => {
    if (tab === 'Upcoming') return a.status === 'scheduled'
    if (tab === 'Completed') return a.status === 'completed'
    return a.status === 'cancelled'
  })

  const statusColor = (s: string) => {
    switch (s) {
      case 'scheduled': return { bg: '#DBEAFE', text: '#1E40AF' }
      case 'completed': return { bg: '#DCFCE7', text: '#16A34A' }
      case 'cancelled': return { bg: '#FEE2E2', text: '#DC2626' }
      default: return { bg: '#E0E7FF', text: '#475569' }
    }
  }

  if (loading) {
    return <SafeAreaView style={styles.safe} edges={['top']}><ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 60 }} /></SafeAreaView>
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointments</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        onRefresh={fetchAppts}
        refreshing={loading}
        renderItem={({ item }) => {
          const colors = statusColor(item.status)
          return (
            <View style={styles.card}>
              <View style={styles.cardRow}>
                <Avatar uri={item.profiles?.avatar_url ?? null} name={item.profiles?.full_name ?? '?'} size={44} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.profiles?.full_name}</Text>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={14} color="#475569" />
                    <Text style={styles.cardDate}>{new Date(item.date).toLocaleDateString()}</Text>
                    <Ionicons name="time-outline" size={14} color="#475569" />
                    <Text style={styles.cardDate}>{item.time_slot}</Text>
                  </View>
                  {item.notes && <Text style={styles.cardNotes} numberOfLines={1}>{item.notes}</Text>}
                </View>
                <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              </View>
              {item.status === 'scheduled' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={styles.completeBtn} onPress={() => confirmStatus(item.id, 'completed', 'Complete')}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
                    <Text style={styles.completeText}>Complete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmStatus(item.id, 'cancelled', 'Cancel')}>
                    <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No {tab.toLowerCase()} appointments</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E3A8A' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF' },
  tabActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  tabTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#1E40AF', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1 },
  cardRow: { flexDirection: 'row', gap: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#1E3A8A' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  cardDate: { fontSize: 13, color: '#475569' },
  cardNotes: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E0E7FF' },
  completeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#DCFCE7', borderRadius: 10, paddingVertical: 10 },
  completeText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
  cancelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#FEE2E2', borderRadius: 10, paddingVertical: 10 },
  cancelText: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#94A3B8' },
})
