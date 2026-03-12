import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface CheckItem {
  label: string
  done: boolean
}

interface Props {
  items: CheckItem[]
}

export function OnboardingChecklist({ items }: Props) {
  const completed = items.filter(i => i.done).length

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Show customers you're the right choice</Text>
      <Text style={styles.subtitle}>{completed} of {items.length} completed</Text>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(completed / items.length) * 100}%` }]} />
      </View>

      {items.map((item, i) => (
        <View key={i} style={styles.item}>
          <Ionicons
            name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={item.done ? '#22C55E' : '#94A3B8'}
          />
          <Text style={[styles.itemLabel, item.done && styles.itemDone]}>{item.label}</Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginHorizontal: 16, marginTop: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#1E3A8A' },
  subtitle: { fontSize: 13, color: '#475569', marginTop: 4, marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#E0E7FF', borderRadius: 3, marginBottom: 16 },
  progressFill: { height: 6, backgroundColor: '#22C55E', borderRadius: 3 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  itemLabel: { fontSize: 15, color: '#1E3A8A' },
  itemDone: { color: '#94A3B8', textDecorationLine: 'line-through' },
})
