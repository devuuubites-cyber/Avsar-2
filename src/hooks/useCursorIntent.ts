import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { sharedRefs } from "../rigs/sharedRefs";

const ndc = new THREE.Vector2(0, 0);
const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const ray = new THREE.Raycaster();
const out = new THREE.Vector3();

/**
 * Dampened cursor curiosity. Maps pointer NDC to a world point on a
 * plane at `targetZ`, then low-pass filters into `sharedRefs.cursorIntent`.
 * Returns a ref to the same vector for ergonomic local use.
 */
export function useCursorIntent(targetZ = 0) {
  const camera = useThree((s) => s.camera);
  const ref = useRef(sharedRefs.cursorIntent);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      ndc.x = (e.clientX / window.innerWidth) * 2 - 1;
      ndc.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, dt) => {
    ray.setFromCamera(ndc, camera);
    plane.constant = -targetZ;
    if (ray.ray.intersectPlane(plane, out)) {
      sharedRefs.cursorIntent.lerp(out, Math.min(1, dt * 1.6));
    }
  });

  return ref;
}
