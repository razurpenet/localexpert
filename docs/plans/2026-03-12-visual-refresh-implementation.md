# Visual Refresh Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the "Trust & Speed" visual refresh across all Handby mobile app screens — new colour tokens, orange CTA buttons, blue-tinted borders and backgrounds, updated typography weights.

**Architecture:** Create a shared `theme.ts` constants file, then do bulk find-and-replace of old hex values across all files, then make targeted CTA-specific changes (orange buttons, status badge restyling, tab bar indicator).

**Tech Stack:** React Native, Expo, TypeScript. No new dependencies needed.

---

### Task 1: Create theme constants file

**Files:**
- Create: `handby-mobile/lib/theme.ts`

**Step 1: Create the theme file**

```typescript
// Design tokens — "Trust & Speed" visual refresh
export const colors = {
  primary:       '#1E40AF',
  primaryLight:  '#3B82F6',
  primaryBg:     '#EFF6FF',
  primarySubtle: '#DBEAFE',
  cta:           '#F97316',
  ctaPressed:    '#EA580C',
  ctaDisabled:   '#FDBA74',
  textPrimary:   '#1E3A8A',
  textBody:      '#475569',
  textMuted:     '#94A3B8',
  surface:       '#FFFFFF',
  border:        '#E0E7FF',
  success:       '#16A34A',
  warning:       '#D97706',
  error:         '#DC2626',
  star:          '#FACC15',
} as const

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const

export const shadow = {
  card: {
    shadowColor: '#1E40AF',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  cardRaised: {
    shadowColor: '#1E40AF',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
} as const
```

**Step 2: Commit**

```bash
git add handby-mobile/lib/theme.ts
git commit -m "feat: add design token constants for visual refresh"
```

---

### Task 2: Bulk colour replacement — backgrounds, text, borders

This is the largest task. Use `replace_all` on each file to swap old hex values for new ones. The replacements are mechanical — same colour, new value. No logic changes.

**Replacement map (apply to ALL files listed below):**

| Find | Replace | Token |
|------|---------|-------|
| `#F8F9FB` | `#EFF6FF` | background |
| `#1A1A2E` | `#1E3A8A` | text-primary |
| `#6B7280` | `#475569` | text-body |
| `#9CA3AF` | `#94A3B8` | text-muted |
| `#E5E7EB` | `#E0E7FF` | border |
| `#F3F4F6` | `#E0E7FF` | divider |
| `#D1D5DB` | `#94A3B8` | disabled |

**Files to process (33 files):**

Screens:
- `handby-mobile/app/_layout.tsx`
- `handby-mobile/app/(auth)/login.tsx`
- `handby-mobile/app/(auth)/signup.tsx`
- `handby-mobile/app/(auth)/forgot-password.tsx`
- `handby-mobile/app/(customer)/index.tsx`
- `handby-mobile/app/(customer)/search.tsx`
- `handby-mobile/app/(customer)/bookings.tsx`
- `handby-mobile/app/(customer)/profile.tsx`
- `handby-mobile/app/(customer)/edit-profile.tsx`
- `handby-mobile/app/(customer)/favourites.tsx`
- `handby-mobile/app/(customer)/_layout.tsx`
- `handby-mobile/app/(provider)/index.tsx`
- `handby-mobile/app/(provider)/requests.tsx`
- `handby-mobile/app/(provider)/reviews.tsx`
- `handby-mobile/app/(provider)/photos.tsx`
- `handby-mobile/app/(provider)/edit-profile.tsx`
- `handby-mobile/app/(provider)/manage-services.tsx`
- `handby-mobile/app/(provider)/appointments.tsx`
- `handby-mobile/app/(provider)/quotes-list.tsx`
- `handby-mobile/app/(provider)/job-photos.tsx`
- `handby-mobile/app/(provider)/credentials.tsx`
- `handby-mobile/app/(provider)/more.tsx`
- `handby-mobile/app/(provider)/_layout.tsx`
- `handby-mobile/app/chat/[requestId].tsx`
- `handby-mobile/app/provider/[id].tsx`

Components:
- `handby-mobile/components/ui/Input.tsx`
- `handby-mobile/components/ui/ReviewModal.tsx`
- `handby-mobile/components/ui/StatusToast.tsx`
- `handby-mobile/components/home/SearchHero.tsx`
- `handby-mobile/components/home/CategoryGrid.tsx`
- `handby-mobile/components/home/NearbyPros.tsx`
- `handby-mobile/components/provider/JoinProBanner.tsx`
- `handby-mobile/components/provider/OnboardingChecklist.tsx`
- `handby-mobile/components/search/FilterChips.tsx`
- `handby-mobile/components/search/ProviderResultCard.tsx`

**Step 1: For each file, apply all 7 replacements using `replace_all: true`**

Process files in batches of 5-6 at a time (parallel Edit calls). For each file:
```
Edit file, old_string: '#F8F9FB', new_string: '#EFF6FF', replace_all: true
Edit file, old_string: '#1A1A2E', new_string: '#1E3A8A', replace_all: true
Edit file, old_string: '#6B7280', new_string: '#475569', replace_all: true
Edit file, old_string: '#9CA3AF', new_string: '#94A3B8', replace_all: true
Edit file, old_string: '#E5E7EB', new_string: '#E0E7FF', replace_all: true
Edit file, old_string: '#F3F4F6', new_string: '#E0E7FF', replace_all: true
Edit file, old_string: '#D1D5DB', new_string: '#94A3B8', replace_all: true
```

Not every file has every colour — that's fine, Edit will just skip if not found.

**Step 2: Commit**

```bash
git add handby-mobile/
git commit -m "feat: apply new background, text, border colours across all screens"
```

---

### Task 3: Bulk colour replacement — primary blue #2563EB → #1E40AF

**Separate task because this affects 147 occurrences and must NOT touch CTA buttons (handled in Task 4).**

Apply to ALL 35 files listed in Task 2, plus:
- `handby-mobile/components/ui/Avatar.tsx` (if applicable)

**Step 1: For each file, replace `#2563EB` with `#1E40AF` using `replace_all: true`**

```
Edit file, old_string: '#2563EB', new_string: '#1E40AF', replace_all: true
```

**Important:** This will also replace CTA button colours with `#1E40AF`. That's fine — Task 4 will change specific CTA buttons to orange.

**Step 2: Also replace the disabled blue `#93C5FD` where it appears:**
```
Edit file, old_string: '#93C5FD', new_string: '#DBEAFE', replace_all: true
```

**Step 3: Commit**

```bash
git add handby-mobile/
git commit -m "feat: deepen primary blue from #2563EB to #1E40AF"
```

---

### Task 4: CTA buttons — switch to orange #F97316

**Files:**
- Modify: `handby-mobile/components/ui/Button.tsx`
- Modify: `handby-mobile/components/ui/ReviewModal.tsx`
- Modify: `handby-mobile/components/provider/JoinProBanner.tsx`
- Modify: `handby-mobile/app/(customer)/bookings.tsx` (Leave Review button)
- Modify: `handby-mobile/app/(provider)/requests.tsx` (Accept/Confirm buttons)
- Modify: `handby-mobile/app/provider/[id].tsx` (Send Quote Request button)
- Modify: `handby-mobile/app/chat/[requestId].tsx` (Send button)

**Step 1: Update Button.tsx primary variant**

In Button.tsx, find the primary button background colour (now `#1E40AF` after Task 3) and change to `#F97316`. Also update the loading indicator colour for primary variant.

```typescript
// Primary button bg: #1E40AF → #F97316
// Primary disabled bg: use #FDBA74 (light orange)
// Primary loading indicator: white (already correct)
```

**Step 2: Update ReviewModal.tsx submit button**

```typescript
// submitBtn backgroundColor: #1E40AF → #F97316
// submitBtnDisabled backgroundColor: adjust to #FDBA74
```

**Step 3: Update JoinProBanner.tsx CTA button**

```typescript
// button backgroundColor: #1E40AF → #F97316
```

**Step 4: Update bookings.tsx Leave Review button**

```typescript
// reviewBtn backgroundColor: keep #EFF6FF (it's a secondary action, not main CTA)
// OR change to subtle orange: backgroundColor: '#FFF7ED', text: '#F97316'
```

**Step 5: Update requests.tsx action buttons**

Find the "Accept" and "Confirm" action buttons and change their background to `#F97316`.

**Step 6: Update provider/[id].tsx quote request button**

Change "Send Quote Request" button from blue to `#F97316`.

**Step 7: Update chat send button**

Change send icon colour from `#1E40AF` to `#F97316` (for active state).

**Step 8: Commit**

```bash
git add handby-mobile/
git commit -m "feat: orange CTA buttons for urgency (Request, Accept, Review, Send)"
```

---

### Task 5: Card styling — add blue-tinted borders

**Files:** All files with card styles (check StyleSheet for `card` key)

**Step 1: Add `borderWidth: 1, borderColor: '#E0E7FF'` to card styles**

Files with card styles to update:
- `handby-mobile/app/(customer)/bookings.tsx` — card style
- `handby-mobile/app/(customer)/search.tsx` — card styles
- `handby-mobile/app/(provider)/requests.tsx` — card style
- `handby-mobile/app/(provider)/reviews.tsx` — card style
- `handby-mobile/app/(provider)/index.tsx` — card styles
- `handby-mobile/app/provider/[id].tsx` — headerCard and section cards
- `handby-mobile/components/home/NearbyPros.tsx` — card style
- `handby-mobile/components/search/ProviderResultCard.tsx` — card style

For each card style, add/update:
```typescript
borderWidth: 1,
borderColor: '#E0E7FF',
```

Also update shadow to blue-tinted:
```typescript
shadowColor: '#1E40AF',
shadowOpacity: 0.06,
```

**Step 2: Commit**

```bash
git add handby-mobile/
git commit -m "feat: blue-tinted card borders and shadows"
```

---

### Task 6: Status badges — pill style with dot indicators

**Files:**
- Modify: `handby-mobile/app/(customer)/bookings.tsx` — STATUS_CONFIG and badge rendering
- Modify: `handby-mobile/app/(provider)/requests.tsx` — status badges

**Step 1: Update STATUS_CONFIG in bookings.tsx**

Remove `icon` from STATUS_CONFIG. Change badge rendering from icon+text to dot+text:

```typescript
// Old:
<Ionicons name={config.icon as any} size={12} color={config.text} />
<Text style={[styles.statusText, { color: config.text }]}>{config.label}</Text>

// New:
<View style={[styles.statusDot, { backgroundColor: config.text }]} />
<Text style={[styles.statusText, { color: config.text }]}>{config.label}</Text>
```

Add `statusDot` style:
```typescript
statusDot: { width: 6, height: 6, borderRadius: 3 },
```

Update `statusBadge` style:
```typescript
statusBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  borderRadius: 9999,
  paddingHorizontal: 10,
  paddingVertical: 4,
},
```

**Step 2: Apply same dot pattern to provider requests.tsx**

**Step 3: Commit**

```bash
git add handby-mobile/
git commit -m "feat: pill-shaped status badges with dot indicators"
```

---

### Task 7: Tab bar — active indicator line

**Files:**
- Modify: `handby-mobile/app/(customer)/_layout.tsx`
- Modify: `handby-mobile/app/(provider)/_layout.tsx`

**Step 1: Add tab bar indicator style**

In both layout files, update the Tabs `screenOptions`:

```typescript
tabBarStyle: {
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E0E7FF',
  height: 85,
  paddingBottom: 20,
  paddingTop: 8,
},
tabBarActiveTintColor: '#1E40AF',
tabBarInactiveTintColor: '#94A3B8',
tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
tabBarIndicatorStyle: {
  backgroundColor: '#1E40AF',
  height: 3,
  borderRadius: 1.5,
},
```

Note: `tabBarIndicatorStyle` works with Material Top Tabs. For bottom tabs, add a custom indicator via `tabBarIcon` wrapper with a top border on the active icon container.

**Step 2: Commit**

```bash
git add handby-mobile/
git commit -m "feat: tab bar active indicator line"
```

---

### Task 8: Avatar ring treatment

**Files:**
- Modify: `handby-mobile/components/ui/Avatar.tsx`

**Step 1: Add blue ring to avatar**

```typescript
// Add to avatar container style:
borderWidth: 2,
borderColor: '#DBEAFE',
```

**Step 2: Commit**

```bash
git add handby-mobile/
git commit -m "feat: blue ring on avatars"
```

---

### Task 9: Auth screens — orange Sign Up, gradient update

**Files:**
- Modify: `handby-mobile/app/(auth)/welcome.tsx`

**Step 1: Update welcome gradient**

Change gradient colors to `['#0F172A', '#1E3A8A']` (if not already).

**Step 2: Change Sign Up button to orange**

Find the sign-up button and change its background to `#F97316`.

**Step 3: Commit**

```bash
git add handby-mobile/
git commit -m "feat: orange sign-up CTA on welcome screen"
```

---

### Task 10: Chat screen — sent bubble + send button

**Files:**
- Modify: `handby-mobile/app/chat/[requestId].tsx`

**Step 1: Sent bubble colour already updated in Task 3 (#1E40AF)**

Verify `bubbleMe` background is `#1E40AF`.

**Step 2: Received bubble colour**

Change received bubble background from `#F3F4F6` (now `#E0E7FF` after Task 2) — verify it's `#EFF6FF`:

```typescript
// If bubbleOther bg is #E0E7FF, change to #EFF6FF
```

**Step 3: Send button — already handled in Task 4**

**Step 4: Commit (if changes needed)**

```bash
git add handby-mobile/
git commit -m "feat: chat bubble colours aligned with design system"
```

---

### Task 11: Final verification

**Step 1: Search for any remaining old colours**

```bash
cd handby-mobile && grep -rn '#F8F9FB\|#2563EB\|#1A1A2E\|#6B7280\|#9CA3AF\|#E5E7EB\|#F3F4F6\|#D1D5DB' --include='*.tsx' --include='*.ts' app/ components/ lib/
```

Expected: No matches (or only in theme.ts comments if any).

**Step 2: Run the app to verify**

```bash
npx expo start --port 8082
```

Check each screen visually:
- [ ] Backgrounds are blue-tinted (#EFF6FF)
- [ ] Text is navy (#1E3A8A) not black
- [ ] CTA buttons are orange (#F97316)
- [ ] Cards have blue-tinted borders
- [ ] Status badges are pills with dots
- [ ] Tab bar has deeper blue active state

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete Trust & Speed visual refresh"
```
