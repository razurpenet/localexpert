import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, Switch } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { sanitize, isAllowedImage, getMimeType, getFileExtension, isValidUkPhone, isValidUkPostcode, isInRange, userFriendlyError } from '../../lib/validation'

const LANGUAGES = [
  'English', 'Polish', 'Romanian', 'Urdu', 'Bengali', 'Gujarati',
  'Punjabi', 'Arabic', 'Somali', 'French', 'Portuguese', 'Spanish',
  'Turkish', 'Italian', 'Yoruba', 'Igbo', 'Twi', 'Swahili',
  'Hindi', 'Tamil', 'Mandarin', 'Cantonese', 'Tagalog', 'Lithuanian',
  'Bulgarian', 'Russian', 'Ukrainian', 'Farsi', 'Pashto', 'Tigrinya',
] as const

export default function ProviderEditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState((profile as any)?.phone ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [postcode, setPostcode] = useState(profile?.postcode ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [avatarUri, setAvatarUri] = useState(profile?.avatar_url ?? null)
  const [languages, setLanguages] = useState<string[]>([])

  const [businessName, setBusinessName] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [citizenshipStatus, setCitizenshipStatus] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setLanguages((profile as any).languages ?? [])
    }
  }, [profile])

  useEffect(() => {
    if (!user) return
    supabase.from('provider_details').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setBusinessName(data.business_name ?? '')
          setYearsExp(data.years_exp?.toString() ?? '')
          setWebsiteUrl(data.website_url ?? '')
          setIsAvailable(data.is_available ?? true)
          setCitizenshipStatus(data.citizenship_status ?? null)
        }
      })
  }, [user])

  function toggleLanguage(lang: string) {
    setLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    if (!isAllowedImage(asset.uri, asset.mimeType)) {
      setError('Please select a JPG, PNG, or WebP image.')
      return
    }
    const ext = getFileExtension(asset.uri, asset.mimeType) || 'jpg'
    const fileName = `${user!.id}/avatar.${ext}`

    const response = await fetch(asset.uri)
    const blob = await response.blob()

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, { contentType: getMimeType(ext), upsert: true })

    if (uploadError) {
      setError(userFriendlyError('uploading your photo'))
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    setAvatarUri(publicUrl + '?t=' + Date.now())
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user!.id)
  }

  async function handleSave() {
    setError(null)

    const cleanName = sanitize(fullName, 100)
    if (!cleanName) { setError('Full name is required.'); return }
    const cleanPhone = phone.trim()
    if (cleanPhone && !isValidUkPhone(cleanPhone)) { setError('Please enter a valid UK phone number.'); return }
    const cleanPostcode = postcode.trim()
    if (cleanPostcode && !isValidUkPostcode(cleanPostcode)) { setError('Please enter a valid UK postcode.'); return }
    const parsedYears = yearsExp ? parseInt(yearsExp, 10) : null
    if (parsedYears !== null && !isInRange(parsedYears, 0, 80)) { setError('Years of experience must be between 0 and 80.'); return }

    setSaving(true)

    const { error: profileError } = await supabase.from('profiles').update({
      full_name: cleanName,
      phone: cleanPhone || null,
      city: sanitize(city, 100) || null,
      postcode: cleanPostcode || null,
      bio: sanitize(bio, 500) || null,
      languages,
    }).eq('id', user!.id)

    if (profileError) { setError(userFriendlyError('saving your profile')); setSaving(false); return }

    const { error: detailsError } = await supabase.from('provider_details').upsert({
      id: user!.id,
      business_name: sanitize(businessName, 100),
      years_exp: parsedYears,
      website_url: websiteUrl.trim().slice(0, 200) || null,
      is_available: isAvailable,
      citizenship_status: citizenshipStatus,
    })

    if (detailsError) { setError(userFriendlyError('saving business details')); setSaving(false); return }

    await refreshProfile()
    setSaving(false)

    if (Platform.OS === 'web') { window.alert('Profile updated!') }
    else { Alert.alert('Success', 'Profile updated!') }
    router.back()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.avatarSection}>
            <Avatar uri={avatarUri} name={fullName || '?'} size={80} />
            <TouchableOpacity onPress={pickAvatar}>
              <Text style={styles.changePhoto}>Change photo</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.form}>
            <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
            <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="07..." keyboardType="phone-pad" />
            <Input label="City" value={city} onChangeText={setCity} placeholder="London" />
            <Input label="Postcode" value={postcode} onChangeText={setPostcode} placeholder="SW1A 1AA" autoCapitalize="characters" />
            <Input label="Bio" value={bio} onChangeText={setBio} placeholder="About you..." multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />
          </View>

          <Text style={styles.sectionTitle}>Business Details</Text>
          <View style={styles.form}>
            <Input label="Business Name" value={businessName} onChangeText={setBusinessName} placeholder="Your business name" />
            <Input label="Years of Experience" value={yearsExp} onChangeText={setYearsExp} placeholder="5" keyboardType="numeric" />
            <Input label="Website" value={websiteUrl} onChangeText={setWebsiteUrl} placeholder="https://..." keyboardType="url" autoCapitalize="none" />

            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Available for work</Text>
                <Text style={styles.toggleHint}>Show as available to customers</Text>
              </View>
              <Switch value={isAvailable} onValueChange={setIsAvailable} trackColor={{ true: '#1E40AF' }} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Citizenship Status</Text>
          <Text style={styles.citizenshipHint}>This helps us show you the right verification options. UK & Irish citizens don't need Right to Work verification.</Text>
          <View style={styles.citizenshipGrid}>
            {([
              { key: 'uk_irish', label: 'British / Irish Citizen' },
              { key: 'settled', label: 'Settled Status / ILR' },
              { key: 'pre_settled', label: 'Pre-Settled Status' },
              { key: 'visa', label: 'Work Visa' },
              { key: 'other', label: 'Other' },
            ] as const).map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.citizenshipChip, citizenshipStatus === opt.key && styles.citizenshipChipActive]}
                onPress={() => setCitizenshipStatus(opt.key)}
              >
                <Text style={[styles.citizenshipChipText, citizenshipStatus === opt.key && styles.citizenshipChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Languages Spoken</Text>
          <View style={styles.languageGrid}>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.langChip, languages.includes(lang) && styles.langChipActive]}
                onPress={() => toggleLanguage(lang)}
              >
                <Text style={[styles.langChipText, languages.includes(lang) && styles.langChipTextActive]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.btnWrap}>
            <Button title="Save changes" onPress={handleSave} loading={saving} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1E3A8A' },
  avatarSection: { alignItems: 'center', marginBottom: 24, gap: 8 },
  changePhoto: { fontSize: 15, fontWeight: '600', color: '#1E40AF' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1E3A8A', paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  form: { gap: 16, paddingHorizontal: 16 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E0E7FF' },
  toggleLabel: { fontSize: 15, fontWeight: '500', color: '#1E3A8A' },
  toggleHint: { fontSize: 13, color: '#475569', marginTop: 2 },
  errorBox: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 16 },
  errorText: { color: '#DC2626', fontSize: 14 },
  btnWrap: { paddingHorizontal: 16, marginTop: 24 },
  languageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 24 },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF' },
  langChipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  langChipText: { fontSize: 13, fontWeight: '500', color: '#475569' },
  langChipTextActive: { color: '#FFFFFF' },
  citizenshipHint: { fontSize: 13, color: '#475569', paddingHorizontal: 16, marginBottom: 12, lineHeight: 18 },
  citizenshipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  citizenshipChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF' },
  citizenshipChipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  citizenshipChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  citizenshipChipTextActive: { color: '#FFFFFF' },
})
