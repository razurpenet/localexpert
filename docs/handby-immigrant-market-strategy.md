# Handby — Immigrant Market Strategy & Feature Roadmap
> Last updated: March 2026
> Status: STRATEGIC PLANNING
> Based on: Gemini deep research (fact-checked & expanded)

---

## EXECUTIVE SUMMARY

The UK has 11.4 million non-UK-born residents (ONS, 2023 estimate). A massive chunk of this population is either **skilled tradespeople locked out of the formal market** or **customers who can't access trusted local services** because they lack the social capital that native Brits rely on (pub networks, school-run referrals, Nextdoor groups).

Handby can become the **"compliance-first" bridge** that turns this double-sided pain into a competitive moat. The key insight: **don't clone Checkatrade for immigrants — build the infrastructure layer that makes compliance effortless, and the marketplace follows.**

---

## PART 1 — RESEARCH VALIDATION & FACT-CHECK

### What the Gemini research got RIGHT

| Claim | Verdict | Source |
|---|---|---|
| Border Security Act 2025 expands RTW checks to gig platforms | **CONFIRMED.** Royal Assent 2 Dec 2025. Platforms that match service providers with customers for remuneration must conduct RTW checks. Civil penalties up to £60,000/breach. Implementation date TBD (expected 2026–2027 after consultation). | [Cartwright King](https://cartwrightking.co.uk/articles/immigration/the-2025-border-security-asylum-and-immigration-act-explained/), [Paragon Law](https://www.paragonlaw.co.uk/resources/border-security-asylum-immigration-act-illegal-working-employer-liability), [DLA Piper](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2025/redefining-employer-liability-the-uks-border-security-asylum-immigration-bill-2025) |
| Making Tax Digital for sole traders from April 2026 | **CONFIRMED** but threshold is **£50,000+** (not all sole traders). Drops to £30k in 2027, £20k in 2028. Quarterly digital updates required. | [GOV.UK MTD](https://www.gov.uk/government/collections/making-tax-digital-for-income-tax-for-businesses-step-by-step), [GOV.UK Press](https://www.gov.uk/government/news/act-now-864000-sole-traders-and-landlords-face-new-tax-rules-in-two-months) |
| UK home improvement market is massive | **CONFIRMED.** £15 billion (2025), projected £21.8B by 2034. 1 in 3 Brits plan major home upgrades in 2026. 35% struggled to find a tradesperson. | [IMARC Group](https://www.imarcgroup.com/uk-home-improvement-market), [Bob FM](https://www.bobfm.co.uk/one-in-three-britons-plan-major-home-upgrades-in-2026-despite-cost-of-living-pressures/) |
| Zego offers pay-as-you-go public liability insurance | **CONFIRMED.** Hourly/daily/weekly/monthly/annual. Up to £1M cover. Available via app. | [Zego](https://www.zego.com/blog/what-insurance-should-tradespeople-have/), [Insurance Times](https://www.insurancetimes.co.uk/gig-economy-start-up-launches-pay-as-you-go-public-liability-cover/1427660.article) |
| Renters' Rights Act extends Awaab's Law to private sector | **CONFIRMED.** From 1 May 2026, private landlords must fix emergency hazards within 24 hours, investigate damp/mould within 10 working days. Penalties up to £40,000. | [GOV.UK](https://www.gov.uk/government/publications/guide-to-the-renters-rights-act/guide-to-the-renters-rights-act), [CP Law](https://www.cplaw.co.uk/insights/renters-rights-act-2026-key-changes-for-landlords-and-tenants-explained/) |
| Newham: 53.7% non-UK born, most ethnically diverse London borough | **CONFIRMED.** No single ethnic group forms a majority. White British only 16–18%. | [London City News](https://londoncity.news/london-boroughs-population-2025-demographics-growth/), [Wikipedia](https://en.wikipedia.org/wiki/London_Borough_of_Newham) |
| 11M+ non-UK born residents | **CONFIRMED.** 11.4 million non-UK-born in England & Wales (ONS, June 2023). | [Parliament Research](https://commonslibrary.parliament.uk/research-briefings/sn06077/) |
| Middle-skilled trades added to Temporary Shortage List | **CONFIRMED.** Since July 2025, technician-level and skilled trades roles qualify for visas via TSL. From 2026, employers must have approved workforce plans. | [EIN](https://www.ein.org.uk/blog/uk-temporary-shortage-list-2025-guidance-skilled-workers), [DavidsonMorris](https://www.davidsonmorris.com/shortage-occupation-list/) |

### What needs CORRECTION or NUANCE

| Claim | Issue | Reality |
|---|---|---|
| "£45,000 illegal working fines" | **Outdated figure.** | Civil penalty is now **up to £60,000** per breach (repeat offence). First breach: up to £45,000. Source: [The Infinity Groups](https://theinfinitygroups.com/border-security-act-2025-right-to-work-compliance/) |
| "Home Office Right to Work API" for direct integration | **Overstated.** | There is no public API for direct app integration. The process uses the GOV.UK "View and Prove" service with Share Codes. Employers check via `gov.uk/view-right-to-work`. Third-party HR platforms (Zinc, Onfido) offer integrations. Handby would need to use the web-based checking service or partner with a verification provider. |
| "63% live in a legal aid desert for immigration" | **Plausible but unverifiable.** | This statistic is widely cited in legal aid advocacy but the exact methodology varies. The core point — legal aid deserts are real and widespread — is accurate. |
| "Dinghy" for pay-per-job insurance | **Dinghy exists** but primarily targets freelancers (designers, consultants, tech), not tradespeople specifically. **Zego** and **Kingsbridge** are the more relevant options for trades. |
| "£11.2bn UK Home Improvement" market size | **Understated.** | Market was **£15 billion in 2025** per IMARC Group. The £11.2B figure may reference a narrower segment. |
| "Material costs spiked 9.5% in 2026" | **Unverifiable.** | Construction material inflation has been real (post-COVID/Ukraine), but 9.5% is a specific claim without a clear source. The general trend is accurate. |
| Escrow payments — "just build it" | **Significantly more complex than described.** | If Handby holds customer funds (even briefly), this triggers FCA regulation. New safeguarding rules from 7 May 2026 require daily reconciliations, external audits (if >£100k held), and monthly FCA returns. **Stripe Connect is the compliant path** — Handby never touches the money. | [FCA](https://www.fca.org.uk/publications/policy-statements/ps25-12-changes-safeguarding-regime-payments-and-e-money-firms), [Ryft](https://www.ryftpay.com/blog/best-payment-solutions-for-uk-marketplace-platforms-2026) |

### What the research MISSED

1. **Checkatrade has 1.4M monthly users** — you're not fighting a small competitor, you're fighting brand recognition. The differentiation must be sharp.
2. **The "gig platform RTW" provisions are not yet in force.** The consultation closed Dec 2025. Implementation is expected 2026–2027, but the exact date hasn't been announced. This is still an opportunity to be "ready first."
3. **FCA safeguarding overhaul (May 2026)** makes building a custom escrow system significantly harder. Using Stripe Connect Express (already in your launch guide) is the correct approach.
4. **Workforce plans requirement** — from 2026, employers sponsoring TSL workers must show credible plans to train domestic workers. This creates a narrative opportunity: Handby helps immigrants already here use their skills, reducing visa dependency.

---

## PART 2 — STRATEGIC POSITIONING

### The Core Thesis

> **Handby is not "Checkatrade for immigrants." Handby is the UK's first compliance-first trades marketplace — built after the Border Security Act, designed for the 2026 regulatory reality.**

This positioning works for ALL users, not just immigrants:
- **For customers:** "Every provider on Handby is verified, insured, and legally checked. You're protected."
- **For immigrant providers:** "We translate your skills into UK standards, handle your compliance, and make sure you get paid."
- **For UK-born providers:** "Zero admin headache. We handle RTW verification, insurance proof, and MTD-ready invoicing."
- **For landlords (B2B):** "A compliant handyman pool for Awaab's Law call-outs. 24-hour response. Full audit trail."

### Why This Beats Incumbents

| Competitor | Their weakness in 2026 | Handby's advantage |
|---|---|---|
| Checkatrade | £500+/year fees. Legacy profiles not RTW-verified. No escrow. No translation. | Free to join. RTW-verified from day 1. Stripe Connect payments. |
| TrustATrader | Similar legacy issues. UK-docs-only onboarding. | Share Code + eVisa onboarding. Multilingual support. |
| TaskRabbit | US-focused. Limited UK trades coverage. | UK-built, UK-regulated, UK-first. |
| Bark.com | Pay-per-credit regardless of outcome. | Commission only on completed jobs. |
| WhatsApp/Facebook groups | No vetting, no insurance, no payment protection. Cash economy. | Verified, insured, auditable. |

---

## PART 3 — FEATURE ROADMAP (Prioritised)

Features are ordered by **impact × feasibility**. Each is tagged with effort and whether it requires new infrastructure.

### Tier A — HIGH IMPACT, BUILD NOW (Pre-Launch / Launch)

#### A1. Right to Work Verification Flow
**Why:** The Border Security Act makes this legally required for matching platforms. Being ready before enforcement = first-mover advantage.
**How it works:**
1. Provider enters their 9-character Share Code + date of birth during onboarding
2. Handby staff (or automated flow via Onfido/Zinc) checks `gov.uk/view-right-to-work`
3. Provider gets a **"RTW Verified" badge** on their profile
4. Customer sees the badge + a note: "Right to Work verified by Handby"
5. Handby stores a timestamped record (statutory defence for the customer)

**Implementation:**
- New `rtw_checks` table: `id, provider_id, share_code_hash, verified_at, expires_at, status`
- New badge type in `provider_details` or a separate verification system
- Profile UI: shield badge similar to existing "Handby Verified"
- **Phase 1:** Manual verification (staff checks GOV.UK, marks verified)
- **Phase 2:** Integrate with Onfido or Zinc API for automated checks

**Effort:** Medium (DB + UI + manual process first, API later)

#### A2. Multilingual Profile & Chat
**Why:** A Polish carpenter who can't describe "pointing and repointing" in English loses jobs. A Somali customer who can't explain "the stopcock is leaking" can't get quotes.
**How it works:**
- Providers can write their bio and service descriptions in their native language
- App auto-translates to English (and vice versa) using a translation API
- In-app messaging gets real-time translation
- Quote request form supports photo/video upload (visual communication)

**Implementation:**
- Add `language` field to profiles
- Integrate translation API (Google Cloud Translation or DeepL) in chat and profile display
- Photo/video upload on quote request form (Supabase Storage)
- UI: language selector, translated content shown with a subtle "translated" indicator

**Effort:** Medium-High (translation API integration, storage for media)

#### A3. Insurance Integration Badge
**Why:** UK customers expect £1M+ public liability. Immigrants often can't afford £400+/year upfront. This is the #1 barrier to legitimacy.
**How it works:**
- Partner with Zego for pay-as-you-go public liability (hourly/daily rates)
- Provider links their Zego policy in Handby
- Handby shows an **"Insured" badge** with coverage amount
- Future: deep link to Zego signup from within Handby

**Implementation:**
- Add `insurance_provider`, `insurance_policy_ref`, `insurance_expires_at` to `credentials` table (already exists!)
- Credential type `insurance` already in the schema
- Badge display on provider card (already showing credential badges in search!)
- Partnership outreach to Zego for referral/integration deal

**Effort:** Low (schema already supports this — just needs UI polish and partner deal)

#### A4. Visual Quote Request (Photo/Video First)
**Why:** Bypasses the language barrier entirely. Customer photographs the problem, provider sees it and quotes. No technical English needed.
**How it works:**
- Quote request form: "Take a photo or 10-second video of the issue"
- Images stored in Supabase Storage, linked to quote request
- Provider sees visuals alongside text description
- Optional: AI auto-tags the issue (e.g., "leaking pipe", "cracked tile")

**Implementation:**
- Add `images` array to `quote_requests` table
- Image picker + camera component in quote request flow
- Display images in provider's request inbox
- AI tagging is Phase 2 (nice-to-have, not essential)

**Effort:** Medium (image upload flow, storage, display)

### Tier B — HIGH IMPACT, BUILD NEXT (Months 1–3 Post-Launch)

#### B1. Landlord Dashboard (B2B Channel)
**Why:** The Renters' Rights Act (May 2026) forces landlords to fix damp/mould within strict timelines. They need a reliable, compliant handyman pool on speed dial. This is a **revenue accelerator**.
**How it works:**
- Landlord account type (separate from customer)
- Multiple properties management
- "Emergency callout" feature — broadcast to available providers in the area
- Compliance audit trail: RTW check receipt, insurance proof, job photos (before/after)
- Bulk billing via Stripe

**Revenue model:**
- Monthly subscription: £49/month for up to 10 properties, £99 for unlimited
- Per-callout fee: £2.99 "compliance receipt" fee

**Effort:** High (new account type, new flows, but extremely high revenue potential)

#### B2. Skills Passport / Qualification Mapping
**Why:** A Ukrainian Master Carpenter or Syrian stonemason has world-class skills but zero UK credentials. Handby can bridge this.
**How it works:**
- Provider uploads photos of home-country qualifications, certificates, portfolio
- Handby maps these to UK-equivalent competency descriptions
- Profile shows: "Equivalent skills: Expert Bricklayer & Pointing Specialist (mapped from Polish Master Mason certification)"
- For regulated trades: clear disclaimer ("Not a UK-certified electrician — for non-notifiable work only")

**Implementation:**
- Extend portfolio/credentials system
- Manual mapping initially (curated competency database)
- AI-assisted mapping later (match foreign cert titles to UK equivalents)

**Effort:** Medium (mostly content/UX, minimal new infrastructure)

#### B3. MTD-Ready Invoicing & Tax Tools
**Why:** From April 2026, sole traders earning £50k+ must keep digital records and file quarterly. By 2028, the threshold drops to £20k — capturing most active tradespeople. If Handby handles this, providers never leave.
**How it works:**
- Auto-generate invoices from completed jobs
- Track income/expenses per quarter
- Export to MTD-compatible format (CSV or integration with Xero/FreeAgent)
- Dashboard: "Your earnings this quarter: £X. VAT threshold: £Y away."

**Implementation:**
- Invoice generation from existing job/quote data
- Quarterly summary screen in provider dashboard
- Export functionality
- Partner integration with Xero/FreeAgent (API)

**Effort:** Medium-High (but massive retention value)

#### B4. Community Trust Circles
**Why:** "Voted #1 by the Brazilian community in Lambeth" is more powerful for a new arrival than 500 anonymous stars.
**How it works:**
- Customers can join community circles (geographic or cultural)
- Reviews show community affiliation: "Reviewed by 12 members of the Newham Nigerian community"
- Providers can be "endorsed" by community leaders
- Does NOT segregate — just adds a social trust layer on top of universal ratings

**Implementation:**
- `community_circles` table: `id, name, type (geographic|cultural), area`
- `circle_memberships` table: `user_id, circle_id`
- Reviews display circle badges
- Community leaderboard: "Top providers in [Circle]"

**Effort:** Medium

### Tier C — DIFFERENTIATION FEATURES (Months 3–6 Post-Launch)

#### C1. Compliance Fee for Customers
**Why:** Customers will pay £2.99 to know they're legally protected from a £60,000 fine.
**How:** When booking through Handby, customer gets a "Digital Compliance Receipt" showing the provider's RTW status was verified. This is their statutory defence.

#### C2. Waste Carrier License Badge
**Why:** Gardeners and removals providers need this. Customers in strict boroughs (Newham) value it. Easy to verify.
**How:** Add to credentials system. Badge on profile: "Licensed Waste Carrier (Environment Agency)"

#### C3. Mentorship Pairing
**Why:** Match newly arrived skilled workers with established UK-based contractors for "compliance check" jobs.
**How:** Opt-in programme. Senior contractor reviews junior's first 3 jobs. Both earn a "Mentorship Programme" badge.

#### C4. Geo-Fenced Provider Recruitment
**Why:** At hardware stores (Toolstation, Screwfix, local builders merchants) at 7am, you'll find tradespeople.
**How:** Geo-targeted mobile ads when someone with a non-English phone language enters a hardware store zone.

#### C5. "Awaab's Law Response" Provider Tier
**Why:** Letting agents need providers who guarantee 24-hour emergency response for damp/mould.
**How:** Providers opt into "Emergency Response" tier. Handby guarantees response time. Premium pricing for landlord accounts.

---

## PART 4 — LAUNCH MARKET ANALYSIS

### Primary Launch: Newham, East London

**Why Newham:**
- 53.7% non-UK born (highest in London)
- No ethnic majority — platform can't be perceived as serving "one group"
- Massive private rental market (aging Victorian + new-build mix)
- Elizabeth Line connectivity driving regeneration and property investment
- Population: ~370,000 and growing
- High "small jobs" demand that big contractors ignore

**Target trades for Newham launch:**

| Trade | Regulation | Immigrant opportunity | Demand driver |
|---|---|---|---|
| Handyman / odd jobs | None | Low barrier, diverse skills | Always needed, renters can't DIY |
| Painting & decorating | None | Huge immigrant workforce | Rental turnover, cosmetic upgrades |
| Gardening & landscaping | Waste Carrier License only | Agricultural skills transfer | "Garden of England" culture |
| Flat-pack assembly | None | Requires patience, not English | IKEA/Amazon furniture boom |
| Damp & mould treatment | None (non-structural) | Construction background transfer | Awaab's Law panic from landlords |
| Cleaning (domestic) | None | Largest immigrant service sector | High repeat, high frequency |
| Mobile car valeting | None | Low startup cost | High car ownership, time-poor commuters |

### Secondary Launch: Maidstone, Kent

**Why Maidstone:**
- Highest net migration in Kent (2024/25)
- Different demographic: commuter belt, older homeowners with budget but no time
- Seasonal agricultural workers with transferable skills
- Strong "local trust" culture — the "Verified Local" badge concept lands here
- Letting agents struggling with Awaab's Law compliance

### Recruitment Strategy (Both Markets)

**Physical hubs:**
- Community centres (Welcome Newham One-Stop Shop, RenewALL Hub, Maidstone Community Support Centre)
- Hardware stores at 7am (Toolstation, Screwfix, local merchants)
- ESL classes at local colleges
- Faith centres (mosques, churches, temples — trusted community spaces)

**Digital channels:**
- Language-specific Facebook groups ("Polacy w Newham", "Romanians in East London")
- WhatsApp broadcast via community leaders
- Targeted Instagram/TikTok in native languages

**The pitch to immigrant providers:**
> "Stop working for cash. Get verified, get insured, get paid into your bank — all through one app. We handle the UK bureaucracy. You do the craft."

**The pitch to customers:**
> "Every Handby provider is Right-to-Work verified, insured, and reviewed by real customers. Book with confidence."

---

## PART 5 — REVENUE OPPORTUNITIES UNIQUE TO THIS STRATEGY

### 5.1 Compliance Receipt Fee (Customer-side)
- £2.99 per job — customer receives a timestamped RTW verification receipt
- Statutory defence against £60,000 illegal working penalty
- **Projected:** If 30% of jobs include this → significant per-transaction revenue

### 5.2 Landlord Subscriptions (B2B)
- £49–£99/month for property managers
- Awaab's Law compliance audit trail
- Emergency callout network
- **This is the highest-margin channel.** Letting agents manage hundreds of properties.

### 5.3 Insurance Referral Revenue
- Partnership with Zego: referral fee per policy sold through Handby
- Provider buys insurance → Handby gets commission
- Provider becomes insured → Handby gets a trust signal → customer books more

### 5.4 MTD Tools Upsell (Provider-side)
- Free: basic earnings tracking
- Pro (£15/month): quarterly summaries, Xero export, invoice templates, tax estimates
- Directly addresses the April 2026 MTD mandate

### 5.5 Lead Generation (Local businesses)
- Hardware stores, tool rental companies, van hire — all want access to active tradespeople
- Sell anonymised demand data: "47 plumbing jobs requested in Newham this month"
- Sponsored placement in provider supply shop

---

## PART 6 — WHAT NOT TO BUILD (TRAPS TO AVOID)

| Temptation | Why to avoid it |
|---|---|
| Custom escrow system | FCA-regulated nightmare from May 2026. Use Stripe Connect. You never touch the money. |
| Home Office API integration | No public API exists. Use manual verification or partner with Onfido/Zinc. |
| Full translation of every UI string | Diminishing returns. Translate onboarding + chat + quotes. Keep core app in English — providers need basic English for UK work anyway. |
| "Immigrant-only" branding | Instant death. The platform must be for everyone. The immigrant-friendly features are invisible infrastructure, not the headline. |
| National launch | Kill this impulse. Newham first, prove PMF, then expand. |
| Building for regulated trades first | Gas Safe, Part P electrical = heavy compliance. Start with unregulated trades (handyman, cleaning, gardening, painting). Add regulated later. |
| Standardised pricing modules | Sounds good in theory, but telling providers what to charge risks employment status issues (Uber ruling). Let providers set their own prices. Instead, show "average price in your area" as guidance. |

---

## PART 7 — IMPLEMENTATION PRIORITY (What to build in what order)

### Phase 0 — Already Built (Handby current state)
- [x] Provider profiles with ratings, reviews, verified badge
- [x] Credential system (certifications, insurance, licenses)
- [x] Credential badges on search cards ("Gas Safe", "DBS Checked", "Insured")
- [x] Quote request flow
- [x] Stripe Connect payment infrastructure (in launch guide)
- [x] Category-based search with filters
- [x] Trust signals (badge levels, review sub-scores, response time)

### Phase 1 — Pre-Launch (Build these BEFORE going live)
1. **RTW verification flow** (manual check + badge) — A1
2. **Photo/video quote requests** — A4
3. **Insurance badge enhancement** (Zego partnership) — A3
4. **Provider language field** on profile — first step of A2

### Phase 2 — Launch Month (Build alongside soft launch)
5. **Chat translation** (Google Translate API in messaging) — A2
6. **Compliance receipt** for customers — C1
7. **Waste Carrier License badge** — C2

### Phase 3 — Growth (Months 1–3 post-launch)
8. **Landlord dashboard** — B1
9. **Skills Passport** — B2
10. **MTD invoicing tools** — B3
11. **Community Trust Circles** — B4

### Phase 4 — Differentiation (Months 3–6)
12. **Mentorship programme** — C3
13. **Awaab's Law response tier** — C5
14. **Geo-fenced recruitment ads** — C4

---

## PART 8 — KEY NUMBERS TO REMEMBER

| Stat | Value | Source |
|---|---|---|
| Non-UK born residents (England & Wales) | 11.4 million | ONS, June 2023 |
| UK home improvement market (2025) | £15 billion | IMARC Group |
| Projected market (2034) | £21.8 billion | IMARC Group |
| Brits who struggled to find a tradesperson | 35% | Bob FM / industry survey |
| Brits planning major home upgrades in 2026 | 1 in 3 | Industry survey |
| Illegal working civil penalty (repeat) | Up to £60,000 | Border Security Act 2025 |
| Awaab's Law: investigate damp/mould | 10 working days | Renters' Rights Act |
| Awaab's Law: emergency hazard fix | 24 hours | Renters' Rights Act |
| Landlord penalty for non-compliance | Up to £40,000 | Renters' Rights Act |
| MTD threshold (April 2026) | £50,000+ | HMRC |
| MTD threshold (April 2028) | £20,000+ | HMRC |
| Newham non-UK born population | 53.7% | Census 2021 |
| Checkatrade monthly users | 1.4 million | Industry data |
| Zego public liability cover | Up to £1M | Zego |

---

## SOURCES

- [Border Security Act 2025 Explained — Cartwright King](https://cartwrightking.co.uk/articles/immigration/the-2025-border-security-asylum-and-immigration-act-explained/)
- [Border Security Act: Employer Liability — Paragon Law](https://www.paragonlaw.co.uk/resources/border-security-asylum-immigration-act-illegal-working-employer-liability)
- [UK Immigration Changes 2025–2026 — Bird & Bird](https://www.twobirds.com/en/insights/2026/uk/uk-immigration-law-key-changes-in-2025-and-what-to-expect-in-2026)
- [RTW Compliance Guide — The Infinity Groups](https://theinfinitygroups.com/border-security-act-2025-right-to-work-compliance/)
- [Making Tax Digital: GOV.UK Step by Step](https://www.gov.uk/government/collections/making-tax-digital-for-income-tax-for-businesses-step-by-step)
- [MTD: 864,000 Sole Traders Face New Rules — GOV.UK](https://www.gov.uk/government/news/act-now-864000-sole-traders-and-landlords-face-new-tax-rules-in-two-months)
- [UK Home Improvement Market — IMARC Group](https://www.imarcgroup.com/uk-home-improvement-market)
- [1 in 3 Brits Plan Home Upgrades — Bob FM](https://www.bobfm.co.uk/one-in-three-britons-plan-major-home-upgrades-in-2026-despite-cost-of-living-pressures/)
- [Renters' Rights Act Guide — GOV.UK](https://www.gov.uk/government/publications/guide-to-the-renters-rights-act/guide-to-the-renters-rights-act)
- [Awaab's Law — GOV.UK](https://www.gov.uk/government/news/awaabs-law-to-force-landlords-to-fix-dangerous-homes)
- [Renters' Rights Act 2026 Timeline — Goodlord](https://blog.goodlord.co/renters-rights-bill-a-letting-agents-guide)
- [FCA Safeguarding Changes May 2026 — Ashurst](https://www.ashurst.com/en/insights/uk-emoney-and-payment-institutions-must-comply-with-new-safeguarding-rules-from-7-may-2026/)
- [Payment Solutions for UK Marketplaces 2026 — Ryft](https://www.ryftpay.com/blog/best-payment-solutions-for-uk-marketplace-platforms-2026)
- [Zego Insurance for Tradespeople](https://www.zego.com/blog/what-insurance-should-tradespeople-have/)
- [Pay-as-you-go Public Liability — Insurance Times](https://www.insurancetimes.co.uk/gig-economy-start-up-launches-pay-as-you-go-public-liability-cover/1427660.article)
- [Migration Statistics — Parliament Research](https://commonslibrary.parliament.uk/research-briefings/sn06077/)
- [London Boroughs Demographics 2025 — London City News](https://londoncity.news/london-boroughs-population-2025-demographics-growth/)
- [UK Temporary Shortage List 2025 — EIN](https://www.ein.org.uk/blog/uk-temporary-shortage-list-2025-guidance-skilled-workers)
- [Shortage Occupation List 2026 — DavidsonMorris](https://www.davidsonmorris.com/shortage-occupation-list/)
- [Right to Work Share Code Guide — DavidsonMorris](https://www.davidsonmorris.com/right-to-work-share-code/)
- [RTW Share Code for Employers — Zelt](https://zelt.app/blog/share-code/)

---

*Document maintained by: Handby development team*
*Next review: Before launch*
*Related docs: handby-uk-launch-guide.md | handby-go-to-market.md*
