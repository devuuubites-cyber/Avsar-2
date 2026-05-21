import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useScrollState } from "./ScrollRig";
import { sharedRefs } from "./sharedRefs";

const tmpDesired = new THREE.Vector3();
const tmpLookAt = new THREE.Vector3();

/**
 * Phase-aware camera. Phase 1 frames the koi hero close-in with the
 * water plane occupying the bottom third (camera looks slightly down).
 * Subtle buoyant drift; no aggressive moves. Subsequent phases extend
 * this rig in Turns C-E (descent + green-arrow swim pivot).
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const scroll = useScrollState();
  const initRef = useRef(false);

  useFrame((state, dt) => {
    const p = scroll.progress;
    const t = state.clock.elapsedTime;

    // Phase-1 base camera position. Drifts slightly forward as scroll
    // progresses within phase 1; subtle X sway + Y buoyancy.
    const phase1T = Math.min(1, p / 0.2);
    tmpDesired.set(
      0.25 + Math.sin(t * 0.18) * 0.18,
      0.62 + Math.sin(t * 0.23 + 1.2) * 0.06,
      3.5 - phase1T * 0.6,
    );

    if (!initRef.current) {
      camera.position.copy(tmpDesired);
      initRef.current = true;
    } else {
      camera.position.lerp(tmpDesired, Math.min(1, dt * 1.1));
    }

    // Look slightly above the koi, biased downward to leave room for
    // the water reflection in the bottom third of frame.
    tmpLookAt.copy(sharedRefs.koiPosition);
    tmpLookAt.y -= 0.05;
    camera.lookAt(tmpLookAt);
  });

  return null;
}
