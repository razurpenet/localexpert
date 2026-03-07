import { createClient } from '@supabase/supabase-js'

// Service-role client — NEVER expose to the browser.
// Only import this in server actions / Route Handlers.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
