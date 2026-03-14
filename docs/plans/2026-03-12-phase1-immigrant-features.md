# Phase 1 Immigrant Market Features — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the 4 pre-launch features from the immigrant market strategy — RTW verification, photo/video quote requests, insurance badge enhancement, and provider language field.

**Architecture:** Each feature adds a Supabase migration (ALTER TABLE or CREATE TABLE) + React Native UI changes. All follow existing patterns: `supabase.from().select/insert/update`, expo-image-picker for media, theme tokens from `lib/theme.ts`, and credentials-style badge display.

**Tech Stack:** Supabase (Postgres), React Native + Expo, TypeScript, expo-image-picker, Supabase Storage

---

## Feature 1: Provider Language Field

*Simplest feature — warm-up. Adds a language selector to provider profiles so customers know what languages the provider speaks.*

### Task 1: Migration — add language columns to profiles

**Files:**
- Create: `supabase/migrations/20260312_provider_language.sql`

**Step 1: Write the migration**

```sql
-- 2026-03-12: Add language fields to profiles for multilingual support
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260312_provider_language.sql
git commit -m "feat: migration — add languages array to profiles"
```

---

### Task 2: Update types and auth context

**Files:**
- Modify: `handby-mobile/lib/types.ts`
- Modify: `handby-mobile/lib/auth-context.tsx`

**Step 1: Add `languages` to the Profile interface in `types.ts`**

In `types.ts`, add after the `lng` field (around line 16):

```typescript
  languages: string[]
```

**Step 2: Update auth context Profile interface**

In `auth-context.tsx`, add `languages` to the Profile interface:

```typescript
  languages: string[]
```

**Step 3: Commit**

```bash
git add handby-mobile/lib/types.ts handby-mobile/lib/auth-context.tsx
git commit -m "feat: add languages field to Profile type and auth context"
```

---

### Task 3: Language picker on provider edit-profile screen

**Files:**
- Modify: `handby-mobile/app/(provider)/edit-profile.tsx`

**Step 1: Add language state and the LANGUAGES constant**

Add after the existing imports at the top of the file:

```typescript
const LANGUAGES = [
  'English', 'Polish', 'Romanian', 'Urdu', 'Bengali', 'Gujarati',
  'Punjabi', 'Arabic', 'Somali', 'French', 'Portuguese', 'Spanish',
  'Turkish', 'Italian', 'Yoruba', 'Igbo', 'Twi', 'Swahili',
  'Hindi', 'Tamil', 'Mandarin', 'Cantonese', 'Tagalog', 'Lithuanian',
  'Bulgarian', 'Russian', 'Ukrainian', 'Farsi', 'Pashto', 'Tigrinya',
] as const
```

Add state after existing state declarations (around line 27):

```typescript
const [languages, setLanguages] = useState<string[]>([])
```

**Step 2: Load languages from DB**

In the existing `useEffect` that fetches profile data, the profile data already comes from `profiles` table. Add after the existing `supabase.from('provider_details')` useEffect:

```typescript
useEffect(() => {
  if (profile) {
    setLanguages((profile as any).languages ?? [])
  }
}, [profile])
```

**Step 3: Add toggle function**

```typescript
function toggleLanguage(lang: string) {
  setLanguages(prev =>
    prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
  )
}
```

**Step 4: Add languages to handleSave**

In the `handleSave` function, add `languages` to the profiles update object:

```typescript
const { error: profileError } = await supabase.from('profiles').update({
  full_name: fullName.trim(),
  phone: phone.trim() || null,
  city: city.trim() || null,
  postcode: postcode.trim() || null,
  bio: bio.trim() || null,
  languages,   // <-- ADD THIS
}).eq('id', user!.id)
```

**Step 5: Add language picker UI**

After the "Business Details" form section (after the `Switch` for availability, before the Save button), add:

```tsx
<Text style={styles.sectionTitle}>Languages Spoken</Text>
<View style={styles.languageGrid}>
  {LANGUAGES.map(lang => (
    <TouchableOpacity
      key={lang}
      style={[styles.langChip, languages.includes(lang) && styles.langChipActive]}
      onPress={() => toggleLanguage(lang)}
    >
      <Text style={[styles.langChipText, languages.includes(lang) && styles.langChipTextActive]}>
        {lang}
      </Text>
    </TouchableOpacity>
  ))}
</View>
```

**Step 6: Add styles**

Add to the `StyleSheet.create` object:

```typescript
languageGrid: {
  flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 24,
},
langChip: {
  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF',
},
langChipActive: {
  backgroundColor: '#1E40AF', borderColor: '#1E40AF',
},
langChipText: {
  fontSize: 13, fontWeight: '500', color: '#475569',
},
langChipTextActive: {
  color: '#FFFFFF',
},
```

**Step 7: Commit**

```bash
git add handby-mobile/app/(provider)/edit-profile.tsx
git commit -m "feat: language picker on provider edit-profile screen"
```

---

### Task 4: Display languages on provider public profile

**Files:**
- Modify: `handby-mobile/app/provider/[id].tsx`

**Step 1: Extract languages from provider data**

The `provider` object already comes from `profiles` table. After the existing `const isVerified = ...` line, add:

```typescript
const languages: string[] = provider.languages ?? []
```

Note: the provider select query needs to include `languages`. Find the `.select(...)` call that fetches the provider and add `languages` to it.

**Step 2: Display languages after the bio**

After the bio display (`{provider.bio && <Text style={styles.bio}>{provider.bio}</Text>}`), add:

```tsx
{languages.length > 0 && (
  <View style={styles.languagesRow}>
    <Ionicons name="language-outline" size={16} color="#475569" />
    <Text style={styles.languagesText}>{languages.join(' · ')}</Text>
  </View>
)}
```

**Step 3: Add styles**

```typescript
languagesRow: {
  flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
},
languagesText: {
  fontSize: 13, color: '#475569', flex: 1,
},
```

**Step 4: Commit**

```bash
git add handby-mobile/app/provider/[id].tsx
git commit -m "feat: display provider languages on public profile"
```

---

## Feature 2: Photo/Video Quote Requests

*Lets customers attach photos when requesting a quote — bypasses language barriers by making problems visual.*

### Task 5: Migration — add images column to quote_requests

**Files:**
- Create: `supabase/migrations/20260312_quote_request_images.sql`

**Step 1: Write the migration**

```sql
-- 2026-03-12: Add images array to quote_requests for photo/video quote requests
ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260312_quote_request_images.sql
git commit -m "feat: migration — add images array to quote_requests"
```

---

### Task 6: Image picker and upload in quote request form

**Files:**
- Modify: `handby-mobile/app/provider/[id].tsx`

**Step 1: Add image picker import and state**

Add to imports (if not already present):

```typescript
import * as ImagePicker from 'expo-image-picker'
import { Image } from 'react-native'
```

Add state after existing state (around line 49):

```typescript
const [quoteImages, setQuoteImages] = useState<string[]>([])
const [uploadingImage, setUploadingImage] = useState(false)
```

**Step 2: Add image pick + upload function**

Add after the existing `sendQuote` function:

```typescript
async function pickQuoteImage() {
  if (quoteImages.length >= 5) {
    const msg = 'Maximum 5 photos per request'
    if (Platform.OS === 'web') window.alert(msg)
    else Alert.alert('Limit', msg)
    return
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.7,
    allowsMultipleSelection: true,
    selectionLimit: 5 - quoteImages.length,
  })
  if (result.canceled || !result.assets.length) return

  setUploadingImage(true)
  const newUrls: string[] = []

  for (const asset of result.assets) {
    const ext = asset.uri.split('.').pop() ?? 'jpg'
    const fileName = `${user!.id}/quotes/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`

    const response = await fetch(asset.uri)
    const blob = await response.blob()

    const { error: uploadError } = await supabase.storage
      .from('portfolio')
      .upload(fileName, blob, { contentType: `image/${ext}` })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('portfolio').getPublicUrl(fileName)
      newUrls.push(publicUrl)
    }
  }

  setQuoteImages(prev => [...prev, ...newUrls].slice(0, 5))
  setUploadingImage(false)
}

function removeQuoteImage(url: string) {
  setQuoteImages(prev => prev.filter(u => u !== url))
}
```

**Step 3: Pass images in sendQuote**

In the existing `sendQuote` function, add `images` to the insert object:

```typescript
const { error } = await supabase.from('quote_requests').insert({
  customer_id: user.id,
  provider_id: id,
  service_id: selectedService?.id ?? services[0]?.id ?? null,
  message: message.trim(),
  status: 'pending',
  urgency,
  preferred_time: preferredTime,
  rebooking_of: rebook === 'true' && originalRequestId ? originalRequestId : null,
  images: quoteImages,   // <-- ADD THIS
})
```

Also reset images on success — add inside the success branch:

```typescript
setQuoteImages([])
```

**Step 4: Add image picker UI to quote form**

After the `TextInput` for the job description and before the "Preferred time" label, add:

```tsx
{/* Photo attachments */}
<Text style={styles.fieldLabel}>Photos (optional)</Text>
<Text style={styles.fieldHint}>Add photos to help describe the job</Text>
<View style={styles.imageRow}>
  {quoteImages.map((url, i) => (
    <View key={i} style={styles.imageThumb}>
      <Image source={{ uri: url }} style={styles.imageThumbImg} />
      <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => removeQuoteImage(url)}>
        <Ionicons name="close-circle" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  ))}
  {quoteImages.length < 5 && (
    <TouchableOpacity style={styles.imageAddBtn} onPress={pickQuoteImage} disabled={uploadingImage}>
      {uploadingImage ? (
        <ActivityIndicator size="small" color="#1E40AF" />
      ) : (
        <Ionicons name="camera-outline" size={28} color="#1E40AF" />
      )}
      <Text style={styles.imageAddText}>Add</Text>
    </TouchableOpacity>
  )}
</View>
```

Add `ActivityIndicator` to the import from `react-native` if not already there.

**Step 5: Add styles**

```typescript
fieldHint: {
  fontSize: 12, color: '#94A3B8', marginHorizontal: 16, marginBottom: 8, marginTop: -4,
},
imageRow: {
  flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 16,
},
imageThumb: {
  width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative',
},
imageThumbImg: {
  width: '100%', height: '100%',
},
imageRemoveBtn: {
  position: 'absolute', top: -4, right: -4, backgroundColor: '#FFFFFF', borderRadius: 10,
},
imageAddBtn: {
  width: 72, height: 72, borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E7FF',
  borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC',
},
imageAddText: {
  fontSize: 11, color: '#1E40AF', fontWeight: '500', marginTop: 2,
},
```

**Step 6: Commit**

```bash
git add handby-mobile/app/provider/[id].tsx
git commit -m "feat: photo attachments on quote request form"
```

---

### Task 7: Display quote images in provider request view

**Files:**
- Modify: `handby-mobile/app/(provider)/requests.tsx`

**Step 1: Add images to the select query**

Find the Supabase query that fetches quote_requests and add `images` to the select string.

**Step 2: Display images in request cards**

After the message text in each request card, add:

```tsx
{item.images?.length > 0 && (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reqImages}>
    {item.images.map((url: string, i: number) => (
      <Image key={i} source={{ uri: url }} style={styles.reqImageThumb} />
    ))}
  </ScrollView>
)}
```

Add `Image, ScrollView` to imports from `react-native` if missing.

**Step 3: Add styles**

```typescript
reqImages: { marginTop: 8 },
reqImageThumb: { width: 60, height: 60, borderRadius: 8, marginRight: 6 },
```

**Step 4: Commit**

```bash
git add handby-mobile/app/(provider)/requests.tsx
git commit -m "feat: display quote request photos in provider inbox"
```

---

### Task 8: Display quote images in chat view

**Files:**
- Modify: `handby-mobile/app/chat/[requestId].tsx`

**Step 1: Add images to quote_request fetch**

Find where the chat screen fetches the quote_request and add `images` to the select.

**Step 2: Display images as a banner at the top of the chat**

In the chat header or as a `ListHeaderComponent`, add:

```tsx
{request?.images?.length > 0 && (
  <View style={styles.quoteImageBanner}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {request.images.map((url: string, i: number) => (
        <Image key={i} source={{ uri: url }} style={styles.quoteImageBannerImg} />
      ))}
    </ScrollView>
  </View>
)}
```

**Step 3: Add styles**

```typescript
quoteImageBanner: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F8FAFC' },
quoteImageBannerImg: { width: 80, height: 80, borderRadius: 10, marginRight: 8 },
```

**Step 4: Commit**

```bash
git add handby-mobile/app/chat/[requestId].tsx
git commit -m "feat: display quote request photos in chat view"
```

---

## Feature 3: Insurance Badge Enhancement

*Leverages the existing credentials system to prominently surface insurance status with richer display.*

### Task 9: Migration — add insurance-specific fields to credentials

**Files:**
- Create: `supabase/migrations/20260312_insurance_enhancement.sql`

**Step 1: Write the migration**

```sql
-- 2026-03-12: Add insurance-specific fields to credentials for richer insurance badges
ALTER TABLE credentials
  ADD COLUMN IF NOT EXISTS coverage_amount text,
  ADD COLUMN IF NOT EXISTS insurer_name text;
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260312_insurance_enhancement.sql
git commit -m "feat: migration — add coverage_amount and insurer_name to credentials"
```

---

### Task 10: Update credentials form for insurance-specific fields

**Files:**
- Modify: `handby-mobile/app/(provider)/credentials.tsx`

**Step 1: Add state for new fields**

In the add-credential modal state, add:

```typescript
const [coverageAmount, setCoverageAmount] = useState('')
const [insurerName, setInsurerName] = useState('')
```

**Step 2: Show insurance-specific fields conditionally**

In the add-credential modal, after the type selector pills and before the document upload, add (only visible when type === 'insurance'):

```tsx
{newType === 'insurance' && (
  <>
    <Input
      label="Insurance Provider"
      value={insurerName}
      onChangeText={setInsurerName}
      placeholder="e.g. Zego, Simply Business"
    />
    <Input
      label="Coverage Amount"
      value={coverageAmount}
      onChangeText={setCoverageAmount}
      placeholder="e.g. £1,000,000"
    />
  </>
)}
```

**Step 3: Include in insert**

Add to the credential insert object:

```typescript
coverage_amount: newType === 'insurance' ? (coverageAmount.trim() || null) : null,
insurer_name: newType === 'insurance' ? (insurerName.trim() || null) : null,
```

**Step 4: Reset on modal close**

Add to the reset function:

```typescript
setCoverageAmount('')
setInsurerName('')
```

**Step 5: Display enhanced insurance info in credential list**

In the credential card render, after the existing label/type display, add:

```tsx
{item.type === 'insurance' && item.insurer_name && (
  <Text style={styles.insurerText}>{item.insurer_name}</Text>
)}
{item.type === 'insurance' && item.coverage_amount && (
  <Text style={styles.coverageText}>Coverage: {item.coverage_amount}</Text>
)}
```

**Step 6: Add styles**

```typescript
insurerText: { fontSize: 12, color: '#475569', marginTop: 2 },
coverageText: { fontSize: 12, color: '#16A34A', fontWeight: '600', marginTop: 2 },
```

**Step 7: Commit**

```bash
git add handby-mobile/app/(provider)/credentials.tsx
git commit -m "feat: insurance-specific fields in credentials form"
```

---

### Task 11: Enhanced insurance badge on provider profile and search cards

**Files:**
- Modify: `handby-mobile/app/provider/[id].tsx`
- Modify: `handby-mobile/components/search/ProviderResultCard.tsx`

**Step 1: Fetch insurance credentials on provider profile**

The provider detail page already fetches credentials. Ensure the select includes `coverage_amount, insurer_name`. Find the credentials fetch query and add these fields.

After the existing credentials display, find where insurance credentials are rendered and enhance:

```tsx
{credentials.filter((c: any) => c.type === 'insurance' && c.verified).map((c: any) => (
  <View key={c.id} style={styles.insuranceBadge}>
    <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
    <View>
      <Text style={styles.insuranceBadgeTitle}>Insured{c.insurer_name ? ` — ${c.insurer_name}` : ''}</Text>
      {c.coverage_amount && (
        <Text style={styles.insuranceBadgeCoverage}>{c.coverage_amount} coverage</Text>
      )}
    </View>
  </View>
))}
```

**Step 2: Add styles to provider profile**

```typescript
insuranceBadge: {
  flexDirection: 'row', alignItems: 'center', gap: 8,
  backgroundColor: '#F0FDF4', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  marginTop: 8, borderWidth: 1, borderColor: '#DCFCE7',
},
insuranceBadgeTitle: {
  fontSize: 13, fontWeight: '600', color: '#16A34A',
},
insuranceBadgeCoverage: {
  fontSize: 11, color: '#475569', marginTop: 1,
},
```

**Step 3: On ProviderResultCard, add enhanced "Insured" badge display**

The search screen already passes `credential_badges` which includes "Insured" as a string. The `ProviderResultCard` already renders these in the `bottomRow`. No changes needed to the card itself — the "Insured" badge already appears. The enhancement is purely on the detail page.

**Step 4: Commit**

```bash
git add handby-mobile/app/provider/[id].tsx
git commit -m "feat: enhanced insurance badge on provider detail page"
```

---

## Feature 4: RTW Verification Flow

*The flagship compliance feature. Providers submit their Right to Work Share Code, staff verify it, and a "RTW Verified" badge appears on their profile.*

### Task 12: Migration — create rtw_checks table

**Files:**
- Create: `supabase/migrations/20260312_rtw_verification.sql`

**Step 1: Write the migration**

```sql
-- 2026-03-12: Right to Work verification for providers
CREATE TABLE IF NOT EXISTS rtw_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_code text NOT NULL,
  date_of_birth date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
  verified_at timestamptz,
  expires_at date,
  reviewer_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Only one active/pending check per provider
CREATE UNIQUE INDEX IF NOT EXISTS rtw_checks_provider_active
  ON rtw_checks (provider_id)
  WHERE status IN ('pending', 'verified');

ALTER TABLE rtw_checks ENABLE ROW LEVEL SECURITY;

-- Providers can view and insert their own RTW checks
CREATE POLICY "Providers manage own RTW"
  ON rtw_checks FOR ALL
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

-- Add rtw_verified flag to provider_details (auto-calculated)
ALTER TABLE provider_details
  ADD COLUMN IF NOT EXISTS rtw_verified boolean DEFAULT false;

-- Function to sync rtw_verified flag to provider_details
CREATE OR REPLACE FUNCTION sync_rtw_verified()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE provider_details
  SET rtw_verified = (NEW.status = 'verified' AND (NEW.expires_at IS NULL OR NEW.expires_at > CURRENT_DATE))
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_rtw_verified
  AFTER INSERT OR UPDATE ON rtw_checks
  FOR EACH ROW
  EXECUTE FUNCTION sync_rtw_verified();
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260312_rtw_verification.sql
git commit -m "feat: migration — rtw_checks table, RLS, and rtw_verified trigger"
```

---

### Task 13: Update TypeScript types

**Files:**
- Modify: `handby-mobile/lib/types.ts`

**Step 1: Add RtwCheck interface and update ProviderDetails**

Add after the existing `Favourite` interface:

```typescript
export type RtwStatus = 'pending' | 'verified' | 'rejected' | 'expired'

export interface RtwCheck {
  id: string
  provider_id: string
  share_code: string
  date_of_birth: string
  status: RtwStatus
  verified_at: string | null
  expires_at: string | null
  reviewer_notes: string | null
  created_at: string
}
```

Add `rtw_verified: boolean` to the `ProviderDetails` interface (after `is_verified`).

**Step 2: Commit**

```bash
git add handby-mobile/lib/types.ts
git commit -m "feat: add RtwCheck type and rtw_verified to ProviderDetails"
```

---

### Task 14: RTW submission screen for providers

**Files:**
- Create: `handby-mobile/app/(provider)/rtw-verification.tsx`

**Step 1: Create the RTW verification screen**

```typescript
import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity } from 'react-native'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { colors, radius, shadow } from '../../lib/theme'

type RtwStatus = 'pending' | 'verified' | 'rejected' | 'expired'

interface RtwCheck {
  id: string
  share_code: string
  status: RtwStatus
  verified_at: string | null
  expires_at: string | null
  reviewer_notes: string | null
  created_at: string
}

const STATUS_CONFIG: Record<RtwStatus, { bg: string; text: string; icon: string; label: string }> = {
  pending:  { bg: '#FEF3C7', text: '#D97706', icon: 'time-outline', label: 'Pending Review' },
  verified: { bg: '#DCFCE7', text: '#16A34A', icon: 'shield-checkmark', label: 'Verified' },
  rejected: { bg: '#FEE2E2', text: '#DC2626', icon: 'close-circle', label: 'Rejected' },
  expired:  { bg: '#F1F5F9', text: '#475569', icon: 'alert-circle', label: 'Expired' },
}

export default function RtwVerificationScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const [existing, setExisting] = useState<RtwCheck | null>(null)
  const [shareCode, setShareCode] = useState('')
  const [dob, setDob] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from('rtw_checks')
      .select('*')
      .eq('provider_id', user.id)
      .in('status', ['pending', 'verified'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setExisting(data as RtwCheck)
        setLoading(false)
      })
  }, [user])

  async function handleSubmit() {
    if (!shareCode.trim() || !dob.trim() || !user) return

    // Basic validation: share code is 9 chars alphanumeric
    const code = shareCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{9}$/.test(code)) {
      const msg = 'Share code must be 9 characters (letters and numbers)'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Invalid', msg)
      return
    }

    // Basic DOB validation
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dobRegex.test(dob.trim())) {
      const msg = 'Date of birth must be in YYYY-MM-DD format'
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Invalid', msg)
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('rtw_checks').insert({
      provider_id: user.id,
      share_code: code,
      date_of_birth: dob.trim(),
      status: 'pending',
    })
    setSubmitting(false)

    if (error) {
      const msg = error.message.includes('unique')
        ? 'You already have an active verification request.'
        : error.message
      if (Platform.OS === 'web') window.alert(msg)
      else Alert.alert('Error', msg)
      return
    }

    if (Platform.OS === 'web') window.alert('Submitted! We will verify your Right to Work status.')
    else Alert.alert('Submitted', 'We will verify your Right to Work status.')
    router.back()
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.textMuted }}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Right to Work</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            UK law requires platforms to verify your Right to Work. Submit your Home Office Share Code and we'll verify it within 24 hours. Your data is kept secure and confidential.
          </Text>
        </View>

        {existing ? (
          <View style={styles.statusCard}>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[existing.status].bg }]}>
              <Ionicons
                name={STATUS_CONFIG[existing.status].icon as any}
                size={20}
                color={STATUS_CONFIG[existing.status].text}
              />
              <Text style={[styles.statusLabel, { color: STATUS_CONFIG[existing.status].text }]}>
                {STATUS_CONFIG[existing.status].label}
              </Text>
            </View>

            <Text style={styles.statusDetail}>
              Share Code: {existing.share_code.slice(0, 3)}***{existing.share_code.slice(-2)}
            </Text>
            <Text style={styles.statusDetail}>
              Submitted: {new Date(existing.created_at).toLocaleDateString('en-GB')}
            </Text>
            {existing.verified_at && (
              <Text style={styles.statusDetail}>
                Verified: {new Date(existing.verified_at).toLocaleDateString('en-GB')}
              </Text>
            )}
            {existing.expires_at && (
              <Text style={styles.statusDetail}>
                Expires: {new Date(existing.expires_at).toLocaleDateString('en-GB')}
              </Text>
            )}
            {existing.reviewer_notes && (
              <Text style={styles.reviewerNote}>{existing.reviewer_notes}</Text>
            )}

            {(existing.status === 'rejected' || existing.status === 'expired') && (
              <Button
                title="Submit New Check"
                onPress={() => setExisting(null)}
                style={{ marginTop: 16 }}
              />
            )}
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>Submit Verification</Text>

            <Text style={styles.helpText}>
              Get your share code at gov.uk/prove-right-to-work
            </Text>

            <Input
              label="Share Code"
              value={shareCode}
              onChangeText={setShareCode}
              placeholder="e.g. W4K8E7J2P"
              autoCapitalize="characters"
              maxLength={9}
            />

            <Input
              label="Date of Birth"
              value={dob}
              onChangeText={setDob}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
            />

            <Button
              title="Submit for Verification"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!shareCode.trim() || !dob.trim()}
            />
          </View>
        )}

        {/* How it works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How it works</Text>
          {[
            { icon: 'document-text-outline', text: 'Enter your Home Office Share Code' },
            { icon: 'eye-outline', text: 'Our team verifies your status within 24 hours' },
            { icon: 'shield-checkmark-outline', text: 'A "RTW Verified" badge appears on your profile' },
            { icon: 'people-outline', text: 'Customers see you are legally verified to work in the UK' },
          ].map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepIcon}>
                <Ionicons name={step.icon as any} size={20} color={colors.primary} />
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryBg },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  infoCard: {
    flexDirection: 'row', gap: 10, backgroundColor: '#DBEAFE', borderRadius: radius.md,
    padding: 14, marginHorizontal: 16, marginBottom: 20,
  },
  infoText: { flex: 1, fontSize: 13, color: colors.primary, lineHeight: 18 },
  statusCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20,
    marginHorizontal: 16, borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, alignSelf: 'flex-start',
  },
  statusLabel: { fontSize: 14, fontWeight: '700' },
  statusDetail: { fontSize: 13, color: colors.textBody, marginTop: 8 },
  reviewerNote: {
    fontSize: 13, color: colors.error, marginTop: 8, fontStyle: 'italic',
  },
  form: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20,
    marginHorizontal: 16, borderWidth: 1, borderColor: colors.border, ...shadow.card, gap: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  helpText: { fontSize: 13, color: colors.textMuted, marginBottom: 8 },
  howItWorks: {
    marginHorizontal: 16, marginTop: 24, gap: 12,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE',
    alignItems: 'center', justifyContent: 'center',
  },
  stepText: { flex: 1, fontSize: 14, color: colors.textBody, lineHeight: 18 },
})
```

**Step 2: Commit**

```bash
git add handby-mobile/app/(provider)/rtw-verification.tsx
git commit -m "feat: RTW verification submission screen for providers"
```

---

### Task 15: Add RTW link to provider dashboard + checklist

**Files:**
- Modify: `handby-mobile/app/(provider)/index.tsx`

**Step 1: Add RTW quick action to the dashboard**

Find the `quickActions` array and add:

```typescript
{ icon: 'shield-checkmark', label: 'Right to Work', route: '/(provider)/rtw-verification' },
```

**Step 2: Add RTW to the onboarding checklist**

Find the `checklistItems` array and add:

```typescript
{ label: 'Verify your Right to Work', done: details?.rtw_verified === true },
```

**Step 3: Ensure the dashboard fetches rtw_verified**

The dashboard already fetches `provider_details` with `select('*')`, so `rtw_verified` will be included automatically after the migration runs.

**Step 4: Commit**

```bash
git add handby-mobile/app/(provider)/index.tsx
git commit -m "feat: add RTW verification to dashboard quick actions and checklist"
```

---

### Task 16: RTW badge on provider public profile and search cards

**Files:**
- Modify: `handby-mobile/app/provider/[id].tsx`
- Modify: `handby-mobile/components/search/ProviderResultCard.tsx`
- Modify: `handby-mobile/app/(customer)/search.tsx`

**Step 1: Show RTW badge on provider detail page**

After the existing "Verified" badge (the `isVerified` badge), add:

```tsx
{details?.rtw_verified && (
  <View style={styles.rtwBadge}>
    <Ionicons name="document-text" size={12} color="#16A34A" />
    <Text style={styles.rtwText}>RTW Verified</Text>
  </View>
)}
```

Add styles:

```typescript
rtwBadge: {
  flexDirection: 'row', alignItems: 'center', gap: 3,
  backgroundColor: '#F0FDF4', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
},
rtwText: {
  fontSize: 11, fontWeight: '700', color: '#16A34A',
},
```

**Step 2: Add rtw_verified to ProviderResultCard props**

Add `rtw_verified?: boolean` to the Props interface. Display after the existing verified icon:

```tsx
{props.rtw_verified && (
  <View style={styles.rtwMini}>
    <Ionicons name="document-text" size={10} color="#16A34A" />
    <Text style={styles.rtwMiniText}>RTW</Text>
  </View>
)}
```

Add styles:

```typescript
rtwMini: {
  flexDirection: 'row', alignItems: 'center', gap: 2,
  backgroundColor: '#F0FDF4', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2,
},
rtwMiniText: { fontSize: 9, fontWeight: '700', color: '#16A34A' },
```

**Step 3: Wire rtw_verified through search.tsx**

Add `rtw_verified` to the `Result` interface's `provider_details`. It's already in the select query since it selects all provider_details fields that match. Add the prop to the `ProviderResultCard` usage:

```typescript
rtw_verified={item.provider_details?.rtw_verified ?? false}
```

**Step 4: Commit**

```bash
git add handby-mobile/app/provider/[id].tsx handby-mobile/components/search/ProviderResultCard.tsx "handby-mobile/app/(customer)/search.tsx"
git commit -m "feat: RTW verified badge on provider profile and search cards"
```

---

## Summary

| Task | Feature | What it does |
|------|---------|-------------|
| 1 | Language | Migration: `languages` array on profiles |
| 2 | Language | TypeScript types update |
| 3 | Language | Language picker on edit-profile |
| 4 | Language | Display languages on public profile |
| 5 | Photos | Migration: `images` array on quote_requests |
| 6 | Photos | Image picker + upload on quote form |
| 7 | Photos | Display images in provider request inbox |
| 8 | Photos | Display images in chat view |
| 9 | Insurance | Migration: `coverage_amount`, `insurer_name` on credentials |
| 10 | Insurance | Insurance-specific form fields |
| 11 | Insurance | Enhanced insurance badge on detail page |
| 12 | RTW | Migration: `rtw_checks` table + trigger |
| 13 | RTW | TypeScript types |
| 14 | RTW | Provider RTW submission screen |
| 15 | RTW | Dashboard quick action + checklist |
| 16 | RTW | RTW badge on profile + search cards |

**Total: 16 tasks, 16 commits.**

**Migrations to run in Supabase Dashboard SQL Editor (in order):**
1. `20260312_provider_language.sql`
2. `20260312_quote_request_images.sql`
3. `20260312_insurance_enhancement.sql`
4. `20260312_rtw_verification.sql`
