/**
 * Generative flow field background.
 *
 * The simulation runs on a fixed 60 Hz timestep and renders only after a
 * completed simulation tick. That keeps particle velocity, tail length, and
 * fade behavior consistent on 60 Hz, 120 Hz, 144 Hz, and 240 Hz displays.
 *
 * Trails fade in three stages: the bright line fades by painting the background
 * at low alpha each tick; 8-bit blending stalls that fade, leaving a faint ghost
 * tint; a gentle periodic cleanup pass then wears the ghost down to the true
 * background colour over a few seconds.
 *
 * The loop pauses while the tab is hidden or a case study covers the page. With
 * reduced motion it paints one settled frame and does not animate.
 */
(function () {
  'use strict';

  const BASE = {
    background: '#0a0a0f',
    noiseScale: 0.003,
    noiseSpeed: 0.0003,
    particleSpeed: 1.2,
    particleMaxSpeed: 3,
    trailFadePerTick: 0.04,
    lineWidth: 0.8,
    mouseRadius: 200,
    mouseStrength: 0.6,
    colorHueBase: 175,
    colorHueRange: 30,
    colorSaturation: 55,
    colorLightnessMin: 35,
    colorLightnessMax: 55,
    colorAlphaMin: 0.15,
    colorAlphaMax: 0.5,
    respawnMargin: 20
  };

  const FIXED_STEP_MS = 1000 / 60;
  const MAX_ELAPSED_MS = 100;
  const MAX_STEPS_PER_FRAME = 5;
  const RESIZE_DEBOUNCE_MS = 120;
  // Ghost cleanup: every N ticks subtract one level, then clamp back up to the background.
  // Larger N keeps the ghost stage longer; N = 10 clears it in roughly 3-4 seconds.
  const CLEANUP_EVERY_TICKS = 10;
  const CLEANUP_STEP = 'rgb(1, 1, 1)';
  // Ticks simulated up front for the reduced-motion still frame.
  const STATIC_FRAME_TICKS = 220;

  let canvas;
  let ctx;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let settings = null;
  let simplex;
  let particles = [];
  let zOffset = 0;
  let rafId = 0;
  let running = false;
  let lastTime = 0;
  let accumulator = FIXED_STEP_MS;
  let ticksSinceCleanup = 0;
  let resizeTimer = 0;
  let lastKnownDpr = 0;

  const pointer = {
    x: -10000,
    y: -10000,
    active: false,
    type: 'mouse'
  };

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.prevX = this.x;
      this.prevY = this.y;
      this.vx = 0;
      this.vy = 0;
      this.life = Math.random() * 300 + 200;

      const hue = settings.colorHueBase + (Math.random() - 0.5) * settings.colorHueRange;
      const lightness = settings.colorLightnessMin + Math.random() * (settings.colorLightnessMax - settings.colorLightnessMin);
      const alpha = settings.colorAlphaMin + Math.random() * (settings.colorAlphaMax - settings.colorAlphaMin);
      // Built once per spawn instead of every frame.
      this.color = 'hsla(' + hue + ', ' + settings.colorSaturation + '%, ' + lightness + '%, ' + alpha + ')';
      this.lineWidth = settings.lineWidth + Math.random() * 0.6;
    }

    update() {
      const angle = simplex.noise3D(
        this.x * settings.noiseScale,
        this.y * settings.noiseScale,
        zOffset
      ) * Math.PI * 2;

      let ax = Math.cos(angle) * settings.particleSpeed;
      let ay = Math.sin(angle) * settings.particleSpeed;

      if (pointer.active) {
        const dx = this.x - pointer.x;
        const dy = this.y - pointer.y;
        const distSq = dx * dx + dy * dy;
        const radius = pointer.type === 'touch' ? settings.mouseRadius * 0.72 : settings.mouseRadius;
        const radiusSq = radius * radius;

        if (distSq > 0 && distSq < radiusSq) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / radius) * settings.mouseStrength;
          ax += (dx / dist) * force * 2;
          ay += (dy / dist) * force * 2;
        }
      }

      this.vx += ax * 0.1;
      this.vy += ay * 0.1;

      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > settings.particleMaxSpeed) {
        this.vx = (this.vx / speed) * settings.particleMaxSpeed;
        this.vy = (this.vy / speed) * settings.particleMaxSpeed;
      }

      this.prevX = this.x;
      this.prevY = this.y;
      this.x += this.vx;
      this.y += this.vy;
      this.life -= 1;

      const margin = settings.respawnMargin;
      const outside = this.x < -margin || this.x > width + margin || this.y < -margin || this.y > height + margin;
      if (outside || this.life <= 0) {
        this.reset();
      }
    }

    draw() {
      ctx.beginPath();
      ctx.moveTo(this.prevX, this.prevY);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = this.color;
      ctx.lineWidth = this.lineWidth;
      ctx.stroke();
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function mediaQueryMatches(query) {
    return window.matchMedia && window.matchMedia(query).matches;
  }

  function isCoarsePointer() {
    return mediaQueryMatches('(pointer: coarse)');
  }

  function isReducedMotion() {
    return mediaQueryMatches('(prefers-reduced-motion: reduce)');
  }

  function computeSettings(viewWidth, viewHeight) {
    const coarsePointer = isCoarsePointer();
    const lowPowerDevice = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4);
    const area = Math.max(1, viewWidth * viewHeight);

    let density = coarsePointer ? 0.0002 : 0.00043;
    const minParticles = coarsePointer ? 110 : 300;
    let maxParticles = coarsePointer ? 440 : 900;

    if (lowPowerDevice) {
      density *= 0.75;
      maxParticles = coarsePointer ? 320 : 700;
    }

    return {
      ...BASE,
      particleCount: clamp(Math.round(area * density), minParticles, maxParticles),
      mouseRadius: coarsePointer ? 150 : BASE.mouseRadius,
      dprCap: coarsePointer || lowPowerDevice ? 1.5 : 2
    };
  }

  function getCanvasDpr(nextSettings) {
    return Math.min(window.devicePixelRatio || 1, nextSettings.dprCap || 2);
  }

  // Resizes the canvas to the viewport. Returns true when it rebuilt (and so cleared) the canvas.
  function syncCanvasSize() {
    const nextWidth = Math.max(1, window.innerWidth);
    let nextHeight = Math.max(1, window.innerHeight);

    // Mobile address bars resize the viewport while scrolling. Keep the taller size
    // for the same width so the bar reappearing does not clear the trails.
    if (isCoarsePointer() && nextWidth === width && nextHeight < height) {
      nextHeight = height;
    }

    const nextSettings = computeSettings(nextWidth, nextHeight);
    const nextDpr = getCanvasDpr(nextSettings);
    const sizeChanged = nextWidth !== width || nextHeight !== height || nextDpr !== dpr;
    const countChanged = !settings || nextSettings.particleCount !== settings.particleCount;

    settings = nextSettings;

    if (!sizeChanged && !countChanged) return false;

    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    lastKnownDpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = settings.background;
    ctx.fillRect(0, 0, width, height);

    reconcileParticles(settings.particleCount);
    return true;
  }

  function reconcileParticles(targetCount) {
    if (particles.length > targetCount) {
      particles.length = targetCount;
      return;
    }

    while (particles.length < targetCount) {
      particles.push(new Particle());
    }
  }

  function simulationStep() {
    for (let i = 0; i < particles.length; i += 1) {
      particles[i].update();
    }
    zOffset += settings.noiseSpeed;
  }

  // |dst - 1| then max(dst, background): the ghost steps down to the background, bright trails barely change.
  function cleanupResidue() {
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = CLEANUP_STEP;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighten';
    ctx.fillStyle = settings.background;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'source-over';
  }

  function render(ticks) {
    const fadeAlpha = 1 - Math.pow(1 - settings.trailFadePerTick, ticks || 1);
    ctx.fillStyle = 'rgba(10, 10, 15, ' + fadeAlpha + ')';
    ctx.fillRect(0, 0, width, height);

    ticksSinceCleanup += ticks || 1;
    if (ticksSinceCleanup >= CLEANUP_EVERY_TICKS) {
      cleanupResidue();
      ticksSinceCleanup = 0;
    }

    for (let i = 0; i < particles.length; i += 1) {
      particles[i].draw();
    }
  }

  // Settles the field for a while and paints a single frame, for reduced motion.
  function paintStaticFrame() {
    for (let i = 0; i < STATIC_FRAME_TICKS; i += 1) {
      simulationStep();
      render(1);
    }
  }

  function animate(timestamp) {
    rafId = 0;
    if (!running) return;

    if ((window.devicePixelRatio || 1) !== lastKnownDpr) {
      syncCanvasSize();
    }

    if (!lastTime) lastTime = timestamp;

    const elapsed = Math.min(timestamp - lastTime, MAX_ELAPSED_MS);
    lastTime = timestamp;
    accumulator += elapsed;

    let steps = 0;
    while (accumulator >= FIXED_STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      simulationStep();
      accumulator -= FIXED_STEP_MS;
      steps += 1;
    }

    if (steps === MAX_STEPS_PER_FRAME) accumulator = 0;
    if (steps > 0) render(steps);

    rafId = requestAnimationFrame(animate);
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = 0;
    accumulator = FIXED_STEP_MS;
    rafId = requestAnimationFrame(animate);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // Animate only when someone can see it: tab visible, no case study covering the page, motion allowed.
  function updateRunState() {
    const covered = document.body.classList.contains('detail-open');
    if (document.hidden || covered || isReducedMotion()) {
      stop();
    } else {
      start();
    }
  }

  function scheduleResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const cleared = syncCanvasSize();
      accumulator = FIXED_STEP_MS;
      if (isReducedMotion() && cleared) paintStaticFrame();
      updateRunState();
    }, RESIZE_DEBOUNCE_MS);
  }

  function onPointerMove(event) {
    if (event.pointerType === 'touch' && event.isPrimary === false) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.type = event.pointerType || 'mouse';
    pointer.active = true;
  }

  function onPointerEnd(event) {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') {
      pointer.active = false;
    }
  }

  function deactivatePointer() {
    pointer.active = false;
  }

  function bindEvents() {
    window.addEventListener('resize', scheduleResize, { passive: true });
    window.addEventListener('orientationchange', scheduleResize, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', deactivatePointer, { passive: true });
    window.addEventListener('blur', deactivatePointer, { passive: true });
    document.addEventListener('visibilitychange', updateRunState);

    // main.js toggles body.detail-open around the full-screen case study.
    new MutationObserver(updateRunState).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    if (window.matchMedia) {
      const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (typeof motion.addEventListener === 'function') {
        motion.addEventListener('change', () => {
          if (motion.matches) paintStaticFrame();
          updateRunState();
        });
      }
      const coarse = window.matchMedia('(pointer: coarse)');
      if (typeof coarse.addEventListener === 'function') {
        coarse.addEventListener('change', scheduleResize);
      }
    }
  }

  function init() {
    canvas = document.getElementById('flowfield-canvas');
    if (!canvas || !window.SimplexNoise) return;

    ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    simplex = new SimplexNoise(42);
    syncCanvasSize();
    bindEvents();

    if (isReducedMotion()) {
      paintStaticFrame();
    } else {
      render(1);
    }
    updateRunState();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
