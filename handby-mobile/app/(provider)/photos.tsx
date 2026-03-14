import { useEffect, useState, useCallback } from 'react'
import { View, Text, Image, FlatList, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { isAllowedImage, getMimeType, getFileExtension, sanitize, userFriendlyError } from '../../lib/validation'

interface PortfolioItem {
  id: string
  image_url: string
  caption: string | null
  album: string | null
}

interface Album {
  id: string
  name: string
  sort_order: number
}

export default function PhotosScreen() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState<PortfolioItem[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showCreateAlbum, setShowCreateAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<PortfolioItem | null>(null)

  const fetchPhotos = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('portfolio_items')
      .select('id, image_url, caption, album')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
    setLoading(false)
  }, [user])

  const fetchAlbums = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('portfolio_albums')
      .select('id, name, sort_order')
      .eq('provider_id', user.id)
      .order('sort_order', { ascending: true })
    setAlbums(data ?? [])
  }, [user])

  useEffect(() => { fetchPhotos(); fetchAlbums() }, [fetchPhotos, fetchAlbums])

  async function createAlbum() {
    if (!user || !newAlbumName.trim()) return
    if (albums.length >= 12) {
      Alert.alert('Limit reached', 'You can have up to 12 albums')
      return
    }
    const { error } = await supabase.from('portfolio_albums').insert({
      provider_id: user.id,
      name: sanitize(newAlbumName, 40),
      sort_order: albums.length,
    })
    if (error) {
      Alert.alert('Error', error.message.includes('duplicate') ? 'Album name already exists' : userFriendlyError('creating album'))
      return
    }
    setNewAlbumName('')
    setShowCreateAlbum(false)
    fetchAlbums()
  }

  async function deleteAlbum(albumName: string) {
    Alert.alert('Delete Album', `Delete "${albumName}"? Photos will become uncategorized.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          if (!user) return
          await supabase
            .from('portfolio_items')
            .update({ album: null })
            .eq('provider_id', user.id)
            .eq('album', albumName)
          await supabase
            .from('portfolio_albums')
            .delete()
            .eq('provider_id', user.id)
            .eq('name', albumName)
          if (activeAlbum === albumName) setActiveAlbum(null)
          fetchAlbums()
          fetchPhotos()
        }
      }
    ])
  }

  async function movePhotoToAlbum(photoId: string, albumName: string | null) {
    await supabase
      .from('portfolio_items')
      .update({ album: albumName })
      .eq('id', photoId)
    setSelectedPhoto(null)
    fetchPhotos()
  }

  async function deletePhoto(photoId: string) {
    Alert.alert('Delete Photo', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await supabase.from('portfolio_items').delete().eq('id', photoId)
          setSelectedPhoto(null)
          fetchPhotos()
        }
      }
    ])
  }

  async function handleUpload() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    })

    if (result.canceled || !result.assets[0]) return

    const asset = result.assets[0]
    if (!isAllowedImage(asset.uri, asset.mimeType)) {
      Alert.alert('Invalid file', 'Please select a JPG, PNG, or WebP image.')
      return
    }

    setUploading(true)
    const ext = getFileExtension(asset.uri, asset.mimeType) || 'jpg'
    const fileName = `${user!.id}/${Date.now()}.${ext}`

    const response = await fetch(asset.uri)
    const blob = await response.blob()

    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(fileName, blob, { contentType: getMimeType(ext) })

    if (uploadError) {
      Alert.alert('Upload failed', userFriendlyError('uploading your photo'))
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(fileName)

    await supabase.from('portfolio_items').insert({
      provider_id: user!.id,
      image_url: publicUrl,
      album: activeAlbum,
    })

    setUploading(false)
    fetchPhotos()
  }

  const filteredPhotos = activeAlbum
    ? photos.filter(p => p.album === activeAlbum)
    : photos

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

      {/* Album bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.albumBar} contentContainerStyle={styles.albumBarContent}>
        <TouchableOpacity
          style={[styles.albumChip, activeAlbum === null && styles.albumChipActive]}
          onPress={() => setActiveAlbum(null)}
        >
          <Text style={[styles.albumChipText, activeAlbum === null && styles.albumChipTextActive]}>All</Text>
        </TouchableOpacity>
        {albums.map(a => (
          <TouchableOpacity
            key={a.id}
            style={[styles.albumChip, activeAlbum === a.name && styles.albumChipActive]}
            onPress={() => setActiveAlbum(a.name)}
            onLongPress={() => deleteAlbum(a.name)}
          >
            <Text style={[styles.albumChipText, activeAlbum === a.name && styles.albumChipTextActive]}>
              {a.name}
            </Text>
            {activeAlbum === a.name && (
              <TouchableOpacity onPress={() => deleteAlbum(a.name)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.addAlbumBtn} onPress={() => setShowCreateAlbum(true)}>
          <Ionicons name="add-circle-outline" size={20} color="#1E40AF" />
        </TouchableOpacity>
      </ScrollView>

      <FlatList
        data={filteredPhotos}
        keyExtractor={item => item.id}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.photoWrapper} onPress={() => setSelectedPhoto(item)}>
            <Image source={{ uri: item.image_url }} style={styles.photo} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>
              {activeAlbum ? `No photos in "${activeAlbum}"` : 'No photos yet'}
            </Text>
            <Text style={styles.emptySubtext}>Showcase your work to attract customers</Text>
          </View>
        }
        contentContainerStyle={styles.grid}
      />

      {/* Create album modal */}
      <Modal visible={showCreateAlbum} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCreateAlbum(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>New Album</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Album name..."
              placeholderTextColor="#94A3B8"
              value={newAlbumName}
              onChangeText={setNewAlbumName}
              autoFocus
              maxLength={40}
            />
            <TouchableOpacity
              style={[styles.modalSubmit, !newAlbumName.trim() && { opacity: 0.5 }]}
              onPress={createAlbum}
              disabled={!newAlbumName.trim()}
            >
              <Text style={styles.modalSubmitText}>Create</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Photo action modal */}
      <Modal visible={!!selectedPhoto} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedPhoto(null)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>Photo Options</Text>
            {selectedPhoto?.album && (
              <Text style={styles.currentAlbumLabel}>Current album: {selectedPhoto.album}</Text>
            )}
            <Text style={styles.moveToLabel}>Move to album:</Text>
            <TouchableOpacity
              style={styles.albumOption}
              onPress={() => selectedPhoto && movePhotoToAlbum(selectedPhoto.id, null)}
            >
              <Text style={styles.albumOptionText}>Uncategorized</Text>
              {selectedPhoto?.album === null && <Ionicons name="checkmark" size={18} color="#1E40AF" />}
            </TouchableOpacity>
            {albums.map(a => (
              <TouchableOpacity
                key={a.id}
                style={styles.albumOption}
                onPress={() => selectedPhoto && movePhotoToAlbum(selectedPhoto.id, a.name)}
              >
                <Text style={styles.albumOptionText}>{a.name}</Text>
                {selectedPhoto?.album === a.name && <Ionicons name="checkmark" size={18} color="#1E40AF" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => selectedPhoto && deletePhoto(selectedPhoto.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#DC2626" />
              <Text style={styles.deleteBtnText}>Delete Photo</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  albumBar: { maxHeight: 48, marginBottom: 8 },
  albumBarContent: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  albumChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: '#E0E7FF',
  },
  albumChipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  albumChipText: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
  albumChipTextActive: { color: '#FFFFFF' },
  addAlbumBtn: { paddingHorizontal: 8, justifyContent: 'center' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A8A', marginBottom: 16 },
  modalInput: {
    backgroundColor: '#EFF6FF', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#1E3A8A', borderWidth: 1, borderColor: '#E0E7FF',
    marginBottom: 16,
  },
  modalSubmit: {
    backgroundColor: '#1E40AF', borderRadius: 12, padding: 14,
    alignItems: 'center',
  },
  modalSubmitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  currentAlbumLabel: { fontSize: 13, color: '#475569', marginBottom: 12 },
  moveToLabel: { fontSize: 14, fontWeight: '600', color: '#1E3A8A', marginBottom: 8 },
  albumOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E7FF',
  },
  albumOptionText: { fontSize: 15, color: '#1E3A8A' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 16, paddingVertical: 12, justifyContent: 'center',
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: '#DC2626' },
})
