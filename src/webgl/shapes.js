import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { createGhostGeometry, GHOST_BODY_OFFSET } from './Ghost.js';

// Point-cloud generators for the morphing particle swarm. Each returns a
// Float32Array of `count` xyz positions centred roughly on the origin.

const rnd = Math.random;
const smooth = (e0, e1, x) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};

function randomDir(v) {
  const u = rnd() * 2 - 1;
  const th = rnd() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return v.set(Math.cos(th) * s, u, Math.sin(th) * s);
}

function sampler(geometry) {
  const mesh = new THREE.Mesh(geometry.index ? geometry.toNonIndexed() : geometry);
  return new MeshSurfaceSampler(mesh).build();
}

// ── 0 · the ghost ────────────────────────────────────────────
export function ghostShape(count) {
  const out = new Float32Array(count * 3);
  const body = sampler(createGhostGeometry(64));
  const arm = sampler(new THREE.SphereGeometry(1, 24, 16));
  const v = new THREE.Vector3();
  const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1;
  let i = 0;
  while (i < count) {
    if (rnd() < 0.06) {
      const side = rnd() < 0.5 ? -1 : 1;
      arm.sample(v);
      v.set(v.x * 0.15 + side * 0.1, v.y * 0.29 - 0.2, v.z * 0.15);
      const a = side * 0.55;
      const x = v.x * Math.cos(a) - v.y * Math.sin(a);
      const y = v.x * Math.sin(a) + v.y * Math.cos(a);
      v.set(x + side * 0.64, y - 0.1, v.z + 0.06);
    } else {
      body.sample(v);
      // carve the face so the eyes and mouth read as voids
      if (v.z > 0 && (inEllipse(v.x, v.y, -0.23, 0.33, 0.12, 0.17) || inEllipse(v.x, v.y, 0.23, 0.33, 0.12, 0.17) || inEllipse(v.x, v.y, 0, 0.1, 0.08, 0.065))) continue;
      const hem = smooth(-0.2, -1.1, v.y);
      const ang = Math.atan2(v.x, v.z);
      v.x *= 1 + hem * 0.16;
      v.z *= 1 + hem * 0.16;
      v.y += Math.sin(ang * 6) * 0.07 * hem * hem;
    }
    out[i * 3] = v.x;
    out[i * 3 + 1] = v.y + GHOST_BODY_OFFSET;
    out[i * 3 + 2] = v.z;
    i++;
  }
  return out;
}

// ── 1 · AI & agents: a layered neural network ────────────────
export function networkShape(count) {
  const out = new Float32Array(count * 3);
  const layers = [4, 6, 7, 6, 4];
  const nodes = [];
  layers.forEach((n, li) => {
    const x = -2.3 + (li / (layers.length - 1)) * 4.6;
    for (let k = 0; k < n; k++) nodes.push({ x, y: (k - (n - 1) / 2) * 0.6, z: (rnd() - 0.5) * 0.9, layer: li });
  });
  const edges = [];
  for (const a of nodes) for (const b of nodes) if (b.layer === a.layer + 1) edges.push([a, b]);
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    let x, y, z;
    if (rnd() < 0.36) {
      const n = nodes[Math.floor(rnd() * nodes.length)];
      randomDir(v).multiplyScalar(0.12 * Math.cbrt(rnd()));
      x = n.x + v.x;
      y = n.y + v.y;
      z = n.z + v.z;
    } else {
      const [a, b] = edges[Math.floor(rnd() * edges.length)];
      const t = rnd();
      x = a.x + (b.x - a.x) * t + (rnd() - 0.5) * 0.02;
      y = a.y + (b.y - a.y) * t + (rnd() - 0.5) * 0.02;
      z = a.z + (b.z - a.z) * t + (rnd() - 0.5) * 0.02;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}

// ── 2 · languages & frameworks: text sampled from a canvas ──
export function textShape(count, text, { font = '800 300px sans-serif', width = 4.6 } = {}) {
  const out = new Float32Array(count * 3);
  const c = document.createElement('canvas');
  c.width = 1400;
  c.height = 460;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = font;
  ctx.fillText(text, c.width / 2, c.height / 2);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const px = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let y = 0; y < c.height; y += 2) {
    for (let x = 0; x < c.width; x += 2) {
      if (data[(y * c.width + x) * 4 + 3] > 128) {
        px.push(x, y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const n = px.length / 2;
  if (!n) return sphereFallback(out, count);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = width / Math.max(maxX - minX, 1);
  for (let i = 0; i < count; i++) {
    const k = Math.floor(rnd() * n) * 2;
    out[i * 3] = (px[k] - cx + (rnd() - 0.5) * 2) * scale;
    out[i * 3 + 1] = -(px[k + 1] - cy + (rnd() - 0.5) * 2) * scale;
    out[i * 3 + 2] = (rnd() - 0.5) * 0.35;
  }
  return out;
}

function sphereFallback(out, count) {
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    randomDir(v).multiplyScalar(1.6);
    out.set([v.x, v.y, v.z], i * 3);
  }
  return out;
}

// ── 3 · databases & queues: three stacked cylinders ─────────
export function databaseShape(count) {
  const out = new Float32Array(count * 3);
  const R = 1.3;
  const H = 0.48;
  const centres = [0.72, 0, -0.72];
  for (let i = 0; i < count; i++) {
    const c = centres[Math.floor(rnd() * 3)];
    const a = rnd() * Math.PI * 2;
    const part = rnd();
    let r = R;
    let y;
    if (part < 0.5) {
      y = c + (rnd() - 0.5) * H; // side wall
    } else if (part < 0.78) {
      y = c + (rnd() < 0.5 ? H / 2 : -H / 2); // crisp rims
      r = R + (rnd() - 0.5) * 0.02;
    } else {
      y = c + H / 2; // top cap
      r = R * Math.sqrt(rnd());
    }
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = Math.sin(a) * r;
  }
  return out;
}

// ── 4 · integrations: a wireframe globe with orbiting rings ─
export function globeShape(count) {
  const out = new Float32Array(count * 3);
  const R = 1.35;
  const rings = [
    { r: 2.05, tilt: 0.5, yaw: 0.0 },
    { r: 2.3, tilt: -0.75, yaw: 1.1 },
    { r: 1.85, tilt: 1.25, yaw: 2.2 },
  ];
  const ringPoint = (ring, a, v) => {
    v.set(Math.cos(a) * ring.r, 0, Math.sin(a) * ring.r);
    v.applyAxisAngle(new THREE.Vector3(1, 0, 0), ring.tilt);
    v.applyAxisAngle(new THREE.Vector3(0, 1, 0), ring.yaw);
    return v;
  };
  const sats = [];
  rings.forEach((ring) => {
    for (let k = 0; k < 4; k++) sats.push(ringPoint(ring, (k / 4) * Math.PI * 2 + ring.yaw, new THREE.Vector3()));
  });
  const v = new THREE.Vector3();
  const d = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const p = rnd();
    if (p < 0.22) {
      // meridians
      const lon = (Math.floor(rnd() * 12) / 12) * Math.PI * 2;
      const lat = (rnd() - 0.5) * Math.PI;
      v.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)).multiplyScalar(R);
    } else if (p < 0.44) {
      // parallels
      const lat = ((Math.floor(rnd() * 7) - 3) / 4) * (Math.PI / 2);
      const lon = rnd() * Math.PI * 2;
      v.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)).multiplyScalar(R);
    } else if (p < 0.78) {
      ringPoint(rings[Math.floor(rnd() * rings.length)], rnd() * Math.PI * 2, v);
      v.addScaledVector(randomDir(d), 0.02);
    } else if (p < 0.92) {
      // integration "satellites" riding the rings
      v.copy(sats[Math.floor(rnd() * sats.length)]).addScaledVector(randomDir(d), 0.1 * Math.cbrt(rnd()));
    } else {
      randomDir(v).multiplyScalar(R * Math.cbrt(rnd()) * 0.9);
    }
    out[i * 3] = v.x;
    out[i * 3 + 1] = v.y;
    out[i * 3 + 2] = v.z;
  }
  return out;
}

// ── 5 · cloud & devops: a puffy cloud from overlapping spheres ─
export function cloudShape(count) {
  const out = new Float32Array(count * 3);
  const balls = [
    [-1.25, -0.25, 0.0, 0.72],
    [-0.45, 0.22, 0.1, 0.95],
    [0.55, 0.12, -0.05, 0.88],
    [1.35, -0.28, 0.05, 0.62],
    [0.05, -0.42, 0.25, 0.72],
    [-0.75, -0.48, -0.2, 0.62],
  ];
  const weights = balls.map((b) => b[3] * b[3]);
  const total = weights.reduce((a, b) => a + b, 0);
  const pick = () => {
    let r = rnd() * total;
    for (let k = 0; k < balls.length; k++) if ((r -= weights[k]) <= 0) return k;
    return balls.length - 1;
  };
  const v = new THREE.Vector3();
  let i = 0;
  let guard = 0;
  while (i < count && guard < count * 20) {
    guard++;
    const k = pick();
    const [bx, by, bz, br] = balls[k];
    randomDir(v).multiplyScalar(br).add(new THREE.Vector3(bx, by, bz));
    if (v.y < -0.82) continue; // flat underside
    let inside = false;
    for (let j = 0; j < balls.length && !inside; j++) {
      if (j === k) continue;
      const [x, y, z, r] = balls[j];
      inside = (v.x - x) ** 2 + (v.y - y) ** 2 + (v.z - z) ** 2 < r * r * 0.96;
    }
    if (inside) continue;
    out[i * 3] = v.x;
    out[i * 3 + 1] = v.y + 0.1;
    out[i * 3 + 2] = v.z;
    i++;
  }
  for (; i < count; i++) out.set([0, 0, 0], i * 3);
  return out;
}
