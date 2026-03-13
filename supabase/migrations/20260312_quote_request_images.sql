-- 2026-03-12: Add images array to quote_requests for photo/video quote requests
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
