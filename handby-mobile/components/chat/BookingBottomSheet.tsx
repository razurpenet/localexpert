import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { colors, radius } from '../../lib/theme'

// Only import DateTimePicker on native platforms
let DateTimePicker: any = null
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default
}

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

  function handleWebDateChange(value: string) {
    if (value) setDate(new Date(value + 'T12:00:00'))
  }

  function handleWebTimeChange(value: string) {
    if (value) {
      const [h, m] = value.split(':').map(Number)
      const t = new Date()
      t.setHours(h, m, 0, 0)
      setTime(t)
    }
  }

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

  const isWeb = Platform.OS === 'web'

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
            {isWeb ? (
              <input
                type="date"
                value={date.toISOString().split('T')[0]}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => handleWebDateChange(e.target.value)}
                style={{
                  backgroundColor: '#EFF6FF', borderRadius: 12, padding: '12px 14px',
                  fontSize: 15, color: '#1E3A8A', border: '1px solid #E0E7FF',
                  width: '100%', boxSizing: 'border-box' as any,
                }}
              />
            ) : (
              <>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)}>
                  <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                  <Text style={styles.pickerText}>{dateStr}</Text>
                </TouchableOpacity>
                {showDatePicker && Platform.OS === 'ios' && DateTimePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date()}
                    onChange={(_: any, d: Date | undefined) => { if (d) setDate(d) }}
                  />
                )}
                {showDatePicker && Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.pickerDone} onPress={() => setShowDatePicker(false)}>
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Time */}
            <Text style={styles.label}>Time</Text>
            {isWeb ? (
              <input
                type="time"
                value={`${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`}
                onChange={e => handleWebTimeChange(e.target.value)}
                style={{
                  backgroundColor: '#EFF6FF', borderRadius: 12, padding: '12px 14px',
                  fontSize: 15, color: '#1E3A8A', border: '1px solid #E0E7FF',
                  width: '100%', boxSizing: 'border-box' as any,
                }}
              />
            ) : (
              <>
                <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowTimePicker(true)}>
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text style={styles.pickerText}>{timeStr}</Text>
                </TouchableOpacity>
                {showTimePicker && Platform.OS === 'ios' && DateTimePicker && (
                  <DateTimePicker
                    value={time}
                    mode="time"
                    display="spinner"
                    onChange={(_: any, t: Date | undefined) => { if (t) setTime(t) }}
                  />
                )}
                {showTimePicker && Platform.OS === 'ios' && (
                  <TouchableOpacity style={styles.pickerDone} onPress={() => setShowTimePicker(false)}>
                    <Text style={styles.pickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </>
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

      {/* Android: render pickers outside the sheet to avoid Modal z-index conflict */}
      {!isWeb && showDatePicker && Platform.OS === 'android' && DateTimePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(_: any, d: Date | undefined) => { setShowDatePicker(false); if (d) setDate(d) }}
        />
      )}
      {!isWeb && showTimePicker && Platform.OS === 'android' && DateTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={(_: any, t: Date | undefined) => { setShowTimePicker(false); if (t) setTime(t) }}
        />
      )}
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
  pickerDone: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 12 },
  pickerDoneText: { fontSize: 15, fontWeight: '600', color: colors.primary },
})
