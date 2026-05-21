import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollState } from "./ScrollRig";
import { sharedRefs } from "./sharedRefs";

const tmpBase = new THREE.Vector3();
const tmpDesired = new THREE.Vector3();
const tmpLookAt = new THREE.Vector3();

/**
 * Phase-aware camera.
 *
 *  Phase 1 (scroll 0..0.20): buoyant drift, framing koi off-center,
 *    cinematic asymmetry, slow underwater float.
 *  Phases 2-4 (0.20..0.78): TBD in Turns C-D.
 *  Pivot window (0.78..0.82): descent → forward+up swim crossfade.
 *  Phase 5 (0.82..1.00): three sub-segments through the seabed (Turn E).
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const scroll = useScrollState();
  const initRef = useRef(false);

  useFrame((state, dt) => {
    const p = scroll.progress;
    const t = state.clock.elapsedTime;

    // Phase-1 base: 6 units back, slightly above. Drifts forward as the
    // user scrolls within phase 1 — pulling us toward the fish.
    const phase1T = Math.min(1, p / 0.2);
    tmpBase.set(
      0.4 + Math.sin(t * 0.16) * 0.45,                 // gentle X sway
      0.55 + Math.sin(t * 0.21 + 1.2) * 0.22,          // vertical buoyancy
      6.2 - phase1T * 1.5 + Math.sin(t * 0.12) * 0.18, // slow push-in
    );

    // Off-center framing: bias camera so koi sits slightly right of center.
    tmpDesired.copy(tmpBase);
    tmpDesired.x -= 0.6;

    if (!initRef.current) {
      camera.position.copy(tmpDesired);
      initRef.current = true;
    } else {
      camera.position.lerp(tmpDesired, Math.min(1, dt * 0.85));
    }

    // Look-at follows koi softly with a slight bias forward, so the
    // koi reads slightly off-axis instead of dead-center.
    tmpLookAt.copy(sharedRefs.koiPosition);
    tmpLookAt.x += 0.2;
    tmpLookAt.y -= 0.05;
    camera.lookAt(tmpLookAt);
  });

  return null;
}
