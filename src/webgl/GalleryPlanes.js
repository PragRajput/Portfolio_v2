import * as THREE from 'three';
import gsap from 'gsap';
import { simplex3 } from './glsl.js';

// Shader planes living in an orthographic pixel-space scene, glued every frame
// to DOM elements marked with [data-gl="art"] (generative project art) or
// [data-gl="photo"] (an image with duotone / ripple / dissolve treatment).
// They render AFTER tone mapping, so fragment output is written in sRGB.

const common = /* glsl */ `
  ${simplex3}
  vec3 toSRGB(vec3 c) {
    c = clamp(c, 0.0, 1.0);
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
  }
  float roundedMask(vec2 uv, vec2 size, float r) {
    vec2 q = abs((uv - 0.5) * size) - (size * 0.5 - r);
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
    return 1.0 - smoothstep(-1.0, 1.0, d);
  }
  // ink-like materialise mask with a glowing edge
  vec2 reveal(vec2 uv, float aspect, float seed, float amount) {
    float dn = snoise(vec3(uv * vec2(aspect, 1.0) * 3.0, seed)) * 0.5 + 0.5;
    float thr = amount * 1.3 - 0.15;
    float a = smoothstep(dn - 0.04, dn + 0.04, thr);
    float edge = smoothstep(dn - 0.06, dn, thr) - smoothstep(dn, dn + 0.06, thr);
    return vec2(a, edge);
  }
`;

const vertexShader = /* glsl */ `
  uniform float uBend;
  uniform float uBendAxis; // 0 = bow along x (horizontal rail), 1 = along y (vertical scroll)
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.x += sin(uv.y * 3.14159265) * uBend * (1.0 - uBendAxis);
    p.y -= sin(uv.x * 3.14159265) * uBend * uBendAxis;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const artFragment = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  uniform float uHover;
  uniform float uReveal;
  uniform vec2 uMouse;
  uniform vec2 uRes;
  uniform float uRadius;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  uniform vec3 uC4;
  varying vec2 vUv;
  ${common}

  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { v += a * snoise(p); p *= 2.07; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
    p *= 1.0 - uHover * 0.18;

    vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0) * (1.0 - uHover * 0.18);
    float md = length(p - m);
    p += normalize(p - m + 1e-4) * sin(md * 22.0 - uTime * 7.0) * 0.012 * uHover * smoothstep(0.55, 0.0, md);

    float t = uTime * 0.07 + uSeed * 7.31;
    vec3 q = vec3(p * 1.35, t);
    float n1 = fbm(q);
    float n2 = fbm(q + vec3(n1 * 1.6, n1 * 1.2, t * 0.6) + 4.7);
    float n3 = fbm(q * 1.4 + vec3(n2 * 2.0, -n2 * 1.4, 0.0));

    vec3 col = mix(uC1, uC2, smoothstep(-0.55, 0.45, n1));
    col = mix(col, uC3, smoothstep(0.0, 0.75, n2) * 0.85);
    col = mix(col, uC4, smoothstep(0.4, 0.95, n3) * (0.4 + uHover * 0.35));
    float glow = smoothstep(0.75, 0.0, length(p - vec2(0.0, 0.05)));
    col += uC3 * glow * 0.1 * (1.0 + uHover);
    col *= 0.55 + 0.4 * smoothstep(0.95, 0.1, length(uv - 0.5) * 1.3);

    vec2 rv = reveal(uv, aspect, uSeed, uReveal);
    col += uC3 * rv.y * 1.2;
    float alpha = max(rv.x, rv.y) * roundedMask(uv, uRes, uRadius);
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(toSRGB(col), alpha);
  }
`;

const photoFragment = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uTexSize;
  uniform float uLoaded;
  uniform float uTime;
  uniform float uSeed;
  uniform float uHover;
  uniform float uReveal;
  uniform float uVelocity;
  uniform float uZoom;
  uniform vec2 uFocus;
  uniform vec2 uMouse;
  uniform vec2 uRes;
  uniform float uRadius;
  uniform vec3 uDuoA;
  uniform vec3 uDuoB;
  uniform vec3 uEdge;
  varying vec2 vUv;
  ${common}

  vec2 cover(vec2 uv, vec2 res, vec2 tex, vec2 focus, float zoom) {
    float rs = res.x / res.y;
    float rt = tex.x / max(tex.y, 1.0);
    vec2 s = (rs > rt ? vec2(1.0, rt / rs) : vec2(rs / rt, 1.0)) / zoom;
    vec2 o = (1.0 - s) * vec2(focus.x, 1.0 - focus.y);
    return uv * s + o;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;

    // ripple from the cursor while hovered
    vec2 m = uMouse;
    vec2 dm = (uv - m) * vec2(aspect, 1.0);
    float md = length(dm);
    uv += normalize(dm + 1e-4) / vec2(aspect, 1.0) * sin(md * 30.0 - uTime * 8.0) * 0.004 * uHover * smoothstep(0.5, 0.0, md);

    vec2 tuv = cover(uv, uRes, uTexSize, uFocus, uZoom * (1.0 + uHover * 0.06));
    float split = clamp(abs(uVelocity) * 0.0009, 0.0, 0.012);
    vec3 tex = vec3(
      texture2D(uTex, tuv + vec2(0.0, split)).r,
      texture2D(uTex, tuv).g,
      texture2D(uTex, tuv - vec2(0.0, split)).b
    );

    // ghostly emerald duotone that blooms into full colour on hover
    float l = dot(tex, vec3(0.2126, 0.7152, 0.0722));
    vec3 duo = mix(uDuoA, uDuoB, smoothstep(0.0, 0.75, pow(l, 0.8)));
    vec3 col = mix(duo, tex, 0.12 + uHover * 0.88);
    col *= 0.9 + 0.1 * sin(vUv.y * uRes.y * 1.4 + uTime * 6.0) * (1.0 - uHover); // faint scanlines
    col *= 0.78 + 0.32 * smoothstep(1.0, 0.2, length(vUv - 0.5) * 1.35);

    vec2 rv = reveal(vUv, aspect, uSeed, uReveal);
    col += uEdge * rv.y * 1.4;
    float alpha = max(rv.x, rv.y) * roundedMask(vUv, uRes, uRadius) * uLoaded;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(toSRGB(col), alpha);
  }
`;

const hexList = (s, fallback) => (s ? s.split(',').map((c) => new THREE.Color(c.trim())) : fallback.map((c) => new THREE.Color(c)));

export default class GalleryPlanes {
  constructor(scene, elements, { duo = ['#03110c', '#b7f7dc'], edge = '#34d399' } = {}) {
    this.scene = scene;
    const geometry = new THREE.PlaneGeometry(1, 1, 24, 24);
    const loader = new THREE.TextureLoader();

    this.items = elements.map((el, i) => {
      const kind = el.dataset.gl === 'photo' ? 'photo' : 'art';
      const uniforms = {
        uTime: { value: 0 },
        uSeed: { value: Number(el.dataset.seed ?? i) },
        uHover: { value: 0 },
        uReveal: { value: 0 },
        uBend: { value: 0 },
        uBendAxis: { value: el.dataset.axis === 'x' ? 0 : 1 },
        uVelocity: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uRes: { value: new THREE.Vector2(1, 1) },
        uRadius: { value: Number(el.dataset.radius ?? 14) },
      };
      let material;
      if (kind === 'photo') {
        Object.assign(uniforms, {
          uTex: { value: null },
          uTexSize: { value: new THREE.Vector2(1, 1) },
          uLoaded: { value: 0 },
          uZoom: { value: Number(el.dataset.zoom ?? 1) },
          uFocus: { value: new THREE.Vector2(0.5, Number(el.dataset.focusY ?? 0.5)) },
          uDuoA: { value: new THREE.Color(duo[0]) },
          uDuoB: { value: new THREE.Color(duo[1]) },
          uEdge: { value: new THREE.Color(edge) },
        });
        loader.load(el.dataset.src, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearMipmapLinearFilter;
          tex.anisotropy = 4;
          uniforms.uTex.value = tex;
          uniforms.uTexSize.value.set(tex.image.width, tex.image.height);
          gsap.to(uniforms.uLoaded, { value: 1, duration: 0.6 });
          el.classList.add('is-gl-ready');
        });
        material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader: photoFragment, transparent: true });
      } else {
        const [c1, c2, c3, c4] = hexList(el.dataset.palette, ['#0b1030', '#3a2bff', '#7cf2ff', '#f2f6ff']);
        Object.assign(uniforms, { uC1: { value: c1 }, uC2: { value: c2 }, uC3: { value: c3 }, uC4: { value: c4 } });
        material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader: artFragment, transparent: true });
        el.classList.add('is-gl-ready');
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false;
      mesh.frustumCulled = false;
      scene.add(mesh);

      const host = el.closest('[data-gl-host]') || el;
      const mouseTarget = new THREE.Vector2(0.5, 0.5);
      host.addEventListener('pointerenter', () => gsap.to(uniforms.uHover, { value: 1, duration: 0.9, ease: 'power3.out' }));
      host.addEventListener('pointerleave', () => gsap.to(uniforms.uHover, { value: 0, duration: 0.9, ease: 'power3.out' }));
      host.addEventListener('focusin', () => gsap.to(uniforms.uHover, { value: 1, duration: 0.9, ease: 'power3.out' }));
      host.addEventListener('focusout', () => gsap.to(uniforms.uHover, { value: 0, duration: 0.9, ease: 'power3.out' }));
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mouseTarget.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
      });
      return { el, mesh, uniforms, mouseTarget, reveal: 0, axis: el.dataset.axis === 'x' ? 'x' : 'y' };
    });
  }

  // Read DOM rects (call before any DOM writes in the frame to avoid forced reflow)
  update(time, dt, velocity, vw, vh) {
    const k = 1 - Math.exp(-dt * 6);
    for (const it of this.items) {
      const r = it.el.getBoundingClientRect();
      const onScreen = r.right > -50 && r.left < vw + 50 && r.bottom > -50 && r.top < vh + 50 && r.width > 0;
      it.mesh.visible = onScreen;
      if (!onScreen) continue;
      it.mesh.scale.set(r.width, r.height, 1);
      it.mesh.position.set(r.left + r.width / 2 - vw / 2, -(r.top + r.height / 2) + vh / 2, 0);
      const u = it.uniforms;
      u.uTime.value = time;
      u.uRes.value.set(r.width, r.height);
      u.uMouse.value.lerp(it.mouseTarget, k);
      u.uVelocity.value += (velocity - u.uVelocity.value) * k;
      const bendTarget = THREE.MathUtils.clamp(velocity * (it.axis === 'x' ? 0.0028 : 0.0012), -0.1, 0.1);
      u.uBend.value += (bendTarget - u.uBend.value) * k;
      // materialise as the element enters the viewport
      const target = it.axis === 'x'
        ? THREE.MathUtils.clamp((vw - r.left) / (vw * 0.45), 0, 1)
        : THREE.MathUtils.clamp((vh - r.top) / (vh * 0.55), 0, 1);
      it.reveal += (target - it.reveal) * k;
      u.uReveal.value = it.reveal;
    }
  }
}
