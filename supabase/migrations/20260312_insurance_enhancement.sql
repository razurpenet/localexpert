-- 2026-03-12: Add insurance-specific fields to credentials for richer insurance badges
ALTER TABLE credentials
  ADD COLUMN IF NOT EXISTS coverage_amount text,
  ADD COLUMN IF NOT EXISTS insurer_name text;
