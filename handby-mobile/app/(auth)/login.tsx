import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth-context'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError(null)
    setLoading(true)
    const result = await signIn(email.trim(), password)
    if (result.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your Handby account</Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input label="Email" placeholder="you@example.com" value={email}
            onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Input label="Password" placeholder="••••••••" value={password}
            onChangeText={setPassword} secureTextEntry />

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>

          <Button title="Sign in" onPress={handleLogin} loading={loading} />
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.footer}>
          <Text style={styles.footerText}>
            Don't have an account? <Text style={styles.link}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#EFF6FF', justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#1E3A8A' },
  subtitle: { fontSize: 16, color: '#475569', marginTop: 4 },
  form: { gap: 16 },
  errorBox: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12 },
  errorText: { color: '#DC2626', fontSize: 14 },
  link: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  footer: { alignItems: 'center', marginTop: 32 },
  footerText: { color: '#475569', fontSize: 14 },
})
