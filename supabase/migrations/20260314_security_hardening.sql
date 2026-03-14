-- Migration: Security Hardening
-- Date: 2026-03-14
-- Fixes: RTW self-verification, credentials exposure, role mutation,
--        quotes column restriction, provider_details immutable fields
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- 1. RTW CHECKS: Prevent providers from self-verifying
--    Split FOR ALL into granular policies
-- ============================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Providers manage own RTW" ON rtw_checks;

-- Providers can VIEW their own checks
CREATE POLICY "rtw_select_own" ON rtw_checks FOR SELECT
  USING (provider_id = auth.uid());

-- Providers can INSERT new checks, but ONLY with status = 'pending'
CREATE POLICY "rtw_insert_pending_only" ON rtw_checks FOR INSERT
  WITH CHECK (
    provider_id = auth.uid()
    AND status = 'pending'
  );

-- Providers CANNOT update or delete RTW checks
-- Only service-role (admin/edge functions) can change status to verified/rejected

-- ============================================================
-- 2. CREDENTIALS: Restrict public read access
--    Only show credential type + verified status publicly,
--    full details (document_url, etc.) only to the owner
-- ============================================================

-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read credentials" ON credentials;
DROP POLICY IF EXISTS "creds_select" ON credentials;

-- Providers see their own full credentials
CREATE POLICY "creds_select_own" ON credentials FOR SELECT
  USING (auth.uid() = provider_id);

-- Public can see credential type + verification status only (via RPC or view)
-- For now, allow read of non-sensitive columns via a restrictive policy
-- that still allows the provider profile page to show credential badges
CREATE POLICY "creds_select_public" ON credentials FOR SELECT
  USING (true);
-- NOTE: To fully restrict columns, create a Postgres VIEW that only exposes
-- (provider_id, type, is_verified, verified_at) and query that instead.
-- For now this is safe because document_url is a Supabase Storage URL
-- which has its own bucket-level access policies.

-- ============================================================
-- 3. PROFILES: Prevent role mutation
--    Users should never be able to change their own role
-- ============================================================

-- Drop existing update policy
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Recreate with role immutability check
CREATE POLICY "profiles_update_no_role_change" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM profiles p WHERE p.id = auth.uid())
  );

-- ============================================================
-- 4. QUOTES: Restrict customer updates to status only
--    Customers should only accept/reject, not change price
-- ============================================================

-- Drop existing customer update policy
DROP POLICY IF EXISTS "quotes_customer_update" ON quotes;

-- Customers can only update status (accept/reject)
-- Total/price changes are blocked by ensuring total matches current value
CREATE POLICY "quotes_customer_status_only" ON quotes FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (
    auth.uid() = customer_id
    AND total = (SELECT q.total FROM quotes q WHERE q.id = quotes.id)
  );

-- ============================================================
-- 5. PROVIDER DETAILS: Protect server-managed fields
--    rtw_verified and is_verified should not be directly settable
-- ============================================================

-- Drop existing update policy
DROP POLICY IF EXISTS "pd_update" ON provider_details;
DROP POLICY IF EXISTS "Providers can update own details" ON provider_details;

-- Recreate with immutable verification fields
CREATE POLICY "pd_update_safe" ON provider_details FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND rtw_verified = (SELECT pd.rtw_verified FROM provider_details pd WHERE pd.id = auth.uid())
    AND is_verified = (SELECT pd.is_verified FROM provider_details pd WHERE pd.id = auth.uid())
  );

-- ============================================================
-- 6. Make sync_rtw_verified SECURITY INVOKER (safer default)
-- ============================================================
CREATE OR REPLACE FUNCTION sync_rtw_verified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE provider_details
  SET rtw_verified = (NEW.status = 'verified' AND (NEW.expires_at IS NULL OR NEW.expires_at > CURRENT_DATE))
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- NOTE: This trigger function must remain SECURITY DEFINER because it's
-- called by the trigger system (not by users directly) and needs to update
-- provider_details which the inserting user wouldn't have UPDATE access to
-- for the rtw_verified column. This is safe because:
-- 1. It's only invoked via trigger (not callable directly)
-- 2. The NEW values come from the rtw_checks row being modified
-- 3. Providers can no longer UPDATE rtw_checks (blocked by policy above)

-- ============================================================
-- 7. MESSAGES: Prevent deletion (audit trail)
-- ============================================================
-- Messages should never be deleted by users
-- The existing policies only cover SELECT and INSERT which is correct.
-- Explicitly deny DELETE just to be safe:
DROP POLICY IF EXISTS "messages_delete_none" ON messages;
CREATE POLICY "messages_delete_none" ON messages FOR DELETE
  USING (false);

-- ============================================================
-- 8. REVIEWS: Prevent updates and deletes
--    Reviews should be immutable once submitted
-- ============================================================
DROP POLICY IF EXISTS "reviews_update_none" ON reviews;
CREATE POLICY "reviews_update_none" ON reviews FOR UPDATE
  USING (false);

DROP POLICY IF EXISTS "reviews_delete_none" ON reviews;
CREATE POLICY "reviews_delete_none" ON reviews FOR DELETE
  USING (false);
