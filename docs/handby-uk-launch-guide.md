# Handby.uk — UK Launch Guide
> Last updated: March 2026
> Status: PRE-LAUNCH PLANNING

---

## MASTER CHECKLIST (Quick Reference)

### Business & Legal
- [ ] Register Handby Ltd via Tide (£14.99 — includes Companies House)
- [ ] HMRC Corporation Tax registration
- [ ] Open Starling Business account (primary bank)
- [ ] Keep Tide as secondary account (invoicing/admin)
- [ ] VAT registration (voluntary or mandatory at £90k)
- [ ] ICO registration complete
- [ ] DPAs signed (Supabase, Stripe, Vercel, Resend)
- [ ] UK trademark filed ("Handby" — Class 35 + 42)
- [ ] Professional indemnity insurance active
- [ ] Cyber liability insurance active

### Legal Documents (must be live on site before launch)
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Cookie Policy
- [ ] Provider Agreement
- [ ] Refund / Cancellation Policy

### Payments
- [ ] Stripe business account verified (Handby Ltd)
- [ ] Stripe Connect Express configured for providers
- [ ] Test payments working end-to-end

### Technical
- [ ] Cookie consent banner live
- [ ] Supabase data migrated to EU region
- [ ] SSL certificate active on handby.uk
- [ ] support@handby.uk email working
- [ ] privacy@handby.uk email working
- [ ] Data deletion flow working (GDPR right to erasure)

---

## SECTION 1 — Business Registration

### Recommended: Register via Tide (cheapest route)
- **Website:** tide.co/company-registration
- **Entity type:** Private Limited Company (Ltd)
- **Company name:** Handby Ltd *(Tide checks availability for you)*
- **Cost:** £14.99–£24.99 all-in (includes Companies House fee)
  - Compare: Direct via Companies House = £100 (increased Feb 2026)
  - Compare: Companies House same-day = £156
  - **Tide saves you £75–£130 on formation**
- **Timeline:** 1 business day
- **What happens:** Single form → Tide submits to Companies House + opens a business bank account simultaneously
- **Registered address:** Use your own UK address, or Tide offers a virtual office add-on
  - Alternative virtual offices: Hoxton Mix, iPostal1, Regus (~£10/month)

### Tide formation limitations
- Only supports **single director** at formation (add more directors via Companies House afterwards)
- Uses standard articles of association (no custom articles)
- Only Ltd companies (not LLPs or companies limited by guarantee)

### What you get after registration
- Company number *(needed for everything below)*
- Certificate of Incorporation
- Tide business bank account (opened automatically)

### Alternative: Register directly via Companies House
- **Website:** companieshouse.gov.uk
- **Cost:** £100 online / £156 same-day
- **When to use this instead:** Multiple directors at formation, custom articles of association needed, or you don't want a Tide account

---

## SECTION 2 — HMRC Registration

### A. Corporation Tax
- Register within 3 months of starting to trade
- Register via: HMRC Business Tax Account
- You'll need: Company number, start date, registered address

### B. VAT
- **Mandatory threshold:** £90,000 taxable turnover/year
- **Recommendation:** Register voluntarily before threshold
  - Looks professional, lets you reclaim VAT on expenses
- **Standard rate:** 20%
- **What it applies to:** Handby's service fees / commission charged to providers
- **IMPORTANT — Marketplace VAT rule:**
  As a two-sided marketplace, Handby may be the "deemed supplier" for VAT
  on facilitated transactions. Get an accountant to clarify early.

### C. PAYE
- Required if you hire employees or pay yourself a salary
- Register via HMRC PAYE Online

---

## SECTION 3 — Business Bank Account

### Recommended Strategy
Use **Tide for formation** (cheapest) but **Starling as primary bank** (most reliable).

**Why not Tide as primary bank:**
- Tide is an **e-money institution**, NOT a bank (regulated by FCA, not PRA)
- Multiple reports of **accounts frozen without warning** — funds locked for months
- Poor customer support (7+ hour phone waits, emails unanswered for months)
- 20p per transfer after 20 free/month — adds up for a marketplace
- No overdraft facility
- **Critical risk for a marketplace:** frozen account = providers don't get paid = trust destroyed

### Recommended Setup
| Account | Purpose | Monthly cost |
|---|---|---|
| **Starling Business** (PRIMARY) | Main operating account, all payments in/out | Free |
| **Stripe Connect** | Marketplace payment processing (customer → provider) | Transaction fees only |
| Tide (SECONDARY) | Keep for invoicing tools, admin, formation account | Free |

### Why Starling as primary
- Fully licensed UK bank (PRA regulated)
- FSCS protected (up to £85k)
- Free — no monthly fee, generous free transfer allowance
- Overdraft available (cash flow buffer)
- Euro accounts available
- Excellent reliability record
- Fast setup after Tide formation

### Bank comparison (full detail)

| Feature | Tide | Starling | Monzo Business |
|---|---|---|---|
| Monthly fee | Free / £12.99–£69.99 | Free | Free / £9 |
| Free transfers | 20/month, then 20p each | Generous free allowance | Generous free allowance |
| FSCS protected | Partial (newer accounts via ClearBank) | Yes (fully licensed bank) | Yes (fully licensed bank) |
| Overdraft | No | Yes | No |
| Company formation | Yes (£14.99) | No | No |
| Invoicing | Built-in | No | Via Pro plan |
| Accounting integrations | Xero, Sage, QuickBooks, FreeAgent + 5 more | Good | Good |
| Account freezing risk | HIGH (documented issues) | Low | Low |
| Customer support | Poor (widely criticised) | Good | Good |

> **Action:** Register Handby Ltd via Tide (£14.99) → Open Starling Business account → Use Starling as primary.

---

## SECTION 4 — UK GDPR & Data Protection

### A. ICO Registration (MANDATORY)
- **Website:** ico.org.uk
- **Cost:** £40–£60/year (Tier 1 for small orgs)
- **Deadline:** Before collecting ANY user data
- **Fine for non-registration:** Up to £500

### B. Privacy Policy — Required Contents

Must clearly state:
- What data is collected: name, email, phone, address, GPS location,
  profile photos, portfolio images, messages, payment info
- Why it's collected (lawful basis):
  - Contractual necessity (to provide the service)
  - Legitimate interests (fraud prevention, safety)
  - Consent (marketing emails)
- How long data is kept:
  - Active accounts: duration of account
  - Deleted accounts: 30 days then purge
  - Financial records: 7 years (HMRC requirement)
- Third parties data is shared with:
  - Supabase (data processor)
  - Stripe (payments)
  - Email provider (Resend)
  - Vercel (hosting)
- User rights:
  - Right to access (Subject Access Request — respond within 30 days)
  - Right to erasure ("right to be forgotten")
  - Right to portability
  - Right to object
- Contact: privacy@handby.uk
- ICO registration number

### C. Cookie Policy & Consent Banner
- Required for any non-essential cookies (analytics, tracking)
- Tool: CookieYes or Cookiebot (free tiers available)
- Essential cookies (Supabase session): No consent needed
- Analytics (Google Analytics): Explicit opt-in required

### D. Data Processing Agreements (DPAs)
Must be signed with all data processors:
- Supabase → Available in Supabase dashboard
- Stripe → Covered in their Terms of Service
- Vercel → Available in Vercel dashboard
- Resend → Available on request

### E. Supabase Data Residency
- **Action:** Migrate Supabase project to EU region (London or Frankfurt)
- **Why:** UK GDPR requires data adequacy — EU region is cleanest
- **How:** Supabase Dashboard → Project Settings → Infrastructure
- **IMPORTANT:** Do this BEFORE launch

---

## SECTION 5 — Legal Documents

### A. Terms of Service
Must cover:
- Who can use the platform (18+, UK residents)
- Provider responsibilities:
  - Accurate service descriptions
  - Required insurance (public liability — mandate minimum £1M)
  - Compliance with UK trading standards
- Customer responsibilities
- Handby's role: introduction platform, NOT employer of providers
- Payment terms and commission structure
- Cancellation and refund policy
- Prohibited content and conduct
- Dispute resolution process
- Limitation of liability
- Governing law: England and Wales
- Jurisdiction: English courts

### B. Provider Agreement
Separate contract covering:
- Independent contractor status (NOT employee — CRITICAL)
- Provider must hold public liability insurance (min £1M)
- Provider responsible for their own tax (self-assessment)
- Handby commission rate and payment terms
- Background check requirements (optional but builds trust)
- Code of conduct
- Termination conditions

> Get a UK solicitor to draft or review these — ~£200–£500 for a startup solicitor.
> Options: Rocket Lawyer UK, Seedlegals, or a local startup firm.

---

## SECTION 6 — Insurance

| Type | Who needs it | Estimated cost |
|---|---|---|
| Professional Indemnity | Handby Ltd | ~£200–£500/year |
| Cyber Liability | Handby Ltd | ~£300–£800/year |
| Public Liability | Each provider (mandate in T&Cs) | Provider's responsibility |

> Cyber liability is critical — Handby stores personal data, location data,
> and facilitates financial transactions.

---

## SECTION 7 — Payments & Financial Compliance

### Stripe UK Setup
- Account type: Business (not personal)
- Entity: Handby Ltd
- Business type: Online marketplace / platform
- MCC code: 7389 (Services, Not Elsewhere Classified)
- Settlement: GBP to UK business bank account
- Documents needed: Companies House number, director ID, bank statement

### Stripe Connect (for paying providers)
**Recommended model: Stripe Connect Express**
- Providers onboard to Stripe themselves
- Handby takes commission automatically
- Providers get paid directly
- Handby never holds provider funds (cleaner regulatory position)

### Financial Promotions Rule
- Do NOT advertise guaranteed earnings to providers
- Must be fair, clear and not misleading (FCA rules)
- Use realistic examples only

---

## SECTION 8 — Consumer Protection Laws

| Law | What it means for Handby |
|---|---|
| Consumer Rights Act 2015 | Services must be delivered with reasonable care and skill. Customers entitled to remedy if substandard. |
| Consumer Contracts Regulations 2013 | Right to cancel within 14 days for online contracts. Must be clearly communicated at point of purchase. |
| Digital Markets, Competition & Consumers Act 2024 | Fake reviews are illegal. Review system must be genuine. Handby's "completed jobs only" gate complies. ✅ |
| Equality Act 2010 | Providers cannot discriminate. T&Cs must prohibit discriminatory service refusals. |

---

## SECTION 9 — Employment Law (Critical)

### Provider Status — Must be Self-Employed
Providers must be independent contractors, NOT workers or employees.

**Risk:** If providers are found to be "workers" (Uber ruling),
Handby may owe minimum wage, holiday pay, pension contributions.

**How to protect against this:**
- Providers set their own prices ✅
- Providers choose their own hours ✅
- Providers can work for competitors ✅
- Providers use their own equipment ✅
- Provider Agreement explicitly states independent contractor status ✅

**What Handby must NEVER do:**
- Set provider hourly rates
- Require minimum hours
- Penalise providers for turning down jobs

---

## SECTION 10 — Domain & Trademark

### Domain
- Primary: handby.uk
- Also secure: handby.co.uk, handby.com (prevent squatting)
- Register via: Nominet or 123-reg

### UK Trademark
- Register "Handby" at: Intellectual Property Office (ipo.gov.uk)
- Cost: £170 for one class online
- Classes needed:
  - Class 35 (business services / marketplace)
  - Class 42 (software / technology)
- Timeline: 4–6 months to registration
- File early — trademark is first-come, first-served

---

## SECTION 11 — Recommended Professional Help

| Professional | Purpose | Estimated cost |
|---|---|---|
| UK Startup Solicitor | T&Cs, Provider Agreement review | £300–£600 |
| Accountant (Xero-based) | VAT, Corporation Tax, PAYE setup | £80–£150/month |
| ICO-registered advisor | GDPR audit | £200–£400 one-off |

### Affordable Legal Resources
- Rocket Lawyer UK — templated legal docs from £25/month
- Seedlegals — startup-specific legal from £99/month
- ACCA-certified accountants via Bark.com

---

## SECTION 12 — Additional Guides (Pending)

- [ ] Technical Deployment & Infrastructure Checklist
- [ ] Go-to-Market & UK Marketing Plan
- [ ] Mobile App Store Submission Guide (App Store + Play Store)
- [ ] Pricing & Commission Strategy

---

*Document maintained by: Handby development team*
*Next review date: Before launch*
