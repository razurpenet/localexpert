import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'

interface FavItem {
  id: string
  provider_id: string
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
    city: string | null
    provider_details: {
      business_name: string
      avg_rating: number
      review_count: number
    } | null
  }
}

export default function FavouritesScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [favs, setFavs] = useState<FavItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFavs = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('favourites')
      .select('id, provider_id, profiles!favourites_provider_id_fkey(id, full_name, avatar_url, city, provider_details(business_name, avg_rating, review_count))')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
    setFavs((data as unknown as FavItem[]) ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchFavs() }, [fetchFavs])

  async function removeFav(id: string) {
    const doRemove = async () => {
      await supabase.from('favourites').delete().eq('id', id)
      fetchFavs()
    }

    if (Platform.OS === 'web') {
      if (window.confirm('Remove from favourites?')) doRemove()
    } else {
      Alert.alert('Remove', 'Remove from favourites?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doRemove },
      ])
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
        <Text style={styles.title}>Favourites</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={favs}
        keyExtractor={item => item.id}
        onRefresh={fetchFavs}
        refreshing={loading}
        renderItem={({ item }) => {
          const p = item.profiles
          const d = p?.provider_details
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/provider/${item.provider_id}`)}>
              <Avatar uri={p?.avatar_url ?? null} name={p?.full_name ?? '?'} size={52} />
              <View style={styles.info}>
                <Text style={styles.name}>{d?.business_name || p?.full_name}</Text>
                {p?.city && <Text style={styles.city}>{p.city}</Text>}
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FACC15" />
                  <Text style={styles.rating}>{(d?.avg_rating ?? 0).toFixed(1)}</Text>
                  <Text style={styles.reviews}>({d?.review_count ?? 0})</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => removeFav(item.id)}>
                <Ionicons name="heart" size={24} color="#EF4444" />
              </TouchableOpacity>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No favourites yet</Text>
            <Text style={styles.emptySubtext}>Browse providers to save your favourites</Text>
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
  title: { fontSize: 20, fontWeight: '700', color: '#1E3A8A' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#1E3A8A' },
  city: { fontSize: 13, color: '#475569', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  rating: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
  reviews: { fontSize: 12, color: '#475569' },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#475569' },
  emptySubtext: { fontSize: 14, color: '#94A3B8' },
})
