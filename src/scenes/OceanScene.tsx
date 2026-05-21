import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { CameraRig } from "../rigs/CameraRig";
import { Phase1Koi } from "./phases/Phase1Koi";

export function OceanScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0.3, 6], fov: 52, near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#04060c"]} />
      <fog attach="fog" args={["#04060c", 6, 32]} />

      <CameraRig />

      <Phase1Koi />

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.85} luminanceThreshold={0.18} luminanceSmoothing={0.42} mipmapBlur />
        <Vignette eskil={false} offset={0.32} darkness={0.88} />
      </EffectComposer>
    </Canvas>
  );
}
