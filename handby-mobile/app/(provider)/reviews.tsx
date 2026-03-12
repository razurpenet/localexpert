import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { colors, radius, shadow } from '../../lib/theme'

interface ReviewItem {
  id: string
  rating: number
  body: string | null
  created_at: string
  profiles: { full_name: string; avatar_url: string | null }
}

function RatingSummary({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) return null

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const counts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }))

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryAvg}>{avg.toFixed(1)}</Text>
          <View style={styles.summaryStars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons key={i} name={i < Math.round(avg) ? 'star' : 'star-outline'} size={18} color={colors.star} />
            ))}
          </View>
          <Text style={styles.summaryCount}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.summaryBars}>
          {counts.map(({ star, count }) => (
            <View key={star} style={styles.barRow}>
              <Text style={styles.barLabel}>{star}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(count / reviews.length) * 100}%` }]} />
              </View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

export default function ReviewsScreen() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchReviews = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, body, created_at, profiles!reviews_reviewer_id_fkey(full_name, avatar_url)')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })

    setReviews((data as unknown as ReviewItem[]) ?? [])
    setLoading(false)
    setRefreshing(false)
  }, [user])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  // Real-time: new reviews appear instantly
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('reviews-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reviews',
        filter: `provider_id=eq.${user.id}`,
      }, () => { fetchReviews() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchReviews])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Reviews</Text>
      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReviews() }} tintColor={colors.primary} />}
        ListHeaderComponent={<RatingSummary reviews={reviews} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Avatar uri={item.profiles?.avatar_url ?? null} name={item.profiles?.full_name ?? '?'} size={40} />
              <View style={styles.headerInfo}>
                <Text style={styles.reviewer}>{item.profiles?.full_name}</Text>
                <View style={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name={i < item.rating ? 'star' : 'star-outline'} size={16} color={colors.star} />
                  ))}
                </View>
              </View>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('en-GB')}</Text>
            </View>
            {item.body && <Text style={styles.body}>{item.body}</Text>}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryBg },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  list: { paddingBottom: 32 },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20,
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  summaryTop: { flexDirection: 'row', gap: 20 },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  summaryAvg: { fontSize: 36, fontWeight: '700', color: colors.textPrimary },
  summaryStars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  summaryCount: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  summaryBars: { flex: 1, gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { fontSize: 12, color: colors.textBody, width: 12, textAlign: 'right' },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: colors.star, borderRadius: 4 },
  barCount: { fontSize: 12, color: colors.textMuted, width: 20 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerInfo: { flex: 1 },
  reviewer: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  stars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  date: { fontSize: 12, color: colors.textMuted },
  body: { fontSize: 14, color: '#4B5563', marginTop: 12, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: colors.textMuted },
})
