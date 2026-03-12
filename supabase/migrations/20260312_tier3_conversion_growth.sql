-- Migration: Tier 3 — Conversion & Growth features
-- Date: 2026-03-12
-- Adds: structured quoting fields, rebooking reference

-- ============================================================
-- 1. Instant Quote — structured request fields + quoted price
-- ============================================================
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS urgency        text DEFAULT 'flexible'
    CHECK (urgency IN ('flexible', 'this_week', 'urgent')),
  ADD COLUMN IF NOT EXISTS preferred_date  date,
  ADD COLUMN IF NOT EXISTS preferred_time  text
    CHECK (preferred_time IN ('morning', 'afternoon', 'evening', 'flexible')),
  ADD COLUMN IF NOT EXISTS quoted_price    decimal(10,2);

-- ============================================================
-- 2. Repeat Booking — self-referencing FK for rebookings
-- ============================================================
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS rebooking_of uuid REFERENCES quote_requests(id);
