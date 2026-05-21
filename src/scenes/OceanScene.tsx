import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { CameraRig } from "../rigs/CameraRig";
import { Phase1Koi } from "./phases/Phase1Koi";

export function OceanScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0.3, 0.55, 3.4], fov: 48, near: 0.05, far: 200 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      {/* Pale lavender fog at distance — gives atmospheric perspective on
          the hill silhouettes without flattening the foreground. */}
      <fog attach="fog" args={["#e8c8de", 10, 36]} />

      <CameraRig />

      <Phase1Koi />

      <EffectComposer multisampling={0}>
        {/* Higher luminanceThreshold so soft pastel tones don't bloom out;
            only the brightest spheres + rim highlights bloom. */}
        <Bloom intensity={0.45} luminanceThreshold={0.7} luminanceSmoothing={0.5} mipmapBlur />
        <Vignette eskil={false} offset={0.4} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}
