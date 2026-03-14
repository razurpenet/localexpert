# Portfolio Albums Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let providers organize portfolio photos into named albums, with customer-facing filter chips on the provider profile.

**Architecture:** New `portfolio_albums` table stores album metadata. Existing `album` column on `portfolio_items` links photos to albums by name. Provider photos screen gets album CRUD + photo assignment UI. Customer profile view gets read-only filter chips.

**Tech Stack:** React Native 0.83, Expo SDK 55, Expo Router v4, Supabase (DB + storage + RLS), TypeScript

---

### Task 1: SQL Migration

**Files:**
- Create: `supabase/migrations/20260312_portfolio_albums.sql`

**Step 1: Write the migration file**

```sql
-- Portfolio albums table
CREATE TABLE IF NOT EXISTS portfolio_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, name)
);

ALTER TABLE portfolio_albums ENABLE ROW LEVEL SECURITY;

-- Providers can manage their own albums
CREATE POLICY "Providers manage own albums"
  ON portfolio_albums FOR ALL
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

-- Anyone can view albums (for customer profile page)
CREATE POLICY "Anyone can view albums"
  ON portfolio_albums FOR SELECT
  USING (true);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260312_portfolio_albums.sql
git commit -m "feat: add portfolio_albums migration with RLS"
```

**Step 3: Run in Supabase Dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the migration. Verify the `portfolio_albums` table exists with correct columns and RLS policies.

---

### Task 2: Provider Photos Screen — Album Bar & CRUD

**Files:**
- Modify: `handby-mobile/app/(provider)/photos.tsx`

This is the largest task. We're adding album management to the existing photos screen.

**Step 1: Add album state and fetch logic**

Add these imports at the top of `photos.tsx`:

```typescript
import { ScrollView, Modal, Alert, TouchableOpacity } from 'react-native'
```

Update the `PortfolioItem` interface to include `album`:

```typescript
interface PortfolioItem {
  id: string
  image_url: string
  caption: string | null
  album: string | null
}
```

Add a new interface:

```typescript
interface Album {
  id: string
  name: string
  sort_order: number
}
```

Add state variables inside `PhotosScreen`:

```typescript
const [albums, setAlbums] = useState<Album[]>([])
const [activeAlbum, setActiveAlbum] = useState<string | null>(null) // null = "All"
const [showCreateAlbum, setShowCreateAlbum] = useState(false)
const [newAlbumName, setNewAlbumName] = useState('')
const [selectedPhoto, setSelectedPhoto] = useState<PortfolioItem | null>(null)
```

Add album fetch function:

```typescript
const fetchAlbums = useCallback(async () => {
  if (!user) return
  const { data } = await supabase
    .from('portfolio_albums')
    .select('id, name, sort_order')
    .eq('provider_id', user.id)
    .order('sort_order', { ascending: true })
  setAlbums(data ?? [])
}, [user])
```

Update `fetchPhotos` to also select `album`:

```typescript
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
```

Update the `useEffect` to fetch both:

```typescript
useEffect(() => { fetchPhotos(); fetchAlbums() }, [fetchPhotos, fetchAlbums])
```

**Step 2: Add album CRUD functions**

```typescript
async function createAlbum() {
  if (!user || !newAlbumName.trim()) return
  if (albums.length >= 12) {
    Alert.alert('Limit reached', 'You can have up to 12 albums')
    return
  }
  const { error } = await supabase.from('portfolio_albums').insert({
    provider_id: user.id,
    name: newAlbumName.trim(),
    sort_order: albums.length,
  })
  if (error) {
    Alert.alert('Error', error.message.includes('duplicate') ? 'Album name already exists' : error.message)
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
        // Unset album on photos
        await supabase
          .from('portfolio_items')
          .update({ album: null })
          .eq('provider_id', user.id)
          .eq('album', albumName)
        // Delete album record
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
```

**Step 3: Update handleUpload to auto-assign album**

Update the insert call inside `handleUpload`:

```typescript
await supabase.from('portfolio_items').insert({
  provider_id: user!.id,
  image_url: publicUrl,
  album: activeAlbum, // auto-assign to currently selected album
})
```

**Step 4: Add filtered photos computation**

Before the `return` statement:

```typescript
const filteredPhotos = activeAlbum
  ? photos.filter(p => p.album === activeAlbum)
  : photos
```

**Step 5: Update the JSX**

Replace the entire `return` block (from line 80 to line 115) with:

```tsx
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
```

**Step 6: Add new styles**

Add these styles to the `StyleSheet.create` call (append after existing styles):

```typescript
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
```

**Step 7: Verify the app compiles and renders**

```bash
cd handby-mobile && npx expo start --web
```

Navigate to the provider photos screen. Verify:
- Album bar shows "All" chip + "+" button
- Tapping "+" opens create album modal
- Creating an album adds a chip
- Uploading while an album is selected assigns the photo
- Tapping a photo opens the action modal
- Moving photos between albums works
- Deleting an album uncategorizes its photos

**Step 8: Commit**

```bash
git add handby-mobile/app/\(provider\)/photos.tsx
git commit -m "feat: add album management to provider photos screen"
```

---

### Task 3: Customer Profile — Album Filter Chips

**Files:**
- Modify: `handby-mobile/app/provider/[id].tsx:39-57,320-330`

**Step 1: Add album state**

Add state inside `ProviderProfileScreen`:

```typescript
const [albums, setAlbums] = useState<string[]>([])
const [activeAlbumFilter, setActiveAlbumFilter] = useState<string | null>(null)
```

**Step 2: Fetch albums in the useEffect**

Add a 6th query to the existing `Promise.all` array (line 53-58):

```typescript
supabase.from('portfolio_albums').select('name, sort_order').eq('provider_id', id).order('sort_order', { ascending: true }),
```

And update the `.then()` handler to include:

```typescript
.then(([profileRes, servicesRes, portfolioRes, reviewsRes, credRes, albumsRes]) => {
  // ... existing setters ...
  setAlbums((albumsRes.data ?? []).map((a: any) => a.name))
  setLoading(false)
})
```

**Step 3: Update the portfolio query to include album**

On line 56, remove the `.limit(9)` and add `album` to the select:

```typescript
supabase.from('portfolio_items').select('*, album').eq('provider_id', id).order('created_at', { ascending: false }),
```

**Step 4: Add filtered portfolio computation**

Before the return statement, after the `subScores` block:

```typescript
const filteredPortfolio = activeAlbumFilter
  ? portfolio.filter((p: any) => p.album === activeAlbumFilter)
  : portfolio
```

**Step 5: Update Portfolio section JSX**

Replace the Portfolio section (lines 320-330) with:

```tsx
{/* Portfolio */}
{portfolio.length > 0 && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Portfolio</Text>
    {albums.length > 0 && (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.albumFilterBar}>
        <View style={styles.albumFilterRow}>
          <TouchableOpacity
            style={[styles.albumFilterChip, activeAlbumFilter === null && styles.albumFilterChipActive]}
            onPress={() => setActiveAlbumFilter(null)}
          >
            <Text style={[styles.albumFilterText, activeAlbumFilter === null && styles.albumFilterTextActive]}>All</Text>
          </TouchableOpacity>
          {albums.map(name => (
            <TouchableOpacity
              key={name}
              style={[styles.albumFilterChip, activeAlbumFilter === name && styles.albumFilterChipActive]}
              onPress={() => setActiveAlbumFilter(name)}
            >
              <Text style={[styles.albumFilterText, activeAlbumFilter === name && styles.albumFilterTextActive]}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    )}
    <View style={styles.portfolioGrid}>
      {filteredPortfolio.map((p: any) => (
        <Image key={p.id} source={{ uri: p.image_url }} style={styles.portfolioImg} />
      ))}
    </View>
  </View>
)}
```

**Step 6: Add styles for album filter chips**

Append to the `StyleSheet.create`:

```typescript
albumFilterBar: { marginBottom: 12 },
albumFilterRow: { flexDirection: 'row', gap: 8 },
albumFilterChip: {
  backgroundColor: '#FFFFFF', borderRadius: 16,
  paddingHorizontal: 14, paddingVertical: 6,
  borderWidth: 1, borderColor: '#E0E7FF',
},
albumFilterChipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
albumFilterText: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
albumFilterTextActive: { color: '#FFFFFF' },
```

**Step 7: Verify**

Navigate to a provider profile as a customer. Verify:
- If the provider has albums, filter chips appear above the photo grid
- Tapping "All" shows all photos
- Tapping an album name filters to only those photos
- If provider has no albums, no chips appear

**Step 8: Commit**

```bash
git add handby-mobile/app/provider/\[id\].tsx
git commit -m "feat: add album filter chips to customer provider profile view"
```

---

### Task 4: Update PortfolioItem type (already done)

The `PortfolioItem` interface in `handby-mobile/lib/types.ts` already has `album: string | null` at line 148. No changes needed. Skip this task.

---

### Task 5: Final verification & commit

**Step 1: Verify full flow end-to-end**

1. Log in as provider → go to Photos screen
2. Create album "Kitchen Work"
3. Upload a photo while "Kitchen Work" is active → photo should have album set
4. Tap the photo → move to "Uncategorized"
5. Tap the photo again → move back to "Kitchen Work"
6. Delete album → photo becomes uncategorized
7. Log in as customer → view that provider's profile
8. Verify filter chips appear and work
9. Verify "All" shows everything

**Step 2: Final commit if any loose changes**

```bash
git status
# If any unstaged changes:
git add -A
git commit -m "feat: portfolio albums - final polish"
```
