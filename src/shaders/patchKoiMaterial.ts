import * as THREE from "three";

export type KoiUniforms = {
  uTime: { value: number };
  uHeadX: { value: number };
  uTailX: { value: number };
  uSwimAmp: { value: number };
  uSwimFreq: { value: number };
  uTurn: { value: number };
  uEntrance: { value: number };
  uRimColor: { value: THREE.Color };
  uRimPower: { value: number };
  uRimStrength: { value: number };
};

/**
 * Patches a MeshStandardMaterial in-place to add:
 * - vertex-shader body-chain sine deformation (head→tail wave) with
 *   per-vertex normal rotation to keep lighting roughly correct;
 * - fragment-shader fresnel rim light;
 * - entrance fade gate applied to final color & alpha.
 *
 * Returns the externally-mutable uniforms object — assign to a ref and
 * update `.value` each frame from useFrame.
 */
export function patchKoiMaterial(
  material: THREE.MeshStandardMaterial,
  init: Partial<{ headX: number; tailX: number }> = {},
): KoiUniforms {
  const uniforms: KoiUniforms = {
    uTime: { value: 0 },
    uHeadX: { value: init.headX ?? 3.2 },
    uTailX: { value: init.tailX ?? -3.1 },
    uSwimAmp: { value: 0.22 },
    uSwimFreq: { value: 2.4 },
    uTurn: { value: 0 },
    uEntrance: { value: 0 },
    uRimColor: { value: new THREE.Color("#79c5ff") },
    uRimPower: { value: 2.6 },
    uRimStrength: { value: 0.95 },
  };

  material.transparent = true;
  material.metalness = 0.42;
  material.roughness = 0.34;
  material.emissive = new THREE.Color("#0d2238");
  material.emissiveIntensity = 0.55;
  material.envMapIntensity = 1.25;

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        uniform float uTime;
        uniform float uHeadX;
        uniform float uTailX;
        uniform float uSwimAmp;
        uniform float uSwimFreq;
        uniform float uTurn;

        float koi_bodyT(vec3 pos) {
          return clamp((pos.x - uHeadX) / (uTailX - uHeadX), 0.0, 1.0);
        }
        float koi_swimZ(float bodyT) {
          float phase = uTime * uSwimFreq - bodyT * 5.2;
          return sin(phase) * uSwimAmp * (bodyT * bodyT);
        }
        `,
      )
      .replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `
        float _bodyT = koi_bodyT(position);
        float _swimDeriv = cos(uTime * uSwimFreq - _bodyT * 5.2)
                          * uSwimAmp * 5.2 * (_bodyT * _bodyT);
        float _ang = _swimDeriv * 0.08;
        float _ca = cos(_ang); float _sa = sin(_ang);
        vec3 objectNormal = vec3(
          normal.x * _ca - normal.z * _sa,
          normal.y,
          normal.x * _sa + normal.z * _ca
        );
        #ifdef USE_TANGENT
        vec3 objectTangent = vec3( tangent.xyz );
        #endif
        `,
      )
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `
        float bodyT = koi_bodyT(position);
        float swim = koi_swimZ(bodyT);
        float turnBend = uTurn * (bodyT * bodyT * 0.55);
        vec3 transformed = vec3(position.x, position.y, position.z + swim + turnBend);
        `,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        uniform float uEntrance;
        uniform vec3 uRimColor;
        uniform float uRimPower;
        uniform float uRimStrength;
        `,
      )
      .replace(
        "#include <opaque_fragment>",
        /* glsl */ `
        vec3 _viewDir = normalize(vViewPosition);
        float _rim = pow(
          1.0 - clamp(dot(normalize(vNormal), _viewDir), 0.0, 1.0),
          uRimPower
        );
        outgoingLight += uRimColor * _rim * uRimStrength;
        #include <opaque_fragment>
        `,
      )
      .replace(
        "#include <dithering_fragment>",
        /* glsl */ `
        #include <dithering_fragment>
        gl_FragColor.rgb *= uEntrance;
        gl_FragColor.a *= uEntrance;
        `,
      );
  };

  material.needsUpdate = true;
  return uniforms;
}
