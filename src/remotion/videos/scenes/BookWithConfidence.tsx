import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const wordmarkSrc = staticFile("transparent-handby-wordmark.png");

export const BookWithConfidence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card scale-in from center
  const cardScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 90 },
  });
  const cardOpacity = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Price counter animation
  const priceValue = Math.min(
    45,
    Math.floor(
      interpolate(frame, [12, 35], [0, 45], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );

  // "Confirmed" badge slides in
  const badgeProgress = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 12, stiffness: 100 },
  });
  const badgeScale = interpolate(badgeProgress, [0, 1], [0.5, 1]);
  const badgeOpacity = interpolate(badgeProgress, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Checkmark draw (inside badge)
  const checkDraw = interpolate(frame, [45, 58], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Bottom tagline fade
  const taglineOpacity = interpolate(frame, [55, 68], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [55, 68], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Main card */}
      <div
        style={{
          transform: `scale(${cardScale})`,
          opacity: cardOpacity,
          backgroundColor: "#FFFFFF",
          borderRadius: 20,
          padding: "20px 28px 18px",
          width: 270,
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Label */}
        <p
          style={{
            fontSize: 11,
            color: "#94A3B8",
            margin: 0,
            fontFamily: "system-ui",
            letterSpacing: 1.5,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Your quote
        </p>

        {/* Price */}
        <p
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: "#1E293B",
            margin: "4px 0",
            fontFamily: "system-ui",
            lineHeight: 1.1,
          }}
        >
          £{priceValue}
        </p>

        {/* Service detail */}
        <p
          style={{
            fontSize: 13,
            color: "#64748B",
            margin: "0 0 16px",
            fontFamily: "system-ui",
          }}
        >
          Boiler repair · 2 hrs
        </p>

        {/* Divider */}
        <div
          style={{
            width: "100%",
            height: 1,
            backgroundColor: "#F1F5F9",
            marginBottom: 16,
          }}
        />

        {/* Confirmed badge */}
        <div
          style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#F0FDF4",
            borderRadius: 24,
            padding: "8px 18px",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="11" fill="#10B981" />
            <path
              d="M7 12l3.5 3.5L17 9"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={20}
              strokeDashoffset={20 * (1 - checkDraw)}
            />
          </svg>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#059669",
              fontFamily: "system-ui",
            }}
          >
            Booking confirmed
          </span>
        </div>
      </div>

      {/* Bottom branding — wordmark + tagline */}
      <div
        style={{
          marginTop: 12,
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Img
          src={wordmarkSrc}
          style={{
            width: 340,
            height: 340,
            marginTop: -55,
            marginBottom: -65,
          }}
        />
        <p
          style={{
            fontSize: 12,
            color: "#CBD5E1",
            margin: 0,
            fontFamily: "system-ui",
          }}
        >
          Book with confidence
        </p>
      </div>
    </AbsoluteFill>
  );
};
