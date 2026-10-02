// First-visit intro: a silly warning notice, then a short story of how the chinchilla ended up in Thistledown.
// It plays once per browser (remembered in localStorage); the home screen can play it again.
(() => {
const W = 800, H = 480;
const S = .14, CHIN_H = 812*S;                 // chinchilla scale, and its height from feet to hat
const SEEN_KEY = 'theShift.introSeen';
// story timeline, in seconds
const TRIP = 5.4, SHAFT = 7.0, WARP = 10.2, LAND = 12.8;
// the meadow walk
const GROUND = 400, START_X = 80, WALK_V = 120, PEBBLE_X = 742, WELL_X = 820, RIM = GROUND - 64;
// the landing in Thistledown
const LAND_X = 330, LAND_GROUND = 410;
const CAPTIONS = [
  [0, 'Once upon a Tuesday, a chinchilla in a very good hat went for a walk.'],
  [2.7, 'It was a lovely day. Nothing could possibly go wrong.'],
  [TRIP + .2, '…oops.'],
  [SHAFT, 'Down…'],
  [SHAFT + 1.1, '…down…'],
  [SHAFT + 2.2, '…and through something that was definitely not in the well’s brochure.'],
  [WARP + 1.2, 'Hold on to your hat!'],
  [LAND + .6, 'Welcome to Thistledown.'],
  [LAND + 2.4, 'You came out about half alive and twice as fluffy. It suits you.'],
];

const root = document.getElementById('introScreen');
const warning = document.getElementById('introWarning');
const story = document.getElementById('introStory');
const cv = document.getElementById('introCanvas'), ctx = cv.getContext('2d');
const caption = document.getElementById('introCaption');
const acceptBtn = document.getElementById('introAccept');
const declineBtn = document.getElementById('introDecline');
const skipBtn = document.getElementById('introSkip');
const enterBtn = document.getElementById('introEnter');
const replayBtn = document.getElementById('replayIntroBtn');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function fit(){ const dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = W*dpr; cv.height = H*dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
fit(); addEventListener('resize', fit);

function rng(seed){ return () => { seed = (seed*16807) % 2147483647; return (seed - 1)/2147483646; }; }
const clamp01 = v => Math.max(0, Math.min(1, v));

// scenery that stays put between frames
const FLOWERS = (() => { const r = rng(11), f = []; for (let i = 0; i < 46; i++) f.push({ x: r()*1400, y: GROUND + 6 + r()*70, c: ['#f7d14a', '#f28fb0', '#ffffff', '#b98cf0'][i % 4], s: .7 + r()*.6 }); return f; })();
const CLOUDS = [{ x: 120, y: 70, s: 1 }, { x: 460, y: 50, s: .8 }, { x: 760, y: 95, s: 1.2 }, { x: 1050, y: 60, s: .9 }];
const STARS = (() => { const r = rng(5), s = []; for (let i = 0; i < 90; i++) s.push({ a: r()*Math.PI*2, v: .35 + r()*.5, p: r() }); return s; })();
const COTTAGES = [{ x: 520, w: 84, h: 62 }, { x: 625, w: 104, h: 78 }, { x: 742, w: 78, h: 58 }];
const THISTLES = [{ x: 30, h: 58 }, { x: 225, h: 42 }, { x: 470, h: 66 }, { x: 575, h: 46 }, { x: 690, h: 38 }, { x: 775, h: 60 }];
const FIREFLIES = (() => { const r = rng(21), f = []; for (let i = 0; i < 14; i++) f.push({ x: r()*W, y: 200 + r()*200, p: r()*6 }); return f; })();

// ---------- tiny sound effects (made on the fly, and quiet when music is off) ----------
let ac = null;
function unlockAudio(){ try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume(); } catch (e) {} }
function tone(type, f0, f1, dur, vol){
  if (!ac || (typeof musicOn !== 'undefined' && !musicOn)) return;
  try {
    const now = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, now); o.frequency.exponentialRampToValueAtTime(f1, now + dur);
    g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(.001, now + dur);
    o.connect(g).connect(ac.destination); o.start(now); o.stop(now + dur + .05);
  } catch (e) {}
}

// ---------- story state ----------
let anim, t, parts, shake, hop, cues, captionAt, running = false, raf = 0, last = 0;
function reset(){
  anim = window.Chin ? Chin.newAnim() : { squash: 0, happy: 0, chew: 0 };
  t = 0; parts = []; shake = 0; hop = { y: 0, vy: 0, idleT: 0 }; captionAt = -1;
  cues = [
    [TRIP, () => tone('square', 520, 360, .12, .05)],                         // bonk on the pebble
    [TRIP + .5, () => tone('sine', 1400, 180, 1.9, .08)],                     // slide whistle down the well
    [TRIP + .75, () => burst(WELL_X - camAt(TRIP), RIM, 14, '#d9c7a4')],
    [WARP - .4, () => { tone('triangle', 110, 900, 2.6, .07); tone('sine', 220, 1300, 2.6, .04); }],
    [LAND + .55, () => { anim.squash = .25; shake = .5; burst(LAND_X, LAND_GROUND, 18, '#e8d6b0'); tone('sine', 140, 45, .35, .25); }],
    [LAND + 3.2, () => { hop.vy = -460; anim.happy = 2.5; anim.chew = .8; tone('sine', 300, 700, .22, .08); }],
    [LAND + 3.8, () => { enterBtn.hidden = false; skipBtn.hidden = true; enterBtn.focus(); hop.idleT = 3; }],
  ].map(([at, fn]) => ({ at, fn, done: false }));
}
function burst(x, y, n, col){
  for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5)*240, vy: -40 - Math.random()*170, life: 1, r: 3 + Math.random()*4, col });
}
const walkX = at => START_X + WALK_V*Math.min(at, TRIP);
const camAt = at => Math.max(0, Math.min(WELL_X - 480, walkX(at) - 320));

function update(dt){
  t += dt;
  for (const c of cues) if (!c.done && t >= c.at){ c.done = true; c.fn(); }
  if (window.Chin) Chin.tickAnim(anim, dt, t < TRIP ? WALK_V : 0, t < TRIP || (t > LAND + .55 && hop.y === 0));
  // after landing: little hops, now and then
  if (hop.idleT > 0 && !reduceMotion){ hop.idleT -= dt; if (hop.idleT <= 0 && hop.y === 0){ hop.vy = -380; hop.idleT = 3 + Math.random()*3; } }
  if (hop.y < 0 || hop.vy < 0){ hop.vy += 2400*dt; hop.y += hop.vy*dt; if (hop.y >= 0){ if (hop.vy > 300) anim.squash = .14; hop.y = 0; hop.vy = 0; } }
  for (const p of parts){ p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 320*dt; p.life -= dt*1.4; }
  parts = parts.filter(p => p.life > 0);
  shake = Math.max(0, shake - dt*2);
  let i = -1; CAPTIONS.forEach(([at], k) => { if (t >= at) i = k; });
  if (i !== captionAt){ captionAt = i; caption.textContent = i < 0 ? '' : CAPTIONS[i][1]; }
}

// ---------- drawing helpers ----------
function ellipse(x, y, rx, ry){ ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI*2); ctx.fill(); }
function rr(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function star(x, y, r){
  ctx.beginPath();
  for (let i = 0; i < 10; i++){ const a = -Math.PI/2 + i*Math.PI/5, d = i % 2 ? r*.45 : r; ctx.lineTo(x + Math.cos(a)*d, y + Math.sin(a)*d); }
  ctx.closePath(); ctx.fill();
}
// (x, y) = the point between the feet
function chin(x, y, o){
  if (!window.Chin) return;
  Chin.draw(ctx, 'me', anim, x, y, Object.assign({ scale: S, face: 1, grounded: true, speed: 0, tilt: 0 }, o));
}
// spins around the middle of the body instead of the feet
function chinSpin(cx, cy, ang, sc = S){
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  chin(0, 406*sc, { scale: sc, grounded: false, dazed: true });
  ctx.restore();
}
function shadow(x, y, k = 1){ ctx.fillStyle = `rgba(20,12,20,${.3*k})`; ellipse(x, y + 2, 46*k, 8*k); }
function hills(off, base, amp, col, f){
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
  for (let x = 0; x <= W; x += 8){ const u = x + off; ctx.lineTo(x, base - amp*(.5 + .5*Math.sin(u*f)) - amp*.35*Math.sin(u*f*2.3 + 1)); }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
}
function cloud(x, y, s){ ctx.fillStyle = 'rgba(255,255,255,.9)'; ellipse(x, y, 42*s, 16*s); ellipse(x - 26*s, y + 4*s, 24*s, 12*s); ellipse(x + 18*s, y - 10*s, 26*s, 16*s); }
function seed(x, y, a){ ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = '#3d3226'; ellipse(0, 0, 5, 9); ctx.fillStyle = '#efe2b4'; ctx.fillRect(-.8, -6, 1.6, 12); ctx.restore(); }

// ---------- scene 1: a lovely walk, a pebble, a well ----------
function meadow(cam){
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#7ec8ee'); g.addColorStop(.65, '#d6eef4'); g.addColorStop(1, '#fdeec8');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,240,180,.45)'; ellipse(650 - cam*.05, 90, 62, 62); ctx.fillStyle = '#fff3b8'; ellipse(650 - cam*.05, 90, 40, 40);
  for (const c of CLOUDS){ const x = ((c.x - cam*.15 + t*6) % (W + 300) + W + 300) % (W + 300) - 150; cloud(x, c.y, c.s); }
  hills(cam*.25, 320, 70, '#a9d18f', .006);
  hills(cam*.5 + 300, 362, 46, '#88bb69', .009);
  ctx.fillStyle = '#78ad4f'; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = '#5f9440'; ctx.fillRect(0, GROUND, W, 5);
  ctx.fillStyle = '#d8b77e'; ctx.fillRect(0, GROUND + 18, W, 26);
  for (const f of FLOWERS){
    const x = f.x - cam; if (x < -10 || x > W + 10 || (f.y > GROUND + 14 && f.y < GROUND + 48)) continue;
    ctx.strokeStyle = '#4f8a35'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, f.y); ctx.lineTo(x, f.y - 10*f.s); ctx.stroke();
    ctx.fillStyle = f.c; for (let i = 0; i < 5; i++){ const a = i*1.257; ellipse(x + Math.cos(a)*3.5*f.s, f.y - 10*f.s + Math.sin(a)*3.5*f.s, 2.6*f.s, 2.6*f.s); }
    ctx.fillStyle = '#e8a33a'; ellipse(x, f.y - 10*f.s, 1.8*f.s, 1.8*f.s);
  }
  // the pebble of destiny
  ctx.fillStyle = '#8d8781'; ellipse(PEBBLE_X - cam, GROUND - 3, 8, 5); ctx.fillStyle = '#b3ada6'; ellipse(PEBBLE_X - cam - 2, GROUND - 5, 4, 2);
}
function wellBack(x){
  ctx.fillStyle = '#6b4630'; ctx.fillRect(x - 80, RIM - 150, 12, 150); ctx.fillRect(x + 68, RIM - 150, 12, 150);
  ctx.fillStyle = '#5b3a26'; ctx.fillRect(x - 84, RIM - 146, 168, 8);
  ctx.fillStyle = '#a8553a'; ctx.beginPath(); ctx.moveTo(x - 112, RIM - 138); ctx.lineTo(x, RIM - 205); ctx.lineTo(x + 112, RIM - 138); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#7e3c28'; ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++){ const k = i/4; ctx.beginPath(); ctx.moveTo(x - 112*k, RIM - 205 + 67*k); ctx.lineTo(x + 112*k, RIM - 205 + 67*k); ctx.stroke(); }
  ctx.fillStyle = '#9b958f'; ellipse(x, RIM, 86, 19);
  ctx.fillStyle = '#0b070d'; ellipse(x, RIM + 2, 72, 13);
}
function wellFront(x){
  ctx.fillStyle = '#8f8a86'; ctx.fillRect(x - 86, RIM, 172, GROUND - RIM); ellipse(x, GROUND, 86, 10);
  ctx.strokeStyle = '#6f6a66'; ctx.lineWidth = 2;
  for (let r = 0; r < 4; r++){
    const y = RIM + 4 + r*16; ctx.beginPath(); ctx.moveTo(x - 86, y + 16); ctx.lineTo(x + 86, y + 16); ctx.stroke();
    for (let bx = x - 86 + (r % 2)*18; bx < x + 86; bx += 36){ ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx, y + 16); ctx.stroke(); }
  }
  ctx.strokeStyle = '#b3ada6'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(x, RIM + 1, 79, 16, 0, 0, Math.PI); ctx.stroke();
}
function sceneWalk(){
  const cam = camAt(t), wx = WELL_X - cam;
  meadow(cam);
  wellBack(wx);
  if (t < TRIP){
    const x = walkX(t) - cam; shadow(x, GROUND); chin(x, GROUND, { speed: WALK_V });
  } else {
    // trips on the pebble, sails over the rim, and drops in
    const k = t - TRIP, x0 = walkX(TRIP);
    let x, y;
    if (k < .55){ const u = k/.55; x = x0 + (WELL_X - x0)*u; y = GROUND - 110*Math.sin(Math.PI*u*.75); }
    else { const s = k - .55; x = WELL_X; y = GROUND - 110*Math.sin(Math.PI*.75) + 900*s*s; }
    if (y < GROUND + CHIN_H) chin(x - cam, y, { grounded: false, tilt: reduceMotion ? .3 : Math.min(1.3, k*2.4), dazed: k > .3 });
    if (k < .7){
      ctx.font = '700 34px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.lineWidth = 5; ctx.strokeStyle = '#2b1a0c'; ctx.fillStyle = '#ffe066';
      const py = Math.min(y, GROUND) - CHIN_H - 12; ctx.strokeText('!', x - cam, py); ctx.fillText('!', x - cam, py); ctx.textAlign = 'left';
    }
  }
  wellFront(wx);
  // a small voice, echoing up out of the well
  const e = t - (TRIP + 1);
  if (e > 0){
    ctx.globalAlpha = clamp01(1 - e/1.4); ctx.font = '700 22px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#2b1a0c';
    ctx.fillText('eeeeeep…', wx + Math.sin(e*9)*6, RIM - 24 - e*40); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }
}

// ---------- scene 2: down the well ----------
function sceneShaft(){
  const s = t - SHAFT;
  ctx.fillStyle = '#0c0810'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#1a1318'; ctx.fillRect(0, 0, 210, H); ctx.fillRect(590, 0, 210, H);
  const fall = s*760, BH = 32, BW = 64, first = Math.floor(fall/BH);
  for (let r = 0; r <= H/BH + 1; r++){
    const row = first + r, y = row*BH - fall;
    for (const [x0, x1] of [[0, 210], [590, 800]]){
      for (let x = x0 - (row % 2)*BW/2; x < x1; x += BW){
        const bx = Math.max(x0, x), bw = Math.min(x1, x + BW) - bx; if (bw < 3) continue;
        ctx.fillStyle = ['#3b3036', '#443841', '#33292f', '#3e3238'][(row*7 + Math.floor(x/BW)*13) & 3];
        ctx.fillRect(bx + 1, y + 1, bw - 2, BH - 2);
      }
    }
  }
  // the well's opening, shrinking away above
  const lr = 340/(1 + s*1.8), lg = ctx.createRadialGradient(400, -30, 0, 400, -30, lr*1.6);
  lg.addColorStop(0, 'rgba(255,236,190,.7)'); lg.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++){ const x = 230 + (i*53) % 340, y = ((i*97 - s*1400) % (H + 120) + H + 120) % (H + 120) - 60; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 60); ctx.stroke(); }
  const v = ctx.createRadialGradient(400, 240, 120, 400, 240, 520); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.7)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  // the bottom of the well is... purple?
  const wk = clamp01((s - 1.6)/1.4);
  if (wk > 0){ ctx.fillStyle = `rgba(110,50,190,${wk*.35})`; ctx.fillRect(0, 0, W, H); }
  if (t > WARP - 1){ ctx.globalAlpha = clamp01(t - (WARP - 1)); warpBg(t - WARP); ctx.globalAlpha = 1; }
  chinSpin(400 + Math.sin(s*2.3)*28, 230 + Math.sin(s*3.1)*12, reduceMotion ? Math.sin(s)*.3 : s*4.5);
}

// ---------- scene 3: the warp ----------
function warpBg(w){
  const g = ctx.createRadialGradient(400, 240, 10, 400, 240, 520);
  g.addColorStop(0, '#6a32b0'); g.addColorStop(.4, '#2a0f4a'); g.addColorStop(1, '#07020f'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const st of STARS){
    const z = ((w*st.v + st.p) % 1 + 1) % 1, d = 20 + z*z*620, d0 = d*(1 - .2*z);
    ctx.strokeStyle = `rgba(230,210,255,${z})`; ctx.lineWidth = 1 + z*2;
    ctx.beginPath(); ctx.moveTo(400 + Math.cos(st.a)*d0, 240 + Math.sin(st.a)*d0); ctx.lineTo(400 + Math.cos(st.a)*d, 240 + Math.sin(st.a)*d); ctx.stroke();
  }
  ctx.save(); ctx.translate(400, 240);
  for (let i = 0; i < 7; i++){
    const z = ((w*.55 + i/7) % 1 + 1) % 1, r = 10 + z*z*720;
    ctx.strokeStyle = `hsla(${265 + i*14},85%,72%,${Math.sin(Math.PI*z)*.8})`; ctx.lineWidth = 2 + z*10;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r*.62, i*.45 + w*(reduceMotion ? .2 : 1.2), 0, Math.PI*1.6); ctx.stroke();
  }
  ctx.restore();
}
function sceneWarp(){
  const w = t - WARP;
  warpBg(w);
  // a few seeds got sucked in too
  for (let i = 0; i < 6; i++){ const a = w*1.5 + i*1.05, r = 150 + 40*Math.sin(w + i); seed(400 + Math.cos(a)*r, 240 + Math.sin(a)*r*.6, a*2); }
  chinSpin(400, 240, reduceMotion ? Math.sin(w)*.3 : (WARP - SHAFT)*4.5 + w*6, S*(1 + .12*Math.sin(w*5)));
}

// ---------- scene 4: Thistledown ----------
function cottage(c, base, l){
  const { x, w, h } = c;
  ctx.fillStyle = '#7a5a4a'; ctx.fillRect(x + w/4, base - h - h*.55, 12, 26);
  for (let i = 0; i < 3; i++){
    const k = ((l*.5 + i/3) % 1); ctx.fillStyle = `rgba(240,230,240,${(1 - k)*.5})`;
    ellipse(x + w/4 + 6 + Math.sin(k*6 + i)*5, base - h - h*.55 - 6 - k*46, 5 + k*7, 5 + k*7);
  }
  ctx.fillStyle = '#e9d3a6'; ctx.fillRect(x - w/2, base - h, w, h);
  ctx.fillStyle = 'rgba(80,40,60,.18)'; ctx.fillRect(x + w/4, base - h, w/4, h);
  ctx.fillStyle = '#9a4b3a'; ctx.beginPath(); ctx.moveTo(x - w/2 - 10, base - h); ctx.lineTo(x, base - h - h*.7); ctx.lineTo(x + w/2 + 10, base - h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,200,100,.3)'; ellipse(x - w/4, base - h*.55, 18, 18);
  ctx.fillStyle = '#ffd36e'; ctx.fillRect(x - w/4 - 8, base - h*.65, 16, 16);
  ctx.fillStyle = '#6b4630'; rr(x + w/12, base - h*.5, 16, h*.5, 6); ctx.fill();
}
function thistle(x, base, h){
  ctx.strokeStyle = '#4f7f3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + 6, base - h/2, x, base - h); ctx.stroke();
  ctx.fillStyle = '#4f7f3a'; ctx.beginPath(); ctx.moveTo(x, base - h*.35); ctx.lineTo(x - 14, base - h*.5); ctx.lineTo(x, base - h*.45); ctx.lineTo(x + 14, base - h*.6); ctx.lineTo(x + 2, base - h*.4); ctx.fill();
  ctx.fillStyle = '#5d8f45'; ellipse(x, base - h, 8, 9);
  ctx.strokeStyle = '#b07ae0'; ctx.lineWidth = 2;
  for (let i = -3; i <= 3; i++){ ctx.beginPath(); ctx.moveTo(x, base - h - 6); ctx.lineTo(x + i*3.5, base - h - 20 + Math.abs(i)*1.5); ctx.stroke(); }
}
function thistledown(l){
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5b4b9a'); g.addColorStop(.45, '#c97fa0'); g.addColorStop(.8, '#f8c58a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 18; i++) ellipse((i*137) % W, (i*53) % 140 + 10, 1.2, 1.2);
  ctx.fillStyle = 'rgba(255,220,160,.5)'; ellipse(610, 330, 84, 84); ctx.fillStyle = '#ffd9a0'; ellipse(610, 330, 56, 56);
  hills(0, 330, 50, '#7a6898', .007);
  hills(180, 372, 34, '#5d7f4f', .01);
  COTTAGES.forEach(c => cottage(c, 382, l));
  ctx.fillStyle = '#5f8f45'; ctx.fillRect(0, LAND_GROUND - 12, W, H - LAND_GROUND + 12);
  ctx.fillStyle = '#78a752'; ctx.fillRect(0, LAND_GROUND - 12, W, 5);
  ctx.fillStyle = 'rgba(214,180,120,.7)'; ctx.beginPath(); ctx.moveTo(250, H); ctx.lineTo(560, LAND_GROUND - 7); ctx.lineTo(640, LAND_GROUND - 7); ctx.lineTo(460, H); ctx.closePath(); ctx.fill();
  // the sign, so there's no doubt
  ctx.fillStyle = '#6b4630'; ctx.fillRect(146, LAND_GROUND - 92, 8, 92);
  ctx.fillStyle = '#b07c48'; rr(78, LAND_GROUND - 104, 150, 34, 6); ctx.fill(); ctx.strokeStyle = '#5b3a26'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#2b1a0c'; ctx.font = '700 17px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('THISTLEDOWN', 153, LAND_GROUND - 86); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  for (const f of FIREFLIES){
    const a = .4 + .6*Math.max(0, Math.sin(t*2 + f.p*3));
    ctx.fillStyle = `rgba(255,233,160,${a*.35})`; ellipse(f.x + Math.sin(t*.7 + f.p)*20, f.y + Math.cos(t*.9 + f.p)*10, 6, 6);
    ctx.fillStyle = `rgba(255,240,190,${a})`; ellipse(f.x + Math.sin(t*.7 + f.p)*20, f.y + Math.cos(t*.9 + f.p)*10, 2, 2);
  }
}
function sceneLand(){
  const l = t - LAND;
  thistledown(l);
  if (l < .55){
    const u = l/.55, y = -140 + (LAND_GROUND + 140)*u*u;
    shadow(LAND_X, LAND_GROUND, .4 + .6*u);
    chinSpin(LAND_X, y - 406*S, reduceMotion ? 0 : (1 - u)*3.2);
  } else {
    shadow(LAND_X, LAND_GROUND, 1 - Math.min(.5, -hop.y/200));
    chin(LAND_X, LAND_GROUND + hop.y, { grounded: hop.y === 0, dazed: l < 3 });
    if (l < 3){
      ctx.fillStyle = '#ffe066';
      for (let i = 0; i < 3; i++){ const a = l*4 + i*2.09; star(LAND_X + Math.cos(a)*32, LAND_GROUND - CHIN_H + 6 + Math.sin(a)*8, 7); }
    }
  }
  for (const th of THISTLES) thistle(th.x, H - 14, th.h);
}

function draw(){
  ctx.save();
  if (shake > 0 && !reduceMotion) ctx.translate((Math.random() - .5)*12*shake, (Math.random() - .5)*12*shake);
  if (t < SHAFT) sceneWalk(); else if (t < WARP) sceneShaft(); else if (t < LAND) sceneWarp(); else sceneLand();
  for (const p of parts){ ctx.globalAlpha = clamp01(p.life); ctx.fillStyle = p.col; ellipse(p.x, p.y, p.r, p.r); }
  ctx.globalAlpha = 1;
  ctx.restore();
  // a quick blackout into the well, and a white flash out of the warp
  const dark = 1 - Math.abs(t - SHAFT)/.35;
  if (dark > 0){ ctx.fillStyle = `rgba(0,0,0,${dark})`; ctx.fillRect(0, 0, W, H); }
  const flash = t < LAND ? (t - (LAND - .6))/.6 : 1 - (t - LAND)/.5;
  if (flash > 0){ ctx.fillStyle = `rgba(255,250,240,${clamp01(flash)})`; ctx.fillRect(0, 0, W, H); }
}

function frame(now){
  if (!running) return;
  raf = requestAnimationFrame(frame);
  try { update(Math.min(.05, (now - last)/1000)); last = now; draw(); } catch (err) { console.error(err); }
}

// ---------- opening and closing ----------
function markSeen(){ try { localStorage.setItem(SEEN_KEY, 'true'); } catch (e) {} }
function click(){ if (typeof playClick === 'function') playClick(); }
function open(){
  root.hidden = false; warning.hidden = false; story.hidden = true;
  document.body.classList.add('intro-open');
  acceptBtn.focus();
}
function close(){
  running = false; cancelAnimationFrame(raf);
  root.hidden = true; document.body.classList.remove('intro-open');
}
function begin(){
  markSeen();
  warning.hidden = true; story.hidden = false; enterBtn.hidden = true; skipBtn.hidden = false;
  reset(); fit();
  running = true; last = performance.now(); raf = requestAnimationFrame(frame);
  skipBtn.focus();
}
// into the village, the same way the Play button goes
function finish(){ markSeen(); close(); document.getElementById('startBtn').click(); }

acceptBtn.addEventListener('click', () => { click(); unlockAudio(); if (typeof startMusic === 'function') startMusic(); begin(); });
declineBtn.addEventListener('click', () => { click(); markSeen(); close(); });
skipBtn.addEventListener('click', finish);
enterBtn.addEventListener('click', finish);
replayBtn.addEventListener('click', () => { click(); open(); });
addEventListener('keydown', e => {
  if (root.hidden || e.key !== 'Escape') return;
  e.preventDefault();
  if (story.hidden){ markSeen(); close(); } else finish();
});

let seen = false;
try { seen = localStorage.getItem(SEEN_KEY) === 'true'; } catch (e) {}
if (!seen) open();
})();
