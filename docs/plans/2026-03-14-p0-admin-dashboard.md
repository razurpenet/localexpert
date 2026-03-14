# P0 Admin Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the 3 P0 admin features — RTW verification queue, credential verification queue, and quote request pipeline — so Handby can operate the marketplace from day 1 of Newham soft launch.

**Architecture:** Server-rendered Next.js pages at `/dashboard/admin/*` using the existing dashboard layout pattern. All admin mutations use `createAdminClient()` (service role, bypasses RLS). Admin access gated by `profiles.role = 'admin'` check in middleware + layout. Audit logging via a new `admin_audit_log` table.

**Tech Stack:** Next.js 16 App Router, Server Components, Server Actions, Supabase (service role client), shadcn/ui components (Card, Badge, Button, Select, Input), Tailwind CSS 4, Lucide icons.

---

## Task 1: Database Migration — Admin Support

**Files:**
- Create: `supabase/migrations/20260314_admin_support.sql`

**Step 1: Write the migration**

```sql
-- Migration: Admin Support
-- Date: 2026-03-14
-- Adds: admin role support, audit log table, credential reviewer fields, profile suspension
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- 1. Allow 'admin' as a valid profile role
-- ============================================================
-- The profiles.role column uses a CHECK constraint. We need to drop and recreate it.
-- First find and drop the existing check constraint on role:
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'provider', 'admin'));

-- ============================================================
-- 2. Admin audit log — track every admin action
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,              -- e.g. 'rtw_verified', 'credential_rejected', 'user_suspended'
  target_table text NOT NULL,        -- e.g. 'rtw_checks', 'credentials', 'profiles'
  target_id uuid NOT NULL,           -- ID of the row acted upon
  details jsonb DEFAULT '{}',        -- Additional context (old status, new status, notes, etc.)
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- No user-facing policies — only accessible via service role (createAdminClient)

-- ============================================================
-- 3. Credential reviewer fields
-- ============================================================
ALTER TABLE credentials
  ADD COLUMN IF NOT EXISTS reviewer_id uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewer_notes text;

-- ============================================================
-- 4. Profile suspension fields
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_reason text;

-- ============================================================
-- 5. Review hiding fields (for content moderation)
-- ============================================================
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS hidden_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS hidden_reason text;
```

**Step 2: Run the migration in Supabase Dashboard SQL Editor**

Expected: SUCCESS — tables and columns created.

**Step 3: Seed your own account as admin**

Run in SQL Editor (replace with your actual user ID):
```sql
-- Find your user ID first:
-- SELECT id, email, role FROM profiles WHERE email = 'your@email.com';
-- Then update:
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR-UUID-HERE';
```

**Step 4: Commit**

```bash
git add supabase/migrations/20260314_admin_support.sql
git commit -m "feat: add admin role, audit log table, and reviewer fields migration"
```

---

## Task 2: Middleware — Protect Admin Routes

**Files:**
- Modify: `src/lib/supabase/middleware.ts`
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Add admin route protection to middleware**

The middleware can't easily query the `profiles` table (it would add latency to every request). Instead, we'll do the role check in the admin layout (Task 3). The middleware just needs to ensure `/dashboard/admin/*` is behind auth (which it already is since it starts with `/dashboard`).

No middleware changes needed — the existing `if (!user && request.nextUrl.pathname.startsWith('/dashboard'))` already covers `/dashboard/admin/*`.

**Step 2: Add admin redirect to dashboard router**

In `src/app/dashboard/page.tsx`, add the admin redirect:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/dashboard/admin')
  if (profile?.role === 'provider') redirect('/dashboard/provider')

  redirect('/dashboard/customer')
}
```

**Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add admin role redirect in dashboard router"
```

---

## Task 3: Admin Layout with Sidebar Navigation

**Files:**
- Create: `src/app/dashboard/admin/layout.tsx`

**Step 1: Create the admin layout with role check + sidebar**

```typescript
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Shield, ClipboardCheck, Award, GitPullRequest, Users, BarChart3 } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard/admin',              label: 'Overview',      icon: BarChart3 },
  { href: '/dashboard/admin/rtw',          label: 'RTW Queue',     icon: Shield },
  { href: '/dashboard/admin/credentials',  label: 'Credentials',   icon: Award },
  { href: '/dashboard/admin/pipeline',     label: 'Pipeline',      icon: GitPullRequest },
  { href: '/dashboard/admin/users',        label: 'Users',         icon: Users },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Hard gate — non-admins get sent back
  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex gap-6">
      <aside className="w-56 shrink-0 space-y-1">
        <div className="flex items-center gap-2 px-3 py-2 mb-4">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-sm">Admin Panel</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-slate-100 transition-colors"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/admin/layout.tsx
git commit -m "feat: add admin layout with sidebar nav and role gate"
```

---

## Task 4: Admin Overview Dashboard

**Files:**
- Create: `src/app/dashboard/admin/page.tsx`

**Step 1: Create the overview page with key stats**

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, ClipboardCheck, Award, GitPullRequest, Users, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default async function AdminOverviewPage() {
  const admin = createAdminClient()

  const [
    { count: pendingRtw },
    { count: pendingCreds },
    { count: pendingRequests },
    { count: staleRequests },
    { count: totalProviders },
    { count: totalCustomers },
    { count: completedJobs },
    { count: activeProviders },
  ] = await Promise.all([
    admin.from('rtw_checks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('credentials').select('*', { count: 'exact', head: true }).eq('verified', false).is('reviewed_at', null),
    admin.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending').lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'provider'),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
    admin.from('quote_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    admin.from('provider_details').select('*', { count: 'exact', head: true }).eq('is_available', true),
  ])

  const stats = [
    { label: 'Pending RTW',        value: pendingRtw ?? 0,       icon: Shield,          href: '/dashboard/admin/rtw',         alert: (pendingRtw ?? 0) > 0 },
    { label: 'Pending Credentials', value: pendingCreds ?? 0,     icon: Award,           href: '/dashboard/admin/credentials', alert: (pendingCreds ?? 0) > 0 },
    { label: 'Pending Requests',    value: pendingRequests ?? 0,  icon: GitPullRequest,  href: '/dashboard/admin/pipeline',    alert: false },
    { label: 'Stale (>24h)',        value: staleRequests ?? 0,    icon: AlertTriangle,   href: '/dashboard/admin/pipeline?filter=stale', alert: (staleRequests ?? 0) > 0 },
    { label: 'Total Providers',     value: totalProviders ?? 0,   icon: Users,           href: '/dashboard/admin/users?role=provider', alert: false },
    { label: 'Total Customers',     value: totalCustomers ?? 0,   icon: Users,           href: '/dashboard/admin/users?role=customer', alert: false },
    { label: 'Completed Jobs',      value: completedJobs ?? 0,    icon: ClipboardCheck,  href: '/dashboard/admin/pipeline?filter=completed', alert: false },
    { label: 'Active Providers',    value: activeProviders ?? 0,  icon: Users,           href: '/dashboard/admin/users?available=true', alert: false },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and action items.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className={s.alert ? 'border-amber-300 bg-amber-50/50' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className={`h-4 w-4 ${s.alert ? 'text-amber-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/admin/page.tsx
git commit -m "feat: add admin overview dashboard with platform stats"
```

---

## Task 5: Admin Server Actions

**Files:**
- Create: `src/app/dashboard/admin/actions.ts`

**Step 1: Create all admin server actions**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/app/dashboard/admin/actions.ts
git commit -m "feat: add admin server actions with audit logging"
```

---

## Task 6: RTW Verification Queue Page

**Files:**
- Create: `src/app/dashboard/admin/rtw/page.tsx`
- Create: `src/app/dashboard/admin/rtw/RtwActions.tsx` (client component for forms)

**Step 1: Create the RTW queue server page**

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { RtwActionButtons } from './RtwActions'

const STATUS_STYLES: Record<string, string> = {
  pending:  'bg-amber-100 text-amber-700',
  verified: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  expired:  'bg-slate-100 text-slate-600',
}

export default async function AdminRtwPage() {
  const admin = createAdminClient()

  const { data: checks } = await admin
    .from('rtw_checks')
    .select(`
      *,
      profiles!rtw_checks_provider_id_fkey(id, full_name, email, city, postcode, avatar_url),
      provider_details:provider_details!inner(citizenship_status, business_name)
    `)
    .order('created_at', { ascending: false })

  const pending  = checks?.filter((c) => c.status === 'pending')  ?? []
  const reviewed = checks?.filter((c) => c.status !== 'pending')  ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Right to Work Verification
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review provider RTW share codes against gov.uk/view-right-to-work
        </p>
      </div>

      {/* Pending queue */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Pending Review ({pending.length})
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No pending RTW checks. All clear!</p>
        )}
        {pending.map((check) => {
          const provider = check.profiles as any
          const details = check.provider_details as any
          return (
            <Card key={check.id} className="border-amber-200 bg-amber-50/30">
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-medium">{provider?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{provider?.email}</p>
                    {provider?.city && <p className="text-xs text-muted-foreground">{provider.city}{provider.postcode ? `, ${provider.postcode}` : ''}</p>}
                    {details?.business_name && <p className="text-xs text-muted-foreground">Business: {details.business_name}</p>}
                    {details?.citizenship_status && <p className="text-xs text-muted-foreground">Status: {details.citizenship_status.replace('_', ' ')}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[check.status]}`}>
                    {check.status}
                  </span>
                </div>

                <div className="bg-white rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Share Code</p>
                      <p className="font-mono font-bold text-lg tracking-widest">{check.share_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{new Date(check.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Submitted: {new Date(check.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <RtwActionButtons rtwId={check.id} />
              </CardContent>
            </Card>
          )
        })}
      </section>

      {/* Reviewed history */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Reviewed ({reviewed.length})
        </h2>
        {reviewed.map((check) => {
          const provider = check.profiles as any
          return (
            <div key={check.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-sm">{provider?.full_name ?? 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">Code: {check.share_code}</p>
                {check.reviewer_notes && <p className="text-xs text-muted-foreground">Notes: {check.reviewer_notes}</p>}
              </div>
              <div className="text-right space-y-1">
                <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[check.status]}`}>
                  {check.status}
                </span>
                {check.expires_at && (
                  <p className="text-xs text-muted-foreground">Expires: {new Date(check.expires_at).toLocaleDateString('en-GB')}</p>
                )}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
```

**Step 2: Create the client component for action buttons**

```typescript
// src/app/dashboard/admin/rtw/RtwActions.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyRtw, rejectRtw } from '../actions'

export function RtwActionButtons({ rtwId }: { rtwId: string }) {
  const [mode, setMode] = useState<'idle' | 'verify' | 'reject'>('idle')
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')

  if (mode === 'verify') {
    return (
      <form action={async () => { await verifyRtw(rtwId, expiresAt || null) }} className="space-y-3 bg-emerald-50 rounded-lg p-4 border border-emerald-200">
        <div className="space-y-2">
          <Label htmlFor="expires">RTW Expiry Date (leave blank if indefinite)</Label>
          <Input id="expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm">Confirm Verify</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>Cancel</Button>
        </div>
      </form>
    )
  }

  if (mode === 'reject') {
    return (
      <form action={async () => { await rejectRtw(rtwId, notes) }} className="space-y-3 bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="space-y-2">
          <Label htmlFor="notes">Rejection Reason *</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Share code invalid or expired" required />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="destructive">Confirm Reject</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>Cancel</Button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => setMode('verify')}>Verify</Button>
      <Button size="sm" variant="outline" onClick={() => setMode('reject')}>Reject</Button>
      <Button size="sm" variant="ghost" asChild>
        <a href="https://www.gov.uk/view-right-to-work" target="_blank" rel="noopener noreferrer">
          Check gov.uk →
        </a>
      </Button>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/dashboard/admin/rtw/
git commit -m "feat: add RTW verification queue with verify/reject actions"
```

---

## Task 7: Credential Verification Queue Page

**Files:**
- Create: `src/app/dashboard/admin/credentials/page.tsx`
- Create: `src/app/dashboard/admin/credentials/CredentialActions.tsx`

**Step 1: Create the credentials queue server page**

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Award, ExternalLink } from 'lucide-react'
import { CredentialActionButtons } from './CredentialActions'

const TYPE_LABELS: Record<string, string> = {
  gas_safe:       'Gas Safe',
  dbs:            'DBS Check',
  insured:        'Insurance',
  waste_carrier:  'Waste Carrier',
  other:          'Other',
}

export default async function AdminCredentialsPage() {
  const admin = createAdminClient()

  const { data: credentials } = await admin
    .from('credentials')
    .select(`
      *,
      profiles!credentials_provider_id_fkey(id, full_name, email, city)
    `)
    .order('created_at', { ascending: false })

  const pending  = credentials?.filter((c) => !c.verified && !c.reviewed_at) ?? []
  const verified = credentials?.filter((c) => c.verified)                    ?? []
  const rejected = credentials?.filter((c) => !c.verified && c.reviewed_at)  ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" />
          Credential Verification
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review provider certificates, licenses, and insurance documents.
        </p>
      </div>

      {/* Pending */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Pending Review ({pending.length})
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No pending credentials. All reviewed!</p>
        )}
        {pending.map((cred) => {
          const provider = cred.profiles as any
          return (
            <Card key={cred.id} className="border-amber-200 bg-amber-50/30">
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="font-medium">{provider?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{provider?.email}</p>
                    {provider?.city && <p className="text-xs text-muted-foreground">{provider.city}</p>}
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                    Pending
                  </span>
                </div>

                <div className="bg-white rounded-lg border border-border p-4 space-y-2">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium">{TYPE_LABELS[cred.type] ?? cred.type}</p>
                    </div>
                    {cred.credential_name && (
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="font-medium">{cred.credential_name}</p>
                      </div>
                    )}
                    {cred.credential_issuer && (
                      <div>
                        <p className="text-xs text-muted-foreground">Issuer</p>
                        <p className="font-medium">{cred.credential_issuer}</p>
                      </div>
                    )}
                    {cred.expiry_date && (
                      <div>
                        <p className="text-xs text-muted-foreground">Expiry</p>
                        <p className="font-medium">{new Date(cred.expiry_date).toLocaleDateString('en-GB')}</p>
                      </div>
                    )}
                  </div>
                  {cred.type === 'insured' && (cred.insurer_name || cred.coverage_amount) && (
                    <div className="flex items-center gap-6 pt-2 border-t">
                      {cred.insurer_name && <div><p className="text-xs text-muted-foreground">Insurer</p><p className="font-medium">{cred.insurer_name}</p></div>}
                      {cred.coverage_amount && <div><p className="text-xs text-muted-foreground">Coverage</p><p className="font-medium">£{Number(cred.coverage_amount).toLocaleString()}</p></div>}
                    </div>
                  )}
                  {cred.document_url && (
                    <a href={cred.document_url} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2">
                      <ExternalLink className="h-3.5 w-3.5" /> View Document
                    </a>
                  )}
                </div>

                <CredentialActionButtons credId={cred.id} />
              </CardContent>
            </Card>
          )
        })}
      </section>

      {/* Verified */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Verified ({verified.length})
        </h2>
        {verified.map((cred) => {
          const provider = cred.profiles as any
          return (
            <div key={cred.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-medium text-sm">{provider?.full_name ?? 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">{TYPE_LABELS[cred.type] ?? cred.type} — {cred.credential_name ?? ''}</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">Verified</span>
            </div>
          )
        })}
      </section>

      {/* Rejected */}
      {rejected.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Rejected ({rejected.length})
          </h2>
          {rejected.map((cred) => {
            const provider = cred.profiles as any
            return (
              <div key={cred.id} className="bg-white rounded-xl border border-border p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-medium text-sm">{provider?.full_name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{TYPE_LABELS[cred.type] ?? cred.type}</p>
                  {cred.reviewer_notes && <p className="text-xs text-red-600">Reason: {cred.reviewer_notes}</p>}
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">Rejected</span>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}
```

**Step 2: Create the client component for action buttons**

```typescript
// src/app/dashboard/admin/credentials/CredentialActions.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { verifyCredential, rejectCredential } from '../actions'

export function CredentialActionButtons({ credId }: { credId: string }) {
  const [mode, setMode] = useState<'idle' | 'verify' | 'reject'>('idle')
  const [notes, setNotes] = useState('')

  if (mode === 'verify') {
    return (
      <form action={async () => { await verifyCredential(credId, notes) }} className="space-y-3 bg-emerald-50 rounded-lg p-4 border border-emerald-200">
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Gas Safe ID confirmed" />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm">Confirm Verify</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>Cancel</Button>
        </div>
      </form>
    )
  }

  if (mode === 'reject') {
    return (
      <form action={async () => { await rejectCredential(credId, notes) }} className="space-y-3 bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="space-y-2">
          <Label htmlFor="notes">Rejection Reason *</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Document expired or unreadable" required />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="destructive">Confirm Reject</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setMode('idle')}>Cancel</Button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => setMode('verify')}>Verify</Button>
      <Button size="sm" variant="outline" onClick={() => setMode('reject')}>Reject</Button>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/dashboard/admin/credentials/
git commit -m "feat: add credential verification queue with verify/reject actions"
```

---

## Task 8: Quote Request Pipeline Page

**Files:**
- Create: `src/app/dashboard/admin/pipeline/page.tsx`

**Step 1: Create the pipeline view**

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GitPullRequest, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  pending:     'bg-amber-100 text-amber-700',
  accepted:    'bg-emerald-100 text-emerald-700',
  declined:    'bg-red-100 text-red-700',
  confirmed:   'bg-blue-100 text-blue-700',
  en_route:    'bg-indigo-100 text-indigo-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed:   'bg-slate-100 text-slate-700',
  cancelled:   'bg-slate-100 text-slate-500',
}

function hoursAgo(dateStr: string) {
  return Math.round((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60))
}

export default async function AdminPipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const params = await searchParams
  const admin = createAdminClient()

  const { data: requests } = await admin
    .from('quote_requests')
    .select(`
      *,
      customer:profiles!quote_requests_customer_id_fkey(id, full_name, email, city),
      provider:profiles!quote_requests_provider_id_fkey(id, full_name, email, city),
      services(title, category_id, categories(name))
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  const allRequests = requests ?? []

  // Compute funnel stats
  const total     = allRequests.length
  const pending   = allRequests.filter((r) => r.status === 'pending')
  const accepted  = allRequests.filter((r) => r.status === 'accepted')
  const confirmed = allRequests.filter((r) => r.status === 'confirmed')
  const active    = allRequests.filter((r) => ['en_route', 'in_progress'].includes(r.status))
  const completed = allRequests.filter((r) => r.status === 'completed')
  const declined  = allRequests.filter((r) => r.status === 'declined')
  const cancelled = allRequests.filter((r) => r.status === 'cancelled')
  const stale     = pending.filter((r) => hoursAgo(r.created_at) >= 24)

  // Filter if specified
  let displayRequests = allRequests
  if (params.filter === 'stale') {
    displayRequests = stale
  } else if (params.filter === 'completed') {
    displayRequests = completed
  } else if (params.filter === 'pending') {
    displayRequests = pending
  }

  const funnelSteps = [
    { label: 'Total',     count: total,            color: 'bg-slate-100 text-slate-700' },
    { label: 'Pending',   count: pending.length,   color: 'bg-amber-100 text-amber-700',   href: '?filter=pending' },
    { label: 'Stale >24h', count: stale.length,    color: stale.length > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600', href: '?filter=stale' },
    { label: 'Accepted',  count: accepted.length,  color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Confirmed', count: confirmed.length, color: 'bg-blue-100 text-blue-700' },
    { label: 'Active',    count: active.length,    color: 'bg-purple-100 text-purple-700' },
    { label: 'Completed', count: completed.length, color: 'bg-slate-100 text-slate-700',    href: '?filter=completed' },
    { label: 'Declined',  count: declined.length,  color: 'bg-red-50 text-red-600' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitPullRequest className="h-6 w-6 text-primary" />
          Quote Request Pipeline
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track all customer requests through the marketplace funnel.
          {params.filter && (
            <> — Filtered by: <strong className="capitalize">{params.filter}</strong> <Link href="/dashboard/admin/pipeline" className="text-primary hover:underline ml-1">Clear</Link></>
          )}
        </p>
      </div>

      {/* Funnel stats */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {funnelSteps.map((step) => {
          const inner = (
            <div className={`rounded-xl px-3 py-2.5 text-center ${step.color}`}>
              <p className="text-lg font-bold">{step.count}</p>
              <p className="text-xs font-medium">{step.label}</p>
            </div>
          )
          return step.href ? (
            <Link key={step.label} href={step.href}>{inner}</Link>
          ) : (
            <div key={step.label}>{inner}</div>
          )
        })}
      </div>

      {/* Conversion rates */}
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span>Accept rate: <strong className="text-foreground">{total > 0 ? Math.round(((accepted.length + confirmed.length + completed.length + active.length) / total) * 100) : 0}%</strong></span>
        <span>Completion rate: <strong className="text-foreground">{total > 0 ? Math.round((completed.length / total) * 100) : 0}%</strong></span>
        <span>Decline rate: <strong className="text-foreground">{total > 0 ? Math.round((declined.length / total) * 100) : 0}%</strong></span>
      </div>

      {/* Request list */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          {params.filter ? `${params.filter} requests` : 'All Requests'} ({displayRequests.length})
        </h2>
        {displayRequests.map((r) => {
          const customer = r.customer as any
          const provider = r.provider as any
          const service  = r.services as any
          const isStale  = r.status === 'pending' && hoursAgo(r.created_at) >= 24

          return (
            <div key={r.id} className={`bg-white rounded-xl border p-4 space-y-2 ${isStale ? 'border-red-300 bg-red-50/30' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{customer?.full_name ?? 'Customer'}</p>
                    <span className="text-muted-foreground text-xs">→</span>
                    <p className="font-medium text-sm">{provider?.full_name ?? 'Provider'}</p>
                  </div>
                  {service && (
                    <p className="text-xs text-muted-foreground">
                      {service.categories?.name ?? ''} — {service.title}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{customer?.city ?? ''} {provider?.city ? `→ ${provider.city}` : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isStale && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${STATUS_STYLES[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground bg-slate-50 rounded-lg p-3 line-clamp-2">
                {r.message}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Created: {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                {r.status === 'pending' && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {hoursAgo(r.created_at)}h ago</span>}
                {r.quoted_price && <span>Quoted: £{r.quoted_price}</span>}
                {r.urgency && r.urgency !== 'flexible' && <span className="text-amber-600 font-medium capitalize">{r.urgency.replace('_', ' ')}</span>}
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/admin/pipeline/
git commit -m "feat: add quote request pipeline view with funnel stats and filtering"
```

---

## Task 9: User Management Page

**Files:**
- Create: `src/app/dashboard/admin/users/page.tsx`
- Create: `src/app/dashboard/admin/users/UserActions.tsx`

**Step 1: Create the users list page**

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Shield, Star, MapPin } from 'lucide-react'
import { UserActionButtons } from './UserActions'

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const params = await searchParams
  const admin = createAdminClient()

  let query = admin
    .from('profiles')
    .select('*, provider_details(*)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (params.role) {
    query = query.eq('role', params.role)
  }
  if (params.q) {
    query = query.or(`full_name.ilike.%${params.q}%,email.ilike.%${params.q}%`)
  }

  const { data: users } = await query

  const providers = users?.filter((u) => u.role === 'provider') ?? []
  const customers = users?.filter((u) => u.role === 'customer') ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          User Management
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          View and manage all platform users.
        </p>
      </div>

      {/* Search & filter */}
      <form className="flex gap-2">
        <input
          name="q"
          type="text"
          placeholder="Search by name or email..."
          defaultValue={params.q ?? ''}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
        />
        <select name="role" defaultValue={params.role ?? ''} className="rounded-lg border border-border px-3 py-2 text-sm">
          <option value="">All roles</option>
          <option value="provider">Providers</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
        <button type="submit" className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90">
          Search
        </button>
      </form>

      {/* Results */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Results ({users?.length ?? 0})
        </h2>
        {users?.map((user) => {
          const details = user.provider_details as any
          const isSuspended = Boolean(user.suspended_at)
          return (
            <div key={user.id} className={`bg-white rounded-xl border p-4 space-y-2 ${isSuspended ? 'border-red-300 bg-red-50/30' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.full_name ?? 'No name'}</p>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                      user.role === 'provider' ? 'bg-blue-100 text-blue-700' :
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{user.role}</span>
                    {isSuspended && <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700">Suspended</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.city && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {user.city}{user.postcode ? `, ${user.postcode}` : ''}</p>}
                </div>
                <div className="text-right space-y-1">
                  {details && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {details.avg_rating && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-amber-500" /> {details.avg_rating}</span>}
                      <span>{details.review_count ?? 0} reviews</span>
                      <span>{details.completion_count ?? 0} jobs</span>
                      {details.rtw_verified && <Shield className="h-3.5 w-3.5 text-emerald-500" />}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Joined: {new Date(user.created_at).toLocaleDateString('en-GB')}</p>
                </div>
              </div>

              {isSuspended && user.suspended_reason && (
                <p className="text-xs text-red-600">Reason: {user.suspended_reason}</p>
              )}

              <UserActionButtons userId={user.id} isSuspended={isSuspended} />
            </div>
          )
        })}
      </section>
    </div>
  )
}
```

**Step 2: Create the user action buttons client component**

```typescript
// src/app/dashboard/admin/users/UserActions.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { suspendUser, unsuspendUser } from '../actions'

export function UserActionButtons({ userId, isSuspended }: { userId: string; isSuspended: boolean }) {
  const [showSuspend, setShowSuspend] = useState(false)
  const [reason, setReason] = useState('')

  if (isSuspended) {
    return (
      <form action={async () => { await unsuspendUser(userId) }}>
        <Button type="submit" size="sm" variant="outline">Unsuspend</Button>
      </form>
    )
  }

  if (showSuspend) {
    return (
      <form action={async () => { await suspendUser(userId, reason) }} className="space-y-3 bg-red-50 rounded-lg p-4 border border-red-200">
        <div className="space-y-2">
          <Label htmlFor="reason">Suspension Reason *</Label>
          <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Fraudulent activity" required />
        </div>
        <div className="flex gap-2">
          <Button type="submit" size="sm" variant="destructive">Confirm Suspend</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowSuspend(false)}>Cancel</Button>
        </div>
      </form>
    )
  }

  return (
    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setShowSuspend(true)}>
      Suspend
    </Button>
  )
}
```

**Step 3: Commit**

```bash
git add src/app/dashboard/admin/users/
git commit -m "feat: add user management page with search, filter, and suspend"
```

---

## Task 10: Update Navbar for Admin Role

**Files:**
- Modify: `src/components/shared/Navbar.tsx`

**Step 1: Add admin link in navbar when role is admin**

In the Navbar component, add a link to the admin panel when the user's role is admin. After the "Browse" link:

```typescript
// Add this after the Browse link, before the user info section:
{user.role === 'admin' && (
  <Link href="/dashboard/admin" className="hidden sm:flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors font-medium">
    <Shield className="h-4 w-4" /> Admin
  </Link>
)}
```

Import `Shield` from lucide-react at the top of the file.

**Step 2: Commit**

```bash
git add src/components/shared/Navbar.tsx
git commit -m "feat: add admin panel link to navbar for admin users"
```

---

## Summary: File Tree

```
src/app/dashboard/
├── admin/
│   ├── layout.tsx              ← Role gate + sidebar nav
│   ├── page.tsx                ← Overview dashboard with stats
│   ├── actions.ts              ← All admin server actions + audit logging
│   ├── rtw/
│   │   ├── page.tsx            ← RTW verification queue
│   │   └── RtwActions.tsx      ← Client: verify/reject buttons
│   ├── credentials/
│   │   ├── page.tsx            ← Credential verification queue
│   │   └── CredentialActions.tsx ← Client: verify/reject buttons
│   ├── pipeline/
│   │   └── page.tsx            ← Quote request funnel + list
│   └── users/
│       ├── page.tsx            ← User directory with search
│       └── UserActions.tsx     ← Client: suspend/unsuspend
├── page.tsx                    ← Modified: add admin redirect
└── ... (existing provider/customer routes)

src/components/shared/
└── Navbar.tsx                  ← Modified: admin link

supabase/migrations/
└── 20260314_admin_support.sql  ← Admin role, audit log, reviewer fields
```

## Post-Implementation Checklist

- [ ] Run `20260314_admin_support.sql` in Supabase SQL Editor
- [ ] Set your profile role to `admin` in SQL Editor
- [ ] Start dev server: `npm run dev`
- [ ] Visit `/dashboard` → should redirect to `/dashboard/admin`
- [ ] Check all 4 admin pages load without errors
- [ ] Test RTW verify/reject with a real pending RTW check
- [ ] Test credential verify/reject
- [ ] Check audit log has entries: `SELECT * FROM admin_audit_log ORDER BY created_at DESC;`
- [ ] Test user suspend/unsuspend
- [ ] Verify non-admin users get redirected away from `/dashboard/admin`
