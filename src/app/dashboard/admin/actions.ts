'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ── Helper: verify caller is admin ──────────────────────────
async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')
  return user.id
}

// ── Helper: log admin action ────────────────────────────────
async function auditLog(adminId: string, action: string, targetTable: string, targetId: string, details: Record<string, unknown> = {}) {
  const admin = createAdminClient()
  await admin.from('admin_audit_log').insert({
    admin_id: adminId,
    action,
    target_table: targetTable,
    target_id: targetId,
    details,
  })
}

// ── RTW: Verify a provider's Right to Work ──────────────────
export async function verifyRtw(rtwId: string, expiresAt: string | null) {
  const adminId = await requireAdmin()
  const admin = createAdminClient()

  await admin.from('rtw_checks').update({
    status: 'verified',
    verified_at: new Date().toISOString(),
    expires_at: expiresAt || null,
  }).eq('id', rtwId)

  await auditLog(adminId, 'rtw_verified', 'rtw_checks', rtwId)
  revalidatePath('/dashboard/admin/rtw')
  revalidatePath('/dashboard/admin')
}

// ── RTW: Reject a provider's Right to Work ──────────────────
export async function rejectRtw(rtwId: string, notes: string) {
  const adminId = await requireAdmin()
  const admin = createAdminClient()

  await admin.from('rtw_checks').update({
    status: 'rejected',
    reviewer_notes: notes,
  }).eq('id', rtwId)

  await auditLog(adminId, 'rtw_rejected', 'rtw_checks', rtwId, { notes })
  revalidatePath('/dashboard/admin/rtw')
  revalidatePath('/dashboard/admin')
}

// ── Credentials: Verify a credential ────────────────────────
export async function verifyCredential(credId: string, notes: string) {
  const adminId = await requireAdmin()
  const admin = createAdminClient()

  await admin.from('credentials').update({
    verified: true,
    reviewer_id: adminId,
    reviewed_at: new Date().toISOString(),
    reviewer_notes: notes || null,
  }).eq('id', credId)

  await auditLog(adminId, 'credential_verified', 'credentials', credId, { notes })
  revalidatePath('/dashboard/admin/credentials')
  revalidatePath('/dashboard/admin')
}

// ── Credentials: Reject a credential ────────────────────────
export async function rejectCredential(credId: string, notes: string) {
  const adminId = await requireAdmin()
  const admin = createAdminClient()

  await admin.from('credentials').update({
    verified: false,
    reviewer_id: adminId,
    reviewed_at: new Date().toISOString(),
    reviewer_notes: notes,
  }).eq('id', credId)

  await auditLog(adminId, 'credential_rejected', 'credentials', credId, { notes })
  revalidatePath('/dashboard/admin/credentials')
  revalidatePath('/dashboard/admin')
}

// ── Users: Suspend a user ───────────────────────────────────
export async function suspendUser(userId: string, reason: string) {
  const adminId = await requireAdmin()
  const admin = createAdminClient()

  await admin.from('profiles').update({
    suspended_at: new Date().toISOString(),
    suspended_reason: reason,
  }).eq('id', userId)

  await auditLog(adminId, 'user_suspended', 'profiles', userId, { reason })
  revalidatePath('/dashboard/admin/users')
}

// ── Users: Unsuspend a user ─────────────────────────────────
export async function unsuspendUser(userId: string) {
  const adminId = await requireAdmin()
  const admin = createAdminClient()

  await admin.from('profiles').update({
    suspended_at: null,
    suspended_reason: null,
  }).eq('id', userId)

  await auditLog(adminId, 'user_unsuspended', 'profiles', userId)
  revalidatePath('/dashboard/admin/users')
}
