import { createClient } from '@supabase/supabase-js'
import { AppState, Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// AsyncStorage is not available during SSR (server-side rendering),
// so we lazy-load it and fall back to an in-memory store for SSR.
let storage: any = undefined
if (Platform.OS !== 'web' || typeof window !== 'undefined') {
  try {
    storage = require('@react-native-async-storage/async-storage').default
  } catch {
    // Fallback: no persistent storage
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(storage ? { storage } : {}),
    autoRefreshToken: true,
    persistSession: !!storage,
    detectSessionInUrl: false,
  },
})

// Auto-refresh session when app comes to foreground (skip during SSR)
if (typeof window !== 'undefined') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
}
