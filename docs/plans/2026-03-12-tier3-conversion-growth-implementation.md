# Tier 3: Conversion & Growth — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add instant quoting, smart search ranking, repeat booking, and provider earnings dashboard to convert browsing into bookings and keep both sides engaged.

**Architecture:** Single SQL migration adds 5 columns to `quote_requests` (no new tables). Frontend changes span 8 files: structured quote form replaces free-text, client-side ranking algorithm sorts search results, "Book Again" button on completed jobs, and a new earnings screen for providers. All features use existing Supabase data — no new API endpoints or edge functions.

**Tech Stack:** React Native + Expo Router, Supabase (PostgreSQL), TypeScript, Ionicons, `lib/theme.ts` design tokens

---

### Task 1: SQL Migration — All Schema Changes

**Files:**
- Create: `supabase/migrations/20260312_tier3_conversion_growth.sql`

**Step 1: Create the migration file**

```sql
-- Migration: Tier 3 — Conversion & Growth features
-- Date: 2026-03-12
-- Adds: structured quoting fields, rebooking reference

-- ============================================================
-- 1. Instant Quote — structured request fields + quoted price
-- ============================================================
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS urgency        text DEFAULT 'flexible'
    CHECK (urgency IN ('flexible', 'this_week', 'urgent')),
  ADD COLUMN IF NOT EXISTS preferred_date  date,
  ADD COLUMN IF NOT EXISTS preferred_time  text
    CHECK (preferred_time IN ('morning', 'afternoon', 'evening', 'flexible')),
  ADD COLUMN IF NOT EXISTS quoted_price    decimal(10,2);

-- ============================================================
-- 2. Repeat Booking — self-referencing FK for rebookings
-- ============================================================
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS rebooking_of uuid REFERENCES quote_requests(id);
```

**Step 2: Verify the SQL reads correctly**

Read back the file to confirm.

**Step 3: Commit**

```bash
git add supabase/migrations/20260312_tier3_conversion_growth.sql
git commit -m "feat: tier 3 migration — structured quotes and rebooking columns"
```

---

### Task 2: Provider Profile — Structured Quote Request Form

**Files:**
- Modify: `handby-mobile/app/provider/[id].tsx`

**Context:** The current quote form (lines 334-348) is a simple `TextInput` + `Button`. We replace it with a structured form: service picker, description, preferred date, preferred time, urgency, and a price indicator. The `services` array is already loaded in state.

**Step 1: Add new state variables for the structured form**

After `const [isFavourited, setIsFavourited] = useState(false)` (line 40), add:

```typescript
const [selectedService, setSelectedService] = useState<any>(null)
const [urgency, setUrgency] = useState<'flexible' | 'this_week' | 'urgent'>('flexible')
const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | 'flexible'>('flexible')
```

**Step 2: Read rebook query params for pre-filling**

Update the `useLocalSearchParams` call at line 29 to include rebook params:

```typescript
const { id, rebook, serviceId, originalRequestId } = useLocalSearchParams<{
  id: string
  rebook?: string
  serviceId?: string
  originalRequestId?: string
}>()
```

**Step 3: Add useEffect to pre-fill on rebook**

After the existing `useEffect` for fetching data (after line 64), add:

```typescript
// Pre-fill form when rebooking
useEffect(() => {
  if (rebook === 'true' && serviceId && services.length > 0) {
    const svc = services.find((s: any) => s.id === serviceId)
    if (svc) {
      setSelectedService(svc)
      setMessage(`Repeat booking — previously hired for ${svc.title}`)
    }
  }
}, [rebook, serviceId, services])
```

**Step 4: Update the sendQuote function**

Replace the existing `sendQuote` function (lines 77-96) with:

```typescript
async function sendQuote() {
  if (!message.trim() || !user) return
  setSending(true)
  const { error } = await supabase.from('quote_requests').insert({
    customer_id: user.id,
    provider_id: id,
    service_id: selectedService?.id ?? services[0]?.id ?? null,
    message: message.trim(),
    status: 'pending',
    urgency,
    preferred_time: preferredTime,
    rebooking_of: rebook === 'true' && originalRequestId ? originalRequestId : null,
  })
  setSending(false)
  if (error) {
    if (Platform.OS === 'web') { window.alert(error.message) }
    else { Alert.alert('Error', error.message) }
  } else {
    if (Platform.OS === 'web') { window.alert('Your quote request has been sent.') }
    else { Alert.alert('Sent!', 'Your quote request has been sent.') }
    setMessage('')
    setSelectedService(null)
    setUrgency('flexible')
    setPreferredTime('flexible')
  }
}
```

**Step 5: Replace the quote form JSX**

Replace the entire quote form section (lines 333-349, the `{user && myProfile?.role === 'customer' && (...)}` block) with:

```tsx
{/* Structured Quote Form (customers only) */}
{user && myProfile?.role === 'customer' && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Request a Quote</Text>

    {/* Service picker */}
    {services.length > 1 && (
      <View style={styles.servicePicker}>
        <Text style={styles.fieldLabel}>Select a service</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceChipsScroll}>
          <View style={styles.serviceChips}>
            {services.map((s: any) => (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.serviceChip,
                  selectedService?.id === s.id && styles.serviceChipActive,
                ]}
                onPress={() => setSelectedService(s)}
              >
                <Text style={[
                  styles.serviceChipText,
                  selectedService?.id === s.id && styles.serviceChipTextActive,
                ]}>
                  {s.title}
                </Text>
                {s.price_from != null && (
                  <Text style={[
                    styles.serviceChipPrice,
                    selectedService?.id === s.id && styles.serviceChipTextActive,
                  ]}>
                    From £{s.price_from}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    )}

    {/* Price indicator for selected service */}
    {selectedService?.price_from != null && (
      <View style={styles.priceIndicator}>
        <Ionicons name="pricetag-outline" size={14} color="#1E40AF" />
        <Text style={styles.priceIndicatorText}>
          From £{selectedService.price_from}{selectedService.price_type === 'hourly' ? '/hr' : ''}
        </Text>
      </View>
    )}

    {/* Job description */}
    <TextInput
      style={styles.quoteInput}
      placeholder="Describe what you need..."
      placeholderTextColor="#94A3B8"
      value={message}
      onChangeText={setMessage}
      multiline
      numberOfLines={4}
      textAlignVertical="top"
    />

    {/* Preferred time */}
    <Text style={styles.fieldLabel}>Preferred time</Text>
    <View style={styles.optionRow}>
      {(['morning', 'afternoon', 'evening', 'flexible'] as const).map(t => (
        <TouchableOpacity
          key={t}
          style={[styles.optionChip, preferredTime === t && styles.optionChipActive]}
          onPress={() => setPreferredTime(t)}
        >
          <Text style={[styles.optionText, preferredTime === t && styles.optionTextActive]}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* Urgency */}
    <Text style={styles.fieldLabel}>How urgent?</Text>
    <View style={styles.optionRow}>
      {([
        { key: 'flexible' as const, label: 'Flexible', icon: 'time-outline' },
        { key: 'this_week' as const, label: 'This Week', icon: 'calendar-outline' },
        { key: 'urgent' as const, label: 'Urgent', icon: 'flash-outline' },
      ]).map(u => (
        <TouchableOpacity
          key={u.key}
          style={[styles.optionChip, urgency === u.key && styles.optionChipActive]}
          onPress={() => setUrgency(u.key)}
        >
          <Ionicons name={u.icon as any} size={14} color={urgency === u.key ? '#FFFFFF' : '#475569'} />
          <Text style={[styles.optionText, urgency === u.key && styles.optionTextActive]}>{u.label}</Text>
        </TouchableOpacity>
      ))}
    </View>

    <Button title="Send request" onPress={sendQuote} loading={sending} disabled={!message.trim()} />
  </View>
)}
```

**Step 6: Add the `ScrollView` import** (if not already imported)

Check the imports at line 2. `ScrollView` is already imported. Good.

**Step 7: Add new styles**

Add these to the `StyleSheet.create({})` block:

```typescript
fieldLabel: {
  fontSize: 13,
  fontWeight: '600',
  color: '#475569',
  marginBottom: 8,
  marginTop: 12,
},
servicePicker: {
  marginBottom: 4,
},
serviceChipsScroll: {
  marginBottom: 8,
},
serviceChips: {
  flexDirection: 'row',
  gap: 8,
},
serviceChip: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E0E7FF',
  paddingHorizontal: 14,
  paddingVertical: 10,
  alignItems: 'center',
},
serviceChipActive: {
  backgroundColor: '#1E40AF',
  borderColor: '#1E40AF',
},
serviceChipText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#1E3A8A',
},
serviceChipPrice: {
  fontSize: 11,
  color: '#475569',
  marginTop: 2,
},
serviceChipTextActive: {
  color: '#FFFFFF',
},
priceIndicator: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  backgroundColor: '#EFF6FF',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 8,
  marginBottom: 8,
},
priceIndicatorText: {
  fontSize: 14,
  fontWeight: '600',
  color: '#1E40AF',
},
optionRow: {
  flexDirection: 'row',
  gap: 8,
  marginBottom: 8,
},
optionChip: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  backgroundColor: '#FFFFFF',
  borderRadius: 10,
  borderWidth: 1,
  borderColor: '#E0E7FF',
  paddingVertical: 10,
},
optionChipActive: {
  backgroundColor: '#1E40AF',
  borderColor: '#1E40AF',
},
optionText: {
  fontSize: 12,
  fontWeight: '600',
  color: '#475569',
},
optionTextActive: {
  color: '#FFFFFF',
},
```

**Step 8: Commit**

```bash
git add handby-mobile/app/provider/[id].tsx
git commit -m "feat: structured quote request form with service picker, urgency, and rebook support"
```

---

### Task 3: Provider Requests — Accept with Price + Repeat Customer Badge

**Files:**
- Modify: `handby-mobile/app/(provider)/requests.tsx`

**Context:** The requests screen shows incoming customer requests with action buttons (Accept/Decline, Confirm Job, etc.). We need to:
1. Add `quoted_price` and `rebooking_of` to the Request interface and query
2. Show a "Repeat Customer" badge when `rebooking_of` is set
3. Show structured fields (urgency, preferred_time) on request cards
4. Change "Accept" to open a modal where provider enters a price

**Step 1: Update the Request interface and query**

Update the `Request` interface (lines 15-26) to:

```typescript
interface Request {
  id: string
  message: string
  status: JobStatus
  created_at: string
  confirmed_at: string | null
  en_route_at: string | null
  started_at: string | null
  completed_at: string | null
  urgency: string | null
  preferred_time: string | null
  preferred_date: string | null
  quoted_price: number | null
  rebooking_of: string | null
  profiles: { full_name: string; avatar_url: string | null }
  services: { title: string; price_from: number | null } | null
}
```

Update the `fetchRequests` query (line 73-74) to include the new fields:

```typescript
const { data } = await supabase
  .from('quote_requests')
  .select('id, message, status, created_at, confirmed_at, en_route_at, started_at, completed_at, urgency, preferred_time, preferred_date, quoted_price, rebooking_of, profiles!quote_requests_customer_id_fkey(full_name, avatar_url), services(title, price_from)')
  .eq('provider_id', user.id)
  .order('created_at', { ascending: false })
```

**Step 2: Add state for the price modal**

After the existing state variables, add:

```typescript
const [priceModal, setPriceModal] = useState<{ visible: boolean; requestId: string; serviceTitle: string; priceFrom: number | null }>({
  visible: false, requestId: '', serviceTitle: '', priceFrom: null,
})
const [quotePrice, setQuotePrice] = useState('')
```

**Step 3: Add the acceptWithPrice function**

After the `confirmAction` function, add:

```typescript
async function acceptWithPrice() {
  const price = parseFloat(quotePrice)
  if (isNaN(price) || price <= 0) {
    const msg = 'Please enter a valid price.'
    if (Platform.OS === 'web') window.alert(msg)
    else Alert.alert('Invalid price', msg)
    return
  }

  const { data, error } = await supabase
    .from('quote_requests')
    .update({ status: 'accepted', quoted_price: price })
    .eq('id', priceModal.requestId)
    .select()

  if (error) {
    const msg = `Update failed: ${error.message}`
    if (Platform.OS === 'web') window.alert(msg)
    else Alert.alert('Error', msg)
    return
  }

  if (!data || data.length === 0) {
    const msg = 'Update had no effect — you may not have permission.'
    if (Platform.OS === 'web') window.alert(msg)
    else Alert.alert('Error', msg)
    return
  }

  setPriceModal({ visible: false, requestId: '', serviceTitle: '', priceFrom: null })
  setQuotePrice('')
  fetchRequests()
}
```

**Step 4: Modify the Accept action to open the price modal instead of direct accept**

Change the `NEXT_ACTIONS` for pending (lines 41-44). Replace the Accept action:

```typescript
pending: [
  { status: 'accepted', label: 'Accept & Quote', icon: 'pricetag', bg: '#F97316', text: '#FFFFFF' },
  { status: 'declined', label: 'Decline', icon: 'close', bg: '#FEE2E2', text: '#DC2626' },
],
```

Then in the `renderItem` function, update the action button `onPress` to intercept the Accept action. Replace the action buttons section (lines 209-222) with:

```tsx
{/* Action buttons */}
{actions.length > 0 && (
  <View style={styles.actions}>
    {actions.map(action => (
      <TouchableOpacity
        key={action.status}
        style={[styles.actionBtn, { backgroundColor: action.bg }]}
        onPress={() => {
          if (action.status === 'accepted') {
            // Open price modal instead of direct accept
            setPriceModal({
              visible: true,
              requestId: item.id,
              serviceTitle: item.services?.title ?? 'Service',
              priceFrom: item.services?.price_from ?? null,
            })
          } else {
            confirmAction(item.id, action.status, action.label, action.timestampField)
          }
        }}
      >
        <Ionicons name={action.icon as any} size={16} color={action.text} />
        <Text style={[styles.actionText, { color: action.text }]}>{action.label}</Text>
      </TouchableOpacity>
    ))}
  </View>
)}
```

**Step 5: Add Repeat Customer badge and structured info to request cards**

In the `renderItem`, after the status strip and before the `cardRow`, add:

```tsx
{/* Repeat Customer badge */}
{item.rebooking_of && (
  <View style={styles.repeatBadge}>
    <Ionicons name="refresh-circle" size={14} color="#16A34A" />
    <Text style={styles.repeatText}>Repeat Customer</Text>
  </View>
)}
```

After the `cardDate` text and before the closing `</View>` of `cardInfo`, add:

```tsx
{/* Structured request info */}
{(item.urgency && item.urgency !== 'flexible' || item.preferred_time && item.preferred_time !== 'flexible') && (
  <View style={styles.requestMeta}>
    {item.urgency === 'urgent' && (
      <View style={styles.urgentChip}>
        <Ionicons name="flash" size={10} color="#DC2626" />
        <Text style={styles.urgentText}>Urgent</Text>
      </View>
    )}
    {item.urgency === 'this_week' && (
      <View style={styles.thisWeekChip}>
        <Ionicons name="calendar" size={10} color="#D97706" />
        <Text style={styles.thisWeekText}>This Week</Text>
      </View>
    )}
    {item.preferred_time && item.preferred_time !== 'flexible' && (
      <Text style={styles.metaText}>{item.preferred_time.charAt(0).toUpperCase() + item.preferred_time.slice(1)}</Text>
    )}
  </View>
)}
{/* Show quoted price if accepted */}
{item.quoted_price != null && (
  <Text style={styles.quotedPrice}>Quoted: £{item.quoted_price.toFixed(2)}</Text>
)}
```

**Step 6: Add the price modal JSX**

Add imports at the top:

```typescript
import { Modal, TextInput, KeyboardAvoidingView } from 'react-native'
```

(Update the existing import from `react-native` to include `Modal`, `TextInput`, `KeyboardAvoidingView`.)

After the `</FlatList>` and before the closing `</SafeAreaView>`, add:

```tsx
{/* Accept with Price Modal */}
<Modal visible={priceModal.visible} transparent animationType="slide" onRequestClose={() => setPriceModal(p => ({ ...p, visible: false }))}>
  <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.modalSheet}>
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Quote a Price</Text>
        <TouchableOpacity onPress={() => { setPriceModal(p => ({ ...p, visible: false })); setQuotePrice('') }}>
          <Ionicons name="close" size={24} color="#475569" />
        </TouchableOpacity>
      </View>
      <Text style={styles.modalSubtitle}>{priceModal.serviceTitle}</Text>
      {priceModal.priceFrom != null && (
        <Text style={styles.modalRef}>Reference: From £{priceModal.priceFrom}</Text>
      )}
      <View style={styles.priceInputRow}>
        <Text style={styles.priceCurrency}>£</Text>
        <TextInput
          style={styles.priceInput}
          placeholder="0.00"
          placeholderTextColor="#94A3B8"
          value={quotePrice}
          onChangeText={setQuotePrice}
          keyboardType="decimal-pad"
          autoFocus
        />
      </View>
      <TouchableOpacity
        style={[styles.modalSubmit, !quotePrice && styles.modalSubmitDisabled]}
        onPress={acceptWithPrice}
        disabled={!quotePrice}
      >
        <Text style={styles.modalSubmitText}>Accept & Send Quote</Text>
      </TouchableOpacity>
    </View>
  </KeyboardAvoidingView>
</Modal>
```

**Step 7: Add new styles**

Add to `StyleSheet.create({})`:

```typescript
repeatBadge: {
  flexDirection: 'row', alignItems: 'center', gap: 4,
  backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6,
},
repeatText: { fontSize: 12, fontWeight: '600', color: '#16A34A' },
requestMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
urgentChip: {
  flexDirection: 'row', alignItems: 'center', gap: 3,
  backgroundColor: '#FEE2E2', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
},
urgentText: { fontSize: 10, fontWeight: '600', color: '#DC2626' },
thisWeekChip: {
  flexDirection: 'row', alignItems: 'center', gap: 3,
  backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
},
thisWeekText: { fontSize: 10, fontWeight: '600', color: '#D97706' },
metaText: { fontSize: 11, color: '#475569' },
quotedPrice: { fontSize: 14, fontWeight: '700', color: '#1E3A8A', marginTop: 4 },
// Price modal
modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
modalTitle: { fontSize: 20, fontWeight: '700', color: '#1E3A8A' },
modalSubtitle: { fontSize: 14, color: '#475569', marginBottom: 4 },
modalRef: { fontSize: 13, color: '#1E40AF', marginBottom: 16 },
priceInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 12, borderWidth: 1, borderColor: '#E0E7FF', paddingHorizontal: 16, marginBottom: 20 },
priceCurrency: { fontSize: 24, fontWeight: '700', color: '#1E3A8A' },
priceInput: { flex: 1, fontSize: 24, fontWeight: '700', color: '#1E3A8A', paddingVertical: 16, marginLeft: 8 },
modalSubmit: { backgroundColor: '#F97316', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
modalSubmitDisabled: { backgroundColor: '#FDBA74' },
modalSubmitText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
```

**Step 8: Commit**

```bash
git add handby-mobile/app/\(provider\)/requests.tsx
git commit -m "feat: accept with price modal, repeat customer badge, and structured request info"
```

---

### Task 4: Customer Bookings — Show Quoted Price + Book Again Button

**Files:**
- Modify: `handby-mobile/app/(customer)/bookings.tsx`

**Context:** The bookings screen shows completed jobs with a "Leave Review" button. We add: quoted price display on accepted+ jobs, and a "Book Again" button on completed jobs.

**Step 1: Add `quoted_price` and `service_id` to the Booking interface and query**

Update the `Booking` interface (lines 14-26):

```typescript
interface Booking {
  id: string
  provider_id: string
  service_id: string | null
  message: string
  status: JobStatus
  created_at: string
  confirmed_at: string | null
  en_route_at: string | null
  started_at: string | null
  completed_at: string | null
  quoted_price: number | null
  profiles: { full_name: string; avatar_url: string | null }
  services: { title: string } | null
}
```

Update the `fetchBookings` query (line 93-96) to include the new fields:

```typescript
supabase
  .from('quote_requests')
  .select('id, provider_id, service_id, message, status, created_at, confirmed_at, en_route_at, started_at, completed_at, quoted_price, profiles!quote_requests_provider_id_fkey(full_name, avatar_url), services(title)')
  .eq('customer_id', user.id)
  .order('created_at', { ascending: false }),
```

**Step 2: Show quoted price on booking cards**

After the message preview `<Text>` (line 225), add:

```tsx
{/* Quoted price */}
{item.quoted_price != null && (
  <View style={styles.quotedPriceRow}>
    <Ionicons name="pricetag" size={13} color="#1E40AF" />
    <Text style={styles.quotedPriceText}>Quoted: £{item.quoted_price.toFixed(2)}</Text>
  </View>
)}
```

**Step 3: Add "Book Again" button alongside the review button**

In the completed footer section (lines 266-296), add the "Book Again" button. Replace the `completedFooter` view with:

```tsx
{/* Completed footer with review + book again buttons */}
{item.status === 'completed' && (
  <View style={styles.completedFooter}>
    <View style={styles.completedRow}>
      <Ionicons name="checkmark-done-circle" size={14} color="#16A34A" />
      <Text style={styles.completedText}>
        Completed {item.completed_at ? new Date(item.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
      </Text>
    </View>
    <View style={styles.completedActions}>
      {/* Book Again */}
      <TouchableOpacity
        style={styles.bookAgainBtn}
        onPress={(e) => {
          e.stopPropagation?.()
          router.push({
            pathname: `/provider/${item.provider_id}`,
            params: {
              rebook: 'true',
              serviceId: item.service_id ?? '',
              originalRequestId: item.id,
            },
          })
        }}
      >
        <Ionicons name="refresh" size={14} color="#F97316" />
        <Text style={styles.bookAgainText}>Book Again</Text>
      </TouchableOpacity>

      {/* Review button */}
      {reviewedIds.has(item.id) ? (
        <View style={styles.reviewedBadge}>
          <Ionicons name="star" size={12} color="#D97706" />
          <Text style={styles.reviewedText}>Reviewed</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.reviewBtn}
          onPress={(e) => {
            e.stopPropagation?.()
            setReviewTarget({
              requestId: item.id,
              providerId: item.provider_id,
              providerName: item.profiles?.full_name ?? 'this provider',
            })
          }}
        >
          <Ionicons name="star-outline" size={14} color="#1E40AF" />
          <Text style={styles.reviewBtnText}>Leave Review</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
)}
```

**Step 4: Add new styles**

Add to `StyleSheet.create({})`:

```typescript
quotedPriceRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginTop: 8,
  backgroundColor: '#EFF6FF',
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 6,
  alignSelf: 'flex-start',
},
quotedPriceText: {
  fontSize: 14,
  fontWeight: '700',
  color: '#1E40AF',
},
completedActions: {
  flexDirection: 'row',
  gap: 8,
},
bookAgainBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: '#FFF7ED',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 8,
},
bookAgainText: {
  fontSize: 13,
  fontWeight: '600',
  color: '#F97316',
},
```

**Step 5: Commit**

```bash
git add handby-mobile/app/\(customer\)/bookings.tsx
git commit -m "feat: quoted price display and Book Again button on completed jobs"
```

---

### Task 5: Smart Search Ranking — Ranking Function

**Files:**
- Modify: `handby-mobile/app/(customer)/search.tsx`

**Context:** The search screen fetches providers and applies basic filters. We add a `rankProviders()` function that sorts results by a composite score, and a "Best Match" badge on the top result. The existing `FilterChips` component already has filter keys — we modify the filter logic to use the ranking algorithm as the default sort.

**Step 1: Add the ranking function**

After the `CATEGORY_LABELS` constant (line 42), add:

```typescript
interface RankedResult extends Result {
  _rankScore?: number
  _categorySlugs: string[]
}

function calculateRankScore(
  provider: RankedResult,
  customerLat?: number | null,
  customerLng?: number | null
): number {
  const d = provider.provider_details
  if (!d) return 0

  // Rating score (0-1)
  const ratingScore = (d.avg_rating ?? 0) / 5

  // Response speed score (0-1)
  const mins = d.response_time_mins
  const speedScore = mins == null ? 0
    : mins < 30 ? 1.0
    : mins < 120 ? 0.7
    : mins < 1440 ? 0.3
    : 0.1

  // Completion score (0-1), maxes at 20 jobs
  const completionScore = Math.min((d.completion_count ?? 0) / 20, 1.0)

  // Availability bonus
  const availScore = d.is_available ? 1.0 : 0.0

  // Distance score (0-1) — requires customer location
  let distScore = 0.5 // neutral default if no location
  if (customerLat != null && customerLng != null && (provider as any).lat != null && (provider as any).lng != null) {
    const dist = haversineKm(customerLat, customerLng, (provider as any).lat, (provider as any).lng)
    distScore = Math.max(0, 1 - dist / 50) // linear falloff over 50km
  }

  return (ratingScore * 0.30)
    + (speedScore * 0.25)
    + (completionScore * 0.20)
    + (availScore * 0.15)
    + (distScore * 0.10)
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
```

**Step 2: Update the query to include lat/lng**

In the `fetchProviders` function, update the main query (line 62-67) to include lat/lng:

```typescript
let q = supabase
  .from('profiles')
  .select('id, full_name, avatar_url, city, lat, lng, provider_details(business_name, is_available, avg_rating, review_count, completion_count, response_time_mins, badge_level, is_verified)')
  .eq('role', 'provider')
  .not('provider_details', 'is', null)
  .limit(48)
```

**Step 3: Apply ranking as the default sort**

In the filter logic section (after line 133 `let filtered = enriched.filter(p => p.provider_details)`), add the ranking before applying filters:

```typescript
// Apply smart ranking as default sort
filtered.forEach(p => {
  (p as any)._rankScore = calculateRankScore(p as RankedResult, null, null)
})
filtered.sort((a, b) => ((b as any)._rankScore ?? 0) - ((a as any)._rankScore ?? 0))
```

The existing filter logic stays the same — filters narrow the already-ranked results, and specific sorts (like `rating`, `price`, `fastest`) override the default ranking.

**Step 4: Pass rank position to ProviderResultCard**

In the `renderItem`, add an `isTopMatch` prop for the first result:

```tsx
renderItem={({ item, index }) => (
  <ProviderResultCard
    id={item.id}
    full_name={item.full_name}
    avatar_url={item.avatar_url}
    city={item.city}
    business_name={item.provider_details?.business_name ?? null}
    avg_rating={item.provider_details?.avg_rating ?? 0}
    review_count={item.provider_details?.review_count ?? 0}
    is_available={item.provider_details?.is_available ?? false}
    primary_category={item.primary_category}
    min_price={item.min_price}
    completion_count={item.provider_details?.completion_count ?? 0}
    response_time_mins={item.provider_details?.response_time_mins ?? null}
    badge_level={item.provider_details?.badge_level as any ?? 'new'}
    credential_badges={item.credential_badges}
    is_verified={item.provider_details?.is_verified ?? false}
    isTopMatch={index === 0 && !filter}
  />
)}
```

Note the change from `({ item })` to `({ item, index })`.

**Step 5: Commit**

```bash
git add handby-mobile/app/\(customer\)/search.tsx
git commit -m "feat: smart search ranking with composite score algorithm"
```

---

### Task 6: ProviderResultCard — Best Match Badge

**Files:**
- Modify: `handby-mobile/components/search/ProviderResultCard.tsx`

**Context:** Add an optional `isTopMatch` prop that shows a "Best Match" badge on the card.

**Step 1: Add `isTopMatch` to Props**

In the `Props` interface (around line 7-22), add:

```typescript
isTopMatch?: boolean
```

**Step 2: Add the badge in the JSX**

After the opening `<TouchableOpacity style={styles.card} ...>` and before the `{/* Top row */}` comment (line 45-46), add:

```tsx
{/* Best Match badge */}
{props.isTopMatch && (
  <View style={styles.bestMatchBadge}>
    <Ionicons name="ribbon" size={12} color="#D97706" />
    <Text style={styles.bestMatchText}>Best Match</Text>
  </View>
)}
```

**Step 3: Add styles**

Add to `StyleSheet.create({})`:

```typescript
bestMatchBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  backgroundColor: '#FEF3C7',
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 4,
  alignSelf: 'flex-start',
  marginBottom: 8,
},
bestMatchText: {
  fontSize: 11,
  fontWeight: '700',
  color: '#D97706',
},
```

**Step 4: Commit**

```bash
git add handby-mobile/components/search/ProviderResultCard.tsx
git commit -m "feat: Best Match badge on top search result"
```

---

### Task 7: Provider Earnings Dashboard — New Screen

**Files:**
- Create: `handby-mobile/app/(provider)/earnings.tsx`

**Step 1: Create the earnings screen**

```typescript
import { useEffect, useState, useCallback } from 'react'
import { ScrollView, View, Text, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { colors, radius, shadow } from '../../lib/theme'

interface CompletedJob {
  id: string
  quoted_price: number | null
  completed_at: string
  profiles: { full_name: string } | null
  services: { title: string } | null
}

function getWeekStart(weeksAgo: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - d.getDay() - weeksAgo * 7)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function EarningsScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [monthEarnings, setMonthEarnings] = useState(0)
  const [monthJobs, setMonthJobs] = useState(0)
  const [responseRate, setResponseRate] = useState(0)
  const [weeklyData, setWeeklyData] = useState<number[]>([0, 0, 0, 0])
  const [recentJobs, setRecentJobs] = useState<CompletedJob[]>([])

  const fetchEarnings = useCallback(async () => {
    if (!user) return

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [completedRes, allRequestsRes, recentRes] = await Promise.all([
      // Completed jobs this month with price
      supabase
        .from('quote_requests')
        .select('id, quoted_price, completed_at')
        .eq('provider_id', user.id)
        .eq('status', 'completed')
        .gte('completed_at', monthStart),
      // All requests for response rate
      supabase
        .from('quote_requests')
        .select('id, status')
        .eq('provider_id', user.id),
      // Recent completed jobs
      supabase
        .from('quote_requests')
        .select('id, quoted_price, completed_at, profiles!quote_requests_customer_id_fkey(full_name), services(title)')
        .eq('provider_id', user.id)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10),
    ])

    // Monthly stats
    const completedJobs = completedRes.data ?? []
    const total = completedJobs.reduce((sum, j) => sum + (j.quoted_price ?? 0), 0)
    setMonthEarnings(total)
    setMonthJobs(completedJobs.length)

    // Response rate
    const allReqs = allRequestsRes.data ?? []
    const responded = allReqs.filter(r => ['accepted', 'declined', 'confirmed', 'en_route', 'in_progress', 'completed'].includes(r.status)).length
    const totalReqs = allReqs.length
    setResponseRate(totalReqs > 0 ? Math.round((responded / totalReqs) * 100) : 0)

    // Weekly breakdown (last 4 weeks)
    const weeks = [0, 0, 0, 0]
    const fourWeeksAgo = getWeekStart(3)

    // Fetch all completed jobs in last 4 weeks
    const { data: weeklyJobs } = await supabase
      .from('quote_requests')
      .select('quoted_price, completed_at')
      .eq('provider_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', fourWeeksAgo.toISOString())

    ;(weeklyJobs ?? []).forEach(j => {
      if (!j.completed_at) return
      const jobDate = new Date(j.completed_at)
      const diffDays = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24))
      const weekIdx = Math.min(3, Math.floor(diffDays / 7))
      weeks[3 - weekIdx] += j.quoted_price ?? 0
    })
    setWeeklyData(weeks)

    // Recent jobs
    setRecentJobs((recentRes.data as unknown as CompletedJob[]) ?? [])

    setLoading(false)
    setRefreshing(false)
  }, [user])

  useEffect(() => { fetchEarnings() }, [fetchEarnings])

  const onRefresh = () => { setRefreshing(true); fetchEarnings() }
  const maxWeekly = Math.max(...weeklyData, 1)

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text style={styles.title}>Earnings</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={22} color={colors.success} />
            <Text style={styles.statValue}>£{monthEarnings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-done-circle-outline" size={22} color={colors.primary} />
            <Text style={styles.statValue}>{monthJobs}</Text>
            <Text style={styles.statLabel}>Jobs</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="speedometer-outline" size={22} color={colors.warning} />
            <Text style={styles.statValue}>{responseRate}%</Text>
            <Text style={styles.statLabel}>Response</Text>
          </View>
        </View>

        {/* Weekly chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Earnings</Text>
          <View style={styles.chartBars}>
            {weeklyData.map((val, i) => (
              <View key={i} style={styles.barCol}>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { height: `${(val / maxWeekly) * 100}%` }]} />
                </View>
                <Text style={styles.barLabel}>
                  {i === 3 ? 'This\nWeek' : `W${i + 1}`}
                </Text>
                {val > 0 && <Text style={styles.barValue}>£{val.toFixed(0)}</Text>}
              </View>
            ))}
          </View>
        </View>

        {/* Recent completed jobs */}
        <Text style={styles.sectionTitle}>Recent Jobs</Text>
        {recentJobs.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No completed jobs yet</Text>
          </View>
        ) : (
          recentJobs.map(job => (
            <TouchableOpacity key={job.id} style={styles.jobCard} onPress={() => router.push(`/chat/${job.id}`)}>
              <View style={styles.jobInfo}>
                <Text style={styles.jobName}>{(job.profiles as any)?.full_name ?? 'Customer'}</Text>
                <Text style={styles.jobService}>{(job.services as any)?.title ?? 'Service'}</Text>
                <Text style={styles.jobDate}>
                  {job.completed_at ? new Date(job.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}
                </Text>
              </View>
              {job.quoted_price != null && (
                <Text style={styles.jobPrice}>£{job.quoted_price.toFixed(2)}</Text>
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryBg },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textBody },
  chartCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20,
    marginHorizontal: 16, marginTop: 20,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  chartTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  chartBars: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 },
  barCol: { alignItems: 'center', flex: 1 },
  barTrack: { width: 32, height: 100, backgroundColor: colors.border, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: colors.primary, borderRadius: 6 },
  barLabel: { fontSize: 10, color: colors.textMuted, marginTop: 6, textAlign: 'center' },
  barValue: { fontSize: 10, fontWeight: '600', color: colors.primary, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: 16, marginTop: 24, marginBottom: 12 },
  jobCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.md, padding: 14,
    marginHorizontal: 16, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  jobInfo: { flex: 1 },
  jobName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  jobService: { fontSize: 13, color: colors.textBody, marginTop: 2 },
  jobDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  jobPrice: { fontSize: 16, fontWeight: '700', color: colors.success },
  empty: { alignItems: 'center', marginTop: 32, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
})
```

**Step 2: Commit**

```bash
git add handby-mobile/app/\(provider\)/earnings.tsx
git commit -m "feat: provider earnings dashboard with monthly stats, weekly chart, and recent jobs"
```

---

### Task 8: Provider Dashboard & Layout — Earnings Integration

**Files:**
- Modify: `handby-mobile/app/(provider)/index.tsx`
- Modify: `handby-mobile/app/(provider)/_layout.tsx`

**Step 1: Add Earnings to quick actions on the dashboard**

In `app/(provider)/index.tsx`, update the `quickActions` array (lines 123-128) to include Earnings:

```typescript
const quickActions: { icon: string; label: string; route: string }[] = [
  { icon: 'mail', label: 'Requests', route: '/(provider)/requests' },
  { icon: 'cash-outline', label: 'Earnings', route: '/(provider)/earnings' },
  { icon: 'construct', label: 'Services', route: '/(provider)/manage-services' },
  { icon: 'shield-checkmark', label: 'Credentials', route: '/(provider)/credentials' },
]
```

(We replace "Photos" with "Earnings" in the 2x2 grid since Photos is accessible from the tab bar. Providers can still access Photos via the tab bar.)

**Step 2: Register the earnings screen in the layout**

In `app/(provider)/_layout.tsx`, add the earnings screen as a hidden tab (accessible via navigation but not in the tab bar). After the `credentials` hidden screen (line 46), add:

```tsx
<Tabs.Screen name="earnings" options={{ href: null }} />
```

**Step 3: Commit**

```bash
git add handby-mobile/app/\(provider\)/index.tsx handby-mobile/app/\(provider\)/_layout.tsx
git commit -m "feat: earnings quick action on provider dashboard + layout registration"
```

---

### Task 9: Final Verification

**Step 1: Check all modified files compile**

```bash
cd handby-mobile && npx tsc --noEmit
```

Expected: no type errors.

**Step 2: Verify migration SQL is valid**

Read back `supabase/migrations/20260312_tier3_conversion_growth.sql` and verify:
- 4 columns added to quote_requests (urgency, preferred_date, preferred_time, quoted_price)
- 1 column added to quote_requests (rebooking_of with FK)
- No triggers, no functions, no new tables

**Step 3: Fix any issues and commit**

```bash
git add -A
git commit -m "feat: Tier 3 Conversion & Growth features complete"
```

---

## Post-Implementation: Run the Migration

The user needs to run `supabase/migrations/20260312_tier3_conversion_growth.sql` in the Supabase Dashboard SQL Editor. This is a manual step — remind the user when all tasks are done.

---

## Summary of All Changes

| Task | File | What Changes |
|------|------|-------------|
| 1 | `supabase/migrations/20260312_tier3_conversion_growth.sql` | New file: 5 columns on quote_requests |
| 2 | `app/provider/[id].tsx` | Structured quote form with service picker, urgency, time, rebook pre-fill |
| 3 | `app/(provider)/requests.tsx` | Accept-with-price modal, repeat customer badge, structured info display |
| 4 | `app/(customer)/bookings.tsx` | Quoted price display, "Book Again" button on completed jobs |
| 5 | `app/(customer)/search.tsx` | `rankProviders()` composite score, default smart sort, lat/lng in query |
| 6 | `components/search/ProviderResultCard.tsx` | "Best Match" badge prop and display |
| 7 | `app/(provider)/earnings.tsx` | New screen: monthly stats, weekly bar chart, recent jobs list |
| 8 | `app/(provider)/index.tsx` + `_layout.tsx` | Earnings quick action + layout registration |
| 9 | All files | TypeScript compilation check |
