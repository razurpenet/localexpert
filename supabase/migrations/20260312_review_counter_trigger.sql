-- Migration: Auto-update provider_details when a review is submitted
-- Date: 2026-03-12
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- Function: Recalculate avg_rating and review_count
-- Fires after INSERT on reviews table
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

-- ============================================================
-- Trigger: fire after a new review is inserted
-- ============================================================
DROP TRIGGER IF EXISTS trg_update_review_stats ON reviews;

CREATE TRIGGER trg_update_review_stats
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_review_stats();

-- ============================================================
-- Also handle review deletion (if a review is ever removed)
-- ============================================================
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
