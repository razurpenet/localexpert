import { View, Text, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Button } from '../../components/ui/Button'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <LinearGradient colors={['#0F172A', '#1E3A8A']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Increase trust{'\n'}with customers.</Text>
        <Text style={styles.title}>Manage & collect{'\n'}reviews.</Text>
        <Text style={styles.title}>Get found{'\n'}locally.</Text>
        <Text style={styles.subtitle}>We're building your free{'\n'}Handby account</Text>
      </View>

      <View style={styles.buttons}>
        <Button title="Get started" onPress={() => router.push('/(auth)/signup')} />
        <Button title="I already have an account" variant="ghost"
          onPress={() => router.push('/(auth)/login')}
          style={{ marginTop: 8 }}
        />
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  content: { flex: 1, justifyContent: 'center', gap: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', lineHeight: 36 },
  subtitle: { fontSize: 16, color: '#94A3B8', marginTop: 16, lineHeight: 24 },
  buttons: { paddingBottom: 48 },
})
