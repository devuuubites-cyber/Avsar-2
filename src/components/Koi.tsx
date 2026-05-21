import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { patchKoiMaterial, type KoiUniforms } from "../shaders/patchKoiMaterial";
import { sharedRefs } from "../rigs/sharedRefs";

const KOI_URL = "/models/koi.glb";

const tmpTarget = new THREE.Vector3();

function angleLerp(current: number, target: number, alpha: number): number {
  let diff = target - current;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return current + diff * alpha;
}

/**
 * Hero koi. Procedural wander on three incommensurate sines per axis;
 * critically-damped spring chase; soft speed cap. Heading is a simple
 * yaw lerp (rotation.y from atan2 of velocity); pitch lerps from
 * normalized vertical velocity so dives read as nose-down. The fish is
 * gated above water (y > 0.18) so it hovers and dips like the peachweb
 * reference.
 *
 * The body shader (patchKoiMaterial) handles spine sine deformation,
 * lateral turn-bend, fresnel rim, and the entrance fade gate.
 */
export function Koi() {
  const gltf = useGLTF(KOI_URL);
  const groupRef = useRef<THREE.Group>(null!);
  const velRef = useRef(new THREE.Vector3());
  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const uniformsRef = useRef<KoiUniforms | null>(null);

  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        const src = mesh.material as THREE.MeshStandardMaterial;
        const mat = src.clone();
        uniformsRef.current = patchKoiMaterial(mat, { headX: 3.2, tailX: -3.1 });
        // Shader is keyed to body-axis sweep; bump amplitudes for visible
        // gesture and slow the cadence to graceful koi pacing.
        uniformsRef.current.uSwimAmp.value = 1.0;
        uniformsRef.current.uSwimFreq.value = 1.5;
        uniformsRef.current.uRimColor.value.set("#ffd6e3");
        uniformsRef.current.uRimPower.value = 2.2;
        uniformsRef.current.uRimStrength.value = 1.1;
        mesh.material = mat;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    if (groupRef.current) groupRef.current.rotation.order = "YXZ";
  }, [scene]);

  useFrame((state, dt) => {
    const g = groupRef.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    // Cinematic wander target — small footprint so the fish stays in
    // hero framing. Y kept above water with a slow dip toward surface.
    const radius = 2.1;
    const yBase = 0.7 + Math.sin(t * 0.17 + 1.7) * 0.35
                + Math.sin(t * 0.041 + 0.5) * 0.18;
    tmpTarget.set(
      Math.sin(t * 0.16) * radius + Math.sin(t * 0.043 + 1.1) * radius * 0.4,
      Math.max(0.32, yBase),
      Math.cos(t * 0.13) * radius * 0.45 + Math.sin(t * 0.07 + 0.5) * 0.6 - 0.3,
    );

    // Subtle cursor curiosity bias.
    tmpTarget.lerp(sharedRefs.cursorIntent, 0.06);

    // Spring chase, lightly damped.
    const stiffness = 1.4;
    const damping = 1.65;
    const ax = (tmpTarget.x - g.position.x) * stiffness - velRef.current.x * damping;
    const ay = (tmpTarget.y - g.position.y) * stiffness - velRef.current.y * damping;
    const az = (tmpTarget.z - g.position.z) * stiffness - velRef.current.z * damping;
    velRef.current.x += ax * dt;
    velRef.current.y += ay * dt;
    velRef.current.z += az * dt;
    const v = velRef.current.length();
    const vMax = 1.8;
    if (v > vMax) velRef.current.multiplyScalar(vMax / v);

    g.position.addScaledVector(velRef.current, dt);
    // Hard floor — never submerge below the water plane.
    if (g.position.y < 0.2) {
      g.position.y = 0.2;
      if (velRef.current.y < 0) velRef.current.y = 0;
    }

    // Heading: yaw lerps to velocity direction, pitch lerps to nose-down
    // proportional to vertical descent. The koi body's local +X is the
    // head, so yaw = atan2(-velZ, velX) under the standard convention.
    const speedH = Math.hypot(velRef.current.x, velRef.current.z);
    if (speedH > 0.02) {
      const targetYaw = Math.atan2(-velRef.current.z, velRef.current.x);
      yawRef.current = angleLerp(yawRef.current, targetYaw, Math.min(1, dt * 2.4));
    }
    if (v > 0.02) {
      const targetPitch = Math.atan2(velRef.current.y, Math.max(0.01, speedH));
      // Cinematic stylization: 0.5x of the literal pitch so the dive
      // reads without the fish standing on its tail.
      pitchRef.current += (targetPitch * -0.5 - pitchRef.current) * Math.min(1, dt * 2.0);
    }
    g.rotation.y = yawRef.current;
    g.rotation.x = pitchRef.current;

    // Local-frame lateral velocity drives the spine bend (uTurn).
    const localLateral = velRef.current.x * Math.cos(yawRef.current) -
                         velRef.current.z * Math.sin(yawRef.current);

    // Entrance fade: a 0.6 s beat then ~3 s reveal.
    const startDelay = 0.6;
    const fadeIn = 3.0;
    const targetEntrance = Math.min(1, Math.max(0, (t - startDelay) / fadeIn));
    sharedRefs.entrance += (targetEntrance - sharedRefs.entrance)
                          * Math.min(1, dt * 1.5);

    if (uniformsRef.current) {
      uniformsRef.current.uTime.value = t;
      uniformsRef.current.uTurn.value = THREE.MathUtils.clamp(localLateral * 0.5, -1.1, 1.1);
      uniformsRef.current.uEntrance.value = sharedRefs.entrance;
    }

    sharedRefs.koiPosition.copy(g.position);
  });

  return (
    <primitive
      ref={groupRef}
      object={scene}
      position={[0.2, 0.55, 0]}
      scale={0.34}
    />
  );
}

useGLTF.preload(KOI_URL);
