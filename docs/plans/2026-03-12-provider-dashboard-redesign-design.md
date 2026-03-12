# Provider Dashboard Redesign — Design Doc

**Date:** 2026-03-12
**Goal:** Fix broken review/rating/pending data pipeline and redesign the provider dashboard as a "command center" with live-updating stats, quick actions, and richer request cards.

---

## Problem

1. **DB trigger never applied** — `20260312_review_counter_trigger.sql` was written but never executed on the Supabase instance. `provider_details.avg_rating` and `review_count` are stuck at 0.
2. **No real-time on dashboard** — Stats are fetched once on mount and never update. Pending count, rating, and review count go stale immediately.
3. **Minimal dashboard** — Only 3 stat cards, an onboarding checklist, and a basic request list. No quick actions, no jobs-completed stat, no visual hierarchy.
4. **Reviews screen lacks summary** — No at-a-glance rating overview, no real-time updates.

---

## Fix 1: Data Pipeline

### New migration: `20260312_backfill_review_stats.sql`

- Re-apply the trigger functions (CREATE OR REPLACE) and triggers (idempotent)
- One-time backfill: UPDATE provider_details SET avg_rating and review_count from actual reviews rows
- This ensures existing data is correct AND future inserts auto-update

---

## Fix 2: Provider Dashboard Redesign

### Layout (top to bottom)

1. **Header** — "Welcome back, {name}" with avatar on left, notification bell on right
2. **Stats row (2x2 grid)** — 4 stat cards in a grid:
   - Pending requests (orange accent if >0, links to requests screen)
   - Rating (star icon, shows avg_rating)
   - Reviews (count, links to reviews screen)
   - Jobs completed (completion_count from provider_details)
   - Each card: icon + large number + label, tappable
3. **Onboarding checklist** — Only shown if < 5/5 complete. Auto-hides when all done.
4. **Quick actions (2x2 grid)** — Tappable cards:
   - View Requests (mail icon)
   - Manage Services (construct icon)
   - Portfolio Photos (images icon)
   - Credentials (shield-checkmark icon)
5. **Recent requests** — Top 5, richer cards matching requests screen style:
   - Avatar + name + service + status dot pill + relative date
   - "See all" link navigating to requests tab
6. **Pull-to-refresh** on the entire ScrollView

### Real-time subscriptions

- `quote_requests` filtered by `provider_id` — re-fetch requests + recalculate pending count
- `provider_details` filtered by `id` — re-fetch stats when trigger updates rating/review_count

---

## Fix 3: Reviews Screen Improvements

### Rating summary header (new)

- Card above review list showing:
  - Large avg rating number (e.g. "4.8")
  - 5 star icons filled to match
  - "{N} reviews" subtitle
  - Rating breakdown bars (5-star to 1-star distribution)
- Data: compute from local reviews array (already fetched)

### Real-time

- Subscribe to `reviews` table filtered by `provider_id`
- On INSERT: re-fetch reviews list so new reviews appear instantly

---

## Files Touched

| Area | File | Action |
|------|------|--------|
| Migration | `supabase/migrations/20260312_backfill_review_stats.sql` | Create |
| Dashboard | `handby-mobile/app/(provider)/index.tsx` | Rewrite |
| Reviews | `handby-mobile/app/(provider)/reviews.tsx` | Update |
| Checklist | `handby-mobile/components/provider/OnboardingChecklist.tsx` | Update (auto-hide) |

No new dependencies. Uses existing Supabase real-time + design tokens from `lib/theme.ts`.

---

## Design Tokens (from theme.ts)

All colours use the Trust & Speed visual refresh palette:
- Primary: `#1E40AF`, Background: `#EFF6FF`, Border: `#E0E7FF`
- CTA: `#F97316`, Text: `#1E3A8A` / `#475569` / `#94A3B8`
- Success: `#16A34A`, Warning: `#D97706`, Star: `#FACC15`
