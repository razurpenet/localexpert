import { useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReset() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>We've sent a password reset link to {email}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset password</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>
      <View style={styles.form}>
        {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
        <Input label="Email" placeholder="you@example.com" value={email}
          onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <Button title="Send reset link" onPress={handleReset} loading={loading} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#EFF6FF', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#1E3A8A' },
  subtitle: { fontSize: 14, color: '#475569', marginTop: 4, marginBottom: 24 },
  form: { gap: 16 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12 },
  errorText: { color: '#DC2626', fontSize: 14 },
})
