# Provider Dashboard Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix broken review/rating/pending data pipeline and redesign the provider dashboard as a live-updating command center with stats grid, quick actions, richer request cards, and an improved reviews screen.

**Architecture:** New Supabase migration to backfill + apply triggers. Dashboard rewritten with real-time subscriptions to `quote_requests` and `provider_details`. Reviews screen gains a rating summary header and real-time subscription to `reviews`.

**Tech Stack:** React Native, Expo Router, Supabase (postgres_changes real-time), TypeScript, design tokens from `lib/theme.ts`

---

### Task 1: Create Backfill Migration

**Files:**
- Create: `supabase/migrations/20260312_backfill_review_stats.sql`

**Step 1: Write the migration SQL**

```sql
-- Migration: Backfill provider_details and re-apply review triggers
-- Date: 2026-03-12
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- Re-apply trigger functions (idempotent with CREATE OR REPLACE)
-- ============================================================
CREATE OR REPLACE FUNCTION update_provider_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE provider_details
  SET
    avg_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    )
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_review_stats ON reviews;
CREATE TRIGGER trg_update_review_stats
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_review_stats();

CREATE OR REPLACE FUNCTION update_provider_review_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE provider_details
  SET
    avg_rating = COALESCE(
      (SELECT ROUND(AVG(rating)::numeric, 2) FROM reviews WHERE provider_id = OLD.provider_id),
      0
    ),
    review_count = (
      SELECT COUNT(*) FROM reviews WHERE provider_id = OLD.provider_id
    )
  WHERE id = OLD.provider_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_review_stats_delete ON reviews;
CREATE TRIGGER trg_update_review_stats_delete
  AFTER DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_review_stats_on_delete();

-- ============================================================
-- One-time backfill: update all provider_details from actual reviews
-- ============================================================
UPDATE provider_details pd
SET
  avg_rating = COALESCE(stats.avg_r, 0),
  review_count = COALESCE(stats.cnt, 0)
FROM (
  SELECT
    provider_id,
    ROUND(AVG(rating)::numeric, 2) AS avg_r,
    COUNT(*) AS cnt
  FROM reviews
  GROUP BY provider_id
) stats
WHERE pd.id = stats.provider_id;
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260312_backfill_review_stats.sql
git commit -m "feat: add backfill migration for provider review stats"
```

> **User action required:** Run this SQL in Supabase Dashboard > SQL Editor to apply triggers and backfill existing data.

---

### Task 2: Update OnboardingChecklist with Auto-Hide

**Files:**
- Modify: `handby-mobile/components/provider/OnboardingChecklist.tsx`

**Step 1: Add early return when all items are complete**

At the top of the `OnboardingChecklist` component, after `const completed = items.filter(i => i.done).length`, add:

```typescript
if (completed === items.length) return null
```

That's the only change needed. The parent already renders `<OnboardingChecklist items={checklistItems} />` unconditionally — returning `null` hides it.

**Step 2: Verify the component renders nothing when all done**

Mentally verify: if all 5 items have `done: true`, `completed === items.length` is `true`, function returns `null`, no UI rendered. If any item is `false`, the checklist renders normally.

**Step 3: Commit**

```bash
git add handby-mobile/components/provider/OnboardingChecklist.tsx
git commit -m "feat: auto-hide onboarding checklist when all items complete"
```

---

### Task 3: Rewrite Provider Dashboard — Data Layer

**Files:**
- Modify: `handby-mobile/app/(provider)/index.tsx`

**Step 1: Replace the entire file with the new dashboard**

This is a full rewrite. The new dashboard has:
- 4-stat 2x2 grid (Pending, Rating, Reviews, Jobs Completed) — each tappable
- Quick actions 2x2 grid
- Real-time subscriptions to `quote_requests` and `provider_details`
- Pull-to-refresh via RefreshControl
- Richer request cards with status dot pills, service name, relative time
- "See all" link to requests tab

```typescript
import { useEffect, useState, useCallback } from 'react'
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { OnboardingChecklist } from '../../components/provider/OnboardingChecklist'
import { Avatar } from '../../components/ui/Avatar'
import { colors, radius, shadow } from '../../lib/theme'

interface Request {
  id: string
  message: string
  status: string
  created_at: string
  profiles: { full_name: string; avatar_url: string | null }
  services: { title: string } | null
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  pending:     { bg: '#FEF3C7', text: '#D97706', label: 'Pending' },
  accepted:    { bg: '#DCFCE7', text: '#16A34A', label: 'Accepted' },
  confirmed:   { bg: '#DBEAFE', text: '#1E40AF', label: 'Confirmed' },
  en_route:    { bg: '#E0E7FF', text: '#4F46E5', label: 'En Route' },
  in_progress: { bg: '#FEF3C7', text: '#D97706', label: 'In Progress' },
  completed:   { bg: '#DCFCE7', text: '#16A34A', label: 'Completed' },
  declined:    { bg: '#FEE2E2', text: '#DC2626', label: 'Declined' },
  cancelled:   { bg: '#E0E7FF', text: '#475569', label: 'Cancelled' },
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function ProviderDashboard() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [requests, setRequests] = useState<Request[]>([])
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [serviceCount, setServiceCount] = useState(0)
  const [portfolioCount, setPortfolioCount] = useState(0)

  const fetchAll = useCallback(async () => {
    if (!user) return

    const [detailsRes, requestsRes, servicesRes, portfolioRes] = await Promise.all([
      supabase.from('provider_details').select('*').eq('id', user.id).single(),
      supabase
        .from('quote_requests')
        .select('id, message, status, created_at, profiles!quote_requests_customer_id_fkey(full_name, avatar_url), services(title)')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('services').select('id', { count: 'exact', head: true })
        .eq('provider_id', user.id).eq('is_active', true),
      supabase.from('portfolio_items').select('id', { count: 'exact', head: true })
        .eq('provider_id', user.id),
    ])

    setDetails(detailsRes.data)
    setRequests((requestsRes.data as unknown as Request[]) ?? [])
    setServiceCount(servicesRes.count ?? 0)
    setPortfolioCount(portfolioRes.count ?? 0)
    setLoading(false)
    setRefreshing(false)
  }, [user])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Real-time: quote_requests changes
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('dashboard-requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'quote_requests',
        filter: `provider_id=eq.${user.id}`,
      }, () => { fetchAll() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchAll])

  // Real-time: provider_details changes (trigger updates rating/review_count)
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('dashboard-details')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'provider_details',
        filter: `id=eq.${user.id}`,
      }, () => { fetchAll() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchAll])

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const checklistItems = [
    { label: 'Add a profile photo', done: !!profile?.avatar_url },
    { label: 'Set your business name', done: !!details?.business_name },
    { label: 'Add your first service', done: serviceCount > 0 },
    { label: 'Upload portfolio photos', done: portfolioCount > 0 },
    { label: 'Get your first review', done: (details?.review_count ?? 0) > 0 },
  ]

  const onRefresh = () => { setRefreshing(true); fetchAll() }

  const quickActions: { icon: string; label: string; route: string }[] = [
    { icon: 'mail', label: 'Requests', route: '/(provider)/requests' },
    { icon: 'construct', label: 'Services', route: '/(provider)/manage-services' },
    { icon: 'images', label: 'Photos', route: '/(provider)/photos' },
    { icon: 'shield-checkmark', label: 'Credentials', route: '/(provider)/credentials' },
  ]

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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Avatar uri={profile?.avatar_url ?? null} name={profile?.full_name ?? '?'} size={44} />
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{profile?.full_name?.split(' ')[0]}</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Stats 2x2 Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={[styles.statCard, pendingCount > 0 && styles.statCardAlert]} onPress={() => router.push('/(provider)/requests')}>
            <Ionicons name="time-outline" size={22} color={pendingCount > 0 ? colors.cta : colors.primary} />
            <Text style={[styles.statNum, pendingCount > 0 && { color: colors.cta }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(provider)/reviews')}>
            <Ionicons name="star" size={22} color={colors.star} />
            <Text style={styles.statNum}>{details?.avg_rating?.toFixed(1) ?? '0.0'}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/(provider)/reviews')}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
            <Text style={styles.statNum}>{details?.review_count ?? 0}</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </TouchableOpacity>

          <View style={styles.statCard}>
            <Ionicons name="checkmark-done-circle-outline" size={22} color={colors.success} />
            <Text style={styles.statNum}>{details?.completion_count ?? 0}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
        </View>

        {/* Onboarding Checklist (auto-hides when complete) */}
        <OnboardingChecklist items={checklistItems} />

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map(action => (
            <TouchableOpacity key={action.label} style={styles.actionCard} onPress={() => router.push(action.route as any)}>
              <Ionicons name={action.icon as any} size={24} color={colors.primary} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Requests */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Requests</Text>
          <TouchableOpacity onPress={() => router.push('/(provider)/requests')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {requests.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="mail-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>No requests yet</Text>
          </View>
        ) : (
          requests.slice(0, 5).map(req => {
            const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending
            return (
              <TouchableOpacity key={req.id} style={styles.reqCard} onPress={() => router.push(`/chat/${req.id}`)}>
                <Avatar uri={req.profiles?.avatar_url ?? null} name={req.profiles?.full_name ?? '?'} size={42} />
                <View style={styles.reqInfo}>
                  <Text style={styles.reqName}>{req.profiles?.full_name}</Text>
                  <Text style={styles.reqService} numberOfLines={1}>{req.services?.title ?? 'General enquiry'}</Text>
                </View>
                <View style={styles.reqRight}>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <View style={[styles.statusDot, { backgroundColor: cfg.text }]} />
                    <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                  </View>
                  <Text style={styles.reqTime}>{timeAgo(req.created_at)}</Text>
                </View>
              </TouchableOpacity>
            )
          })
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryBg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 14, color: colors.textBody },
  name: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16, marginTop: 20,
  },
  statCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  statCardAlert: {
    borderColor: colors.cta, borderWidth: 1.5,
  },
  statNum: { fontSize: 26, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textBody },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingRight: 16, marginBottom: 12,
  },
  seeAll: { fontSize: 14, fontWeight: '600', color: colors.primaryLight },
  actionsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
    paddingHorizontal: 16, marginTop: 12,
  },
  actionCard: {
    width: '47%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  actionLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  reqCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14,
    marginHorizontal: 16, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  reqInfo: { flex: 1 },
  reqName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  reqService: { fontSize: 13, color: colors.textBody, marginTop: 2 },
  reqRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  reqTime: { fontSize: 11, color: colors.textMuted },
  empty: { alignItems: 'center', marginTop: 32, gap: 8 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
})
```

**Step 2: Commit**

```bash
git add handby-mobile/app/(provider)/index.tsx
git commit -m "feat: redesign provider dashboard with stats grid, quick actions, and real-time"
```

---

### Task 4: Update Reviews Screen — Rating Summary Header + Real-Time

**Files:**
- Modify: `handby-mobile/app/(provider)/reviews.tsx`

**Step 1: Replace entire file with updated reviews screen**

Adds:
- Rating summary card at top (big number, stars, review count, 5→1 breakdown bars)
- Real-time subscription to `reviews` table
- Existing pull-to-refresh preserved

```typescript
import { useEffect, useState, useCallback } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { colors, radius, shadow } from '../../lib/theme'

interface ReviewItem {
  id: string
  rating: number
  body: string | null
  created_at: string
  profiles: { full_name: string; avatar_url: string | null }
}

function RatingSummary({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) return null

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  const counts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }))

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTop}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryAvg}>{avg.toFixed(1)}</Text>
          <View style={styles.summaryStars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons key={i} name={i < Math.round(avg) ? 'star' : 'star-outline'} size={18} color={colors.star} />
            ))}
          </View>
          <Text style={styles.summaryCount}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.summaryBars}>
          {counts.map(({ star, count }) => (
            <View key={star} style={styles.barRow}>
              <Text style={styles.barLabel}>{star}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(count / reviews.length) * 100}%` }]} />
              </View>
              <Text style={styles.barCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

export default function ReviewsScreen() {
  const { user } = useAuth()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchReviews = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, body, created_at, profiles!reviews_reviewer_id_fkey(full_name, avatar_url)')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })

    setReviews((data as unknown as ReviewItem[]) ?? [])
    setLoading(false)
    setRefreshing(false)
  }, [user])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  // Real-time: new reviews appear instantly
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('reviews-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reviews',
        filter: `provider_id=eq.${user.id}`,
      }, () => { fetchReviews() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchReviews])

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Reviews</Text>
      <FlatList
        data={reviews}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReviews() }} tintColor={colors.primary} />}
        ListHeaderComponent={<RatingSummary reviews={reviews} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Avatar uri={item.profiles?.avatar_url ?? null} name={item.profiles?.full_name ?? '?'} size={40} />
              <View style={styles.headerInfo}>
                <Text style={styles.reviewer}>{item.profiles?.full_name}</Text>
                <View style={styles.stars}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons key={i} name={i < item.rating ? 'star' : 'star-outline'} size={16} color={colors.star} />
                  ))}
                </View>
              </View>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('en-GB')}</Text>
            </View>
            {item.body && <Text style={styles.body}>{item.body}</Text>}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>No reviews yet</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.primaryBg },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  list: { paddingBottom: 32 },
  summaryCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20,
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  summaryTop: { flexDirection: 'row', gap: 20 },
  summaryLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  summaryAvg: { fontSize: 36, fontWeight: '700', color: colors.textPrimary },
  summaryStars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  summaryCount: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  summaryBars: { flex: 1, gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { fontSize: 12, color: colors.textBody, width: 12, textAlign: 'right' },
  barTrack: { flex: 1, height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, backgroundColor: colors.star, borderRadius: 4 },
  barCount: { fontSize: 12, color: colors.textMuted, width: 20 },
  card: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16,
    marginHorizontal: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
    ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerInfo: { flex: 1 },
  reviewer: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  stars: { flexDirection: 'row', gap: 2, marginTop: 4 },
  date: { fontSize: 12, color: colors.textMuted },
  body: { fontSize: 14, color: '#4B5563', marginTop: 12, lineHeight: 20 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyText: { fontSize: 16, color: colors.textMuted },
})
```

**Step 2: Commit**

```bash
git add handby-mobile/app/(provider)/reviews.tsx
git commit -m "feat: add rating summary header and real-time updates to reviews screen"
```

---

### Task 5: Smoke Test & Final Commit

**Step 1: Run TypeScript check**

```bash
cd handby-mobile && npx tsc --noEmit
```

Expected: no errors (or only pre-existing ones unrelated to our changes).

**Step 2: Test on device/simulator**

Manual checks:
- [ ] Dashboard loads with 4-stat grid, quick actions, recent requests
- [ ] Pull-to-refresh works on dashboard
- [ ] Pending count has orange border when > 0
- [ ] Tapping stats navigates to correct screens
- [ ] Quick actions navigate correctly
- [ ] Request cards show status dot pill + relative time
- [ ] "See all" navigates to requests tab
- [ ] Onboarding checklist hides when all 5 items are complete
- [ ] Reviews screen shows rating summary header with breakdown bars
- [ ] New review appears in real-time (test by inserting via Supabase Dashboard)
- [ ] Dashboard stats update in real-time when a new review or request comes in

**Step 3: Fix any TypeScript errors and commit**

```bash
git add -A
git commit -m "fix: resolve any TypeScript issues from dashboard redesign"
```

Only run this step if Step 1 found errors.
