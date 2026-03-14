-- Migration: Push notification infrastructure
-- Date: 2026-03-12
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- Push Tokens table
-- ============================================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'ios',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_tokens_own" ON push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- Notification log table (tracks what was sent)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON notifications FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- Function: Send push notification via Expo
-- Called by the trigger when quote_request status changes
-- ============================================================
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
DECLARE
  customer_name TEXT;
  provider_name TEXT;
  customer_tokens TEXT[];
  provider_tokens TEXT[];
  status_label TEXT;
  notif_title TEXT;
  notif_body TEXT;
  t TEXT;
BEGIN
  -- Only fire on status change
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get names
  SELECT full_name INTO customer_name FROM profiles WHERE id = NEW.customer_id;
  SELECT full_name INTO provider_name FROM profiles WHERE id = NEW.provider_id;

  -- Human-readable status
  status_label := CASE NEW.status
    WHEN 'accepted' THEN 'accepted your request'
    WHEN 'declined' THEN 'declined your request'
    WHEN 'confirmed' THEN 'confirmed your job'
    WHEN 'en_route' THEN 'is on their way to you'
    WHEN 'in_progress' THEN 'has started your job'
    WHEN 'completed' THEN 'has completed your job'
    WHEN 'cancelled' THEN 'cancelled the job'
    ELSE 'updated your booking'
  END;

  -- Notify the CUSTOMER about provider actions
  notif_title := 'Booking Update';
  notif_body := COALESCE(provider_name, 'Your provider') || ' ' || status_label;

  -- Log the notification
  INSERT INTO notifications (user_id, title, body, data)
  VALUES (NEW.customer_id, notif_title, notif_body, jsonb_build_object(
    'request_id', NEW.id,
    'status', NEW.status,
    'type', 'status_change'
  ));

  -- Get customer push tokens
  SELECT array_agg(token) INTO customer_tokens
  FROM push_tokens WHERE user_id = NEW.customer_id;

  -- Send push notifications via pg_net (if available)
  IF customer_tokens IS NOT NULL THEN
    FOREACH t IN ARRAY customer_tokens
    LOOP
      PERFORM net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Accept', 'application/json'
        ),
        body := jsonb_build_object(
          'to', t,
          'title', notif_title,
          'body', notif_body,
          'sound', 'default',
          'data', jsonb_build_object('request_id', NEW.id, 'status', NEW.status)
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't block the update if notification fails
    RAISE WARNING 'Push notification failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Trigger: fire on quote_request status changes
-- ============================================================
DROP TRIGGER IF EXISTS trg_notify_status_change ON quote_requests;

CREATE TRIGGER trg_notify_status_change
  AFTER UPDATE ON quote_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_status_change();

-- ============================================================
-- Enable pg_net extension (for HTTP calls from triggers)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_net;
