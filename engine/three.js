// ft-motion × three.js — 3D scenes that still obey the contract: draw(ctx, t) poses the world
// from t, renders it with WebGL into an offscreen canvas and blits that onto the 2D frame, so
// motion blur, post() and 2D overlays work exactly as in Canvas-only scenes.
//
//   import { THREE, createGL, toon, ink, Sweep } from '../../engine/three.js';
//   setup(api)  { gl = createGL(api); scene = new THREE.Scene(); … }
//   draw(ctx, t, api) { pose(t); gl.render(ctx, scene, camera); /* 2D overlays */ }
//
// Headless renders use SwiftShader (software WebGL): slower than a GPU but bit-for-bit stable.
import * as THREE from 'three';

export { THREE };

/** WebGL renderer on an offscreen canvas. render(ctx, scene, camera) draws the frame onto ctx. */
export function createGL(api, { shadows = true, antialias = true, pixelRatio = 1 } = {}) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(api.W, api.H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (shadows) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  return {
    renderer, canvas,
    render(ctx, scene, camera) {
      renderer.render(scene, camera);
      ctx.drawImage(canvas, 0, 0, api.W, api.H);
    },
  };
}

/** Hard-stepped light ramp for MeshToonMaterial: the "cel" in cel shading. */
export function toonRamp(levels = [0.42, 0.72, 1]) {
  const data = new Uint8Array(levels.length * 4);
  levels.forEach((v, i) => data.set([v * 255, v * 255, v * 255, 255], i * 4));
  const tex = new THREE.DataTexture(data, levels.length, 1, THREE.RGBAFormat);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
}
const RAMP = toonRamp();

/**
 * Cel-shaded material with an optional rim light (the bright edge that separates a character
 * from the background in feature animation).
 */
export function toon(color, { rim = 0, rimColor = 0xfff1d6, ramp = RAMP, ...rest } = {}) {
  const m = new THREE.MeshToonMaterial({ color, gradientMap: ramp, ...rest });
  if (rim > 0) {
    m.onBeforeCompile = sh => {
      sh.uniforms.rimColor = { value: new THREE.Color(rimColor) };
      sh.uniforms.rimStrength = { value: rim };
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 rimColor;\nuniform float rimStrength;')
        .replace('#include <opaque_fragment>', `{
          float f = 1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
          outgoingLight += rimColor * rimStrength * smoothstep(0.62, 0.8, f);
        }
        #include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'toon-rim';
  }
  return m;
}

/** Ink-line material: an inverted hull pushed out along view-space normals (thickness in world units). */
export function inkMaterial(thickness = 0.02, color = 0x2b1d17) {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { thickness: { value: thickness }, ink: { value: new THREE.Color(color) } }]),
    vertexShader: /* glsl */ `
      #include <common>
      #include <fog_pars_vertex>
      uniform float thickness;
      void main() {
        vec3 n = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        mvPosition.xyz += n * thickness;
        mvPosition.z -= thickness;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 ink;
      void main() {
        gl_FragColor = vec4(ink, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}
const _inks = new Map();
/** Adds an ink outline to a mesh (shares its geometry, follows its transform). Returns the mesh. */
export function ink(mesh, thickness = 0.02, color = 0x2b1d17) {
  const key = `${thickness}|${color}`;
  if (!_inks.has(key)) _inks.set(key, inkMaterial(thickness, color));
  const hull = new THREE.Mesh(mesh.geometry, _inks.get(key));
  hull.name = 'ink';
  hull.castShadow = false;
  hull.receiveShadow = false;
  mesh.add(hull);
  return mesh;
}

/**
 * A tapered tube with fixed topology whose spine is re-posed every frame (tails, ropes, ribbons).
 * update(points, radius(i/(n-1))) rewrites positions and normals in place, so it stays cheap.
 */
export class Sweep extends THREE.BufferGeometry {
  constructor(n = 24, radial = 10) {
    super();
    this.n = n; this.radial = radial;
    const V = n * (radial + 1) + 2;
    this.setAttribute('position', new THREE.BufferAttribute(new Float32Array(V * 3), 3));
    this.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(V * 3), 3));
    const uv = new Float32Array(V * 2);
    for (let i = 0; i < n; i++) for (let j = 0; j <= radial; j++) uv.set([i / (n - 1), j / radial], (i * (radial + 1) + j) * 2);
    this.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const idx = [];
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j, b = a + radial + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    const c0 = n * (radial + 1), c1 = c0 + 1; // end caps (fans)
    for (let j = 0; j < radial; j++) { idx.push(c0, j + 1, j); const o = (n - 1) * (radial + 1); idx.push(c1, o + j, o + j + 1); }
    this.setIndex(idx);
  }
  update(pts, radius) {
    const { n, radial } = this, P = this.attributes.position.array, N = this.attributes.normal.array;
    const T = new THREE.Vector3(), U = new THREE.Vector3(), B = new THREE.Vector3(), prevT = new THREE.Vector3(), q = new THREE.Quaternion();
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      T.subVectors(b, a).normalize();
      if (i === 0) { U.set(0, 1, 0); if (Math.abs(T.dot(U)) > 0.9) U.set(1, 0, 0); U.sub(T.clone().multiplyScalar(U.dot(T))).normalize(); }
      else { q.setFromUnitVectors(prevT, T); U.applyQuaternion(q).normalize(); } // parallel transport: no twisting
      prevT.copy(T);
      B.crossVectors(T, U);
      const r = radius(i / (n - 1));
      for (let j = 0; j <= radial; j++) {
        const th = (j / radial) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th), k = (i * (radial + 1) + j) * 3;
        const nx = U.x * c + B.x * s, ny = U.y * c + B.y * s, nz = U.z * c + B.z * s;
        N[k] = nx; N[k + 1] = ny; N[k + 2] = nz;
        P[k] = pts[i].x + nx * r; P[k + 1] = pts[i].y + ny * r; P[k + 2] = pts[i].z + nz * r;
      }
    }
    const c0 = n * (radial + 1) * 3, s0 = pts[0], s1 = pts[n - 1];
    P.set([s0.x, s0.y, s0.z, s1.x, s1.y, s1.z], c0);
    T.subVectors(pts[1], s0).normalize().negate(); N.set([T.x, T.y, T.z], c0);
    T.subVectors(s1, pts[n - 2]).normalize(); N.set([T.x, T.y, T.z], c0 + 3);
    this.attributes.position.needsUpdate = this.attributes.normal.needsUpdate = true;
    this.computeBoundingSphere();
    return this;
  }
}
