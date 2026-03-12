-- Migration: Backfill provider_details and re-apply review triggers
-- Date: 2026-03-12
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- Re-apply trigger functions (idempotent with CREATE OR REPLACE)
-- ============================================================
CREATE OR REPLACE FUNCTION update_provider_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE provider_details
  SET
    avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    )
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_review_stats ON reviews;
CREATE TRIGGER trg_update_review_stats
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_review_stats();

CREATE OR REPLACE FUNCTION update_provider_review_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE provider_details
  SET
    avg_rating = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE provider_id = OLD.provider_id),
      0
    ),
    review_count = (
      SELECT COUNT(*) FROM reviews WHERE provider_id = OLD.provider_id
    )
  WHERE id = OLD.provider_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_review_stats_delete ON reviews;
CREATE TRIGGER trg_update_review_stats_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_review_stats_on_delete();

-- ============================================================
-- One-time backfill: update all provider_details from actual reviews
-- ============================================================
UPDATE provider_details pd
SET
  avg_rating = COALESCE(stats.avg_r, 0),
  review_count = COALESCE(stats.cnt, 0)
FROM (
  SELECT
    provider_id,
    ROUND(AVG(rating)::numeric, 2) AS avg_r,
    COUNT(*) AS cnt
  FROM reviews
  GROUP BY provider_id
) stats
WHERE pd.id = stats.provider_id;
