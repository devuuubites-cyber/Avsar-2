import { useMemo } from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec3 vWorldDir;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldDir = normalize(worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const FRAG = /* glsl */ `
  varying vec3 vWorldDir;
  uniform vec3 uTop;
  uniform vec3 uMid;
  uniform vec3 uBot;
  void main() {
    float t = clamp(vWorldDir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col = mix(uBot, uMid, smoothstep(0.05, 0.55, t));
    col = mix(col, uTop, smoothstep(0.55, 0.92, t));
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Large back-faced sphere with a vertical gradient. Unaffected by fog. */
export function SkyBackground() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        depthTest: true,
        uniforms: {
          uTop: { value: new THREE.Color("#f8eee2") },
          uMid: { value: new THREE.Color("#e3c6dc") },
          uBot: { value: new THREE.Color("#cb8eb1") },
        },
        vertexShader: VERT,
        fragmentShader: FRAG,
      }),
    [],
  );

  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[60, 32, 16]} />
    </mesh>
  );
}
