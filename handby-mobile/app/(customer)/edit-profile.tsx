import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth()
  const router = useRouter()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone] = useState((profile as any)?.phone ?? '')
  const [city, setCity] = useState(profile?.city ?? '')
  const [postcode, setPostcode] = useState(profile?.postcode ?? '')
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [avatarUri, setAvatarUri] = useState(profile?.avatar_url ?? null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    })
    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    const ext = asset.uri.split('.').pop() ?? 'jpg'
    const fileName = `${user!.id}/avatar.${ext}`

    const response = await fetch(asset.uri)
    const blob = await response.blob()

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, blob, { contentType: `image/${ext}`, upsert: true })

    if (uploadError) {
      setError('Failed to upload avatar: ' + uploadError.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    setAvatarUri(publicUrl + '?t=' + Date.now())

    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user!.id)
  }

  async function handleSave() {
    setError(null)
    setSaving(true)

    const { error: updateError } = await supabase.from('profiles').update({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      city: city.trim() || null,
      postcode: postcode.trim() || null,
      bio: bio.trim() || null,
    }).eq('id', user!.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    await refreshProfile()
    setSaving(false)

    if (Platform.OS === 'web') {
      window.alert('Profile updated!')
    } else {
      Alert.alert('Success', 'Profile updated!')
    }
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

          <View style={styles.form}>
            <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
            <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="07..." keyboardType="phone-pad" />
            <Input label="City" value={city} onChangeText={setCity} placeholder="London" />
            <Input label="Postcode" value={postcode} onChangeText={setPostcode} placeholder="SW1A 1AA" autoCapitalize="characters" />
            <Input label="Bio" value={bio} onChangeText={setBio} placeholder="Tell us about yourself..." multiline numberOfLines={4} style={{ minHeight: 100, textAlignVertical: 'top' }} />
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
  changePhoto: { fontSize: 15, fontWeight: '600', color: '#2563EB' },
  errorBox: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 16 },
  errorText: { color: '#DC2626', fontSize: 14 },
  form: { gap: 16, paddingHorizontal: 16 },
  btnWrap: { paddingHorizontal: 16, marginTop: 24 },
})
