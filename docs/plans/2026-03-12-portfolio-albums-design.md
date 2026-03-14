# Portfolio Albums Design

## Overview

Allow providers to organize their portfolio photos into named albums (e.g., "Kitchen Renovations", "Bathroom Installs"). Customers see filter chips on the provider profile to browse by album.

## Scope

- **Provider-only** album management (customers view only)
- Auto-cover (first photo in album)
- Upload order (newest first), no manual reorder
- Soft limit of 12 albums per provider
- Reuses existing `album` field on `portfolio_items`

## Data Model

### New table: `portfolio_albums`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| provider_id | uuid FK → profiles | NOT NULL |
| name | text | NOT NULL, e.g. "Kitchen Renovations" |
| sort_order | int | default 0 |
| created_at | timestamptz | default now() |

- Unique constraint on (provider_id, name)
- RLS: providers CRUD own albums only
- Cover photo derived at query time: first portfolio_item with matching album name ordered by created_at ASC

### Existing table: `portfolio_items`

- `album` column (text, nullable) — already exists but unused
- `null` album = uncategorized, shown in "All" view
- Set album value to match `portfolio_albums.name`

## Provider Photos Screen (photos.tsx)

- **Album bar**: horizontal ScrollView of chips at top
  - "All" chip (default, always first)
  - Album name chips with × to delete
  - "+" button at end to create new album
- Selecting an album chip filters the grid
- Uploading while an album is selected auto-assigns the photo to that album
- Tap photo → bottom sheet: "Move to Album" (picker), "Delete"
- Long-press album chip → edit name or delete (photos become uncategorized)
- Max 12 albums enforced client-side

## Customer Profile View (provider/[id].tsx)

- Filter chips row above photo grid: "All" + album names
- Tap chip to filter displayed photos
- View only — no edit capability

## Migration

```sql
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

CREATE POLICY "Providers manage own albums"
  ON portfolio_albums FOR ALL
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Anyone can view albums"
  ON portfolio_albums FOR SELECT
  USING (true);
```
