# In-Chat Quotes & Bookings — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add inline quote cards and booking cards to the chat conversation so providers can send itemised quotes and booking proposals, and customers can accept/decline directly in the chat.

**Architecture:** Extend the `messages` table with `type` and `metadata` columns. Quote and booking data lives in the existing `quotes` and `appointments` tables. The chat FlatList checks `message.type` to render text bubbles, quote cards, or booking cards. Booking is gated behind an accepted quote. Real-time subscriptions on `quotes` and `appointments` keep card statuses live.

**Tech Stack:** React Native, Expo Router, Supabase (postgres_changes real-time), TypeScript, design tokens from `lib/theme.ts`

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260312_in_chat_quotes_bookings.sql`

**Step 1: Write the migration SQL**

```sql
-- Migration: In-chat quotes & bookings
-- Date: 2026-03-12
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- 1. Extend messages table with type + metadata
-- ============================================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text'
    CHECK (type IN ('text', 'quote', 'booking')),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- ============================================================
-- 2. Extend appointments table
-- ============================================================
-- Add quote_id FK to link booking to accepted quote
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id);

-- Drop old CHECK and add 'confirmed' status
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled'));

-- ============================================================
-- 3. RLS: Let customers update quote status (accept/reject)
-- ============================================================
CREATE POLICY "quotes_customer_update" ON quotes FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260312_in_chat_quotes_bookings.sql
git commit -m "feat: add migration for in-chat quotes and bookings"
```

> **User action required:** Run this SQL in Supabase Dashboard > SQL Editor.

---

### Task 2: QuoteCard Component

**Files:**
- Create: `handby-mobile/components/chat/QuoteCard.tsx`

**Step 1: Write the QuoteCard component**

This renders an inline card in the chat for quote-type messages. It fetches the quote data from `metadata.quote_id`, displays items summary, total, and status. Shows Accept/Decline buttons to the customer when `status='sent'`.

```typescript
import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { colors, radius, shadow } from '../../lib/theme'

interface QuoteData {
  id: string
  items: { description: string; amount: number }[]
  subtotal: number
  vat_rate: number | null
  vat_amount: number | null
  discount: number
  total: number
  notes: string | null
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  customer_id: string
  provider_id: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  sent:     { bg: '#FEF3C7', text: '#D97706', label: 'Sent' },
  accepted: { bg: '#DCFCE7', text: '#16A34A', label: 'Accepted' },
  rejected: { bg: '#FEE2E2', text: '#DC2626', label: 'Declined' },
}

export function QuoteCard({ quoteId, onStatusChange }: { quoteId: string; onStatusChange?: () => void }) {
  const { user } = useAuth()
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    supabase.from('quotes').select('*').eq('id', quoteId).single()
      .then(({ data }) => { setQuote(data as QuoteData); setLoading(false) })
  }, [quoteId])

  async function updateStatus(status: 'accepted' | 'rejected') {
    setActing(true)
    await supabase.from('quotes').update({ status }).eq('id', quoteId)
    setQuote(prev => prev ? { ...prev, status } : null)
    setActing(false)
    onStatusChange?.()
  }

  if (loading || !quote) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  const cfg = STATUS_STYLES[quote.status] ?? STATUS_STYLES.sent
  const isCustomer = user?.id === quote.customer_id
  const canAct = isCustomer && quote.status === 'sent'
  const itemSummary = quote.items.map(i => i.description).join(', ')

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => setExpanded(!expanded)}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="document-text" size={18} color={colors.primary} />
          <Text style={styles.headerLabel}>Quote</Text>
          <Text style={styles.headerTotal}>£{quote.total.toFixed(2)}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Summary */}
      <Text style={styles.summary} numberOfLines={expanded ? undefined : 1}>
        {quote.items.length} item{quote.items.length !== 1 ? 's' : ''}
        {quote.vat_amount ? ' · incl. VAT' : ''}
        {itemSummary ? ` · ${itemSummary}` : ''}
      </Text>

      {/* Expanded: line items */}
      {expanded && (
        <View style={styles.itemsContainer}>
          {quote.items.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemDesc}>{item.description}</Text>
              <Text style={styles.itemAmount}>£{item.amount.toFixed(2)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.itemDesc}>Subtotal</Text>
            <Text style={styles.itemAmount}>£{quote.subtotal.toFixed(2)}</Text>
          </View>
          {quote.vat_amount ? (
            <View style={styles.itemRow}>
              <Text style={styles.itemDesc}>VAT ({quote.vat_rate}%)</Text>
              <Text style={styles.itemAmount}>£{quote.vat_amount.toFixed(2)}</Text>
            </View>
          ) : null}
          {quote.discount > 0 ? (
            <View style={styles.itemRow}>
              <Text style={styles.itemDesc}>Discount</Text>
              <Text style={[styles.itemAmount, { color: colors.success }]}>-£{quote.discount.toFixed(2)}</Text>
            </View>
          ) : null}
          <View style={styles.itemRow}>
            <Text style={[styles.itemDesc, { fontWeight: '700' }]}>Total</Text>
            <Text style={[styles.itemAmount, { fontWeight: '700' }]}>£{quote.total.toFixed(2)}</Text>
          </View>
          {quote.notes ? <Text style={styles.notes}>{quote.notes}</Text> : null}
        </View>
      )}

      {/* Action buttons */}
      {canAct && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={() => updateStatus('accepted')} disabled={acting}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineBtn} onPress={() => updateStatus('rejected')} disabled={acting}>
            <Ionicons name="close" size={16} color={colors.error} />
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
    maxWidth: '90%', alignSelf: 'flex-start',
    ...shadow.card,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  headerTotal: { fontSize: 16, fontWeight: '700', color: colors.primary, marginLeft: 4 },
  statusPill: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  summary: { fontSize: 13, color: colors.textBody, marginTop: 6 },
  itemsContainer: { marginTop: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  itemDesc: { fontSize: 13, color: colors.textBody },
  itemAmount: { fontSize: 13, color: colors.textPrimary, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  notes: { fontSize: 12, color: colors.textMuted, marginTop: 8, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  acceptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.success, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8,
  },
  acceptText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  declineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEE2E2', borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8,
  },
  declineText: { color: colors.error, fontSize: 13, fontWeight: '600' },
})
```

**Step 2: Commit**

```bash
git add handby-mobile/components/chat/QuoteCard.tsx
git commit -m "feat: add QuoteCard component for in-chat quotes"
```

---

### Task 3: BookingCard Component

**Files:**
- Create: `handby-mobile/components/chat/BookingCard.tsx`

**Step 1: Write the BookingCard component**

Renders a booking proposal card in the chat. Fetches appointment data from `metadata.appointment_id`. Shows Confirm/Decline buttons to the customer when `status='scheduled'`. On confirm, also updates `quote_requests.status` to `'confirmed'`.

```typescript
import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { colors, radius, shadow } from '../../lib/theme'

interface AppointmentData {
  id: string
  request_id: string
  date: string
  time_slot: string
  notes: string | null
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  customer_id: string
  provider_id: string
  quote_id: string | null
  quotes?: { total: number } | null
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scheduled:  { bg: '#FEF3C7', text: '#D97706', label: 'Pending' },
  confirmed:  { bg: '#DCFCE7', text: '#16A34A', label: 'Confirmed' },
  completed:  { bg: '#DCFCE7', text: '#16A34A', label: 'Completed' },
  cancelled:  { bg: '#FEE2E2', text: '#DC2626', label: 'Cancelled' },
}

export function BookingCard({ appointmentId, onStatusChange }: { appointmentId: string; onStatusChange?: () => void }) {
  const { user } = useAuth()
  const [appt, setAppt] = useState<AppointmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    supabase.from('appointments').select('*, quotes(total)').eq('id', appointmentId).single()
      .then(({ data }) => { setAppt(data as unknown as AppointmentData); setLoading(false) })
  }, [appointmentId])

  async function confirm() {
    if (!appt) return
    setActing(true)
    await supabase.from('appointments').update({ status: 'confirmed' }).eq('id', appt.id)
    await supabase.from('quote_requests').update({ status: 'confirmed', confirmed_at: new Date().toISOString() }).eq('id', appt.request_id)
    setAppt(prev => prev ? { ...prev, status: 'confirmed' } : null)
    setActing(false)
    onStatusChange?.()
  }

  async function decline() {
    if (!appt) return
    setActing(true)
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appt.id)
    setAppt(prev => prev ? { ...prev, status: 'cancelled' } : null)
    setActing(false)
    onStatusChange?.()
  }

  if (loading || !appt) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    )
  }

  const cfg = STATUS_STYLES[appt.status] ?? STATUS_STYLES.scheduled
  const isCustomer = user?.id === appt.customer_id
  const canAct = isCustomer && appt.status === 'scheduled'
  const dateStr = new Date(appt.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

  return (
    <View style={styles.card}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={18} color={colors.primary} />
          <Text style={styles.headerLabel}>Booking</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
        </View>
      </View>

      {/* Details */}
      <Text style={styles.dateTime}>{dateStr} · {appt.time_slot}</Text>
      {appt.quotes?.total != null && (
        <Text style={styles.total}>Total: £{appt.quotes.total.toFixed(2)}</Text>
      )}
      {appt.notes ? <Text style={styles.notes}>{appt.notes}</Text> : null}

      {/* Action buttons */}
      {canAct && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.confirmBtn} onPress={confirm} disabled={acting}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text style={styles.confirmText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineBtn} onPress={decline} disabled={acting}>
            <Ionicons name="close" size={16} color={colors.error} />
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
    maxWidth: '90%', alignSelf: 'flex-start',
    ...shadow.card,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  statusPill: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  dateTime: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, marginTop: 8 },
  total: { fontSize: 14, color: colors.primary, fontWeight: '600', marginTop: 4 },
  notes: { fontSize: 12, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.success, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8,
  },
  confirmText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  declineBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEE2E2', borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8,
  },
  declineText: { color: colors.error, fontSize: 13, fontWeight: '600' },
})
```

**Step 2: Commit**

```bash
git add handby-mobile/components/chat/BookingCard.tsx
git commit -m "feat: add BookingCard component for in-chat bookings"
```

---

### Task 4: QuoteBottomSheet Component

**Files:**
- Create: `handby-mobile/components/chat/QuoteBottomSheet.tsx`

**Step 1: Write the QuoteBottomSheet component**

A modal form for providers to compose a quote with dynamic line items, optional VAT, discount, and notes. On send, inserts into `quotes` and `messages`.

```typescript
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
```

**Step 2: Commit**

```bash
git add handby-mobile/components/chat/QuoteBottomSheet.tsx
git commit -m "feat: add QuoteBottomSheet for composing in-chat quotes"
```

---

### Task 5: BookingBottomSheet Component

**Files:**
- Create: `handby-mobile/components/chat/BookingBottomSheet.tsx`

**Step 1: Write the BookingBottomSheet component**

A modal form for providers to propose a booking with date, time, and notes. Displays the total from the accepted quote. On send, inserts into `appointments` and `messages`.

```typescript
import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker from '@react-native-community/datetimepicker'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { colors, radius } from '../../lib/theme'

interface Props {
  visible: boolean
  onClose: () => void
  requestId: string
  customerId: string
  acceptedQuote: { id: string; total: number } | null
}

export function BookingBottomSheet({ visible, onClose, requestId, customerId, acceptedQuote }: Props) {
  const { user } = useAuth()
  const [date, setDate] = useState(new Date())
  const [time, setTime] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [notes, setNotes] = useState('')
  const [sending, setSending] = useState(false)

  const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  const timeStr = time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  async function send() {
    if (!user || !acceptedQuote) return
    setSending(true)

    const { data: appt } = await supabase.from('appointments').insert({
      request_id: requestId,
      provider_id: user.id,
      customer_id: customerId,
      date: date.toISOString().split('T')[0],
      time_slot: timeStr,
      notes: notes.trim() || null,
      status: 'scheduled',
      quote_id: acceptedQuote.id,
    }).select('id').single()

    if (appt) {
      await supabase.from('messages').insert({
        request_id: requestId,
        sender_id: user.id,
        content: `Booking: ${dateStr} at ${timeStr}`,
        type: 'booking',
        metadata: { appointment_id: appt.id },
      })
    }

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
            <Text style={styles.sheetTitle}>Book Appointment</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {/* Date */}
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.pickerText}>{dateStr}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                minimumDate={new Date()}
                onChange={(_, d) => { setShowDatePicker(false); if (d) setDate(d) }}
              />
            )}

            {/* Time */}
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.pickerText}>{timeStr}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={time}
                mode="time"
                onChange={(_, t) => { setShowTimePicker(false); if (t) setTime(t) }}
              />
            )}

            {/* Notes */}
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Any instructions for the customer..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            {/* Quote total */}
            {acceptedQuote && (
              <View style={styles.quoteTotal}>
                <Text style={styles.quoteTotalLabel}>Total from quote</Text>
                <Text style={styles.quoteTotalValue}>£{acceptedQuote.total.toFixed(2)}</Text>
              </View>
            )}
          </View>

          {/* Send button */}
          <TouchableOpacity style={styles.sendBtn} onPress={send} disabled={sending}>
            <Text style={styles.sendBtnText}>{sending ? 'Sending...' : 'Send Booking'}</Text>
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
    paddingBottom: 34,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textBody, marginBottom: 8, marginTop: 16 },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primaryBg, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  pickerText: { fontSize: 15, color: colors.textPrimary },
  notesInput: {
    backgroundColor: colors.primaryBg, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
    minHeight: 60, textAlignVertical: 'top',
  },
  quoteTotal: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12,
  },
  quoteTotalLabel: { fontSize: 14, color: colors.textBody },
  quoteTotalValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  sendBtn: {
    backgroundColor: colors.cta, borderRadius: radius.md, paddingVertical: 14,
    marginHorizontal: 20, marginTop: 20, alignItems: 'center',
  },
  sendBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
})
```

**Step 2: Commit**

```bash
git add handby-mobile/components/chat/BookingBottomSheet.tsx
git commit -m "feat: add BookingBottomSheet for proposing in-chat bookings"
```

---

### Task 6: ChatActionMenu Component

**Files:**
- Create: `handby-mobile/components/chat/ChatActionMenu.tsx`

**Step 1: Write the ChatActionMenu component**

A small popover-style menu triggered by the `+` button in the chat input bar. Shows "Send Quote" (always for provider) and "Book Appointment" (only when an accepted quote exists).

```typescript
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadow } from '../../lib/theme'

interface Props {
  visible: boolean
  onClose: () => void
  onSendQuote: () => void
  onBookAppointment: () => void
  canBook: boolean
}

export function ChatActionMenu({ visible, onClose, onSendQuote, onBookAppointment, canBook }: Props) {
  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.menu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => { onClose(); onSendQuote() }}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={styles.menuLabel}>Send Quote</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, !canBook && styles.menuItemDisabled]}
            onPress={() => { if (canBook) { onClose(); onBookAppointment() } }}
            disabled={!canBook}
          >
            <Ionicons name="calendar-outline" size={20} color={canBook ? colors.primary : colors.textMuted} />
            <Text style={[styles.menuLabel, !canBook && styles.menuLabelDisabled]}>Book Appointment</Text>
            {!canBook && <Text style={styles.menuHint}>Accept a quote first</Text>}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', paddingBottom: 80, paddingHorizontal: 16 },
  menu: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 8,
    ...shadow.cardRaised,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.md,
  },
  menuItemDisabled: { opacity: 0.5 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  menuLabelDisabled: { color: colors.textMuted },
  menuHint: { fontSize: 11, color: colors.textMuted, marginLeft: 'auto' },
})
```

**Step 2: Commit**

```bash
git add handby-mobile/components/chat/ChatActionMenu.tsx
git commit -m "feat: add ChatActionMenu with quote and booking actions"
```

---

### Task 7: Rewrite Chat Screen

**Files:**
- Modify: `handby-mobile/app/chat/[requestId].tsx`

**Step 1: Replace the entire chat screen**

The new version adds:
- `+` action button in the input bar (provider only)
- Message type detection: renders `QuoteCard`, `BookingCard`, or text bubble
- Real-time subscriptions to `quotes` and `appointments` for live status updates
- State tracking for `acceptedQuote` (gates booking action)
- Bottom sheets for quote and booking creation

```typescript
import { useEffect, useState, useRef, useCallback } from 'react'
import { View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { colors, radius } from '../../lib/theme'
import { QuoteCard } from '../../components/chat/QuoteCard'
import { BookingCard } from '../../components/chat/BookingCard'
import { QuoteBottomSheet } from '../../components/chat/QuoteBottomSheet'
import { BookingBottomSheet } from '../../components/chat/BookingBottomSheet'
import { ChatActionMenu } from '../../components/chat/ChatActionMenu'

interface Message {
  id: string
  sender_id: string
  content: string
  created_at: string
  type: 'text' | 'quote' | 'booking'
  metadata: { quote_id?: string; appointment_id?: string } | null
}

export default function ChatScreen() {
  const { requestId } = useLocalSearchParams<{ requestId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [request, setRequest] = useState<any>(null)
  const [acceptedQuote, setAcceptedQuote] = useState<{ id: string; total: number } | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [showQuoteSheet, setShowQuoteSheet] = useState(false)
  const [showBookingSheet, setShowBookingSheet] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const isProvider = user?.id === request?.provider_id

  const fetchAcceptedQuote = useCallback(async () => {
    if (!requestId) return
    const { data } = await supabase
      .from('quotes')
      .select('id, total')
      .eq('request_id', requestId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setAcceptedQuote(data ?? null)
  }, [requestId])

  useEffect(() => {
    if (!requestId) return

    // Fetch request details
    supabase
      .from('quote_requests')
      .select('*, profiles!quote_requests_customer_id_fkey(full_name), provider:profiles!quote_requests_provider_id_fkey(full_name)')
      .eq('id', requestId)
      .single()
      .then(({ data }) => setRequest(data))

    // Fetch messages (including type + metadata)
    supabase
      .from('messages')
      .select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as unknown as Message[]) ?? [])
        setLoading(false)
      })

    // Fetch accepted quote
    fetchAcceptedQuote()

    // Subscribe to new messages
    const msgChannel = supabase
      .channel(`chat-${requestId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` },
        (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === (payload.new as Message).id)) return prev
            return [...prev, payload.new as Message]
          })
        }
      )
      .subscribe()

    // Subscribe to quote status changes (for card updates + booking gate)
    const quoteChannel = supabase
      .channel(`chat-quotes-${requestId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'quotes', filter: `request_id=eq.${requestId}` },
        () => { fetchAcceptedQuote() }
      )
      .subscribe()

    // Subscribe to appointment status changes (for card updates)
    const apptChannel = supabase
      .channel(`chat-appts-${requestId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments', filter: `request_id=eq.${requestId}` },
        () => { /* BookingCard fetches its own data; this just ensures re-render if needed */ }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(quoteChannel)
      supabase.removeChannel(apptChannel)
    }
  }, [requestId, fetchAcceptedQuote])

  async function sendMessage() {
    if (!input.trim() || !user) return
    const content = input.trim()
    setInput('')

    await supabase.from('messages').insert({
      request_id: requestId,
      sender_id: user.id,
      content,
    })
  }

  const otherName = request
    ? (user?.id === request.customer_id ? request.provider?.full_name : request.profiles?.full_name)
    : 'Chat'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherName ?? 'Chat'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>No messages yet — start the conversation</Text>
              </View>
            }
            renderItem={({ item }) => {
              // Quote card
              if (item.type === 'quote' && item.metadata?.quote_id) {
                return <QuoteCard quoteId={item.metadata.quote_id} onStatusChange={fetchAcceptedQuote} />
              }

              // Booking card
              if (item.type === 'booking' && item.metadata?.appointment_id) {
                return <BookingCard appointmentId={item.metadata.appointment_id} />
              }

              // Text bubble (default)
              const isMe = item.sender_id === user?.id
              return (
                <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                  <Text style={[styles.bubbleText, isMe ? styles.textMe : styles.textThem]}>
                    {item.content}
                  </Text>
                  <Text style={[styles.time, isMe && styles.timeMe]}>
                    {new Date(item.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )
            }}
          />

          {/* Input bar */}
          <View style={styles.inputBar}>
            {isProvider && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => setShowMenu(true)}>
                <Ionicons name="add" size={24} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} disabled={!input.trim()}>
              <Ionicons name="send" size={22} color={input.trim() ? colors.cta : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Action menu */}
      <ChatActionMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onSendQuote={() => setShowQuoteSheet(true)}
        onBookAppointment={() => setShowBookingSheet(true)}
        canBook={!!acceptedQuote}
      />

      {/* Quote bottom sheet */}
      <QuoteBottomSheet
        visible={showQuoteSheet}
        onClose={() => setShowQuoteSheet(false)}
        requestId={requestId!}
        customerId={request?.customer_id}
      />

      {/* Booking bottom sheet */}
      <BookingBottomSheet
        visible={showBookingSheet}
        onClose={() => setShowBookingSheet(false)}
        requestId={requestId!}
        customerId={request?.customer_id}
        acceptedQuote={acceptedQuote}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.textPrimary },
  messageList: { padding: 16, paddingBottom: 8, flexGrow: 1 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 8 },
  bubbleMe: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleThem: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  textMe: { color: '#FFFFFF' },
  textThem: { color: colors.textPrimary },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  timeMe: { color: 'rgba(255,255,255,0.7)' },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 60 },
  emptyChatText: { color: colors.textMuted, fontSize: 14 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryBg,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: colors.primaryBg, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    color: colors.textPrimary, maxHeight: 100,
  },
  sendBtn: { padding: 8 },
})
```

**Step 2: Commit**

```bash
git add handby-mobile/app/chat/[requestId].tsx
git commit -m "feat: rewrite chat screen with inline quote and booking cards"
```

---

### Task 8: Install DateTimePicker & TypeScript Check

**Step 1: Install the date/time picker dependency**

```bash
cd handby-mobile && npx expo install @react-native-community/datetimepicker
```

**Step 2: Run TypeScript check**

```bash
cd handby-mobile && npx tsc --noEmit
```

Expected: no errors (or only pre-existing ones unrelated to our changes).

**Step 3: Fix any TypeScript errors and commit**

```bash
git add -A
git commit -m "chore: install datetimepicker and fix any TS issues"
```

Only run Step 3 if Step 2 found errors.

---

### Task 9: Manual Smoke Test

Test these scenarios on device/simulator:

- [ ] Chat loads normally with existing text messages
- [ ] Provider sees `+` button in input bar; customer does not
- [ ] Provider taps `+` → action menu shows "Send Quote" and "Book Appointment" (greyed out)
- [ ] Provider taps "Send Quote" → bottom sheet opens with line items form
- [ ] Provider adds 2 items, enables VAT, sends → quote card appears in chat
- [ ] Customer sees quote card with Accept/Decline buttons
- [ ] Customer taps Accept → card status changes to "Accepted", buttons disappear
- [ ] Provider taps `+` → "Book Appointment" is now enabled
- [ ] Provider taps "Book Appointment" → bottom sheet shows date/time pickers and quote total
- [ ] Provider sends booking → booking card appears in chat
- [ ] Customer sees booking card with Confirm/Decline buttons
- [ ] Customer taps Confirm → card status changes to "Confirmed"
- [ ] Bookings screen shows the new appointment
- [ ] Customer timeline shows job as "Confirmed"
- [ ] Quote card is tappable → expands to show line item breakdown
- [ ] Declining a quote lets provider send a new one
- [ ] Declining a booking lets provider send a new one
- [ ] Real-time: second device sees cards and status changes instantly
