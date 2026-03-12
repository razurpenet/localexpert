import { useEffect } from 'react'
import { Slot, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '../lib/auth-context'
import { View, ActivityIndicator } from 'react-native'
import { registerForPushNotifications } from '../lib/notifications'

function RootGuard() {
  const { session, profile, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  // Register push notifications when user is authenticated
  // Platform handling is done inside notifications.ts / notifications.native.ts
  useEffect(() => {
    if (session?.user) {
      registerForPushNotifications(session.user.id).catch(() => {})
    }
  }, [session?.user?.id])

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFF6FF' }}>
        <ActivityIndicator size="large" color="#1E40AF" />
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
