-- 2026-03-12: Right to Work verification for providers
CREATE TABLE IF NOT EXISTS rtw_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_code text NOT NULL,
  date_of_birth date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_at timestamptz,
  expires_at date,
  reviewer_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Only one active/pending check per provider
CREATE UNIQUE INDEX IF NOT EXISTS rtw_checks_provider_active
  ON rtw_checks (provider_id)
  WHERE status IN ('pending', 'verified');

ALTER TABLE rtw_checks ENABLE ROW LEVEL SECURITY;

-- Providers can view and insert their own RTW checks
CREATE POLICY "Providers manage own RTW"
  ON rtw_checks FOR ALL
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

-- Add rtw_verified flag to provider_details (auto-calculated)
ALTER TABLE provider_details
  ADD COLUMN IF NOT EXISTS rtw_verified boolean DEFAULT false;

-- Function to sync rtw_verified flag to provider_details
CREATE OR REPLACE FUNCTION sync_rtw_verified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE provider_details
  SET rtw_verified = (NEW.status = 'verified' AND (NEW.expires_at IS NULL OR NEW.expires_at > CURRENT_DATE))
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_rtw_verified
  AFTER INSERT OR UPDATE ON rtw_checks
  FOR EACH ROW
  EXECUTE FUNCTION sync_rtw_verified();
