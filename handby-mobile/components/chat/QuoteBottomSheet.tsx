import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal, Switch, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { colors, radius } from '../../lib/theme'

interface LineItem {
  description: string
  amount: string
}

interface Props {
  visible: boolean
  onClose: () => void
  requestId: string
  customerId: string
}

export function QuoteBottomSheet({ visible, onClose, requestId, customerId }: Props) {
  const { user } = useAuth()
  const [items, setItems] = useState<LineItem[]>([{ description: '', amount: '' }])
  const [includeVat, setIncludeVat] = useState(false)
  const [discount, setDiscount] = useState('')
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', amount: '' }])
  }

  function removeItem(index: number) {
    if (items.length <= 1) return
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
  const vatRate = includeVat ? 20 : 0
  const vatAmount = includeVat ? subtotal * 0.2 : 0
  const discountNum = parseFloat(discount) || 0
  const total = subtotal + vatAmount - discountNum

  const canSend = items.some(i => i.description.trim() && parseFloat(i.amount) > 0) && total > 0

  async function send() {
    if (!user || !canSend) return
    setSending(true)

    const parsedItems = items
      .filter(i => i.description.trim() && parseFloat(i.amount) > 0)
      .map(i => ({ description: i.description.trim(), amount: parseFloat(i.amount) }))

    // Insert quote
    const { data: quote } = await supabase.from('quotes').insert({
      request_id: requestId,
      provider_id: user.id,
      customer_id: customerId,
      items: parsedItems,
      subtotal,
      vat_rate: includeVat ? 20 : null,
      vat_amount: includeVat ? vatAmount : null,
      discount: discountNum,
      total,
      notes: notes.trim() || null,
      status: 'sent',
    }).select('id').single()

    if (quote) {
      // Insert message with type='quote'
      await supabase.from('messages').insert({
        request_id: requestId,
        sender_id: user.id,
        content: `Quote: £${total.toFixed(2)}`,
        type: 'quote',
        metadata: { quote_id: quote.id },
      })
    }

    // Reset form
    setItems([{ description: '', amount: '' }])
    setIncludeVat(false)
    setDiscount('')
    setNotes('')
    setSending(false)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>New Quote</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
            {/* Line items */}
            <Text style={styles.sectionLabel}>Line items</Text>
            {items.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <TextInput
                  style={[styles.itemInput, { flex: 2 }]}
                  placeholder="Description"
                  placeholderTextColor={colors.textMuted}
                  value={item.description}
                  onChangeText={v => updateItem(i, 'description', v)}
                />
                <TextInput
                  style={[styles.itemInput, { flex: 1 }]}
                  placeholder="£0.00"
                  placeholderTextColor={colors.textMuted}
                  value={item.amount}
                  onChangeText={v => updateItem(i, 'amount', v)}
                  keyboardType="decimal-pad"
                />
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => removeItem(i)} style={styles.removeBtn}>
                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
              <Ionicons name="add" size={18} color={colors.primary} />
              <Text style={styles.addItemText}>Add item</Text>
            </TouchableOpacity>

            {/* VAT toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Include VAT (20%)</Text>
              <Switch
                value={includeVat}
                onValueChange={setIncludeVat}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={colors.surface}
              />
            </View>

            {/* Discount */}
            <Text style={styles.sectionLabel}>Discount (optional)</Text>
            <TextInput
              style={styles.discountInput}
              placeholder="£0.00"
              placeholderTextColor={colors.textMuted}
              value={discount}
              onChangeText={setDiscount}
              keyboardType="decimal-pad"
            />

            {/* Notes */}
            <Text style={styles.sectionLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Any additional details..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {/* Totals */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>£{subtotal.toFixed(2)}</Text>
              </View>
              {includeVat && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>VAT (20%)</Text>
                  <Text style={styles.totalValue}>£{vatAmount.toFixed(2)}</Text>
                </View>
              )}
              {discountNum > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Discount</Text>
                  <Text style={[styles.totalValue, { color: colors.success }]}>-£{discountNum.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.totalRow, styles.grandTotal]}>
                <Text style={styles.grandTotalLabel}>Total</Text>
                <Text style={styles.grandTotalValue}>£{total.toFixed(2)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Send button */}
          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={send}
            disabled={!canSend || sending}
          >
            <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Send Quote'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    maxHeight: '90%', paddingBottom: 34,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: colors.textBody, marginBottom: 8, marginTop: 16 },
  itemRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  itemInput: {
    backgroundColor: colors.primaryBg, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  removeBtn: { padding: 6 },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  addItemText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  toggleLabel: { fontSize: 14, color: colors.textBody },
  discountInput: {
    backgroundColor: colors.primaryBg, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  notesInput: {
    backgroundColor: colors.primaryBg, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
    minHeight: 60, textAlignVertical: 'top',
  },
  totalsSection: { marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel: { fontSize: 14, color: colors.textBody },
  totalValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  grandTotal: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 8 },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  grandTotalValue: { fontSize: 16, fontWeight: '700', color: colors.primary },
  sendBtn: {
    backgroundColor: colors.cta, borderRadius: radius.md, paddingVertical: 14,
    marginHorizontal: 20, marginTop: 16, alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.ctaDisabled },
  sendBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
})
