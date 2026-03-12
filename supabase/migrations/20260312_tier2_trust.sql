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
