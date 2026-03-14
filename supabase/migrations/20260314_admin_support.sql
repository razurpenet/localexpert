-- Migration: Admin Support
-- Date: 2026-03-14
-- Adds: admin role support, audit log table, credential reviewer fields, profile suspension
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- 1. Allow 'admin' as a valid profile role
-- ============================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('customer', 'provider', 'admin'));

-- ============================================================
-- 2. Admin audit log — track every admin action
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid NOT NULL,
  details jsonb DEFAULT '{}',
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
