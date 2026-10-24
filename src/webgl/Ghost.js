import * as THREE from 'three';
import gsap from 'gsap';
import { simplex3 } from './glsl.js';

const R = 0.72; // body radius
const H = 0.86; // dome height
export const GHOST_BODY_OFFSET = 0.12; // re-centres the lathe vertically

// Classic ghost silhouette: a dome on a straight body, revolved around Y.
export function createGhostGeometry(radialSegments = 96) {
  const pts = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    pts.push(new THREE.Vector2(R + (1 - t) * (1 - t) * 0.05, -1.1 + t * 1.1));
  }
  for (let i = 1; i <= 36; i++) {
    const a = (i / 36) * Math.PI * 0.5;
    pts.push(new THREE.Vector2(i === 36 ? 0 : Math.cos(a) * R, Math.sin(a) * H));
  }
  return new THREE.LatheGeometry(pts, radialSegments);
}

// Point + normal on the dome surface (front side) for placing facial features.
function domePoint(x, y) {
  const r = R * Math.sqrt(1 - (y / H) ** 2);
  const z = Math.sqrt(Math.max(r * r - x * x, 0));
  const normal = new THREE.Vector3(x / (R * R), y / (H * H), z / (R * R)).normalize();
  return { position: new THREE.Vector3(x, y, z), normal };
}

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uVelocity;
  uniform float uBoo;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vLocal;

  void main() {
    vec3 p = position;
  #ifndef LIMB
    float ang = atan(p.x, p.z);
    float hem = smoothstep(-0.2, -1.1, p.y);
    float lower = smoothstep(0.25, -1.1, p.y);

    // scalloped, rolling hem
    float wave = sin(ang * 6.0 + uTime * 3.2) * 0.6 + sin(ang * 3.0 - uTime * 2.1 + 1.3) * 0.4;
    p.y += wave * 0.11 * hem * hem;
    p.xz *= 1.0 + hem * (0.16 + 0.05 * sin(uTime * 2.3 + ang * 4.0)) + uBoo * 0.14 * hem;

    // cloth-like lag: the tail trails behind movement
    float lag = lower * lower;
    p.x += (-uVelocity.x * 0.9 + sin(uTime * 1.6 + p.y * 2.4) * 0.07) * lag;
    p.z += (cos(uTime * 1.25 + p.y * 2.0) * 0.07) * lag;
    p.y -= uVelocity.y * 0.35 * lag;

    // breathing
    float breath = sin(uTime * 2.0) * 0.022 + uBoo * 0.06;
    p.xz *= 1.0 + breath;
    p.y *= 1.0 - breath * 0.4;
  #endif
    vLocal = p;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uDissolve;
  uniform float uOpacity;
  uniform float uGlow;
  uniform vec3 uColorCore;
  uniform vec3 uColorRim;
  uniform vec3 uColorDeep;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec3 vLocal;
  ${simplex3}

  void main() {
    vec3 n = normalize(vNormalW);
    if (!gl_FrontFacing) n = -n;
    float ndv = clamp(dot(n, normalize(vViewDir)), 0.0, 1.0);
    float fres = pow(1.0 - ndv, 2.4);

    // slow ectoplasm flowing upward inside the body
    float flow = snoise(vLocal * 1.7 + vec3(0.0, -uTime * 0.35, uTime * 0.12)) * 0.5 + 0.5;
    float wisp = snoise(vLocal * 4.2 + vec3(uTime * 0.15, -uTime * 0.7, 0.0)) * 0.5 + 0.5;

    float light = 0.52 + 0.32 * max(dot(n, normalize(vec3(-0.35, 0.85, 0.55))), 0.0);
    vec3 col = mix(uColorDeep, uColorCore, 0.25 + 0.5 * flow) * light;
    col += uColorCore * pow(wisp, 3.0) * 0.15;
    col += uColorRim * fres * (0.75 + uGlow * 0.6);

    float alpha = mix(0.88, 1.0, fres);
  #ifndef LIMB
    alpha *= mix(1.0, 0.16, smoothstep(-0.55, -1.25, vLocal.y)); // wispy hem
  #endif

    // dissolve into the ether with a burning spectral edge
    float dn = snoise(vLocal * 2.4 + 7.0) * 0.5 + 0.5;
    float thr = uDissolve * 1.25 - 0.12;
    if (dn < thr) discard;
    float edge = (1.0 - smoothstep(thr, thr + 0.09, dn)) * step(0.001, uDissolve);
    col = mix(col, uColorRim * 3.5, edge);
    alpha = max(alpha, edge);

    if (!gl_FrontFacing) { col *= 0.5; alpha *= 0.55; }
    gl_FragColor = vec4(col, alpha * uOpacity);
  }
`;

const blushMaterial = (uniforms) =>
  new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uAlpha;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - 0.5) * 2.0;
        float a = smoothstep(1.0, 0.0, d);
        gl_FragColor = vec4(uColor, a * a * uAlpha);
      }
    `,
  });

export default class Ghost {
  constructor({ core = '#d3dcff', deep = '#6b78d8', rim = '#7cf2ff', blush = '#ff7ac0' } = {}) {
    this.group = new THREE.Group();
    this.inner = new THREE.Group();
    this.body = new THREE.Group();
    this.body.position.y = GHOST_BODY_OFFSET;
    this.group.add(this.inner);
    this.inner.add(this.body);

    this.params = { x: 0, y: 0, z: 0, scale: 1, dissolve: 1, spin: 0, wave: 0, follow: 1 };
    this.pos = new THREE.Vector2();
    this.vel = new THREE.Vector2();
    this.spinOffset = 0;
    this.lookY = 0;
    this.lookX = 0;
    this.hover = 0;
    this.hovered = false;
    this.nextBlink = 2.5;
    this.booing = false;

    this.uniforms = {
      uTime: { value: 0 },
      uVelocity: { value: new THREE.Vector2() },
      uBoo: { value: 0 },
      uDissolve: { value: 1 },
      uOpacity: { value: 1 },
      uGlow: { value: 0 },
      uColorCore: { value: new THREE.Color(core) },
      uColorDeep: { value: new THREE.Color(deep) },
      uColorRim: { value: new THREE.Color(rim) },
    };

    const make = (side, limb = false) =>
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        side,
        transparent: true,
        depthWrite: side === THREE.FrontSide,
        defines: limb ? { LIMB: '' } : {},
        vertexShader,
        fragmentShader,
      });

    const geometry = createGhostGeometry();
    this.geometry = geometry;

    // Back faces first (dim inner shell), then the front shell.
    this.back = new THREE.Mesh(geometry, make(THREE.BackSide));
    this.back.renderOrder = 1;
    this.front = new THREE.Mesh(geometry, make(THREE.FrontSide));
    this.front.renderOrder = 2;
    this.body.add(this.back, this.front);

    // ── Face ──────────────────────────────────────
    this.face = new THREE.Group();
    this.body.add(this.face);
    const Z = new THREE.Vector3(0, 0, 1);
    const sphere = new THREE.SphereGeometry(1, 32, 24);
    this.featureMat = new THREE.MeshBasicMaterial({ color: '#070818', transparent: true });
    this.shineMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true });

    this.eyes = [-1, 1].map((side) => {
      const { position, normal } = domePoint(side * 0.23, 0.33);
      const pivot = new THREE.Group();
      pivot.position.copy(position);
      pivot.quaternion.setFromUnitVectors(Z, normal);
      const eye = new THREE.Mesh(sphere, this.featureMat);
      eye.scale.set(0.1, 0.145, 0.05);
      eye.renderOrder = 3;
      const shine = new THREE.Mesh(sphere, this.shineMat);
      shine.scale.setScalar(0.028);
      shine.position.set(0.03, 0.05, 0.045);
      shine.renderOrder = 4;
      pivot.add(eye, shine);
      this.face.add(pivot);
      return { pivot, eye, shine };
    });

    {
      const { position, normal } = domePoint(0, 0.1);
      this.mouthPivot = new THREE.Group();
      this.mouthPivot.position.copy(position);
      this.mouthPivot.quaternion.setFromUnitVectors(Z, normal);
      this.mouth = new THREE.Mesh(sphere, this.featureMat);
      this.mouth.scale.set(0.065, 0.045, 0.03);
      this.mouth.renderOrder = 3;
      this.mouthPivot.add(this.mouth);
      this.face.add(this.mouthPivot);
    }

    this.blushUniforms = { uColor: { value: new THREE.Color(blush) }, uAlpha: { value: 0.55 } };
    const blushMat = blushMaterial(this.blushUniforms);
    const blushGeo = new THREE.PlaneGeometry(0.24, 0.16);
    [-1, 1].forEach((side) => {
      const { position, normal } = domePoint(side * 0.42, 0.15);
      const m = new THREE.Mesh(blushGeo, blushMat);
      m.position.copy(position).addScaledVector(normal, 0.012);
      m.quaternion.setFromUnitVectors(Z, normal);
      m.renderOrder = 3;
      this.face.add(m);
    });

    // ── Little arms ───────────────────────────────
    const limbFront = make(THREE.FrontSide, true);
    this.arms = [-1, 1].map((side) => {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.64, -0.1, 0.06);
      const arm = new THREE.Mesh(sphere, limbFront);
      arm.scale.set(0.15, 0.29, 0.15);
      arm.position.set(side * 0.1, -0.2, 0);
      arm.renderOrder = 2;
      pivot.add(arm);
      this.body.add(pivot);
      return { pivot, side };
    });

    // Invisible proxy for cheap hover / click picking
    this.hitProxy = new THREE.Mesh(
      new THREE.SphereGeometry(0.95, 12, 8),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.hitProxy.position.y = -0.15;
    this.body.add(this.hitProxy);
  }

  boo(onBurst) {
    if (this.booing) return;
    this.booing = true;
    const u = this.uniforms.uBoo;
    gsap
      .timeline({ onComplete: () => (this.booing = false) })
      .to(u, { value: 1, duration: 0.22, ease: 'back.out(3)' }, 0)
      .to(this, { spinOffset: this.spinOffset + Math.PI * 2, duration: 1.15, ease: 'power3.inOut' }, 0.05)
      .to(u, { value: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)' }, 0.55);
    onBurst?.();
  }

  blink() {
    const eyes = this.eyes.map((e) => e.pivot.scale);
    const tl = gsap.timeline();
    tl.to(eyes, { y: 0.08, duration: 0.07, ease: 'power2.in' }).to(eyes, { y: 1, duration: 0.12, ease: 'power2.out' });
    if (Math.random() < 0.25) {
      tl.to(eyes, { y: 0.08, duration: 0.07, ease: 'power2.in' }, '+=0.08').to(eyes, { y: 1, duration: 0.12, ease: 'power2.out' });
    }
  }

  // Random point on the hem in world space (for trailing wisps)
  hemPoint(target) {
    const a = Math.random() * Math.PI * 2;
    const r = 0.82 + Math.random() * 0.08;
    return target.set(Math.sin(a) * r, -1.0 - Math.random() * 0.12, Math.cos(a) * r).applyMatrix4(this.body.matrixWorld);
  }

  update(time, dt, mouse) {
    const p = this.params;
    const u = this.uniforms;
    u.uTime.value = time;

    const k = 1 - Math.exp(-dt * 3.2);
    const px = this.pos.x;
    const py = this.pos.y;
    this.pos.x += (p.x + mouse.x * 0.35 * p.follow - this.pos.x) * k;
    this.pos.y += (p.y + mouse.y * 0.22 * p.follow - this.pos.y) * k;
    const idt = 1 / Math.max(dt, 1e-4);
    const kv = 1 - Math.exp(-dt * 6);
    this.vel.x += ((this.pos.x - px) * idt - this.vel.x) * kv;
    this.vel.y += ((this.pos.y - py) * idt - this.vel.y) * kv;

    const bob = Math.sin(time * 1.3) * 0.1 + Math.sin(time * 0.7) * 0.04;
    this.group.position.set(this.pos.x, this.pos.y + bob, p.z);
    this.group.scale.setScalar(p.scale);

    const kl = 1 - Math.exp(-dt * 4);
    this.lookY += (mouse.x * 0.5 * p.follow - this.lookY) * kl;
    this.lookX += (-mouse.y * 0.28 * p.follow - this.lookX) * kl;
    this.inner.rotation.y = this.lookY + this.spinOffset + p.spin;
    this.inner.rotation.x = this.lookX + this.vel.y * 0.08;
    this.inner.rotation.z = -this.vel.x * 0.22 + Math.sin(time * 0.9) * 0.05;

    u.uVelocity.value.set(
      THREE.MathUtils.clamp(this.vel.x * 0.5, -1.2, 1.2),
      THREE.MathUtils.clamp(this.vel.y * 0.5, -1, 1),
    );
    u.uDissolve.value = p.dissolve;

    // face follows the breathing of the body
    const boo = u.uBoo.value;
    const breath = Math.sin(time * 2) * 0.022 + boo * 0.06;
    this.face.scale.set(1 + breath, 1 - breath * 0.4, 1 + breath);

    this.hover += ((this.hovered ? 1 : 0) - this.hover) * (1 - Math.exp(-dt * 8));
    u.uGlow.value = this.hover + boo;
    const eyeScale = 1 + this.hover * 0.18 + boo * 0.25;
    this.eyes.forEach((e) => {
      e.eye.scale.set(0.1 * eyeScale, 0.145 * eyeScale, 0.05);
    });
    this.mouth.scale.set(0.065 + boo * 0.035 + this.hover * 0.01, 0.045 + boo * 0.11 + this.hover * 0.02, 0.03);

    if (time > this.nextBlink) {
      this.blink();
      this.nextBlink = time + 2.2 + Math.random() * 3.5;
    }

    const wave = Math.max(p.wave, boo);
    this.arms.forEach(({ pivot, side }, i) => {
      const idle = 0.55 + Math.sin(time * 2.2 + i * 1.7) * 0.12;
      const flap = wave * (1.7 + Math.sin(time * 11 + i * 0.6) * 0.45);
      // only the right arm waves hello; both fly up on "boo"
      const w = side > 0 ? flap : flap * boo;
      pivot.rotation.z = side * (idle + w);
    });

    const featureAlpha = 1 - THREE.MathUtils.smoothstep(p.dissolve, 0.05, 0.4);
    this.featureMat.opacity = featureAlpha;
    this.shineMat.opacity = featureAlpha;
    this.blushUniforms.uAlpha.value = 0.55 * featureAlpha * (1 + this.hover * 0.6);

    this.group.visible = p.dissolve < 0.995;
  }
}
