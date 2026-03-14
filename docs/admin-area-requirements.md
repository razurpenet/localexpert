# Handby Admin Area Requirements

> **Purpose:** Ensure Handby delivers on its mission — helping customers find reliable providers and helping providers (especially immigrants) build their businesses in the UK.

**Last updated:** 2026-03-14

---

## 1. Verification & Trust (P0 — Critical for Launch)

### RTW Verification Queue
- List all pending RTW submissions (share code + DOB + provider name)
- Admin checks gov.uk/view-right-to-work, marks verified/rejected with reviewer notes
- Expiry date tracking — alert when RTW is expiring within 30 days
- Auto-suspend providers whose RTW has expired
- **Why:** Providers submit share codes today but nobody can action them — blocks their verified badge

### Credential Verification Queue
- Pending credential uploads (Gas Safe, DBS, insurance, waste carrier, other)
- View uploaded document (PDF/image from Supabase Storage)
- Admin reviews, marks verified/rejected with notes
- Expiry tracking + renewal reminder alerts
- Insurance: verify coverage amount + insurer name match document
- **Why:** Same — providers upload certs but can't get verified without admin action

### Provider Approval Dashboard
- New provider onboarding progress at a glance
- Incomplete profiles: missing photo, no services listed, no location
- Days since signup vs completion percentage
- Nudge/email trigger for stalled onboarding
- **Why:** Supply is everything pre-launch — need to convert signups to active providers

---

## 2. Quote Request Pipeline (P0 — Is the Marketplace Working?)

### Active Pipeline View
- All requests by status: pending → accepted → confirmed → en_route → in_progress → completed
- Filter by: date range, category, area (postcode), provider, customer
- Stale requests: pending > 24h with no provider response — needs intervention
- Declined patterns: why are providers saying no? (category mismatch? pricing? location?)

### Conversion Funnel
- Request created → Provider accepted → Job confirmed → Job completed → Review left
- Drop-off rates at each stage
- Time-to-accept (how long before provider responds)
- Completion rate (completed vs cancelled/declined)
- Review rate (% of completed jobs that get a review)

### Intervention Triggers
- Request pending > 24h → admin can suggest alternative providers to customer
- Multiple declines on same request → flag for manual matching
- Provider accepted but no chat activity for 48h → nudge both parties

---

## 3. User & Provider Management (P1)

### User Directory
- Search/filter all users by: role, name, email, city, postcode, signup date, status
- View full profile with activity summary:
  - Customer: requests made, reviews left, favourite providers
  - Provider: services, rating, response time, completion count, credentials, RTW status
- Account actions: suspend, ban, reactivate (with reason logging)
- View as user (see what their dashboard looks like — for support)

### Provider Health Metrics
- Response time trends per provider (getting slower? faster?)
- Acceptance/decline rate — providers who decline everything waste customer time
- Inactive flag: `is_available = true` but hasn't responded to anything in 14+ days
- Rating decline alerts: provider dropping below 3.5 stars
- Providers with 0 completed jobs after 30+ days — needs onboarding help

### Customer Health Metrics
- Customers who searched but never requested a quote — where's the friction?
- Customers who requested but never got a response — supply gap
- Repeat booking rate per customer — loyalty indicator
- Customers who left negative reviews — follow up for retention

---

## 4. Supply & Demand Operations (P1)

### Category Coverage Map
- Providers per category per postcode district (e.g., ME14, ME15, ME16, ME17, ME20)
- Highlight gaps: "0 plumbers in ME16" → trigger targeted recruitment
- Provider density vs customer search volume by area
- Underserved categories in target launch area (Maidstone)

### Demand Heatmap
- Where are customers searching from? (by postcode/city)
- What categories are they searching for?
- Searches with 0 results → biggest supply gap
- Search-to-request conversion by category and area

### Geographic Coverage
- Map view of active providers (pins by location)
- Overlay customer search locations
- Radius coverage: which areas have good provider density?
- Expansion planning: which adjacent area to target next?

---

## 5. Content Moderation (P2)

### Review Moderation
- Flagged/reported reviews queue
- Ability to hide reviews that violate guidelines (never delete — audit trail)
- Review sentiment analysis trends per provider
- Detect suspicious patterns: multiple 5-star reviews from new accounts
- **Note:** Reviews are immutable in DB (UPDATE/DELETE blocked by RLS) — admin uses service role

### Message Monitoring
- Flagged conversations (reported by users)
- Keyword detection: phone numbers, email addresses in early messages (off-platform risk)
- Profanity/abuse detection
- Safety concerns: threats, harassment → immediate suspension
- **Why:** Protects commission revenue and user safety

### Photo/Content Moderation
- New portfolio uploads queue (or automated NSFW detection via API)
- Credential document review (tied to verification queue)
- Profile photo review (optional — low priority)

---

## 6. Financial & Compliance (P2)

### Commission Tracking
- Revenue per completed job (commission amount)
- Total revenue: daily, weekly, monthly
- Commission rates by category (10-15%)
- Average job value by category
- Stripe Connect status per provider: onboarded? active? payouts failing?

### Compliance Dashboard
- **RTW expiry calendar:** Which providers' RTW expires this month/quarter?
- **Insurance expiry tracking:** Which credentials expire soon?
- **DBS renewal dates:** Flag overdue renewals
- **Auto-actions:** Providers with expired critical credentials → auto-hide from search or suspend badge
- **Audit log:** Who verified what, when, with what notes

### Stripe Health
- Providers not yet onboarded to Stripe Connect
- Failed payouts or restricted accounts
- Disputed charges / chargebacks
- Revenue reconciliation

---

## 7. Platform Health & KPIs (P1)

### Growth Metrics
- Daily/weekly signups split by role (customer vs provider)
- Active users: DAU / WAU / MAU
- Provider-to-customer ratio by area
- First-job-completed rate for new providers (time to first completion)

### Quality Metrics
- Platform average rating trend (weekly)
- Job completion rate (completed ÷ total non-cancelled)
- Average response time across all providers
- Repeat booking rate (returning customers)
- Review submission rate (reviews ÷ completed jobs)
- NPS proxy: % of 4-5 star reviews vs 1-2 star

### Maidstone Soft Launch Dashboard
- Provider count vs target (goal: 50-100 before launch)
- Category coverage in target postcodes (ME14, ME15, ME16, ME17, ME20)
- Customer acquisition in Maidstone area
- First 100 completed jobs tracker
- Top performing categories
- Provider satisfaction signals (are they staying active?)

---

## 8. Support & Disputes (P2)

### Dispute Resolution Queue
- Customer complaints about providers (and vice versa)
- View full conversation history for any request (read-only)
- Job status timeline (when was each status set?)
- Resolution actions: refund customer, credit provider, adjust review, suspend account
- Resolution notes + outcome tracking

### In-App Reporting
- "Report a problem" flow from customer/provider → admin queue
- Categories: safety concern, quality issue, payment problem, harassment, other
- Priority levels: safety = immediate, payment = 24h, quality = 48h
- Status tracking: open → investigating → resolved

### Common Support Scenarios
- Provider no-show → refund + flag provider
- Job quality dispute → mediate via message history
- Payment not received → check Stripe Connect status
- Account access issues → password reset support
- Provider wants to change category → guide through service management

---

## 9. Communications & Engagement (P3)

### Provider Engagement
- Onboarding email sequences (nudge incomplete profiles)
- Weekly digest: "You had X views, Y requests this week"
- Re-engagement: "You haven't been active in 14 days"
- Achievement notifications: "You earned Rising Star badge!"

### Customer Engagement
- Welcome sequence after signup
- "Your request was accepted!" push + email
- Post-job: "How was your experience? Leave a review"
- Re-engagement: "Need help with something? Top providers near you"

### Broadcast Tools
- Send announcement to all providers (e.g., new feature, policy change)
- Send targeted message to providers in specific category/area
- Push notification management (don't spam)

---

## Implementation Priority

| Priority | Feature | Effort | Launch Blocker? |
|----------|---------|--------|-----------------|
| **P0** | RTW verification queue | Medium | Yes — providers can't get verified |
| **P0** | Credential verification queue | Medium | Yes — same reason |
| **P0** | Quote request pipeline view | Medium | Yes — need to know marketplace works |
| **P1** | User directory with suspend | Medium | No — but needed week 1 |
| **P1** | Supply/demand gap map | Large | No — but critical for recruitment |
| **P1** | KPI dashboard | Medium | No — but can't manage without it |
| **P1** | Provider health metrics | Small | No — helps retention |
| **P2** | Message moderation | Medium | No — reactive initially |
| **P2** | Dispute resolution | Medium | No — low volume at launch |
| **P2** | Commission tracking | Small | No — Stripe dashboard covers basics |
| **P2** | Compliance expiry calendar | Small | No — few providers initially |
| **P2** | Review moderation | Small | No — manual review sufficient |
| **P3** | Photo moderation | Small | No |
| **P3** | Communications/engagement tools | Large | No — manual emails first |
| **P3** | Geographic map view | Large | No — spreadsheet can work initially |

---

## Technical Notes

### Auth & Access Control
- Admin area lives in Next.js web app at `/admin/*`
- Protected by role check: `profiles.role = 'admin'` (need to add admin role)
- All admin mutations use `createAdminClient()` (service role) from [admin.ts](src/lib/supabase/admin.ts)
- Admin bypasses RLS — can read/write all tables
- Audit log every admin action (who did what, when, to whom)

### Database Changes Needed
- Add `'admin'` to role enum on profiles table
- Create `admin_audit_log` table (admin_id, action, target_table, target_id, details JSONB, created_at)
- Add `suspended_at`, `suspended_reason` columns to profiles
- Add `reviewer_id`, `reviewed_at` columns to credentials table
- Add `hidden_at`, `hidden_by`, `hidden_reason` to reviews table

### Security Considerations
- Admin actions must be server-side only (Next.js server actions)
- Service role key never exposed to client
- All admin routes behind middleware role check
- Rate limit admin API endpoints
- Two-factor auth for admin accounts (Phase 2)
- IP allowlisting for admin access (Phase 3)

---

## MVP Admin vs Full Admin

### MVP (Launch): Supabase Dashboard + Simple Pages
For the Newham soft launch with <100 providers, we can start lean:
- RTW queue: simple server-rendered page with approve/reject buttons
- Credential queue: same pattern
- Pipeline view: server-rendered table with filters
- User list: searchable table with suspend button
- KPIs: single dashboard page with key numbers

### Full Admin (Post-Launch): Proper Dashboard
Once volume justifies it:
- Real-time dashboards with charts (Recharts or similar)
- Map views (Mapbox or Google Maps)
- Advanced filtering and export
- Role-based admin permissions (support vs ops vs owner)
- Automated alerts and workflows
