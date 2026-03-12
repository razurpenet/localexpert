import { useEffect, useState, useCallback } from 'react'
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { colors, radius, shadow } from '../../lib/theme'

interface CompletedJob {
  id: string
  quoted_price: number | null
  completed_at: string
  profiles: { full_name: string } | null
  services: { title: string } | null
}

function getWeekStart(weeksAgo: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() - weeksAgo * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function EarningsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [monthEarnings, setMonthEarnings] = useState(0)
  const [monthJobs, setMonthJobs] = useState(0)
  const [responseRate, setResponseRate] = useState(0)
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0])
  const [recentJobs, setRecentJobs] = useState<CompletedJob[]>([])

  const fetchEarnings = useCallback(async () => {
    if (!user) return

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [completedRes, allRequestsRes, recentRes] = await Promise.all([
      supabase
        .from('quote_requests')
        .select('id, quoted_price, completed_at')
        .eq('provider_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', monthStart),
      supabase
        .from('quote_requests')
        .select('id, status')
        .eq('provider_id', user.id),
      supabase
        .from('quote_requests')
        .select('id, quoted_price, completed_at, profiles!quote_requests_customer_id_fkey(full_name), services(title)')
        .eq('provider_id', user.id)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10),
    ])

    const completedJobs = completedRes.data ?? []
    const total = completedJobs.reduce((sum, j) => sum + (j.quoted_price ?? 0), 0)
    setMonthEarnings(total)
    setMonthJobs(completedJobs.length)

    const allReqs = allRequestsRes.data ?? []
    const responded = allReqs.filter(r => ['accepted', 'declined', 'confirmed', 'en_route', 'in_progress', 'completed'].includes(r.status)).length
    const totalReqs = allReqs.length
    setResponseRate(totalReqs > 0 ? Math.round((responded / totalReqs) * 100) : 0)

    const weeks = [0, 0, 0, 0]
    const fourWeeksAgo = getWeekStart(3)

    const { data: weeklyJobs } = await supabase
      .from('quote_requests')
      .select('quoted_price, completed_at')
      .eq('provider_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', fourWeeksAgo.toISOString())

    ;(weeklyJobs ?? []).forEach(j => {
      if (!j.completed_at) return
      const jobDate = new Date(j.completed_at)
      const diffDays = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24))
      const weekIdx = Math.min(3, Math.floor(diffDays / 7))
      weeks[3 - weekIdx] += j.quoted_price ?? 0
    })
    setWeeklyData(weeks)

    setRecentJobs((recentRes.data as unknown as CompletedJob[]) ?? [])

    setLoading(false)
    setRefreshing(false)
  }, [user])

  useEffect(() => { fetchEarnings() }, [fetchEarnings])

  const onRefresh = () => { setRefreshing(true); fetchEarnings() }
  const maxWeekly = Math.max(...weeklyData, 1)

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
        <Text style={styles.title}>Earnings</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={22} color={colors.success} />
            <Text style={styles.statValue}>{'\u00A3'}{monthEarnings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.statValue}>{monthJobs}</Text>
            <Text style={styles.statLabel}>Jobs</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="speedometer-outline" size={22} color={colors.warning} />
            <Text style={styles.statValue}>{responseRate}%</Text>
            <Text style={styles.statLabel}>Response</Text>
          </View>
        </View>

        {/* Weekly chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Earnings</Text>
          <View style={styles.chartBars}>
            {weeklyData.map((val, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${(val / maxWeekly) * 100}%` }]} />
                </View>
                <Text style={styles.barLabel}>
                  {i === 3 ? 'This\nWeek' : `W${i + 1}`}
                </Text>
                {val > 0 && <Text style={styles.barValue}>{'\u00A3'}{val.toFixed(0)}</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Recent completed jobs */}
        <Text style={styles.sectionTitle}>Recent Jobs</Text>
        {recentJobs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No completed jobs yet</Text>
          </View>
        ) : (
          recentJobs.map(job => (
            <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => router.push(`/chat/${job.id}`)}>
              <View style={styles.jobInfo}>
                <Text style={styles.jobName}>{(job.profiles as any)?.full_name ?? 'Customer'}</Text>
                <Text style={styles.jobService}>{(job.services as any)?.title ?? 'Service'}</Text>
                <Text style={styles.jobDate}>
                  {job.completed_at ? new Date(job.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                </Text>
              </View>
              {job.quoted_price != null && (
                <Text style={styles.jobPrice}>{'\u00A3'}{job.quoted_price.toFixed(2)}</Text>
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryBg },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textBody },
  chartCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20,
    marginHorizontal: 16, marginTop: 20,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  chartTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 },
  barCol: { alignItems: 'center', flex: 1 },
  barTrack: { width: 32, height: 100, backgroundColor: colors.border, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: colors.primary, borderRadius: 6 },
  barLabel: { fontSize: 10, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  barValue: { fontSize: 10, fontWeight: '600', color: colors.primary, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  jobCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 14,
    marginHorizontal: 16, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  jobInfo: { flex: 1 },
  jobName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  jobService: { fontSize: 13, color: colors.textBody, marginTop: 2 },
  jobDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  jobPrice: { fontSize: 16, fontWeight: '700', color: colors.success },
  empty: { alignItems: 'center', marginTop: 32, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
})
