-- Migration: In-chat quotes & bookings
-- Date: 2026-03-12
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- 1. Extend messages table with type + metadata
-- ============================================================
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'text'
    CHECK (type IN ('text', 'quote', 'booking')),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;

-- ============================================================
-- 2. Extend appointments table
-- ============================================================
-- Add quote_id FK to link booking to accepted quote
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id);

-- Drop old CHECK and add 'confirmed' status
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_status_check
    CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled'));

-- ============================================================
-- 3. RLS: Let customers update quote status (accept/reject)
-- ============================================================
CREATE POLICY "quotes_customer_update" ON quotes FOR UPDATE
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);
