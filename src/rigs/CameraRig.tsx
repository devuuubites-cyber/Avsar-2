import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useScrollState } from "./ScrollRig";

/**
 * Single camera rig. Phases 1-4 (red arrow): vertical descent.
 * Phase 5 (green arrow): pivots to forward+upward swim through the seabed.
 * Turn A wires only the descent stub; the pivot lands in Turn E.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const scroll = useScrollState();
  const targetY = useRef(0);

  useFrame((_, dt) => {
    const p = scroll.progress;
    targetY.current = -p * 10;
    camera.position.y += (targetY.current - camera.position.y) * Math.min(1, dt * 4);
    camera.lookAt(0, camera.position.y - 1, -5);
  });

  return null;
}
