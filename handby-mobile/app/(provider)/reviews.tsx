import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'

interface ReviewItem {
  id: string
  rating: number
  body: string | null
  created_at: string
  profiles: { full_name: string; avatar_url: string | null }
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 60 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Reviews</Text>
      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReviews() }} tintColor="#1E40AF" />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Avatar uri={item.profiles?.avatar_url ?? null} name={item.profiles?.full_name ?? '?'} size={40} />
              <View style={styles.headerInfo}>
                <Text style={styles.reviewer}>{item.profiles?.full_name}</Text>
                <View style={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name={i < item.rating ? 'star' : 'star-outline'} size={16} color="#FACC15" />
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
            <Ionicons name="star-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  title: { fontSize: 24, fontWeight: '700', color: '#1E3A8A', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  list: { paddingBottom: 32 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: '#E0E7FF',
    shadowColor: '#1E40AF', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerInfo: { flex: 1 },
  reviewer: { fontSize: 15, fontWeight: '600', color: '#1E3A8A' },
  stars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  date: { fontSize: 12, color: '#94A3B8' },
  body: { fontSize: 14, color: '#4B5563', marginTop: 12, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: '#94A3B8' },
})
