-- Migration: Chat Push Notifications
-- Date: 2026-03-14
-- Adds push notifications for all key provider-customer communication events:
--   1. New chat message → notify the other party
--   2. New quote sent → notify customer
--   3. Quote accepted/rejected → notify provider
--   4. New appointment booked → notify customer
--   5. Appointment confirmed/declined → notify provider
-- Run this in Supabase Dashboard > SQL Editor

-- Requires pg_net extension (already created in push_notifications migration)

-- ============================================================
-- 1. HELPER: Send push to a user (reusable across triggers)
-- ============================================================
CREATE OR REPLACE FUNCTION send_push_to_user(
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT,
  p_data JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
  tokens TEXT[];
  t TEXT;
BEGIN
  -- Log to notifications table
  INSERT INTO notifications (user_id, title, body, data)
  VALUES (p_user_id, p_title, p_body, p_data);

  -- Get push tokens
  SELECT array_agg(token) INTO tokens
  FROM push_tokens WHERE user_id = p_user_id;

  IF tokens IS NULL THEN
    RETURN;
  END IF;

  -- Send via Expo Push API
  FOREACH t IN ARRAY tokens
  LOOP
    PERFORM net.http_post(
      url := 'https://exp.host/--/api/v2/push/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Accept', 'application/json'
      ),
      body := jsonb_build_object(
        'to', t,
        'title', p_title,
        'body', p_body,
        'sound', 'default',
        'data', p_data
      )
    );
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'send_push_to_user failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 2. NEW MESSAGE → Notify the other party
--    (Only for text messages; quote/booking messages have their own triggers)
-- ============================================================
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  request_category TEXT;
BEGIN
  -- Only notify for text messages (quote/booking handled separately)
  IF NEW.type != 'text' THEN
    RETURN NEW;
  END IF;

  -- Find the other party in the conversation
  SELECT
    CASE
      WHEN qr.customer_id = NEW.sender_id THEN qr.provider_id
      ELSE qr.customer_id
    END,
    qr.category
  INTO recipient_id, request_category
  FROM quote_requests qr
  WHERE qr.id = NEW.request_id;

  IF recipient_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender name
  SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;

  PERFORM send_push_to_user(
    recipient_id,
    COALESCE(sender_name, 'Someone'),
    CASE
      WHEN length(NEW.content) > 80 THEN left(NEW.content, 77) || '...'
      ELSE NEW.content
    END,
    jsonb_build_object(
      'request_id', NEW.request_id,
      'type', 'new_message',
      'sender_id', NEW.sender_id
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_new_message failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_new_message ON messages;
CREATE TRIGGER trg_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();


-- ============================================================
-- 3. QUOTE SENT → Notify customer
--    QUOTE ACCEPTED/REJECTED → Notify provider
-- ============================================================
CREATE OR REPLACE FUNCTION notify_quote_update()
RETURNS TRIGGER AS $$
DECLARE
  customer_name TEXT;
  provider_name TEXT;
  notif_title TEXT;
  notif_body TEXT;
  notif_recipient UUID;
  notif_data JSONB;
BEGIN
  SELECT full_name INTO customer_name FROM profiles WHERE id = NEW.customer_id;
  SELECT full_name INTO provider_name FROM profiles WHERE id = NEW.provider_id;

  -- New quote sent (INSERT) → notify customer
  IF TG_OP = 'INSERT' AND NEW.status = 'sent' THEN
    notif_recipient := NEW.customer_id;
    notif_title := 'New Quote Received';
    notif_body := COALESCE(provider_name, 'A provider') || ' sent you a quote for £' || to_char(NEW.total, 'FM999,999.00');
    notif_data := jsonb_build_object(
      'request_id', NEW.request_id,
      'quote_id', NEW.id,
      'type', 'quote_sent'
    );

  -- Quote accepted → notify provider
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'sent' AND NEW.status = 'accepted' THEN
    notif_recipient := NEW.provider_id;
    notif_title := 'Quote Accepted!';
    notif_body := COALESCE(customer_name, 'A customer') || ' accepted your £' || to_char(NEW.total, 'FM999,999.00') || ' quote';
    notif_data := jsonb_build_object(
      'request_id', NEW.request_id,
      'quote_id', NEW.id,
      'type', 'quote_accepted'
    );

  -- Quote rejected → notify provider
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'sent' AND NEW.status = 'rejected' THEN
    notif_recipient := NEW.provider_id;
    notif_title := 'Quote Declined';
    notif_body := COALESCE(customer_name, 'A customer') || ' declined your quote';
    notif_data := jsonb_build_object(
      'request_id', NEW.request_id,
      'quote_id', NEW.id,
      'type', 'quote_rejected'
    );

  ELSE
    RETURN NEW;
  END IF;

  PERFORM send_push_to_user(notif_recipient, notif_title, notif_body, notif_data);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_quote_update failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_quote_insert ON quotes;
CREATE TRIGGER trg_notify_quote_insert
  AFTER INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION notify_quote_update();

DROP TRIGGER IF EXISTS trg_notify_quote_status ON quotes;
CREATE TRIGGER trg_notify_quote_status
  AFTER UPDATE ON quotes
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_quote_update();


-- ============================================================
-- 4. APPOINTMENT BOOKED → Notify customer
--    APPOINTMENT CONFIRMED/DECLINED → Notify provider
-- ============================================================
CREATE OR REPLACE FUNCTION notify_appointment_update()
RETURNS TRIGGER AS $$
DECLARE
  customer_name TEXT;
  provider_name TEXT;
  notif_title TEXT;
  notif_body TEXT;
  notif_recipient UUID;
  notif_data JSONB;
  date_str TEXT;
BEGIN
  SELECT full_name INTO customer_name FROM profiles WHERE id = NEW.customer_id;
  SELECT full_name INTO provider_name FROM profiles WHERE id = NEW.provider_id;

  date_str := to_char(NEW.date, 'DD Mon YYYY');

  -- New appointment booked (INSERT) → notify customer
  IF TG_OP = 'INSERT' THEN
    notif_recipient := NEW.customer_id;
    notif_title := 'Appointment Proposed';
    notif_body := COALESCE(provider_name, 'Your provider') || ' proposed ' || date_str || ' at ' || COALESCE(NEW.time_slot, 'TBC');
    notif_data := jsonb_build_object(
      'request_id', NEW.request_id,
      'appointment_id', NEW.id,
      'type', 'appointment_booked'
    );

  -- Appointment confirmed → notify provider
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'scheduled' AND NEW.status = 'confirmed' THEN
    notif_recipient := NEW.provider_id;
    notif_title := 'Appointment Confirmed!';
    notif_body := COALESCE(customer_name, 'A customer') || ' confirmed the appointment on ' || date_str;
    notif_data := jsonb_build_object(
      'request_id', NEW.request_id,
      'appointment_id', NEW.id,
      'type', 'appointment_confirmed'
    );

  -- Appointment cancelled → notify the other party
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- We don't know who cancelled, so notify both
    -- The sender will ignore their own notification
    notif_recipient := NEW.customer_id;
    notif_title := 'Appointment Cancelled';
    notif_body := 'The appointment on ' || date_str || ' has been cancelled';
    notif_data := jsonb_build_object(
      'request_id', NEW.request_id,
      'appointment_id', NEW.id,
      'type', 'appointment_cancelled'
    );

    PERFORM send_push_to_user(notif_recipient, notif_title, notif_body, notif_data);

    -- Also notify provider
    notif_recipient := NEW.provider_id;
    PERFORM send_push_to_user(notif_recipient, notif_title, notif_body, notif_data);

    RETURN NEW;

  ELSE
    RETURN NEW;
  END IF;

  PERFORM send_push_to_user(notif_recipient, notif_title, notif_body, notif_data);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_appointment_update failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_appointment_insert ON appointments;
CREATE TRIGGER trg_notify_appointment_insert
  AFTER INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_appointment_update();

DROP TRIGGER IF EXISTS trg_notify_appointment_status ON appointments;
CREATE TRIGGER trg_notify_appointment_status
  AFTER UPDATE ON appointments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_appointment_update();


-- ============================================================
-- 5. REFACTOR: Update existing status change trigger to use helper
-- ============================================================
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
DECLARE
  provider_name TEXT;
  status_label TEXT;
  notif_body TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO provider_name FROM profiles WHERE id = NEW.provider_id;

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

  notif_body := COALESCE(provider_name, 'Your provider') || ' ' || status_label;

  PERFORM send_push_to_user(
    NEW.customer_id,
    'Booking Update',
    notif_body,
    jsonb_build_object(
      'request_id', NEW.id,
      'status', NEW.status,
      'type', 'status_change'
    )
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_status_change failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
