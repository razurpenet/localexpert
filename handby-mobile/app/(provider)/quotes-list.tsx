import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'

const TABS = ['All', 'Draft', 'Sent', 'Accepted'] as const

interface QuoteItem {
  id: string
  request_id: string
  total: number
  status: string
  items: any[]
  notes: string | null
  created_at: string
  profiles: { full_name: string; avatar_url: string | null }
}

export default function QuotesListScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [quotes, setQuotes] = useState<QuoteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<typeof TABS[number]>('All')

  const fetchQuotes = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('quotes')
      .select('id, request_id, total, status, items, notes, created_at, profiles!quotes_customer_id_fkey(full_name, avatar_url)')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
    setQuotes((data as unknown as QuoteItem[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchQuotes() }, [fetchQuotes])

  const filtered = tab === 'All' ? quotes : quotes.filter(q => q.status === tab.toLowerCase())

  const statusColor = (s: string) => {
    switch (s) {
      case 'draft': return { bg: '#E0E7FF', text: '#475569' }
      case 'sent': return { bg: '#FEF3C7', text: '#D97706' }
      case 'accepted': return { bg: '#DCFCE7', text: '#16A34A' }
      case 'rejected': return { bg: '#FEE2E2', text: '#DC2626' }
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
        <Text style={styles.headerTitle}>Quotes</Text>
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
        onRefresh={fetchQuotes}
        refreshing={loading}
        renderItem={({ item }) => {
          const colors = statusColor(item.status)
          const itemCount = Array.isArray(item.items) ? item.items.length : 0
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/chat/${item.request_id}`)}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.profiles?.full_name}</Text>
                  <Text style={styles.cardMeta}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
                  <Text style={styles.cardDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardTotal}>£{item.total?.toFixed(2) ?? '0.00'}</Text>
                  <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No quotes yet</Text>
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between' },
  cardName: { fontSize: 15, fontWeight: '600', color: '#1E3A8A' },
  cardMeta: { fontSize: 13, color: '#475569', marginTop: 2 },
  cardDate: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardTotal: { fontSize: 18, fontWeight: '700', color: '#1E3A8A' },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 16, color: '#94A3B8' },
})
