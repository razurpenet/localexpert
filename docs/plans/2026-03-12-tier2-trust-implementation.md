# Tier 2: Trust Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add review sub-scores, Handby Verified badge, and auto response time calculation to build a visible "trust stack" across provider profiles and search cards.

**Architecture:** Single SQL migration adds columns + triggers. Frontend changes are additive — sub-score pickers in ReviewModal, progress bars on provider detail, verified badge on cards, and onboarding checklist update. Sub-score averages calculated client-side from already-fetched reviews array.

**Tech Stack:** Supabase (PostgreSQL triggers, RLS), React Native + Expo, TypeScript, Ionicons

---

### Task 1: SQL Migration — Review Sub-Scores Columns

**Files:**
- Create: `supabase/migrations/20260312_tier2_trust.sql`

**Step 1: Create the migration file with review sub-score columns**

```sql
-- Migration: Tier 2 — Trust features
-- Date: 2026-03-12
-- Adds: review sub-scores, is_verified badge, auto response time trigger

-- ============================================================
-- 1. Review Sub-Scores — optional granular ratings
-- ============================================================
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS punctuality smallint CHECK (punctuality BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS quality     smallint CHECK (quality BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS value       smallint CHECK (value BETWEEN 1 AND 5);
```

Write just this section first. We'll append the rest in subsequent tasks.

**Step 2: Verify the SQL syntax is correct**

Read back the file to confirm.

**Step 3: Commit**

```bash
git add supabase/migrations/20260312_tier2_trust.sql
git commit -m "feat: tier 2 migration — review sub-score columns"
```

---

### Task 2: SQL Migration — Handby Verified Column + Trigger

**Files:**
- Modify: `supabase/migrations/20260312_tier2_trust.sql`

**Step 1: Append is_verified column to migration**

Add after the review sub-scores section:

```sql
-- ============================================================
-- 2. Handby Verified Badge — auto-calculated
-- ============================================================
ALTER TABLE provider_details
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
```

**Step 2: Update the existing badge trigger to also calculate is_verified**

Append to the migration:

```sql
-- Update the badge trigger to also set is_verified
CREATE OR REPLACE FUNCTION update_provider_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- Badge level (unchanged logic)
  NEW.badge_level := CASE
    WHEN NEW.avg_rating >= 4.5 AND NEW.review_count >= 10 AND NEW.completion_count >= 20 THEN 'top'
    WHEN NEW.avg_rating >= 4.0 AND NEW.review_count >= 3  AND NEW.completion_count >= 5  THEN 'rising'
    ELSE 'new'
  END;

  -- Handby Verified: 3+ reviews, 1+ verified credential, complete profile
  NEW.is_verified := (
    NEW.review_count >= 3
    AND EXISTS (SELECT 1 FROM credentials WHERE provider_id = NEW.id AND verified = true)
    AND EXISTS (SELECT 1 FROM profiles WHERE id = NEW.id AND avatar_url IS NOT NULL AND bio IS NOT NULL AND city IS NOT NULL)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists from Tier 1 (trg_update_badge), no need to recreate
-- CREATE OR REPLACE FUNCTION handles the update
```

**Step 3: Commit**

```bash
git add supabase/migrations/20260312_tier2_trust.sql
git commit -m "feat: tier 2 migration — is_verified column and trigger"
```

---

### Task 3: SQL Migration — Auto Response Time Trigger

**Files:**
- Modify: `supabase/migrations/20260312_tier2_trust.sql`

**Step 1: Append the response time trigger function**

Add after the verified badge section:

```sql
-- ============================================================
-- 3. Auto Response Time — median of last 20 responses
-- ============================================================
CREATE OR REPLACE FUNCTION update_provider_response_time()
RETURNS TRIGGER AS $$
DECLARE
  v_median integer;
BEGIN
  -- Only fire when status changes FROM 'pending' TO 'accepted' or 'declined'
  IF OLD.status != 'pending' OR NEW.status NOT IN ('accepted', 'declined') THEN
    RETURN NEW;
  END IF;

  -- Calculate median response time from last 20 responded requests
  SELECT percentile_cont(0.5) WITHIN GROUP (
    ORDER BY EXTRACT(EPOCH FROM (updated_at - created_at)) / 60
  )::integer
  INTO v_median
  FROM (
    SELECT created_at, updated_at
    FROM quote_requests
    WHERE provider_id = NEW.provider_id
      AND status IN ('accepted', 'declined')
      AND updated_at IS NOT NULL
    ORDER BY updated_at DESC
    LIMIT 20
  ) recent;

  -- Update provider_details with median response time
  UPDATE provider_details
  SET response_time_mins = COALESCE(v_median, 0)
  WHERE id = NEW.provider_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_response_time ON quote_requests;
CREATE TRIGGER trg_update_response_time
  AFTER UPDATE ON quote_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_response_time();
```

**Step 2: Verify the complete migration file reads correctly**

Read back the full file to confirm all three sections are present and syntactically correct.

**Step 3: Commit**

```bash
git add supabase/migrations/20260312_tier2_trust.sql
git commit -m "feat: tier 2 migration — auto response time trigger"
```

---

### Task 4: ReviewModal — Add Sub-Score Pickers

**Files:**
- Modify: `handby-mobile/components/ui/ReviewModal.tsx`

**Context:** The ReviewModal currently has a 5-star main rating picker (40px stars), optional text comment, and a submit button. The sub-score pickers go between the main rating label and the text input. They only appear after the main rating is selected (progressive disclosure).

**Step 1: Add sub-score state variables**

In `ReviewModal`, after `const [body, setBody] = useState('')`, add:

```typescript
const [punctuality, setPunctuality] = useState(0)
const [quality, setQuality] = useState(0)
const [value, setValue] = useState(0)
```

Update the `reset()` function to also reset sub-scores:

```typescript
function reset() {
  setRating(0)
  setBody('')
  setPunctuality(0)
  setQuality(0)
  setValue(0)
}
```

**Step 2: Add a SubScoreRow component inside the file**

Above the `ReviewModal` function, add:

```typescript
function SubScoreRow({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.subScoreRow}>
      <Text style={styles.subScoreLabel}>{label}</Text>
      <View style={styles.subScoreStars}>
        {[1, 2, 3, 4, 5].map(n => (
          <TouchableOpacity key={n} onPress={() => onChange(value === n ? 0 : n)} activeOpacity={0.7}>
            <Ionicons
              name={n <= value ? 'star' : 'star-outline'}
              size={20}
              color={n <= value ? '#FACC15' : '#CBD5E1'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
```

Note: tapping the same star again deselects (sets to 0), keeping sub-scores optional.

**Step 3: Add sub-score section to the JSX**

After the `ratingLabel` text and before the `TextInput`, insert:

```tsx
{/* Sub-scores (progressive disclosure) */}
{rating > 0 && (
  <View style={styles.subScoreSection}>
    <Text style={styles.subScoreTitle}>Rate specific areas (optional)</Text>
    <SubScoreRow label="Punctuality" value={punctuality} onChange={setPunctuality} />
    <SubScoreRow label="Quality" value={quality} onChange={setQuality} />
    <SubScoreRow label="Value" value={value} onChange={setValue} />
  </View>
)}
```

**Step 4: Update the supabase insert to include sub-scores**

In `handleSubmit()`, update the insert object:

```typescript
const { error } = await supabase.from('reviews').insert({
  request_id: requestId,
  reviewer_id: user.id,
  provider_id: providerId,
  rating,
  body: body.trim() || null,
  punctuality: punctuality || null,
  quality: quality || null,
  value: value || null,
})
```

**Step 5: Add styles for sub-scores**

Add to the `StyleSheet.create({})`:

```typescript
subScoreSection: {
  backgroundColor: '#F8FAFC',
  borderRadius: 12,
  padding: 14,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: '#E0E7FF',
},
subScoreTitle: {
  fontSize: 13,
  fontWeight: '600',
  color: '#475569',
  marginBottom: 10,
},
subScoreRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 6,
},
subScoreLabel: {
  fontSize: 14,
  color: '#1E3A8A',
  fontWeight: '500',
},
subScoreStars: {
  flexDirection: 'row',
  gap: 4,
},
```

**Step 6: Verify the file has no syntax errors**

Read back the modified file to check.

**Step 7: Commit**

```bash
git add handby-mobile/components/ui/ReviewModal.tsx
git commit -m "feat: add sub-score pickers to review modal"
```

---

### Task 5: Provider Detail Page — Sub-Score Progress Bars

**Files:**
- Modify: `handby-mobile/app/provider/[id].tsx`

**Context:** The provider detail page already fetches all reviews and displays them. We need to calculate sub-score averages client-side and show progress bars below the overall rating stats. Only show when 3+ reviews include sub-scores.

**Step 1: Add a SubScoreBar component inside the file**

Above `ProviderProfileScreen`, add:

```typescript
function SubScoreBar({ label, avg }: { label: string; avg: number }) {
  return (
    <View style={styles.subBar}>
      <Text style={styles.subBarLabel}>{label}</Text>
      <View style={styles.subBarTrack}>
        <View style={[styles.subBarFill, { width: `${(avg / 5) * 100}%` }]} />
      </View>
      <Text style={styles.subBarValue}>{avg.toFixed(1)}</Text>
    </View>
  )
}
```

**Step 2: Calculate sub-score averages from reviews**

Inside `ProviderProfileScreen`, after `const responseTime = details?.response_time_mins`, add:

```typescript
// Calculate sub-score averages from reviews that have sub-scores
const subScoreReviews = reviews.filter(
  (r: any) => r.punctuality != null || r.quality != null || r.value != null
)
const subScores = subScoreReviews.length >= 3 ? {
  punctuality: subScoreReviews.reduce((sum: number, r: any) => sum + (r.punctuality ?? 0), 0) /
    subScoreReviews.filter((r: any) => r.punctuality != null).length || null,
  quality: subScoreReviews.reduce((sum: number, r: any) => sum + (r.quality ?? 0), 0) /
    subScoreReviews.filter((r: any) => r.quality != null).length || null,
  value: subScoreReviews.reduce((sum: number, r: any) => sum + (r.value ?? 0), 0) /
    subScoreReviews.filter((r: any) => r.value != null).length || null,
} : null
```

**Step 3: Add sub-score bars to the JSX**

After the closing `</View>` of the stats row (line ~186) and before the `is_available` badge, insert:

```tsx
{/* Sub-score breakdown */}
{subScores && (
  <View style={styles.subScoresCard}>
    <Text style={styles.subScoresTitle}>Rating Breakdown</Text>
    {subScores.punctuality != null && <SubScoreBar label="Punctuality" avg={subScores.punctuality} />}
    {subScores.quality != null && <SubScoreBar label="Quality" avg={subScores.quality} />}
    {subScores.value != null && <SubScoreBar label="Value" avg={subScores.value} />}
  </View>
)}
```

**Step 4: Add styles**

Add to `StyleSheet.create({})`:

```typescript
subScoresCard: {
  width: '100%',
  marginTop: 16,
  paddingTop: 14,
  borderTopWidth: 1,
  borderTopColor: '#E0E7FF',
},
subScoresTitle: {
  fontSize: 13,
  fontWeight: '600',
  color: '#475569',
  marginBottom: 10,
},
subBar: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 6,
},
subBarLabel: {
  fontSize: 13,
  color: '#1E3A8A',
  width: 80,
},
subBarTrack: {
  flex: 1,
  height: 6,
  backgroundColor: '#E0E7FF',
  borderRadius: 3,
},
subBarFill: {
  height: 6,
  backgroundColor: '#1E40AF',
  borderRadius: 3,
},
subBarValue: {
  fontSize: 13,
  fontWeight: '600',
  color: '#1E3A8A',
  width: 28,
  textAlign: 'right',
},
```

**Step 5: Commit**

```bash
git add handby-mobile/app/provider/[id].tsx
git commit -m "feat: sub-score progress bars on provider detail page"
```

---

### Task 6: Provider Detail Page — Handby Verified Badge

**Files:**
- Modify: `handby-mobile/app/provider/[id].tsx`

**Context:** The header card shows the provider name with an optional badge (Top Pro / Rising Pro). We need to add a "Handby Verified" pill after the existing badge when `is_verified` is true.

**Step 1: Extract is_verified from provider details**

After `const responseTime = details?.response_time_mins` (around line 109), add:

```typescript
const isVerified = details?.is_verified === true
```

**Step 2: Add verified badge to the nameRow**

In the `nameRow` View (around line 129-137), after the existing `badgeInfo` conditional block, add:

```tsx
{isVerified && (
  <View style={styles.verifiedBadge}>
    <Ionicons name="shield-checkmark" size={12} color="#1E40AF" />
    <Text style={styles.verifiedText}>Verified</Text>
  </View>
)}
```

**Step 3: Add styles**

```typescript
verifiedBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 3,
  backgroundColor: '#DBEAFE',
  borderRadius: 8,
  paddingHorizontal: 8,
  paddingVertical: 4,
},
verifiedText: {
  fontSize: 11,
  fontWeight: '700',
  color: '#1E40AF',
},
```

**Step 4: Commit**

```bash
git add handby-mobile/app/provider/[id].tsx
git commit -m "feat: Handby Verified badge on provider detail page"
```

---

### Task 7: ProviderResultCard — Verified Tick Icon

**Files:**
- Modify: `handby-mobile/components/search/ProviderResultCard.tsx`

**Context:** The search result card shows a provider name with an optional badge (Top Pro / Rising). We add a small verified shield icon next to the name when `is_verified` is true.

**Step 1: Add is_verified to Props interface**

In the `Props` interface (around line 7-22), add:

```typescript
is_verified?: boolean
```

**Step 2: Add verified icon to the nameRow**

In the `nameRow` View (around line 54-63), after the `badge` conditional block, add:

```tsx
{props.is_verified && (
  <Ionicons name="shield-checkmark" size={14} color="#1E40AF" />
)}
```

**Step 3: Commit**

```bash
git add handby-mobile/components/search/ProviderResultCard.tsx
git commit -m "feat: verified tick on search result cards"
```

---

### Task 8: OnboardingChecklist — Verified Checklist Item

**Files:**
- Modify: `handby-mobile/components/provider/OnboardingChecklist.tsx`

**Context:** The OnboardingChecklist takes an array of `{ label: string; done: boolean }` items. The parent component that renders it will need to include a "Get Handby Verified" item. This task updates the parent to pass the verification criteria status. The checklist component itself doesn't need changes — it already handles any items array.

**Find the parent that renders OnboardingChecklist** — search for `OnboardingChecklist` usage. It's likely in the provider dashboard screen.

**Step 1: Find the file that uses OnboardingChecklist**

Run:
```bash
grep -r "OnboardingChecklist" handby-mobile/ --include="*.tsx" -l
```

Expected: the provider dashboard file (likely `app/(provider)/index.tsx` or similar).

**Step 2: Add the "Get Handby Verified" checklist item**

In the parent file, add to the checklist items array:

```typescript
{ label: 'Get Handby Verified (3+ reviews, verified credential, complete profile)', done: providerDetails?.is_verified === true },
```

The exact placement depends on the parent file's structure.

**Step 3: Commit**

```bash
git add <parent-file>
git commit -m "feat: add Handby Verified to onboarding checklist"
```

---

### Task 9: Final Verification

**Step 1: Check all modified files compile**

```bash
cd handby-mobile && npx tsc --noEmit
```

Expected: no type errors.

**Step 2: Verify migration SQL is valid**

Read back `supabase/migrations/20260312_tier2_trust.sql` and verify:
- 3 ALTER TABLE columns on reviews
- 1 ALTER TABLE column on provider_details
- CREATE OR REPLACE FUNCTION update_provider_badge() includes is_verified calc
- CREATE OR REPLACE FUNCTION update_provider_response_time() with median calc
- CREATE TRIGGER for response time

**Step 3: Commit any remaining fixes**

```bash
git add -A
git commit -m "feat: Tier 2 trust features complete"
```

---

## Post-Implementation: Run the Migration

The user needs to run `supabase/migrations/20260312_tier2_trust.sql` in the Supabase Dashboard SQL Editor. This is a manual step — remind the user when all tasks are done.

---

## Summary of All Changes

| # | File | What Changes |
|---|------|-------------|
| 1-3 | `supabase/migrations/20260312_tier2_trust.sql` | New file: 3 review columns, is_verified column, badge trigger update, response time trigger |
| 4 | `components/ui/ReviewModal.tsx` | Sub-score picker rows (punctuality, quality, value) with progressive disclosure |
| 5 | `app/provider/[id].tsx` | Sub-score progress bars below stats |
| 6 | `app/provider/[id].tsx` | Handby Verified badge next to name |
| 7 | `components/search/ProviderResultCard.tsx` | Verified shield icon next to name |
| 8 | Parent of OnboardingChecklist | "Get Handby Verified" checklist item |
| 9 | All files | TypeScript compilation check |
