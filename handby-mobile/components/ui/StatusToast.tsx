import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface StatusToastProps {
  visible: boolean
  providerName: string
  status: string
  onDismiss: () => void
}

const STATUS_MESSAGES: Record<string, { message: string; icon: string; bg: string; text: string }> = {
  accepted:    { message: 'accepted your request',    icon: 'checkmark-circle',      bg: '#DCFCE7', text: '#16A34A' },
  declined:    { message: 'declined your request',    icon: 'close-circle',          bg: '#FEE2E2', text: '#DC2626' },
  confirmed:   { message: 'confirmed your job',       icon: 'calendar',              bg: '#DBEAFE', text: '#1E40AF' },
  en_route:    { message: 'is on their way',          icon: 'navigate',              bg: '#E0E7FF', text: '#4F46E5' },
  in_progress: { message: 'has started your job',     icon: 'construct',             bg: '#FEF3C7', text: '#D97706' },
  completed:   { message: 'has completed your job',   icon: 'checkmark-done-circle', bg: '#DCFCE7', text: '#16A34A' },
  cancelled:   { message: 'cancelled the job',        icon: 'ban',                   bg: '#E0E7FF', text: '#475569' },
}

export function StatusToast({ visible, providerName, status, onDismiss }: StatusToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }).start()
      const timer = setTimeout(onDismiss, 4000)
      return () => clearTimeout(timer)
    } else {
      Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }).start()
    }
  }, [visible])

  if (!visible) return null

  const config = STATUS_MESSAGES[status] ?? STATUS_MESSAGES.accepted

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <TouchableOpacity style={[styles.toast, { backgroundColor: config.bg }]} onPress={onDismiss} activeOpacity={0.9}>
        <Ionicons name={config.icon as any} size={22} color={config.text} />
        <View style={styles.textCol}>
          <Text style={[styles.title, { color: config.text }]}>{providerName}</Text>
          <Text style={[styles.message, { color: config.text }]}>{config.message}</Text>
        </View>
        <Ionicons name="close" size={18} color={config.text} />
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 50, left: 16, right: 16, zIndex: 999 },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 5,
  },
  textCol: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700' },
  message: { fontSize: 13, marginTop: 1 },
})
