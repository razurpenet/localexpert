import { useEffect, useState, useCallback } from 'react'
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'

interface PortfolioItem {
  id: string
  image_url: string
  caption: string | null
}

export default function PhotosScreen() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<PortfolioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const fetchPhotos = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('portfolio_items')
      .select('id, image_url, caption')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  async function handleUpload() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    })

    if (result.canceled || !result.assets[0]) return

    setUploading(true)
    const asset = result.assets[0]
    const ext = asset.uri.split('.').pop() ?? 'jpg'
    const fileName = `${user!.id}/${Date.now()}.${ext}`

    const response = await fetch(asset.uri)
    const blob = await response.blob()

    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(fileName, blob, { contentType: `image/${ext}` })

    if (uploadError) {
      Alert.alert('Upload failed', uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(fileName)

    await supabase.from('portfolio_items').insert({
      provider_id: user!.id,
      image_url: publicUrl,
    })

    setUploading(false)
    fetchPhotos()
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 60 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleUpload} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color="#1E40AF" />
          ) : (
            <>
              <Ionicons name="add" size={20} color="#1E40AF" />
              <Text style={styles.addText}>Add photo</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={photos}
        keyExtractor={item => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <View style={styles.photoWrapper}>
            <Image source={{ uri: item.image_url }} style={styles.photo} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>Showcase your work to attract customers</Text>
          </View>
        }
        contentContainerStyle={styles.grid}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1E3A8A' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 15, fontWeight: '600', color: '#1E40AF' },
  grid: { paddingHorizontal: 12, paddingBottom: 32 },
  photoWrapper: { flex: 1 / 3, aspectRatio: 1, padding: 4 },
  photo: { flex: 1, borderRadius: 12, backgroundColor: '#E2E8F0' },
  empty: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#475569' },
  emptySubtext: { fontSize: 14, color: '#94A3B8' },
})
