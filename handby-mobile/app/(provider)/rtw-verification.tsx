import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { colors, radius, shadow } from '../../lib/theme'

type RtwStatus = 'pending' | 'verified' | 'rejected' | 'expired'

interface RtwCheck {
  id: string
  share_code: string
  status: RtwStatus
  verified_at: string | null
  expires_at: string | null
  reviewer_notes: string | null
  created_at: string
}

const STATUS_CONFIG: Record<RtwStatus, { bg: string; text: string; icon: string; label: string }> = {
  pending:  { bg: '#FEF3C7', text: '#D97706', icon: 'time-outline', label: 'Pending Review' },
  verified: { bg: '#DCFCE7', text: '#16A34A', icon: 'shield-checkmark', label: 'Verified' },
  rejected: { bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle', label: 'Rejected' },
  expired:  { bg: '#F1F5F9', text: '#475569', icon: 'alert-circle', label: 'Expired' },
}

export default function RtwVerificationScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [existing, setExisting] = useState<RtwCheck | null>(null)
  const [shareCode, setShareCode] = useState('')
  const [dob, setDob] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('rtw_checks')
      .select('*')
      .eq('provider_id', user.id)
      .in('status', ['pending', 'verified'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setExisting(data as RtwCheck)
        setLoading(false)
      })
  }, [user])

  async function handleSubmit() {
    if (!shareCode.trim() || !dob.trim() || !user) return

    const code = shareCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{9}$/.test(code)) {
      const msg = 'Share code must be 9 characters (letters and numbers)'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Invalid', msg)
      return
    }

    const dobRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dobRegex.test(dob.trim())) {
      const msg = 'Date of birth must be in YYYY-MM-DD format'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Invalid', msg)
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('rtw_checks').insert({
      provider_id: user.id,
      share_code: code,
      date_of_birth: dob.trim(),
      status: 'pending',
    })
    setSubmitting(false)

    if (error) {
      const msg = error.message.includes('unique')
        ? 'You already have an active verification request.'
        : error.message
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Error', msg)
      return
    }

    if (Platform.OS === 'web') window.alert('Submitted! We will verify your Right to Work status.')
    else Alert.alert('Submitted', 'We will verify your Right to Work status.')
    router.back()
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textMuted }}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Right to Work</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            UK law requires platforms to verify your Right to Work. Submit your Home Office Share Code and we'll verify it within 24 hours. Your data is kept secure and confidential.
          </Text>
        </View>

        {existing ? (
          <View style={styles.statusCard}>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[existing.status].bg }]}>
              <Ionicons
                name={STATUS_CONFIG[existing.status].icon as any}
                size={20}
                color={STATUS_CONFIG[existing.status].text}
              />
              <Text style={[styles.statusLabel, { color: STATUS_CONFIG[existing.status].text }]}>
                {STATUS_CONFIG[existing.status].label}
              </Text>
            </View>

            <Text style={styles.statusDetail}>
              Share Code: {existing.share_code.slice(0, 3)}***{existing.share_code.slice(-2)}
            </Text>
            <Text style={styles.statusDetail}>
              Submitted: {new Date(existing.created_at).toLocaleDateString('en-GB')}
            </Text>
            {existing.verified_at && (
              <Text style={styles.statusDetail}>
                Verified: {new Date(existing.verified_at).toLocaleDateString('en-GB')}
              </Text>
            )}
            {existing.expires_at && (
              <Text style={styles.statusDetail}>
                Expires: {new Date(existing.expires_at).toLocaleDateString('en-GB')}
              </Text>
            )}
            {existing.reviewer_notes && (
              <Text style={styles.reviewerNote}>{existing.reviewer_notes}</Text>
            )}

            {(existing.status === 'rejected' || existing.status === 'expired') && (
              <Button
                title="Submit New Check"
                onPress={() => setExisting(null)}
                style={{ marginTop: 16 }}
              />
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Submit Verification</Text>

            <Text style={styles.helpText}>
              Get your share code at gov.uk/prove-right-to-work
            </Text>

            <Input
              label="Share Code"
              value={shareCode}
              onChangeText={setShareCode}
              placeholder="e.g. W4K8E7J2P"
              autoCapitalize="characters"
              maxLength={9}
            />

            <Input
              label="Date of Birth"
              value={dob}
              onChangeText={setDob}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />

            <Button
              title="Submit for Verification"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!shareCode.trim() || !dob.trim()}
            />
          </View>
        )}

        {/* How it works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How it works</Text>
          {[
            { icon: 'document-text-outline', text: 'Enter your Home Office Share Code' },
            { icon: 'eye-outline', text: 'Our team verifies your status within 24 hours' },
            { icon: 'shield-checkmark-outline', text: 'A "RTW Verified" badge appears on your profile' },
            { icon: 'people-outline', text: 'Customers see you are legally verified to work in the UK' },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryBg },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  infoCard: {
    flexDirection: 'row', gap: 10, backgroundColor: '#DBEAFE', borderRadius: radius.md,
    padding: 14, marginHorizontal: 16, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 18 },
  statusCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20,
    marginHorizontal: 16, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, alignSelf: 'flex-start',
  },
  statusLabel: { fontSize: 14, fontWeight: '700' },
  statusDetail: { fontSize: 13, color: colors.textBody, marginTop: 8 },
  reviewerNote: {
    fontSize: 13, color: colors.error, marginTop: 8, fontStyle: 'italic',
  },
  form: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20,
    marginHorizontal: 16, borderWidth: 1, borderColor: colors.border, ...shadow.card, gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  helpText: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  howItWorks: {
    marginHorizontal: 16, marginTop: 24, gap: 12,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center',
  },
  stepText: { flex: 1, fontSize: 14, color: colors.textBody, lineHeight: 18 },
})
