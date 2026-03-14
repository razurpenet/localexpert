-- Migration: Search Analytics
-- Date: 2026-03-14
-- Adds: searches table to track customer search behaviour for demand analysis
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),          -- nullable for anonymous
  query text,                                        -- what they typed
  category_id integer REFERENCES categories(id),     -- category filter used
  city text,                                         -- location searched
  postcode text,                                     -- postcode searched
  result_count integer DEFAULT 0,                    -- how many providers returned
  led_to_request boolean DEFAULT false,              -- did they send a quote request?
  created_at timestamptz DEFAULT now()
);

ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

-- Users can insert their own searches
CREATE POLICY "searches_insert" ON searches FOR INSERT
  WITH CHECK (true);

-- Only service role can read (admin analytics)
-- No user-facing SELECT policy
