import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

import Background from './Background.js';
import Ghost from './Ghost.js';
import MorphParticles, { SHAPE_COUNT } from './MorphParticles.js';
import Dust from './Dust.js';
import Wisps from './Wisps.js';
import GalleryPlanes from './GalleryPlanes.js';

const { clamp, lerp, smoothstep } = THREE.MathUtils;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const sstep = (a, b, x) => smoothstep(x, a, b);

// Brand palette (emerald on zinc), background phases are [deep, mid, glow]
const THEME = {
  ghost: { core: '#a6e0c9', deep: '#3a7566', rim: '#22b282', blush: '#ff86c3' },
  particles: ['#34d399', '#22d3ee', '#fcd34d'],
  wisps: ['#a7f3d0', '#99f6e4'],
  dust: '#c6f6e2',
  duo: ['#020d09', '#b9f8de'],
  phases: {
    hero: ['#030504', '#08140f', '#10b981'],
    about: ['#030405', '#081214', '#14b8a6'],
    skills: ['#020304', '#05121a', '#22d3ee'],
    projects: ['#04040a', '#0c1024', '#6366f1'],
    contact: ['#020605', '#06201a', '#10b981'],
  },
};

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAberration: { value: 0.004 },
    uGrain: { value: 0.04 },
    uRes: { value: new THREE.Vector2(1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAberration;
    uniform float uGrain;
    uniform vec2 uRes;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main() {
      vec2 dir = vUv - 0.5;
      float d = length(dir);
      vec2 off = dir * d * uAberration;
      vec3 col = vec3(
        texture2D(tDiffuse, vUv + off).r,
        texture2D(tDiffuse, vUv).g,
        texture2D(tDiffuse, vUv - off).b
      );
      col *= 1.0 - smoothstep(0.45, 1.05, d) * 0.5;
      float g = hash(floor(vUv * uRes) + fract(uTime * 7.13) * 113.0) - 0.5;
      col += g * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export default class Experience {
  constructor(canvas, state, { glElements = [], codeFont, contactAnchor = null } = {}) {
    this.state = state;
    this.canvas = canvas;
    this.isTouch = matchMedia('(hover: none)').matches;
    this.lowPower = this.isTouch || innerWidth < 768;
    this.lost = false;
    this.contactAnchor = contactAnchor;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.setClearColor(0x030504, 1);

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.lost = true;
      document.documentElement.classList.add('no-webgl');
    });
    canvas.addEventListener('webglcontextrestored', () => {
      this.lost = false;
      document.documentElement.classList.remove('no-webgl');
    });

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
    this.camera.position.set(0, 0, 8);
    this.scene.add(this.camera);

    this.domScene = new THREE.Scene();
    this.orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    this.orthoCamera.position.z = 10;

    this.background = new Background();
    this.dust = new Dust(this.lowPower ? 700 : 1500);
    this.dust.uniforms.uColor.value.set(THEME.dust);
    this.dust.points.renderOrder = 7;
    this.ghost = new Ghost(THEME.ghost);
    this.particles = new MorphParticles(this.lowPower ? 12000 : 24000, { colors: THEME.particles, codeFont });
    this.wisps = new Wisps(this.lowPower ? 700 : 1400);
    this.wisps.uniforms.uColorA.value.set(THEME.wisps[0]);
    this.wisps.uniforms.uColorB.value.set(THEME.wisps[1]);
    this.gallery = new GalleryPlanes(this.domScene, glElements, { duo: THEME.duo, edge: THEME.ghost.rim });

    this.scene.add(this.background.mesh, this.dust.points, this.ghost.group, this.particles.points, this.wisps.points);

    this.mouse = new THREE.Vector2();
    this.ndc = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.planeNear = new THREE.Plane(new THREE.Vector3(0, 0, 1), -1.2);
    this.planeZero = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    this.cursorWorld = new THREE.Vector3();
    this.lastCursorWorld = new THREE.Vector3();
    this.mouseWorld = new THREE.Vector3(99, 99, 0);
    this.tmp = new THREE.Vector3();
    this.hemAcc = 0;
    this.lastPx = null;
    this.waveAmt = 0;
    this.morphIndex = 0;
    this.layout = {};

    this.colA = new THREE.Color();
    this.colB = new THREE.Color();
    this.colC = new THREE.Color();
    this.phases = Object.fromEntries(Object.entries(THEME.phases).map(([k, v]) => [k, v.map((c) => new THREE.Color(c))]));

    // adaptive resolution: drop pixel ratio when frames run long, recover when there's headroom
    this.maxPixelRatio = Math.min(devicePixelRatio, this.lowPower ? 1.5 : 1.75);
    this.pixelRatio = this.maxPixelRatio;
    this.perf = { time: 0, frames: 0, good: 0, warm: 0 };

    this.setupComposer();
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  setupComposer() {
    const pr = this.pixelRatio;
    this.renderer.setPixelRatio(pr);
    const rt = new THREE.WebGLRenderTarget(innerWidth * pr, innerHeight * pr, {
      type: THREE.HalfFloatType,
      samples: this.lowPower ? 0 : 4,
    });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.setPixelRatio(pr);

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.48, 0.5, 0.75);
    this.outputPass = new OutputPass();
    // DOM-synced planes render after tone mapping so photos keep their true colours
    this.domPass = new RenderPass(this.domScene, this.orthoCamera);
    this.domPass.clear = false;
    this.domPass.clearDepth = true;
    this.finalPass = new ShaderPass(FinalShader);

    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.outputPass);
    this.composer.addPass(this.domPass);
    this.composer.addPass(this.finalPass);
  }

  setPixelRatio(pr) {
    this.pixelRatio = pr;
    this.renderer.setPixelRatio(pr);
    this.composer.setPixelRatio(pr);
    this.resize();
  }

  resize() {
    const w = innerWidth;
    const h = innerHeight;
    this.vw = w;
    this.vh = h;
    const mobile = w < 768;

    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);

    const cam = this.camera;
    cam.aspect = w / h;
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    this.baseZ = Math.max(8, 2.75 / (tanHalf * cam.aspect));
    cam.updateProjectionMatrix();

    const o = this.orthoCamera;
    o.left = -w / 2;
    o.right = w / 2;
    o.top = h / 2;
    o.bottom = -h / 2;
    o.updateProjectionMatrix();

    const visH = this.baseZ * tanHalf; // half height of the view at z = 0
    const visW = visH * cam.aspect;
    this.layout = {
      heroX: mobile ? 0 : visW * 0.52,
      heroY: mobile ? visH * 0.4 : 0.12,
      heroScale: mobile ? 1.05 : 1.12,
      // while you read About/Experience the ghost peeks in from the bottom-right corner
      peekX: mobile ? visW * 0.9 : visW * 0.88,
      peekY: mobile ? -visH * 0.8 : -visH * 0.66,
      peekScale: mobile ? 0.5 : 0.62,
      morphX: mobile ? 0 : visW * 0.26,
      morphY: mobile ? visH * 0.24 : 0.12,
      morphScale: mobile ? 0.82 : 1,
      ctaY: mobile ? visH * 0.5 : visH * 0.52,
      ctaScale: mobile ? 0.95 : 0.6,
      unitsPerPx: (visH * 2) / h,
    };
    this.particles.points.position.set(this.layout.morphX, this.layout.morphY, 0);
    this.particles.points.scale.setScalar(this.layout.morphScale);

    const pr = this.pixelRatio;
    this.particles.uniforms.uPixelRatio.value = pr;
    this.particles.uniforms.uSize.value = (mobile ? 46 : 30) * (h / 900) ** 0.5;
    this.dust.uniforms.uPixelRatio.value = pr;
    this.wisps.uniforms.uPixelRatio.value = pr * (h / 900);
    this.background.resize(cam.aspect);
    this.finalPass.uniforms.uRes.value.set(w * pr, h * pr);
  }

  async warmup() {
    const g = this.ghost.group.visible;
    const p = this.particles.points.visible;
    this.ghost.group.visible = true;
    this.particles.points.visible = true;
    this.gallery.items.forEach((i) => (i.mesh.visible = true));
    try {
      if (this.renderer.compileAsync) {
        await this.renderer.compileAsync(this.scene, this.camera);
        await this.renderer.compileAsync(this.domScene, this.orthoCamera);
      }
      this.composer.render(0);
    } catch (e) {
      console.warn(e);
    }
    this.ghost.group.visible = g;
    this.particles.points.visible = p;
  }

  booBurst() {
    const c = this.ghost.group.position;
    const s = this.ghost.params.scale;
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 1.2 + Math.random() * 2.8;
      this.wisps.emit(
        c.x + Math.cos(a) * 0.4 * s, c.y + Math.sin(a) * 0.4 * s, c.z + 0.2,
        Math.cos(a) * sp, Math.sin(a) * sp, (Math.random() - 0.5) * 1.5,
        0.9 + Math.random() * 0.8, 1.2 + Math.random() * 1.0, Math.random(), 1.2,
      );
    }
  }

  pick() {
    if (!this.ghost.group.visible || this.ghost.params.dissolve > 0.4 || this.state.mouse.overUI) {
      this.ghost.hovered = false;
      return false;
    }
    this.raycaster.setFromCamera(this.ndc, this.camera);
    this.ghost.hovered = this.raycaster.intersectObject(this.ghost.hitProxy, false).length > 0;
    return this.ghost.hovered;
  }

  adaptQuality(rawDt) {
    const p = this.perf;
    p.warm += rawDt;
    if (p.warm < 4) return; // let the intro settle first
    p.time += rawDt;
    p.frames++;
    if (p.time < 1.5) return;
    const fps = p.frames / p.time;
    p.time = 0;
    p.frames = 0;
    if (fps < 48 && this.pixelRatio > 1) {
      p.good = 0;
      this.setPixelRatio(Math.max(1, Math.round((this.pixelRatio - 0.25) * 4) / 4));
    } else if (fps > 58) {
      p.good++;
      if (p.good >= 4 && this.pixelRatio < this.maxPixelRatio) {
        p.good = 0;
        this.setPixelRatio(Math.min(this.maxPixelRatio, this.pixelRatio + 0.25));
      }
    } else {
      p.good = 0;
    }
  }

  update(time, rawDt) {
    if (this.lost) return;
    this.adaptQuality(rawDt);
    const dt = Math.min(rawDt, 1 / 20);
    const s = this.state;
    const P = s.progress;
    const L = this.layout;

    // ── input ────────────────────────────────────
    this.ndc.set(s.mouse.x, s.mouse.y);
    const km = 1 - Math.exp(-dt * 4);
    this.mouse.x += (s.mouse.x - this.mouse.x) * km;
    this.mouse.y += (s.mouse.y - this.mouse.y) * km;

    this.raycaster.setFromCamera(this.ndc, this.camera);
    if (s.mouse.active) this.raycaster.ray.intersectPlane(this.planeZero, this.mouseWorld);
    else this.mouseWorld.set(99, 99, 0);
    this.raycaster.ray.intersectPlane(this.planeNear, this.cursorWorld);
    s.ghostHover = this.pick();

    // ── camera ───────────────────────────────────
    const cam = this.camera;
    cam.position.x += (this.mouse.x * 0.35 - cam.position.x) * km;
    cam.position.y += (this.mouse.y * 0.22 - cam.position.y) * km;
    cam.position.z = this.baseZ;
    cam.lookAt(0, 0, 0);

    // ── ghost choreography ───────────────────────
    const peek = easeInOut(P.toPeek);
    const toMorph = easeInOut(P.toMorph);
    const cta = easeInOut(P.cta);
    const morphIn = sstep(0.0, 0.06, P.morph);

    let gx = lerp(L.heroX, L.peekX, peek);
    let gy = lerp(L.heroY, L.peekY, peek);
    let gs = lerp(L.heroScale, L.peekScale, peek);
    gx = lerp(gx, L.morphX, toMorph);
    gy = lerp(gy, L.morphY, toMorph);
    gs = lerp(gs, L.morphScale, toMorph);
    if (P.cta > 0) {
      // in the contact section the ghost floats in a DOM slot above the title, scrolling with it
      let ay = L.ctaY;
      if (this.contactAnchor) {
        const r = this.contactAnchor.getBoundingClientRect();
        ay = (this.vh / 2 - (r.top + r.height / 2)) * L.unitsPerPx;
      }
      gx = lerp(gx, 0, cta);
      gy = lerp(gy, ay, cta);
      gs = lerp(gs, L.ctaScale, cta);
    }

    const g = this.ghost.params;
    const peeking = peek * (1 - toMorph);
    g.x = gx;
    g.y = gy;
    g.scale = gs;
    g.spin = -0.55 * peeking; // peek back at the content
    g.follow = 1 - peeking * 0.75;
    g.dissolve = Math.max(1 - s.intro, morphIn * (1 - sstep(0.15, 0.9, P.cta)));

    const waveWanted = s.ctaHover || s.greet || (P.cta > 0.9 && Math.sin(time * 0.9) > 0.35);
    this.waveAmt += ((waveWanted ? 1 : 0) - this.waveAmt) * (1 - Math.exp(-dt * 5));
    g.wave = this.waveAmt;
    this.ghost.update(time, dt, this.mouse);
    this.ghost.group.updateMatrixWorld();

    // ── particles ────────────────────────────────
    const pu = this.particles.uniforms;
    const last = SHAPE_COUNT - 1;
    const span = clamp((P.morph - 0.06) / 0.88, 0, 1) * last;
    const si = Math.floor(span);
    const morph = Math.min(si + sstep(0.15, 0.85, span - si), last);
    pu.uMorph.value = morph;
    pu.uOpacity.value = sstep(0.0, 0.06, P.morph) * (1 - sstep(0.35, 1.0, P.morphOut));
    pu.uScatter.value = easeInOut(P.morphOut);
    pu.uMouse.value.copy(this.mouseWorld);
    this.morphIndex = Math.min(last, Math.round(morph));
    this.particles.update(time, dt, this.mouse);

    // ── wisps ────────────────────────────────────
    if (s.mouse.active && !this.isTouch) {
      if (this.lastPx) {
        const dist = Math.hypot(s.mouse.px - this.lastPx.x, s.mouse.py - this.lastPx.y);
        const n = Math.min(Math.floor(dist / 9), 6);
        for (let i = 0; i < n; i++) {
          this.tmp.lerpVectors(this.lastCursorWorld, this.cursorWorld, (i + 1) / n);
          this.wisps.emit(
            this.tmp.x, this.tmp.y, this.tmp.z,
            (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3,
            0.9 + Math.random() * 0.7, 1.0 + Math.random() * 0.7, Math.random(), 0.45,
          );
        }
      }
      this.lastPx = { x: s.mouse.px, y: s.mouse.py };
      this.lastCursorWorld.copy(this.cursorWorld);
    }
    if (this.ghost.group.visible && g.dissolve < 0.3) {
      this.hemAcc += dt * 26;
      while (this.hemAcc > 1) {
        this.hemAcc -= 1;
        this.ghost.hemPoint(this.tmp);
        const v = this.ghost.vel;
        this.wisps.emit(
          this.tmp.x, this.tmp.y, this.tmp.z,
          -v.x * 0.4 + (Math.random() - 0.5) * 0.3, -0.35 - Math.random() * 0.3, (Math.random() - 0.5) * 0.3,
          (0.7 + Math.random() * 0.5) * g.scale, 1.3 + Math.random() * 0.8, Math.random() * 0.5, 0.8,
        );
      }
    }
    this.wisps.update(dt, time);

    // ── atmosphere ───────────────────────────────
    const scrollVh = s.scroll / this.vh;
    this.dust.update(time, scrollVh * 0.35, s.velocity * 0.02);
    this.background.update(time, this.mouse, scrollVh);
    this.mixPhase(P);

    // ── DOM-synced planes (reads layout, so it runs before any DOM writes) ──
    this.gallery.update(time, dt, s.velocity, this.vw, this.vh);

    // ── post ─────────────────────────────────────
    const f = this.finalPass.uniforms;
    f.uTime.value = time;
    const ab = 0.004 + Math.min(Math.abs(s.velocity) * 0.0007, 0.028);
    f.uAberration.value += (ab - f.uAberration.value) * (1 - Math.exp(-dt * 8));

    this.composer.render(dt);
  }

  mixPhase(P) {
    const ph = this.phases;
    const w = [sstep(0, 1, P.toPeek), sstep(0, 1, P.toMorph), sstep(0, 1, P.morphOut), sstep(0, 1, P.cta)];
    const keys = ['about', 'skills', 'projects', 'contact'];
    const u = this.background.uniforms;
    [this.colA, this.colB, this.colC].forEach((c, i) => {
      c.copy(ph.hero[i]);
      keys.forEach((k, j) => c.lerp(ph[k][i], w[j]));
    });
    u.uColorA.value.copy(this.colA);
    u.uColorB.value.copy(this.colB);
    u.uColorC.value.copy(this.colC);
  }
}
