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

    // Subscribe to status changes so the other party sees updates in real-time
    const channel = supabase
      .channel(`appt-${appointmentId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `id=eq.${appointmentId}` },
        (payload) => {
          setAppt(prev => prev ? { ...prev, status: (payload.new as any).status } : null)
          onStatusChange?.()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
