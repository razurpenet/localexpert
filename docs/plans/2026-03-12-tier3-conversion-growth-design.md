# Tier 3: Conversion & Growth — Design

**Date:** 2026-03-12
**Scope:** Four features that convert browsing into bookings and keep both sides coming back. Each feature directly attacks a weakness in Checkatrade, Bark, or TaskRabbit.
**Core principle:** Speed to help is the north star. These features reduce friction between "found a provider" and "job done".

---

## Competitor Analysis

### Checkatrade
- Directory model, ~£90-140/month subscription (some report £2000/year renewals)
- Strengths: strong brand trust, background checks, "Checkatrade Guarantee"
- Weaknesses: high fixed fees regardless of leads, poor lead quality, locked into annual contracts, limited cancellation window, providers can't see ROI

### Bark
- Credit-based lead generation — providers pay per lead to unlock customer contact details
- No subscription or commission on completed work
- Weaknesses: "race to the bottom" pricing, providers pay for leads that often don't convert, many reported fake/low-quality leads, no ongoing relationship

### TaskRabbit
- Task-based marketplace (owned by IKEA), taskers set own rates
- Weaknesses: metro-only coverage (poor in smaller UK cities/rural), highly variable quality, terrible customer service, basic matching algorithm, limited to predefined task types

### Handby's Position
- No lead fees, no subscription fees (pre-monetisation phase)
- Already has: trust stack (badges, verified, sub-scores), speed signals (response time, availability), real-time chat
- Missing: structured quoting, smart discovery, rebooking, provider ROI visibility

---

## 1. Instant Quote with Price Transparency

### Problem
Customer finds a provider and sends a free-text message. Provider quotes back manually. This is slow and unstructured — neither side has pricing context upfront.

**Attacks:** Bark's pay-per-lead model (customers see prices before committing), Checkatrade's opaque pricing (no upfront cost visibility).

### Schema

```sql
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS urgency       text DEFAULT 'flexible'
    CHECK (urgency IN ('flexible', 'this_week', 'urgent')),
  ADD COLUMN IF NOT EXISTS preferred_date date,
  ADD COLUMN IF NOT EXISTS preferred_time text,
  ADD COLUMN IF NOT EXISTS quoted_price   decimal(10,2);
```

### Customer Flow

On provider profile page, replace the free-text quote form with a structured form:

1. **Service picker** — Dropdown/list of provider's services (from `services` table). Each shows "From £X" pricing.
2. **Job description** — Text field for details (kept from current flow)
3. **Preferred date** — Date picker, optional
4. **Preferred time** — Morning / Afternoon / Evening / Flexible
5. **Urgency** — Flexible (default) / This Week / Urgent
6. **Price indicator** — Shows "From £X" based on selected service

The request is saved to `quote_requests` with `service_id`, `urgency`, `preferred_date`, `preferred_time`.

### Provider Flow

Provider receives a structured request card showing:
- Customer name + message
- Selected service + "From £X" reference price
- Preferred date/time + urgency level
- **"Accept with Quote" button** — Opens a quick modal: enter `quoted_price`, optional note, tap confirm

On accept, `quoted_price` is saved and the customer gets a push notification: "John quoted £85 for your boiler repair".

### Files Touched
- `app/provider/[id].tsx` — Replace free-text form with structured quote request form
- `app/(provider)/requests.tsx` — Show structured details + "Accept with Quote" flow
- `app/(customer)/bookings.tsx` — Show quoted price on accepted jobs
- Migration SQL

---

## 2. Smart Search Ranking

### Problem
Search results come back unranked. A new provider with 0 reviews appears alongside a Top Pro with 50 completed jobs. Customers have to manually evaluate each result.

**Attacks:** TaskRabbit's poor matching, Bark's indiscriminate lead blasting.

### Ranking Algorithm

Client-side sort using existing data (no new columns, no database changes):

```
score = (avg_rating × 0.30)
      + (response_speed_score × 0.25)
      + (completion_score × 0.20)
      + (availability_bonus × 0.15)
      + (distance_score × 0.10)
```

Where:
- **avg_rating** — Normalised 0-1 from `provider_details.avg_rating` (divide by 5)
- **response_speed_score** — From `response_time_mins`: under 30m = 1.0, under 2h = 0.7, under 24h = 0.3, null = 0
- **completion_score** — `min(completion_count / 20, 1.0)` — maxes out at 20 jobs
- **availability_bonus** — 1.0 if `is_available = true`, 0.0 if not
- **distance_score** — Inverse of distance using `lat/lng` on `profiles`. Closest = 1.0, linear falloff. Requires customer location (already captured via location detection on home screen).

### Customer Experience

- Results sorted by score, best match first
- **"Best Match" badge** on the #1 result card (small amber pill)
- **Filter chips** above results: "Available Now", "Top Rated", "Fastest Response"
  - Each chip adjusts the weight: e.g. "Available Now" sets availability_bonus to 0.50 weight
  - Chips are toggle-able, multiple can be active

### Schema Changes

None. All data already exists in `profiles` (lat, lng) and `provider_details` (avg_rating, response_time_mins, completion_count, is_available).

### Files Touched
- `app/(customer)/search.tsx` — Add `rankProviders()` function, filter chips, apply sort
- `components/search/ProviderResultCard.tsx` — Optional "Best Match" badge prop

---

## 3. Repeat Booking (Book Again)

### Problem
When a customer is happy with a provider, they have no quick way to rebook them. They'd have to search again, find the provider, and send a new request from scratch. None of the three competitors have a rebooking feature.

**Attacks:** All three — Checkatrade, Bark, and TaskRabbit all treat every job as a brand-new lead with zero relationship memory.

### Schema

```sql
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS rebooking_of uuid REFERENCES quote_requests(id);
```

Links the new request back to the original completed job.

### Customer Flow

On the bookings screen, completed jobs show a **"Book Again"** button (alongside existing "Leave Review"):
- Tapping it navigates to the provider's profile page with query params: `?rebook=true&serviceId=<original_service_id>&originalRequestId=<id>`
- The quote request form pre-fills:
  - Service picker pre-selects the original service
  - Message pre-fills: "Repeat booking — previously hired for [service title]"
  - `rebooking_of` is set to the original request ID
- Customer adjusts date/details as needed and sends

### Provider Experience

On the incoming request card, if `rebooking_of` is set:
- **"Repeat Customer"** badge in green (`#DCFCE7` bg, `#16A34A` text)
- Signals that this customer was satisfied and came back — strong conversion signal

### Files Touched
- `app/(customer)/bookings.tsx` — "Book Again" button on completed jobs
- `app/provider/[id].tsx` — Read rebook query params, pre-fill form
- `app/(provider)/requests.tsx` — "Repeat Customer" badge on request cards
- Migration SQL

---

## 4. Provider Earnings Dashboard

### Problem
Checkatrade providers complain they can't tell if their subscription is worth it. Providers need to see clear ROI from Handby — especially important before Handby introduces monetisation (GTM Phase 4).

**Attacks:** Checkatrade's poor ROI visibility — providers paying £100+/month with no clear earnings tracking.

### Data Source

All data derives from `quote_requests`:
- `quoted_price` (added in Feature 1) for earnings
- `status = 'completed'` + `completed_at` for filtering
- `status IN ('accepted', 'declined')` vs total for response rate

### Screen Layout

New screen: `app/(provider)/earnings.tsx`

**Header stats (3 cards in a row):**

| Stat | Calculation |
|------|------------|
| This Month (£) | SUM of `quoted_price` WHERE `status = 'completed'` AND `completed_at` in current month |
| Jobs This Month | COUNT WHERE `status = 'completed'` AND `completed_at` in current month |
| Response Rate | (accepted + declined) / total received × 100% |

**Weekly earnings chart (last 4 weeks):**
- 4 vertical bars, one per week
- Height proportional to that week's total `quoted_price` for completed jobs
- Built with plain `View` elements — proportional heights, no charting library
- Week labels below: "W1", "W2", "W3", "This Week"

**Recent completed jobs list:**
- Last 10 completed jobs
- Each row: customer name (from `profiles` via `customer_id`), service title, date, quoted price
- Tappable to view full job details

### Provider Dashboard Integration

On the main provider dashboard (`app/(provider)/index.tsx`):
- Add "Earnings" to quick actions grid (cash-outline icon)
- Optionally show "£X this month" in the stats grid

### Schema Changes

None. Everything derives from existing + Feature 1 columns.

### Data Dependency

Requires Feature 1 (Instant Quote) to be implemented first — `quoted_price` must exist and have data for earnings to be meaningful.

### Files Touched
- Create: `app/(provider)/earnings.tsx` — New earnings screen
- Modify: `app/(provider)/index.tsx` — Earnings quick action + optional stat
- Modify: `app/(provider)/_layout.tsx` — Consider adding Earnings tab (or keep as quick action)

---

## 5. Migration Summary

Single migration file: `supabase/migrations/20260312_tier3_conversion_growth.sql`

```
1. ALTER TABLE quote_requests ADD COLUMN urgency, preferred_date, preferred_time, quoted_price
2. ALTER TABLE quote_requests ADD COLUMN rebooking_of (FK to self)
```

Two ALTER statements, no new tables, no triggers, no functions.

## 6. Frontend Files Summary

| File | Feature | Change |
|------|---------|--------|
| `app/provider/[id].tsx` | 1, 3 | Structured quote form + rebook pre-fill |
| `app/(provider)/requests.tsx` | 1, 3 | Accept with price + repeat customer badge |
| `app/(customer)/bookings.tsx` | 1, 3 | Show quoted price + "Book Again" button |
| `app/(customer)/search.tsx` | 2 | Ranking function + filter chips |
| `components/search/ProviderResultCard.tsx` | 2 | "Best Match" badge |
| `app/(provider)/earnings.tsx` | 4 | New earnings screen |
| `app/(provider)/index.tsx` | 4 | Earnings quick action |
| `app/(provider)/_layout.tsx` | 4 | Optional tab bar update |

## 7. What Does NOT Change

- Review system (Tier 2 — complete)
- Badge/verified system (Tier 2 — complete)
- Response time auto-calculation (Tier 2 — complete)
- Chat system (Phase 8 — complete)
- Push notifications infrastructure
- Auth flows
- Provider onboarding checklist
- Category/service management

## 8. Implementation Order

1. **Feature 1 (Instant Quote)** — Must come first, adds `quoted_price` column needed by Feature 4
2. **Feature 2 (Smart Ranking)** — Independent, can run in parallel with Feature 1
3. **Feature 3 (Repeat Booking)** — Depends on Feature 1's structured form
4. **Feature 4 (Earnings Dashboard)** — Depends on Feature 1's `quoted_price` data
