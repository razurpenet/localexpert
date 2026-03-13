-- 2026-03-12: Add language fields to profiles for multilingual support
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';
