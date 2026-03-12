import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { SearchHero } from '../../components/home/SearchHero'
import { CategoryGrid } from '../../components/home/CategoryGrid'
import { NearbyPros } from '../../components/home/NearbyPros'
import { JoinProBanner } from '../../components/provider/JoinProBanner'

export default function CustomerHome() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {firstName}</Text>
            {profile?.city && (
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="#475569" />
                <Text style={styles.location}>{profile.city}</Text>
              </View>
            )}
          </View>
          <Ionicons name="notifications-outline" size={24} color="#1E3A8A" />
        </View>

        <SearchHero />
        <CategoryGrid />
        <NearbyPros />
        <JoinProBanner />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  scroll: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: '#1E3A8A' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  location: { fontSize: 13, color: '#475569' },
})
