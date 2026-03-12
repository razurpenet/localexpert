import { useEffect, useState, useCallback } from 'react'
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'

interface JobRequest { id: string; message: string; status: string; profiles: { full_name: string } }
interface JobPhotoItem { id: string; image_url: string; type: string; created_at: string }

export default function JobPhotosScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<JobRequest[]>([])
  const [selectedReq, setSelectedReq] = useState<string | null>(null)
  const [photos, setPhotos] = useState<JobPhotoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('quote_requests')
      .select('id, message, status, profiles!quote_requests_customer_id_fkey(full_name)')
      .eq('provider_id', user.id)
      .in('status', ['accepted', 'completed'])
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const d = (data as unknown as JobRequest[]) ?? []
        setRequests(d)
        if (d.length > 0 && !selectedReq) setSelectedReq(d[0].id)
        setLoading(false)
      })
  }, [user])

  const fetchPhotos = useCallback(async () => {
    if (!selectedReq) { setPhotos([]); return }
    const { data } = await supabase.from('job_photos')
      .select('id, image_url, type, created_at')
      .eq('request_id', selectedReq)
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
  }, [selectedReq])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  async function uploadPhoto(type: 'before' | 'after') {
    if (!selectedReq || !user) return
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true })
    if (result.canceled || !result.assets[0]) return

    setUploading(true)
    const asset = result.assets[0]
    const ext = asset.uri.split('.').pop() ?? 'jpg'
    const fileName = `${user.id}/jobs/${selectedReq}/${type}_${Date.now()}.${ext}`

    const response = await fetch(asset.uri)
    const blob = await response.blob()

    const { error } = await supabase.storage.from('portfolio').upload(fileName, blob, { contentType: `image/${ext}` })
    if (error) {
      if (Platform.OS === 'web') window.alert(error.message)
      else Alert.alert('Error', error.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(fileName)
    await supabase.from('job_photos').insert({ request_id: selectedReq, provider_id: user.id, image_url: publicUrl, type })
    setUploading(false)
    fetchPhotos()
  }

  async function deletePhoto(id: string) {
    const doDelete = async () => {
      await supabase.from('job_photos').delete().eq('id', id)
      fetchPhotos()
    }
    if (Platform.OS === 'web') { if (window.confirm('Delete photo?')) doDelete() }
    else { Alert.alert('Delete', 'Delete this photo?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: doDelete }]) }
  }

  const beforePhotos = photos.filter(p => p.type === 'before')
  const afterPhotos = photos.filter(p => p.type === 'after')

  if (loading) {
    return <SafeAreaView style={styles.safe} edges={['top']}><ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 60 }} /></SafeAreaView>
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Photos</Text>
        <View style={{ width: 24 }} />
      </View>

      {requests.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="camera-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyText}>No active jobs</Text>
          <Text style={styles.emptySubtext}>Accept a request to start adding photos</Text>
        </View>
      ) : (
        <FlatList
          ListHeaderComponent={
            <>
              <FlatList
                horizontal
                data={requests}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reqList}
                renderItem={({ item }) => (
                  <TouchableOpacity style={[styles.reqChip, selectedReq === item.id && styles.reqChipActive]}
                    onPress={() => setSelectedReq(item.id)}>
                    <Text style={[styles.reqChipText, selectedReq === item.id && styles.reqChipTextActive]} numberOfLines={1}>
                      {item.profiles?.full_name}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              <PhotoSection title="Before Photos" photos={beforePhotos} onUpload={() => uploadPhoto('before')} onDelete={deletePhoto} uploading={uploading} />
              <PhotoSection title="After Photos" photos={afterPhotos} onUpload={() => uploadPhoto('after')} onDelete={deletePhoto} uploading={uploading} />
            </>
          }
          data={[]}
          renderItem={() => null}
        />
      )}
    </SafeAreaView>
  )
}

function PhotoSection({ title, photos, onUpload, onDelete, uploading }: {
  title: string; photos: JobPhotoItem[]; onUpload: () => void; onDelete: (id: string) => void; uploading: boolean
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity onPress={onUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator size="small" color="#1E40AF" /> : (
            <View style={styles.addBtn}>
              <Ionicons name="add" size={16} color="#1E40AF" />
              <Text style={styles.addText}>Add</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      {photos.length === 0 ? (
        <Text style={styles.noPhotos}>No {title.toLowerCase()} yet</Text>
      ) : (
        <View style={styles.grid}>
          {photos.map(p => (
            <TouchableOpacity key={p.id} style={styles.photoWrap} onLongPress={() => onDelete(p.id)}>
              <Image source={{ uri: p.image_url }} style={styles.photo} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1E3A8A' },
  reqList: { paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  reqChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF', maxWidth: 150 },
  reqChipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  reqChipText: { fontSize: 13, fontWeight: '600', color: '#475569' },
  reqChipTextActive: { color: '#FFFFFF' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1E3A8A' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 14, fontWeight: '600', color: '#1E40AF' },
  noPhotos: { fontSize: 14, color: '#94A3B8', fontStyle: 'italic' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoWrap: { width: '31%', aspectRatio: 1 },
  photo: { flex: 1, borderRadius: 12, backgroundColor: '#E2E8F0' },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#475569' },
  emptySubtext: { fontSize: 14, color: '#94A3B8' },
})
