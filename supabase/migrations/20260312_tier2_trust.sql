-- Migration: Tier 2 — Trust features
-- Date: 2026-03-12
-- Adds: review sub-scores, is_verified badge, auto response time trigger

-- ============================================================
-- 1. Review Sub-Scores — optional granular ratings
-- ============================================================
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS punctuality smallint CHECK (punctuality BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS quality     smallint CHECK (quality BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS value       smallint CHECK (value BETWEEN 1 AND 5);

-- ============================================================
-- 2. Handby Verified Badge — auto-calculated
-- ============================================================
ALTER TABLE provider_details
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Update the badge trigger to also set is_verified
CREATE OR REPLACE FUNCTION update_provider_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- Badge level (unchanged logic)
  NEW.badge_level := CASE
    WHEN NEW.avg_rating >= 4.5 AND NEW.review_count >= 10 AND NEW.completion_count >= 20 THEN 'top'
    WHEN NEW.avg_rating >= 4.0 AND NEW.review_count >= 3  AND NEW.completion_count >= 5  THEN 'rising'
    ELSE 'new'
  END;

  -- Handby Verified: 3+ reviews, 1+ verified credential, complete profile
  NEW.is_verified := (
    NEW.review_count >= 3
    AND EXISTS (SELECT 1 FROM credentials WHERE provider_id = NEW.id AND verified = true)
    AND EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id AND avatar_url IS NOT NULL AND bio IS NOT NULL AND city IS NOT NULL)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists from Tier 1 (trg_update_badge), no need to recreate
-- CREATE OR REPLACE FUNCTION handles the update

-- ============================================================
-- 3. Auto Response Time — median of last 20 responses
-- ============================================================
CREATE OR REPLACE FUNCTION update_provider_response_time()
RETURNS TRIGGER AS $$
DECLARE
  v_median integer;
BEGIN
  -- Only fire when status changes FROM 'pending' TO 'accepted' or 'declined'
  IF OLD.status != 'pending' OR NEW.status NOT IN ('accepted', 'declined') THEN
    RETURN NEW;
  END IF;

  -- Calculate median response time from last 20 responded requests
  SELECT percentile_cont(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (updated_at - created_at)) / 60
  )::integer
  INTO v_median
  FROM (
    SELECT created_at, updated_at
    FROM quote_requests
    WHERE provider_id = NEW.provider_id
      AND status IN ('accepted', 'declined')
      AND updated_at IS NOT NULL
    ORDER BY updated_at DESC
    LIMIT 20
  ) recent;

  -- Update provider_details with median response time
  UPDATE provider_details
  SET response_time_mins = COALESCE(v_median, 0)
  WHERE id = NEW.provider_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_response_time ON quote_requests;
CREATE TRIGGER trg_update_response_time
  AFTER UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_response_time();
