import { Suspense } from "react";
import { Environment } from "@react-three/drei";
import { Koi } from "../../components/Koi";
import { Particles } from "../../components/Particles";
import { SkyBackground } from "../../components/SkyBackground";
import { HillBackdrop } from "../../components/HillBackdrop";
import { WaterPlane } from "../../components/WaterPlane";
import { CrystalSpheres } from "../../components/CrystalSpheres";
import { useCursorIntent } from "../../hooks/useCursorIntent";

/**
 * Phase 1 — pastel dream-surface hero, matching the peachweb reference.
 * Fish hovers above a reflective water plane; receding hill silhouettes
 * fade into a warm gradient sky; refractive crystal spheres float at
 * varied depths; soft suspended dust completes the air.
 */
export function Phase1Koi() {
  useCursorIntent(0);
  return (
    <group>
      <SkyBackground />

      {/* Drei sunset HDRI feeds warm reflections on the koi's metalwork
          and on the crystal spheres' interior refraction. */}
      <Environment preset="sunset" environmentIntensity={0.55} />

      {/* Soft warm key from upper-back-left, cool fill from the front. */}
      <ambientLight intensity={0.55} color="#fbe8ea" />
      <directionalLight position={[-2.5, 5, -1]} intensity={1.2} color="#ffe4d2" />
      <directionalLight position={[1.2, 2, 3]} intensity={0.35} color="#d6c7ff" />

      <HillBackdrop />
      <WaterPlane />
      <CrystalSpheres />
      <Particles />

      <Suspense fallback={null}>
        <Koi />
      </Suspense>
    </group>
  );
}
