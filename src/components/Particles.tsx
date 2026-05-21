import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const DUST_COUNT = 320;

function makePositions(count: number, spread: THREE.Vector3, yMin: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3 + 0] = (Math.random() - 0.5) * spread.x;
    arr[i * 3 + 1] = yMin + Math.random() * spread.y;
    arr[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
  }
  return arr;
}

function makeSeeds(count: number): Float32Array {
  const arr = new Float32Array(count);
  for (let i = 0; i < count; i++) arr[i] = Math.random() * 1000;
  return arr;
}

/** Airy suspended dust in the dawn space above the water plane. */
export function Particles() {
  const ref = useRef<THREE.Points>(null!);

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(
        makePositions(DUST_COUNT, new THREE.Vector3(16, 4.5, 14), 0.15),
        3,
      ),
    );
    g.setAttribute("aSeed", new THREE.BufferAttribute(makeSeeds(DUST_COUNT), 1));
    return g;
  }, []);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("#ffeef1") },
          uSize: { value: 1.6 },
        },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime;
          uniform float uSize;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            p.x += sin(uTime * 0.12 + aSeed * 1.7) * 0.5;
            p.y += sin(uTime * 0.16 + aSeed) * 0.35;
            p.z += cos(uTime * 0.10 + aSeed * 0.9) * 0.45;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = uSize * (320.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vAlpha = 0.10 + 0.10 * sin(uTime * 0.6 + aSeed);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float a = smoothstep(0.5, 0.0, length(uv));
            gl_FragColor = vec4(uColor, a * vAlpha);
          }
        `,
      }),
    [],
  );

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <points ref={ref} geometry={geom} material={mat} />;
}
