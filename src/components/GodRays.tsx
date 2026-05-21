import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Cheap god-ray approximation: a few additive cones from above, slow
 * rotation drift on the parent. Avoids true volumetrics; the bloom pass
 * on the composer feathers the edges enough to read as light shafts.
 */
export function GodRays() {
  const groupRef = useRef<THREE.Group>(null!);

  const rays = useMemo(() => {
    const cones: { position: [number, number, number]; scale: number; tilt: number }[] = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      cones.push({
        position: [
          (Math.random() - 0.5) * 10,
          5 + Math.random() * 2,
          (Math.random() - 0.5) * 8 - 2,
        ],
        scale: 1 + Math.random() * 0.8,
        tilt: (Math.random() - 0.5) * 0.5,
      });
    }
    return cones;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uColor: { value: new THREE.Color("#7eb6ff") },
          uIntensity: { value: 0.32 },
        },
        vertexShader: /* glsl */ `
          varying vec3 vLocal;
          void main() {
            vLocal = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uIntensity;
          varying vec3 vLocal;
          void main() {
            // vLocal.y goes from ~0 at bottom to ~-h at top after cone build.
            // The cone we generate is symmetric around y; remap to 0..1 top-to-bottom.
            float vertFade = smoothstep(-3.0, 0.5, vLocal.y);
            float r = length(vec2(vLocal.x, vLocal.z));
            float radial = 1.0 - smoothstep(0.0, 1.2, r);
            float a = vertFade * radial * uIntensity;
            gl_FragColor = vec4(uColor, a);
          }
        `,
      }),
    [],
  );

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    g.rotation.y = Math.sin(state.clock.elapsedTime * 0.06) * 0.18;
    g.rotation.z = Math.sin(state.clock.elapsedTime * 0.04) * 0.05;
  });

  return (
    <group ref={groupRef}>
      {rays.map((c, i) => (
        <mesh key={i} position={c.position} rotation={[Math.PI, c.tilt, 0]}>
          <coneGeometry args={[1.2 * c.scale, 6 * c.scale, 24, 1, true]} />
          <primitive object={mat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}
