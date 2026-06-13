/**
 * Generative flow field background.
 *
 * The simulation runs on a fixed 60 Hz timestep and renders only after a
 * completed simulation tick. That keeps particle velocity, tail length, and
 * fade behavior consistent on 60 Hz, 120 Hz, 144 Hz, and 240 Hz displays.
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
      this.maxLife = this.life;

      this.hue = settings.colorHueBase + (Math.random() - 0.5) * settings.colorHueRange;
      this.lightness = settings.colorLightnessMin + Math.random() * (settings.colorLightnessMax - settings.colorLightnessMin);
      this.alpha = settings.colorAlphaMin + Math.random() * (settings.colorAlphaMax - settings.colorAlphaMin);
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
        this.prevX = this.x;
        this.prevY = this.y;
      }
    }

    draw() {
      ctx.beginPath();
      ctx.moveTo(this.prevX, this.prevY);
      ctx.lineTo(this.x, this.y);
      ctx.strokeStyle = 'hsla(' + this.hue + ', ' + settings.colorSaturation + '%, ' + this.lightness + '%, ' + this.alpha + ')';
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

  function computeSettings() {
    const coarsePointer = mediaQueryMatches('(pointer: coarse)');
    const reducedMotion = mediaQueryMatches('(prefers-reduced-motion: reduce)');
    const lowPowerDevice = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4);
    const area = Math.max(1, window.innerWidth * window.innerHeight);

    let density = coarsePointer ? 0.0002 : 0.00043;
    let minParticles = coarsePointer ? 110 : 300;
    let maxParticles = coarsePointer ? 440 : 900;

    if (lowPowerDevice) {
      density *= 0.75;
      maxParticles = coarsePointer ? 320 : 700;
    }

    if (reducedMotion) {
      density = 0.00007;
      minParticles = 35;
      maxParticles = 90;
    }

    const particleCount = clamp(Math.round(area * density), minParticles, maxParticles);
    const motionScale = reducedMotion ? 0.35 : 1;

    return {
      ...BASE,
      particleCount,
      particleSpeed: BASE.particleSpeed * motionScale,
      particleMaxSpeed: BASE.particleMaxSpeed * motionScale,
      noiseSpeed: BASE.noiseSpeed * motionScale,
      mouseRadius: coarsePointer ? 150 : BASE.mouseRadius,
      dprCap: coarsePointer || lowPowerDevice ? 1.5 : 2
    };
  }

  function getCanvasDpr(nextSettings) {
    return Math.min(window.devicePixelRatio || 1, nextSettings.dprCap || 2);
  }

  function syncCanvasSize(force) {
    const nextSettings = computeSettings();
    const nextWidth = Math.max(1, window.innerWidth);
    const nextHeight = Math.max(1, window.innerHeight);
    const nextDpr = getCanvasDpr(nextSettings);
    const sizeChanged = nextWidth !== width || nextHeight !== height || nextDpr !== dpr;
    const countChanged = !settings || nextSettings.particleCount !== settings.particleCount;

    settings = nextSettings;

    if (!force && !sizeChanged && !countChanged) return;

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

  function render(ticks) {
    const fadeAlpha = 1 - Math.pow(1 - settings.trailFadePerTick, ticks || 1);
    ctx.fillStyle = 'rgba(10, 10, 15, ' + fadeAlpha + ')';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i += 1) {
      particles[i].draw();
    }
  }

  function animate(timestamp) {
    rafId = 0;
    if (!running) return;

    if ((window.devicePixelRatio || 1) !== lastKnownDpr) {
      syncCanvasSize(true);
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

  function scheduleResize() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      syncCanvasSize(true);
      accumulator = FIXED_STEP_MS;
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

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else start();
    });

    if (window.matchMedia) {
      ['(prefers-reduced-motion: reduce)', '(pointer: coarse)'].forEach((query) => {
        const media = window.matchMedia(query);
        if (typeof media.addEventListener === 'function') {
          media.addEventListener('change', scheduleResize);
        }
      });
    }
  }

  function init() {
    canvas = document.getElementById('flowfield-canvas');
    if (!canvas || !window.SimplexNoise) return;

    ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    simplex = new SimplexNoise(42);
    settings = computeSettings();
    syncCanvasSize(true);
    bindEvents();
    render(1);
    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
