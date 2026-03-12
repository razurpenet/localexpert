import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth-context'
import { Avatar } from '../../components/ui/Avatar'

export default function MoreScreen() {
  const { profile, signOut } = useAuth()
  const router = useRouter()

  async function doSignOut() {
    await signOut()
    router.replace('/(auth)/welcome')
  }

  function handleSignOut() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        doSignOut()
      }
    } else {
      Alert.alert('Sign out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign out', style: 'destructive', onPress: doSignOut },
      ])
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.card}>
          <Avatar uri={profile?.avatar_url ?? null} name={profile?.full_name ?? '?'} size={56} />
          <View style={styles.info}>
            <Text style={styles.name}>{profile?.full_name}</Text>
            {profile?.city && <Text style={styles.city}>{profile.city}</Text>}
          </View>
        </View>

        <View style={styles.menu}>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/(provider)/edit-profile')} />
          <MenuItem icon="briefcase-outline" label="Manage Services" onPress={() => router.push('/(provider)/manage-services')} />
          <MenuItem icon="calendar-outline" label="Appointments" onPress={() => router.push('/(provider)/appointments')} />
          <MenuItem icon="document-text-outline" label="Quotes" onPress={() => router.push('/(provider)/quotes-list')} />
          <MenuItem icon="camera-outline" label="Job Photos" onPress={() => router.push('/(provider)/job-photos')} />
          <MenuItem icon="ribbon-outline" label="Credentials" onPress={() => router.push('/(provider)/credentials')} />
          <MenuItem icon="clipboard-outline" label="Requests" onPress={() => router.push('/(provider)/requests')} />
          <MenuItem icon="notifications-outline" label="Notifications" />
          <MenuItem icon="help-circle-outline" label="Help & Support" />
          <MenuItem icon="document-text-outline" label="Terms of Service" />
          <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" />
        </View>

        <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Handby v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Ionicons name={icon as any} size={22} color="#475569" />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  title: { fontSize: 24, fontWeight: '700', color: '#1E3A8A', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  card: {
    flexDirection: 'row', gap: 16, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    marginHorizontal: 16, marginBottom: 24,
    shadowColor: '#1E40AF', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1,
  },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: '#1E3A8A' },
  city: { fontSize: 14, color: '#475569', marginTop: 2 },
  menu: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', paddingVertical: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#E0E7FF',
  },
  menuLabel: { flex: 1, fontSize: 16, color: '#1E3A8A' },
  signOut: {
    flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center',
    marginTop: 32, paddingVertical: 16,
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 12, color: '#94A3B8', marginTop: 8, marginBottom: 32 },
})
