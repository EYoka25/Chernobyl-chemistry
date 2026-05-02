'use strict';
/* ═════════════════════════════════════════════════════════
   CHERNOBYL V2 — script.js
   All scroll systems · Canvas animations · Game · Audio
   No build step · No external JS libraries
═════════════════════════════════════════════════════════ */

/* ── 1. MOBILE VH FIX ───────────────────────────────── */
function setVH() {
  document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01) + 'px');
}
setVH();
window.addEventListener('resize', setVH, { passive: true });

/* ── 2. TOUCH DETECTION ─────────────────────────────── */
const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

/* ── 3. RAF-THROTTLED SCROLL BUS ────────────────────── */
// Single passive scroll listener feeds all callbacks via RAF
let _SY = 0, _rafQ = false;
const _bus = [];

window.addEventListener('scroll', () => {
  _SY = window.scrollY;
  if (!_rafQ) { _rafQ = true; requestAnimationFrame(_flush); }
}, { passive: true });

function _flush() {
  _rafQ = false;
  for (let i = 0; i < _bus.length; i++) _bus[i](_SY);
}

// Initial dispatch after DOM settles
setTimeout(_flush, 100);

/* ── 4. PROGRESS BAR ────────────────────────────────── */
const _progBar = document.getElementById('progress-bar');
_bus.push(sy => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (_progBar && max > 0) _progBar.style.width = Math.min(100, sy / max * 100) + '%';
});

/* ═════════════════════════════════════════════════════════
   5. HERO CANVAS  — procedural star-field + ember particles
═════════════════════════════════════════════════════════ */
(function heroCanvas() {
  const c = document.getElementById('hero-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, stars = [], embers = [];

  function resize() {
    W = c.width  = c.offsetWidth;
    H = c.height = c.offsetHeight;
    buildStars();
  }

  function buildStars() {
    stars = [];
    const n = Math.floor(W * H / 3200);
    for (let i = 0; i < n; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.65,
        r: Math.random() * 1.1 + 0.2,
        a: Math.random() * 0.45 + 0.12,
        rgb: Math.random() < 0.1 ? '220,150,70' : '200,196,192'
      });
    }
    embers = [];
    for (let i = 0; i < 40; i++) embers.push(makeEmber());
  }

  function makeEmber() {
    return {
      x: W * (0.33 + Math.random() * 0.1),
      y: H * (0.35 + Math.random() * 0.45),
      vx: (Math.random() - 0.5) * 0.7,
      vy: -(Math.random() * 1.3 + 0.25),
      r: Math.random() * 2.2 + 0.4,
      life: Math.random(),
      max: Math.random() * 220 + 90,
      hue: Math.random() < 0.55 ? 18 : Math.random() < 0.5 ? 38 : 5
    };
  }

  (function loop() {
    ctx.clearRect(0, 0, W, H);
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${s.rgb},${s.a})`;
      ctx.fill();
    }
    for (const e of embers) {
      e.x += e.vx; e.y += e.vy; e.life++;
      const p = e.life / e.max;
      const a = (p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7) * 0.75;
      if (a > 0) {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r * (1 - p * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${e.hue},90%,65%,${a})`;
        ctx.fill();
      }
      if (e.life > e.max || e.y < -10) {
        const ne = makeEmber();
        ne.y = H * (0.5 + Math.random() * 0.3);
        Object.assign(e, ne);
      }
    }
    requestAnimationFrame(loop);
  })();

  const ro = new ResizeObserver(resize);
  ro.observe(c);
  resize();
})();

/* ═════════════════════════════════════════════════════════
   6. HERO VIDEO BACKGROUND  — YouTube aerial footage, injected
═════════════════════════════════════════════════════════ */
(function heroVideo() {
  const hero = document.getElementById('hero');
  if (!hero) return;

  const wrap = document.createElement('div');
  wrap.setAttribute('aria-hidden', 'true');
  Object.assign(wrap.style, {
    position: 'absolute', inset: '0', zIndex: '1',
    overflow: 'hidden', pointerEvents: 'none'
  });

  /* Chernobyl exclusion zone / aerial drone footage
     via YouTube  —  muted, autoplay, loop                */
  const iframe = document.createElement('iframe');
  iframe.src = [
    'https://www.youtube.com/embed/koZeTME6h0E',
    '?autoplay=1&mute=1&loop=1&playlist=koZeTME6h0E',
    '&controls=0&showinfo=0&rel=0&playsinline=1',
    '&modestbranding=1&disablekb=1&iv_load_policy=3'
  ].join('');
  Object.assign(iframe.style, {
    position: 'absolute',
    top: '50%', left: '50%',
    width: '177.78vh', height: '100vh',
    minWidth: '100%', minHeight: '56.25vw',
    transform: 'translate(-50%, -50%)',
    border: 'none',
    opacity: '0.18',
    filter: 'brightness(0.3) saturate(0.22) contrast(1.1)',
    pointerEvents: 'none'
  });
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', 'autoplay; encrypted-media');
  wrap.appendChild(iframe);
  hero.insertBefore(wrap, hero.firstChild);
})();

/* ═════════════════════════════════════════════════════════
   7. PARALLAX  — 3 depth layers, passive + touch-reduced
═════════════════════════════════════════════════════════ */
{
  const layers = [
    { el: document.getElementById('hero-layer-1'), spd: 0.06 },
    { el: document.getElementById('hero-layer-2'), spd: 0.28 },
    { el: document.getElementById('hero-layer-3'), spd: 0.52 }
  ];
  const heroEl = document.getElementById('hero');
  const SCALE  = IS_TOUCH ? 0.2 : 1;

  _bus.push(sy => {
    if (!heroEl || sy > heroEl.offsetHeight * 1.6) return;
    for (const { el, spd } of layers) {
      if (el) el.style.transform = `translateY(${sy * spd * SCALE}px)`;
    }
  });
}

/* ═════════════════════════════════════════════════════════
   8. INTERSECTION OBSERVER  — scroll reveals + act transitions
═════════════════════════════════════════════════════════ */
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      revealIO.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

// Act transition cards — re-trigger entrance animation each time they enter viewport
document.querySelectorAll('.act-transition').forEach(el => {
  new IntersectionObserver(entries => {
    entries.forEach(e => {
      const con = e.target.querySelector('.at-content');
      if (!con) return;
      if (e.isIntersecting) {
        con.style.animation = 'none';
        void con.offsetWidth; // reflow
        con.style.animation = 'atReveal 0.9s cubic-bezier(.22,.68,0,1.2) both';
      }
    });
  }, { threshold: 0.4 }).observe(el);
});

/* ═════════════════════════════════════════════════════════
   9. EXPLOSION CANVAS  — Act II scroll-scrubbed sequence
   The single most important visual element.
   5 phases: Setup → Power Rise → AZ-5/Graphite → Explosion → Aftermath
═════════════════════════════════════════════════════════ */
(function explosionCanvas() {
  const scrollWrap  = document.getElementById('act2-scroll');
  const stickyEl    = document.getElementById('act2-sticky');
  const canvas      = document.getElementById('explosion-canvas');
  if (!canvas || !scrollWrap) return;

  const ctx = canvas.getContext('2d');
  let W, H;
  let particles = [];
  let prevT = -1;
  let glitchFired = false;

  function resize() {
    W = canvas.width  = stickyEl ? stickyEl.offsetWidth  : window.innerWidth;
    H = canvas.height = stickyEl ? stickyEl.offsetHeight : window.innerHeight;
  }
  window.addEventListener('resize', () => { resize(); draw(prevT < 0 ? 0 : prevT); }, { passive: true });
  resize();

  /* ── HUD elements ─────────────────────────────────── */
  const hudClock    = document.getElementById('hud-clock');
  const hudEvent    = document.getElementById('hud-event');
  const hudPower    = document.getElementById('hud-power');
  const hudBarFill  = document.getElementById('hud-bar-fill');
  const expProgress = document.getElementById('exp-progress-fill');
  const expSubtitle = document.getElementById('exp-subtitle');
  const expAfter    = document.getElementById('exp-aftermath');
  const glitch      = document.getElementById('glitch-overlay');

  /* ── Timeline events (t = global 0→1) ────────────── */
  const EVENTS = [
    { t: 0.00, ev: 'TEST INITIATED',             sub: 'Turbine test begins at 01:23:00. Coolant flow drops. The reactor runs at 200 MW — far below the 700 MW minimum for the test. It is dangerously unstable.' },
    { t: 0.13, ev: 'VOID COEFFICIENT ACTIVATING',sub: 'Coolant flashes to steam. Steam voids form in the fuel channels. In the RBMK, steam voids increase reactivity — the opposite of every Western reactor design.' },
    { t: 0.30, ev: 'POWER EXCURSION DETECTED',   sub: 'Shift foreman Akimov watches the Period Meter accelerate beyond any expected range. He shouts to Toptunov: "AZ-5 — now!"' },
    { t: 0.40, ev: 'AZ-5 PRESSED — 01:23:40',    sub: 'All 211 control rods begin descending. The graphite tips enter the core first — for 2–3 seconds, instead of stopping the chain reaction, they accelerate it.' },
    { t: 0.50, ev: '— FIRST EXPLOSION — 01:23:43',sub: 'A steam explosion tears the 1,000-tonne reactor lid from its mountings. All 1,661 coolant channels are severed. The reactor is open to the atmosphere.' },
    { t: 0.58, ev: '— SECOND EXPLOSION — 01:23:44',sub: 'A second, larger explosion. Estimated force: 30–40 tonnes of TNT. Burning graphite and nuclear fuel are ejected up to 1,000 metres from the reactor.' },
    { t: 0.76, ev: 'FIRE BRIGADE RESPONDS',       sub: 'First responders arrive from the Chernobyl fire station. They believe it is a roof fire. They have no radiation protection. Several taste metal on their lips.' }
  ];
  let lastEvIdx = -1;

  /* ── Power model ─────────────────────────────────── */
  function pwrAt(t) {
    if (t < 0.13)  return 200;
    if (t < 0.35)  return 200  + ((t-0.13)/0.22) * 1400;
    if (t < 0.42)  return 1600 + ((t-0.35)/0.07) * 16400;
    if (t < 0.50)  return 18000+ ((t-0.42)/0.08) * 12000;
    return 30000;
  }

  function clockStr(t) {
    const s = Math.floor(t * 58);
    return `01:23:${String(s).padStart(2,'0')}`;
  }

  /* ── Particle helpers ────────────────────────────── */
  function burst(cx, cy, n, big) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = Math.random() * (big ? 14 : 8) + 2;
      const deb = Math.random() < 0.3;
      particles.push({
        x: cx, y: cy,
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - Math.random() * 2,
        r: Math.random() * (deb ? 5 : 2.5) + 0.8,
        life: 1.0,
        dec: Math.random() * 0.011 + 0.005,
        col: deb
          ? `hsl(${18+Math.random()*20},78%,${38+Math.random()*22}%)`
          : `hsl(${38+Math.random()*28},100%,${58+Math.random()*32}%)`
      });
    }
  }

  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.life -= p.dec;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.3, p.r * p.life), 0, Math.PI * 2);
      ctx.fillStyle = p.col;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* ── Phase drawing functions ─────────────────────── */

  // Phase 0  (t=0→0.13):  Dark control-room atmosphere
  function phase0(ft) {
    const cx = W * 0.5, cy = H * 0.46;
    ctx.fillStyle = '#030507';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(15,35,55,0.5)'; ctx.lineWidth = 0.8;
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    const R = Math.min(W, H) * 0.2;
    // Reactor circle
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(30,65,110,${0.3 + ft*0.2})`; ctx.lineWidth = 1.5; ctx.stroke();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, `rgba(20,55,110,${ft*0.2})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // Tick marks
    for (let i = 0; i < 24; i++) {
      const a = i/24 * Math.PI*2, r1 = R+6, r2 = R+(i%6===0?18:10);
      ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*r1, cy+Math.sin(a)*r1);
      ctx.lineTo(cx+Math.cos(a)*r2, cy+Math.sin(a)*r2);
      ctx.strokeStyle = `rgba(30,60,100,${i%6===0?0.6:0.25})`; ctx.lineWidth = i%6===0?1.5:0.7; ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(40,80,140,${0.4+ft*0.3})`;
    ctx.font = `${Math.floor(W*0.013)}px 'Space Mono',monospace`;
    ctx.fillText('REACTOR No. 4  ·  UNIT CORE', cx, cy + R*0.28);
    ctx.fillStyle = `rgba(160,185,215,${0.4+ft*0.3})`;
    ctx.font = `bold ${Math.floor(W*0.026)}px 'Space Mono',monospace`;
    ctx.fillText('200 MW', cx, cy - R*0.08);
  }

  // Phase 1  (t=0.13→0.35):  Power rising, reactor top-down view
  function phase1(ft) {
    const cx = W*0.5, cy = H*0.46;
    const R  = Math.min(W,H) * 0.22;
    const sp = R * 0.2;
    const cols = 9, rows = 9;
    const pwr = pwrAt(0.13 + ft*0.22);

    ctx.fillStyle = `rgb(${3+Math.floor(ft*9)},${5+Math.floor(ft*5)},${7+Math.floor(ft*4)})`;
    ctx.fillRect(0, 0, W, H);

    // Ambient fire glow
    const bg = ctx.createRadialGradient(cx,cy,0,cx,cy,H*0.75);
    bg.addColorStop(0, `rgba(${Math.floor(ft*65)},${Math.floor(ft*25)},0,${ft*0.28})`);
    bg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

    // Fuel channel grid (top-down view of core)
    const sx = cx - (cols-1)*sp*0.5;
    const sy2 = cy - (rows-1)*sp*0.5;
    for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
      const fx = sx+c*sp, fy = sy2+r*sp;
      const d = Math.hypot(fx-cx, fy-cy);
      if (d > R*0.88) continue;
      const heat = (1 - d/(R*0.88)) * ft;
      ctx.beginPath(); ctx.arc(fx,fy, sp*0.3, 0, Math.PI*2);
      ctx.fillStyle = `rgba(${18+Math.floor(heat*90)},${55+Math.floor(heat*85)},${115+Math.floor(heat*65)},0.72)`;
      ctx.fill();
      if (d < R*0.42 && ft > 0.35) {
        ctx.beginPath(); ctx.arc(fx,fy, sp*0.16, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,${Math.floor(140*(1-heat))},0,${(ft-0.35)/0.65*0.85})`;
        ctx.fill();
      }
    }

    // Control rods (7, partially inserted)
    const rXs = [-0.5,-0.25,0,0.25,0.5,-0.375,0.375];
    rXs.forEach(off => {
      const rx = cx + off*R*1.6;
      ctx.fillStyle = `rgba(192,57,43,${0.6+ft*0.3})`;
      ctx.fillRect(rx-3, cy-R+4, 6, R*(0.22+ft*0.06));
    });

    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
    ctx.strokeStyle = `rgba(${40+Math.floor(ft*120)},${100+Math.floor(ft*80)},200,${0.25+ft*0.3})`; ctx.lineWidth=2; ctx.stroke();

    ctx.textAlign='center';
    ctx.fillStyle = `rgba(${165+Math.floor(ft*90)},${195-Math.floor(ft*95)},${215-Math.floor(ft*195)},0.92)`;
    ctx.font = `bold ${Math.floor(W*0.032)}px 'Space Mono',monospace`;
    ctx.fillText(Math.round(pwr).toLocaleString() + ' MW', cx, cy-R*1.28);
    ctx.fillStyle='rgba(130,140,155,0.5)';
    ctx.font=`${Math.floor(W*0.013)}px 'Space Mono',monospace`;
    ctx.fillText('THERMAL OUTPUT',cx,cy-R*1.44);
  }

  // Phase 2  (t=0.35→0.50):  AZ-5 + graphite tip flash
  function phase2(ft) {
    const cx = W*0.5, cy = H*0.46;
    const R  = Math.min(W,H) * 0.22;
    const sp = R * 0.2;
    const cols=9, rows=9;
    const peak = Math.sin(ft*Math.PI);

    ctx.fillStyle = `rgb(${10+Math.floor(ft*25)},${8+Math.floor(ft*12)},6)`;
    ctx.fillRect(0,0,W,H);

    const bg = ctx.createRadialGradient(cx,cy,0,cx,cy,H*0.85);
    bg.addColorStop(0,`rgba(255,${Math.floor(180*peak)},0,${ft*0.65})`);
    bg.addColorStop(0.45,`rgba(200,60,0,${ft*0.32})`);
    bg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    // Fuel channels — incandescent
    const sx = cx-(cols-1)*sp*0.5, sy2 = cy-(rows-1)*sp*0.5;
    for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
      const fx=sx+c*sp, fy=sy2+r*sp;
      if (Math.hypot(fx-cx,fy-cy)>R*0.88) continue;
      ctx.beginPath(); ctx.arc(fx,fy,sp*(0.3+ft*0.18),0,Math.PI*2);
      ctx.fillStyle=`rgba(255,${Math.floor((1-ft)*140)},0,${0.7+ft*0.3})`; ctx.fill();
    }

    // Rods descending — graphite tip flash
    const rXs=[-0.5,-0.25,0,0.25,0.5,-0.375,0.375];
    rXs.forEach((off,i) => {
      const rx=cx+off*R*1.6;
      const topY=cy-R+4;
      const rodH=ft*R*2.0;
      ctx.fillStyle=`rgba(120,20,10,0.9)`; ctx.fillRect(rx-4,topY,8,Math.max(0,rodH-14));
      // Graphite tip (yellow)
      if (rodH>14) {
        const tipY=topY+rodH-14;
        ctx.fillStyle='rgba(255,210,25,0.98)'; ctx.fillRect(rx-4,tipY,8,14);
        const tg=ctx.createRadialGradient(rx,tipY+7,0,rx,tipY+7,30);
        tg.addColorStop(0,`rgba(255,220,50,${ft*0.6})`);
        tg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(rx,tipY+7,30,0,Math.PI*2); ctx.fill();
      }
    });

    // Yellow flash at peak
    if (ft>0.55) {
      ctx.fillStyle=`rgba(255,230,60,${(ft-0.55)*0.45})`;
      ctx.fillRect(0,0,W,H);
    }
    ctx.textAlign='center';
    ctx.fillStyle=`rgba(255,${Math.floor(200*(1-ft))},0,${0.55+ft*0.45})`;
    ctx.font=`bold ${Math.floor(W*0.028)}px 'Space Mono',monospace`;
    ctx.fillText(`~${Math.round(pwrAt(0.35+ft*0.15)/1000)}K MW`,cx,cy-R*1.3);
  }

  // Phase 3  (t=0.50→0.65):  Explosion flash + shockwave
  function phase3(ft) {
    const cx=W*0.5, cy=H*0.46;

    // White-orange flash
    const fi = ft < 0.28 ? ft/0.28 : 1-(ft-0.28)/0.72;
    ctx.fillStyle=`rgb(${Math.floor(12+fi*243)},${Math.floor(8+fi*205)},${Math.floor(7+fi*185)})`;
    ctx.fillRect(0,0,W,H);

    if (fi<0.92) {
      // Shockwave 1
      const sr = ft*Math.min(W,H)*0.85;
      if (sr>5) {
        ctx.beginPath(); ctx.arc(cx,cy,sr,0,Math.PI*2);
        ctx.strokeStyle=`rgba(255,200,100,${Math.max(0,0.85-ft)})`; ctx.lineWidth=10*(1-ft*0.8); ctx.stroke();
      }
      // Shockwave 2 (delayed)
      const sr2=(ft-0.18)*Math.min(W,H)*1;
      if (sr2>0) {
        ctx.beginPath(); ctx.arc(cx,cy,sr2,0,Math.PI*2);
        ctx.strokeStyle=`rgba(255,130,50,${Math.max(0,0.55-(ft-0.18))})`; ctx.lineWidth=6*(1-ft); ctx.stroke();
      }
    }

    // Spawn particles
    if (ft>0.04 && ft<0.7 && Math.random()<0.75) burst(cx,cy,ft<0.3?9:5,ft<0.3);
    drawParticles();
  }

  // Phase 4  (t=0.65→0.80):  Debris field + fire
  function phase4(ft) {
    const cx=W*0.5, cy=H*0.46, R=Math.min(W,H)*0.24;

    ctx.fillStyle=`rgb(${8+Math.floor(ft*4)},5,5)`;
    ctx.fillRect(0,0,W,H);

    // Fire glow
    const fg=ctx.createRadialGradient(cx,cy,0,cx,cy,H*0.72);
    fg.addColorStop(0,`rgba(255,80,10,${0.42-ft*0.18})`);
    fg.addColorStop(0.35,`rgba(175,38,0,${0.26-ft*0.1})`);
    fg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fg; ctx.fillRect(0,0,W,H);

    drawParticles();
    // Continuous embers
    if (Math.random()<0.45) burst(cx+(Math.random()-0.5)*R,cy+(Math.random()-0.5)*R*0.5,3,false);

    // Reactor ruins
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
    ctx.strokeStyle=`rgba(200,58,12,${0.55-ft*0.2})`; ctx.lineWidth=3; ctx.stroke();

    // Jagged breach
    ctx.beginPath();
    for (let i=0; i<=14; i++) {
      const a = -Math.PI+i*(Math.PI/14);
      const jr = R*(0.62+((i%3===1)?0.35:0.1)*Math.random());
      i===0 ? ctx.moveTo(cx+Math.cos(a)*jr,cy+Math.sin(a)*jr)
             : ctx.lineTo(cx+Math.cos(a)*jr,cy+Math.sin(a)*jr);
    }
    ctx.strokeStyle=`rgba(255,95,22,${0.4-ft*0.15})`; ctx.lineWidth=2; ctx.stroke();

    // Smoke columns
    for (let k=0; k<5; k++) {
      const sx=cx+(k-2)*R*0.42;
      const sm=ctx.createRadialGradient(sx,cy-R*0.5,8,sx,cy-R*(0.8+ft*k*0.3),R*0.85);
      sm.addColorStop(0,`rgba(110,85,68,${0.22-ft*0.06})`); sm.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=sm;
      ctx.beginPath(); ctx.ellipse(sx,cy-R*(0.45+ft*k*0.38),R*(0.28+k*0.04),R*(0.5+ft*0.5),0,0,Math.PI*2); ctx.fill();
    }
  }

  // Phase 5  (t=0.80→1.0):  Burning aftermath, night sky, graphite scatter
  function phase5(ft) {
    const cx=W*0.5, cy=H*0.5, R=Math.min(W,H)*0.27;

    // Night sky
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#01020405'); bg.addColorStop(0.55,'#050308'); bg.addColorStop(0.85,'rgba(55,14,4,0.5)'); bg.addColorStop(1,'#070404');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

    drawParticles();
    if (Math.random()<0.3) burst(cx+(Math.random()-0.5)*R,cy+(Math.random()-0.5)*R*0.6,2,false);

    // Stars fading in
    if (ft>0.25) {
      ctx.fillStyle=`rgba(198,196,192,${(ft-0.25)*0.5})`;
      for (let i=0;i<28;i++) {
        ctx.beginPath();
        ctx.arc(((i*137.5)%W),((i*97.3)%H)*0.52,0.9,0,Math.PI*2); ctx.fill();
      }
    }

    // Reactor ruins — irregular polygon
    ctx.beginPath();
    const frags=22;
    for (let i=0;i<=frags;i++) {
      const a=(i/frags)*Math.PI*2;
      const open=i>3&&i<9;
      const jr=R*(open?(0.38+Math.random()*0.28):(0.82+Math.random()*0.18));
      i===0?ctx.moveTo(cx+Math.cos(a)*jr,cy+Math.sin(a)*jr):ctx.lineTo(cx+Math.cos(a)*jr,cy+Math.sin(a)*jr);
    }
    ctx.closePath(); ctx.fillStyle='rgba(22,16,11,0.92)'; ctx.fill();
    ctx.strokeStyle='rgba(195,75,18,0.72)'; ctx.lineWidth=2; ctx.stroke();

    // Fire in open core
    const ff=ctx.createRadialGradient(cx,cy,0,cx,cy,R*0.72);
    ff.addColorStop(0,'rgba(255,225,52,0.82)');
    ff.addColorStop(0.32,'rgba(255,75,8,0.62)');
    ff.addColorStop(0.72,'rgba(175,28,0,0.32)');
    ff.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ff; ctx.beginPath(); ctx.arc(cx,cy,R*0.72,0,Math.PI*2); ctx.fill();

    // Radiation glow (green)
    const rg=ctx.createRadialGradient(cx,cy,R*0.5,cx,cy,R*2.8);
    rg.addColorStop(0,`rgba(57,255,20,${0.05*ft})`); rg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(cx,cy,R*2.8,0,Math.PI*2); ctx.fill();

    // Scattered graphite blocks (highly radioactive)
    for (let i=0;i<16;i++) {
      const a=(i/16)*Math.PI*2, d=R*(0.85+Math.random()*1.25);
      const bx=cx+Math.cos(a)*d, by=cy+Math.sin(a)*d;
      ctx.fillStyle=`rgba(55,45,38,${0.7*ft})`; ctx.beginPath(); ctx.rect(bx-6,by-4,12,8); ctx.fill();
      ctx.beginPath(); ctx.arc(bx,by,11,0,Math.PI*2);
      ctx.fillStyle=`rgba(57,255,20,${0.07*ft})`; ctx.fill();
    }
  }

  /* ── Master draw ─────────────────────────────────── */
  function draw(t) {
    ctx.clearRect(0,0,W,H);

    if      (t < 0.13) phase0(t/0.13);
    else if (t < 0.35) phase1((t-0.13)/0.22);
    else if (t < 0.50) phase2((t-0.35)/0.15);
    else if (t < 0.65) phase3((t-0.50)/0.15);
    else if (t < 0.80) phase4((t-0.65)/0.15);
    else               phase5((t-0.80)/0.20);

    /* HUD updates */
    if (hudClock) {
      hudClock.textContent = clockStr(t);
      hudClock.className   = 'hud-clock' + (t>=0.50?'  explosion':(t>=0.38?' danger':''));
    }
    const pwr = pwrAt(t);
    if (hudPower) {
      hudPower.textContent = pwr>=10000 ? Math.round(pwr/1000)+',000 MW' : Math.round(pwr).toLocaleString()+' MW';
      hudPower.className   = 'hud-power'+(pwr>3200?' danger':'');
    }
    if (hudBarFill) hudBarFill.style.width = Math.min(100,pwr/32000*100)+'%';
    if (expProgress) expProgress.style.width = (t*100)+'%';

    // Event subtitle
    for (let i=EVENTS.length-1; i>=0; i--) {
      if (t >= EVENTS[i].t) {
        if (i!==lastEvIdx) {
          lastEvIdx=i;
          if (hudEvent)    hudEvent.textContent   = EVENTS[i].ev;
          if (expSubtitle) expSubtitle.textContent = EVENTS[i].sub;
        }
        break;
      }
    }

    // Glitch on first explosion
    if (t>=0.50 && t<0.58 && !glitchFired) {
      glitchFired=true;
      if (glitch) { glitch.classList.add('active'); setTimeout(()=>glitch.classList.remove('active'),380); }
      let sk=0;
      const shake=()=>{ if(sk++>22){canvas.style.transform='';return;} canvas.style.transform=`translate(${(Math.random()-0.5)*11}px,${(Math.random()-0.5)*11}px)`; requestAnimationFrame(shake); };
      shake();
    }
    if (t<0.50) { glitchFired=false; }

    // Aftermath text
    if (expAfter) expAfter.classList.toggle('visible', t>0.88);
  }

  /* ── Scroll binding ──────────────────────────────── */
  _bus.push(sy => {
    if (!scrollWrap) return;
    const wT=scrollWrap.offsetTop, wH=scrollWrap.offsetHeight, vh=window.innerHeight;
    const t=Math.max(0,Math.min(1,(sy-wT)/(wH-vh)));
    if (Math.abs(t-prevT)>0.0008) { prevT=t; draw(t); }
  });

  draw(0);
})();

/* ═════════════════════════════════════════════════════════
   10. CHAIN REACTION CANVAS + ACT IV STICKY PANELS
═════════════════════════════════════════════════════════ */
(function act4Science() {
  const wrapper  = document.getElementById('act4-scroll');
  const panels   = document.querySelectorAll('.sci-panel');
  const caption  = document.getElementById('reactor-caption');
  const chain    = document.getElementById('chain-canvas');
  if (!wrapper || !chain) return;

  const ctx = chain.getContext('2d');
  let W, H, activePanel=-1, animId=null, running=false;

  /* particle stores */
  let neutrons=[], voids_=[];

  function resize() {
    W = chain.width  = chain.offsetWidth;
    H = chain.height = chain.offsetHeight;
  }
  const ro = new ResizeObserver(resize); ro.observe(chain); resize();

  /* ── Panel 0: Static RBMK schematic ─────────────── */
  function drawP0() {
    const cx=W*0.5, cy=H*0.5, R=Math.min(W,H)*0.4;
    ctx.fillStyle='#030508'; ctx.fillRect(0,0,W,H);

    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
    ctx.fillStyle='#0a0e16'; ctx.fill();
    ctx.strokeStyle='rgba(35,65,120,0.35)'; ctx.lineWidth=1.5; ctx.stroke();

    const sp=R*0.22, cols=7, rows=7;
    const sx=cx-(cols-1)*sp*0.5, sy=cy-(rows-1)*sp*0.5;
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
      const fx=sx+c*sp, fy=sy+r*sp;
      if (Math.hypot(fx-cx,fy-cy)>R*0.85) continue;
      ctx.beginPath(); ctx.arc(fx,fy,sp*0.33,0,Math.PI*2);
      ctx.fillStyle='rgba(18,48,98,0.65)'; ctx.fill();
      ctx.beginPath(); ctx.arc(fx,fy,sp*0.16,0,Math.PI*2);
      ctx.fillStyle='rgba(72,115,200,0.82)'; ctx.fill();
    }

    // Control rods
    const roff=[-0.44,-0.22,0,0.22,0.44,-0.33,0.33];
    roff.forEach(o => {
      const rx=cx+o*R*1.56;
      ctx.fillStyle='rgba(192,57,43,0.88)'; ctx.fillRect(rx-3.5,cy-R+4,7,R*0.38);
      ctx.fillStyle='rgba(185,145,35,0.72)'; ctx.fillRect(rx-3.5,cy-R+R*0.38,7,10);
    });

    ctx.textAlign='center';
    ctx.fillStyle='rgba(35,68,128,0.55)'; ctx.font=`${Math.floor(W*0.026)}px 'Space Mono',monospace`;
    ctx.fillText('GRAPHITE MODERATOR',cx,cy-R-10);
    ctx.fillStyle='rgba(192,57,43,0.72)'; ctx.font=`${Math.floor(W*0.022)}px 'Space Mono',monospace`;
    ctx.fillText('CONTROL RODS',cx,cy+R+18);
    ctx.fillStyle='rgba(55,115,205,0.62)'; ctx.font=`${Math.floor(W*0.019)}px 'Space Mono',monospace`;
    ctx.fillText('1,661 FUEL CHANNELS',cx,cy+R+36);
  }

  /* ── Panel 1: Live chain reaction ───────────────── */
  function initNeutrons() {
    neutrons=[];
    const cx=W*0.5, cy=H*0.5, R=Math.min(W,H)*0.38;
    for (let i=0;i<10;i++) {
      const a=Math.random()*Math.PI*2, d=Math.random()*R*0.65;
      neutrons.push({x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d,
        vx:(Math.random()-0.5)*3.2,vy:(Math.random()-0.5)*3.2,
        life:Math.random()*1.5+0.5,gen:0});
    }
  }

  function drawP1() {
    const cx=W*0.5, cy=H*0.5, R=Math.min(W,H)*0.4;
    const sp=R*0.22, cols=7, rows=7;

    ctx.fillStyle='rgba(3,5,8,0.86)'; ctx.fillRect(0,0,W,H);
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
    ctx.fillStyle='#080c14'; ctx.fill();

    const sx=cx-(cols-1)*sp*0.5, sy=cy-(rows-1)*sp*0.5;
    for (let r=0;r<rows;r++) for (let c=0;c<cols;c++) {
      const fx=sx+c*sp, fy=sy+r*sp;
      if (Math.hypot(fx-cx,fy-cy)>R*0.85) continue;
      let hit=false;
      for (const n of neutrons) if (Math.hypot(n.x-fx,n.y-fy)<sp*0.45) { hit=true; break; }
      ctx.beginPath(); ctx.arc(fx,fy,sp*0.33,0,Math.PI*2);
      ctx.fillStyle=hit?'rgba(255,145,28,0.75)':'rgba(18,48,98,0.55)'; ctx.fill();
      if (hit) {
        ctx.beginPath(); ctx.arc(fx,fy,sp*0.62,0,Math.PI*2);
        ctx.fillStyle='rgba(255,155,35,0.14)'; ctx.fill();
      }
    }

    const toAdd=[];
    for (let i=neutrons.length-1;i>=0;i--) {
      const n=neutrons[i];
      n.x+=n.vx; n.y+=n.vy; n.life-=0.012;
      const d=Math.hypot(n.x-cx,n.y-cy);
      if (d>R*0.92) {
        const a=Math.atan2(n.y-cy,n.x-cx);
        const spd=Math.hypot(n.vx,n.vy);
        n.vx=-Math.cos(a)*spd; n.vy=-Math.sin(a)*spd;
        n.x=cx+Math.cos(a)*R*0.89; n.y=cy+Math.sin(a)*R*0.89;
      }
      if (n.life<0.4 && n.gen<3 && toAdd.length<22) {
        for (let k=0;k<2;k++) {
          const a2=Math.random()*Math.PI*2, spd=2.2+Math.random()*2.2;
          toAdd.push({x:n.x,y:n.y,vx:Math.cos(a2)*spd,vy:Math.sin(a2)*spd,life:1.4+Math.random(),gen:n.gen+1});
        }
        neutrons.splice(i,1); continue;
      }
      ctx.beginPath(); ctx.arc(n.x,n.y,3,0,Math.PI*2);
      ctx.fillStyle='rgba(175,215,255,0.95)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(n.x,n.y); ctx.lineTo(n.x-n.vx*4.5,n.y-n.vy*4.5);
      ctx.strokeStyle='rgba(110,175,255,0.28)'; ctx.lineWidth=1.8; ctx.stroke();
    }
    neutrons.push(...toAdd);
    if (neutrons.length>42) neutrons.splice(0,neutrons.length-42);
    if (neutrons.length<5)  initNeutrons();

    ctx.textAlign='center';
    ctx.fillStyle='rgba(110,180,255,0.72)'; ctx.font=`${Math.floor(W*0.024)}px 'Space Mono',monospace`;
    ctx.fillText('CHAIN REACTION — LIVE',cx,22);
    ctx.fillStyle='rgba(255,145,28,0.62)'; ctx.font=`${Math.floor(W*0.019)}px 'Space Mono',monospace`;
    ctx.fillText('orange = fission event',cx,H-12);
  }

  /* ── Panel 2: Positive void coefficient ─────────── */
  function initVoids() {
    voids_=[];
    const cx=W*0.5, cy=H*0.5, R=Math.min(W,H)*0.36;
    for (let i=0;i<24;i++) {
      const a=Math.random()*Math.PI*2, d=Math.random()*R*0.65;
      voids_.push({x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d,
        vx:(Math.random()-0.5)*0.75,vy:-(Math.random()*1.1+0.3),
        r:Math.random()*7+3,life:Math.random(),grow:Math.random()<0.5});
    }
  }

  function drawP2() {
    const cx=W*0.5, cy=H*0.5, R=Math.min(W,H)*0.4, t=Date.now()/1000;
    ctx.fillStyle='rgba(3,5,8,0.86)'; ctx.fillRect(0,0,W,H);

    const g=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
    g.addColorStop(0,'rgba(28,58,118,0.22)'); g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(35,75,155,0.3)'; ctx.lineWidth=1.5; ctx.stroke();

    let activeVoids=0;
    for (let i=voids_.length-1;i>=0;i--) {
      const v=voids_[i];
      v.x+=v.vx+Math.sin(t+i)*0.28; v.y+=v.vy; v.r+=v.grow?0.04:-0.02; v.life+=0.007;
      const inCore=Math.hypot(v.x-cx,v.y-cy)<R*0.75;
      if (inCore) activeVoids++;
      if (v.y<cy-R*0.98||v.life>1||v.r<1) {
        const a=Math.random()*Math.PI*2, d=Math.random()*R*0.6;
        v.x=cx+Math.cos(a)*d; v.y=cy+R*0.55; v.r=Math.random()*6+2.5; v.vx=(Math.random()-0.5)*0.75;
        v.vy=-(Math.random()*0.95+0.35); v.life=0; continue;
      }
      ctx.beginPath(); ctx.arc(v.x,v.y,Math.max(0.5,v.r),0,Math.PI*2);
      ctx.strokeStyle=`rgba(92,175,255,${0.62-v.life*0.45})`; ctx.lineWidth=0.9; ctx.stroke();
      ctx.fillStyle=`rgba(72,155,255,${0.11-v.life*0.07})`; ctx.fill();
    }

    // Reactivity glow rises with void count
    const rPct=activeVoids/24;
    const rg=ctx.createRadialGradient(cx,cy,0,cx,cy,R*0.85);
    rg.addColorStop(0,`rgba(255,118,18,${rPct*0.52})`); rg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(cx,cy,R*0.85,0,Math.PI*2); ctx.fill();

    ctx.textAlign='center';
    ctx.fillStyle='rgba(92,175,255,0.72)'; ctx.font=`${Math.floor(W*0.022)}px 'Space Mono',monospace`;
    ctx.fillText('STEAM VOIDS FORMING',cx,22);
    ctx.fillStyle=`rgba(255,118,18,${0.38+rPct*0.62})`; ctx.font=`bold ${Math.floor(W*0.024)}px 'Space Mono',monospace`;
    ctx.fillText('↑ REACTIVITY RISING',cx,H-12);
  }

  /* ── Panel 3: Graphite tip — explosive ───────────── */
  function drawP3() {
    const cx=W*0.5, cy=H*0.5, R=Math.min(W,H)*0.38, t=(Date.now()%2800)/2800;
    const pk=Math.sin(t*Math.PI);
    ctx.fillStyle='rgba(5,3,8,0.9)'; ctx.fillRect(0,0,W,H);

    const cg=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
    cg.addColorStop(0,`rgba(255,${Math.floor(182*pk)},0,${0.42+pk*0.35})`);
    cg.addColorStop(0.42,`rgba(195,38,0,${0.38+pk*0.25})`);
    cg.addColorStop(0.85,`rgba(95,18,0,0.18)`);
    cg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fill();

    // Rods in downward motion
    const desc=0.45+(Math.sin(t*Math.PI*2)*0.5+0.5)*0.52;
    const roff=[-0.44,-0.22,0,0.22,0.44];
    roff.forEach(o => {
      const rx=cx+o*R*1.58;
      const rodH=R*desc*2.1;
      const topY=cy-R;
      ctx.fillStyle='rgba(115,18,8,0.92)'; ctx.fillRect(rx-4,topY,8,Math.max(0,rodH-14));
      const tipY=topY+rodH-14;
      ctx.fillStyle='rgba(255,208,22,0.98)'; ctx.fillRect(rx-4,tipY,8,14);
      const tg=ctx.createRadialGradient(rx,tipY+7,0,rx,tipY+7,32);
      tg.addColorStop(0,`rgba(255,225,52,${0.55+pk*0.35})`);
      tg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=tg; ctx.beginPath(); ctx.arc(rx,tipY+7,32,0,Math.PI*2); ctx.fill();
    });

    ctx.textAlign='center';
    ctx.fillStyle=`rgba(255,${Math.floor(195*(1-pk))},0,${0.62+pk*0.38})`;
    ctx.font=`bold ${Math.floor(W*(0.026+pk*0.012))}px 'Space Mono',monospace`;
    ctx.fillText('POWER: ~30,000 MW',cx,cy-R-12);
    ctx.fillStyle='rgba(255,162,48,0.72)';
    ctx.font=`${Math.floor(W*0.021)}px 'Space Mono',monospace`;
    ctx.fillText('GRAPHITE TIPS ACCELERATING',cx,H-12);
  }

  /* ── Animation loop ──────────────────────────────── */
  const DRAW_FNS   = [drawP0, drawP1, drawP2, drawP3];
  const CAPTIONS   = [
    'RBMK-1000 cross-section',
    'Neutron chain reaction — live',
    'Positive void coefficient — live',
    'The graphite tip effect — the killing blow'
  ];
  const STATIC_P   = [0]; // panels that don't need RAF loop

  function startLoop(idx) {
    if (animId) cancelAnimationFrame(animId);
    running=true; activePanel=idx;
    if (caption) caption.textContent=CAPTIONS[idx];
    if (idx===1) initNeutrons();
    if (idx===2) initVoids();
    if (STATIC_P.includes(idx)) { DRAW_FNS[idx](); running=false; return; }
    (function loop() { if (!running||activePanel!==idx) return; DRAW_FNS[idx](); animId=requestAnimationFrame(loop); })();
  }

  function stopLoop() { running=false; if(animId){cancelAnimationFrame(animId);animId=null;} }

  let curSciPanel=-1;
  _bus.push(sy => {
    if (!wrapper) return;
    const wT=wrapper.offsetTop, wH=wrapper.offsetHeight, vh=window.innerHeight;
    const p=Math.max(0,Math.min(1,(sy-wT)/(wH-vh)));
    const idx=Math.min(3,Math.floor(p*4));
    const inView=sy>wT-vh && sy<wT+wH;
    if (!inView) { stopLoop(); return; }
    if (idx!==curSciPanel) {
      curSciPanel=idx;
      panels.forEach((el,i)=>el.classList.toggle('active',i===idx));
      startLoop(idx);
    } else if (!running&&!STATIC_P.includes(idx)) {
      startLoop(idx);
    }
  });

  startLoop(0);
})();

/* ═════════════════════════════════════════════════════════
   11. RADIATION SPREAD CANVAS  — Act V animated map
═════════════════════════════════════════════════════════ */
(function spreadCanvas() {
  const c = document.getElementById('spread-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W = c.offsetWidth, H = 260;
  c.width=W; c.height=H;

  let animT=0, animId=null, done=false;

  const REACTOR = { x:0.465, y:0.52 };
  const ZONES = [
    { cx:0.432, cy:0.48,  rx:0.055, ry:0.038, col:'#c0392b', delay:0.00 },
    { cx:0.465, cy:0.52,  rx:0.115, ry:0.092, col:'#e67e22', delay:0.08 },
    { cx:0.44,  cy:0.40,  rx:0.175, ry:0.115, col:'#f0c040', delay:0.17 },
    { cx:0.34,  cy:0.36,  rx:0.210, ry:0.145, col:'#2a8a3a', delay:0.27 },
    { cx:0.56,  cy:0.33,  rx:0.195, ry:0.135, col:'#2a8a3a', delay:0.31 },
    { cx:0.27,  cy:0.28,  rx:0.145, ry:0.098, col:'#2a8a3a', delay:0.40 },
    { cx:0.62,  cy:0.62,  rx:0.110, ry:0.078, col:'#2a8a3a', delay:0.37 },
    { cx:0.72,  cy:0.24,  rx:0.165, ry:0.112, col:'#1e5a28', delay:0.52 },
  ];

  function frame(t) {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='#060e09'; ctx.fillRect(0,0,W,H);

    // Grid
    ctx.strokeStyle='rgba(18,48,22,0.35)'; ctx.lineWidth=0.5;
    for (let x=0;x<W;x+=38){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for (let y=0;y<H;y+=38){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // River Pripyat
    ctx.beginPath();
    ctx.moveTo(W*0.08,H*0.44);
    ctx.bezierCurveTo(W*0.22,H*0.39,W*0.38,H*0.50,W*0.55,H*0.46);
    ctx.bezierCurveTo(W*0.72,H*0.42,W*0.88,H*0.37,W,H*0.33);
    ctx.strokeStyle='rgba(18,55,95,0.5)'; ctx.lineWidth=3.5; ctx.stroke();
    ctx.fillStyle='rgba(18,55,95,0.32)';
    ctx.font='7px Space Mono,monospace'; ctx.fillText('RIVER PRIPYAT',W*0.42,H*0.42);

    // Borders
    ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(0,H*0.34); ctx.lineTo(W,H*0.37);
    ctx.strokeStyle='rgba(75,75,75,0.32)'; ctx.lineWidth=1; ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(75,75,75,0.42)'; ctx.font='7px Space Mono,monospace';
    ctx.fillText('BELARUS ▲',W*0.04,H*0.27);
    ctx.fillText('UKRAINE',W*0.04,H*0.48);
    ctx.fillText('RUSSIA →',W*0.82,H*0.25);

    // Contamination zones
    for (const z of ZONES) {
      const zt=Math.max(0,(t-z.delay)/(1-z.delay));
      if (zt<=0) continue;
      const e=1-Math.pow(1-Math.min(1,zt*1.5),3);
      const rx=z.rx*W*e, ry=z.ry*H*e, cx=z.cx*W, cy=z.cy*H;
      ctx.save();
      ctx.globalAlpha=0.38*Math.min(1,e*1.5);
      ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
      ctx.fillStyle=z.col; ctx.fill();
      ctx.globalAlpha=0.52*Math.min(1,e*1.5);
      ctx.strokeStyle=z.col; ctx.lineWidth=0.6; ctx.stroke();
      ctx.restore();
    }

    // Wind vectors
    if (t>0.24) {
      const wa=Math.min(1,(t-0.24)*3.5)*0.45;
      ctx.globalAlpha=wa; ctx.strokeStyle='#f0c040'; ctx.lineWidth=1; ctx.setLineDash([4,3]);
      [[0.465,0.52,0.26,0.26],[0.465,0.52,0.73,0.20]].forEach(([x1,y1,x2,y2])=>{
        ctx.beginPath(); ctx.moveTo(W*x1,H*y1); ctx.lineTo(W*x2,H*y2); ctx.stroke();
        // Arrowhead
        const angle=Math.atan2(H*y2-H*y1,W*x2-W*x1);
        ctx.beginPath(); ctx.moveTo(W*x2,H*y2);
        ctx.lineTo(W*x2-8*Math.cos(angle-0.4),H*y2-8*Math.sin(angle-0.4));
        ctx.lineTo(W*x2-8*Math.cos(angle+0.4),H*y2-8*Math.sin(angle+0.4));
        ctx.closePath(); ctx.fillStyle='#f0c040'; ctx.fill();
      });
      ctx.setLineDash([]); ctx.globalAlpha=1;
    }

    // Reactor marker
    const rx=REACTOR.x*W, ry=REACTOR.y*H;
    ctx.fillStyle='#c0392b'; ctx.beginPath(); ctx.rect(rx-5,ry-5,10,10); ctx.fill();
    ctx.strokeStyle='rgba(255,0,0,0.7)'; ctx.lineWidth=1; ctx.stroke();
    ctx.fillStyle='#c0392b'; ctx.font='bold 7.5px Space Mono,monospace'; ctx.textAlign='center';
    ctx.fillText('REACTOR 4',rx,ry-9);

    // Day counter
    const day=Math.min(10,Math.floor(t*10));
    ctx.fillStyle='rgba(195,185,168,0.7)'; ctx.font='10px Space Mono,monospace'; ctx.textAlign='right';
    ctx.fillText(`DAY ${day} / 10`,W-10,H-10);
    ctx.textAlign='left';
  }

  function animLoop() {
    animT+=0.0025;
    if (animT>1){animT=1;done=true;}
    frame(animT);
    if (!done) animId=requestAnimationFrame(animLoop);
  }

  new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if (e.isIntersecting && !animId) { done=false; animT=0; animId=requestAnimationFrame(animLoop); }
    });
  },{threshold:0.3}).observe(c);

  window.addEventListener('resize',()=>{
    W=c.width=c.offsetWidth; H=c.height=260; frame(animT);
  },{passive:true});
})();

/* ═════════════════════════════════════════════════════════
   12. GAME DECISION SYSTEM  — 4 decisions woven through site
═════════════════════════════════════════════════════════ */
const DECISIONS = {
  1:{
    A:{ hist:false, label:'ALTERNATIVE PATH',
        text:'This was the technically correct, safe decision. A formal written objection, logged in the shift records, would have created documentary evidence and could have triggered a review. <em>It would also have been career-threatening in the Soviet institutional culture of 1986.</em>',
        note:'No operator formally objected in writing. The institutional pressure to complete the long-delayed test — and the punitive consequences of challenging a senior engineer — made dissent extraordinarily difficult.',
        log:'Formally objected to test' },
    B:{ hist:true,  label:'WHAT ACTUALLY HAPPENED',
        text:'The shift complied. The test proceeded after the nine-hour delay, with the reactor xenon-poisoned and unstable. The delay had created the very instability that would doom the test. A 24-hour postponement would have allowed xenon-135 — half-life 9.2 hours — to decay to safe levels.',
        note:'No one made the call to wait. Institutional inertia, the pressure of the reporting deadline, and the hierarchical authority structure all pushed toward proceeding.',
        log:'Complied — proceeded with test' }
  },
  2:{
    A:{ hist:false, label:'ALTERNATIVE PATH',
        text:'A refusal would have directly challenged Dyatlov\'s authority — a serious professional and personal risk in the Soviet nuclear establishment. <em>But the ECCS was the only automated system that could respond to the developing emergency. Without it, when the core began to overheat, there was nothing.</em>',
        note:'The ECCS had been disabled for similar tests before — a normalisation of deviation that is a classic precursor to catastrophic accidents in complex systems.',
        log:'Refused ECCS disconnection' },
    B:{ hist:true,  label:'WHAT ACTUALLY HAPPENED',
        text:'The Emergency Core Cooling System was disconnected at 01:05 AM. The justification: it might affect the turbine test data. This removed the last automated safety response from a reactor already operating below safe parameters in multiple compounding ways.',
        note:'Post-accident analysis: even with the ECCS connected, the explosion may have been unpreventable given the rate of the power excursion. But ECCS engagement might have reduced the initial radiological release.',
        log:'Disabled ECCS as ordered' }
  },
  3:{
    A:{ hist:false, label:'WHAT SHOULD HAVE HAPPENED',
        text:'Reporting the full picture would have triggered an immediate national emergency. Pripyat could have been evacuated within hours of the explosion rather than 36 hours later. The 49,000 residents would have received significantly lower radiation doses. <em>Dozens of deaths from acute radiation syndrome might have been prevented.</em>',
        note:'Soviet authorities later acknowledged that immediate evacuation would have substantially reduced the overall health impact. The 36-hour delay is considered one of the most consequential decisions of the entire disaster.',
        log:'Reported full picture to Kremlin' },
    B:{ hist:true,  label:'WHAT ACTUALLY HAPPENED',
        text:'Bryukhanov\'s report of 3.6 R/hr was forwarded. The Kremlin was told the situation was under control. No evacuation was ordered. Residents went to work, children went to school. Outside, the burning reactor core emitted radiation at levels lethal within minutes. <em>For 36 hours, no official told the people of Pripyat what was happening.</em>',
        note:'The first public Soviet acknowledgement was a four-sentence TASS bulletin on April 28 — issued only after Swedish nuclear workers triggered radiation alarms from contamination that had drifted 1,200 km across Europe.',
        log:'Forwarded Bryukhanov\'s report' }
  },
  4:{
    A:{ hist:false, label:'WHAT LEGASOV WAS INSTRUCTED TO DO',
        text:'Presenting only operator error would have protected the nuclear programme and the reputation of Soviet technology. It would have avoided the need to shut down or retrofit all 17 operating RBMK reactors. <em>It would also have been a lie that left the design flaw in place in reactors across the Soviet Union.</em>',
        note:'Legasov\'s instructions were explicit: the RBMK design was sound; individuals had failed to follow procedures. This narrative would have held — had he not left cassette tapes behind.',
        log:'Presented operator error narrative' },
    B:{ hist:true,  label:'WHAT LEGASOV EVENTUALLY DID',
        text:'Legasov\'s Vienna presentation was the most transparent Soviet nuclear disclosure in history — and yet incomplete. He disclosed the positive void coefficient. He stopped short of the full story of institutional suppression. <em>The complete account came two years later, on cassette tapes found after his death on April 27, 1988.</em>',
        note:'On those tapes, Legasov described the systemic failures, the culture of secrecy, and his own complicity in the managed narrative. He died by suicide exactly two years to the day after the explosion.',
        log:'Partial truth in Vienna; full account on tape' }
  }
};

const madeChoices = {};
const opLog = document.getElementById('operator-log');

document.querySelectorAll('.dp-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const dp = parseInt(this.dataset.dp);
    const ch = this.dataset.choice;
    const resultEl = document.getElementById(`dp-${dp}-result`);
    if (!resultEl || resultEl.dataset.done) return;

    resultEl.dataset.done = '1';
    const d = DECISIONS[dp][ch];
    madeChoices[dp] = { ch, d };

    // Disable all choices for this dp
    document.querySelectorAll(`.dp-btn[data-dp="${dp}"]`).forEach(b => {
      b.disabled = true;
      if (b.dataset.choice===ch) {
        b.style.borderColor = d.hist ? 'rgba(57,255,20,0.5)' : 'rgba(240,160,48,0.5)';
        b.style.background  = d.hist ? 'rgba(57,255,20,0.06)' : 'rgba(240,160,48,0.06)';
      }
    });

    // Show consequence
    resultEl.classList.remove('hidden');
    resultEl.innerHTML = `
      <div class="dp-result-label ${d.hist?'historical':'alt'}">${d.label}</div>
      <p>${d.text}</p>
      ${d.note ? `<p class="dp-note">${d.note}</p>` : ''}
    `;

    // Update operator log sidebar
    if (Object.keys(madeChoices).length===1 && opLog) opLog.classList.add('visible');
    const slot = document.querySelector(`.log-slot[data-slot="${dp}"]`);
    if (slot) {
      slot.querySelector('.slot-text').textContent = d.log;
      slot.classList.remove('empty');
      slot.classList.add(d.hist ? 'done-hist' : 'done');
    }
    const ind = document.querySelector(`.gri[data-dp="${dp}"]`);
    if (ind) ind.classList.add(d.hist ? 'done-hist' : 'done');

    buildResults();
  });
});

function buildResults() {
  const grid    = document.getElementById('gr-grid');
  const pending = document.getElementById('gr-pending');
  const twist   = document.getElementById('gr-twist');
  if (!grid) return;

  if (pending) pending.style.display = 'none';
  grid.querySelectorAll('.gr-card').forEach(c=>c.remove());

  const META = [
    { title:'The Xenon-Poisoned Delay',   time:'23:05 — April 25',  hist:'The shift complied and proceeded despite xenon poisoning. The 9-hour delay itself had created the instability.' },
    { title:'Disabling Emergency Cooling', time:'01:05 — April 26', hist:'The ECCS was disconnected. The last automated safety response was removed from an already-unstable reactor.' },
    { title:'The Cover-Up Report',         time:'06:00 — April 26', hist:'Bryukhanov\'s 3.6 R/hr figure was forwarded to Moscow. Evacuation was delayed 36 hours.' },
    { title:'The Vienna Presentation',     time:'August 1986',       hist:'Legasov presented partial truth publicly. The full account came posthumously, on cassette tapes.' }
  ];

  for (let i=1;i<=4;i++) {
    const card = document.createElement('div');
    card.className='gr-card';
    card.style.animationDelay=((i-1)*0.12)+'s';
    const mc = madeChoices[i];
    const m  = META[i-1];
    if (mc) {
      const d = mc.d;
      card.innerHTML=`
        <div class="gr-card-header">
          <span class="gr-card-num">DECISION ${i} — ${m.time}</span>
          <span class="gr-card-tag ${d.hist?'tag-historical':'tag-alt'}">${d.hist?'● HISTORICAL':'◇ ALTERNATIVE'}</span>
        </div>
        <div style="font-family:var(--mono);font-size:.62rem;letter-spacing:.12em;color:var(--text-dim);margin:.4rem 0">${m.title}</div>
        <p class="gr-card-choice"><em>${d.log}</em></p>
        <p class="gr-card-hist">${m.hist}</p>`;
    } else {
      card.innerHTML=`
        <div class="gr-card-header">
          <span class="gr-card-num">DECISION ${i} — ${m.time}</span>
          <span class="gr-card-tag" style="color:var(--text-faint);border-color:var(--text-faint)">PENDING</span>
        </div>
        <div style="font-family:var(--mono);font-size:.62rem;color:var(--text-faint);padding:.6rem 0">${m.title}</div>`;
    }
    grid.appendChild(card);
  }

  if (Object.keys(madeChoices).length===4 && twist) {
    twist.style.display = 'block';
    void twist.offsetWidth;
    twist.style.animation = 'grCardIn 0.8s ease both';
  }
}

// Hide twist until all done
const grTwist = document.getElementById('gr-twist');
if (grTwist) grTwist.style.display = 'none';
buildResults();

/* ═════════════════════════════════════════════════════════
   13. WEB AUDIO  — procedural Geiger + ambient drone
═════════════════════════════════════════════════════════ */
let _AC=null, _drone=null, _droneG=null, _ticker=null, _tickRate=900, _audioOn=false;

const _sndBtn   = document.getElementById('sound-btn');
const _sndLabel = document.getElementById('sound-label');
const _iconOn   = document.getElementById('sound-icon-on');
const _iconOff  = document.getElementById('sound-icon-off');

if (_sndBtn) _sndBtn.addEventListener('click', toggleAudio);

function toggleAudio() { _audioOn ? stopAudio() : startAudio(); }

function startAudio() {
  if (!_AC) {
    try { _AC = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { return; }
  }
  if (_AC.state==='suspended') _AC.resume();

  // Three-oscillator drone
  const oA=_AC.createOscillator(), oB=_AC.createOscillator(), oC=_AC.createOscillator();
  const filt=_AC.createBiquadFilter(), lfo=_AC.createOscillator(), lfoG=_AC.createGain();
  _droneG=_AC.createGain();

  oA.type='sawtooth'; oA.frequency.value=55;
  oB.type='sine';     oB.frequency.value=110;
  oC.type='triangle'; oC.frequency.value=82.5;
  filt.type='lowpass'; filt.frequency.value=185; filt.Q.value=3.2;
  lfo.type='sine'; lfo.frequency.value=0.17; lfoG.gain.value=28;

  _droneG.gain.setValueAtTime(0,_AC.currentTime);
  _droneG.gain.linearRampToValueAtTime(0.065,_AC.currentTime+2.5);

  lfo.connect(lfoG); lfoG.connect(filt.frequency);
  [oA,oB,oC].forEach(o=>o.connect(filt));
  filt.connect(_droneG); _droneG.connect(_AC.destination);
  [oA,oB,oC,lfo].forEach(o=>o.start());
  _drone={oA,oB,oC,lfo};

  scheduleTick();
  _audioOn=true;
  _sndBtn && _sndBtn.classList.add('on');
  _iconOn  && _iconOn.classList.add('hidden');
  _iconOff && _iconOff.classList.remove('hidden');
  _sndLabel && (_sndLabel.textContent='MUTE');
}

function stopAudio() {
  if (_droneG) {
    _droneG.gain.linearRampToValueAtTime(0,_AC.currentTime+0.85);
    setTimeout(()=>{ try{_drone?.oA.stop();_drone?.oB.stop();_drone?.oC.stop();_drone?.lfo.stop();}catch(e){} },950);
  }
  clearTimeout(_ticker); _ticker=null;
  _audioOn=false;
  _sndBtn  && _sndBtn.classList.remove('on');
  _iconOn  && _iconOn.classList.remove('hidden');
  _iconOff && _iconOff.classList.add('hidden');
  _sndLabel && (_sndLabel.textContent='SOUND');
}

function playTick() {
  if (!_AC||!_audioOn) return;
  try {
    const buf=_AC.createBuffer(1,Math.floor(_AC.sampleRate*0.028),_AC.sampleRate);
    const d=buf.getChannelData(0);
    for (let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(d.length*0.07));
    const src=_AC.createBufferSource(); src.buffer=buf;
    const g=_AC.createGain(); g.gain.value=0.38;
    const f=_AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=2200; f.Q.value=0.65;
    src.connect(f); f.connect(g); g.connect(_AC.destination); src.start();
  } catch(e){}
}

function scheduleTick() {
  if (!_audioOn) return;
  playTick();
  const j=_tickRate*(0.62+Math.random()*0.76);
  _ticker=setTimeout(scheduleTick,j);
}

// Rate reacts to proximity of reactor content
_bus.push(sy=>{
  if (!_audioOn) return;
  const el2=document.getElementById('act2-scroll');
  const el5=document.getElementById('act5');
  if (!el2&&!el5) return;
  const d=Math.min(
    el2?Math.abs(sy-el2.offsetTop):Infinity,
    el5?Math.abs(sy-el5.offsetTop):Infinity
  );
  const vh=window.innerHeight;
  _tickRate = d<vh*1.5 ? Math.max(120, 900-((1-(d/(vh*1.5)))*780)) : 900;
});
