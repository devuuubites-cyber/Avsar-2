import * as THREE from "three";

/**
 * Module-level singleton bag of mutable refs that span the scene graph.
 * Components write per-frame; rigs read per-frame. Avoids prop-drilling
 * and context churn for high-frequency vector updates.
 */
export const sharedRefs = {
  koiPosition: new THREE.Vector3(0, 0.2, 0),
  cursorIntent: new THREE.Vector3(0, 0, 0),
  entrance: 0,
};
