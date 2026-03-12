import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const TYPES = ['certification', 'insurance', 'license', 'other'] as const

interface CredentialItem {
  id: string
  label: string
  type: string
  document_url: string
  verified: boolean
  expires_at: string | null
  created_at: string
}

export default function CredentialsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [creds, setCreds] = useState<CredentialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [label, setLabel] = useState('')
  const [type, setType] = useState<string>('certification')
  const [expiresAt, setExpiresAt] = useState('')
  const [docUri, setDocUri] = useState<string | null>(null)

  const fetchCreds = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('credentials')
      .select('*')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
    setCreds(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchCreds() }, [fetchCreds])

  async function pickDocument() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })
    if (result.canceled || !result.assets[0]) return
    setDocUri(result.assets[0].uri)
  }

  async function handleSave() {
    if (!label.trim() || !docUri || !user) return
    setSaving(true)

    const ext = docUri.split('.').pop() ?? 'jpg'
    const fileName = `${user.id}/credentials/${Date.now()}.${ext}`
    const response = await fetch(docUri)
    const blob = await response.blob()

    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(fileName, blob, { contentType: `image/${ext}` })

    if (uploadError) {
      if (Platform.OS === 'web') window.alert(uploadError.message)
      else Alert.alert('Error', uploadError.message)
      setSaving(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(fileName)

    await supabase.from('credentials').insert({
      provider_id: user.id,
      label: label.trim(),
      type,
      document_url: publicUrl,
      expires_at: expiresAt.trim() || null,
    })

    setSaving(false)
    setShowForm(false)
    setLabel(''); setType('certification'); setExpiresAt(''); setDocUri(null)
    fetchCreds()
  }

  async function handleDelete(id: string) {
    const doDelete = async () => {
      await supabase.from('credentials').delete().eq('id', id)
      fetchCreds()
    }
    if (Platform.OS === 'web') { if (window.confirm('Delete credential?')) doDelete() }
    else { Alert.alert('Delete', 'Delete this credential?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: doDelete }]) }
  }

  const typeColors: Record<string, { bg: string; text: string }> = {
    certification: { bg: '#DBEAFE', text: '#1E40AF' },
    insurance: { bg: '#DCFCE7', text: '#16A34A' },
    license: { bg: '#FEF3C7', text: '#D97706' },
    other: { bg: '#E0E7FF', text: '#475569' },
  }

  if (loading) {
    return <SafeAreaView style={styles.safe} edges={['top']}><ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 60 }} /></SafeAreaView>
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credentials</Text>
        <TouchableOpacity onPress={() => setShowForm(true)}>
          <Ionicons name="add-circle" size={28} color="#1E40AF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={creds}
        keyExtractor={item => item.id}
        onRefresh={fetchCreds}
        refreshing={loading}
        renderItem={({ item }) => {
          const colors = typeColors[item.type] ?? typeColors.other
          return (
            <TouchableOpacity style={styles.card} onLongPress={() => handleDelete(item.id)}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardLabel}>{item.label}</Text>
                  <View style={styles.cardMeta}>
                    <View style={[styles.typeBadge, { backgroundColor: colors.bg }]}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>
                        {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </Text>
                    </View>
                    {item.expires_at && (
                      <Text style={styles.expires}>Expires: {new Date(item.expires_at).toLocaleDateString()}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name={item.verified ? 'checkmark-circle' : 'time-outline'} size={20}
                    color={item.verified ? '#16A34A' : '#D97706'} />
                  <Text style={{ fontSize: 12, color: item.verified ? '#16A34A' : '#D97706', fontWeight: '600' }}>
                    {item.verified ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="ribbon-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No credentials yet</Text>
            <Text style={styles.emptySubtext}>Add certifications to build trust</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.formHeader}>
              <TouchableOpacity onPress={() => { setShowForm(false); setDocUri(null) }}>
                <Ionicons name="close" size={24} color="#1E3A8A" />
              </TouchableOpacity>
              <Text style={styles.formTitle}>Add Credential</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.formFields}>
              <Input label="Label" value={label} onChangeText={setLabel} placeholder="e.g. Gas Safe Certificate" />

              <View>
                <Text style={styles.fieldLabel}>Type</Text>
                <View style={styles.pills}>
                  {TYPES.map(t => (
                    <TouchableOpacity key={t} style={[styles.pill, type === t && styles.pillActive]} onPress={() => setType(t)}>
                      <Text style={[styles.pillText, type === t && styles.pillTextActive]}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Input label="Expiry Date (YYYY-MM-DD)" value={expiresAt} onChangeText={setExpiresAt} placeholder="2027-01-01" />

              <View>
                <Text style={styles.fieldLabel}>Document</Text>
                <TouchableOpacity style={styles.uploadBtn} onPress={pickDocument}>
                  <Ionicons name={docUri ? 'checkmark-circle' : 'cloud-upload-outline'} size={22} color="#1E40AF" />
                  <Text style={styles.uploadText}>{docUri ? 'Document selected' : 'Upload document'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formBtnWrap}>
              <Button title="Save Credential" onPress={handleSave} loading={saving} disabled={!label.trim() || !docUri} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E3A8A' },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#1E40AF', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1 },
  cardRow: { flexDirection: 'row', gap: 12 },
  cardLabel: { fontSize: 16, fontWeight: '600', color: '#1E3A8A' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  typeBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  expires: { fontSize: 12, color: '#475569' },
  verifiedBadge: { alignItems: 'center', gap: 2 },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#475569' },
  emptySubtext: { fontSize: 14, color: '#94A3B8' },
  formScroll: { paddingBottom: 40 },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A8A' },
  formFields: { gap: 16, paddingHorizontal: 16, marginTop: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#1E3A8A', marginBottom: 6 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF' },
  pillActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  pillTextActive: { color: '#FFFFFF' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, borderStyle: 'dashed' },
  uploadText: { fontSize: 15, color: '#1E40AF', fontWeight: '500' },
  formBtnWrap: { paddingHorizontal: 16, marginTop: 24 },
})
