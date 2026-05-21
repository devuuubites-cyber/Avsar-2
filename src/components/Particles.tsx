import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const SUSPENDED_COUNT = 720;
const BUBBLE_COUNT = 80;

function makePositions(count: number, spread: THREE.Vector3): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3 + 0] = (Math.random() - 0.5) * spread.x;
    arr[i * 3 + 1] = (Math.random() - 0.5) * spread.y;
    arr[i * 3 + 2] = (Math.random() - 0.5) * spread.z;
  }
  return arr;
}

function makeSeeds(count: number): Float32Array {
  const arr = new Float32Array(count);
  for (let i = 0; i < count; i++) arr[i] = Math.random() * 1000;
  return arr;
}

/** Suspended dust + slow rising bubbles. Cheap shader-driven motion. */
export function Particles() {
  const dustRef = useRef<THREE.Points>(null!);
  const bubbleRef = useRef<THREE.Points>(null!);
  const dustMatRef = useRef<THREE.ShaderMaterial>(null!);
  const bubbleMatRef = useRef<THREE.ShaderMaterial>(null!);

  const dustGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(makePositions(SUSPENDED_COUNT, new THREE.Vector3(22, 12, 22)), 3),
    );
    g.setAttribute("aSeed", new THREE.BufferAttribute(makeSeeds(SUSPENDED_COUNT), 1));
    return g;
  }, []);

  const bubbleGeom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(makePositions(BUBBLE_COUNT, new THREE.Vector3(18, 10, 14)), 3),
    );
    g.setAttribute("aSeed", new THREE.BufferAttribute(makeSeeds(BUBBLE_COUNT), 1));
    return g;
  }, []);

  const dustMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("#9fc4ff") },
          uSize: { value: 1.4 },
        },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime;
          uniform float uSize;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            float drift = sin(uTime * 0.18 + aSeed) * 0.35;
            p.x += sin(uTime * 0.13 + aSeed * 1.7) * 0.4;
            p.y += drift;
            p.z += cos(uTime * 0.11 + aSeed * 0.9) * 0.35;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = uSize * (320.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            vAlpha = 0.18 + 0.12 * sin(uTime * 0.7 + aSeed);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(uColor, a * vAlpha);
          }
        `,
      }),
    [],
  );

  const bubbleMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color("#dff0ff") },
          uSize: { value: 2.2 },
        },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime;
          uniform float uSize;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            float yT = mod(uTime * 0.25 + aSeed * 0.31, 12.0) - 6.0;
            p.y = yT;
            p.x += sin(uTime * 0.6 + aSeed) * 0.18;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_PointSize = uSize * (260.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
            float life = (yT + 6.0) / 12.0; // 0..1
            vAlpha = smoothstep(0.0, 0.15, life) * (1.0 - smoothstep(0.7, 1.0, life));
            vAlpha *= 0.45;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying float vAlpha;
          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            float ring = smoothstep(0.5, 0.42, d) - smoothstep(0.42, 0.34, d);
            float core = smoothstep(0.34, 0.0, d) * 0.35;
            gl_FragColor = vec4(uColor, (ring + core) * vAlpha);
          }
        `,
      }),
    [],
  );

  dustMatRef.current = dustMat;
  bubbleMatRef.current = bubbleMat;

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    dustMat.uniforms.uTime.value = t;
    bubbleMat.uniforms.uTime.value = t;
  });

  return (
    <group>
      <points ref={dustRef} geometry={dustGeom} material={dustMat} />
      <points ref={bubbleRef} geometry={bubbleGeom} material={bubbleMat} />
    </group>
  );
}
