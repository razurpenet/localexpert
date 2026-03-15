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
