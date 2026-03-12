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
