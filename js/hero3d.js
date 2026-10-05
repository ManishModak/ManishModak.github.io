/**
 * WebGL hero backdrop: a dotted wave terrain across the hero, under the text and
 * the CSS phone, with the flow-field trails above it. The waves ripple under the
 * pointer and the camera drifts with pointer and scroll.
 *
 * With no WebGL or with reduced motion this module exits early and the hero
 * falls back to flow-field trails plus the CSS phone.
 * Rendering pauses while the hero is off screen or the tab is hidden.
 */
import * as THREE from 'three';

const canvas = document.getElementById('hero-canvas');
const hero = document.getElementById('hero');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TEAL = new THREE.Color('#5eccc6');
const VIOLET = new THREE.Color('#8b93ff');
const PINK = new THREE.Color('#e879c6');

if (canvas && hero && !reduceMotion && hasWebGL()) {
  start();
}

function hasWebGL() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch (error) {
    return false;
  }
}

function start() {
  // Draw across the whole hero rather than inside the phone column.
  hero.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const update = buildWaveScene(scene, camera);

  function resize() {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(resize).observe(canvas);
  resize();

  window.addEventListener('pointermove', (event) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = -((event.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  let visible = true;
  let rafId = 0;
  const clock = new THREE.Clock();

  function frame() {
    rafId = 0;
    if (!visible || document.hidden) return;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    const scroll = Math.min(1, window.scrollY / Math.max(1, hero.offsetHeight));
    update(clock.getElapsedTime(), pointer, scroll);
    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }

  function resume() {
    if (!rafId && visible && !document.hidden) rafId = requestAnimationFrame(frame);
  }

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    resume();
  }).observe(hero);
  document.addEventListener('visibilitychange', resume);

  resume();
  requestAnimationFrame(() => canvas.classList.add('ready'));
}

/* ---------- Wave terrain ---------- */

function buildWaveScene(scene, camera) {
  camera.position.set(0, 3.4, 12);
  camera.lookAt(0, 4.3, -6);

  const COLS = 220;
  const ROWS = 110;
  const positions = new Float32Array(COLS * ROWS * 3);
  let n = 0;
  for (let z = 0; z < ROWS; z++) {
    for (let x = 0; x < COLS; x++) {
      positions[n++] = (x / (COLS - 1) - 0.5) * 60;
      positions[n++] = 0;
      positions[n++] = (z / (ROWS - 1)) * -44 + 12;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const uniforms = {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(999, 999) },
    uSize: { value: 5.5 * Math.min(window.devicePixelRatio || 1, 1.75) },
    uTeal: { value: TEAL },
    uViolet: { value: VIOLET },
    uPink: { value: PINK }
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uSize;
      uniform vec3 uTeal;
      uniform vec3 uViolet;
      uniform vec3 uPink;
      varying vec3 vColor;
      varying float vAlpha;

      void main() {
        vec3 p = position;
        float t = uTime * 0.5;
        float h = sin(p.x * 0.22 + t) * 0.8
                + sin(p.z * 0.31 - t * 1.3) * 0.5
                + sin((p.x + p.z) * 0.12 + t * 0.7) * 0.9
                + sin(p.x * 0.6 - p.z * 0.4 + t * 1.7) * 0.15;
        h *= 1.07;
        float md = distance(p.xz, uMouse);
        h += sin(md * 1.4 - uTime * 3.0) * 0.5 * smoothstep(7.0, 0.0, md);
        p.y = h - 1.6;

        float k = clamp((h + 2.0) / 4.0, 0.0, 1.0);
        vColor = k < 0.5 ? mix(uTeal, uViolet, k * 2.0) : mix(uViolet, uPink, (k - 0.5) * 2.0);

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float depth = -mv.z;
        vAlpha = smoothstep(56.0, 12.0, depth) * smoothstep(1.0, 5.0, depth) * (0.55 + k * 0.45);
        gl_PointSize = uSize * (14.0 / depth);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(vColor, smoothstep(0.5, 0.1, d) * vAlpha);
      }`
  });

  scene.add(new THREE.Points(geometry, material));

  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1.6);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();

  return (time, pointer, scroll) => {
    uniforms.uTime.value = time;
    camera.position.x = pointer.x * 1.2;
    camera.position.y = 3.4 + pointer.y * 0.5 + scroll * 3;
    camera.lookAt(0, 4.3, -6);

    ndc.set(pointer.x, pointer.y);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(ground, hit)) uniforms.uMouse.value.set(hit.x, hit.z);
  };
}
