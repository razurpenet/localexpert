-- Migration: Tier 1 — Speed-to-Help features
-- Date: 2026-03-12
-- Adds: response time tracking, completion count, badge level, job status timeline

-- ============================================================
-- 1. Provider Details — new columns for smart cards
-- ============================================================
ALTER TABLE provider_details
  ADD COLUMN IF NOT EXISTS response_time_mins integer,        -- avg response time in minutes
  ADD COLUMN IF NOT EXISTS completion_count   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge_level        text DEFAULT 'new'
    CHECK (badge_level IN ('new', 'rising', 'top'));

-- ============================================================
-- 2. Quote Requests — job status timeline timestamps
-- ============================================================
-- Expand status values to support full tracking flow
ALTER TABLE quote_requests
  DROP CONSTRAINT IF EXISTS quote_requests_status_check;

ALTER TABLE quote_requests
  ADD CONSTRAINT quote_requests_status_check
    CHECK (status IN ('pending', 'accepted', 'declined', 'confirmed', 'en_route', 'in_progress', 'completed', 'cancelled'));

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS confirmed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS en_route_at    timestamptz,
  ADD COLUMN IF NOT EXISTS started_at     timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at   timestamptz;

-- ============================================================
-- 3. Provider Availability — weekly schedule
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_availability (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sun..6=Sat
  start_time  time NOT NULL DEFAULT '09:00',
  end_time    time NOT NULL DEFAULT '17:00',
  is_active   boolean NOT NULL DEFAULT true,
  UNIQUE (provider_id, day_of_week)
);

ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers manage own availability"
  ON provider_availability FOR ALL
  USING (auth.uid() = provider_id);

CREATE POLICY "Anyone can read availability"
  ON provider_availability FOR SELECT
  USING (true);

-- ============================================================
-- 4. Function: update provider completion_count on job complete
-- ============================================================
CREATE OR REPLACE FUNCTION update_provider_completion_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE provider_details
    SET completion_count = COALESCE(completion_count, 0) + 1
    WHERE id = NEW.provider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_completion_count ON quote_requests;
CREATE TRIGGER trg_update_completion_count
  AFTER UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_completion_count();

-- ============================================================
-- 5. Function: auto-calculate provider badge_level
-- ============================================================
CREATE OR REPLACE FUNCTION update_provider_badge()
RETURNS TRIGGER AS $$
BEGIN
  NEW.badge_level := CASE
    WHEN NEW.avg_rating >= 4.5 AND NEW.review_count >= 10 AND NEW.completion_count >= 20 THEN 'top'
    WHEN NEW.avg_rating >= 4.0 AND NEW.review_count >= 3  AND NEW.completion_count >= 5  THEN 'rising'
    ELSE 'new'
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_badge ON provider_details;
CREATE TRIGGER trg_update_badge
  BEFORE UPDATE ON provider_details
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_badge();
