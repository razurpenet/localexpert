import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const CATEGORIES = [
  { slug: 'plumbing', name: 'Plumbing', icon: 'construct' as const, color: '#3B82F6' },
  { slug: 'electrical', name: 'Electrical', icon: 'flash' as const, color: '#F59E0B' },
  { slug: 'cleaning', name: 'Cleaning', icon: 'sparkles' as const, color: '#10B981' },
  { slug: 'painting', name: 'Painting', icon: 'color-palette' as const, color: '#8B5CF6' },
  { slug: 'gardening', name: 'Gardening', icon: 'leaf' as const, color: '#22C55E' },
  { slug: 'carpentry', name: 'Carpentry', icon: 'hammer' as const, color: '#92400E' },
  { slug: 'locksmith', name: 'Locksmith', icon: 'key' as const, color: '#6366F1' },
  { slug: 'moving-removals', name: 'Moving', icon: 'car' as const, color: '#0EA5E9' },
  { slug: 'pet-care', name: 'Pet Care', icon: 'paw' as const, color: '#F97316' },
  { slug: 'pest-control', name: 'Pest Control', icon: 'bug' as const, color: '#EF4444' },
]

export function CategoryGrid() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Popular Categories</Text>
        <TouchableOpacity onPress={() => router.push('/(customer)/search')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.slug} style={styles.item} onPress={() => router.push({ pathname: '/(customer)/search', params: { category: cat.slug } })}>
            <View style={[styles.iconCircle, { backgroundColor: cat.color + '15' }]}>
              <Ionicons name={cat.icon} size={28} color={cat.color} />
            </View>
            <Text style={styles.label}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginTop: 24, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1E3A8A' },
  seeAll: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  grid: { gap: 16, paddingRight: 16 },
  item: { alignItems: 'center', width: 72 },
  iconCircle: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  label: { fontSize: 12, color: '#475569', textAlign: 'center', fontWeight: '500' },
})
