import { useEffect, useState } from 'react'
import { ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Alert, Platform, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth-context'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'

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

const BADGE_CONFIG: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  top:    { bg: '#FEF3C7', text: '#D97706', label: 'Top Pro', icon: 'trophy' },
  rising: { bg: '#DBEAFE', text: '#1E40AF', label: 'Rising Pro', icon: 'trending-up' },
}

export default function ProviderProfileScreen() {
  const { id, rebook, serviceId, originalRequestId } = useLocalSearchParams<{
    id: string
    rebook?: string
    serviceId?: string
    originalRequestId?: string
  }>()
  const { user, profile: myProfile } = useAuth()
  const router = useRouter()
  const [provider, setProvider] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])
  const [portfolio, setPortfolio] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [credentials, setCredentials] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isFavourited, setIsFavourited] = useState(false)
  const [selectedService, setSelectedService] = useState<any>(null)
  const [urgency, setUrgency] = useState<'flexible' | 'this_week' | 'urgent'>('flexible')
  const [preferredTime, setPreferredTime] = useState<'morning' | 'afternoon' | 'evening' | 'flexible'>('flexible')
  const [albums, setAlbums] = useState<string[]>([])
  const [activeAlbumFilter, setActiveAlbumFilter] = useState<string | null>(null)
  const [quoteImages, setQuoteImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (!id) return

    Promise.all([
      supabase.from('profiles').select('*, provider_details(*)').eq('id', id).single(),
      supabase.from('services').select('*, categories(name)').eq('provider_id', id).eq('is_active', true),
      supabase.from('portfolio_items').select('*, album').eq('provider_id', id).order('created_at', { ascending: false }),
      supabase.from('reviews').select('*, profiles!reviews_reviewer_id_fkey(full_name, avatar_url)').eq('provider_id', id).order('created_at', { ascending: false }),
      supabase.from('credentials').select('*').eq('provider_id', id).eq('verified', true),
      supabase.from('portfolio_albums').select('name, sort_order').eq('provider_id', id).order('sort_order', { ascending: true }),
    ]).then(([profileRes, servicesRes, portfolioRes, reviewsRes, credRes, albumsRes]) => {
      setProvider(profileRes.data)
      setServices(servicesRes.data ?? [])
      setPortfolio(portfolioRes.data ?? [])
      setReviews(reviewsRes.data ?? [])
      setCredentials(credRes.data ?? [])
      setAlbums((albumsRes.data ?? []).map((a: any) => a.name))
      setLoading(false)
    })

    if (user) {
      supabase.from('favourites').select('id').eq('customer_id', user.id).eq('provider_id', id).maybeSingle()
        .then(({ data }) => setIsFavourited(!!data))
    }
  }, [id, user])

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

  async function toggleFavourite() {
    if (!user || !id) return
    if (isFavourited) {
      await supabase.from('favourites').delete().eq('customer_id', user.id).eq('provider_id', id)
      setIsFavourited(false)
    } else {
      await supabase.from('favourites').insert({ customer_id: user.id, provider_id: id })
      setIsFavourited(true)
    }
  }

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
      images: quoteImages,
    })
    setSending(false)
    if (error) {
      if (Platform.OS === 'web') { window.alert(error.message) }
      else { Alert.alert('Error', error.message) }
    } else {
      if (Platform.OS === 'web') { window.alert('Your enquiry has been sent.') }
      else { Alert.alert('Sent!', 'Your enquiry has been sent.') }
      setMessage('')
      setSelectedService(null)
      setUrgency('flexible')
      setPreferredTime('flexible')
      setQuoteImages([])
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#1E40AF" style={{ marginTop: 60 }} />
      </SafeAreaView>
    )
  }

  if (!provider) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.errorText}>Provider not found</Text>
      </SafeAreaView>
    )
  }

  const details = Array.isArray(provider.provider_details)
    ? provider.provider_details[0]
    : provider.provider_details
  const badgeInfo = details?.badge_level && details.badge_level !== 'new'
    ? BADGE_CONFIG[details.badge_level]
    : null
  const completionCount = details?.completion_count ?? 0
  const responseTime = details?.response_time_mins
  const isVerified = details?.is_verified === true

  // Calculate sub-score averages from reviews that have sub-scores
  const subScoreReviews = reviews.filter(
    (r: any) => r.punctuality != null || r.quality != null || r.value != null
  )
  const subScores = subScoreReviews.length >= 3 ? {
    punctuality: subScoreReviews.filter((r: any) => r.punctuality != null).length > 0
      ? subScoreReviews.reduce((sum: number, r: any) => sum + (r.punctuality ?? 0), 0) /
        subScoreReviews.filter((r: any) => r.punctuality != null).length
      : null,
    quality: subScoreReviews.filter((r: any) => r.quality != null).length > 0
      ? subScoreReviews.reduce((sum: number, r: any) => sum + (r.quality ?? 0), 0) /
        subScoreReviews.filter((r: any) => r.quality != null).length
      : null,
    value: subScoreReviews.filter((r: any) => r.value != null).length > 0
      ? subScoreReviews.reduce((sum: number, r: any) => sum + (r.value ?? 0), 0) /
        subScoreReviews.filter((r: any) => r.value != null).length
      : null,
  } : null

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Nav bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/')}>
            <Ionicons name="arrow-back" size={24} color="#1E3A8A" />
          </TouchableOpacity>
          {user && myProfile?.role === 'customer' && (
            <TouchableOpacity onPress={toggleFavourite}>
              <Ionicons name={isFavourited ? 'heart' : 'heart-outline'} size={24} color={isFavourited ? '#EF4444' : '#1E3A8A'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Header */}
        <View style={styles.headerCard}>
          <Avatar uri={provider.avatar_url} name={provider.full_name} size={72} />
          <View style={styles.nameRow}>
            <Text style={styles.name}>{details?.business_name || provider.full_name}</Text>
            {badgeInfo && (
              <View style={[styles.proBadge, { backgroundColor: badgeInfo.bg }]}>
                <Ionicons name={badgeInfo.icon as any} size={12} color={badgeInfo.text} />
                <Text style={[styles.proBadgeText, { color: badgeInfo.text }]}>{badgeInfo.label}</Text>
              </View>
            )}
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color="#1E40AF" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          {provider.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#475569" />
              <Text style={styles.city}>{provider.city}</Text>
            </View>
          )}

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={styles.statIconWrap}>
                <Ionicons name="star" size={16} color="#FACC15" />
              </View>
              <Text style={styles.statValue}>{(details?.avg_rating ?? 0).toFixed(1)}</Text>
              <Text style={styles.statLabel}>{details?.review_count ?? 0} reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconWrap}>
                <Ionicons name="checkmark-done" size={16} color="#1E40AF" />
              </View>
              <Text style={styles.statValue}>{completionCount}</Text>
              <Text style={styles.statLabel}>jobs done</Text>
            </View>
            {responseTime != null && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.statIconWrap}>
                    <Ionicons name="flash" size={16} color="#D97706" />
                  </View>
                  <Text style={styles.statValue}>{responseTime < 60 ? `${responseTime}m` : `${Math.round(responseTime / 60)}h`}</Text>
                  <Text style={styles.statLabel}>response</Text>
                </View>
              </>
            )}
            {details?.years_exp != null && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <View style={styles.statIconWrap}>
                    <Ionicons name="calendar" size={16} color="#475569" />
                  </View>
                  <Text style={styles.statValue}>{details.years_exp}yr</Text>
                  <Text style={styles.statLabel}>experience</Text>
                </View>
              </>
            )}
          </View>

          {/* Sub-score breakdown */}
          {subScores && (
            <View style={styles.subScoresCard}>
              <Text style={styles.subScoresTitle}>Rating Breakdown</Text>
              {subScores.punctuality != null && <SubScoreBar label="Punctuality" avg={subScores.punctuality} />}
              {subScores.quality != null && <SubScoreBar label="Quality" avg={subScores.quality} />}
              {subScores.value != null && <SubScoreBar label="Value" avg={subScores.value} />}
            </View>
          )}

          {details?.is_available && (
            <View style={styles.availBadge}>
              <View style={styles.pulseDot} />
              <Text style={styles.availText}>Available Now</Text>
            </View>
          )}
          {provider.bio && <Text style={styles.bio}>{provider.bio}</Text>}
          {provider.languages?.length > 0 && (
            <View style={styles.languagesRow}>
              <Ionicons name="language-outline" size={16} color="#475569" />
              <Text style={styles.languagesText}>{provider.languages.join(' · ')}</Text>
            </View>
          )}
        </View>

        {/* Trust Badges */}
        {credentials.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verified Credentials</Text>
            <View style={styles.credGrid}>
              {credentials.map(c => {
                const iconName =
                  c.type === 'insurance' ? 'shield-checkmark' :
                  c.type === 'certification' ? 'ribbon' :
                  c.type === 'license' ? 'document-text' :
                  'checkmark-circle'
                if (c.type === 'insurance') {
                  return (
                    <View key={c.id} style={styles.insuranceBadge}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="shield-checkmark" size={22} color="#16A34A" />
                        <Text style={styles.insuranceBadgeTitle}>{c.label}</Text>
                      </View>
                      {c.insurer_name && (
                        <Text style={styles.insuranceBadgeInsurer}>{c.insurer_name}</Text>
                      )}
                      {c.coverage_amount && (
                        <Text style={styles.insuranceBadgeCoverage}>Coverage: {c.coverage_amount}</Text>
                      )}
                      {c.expires_at && (
                        <Text style={styles.credExpiry}>
                          Exp: {new Date(c.expires_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        </Text>
                      )}
                    </View>
                  )
                }
                return (
                  <View key={c.id} style={styles.credCard}>
                    <Ionicons name={iconName} size={20} color="#16A34A" />
                    <Text style={styles.credLabel}>{c.label}</Text>
                    <Text style={styles.credType}>
                      {c.type.charAt(0).toUpperCase() + c.type.slice(1)}
                    </Text>
                    {c.expires_at && (
                      <Text style={styles.credExpiry}>
                        Exp: {new Date(c.expires_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Services */}
        {services.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services</Text>
            {services.map(s => (
              <View key={s.id} style={styles.serviceCard}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceTitle}>{s.title}</Text>
                  {s.categories?.name && <Text style={styles.serviceCategory}>{s.categories.name}</Text>}
                </View>
                {s.price_from != null && (
                  <Text style={styles.servicePrice}>
                    From £{s.price_from}{s.price_type === 'hourly' ? '/hr' : ''}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Structured Quote Form (customers only) — prominent placement */}
        {user && myProfile?.role === 'customer' && (
          <View style={styles.quoteSection}>
            <Text style={styles.quoteSectionTitle}>Get the Help You Need</Text>

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

        {/* Portfolio — limited to 6 photos */}
        {portfolio.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            {albums.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.albumFilterBar}>
                <View style={styles.albumFilterRow}>
                  <TouchableOpacity
                    style={[styles.albumFilterChip, activeAlbumFilter === null && styles.albumFilterChipActive]}
                    onPress={() => setActiveAlbumFilter(null)}
                  >
                    <Text style={[styles.albumFilterText, activeAlbumFilter === null && styles.albumFilterTextActive]}>All</Text>
                  </TouchableOpacity>
                  {albums.map(name => (
                    <TouchableOpacity
                      key={name}
                      style={[styles.albumFilterChip, activeAlbumFilter === name && styles.albumFilterChipActive]}
                      onPress={() => setActiveAlbumFilter(name)}
                    >
                      <Text style={[styles.albumFilterText, activeAlbumFilter === name && styles.albumFilterTextActive]}>{name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            )}
            <View style={styles.portfolioGrid}>
              {(activeAlbumFilter ? portfolio.filter((p: any) => p.album === activeAlbumFilter) : portfolio).slice(0, 6).map((p: any) => (
                <Image key={p.id} source={{ uri: p.image_url }} style={styles.portfolioImg} />
              ))}
            </View>
          </View>
        )}

        {/* Reviews — limited to 3 */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Reviews</Text>
            {reviews.slice(0, 3).map(r => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Avatar uri={r.profiles?.avatar_url} name={r.profiles?.full_name ?? '?'} size={36} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewerName}>{r.profiles?.full_name}</Text>
                    <View style={styles.starsRow}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons key={i} name={i < r.rating ? 'star' : 'star-outline'} size={14} color="#FACC15" />
                      ))}
                      <Text style={styles.reviewDate}>
                        {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>
                </View>
                {r.body && <Text style={styles.reviewBody}>{r.body}</Text>}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFF6FF' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  headerCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, marginHorizontal: 16, marginTop: 8,
    alignItems: 'center', borderWidth: 1, borderColor: '#E0E7FF',
    shadowColor: '#1E40AF', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 10, elevation: 2,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  name: { fontSize: 22, fontWeight: '700', color: '#1E3A8A' },
  proBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  proBadgeText: { fontSize: 12, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  city: { fontSize: 14, color: '#475569' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, gap: 4 },
  statItem: { alignItems: 'center', paddingHorizontal: 12 },
  statIconWrap: { marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1E3A8A' },
  statLabel: { fontSize: 11, color: '#475569', marginTop: 1 },
  statDivider: { width: 1, height: 32, backgroundColor: '#E0E7FF' },
  availBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DCFCE7', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6, marginTop: 12 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  availText: { color: '#16A34A', fontWeight: '600', fontSize: 14 },
  bio: { fontSize: 14, color: '#4B5563', marginTop: 12, textAlign: 'center', lineHeight: 20 },
  languagesRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, justifyContent: 'center' },
  languagesText: { fontSize: 13, color: '#475569', flex: 1 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A8A', marginBottom: 12 },
  quoteSection: {
    marginTop: 24, marginHorizontal: 16, padding: 20,
    backgroundColor: '#FFFFFF', borderRadius: 20,
    borderWidth: 2, borderColor: '#1E40AF',
    shadowColor: '#1E40AF', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 3,
  },
  quoteSectionTitle: { fontSize: 20, fontWeight: '700', color: '#1E3A8A', marginBottom: 16 },
  // Credentials
  credGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  credCard: {
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 12, width: '48%',
    borderWidth: 1, borderColor: '#BBF7D0', gap: 4,
  },
  credLabel: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
  credType: { fontSize: 11, color: '#16A34A', fontWeight: '500' },
  credExpiry: { fontSize: 10, color: '#475569' },
  insuranceBadge: {
    backgroundColor: '#F0FDF4', borderRadius: 12, padding: 14, width: '100%',
    borderWidth: 1, borderColor: '#BBF7D0', gap: 4,
  },
  insuranceBadgeTitle: { fontSize: 14, fontWeight: '700', color: '#1E3A8A' },
  insuranceBadgeInsurer: { fontSize: 12, color: '#475569', marginLeft: 28 },
  insuranceBadgeCoverage: { fontSize: 13, fontWeight: '600', color: '#16A34A', marginLeft: 28 },
  // Services
  serviceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8,
  },
  serviceInfo: { flex: 1 },
  serviceTitle: { fontSize: 15, fontWeight: '600', color: '#1E3A8A' },
  serviceCategory: { fontSize: 13, color: '#1E40AF', marginTop: 2 },
  servicePrice: { fontSize: 15, fontWeight: '700', color: '#1E3A8A' },
  // Portfolio
  albumFilterBar: { marginBottom: 12 },
  albumFilterRow: { flexDirection: 'row', gap: 8 },
  albumFilterChip: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: '#E0E7FF',
  },
  albumFilterChipActive: { backgroundColor: '#1E40AF', borderColor: '#1E40AF' },
  albumFilterText: { fontSize: 13, fontWeight: '600', color: '#1E3A8A' },
  albumFilterTextActive: { color: '#FFFFFF' },
  portfolioGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  portfolioImg: { width: '31%', aspectRatio: 1, borderRadius: 12, backgroundColor: '#E2E8F0' },
  // Reviews
  reviewCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewerName: { fontSize: 14, fontWeight: '600', color: '#1E3A8A' },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  reviewDate: { fontSize: 11, color: '#94A3B8', marginLeft: 6 },
  reviewBody: { fontSize: 14, color: '#4B5563', marginTop: 10, lineHeight: 20 },
  quoteInput: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E0E7FF', borderRadius: 12,
    padding: 16, fontSize: 15, color: '#1E3A8A', minHeight: 100, marginBottom: 12,
  },
  errorText: { fontSize: 16, color: '#EF4444', textAlign: 'center', marginTop: 60 },
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
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 12,
  },
  fieldHint: { fontSize: 12, color: '#94A3B8', marginBottom: 8, marginTop: -4 },
  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  imageThumb: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  imageThumbImg: { width: '100%', height: '100%' },
  imageRemoveBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FFFFFF', borderRadius: 10 },
  imageAddBtn: { width: 72, height: 72, borderRadius: 10, borderWidth: 1.5, borderColor: '#E0E7FF', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  imageAddText: { fontSize: 11, color: '#1E40AF', fontWeight: '500', marginTop: 2 },
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
})
