import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../ui/Avatar'
import { Ionicons } from '@expo/vector-icons'

interface Provider {
  id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  provider_details: {
    business_name: string
    is_available: boolean
    avg_rating: number
    review_count: number
  } | null
}

export function NearbyPros() {
  const router = useRouter()
  const [providers, setProviders] = useState<Provider[]>([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, city, provider_details(business_name, is_available, avg_rating, review_count)')
      .eq('role', 'provider')
      .eq('provider_details.is_available', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setProviders(data.map(p => ({
            ...p,
            provider_details: Array.isArray(p.provider_details) ? p.provider_details[0] : p.provider_details,
          })).filter(p => p.provider_details) as Provider[])
      })
  }, [])

  if (providers.length === 0) return null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Professionals</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {providers.map((p) => (
          <TouchableOpacity key={p.id} style={styles.card} onPress={() => router.push(`/provider/${p.id}`)}>
            <Avatar uri={p.avatar_url} name={p.full_name} size={56} />
            <Text style={styles.name} numberOfLines={1}>
              {p.provider_details?.business_name || p.full_name}
            </Text>
            {p.city && <Text style={styles.city}>{p.city}</Text>}
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FACC15" />
              <Text style={styles.rating}>
                {(p.provider_details?.avg_rating ?? 0).toFixed(1)}
              </Text>
              <Text style={styles.reviews}>({p.provider_details?.review_count ?? 0})</Text>
            </View>
            {p.provider_details?.is_available && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Available</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginTop: 24, paddingHorizontal: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1E3A8A', marginBottom: 16 },
  list: { gap: 12, paddingRight: 16 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, width: 150,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 2,
  },
  name: { fontSize: 14, fontWeight: '600', color: '#1E3A8A', marginTop: 10, textAlign: 'center' },
  city: { fontSize: 12, color: '#475569', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  rating: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
  reviews: { fontSize: 12, color: '#475569' },
  badge: { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8 },
  badgeText: { color: '#16A34A', fontSize: 11, fontWeight: '600' },
})
