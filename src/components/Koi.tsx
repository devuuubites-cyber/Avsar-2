import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { patchKoiMaterial, type KoiUniforms } from "../shaders/patchKoiMaterial";
import { sharedRefs } from "../rigs/sharedRefs";

const KOI_URL = "/models/koi.glb";

const tmpTarget = new THREE.Vector3();
const tmpForward = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpEuler = new THREE.Euler();
const tmpLookMatrix = new THREE.Matrix4();
const tmpUp = new THREE.Vector3(0, 1, 0);

/**
 * Generates a non-repeating wander target by stacking incommensurate
 * low-frequency sines on each axis. The fish chases this softly via a
 * critically-damped spring; lateral velocity drives the body's `uTurn`
 * so the spine bends into the corner.
 */
export function Koi() {
  const gltf = useGLTF(KOI_URL);
  const groupRef = useRef<THREE.Group>(null!);
  const velRef = useRef(new THREE.Vector3());
  const headingRef = useRef(new THREE.Quaternion());
  const uniformsRef = useRef<KoiUniforms | null>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null);

  // Clone so we never mutate the cached source mesh.
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        const src = mesh.material as THREE.MeshStandardMaterial;
        const mat = src.clone();
        materialRef.current = mat;
        uniformsRef.current = patchKoiMaterial(mat, { headX: 3.2, tailX: -3.1 });
        mesh.material = mat;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
  }, [scene]);

  useFrame((state, dt) => {
    const g = groupRef.current;
    if (!g) return;

    const t = state.clock.elapsedTime;

    // Procedural wander target — three incommensurate sines per axis so
    // the orbit never repeats inside a viewing session.
    const radius = 3.4;
    tmpTarget.set(
      Math.sin(t * 0.13) * radius + Math.sin(t * 0.041) * radius * 0.45,
      0.25 + Math.sin(t * 0.17 + 1.7) * 0.55,
      Math.cos(t * 0.11) * radius * 0.55 + Math.sin(t * 0.061 + 0.5) * 1.2,
    );

    // Pull a small amount toward the cursor intent — curiosity, not chase.
    tmpTarget.lerp(sharedRefs.cursorIntent, 0.08);

    // Spring chase. Acceleration proportional to (target - position),
    // damped by current velocity. Limits keep the koi from snapping.
    const stiffness = 1.6;
    const damping = 1.7;
    const ax = (tmpTarget.x - g.position.x) * stiffness - velRef.current.x * damping;
    const ay = (tmpTarget.y - g.position.y) * stiffness - velRef.current.y * damping;
    const az = (tmpTarget.z - g.position.z) * stiffness - velRef.current.z * damping;
    velRef.current.x += ax * dt;
    velRef.current.y += ay * dt;
    velRef.current.z += az * dt;
    // Soft speed cap.
    const v = velRef.current.length();
    const vMax = 2.2;
    if (v > vMax) velRef.current.multiplyScalar(vMax / v);

    g.position.addScaledVector(velRef.current, dt);

    // Heading: face direction of velocity, but dampened so the fish
    // doesn't whip around at low speeds.
    tmpForward.copy(velRef.current);
    if (tmpForward.lengthSq() > 0.0008) {
      tmpForward.normalize();
      // Mesh's head points +X locally. We want head to align with velocity.
      // Build a lookAt-style quat using +X as forward.
      const fx = tmpForward.x;
      const fy = tmpForward.y;
      const fz = tmpForward.z;
      tmpLookMatrix.lookAt(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(-fx, -fy, -fz),
        tmpUp,
      );
      tmpQuat.setFromRotationMatrix(tmpLookMatrix);
      // The matrix above orients -Z to forward; rotate so +X is forward.
      const xToZ = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.PI / 2,
      );
      tmpQuat.multiply(xToZ);
      headingRef.current.slerp(tmpQuat, Math.min(1, dt * 2.2));
      g.quaternion.copy(headingRef.current);
    }

    // Compute local-space lateral velocity to bend the spine.
    tmpEuler.setFromQuaternion(g.quaternion, "YXZ");
    const localLateral = velRef.current.x * Math.cos(tmpEuler.y) -
                          velRef.current.z * Math.sin(tmpEuler.y);

    // Entrance fade — starts black, reveals over ~3s after a short beat.
    const startDelay = 0.5;
    const fadeIn = 3.2;
    const targetEntrance = Math.min(1, Math.max(0, (t - startDelay) / fadeIn));
    sharedRefs.entrance += (targetEntrance - sharedRefs.entrance) * Math.min(1, dt * 1.6);

    // Push to shader.
    if (uniformsRef.current) {
      uniformsRef.current.uTime.value = t;
      uniformsRef.current.uTurn.value = THREE.MathUtils.clamp(localLateral * 0.32, -0.9, 0.9);
      uniformsRef.current.uEntrance.value = sharedRefs.entrance;
    }

    // Publish position for camera + future phase choreography.
    sharedRefs.koiPosition.copy(g.position);
  });

  return <primitive ref={groupRef} object={scene} position={[0.6, 0.2, 0]} />;
}

useGLTF.preload(KOI_URL);
