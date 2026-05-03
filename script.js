/* ═══════════════════════════════════════════════════════════════════════════
   CHERNOBYL INTERACTIVE DOCUMENTARY — UPGRADED JAVASCRIPT
   ═══════════════════════════════════════════════════════════════════════════
   Features:
   - GSAP ScrollTrigger for scroll-driven animations
   - Web Audio API for Geiger counter, explosions, heartbeat
   - Canvas animations for hero, explosion, chain reaction, radiation spread
   - Decision point system with game logic
   - Drag slider for Pripyat before/after
   - Dosimeter gauge with scroll-driven needle
   - Progress bar and vignette overlay
   - Character-by-character text reveals
   - Stat counter animations
   ═══════════════════════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION & SETUP
// ═══════════════════════════════════════════════════════════════════════════

gsap.registerPlugin(ScrollTrigger);

const state = {
  decisions: {},
  soundEnabled: true,
  scrollProgress: 0,
  explosionProgress: 0,
  heartbeatInterval: null,
  explosionBoomFired: false,
};

// YouTube video IDs (archival footage)
const videoIds = {
  hero: 'dVrI9OjOuFo',      // Chernobyl documentary footage
  act2: 'sZJLyVHfJvY',      // Nuclear explosion/disaster footage
  act3: 'xvJDmRkKuPo',      // Soviet response footage
  act6: 'vJLe-9bVmxI',      // Pripyat today
};

// ═══════════════════════════════════════════════════════════════════════════
// AUDIO CONTEXT & WEB AUDIO
// ═══════════════════════════════════════════════════════════════════════════

let audioContext;
let masterGain;
let geigerOscillator;
let geigerGain;
let geigerActive = false;

function initAudio() {
  if (audioContext) return;
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.connect(audioContext.destination);
    masterGain.gain.value = 0.3;
  } catch (e) {
    console.warn('Web Audio API not available:', e);
    audioContext = null;
  }
}

function startGeigerCounter() {
  if (!state.soundEnabled || geigerActive) return;
  
  initAudio();
  if (!audioContext) return;
  
  geigerActive = true;
  
  // Geiger counter: random clicks at varying intervals
  const clickGeiger = () => {
    if (!geigerActive || !audioContext) return;
    
    const osc = audioContext.createOscillator();
    const env = audioContext.createGain();
    
    osc.frequency.value = 400 + Math.random() * 200;
    osc.connect(env);
    env.connect(masterGain);
    
    env.gain.setValueAtTime(0.1, audioContext.currentTime);
    env.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.05);
    
    // Random interval: 200-800ms
    setTimeout(clickGeiger, 200 + Math.random() * 600);
  };
  
  clickGeiger();
}

function stopGeigerCounter() {
  geigerActive = false;
}

function playExplosionBoom() {
  if (!state.soundEnabled || state.explosionBoomFired) return;
  
  initAudio();
  if (!audioContext) return;
  
  state.explosionBoomFired = true;
  
  // Deep boom: low frequency sweep
  const osc = audioContext.createOscillator();
  const env = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, audioContext.currentTime);
  osc.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.8);
  
  filter.type = 'lowpass';
  filter.frequency.value = 200;
  
  osc.connect(filter);
  filter.connect(env);
  env.connect(masterGain);
  
  env.gain.setValueAtTime(0.3, audioContext.currentTime);
  env.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
  
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 1);
}

function playDecisionClick() {
  if (!state.soundEnabled) return;
  
  initAudio();
  if (!audioContext) return;
  
  const osc = audioContext.createOscillator();
  const env = audioContext.createGain();
  
  osc.frequency.value = 800;
  osc.connect(env);
  env.connect(masterGain);
  
  env.gain.setValueAtTime(0.1, audioContext.currentTime);
  env.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
  
  osc.start(audioContext.currentTime);
  osc.stop(audioContext.currentTime + 0.1);
}

function playHeartbeat() {
  if (!state.soundEnabled) return;
  
  initAudio();
  if (!audioContext) return;
  
  const beat = (freq, duration) => {
    const osc = audioContext.createOscillator();
    const env = audioContext.createGain();
    
    osc.frequency.value = freq;
    osc.connect(env);
    env.connect(masterGain);
    
    env.gain.setValueAtTime(0.15, audioContext.currentTime);
    env.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + duration);
  };
  
  beat(60, 0.1);
  setTimeout(() => beat(80, 0.08), 150);
}

function startHeartbeatLoop() {
  if (state.heartbeatInterval) return;
  playHeartbeat();
  state.heartbeatInterval = setInterval(() => {
    playHeartbeat();
  }, 1200);
}

function stopHeartbeatLoop() {
  if (state.heartbeatInterval) {
    clearInterval(state.heartbeatInterval);
    state.heartbeatInterval = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SOUND BUTTON
// ═══════════════════════════════════════════════════════════════════════════

const soundBtn = document.getElementById('sound-btn');
if (soundBtn) {
  soundBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    const iconOn = document.getElementById('sound-icon-on');
    const iconOff = document.getElementById('sound-icon-off');
    const label = document.getElementById('sound-label');
    
    if (state.soundEnabled) {
      iconOn && iconOn.classList.remove('hidden');
      iconOff && iconOff.classList.add('hidden');
      label && (label.textContent = 'SOUND');
      startGeigerCounter();
    } else {
      iconOn && iconOn.classList.add('hidden');
      iconOff && iconOff.classList.remove('hidden');
      label && (label.textContent = 'MUTE');
      stopGeigerCounter();
      stopHeartbeatLoop();
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// HERO SECTION CANVAS
// ═══════════════════════════════════════════════════════════════════════════

function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Animated particles (radiation effect)
  const particles = [];
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    });
  }
  
  function animate() {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.opacity *= 0.995;
      
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      
      ctx.fillStyle = `rgba(192, 57, 43, ${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

// ═══════════════════════════════════════════════════════════════════════════
// RADIATION RINGS CANVAS
// ═══════════════════════════════════════════════════════════════════════════

function initRadiationRings() {
  const canvas = document.getElementById('radiation-rings-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  let time = 0;
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.6;
    
    // Multiple pulsing rings
    for (let i = 0; i < 4; i++) {
      const radius = (time + i * 40) % 200;
      const opacity = Math.max(0, 1 - radius / 200) * 0.3;
      
      ctx.strokeStyle = `rgba(192, 57, 43, ${opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    time += 1;
    requestAnimationFrame(animate);
  }
  
  animate();
}

// ═══════════════════════════════════════════════════════════════════════════
// LIVE CLOCK
// ═══════════════════════════════════════════════════════════════════════════

function initLiveClock() {
  const clock = document.getElementById('hero-clock');
  if (!clock) return;
  
  // Start at 01:23:44 and count up
  let seconds = (1 * 3600) + (23 * 60) + 44;
  
  function updateClock() {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    clock.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    
    seconds++;
    if (seconds > 86400) seconds = 0;
    
    setTimeout(updateClock, 1000);
  }
  
  updateClock();
}

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFIED STAMP ANIMATION
// ═══════════════════════════════════════════════════════════════════════════

function initClassifiedStamp() {
  const stamp = document.getElementById('classified-stamp');
  if (!stamp) return;
  
  // Pulsing animation after initial appear
  gsap.to(stamp, {
    textShadow: '0 0 30px rgba(192, 57, 43, 0.8)',
    duration: 1.5,
    repeat: -1,
    yoyo: true,
    delay: 1.5,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PERIODIC GLITCH ON HERO TITLE (~8 seconds)
// ═══════════════════════════════════════════════════════════════════════════

function initPeriodicGlitch() {
  const title = document.getElementById('hero-ru-text');
  if (!title) return;
  
  setInterval(() => {
    title.classList.add('glitch-active');
    setTimeout(() => {
      title.classList.remove('glitch-active');
    }, 300);
  }, 8000);
}

// ═══════════════════════════════════════════════════════════════════════════
// YOUTUBE VIDEO INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════

function loadYouTubeVideo(containerId, videoId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const iframe = container.querySelector('iframe');
  if (iframe) {
    iframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&controls=0&autoplay=1&mute=1&loop=1&playsinline=1&playlist=${videoId}&enablejsapi=1`;
  }
}

// Lazy-load videos on scroll
document.addEventListener('DOMContentLoaded', () => {
  const videoContainers = [
    { id: 'hero-video-container', videoId: videoIds.hero },
    { id: 'act2-video-container', videoId: videoIds.act2 },
    { id: 'act3-video-container', videoId: videoIds.act3 },
    { id: 'act6-video-container', videoId: videoIds.act6 },
  ];
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const container = entry.target;
        const videoId = container.dataset.videoId;
        if (videoId && !container.dataset.loaded) {
          loadYouTubeVideo(container.id, videoId);
          container.dataset.loaded = 'true';
          observer.unobserve(container);
        }
      }
    });
  });
  
  videoContainers.forEach(({ id, videoId }) => {
    const container = document.getElementById(id);
    if (container) {
      container.dataset.videoId = videoId;
      observer.observe(container);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EXPLOSION SCROLL CANVAS
// ═══════════════════════════════════════════════════════════════════════════

function initExplosionCanvas() {
  const canvas = document.getElementById('explosion-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const container = document.getElementById('act2-scroll');
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Timeline of explosion events
  const explosionEvents = [
    { t: 0.0, label: 'TEST INITIATED', power: 200 },
    { t: 0.1, label: 'TURBINE TRIP', power: 500 },
    { t: 0.2, label: 'POWER SURGE', power: 2000 },
    { t: 0.3, label: 'FUEL FRAGMENTATION', power: 8000 },
    { t: 0.4, label: 'STEAM EXPLOSION', power: 15000 },
    { t: 0.5, label: 'GRAPHITE FIRE', power: 30000 },
    { t: 0.6, label: 'CONTAINMENT BREACH', power: 30000 },
    { t: 0.7, label: 'REACTOR OPEN', power: 30000 },
    { t: 0.85, label: 'RADIATION RELEASE', power: 30000 },
  ];
  
  ScrollTrigger.create({
    trigger: '#act2-scroll',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      state.explosionProgress = self.progress;
      
      // Update HUD
      const hudClock = document.getElementById('hud-clock');
      const hudEvent = document.getElementById('hud-event');
      const hudPower = document.getElementById('hud-power');
      const hudBarFill = document.getElementById('hud-bar-fill');
      const expProgressFill = document.getElementById('exp-progress-fill');
      const expSubtitle = document.getElementById('exp-subtitle');
      const expAftermath = document.getElementById('exp-aftermath');
      
      if (hudClock) {
        const secs = 44 + Math.floor(self.progress * 44);
        hudClock.textContent = `01:23:${String(secs).padStart(2, '0')}`;
      }
      
      // Find current event
      let currentEvent = explosionEvents[0];
      for (let e of explosionEvents) {
        if (self.progress >= e.t) currentEvent = e;
      }
      
      if (hudEvent) hudEvent.textContent = currentEvent.label;
      if (hudPower) hudPower.textContent = `${currentEvent.power} MW`;
      if (hudBarFill) {
        const fillPercent = Math.min(100, (currentEvent.power / 30000) * 100);
        hudBarFill.style.setProperty('--fill', `${fillPercent}%`);
        // Update the ::after pseudo via CSS custom property
        const barAfter = hudBarFill.querySelector('::after');
        // Set a CSS variable on the element for the pseudo-element to read
        hudBarFill.style.setProperty('--bar-width', `${fillPercent}%`);
      }
      if (expProgressFill) expProgressFill.style.width = `${self.progress * 100}%`;
      
      // Fire explosion boom at t >= 0.50 (GRAPHITE FIRE event)
      if (self.progress >= 0.50) {
        playExplosionBoom();
      }
      
      // Show aftermath text after 85% scroll
      if (self.progress > 0.85) {
        if (expSubtitle) expSubtitle.classList.add('show');
        if (expAftermath && !expAftermath.classList.contains('show')) {
          expAftermath.classList.add('show');
          triggerGlitch();
        }
      }
      
      // Draw explosion animation
      drawExplosion(ctx, canvas, self.progress);
    },
  });
  
  function drawExplosion(ctx, canvas, progress) {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.95)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Phase 1: Buildup (0-0.3)
    if (progress < 0.3) {
      const p = progress / 0.3;
      const glow = 50 + p * 100;
      
      ctx.fillStyle = `rgba(255, 107, 0, ${0.1 * p})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glow, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Phase 2: Explosion (0.3-0.6)
    if (progress >= 0.3 && progress < 0.6) {
      const p = (progress - 0.3) / 0.3;
      const blastRadius = 100 + p * 300;
      const opacity = Math.max(0, 1 - p);
      
      ctx.strokeStyle = `rgba(255, 107, 0, ${opacity * 0.6})`;
      ctx.lineWidth = 3 + p * 10;
      ctx.beginPath();
      ctx.arc(centerX, centerY, blastRadius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Blast wave
      ctx.fillStyle = `rgba(255, 160, 40, ${opacity * 0.2})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, blastRadius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Phase 3: Fireball (0.6-0.85)
    if (progress >= 0.6 && progress < 0.85) {
      const p = (progress - 0.6) / 0.25;
      const fireSize = 200 + p * 100;
      
      ctx.fillStyle = `rgba(255, 130, 30, ${(1 - p) * 0.4})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 50, fireSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Smoke
      ctx.fillStyle = `rgba(100, 100, 100, ${(1 - p) * 0.3})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 100, fireSize * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Phase 4: Radiation cloud (0.85+)
    if (progress >= 0.85) {
      const p = (progress - 0.85) / 0.15;
      
      // Expanding radiation cloud
      ctx.fillStyle = `rgba(192, 57, 43, ${Math.max(0, 0.3 - p * 0.3)})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 150, 150 + p * 200, 0, Math.PI * 2);
      ctx.fill();
      
      // Radiation symbol
      ctx.strokeStyle = `rgba(192, 57, 43, ${Math.max(0, 0.5 - p * 0.5)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 150, 80, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function triggerGlitch() {
  const overlay = document.getElementById('glitch-overlay');
  if (!overlay) return;
  
  overlay.classList.remove('active');
  void overlay.offsetWidth; // Trigger reflow
  overlay.classList.add('active');
  
  // Glitch title
  const title = document.getElementById('hero-title-main');
  if (title) title.classList.add('glitch');
  setTimeout(() => {
    if (title) title.classList.remove('glitch');
  }, 300);
}

// ═══════════════════════════════════════════════════════════════════════════
// CHAIN REACTION CANVAS (ACT IV)
// ═══════════════════════════════════════════════════════════════════════════

function initChainCanvas() {
  const canvas = document.getElementById('chain-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Animated neutrons and fission events
  const neutrons = [];
  for (let i = 0; i < 20; i++) {
    neutrons.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: Math.random(),
    });
  }
  
  function animate() {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw core
    ctx.fillStyle = 'rgba(192, 57, 43, 0.2)';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 100, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(192, 57, 43, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Animate neutrons
    neutrons.forEach((n) => {
      n.x += n.vx;
      n.y += n.vy;
      n.life -= 0.005;
      
      if (n.life <= 0) {
        n.x = Math.random() * canvas.width;
        n.y = Math.random() * canvas.height;
        n.life = 1;
      }
      
      ctx.fillStyle = `rgba(255, 160, 40, ${n.life * 0.6})`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

// ═══════════════════════════════════════════════════════════════════════════
// RADIATION SPREAD CANVAS (ACT V)
// ═══════════════════════════════════════════════════════════════════════════

function initSpreadCanvas() {
  const canvas = document.getElementById('spread-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  canvas.width = 600;
  canvas.height = 400;
  
  // Simple map of radiation spread
  function draw() {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Radiation zones (concentric circles)
    const zones = [
      { radius: 40, color: 'rgba(192, 57, 43, 0.4)', label: 'Severe' },
      { radius: 80, color: 'rgba(230, 126, 34, 0.3)', label: 'Heavy' },
      { radius: 140, color: 'rgba(240, 192, 64, 0.2)', label: 'Significant' },
      { radius: 200, color: 'rgba(42, 122, 58, 0.15)', label: 'Measurable' },
    ];
    
    zones.forEach((zone) => {
      ctx.fillStyle = zone.color;
      ctx.beginPath();
      ctx.arc(centerX, centerY, zone.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Reactor symbol
    ctx.fillStyle = 'rgba(192, 57, 43, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Radiation symbol
    ctx.strokeStyle = 'rgba(192, 57, 43, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  draw();
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIPYAT BEFORE/AFTER SLIDER
// ═══════════════════════════════════════════════════════════════════════════

function initPripyatSlider() {
  const container = document.getElementById('pripyat-slider-container');
  const divider = document.getElementById('slider-divider');
  if (!container || !divider) return;
  
  const sliderAfter = container.querySelector('.slider-after');
  if (!sliderAfter) return;
  
  let isDragging = false;
  
  function updateSlider(x) {
    const rect = container.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    
    divider.style.left = `${percent * 100}%`;
    sliderAfter.style.clipPath = `inset(0 ${(1 - percent) * 100}% 0 0)`;
  }
  
  divider.addEventListener('mousedown', () => {
    isDragging = true;
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) updateSlider(e.clientX);
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  // Touch support
  divider.addEventListener('touchstart', (e) => {
    isDragging = true;
    e.preventDefault();
  });
  
  document.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length > 0) {
      updateSlider(e.touches[0].clientX);
    }
  });
  
  document.addEventListener('touchend', () => {
    isDragging = false;
  });
  
  // Initialize at 50%
  updateSlider(container.getBoundingClientRect().left + container.getBoundingClientRect().width / 2);
}

// ═══════════════════════════════════════════════════════════════════════════
// DOSIMETER GAUGE
// ═══════════════════════════════════════════════════════════════════════════

function initDosimeter() {
  const needle = document.getElementById('dosimeter-needle');
  const readout = document.getElementById('dosimeter-value');
  
  if (!needle || !readout) return;
  
  ScrollTrigger.create({
    trigger: '#dosimeter-section',
    start: 'top center',
    end: 'bottom center',
    onUpdate: (self) => {
      // Map scroll progress to radiation exposure (0-1000 mSv)
      const exposure = self.progress * 1000;
      
      // Needle angle: -135° to +135° (270° range)
      const angle = -135 + self.progress * 270;
      
      needle.style.transform = `rotate(${angle}deg)`;
      readout.textContent = `${Math.round(exposure)} mSv`;
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PROGRESS BAR & VIGNETTE
// ═══════════════════════════════════════════════════════════════════════════

function initProgressBar() {
  const progressBar = document.getElementById('progress-bar');
  const vignetteOverlay = document.getElementById('vignette-overlay');
  
  window.addEventListener('scroll', () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY / scrollHeight;
    
    if (progressBar) progressBar.style.width = `${scrolled * 100}%`;
    
    // Intensify vignette specifically when entering Act II
    const act2Trans = document.getElementById('act-trans-II');
    if (vignetteOverlay && act2Trans) {
      const act2Rect = act2Trans.getBoundingClientRect();
      const act3Trans = document.getElementById('act-trans-III');
      const act3Rect = act3Trans ? act3Trans.getBoundingClientRect() : null;
      
      // Vignette intensifies from Act II transition through Act III
      const inAct2Region = act2Rect.top < window.innerHeight && act3Rect && act3Rect.top > 0;
      if (inAct2Region) {
        vignetteOverlay.classList.add('intense');
      } else if (scrolled > 0.7) {
        vignetteOverlay.classList.add('intense');
      } else {
        vignetteOverlay.classList.remove('intense');
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// HEARTBEAT SCROLL TRIGGER (Act II & Act III)
// ═══════════════════════════════════════════════════════════════════════════

function initHeartbeatScrollTrigger() {
  // Act II prelude
  const act2Prelude = document.getElementById('act2-prelude');
  const act3 = document.getElementById('act3');
  
  if (act2Prelude) {
    ScrollTrigger.create({
      trigger: act2Prelude,
      start: 'top center',
      end: 'bottom center',
      onEnter: startHeartbeatLoop,
      onLeave: stopHeartbeatLoop,
      onEnterBack: startHeartbeatLoop,
      onLeaveBack: stopHeartbeatLoop,
    });
  }
  
  if (act3) {
    ScrollTrigger.create({
      trigger: act3,
      start: 'top center',
      end: 'bottom center',
      onEnter: startHeartbeatLoop,
      onLeave: stopHeartbeatLoop,
      onEnterBack: startHeartbeatLoop,
      onLeaveBack: stopHeartbeatLoop,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DECISION POINTS
// ═══════════════════════════════════════════════════════════════════════════

const decisionResults = {
  1: {
    A: {
      label: 'You formally objected.',
      result: 'In history, no one objected. The test proceeded as scheduled. Your choice would have been the correct one — but it would have required courage that the system did not reward.',
    },
    B: {
      label: 'You accepted the delay and proceeded.',
      result: 'This is what happened. The test proceeded. The reactor was xenon-poisoned. The power was too low. The operators had to withdraw almost all control rods. The system was set up to fail.',
    },
  },
  2: {
    A: {
      label: 'You refused to disable emergency cooling.',
      result: 'You would have been overruled. Dyatlov had the authority. The ECCS was disconnected. But your refusal would have been noted — and you might have survived the night.',
    },
    B: {
      label: 'You complied and disabled the ECCS.',
      result: 'This is what happened. Leonid Toptunov pressed the button. He disabled the emergency cooling system. Forty minutes later, he was dead.',
    },
  },
  3: {
    A: {
      label: 'You reported the full truth.',
      result: 'You would have been removed from your position. The Soviet system did not reward truth-telling. But the world would have known. The RBMK design flaws would have been exposed immediately.',
    },
    B: {
      label: 'You forwarded Bryukhanov\'s report.',
      result: 'This is what happened. The evacuation was delayed by 36 hours. Thirty thousand people remained in a lethal radiation field. The cover-up continued.',
    },
  },
  4: {
    A: {
      label: 'You presented the full technical picture.',
      result: 'Valery Legasov chose this. He presented the positive void coefficient. He presented the graphite tip flaw. He told the world what the RBMK actually was. Then he went home and recorded his memoirs. Two years later, he was dead.',
    },
    B: {
      label: 'You followed your instructions.',
      result: 'This is what the system wanted. Blame the operators. Protect the programme. But Legasov could not live with that choice. The tapes were his reckoning.',
    },
  },
};

function initDecisionPoints() {
  document.querySelectorAll('.dp-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      playDecisionClick();
      
      const dp = btn.dataset.dp;
      const choice = btn.dataset.choice;
      
      state.decisions[dp] = choice;
      
      // Show result
      const resultDiv = document.getElementById(`dp-${dp}-result`);
      if (resultDiv) {
        const result = decisionResults[dp][choice];
        resultDiv.innerHTML = `
          <strong>${result.label}</strong><br><br>
          ${result.result}
        `;
        resultDiv.classList.remove('hidden');
        resultDiv.classList.add('show');
      }
      
      // Update operator log
      updateOperatorLog(dp, choice);
      
      // Update game results indicators
      updateGRIndicator(dp);
      
      // Disable buttons after choice
      document.querySelectorAll(`[data-dp="${dp}"]`).forEach((b) => {
        b.disabled = true;
        b.style.opacity = '0.5';
      });
      
      // Check if all decisions made
      checkAllDecisionsMade();
    });
  });
}

function updateOperatorLog(dp, choice) {
  const slot = document.querySelector(`.log-slot[data-slot="${dp}"]`);
  if (!slot) return;
  
  slot.classList.remove('empty');
  slot.classList.add('filled');
  
  const btnText = document.querySelector(`[data-dp="${dp}"][data-choice="${choice}"] .dp-btn-text`);
  if (!btnText) return;
  
  const choiceText = btnText.textContent;
  const slotText = slot.querySelector('.slot-text');
  if (slotText) slotText.textContent = choiceText.substring(0, 40) + '...';
}

function updateGRIndicator(dp) {
  const indicator = document.querySelector(`.gri[data-dp="${dp}"]`);
  if (indicator) {
    indicator.classList.add('complete');
  }
}

function checkAllDecisionsMade() {
  if (Object.keys(state.decisions).length === 4) {
    displayGameResults();
    showTwistEnding();
  }
}

function displayGameResults() {
  const grGrid = document.getElementById('gr-grid');
  const grPending = document.getElementById('gr-pending');
  
  if (!grGrid) return;
  
  if (grPending) grPending.style.display = 'none';
  
  let html = '';
  for (let dp = 1; dp <= 4; dp++) {
    const choice = state.decisions[dp];
    const result = decisionResults[dp][choice];
    
    html += `
      <div class="gr-card">
        <div class="gr-card-num">Decision ${dp}</div>
        <div class="gr-card-title">${result.label}</div>
        <div class="gr-card-choice">
          <div class="gr-card-choice-label">Your choice:</div>
          <div>${result.label}</div>
        </div>
        <div class="gr-card-actual">
          <div class="gr-card-actual-label">What happened:</div>
          <div>${result.result}</div>
        </div>
      </div>
    `;
  }
  
  grGrid.innerHTML = html;
}

function showTwistEnding() {
  const twist = document.getElementById('gr-twist');
  if (twist) {
    twist.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GSAP SCROLL ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

function initScrollAnimations() {
  // Reveal animations on scroll
  document.querySelectorAll('.reveal').forEach((el) => {
    gsap.to(el, {
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power2.out',
    });
  });
  
  // Act IV sticky panels
  const sciPanels = document.querySelectorAll('.sci-panel');
  if (sciPanels.length > 0) {
    sciPanels.forEach((panel, i) => {
      ScrollTrigger.create({
        trigger: '#act4-scroll',
        start: `top+=${i * 100}vh top`,
        end: `top+=${(i + 1) * 100}vh top`,
        onEnter: () => {
          sciPanels.forEach((p) => p.classList.remove('active'));
          panel.classList.add('active');
        },
        onEnterBack: () => {
          sciPanels.forEach((p) => p.classList.remove('active'));
          panel.classList.add('active');
        },
      });
    });
  }
  
  // Activate first panel by default
  if (sciPanels.length > 0) {
    sciPanels[0].classList.add('active');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ACT TRANSITION CHARACTER-BY-CHARACTER ANIMATION
// ═══════════════════════════════════════════════════════════════════════════

function initActTitleAnimations() {
  document.querySelectorAll('.act-title-animated').forEach((titleEl) => {
    const text = titleEl.dataset.text;
    if (!text) return;
    
    // Clear and build character spans
    titleEl.innerHTML = '';
    const chars = text.split('');
    chars.forEach((char, i) => {
      const span = document.createElement('span');
      span.className = 'act-char';
      span.textContent = char === ' ' ? '\u00A0' : char;
      span.style.opacity = '0';
      span.style.display = 'inline-block';
      span.style.transform = 'translateY(20px)';
      titleEl.appendChild(span);
    });
    
    // Animate characters on scroll
    const transition = titleEl.closest('.act-transition');
    if (!transition) return;
    
    ScrollTrigger.create({
      trigger: transition,
      start: 'top 60%',
      onEnter: () => {
        const charSpans = titleEl.querySelectorAll('.act-char');
        charSpans.forEach((span, i) => {
          setTimeout(() => {
            span.style.transition = 'all 0.4s ease-out';
            span.style.opacity = '1';
            span.style.transform = 'translateY(0)';
          }, i * 40);
        });
      },
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// PERSON CARDS ALTERNATING LEFT/RIGHT SLIDE-IN
// ═══════════════════════════════════════════════════════════════════════════

function initPersonCards() {
  document.querySelectorAll('.person').forEach((person) => {
    const direction = person.dataset.direction || 'left';
    const xOffset = direction === 'right' ? 60 : -60;
    
    gsap.fromTo(person,
      { opacity: 0, x: xOffset },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: person,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DECISION POINT BORDER DRAW ANIMATION
// ═══════════════════════════════════════════════════════════════════════════

function initDecisionBorderDraw() {
  document.querySelectorAll('.decision-point').forEach((dp) => {
    const borderDraw = dp.querySelector('.dp-border-draw');
    if (!borderDraw) return;
    
    gsap.fromTo(borderDraw,
      { scaleX: 0, scaleY: 0, opacity: 0 },
      {
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: dp,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      }
    );
    
    // Text scramble on label
    const label = dp.querySelector('.dp-label');
    if (label) {
      ScrollTrigger.create({
        trigger: dp,
        start: 'top 75%',
        onEnter: () => {
          label.classList.add('scramble');
          setTimeout(() => label.classList.remove('scramble'), 400);
        },
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY CARDS 3D CINEMATIC ENTRANCE
// ═══════════════════════════════════════════════════════════════════════════

function initLegacyCards() {
  document.querySelectorAll('.lc').forEach((card, i) => {
    gsap.fromTo(card,
      { 
        opacity: 0, 
        y: 50,
        rotateX: 15,
        scale: 0.9,
      },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        scale: 1,
        duration: 0.9,
        delay: i * 0.15,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// STAT COUNTER ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

function initStatCounters() {
  // Animate stat rings on scroll
  const statRings = document.querySelectorAll('.stat-ring-fill');
  
  statRings.forEach((ring) => {
    ScrollTrigger.create({
      trigger: ring,
      start: 'top 80%',
      onEnter: () => {
        ring.style.animation = 'ring-fill 1.5s ease-out forwards';
      },
    });
  });
  
  // Animate stat numbers counting up
  document.querySelectorAll('.stat-num').forEach((statNum) => {
    const target = parseInt(statNum.dataset.target, 10);
    const suffix = statNum.dataset.suffix || '';
    if (isNaN(target)) return;
    
    ScrollTrigger.create({
      trigger: statNum,
      start: 'top 80%',
      onEnter: () => {
        animateCounter(statNum, target, suffix, 1500);
      },
    });
  });
}

function animateCounter(el, target, suffix, duration) {
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(eased * target);
    
    // Format number with commas for readability
    el.textContent = current.toLocaleString() + suffix;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target.toLocaleString() + suffix;
    }
  }
  
  requestAnimationFrame(update);
}

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  // Start Geiger counter
  startGeigerCounter();
  
  // Initialize all components
  initHeroCanvas();
  initRadiationRings();
  initLiveClock();
  initClassifiedStamp();
  initPeriodicGlitch();
  initExplosionCanvas();
  initChainCanvas();
  initSpreadCanvas();
  initPripyatSlider();
  initDosimeter();
  initProgressBar();
  initDecisionPoints();
  initScrollAnimations();
  initActTitleAnimations();
  initPersonCards();
  initDecisionBorderDraw();
  initLegacyCards();
  initStatCounters();
  initHeartbeatScrollTrigger();
  
  // iOS viewport fix
  function setVH() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }
  
  setVH();
  window.addEventListener('resize', setVH);
  window.addEventListener('orientationchange', setVH);
});

// ═══════════════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  // S: Toggle sound
  if (e.key === 's' || e.key === 'S') {
    const btn = document.getElementById('sound-btn');
    if (btn) btn.click();
  }
  
  // M: Mute
  if (e.key === 'm' || e.key === 'M') {
    if (state.soundEnabled) {
      const btn = document.getElementById('sound-btn');
      if (btn) btn.click();
    }
  }
});
