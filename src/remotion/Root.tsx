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
