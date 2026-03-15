import { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  ViewToken,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const CARDS = [
  {
    icon: 'search-outline' as const,
    title: 'Find Local Experts',
    subtitle: 'Plumbers, cleaners, caterers & more \u2014 all in your area',
  },
  {
    icon: 'shield-checkmark-outline' as const,
    title: 'Verified & Trusted',
    subtitle: 'Every provider is reviewed and right-to-work verified',
  },
  {
    icon: 'star-outline' as const,
    title: 'Book With Confidence',
    subtitle: 'Get quotes, compare reviews, and pay securely',
  },
]

export function OnboardingCards() {
  const { width } = useWindowDimensions()
  const PADDING = 24
  const cardWidth = width - PADDING * 2
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  const startAutoAdvance = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % CARDS.length
        flatListRef.current?.scrollToIndex({ index: next, animated: true })
        return next
      })
    }, 4000)
  }, [])

  useEffect(() => {
    startAutoAdvance()
    return () => clearInterval(timerRef.current)
  }, [startAutoAdvance])

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index)
      }
    },
    []
  )

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={CARDS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollBeginDrag={() => {
          clearInterval(timerRef.current)
        }}
        onScrollEndDrag={() => {
          startAutoAdvance()
        }}
        getItemLayout={(_, index) => ({
          length: cardWidth,
          offset: cardWidth * index,
          index,
        })}
        snapToInterval={cardWidth}
        decelerationRate="fast"
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingHorizontal: 0 }}
        renderItem={({ item }) => (
          <View style={[styles.card, { width: cardWidth }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={28} color="#1E40AF" />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Dot indicators */}
      <View style={styles.dots}>
        {CARDS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E3A8A',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 6,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#1E40AF',
    width: 24,
  },
  dotInactive: {
    backgroundColor: '#CBD5E1',
    width: 8,
  },
})
