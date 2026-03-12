import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Avatar } from '../ui/Avatar'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  id: string
  full_name: string
  avatar_url: string | null
  city: string | null
  business_name: string | null
  avg_rating: number
  review_count: number
  is_available: boolean
  primary_category: string | null
  min_price: number | null
  // New Tier 1 fields
  completion_count?: number
  response_time_mins?: number | null
  badge_level?: 'new' | 'rising' | 'top'
  credential_badges?: string[]   // e.g. ['Gas Safe', 'DBS Checked', 'Insured']
}

const BADGE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  top:    { bg: '#FEF3C7', text: '#D97706', label: 'Top Pro' },
  rising: { bg: '#DBEAFE', text: '#2563EB', label: 'Rising' },
  new:    { bg: '#E0E7FF', text: '#475569', label: 'New' },
}

function formatResponseTime(mins: number | null | undefined): string | null {
  if (mins == null) return null
  if (mins < 60) return `Responds in ~${mins}m`
  const hrs = Math.round(mins / 60)
  return `Responds in ~${hrs}h`
}

export function ProviderResultCard(props: Props) {
  const router = useRouter()
  const badge = props.badge_level && props.badge_level !== 'new'
    ? BADGE_CONFIG[props.badge_level]
    : null
  const responseLabel = formatResponseTime(props.response_time_mins)

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/provider/${props.id}`)}>
      {/* Top row: Avatar + Info + Right badges */}
      <View style={styles.row}>
        <View>
          <Avatar uri={props.avatar_url} name={props.full_name} size={56} />
          {props.is_available && <View style={styles.onlineDot} />}
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {props.business_name || props.full_name}
            </Text>
            {badge && (
              <View style={[styles.proBadge, { backgroundColor: badge.bg }]}>
                <Ionicons name="shield-checkmark" size={10} color={badge.text} />
                <Text style={[styles.proBadgeText, { color: badge.text }]}>{badge.label}</Text>
              </View>
            )}
          </View>

          {props.primary_category && (
            <Text style={styles.category}>{props.primary_category}</Text>
          )}

          {props.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color="#475569" />
              <Text style={styles.city}>{props.city}</Text>
            </View>
          )}

          {/* Rating + completion count row */}
          <View style={styles.statsRow}>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#FACC15" />
              <Text style={styles.rating}>{props.avg_rating.toFixed(1)}</Text>
              <Text style={styles.reviews}>({props.review_count})</Text>
            </View>
            {(props.completion_count ?? 0) > 0 && (
              <View style={styles.completionRow}>
                <Ionicons name="checkmark-done" size={13} color="#475569" />
                <Text style={styles.completionText}>{props.completion_count} jobs</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right column: availability + price */}
        <View style={styles.right}>
          {props.is_available ? (
            <View style={styles.availBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.availText}>Available</Text>
            </View>
          ) : (
            <View style={styles.unavailBadge}>
              <Text style={styles.unavailText}>Unavailable</Text>
            </View>
          )}
          {props.min_price != null && (
            <Text style={styles.price}>From £{props.min_price}</Text>
          )}
        </View>
      </View>

      {/* Bottom row: trust badges + response time */}
      {((props.credential_badges && props.credential_badges.length > 0) || responseLabel) && (
        <View style={styles.bottomRow}>
          {props.credential_badges?.map((badge, i) => (
            <View key={i} style={styles.trustBadge}>
              <Ionicons
                name={
                  badge.toLowerCase().includes('gas') ? 'flame-outline' :
                  badge.toLowerCase().includes('dbs') ? 'shield-checkmark-outline' :
                  badge.toLowerCase().includes('insur') ? 'document-text-outline' :
                  'ribbon-outline'
                }
                size={11}
                color="#16A34A"
              />
              <Text style={styles.trustBadgeText}>{badge}</Text>
            </View>
          ))}
          {responseLabel && (
            <View style={styles.responseTimeBadge}>
              <Ionicons name="flash-outline" size={11} color="#2563EB" />
              <Text style={styles.responseTimeText}>{responseLabel}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12,
    shadowColor: '#000', shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 1,
  },
  row: { flexDirection: 'row', gap: 12 },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 16, fontWeight: '600', color: '#1E3A8A', flexShrink: 1 },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  proBadgeText: { fontSize: 10, fontWeight: '700' },
  category: { fontSize: 13, color: '#2563EB', marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  city: { fontSize: 13, color: '#475569' },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
  reviews: { fontSize: 12, color: '#475569' },
  completionRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  completionText: { fontSize: 12, color: '#475569' },
  right: { alignItems: 'flex-end', justifyContent: 'space-between' },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  availText: { color: '#16A34A', fontSize: 11, fontWeight: '600' },
  unavailBadge: { backgroundColor: '#E0E7FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  unavailText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#16A34A', borderWidth: 2, borderColor: '#FFFFFF',
  },
  price: { fontSize: 14, fontWeight: '700', color: '#1E3A8A', marginTop: 8 },
  bottomRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E0E7FF' },
  trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F0FDF4', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  trustBadgeText: { fontSize: 10, fontWeight: '600', color: '#16A34A' },
  responseTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#EFF6FF', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  responseTimeText: { fontSize: 10, fontWeight: '600', color: '#2563EB' },
})
