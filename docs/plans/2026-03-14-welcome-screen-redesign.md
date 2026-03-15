# Welcome Screen Redesign & Promotional Video

**Date:** 2026-03-14
**Status:** Approved

## Overview

Redesign the Handby mobile app welcome screen from a plain text+gradient layout to a modern video hero + swipeable onboarding experience. Includes a 10-second looping Remotion-generated promotional video.

## Design Decisions

| Aspect | Decision |
|--------|----------|
| Layout | Video hero (60%) + swipeable onboarding cards (3) + CTA buttons |
| Video | 10s looping Remotion animation, pre-rendered to MP4 |
| Vibe | Warm community + professional trust signals |
| Scenes | Find experts → Verified & reviewed → Book with confidence |
| Integration | Remotion renders MP4 → bundled as static asset → expo-av plays it |
| Brand | Navy/orange/soft-blue palette, consistent with existing app |

## Welcome Screen Layout

```
┌─────────────────────────────┐
│                             │
│   Pre-rendered MP4 video    │
│   (60% of screen height)   │
│   Auto-plays, loops, muted │
│   Rounded bottom corners   │
│                             │
├─────────────────────────────┤
│                             │
│  Swipeable onboarding cards │
│  with dot indicators        │
│  (3 cards, auto-advance)    │
│                             │
├─────────────────────────────┤
│  [  Get Started  ]  orange  │
│  [  Sign In      ]  ghost   │
│  "By continuing you agree…" │
└─────────────────────────────┘
```

### Video Area
- Pre-rendered MP4 played via expo-av `<Video>`
- Auto-plays on mount, loops, muted
- Rounded bottom corners with gradient overlay at bottom edge

### Onboarding Cards (swipeable, auto-advance every 4s)

| Card | Icon | Headline | Subtitle |
|------|------|----------|----------|
| 1 | search-outline | Find Local Experts | Plumbers, cleaners, caterers & more — all in your area |
| 2 | shield-checkmark-outline | Verified & Trusted | Every provider is reviewed and right-to-work verified |
| 3 | star-outline | Book With Confidence | Get quotes, compare reviews, and pay securely |

### Buttons
- "Get Started" — orange #F97316, full width
- "I already have an account" — ghost style, navy text
- Legal text: "By continuing you agree to our Terms & Privacy Policy"

## Remotion Video Specification

**Specs:** 390x500px portrait, 30fps, 300 frames (~10 seconds), seamless loop.

### Scene 1: Find Local Experts (frames 0-90)
- Navy gradient background (#0F172A → #1E3A8A)
- Search bar slides down with spring animation
- Service category pills float up with staggered springs
- Map pin drops with bounce
- Text: "Find trusted experts near you"

### Scene 2: Verified & Reviewed (frames 90-190)
- Crossfade transition
- Provider card animates in from right
- Star rating fills in sequentially (gold #F59E0B)
- Verified shield pulses (green #10B981)
- Review count ticks up

### Scene 3: Book With Confidence (frames 190-270)
- Quote card slides up from bottom
- Price types in
- Checkmark draws itself
- Handby logo fades in

### Scene 4: Loop Bridge (frames 270-300)
- All elements fade out
- Background returns to initial gradient for seamless loop

## File Structure

```
src/remotion/
  index.ts                    # registerRoot
  Root.tsx                    # Composition registration
  videos/
    HandbyWelcome.tsx         # Main video component
    scenes/
      FindExperts.tsx         # Scene 1
      VerifiedReviewed.tsx    # Scene 2
      BookWithConfidence.tsx  # Scene 3

handby-mobile/
  assets/videos/
    handby-welcome.mp4       # Pre-rendered video
  components/welcome/
    WelcomeVideo.tsx          # expo-av Video wrapper
    OnboardingCards.tsx       # Swipeable cards with dots
  app/(auth)/
    welcome.tsx               # Redesigned welcome screen
```

## Brand Palette
- Navy dark: #0F172A
- Navy: #1E3A8A
- Blue accent: #1E40AF
- Soft blue bg: #EFF6FF
- Orange CTA: #F97316
- Gold stars: #F59E0B
- Green verified: #10B981
- White: #FFFFFF
- Slate text: #475569, #94A3B8
