import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth-context'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

type Role = 'customer' | 'provider'

export default function SignupScreen() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [role, setRole] = useState<Role>('customer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setError(null)
    setLoading(true)
    const result = await signUp(email.trim(), password, fullName.trim(), role)
    if (result.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create your free account</Text>
        <Text style={styles.subtitle}>This information allows us to tailor your experience</Text>

        {/* Role selector */}
        <View style={styles.roleRow}>
          <TouchableOpacity
            style={[styles.roleCard, role === 'customer' && styles.roleActive]}
            onPress={() => setRole('customer')}
          >
            <View style={[styles.radio, role === 'customer' && styles.radioActive]} />
            <Text style={styles.roleLabel}>Find services</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roleCard, role === 'provider' && styles.roleActive]}
            onPress={() => setRole('provider')}
          >
            <View style={[styles.radio, role === 'provider' && styles.radioActive]} />
            <Text style={styles.roleLabel}>Offer services</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Input label="Full name *" placeholder="John Smith" value={fullName}
            onChangeText={setFullName} autoCapitalize="words" />

          <Input label="Email address *" placeholder="you@example.com" value={email}
            onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <Input label="Password *" placeholder="Min 8 characters" value={password}
            onChangeText={setPassword} secureTextEntry />

          <Button title="Create Account" onPress={handleSignup} loading={loading} />
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.link}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, backgroundColor: '#EFF6FF' },
  title: { fontSize: 26, fontWeight: '700', color: '#1E3A8A', marginTop: 60 },
  subtitle: { fontSize: 14, color: '#475569', marginTop: 4, marginBottom: 24 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E0E7FF', borderRadius: 12,
    padding: 16, backgroundColor: '#FFFFFF',
  },
  roleActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#94A3B8' },
  radioActive: { borderColor: '#2563EB', backgroundColor: '#2563EB' },
  roleLabel: { fontSize: 15, fontWeight: '500', color: '#1E3A8A' },
  form: { gap: 16 },
  errorBox: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12 },
  errorText: { color: '#DC2626', fontSize: 14 },
  link: { color: '#2563EB', fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 32, paddingBottom: 48 },
  footerText: { color: '#475569', fontSize: 14 },
})
