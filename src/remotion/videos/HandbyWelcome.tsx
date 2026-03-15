import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { FindExperts } from "./scenes/FindExperts";
import { VerifiedReviewed } from "./scenes/VerifiedReviewed";
import { BookWithConfidence } from "./scenes/BookWithConfidence";

export const HandbyWelcome: React.FC = () => {
  const frame = useCurrentFrame();

  // Global fade out for seamless loop bridge (frames 270-300)
  const loopFade = interpolate(frame, [270, 300], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade in at start
  const introFade = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #0F172A 0%, #1E3A8A 100%)",
      }}
    >
      <AbsoluteFill style={{ opacity: introFade * loopFade }}>
        {/* Scene 1: Find Local Experts — frames 0-89 */}
        <Sequence from={0} durationInFrames={90}>
          <FindExperts />
        </Sequence>

        {/* Scene 2: Verified & Reviewed — frames 90-189 */}
        <Sequence from={90} durationInFrames={100}>
          <VerifiedReviewed />
        </Sequence>

        {/* Scene 3: Book With Confidence — frames 190-270 */}
        <Sequence from={190} durationInFrames={80}>
          <BookWithConfidence />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
