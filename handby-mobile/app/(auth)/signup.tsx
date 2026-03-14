import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { validatePassword, sanitize } from '../../lib/validation'

type Role = 'customer' | 'provider'

export default function SignupScreen() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [role, setRole] = useState<Role>('customer')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSignup() {
    setError(null)
    const cleanName = sanitize(fullName, 100)
    if (!cleanName) { setError('Please enter your full name.'); return }
    if (!email.trim()) { setError('Please enter your email address.'); return }
    const pw = validatePassword(password)
    if (!pw.valid) { setError(pw.message); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    const result = await signUp(email.trim(), password, cleanName, role)
    if (result.error) {
      setError(result.error)
    } else {
      setEmailSent(true)
    }
    setLoading(false)
  }

  if (emailSent) {
    return (
      <View style={styles.confirmContainer}>
        <View style={styles.confirmCard}>
          <View style={styles.confirmIconWrap}>
            <Ionicons name="mail-outline" size={48} color="#1E40AF" />
          </View>
          <Text style={styles.confirmTitle}>Check your email</Text>
          <Text style={styles.confirmMessage}>
            We've sent a confirmation link to{'\n'}
            <Text style={{ fontWeight: '700' }}>{email.trim()}</Text>
          </Text>
          <Text style={styles.confirmHint}>
            Tap the link in the email to activate your account, then come back here to sign in.
          </Text>
          <Button title="Go to Sign In" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </View>
    )
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

          <View>
            <Input label="Password *" placeholder="Min 8 characters" value={password}
              onChangeText={setPassword} secureTextEntry={!showPassword} />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Input label="Confirm password *" placeholder="Re-enter your password" value={confirmPassword}
            onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />

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
  roleActive: { borderColor: '#1E40AF', backgroundColor: '#EFF6FF' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#94A3B8' },
  radioActive: { borderColor: '#1E40AF', backgroundColor: '#1E40AF' },
  roleLabel: { fontSize: 15, fontWeight: '500', color: '#1E3A8A' },
  form: { gap: 16 },
  eyeBtn: { position: 'absolute', right: 14, top: 34, padding: 4 },
  errorBox: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12 },
  errorText: { color: '#DC2626', fontSize: 14 },
  link: { color: '#1E40AF', fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 32, paddingBottom: 48 },
  footerText: { color: '#475569', fontSize: 14 },
  confirmContainer: { flex: 1, backgroundColor: '#EFF6FF', justifyContent: 'center', padding: 24 },
  confirmCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', shadowColor: '#1E40AF', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 2 },
  confirmIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  confirmTitle: { fontSize: 22, fontWeight: '700', color: '#1E3A8A', marginBottom: 12 },
  confirmMessage: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  confirmHint: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
})
