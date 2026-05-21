import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { CameraRig } from "../rigs/CameraRig";

export function OceanScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 6], fov: 55, near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#04060c"]} />
      <fog attach="fog" args={["#04060c", 8, 40]} />

      <ambientLight intensity={0.15} />
      <directionalLight position={[2, 6, 3]} intensity={0.4} color="#9ec8ff" />

      <CameraRig />

      <EffectComposer multisampling={0}>
        <Bloom intensity={0.6} luminanceThreshold={0.2} luminanceSmoothing={0.4} mipmapBlur />
        <Vignette eskil={false} offset={0.35} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
