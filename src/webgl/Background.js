import * as THREE from 'three';
import { simplex3 } from './glsl.js';

// Full-screen, slowly churning spectral fog with a soft "lantern" that follows the cursor.
export default class Background {
  constructor() {
    this.uniforms = {
      uTime: { value: 0 },
      uAspect: { value: 1 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uColorA: { value: new THREE.Color('#03040a') },
      uColorB: { value: new THREE.Color('#0d1030') },
      uColorC: { value: new THREE.Color('#3a5bff') },
      uLantern: { value: 1 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      depthTest: false,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.9999, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uAspect;
        uniform float uScroll;
        uniform float uLantern;
        uniform vec2 uMouse;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        varying vec2 vUv;
        ${simplex3}
        float fbm(vec3 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 4; i++) { v += a * snoise(p); p *= 2.03; a *= 0.5; }
          return v;
        }
        void main() {
          vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
          float t = uTime * 0.035;
          float n = fbm(vec3(p * 1.1, t + uScroll * 0.12));
          float n2 = fbm(vec3(p * 2.2 + n * 0.9, t * 1.7 - uScroll * 0.05));

          vec3 col = mix(uColorA, uColorB, smoothstep(-0.55, 0.85, n + vUv.y * 0.35));
          col = mix(col, uColorC, smoothstep(0.25, 0.95, n2) * 0.22);

          // lantern: soft light that follows the cursor and reveals the fog
          vec2 m = uMouse * 0.5 * vec2(uAspect, 1.0);
          float d = length(p - m);
          col += uColorC * smoothstep(0.75, 0.0, d) * (0.06 + 0.08 * smoothstep(-0.3, 0.8, n2)) * uLantern;

          // deep vignette
          col *= smoothstep(1.35, 0.15, length(p * vec2(0.85, 1.0)));
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -1000;
  }

  update(time, mouse, scroll) {
    this.uniforms.uTime.value = time;
    this.uniforms.uMouse.value.copy(mouse);
    this.uniforms.uScroll.value = scroll;
  }

  resize(aspect) {
    this.uniforms.uAspect.value = aspect;
  }
}
