import * as THREE from 'three';

// CPU-driven pool of soft smoky wisps: cursor trail, ghost hem trail and "boo" bursts.
export default class Wisps {
  constructor(max = 1400) {
    this.max = max;
    this.head = 0;
    this.pos = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.maxLife = new Float32Array(max).fill(1);
    this.baseSize = new Float32Array(max);
    this.size = new Float32Array(max);
    this.alpha = new Float32Array(max);
    this.tint = new Float32Array(max);
    this.strength = new Float32Array(max);

    const geometry = new THREE.BufferGeometry();
    const attr = (arr, n) => new THREE.BufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
    this.aPos = attr(this.pos, 3);
    this.aSize = attr(this.size, 1);
    this.aAlpha = attr(this.alpha, 1);
    this.aTint = attr(this.tint, 1);
    geometry.setAttribute('position', this.aPos);
    geometry.setAttribute('aSize', this.aSize);
    geometry.setAttribute('aAlpha', this.aAlpha);
    geometry.setAttribute('aTint', this.aTint);

    this.uniforms = {
      uPixelRatio: { value: 1 },
      uColorA: { value: new THREE.Color('#9feaff') },
      uColorB: { value: new THREE.Color('#b9a2ff') },
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uPixelRatio;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        attribute float aSize;
        attribute float aAlpha;
        attribute float aTint;
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = aSize * uPixelRatio * 100.0 / -mv.z;
          vAlpha = aAlpha;
          vColor = mix(uColorA, uColorB, aTint);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        varying vec3 vColor;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = dot(c, c);
          float a = exp(-d * 14.0) - 0.03;
          if (a <= 0.0) discard;
          gl_FragColor = vec4(vColor, a * vAlpha);
        }
      `,
    });

    this.points = new THREE.Points(geometry, material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 6;
  }

  emit(x, y, z, vx, vy, vz, size = 0.8, life = 1.6, tint = Math.random(), strength = 1) {
    const i = this.head;
    this.head = (this.head + 1) % this.max;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx;
    this.vel[i * 3 + 1] = vy;
    this.vel[i * 3 + 2] = vz;
    this.life[i] = life;
    this.maxLife[i] = life;
    this.baseSize[i] = size;
    this.tint[i] = tint;
    this.strength[i] = strength;
  }

  update(dt, time) {
    const drag = Math.pow(0.12, dt);
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) {
        if (this.alpha[i] !== 0) {
          this.alpha[i] = 0;
          this.size[i] = 0;
        }
        continue;
      }
      this.life[i] -= dt;
      const t = 1 - Math.max(this.life[i], 0) / this.maxLife[i];
      const j = i * 3;
      // buoyant swirl
      this.vel[j] += Math.sin(time * 1.7 + i * 0.37) * 0.4 * dt;
      this.vel[j + 1] += 0.55 * dt;
      this.vel[j] *= drag;
      this.vel[j + 1] *= drag;
      this.vel[j + 2] *= drag;
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += this.vel[j + 2] * dt;
      this.alpha[i] = Math.pow(Math.sin(Math.PI * t), 1.2) * 0.2 * this.strength[i];
      this.size[i] = this.baseSize[i] * (0.6 + t * 1.6);
    }
    this.aPos.needsUpdate = true;
    this.aSize.needsUpdate = true;
    this.aAlpha.needsUpdate = true;
    this.aTint.needsUpdate = true;
  }
}
