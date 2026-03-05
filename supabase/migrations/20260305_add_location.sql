-- Migration: Add lat/lng/postcode columns to profiles for location-based matching
-- Date: 2026-03-05

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS postcode text,
  ADD COLUMN IF NOT EXISTS lat      numeric,
  ADD COLUMN IF NOT EXISTS lng      numeric;

-- Index to speed up bounding-box pre-filter before Haversine
CREATE INDEX IF NOT EXISTS profiles_lat_lng_idx ON profiles (lat, lng)
  WHERE lat IS NOT NULL AND lng IS NOT NULL;
