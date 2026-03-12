import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Modal, ScrollView, Switch, Platform, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

interface Service {
  id: string
  title: string
  description: string | null
  category_id: number
  price_from: number | null
  price_type: string | null
  is_active: boolean
  categories?: { name: string }
}

interface Category {
  id: number
  name: string
  slug: string
}

const PRICE_TYPES = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'quote', label: 'Quote' },
]

export default function ManageServicesScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showCatPicker, setShowCatPicker] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [priceFrom, setPriceFrom] = useState('')
  const [priceType, setPriceType] = useState('fixed')
  const [isActive, setIsActive] = useState(true)

  const fetchServices = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('services')
      .select('*, categories(name)')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })
    setServices(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchServices()
    supabase.from('categories').select('id, name, slug').order('name')
      .then(({ data }) => setCategories(data ?? []))
  }, [fetchServices])

  function resetForm() {
    setTitle(''); setDescription(''); setCategoryId(null); setCategoryName('')
    setPriceFrom(''); setPriceType('fixed'); setIsActive(true); setEditingId(null)
  }

  function openAdd() {
    resetForm()
    setShowForm(true)
  }

  function openEdit(s: Service) {
    setEditingId(s.id)
    setTitle(s.title)
    setDescription(s.description ?? '')
    setCategoryId(s.category_id)
    setCategoryName(s.categories?.name ?? '')
    setPriceFrom(s.price_from?.toString() ?? '')
    setPriceType(s.price_type ?? 'fixed')
    setIsActive(s.is_active)
    setShowForm(true)
  }

  async function handleSave() {
    if (!title.trim() || !categoryId) return
    setSaving(true)

    const payload = {
      provider_id: user!.id,
      title: title.trim(),
      description: description.trim() || null,
      category_id: categoryId,
      price_from: priceFrom ? parseFloat(priceFrom) : null,
      price_type: priceType,
      is_active: isActive,
    }

    if (editingId) {
      await supabase.from('services').update(payload).eq('id', editingId)
    } else {
      await supabase.from('services').insert(payload)
    }

    setSaving(false)
    setShowForm(false)
    resetForm()
    fetchServices()
  }

  async function handleDelete(id: string) {
    const doDelete = async () => {
      await supabase.from('services').delete().eq('id', id)
      fetchServices()
    }

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this service?')) doDelete()
    } else {
      Alert.alert('Delete Service', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ])
    }
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('services').update({ is_active: active }).eq('id', id)
    fetchServices()
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
        <Text style={styles.headerTitle}>Manage Services</Text>
        <TouchableOpacity onPress={openAdd}>
          <Ionicons name="add-circle" size={28} color="#1E40AF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        keyExtractor={item => item.id}
        onRefresh={fetchServices}
        refreshing={loading}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item.id)}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.categories?.name && <Text style={styles.cardCat}>{item.categories.name}</Text>}
              </View>
              <Switch value={item.is_active} onValueChange={(v) => toggleActive(item.id, v)} trackColor={{ true: '#1E40AF' }} />
            </View>
            <View style={styles.cardBottom}>
              {item.price_from != null && (
                <Text style={styles.cardPrice}>
                  £{item.price_from}{item.price_type === 'hourly' ? '/hr' : item.price_type === 'quote' ? ' (est.)' : ''}
                </Text>
              )}
              {!item.is_active && <Text style={styles.inactive}>Inactive</Text>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="briefcase-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>No services yet</Text>
            <Text style={styles.emptySubtext}>Add your first service to attract customers</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
            <View style={styles.formHeader}>
              <TouchableOpacity onPress={() => { setShowForm(false); resetForm() }}>
                <Ionicons name="close" size={24} color="#1E3A8A" />
              </TouchableOpacity>
              <Text style={styles.formTitle}>{editingId ? 'Edit Service' : 'Add Service'}</Text>
              <View style={{ width: 24 }} />
            </View>

            <View style={styles.formFields}>
              <Input label="Service Title" value={title} onChangeText={setTitle} placeholder="e.g. Boiler Installation" />

              <Input label="Description" value={description} onChangeText={setDescription}
                placeholder="Describe what this service includes..." multiline numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: 'top' }} />

              <View>
                <Text style={styles.fieldLabel}>Category</Text>
                <TouchableOpacity style={styles.picker} onPress={() => setShowCatPicker(true)}>
                  <Text style={categoryName ? styles.pickerText : styles.pickerPlaceholder}>
                    {categoryName || 'Select a category'}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#475569" />
                </TouchableOpacity>
              </View>

              <Input label="Price (£)" value={priceFrom} onChangeText={setPriceFrom}
                placeholder="0.00" keyboardType="decimal-pad" />

              <View>
                <Text style={styles.fieldLabel}>Price Type</Text>
                <View style={styles.pills}>
                  {PRICE_TYPES.map(pt => (
                    <TouchableOpacity key={pt.value}
                      style={[styles.pill, priceType === pt.value && styles.pillActive]}
                      onPress={() => setPriceType(pt.value)}>
                      <Text style={[styles.pillText, priceType === pt.value && styles.pillTextActive]}>{pt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.fieldLabel}>Active</Text>
                <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: '#1E40AF' }} />
              </View>
            </View>

            <View style={styles.formBtnWrap}>
              <Button title={editingId ? 'Save Changes' : 'Add Service'} onPress={handleSave}
                loading={saving} disabled={!title.trim() || !categoryId} />
              {editingId && (
                <Button title="Delete Service" variant="ghost" onPress={() => { handleDelete(editingId); setShowForm(false) }} />
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCatPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.formHeader}>
            <TouchableOpacity onPress={() => setShowCatPicker(false)}>
              <Ionicons name="close" size={24} color="#1E3A8A" />
            </TouchableOpacity>
            <Text style={styles.formTitle}>Select Category</Text>
            <View style={{ width: 24 }} />
          </View>
          <ScrollView contentContainerStyle={styles.catList}>
            {categories.map(c => (
              <TouchableOpacity key={c.id} style={[styles.catItem, categoryId === c.id && styles.catItemActive]}
                onPress={() => { setCategoryId(c.id); setCategoryName(c.name); setShowCatPicker(false) }}>
                <Text style={[styles.catText, categoryId === c.id && styles.catTextActive]}>{c.name}</Text>
                {categoryId === c.id && <Ionicons name="checkmark" size={20} color="#1E40AF" />}
              </TouchableOpacity>
            ))}
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A8A' },
  cardCat: { fontSize: 13, color: '#1E40AF', marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  cardPrice: { fontSize: 15, fontWeight: '700', color: '#1E3A8A' },
  inactive: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
  empty: { alignItems: 'center', marginTop: 60, gap: 8 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#475569' },
  emptySubtext: { fontSize: 14, color: '#94A3B8' },
  formScroll: { paddingBottom: 40 },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A8A' },
  formFields: { gap: 16, paddingHorizontal: 16, marginTop: 8 },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: '#1E3A8A', marginBottom: 6 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  pickerText: { fontSize: 16, color: '#1E3A8A' },
  pickerPlaceholder: { fontSize: 16, color: '#94A3B8' },
  pills: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF' },
  pillActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  pillText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  pillTextActive: { color: '#FFFFFF' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formBtnWrap: { paddingHorizontal: 16, marginTop: 24, gap: 8 },
  catList: { paddingHorizontal: 16, paddingBottom: 32 },
  catItem: { paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E0E7FF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catItemActive: { backgroundColor: '#EFF6FF' },
  catText: { fontSize: 16, color: '#1E3A8A' },
  catTextActive: { color: '#1E40AF', fontWeight: '600' },
})
