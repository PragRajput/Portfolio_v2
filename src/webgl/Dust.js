import * as THREE from 'three';

// Ambient floating motes that drift upward and parallax with the scroll.
export default class Dust {
  constructor(count = 1600) {
    const pos = new Float32Array(count * 3);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 32;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 2] = -14 + Math.random() * 17;
      for (let j = 0; j < 4; j++) rnd[i * 4 + j] = Math.random();
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));

    this.uniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: 26 },
      uVelocity: { value: 0 },
      uColor: { value: new THREE.Color('#bcd4ff') },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uScroll;
        uniform float uPixelRatio;
        uniform float uSize;
        uniform float uVelocity;
        attribute vec4 aRnd;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          float depth = (p.z + 14.0) / 17.0; // 0 far → 1 near
          p.y += uTime * (0.04 + aRnd.y * 0.1) + uScroll * (0.6 + depth * 2.2);
          p.y = mod(p.y + 11.0, 22.0) - 11.0;
          p.x += sin(uTime * 0.21 + aRnd.z * 6.28) * 0.35;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uSize * (0.25 + aRnd.w * aRnd.w) * uPixelRatio * (1.0 + abs(uVelocity) * 0.5) / -mv.z;
          float tw = 0.5 + 0.5 * sin(uTime * (0.8 + aRnd.y * 2.2) + aRnd.z * 40.0);
          vAlpha = (0.15 + 0.85 * tw) * (0.35 + 0.65 * depth);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          float a = smoothstep(0.5, 0.0, d);
          gl_FragColor = vec4(uColor, a * a * vAlpha * 0.7);
        }
      `,
    });

    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
  }

  update(time, scroll, velocity) {
    this.uniforms.uTime.value = time;
    this.uniforms.uScroll.value = scroll;
    this.uniforms.uVelocity.value = velocity;
  }
}
