import * as THREE from 'three';
import { simplex3, rotate2d } from './glsl.js';
import { ghostShape, networkShape, textShape, databaseShape, globeShape, cloudShape } from './shapes.js';

// ghost → neural network → </> → database → integration globe → cloud
export const SHAPE_COUNT = 6;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uScatter;
  uniform float uOpacity;
  uniform vec3 uMouse;
  uniform float uMouseStrength;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  attribute vec3 aS1;
  attribute vec3 aS2;
  attribute vec3 aS3;
  attribute vec3 aS4;
  attribute vec3 aS5;
  attribute vec4 aRnd;

  varying vec3 vColor;
  varying float vAlpha;

  ${simplex3}
  ${rotate2d}

  vec3 shape(int i) {
    if (i == 0) return position;
    if (i == 1) return aS1;
    if (i == 2) return aS2;
    if (i == 3) return aS3;
    if (i == 4) return aS4;
    return aS5;
  }

  // dense shapes get dimmer particles so additive blending never saturates
  float density(int i) {
    if (i == 0) return 0.2;
    if (i == 1) return 0.75;
    if (i == 2) return 0.7;
    if (i == 3) return 0.8;
    return 1.0;
  }

  vec3 xform(vec3 p, int i) {
    float t = uTime;
    if (i == 1) {
      p.xz = rot2(sin(t * 0.25) * 0.45) * p.xz;
      p.yz = rot2(0.1) * p.yz;
    } else if (i == 2) {
      p.z += sin(p.x * 1.4 + t * 1.5) * 0.12;
      p.y += sin(p.x * 0.9 + t * 1.2) * 0.04;
    } else if (i == 3) {
      p.xz = rot2(t * 0.25) * p.xz;
      p.yz = rot2(0.42) * p.yz;
    } else if (i == 4) {
      p.xz = rot2(t * 0.16) * p.xz;
      p.yz = rot2(0.22) * p.yz;
    } else if (i == 5) {
      p.xz = rot2(sin(t * 0.3) * 0.35) * p.xz;
      p.y += sin(t * 0.8) * 0.06;
    }
    return p;
  }

  void main() {
    float m = clamp(uMorph, 0.0, ${(SHAPE_COUNT - 1).toFixed(1)});
    float fi = min(floor(m), ${(SHAPE_COUNT - 2).toFixed(1)});
    float f = m - fi;
    int i0 = int(fi);
    int i1 = i0 + 1;
    float delay = aRnd.y * 0.35;
    float t = smoothstep(delay, delay + 0.65, f);

    vec3 a = xform(shape(i0), i0);
    vec3 b = xform(shape(i1), i1);
    vec3 p = mix(a, b, t);

    // turbulence peaks mid-transition: the swarm "boils" between forms
    float mid = sin(t * 3.14159265);
    vec3 q = p * 0.38 + vec3(0.0, uTime * 0.09, aRnd.z);
    vec3 turb = vec3(snoise(q), snoise(q + 17.3), snoise(q + 41.7));
    p += turb * (mid * 1.15 + 0.035);

    // explode outward when leaving the section
    p += normalize(p + vec3(0.0001)) * uScatter * (1.5 + aRnd.x * 7.0) + turb * uScatter * 2.5;

    // idle shimmer
    p += vec3(sin(uTime * 0.7 + aRnd.z * 6.28), cos(uTime * 0.6 + aRnd.w * 6.28), sin(uTime * 0.5 + aRnd.z * 12.0)) * 0.012;

    vec4 wp = modelMatrix * vec4(p, 1.0);

    // the cursor parts the swarm
    vec3 toP = wp.xyz - uMouse;
    float md = length(toP.xy);
    wp.xyz += normalize(toP + vec3(0.0001)) * smoothstep(1.15, 0.0, md) * uMouseStrength * 0.6;

    vec4 mv = viewMatrix * wp;
    gl_Position = projectionMatrix * mv;

    float size = uSize * (0.35 + aRnd.x * aRnd.x * 1.35) * (1.0 + mid * 0.5) * mix(i0 == 0 ? 0.7 : 1.0, 1.0, t);
    gl_PointSize = size * uPixelRatio / -mv.z;

    float g = clamp(p.y * 0.22 + 0.5, 0.0, 1.0);
    vec3 col = mix(uColorA, uColorB, clamp(aRnd.w * 0.7 + g * 0.5 - 0.1, 0.0, 1.0));
    col = mix(col, uColorC, step(0.94, aRnd.w));

    // per-shape life: signals racing through the network, a scan sweeping the database
    float wNet = (i0 == 1 ? 1.0 - t : 0.0) + (i1 == 1 ? t : 0.0);
    float wDb = (i0 == 3 ? 1.0 - t : 0.0) + (i1 == 3 ? t : 0.0);
    float pulse = pow(max(sin(p.x * 2.2 - uTime * 3.2), 0.0), 14.0);
    float scan = exp(-pow((p.y - (1.25 - mod(uTime * 0.9, 2.9))) * 7.0, 2.0));
    col *= 1.0 + mid * 0.9 + pulse * wNet * 2.2 + scan * wDb * 1.8;

    vColor = col;
    vAlpha = uOpacity * (1.0 - uScatter * 0.9) * (0.45 + 0.55 * aRnd.z) * mix(density(i0), density(i1), t);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(1.0 - d * 2.0, 1.6) + smoothstep(0.14, 0.0, d) * 0.5;
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

export default class MorphParticles {
  constructor(count = 24000, { colors = ['#34d399', '#22d3ee', '#fcd34d'], codeFont = '800 300px monospace' } = {}) {
    this.count = count;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(ghostShape(count), 3));
    geometry.setAttribute('aS1', new THREE.BufferAttribute(networkShape(count), 3));
    geometry.setAttribute('aS2', new THREE.BufferAttribute(textShape(count, '</>', { font: codeFont, width: 4.4 }), 3));
    geometry.setAttribute('aS3', new THREE.BufferAttribute(databaseShape(count), 3));
    geometry.setAttribute('aS4', new THREE.BufferAttribute(globeShape(count), 3));
    geometry.setAttribute('aS5', new THREE.BufferAttribute(cloudShape(count), 3));
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
    geometry.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));

    this.uniforms = {
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uSize: { value: 30 },
      uPixelRatio: { value: 1 },
      uScatter: { value: 0 },
      uOpacity: { value: 0 },
      uMouse: { value: new THREE.Vector3(99, 99, 0) },
      uMouseStrength: { value: 1 },
      uColorA: { value: new THREE.Color(colors[0]) },
      uColorB: { value: new THREE.Color(colors[1]) },
      uColorC: { value: new THREE.Color(colors[2]) },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.rotX = 0;
    this.rotY = 0;
  }

  update(time, dt, mouse) {
    this.uniforms.uTime.value = time;
    const k = 1 - Math.exp(-dt * 2.5);
    this.rotY += (mouse.x * 0.35 - this.rotY) * k;
    this.rotX += (-mouse.y * 0.2 - this.rotX) * k;
    this.points.rotation.set(this.rotX, this.rotY, 0);
    this.points.visible = this.uniforms.uOpacity.value > 0.001;
  }
}
