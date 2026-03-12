import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface FilterChipsProps {
  activeFilter: string | null
  onSelect: (filter: string | null) => void
}

const FILTERS = [
  { key: 'available', label: 'Available now', icon: 'flash' as const },
  { key: 'rating', label: 'Highest rated', icon: 'star' as const },
  { key: 'fastest', label: 'Fast response', icon: 'time' as const },
  { key: 'verified', label: 'Verified', icon: 'shield-checkmark' as const },
  { key: 'price', label: 'Price', icon: 'pricetag' as const },
  { key: 'top_rated', label: 'Top Pros', icon: 'trophy' as const },
]

export function FilterChips({ activeFilter, onSelect }: FilterChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {FILTERS.map(f => {
        const active = activeFilter === f.key
        return (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(active ? null : f.key)}
          >
            <Ionicons name={f.icon} size={14} color={active ? '#FFFFFF' : '#475569'} />
            <Text style={[styles.label, active && styles.labelActive]}>{f.label}</Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF',
  },
  chipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  label: { fontSize: 13, fontWeight: '500', color: '#475569' },
  labelActive: { color: '#FFFFFF' },
})
