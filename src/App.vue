<template lang="pug">
div#wrapper(v-if="loaded" style="position: relative; z-index: 1; min-height: 100vh; display: flex; flex-direction: column;")
  // Animated Interactive Background Canvas
  canvas#theme-constellation-canvas(style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none;")

  aw-header(style="position: relative; z-index: 100;")

  div(:class="{'container': !fullContainer, 'container-fluid': fullContainer}").px-0.px-md-2(style="position: relative; z-index: 10; flex: 1;")
    div.aw-container.my-sm-3.p-3
      error-boundary
        user-satisfaction-poll
        new-release-notification(v-if="isNewReleaseCheckEnabled")
        router-view

  aw-footer(style="position: relative; z-index: 10;")

  onboarding-modal
</template>

<script lang="ts">
import { useSettingsStore } from '~/stores/settings';
import { useServerStore } from '~/stores/server';
import { detectPreferredTheme } from '~/util/theme';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  originalColor: { r: number; g: number; b: number };
  color: { r: number; g: number; b: number };
}

export default {
  data: function () {
    return {
      activityViews: [],
      isNewReleaseCheckEnabled: !process.env.VUE_APP_ON_ANDROID,
      loaded: false,
      canvas: null as HTMLCanvasElement | null,
      ctx: null as CanvasRenderingContext2D | null,
      particles: [] as Particle[],
      sparks: [] as Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
        color: { r: number; g: number; b: number };
        opacity: number;
      }>,
      mouse: { x: -1000, y: -1000 },
      ripple: { x: 0, y: 0, radius: 0, opacity: 0, active: false },
      currentBg: { r: 13, g: 13, b: 21 },
      animationId: 0,
    };
  },

  computed: {
    fullContainer() {
      return this.$route.meta.fullContainer;
    },
  },

  async beforeCreate() {
    // Get Theme From LocalStorage
    const settingsStore = useSettingsStore();
    await settingsStore.ensureLoaded();
    const theme = settingsStore.theme;
    const detectedTheme = theme === 'auto' ? detectPreferredTheme() : theme;

    // Apply the dark theme if detected
    if (detectedTheme === 'dark') {
      const themeLink = document.createElement('link');
      themeLink.id = 'aw-theme-dark';
      themeLink.href = window.location.protocol === 'file:' ? 'dark.css' : '/dark.css';
      themeLink.rel = 'stylesheet';
      document.querySelector('head').appendChild(themeLink);
    }
    this.loaded = true;
  },

  mounted: async function () {
    const serverStore = useServerStore();
    await serverStore.getInfo();

    // Start background canvas animation
    this.$nextTick(() => {
      this.initCanvas();
    });
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.resizeCanvas);
    document.removeEventListener('mousemove', this.updateMouse);
    document.removeEventListener('mousedown', this.triggerRipple);
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  },

  methods: {
    initCanvas() {
      this.canvas = document.getElementById('theme-constellation-canvas') as HTMLCanvasElement;
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) return;

      this.resizeCanvas();
      this.createParticles();

      window.addEventListener('resize', this.resizeCanvas);
      document.addEventListener('mousemove', this.updateMouse);
      document.addEventListener('mousedown', this.triggerRipple);

      // Detect initial theme for currentBg colors
      const isDark = document.querySelector('#aw-theme-dark') !== null;
      this.currentBg = isDark ? { r: 10, g: 10, b: 16 } : { r: 244, g: 246, b: 250 };

      this.animate();
    },

    resizeCanvas() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    createParticles() {
      this.particles = [];
      const numParticles = 110;
      const palette = [
        { r: 6, g: 182, b: 212 }, // cyan
        { r: 139, g: 92, b: 246 }, // violet
        { r: 16, g: 185, b: 129 }, // emerald
      ];

      for (let i = 0; i < numParticles; i++) {
        const color = palette[i % palette.length];
        this.particles.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          radius: Math.random() * 1.5 + 1.2,
          originalColor: { ...color },
          color: { ...color },
        });
      }
    },

    updateMouse(e: MouseEvent) {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;

      // Spawn a single extremely faint trail spark on mouse move (limit frequency to keep it subtle)
      if (Math.random() < 0.15) {
        const isDark = document.querySelector('#aw-theme-dark') !== null;
        const sparkColor = isDark ? { r: 6, g: 182, b: 212 } : { r: 148, g: 163, b: 184 };
        this.sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 1.2 + 0.8,
          color: { ...sparkColor },
          opacity: 0.25
        });
      }
    },

    triggerRipple(e: MouseEvent) {
      this.ripple.x = e.clientX;
      this.ripple.y = e.clientY;
      this.ripple.radius = 0;
      this.ripple.opacity = 1.0;
      this.ripple.active = true;

      // Spawn radiating spark particles depending on the active theme
      const isDark = document.querySelector('#aw-theme-dark') !== null;
      const sparkColor = isDark ? { r: 6, g: 182, b: 212 } : { r: 56, g: 189, b: 248 };
      
      this.sparks = [];
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.5 + 1.5;
        this.sparks.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 2 + 1.5,
          color: { ...sparkColor },
          opacity: 1.0
        });
      }

      // Push particles slightly away from click
      for (const p of this.particles) {
        const dx = p.x - e.clientX;
        const dy = p.y - e.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const pushForce = (180 - dist) * 0.08;
          p.vx += (dx / dist) * pushForce;
          p.vy += (dy / dist) * pushForce;
        }
      }
    },

    animate() {
      if (!this.canvas || !this.ctx) return;
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;

      // Check current theme
      const isDark = document.querySelector('#aw-theme-dark') !== null;

      // Smooth background color interpolation
      const targetBg = isDark ? { r: 10, g: 10, b: 16 } : { r: 244, g: 246, b: 250 };
      this.currentBg.r += (targetBg.r - this.currentBg.r) * 0.08;
      this.currentBg.g += (targetBg.g - this.currentBg.g) * 0.08;
      this.currentBg.b += (targetBg.b - this.currentBg.b) * 0.08;

      ctx.fillStyle = `rgb(${Math.round(this.currentBg.r)}, ${Math.round(this.currentBg.g)}, ${Math.round(this.currentBg.b)})`;
      ctx.fillRect(0, 0, width, height);

      // Ambient slow-shifting radial gradients
      const time = Date.now();
      const grad = ctx.createRadialGradient(
        width * 0.5 + Math.sin(time * 0.0003) * width * 0.15,
        height * 0.5 + Math.cos(time * 0.0003) * height * 0.15,
        0,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.6
      );
      if (isDark) {
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.04)');      // Glowing Cyan
        grad.addColorStop(0.4, 'rgba(139, 92, 246, 0.03)');   // Glowing Violet
        grad.addColorStop(0.8, 'rgba(79, 70, 229, 0.015)');   // Deep Indigo
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        grad.addColorStop(0, 'rgba(56, 189, 248, 0.05)');     // Fresh Blue Sky
        grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.02)');   // Subtle Pink Blush
        grad.addColorStop(0.8, 'rgba(129, 140, 248, 0.015)'); // Light Violet Tint
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Update and draw sparks first (rendered behind connection lines & particles)
      for (let i = this.sparks.length - 1; i >= 0; i--) {
        const s = this.sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.96;
        s.vy *= 0.96;
        s.opacity -= 0.025;

        if (s.opacity <= 0) {
          this.sparks.splice(i, 1);
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, 2 * Math.PI);
          ctx.fillStyle = `rgba(${s.color.r}, ${s.color.g}, ${s.color.b}, ${s.opacity})`;
          ctx.fill();
        }
      }

      // Update and draw particles
      for (const p of this.particles) {
        // Physics update
        p.x += p.vx;
        p.y += p.vy;

        // Friction to steady the velocity
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Bouncing
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Cursor attraction gravity force (More Power!)
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 220) {
          const force = (220 - dist) / 220 * 0.055;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;

          // Connection threads
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(this.mouse.x, this.mouse.y);
            const lineAlpha = ((140 - dist) / 140) * (isDark ? 0.15 : 0.22);
            ctx.strokeStyle = isDark ? `rgba(6, 182, 212, ${lineAlpha})` : `rgba(148, 163, 184, ${lineAlpha})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
          }
        }

        // Color morphing based on active theme (gorgeous colored balls in both themes)
        const targetColor = p.originalColor;
        p.color.r += (targetColor.r - p.color.r) * 0.08;
        p.color.g += (targetColor.g - p.color.g) * 0.08;
        p.color.b += (targetColor.b - p.color.b) * 0.08;

        // Draw particle glowing aura (extra visibility)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${isDark ? 0.10 : 0.07})`;
        ctx.fill();

        // Draw core particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI);
        const nodeAlpha = isDark ? 0.65 : 0.55;
        ctx.fillStyle = `rgba(${Math.round(p.color.r)}, ${Math.round(p.color.g)}, ${Math.round(p.color.b)}, ${nodeAlpha})`;
        ctx.fill();
      }

      // Render click ripple shockwaves (Triple Ring)
      if (this.ripple.active) {
        this.ripple.radius += 3.8;
        this.ripple.opacity -= 0.015;
        if (this.ripple.opacity <= 0) {
          this.ripple.active = false;
        } else {
          const rippleColor = isDark ? '6, 182, 212' : '56, 189, 248';
          
          // Ring 1 (Primary)
          ctx.beginPath();
          ctx.arc(this.ripple.x, this.ripple.y, this.ripple.radius, 0, 2 * Math.PI);
          ctx.strokeStyle = `rgba(${rippleColor}, ${this.ripple.opacity * 0.35})`;
          ctx.lineWidth = 2.0;
          ctx.stroke();

          // Ring 2 (Delayed Secondary)
          if (this.ripple.radius > 15) {
            ctx.beginPath();
            ctx.arc(this.ripple.x, this.ripple.y, this.ripple.radius - 15, 0, 2 * Math.PI);
            ctx.strokeStyle = `rgba(${rippleColor}, ${this.ripple.opacity * 0.22})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();
          }

          // Ring 3 (Outer faint expansion wave)
          ctx.beginPath();
          ctx.arc(this.ripple.x, this.ripple.y, this.ripple.radius * 1.25, 0, 2 * Math.PI);
          ctx.strokeStyle = `rgba(${rippleColor}, ${this.ripple.opacity * 0.12})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      this.animationId = requestAnimationFrame(this.animate);
    },
  },
};
</script>
