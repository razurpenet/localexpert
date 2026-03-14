# Tier 2: Trust Features Design

**Date:** 2026-03-12
**Scope:** Three trust features that compound into a visible "trust stack" on provider profiles and search cards.
**Core principle:** Speed to help is the north star. Trust signals reduce customer hesitation, getting them to request help faster.

---

## 1. Review Sub-Scores

### Schema

Add 3 optional columns to `reviews` table:

| Column | Type | Default | Constraint |
|--------|------|---------|------------|
| `punctuality` | smallint | null | CHECK (1-5) |
| `quality` | smallint | null | CHECK (1-5) |
| `value` | smallint | null | CHECK (1-5) |

Sub-scores are **optional** — the overall star rating remains the only required field. This keeps the review flow fast (one tap minimum) while providing richer data when customers choose.

### ReviewModal Changes

After the main 5-star picker and before the text comment, add a collapsible "Rate specific areas (optional)" section:

```
Punctuality    ★ ★ ★ ★ ☆
Quality        ★ ★ ★ ★ ★
Value          ★ ★ ★ ☆ ☆
```

- Smaller stars (20px vs 40px for main rating)
- Each row: label on left, 5 tappable stars on right
- All default to 0 (unset) — only included in INSERT if tapped
- Section appears after the main rating is selected (progressive disclosure)

### Provider Profile Display

Below the overall rating on provider detail page, show sub-score averages as horizontal progress bars:

```
Punctuality  ████████░░  4.2
Quality      █████████░  4.7
Value        ████████░░  4.1
```

- Only shown when provider has 3+ reviews that include sub-scores
- Calculated client-side from the reviews array (already fetched on provider detail page)
- No changes to `provider_details` — no server-side aggregation needed
- Bar fill colour: `#1E40AF`, track: `#E0E7FF`

### Files Touched
- `supabase/migrations/20260312_tier2_trust.sql` — ALTER TABLE
- `handby-mobile/components/ui/ReviewModal.tsx` — sub-score pickers + insert
- `handby-mobile/app/provider/[id].tsx` — sub-score bars display

---

## 2. Handby Verified Badge

### Criteria

A provider earns "Handby Verified" when ALL of:
- At least 1 credential with `verified = true`
- At least 3 completed reviews (`review_count >= 3`)
- Profile is complete (`avatar_url`, `bio`, and `city` all non-null on `profiles`)

### Schema

Add to `provider_details`:

| Column | Type | Default |
|--------|------|---------|
| `is_verified` | boolean | false |

### Auto-Calculation Trigger

`BEFORE UPDATE` trigger on `provider_details` (piggyback on the existing badge trigger):

```sql
NEW.is_verified := (
  NEW.review_count >= 3
  AND EXISTS (SELECT 1 FROM credentials WHERE provider_id = NEW.id AND verified = true)
  AND EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id AND avatar_url IS NOT NULL AND bio IS NOT NULL AND city IS NOT NULL)
);
```

This recalculates every time `provider_details` is updated (which happens on review insert, completion count change, etc.).

### Display

**Provider detail page** — Blue shield badge next to name:
```
John's Plumbing  [✓ Handby Verified]
```
- Icon: `shield-checkmark` (Ionicons)
- Style: `#DBEAFE` background, `#1E40AF` text, pill shape
- Positioned inline with name, after the existing badge (Top Pro / Rising Pro)

**Search result cards** — Small `shield-checkmark` icon (14px, `#1E40AF`) next to provider name in `ProviderResultCard`

**Provider dashboard** — If not verified, add checklist item in OnboardingChecklist:
- "Get Handby Verified" with requirements listed
- Shows which criteria are met vs pending

### Files Touched
- `supabase/migrations/20260312_tier2_trust.sql` — ALTER TABLE + trigger update
- `handby-mobile/app/provider/[id].tsx` — badge display
- `handby-mobile/components/search/ProviderResultCard.tsx` — verified tick
- `handby-mobile/components/provider/OnboardingChecklist.tsx` — verification prompt

---

## 3. Auto Response Time

### How It Works

A database trigger calculates the median response time from actual quote_request data. Fires when a provider first responds to a pending request (status → accepted or declined).

### Schema

No changes — `response_time_mins` already exists on `provider_details`.

### Trigger Logic

```sql
-- Fires AFTER UPDATE on quote_requests
-- When status changes FROM 'pending' TO 'accepted' or 'declined'
-- Calculates median of last 20 response times for the provider
-- Updates provider_details.response_time_mins
```

Steps:
1. Calculate `EXTRACT(EPOCH FROM (NOW() - created_at)) / 60` for this request
2. Query the provider's last 20 responded requests to get all response times
3. Calculate median (50th percentile)
4. UPDATE `provider_details SET response_time_mins = median`

Rolling window of 20 responses ensures recent performance matters more than historical.

### Display

Already implemented — zero frontend changes:
- Provider detail page shows "Xm response" or "Xh response" in stats row
- ProviderResultCard shows "Responds in ~Xm" badge
- Both read from `response_time_mins` and display nothing when null

### Files Touched
- `supabase/migrations/20260312_tier2_trust.sql` — trigger function

---

## 4. Migration Summary

Single migration file: `supabase/migrations/20260312_tier2_trust.sql`

```
1. ALTER TABLE reviews ADD COLUMN punctuality, quality, value
2. ALTER TABLE provider_details ADD COLUMN is_verified
3. UPDATE trigger update_provider_badge() to also set is_verified
4. CREATE FUNCTION update_provider_response_time()
5. CREATE TRIGGER on quote_requests for response time calc
```

## 5. Frontend Files Summary

| File | Change |
|------|--------|
| `components/ui/ReviewModal.tsx` | Add sub-score picker rows |
| `app/provider/[id].tsx` | Sub-score bars + verified badge |
| `components/search/ProviderResultCard.tsx` | Verified tick icon |
| `components/provider/OnboardingChecklist.tsx` | Verified checklist item |

## 6. What Does NOT Change

- Overall rating calculation (stays as single star average)
- Badge level system (new/rising/top — unchanged)
- Credential upload/display flow
- Review submission flow (sub-scores are additive, not replacing)
- Search and filter logic
- All navigation and screen layouts
