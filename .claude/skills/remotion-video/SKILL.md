# Remotion Video Creation Skill

Create videos programmatically using React with the Remotion framework.

## When to Use
Trigger when: user asks to create, render, or edit videos programmatically, build video templates, animate React components for video output, or work with `remotion`, `@remotion/cli`, `@remotion/player`, `@remotion/renderer`.

## Core Concepts

### Project Structure
```
src/remotion/
  index.ts          // registerRoot(RemotionRoot)
  Root.tsx           // All <Composition> definitions
  videos/            // Individual video components
remotion.config.ts   // CLI/render configuration
```

### Entry File (index.ts)
```typescript
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```

### Root.tsx — Register Compositions
```typescript
import { Composition } from "remotion";
import { MyVideo } from "./videos/MyVideo";

export const RemotionRoot = () => (
  <>
    <Composition
      id="MyVideo"
      component={MyVideo}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ title: "Hello" }}
    />
  </>
);
```

### Video Component Pattern
```typescript
import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate, spring, Sequence } from "remotion";

export const MyVideo: React.FC<{ title: string }> = ({ title }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" });
  const scale = spring({ frame, fps, config: { damping: 10 } });

  return (
    <AbsoluteFill style={{ backgroundColor: "#1E3A8A" }}>
      <Sequence from={0} durationInFrames={60}>
        <h1 style={{ opacity, transform: `scale(${scale})` }}>{title}</h1>
      </Sequence>
      <Sequence from={60}>
        <p>Next scene</p>
      </Sequence>
    </AbsoluteFill>
  );
};
```

## Key APIs

### Animation
- `useCurrentFrame()` — current frame (0-indexed, relative to Sequence)
- `useVideoConfig()` — `{ width, height, fps, durationInFrames, id }`
- `interpolate(input, inputRange, outputRange, options?)` — map values with easing
  - Options: `easing`, `extrapolateLeft: 'clamp'`, `extrapolateRight: 'clamp'`
- `spring({ frame, fps, config?, from?, to?, delay?, durationInFrames? })` — physics animation
  - Config: `{ damping, mass, stiffness, overshootClamping }`
- `interpolateColors(frame, inputRange, colorRange)` — animate between colors
- `Easing.ease()`, `Easing.bezier()`, `Easing.inOut()`, etc.
- `random(seed)` — deterministic pseudo-random (reproducible)

### Layout Components
- `<AbsoluteFill>` — full-size absolute container (flex column)
- `<Sequence from={frame} durationInFrames={n}>` — offset timing, layer scenes
- `<Series>` / `<Series.Sequence durationInFrames={n}>` — auto-sequential scenes
- `<Loop durationInFrames={n} times={3}>` — repeat content
- `<Freeze frame={30}>` — hold at specific frame
- `<Folder name="Group">` — organize compositions in sidebar

### Media
- `<Video src="..." volume={0.5} playbackRate={1} />`
- `<OffthreadVideo src="..." />` — off-thread rendering for effects
- `<Audio src="..." volume={f => interpolate(f, [0,30], [0,1])} />`
- `<Img src={staticFile("image.png")} />` — reference public/ assets
- `staticFile("filename")` — resolve public folder paths

### Async Data Loading
```typescript
import { delayRender, continueRender } from "remotion";

const [data, setData] = useState(null);
useEffect(() => {
  const handle = delayRender("Loading data");
  fetch(url).then(r => r.json()).then(d => {
    setData(d);
    continueRender(handle);
  });
}, []);
```

### Schema Validation (Zod)
```typescript
import { z } from "zod";
import { zColor } from "@remotion/zod-types";

const schema = z.object({
  title: z.string(),
  color: zColor(),
});

<Composition schema={schema} defaultProps={{ title: "Hi", color: "#fff" }} />
```

## Common Patterns

### Fade In/Out
```typescript
const opacity = interpolate(
  frame,
  [0, 30, durationInFrames - 30, durationInFrames],
  [0, 1, 1, 0],
  { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
);
```

### Slide In from Left
```typescript
const translateX = interpolate(frame, [0, 30], [-width, 0], { extrapolateRight: "clamp" });
return <div style={{ transform: `translateX(${translateX}px)` }}>...</div>;
```

### Staggered Items
```typescript
{items.map((item, i) => {
  const delay = i * 10;
  const s = spring({ frame: frame - delay, fps, config: { damping: 12 } });
  return <div key={i} style={{ opacity: s, transform: `translateY(${(1-s)*30}px)` }}>{item}</div>;
})}
```

### Text Typing Effect
```typescript
const chars = Math.floor(interpolate(frame, [0, 60], [0, text.length], { extrapolateRight: "clamp" }));
return <span>{text.slice(0, chars)}</span>;
```

## Rendering

### CLI
```bash
npx remotion studio src/remotion/index.ts          # Preview in browser
npx remotion render src/remotion/index.ts MyVideo out/video.mp4  # Render
npx remotion render --codec=h264 --crf=18          # Quality options
npx remotion still src/remotion/index.ts MyVideo out/thumb.png   # Single frame
```

### Programmatic (Node.js)
```typescript
import { renderMedia, selectComposition } from "@remotion/renderer";
import { bundle } from "@remotion/bundler";

const bundled = await bundle({ entryPoint: "src/remotion/index.ts" });
const composition = await selectComposition({ serveUrl: bundled, id: "MyVideo" });
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: "out/video.mp4",
  onProgress: ({ progress }) => console.log(`${Math.round(progress * 100)}%`),
});
```

## Player (Embed in React/Next.js)
```typescript
import { Player } from "@remotion/player";

<Player
  component={MyVideo}
  durationInFrames={150}
  fps={30}
  compositionWidth={1920}
  compositionHeight={1080}
  inputProps={{ title: "Hello" }}
  controls
  autoPlay
  loop
  style={{ width: "100%" }}
/>
```

### Player Ref
```typescript
const playerRef = useRef<PlayerRef>(null);
playerRef.current?.play();
playerRef.current?.pause();
playerRef.current?.seekTo(60);
```

## Config File (remotion.config.ts)
```typescript
import { Config } from "@remotion/cli/config";

Config.setOverwriteOutput(true);
Config.setCodec("h264");
Config.setCrf(20);
```

## Additional Packages
- `@remotion/transitions` — TransitionSeries for animated scene transitions
- `@remotion/three` — React Three Fiber for 3D in videos
- `@remotion/captions` — SRT/VTT caption rendering
- `@remotion/media-utils` — media duration/metadata utilities
- `@remotion/animation-utils` — `interpolateStyles()`, `makeTransform()`
- `@remotion/zod-types` — Zod validators: `zColor()`, `zTextarea()`

## Best Practices
1. Always use `extrapolateRight: "clamp"` to prevent values overshooting
2. Use `spring()` for natural motion, `interpolate()` for precise control
3. Use `<Sequence>` to organize scenes with relative frame counting
4. Use `delayRender()`/`continueRender()` for async data (fonts, API calls, images)
5. Use `staticFile()` for assets in the public folder
6. Keep compositions pure — same frame = same output (deterministic)
7. Use `random(seed)` instead of `Math.random()` for reproducibility
8. Prefer `<OffthreadVideo>` over `<Video>` for complex compositions
