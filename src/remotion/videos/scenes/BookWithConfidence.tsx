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

const wordmarkSrc = staticFile("handby-wordmark.png");

export const BookWithConfidence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, height } = useVideoConfig();

  // Quote card slides up from below
  const cardSlide = spring({ frame, fps, config: { damping: 14, stiffness: 80 } });
  const cardY = interpolate(cardSlide, [0, 1], [height * 0.6, 0]);

  // Price typing effect
  const priceText = "\u00A345";
  const priceChars = Math.min(
    priceText.length,
    Math.floor(
      interpolate(frame, [20, 40], [0, priceText.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    )
  );

  // Checkmark draw
  const checkProgress = interpolate(frame, [45, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo fade + scale
  const logoOpacity = interpolate(frame, [55, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const logoScale = spring({
    frame: frame - 55,
    fps,
    config: { damping: 10, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Quote card */}
      <div
        style={{
          transform: `translateY(${cardY}px)`,
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          padding: "16px 24px",
          width: 260,
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 12, color: "#64748B", margin: 0, fontFamily: "system-ui" }}>
          Your quote
        </p>
        <p
          style={{
            fontSize: 40,
            fontWeight: 800,
            color: "#1E3A8A",
            margin: "4px 0",
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
        <p style={{ fontSize: 12, color: "#64748B", margin: 0, fontFamily: "system-ui" }}>
          Boiler repair · 2 hours
        </p>

        {/* Checkmark circle */}
        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <svg width="40" height="40" viewBox="0 0 56 56">
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

      {/* Handby logo */}
      <div
        style={{
          marginTop: 20,
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            padding: "8px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Img src={wordmarkSrc} style={{ width: 160, height: "auto" }} />
        </div>
        <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 6, fontFamily: "system-ui" }}>
          Book with confidence
        </p>
      </div>
    </AbsoluteFill>
  );
};
