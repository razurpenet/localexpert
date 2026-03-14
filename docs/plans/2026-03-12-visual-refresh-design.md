# Handby Visual Refresh — "Trust & Speed" Design

**Date:** 2026-03-12
**Scope:** Visual refresh only. Same screens, flows, and navigation. Elevated look and feel.
**Core principle:** Speed to help is the north star. Orange CTAs create urgency, deep blue builds trust.

---

## 1. Design Tokens

### Colours

| Token | Hex | Replaces | Usage |
|-------|-----|----------|-------|
| `primary` | `#1E40AF` | `#2563EB` | Headers, active tabs, links, selected states |
| `primary-light` | `#3B82F6` | — | Secondary buttons, hover states, progress bars |
| `primary-bg` | `#EFF6FF` | `#F8F9FB` | Screen backgrounds |
| `primary-subtle` | `#DBEAFE` | — | Active tab pills, light badges, input focus ring |
| `cta` | `#F97316` | — | Primary action buttons (Request Now, Accept, Leave Review) |
| `cta-pressed` | `#EA580C` | — | Pressed state for CTA buttons |
| `text-primary` | `#1E3A8A` | `#1A1A2E` | Headlines, provider names |
| `text-body` | `#475569` | `#6B7280` | Body text, descriptions |
| `text-muted` | `#94A3B8` | `#9CA3AF` | Timestamps, placeholders |
| `surface` | `#FFFFFF` | `#FFFFFF` | Cards, modals, inputs |
| `border` | `#E0E7FF` | `#E5E7EB` | Card borders, dividers |
| `success` | `#16A34A` | `#16A34A` | Completed, verified (unchanged) |
| `warning` | `#D97706` | `#D97706` | Pending, in-progress (unchanged) |
| `error` | `#DC2626` | `#DC2626` | Declined, errors (unchanged) |
| `star` | `#FACC15` | `#FACC15` | Rating stars (unchanged) |

### Typography

System fonts (no custom font loading). Size/weight refinements:

| Element | Size | Weight | Colour |
|---------|------|--------|--------|
| Page title | 26px | 700 | `text-primary` |
| Section heading | 18px | 600 | `text-primary` |
| Card title | 16px | 600 | `text-primary` |
| Body | 15px | 400 | `text-body` |
| Body small | 13px | 400 | `text-body` |
| Caption/meta | 12px | 500 | `text-muted` |
| Badge label | 11px | 600 | contextual |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight gaps (icon-to-text) |
| `sm` | 8px | Inner padding, small gaps |
| `md` | 12px | Component gaps |
| `lg` | 16px | Screen horizontal padding, card padding |
| `xl` | 20px | Section spacing |
| `2xl` | 24px | Between major sections |
| `3xl` | 32px | List bottom padding |

### Elevation

| Level | Shadow | Border | Usage |
|-------|--------|--------|-------|
| `card` | `0 1px 3px rgba(30,64,175,0.06)` | `1px solid #E0E7FF` | Default cards |
| `card-raised` | `0 4px 12px rgba(30,64,175,0.08)` | `1px solid #E0E7FF` | Pressed/active cards |
| `modal` | `0 -4px 20px rgba(0,0,0,0.12)` | none | Bottom sheets |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | 8px | Badges, small buttons |
| `md` | 12px | Inputs, action buttons |
| `lg` | 16px | Cards |
| `xl` | 20px | Tab pills |
| `full` | 9999px | Avatars, dots, pills |

---

## 2. Component Changes

### Buttons

| Type | Background | Text | Radius | Press behaviour |
|------|-----------|------|--------|-----------------|
| CTA (primary action) | `#F97316` | white | 14px | opacity 0.85, scale 0.97 |
| Secondary | transparent, `1.5px #1E40AF` border | `#1E40AF` | 14px | bg `#EFF6FF` |
| Ghost | transparent | `#3B82F6` | 8px | bg `#EFF6FF` |
| Destructive | transparent | `#DC2626` | 8px | bg `#FEF2F2` |

### Cards

- Background: `#FFFFFF`
- Border: `1px solid #E0E7FF`
- Shadow: `0 1px 3px rgba(30,64,175,0.06)`
- Radius: 16px (consistent everywhere)
- Padding: 16px
- Pressed: shadow deepens to `card-raised`

### Status Badges

Pill-shaped with dot indicator (replaces icon + coloured background):
- Shape: `border-radius: full`, height 24px
- Dot: 6px circle in status colour
- Text: 12px, weight 600, status colour
- Background: status colour at 10% opacity
- No icons inside badges

### Avatars

- Blue ring: `2px solid #DBEAFE`
- Online dot: 10px green circle, bottom-right

### Inputs

- Border: `1.5px solid #E0E7FF`
- Focus: border `#3B82F6` + outer glow `0 0 0 3px #DBEAFE`
- Radius: 12px
- Placeholder: `#94A3B8`

### Tab Bar

- Active: `#1E40AF` icon + label, 3px rounded indicator line above icon
- Inactive: `#94A3B8`
- Top border: `#E0E7FF`

---

## 3. Screen-by-Screen Changes

### Customer Home

- Hero gradient: `#0F172A` to `#1E3A8A`
- Search bar: white bg, 12px radius, subtle inner shadow
- Hero CTA button: orange `#F97316`
- Category icons: circular `#EFF6FF` backgrounds (replace coloured squares)
- Nearby pros cards: add blue-tinted border + pill rating badge

### Search Results

- Active filter chips: `#1E40AF` bg, white text
- Inactive chips: `#EFF6FF` bg, `#1E3A8A` text
- "Request Quote" button on cards: orange `#F97316`

### Provider Detail

- Stats row items: `#EFF6FF` rounded backgrounds
- "Send Quote Request" button: orange `#F97316`
- Section titles: `#1E3A8A`, 18px, weight 600
- Credential pills: green checkmark on `#F0FDF4` bg

### Bookings

- Tab pills: active `#1E40AF` bg, inactive `#EFF6FF` bg
- Timeline dots: `#1E40AF` complete, `#3B82F6` with ring for current
- "Leave Review" button: orange `#F97316`
- "Reviewed" badge: stays amber `#FEF3C7`

### Chat

- Sent bubbles: `#1E40AF` bg
- Received bubbles: `#EFF6FF` bg
- Send button: orange `#F97316`
- Input border: `#E0E7FF`

### Provider Dashboard

- Progress bar: `#1E40AF`
- Stats cards: `#EFF6FF` bg, `#E0E7FF` border
- Accept/Confirm buttons: orange `#F97316`
- Decline button: ghost, `#DC2626` text

### Profile Screens

- Menu chevrons: `#94A3B8`
- Press state: `#EFF6FF` bg
- Sign out: `#DC2626` text, no bg
- Avatar ring: `3px solid #DBEAFE`

### Auth Screens

- Welcome gradient: `#0F172A` to `#1E3A8A`
- Sign Up button: orange `#F97316`
- Log In button: white outline
- Inputs: white bg, `#E0E7FF` border

### Review Modal

- Submit button: orange `#F97316`
- Stars: `#FACC15` (unchanged)
- Modal handle: `#E0E7FF`

---

## 4. What Does NOT Change

- All screen layouts and navigation structure
- All user flows (auth, search, booking, chat, review)
- Icon library (Ionicons)
- Component structure and data flows
- Real-time subscriptions and push notifications
- Star rating gold, success green, warning amber, error red
