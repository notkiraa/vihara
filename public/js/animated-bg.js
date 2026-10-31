/**
 * ============================================================================
 * FILE: js/animated-bg.js - Serene Buddhist Dharmachakra Parallax Canvas
 * ============================================================================
 * DAFTAR INDEKS & GLOSARIUM SEKSI CEPAT (QUICK LOOKUP GLOSSARY):
 * Gunakan pencarian ID tag [INDEX: JS-BG-XX] untuk langsung menuju baris kode terkait.
 * ----------------------------------------------------------------------------
 * [INDEX: JS-BG-01] Inisialisasi Canvas, Resize Observer & Retina DPR Scaling
 * [INDEX: JS-BG-02] Mouse Parallax Physics dengan Smooth Lerp Damping
 * [INDEX: JS-BG-03] Partikel Embun Suci, Palet Warna Emas & Stardust Physics
 * [INDEX: JS-BG-04] Layer 1: Ambient Aurora Warm Glow & Interactive Torch Light
 * [INDEX: JS-BG-05] Layer 2: Karya Seni Sakral Roda Dhamma (Dharmachakra 8 Jari-Jari)
 * [INDEX: JS-BG-06] 60 FPS Render Loop Controller, Event Listeners & Visibility
 * ============================================================================
 */

/**
 * animated-bg.js - Serene Buddhist Dharmachakra Parallax Canvas
 * Vihara Amurwa Bhumi Cibinong
 * 
 * Filosofi Desain:
 * - Serene, Elegant, Authentic Buddhist Aesthetics (Bukan AI-slop atau garis acak yang semrawut)
 * - Kartu login tetap stabil & kokoh di tengah (tidak goyang/miring)
 * - Roda Dhamma (Dharmachakra 8 Jari-Jari Ariya Atthangika Magga) digambar secara presisi,
 *   artistik, dan berputar anggun dengan pergerakan parallax interaktif kursor mouse
 * - Partikel embun cahaya emas & marun vihara yang melayang tenang laksana debu dupa suci
 * - Performa tinggi 60 FPS Canvas tanpa library eksternal
 */

(function () {
  'use strict';

  function initAnimatedBackground() {
    // ==========================================================================
    // [INDEX: JS-BG-01] INISIALISASI CANVAS, RESIZE OBSERVER & RETINA DPR SCALING
    // Fungsi: Menyiapkan kanvas layar penuh 2D context dengan rasio resolusi retina.
    // ==========================================================================
    let canvas = document.getElementById('animated-bg-canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'animated-bg-canvas';
      canvas.style.position = 'fixed';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.zIndex = '0';
      canvas.style.pointerEvents = 'none';
      document.body.insertBefore(canvas, document.body.firstChild);
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles = [];
    let animationFrameId = null;

    // ==========================================================================
    // [INDEX: JS-BG-02] MOUSE PARALLAX PHYSICS DENGAN SMOOTH LERP DAMPING
    // Fungsi: Kalkulasi vektor kursor mouse/touch teredam halus untuk efek parallax.
    // ==========================================================================
    const mouse = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      targetX: window.innerWidth * 0.5,
      targetY: window.innerHeight * 0.5,
      normX: 0,
      normY: 0,
      targetNormX: 0,
      targetNormY: 0,
      isHovered: false
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ==========================================================================
    // [INDEX: JS-BG-03] PARTIKEL EMBUN SUCI, PALET WARNA EMAS & STARDUST PHYSICS
    // Fungsi: Partikel dupa emas yang melayang tenang ke atas dengan pendaran acak.
    // ==========================================================================
    const emberColors = [
      'rgba(245, 175, 45, ',  // Sacred Gold
      'rgba(225, 75, 95, ',   // Rose Coral
      'rgba(255, 205, 130, ', // Warm Amber
      'rgba(255, 240, 195, ', // Starlight Cream
      'rgba(180, 45, 65, '    // Deep Monastic Maroon
    ];

    function resize() {
      const isMobile = window.innerWidth < 768;
      dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      if (ctx.setTransform) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }
      ctx.scale(dpr, dpr);
      createParticles();
    }

    // --------------------------------------------------------------------------
    // PARTIKEL CAHAYA SUCI (TEMPLE STARDUST / EMBUN DUPA)
    // --------------------------------------------------------------------------
    class StardustParticle {
      constructor() {
        this.reset(true);
      }

      reset(initial = false) {
        this.x = Math.random() * width;
        this.y = initial ? Math.random() * height : height + 15;
        this.depth = Math.random() * 1.2 + 0.6; // Kedalaman 3D
        this.size = (Math.random() * 1.8 + 1.0) * this.depth;
        this.baseColor = emberColors[Math.floor(Math.random() * emberColors.length)];
        this.baseAlpha = (Math.random() * 0.35 + 0.25) * Math.min(1.2, this.depth);
        // Partikel melayang perlahan ke atas (efek dupa/hawa tenang)
        this.speedX = (Math.random() - 0.5) * (prefersReducedMotion ? 0.05 : 0.35);
        this.speedY = -(Math.random() * 0.35 + 0.15) * this.depth;
        this.pulseSpeed = Math.random() * 0.025 + 0.01;
        this.pulseVal = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.y < -20 || this.x < -30 || this.x > width + 30) {
          this.reset(false);
        }

        this.pulseVal += this.pulseSpeed;
        const currentAlpha = this.baseAlpha + Math.sin(this.pulseVal) * 0.12;

        return Math.max(0.08, Math.min(0.85, currentAlpha));
      }

      draw(alpha) {
        // Parallax offset berdasarkan kedalaman (depth plane)
        const px = this.x + mouse.normX * 28 * this.depth;
        const py = this.y + mouse.normY * 28 * this.depth;

        ctx.beginPath();
        ctx.arc(px, py, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.baseColor + alpha + ')';
        ctx.fill();

        // Pendaran lembut partikel dekat
        if (this.depth > 1.3) {
          ctx.beginPath();
          ctx.arc(px, py, this.size * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = this.baseColor + (alpha * 0.22) + ')';
          ctx.fill();
        }
      }
    }

    function createParticles() {
      const count = width < 768 ? 10 : 55;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(new StardustParticle());
      }
    }

    // ==========================================================================
    // [INDEX: JS-BG-04] LAYER 1: AMBIENT AURORA WARM GLOW & INTERACTIVE TORCH LIGHT
    // Fungsi: Gradien radial bernapas hangat rose-coral, emas, dan senter kursor.
    // ==========================================================================
    let auroraTime = 0;
    function drawAmbientAurora() {
      auroraTime += 0.005;

      // Optimasi mobile: 1 gradien halus tunggal untuk mencegah kehabisan GPU memori & tile dropping
      if (width < 768) {
        const gSoft = ctx.createRadialGradient(width * 0.5, height * 0.35, 10, width * 0.5, height * 0.35, Math.min(width, height) * 0.75);
        gSoft.addColorStop(0, 'rgba(245, 175, 45, 0.16)');
        gSoft.addColorStop(0.5, 'rgba(235, 77, 95, 0.07)');
        gSoft.addColorStop(1, 'rgba(235, 77, 95, 0)');
        ctx.fillStyle = gSoft;
        ctx.fillRect(0, 0, width, height);
        return;
      }

      // Aurora 1: Deep Rose-Coral (Kiri Atas)
      const a1x = width * 0.18 + Math.sin(auroraTime) * 35 + mouse.normX * 45;
      const a1y = height * 0.25 + Math.cos(auroraTime * 0.7) * 30 + mouse.normY * 38;
      const r1 = Math.min(width, height) * 0.50;
      const g1 = ctx.createRadialGradient(a1x, a1y, 0, a1x, a1y, r1);
      g1.addColorStop(0, 'rgba(235, 77, 95, 0.28)');
      g1.addColorStop(0.5, 'rgba(235, 77, 95, 0.10)');
      g1.addColorStop(1, 'rgba(235, 77, 95, 0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      // Aurora 2: Sacred Dhamma Gold (Kanan Bawah)
      const a2x = width * 0.82 + Math.cos(auroraTime * 0.8) * 45 - mouse.normX * 55;
      const a2y = height * 0.70 + Math.sin(auroraTime * 0.8) * 40 - mouse.normY * 45;
      const r2 = Math.min(width, height) * 0.52;
      const g2 = ctx.createRadialGradient(a2x, a2y, 0, a2x, a2y, r2);
      g2.addColorStop(0, 'rgba(245, 175, 45, 0.26)');
      g2.addColorStop(0.5, 'rgba(245, 175, 45, 0.09)');
      g2.addColorStop(1, 'rgba(245, 175, 45, 0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      // Aurora 3: Warm Lotus Amber (Tengah Atas)
      const a3x = width * 0.50 + Math.sin(auroraTime * 0.6) * 30 + mouse.normX * 25;
      const a3y = height * 0.30 + Math.cos(auroraTime * 0.5) * 25 + mouse.normY * 20;
      const r3 = Math.min(width, height) * 0.42;
      const g3 = ctx.createRadialGradient(a3x, a3y, 0, a3x, a3y, r3);
      g3.addColorStop(0, 'rgba(255, 195, 135, 0.20)');
      g3.addColorStop(1, 'rgba(255, 195, 135, 0)');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, width, height);

      // Aurora 4: Pendaran Senter Kursor (Interactive Torch Glow)
      if (mouse.isHovered) {
        const torchR = Math.min(width, height) * 0.36;
        const gTorch = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, torchR);
        gTorch.addColorStop(0, 'rgba(255, 230, 160, 0.22)');
        gTorch.addColorStop(0.5, 'rgba(255, 210, 150, 0.07)');
        gTorch.addColorStop(1, 'rgba(255, 195, 140, 0)');
        ctx.fillStyle = gTorch;
        ctx.fillRect(0, 0, width, height);
      }
    }

    // ==========================================================================
    // [INDEX: JS-BG-05] LAYER 2: KARYA SENI SAKRAL RODA DHAMMA (DHARMACHAKRA 8 JARI-JARI)
    // Fungsi: Render vektor 2D pelek ganda, 8 permata, hub nabhi, & 8 ara simetris.
    // ==========================================================================
    let wheelRotation = 0;

    function renderSacredDharmachakra(cx, cy, radius, rotation, baseOpacity) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      const goldStroke = `rgba(215, 155, 35, ${baseOpacity})`;
      const roseStroke = `rgba(185, 45, 68, ${baseOpacity * 0.85})`;
      const subtleGlow = `rgba(245, 185, 50, ${baseOpacity * 0.45})`;

      // 1. Pendaran Aura Luar (Outer Halo)
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = subtleGlow;
      ctx.lineWidth = 5;
      ctx.stroke();

      // 2. Lingkaran Velg Luar (Cakka - Lingkaran Roda Utama)
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.strokeStyle = goldStroke;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // 3. Lingkaran Velg Dalam
      const innerRimR = radius * 0.82;
      ctx.beginPath();
      ctx.arc(0, 0, innerRimR, 0, Math.PI * 2);
      ctx.strokeStyle = roseStroke;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      // 4. Hiasan Permata Suci di Velg Luar (8 Titik Mata Angin)
      const spokeCount = 8;
      for (let i = 0; i < spokeCount; i++) {
        const rad = (i * Math.PI * 2) / spokeCount;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        // Permata Bulat di Velg Luar
        const jewelR = (radius + innerRimR) * 0.5;
        ctx.beginPath();
        ctx.arc(cos * jewelR, sin * jewelR, 2.8, 0, Math.PI * 2);
        ctx.fillStyle = goldStroke;
        ctx.fill();

        // Mahkota Kelopak Lotus di Luar Lingkaran
        ctx.beginPath();
        ctx.arc(cos * (radius + 4.5), sin * (radius + 4.5), 2.0, 0, Math.PI * 2);
        ctx.fillStyle = roseStroke;
        ctx.fill();
      }

      // 5. Lingkaran Resonansi Tengah Bergaris Putus-Putus Halus
      const midRingR = radius * 0.54;
      ctx.beginPath();
      ctx.arc(0, 0, midRingR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(215, 155, 35, ${baseOpacity * 0.45})`;
      ctx.lineWidth = 0.9;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 6. Hub Poros Pusat (Nabhi)
      const hubOuterR = radius * 0.24;
      const hubInnerR = radius * 0.12;

      ctx.beginPath();
      ctx.arc(0, 0, hubOuterR, 0, Math.PI * 2);
      ctx.strokeStyle = goldStroke;
      ctx.lineWidth = 1.6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, hubInnerR, 0, Math.PI * 2);
      ctx.strokeStyle = roseStroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Titik Bindu Pusat (Permata Inti)
      ctx.beginPath();
      ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = goldStroke;
      ctx.fill();

      // 7. 8 Jari-Jari Sakral Terukir Indah (Ariya Atthangika Magga)
      // Masing-masing memiliki tiang silindris berkontur elegan
      for (let i = 0; i < spokeCount; i++) {
        const rad = (i * Math.PI * 2) / spokeCount;
        ctx.save();
        ctx.rotate(rad);

        // Garis Inti Jari-Jari (Emas)
        ctx.beginPath();
        ctx.moveTo(0, hubOuterR);
        ctx.lineTo(0, innerRimR);
        ctx.strokeStyle = goldStroke;
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // Sayap Sisi Jari-Jari Berkontur (Kolom Klasik)
        const baseW = radius * 0.038;
        const tipW = radius * 0.022;

        ctx.beginPath();
        ctx.moveTo(-baseW, hubOuterR + 2);
        ctx.lineTo(-tipW, innerRimR - 2);
        ctx.strokeStyle = roseStroke;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(baseW, hubOuterR + 2);
        ctx.lineTo(tipW, innerRimR - 2);
        ctx.strokeStyle = roseStroke;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Kuncup Bunga Lotus Sambungan Jari-Jari ke Velg
        ctx.beginPath();
        ctx.arc(0, innerRimR - 2.5, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = goldStroke;
        ctx.fill();

        ctx.restore();
      }

      ctx.restore();
    }

    function drawCelestialDharmachakras() {
      // Perputaran roda sangat lambat & meditatif (zen-like, sakral)
      wheelRotation += 0.0006;

      // Efek bernapas lembut pada pendaran
      const breath = Math.sin(auroraTime * 0.8) * 0.035;

      // 1. Roda Dhamma Utama (Kanan Atas - Agung & Megah)
      const w1x = width * 0.84 - mouse.normX * 45;
      const w1y = height * 0.26 - mouse.normY * 35;
      const w1r = Math.min(width, height) * 0.28;
      renderSacredDharmachakra(w1x, w1y, w1r, wheelRotation, 0.24 + breath);

      // 2. Roda Dhamma Sekunder (Kiri Bawah - Harmonis)
      const w2x = width * 0.14 + mouse.normX * 55;
      const w2y = height * 0.76 + mouse.normY * 42;
      const w2r = Math.min(width, height) * 0.22;
      renderSacredDharmachakra(w2x, w2y, w2r, -wheelRotation * 0.85, 0.20 + breath);
    }

    // --------------------------------------------------------------------------
    // MAIN ANIMATION LOOP
    // --------------------------------------------------------------------------
    // ==========================================================================
    // [INDEX: JS-BG-06] 60 FPS RENDER LOOP CONTROLLER, EVENT LISTENERS & VISIBILITY
    // Fungsi: Siklus animasi requestAnimationFrame 60 FPS dan pendengar resize/mouse.
    // ==========================================================================
    let lastFrameTime = 0;
    function animate(currentTime = 0) {
      animationFrameId = requestAnimationFrame(animate);

      // Jika ada modal terbuka (error, QR, presensi, dll) atau overlay standee aktif,
      // lewati render canvas untuk membebaskan GPU mobile sepenuhnya dan mencegah tile drop
      if (document.querySelector('.modal-backdrop.show') || document.body.classList.contains('standee-active')) {
        return;
      }

      // Throttling 30 FPS di mobile untuk kenyamanan baterai dan kompositor GPU
      const elapsed = currentTime - lastFrameTime;
      if (width < 768 && elapsed < 32) {
        return;
      }
      lastFrameTime = currentTime;

      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;
      mouse.normX += (mouse.targetNormX - mouse.normX) * 0.05;
      mouse.normY += (mouse.targetNormY - mouse.normY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      // 1. Aurora Pendaran Hangat Vihara
      drawAmbientAurora();

      // 2. Roda Dhamma Sakral Berputar Anggun & Parallax
      drawCelestialDharmachakras();

      // 3. Partikel Embun Suci Melayang Tenang
      for (let i = 0; i < particles.length; i++) {
        const alpha = particles[i].update();
        particles[i].draw(alpha);
      }
    }

    // --------------------------------------------------------------------------
    // EVENT LISTENERS
    // --------------------------------------------------------------------------
    function onPointerMove(e) {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      mouse.targetX = clientX;
      mouse.targetY = clientY;
      mouse.targetNormX = (clientX - width * 0.5) / (width * 0.5);
      mouse.targetNormY = (clientY - height * 0.5) / (height * 0.5);
      mouse.isHovered = true;
    }

    function onPointerLeave() {
      mouse.targetNormX = 0;
      mouse.targetNormY = 0;
      mouse.targetX = width * 0.5;
      mouse.targetY = height * 0.5;
      mouse.isHovered = false;
    }

    // Dukungan Gyroscope Mobile (Jika ada)
    let lastGyro = 0;
    function onDeviceOrientation(e) {
      const now = Date.now();
      if (now - lastGyro < 120) return;
      lastGyro = now;
      if (e.gamma !== null && e.beta !== null) {
        const g = Math.max(-30, Math.min(30, e.gamma));
        const b = Math.max(-30, Math.min(30, e.beta - 45));
        mouse.targetNormX = g / 30;
        mouse.targetNormY = b / 30;
      }
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('mouseleave', onPointerLeave);
    window.addEventListener('touchend', onPointerLeave);

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', onDeviceOrientation, { passive: true });
    }

    // Otomatis pause saat tab disembunyikan
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
      } else {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animate();
      }
    });

    resize();
    animate();
  }

  // Jalankan saat DOM siap
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimatedBackground);
  } else {
    initAnimatedBackground();
  }

  window.initAnimatedBackground = initAnimatedBackground;
})();
