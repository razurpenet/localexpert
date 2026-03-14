# Handby Mobile App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a native iOS + Android mobile app for Handby.uk using React Native + Expo, reusing the existing Supabase backend with zero schema changes.

**Architecture:** Expo Router (file-based routing) with tab navigation for both customer and provider roles. All data flows through the existing Supabase PostgreSQL database, auth, and storage. The mobile app is a separate project (`handby-mobile/`) that shares the same backend as the web app. UI follows the provided mockups — blue/white colour scheme, card-based layouts, bottom tab navigation.

**Tech Stack:** React Native, Expo SDK 53+, Expo Router v4, @supabase/supabase-js, @react-native-async-storage/async-storage, expo-image-picker, expo-location, react-native-reanimated

---

## Project Structure

```
handby-mobile/
├── app/
│   ├── _layout.tsx                   ← Root layout + auth context provider
│   ├── (auth)/
│   │   ├── _layout.tsx               ← Auth stack layout
│   │   ├── welcome.tsx               ← Onboarding splash (Checkatrade-style)
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   └── forgot-password.tsx
│   ├── (customer)/
│   │   ├── _layout.tsx               ← Customer tab layout (Home, Search, Messages, Profile)
│   │   ├── index.tsx                 ← Customer home (mockup: search hero, categories, nearby pros)
│   │   ├── search.tsx                ← Search results with filters
│   │   ├── bookings.tsx              ← My Requests list
│   │   └── profile.tsx               ← Profile / settings / logout
│   ├── (provider)/
│   │   ├── _layout.tsx               ← Provider tab layout (Home, Reviews, Photos, More)
│   │   ├── index.tsx                 ← Provider dashboard (onboarding checklist)
│   │   ├── reviews.tsx               ← Review requests (copy link, request review)
│   │   ├── photos.tsx                ← Portfolio management
│   │   └── more.tsx                  ← Settings, help, preferences, logout
│   ├── provider/[id].tsx             ← Public provider profile (shared)
│   └── chat/[requestId].tsx          ← Chat screen (shared)
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── StarRating.tsx
│   │   └── Avatar.tsx
│   ├── home/
│   │   ├── SearchHero.tsx            ← Dark gradient search card
│   │   ├── CategoryGrid.tsx          ← Popular categories circles
│   │   ├── NearbyPros.tsx            ← Horizontal scroll cards
│   │   └── PopularServices.tsx       ← Service image cards
│   ├── search/
│   │   ├── FilterChips.tsx           ← Highest rated, Available, Price
│   │   └── ProviderResultCard.tsx    ← Search result card
│   ├── provider/
│   │   ├── OnboardingChecklist.tsx   ← 5 quick wins checklist
│   │   ├── JoinProBanner.tsx         ← "Are you a professional?" CTA
│   │   └── ProviderProfileHeader.tsx
│   └── shared/
│       ├── TabBar.tsx                ← Custom bottom tab bar
│       └── LoadingScreen.tsx
├── lib/
│   ├── supabase.ts                   ← Supabase client (AsyncStorage)
│   ├── auth-context.tsx              ← Auth provider + useAuth hook
│   └── types.ts                      ← Shared TypeScript types
├── assets/
│   ├── icon.png                      ← 1024x1024 app icon
│   ├── splash.png                    ← Splash screen
│   └── adaptive-icon.png
├── app.json
├── eas.json
├── .env
├── package.json
└── tsconfig.json
```

---

## Design Tokens (from mockups)

```
Primary Blue:     #2563EB (buttons, links, active tabs)
Dark Blue:        #1E3A5F (search hero gradient)
Background:       #F8F9FB (light grey screens)
Card:             #FFFFFF
Text Primary:     #1A1A2E
Text Secondary:   #6B7280
Success Green:    #22C55E (available badge, vetted badge)
Star Yellow:      #FACC15
Danger Red:       #EF4444
Border:           #E5E7EB
Tab Active:       #2563EB
Tab Inactive:     #9CA3AF
Border Radius:    16px (cards), 12px (inputs), 24px (buttons full-width)
Font:             System default (San Francisco iOS, Roboto Android)
```

---

## Task 1: Project Bootstrap

**Files:**
- Create: `handby-mobile/package.json`
- Create: `handby-mobile/app.json`
- Create: `handby-mobile/eas.json`
- Create: `handby-mobile/tsconfig.json`
- Create: `handby-mobile/.env`

**Step 1: Create Expo project**

```bash
cd C:/Users/rashy/Desktop
npx create-expo-app@latest handby-mobile --template tabs
cd handby-mobile
```

**Step 2: Install core dependencies**

```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage
npx expo install expo-image-picker expo-location expo-secure-store
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install expo-linear-gradient
```

**Step 3: Configure app.json**

Replace contents of `app.json`:

```json
{
  "expo": {
    "name": "Handby",
    "slug": "handby",
    "version": "1.0.0",
    "scheme": "handby",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2563EB"
    },
    "ios": {
      "bundleIdentifier": "uk.handby.app",
      "buildNumber": "1",
      "supportsTablet": false,
      "infoPlist": {
        "NSCameraUsageDescription": "Upload portfolio photos",
        "NSPhotoLibraryUsageDescription": "Select portfolio photos",
        "NSLocationWhenInUseUsageDescription": "Find professionals near you"
      }
    },
    "android": {
      "package": "uk.handby.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2563EB"
      },
      "permissions": ["ACCESS_FINE_LOCATION", "CAMERA", "READ_EXTERNAL_STORAGE"]
    },
    "plugins": [
      "expo-router",
      "expo-image-picker",
      "expo-location",
      "expo-secure-store"
    ]
  }
}
```

**Step 4: Create `.env`**

```
EXPO_PUBLIC_SUPABASE_URL=https://gyuthqqoqvpeqauluvbb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dXRocXFvcXZwZXFhdWx1dmJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTUwMTEsImV4cCI6MjA4ODA3MTAxMX0.ylUYLheY2DeWyCxC1tx-16jduCR0lpHgnt6mv_2njbI
```

**Step 5: Create `eas.json`**

```json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "YOUR_APPLE_ID",
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}
```

**Step 6: Verify project runs**

```bash
npx expo start
```
Expected: Metro bundler starts, QR code displayed, app loads in Expo Go.

**Step 7: Commit**

```bash
git init && git add -A && git commit -m "feat: bootstrap Expo project for Handby mobile"
```

---

## Task 2: Supabase Client + Auth Context

**Files:**
- Create: `handby-mobile/lib/supabase.ts`
- Create: `handby-mobile/lib/auth-context.tsx`
- Create: `handby-mobile/lib/types.ts`

**Step 1: Create Supabase client**

```typescript
// lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Auto-refresh session when app comes to foreground
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})
```

**Step 2: Create auth context**

```typescript
// lib/auth-context.tsx
import { createContext, useContext, useEffect, useState } from 'react'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface Profile {
  id: string
  role: 'customer' | 'provider'
  full_name: string
  avatar_url: string | null
  city: string | null
  postcode: string | null
  bio: string | null
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, fullName: string, role: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, fullName: string, role: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    })
    return { error: error?.message ?? null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
  }

  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user.id)
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
```

**Step 3: Create shared types**

```typescript
// lib/types.ts
export type UserRole = 'customer' | 'provider'
export type PriceType = 'fixed' | 'hourly' | 'quote'
export type RequestStatus = 'pending' | 'accepted' | 'declined' | 'completed'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  avatar_url: string | null
  phone: string | null
  city: string | null
  postcode: string | null
  bio: string | null
  lat: number | null
  lng: number | null
  created_at: string
}

export interface ProviderDetails {
  id: string
  business_name: string
  is_available: boolean
  years_exp: number | null
  website_url: string | null
  avg_rating: number
  review_count: number
}

export interface Category {
  id: number
  name: string
  slug: string
  icon: string | null
}

export interface Service {
  id: string
  provider_id: string
  category_id: number
  title: string
  description: string | null
  price_from: number | null
  price_type: PriceType | null
  is_active: boolean
  categories?: { name: string }
}

export interface QuoteRequest {
  id: string
  customer_id: string
  provider_id: string
  service_id: string | null
  message: string
  status: RequestStatus
  created_at: string
}

export interface Review {
  id: string
  request_id: string
  reviewer_id: string
  provider_id: string
  rating: number
  body: string | null
  created_at: string
}

export interface ProviderCardData {
  id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  provider_details: ProviderDetails | null
  primary_category?: string | null
  distance_km?: number | null
  min_price?: number | null
}
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add Supabase client, auth context, and shared types"
```

---

## Task 3: Root Layout + Auth Routing

**Files:**
- Create: `handby-mobile/app/_layout.tsx`
- Create: `handby-mobile/app/(auth)/_layout.tsx`
- Create: `handby-mobile/app/(auth)/welcome.tsx`
- Create: `handby-mobile/app/(auth)/login.tsx`
- Create: `handby-mobile/app/(auth)/signup.tsx`
- Create: `handby-mobile/app/(auth)/forgot-password.tsx`
- Create: `handby-mobile/components/ui/Button.tsx`
- Create: `handby-mobile/components/ui/Input.tsx`

**Step 1: Root layout with auth guard**

```tsx
// app/_layout.tsx
import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '../lib/auth-context'
import { View, ActivityIndicator } from 'react-native'

function RootGuard() {
  const { session, profile, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuth = segments[0] === '(auth)'

    if (!session && !inAuth) {
      router.replace('/(auth)/welcome')
    } else if (session && profile && inAuth) {
      if (profile.role === 'provider') {
        router.replace('/(provider)')
      } else {
        router.replace('/(customer)')
      }
    }
  }, [session, profile, loading, segments])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    )
  }

  return <Slot />
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootGuard />
    </AuthProvider>
  )
}
```

**Step 2: Auth stack layout**

```tsx
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  )
}
```

**Step 3: UI components — Button**

```tsx
// components/ui/Button.tsx
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native'

interface ButtonProps {
  onPress: () => void
  title: string
  variant?: 'primary' | 'outline' | 'ghost'
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}

export function Button({ onPress, title, variant = 'primary', loading, disabled, style }: ButtonProps) {
  const isDisabled = loading || disabled

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        isDisabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : '#2563EB'} size="small" />
      ) : (
        <Text style={[
          styles.text,
          variant === 'primary' && styles.primaryText,
          variant === 'outline' && styles.outlineText,
          variant === 'ghost' && styles.ghostText,
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#2563EB' },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#2563EB' },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: '#FFFFFF' },
  outlineText: { color: '#2563EB' },
  ghostText: { color: '#2563EB' },
})
```

**Step 4: UI components — Input**

```tsx
// components/ui/Input.tsx
import { View, TextInput, Text, StyleSheet, TextInputProps } from 'react-native'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 14, fontWeight: '500', color: '#1A1A2E' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A2E',
  },
  inputError: { borderColor: '#EF4444' },
  error: { fontSize: 12, color: '#EF4444' },
})
```

**Step 5: Welcome screen (onboarding splash — matches Checkatrade mockup)**

```tsx
// app/(auth)/welcome.tsx
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Button } from '../../components/ui/Button'

const { height } = Dimensions.get('window')

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <LinearGradient colors={['#0F172A', '#1E3A5F']} style={styles.container}>
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
```

**Step 6: Login screen**

```tsx
// app/(auth)/login.tsx
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
    const { error } = await signIn(email.trim(), password)
    if (error) { setError(error); setLoading(false) }
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
  container: { flexGrow: 1, padding: 24, backgroundColor: '#F8F9FB', justifyContent: 'center' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 16, color: '#6B7280', marginTop: 4 },
  form: { gap: 16 },
  errorBox: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12 },
  errorText: { color: '#DC2626', fontSize: 14 },
  link: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  footer: { alignItems: 'center', marginTop: 32 },
  footerText: { color: '#6B7280', fontSize: 14 },
})
```

**Step 7: Signup screen (with role selector — matches mockup)**

```tsx
// app/(auth)/signup.tsx
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
    const { error } = await signUp(email.trim(), password, fullName.trim(), role)
    if (error) { setError(error); setLoading(false) }
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
  container: { flexGrow: 1, padding: 24, backgroundColor: '#F8F9FB' },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A2E', marginTop: 60 },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 24 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 16, backgroundColor: '#FFFFFF',
  },
  roleActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB' },
  radioActive: { borderColor: '#2563EB', backgroundColor: '#2563EB' },
  roleLabel: { fontSize: 15, fontWeight: '500', color: '#1A1A2E' },
  form: { gap: 16 },
  errorBox: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, padding: 12 },
  errorText: { color: '#DC2626', fontSize: 14 },
  link: { color: '#2563EB', fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 32, paddingBottom: 48 },
  footerText: { color: '#6B7280', fontSize: 14 },
})
```

**Step 8: Forgot password screen**

```tsx
// app/(auth)/forgot-password.tsx
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
  container: { flex: 1, padding: 24, backgroundColor: '#F8F9FB', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#1A1A2E' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 4, marginBottom: 24 },
  form: { gap: 16 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12 },
  errorText: { color: '#DC2626', fontSize: 14 },
})
```

**Step 9: Commit**

```bash
git add -A && git commit -m "feat: add auth screens — welcome, login, signup, forgot password"
```

---

## Task 4: Customer Tab Layout + Home Screen

**Files:**
- Create: `handby-mobile/app/(customer)/_layout.tsx`
- Create: `handby-mobile/app/(customer)/index.tsx`
- Create: `handby-mobile/components/home/SearchHero.tsx`
- Create: `handby-mobile/components/home/CategoryGrid.tsx`
- Create: `handby-mobile/components/home/NearbyPros.tsx`
- Create: `handby-mobile/components/provider/JoinProBanner.tsx`
- Create: `handby-mobile/components/ui/Avatar.tsx`

**Step 1: Customer tab layout (matches mockup bottom tabs: Home, Search, Bookings, Profile)**

```tsx
// app/(customer)/_layout.tsx
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

export default function CustomerLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#2563EB',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopColor: '#E5E7EB',
        height: 85,
        paddingBottom: 20,
        paddingTop: 8,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
      }} />
      <Tabs.Screen name="search" options={{
        title: 'Search',
        tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
      }} />
      <Tabs.Screen name="bookings" options={{
        title: 'Bookings',
        tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Profile',
        tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
      }} />
    </Tabs>
  )
}
```

**Step 2: Avatar component**

```tsx
// components/ui/Avatar.tsx
import { Image, View, Text, StyleSheet } from 'react-native'

interface AvatarProps {
  uri: string | null
  name: string
  size?: number
}

export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  if (uri) {
    return <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]} />
  }

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  image: { backgroundColor: '#E2E8F0' },
  fallback: { backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#475569', fontWeight: '700' },
})
```

**Step 3: SearchHero component (dark gradient card from mockup)**

```tsx
// components/home/SearchHero.tsx
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

export function SearchHero() {
  const router = useRouter()

  return (
    <LinearGradient colors={['#1E293B', '#334155']} style={styles.container}>
      <Text style={styles.title}>What do you need{'\n'}help with?</Text>
      <TouchableOpacity style={styles.searchBar} onPress={() => router.push('/(customer)/search')}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <Text style={styles.placeholder}>Search for services...</Text>
      </TouchableOpacity>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', lineHeight: 30, marginBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
  },
  placeholder: { fontSize: 16, color: '#9CA3AF' },
})
```

**Step 4: CategoryGrid component (circular icons from mockup)**

```tsx
// components/home/CategoryGrid.tsx
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'

const CATEGORIES = [
  { slug: 'plumbing', name: 'Plumber', icon: 'construct' as const, color: '#3B82F6' },
  { slug: 'electrical', name: 'Electrician', icon: 'flash' as const, color: '#F59E0B' },
  { slug: 'cleaning', name: 'Cleaner', icon: 'sparkles' as const, color: '#10B981' },
  { slug: 'painting', name: 'Painter', icon: 'color-palette' as const, color: '#8B5CF6' },
  { slug: 'pest-control', name: 'Pest Control', icon: 'bug' as const, color: '#EF4444' },
  { slug: 'gardening', name: 'Other', icon: 'ellipsis-horizontal' as const, color: '#6B7280' },
]

export function CategoryGrid() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Popular Categories</Text>
        <TouchableOpacity onPress={() => router.push('/(customer)/search')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.slug} style={styles.item}
            onPress={() => router.push({ pathname: '/(customer)/search', params: { category: cat.slug } })}>
            <View style={[styles.circle, { backgroundColor: cat.color + '15' }]}>
              <Ionicons name={cat.icon} size={24} color={cat.color} />
            </View>
            <Text style={styles.label}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginTop: 28, paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
  scroll: { gap: 20 },
  item: { alignItems: 'center', gap: 8 },
  circle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
})
```

**Step 5: NearbyPros component (horizontal scroll cards from mockup)**

```tsx
// components/home/NearbyPros.tsx
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '../ui/Avatar'

interface NearbyProvider {
  id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  provider_details: {
    business_name: string
    avg_rating: number
    is_available: boolean
  }
}

export function NearbyPros() {
  const router = useRouter()
  const [providers, setProviders] = useState<NearbyProvider[]>([])

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url, city, provider_details!inner(business_name, avg_rating, is_available)')
      .eq('role', 'provider')
      .eq('provider_details.is_available', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data) setProviders(data.map(p => ({
          ...p,
          provider_details: Array.isArray(p.provider_details) ? p.provider_details[0] : p.provider_details,
        })) as NearbyProvider[])
      })
  }, [])

  if (providers.length === 0) return null

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nearby Professionals</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {providers.map((p) => (
          <TouchableOpacity key={p.id} style={styles.card}
            onPress={() => router.push(`/provider/${p.id}`)}>
            <Avatar uri={p.avatar_url} name={p.full_name} size={80} />
            {p.provider_details.is_available && <View style={styles.vetted}><Text style={styles.vettedText}>Vetted</Text></View>}
            <Text style={styles.name} numberOfLines={1}>{p.provider_details.business_name}</Text>
            <View style={styles.meta}>
              <Text style={styles.city} numberOfLines={1}>{p.city ?? 'UK'}</Text>
              {p.provider_details.avg_rating > 0 && (
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color="#FACC15" />
                  <Text style={styles.rating}>{Number(p.provider_details.avg_rating).toFixed(1)}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginTop: 28, paddingLeft: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  scroll: { gap: 12, paddingRight: 16 },
  card: {
    width: 160, backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  vetted: { backgroundColor: '#22C55E', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  vettedText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '600', color: '#1A1A2E', textAlign: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  city: { fontSize: 12, color: '#6B7280' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  rating: { fontSize: 12, fontWeight: '600', color: '#F59E0B' },
})
```

**Step 6: JoinProBanner (matches mockup CTA)**

```tsx
// components/provider/JoinProBanner.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

export function JoinProBanner() {
  const router = useRouter()

  return (
    <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.container}>
      <Text style={styles.title}>Are you a professional?</Text>
      <Text style={styles.subtitle}>Grow your business by finding local clients looking for your services.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(auth)/signup')}>
        <Text style={styles.buttonText}>Join as a Pro</Text>
      </TouchableOpacity>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 28, borderRadius: 20, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#DBEAFE', marginTop: 6, lineHeight: 20 },
  button: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, alignSelf: 'flex-start', marginTop: 16 },
  buttonText: { color: '#2563EB', fontSize: 14, fontWeight: '700' },
})
```

**Step 7: Customer home screen (assembles all sections from mockup)**

```tsx
// app/(customer)/index.tsx
import { ScrollView, View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { Avatar } from '../../components/ui/Avatar'
import { SearchHero } from '../../components/home/SearchHero'
import { CategoryGrid } from '../../components/home/CategoryGrid'
import { NearbyPros } from '../../components/home/NearbyPros'
import { JoinProBanner } from '../../components/provider/JoinProBanner'

export default function CustomerHomeScreen() {
  const { profile } = useAuth()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Header bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar uri={profile?.avatar_url ?? null} name={profile?.full_name ?? 'U'} size={44} />
            <View>
              <Text style={styles.greeting}>Hello, {firstName}</Text>
              <Text style={styles.location}>{profile?.city ?? 'United Kingdom'}</Text>
            </View>
          </View>
          <Ionicons name="notifications-outline" size={24} color="#1A1A2E" />
        </View>

        <SearchHero />
        <CategoryGrid />
        <JoinProBanner />
        <NearbyPros />

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FB' },
  scroll: { paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 18, fontWeight: '700', color: '#1A1A2E' },
  location: { fontSize: 13, color: '#6B7280', marginTop: 1 },
})
```

**Step 8: Commit**

```bash
git add -A && git commit -m "feat: add customer tab layout and home screen with search hero, categories, nearby pros"
```

---

## Task 5: Search Screen with Filters

**Files:**
- Create: `handby-mobile/app/(customer)/search.tsx`
- Create: `handby-mobile/components/search/FilterChips.tsx`
- Create: `handby-mobile/components/search/ProviderResultCard.tsx`

**Step 1: FilterChips**

```tsx
// components/search/FilterChips.tsx
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface FilterChipsProps {
  active: string
  onSelect: (filter: string) => void
}

const FILTERS = [
  { key: 'rating', label: 'Highest rated', icon: 'star' as const },
  { key: 'available', label: 'Available now', icon: 'checkmark-circle' as const },
  { key: 'price', label: 'Price', icon: 'options' as const },
]

export function FilterChips({ active, onSelect }: FilterChipsProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      {FILTERS.map((f) => (
        <TouchableOpacity
          key={f.key}
          style={[styles.chip, active === f.key && styles.chipActive]}
          onPress={() => onSelect(active === f.key ? '' : f.key)}
        >
          <Ionicons name={f.icon} size={14} color={active === f.key ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.label, active === f.key && styles.labelActive]}>{f.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
  },
  chipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  label: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  labelActive: { color: '#FFFFFF' },
})
```

**Step 2: ProviderResultCard (matches search mockup — horizontal card with avatar, rating, price)**

```tsx
// components/search/ProviderResultCard.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Avatar } from '../ui/Avatar'
import { ProviderCardData } from '../../lib/types'

export function ProviderResultCard({ provider }: { provider: ProviderCardData }) {
  const router = useRouter()
  const d = provider.provider_details

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/provider/${provider.id}`)} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.avatarWrap}>
          <Avatar uri={provider.avatar_url} name={provider.full_name} size={72} />
          {d?.is_available && <View style={styles.dot} />}
        </View>

        <View style={styles.info}>
          {d?.is_available && <Text style={styles.availBadge}>AVAILABLE NOW</Text>}
          <Text style={styles.name} numberOfLines={1}>{d?.business_name ?? provider.full_name}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {provider.full_name} {provider.primary_category ? `• ${provider.primary_category}` : ''}
          </Text>
          <View style={styles.statsRow}>
            <Ionicons name="star" size={14} color="#FACC15" />
            <Text style={styles.stat}>
              {d && d.avg_rating > 0 ? `${Number(d.avg_rating).toFixed(1)} (${d.review_count})` : '0 reviews'}
            </Text>
            {provider.min_price && (
              <Text style={styles.price}>from <Text style={styles.priceValue}>£{provider.min_price}</Text></Text>
            )}
          </View>
        </View>

        <Ionicons name="heart-outline" size={22} color="#D1D5DB" style={styles.heart} />
      </View>

      <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/provider/${provider.id}`)}>
        <Text style={styles.viewBtnText}>View Profile</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', gap: 14 },
  avatarWrap: { position: 'relative' },
  dot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#22C55E', borderWidth: 2, borderColor: '#FFFFFF' },
  info: { flex: 1, gap: 2 },
  availBadge: { fontSize: 10, fontWeight: '700', color: '#22C55E', letterSpacing: 0.5 },
  name: { fontSize: 16, fontWeight: '700', color: '#1A1A2E' },
  meta: { fontSize: 13, color: '#6B7280' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  stat: { fontSize: 13, color: '#6B7280' },
  price: { fontSize: 13, color: '#6B7280', marginLeft: 'auto' },
  priceValue: { fontSize: 17, fontWeight: '700', color: '#1A1A2E' },
  heart: { position: 'absolute', top: 0, right: 0 },
  viewBtn: { backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 14 },
  viewBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
})
```

**Step 3: Search screen (full search with text + filters)**

```tsx
// app/(customer)/search.tsx
import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, FlatList, StyleSheet, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../../lib/supabase'
import { FilterChips } from '../../components/search/FilterChips'
import { ProviderResultCard } from '../../components/search/ProviderResultCard'
import { ProviderCardData } from '../../lib/types'

export default function SearchScreen() {
  const params = useLocalSearchParams<{ category?: string }>()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('')
  const [providers, setProviders] = useState<ProviderCardData[]>([])
  const [loading, setLoading] = useState(true)

  const search = useCallback(async () => {
    setLoading(true)

    let q = supabase
      .from('profiles')
      .select('id, full_name, avatar_url, city, provider_details!inner(business_name, is_available, avg_rating, review_count)')
      .eq('role', 'provider')

    if (query.trim()) q = q.textSearch('fts', query.trim(), { type: 'plain' })
    if (filter === 'available') q = q.eq('provider_details.is_available', true)

    const { data } = await q.limit(48)

    let results: ProviderCardData[] = (data ?? []).map((p: any) => ({
      ...p,
      provider_details: Array.isArray(p.provider_details) ? p.provider_details[0] : p.provider_details,
      primary_category: null,
      min_price: null,
    }))

    // Fetch primary category + min price
    const enriched = await Promise.all(results.map(async (p) => {
      const { data: svc } = await supabase
        .from('services')
        .select('price_from, categories(name)')
        .eq('provider_id', p.id)
        .eq('is_active', true)
        .order('price_from', { ascending: true, nullsFirst: false })
        .limit(1)
        .single()

      return {
        ...p,
        primary_category: (svc?.categories as any)?.name ?? null,
        min_price: svc?.price_from ?? null,
      }
    }))

    if (filter === 'rating') enriched.sort((a, b) => (b.provider_details?.avg_rating ?? 0) - (a.provider_details?.avg_rating ?? 0))
    if (filter === 'price') enriched.sort((a, b) => (a.min_price ?? 999) - (b.min_price ?? 999))

    setProviders(enriched)
    setLoading(false)
  }, [query, filter])

  useEffect(() => { search() }, [search])

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Handby.uk</Text>
        <Ionicons name="notifications-outline" size={24} color="#1A1A2E" />
      </View>

      {/* Search bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          placeholder="Plumbing"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={search}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Ionicons name="close-circle" size={20} color="#9CA3AF" onPress={() => { setQuery(''); search() }} />
        )}
      </View>

      <FilterChips active={filter} onSelect={setFilter} />

      {/* Results header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsLabel}>SEARCH RESULTS</Text>
        <Text style={styles.resultsCount}>{providers.length} professionals found</Text>
      </View>

      {/* Results list */}
      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={providers}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <ProviderResultCard provider={item} />}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No providers found. Try a different search.</Text>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F9FB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A2E' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, marginHorizontal: 16,
    paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB',
  },
  input: { flex: 1, fontSize: 16, color: '#1A1A2E' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  resultsLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5 },
  resultsCount: { fontSize: 11, color: '#9CA3AF' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 60, fontSize: 15 },
})
```

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add search screen with filter chips and provider result cards"
```

---

## Task 6: Bookings + Profile Screens (Customer)

**Files:**
- Create: `handby-mobile/app/(customer)/bookings.tsx`
- Create: `handby-mobile/app/(customer)/profile.tsx`

*Code follows the same Supabase query patterns from the web app's customer requests and settings pages. Queries `quote_requests` joined with `profiles` and `services`.*

**Commit:** `"feat: add customer bookings and profile screens"`

---

## Task 7: Provider Tab Layout + Dashboard

**Files:**
- Create: `handby-mobile/app/(provider)/_layout.tsx`
- Create: `handby-mobile/app/(provider)/index.tsx`
- Create: `handby-mobile/components/provider/OnboardingChecklist.tsx`

*Provider home matches Checkatrade mockup: "Show customers you're the right choice" card with 5 quick wins checklist (logo, cover photo, services, reviews, photos). Bottom tabs: Home, Get vetted, Reviews, Photos, More.*

**Commit:** `"feat: add provider dashboard with onboarding checklist"`

---

## Task 8: Provider Profile (Public, Shared Screen)

**Files:**
- Create: `handby-mobile/app/provider/[id].tsx`

*Full provider profile — header card, services list, portfolio grid, reviews, quote request form (for customers only). Reuses the same Supabase queries as the web `/providers/[id]` page.*

**Commit:** `"feat: add public provider profile screen"`

---

## Task 9: Chat Screen (Shared)

**Files:**
- Create: `handby-mobile/app/chat/[requestId].tsx`

*Port the existing ChatWindow from the web app. Same Supabase realtime subscription pattern.*

**Commit:** `"feat: add chat screen for quote request conversations"`

---

## Task 10: App Assets + Store Prep

**Files:**
- Create: `handby-mobile/assets/icon.png` (1024x1024)
- Create: `handby-mobile/assets/splash.png` (1284x2778)
- Create: `handby-mobile/assets/adaptive-icon.png`

**Steps:**
1. Generate app icon from Canva (Handby logo on blue background)
2. Export splash screen (Handby logo + tagline on #2563EB)
3. Create adaptive icon foreground for Android
4. Update app.json with final store metadata
5. Run `eas build --platform all --profile preview` for testing

**Commit:** `"feat: add app assets and store configuration"`

---

## Task 11: Build & Submit

```bash
# EAS login
eas login

# Preview build (test on real device)
eas build --platform all --profile preview

# Production build
eas build --platform all --profile production

# Submit to stores
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

---

## Dependency Map

```
Task 1 (Bootstrap)
  └── Task 2 (Supabase + Auth)
       └── Task 3 (Root Layout + Auth Screens)
            ├── Task 4 (Customer Home)
            │    └── Task 5 (Search)
            │         └── Task 6 (Bookings + Profile)
            ├── Task 7 (Provider Dashboard)
            ├── Task 8 (Provider Profile — shared)
            └── Task 9 (Chat — shared)
                 └── Task 10 (Assets)
                      └── Task 11 (Build + Submit)
```

Tasks 4–9 can be parallelized after Task 3 is complete.
