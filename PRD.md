# Product Requirements Document — Handby

**Version:** 1.0
**Date:** March 2026
**Author:** Rasheed Oloyede
**Status:** Active Development

---

## 1. Overview

**Handby** is a UK-focused two-sided marketplace that connects customers with verified local service providers (tradespeople, freelancers, and specialists). Customers find and contact professionals; providers showcase their work and manage incoming enquiries — all in one platform.

The in-product name is **Handby**. The repository and codebase are named `localexpert`.

---

## 2. Problem Statement

Finding a trustworthy local professional in the UK is fragmented and unreliable. Customers rely on word of mouth or wade through low-quality directory listings with fake reviews. Service providers — many of whom are sole traders — have no affordable, effective way to build an online presence or receive qualified leads.

**Handby solves both sides:**
- Customers get verified, rated providers they can contact instantly.
- Providers get a free profile, lead inbox, and portfolio without needing their own website.

---

## 3. Target Users

| User Type | Description |
|-----------|-------------|
| **Customer** | UK resident needing a home or personal service. Wants trust signals, transparent pricing, and a quick path to contact. |
| **Provider** | UK-based sole trader or small business offering a skilled service. Wants online visibility, inbound leads, and simple profile management. |

---

## 4. Core Features

### 4.1 Authentication
- Email/password sign-up and login via Supabase Auth
- Role selection at sign-up: `customer` or `provider`
- Forgot password / password reset flow
- Auth-gated routes enforced via middleware (`src/proxy.ts`)

### 4.2 Landing Page
- Animated hero section with call-to-action
- Category browser (up to 8 categories, emoji-tagged, links to filtered search)
- Animated testimonials carousel (pulls real 4-star+ reviews from the database)
- Trust signals section: Verified providers · Honest reviews · Fast responses
- Public navbar and footer

### 4.3 Provider Onboarding
Providers complete a setup flow before appearing in search results.

| Field | Required |
|-------|----------|
| Business name | Yes |
| Profile photo (uploaded to Supabase Storage) | No |
| Years of experience | No |
| Website URL | No |
| Availability toggle | Yes |
| Location (postcode to lat/lng via LocationDetector) | Recommended |
| Bio | No |

### 4.4 Services Management
Providers add individual services to their profile:
- Title (e.g. "Boiler repair and installation")
- Category (from 24 seeded categories)
- Pricing type: Fixed / Hourly / Quote only
- Starting price in GBP
- Description
- Services can be deleted; `is_active` flag controls search visibility

### 4.5 Portfolio
- Image upload to Supabase Storage with optional caption per image
- Grid display of up to 9 images on the public profile (newest first)

### 4.6 Search and Discovery
The `/search` page supports:

| Filter | Mechanism |
|--------|-----------|
| Keyword | Postgres full-text search on `fts` column |
| City | `ilike` match on city field |
| Category | Resolved via services-to-categories join |
| Location + radius | Haversine formula computed in-app (default 10 miles) |
| Availability | `is_available` flag |
| Sort | Distance / Rating (default) / Review count |

Results are capped at 48 providers. Each ProviderCard shows: avatar, business name, city, star rating, review count, primary category, distance (when geo is active), and minimum starting price.

### 4.7 Provider Public Profile (`/providers/[id]`)
- Header card: avatar, business name, availability badge, city, years of experience, rating, website link, bio
- Services list with pricing
- Portfolio photo grid
- Reviews list with star ratings and verified customer names
- Quote request form (visible to logged-in customers only; hidden for providers and guests)
- Dynamic page title and OpenGraph metadata for SEO

### 4.8 Lead System (Quote Requests)
- Customer submits a message and selects a service on the provider's profile
- Request is created with status: `pending`
- Provider can **Accept** or **Decline** pending requests
- Accepted requests move to **Active jobs**
- Provider marks active jobs as **Completed**
- Status badge colours: amber (pending) · emerald (accepted) · red (declined) · blue (completed)

### 4.9 Customer Dashboard
- List of all sent quote requests with current status
- History of reviews submitted by the customer

### 4.10 Reviews
- Customers submit a star rating (1–5) and optional written body
- Average rating and review count stored on `provider_details` and updated on each submission
- Reviews appear on the provider profile and feed the homepage testimonials carousel

### 4.11 Account Settings
- Update full name, email, bio, and city
- Available to both customers and providers

### 4.12 Legal and Compliance
- Terms of Service page (`/terms`)
- Privacy Policy page (`/privacy`)
- Cookies Policy page (`/cookies`)
- Cookie consent banner persisted in `localStorage`

---

## 5. Service Categories

24 categories seeded across two database migrations:

**Original 12:** Plumbing · Electrical · Cleaning · Catering · Carpentry · Painting · Gardening · Moving and Removals · Beauty and Wellness · Photography · Tutoring · IT and Tech Support

**March 2026 additions (demand-researched):** Locksmith · Roofing · Appliance Repair · Mobile Mechanic · Pet Care · Home and Elderly Care · Childcare · Personal Training · Pest Control · Solar and EV Install · Event Planning · Driving Instruction

---

## 6. Technical Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend / Database | Supabase (PostgreSQL, Auth, Storage) |
| Animations | Framer Motion |
| Hosting | TBD — Vercel recommended |
| Auth middleware | `src/proxy.ts` |

### Database Schema (inferred from codebase)

| Table | Key Columns |
|-------|-------------|
| `profiles` | id, role, full_name, avatar_url, city, postcode, lat, lng, bio |
| `provider_details` | id (FK), business_name, is_available, years_exp, website_url, avg_rating, review_count |
| `categories` | id, name, slug, icon |
| `services` | id, provider_id, category_id, title, price_type, price_from, description, is_active |
| `portfolio_items` | id, provider_id, image_url, caption |
| `quote_requests` | id, customer_id, provider_id, service_id, message, status |
| `reviews` | id, customer_id, provider_id, rating, body |

---

## 7. User Flows

### Customer: Find and Contact a Provider
1. Visit the homepage — browse by category or use the search bar
2. Apply filters (location, category, availability, sort order)
3. Click a provider card to view the full profile
4. Sign in and submit a quote request with a message
5. Track request status in the customer dashboard
6. Leave a review after the job is marked complete

### Provider: Get Found and Manage Leads
1. Sign up as a provider
2. Complete profile setup (business name, location, photo, bio)
3. Add services with categories and pricing
4. Upload portfolio photos
5. Appear in search results and receive quote requests
6. Accept or decline incoming requests
7. Mark accepted jobs as completed
8. Accumulate reviews to improve average rating and search ranking

---

## 8. Non-Functional Requirements

| Requirement | Detail |
|-------------|--------|
| Performance | Server-rendered search results; batch pricing query avoids N+1 |
| SEO | Dynamic title and OG metadata on all provider profile pages |
| Accessibility | shadcn/ui with semantic HTML and ARIA attributes |
| Security | Auth and role checks enforced server-side; no client-side bypass possible |
| Privacy | GDPR-aligned: cookie consent banner, privacy policy, no third-party analytics by default |
| Responsiveness | Tailwind grid adapts from 1 column on mobile to 3 columns on desktop |

---

## 9. Out of Scope (v1)

- In-app messaging or chat
- Payment processing or escrow
- Provider subscription plans or monetisation tiers
- Background checks or ID verification
- Email or push notifications
- Admin moderation dashboard
- Native mobile application

---

## 10. Success Metrics

| Metric | Description |
|--------|-------------|
| Provider sign-ups | Providers with completed profiles visible in search |
| Quote requests sent | Total customer-to-provider enquiries submitted |
| Request acceptance rate | Percentage of pending requests accepted by providers |
| Review submission rate | Percentage of completed jobs that receive a review |
| Search-to-contact rate | Percentage of search sessions ending in a quote request |

---

## 11. Development Phases

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Foundation: Next.js scaffold, Supabase auth, role-based dashboard shell | Complete |
| 2 | Provider onboarding: profile setup, services management, portfolio upload | Complete |
| 3 | Search and discovery: search page, provider profiles, ProviderCard component | Complete |
| 4 | Lead system: quote requests, customer and provider inboxes | Complete |
| 5 | Trust and polish: reviews, error/404 pages, loading skeletons, logo | Complete |
| 6 | UX enhancements: geo location detection, animated hero, testimonials, forgot password | Complete |
| 7 | Legal and settings: terms, privacy, cookies banner, avatar upload, account settings | Complete |
| 8+ | TBD | Planned |
