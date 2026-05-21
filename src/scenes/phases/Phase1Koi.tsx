import { Suspense } from "react";
import { Environment } from "@react-three/drei";
import { Koi } from "../../components/Koi";
import { Particles } from "../../components/Particles";
import { GodRays } from "../../components/GodRays";
import { useCursorIntent } from "../../hooks/useCursorIntent";

/**
 * Phase 1 — the koi-as-soul moment. Drei <Environment> drops in a
 * night HDRI for reflective metalwork on the scales; everything else
 * (lights, atmosphere, hero subject) composes here.
 */
export function Phase1Koi() {
  useCursorIntent(0);
  return (
    <group>
      <Environment preset="night" environmentIntensity={0.45} />

      {/* Soft ambient base so the koi isn't pure silhouette. */}
      <ambientLight intensity={0.08} color="#6da9d8" />

      {/* Key from upper-left (the "light shaft" direction). */}
      <directionalLight
        position={[-3, 7, 2]}
        intensity={0.9}
        color="#a9d5ff"
      />

      {/* Cool rim from below to lift the belly. */}
      <pointLight position={[1, -3, 2]} intensity={0.35} color="#3b6f9d" distance={12} />

      <GodRays />
      <Particles />

      <Suspense fallback={null}>
        <Koi />
      </Suspense>
    </group>
  );
}
