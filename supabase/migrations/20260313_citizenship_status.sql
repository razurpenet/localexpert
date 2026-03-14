-- 2026-03-13: Add citizenship_status to provider_details
-- RTW Share Code verification only applies to non-UK/Irish providers.
-- UK/Irish citizens prove RTW via passport/birth certificate (Phase 2).

ALTER TABLE provider_details
  ADD COLUMN IF NOT EXISTS citizenship_status text
  CHECK (citizenship_status IN ('uk_irish', 'settled', 'pre_settled', 'visa', 'other'));

-- Default: NULL (not yet declared). Provider must set this before RTW prompt appears.

COMMENT ON COLUMN provider_details.citizenship_status IS
  'uk_irish = British/Irish citizen (no Share Code needed), settled = ILR/Settled Status, pre_settled = Pre-Settled Status, visa = Work visa holder, other = Other immigration status';
