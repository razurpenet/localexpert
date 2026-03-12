import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export function JoinProBanner() {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="briefcase" size={24} color="#1E40AF" />
      </View>
      <Text style={styles.title}>Are you a professional?</Text>
      <Text style={styles.subtitle}>Create your free profile and start getting jobs today</Text>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Learn more</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16, marginTop: 24, marginBottom: 32,
    backgroundColor: '#EFF6FF', borderRadius: 16, padding: 24, alignItems: 'center',
  },
  iconCircle: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1E3A8A' },
  subtitle: { fontSize: 14, color: '#475569', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  button: {
    backgroundColor: '#F97316', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
})
