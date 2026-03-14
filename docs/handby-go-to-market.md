# Handby.uk — Go-to-Market Plan
> Last updated: March 2026
> Status: PRE-LAUNCH PLANNING

---

## OVERVIEW

**What Handby is:**
A two-sided marketplace connecting UK customers with local service providers
(plumbers, electricians, cleaners, caterers, gardeners, etc.)

**Core GTM problem to solve:**
Every marketplace has a chicken-and-egg problem.
Customers won't use it without providers. Providers won't join without customers.

**Handby's solution:** Launch supply first (providers), then drive demand (customers).

---

## PHASE 1 — PRE-LAUNCH (Months 1–2)
*Goal: Sign up 50–100 providers before a single customer arrives*

### 1.1 Target Provider Segments (Priority Order)

| Segment | Why first | Where to find them |
|---|---|---|
| Sole trader tradespeople | Biggest group, underserved online | Checkatrade, MyBuilder, local Facebook groups |
| Freelance cleaners | High repeat demand, easy onboarding | Gumtree, local community groups |
| Caterers & mobile chefs | High value per job | Instagram, local food markets |
| Gardeners | Seasonal, high volume in spring/summer | Nextdoor, local notice boards |
| Handymen | Catch-all, always in demand | Yell.com listings, local ads |

### 1.2 Provider Acquisition Tactics

**Direct outreach (most effective at launch)**
- Search Checkatrade, Yell, Google Maps for local tradespeople
- Send personalised email/WhatsApp: "We're building a new platform — list free for 12 months"
- Target your local area first (one city/town — don't spread thin)
- Goal: 50 providers in one geographic area before opening to customers

**Facebook & WhatsApp Groups**
- Join: "[City] Business Network", "Tradespeople UK", local community groups
- Post as a founder — authentic story, not an ad
- Offer: free listing, early access badge, featured placement at launch

**Nextdoor**
- Post in local neighbourhoods as a local business
- Ask residents: "Would you use a platform like this? What services do you need?"
- Doubles as market research AND provider recruitment

**Local trade shows & markets**
- Attend local business fairs, food markets, trade expos
- Hand out simple flyers: "Get your first 10 clients free — join Handby"

**Partnership with trade bodies**
- Federation of Master Builders (FMB)
- National Federation of Roofing Contractors
- British Institute of Cleaning Science
- Approach local chapters — offer their members free premium listings

### 1.3 Provider Incentive Offer (Launch Period)
```
Free for 12 months — no commission on first 20 jobs
Featured placement in search results
"Founding Provider" badge on profile
Priority customer leads
```

---

## PHASE 2 — SOFT LAUNCH (Month 3)
*Goal: First 500 customer signups, first 50 completed jobs*

### 2.1 Geographic Focus Strategy
**Do NOT launch nationally. Pick ONE area first.**

Recommended approach:
```
Month 3:   Launch in ONE city (e.g. your local area)
Month 4–5: Expand to 2–3 nearby towns
Month 6:   Regional expansion (e.g. whole county)
Month 9+:  National rollout
```

Why: Concentrated supply = better customer experience = better reviews = word of mouth.
Spreading thin kills marketplaces.

### 2.2 Customer Acquisition — Free Channels

**Nextdoor (highest intent)**
- Post in every neighbourhood in your launch city
- "Looking for a plumber/cleaner/gardener in [City]? Try Handby — local pros, verified reviews"
- Nextdoor users are homeowners with high purchasing intent

**Local Facebook Groups**
- "[City] Mums", "[City] Residents", "[City] Community"
- Post helpful content: "5 questions to ask before hiring a tradesperson"
- Include Handby link naturally
- Never spam — one post per group per week maximum

**Google My Business**
- Create a Handby GMB listing for each city you operate in
- Category: Online Marketplace / Local Services
- Add photos, description, link to handby.uk
- Encourage early users to leave Google reviews

**Reddit**
- r/HousingUK, r/DIY, r/UKPersonalFinance
- Be helpful first — answer questions, mention Handby when relevant
- Never post pure ads — Reddit users will downvote immediately

**Word of mouth seeding**
- Ask every early provider to share their Handby profile with 5 people
- Ask friends and family to sign up as customers and leave honest reviews
- Offer £10 Amazon voucher for first 3 referrals

### 2.3 Customer Acquisition — Paid Channels

**Google Ads (highest ROI for local services)**
```
Campaign type:  Search
Keywords:       "plumber near me", "cleaner [city]", "electrician [city]"
Budget:         £10–£20/day to start
Landing page:   /search?category=[relevant]&city=[city]
Match type:     Phrase and exact match only (not broad)
Goal:           Cost per signup under £5
```

**Facebook/Instagram Ads**
```
Audience:       Homeowners 25–55, UK, within 20 miles of launch city
Creative:       Before/after photos of provider work (with permission)
Copy:           "Found a great plumber in [City] in 5 minutes. Try Handby."
Budget:         £5–£10/day
Format:         Single image + carousel
```

**Local newspaper/community sites**
- Many UK local papers have online ad slots from £50–£200/month
- High trust, local audience, affordable
- Examples: local Newsquest sites, In Your Area

---

## PHASE 3 — GROWTH (Months 4–9)
*Goal: 1,000 registered providers, 5,000 customers, £10k GMV/month*

### 3.1 SEO Strategy (Long-term, free traffic)

**Target keyword structure:**
```
[service] in [city]          → "plumber in Manchester"
[service] near me            → "cleaner near me" (location-targeted)
best [service] [city]        → "best electrician in Leeds"
how to find [service] [city] → "how to find a reliable gardener in Bristol"
```

**Content to create:**
```
/blog/how-to-hire-a-plumber-uk         → targets high-intent searches
/blog/what-does-a-cleaner-cost-uk      → price guide content
/[city]/[service]                      → e.g. /london/plumbers (city pages)
/providers/[name]                      → individual provider SEO pages
```

**Technical SEO already in place:**
- `generateMetadata` on provider profile pages ✅
- Server-side rendering (Next.js) ✅
- Clean URL structure ✅

### 3.2 Referral Programme
```
Customer refers a friend:    Both get £5 credit on first job
Provider refers a provider:  Referring provider gets 1 month commission-free
```
Implement in app — track via unique referral codes linked to profiles.

### 3.3 Email Marketing

**Customer email sequences:**
```
Day 0:   Welcome + how it works
Day 2:   "Providers near you" — personalised by location
Day 7:   "Still looking?" — prompt to post a job
Day 14:  Social proof — recent reviews in their area
Monthly: New providers joined, seasonal tips ("spring cleaning checklist")
```

**Provider email sequences:**
```
Day 0:   Welcome + profile completion checklist
Day 3:   "Complete your portfolio — get 3x more enquiries"
Day 7:   Tips for winning jobs on Handby
Day 14:  First customer leads digest
Weekly:  New quote requests in their area
```

**Tool:** Resend (already in your stack) + React Email for templates

### 3.4 Trust Building Content

**Provider spotlight series:**
- Monthly feature on a top-rated provider
- Short video/photo story — share on Instagram, LinkedIn
- Builds brand and gives providers a reason to share Handby

**Blog / resource centre:**
- "How to find a reliable tradesperson in the UK"
- "Average cost of a kitchen remodel 2026"
- "What is public liability insurance? A guide for customers"
- Targets customers at research phase, before they're ready to hire

### 3.5 Partnerships

| Partner | Benefit | Approach |
|---|---|---|
| Local estate agents | Landlords constantly need tradespeople | Revenue share or co-marketing |
| Letting agencies | Same — maintenance contractors | White-label Handby for their landlords |
| New build developers | Snagging work, ongoing maintenance | B2B enterprise tier |
| Home insurance companies | Policy holders need tradespeople urgently | Referral partnership |
| Homebase / B&Q | DIY customers who decide they need a pro | In-store QR codes / leaflets |

---

## PHASE 4 — MONETISATION (Month 6+)

### Revenue Model Options

**Option A: Commission per job (Recommended)**
```
Handby charges: 10–15% of job value
Provider sees:  Full job amount, commission deducted via Stripe Connect
Customer pays:  Normal price (commission hidden in provider margin)
Pros:           Scales with GMV, no upfront cost for providers
Cons:           Providers may try to go off-platform
```

**Option B: Subscription (Provider pays monthly)**
```
Free tier:      Limited to 3 active services, no priority listing
Pro (£29/mo):   Unlimited services, priority search placement, analytics
Business (£79): Everything + featured homepage placement + verified badge
Pros:           Predictable revenue, providers committed to platform
Cons:           Harder sell at launch when platform is unproven
```

**Option C: Lead fee (Pay per enquiry)**
```
Provider pays:  £2–£5 per quote request received
Customer:       Free to use always
Pros:           Low barrier to join, providers only pay for value
Cons:           Providers frustrated by low-quality leads
```

**Recommended: Start with Option A (commission), add Option B later**

### Pricing by category
```
High value (plumbing, electrical, building):  10% commission
Medium value (cleaning, gardening):           12% commission
Low value / high frequency:                   15% commission
```

### Anti-circumvention measures
```
- Payments must go through Handby (Stripe Connect)
- T&Cs prohibit off-platform payment for 12 months after first contact
- Flag suspicious behaviour (provider sharing phone number immediately)
- After 12 months, relationship is "free" — encourages loyalty
```

---

## PHASE 5 — RETENTION & REPUTATION (Ongoing)

### Customer Retention
```
- Saved providers list ("My Handby professionals")
- Rebooking in 2 taps for repeat services
- Loyalty credits after 5 completed jobs
- Push notifications for seasonal reminders ("book your boiler service")
```

### Provider Retention
```
- Monthly performance dashboard (views, enquiries, conversion rate)
- "Top Provider" badge for consistent 5-star ratings
- Featured placement for high performers
- Provider community (WhatsApp group / forum) for peer support
```

### Review Quality
```
- Only customers who completed a job can leave a review ✅ (already built)
- Flag suspicious review patterns
- Provider right to respond to reviews
- Verified review badge
```

---

## LAUNCH TIMELINE

```
Month 1    → Sign up 50 providers in launch city
             Set up Google/Facebook Ads
             Create social media accounts

Month 2    → Complete legal docs, ICO registration
             Beta test with 20 friends/family as customers
             Fix bugs, optimise onboarding flows

Month 3    → Soft launch in one city
             Begin Google Ads (£10/day)
             Post in local Facebook/Nextdoor groups
             Target: 200 customer signups

Month 4    → Analyse data, fix drop-off points
             Launch referral programme
             Expand to 2–3 nearby towns
             Target: 500 customers, 10 completed jobs

Month 5–6  → SEO content publishing (2 articles/week)
             Email sequences fully live
             Target: 1,000 customers, 50 completed jobs

Month 7–9  → Paid ads scaled (if CAC is profitable)
             Partnership outreach to estate agents
             Target: 5,000 customers, £10k GMV/month

Month 10+  → National rollout
             Mobile app launch (iOS + Android)
             Target: 20,000 customers, £50k GMV/month
```

---

## KEY METRICS TO TRACK FROM DAY 1

| Metric | Target (Month 3) | Target (Month 6) |
|---|---|---|
| Registered providers | 50 | 200 |
| Registered customers | 200 | 1,000 |
| Quote requests sent | 20 | 200 |
| Completed jobs | 5 | 50 |
| Gross Merchandise Value (GMV) | £500 | £10,000 |
| Customer acquisition cost (CAC) | < £10 | < £7 |
| Provider churn rate | < 20%/month | < 10%/month |
| Average review rating | 4.5+ | 4.7+ |

---

## TOOLS & STACK FOR MARKETING

| Tool | Purpose | Cost |
|---|---|---|
| Google Ads | Paid search | Pay per click |
| Meta Ads Manager | Facebook/Instagram ads | Pay per click |
| Resend | Transactional + marketing email | Free up to 3,000/month |
| Google Analytics 4 | Website analytics | Free |
| Google Search Console | SEO monitoring | Free |
| Hotjar | User behaviour, heatmaps | Free tier available |
| Canva | Social media graphics | Free / £10.99/month |
| Buffer | Social media scheduling | Free up to 3 channels |
| Nextdoor Ads | Hyperlocal ads | From £50 |

---

## AFRICAN DIASPORA COMMUNITY STRATEGY

> The African diaspora in the UK (2.5m+ people, ONS 2021 Census) has massive demand for skilled services that are currently discovered almost entirely through WhatsApp groups, Facebook community pages, and word of mouth. Handby can be the first professional platform to serve this market.

### Why This Community First

```
1. UNDERSERVED:    No marketplace covers braiding, ankara tailoring, owambe catering, gele tying
2. HIGH SPEND:     Celebration culture = frequent high-value bookings (weddings, naming ceremonies, birthdays)
3. TRUST-DRIVEN:   Word-of-mouth is king — reviews and verified profiles are a natural fit
4. CONCENTRATED:   London (Peckham, Brixton, Tottenham, Woolwich), Birmingham (Aston, Handsworth),
                   Manchester (Moss Side, Cheetham Hill), Leeds (Chapeltown), Bristol (St Pauls)
5. VIRAL LOOPS:    Community is tightly connected — one satisfied customer tells 20 people
```

### Target Service Categories

| Category | Demand Signal | Discovery Today |
|----------|--------------|-----------------|
| African Hair Braiding | £300m+ UK Afro hair market (Mintel), 90% sole traders | Instagram DMs, WhatsApp groups |
| Afro-Caribbean Catering | Owambe/party catering for 100–500 guests | Word of mouth only |
| African Tailoring | Ankara, aso-oke, agbada — spikes Jun–Sept (wedding season) + Dec | Facebook groups, market stalls |
| Celebration Cakes | Naming ceremonies, milestone birthdays, weddings | Instagram bakers |
| Event Decoration | Traditional ceremony decor (Yoruba, Igbo, Ghanaian) | WhatsApp referrals |
| Gele & Headwrap Styling | Every owambe needs 10–50 gele ties at £15–£30 each | Day-of scramble via WhatsApp |
| Makeup Artist (dark skin) | Bridal glam, party makeup — trust is everything | Instagram portfolios |
| Barber (Afro specialist) | Fades, lineups, afro shaping — loyalty-driven | Local shop, word of mouth |
| Home Cooking & Meal Prep | Weekly batch cooking, authentic home-style meals | Community Facebook groups |
| DJ & Entertainment | Afrobeats, amapiano, highlife, gospel sets | WhatsApp, Instagram |
| Translation & Interpreting | Yoruba, Igbo, Twi, Swahili, Somali — NHS, courts, councils | Agency referrals |
| Tutoring & Mentoring | 11+, GCSE, A-Level — strong parental investment in education | Church/mosque networks |
| Immigration Consulting | Visa guidance, settled status, family reunion | Community Facebook groups |
| Photography & Videography | Events, portraits, content creation | Instagram discovery |
| Laundry & Ironing | Traditional attire pressing, wash-and-fold | Neighbourhood word of mouth |
| Party Planning | Owambe coordination, naming ceremonies, milestone birthdays | Personal networks |

### Provider Acquisition — Community Channels

**WhatsApp & Facebook Groups (highest density)**
- Join: "Nigerians in London", "Ghanaians in Birmingham", "Africans in Manchester", city-specific community groups
- Post as founder — authentic story: "We're building an app to help African service providers get found"
- Target admins first — if the admin endorses you, the group follows

**Churches & Mosques**
- RCCG, Winners Chapel, Celestial, CAC parishes across the UK have built-in provider networks
- Offer to present at Sunday announcements or community events
- "Do you braid hair, cater events, or sew clothes? Get listed free on Handby"

**African Markets & Cultural Events**
- Peckham market, Brixton Village, Ridley Road, Bullring Market (Birmingham)
- Notting Hill Carnival vendor area, Africa Utopia (Southbank), Ghana Party in the Park
- Hand out flyers with QR code: "Get your first 10 clients free"

**Instagram & TikTok**
- Search hashtags: #AfroHairUK, #NaijaInLondon, #AnkaraDress, #JollofCatering, #GhanaianWedding
- DM providers directly — they're already showcasing their work
- Offer: "We'll feature you on Handby for free — keep 100% for your first 20 jobs"

**Community Influencers & Micro-Creators**
- Partner with 5–10 African diaspora micro-influencers (5k–50k followers)
- Trade: free Handby promotion in exchange for featured provider spotlight
- Content: "I found my braider/caterer/tailor on Handby" — authentic testimonial format

### Customer Acquisition — Diaspora-Specific

**Messaging that resonates:**
```
Instead of:    "Find local service providers"
Say:           "Find your braider, caterer, or tailor — no more scrolling WhatsApp groups"

Instead of:    "Verified professionals"
Say:           "Real reviews from real people in your community"

Instead of:    "Book a service"
Say:           "Get a quote in minutes — no more waiting for DM replies"
```

**Seasonal campaign calendar:**
```
January:     "New Year, new look" — braiding, barber, makeup
March:       Mothering Sunday — cakes, meal prep, home cleaning
June–Sept:   Wedding season — tailoring, gele, catering, decor, photography
October:     Nigerian Independence Day — event planning, catering, DJ
November:    Black Friday — "Book your Christmas caterer early"
December:    Christmas & New Year — cakes, tailoring, event decor, party planning
```

### Anti-Circumvention Note

This community is high-trust and relationship-driven. Providers and customers will naturally want to go off-platform after first contact. Mitigate by:
- Making rebooking frictionless (2 taps)
- Showing review history only on Handby (reviews = reputation = incentive to stay)
- Loyalty credits for repeat bookings through the platform
- Letting providers build a public portfolio page they can share (replaces their Instagram link-in-bio)

---

## COMPETITIVE POSITIONING

| Platform | Weakness | Handby advantage |
|---|---|---|
| Checkatrade | Expensive for providers (£500+/year) | Free at launch, commission only |
| Rated People | Lead quality issues, pay per lead | Better matching, no wasted spend |
| TaskRabbit | US-focused, limited UK coverage | UK-built, UK-focused |
| Bark.com | Providers pay for credits regardless of outcome | Commission only on completed jobs |
| Facebook Marketplace | No trust layer, no reviews | Verified profiles, genuine reviews |

**Handby's core message:**
> "The marketplace that works for both sides — free for providers to join,
> trusted by customers who've seen real reviews from real jobs."

---

## SOCIAL MEDIA STRATEGY

| Platform | Content type | Frequency |
|---|---|---|
| Instagram | Provider spotlights, before/after photos | 4x/week |
| Facebook | Local community posts, tips | 3x/week |
| LinkedIn | B2B partnerships, company updates | 2x/week |
| TikTok | Short "how to" videos, provider stories | 2x/week |
| Nextdoor | Local launch announcements | As needed |

**Content pillars:**
1. Provider stories (trust building)
2. Customer tips (how to hire safely, what to check)
3. Platform updates (new features, new areas)
4. Local community (celebrating local businesses)

---

## BUDGET ESTIMATE (First 6 Months)

| Item | Monthly cost | 6-month total |
|---|---|---|
| Google Ads | £300 | £1,800 |
| Facebook/Instagram Ads | £150 | £900 |
| Email tool (Resend) | £0–£20 | £60 |
| Social media tools | £20 | £120 |
| Content creation | £0 (DIY) or £200 | £600 |
| Local advertising | £100 | £600 |
| **Total** | **~£570–£790/month** | **~£4,080** |

> This is a lean budget. Increase paid ads only when CAC is proven profitable.

---

*Document maintained by: Handby team*
*Next review: Monthly*
*Related docs: handby-uk-launch-guide.md | handby-technical-deployment.md*
