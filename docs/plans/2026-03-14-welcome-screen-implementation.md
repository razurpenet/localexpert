# Welcome Screen Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the plain-text welcome screen with a video hero + swipeable onboarding cards, powered by a Remotion-generated promotional video.

**Architecture:** Build 3 Remotion scene components composing into a single `HandbyWelcome` composition. Pre-render to MP4 via `npx remotion render`. Bundle the MP4 as a static asset in the Expo app. The welcome screen uses `expo-av` `<Video>` for playback and a custom `OnboardingCards` component for the swipeable cards.

**Tech Stack:** Remotion 4.x (video generation), expo-av (video playback), React Native (UI), Expo Router (navigation), TypeScript.

---

### Task 1: Install expo-av in the mobile app

**Files:**
- Modify: `handby-mobile/package.json`

**Step 1: Install expo-av**

Run from `handby-mobile/`:
```bash
cd handby-mobile && npx expo install expo-av
```

**Step 2: Verify installation**

Run: `grep expo-av handby-mobile/package.json`
Expected: `"expo-av": "~55..."`

**Step 3: Commit**

```bash
git add handby-mobile/package.json handby-mobile/package-lock.json
git commit -m "chore: install expo-av for video playback"
```

---

### Task 2: Remotion Scene 1 — Find Experts

**Files:**
- Create: `src/remotion/index.ts`
- Create: `src/remotion/Root.tsx`
- Create: `src/remotion/videos/HandbyWelcome.tsx`
- Create: `src/remotion/videos/scenes/FindExperts.tsx`

**Step 1: Create Remotion entry point**

```typescript
// src/remotion/index.ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```

**Step 2: Create Root with composition**

```typescript
// src/remotion/Root.tsx
import { Composition } from "remotion";
import { HandbyWelcome } from "./videos/HandbyWelcome";

export const RemotionRoot = () => (
  <>
    <Composition
      id="HandbyWelcome"
      component={HandbyWelcome}
      durationInFrames={300}
      fps={30}
      width={390}
      height={500}
    />
  </>
);
```

**Step 3: Create main video shell**

```typescript
// src/remotion/videos/HandbyWelcome.tsx
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { FindExperts } from "./scenes/FindExperts";

export const HandbyWelcome: React.FC = () => {
  const frame = useCurrentFrame();

  // Global fade out for loop bridge (frames 270-300)
  const loopFade = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: loopFade }}>
      <Sequence from={0} durationInFrames={100}>
        <FindExperts />
      </Sequence>
    </AbsoluteFill>
  );
};
```

**Step 4: Build FindExperts scene**

```typescript
// src/remotion/videos/scenes/FindExperts.tsx
import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const CATEGORIES = ["Plumber", "Cleaner", "Electrician", "Caterer", "Gardener"];

export const FindExperts: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Search bar slides down
  const searchY = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const searchTranslateY = interpolate(searchY, [0, 1], [-60, 0]);

  // Text fade in
  const textOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Map pin bounce
  const pinDrop = spring({
    frame: frame - 40,
    fps,
    config: { damping: 8, stiffness: 120, mass: 0.8 },
  });
  const pinY = interpolate(pinDrop, [0, 1], [-80, 0]);
  const pinScale = interpolate(pinDrop, [0, 0.5, 1], [0, 1.2, 1]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      {/* Search bar */}
      <div
        style={{
          transform: `translateY(${searchTranslateY}px)`,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: "14px 20px",
          width: 300,
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span style={{ color: "#94A3B8", fontSize: 15, fontFamily: "system-ui" }}>
          Search for a service...
        </span>
      </div>

      {/* Category pills */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
          marginTop: 20,
          maxWidth: 340,
        }}
      >
        {CATEGORIES.map((cat, i) => {
          const delay = 15 + i * 8;
          const s = spring({
            frame: frame - delay,
            fps,
            config: { damping: 12, stiffness: 100 },
          });
          return (
            <div
              key={cat}
              style={{
                opacity: s,
                transform: `translateY(${(1 - s) * 20}px) scale(${0.8 + s * 0.2})`,
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 20,
                padding: "8px 18px",
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <span style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 500, fontFamily: "system-ui" }}>
                {cat}
              </span>
            </div>
          );
        })}
      </div>

      {/* Map pin */}
      <div
        style={{
          marginTop: 24,
          transform: `translateY(${pinY}px) scale(${pinScale})`,
          opacity: pinDrop,
        }}
      >
        <svg width="40" height="50" viewBox="0 0 40 50" fill="none">
          <path
            d="M20 0C8.95 0 0 8.95 0 20c0 15 20 30 20 30s20-15 20-30C40 8.95 31.05 0 20 0z"
            fill="#F97316"
          />
          <circle cx="20" cy="18" r="8" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Text */}
      <p
        style={{
          opacity: textOpacity,
          color: "#FFFFFF",
          fontSize: 20,
          fontWeight: 700,
          textAlign: "center",
          marginTop: 20,
          fontFamily: "system-ui",
        }}
      >
        Find trusted experts near you
      </p>
    </AbsoluteFill>
  );
};
```

**Step 5: Preview in Remotion Studio**

Run: `npx remotion studio src/remotion/index.ts`
Expected: Studio opens at localhost:3000 with "HandbyWelcome" composition showing Scene 1.

**Step 6: Commit**

```bash
git add src/remotion/
git commit -m "feat: Remotion setup with FindExperts scene"
```

---

### Task 3: Remotion Scene 2 — Verified & Reviewed

**Files:**
- Create: `src/remotion/videos/scenes/VerifiedReviewed.tsx`
- Modify: `src/remotion/videos/HandbyWelcome.tsx`

**Step 1: Build VerifiedReviewed scene**

```typescript
// src/remotion/videos/scenes/VerifiedReviewed.tsx
import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const VerifiedReviewed: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card slides in from right
  const cardSlide = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const cardX = interpolate(cardSlide, [0, 1], [400, 0]);

  // Stars fill in sequentially
  const stars = [0, 1, 2, 3, 4].map((i) => {
    const starProgress = interpolate(frame, [20 + i * 6, 26 + i * 6], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return starProgress;
  });

  // Verified badge pulse
  const badgeScale = spring({
    frame: frame - 55,
    fps,
    config: { damping: 6, stiffness: 150, mass: 0.5 },
  });

  // Review count
  const reviewCount = Math.min(
    127,
    Math.floor(
      interpolate(frame, [60, 85], [0, 127], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );

  // Heading fade
  const headingOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      <p
        style={{
          opacity: headingOpacity,
          color: "#FFFFFF",
          fontSize: 20,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 24,
          fontFamily: "system-ui",
        }}
      >
        Verified & Reviewed
      </p>

      {/* Provider card */}
      <div
        style={{
          transform: `translateX(${cardX}px)`,
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          padding: 24,
          width: 300,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        {/* Avatar + name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              background: "linear-gradient(135deg, #3B82F6, #1E40AF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#FFF", fontSize: 20, fontWeight: 700, fontFamily: "system-ui" }}>
              JD
            </span>
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#1E3A8A", margin: 0, fontFamily: "system-ui" }}>
              James Davies
            </p>
            <p style={{ fontSize: 12, color: "#64748B", margin: 0, fontFamily: "system-ui" }}>
              Plumber · London
            </p>
          </div>
        </div>

        {/* Star rating */}
        <div style={{ display: "flex", gap: 4, marginTop: 16, alignItems: "center" }}>
          {stars.map((progress, i) => (
            <svg
              key={i}
              width="22"
              height="22"
              viewBox="0 0 24 24"
              style={{ transform: `scale(${0.5 + progress * 0.5})`, opacity: progress }}
            >
              <path
                d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                fill="#F59E0B"
              />
            </svg>
          ))}
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1E3A8A", marginLeft: 6, fontFamily: "system-ui" }}>
            4.8
          </span>
        </div>

        {/* Verified badge + review count */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 14,
          }}
        >
          <div
            style={{
              transform: `scale(${badgeScale})`,
              display: "flex",
              alignItems: "center",
              gap: 5,
              backgroundColor: "#F0FDF4",
              borderRadius: 20,
              padding: "6px 12px",
              border: "1px solid #BBF7D0",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#10B981">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#10B981", fontFamily: "system-ui" }}>
              Verified
            </span>
          </div>
          <span style={{ fontSize: 13, color: "#64748B", fontFamily: "system-ui" }}>
            {reviewCount} reviews
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

**Step 2: Add Scene 2 to HandbyWelcome.tsx**

Add import and a second `<Sequence>`:
```typescript
import { VerifiedReviewed } from "./scenes/VerifiedReviewed";

// Inside the component, after the first Sequence:
<Sequence from={90} durationInFrames={100}>
  <VerifiedReviewed />
</Sequence>
```

**Step 3: Preview**

Run: `npx remotion studio src/remotion/index.ts`
Scrub to frame 90+. Expected: provider card animates in with stars and verified badge.

**Step 4: Commit**

```bash
git add src/remotion/
git commit -m "feat: Remotion VerifiedReviewed scene"
```

---

### Task 4: Remotion Scene 3 — Book With Confidence

**Files:**
- Create: `src/remotion/videos/scenes/BookWithConfidence.tsx`
- Modify: `src/remotion/videos/HandbyWelcome.tsx`

**Step 1: Build BookWithConfidence scene**

```typescript
// src/remotion/videos/scenes/BookWithConfidence.tsx
import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

export const BookWithConfidence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Quote card slides up
  const cardSlide = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const cardY = interpolate(cardSlide, [0, 1], [500, 0]);

  // Price typing effect
  const priceText = "£45";
  const priceChars = Math.min(
    priceText.length,
    Math.floor(interpolate(frame, [25, 45], [0, priceText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }))
  );

  // Checkmark draw (SVG stroke-dashoffset)
  const checkProgress = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo fade
  const logoOpacity = interpolate(frame, [60, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoScale = spring({
    frame: frame - 60,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)",
        justifyContent: "center",
        alignItems: "center",
        padding: 24,
      }}
    >
      {/* Quote card */}
      <div
        style={{
          transform: `translateY(${cardY}px)`,
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          padding: 28,
          width: 300,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: "system-ui" }}>
          Your quote
        </p>
        <p
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#1E3A8A",
            margin: "8px 0",
            fontFamily: "system-ui",
          }}
        >
          {priceText.slice(0, priceChars)}
          <span
            style={{
              opacity: frame % 16 < 8 && priceChars < priceText.length ? 1 : 0,
              color: "#94A3B8",
            }}
          >
            |
          </span>
        </p>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontFamily: "system-ui" }}>
          Boiler repair · 2 hours
        </p>

        {/* Checkmark circle */}
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              strokeDasharray={150}
              strokeDashoffset={150 * (1 - checkProgress)}
            />
            <path
              d="M18 28l7 7 13-13"
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={40}
              strokeDashoffset={40 * (1 - Math.max(0, (checkProgress - 0.5) * 2))}
            />
          </svg>
        </div>
      </div>

      {/* Handby logo text */}
      <div
        style={{
          marginTop: 32,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#FFFFFF",
            margin: 0,
            fontFamily: "system-ui",
            letterSpacing: -0.5,
          }}
        >
          Hand<span style={{ color: "#F97316" }}>by</span>
        </p>
        <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 4, fontFamily: "system-ui" }}>
          Book with confidence
        </p>
      </div>
    </AbsoluteFill>
  );
};
```

**Step 2: Add Scene 3 to HandbyWelcome.tsx**

Add import and third `<Sequence>`:
```typescript
import { BookWithConfidence } from "./scenes/BookWithConfidence";

// After Scene 2 Sequence:
<Sequence from={190} durationInFrames={110}>
  <BookWithConfidence />
</Sequence>
```

**Step 3: Preview full video**

Run: `npx remotion studio src/remotion/index.ts`
Play through all 300 frames. Expected: 3 scenes + fade out loop bridge.

**Step 4: Commit**

```bash
git add src/remotion/
git commit -m "feat: Remotion BookWithConfidence scene + full video"
```

---

### Task 5: Render video to MP4

**Files:**
- Create: `handby-mobile/assets/videos/handby-welcome.mp4`

**Step 1: Create videos directory**

```bash
mkdir -p handby-mobile/assets/videos
```

**Step 2: Render the composition**

Run:
```bash
npx remotion render src/remotion/index.ts HandbyWelcome handby-mobile/assets/videos/handby-welcome.mp4 --codec=h264 --crf=18
```

Expected: Renders 300 frames, outputs MP4 file (~200-500KB).

**Step 3: Verify file exists**

```bash
ls -la handby-mobile/assets/videos/handby-welcome.mp4
```

**Step 4: Commit**

```bash
git add handby-mobile/assets/videos/handby-welcome.mp4
git commit -m "feat: pre-rendered Handby welcome video"
```

---

### Task 6: OnboardingCards component

**Files:**
- Create: `handby-mobile/components/welcome/OnboardingCards.tsx`

**Step 1: Build the component**

```typescript
// handby-mobile/components/welcome/OnboardingCards.tsx
import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 48;

const CARDS = [
  {
    icon: "search-outline" as const,
    title: "Find Local Experts",
    subtitle:
      "Plumbers, cleaners, caterers & more\u2009\u2014\u2009all in your area",
  },
  {
    icon: "shield-checkmark-outline" as const,
    title: "Verified & Trusted",
    subtitle:
      "Every provider is reviewed and right-to-work verified",
  },
  {
    icon: "star-outline" as const,
    title: "Book With Confidence",
    subtitle:
      "Get quotes, compare reviews, and pay securely",
  },
];

export function OnboardingCards() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Auto-advance every 4 seconds
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % CARDS.length;
        scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, []);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
    if (index !== activeIndex) {
      setActiveIndex(index);
      // Reset timer on manual swipe
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setActiveIndex((prev) => {
          const next = (prev + 1) % CARDS.length;
          scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
          return next;
        });
      }, 4000);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 0 }}
      >
        {CARDS.map((card, i) => (
          <View key={i} style={[styles.card, { width: CARD_WIDTH }]}>
            <View style={styles.iconWrap}>
              <Ionicons name={card.icon} size={28} color="#1E40AF" />
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
          </View>
        ))}
      </ScrollView>

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
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#1E3A8A",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 2,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E3A8A",
    marginBottom: 8,
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 21,
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: "#1E40AF",
    width: 24,
  },
  dotInactive: {
    backgroundColor: "#CBD5E1",
  },
});
```

**Step 2: Commit**

```bash
git add handby-mobile/components/welcome/OnboardingCards.tsx
git commit -m "feat: OnboardingCards swipeable component"
```

---

### Task 7: WelcomeVideo component

**Files:**
- Create: `handby-mobile/components/welcome/WelcomeVideo.tsx`

**Step 1: Build the video wrapper**

```typescript
// handby-mobile/components/welcome/WelcomeVideo.tsx
import { useRef, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_HEIGHT = Dimensions.get("window").height * 0.55;

export function WelcomeVideo() {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    videoRef.current?.playAsync();
  }, []);

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={require("../../assets/videos/handby-welcome.mp4")}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
      />
      {/* Gradient overlay at bottom */}
      <View style={styles.gradientOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    overflow: "hidden",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "transparent",
    // Simulated gradient with semi-transparent overlay
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
});
```

**Step 2: Commit**

```bash
git add handby-mobile/components/welcome/WelcomeVideo.tsx
git commit -m "feat: WelcomeVideo expo-av wrapper component"
```

---

### Task 8: Redesign welcome.tsx

**Files:**
- Modify: `handby-mobile/app/(auth)/welcome.tsx`

**Step 1: Replace the entire welcome screen**

```typescript
// handby-mobile/app/(auth)/welcome.tsx
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Button } from "../../components/ui/Button";
import { WelcomeVideo } from "../../components/welcome/WelcomeVideo";
import { OnboardingCards } from "../../components/welcome/OnboardingCards";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Video hero */}
      <WelcomeVideo />

      {/* Onboarding cards */}
      <View style={styles.cardsSection}>
        <OnboardingCards />
      </View>

      {/* CTA buttons */}
      <View style={styles.buttons}>
        <Button
          title="Get Started"
          onPress={() => router.push("/(auth)/signup")}
        />
        <Button
          title="I already have an account"
          variant="ghost"
          onPress={() => router.push("/(auth)/login")}
          style={{ marginTop: 8 }}
        />
        <Text style={styles.legal}>
          By continuing you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF6FF",
  },
  cardsSection: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  buttons: {
    paddingHorizontal: 24,
    paddingBottom: 36,
  },
  legal: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 12,
  },
});
```

**Step 2: Commit**

```bash
git add handby-mobile/app/(auth)/welcome.tsx
git commit -m "feat: redesigned welcome screen with video hero + onboarding cards"
```

---

### Task 9: End-to-end test on device

**Step 1: Start Expo dev server**

```bash
cd handby-mobile && npx expo start
```

**Step 2: Verify on device**
- Open Expo Go on iPhone
- Scan QR code
- Expected: Welcome screen shows video playing at top, swipeable cards below, buttons at bottom
- Verify: video loops, cards auto-advance, dots update, buttons navigate correctly

**Step 3: Final commit with any fixes**

```bash
git add -A
git commit -m "fix: welcome screen polish after device testing"
```
