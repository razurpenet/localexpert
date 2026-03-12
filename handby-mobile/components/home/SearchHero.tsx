import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export function SearchHero() {
  const router = useRouter()

  return (
    <LinearGradient colors={['#1E293B', '#334155']} style={styles.container}>
      <Text style={styles.title}>What do you need{'\n'}help with?</Text>
      <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(customer)/search')}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <Text style={styles.placeholder}>Search for services...</Text>
      </TouchableOpacity>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', lineHeight: 30, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  placeholder: { fontSize: 16, color: '#94A3B8' },
})
