-- Portfolio albums table
CREATE TABLE IF NOT EXISTS portfolio_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(provider_id, name)
);

ALTER TABLE portfolio_albums ENABLE ROW LEVEL SECURITY;

-- Providers can manage their own albums
CREATE POLICY "Providers manage own albums"
  ON portfolio_albums FOR ALL
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

-- Anyone can view albums (for customer profile page)
CREATE POLICY "Anyone can view albums"
  ON portfolio_albums FOR SELECT
  USING (true);
