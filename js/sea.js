/**
 * ASCII sea: sharks, whales, an octopus, jellyfish, a manta ray, a turtle and a
 * school of fish swim behind the page as white monospace glyphs.
 *
 * Each creature is a small procedural mesh (no model files) reshaped on the CPU
 * every frame to swim. The scene renders into a target with 2x2 texels per glyph
 * cell; a full-screen pass averages each cell and turns light times coverage into
 * a glyph from a density ramp, drawn from an atlas made with the site's mono font.
 *
 * The sea is as deep as the page. Creatures are laid out down its whole height, a
 * few per screen, each crossing its own stretch of water, with species by depth:
 * schools and turtles near the top, whales and the octopus by the seabed at the
 * end of the page. Scrolling moves the camera down through it at half the page's
 * speed, so the same creatures are still there when you scroll back. They cross
 * from side to side or, seen from above, up and down, wander, and shy away from the
 * pointer. A shark scatters the fish school and sometimes swims over to look at a
 * resting cursor; a fast flick of the page startles everything on screen; the
 * octopus inks when frightened. Only the water around the screen is animated.
 * `?sea=gallery` holds one of each in a grid, for tuning.
 *
 * Case studies get a sign-off instead: a strip above "Next case study" where one
 * creature at a time swims towards the next one.
 *
 * Off with reduced motion or without WebGL2. Pauses while the tab is hidden or a
 * case study covers the page.
 */
import * as THREE from 'three';

const canvas = document.getElementById('sea-canvas');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gallery = new URLSearchParams(window.location.search).get('sea') === 'gallery';

const CELL_W = 7; // glyph cell, CSS px
const CELL_H = 10;
const FONT_PX = 10;
const RAMP = '.:-=+*#%@'; // light to dense
const COLOR = new THREE.Color('#eef0f3');
const OPACITY = 0.75; // below 1 so text stays clearly in front
const FRAME_MS = 1000 / 30; // glyphs snap to cells, so 30 fps already reads smooth
const SCROLL_FRAME_MS = 1000 / 60; // while scrolling, keep up with the page
const PARALLAX = 0.5; // the sea moves at this fraction of the page's scroll (at z = 0)
const FLICK_SCREENS_S = 3; // page scroll speed, in screen heights a second, that startles the sea
const CAMERA_Z = 40;
const FOV = 30;
const SIGNOFF_FOV = 6.7; // long lens for the case study strip, so a creature fills it
const SIGNOFF_KINDS = ['shark', 'whale', 'octopus', 'school']; // the ones that swim side on
const TAU = Math.PI * 2;

const X_AXIS = new THREE.Vector3(1, 0, 0);
const Y_AXIS = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

// length: world units for the one-unit model (the viewport is ~21 units tall).
// depth: z range (camera at z = 40). bank: roll that shows the back to the viewer.
// vertical: crosses the screen upwards ('up') or either way ('either'), back to the
// viewer, with drift (radians) of sideways slant; the rest cross side to side.
// zone: where down the page it lives, from 0 (top) to 1 (the seabed).
// predator scatters prey; curious swims over to a resting cursor now and then;
// inks leaves an ink cloud when it takes fright.
const SPECIES = {
  shark: { make: makeShark, length: 7, speed: 2.6, depth: [-6, 4], bank: 0.35, zone: [0, 0.7], predator: true, curious: true },
  whale: { make: makeWhale, length: 12, speed: 1.3, depth: [-14, -5], bank: 0.45, zone: [0.5, 1] },
  octopus: { make: makeOctopus, length: 3.8, speed: 1.2, depth: [-4, 4], bank: 0.5, zone: [0.75, 1], inks: true },
  jellyfish: { make: makeJellyfish, length: 3, speed: 0.9, depth: [-6, 4], bank: 0, vertical: 'up', drift: 0.2, zone: [0.35, 1] },
  manta: { make: makeManta, length: 7, speed: 1.7, depth: [-9, 0], bank: 0.3, vertical: 'either', drift: 0.5, zone: [0.25, 0.8] },
  turtle: { make: makeTurtle, length: 4.5, speed: 1.4, depth: [-5, 3], bank: 0.25, vertical: 'either', drift: 0.6, zone: [0, 0.5] },
  school: { make: makeSchool, length: 5.5, speed: 2.4, depth: [-3, 6], bank: 0.35, zone: [0, 0.45], prey: true }
};

if (canvas && !reduceMotion && hasWebGL()) {
  start();
}

function hasWebGL() {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch (error) {
    return false;
  }
}

async function start() {
  // The atlas needs the mono font; draw with the fallback if it is slow to arrive.
  await Promise.race([
    document.fonts.load(`500 ${FONT_PX}px "JetBrains Mono"`).catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 1500))
  ]);

  const glyphs = createGlyphRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 100);
  camera.position.set(0, 0, CAMERA_Z);
  const view = createView(FOV);

  function resize() {
    glyphs.setSize(window.innerWidth, window.innerHeight, view, camera);
    view.scale = THREE.MathUtils.clamp(window.innerWidth / window.innerHeight / 1.6, 0.6, 1);
  }

  let resizeTimer = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      relayoutIfNeeded();
    }, 120);
  }, { passive: true });
  resize();

  // Pointer in normalised device coordinates; creatures convert it to their own depth.
  // still: seconds since it last moved.
  const pointer = { x: 0, y: 0, active: false, movedAt: 0, still: 0 };
  window.addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
    pointer.active = true;
    pointer.movedAt = performance.now();
  }, { passive: true });
  const release = () => { pointer.active = false; };
  window.addEventListener('pointerout', (event) => { if (!event.relatedTarget) release(); }, { passive: true });
  window.addEventListener('pointerup', (event) => { if (event.pointerType !== 'mouse') release(); }, { passive: true });
  window.addEventListener('pointercancel', release, { passive: true });
  window.addEventListener('blur', release);

  const creatures = [];
  const inks = [];
  let seabed = null;
  const laidOut = { width: 0, height: 0, page: 0 };

  // World y of the middle of the screen at a scroll position: scrolling dives down.
  function depthAt(scrollY) {
    return -(scrollY / view.heightPx) * PARALLAX * 2 * view.extent(0).halfH;
  }

  // Lays the sea out down the whole page: a few creatures per screen, each with its own
  // stretch of water and a species that lives that deep, and the seabed at the end.
  function populate() {
    [...creatures, ...inks].forEach((thing) => {
      scene.remove(thing.group);
      thing.dispose();
    });
    creatures.length = 0;
    inks.length = 0;
    if (seabed) {
      scene.remove(seabed.group);
      seabed.dispose();
    }

    const page = document.documentElement.scrollHeight;
    Object.assign(laidOut, { width: window.innerWidth, height: window.innerHeight, page });
    view.cameraY = depthAt(window.scrollY);
    const { halfH } = view.extent(0);
    const top = halfH;
    const floor = floorFor(page);
    const perScreen = THREE.MathUtils.clamp((window.innerWidth * window.innerHeight) / 450000, 2.5, 3);
    const spacing = (2 * halfH) / perScreen;
    const recent = [];
    for (let y = top - spacing * (0.3 + 0.3 * Math.random()); y > floor + spacing * 0.6; y -= spacing * (0.8 + 0.4 * Math.random())) {
      const kind = pickKind((top - y) / (top - floor), recent);
      recent.unshift(kind);
      recent.length = Math.min(recent.length, 2);
      const creature = new Creature(kind, view);
      creature.launch(view, y, true);
      // Nothing appears in place: the ones that would be on screen as the page opens
      // swim in from off screen instead, a few at a time.
      if (creature.inView(view)) {
        creature.launch(view, y, false);
        creature.parked = 0.2 + Math.random() * 2.5;
      }
      scene.add(creature.group);
      creatures.push(creature);
    }

    placeSeabed(floor);
  }

  // At the end of the page the sand fills the bottom quarter of the screen.
  function floorFor(page) {
    return depthAt(Math.max(0, page - window.innerHeight)) - view.extent(0).halfH * 0.75;
  }

  function placeSeabed(floor) {
    if (seabed) {
      scene.remove(seabed.group);
      seabed.dispose();
    }
    seabed = makeSeabed(view, floor);
    scene.add(seabed.group);
  }

  // Lays out again when the page changes shape, but not for small height changes like
  // a phone's address bar showing and hiding. A small change in page length (an image
  // arriving late) just moves the seabed to the new end.
  function relayoutIfNeeded() {
    if (gallery || document.body.classList.contains('detail-open')) return;
    const page = document.documentElement.scrollHeight;
    if (window.innerWidth !== laidOut.width
      || Math.abs(window.innerHeight - laidOut.height) > laidOut.height * 0.25
      || Math.abs(page - laidOut.page) > window.innerHeight * 0.5) {
      populate();
    } else if (page !== laidOut.page) {
      laidOut.page = page;
      placeSeabed(floorFor(page));
    }
  }

  if (gallery) {
    Object.keys(SPECIES).forEach((kind, i) => {
      const creature = new Creature(kind, view);
      const { halfW, halfH } = view.extent(0);
      creature.launch(view, 0, true);
      creature.hold = true;
      if (!creature.spec.vertical) {
        creature.dir = 1;
        creature.heading = 0;
        creature.forward.set(1, 0, 0);
      }
      // One per slot in a 4 x 2 grid, each scaled to fill its slot.
      creature.size = (halfW * 0.5 * 0.8) / 1.2;
      creature.group.scale.setScalar(creature.size);
      creature.position.set(((i % 4) - 1.5) * halfW * 0.5, (i < 4 ? 0.45 : -0.45) * halfH, 0);
      scene.add(creature.group);
      creatures.push(creature);
    });
  } else {
    populate();
    let pageTimer = 0;
    new ResizeObserver(() => {
      clearTimeout(pageTimer);
      pageTimer = setTimeout(relayoutIfNeeded, 300);
    }).observe(document.body);
  }

  let lastScroll = -1;
  let last = performance.now();
  let rafId = 0;

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    const scrolling = window.scrollY !== lastScroll;
    if (now - last < (scrolling ? SCROLL_FRAME_MS : FRAME_MS) - 2) return;
    const elapsed = (now - last) / 1000;
    const dt = Math.min(0.1, elapsed);
    last = now;
    // A fast flick of the page startles whatever is on screen.
    const flick = lastScroll < 0 ? 0 : Math.abs(window.scrollY - lastScroll) / elapsed / window.innerHeight;
    const fright = flick > FLICK_SCREENS_S ? Math.min(1.2, 0.4 + (flick - FLICK_SCREENS_S) / FLICK_SCREENS_S) : 0;
    lastScroll = window.scrollY;
    pointer.still = (now - pointer.movedAt) / 1000;

    view.cameraY = gallery ? 0 : depthAt(window.scrollY);
    aim(view, camera);
    view.predators.length = 0;
    for (const creature of creatures) {
      if (creature.spec.predator && creature.group.visible) view.predators.push(creature.position);
    }

    for (const creature of creatures) {
      // Only the water within half a screen or so is alive; the rest waits where it is.
      const { halfH } = view.extent(creature.position.z);
      const near = creature.hold || Math.abs(creature.position.y - view.cameraY) < halfH * 1.5 + creature.size;
      if (near) {
        if (fright && !creature.parked && !creature.unseen) creature.spook(fright);
        creature.update(dt, view, pointer);
        if (creature.inked) {
          creature.inked = false;
          const ink = makeInk(creature.position, creature.size);
          inks.push(ink);
          scene.add(ink.group);
        }
      }
      creature.group.visible = near && !creature.parked;
    }
    for (let i = inks.length - 1; i >= 0; i--) {
      if (inks[i].update(dt)) continue;
      scene.remove(inks[i].group);
      inks[i].dispose();
      inks.splice(i, 1);
    }
    seabed?.update(dt, view);

    glyphs.draw(scene, camera);
  }

  // Animate only when someone can see it: tab visible and no case study covering the page.
  function updateRunState() {
    const run = !document.hidden && !document.body.classList.contains('detail-open');
    if (run && !rafId) {
      last = performance.now();
      lastScroll = -1;
      rafId = requestAnimationFrame(frame);
    } else if (!run && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  document.addEventListener('visibilitychange', updateRunState);
  // main.js toggles body.detail-open around the full-screen case study.
  new MutationObserver(updateRunState).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  updateRunState();
  requestAnimationFrame(() => canvas.classList.add('ready'));
  if (!gallery) startSignoff();
}

// The sign-off at the end of each case study: one creature at a time swims along the
// line above "Next case study", heading the way its arrow points. main.js renders an
// empty .cs-signoff slot with each case study; this moves one canvas into it, and runs
// only while the slot is on screen. The renderer is made when the first case study
// opens, since most visits never open one.
function startSignoff() {
  const detailBody = document.getElementById('detail-body');
  if (!detailBody) return;
  let canvas = null;
  let glyphs = null;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(SIGNOFF_FOV, 1, 1, 100);
  camera.position.set(0, 0, CAMERA_Z);
  const view = createView(SIGNOFF_FOV);
  const still = { x: 0, y: 0, active: false, still: 0 };

  let slot = null;
  let onScreen = false;
  let creature = null;
  let previous = '';
  let restIn = 0;
  let last = 0;
  let rafId = 0;

  function resize() {
    if (!slot) return;
    glyphs.setSize(slot.clientWidth, slot.clientHeight, view, camera);
    aim(view, camera);
  }

  function clear() {
    if (!creature) return;
    scene.remove(creature.group);
    creature.dispose();
    creature = null;
  }

  // Sized to the strip, in from the left, crossing in about nine seconds.
  function swimNext() {
    const kinds = SIGNOFF_KINDS.filter((kind) => kind !== previous);
    previous = kinds[Math.floor(Math.random() * kinds.length)];
    creature = new Creature(previous, view);
    const { halfW, halfH } = view.extent(0);
    creature.size = Math.min(halfH * 2.2, halfW * 1.1);
    creature.group.scale.setScalar(creature.size);
    creature.launch(view, 0, false, 1);
    creature.cruise = (2 * creature.reach) / 9;
    scene.add(creature.group);
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    if (now - last < FRAME_MS - 2) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!creature) {
      restIn -= dt;
      if (restIn <= 0) swimNext();
    }
    if (creature) {
      creature.update(dt, view, still);
      if (creature.parked) {
        clear();
        restIn = 1.5 + Math.random() * 2;
      }
    }
    glyphs.draw(scene, camera);
  }

  function updateRunState() {
    const run = onScreen && !document.hidden && document.body.classList.contains('detail-open');
    if (run && !rafId) {
      last = performance.now();
      rafId = requestAnimationFrame(frame);
    } else if (!run && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  const watcher = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    updateRunState();
  });

  // Each case study render brings a fresh slot: move the canvas in and start over.
  new MutationObserver(() => {
    const next = detailBody.querySelector('.cs-signoff');
    if (!next || next === slot) return;
    if (!glyphs) {
      canvas = document.createElement('canvas');
      glyphs = createGlyphRenderer(canvas);
    }
    slot = next;
    slot.append(canvas);
    watcher.disconnect();
    watcher.observe(slot);
    resize();
    clear();
    restIn = 0.4;
  }).observe(detailBody, { childList: true });

  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', updateRunState);
  new MutationObserver(updateRunState).observe(document.body, { attributes: true, attributeFilter: ['class'] });
}

/* ---------- Rendering ---------- */

// What creatures need to know about a camera: how much world it shows at a depth, the
// world y at the middle of its view, and its frustum this frame (see aim()).
function createView(fov) {
  const tan = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  return {
    aspect: 1,
    scale: 1,
    heightPx: 1,
    cameraY: 0,
    frustum: new THREE.Frustum(),
    predators: [], // positions of predators swimming near the view this frame
    extent(z) {
      const halfH = (CAMERA_Z - z) * tan;
      return { halfW: halfH * this.aspect, halfH };
    }
  };
}

const scratchViewProjection = new THREE.Matrix4();

// Moves the camera to view.cameraY and records its frustum for the visibility checks.
function aim(view, camera) {
  camera.position.y = view.cameraY;
  camera.updateMatrixWorld();
  scratchViewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  view.frustum.setFromProjectionMatrix(scratchViewProjection);
}

// Draws scenes into one canvas as glyphs. setSize() fits it to a CSS size and points the
// camera at the glyph grid that gives; draw() renders a frame.
function createGlyphRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  const target = new THREE.WebGLRenderTarget(2, 2, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true
  });
  const ascii = createAsciiPass(target.texture);
  let atlasDpr = 0;

  return {
    setSize(width, height, view, camera) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);

      const cellW = Math.round(CELL_W * dpr);
      const cellH = Math.round(CELL_H * dpr);
      const cols = Math.max(1, Math.ceil((width * dpr) / cellW));
      const rows = Math.max(1, Math.ceil((height * dpr) / cellH));
      target.setSize(cols * 2, rows * 2);
      ascii.uniforms.uCells.value.set(cols, rows);
      ascii.uniforms.uCellPx.value.set(cellW, cellH);
      if (dpr !== atlasDpr) {
        ascii.uniforms.uAtlas.value?.dispose();
        ascii.uniforms.uAtlas.value = createAtlas(cellW, cellH, Math.round(FONT_PX * dpr));
        atlasDpr = dpr;
      }

      view.aspect = (cols * cellW) / (rows * cellH);
      view.heightPx = (rows * cellH) / dpr;
      camera.aspect = view.aspect;
      camera.updateProjectionMatrix();
    },
    draw(scene, camera) {
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(ascii.scene, ascii.camera);
    }
  };
}

const BODY_VERT = `
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }`;

// Writes lighting into red; the ASCII pass averages it with coverage per cell.
const BODY_FRAG = `
  uniform float uBright;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 toEye = normalize(cameraPosition - vWorld);
    if (dot(n, toEye) < 0.0) n = -n;
    float diffuse = max(dot(n, normalize(vec3(-0.35, 0.75, 0.55))), 0.0);
    float rim = pow(1.0 - max(dot(n, toEye), 0.0), 2.0);
    float shade = (0.22 + 0.6 * diffuse + 0.45 * rim) * uBright;
    gl_FragColor = vec4(min(shade, 1.0), 0.0, 0.0, 1.0);
  }`;

// Seabed: only faces turned to the light show, so ripples read as sparse bands rather
// than a solid floor, fading out towards the horizon.
const SAND_FRAG = `
  uniform float uBright;
  varying vec3 vNormal;
  varying vec3 vWorld;
  void main() {
    vec3 n = normalize(vNormal);
    if (dot(n, cameraPosition - vWorld) < 0.0) n = -n;
    float lit = smoothstep(0.7, 0.92, dot(n, normalize(vec3(-0.35, 0.75, 0.55))));
    float fade = smoothstep(66.0, 38.0, distance(cameraPosition, vWorld));
    gl_FragColor = vec4(uBright * lit * fade, 0.0, 0.0, 1.0);
  }`;

// Full-screen pass: one glyph per cell. Sampling the centre of each 2x2 block with
// linear filtering averages it, so edge cells come out lighter than solid ones.
function createAsciiPass(sceneTexture) {
  const uniforms = {
    uScene: { value: sceneTexture },
    uAtlas: { value: null },
    uCells: { value: new THREE.Vector2(1, 1) },
    uCellPx: { value: new THREE.Vector2(CELL_W, CELL_H) },
    uGlyphs: { value: RAMP.length },
    uColor: { value: COLOR },
    uOpacity: { value: OPACITY }
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
    vertexShader: `
      void main() {
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D uScene;
      uniform sampler2D uAtlas;
      uniform vec2 uCells;
      uniform vec2 uCellPx;
      uniform float uGlyphs;
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        vec2 cellPos = gl_FragCoord.xy / uCellPx;
        vec2 cell = floor(cellPos);
        vec4 sampled = texture2D(uScene, (cell + 0.5) / uCells);
        float v = sampled.r;
        if (sampled.a < 0.08 || v < 0.03) discard;
        float index = min(floor(v * uGlyphs * 1.1), uGlyphs - 1.0);
        vec2 uv = vec2((index + fract(cellPos.x)) / uGlyphs, fract(cellPos.y));
        float alpha = texture2D(uAtlas, uv).a * uOpacity * (0.6 + 0.4 * v);
        gl_FragColor = vec4(uColor * alpha, alpha);
      }`
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  return { scene, camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), uniforms };
}

// One row of glyphs, each drawn centred in a cell-sized slot.
function createAtlas(cellW, cellH, fontPx) {
  const atlas = document.createElement('canvas');
  atlas.width = cellW * RAMP.length;
  atlas.height = cellH;
  const ctx = atlas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 ${fontPx}px "JetBrains Mono", monospace`;
  [...RAMP].forEach((glyph, i) => ctx.fillText(glyph, i * cellW + cellW / 2, cellH / 2));
  const texture = new THREE.CanvasTexture(atlas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

/* ---------- Swimmers ---------- */

const scratchForward = new THREE.Vector3();
const scratchRight = new THREE.Vector3();
const scratchUp = new THREE.Vector3();
const scratchBasis = new THREE.Matrix4();
const scratchRoll = new THREE.Quaternion();
const scratchBox = new THREE.Box3();

// One creature: its model, its stretch of water, where it is and where it is heading.
// launch() puts it on a course; update() swims it and rests it off screen between laps.
class Creature {
  constructor(kind, view) {
    const spec = SPECIES[kind];
    this.kind = kind;
    this.spec = spec;
    this.model = spec.make();
    this.material = new THREE.ShaderMaterial({
      uniforms: { uBright: { value: 1 } },
      vertexShader: BODY_VERT,
      fragmentShader: BODY_FRAG,
      side: THREE.DoubleSide
    });
    // The group carries heading and scale; the body inside it carries the model's own tilt.
    const body = new THREE.Mesh(this.model.geometry, this.material);
    body.frustumCulled = false;
    body.rotation.z = this.model.tilt ?? 0;
    this.body = body;
    this.group = new THREE.Group();
    this.group.add(body);
    this.position = this.group.position;
    this.size = spec.length * view.scale * (0.85 + Math.random() * 0.3);
    this.group.scale.setScalar(this.size);

    this.seed = [Math.random() * 10, Math.random() * 10, Math.random() * 10];
    this.swimTime = Math.random() * 10;
    this.hold = false;
    this.velocity = new THREE.Vector3();
    this.forward = new THREE.Vector3();
    this.home = new THREE.Vector2(); // a point its course runs through
    this.course = new THREE.Vector2(); // direction of the course
  }

  // Sets a course through its stretch of water around homeY: from just off one side
  // to the other or, for the top-down swimmers, up or down past it. midway starts it
  // partway along (for water no one is looking at yet); otherwise it starts just out
  // of sight. dir (1 = rightwards) fixes a side-on swimmer's direction.
  launch(view, homeY, midway, dir) {
    const { spec } = this;
    const z = THREE.MathUtils.lerp(spec.depth[0], spec.depth[1], Math.random());
    const { halfW, halfH } = view.extent(z);
    this.homeY = homeY;
    if (spec.vertical) {
      this.dir = spec.vertical === 'either' && Math.random() < 0.5 ? -1 : 1;
      this.heading = this.dir * (Math.PI / 2) + spec.drift * (Math.random() * 2 - 1);
      this.home.set((Math.random() * 1.2 - 0.6) * halfW, homeY);
      this.reach = halfH + this.size * 0.6;
    } else {
      this.dir = dir ?? (Math.random() < 0.5 ? 1 : -1);
      this.heading = this.dir > 0 ? 0 : Math.PI;
      this.home.set(0, homeY);
      this.reach = halfW + this.size * 0.6;
    }
    this.course.set(Math.cos(this.heading), Math.sin(this.heading));
    // Starts out of sight put the nose (half a length ahead of centre) just past the
    // edge: the side for side-on swimmers, and for top-down ones the edge of the
    // current view they swim in from, wherever that is along their course.
    let along = -this.reach;
    if (midway) along = (Math.random() * 1.4 - 0.7) * (this.reach - this.size * 0.6);
    else if (spec.vertical) along = (view.cameraY - this.dir * (halfH + this.size * 0.6) - homeY) / this.course.y;
    this.position.set(this.home.x + this.course.x * along, this.home.y + this.course.y * along, z);
    this.forward.set(this.course.x, this.course.y, 0);
    this.lastTheta = this.heading;
    this.cruise = spec.speed * view.scale; // world units per second
    this.age = 0;
    this.startle = 0; // fright, 0 to 1.5: extra speed and a faster swim stroke
    this.jink = 0; // the sharp turn a sudden fright adds, fading
    this.curious = null; // for curious ones: whether this resting cursor interests it
    this.interest = 0; // eased 0 to 1, how hard it is turning towards the cursor
    this.fright = 0; // for prey: eased threat from predators, spreads the school
    this.inkIn = 0; // for inkers: seconds until it can ink again
    this.inked = false; // set when it inks, cleared by the sea once the cloud exists
    this.unseen = 0; // seconds with no part of it on screen
    this.parked = 0; // seconds left resting off screen before the next lap
  }

  // A sudden fright: a burst of speed and, if it was calm, a sharp turn one way or
  // the other.
  spook(amount) {
    if (this.hold || amount <= this.startle) return;
    if (this.startle < 0.3) this.jink = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.3);
    this.startle = Math.min(1.5, amount);
  }

  // How far along its course it is, from -reach (start) through 0 (home) to reach.
  along() {
    return (this.position.x - this.home.x) * this.course.x + (this.position.y - this.home.y) * this.course.y;
  }

  // Rough check from its centre and length, for before it has been drawn.
  inView(view) {
    const { halfW, halfH } = view.extent(this.position.z);
    const r = this.size * 0.55;
    return Math.abs(this.position.x) < halfW + r && Math.abs(this.position.y - view.cameraY) < halfH + r;
  }

  update(dt, view, pointer) {
    if (this.parked) {
      // Between laps. Come back in from the start, unless someone is looking right at it.
      this.parked = Math.max(0, this.parked - dt);
      if (!this.parked) {
        this.launch(view, this.homeY, false);
        if (this.inView(view)) this.parked = 1;
      }
      return;
    }

    const { spec, seed, position } = this;
    const { halfW, halfH } = view.extent(position.z);
    this.age += dt;
    const age = this.age;
    const pointerX = pointer.x * halfW;
    const pointerY = view.cameraY + pointer.y * halfH;

    // Wander: slow S-curves, pulled back towards its course so it keeps to its own
    // water, and gentle turns into depth. A fright adds a sharp turn that fades.
    let theta = this.heading;
    let psi = 0;
    if (!this.hold) {
      const [near, far] = spec.depth;
      const middle = (near + far) / 2;
      const offCourse = (position.y - this.home.y) * this.course.x - (position.x - this.home.x) * this.course.y;
      theta += 0.3 * Math.sin(0.11 * age + seed[0]) + 0.12 * Math.sin(0.29 * age + seed[1]);
      theta -= 0.6 * THREE.MathUtils.clamp(offCourse / (halfH * 0.35), -1, 1);
      theta += this.jink;
      psi = 0.35 * Math.sin(0.08 * age + seed[2]) - 0.5 * THREE.MathUtils.clamp((position.z - middle) / ((far - near) / 2), -1, 1);
    }
    this.jink *= Math.exp(-dt * 1.5);

    // Curious: with the cursor resting nearby, sometimes swim over for a look, until
    // it gets too close and takes fright. Decided afresh each time the cursor rests.
    if (spec.curious && !this.hold) {
      if (!(pointer.active && pointer.still > 1.5)) this.curious = null;
      else if (this.curious === null) this.curious = Math.random() < 0.5;
      if (this.startle > 0.6) this.curious = false;
      const near = Math.hypot(pointerX - position.x, pointerY - position.y) < halfW * 0.8;
      const interested = this.curious && near ? 1 : 0;
      this.interest += (interested - this.interest) * (1 - Math.exp(-dt * 1.5));
      if (this.interest > 0.001) theta = turnTowards(theta, Math.atan2(pointerY - position.y, pointerX - position.x), 0.85 * this.interest);
    }

    const speed = this.cruise * (this.model.thrust ?? 1) * (1 + this.startle);
    this.velocity.set(Math.cos(psi) * Math.cos(theta), Math.cos(psi) * Math.sin(theta), Math.sin(psi)).multiplyScalar(speed);

    // Prey: a predator close by scatters it and sends it off at speed. Fright comes on
    // fast and settles slowly, so the school regroups after the shark has gone.
    if (spec.prey && !this.hold) {
      let threat = 0;
      const reach = this.size * 1.8;
      for (const predator of view.predators) {
        const dx = position.x - predator.x;
        const dy = position.y - predator.y;
        const dist = Math.hypot(dx, dy, (position.z - predator.z) * 0.5) || 1;
        if (dist >= reach) continue;
        const danger = 1 - dist / reach;
        this.velocity.x += (dx / dist) * danger * this.cruise * 1.5;
        this.velocity.y += (dy / dist) * danger * this.cruise * 1.5;
        threat = Math.max(threat, danger);
      }
      this.fright += (threat - this.fright) * (1 - Math.exp(-dt * (threat > this.fright ? 6 : 0.7)));
      this.model.scatter = this.fright;
      this.startle = Math.max(this.startle, threat * 1.2);
    }

    // Shy away from the pointer.
    if (pointer.active && !this.hold) {
      const dx = position.x - pointerX;
      const dy = position.y - pointerY;
      const dist = Math.hypot(dx, dy) || 1;
      const reach = this.size * 0.6 + 1.5;
      if (dist < reach) {
        const push = (1 - dist / reach) * spec.speed * 2.5;
        this.velocity.x += (dx / dist) * push;
        this.velocity.y += (dy / dist) * push;
        this.startle = Math.min(1.5, this.startle + dt * 4);
      }
    }
    this.startle = Math.max(0, this.startle - dt * 0.6);
    if (!this.hold) position.addScaledVector(this.velocity, dt);

    // Inks when it takes fright, at most every few seconds; the sea makes the cloud.
    this.inkIn = Math.max(0, this.inkIn - dt);
    if (spec.inks && this.startle > 0.8 && !this.inkIn) {
      this.inkIn = 8;
      this.inked = true;
    }

    this.swimTime += dt * (1 + this.startle * 1.5);
    this.model.update(this.swimTime);
    const geometry = this.model.geometry;
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    // Face where it is going, rolled to show its back and leaning into turns.
    scratchForward.copy(this.velocity).normalize();
    this.forward.lerp(scratchForward, 1 - Math.exp(-dt * 2.5));
    if (this.forward.lengthSq() < 1e-6) this.forward.copy(scratchForward);
    this.forward.normalize();
    const up = spec.vertical ? Z_AXIS : Y_AXIS;
    scratchRight.crossVectors(this.forward, up);
    if (scratchRight.lengthSq() < 1e-6) scratchRight.crossVectors(this.forward, up === Z_AXIS ? Y_AXIS : Z_AXIS);
    scratchRight.normalize();
    scratchUp.crossVectors(scratchRight, this.forward);
    scratchBasis.makeBasis(this.forward, scratchUp, scratchRight);
    this.group.quaternion.setFromRotationMatrix(scratchBasis);
    const turnRate = (theta - this.lastTheta) / Math.max(dt, 0.001);
    this.lastTheta = theta;
    const roll = spec.bank * this.dir + THREE.MathUtils.clamp(-turnRate * 0.6, -0.5, 0.5);
    this.group.quaternion.multiply(scratchRoll.setFromAxisAngle(X_AXIS, roll));

    // Deeper creatures are dimmer.
    this.material.uniforms.uBright.value = 0.7 + 0.3 * THREE.MathUtils.clamp((this.position.z + 14) / 20, 0, 1);

    this.group.updateMatrixWorld();
    geometry.computeBoundingBox();
    scratchBox.copy(geometry.boundingBox).applyMatrix4(this.body.matrixWorld);
    this.unseen = view.frustum.intersectsBox(scratchBox) ? 0 : this.unseen + dt;

    // Lap over once it has swum out past the far end: rest a moment, then go again.
    if (!this.hold && this.unseen > 0.4 && this.along() > this.reach - this.size) {
      this.parked = 0.5 + Math.random() * 2.5;
    }
  }

  dispose() {
    this.model.geometry.dispose();
    this.material.dispose();
  }
}

// Turns angle a towards b by fraction k, the short way round.
function turnTowards(a, b, k) {
  return a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * k;
}

// A species that lives at depth f (0 = top of the page, 1 = the seabed), avoiding the
// last couple placed so neighbours differ.
function pickKind(f, recent) {
  const here = Object.keys(SPECIES).filter((kind) => f >= SPECIES[kind].zone[0] && f <= SPECIES[kind].zone[1]);
  const fresh = here.filter((kind) => !recent.includes(kind));
  const pool = fresh.length ? fresh : here.filter((kind) => kind !== recent[0]);
  return pool[Math.floor(Math.random() * pool.length)] ?? 'school';
}

/* ---------- Mesh building ---------- */

// Piecewise-linear profile through [u, value] points.
function profile(points) {
  return (u) => {
    for (let i = 1; i < points.length; i++) {
      if (u <= points[i][0]) {
        const [u0, v0] = points[i - 1];
        const [u1, v1] = points[i];
        return v0 + ((v1 - v0) * (u - u0)) / (u1 - u0);
      }
    }
    return points[points.length - 1][1];
  };
}

// Collects one creature's vertices and triangles. Each part method returns where
// its vertices start, so swim code can move parts separately.
class MeshBuilder {
  constructor() {
    this.positions = [];
    this.indices = [];
  }

  get count() {
    return this.positions.length / 3;
  }

  // Body of revolution along x, from x0 (u = 0, tail) to x1 (u = 1, head).
  // shape(u) returns [radiusY, radiusZ, centreY, centreZ].
  body(x0, x1, rings, radial, shape) {
    const start = this.count;
    for (let i = 0; i <= rings; i++) {
      const u = i / rings;
      const [ry, rz, cy = 0, cz = 0] = shape(u);
      for (let j = 0; j < radial; j++) {
        const a = (j / radial) * TAU;
        this.positions.push(x0 + (x1 - x0) * u, cy + Math.cos(a) * ry, cz + Math.sin(a) * rz);
      }
    }
    this.quads(start, rings, radial, true);
    return start;
  }

  // Flat part (a fin or flipper): a fan from the first point around the rest.
  fan(points) {
    const start = this.count;
    points.forEach(([x, y, z]) => this.positions.push(x, y, z));
    for (let i = 1; i < points.length - 1; i++) this.indices.push(start, start + i, start + i + 1);
    return start;
  }

  // Grid of rows x cols vertices from point(i, j).
  sheet(rows, cols, point) {
    const start = this.count;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) this.positions.push(...point(i, j));
    }
    this.quads(start, rows - 1, cols, false);
    return start;
  }

  // Tube with fixed topology; writeTube fills in its vertices every frame.
  tube(rings, radial) {
    const start = this.count;
    for (let i = 0; i < (rings + 1) * radial; i++) this.positions.push(0, 0, 0);
    this.quads(start, rings, radial, true);
    return { start, rings, radial };
  }

  quads(start, rows, cols, wrap) {
    const span = wrap ? cols : cols - 1;
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < span; j++) {
        const a = start + i * cols + j;
        const b = start + i * cols + ((j + 1) % cols);
        this.indices.push(a, a + cols, b, b, a + cols, b + cols);
      }
    }
  }

  // base keeps the rest pose; pos is the live position array swim code writes.
  build() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setIndex(this.indices);
    return { geometry, base: Float32Array.from(this.positions), pos: geometry.attributes.position.array, end: this.count };
  }
}

// Bends vertices [from, to) with a wave travelling down the body towards the tail
// at x0, which swings most. axis 1 bends up and down (whales), 2 side to side.
function bodyWave(model, from, to, x0, x1, phase, amp, waves, axis) {
  const { base, pos } = model;
  for (let i = from * 3; i < to * 3; i += 3) {
    const tail = 1 - THREE.MathUtils.clamp((base[i] - x0) / (x1 - x0), 0, 1);
    const offset = amp * (0.08 + 0.92 * tail * tail) * Math.sin(phase - waves * TAU * tail);
    pos[i] = base[i];
    pos[i + 1] = base[i + 1] + (axis === 1 ? offset : 0);
    pos[i + 2] = base[i + 2] + (axis === 2 ? offset : 0);
  }
}

const tubeCentres = new Float32Array(32 * 3);
const tubePoint = new THREE.Vector3();
const tubeTangent = new THREE.Vector3();
const tubeNormal = new THREE.Vector3();
const tubeBinormal = new THREE.Vector3();

// Writes a tube around the centreline centre(s, out) with radius(s), s from 0 to 1.
function writeTube(pos, tube, centre, radius) {
  const { start, rings, radial } = tube;
  const c = tubeCentres;
  for (let i = 0; i <= rings; i++) {
    centre(i / rings, tubePoint);
    c[i * 3] = tubePoint.x;
    c[i * 3 + 1] = tubePoint.y;
    c[i * 3 + 2] = tubePoint.z;
  }
  for (let i = 0; i <= rings; i++) {
    const a = Math.max(0, i - 1) * 3;
    const b = Math.min(rings, i + 1) * 3;
    tubeTangent.set(c[b] - c[a], c[b + 1] - c[a + 1], c[b + 2] - c[a + 2]).normalize();
    tubeNormal.crossVectors(tubeTangent, Math.abs(tubeTangent.y) > 0.9 ? X_AXIS : Y_AXIS).normalize();
    tubeBinormal.crossVectors(tubeTangent, tubeNormal);
    const r = radius(i / rings);
    for (let j = 0; j < radial; j++) {
      const angle = (j / radial) * TAU;
      const cos = Math.cos(angle) * r;
      const sin = Math.sin(angle) * r;
      const k = (start + i * radial + j) * 3;
      pos[k] = c[i * 3] + tubeNormal.x * cos + tubeBinormal.x * sin;
      pos[k + 1] = c[i * 3 + 1] + tubeNormal.y * cos + tubeBinormal.y * sin;
      pos[k + 2] = c[i * 3 + 2] + tubeNormal.z * cos + tubeBinormal.z * sin;
    }
  }
}

/* ---------- Creatures ---------- */
// Each maker builds a model about one unit long with its head towards +x and
// returns { geometry, update(t), thrust?, tilt? }; update reshapes it for swim time
// t, thrust scales its speed and tilt (radians) pitches it within its heading.

function makeShark() {
  const b = new MeshBuilder();
  const r = profile([[0, 0.016], [0.1, 0.04], [0.3, 0.09], [0.55, 0.13], [0.72, 0.135], [0.86, 0.11], [0.95, 0.065], [1, 0.008]]);
  b.body(-0.5, 0.5, 40, 12, (u) => [r(u) * 1.05, r(u) * 0.85, u > 0.85 ? -(u - 0.85) * 0.15 : 0]);
  b.fan([[0, 0.12, 0], [0.18, 0.115, 0], [0.07, 0.24, 0], [-0.05, 0.34, 0], [-0.01, 0.2, 0]]); // dorsal
  b.fan([[-0.25, 0.06, 0], [-0.19, 0.065, 0], [-0.28, 0.12, 0]]); // second dorsal
  b.fan([[-0.27, -0.055, 0], [-0.21, -0.06, 0], [-0.3, -0.11, 0]]); // anal
  b.fan([[-0.47, 0, 0], [-0.44, 0.04, 0], [-0.64, 0.32, 0], [-0.6, 0.2, 0], [-0.545, 0.03, 0], [-0.6, -0.19, 0], [-0.44, -0.04, 0]]); // tail
  for (const s of [1, -1]) {
    b.fan([[0.16, -0.09, 0.08 * s], [0.28, -0.08, 0.07 * s], [0.1, -0.21, 0.32 * s], [0.04, -0.2, 0.3 * s]]); // pectoral
  }
  const m = b.build();
  return {
    geometry: m.geometry,
    update(t) {
      bodyWave(m, 0, m.end, -0.64, 0.5, t * 0.9 * TAU, 0.07, 0.8, 2);
    }
  };
}

// Humpback: long pectoral flippers, flukes that beat up and down.
function makeWhale() {
  const b = new MeshBuilder();
  const r = profile([[0, 0.014], [0.06, 0.04], [0.2, 0.09], [0.42, 0.16], [0.62, 0.19], [0.8, 0.18], [0.9, 0.155], [0.96, 0.11], [1, 0.02]]);
  b.body(-0.5, 0.5, 44, 14, (u) => [r(u) * 0.95, r(u), -0.035 * Math.max(0, u - 0.5)]);
  b.fan([[-0.21, 0.1, 0], [-0.12, 0.12, 0], [-0.23, 0.15, 0]]); // small dorsal
  b.fan([[-0.47, 0, 0], [-0.45, 0, 0.04], [-0.56, 0, 0.26], [-0.63, 0, 0.3], [-0.58, 0, 0.12], [-0.56, 0, 0],
    [-0.58, 0, -0.12], [-0.63, 0, -0.3], [-0.56, 0, -0.26], [-0.45, 0, -0.04]]); // flukes
  const flippers = b.count;
  for (const s of [1, -1]) {
    b.fan([[0.14, -0.12, 0.15 * s], [0.24, -0.09, 0.13 * s], [0.1, -0.17, 0.33 * s], [-0.08, -0.25, 0.5 * s], [-0.03, -0.2, 0.38 * s]]);
  }
  const m = b.build();
  return {
    geometry: m.geometry,
    update(t) {
      const phase = t * 0.3 * TAU;
      bodyWave(m, 0, m.end, -0.63, 0.5, phase, 0.05, 0.6, 1);
      // Flippers rise and fall a little out of step with the flukes.
      for (let i = flippers * 3; i < m.end * 3; i += 3) m.pos[i + 1] += 0.1 * Math.abs(m.base[i + 2]) * Math.sin(phase + 1.2);
    }
  };
}

// Drifts mantle up and forward, arms trailing below. Each jet snaps the arms shut,
// then they open again slowly, curling at the tips.
function makeOctopus() {
  const b = new MeshBuilder();
  const r = profile([[0, 0.07], [0.12, 0.11], [0.25, 0.1], [0.38, 0.13], [0.6, 0.16], [0.82, 0.14], [0.95, 0.08], [1, 0.01]]);
  b.body(-0.1, 0.45, 24, 14, (u) => [r(u), r(u)]);
  const mantleEnd = b.count;
  for (const s of [1, -1]) {
    b.body(-0.03, 0.03, 4, 6, (u) => {
      const e = 0.028 * Math.sin(Math.PI * u);
      return [e, e, 0.06, 0.085 * s];
    }); // eyes
  }
  const arms = Array.from({ length: 8 }, () => b.tube(18, 6));
  const m = b.build();

  const ease = (k) => k * k * (3 - 2 * k);
  const spreadAt = (p) => {
    const k = ((p % 1) + 1) % 1;
    return k < 0.25
      ? THREE.MathUtils.lerp(1.1, 0.22, ease(k / 0.25))
      : THREE.MathUtils.lerp(0.22, 1.1, ease((k - 0.25) / 0.75));
  };

  const model = {
    geometry: m.geometry,
    thrust: 1,
    tilt: 1.0,
    update(t) {
      const cycle = (t * 0.35) % 1;
      model.thrust = 0.45 + 1.6 * Math.exp(-(((cycle - 0.15) / 0.12) ** 2));
      const squeeze = 1 - 0.1 * (1 - (spreadAt(cycle) - 0.22) / 0.88);
      for (let i = 0; i < mantleEnd * 3; i += 3) {
        m.pos[i + 1] = m.base[i + 1] * squeeze;
        m.pos[i + 2] = m.base[i + 2] * squeeze;
      }
      arms.forEach((tube, i) => {
        const angle = (i / arms.length) * TAU + 0.2;
        const cy = Math.cos(angle);
        const cz = Math.sin(angle);
        writeTube(m.pos, tube, (s, out) => {
          const spread = spreadAt(cycle - 0.12 * s); // tips lag behind the stroke
          const open = (spread - 0.22) / 0.88;
          const reach = 0.78 * s;
          const wave = 0.06 * s ** 1.3 * Math.sin(s * 5 - t * 2.5 + i * 1.7);
          const radial = 0.06 + Math.sin(spread) * reach + 0.14 * open * s ** 3;
          out.set(-0.08 - Math.cos(spread) * reach, cy * radial - cz * wave, cz * radial + cy * wave);
        }, (s) => 0.045 * (1 - s) ** 0.9 + 0.006);
      });
    }
  };
  return model;
}

// Bell pulses and pushes it upwards; oral arms and tentacles trail and sway.
function makeJellyfish() {
  const b = new MeshBuilder();
  b.body(0, 0.3, 12, 20, (u) => {
    const r = 0.34 * Math.sqrt(Math.max(0, 1 - u ** 1.8));
    return [r, r];
  });
  const bellEnd = b.count;
  const oral = Array.from({ length: 4 }, () => b.tube(14, 5));
  const tentacles = Array.from({ length: 12 }, () => b.tube(24, 4));
  const m = b.build();

  const model = {
    geometry: m.geometry,
    thrust: 1,
    update(t) {
      const cycle = (t * 0.45) % 1;
      const squeeze = cycle < 0.35 ? Math.sin((Math.PI * cycle) / 0.35) : 0;
      model.thrust = 0.35 + 1.4 * squeeze;
      for (let i = 0; i < bellEnd * 3; i += 3) {
        const u = m.base[i] / 0.3;
        const narrow = 1 - 0.16 * squeeze * (1 - u * 0.6);
        m.pos[i] = m.base[i] * (1 + 0.12 * squeeze);
        m.pos[i + 1] = m.base[i + 1] * narrow;
        m.pos[i + 2] = m.base[i + 2] * narrow;
      }
      const rim = 0.34 * (1 - 0.16 * squeeze);
      oral.forEach((tube, i) => {
        const angle = (i / oral.length) * TAU + 0.4;
        writeTube(m.pos, tube, (s, out) => {
          const curl = s * 9 - t * 2 + i;
          out.set(0.04 - 0.5 * s, Math.cos(angle) * 0.06 + 0.035 * s * Math.sin(curl), Math.sin(angle) * 0.06 + 0.035 * s * Math.cos(curl));
        }, (s) => 0.035 * (1 - 0.6 * s));
      });
      tentacles.forEach((tube, i) => {
        const angle = (i / tentacles.length) * TAU;
        writeTube(m.pos, tube, (s, out) => {
          const radial = rim * (1 - 0.3 * s) * (1 - 0.2 * squeeze * s);
          const swayY = 0.14 * s ** 1.5 * Math.sin(t * 1.6 - s * 5 + i);
          const swayZ = 0.14 * s ** 1.5 * Math.cos(t * 1.3 - s * 4 + i * 1.3);
          out.set(-1.3 * s * (1 - 0.08 * squeeze), Math.cos(angle) * radial + swayY, Math.sin(angle) * radial + swayZ);
        }, (s) => 0.014 * (1 - 0.6 * s));
      });
    }
  };
  return model;
}

// Seen from above: wide swept-back wings with a concave trailing edge, flapping in a slow wave.
function makeManta() {
  const b = new MeshBuilder();
  const rows = 26;
  const cols = 27;
  const xAt = (i) => 0.3 - (i / (rows - 1)) * 0.56;
  const halfSpan = (x) => (x > -0.1
    ? 0.13 + 0.37 * Math.sin((Math.PI / 2) * ((0.3 - x) / 0.4))
    : 0.07 + 0.43 * Math.max(0, 1 - (-0.1 - x) / 0.16) ** 2.5);
  const wings = b.sheet(rows, cols, (i, j) => {
    const x = xAt(i);
    const z = halfSpan(x) * ((j / (cols - 1)) * 2 - 1);
    return [x, 0.06 * Math.exp(-((z / 0.11) ** 2)), z];
  });
  const wingsEnd = b.count;
  for (const s of [1, -1]) {
    b.fan([[0.28, 0, 0.06 * s], [0.38, -0.02, 0.07 * s], [0.36, -0.03, 0.11 * s], [0.28, 0, 0.1 * s]]); // cephalic fins
  }
  const tail = b.tube(10, 4);
  const m = b.build();
  return {
    geometry: m.geometry,
    update(t) {
      const phase = t * 0.22 * TAU;
      for (let i = wings * 3; i < wingsEnd * 3; i += 3) {
        const x = m.base[i];
        const reach = (Math.abs(m.base[i + 2]) / 0.5) ** 1.5;
        m.pos[i + 1] = m.base[i + 1] + 0.2 * reach * Math.sin(phase - 2.5 * (0.3 - x));
      }
      writeTube(m.pos, tail, (s, out) => out.set(-0.26 - 0.5 * s, 0.03 * s * Math.sin(phase - s * 3), 0), () => 0.007);
    }
  };
}

// Seen from above: domed shell, long front flippers that sweep and lift together.
function makeTurtle() {
  const b = new MeshBuilder();
  b.body(-0.26, 0.24, 20, 18, (u) => {
    const k = Math.sin(Math.PI * u) ** 0.55;
    return [0.1 * k, 0.21 * k];
  });
  const shellEnd = b.count;
  for (let i = 1; i < shellEnd * 3; i += 3) {
    if (b.positions[i] < 0) b.positions[i] *= 0.35; // flat underside
  }
  const head = profile([[0, 0.03], [0.35, 0.05], [0.75, 0.045], [1, 0.008]]);
  const headStart = b.count;
  b.body(0.2, 0.37, 8, 8, (u) => [head(u) * 0.9, head(u)]);
  const front = b.count;
  for (const s of [1, -1]) {
    b.fan([[0.12, 0, 0.17 * s], [0.16, 0, 0.2 * s], [0.05, -0.01, 0.42 * s], [-0.06, -0.02, 0.56 * s], [-0.03, -0.02, 0.45 * s], [0.06, 0, 0.24 * s]]);
  }
  const rear = b.count;
  for (const s of [1, -1]) {
    b.fan([[-0.18, 0, 0.12 * s], [-0.15, 0, 0.15 * s], [-0.3, -0.01, 0.24 * s], [-0.33, -0.01, 0.19 * s]]);
  }
  const m = b.build();

  // Rotates a flipper about its root line (z = rootZ) and sweeps it fore and aft.
  const flap = (from, to, rootZ, lift, sweep) => {
    for (let i = from * 3; i < to * 3; i += 3) {
      const side = Math.sign(m.base[i + 2]);
      const out = m.base[i + 2] - rootZ * side;
      m.pos[i] = m.base[i] + sweep * Math.abs(out);
      m.pos[i + 1] = m.base[i + 1] + Math.abs(out) * Math.sin(lift);
      m.pos[i + 2] = rootZ * side + out * Math.cos(lift);
    }
  };

  return {
    geometry: m.geometry,
    update(t) {
      const phase = t * 0.3 * TAU;
      flap(front, rear, 0.17, 0.55 * Math.sin(phase), 0.18 * Math.cos(phase));
      flap(rear, m.end, 0.12, 0.3 * Math.sin(phase + 1.4), 0);
      for (let i = headStart * 3; i < front * 3; i += 3) m.pos[i + 1] = m.base[i + 1] + 0.01 * Math.sin(phase * 0.5);
    }
  };
}

// A loose cloud of small fish, each wiggling on its own beat. scatter (0 to 1, set by
// the creature when a predator comes close) spreads them out; the fright that comes
// with it already quickens the stroke.
function makeSchool() {
  const b = new MeshBuilder();
  const r = profile([[0, 0.01], [0.25, 0.065], [0.6, 0.095], [0.85, 0.07], [1, 0.006]]);
  // Home spots inside an ellipsoid, kept apart so the fish read one by one.
  const radii = new THREE.Vector3(0.42, 0.17, 0.22);
  const homes = [];
  for (let tries = 0; homes.length < 10 && tries < 500; tries++) {
    const p = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);
    if (p.lengthSq() > 1) continue;
    p.multiply(radii);
    if (homes.every((home) => home.distanceTo(p) > 0.16)) homes.push(p);
  }
  const fish = homes.map((home) => {
    const start = b.count;
    b.body(-0.1, 0.13, 10, 6, (u) => [r(u) * 0.9, r(u) * 0.5]);
    b.fan([[-0.09, 0, 0], [-0.16, 0.065, 0], [-0.145, 0, 0], [-0.16, -0.065, 0]]);
    return { start, end: b.count, home, phase: Math.random() * TAU, beat: 0.8 + Math.random() * 0.4 };
  });
  const m = b.build();
  return {
    geometry: m.geometry,
    scatter: 0,
    update(t) {
      const spread = 1 + 1.4 * this.scatter;
      fish.forEach((f) => {
        const ox = f.home.x * spread + 0.04 * Math.sin(t * 0.6 + f.phase);
        const oy = f.home.y * spread + 0.04 * Math.sin(t * 0.8 + f.phase * 1.3);
        const oz = f.home.z * spread + 0.04 * Math.cos(t * 0.5 + f.phase);
        for (let i = f.start * 3; i < f.end * 3; i += 3) {
          const tail = (0.13 - m.base[i]) / 0.29;
          const wiggle = 0.04 * tail * tail * Math.sin(t * f.beat * 1.5 * TAU + f.phase - tail * 4);
          m.pos[i] = m.base[i] + ox;
          m.pos[i + 1] = m.base[i + 1] + oy;
          m.pos[i + 2] = m.base[i + 2] + oz + wiggle;
        }
      });
    }
  };
}

/* ---------- Ink ---------- */

let inkPuff = null; // one sphere shared by every puff

// An octopus's ink cloud: a few overlapping puffs that drift apart, swell and fade
// over a few seconds where it took fright, while the octopus darts off.
// update() returns false once it has faded away.
function makeInk(at, size) {
  inkPuff ??= new THREE.SphereGeometry(1, 12, 8);
  const life = 3.2;
  const material = new THREE.ShaderMaterial({
    uniforms: { uBright: { value: 1 } },
    vertexShader: BODY_VERT,
    fragmentShader: BODY_FRAG
  });
  const group = new THREE.Group();
  const puffs = Array.from({ length: 7 }, () => {
    const mesh = new THREE.Mesh(inkPuff, material);
    mesh.frustumCulled = false;
    const direction = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, (Math.random() * 2 - 1) * 0.4).normalize();
    mesh.position.copy(at).addScaledVector(direction, size * 0.06);
    group.add(mesh);
    return { mesh, velocity: direction.multiplyScalar(size * (0.15 + Math.random() * 0.2)), radius: size * (0.07 + Math.random() * 0.05) };
  });

  let t = 0;
  return {
    group,
    update(dt) {
      t += dt;
      const k = Math.min(1, t / life);
      puffs.forEach((puff) => {
        puff.mesh.position.addScaledVector(puff.velocity, dt);
        puff.velocity.multiplyScalar(Math.exp(-dt * 1.2));
        puff.mesh.scale.setScalar(puff.radius * (1 + 2.2 * Math.sqrt(k)));
      });
      material.uniforms.uBright.value = 0.9 * (1 - k) ** 1.5;
      return k < 1;
    },
    dispose() {
      material.dispose();
    }
  };
}

/* ---------- Seabed ---------- */

const KELP_ROWS = 22;

// The bottom of the sea, reached at the end of the page: rippled sand running back
// into the distance, a few rocks, and kelp swaying up the sides of the screen so the
// middle stays clear for the text in front. floorY is the sand's world height.
function makeSeabed(view, floorY) {
  const zNear = 10;
  const zFar = -22;
  // Low swells, ripples running across the screen so the light picks out bands, and
  // dunes rising towards the back so the horizon rolls instead of ruling a line.
  const ground = (x, z) => {
    const back = (zNear - z) / (zNear - zFar);
    return floorY
      + 0.6 * Math.sin(0.23 * x + 0.4) * Math.cos(0.17 * z)
      + 1.8 * back * back * (0.5 + 0.5 * Math.sin(0.13 * x + 1.1))
      + 0.22 * Math.sin(1.7 * z + 0.35 * x)
      + 0.06 * Math.sin(3.1 * x - 1.3 * z);
  };

  const sand = new MeshBuilder();
  const span = view.extent(zFar).halfW * 1.1;
  sand.sheet(30, 96, (i, j) => {
    const z = THREE.MathUtils.lerp(zFar, zNear, i / 29);
    const x = THREE.MathUtils.lerp(-span, span, j / 95);
    return [x, ground(x, z), z];
  });

  // Kelp ribbons in two clumps, one each side, plus a rock at the foot of each clump.
  // On a narrow screen the text is full width, so the clumps sit right at the edges.
  const life = new MeshBuilder();
  const kelp = [];
  const narrow = view.aspect < 1;
  [-1, 1].forEach((side) => {
    const z0 = -6 + Math.random() * 6;
    const { halfW } = view.extent(z0);
    const rockX = side * halfW * ((narrow ? 0.85 : 0.55) + Math.random() * (narrow ? 0.1 : 0.25));
    addRock(sand, rockX, ground(rockX, z0), z0, 1.2 + Math.random() * 0.8);
    const count = narrow ? 2 : 3 + Math.round(Math.random() * 2);
    for (let k = 0; k < count; k++) {
      const z = z0 + (Math.random() * 2 - 1) * 3;
      const x = rockX + (Math.random() * 2 - 1) * halfW * 0.22;
      kelp.push({
        start: life.sheet(KELP_ROWS, 2, () => [0, 0, 0]),
        x,
        y: ground(x, z) - 0.2,
        z,
        height: 7 + Math.random() * 6,
        width: 0.22 + Math.random() * 0.14,
        sway: 1.2 + Math.random() * 1,
        phase: Math.random() * TAU
      });
    }
  });

  const sandModel = sand.build();
  sandModel.geometry.computeVertexNormals();
  const lifeModel = life.build();
  const group = new THREE.Group();
  const materials = [[0.4, SAND_FRAG], [0.8, BODY_FRAG]].map(([bright, fragmentShader]) => new THREE.ShaderMaterial({
    uniforms: { uBright: { value: bright } },
    vertexShader: BODY_VERT,
    fragmentShader,
    side: THREE.DoubleSide
  }));
  [sandModel, lifeModel].forEach((model, i) => {
    const mesh = new THREE.Mesh(model.geometry, materials[i]);
    mesh.frustumCulled = false;
    group.add(mesh);
  });

  let t = Math.random() * 10;
  return {
    group,
    update(dt, view) {
      // Only near the end of the page.
      group.visible = view.cameraY - floorY < view.extent(0).halfH * 2.5;
      if (!group.visible) return;
      t += dt;
      const pos = lifeModel.pos;
      kelp.forEach((blade) => {
        for (let i = 0; i < KELP_ROWS; i++) {
          const s = i / (KELP_ROWS - 1);
          // Bends more towards the tip; the wave travels up the blade.
          const bend = blade.sway * s ** 1.5;
          const cx = blade.x + bend * Math.sin(t * 0.9 + blade.phase - s * 3.2);
          const cz = blade.z + 0.4 * bend * Math.cos(t * 0.7 + blade.phase - s * 1.7);
          const cy = blade.y + s * blade.height;
          // Wide in the middle, narrow at the foot and the tip, twisting as it sways.
          const half = blade.width * (0.25 + 0.75 * Math.sin(Math.PI * (0.12 + 0.82 * s)));
          const twist = 0.7 * Math.sin(t * 0.6 + blade.phase + s * 3);
          const dx = Math.cos(twist) * half;
          const dz = Math.sin(twist) * half;
          const k = (blade.start + i * 2) * 3;
          pos[k] = cx - dx;
          pos[k + 1] = cy;
          pos[k + 2] = cz - dz;
          pos[k + 3] = cx + dx;
          pos[k + 4] = cy;
          pos[k + 5] = cz + dz;
        }
      });
      lifeModel.geometry.attributes.position.needsUpdate = true;
      lifeModel.geometry.computeVertexNormals();
    },
    dispose() {
      sandModel.geometry.dispose();
      lifeModel.geometry.dispose();
      materials.forEach((material) => material.dispose());
    }
  };
}

// A lumpy boulder of radius r, sunk a third into the sand at (x, y, z).
function addRock(builder, x, y, z, r) {
  const start = builder.body(-r, r, 10, 12, (u) => {
    const round = Math.sin(Math.PI * u);
    return [r * 0.75 * round, r * 0.9 * round];
  });
  const pos = builder.positions;
  for (let i = start * 3; i < builder.count * 3; i += 3) {
    const lx = pos[i];
    const ly = pos[i + 1];
    const lz = pos[i + 2];
    const lump = 1 + 0.14 * Math.sin(4.1 * lx / r + 2.3 * ly / r) * Math.cos(3.7 * lz / r);
    pos[i] = x + lx * lump;
    pos[i + 1] = y - r * 0.3 + ly * lump;
    pos[i + 2] = z + lz * lump;
  }
}
