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
