-- Migration: Fix RLS policies for job status tracking + all tables
-- Date: 2026-03-12
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- Quote Requests
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_requests' AND policyname = 'Providers can update own requests') THEN
    CREATE POLICY "Providers can update own requests"
      ON quote_requests FOR UPDATE
      USING (auth.uid() = provider_id)
      WITH CHECK (auth.uid() = provider_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_requests' AND policyname = 'Customers can read own requests') THEN
    CREATE POLICY "Customers can read own requests"
      ON quote_requests FOR SELECT
      USING (auth.uid() = customer_id OR auth.uid() = provider_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quote_requests' AND policyname = 'Customers can insert requests') THEN
    CREATE POLICY "Customers can insert requests"
      ON quote_requests FOR INSERT
      WITH CHECK (auth.uid() = customer_id);
  END IF;
END $$;

-- ============================================================
-- Provider Details
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'provider_details' AND policyname = 'Providers can update own details') THEN
    CREATE POLICY "Providers can update own details"
      ON provider_details FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'provider_details' AND policyname = 'Anyone can read provider details') THEN
    CREATE POLICY "Anyone can read provider details"
      ON provider_details FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'provider_details' AND policyname = 'Providers can insert own details') THEN
    CREATE POLICY "Providers can insert own details"
      ON provider_details FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ============================================================
-- Credentials
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credentials' AND policyname = 'Providers manage own credentials') THEN
    CREATE POLICY "Providers manage own credentials"
      ON credentials FOR ALL
      USING (auth.uid() = provider_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'credentials' AND policyname = 'Anyone can read credentials') THEN
    CREATE POLICY "Anyone can read credentials"
      ON credentials FOR SELECT
      USING (true);
  END IF;
END $$;

-- ============================================================
-- Favourites
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'favourites' AND policyname = 'Customers manage own favourites') THEN
    CREATE POLICY "Customers manage own favourites"
      ON favourites FOR ALL
      USING (auth.uid() = customer_id);
  END IF;
END $$;

-- ============================================================
-- Reviews
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Anyone can read reviews') THEN
    CREATE POLICY "Anyone can read reviews"
      ON reviews FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reviews' AND policyname = 'Reviewers can insert reviews') THEN
    CREATE POLICY "Reviewers can insert reviews"
      ON reviews FOR INSERT
      WITH CHECK (auth.uid() = reviewer_id);
  END IF;
END $$;

-- ============================================================
-- Messages
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Participants can read messages') THEN
    CREATE POLICY "Participants can read messages"
      ON messages FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM quote_requests
          WHERE quote_requests.id = messages.request_id
            AND (quote_requests.customer_id = auth.uid() OR quote_requests.provider_id = auth.uid())
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Participants can send messages') THEN
    CREATE POLICY "Participants can send messages"
      ON messages FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
  END IF;
END $$;

-- ============================================================
-- Services
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Providers manage own services') THEN
    CREATE POLICY "Providers manage own services"
      ON services FOR ALL
      USING (auth.uid() = provider_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Anyone can read services') THEN
    CREATE POLICY "Anyone can read services"
      ON services FOR SELECT
      USING (true);
  END IF;
END $$;

-- ============================================================
-- Portfolio Items
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_items' AND policyname = 'Providers manage own portfolio') THEN
    CREATE POLICY "Providers manage own portfolio"
      ON portfolio_items FOR ALL
      USING (auth.uid() = provider_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'portfolio_items' AND policyname = 'Anyone can read portfolio items') THEN
    CREATE POLICY "Anyone can read portfolio items"
      ON portfolio_items FOR SELECT
      USING (true);
  END IF;
END $$;

-- ============================================================
-- Profiles
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Anyone can read profiles') THEN
    CREATE POLICY "Anyone can read profiles"
      ON profiles FOR SELECT
      USING (true);
  END IF;
END $$;

-- ============================================================
-- Job Photos
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_photos' AND policyname = 'Providers manage own job photos') THEN
    CREATE POLICY "Providers manage own job photos"
      ON job_photos FOR ALL
      USING (auth.uid() = provider_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_photos' AND policyname = 'Anyone can read job photos') THEN
    CREATE POLICY "Anyone can read job photos"
      ON job_photos FOR SELECT
      USING (true);
  END IF;
END $$;

-- ============================================================
-- Appointments
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'appointments' AND policyname = 'Participants manage appointments') THEN
    CREATE POLICY "Participants manage appointments"
      ON appointments FOR ALL
      USING (auth.uid() = provider_id OR auth.uid() = customer_id);
  END IF;
END $$;

-- ============================================================
-- Quotes
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Participants can view quotes') THEN
    CREATE POLICY "Participants can view quotes"
      ON quotes FOR SELECT
      USING (auth.uid() = provider_id OR auth.uid() = customer_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quotes' AND policyname = 'Providers can manage quotes') THEN
    CREATE POLICY "Providers can manage quotes"
      ON quotes FOR ALL
      USING (auth.uid() = provider_id);
  END IF;
END $$;
