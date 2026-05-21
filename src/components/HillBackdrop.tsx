import { useMemo } from "react";
import * as THREE from "three";

type Band = { z: number; y: number; height: number; width: number; color: string; undulation: number };

const BANDS: Band[] = [
  { z: -7,  y: 0.3,  height: 4.5, width: 38, color: "#a86291", undulation: 0.85 },
  { z: -13, y: 0.7,  height: 3.8, width: 48, color: "#c089ad", undulation: 0.65 },
  { z: -22, y: 1.1,  height: 3.0, width: 58, color: "#dca9c5", undulation: 0.45 },
];

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform float uUndulation;

  void main() {
    // Layered sines form an undulating hill horizon.
    float horizon = 0.62
      + sin(vUv.x * 3.5) * 0.05 * uUndulation
      + sin(vUv.x * 8.7 + 1.3) * 0.022 * uUndulation
      + sin(vUv.x * 17.3 + 0.4) * 0.011 * uUndulation;

    // Soft anti-alias around the horizon edge.
    float mask = smoothstep(horizon + 0.012, horizon - 0.012, vUv.y);

    // Slight vertical shading so the band has some depth.
    vec3 col = mix(uColor * 0.78, uColor, smoothstep(0.0, horizon, vUv.y));

    // Atmospheric grass-haze fade near the silhouette edge.
    float edgeHaze = smoothstep(horizon - 0.06, horizon, vUv.y);
    col = mix(col, col * 1.12, edgeHaze);

    gl_FragColor = vec4(col, mask);
  }
`;

/** Three layered hill silhouette quads receding into atmospheric fog. */
export function HillBackdrop() {
  const materials = useMemo(
    () =>
      BANDS.map(
        (b) =>
          new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
              uColor: { value: new THREE.Color(b.color) },
              uUndulation: { value: b.undulation },
            },
            vertexShader: VERT,
            fragmentShader: FRAG,
          }),
      ),
    [],
  );

  return (
    <group renderOrder={-5}>
      {BANDS.map((b, i) => (
        <mesh key={i} position={[0, b.y, b.z]} material={materials[i]}>
          <planeGeometry args={[b.width, b.height]} />
        </mesh>
      ))}
    </group>
  );
}
