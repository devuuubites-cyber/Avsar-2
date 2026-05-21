import { MeshReflectorMaterial } from "@react-three/drei";

/**
 * Reflective glass-water plane at y=0. Mirror at 0.92 with subtle blur
 * + a slow distortion for surface micro-ripple. Color tinted pink-cream
 * so reflections retain the dawn palette even where mirroring is weak.
 */
export function WaterPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[80, 80]} />
      <MeshReflectorMaterial
        resolution={512}
        blur={[260, 120]}
        mixBlur={1.1}
        mirror={0.92}
        mixStrength={0.85}
        color="#e6c4d3"
        roughness={0.65}
        metalness={0.05}
        distortion={0.18}
        depthScale={0.6}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
      />
    </mesh>
  );
}
