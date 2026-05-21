import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SPHERES = [
  { pos: [-2.6, 0.55, -0.4], scale: 0.40, seed: 0.0 },
  { pos: [ 2.4, 0.30, -0.6], scale: 0.34, seed: 1.3 },
  { pos: [-3.6, 1.10, -3.2], scale: 0.55, seed: 2.7 },
  { pos: [ 3.3, 0.85, -4.0], scale: 0.48, seed: 0.6 },
] as const;

/**
 * Floating refractive spheres. MeshPhysicalMaterial transmission gives
 * real refraction through the glass volume; postprocessing reads them
 * correctly because R3F renders transmission to a private buffer first.
 */
export function CrystalSpheres() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const basePositions = useMemo(
    () => SPHERES.map((s) => new THREE.Vector3().fromArray(s.pos)),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    refs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const base = basePositions[i];
      const seed = SPHERES[i].seed;
      mesh.position.x = base.x + Math.sin(t * 0.31 + seed) * 0.07;
      mesh.position.y = base.y + Math.sin(t * 0.45 + seed * 1.7) * 0.09;
      mesh.position.z = base.z + Math.sin(t * 0.22 + seed * 0.5) * 0.04;
      mesh.rotation.y = t * 0.12 + seed;
    });
  });

  return (
    <group>
      {SPHERES.map((s, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          position={s.pos as unknown as [number, number, number]}
          scale={s.scale}
        >
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhysicalMaterial
            transmission={1}
            thickness={1.2}
            ior={1.45}
            roughness={0}
            metalness={0}
            clearcoat={1}
            clearcoatRoughness={0}
            attenuationColor="#fde2ec"
            attenuationDistance={2.4}
            color="#ffffff"
          />
        </mesh>
      ))}
    </group>
  );
}
