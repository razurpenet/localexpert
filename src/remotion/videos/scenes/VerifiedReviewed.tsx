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

  // Review count tick up
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
        {/* Avatar + name */}
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

        {/* Verified badge + reviews */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
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
