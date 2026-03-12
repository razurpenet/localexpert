# In-Chat Quotes & Bookings — Design

**Date:** 2026-03-12
**Goal:** Let providers send quotes and booking proposals as interactive cards within the chat conversation. Customers accept/decline directly on the card. Booking is gated behind an accepted quote.

**Tech Stack:** React Native, Expo Router, Supabase (postgres_changes real-time), TypeScript, existing `quotes` and `appointments` tables.

---

## 1. Data Model

### Messages table changes

Add two columns to `messages`:

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `type` | TEXT | `'text'` | `CHECK (type IN ('text', 'quote', 'booking'))` |
| `metadata` | JSONB | NULL | Stores `{ quote_id }` or `{ appointment_id }` |

Existing messages are unaffected — they default to `type='text'`, `metadata=NULL`.

### Existing tables used as-is

**`quotes`** (already exists):
- `id`, `request_id`, `provider_id`, `customer_id`
- `items` (JSONB array of `{description, amount}`)
- `subtotal`, `vat_rate`, `vat_amount`, `discount`, `total`
- `notes`, `status` (`draft`, `sent`, `accepted`, `rejected`)

**`appointments`** (already exists):
- `id`, `request_id`, `provider_id`, `customer_id`
- `date`, `time_slot`, `notes`
- `status` (`scheduled`, `completed`, `cancelled`)

### New column on appointments

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `quote_id` | UUID | NULL | FK to `quotes(id)` — links booking to the accepted quote |

### RLS updates

- `quotes`: providers can INSERT/UPDATE (own rows), both participants can SELECT
- `messages`: existing policies cover new columns (no changes needed — participants can read/write)

---

## 2. Chat UI Changes

### Action button

Add a `+` button to the left of the text input in the chat screen. Tapping it opens a small action menu:

| Action | Icon | Available when |
|--------|------|---------------|
| Send Quote | `document-text` | Provider only, request status = `accepted` |
| Book Appointment | `calendar` | Provider only, a quote with `status='accepted'` exists for this request |

### Quote bottom sheet (provider only)

Provider taps "Send Quote" → bottom sheet slides up:

- **Line items**: dynamic list of `{description, amount}` rows with "Add item" button
- **VAT toggle**: optional, defaults to 20% when enabled
- **Discount**: optional numeric field
- **Auto-calculated**: subtotal, VAT amount, total
- **Notes**: optional textarea
- **"Send Quote" button**

On send:
1. INSERT into `quotes` with `status='sent'`
2. INSERT into `messages` with `type='quote'`, `metadata={ quote_id }`
3. Both appear in real-time via existing subscription

### Quote card (renders in chat)

```
+-------------------------------+
|  [doc-icon] Quote  ·  £138.00 |
|  2 items · incl. VAT          |
|  "Boiler repair + parts"      |
|                               |
|  [Accept]  [Decline]          |  <- customer only, when status=sent
|                               |
|  Status pill: Sent/Accepted   |
+-------------------------------+
```

- Card style: `colors.surface` background, `colors.border` border, `radius.lg`, `shadow.card`
- Status `sent`: amber pill. Status `accepted`: green pill. Status `rejected`: red pill.
- Accept/Decline buttons only visible to customer when `quotes.status = 'sent'`
- Tapping the card expands to show full line item breakdown

**Customer taps Accept:**
1. UPDATE `quotes` SET `status = 'accepted'`
2. "Book Appointment" action unlocks in the `+` menu

**Customer taps Decline:**
1. UPDATE `quotes` SET `status = 'rejected'`
2. Provider can send a revised quote (new row)

### Booking bottom sheet (provider only, gated)

Only available when a quote with `status='accepted'` exists for this request.

Provider taps "Book Appointment" → bottom sheet slides up:

- **Date picker**: native date picker
- **Time picker**: native time picker
- **Notes**: optional textarea
- **Total from quote**: displayed read-only (pulled from the accepted quote)
- **"Send Booking" button**

On send:
1. INSERT into `appointments` with `status='scheduled'`, `quote_id` set
2. INSERT into `messages` with `type='booking'`, `metadata={ appointment_id }`

### Booking card (renders in chat)

```
+-------------------------------+
|  [calendar-icon] Booking      |
|  Sat, 22 Mar · 10:00 AM      |
|  Total: £138.00               |
|                               |
|  [Confirm]  [Decline]         |  <- customer only, when status=scheduled
|                               |
|  Status pill: Pending/Confirmed|
+-------------------------------+
```

- Same card styling as quote card
- Status `scheduled`: amber pill. Status `confirmed` (derived from appointment completion): green pill.
- Confirm/Decline buttons only visible to customer when `appointments.status = 'scheduled'`

**Customer taps Confirm:**
1. UPDATE `appointments` SET `status = 'completed'` (or a new `confirmed` status — see below)
2. UPDATE `quote_requests` SET `status = 'confirmed'`, `confirmed_at = NOW()`
3. Job enters the existing timeline flow (confirmed → en_route → in_progress → completed)

**Customer taps Decline:**
1. UPDATE `appointments` SET `status = 'cancelled'`
2. Provider can send a new booking proposal

### Appointments status addition

Add `'confirmed'` to the `appointments.status` CHECK constraint:
```sql
CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled'))
```

When customer confirms a booking: `appointments.status = 'confirmed'`.

---

## 3. State Rules

```
QUOTE FLOW:
  Provider sends quote     → quotes.status = 'sent'
  Customer accepts         → quotes.status = 'accepted'  → unlocks booking
  Customer declines        → quotes.status = 'rejected'  → provider can resend

BOOKING FLOW (gated behind accepted quote):
  Provider sends booking   → appointments.status = 'scheduled'
  Customer confirms        → appointments.status = 'confirmed'
                           → quote_requests.status = 'confirmed'
  Customer declines        → appointments.status = 'cancelled' → provider can resend

PERMISSIONS:
  Quote:   Provider = send        Customer = accept/decline
  Booking: Provider = send        Customer = confirm/decline
  Cards:   Both see the card      Action buttons only for the acting party
```

---

## 4. Real-Time

The existing real-time subscription on `messages` (filtered by `request_id`) already handles new quote and booking messages — no additional subscriptions needed.

For quote/booking status updates (accept, confirm), the chat screen should also subscribe to:
- `quotes` changes (filtered by `request_id`) — to update card status pills
- `appointments` changes (filtered by `request_id`) — to update booking card status

---

## 5. Files Summary

### Migration
- `supabase/migrations/20260312_in_chat_quotes_bookings.sql`
  - ALTER TABLE messages ADD COLUMN type, metadata
  - ALTER TABLE appointments ADD COLUMN quote_id, ADD 'confirmed' to status CHECK
  - RLS policy for quotes (if not already present)

### New components
- `handby-mobile/components/chat/QuoteCard.tsx` — renders quote card in chat
- `handby-mobile/components/chat/BookingCard.tsx` — renders booking card in chat
- `handby-mobile/components/chat/QuoteBottomSheet.tsx` — quote creation form
- `handby-mobile/components/chat/BookingBottomSheet.tsx` — booking creation form
- `handby-mobile/components/chat/ChatActionMenu.tsx` — the `+` button action menu

### Modified files
- `handby-mobile/app/chat/[requestId].tsx` — add action button, render cards by message type, subscribe to quotes/appointments

## 6. What Does NOT Change

- Text messaging (existing flow untouched)
- Job timeline (confirmed → en_route → in_progress → completed)
- Review system
- Push notifications (existing trigger fires on status changes)
- Web platform chat (out of scope for this iteration — mobile only)
