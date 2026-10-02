// Up, Up and Away: the secret balloon flight found inside the windmill.
// Hold to fire the burner and rise, let go to drift down. Dodge birds and storm clouds,
// ride the updrafts, and bring three sky lanterns to Lantern Cliffs.
(() => {
const W = 800, H = 480, GOAL = 9000, SPEED = 150, BX = 230, TREES = H - 34;
const cv = document.getElementById('balloonCanvas'), ctx = cv.getContext('2d');
const screenEl = document.getElementById('balloonScreen');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function fit(){ const dpr = Math.min(window.devicePixelRatio||1, 2); cv.width = W*dpr; cv.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
fit(); addEventListener('resize', fit);
const isActive = () => screenEl.classList.contains('active');

function rng(seed){ return () => { seed = (seed*16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function hash(n){ const s = Math.sin(n*127.1 + 17.3)*43758.5453; return s - Math.floor(s); }
function wrap(v, m){ return ((v % m) + m) % m; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function circle(x, y, r){ ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function rr(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

// ---------- the course ----------
const LANTERN_SPOTS = [[2600, 120], [5400, 330], [7900, 150]];
function buildCourse(){
  const r = rng(2024), things = [];
  for (const [x, y] of LANTERN_SPOTS) things.push({ k:'lantern', x, y, r:18 });
  const nearLantern = x => LANTERN_SPOTS.some(([lx]) => Math.abs(lx - x) < 220);
  for (let x = 700; x < GOAL - 500; x += 250 + r()*200){
    const late = x/GOAL, pick = r();
    if (pick < .3){
      // a curve of seeds to follow
      const y0 = 120 + r()*260, amp = (r() - .5)*120;
      for (let i=0;i<6;i++) things.push({ k:'seed', x:x + i*34, y:y0 - Math.sin(i/5*Math.PI)*amp, r:11 });
    } else if (pick < .52){
      const y0 = 90 + r()*280, n = late > .4 && r() < .6 ? 2 : 1;
      for (let i=0;i<n;i++) things.push({ k:'bird', x:x + i*50, y0:y0 + i*40, y:y0, ph:r()*6, vx:-(50 + r()*60), r:14 });
    } else if (pick < .52 + .18 + late*.15 && !nearLantern(x)){
      things.push({ k:'storm', x, y:90 + r()*270, r:42, ph:r()*6 });
    } else {
      things.push({ k:'gust', x, w:90 });
    }
  }
  return things;
}

// ---------- state ----------
let state = 'title', t = 0, dist = 0, by = 240, vy = 0, patches = 3, seeds = 0, lanterns = 0, inv = 0, shake = 0, time = 0, endT = 0, burn = false, shown = false;
let things = buildCourse(), pops = [], warpAt = null;
const anim = Chin.newAnim();
const titleEl = document.getElementById('balloonTitle'), endEl = document.getElementById('balloonEnd');

function takeOff(){
  things = buildCourse(); pops = [];
  dist = 0; by = 300; vy = 0; patches = 3; seeds = 0; lanterns = 0; inv = 0; time = 0; endT = 0; shown = false; burn = false;
  state = 'play'; titleEl.hidden = true; endEl.hidden = true;
}
function pop(x, y, txt, col){ pops.push({ x, y, txt, col: col || '#fff6e4', life:1.1 }); }
function hurt(){
  if (inv > 0) return;
  patches--; inv = 1.6; shake = .35; vy = Math.max(vy, 60);
  pop(BX, by - 110, 'Rrrip!', '#ffd0d3');
  if (patches <= 0){ state = 'down'; endT = 0; burn = false; }
}
function showEnd(won){
  shown = true;
  Save.addSeeds(seeds);
  if (won) Save.addTally('balloonWins');
  const first = won && !Save.flag('balloonDone');
  if (first){ Save.setFlag('balloonDone'); Save.addSeeds(30); }
  document.getElementById('bEndTitle').textContent = won ? 'Lantern Cliffs!' : 'A soft landing';
  document.getElementById('bEndText').textContent = won
    ? (lanterns >= 3 ? 'You floated into Lantern Cliffs with all three sky lanterns, and the whole festival lit up for you.' : `You made it to Lantern Cliffs with ${lanterns} of 3 sky lanterns. Can you find them all?`)
    : 'The balloon sank gently into the treetops. Patch it up and try again!';
  document.getElementById('bEndStats').innerHTML = `<span>Sky lanterns ${lanterns}/3</span><span>Seeds ${seeds}</span>` + (won ? `<span>Time ${time.toFixed(1)} s</span>` : '') + `<span>Wallet ${Save.seeds()}</span>` + (first ? '<span>Secret quest complete! +30 seeds</span>' : '');
  endEl.hidden = false;
}

// ---------- input ----------
function burnOn(){ if (state === 'paused') state = 'play'; burn = true; }
function burnOff(){ burn = false; }
addEventListener('keydown', e => {
  if (!isActive()) return;
  const k = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown'].includes(k)) e.preventDefault();
  if ([' ', 'arrowup', 'w'].includes(k)) burnOn();
  if (k === 'p'){ if (state === 'play') state = 'paused'; else if (state === 'paused') state = 'play'; }
  if (k === 'enter' && (state === 'title' || shown)) takeOff();
});
addEventListener('keyup', e => { if ([' ', 'arrowup', 'w'].includes(e.key.toLowerCase())) burnOff(); });
addEventListener('blur', () => { burnOff(); if (state === 'play' && isActive()) state = 'paused'; });
cv.addEventListener('pointerdown', e => { e.preventDefault(); burnOn(); });
addEventListener('pointerup', burnOff);
const burnBtn = document.getElementById('burnBtn');
burnBtn.addEventListener('pointerdown', e => { e.preventDefault(); burnBtn.setPointerCapture?.(e.pointerId); burnBtn.classList.add('on'); burnOn(); });
for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) burnBtn.addEventListener(ev, () => { burnBtn.classList.remove('on'); burnOff(); });
burnBtn.addEventListener('contextmenu', e => e.preventDefault());
document.getElementById('balloonStart').onclick = takeOff;
document.getElementById('balloonAgain').onclick = takeOff;
function backToMill(){ if (state === 'play') state = 'paused'; showScreen(document.getElementById('villageScreen')); }
document.getElementById('balloonBackBtn').onclick = backToMill;
document.getElementById('balloonToMill').onclick = backToMill;

// ---------- update ----------
function update(dt){
  t += dt;
  Chin.tickAnim(anim, dt, 0, true);
  for (const b of things) if (b.k === 'bird' && !b.gone){ b.x += b.vx*dt; b.y = b.y0 + Math.sin(t*2 + b.ph)*22; }
  if (state === 'play'){
    time += dt; dist += SPEED*dt;
    vy += (burn ? -560 : 300)*dt;
    const wx = dist + BX;
    for (const g of things) if (g.k === 'gust' && Math.abs(g.x - wx) < g.w/2) vy -= 760*dt;
    vy = clamp(vy, -230, 240); by += vy*dt;
    if (by < 158){ by = 158; vy = Math.max(vy, 0); } // stay below the score bar
    if (by + 36 > TREES - 4){ by = TREES - 40; vy = -320; hurt(); }
    inv = Math.max(0, inv - dt);
    for (const o of things){
      if (o.got || o.gone || o.k === 'gust') continue;
      const sx = o.x - dist; if (sx < BX - 140 || sx > BX + 140) continue;
      const hitEnv = Math.hypot(sx - BX, o.y - (by - 54)) < 40 + o.r;
      const hitBasket = Math.hypot(sx - BX, o.y - (by + 24)) < 18 + o.r;
      if (!hitEnv && !hitBasket) continue;
      if (o.k === 'seed'){ o.got = true; seeds++; anim.chew = .4; }
      else if (o.k === 'lantern'){ o.got = true; lanterns++; anim.happy = 3; pop(sx, o.y - 30, 'Sky lantern!', '#ffe066');
        // all three lanterns: a soft white cloud drifts in up ahead. It's a warp hole in disguise.
        // (only once you've made it to Lantern Cliffs 3 times)
        if (lanterns === 3 && Save.tally('balloonWins') >= 3) things.push({ k:'warp', x:dist + W + 160, y:190 + Math.random()*120, r:34 }); }
      else if (o.k === 'warp'){ o.got = true; state = 'warping'; endT = 0; burn = false; warpAt = o; }
      else if (o.k === 'bird'){ o.gone = true; hurt(); }
      else if (o.k === 'storm'){ hurt(); }
    }
    if (dist >= GOAL){ state = 'won'; endT = 0; burn = false; anim.happy = 4; }
  } else if (state === 'won'){
    endT += dt; dist += SPEED*dt*Math.max(0, 1 - endT*.6);
    by += (TREES - 150 - by)*Math.min(1, dt*1.6);
    if (endT > 2.2 && !shown) showEnd(true);
  } else if (state === 'down'){
    endT += dt; vy = Math.min(vy + 160*dt, 90); by = Math.min(by + vy*dt, TREES - 30);
    if (endT > 1.8 && !shown) showEnd(false);
  } else if (state === 'warping'){
    // drift into the cloud and get swirled away toward the next world you haven't found yet (its own game)
    endT += dt; dist += SPEED*dt*Math.max(0, 1 - endT);
    by += (warpAt.y + 40 - by)*Math.min(1, dt*3);
    if (endT > 1.2){
      Save.addSeeds(seeds);
      state = 'title'; titleEl.hidden = false; endEl.hidden = true;
      const nx = window.warpNext ? window.warpNext('thistledown') : null;
      if (nx && nx.locked) startWorldGame(nx.game, 'windmill');
      else if (nx) window.warpFromGame(nx.id);          // every world found: the cloud is a shortcut instead
      else startWorldGame('nebula', 'windmill');
    }
  } else if (state === 'title'){
    by = 250 + Math.sin(t*1.4)*10;
  }
  pops.forEach(p => { p.y -= 36*dt; p.life -= dt; }); pops = pops.filter(p => p.life > 0);
  shake = Math.max(0, shake - dt);
}

// ---------- drawing ----------
const CLOUDS = (() => { const r = rng(31), c = []; for (let i=0;i<14;i++){ const puffs = []; for (let j=0;j<5;j++) puffs.push([j*24 - 48 + r()*10, (r()-.5)*12, 18 + r()*16]); c.push({ x:r()*1600, y:40 + r()*360, par:.25 + r()*.5, a:.35 + r()*.4, puffs }); } return c; })();
function drawSky(){
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#6d8fcf'); g.addColorStop(.55, '#b9a6d6'); g.addColorStop(.85, '#f3c9a8'); g.addColorStop(1, '#f7dcb0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const sx = 620 - dist*.01, sg = ctx.createRadialGradient(sx, 130, 8, sx, 130, 150);
  sg.addColorStop(0, 'rgba(255,240,200,.95)'); sg.addColorStop(.2, 'rgba(255,226,170,.4)'); sg.addColorStop(1, 'rgba(255,226,170,0)');
  ctx.fillStyle = sg; ctx.fillRect(sx - 150, -20, 300, 300); ctx.fillStyle = '#fff4d6'; circle(sx, 130, 30);
  // far mountains
  for (const [par, base, amp, col] of [[.05, 390, 60, '#aab4d4'], [.15, 420, 40, '#9fb0a8']]){
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 10; x += 10){ const wx = x + dist*par; ctx.lineTo(x, base - Math.abs(Math.sin(wx*.004))*amp - Math.sin(wx*.013)*amp*.3); }
    ctx.lineTo(W, H); ctx.fill();
  }
}
function drawClouds(front){
  for (const c of CLOUDS){
    if ((c.par > .62) !== front) continue;
    const x = wrap(c.x - dist*c.par, W + 400) - 200;
    // clouds in front of the balloon stay thin so you can always see it
    ctx.fillStyle = `rgba(255,250,246,${front ? c.a*.4 : c.a})`;
    for (const [dx, dy, r] of c.puffs) circle(x + dx, c.y + dy, r);
  }
}
function drawTrees(){
  ctx.fillStyle = '#6f9474'; ctx.fillRect(0, TREES + 6, W, H);
  for (let i = Math.floor(dist/30) - 1; i*30 - dist < W + 30; i++){
    const x = i*30 - dist, s = 16 + hash(i)*14;
    ctx.fillStyle = i % 2 ? '#4f6e58' : '#5c7d62'; circle(x, TREES + 10 - hash(i + 3)*8, s);
  }
  // the windmill you took off from
  const mx = 120 - dist; if (mx > -120){
    ctx.fillStyle = '#e8dcc6'; ctx.beginPath(); ctx.moveTo(mx - 40, TREES + 10); ctx.lineTo(mx - 26, TREES - 110); ctx.lineTo(mx + 26, TREES - 110); ctx.lineTo(mx + 40, TREES + 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a4553f'; ctx.beginPath(); ctx.moveTo(mx - 32, TREES - 106); ctx.quadraticCurveTo(mx, TREES - 156, mx + 32, TREES - 106); ctx.fill();
    ctx.save(); ctx.translate(mx, TREES - 118); ctx.rotate(t*.5); ctx.fillStyle = 'rgba(246,234,214,.9)';
    for (let k=0;k<4;k++){ ctx.rotate(Math.PI/2); ctx.fillRect(3, -80, 14, 60); } ctx.restore();
  }
}
function drawCliffs(){
  const x = GOAL + BX + 60 - dist; if (x > W + 260) return;
  ctx.fillStyle = '#8a7a6a'; ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + 20, TREES - 120); ctx.quadraticCurveTo(x + 150, TREES - 150, x + 400, TREES - 130); ctx.lineTo(x + 400, H); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6f9474'; ctx.beginPath(); ctx.moveTo(x + 14, TREES - 118); ctx.quadraticCurveTo(x + 150, TREES - 158, x + 400, TREES - 138); ctx.lineTo(x + 400, TREES - 122); ctx.quadraticCurveTo(x + 150, TREES - 140, x + 22, TREES - 104); ctx.closePath(); ctx.fill();
  // festival lanterns strung across the cliffs, glowing brighter for each one you bring
  for (let i=0;i<9;i++){
    const lx = x + 40 + i*38, ly = TREES - 200 - Math.sin(i*.9)*18 + Math.sin(t*1.5 + i)*4, lit = i % 3 < lanterns || state === 'won';
    ctx.strokeStyle = 'rgba(58,38,22,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, ly - 30); ctx.lineTo(lx, ly - 8); ctx.stroke();
    if (lit){ const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, 26); g.addColorStop(0, 'rgba(255,214,120,.7)'); g.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = g; circle(lx, ly, 26); }
    ctx.fillStyle = lit ? '#f2a03a' : '#9a8a7a'; rr(lx - 8, ly - 8, 16, 20, 5); ctx.fill();
  }
}
function drawGust(g){
  const x = g.x - dist; if (x < -80 || x > W + 80) return;
  ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x - g.w/2, 0, g.w, TREES);
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i=0;i<7;i++){
    const lx = x - g.w/2 + 10 + (i*13) % (g.w - 20), ly = wrap(-t*160 + i*67, TREES + 60) - 30;
    ctx.moveTo(lx, ly); ctx.quadraticCurveTo(lx + 5, ly - 12, lx, ly - 26);
  }
  ctx.stroke(); ctx.lineCap = 'butt';
}
function drawThing(o){
  const x = o.x - dist; if (x < -80 || x > W + 80 || o.got) return;
  if (o.k === 'seed'){
    ctx.save(); ctx.translate(x, o.y + Math.sin(t*3 + o.x)*3); ctx.rotate(Math.sin(t*2 + o.x)*.3);
    ctx.fillStyle = '#3d3226'; ctx.beginPath(); ctx.ellipse(0, 0, 7, 11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#efe2b4'; for (const s of [-3.5, 0, 3.5]) ctx.fillRect(s - .8, -8, 1.6, 16);
    ctx.restore();
  } else if (o.k === 'lantern'){
    const y = o.y + Math.sin(t*2 + o.x)*6, g = ctx.createRadialGradient(x, y, 3, x, y, 46);
    g.addColorStop(0, 'rgba(255,214,120,.8)'); g.addColorStop(1, 'rgba(255,214,120,0)'); ctx.fillStyle = g; circle(x, y, 46);
    ctx.fillStyle = '#f2a03a'; rr(x - 13, y - 16, 26, 32, 8); ctx.fill();
    ctx.strokeStyle = '#b8652a'; ctx.lineWidth = 2; ctx.beginPath(); for (const dx of [-5, 5]){ ctx.moveTo(x + dx, y - 15); ctx.lineTo(x + dx, y + 15); } ctx.stroke();
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 8, y - 20, 16, 4); ctx.fillRect(x - 6, y + 16, 12, 4);
    ctx.fillStyle = '#fff1b0'; circle(x, y + 2, 5);
  } else if (o.k === 'bird'){
    if (o.gone) return;
    const flap = Math.sin(t*12 + o.ph)*8;
    ctx.strokeStyle = '#3a2c3a'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 16, o.y - flap); ctx.quadraticCurveTo(x - 7, o.y - 6, x, o.y); ctx.quadraticCurveTo(x + 7, o.y - 6, x + 16, o.y - flap); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#3a2c3a'; ctx.beginPath(); ctx.ellipse(x, o.y + 1, 7, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2a03a'; ctx.beginPath(); ctx.moveTo(x - 7, o.y); ctx.lineTo(x - 12, o.y + 2); ctx.lineTo(x - 7, o.y + 3); ctx.fill();
  } else if (o.k === 'warp'){
    // a soft white cloud, nothing like the grey storm clouds, with the faintest swirl inside
    const y = o.y + Math.sin(t*1.2)*4, g = ctx.createRadialGradient(x, y, 10, x, y, 70);
    g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; circle(x, y, 70);
    ctx.fillStyle = '#fdfbff';
    for (const [dx, dy, r] of [[-30, 6, 22], [0, -10, 30], [30, 4, 24], [14, 14, 20], [-14, 16, 18]]) circle(x + dx, y + dy, r);
    ctx.save(); ctx.translate(x, y + 2); ctx.rotate(reduceMotion ? 0 : t*1.5);
    ctx.strokeStyle = 'rgba(200,170,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*1.3); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 6, Math.PI, Math.PI*2.2); ctx.stroke();
    ctx.restore();
    for (let i=0;i<3;i++){ const a = t*1.3 + i*2.1, sx2 = x + Math.cos(a)*44, sy2 = y + Math.sin(a)*22; ctx.fillStyle = `rgba(255,255,255,${.5 + .5*Math.sin(t*3 + i)})`; circle(sx2, sy2, 1.8); }
  } else if (o.k === 'storm'){
    const flash = Math.sin(t*2.6 + o.ph) > .93;
    ctx.fillStyle = flash ? '#7a7f9a' : '#5b5f78';
    for (const [dx, dy, r] of [[-30, 6, 24], [0, -8, 32], [30, 4, 26], [12, 16, 22], [-14, 18, 20]]) circle(x + dx, o.y + dy, r);
    ctx.fillStyle = 'rgba(40,42,60,.5)'; ctx.fillRect(x - 44, o.y + 22, 88, 3);
    if (flash){
      ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(x + 4, o.y + 24); ctx.lineTo(x - 6, o.y + 44); ctx.lineTo(x + 4, o.y + 44); ctx.lineTo(x - 8, o.y + 70); ctx.stroke();
    }
    // raindrops
    ctx.strokeStyle = 'rgba(160,180,220,.6)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i=0;i<6;i++){ const rx = x - 30 + i*12, ry = o.y + 30 + wrap(t*120 + i*23, 40); ctx.moveTo(rx, ry); ctx.lineTo(rx - 2, ry + 7); } ctx.stroke();
  }
}
function drawBalloon(){
  if (inv > 0 && state === 'play' && Math.floor(inv*12) % 2 === 0) return;
  const x = BX, y = by + (state === 'down' ? 0 : Math.sin(t*2)*1.5), tilt = clamp(vy/1600, -.08, .08);
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  // ropes
  ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(-17, -8); ctx.lineTo(-14, 14); ctx.moveTo(17, -8); ctx.lineTo(14, 14); ctx.moveTo(-6, -6); ctx.lineTo(-5, 14); ctx.moveTo(6, -6); ctx.lineTo(5, 14); ctx.stroke();
  // burner flame
  if (burn && state === 'play'){
    const f = 10 + Math.random()*6;
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(-5, 4); ctx.quadraticCurveTo(0, 4 - f*1.6, 5, 4); ctx.fill();
    ctx.fillStyle = '#ff8a3a'; ctx.beginPath(); ctx.moveTo(-3, 4); ctx.quadraticCurveTo(0, 4 - f, 3, 4); ctx.fill();
  }
  ctx.fillStyle = '#4a3020'; ctx.fillRect(-6, 4, 12, 5);
  // envelope with colored gores
  const env = () => { ctx.beginPath(); ctx.moveTo(-17, -8); ctx.bezierCurveTo(-64, -40, -54, -104, 0, -104); ctx.bezierCurveTo(54, -104, 64, -40, 17, -8); ctx.closePath(); };
  env(); ctx.fillStyle = '#e0762e'; ctx.fill();
  ctx.save(); env(); ctx.clip();
  const cols = ['#f6ead6', '#e0762e', '#c9854a', '#b8453d'];
  for (let k=4;k>=1;k--){ ctx.fillStyle = cols[k % cols.length]; ctx.beginPath(); ctx.ellipse(0, -52, 12*k, 60, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(-20, -70, 12, 24, -.3, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(60,20,10,.25)'; ctx.fillRect(-60, -30, 120, 6);
  ctx.restore();
  env(); ctx.strokeStyle = '#6b2e14'; ctx.lineWidth = 2.5; ctx.stroke();
  // the chinchilla peeks out of the basket
  ctx.restore();
  Chin.draw(ctx, 'me', anim, x + 2, y + 34, { scale:.07, face:1, grounded:true, speed:0, tilt, dazed: state === 'down' });
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  ctx.fillStyle = '#b8864a'; rr(-16, 14, 32, 22, 4); ctx.fill();
  ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i=1;i<4;i++){ ctx.moveTo(-16, 14 + i*5.5); ctx.lineTo(16, 14 + i*5.5); } for (let i=-12;i<=12;i+=6){ ctx.moveTo(i, 14); ctx.lineTo(i, 36); } ctx.stroke();
  ctx.fillStyle = '#6b4226'; ctx.fillRect(-18, 12, 36, 4);
  ctx.restore();
}
function balloonIcon(x, y, on){
  ctx.fillStyle = on ? '#e0762e' : 'rgba(246,234,214,.25)';
  ctx.beginPath(); ctx.moveTo(x - 4, y + 5); ctx.bezierCurveTo(x - 13, y, x - 11, y - 12, x, y - 12); ctx.bezierCurveTo(x + 11, y - 12, x + 13, y, x + 4, y + 5); ctx.closePath(); ctx.fill();
  ctx.fillRect(x - 3, y + 7, 6, 4);
}
function drawHUD(){
  ctx.fillStyle = 'rgba(43,33,24,.6)'; rr(10, 10, W - 20, 40, 10); ctx.fill();
  for (let i=0;i<3;i++) balloonIcon(34 + i*26, 30, i < patches);
  ctx.textBaseline = 'middle'; ctx.font = '700 20px "Pixelify Sans", monospace';
  ctx.save(); ctx.translate(140, 30); ctx.fillStyle = '#3d3226'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 10, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#efe2b4'; ctx.fillRect(-.8, -7, 1.6, 14); ctx.restore();
  ctx.fillStyle = '#fff6e4'; ctx.fillText(`${seeds}`, 154, 31);
  for (let i=0;i<3;i++){ ctx.fillStyle = i < lanterns ? '#f2a03a' : 'rgba(246,234,214,.22)'; rr(226 + i*24, 21, 14, 18, 4); ctx.fill(); }
  const px = 330, pw = 340;
  ctx.strokeStyle = 'rgba(246,234,214,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, 30); ctx.lineTo(px + pw, 30); ctx.stroke();
  ctx.fillStyle = '#8a7a6a'; ctx.fillRect(px + pw + 2, 22, 10, 16);
  balloonIcon(px + pw*Math.min(1, dist/GOAL), 30, true);
  ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`${time.toFixed(0)} s`, W - 24, 31); ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
function draw(){
  ctx.save();
  if (shake > 0 && !reduceMotion) ctx.translate((Math.random() - .5)*10*shake, (Math.random() - .5)*10*shake);
  drawSky();
  drawClouds(false);
  for (const g of things) if (g.k === 'gust') drawGust(g);
  drawCliffs();
  drawTrees();
  for (const o of things) if (o.k !== 'gust') drawThing(o);
  drawBalloon();
  drawClouds(true);
  ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
  for (const p of pops){ ctx.globalAlpha = Math.max(0, p.life); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,33,24,.75)'; ctx.strokeText(p.txt, p.x, p.y); ctx.fillStyle = p.col; ctx.fillText(p.txt, p.x, p.y); }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
  ctx.restore();
  if (state === 'warping'){
    const k = Math.min(1, endT/1.2);
    ctx.fillStyle = `rgba(40,16,70,${k})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W/2, H/2); ctx.rotate(t*3);
    for (let i=0;i<6;i++){ ctx.strokeStyle = `rgba(200,160,255,${k*(.7 - i*.1)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 0, (1.1 - k)*420 + i*40, ((1.1 - k)*420 + i*40)*.6, i*.4, 0, Math.PI*1.5); ctx.stroke(); }
    ctx.restore();
  }
  if (state !== 'title' && state !== 'warping') drawHUD();
  if (state === 'paused'){
    ctx.fillStyle = 'rgba(43,33,24,.5)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff6e4'; ctx.font = '700 44px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('Paused', W/2, H/2 - 10); ctx.font = '600 18px Nunito, sans-serif'; ctx.fillText('Press P or hold to keep flying', W/2, H/2 + 30);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
}

let last = performance.now();
function loop(now){
  // the next frame is booked first, so one bad frame can never stop the game
  requestAnimationFrame(loop);
  try {
    const dt = Math.min(.033, (now - last)/1000); last = now;
    if (isActive()){ if (state !== 'paused') update(dt); draw(); }
  } catch (err) { console.error(err); }
}
requestAnimationFrame(loop);
})();
