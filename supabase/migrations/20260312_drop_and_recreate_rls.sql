-- Migration: DROP all existing RLS policies and recreate them cleanly
-- Date: 2026-03-12
-- Purpose: The previous IF NOT EXISTS migration was skipped because
--          older policies with different names already existed, blocking updates.
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- STEP 1: Drop ALL existing policies on all tables
-- ============================================================

-- quote_requests
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'quote_requests'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON quote_requests'; END LOOP;
END $$;

-- provider_details
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'provider_details'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON provider_details'; END LOOP;
END $$;

-- credentials
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'credentials'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON credentials'; END LOOP;
END $$;

-- favourites
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'favourites'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON favourites'; END LOOP;
END $$;

-- reviews
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'reviews'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON reviews'; END LOOP;
END $$;

-- messages
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'messages'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON messages'; END LOOP;
END $$;

-- services
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'services'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON services'; END LOOP;
END $$;

-- portfolio_items
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'portfolio_items'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON portfolio_items'; END LOOP;
END $$;

-- profiles
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON profiles'; END LOOP;
END $$;

-- job_photos
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'job_photos'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON job_photos'; END LOOP;
END $$;

-- appointments
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'appointments'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON appointments'; END LOOP;
END $$;

-- quotes
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'quotes'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON quotes'; END LOOP;
END $$;

-- provider_availability
DO $$ DECLARE r RECORD;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'provider_availability'
  LOOP EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON provider_availability'; END LOOP;
END $$;

-- ============================================================
-- STEP 2: Ensure RLS is enabled on all tables
-- ============================================================
ALTER TABLE IF EXISTS quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS provider_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS provider_availability ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 3: Create fresh policies
-- ============================================================

-- ---- Quote Requests ----
CREATE POLICY "qr_select" ON quote_requests FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = provider_id);

CREATE POLICY "qr_insert" ON quote_requests FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "qr_update" ON quote_requests FOR UPDATE
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- ---- Profiles ----
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---- Provider Details ----
CREATE POLICY "pd_select" ON provider_details FOR SELECT
  USING (true);

CREATE POLICY "pd_update" ON provider_details FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "pd_insert" ON provider_details FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---- Services ----
CREATE POLICY "services_select" ON services FOR SELECT
  USING (true);

CREATE POLICY "services_all" ON services FOR ALL
  USING (auth.uid() = provider_id);

-- ---- Credentials ----
CREATE POLICY "creds_select" ON credentials FOR SELECT
  USING (true);

CREATE POLICY "creds_all" ON credentials FOR ALL
  USING (auth.uid() = provider_id);

-- ---- Portfolio Items ----
CREATE POLICY "portfolio_select" ON portfolio_items FOR SELECT
  USING (true);

CREATE POLICY "portfolio_all" ON portfolio_items FOR ALL
  USING (auth.uid() = provider_id);

-- ---- Favourites ----
CREATE POLICY "favs_all" ON favourites FOR ALL
  USING (auth.uid() = customer_id);

-- ---- Reviews ----
CREATE POLICY "reviews_select" ON reviews FOR SELECT
  USING (true);

CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- ---- Messages ----
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quote_requests
      WHERE quote_requests.id = messages.request_id
        AND (quote_requests.customer_id = auth.uid() OR quote_requests.provider_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ---- Job Photos ----
CREATE POLICY "photos_select" ON job_photos FOR SELECT
  USING (true);

CREATE POLICY "photos_all" ON job_photos FOR ALL
  USING (auth.uid() = provider_id);

-- ---- Appointments ----
CREATE POLICY "appts_all" ON appointments FOR ALL
  USING (auth.uid() = provider_id OR auth.uid() = customer_id);

-- ---- Quotes ----
CREATE POLICY "quotes_select" ON quotes FOR SELECT
  USING (auth.uid() = provider_id OR auth.uid() = customer_id);

CREATE POLICY "quotes_all" ON quotes FOR ALL
  USING (auth.uid() = provider_id);

-- ---- Provider Availability ----
CREATE POLICY "avail_select" ON provider_availability FOR SELECT
  USING (true);

CREATE POLICY "avail_all" ON provider_availability FOR ALL
  USING (auth.uid() = provider_id);
