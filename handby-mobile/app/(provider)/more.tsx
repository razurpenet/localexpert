import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { colors, radius, shadow } from '../../lib/theme'

export default function MoreScreen() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [citizenshipStatus, setCitizenshipStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('provider_details').select('citizenship_status').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) setCitizenshipStatus(data.citizenship_status ?? null)
      })
  }, [user])

  const needsRtw = citizenshipStatus != null && citizenshipStatus !== 'uk_irish'

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

        <TouchableOpacity style={styles.card} onPress={() => router.push('/(provider)/edit-profile')}>
          <Avatar uri={profile?.avatar_url ?? null} name={profile?.full_name ?? '?'} size={56} />
          <View style={styles.info}>
            <Text style={styles.name}>{profile?.full_name}</Text>
            {profile?.city && <Text style={styles.city}>{profile.city}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Business Tools */}
        <Text style={styles.sectionLabel}>Business Tools</Text>
        <View style={styles.menu}>
          <MenuItem icon="briefcase-outline" label="Manage Services" onPress={() => router.push('/(provider)/manage-services')} />
          <MenuItem icon="cash-outline" label="Earnings" onPress={() => router.push('/(provider)/earnings')} />
          <MenuItem icon="calendar-outline" label="Appointments" onPress={() => router.push('/(provider)/appointments')} />
          <MenuItem icon="document-text-outline" label="Quotes" onPress={() => router.push('/(provider)/quotes-list')} />
          <MenuItem icon="camera-outline" label="Job Photos" onPress={() => router.push('/(provider)/job-photos')} last />
        </View>

        {/* Verification & Compliance */}
        <Text style={styles.sectionLabel}>Verification & Compliance</Text>
        <View style={styles.menu}>
          <MenuItem icon="ribbon-outline" label="Credentials" onPress={() => router.push('/(provider)/credentials')} last={!needsRtw} />
          {needsRtw && (
            <MenuItem icon="document-text-outline" label="Right to Work" onPress={() => router.push('/(provider)/rtw-verification')} last />
          )}
        </View>

        {/* Account & Support */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.menu}>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/(provider)/edit-profile')} />
          <MenuItem icon="notifications-outline" label="Notifications" />
          <MenuItem icon="help-circle-outline" label="Help & Support" />
          <MenuItem icon="document-text-outline" label="Terms of Service" onPress={() => Linking.openURL('https://handby.uk/terms')} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => Linking.openURL('https://handby.uk/privacy')} last />
        </View>

        <TouchableOpacity style={styles.signOut} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Handby v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  )
}

function MenuItem({ icon, label, onPress, last }: { icon: string; label: string; onPress?: () => void; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.menuItem, last && styles.menuItemLast]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Ionicons name={icon as any} size={22} color={colors.textBody} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryBg },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20,
    marginHorizontal: 16, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  city: { fontSize: 14, color: colors.textBody, marginTop: 2 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted, paddingHorizontal: 16, marginTop: 20, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  menu: { marginHorizontal: 16, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.surface, paddingVertical: 16, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLabel: { flex: 1, fontSize: 16, color: colors.textPrimary },
  signOut: {
    flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center',
    marginTop: 32, paddingVertical: 16,
  },
  signOutText: { fontSize: 16, fontWeight: '600', color: colors.error },
  version: { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 8, marginBottom: 32 },
})
