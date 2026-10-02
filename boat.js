// Row the Dragonfly: the little boat from under the bridge, down the river to somewhere new.
// Seen from above. Steer around rocks, logs and whirlpools, pick up seeds and three glow lilies,
// row through a dark tunnel by lantern light, and come out onto a moonlit lake.
(() => {
const W = 800, H = 480, GOAL = 7400, BOAT_Y = 370, TUNNEL = [3600, 5400], LILIES = [1800, 4500, 6500];
const cv = document.getElementById('boatCanvas'), ctx = cv.getContext('2d');
const screenEl = document.getElementById('boatScreen');
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

// ---------- the river ----------
// how deep into the tunnel a spot is: 0 outside, 1 well inside
const tunnelK = d => clamp(Math.min(d - TUNNEL[0], TUNNEL[1] - d)/250, 0, 1);
// the river's center and half-width at distance d; it narrows in the tunnel and opens onto the lake at the end
function riverAt(d){
  let c = 400 + Math.sin(d*.0011)*100 + Math.sin(d*.0029 + 1)*40, hw = 175 + Math.sin(d*.0008)*35 - tunnelK(d)*45;
  if (d > GOAL - 400){ const k = clamp((d - (GOAL - 400))/600, 0, 1); hw += k*420; c += (400 - c)*k; }
  return [c, hw];
}
const screenY = d => BOAT_Y - (d - dist);
function thingX(o){ const [c, hw] = riverAt(o.d); return c + o.u*hw + (o.drift ? o.drift*time : 0); }

function buildCourse(){
  const r = rng(77), things = [];
  for (const d of LILIES) things.push({ k:'lily', d, u:(r() - .5)*.9, r:16 });
  const nearLily = d => LILIES.some(l => Math.abs(l - d) < 170);
  for (let d = 500; d < GOAL - 600; d += 150 + r()*140){
    const late = d/GOAL, pick = r();
    if (pick < .3){ const u0 = (r() - .5)*1.1; for (let i=0;i<4;i++) things.push({ k:'seed', d:d + i*40, u:u0 + Math.sin(i*1.3)*.12, r:10 }); }
    else if (pick < .56 && !nearLily(d)){ const n = r() < late ? 2 : 1; for (let i=0;i<n;i++) things.push({ k:'rock', d:d + i*26, u:(r() - .5)*1.5, r:15 + r()*9, ph:r()*6 }); }
    else if (pick < .74 && !nearLily(d)){ things.push({ k:'log', d, u:(r() - .5)*1.1, len:70 + r()*40, ang:(r() - .5)*.6, drift:(r() - .5)*10, r:12 }); }
    else if (pick < .84 && !nearLily(d) && d > 1000){ things.push({ k:'whirl', d, u:(r() - .5)*.9, r:42 }); }
  }
  return things;
}

// ---------- state ----------
let state = 'title', t = 0, time = 0, dist = 0, speed = 160, bx = 400, vx = 0, spin = 0, planks = 3, seeds = 0, lilies = 0, inv = 0, shake = 0, endT = 0, shown = false;
let things = buildCourse(), pops = [], splashes = [], warpAt = null;
const keys = {}, pointer = { on:false, x:0 };
const titleEl = document.getElementById('boatTitle'), endEl = document.getElementById('boatEnd');
const FLIES = (() => { const r = rng(5), f = []; for (let i=0;i<40;i++) f.push({ d:TUNNEL[0] + r()*(TUNNEL[1] - TUNNEL[0]), u:(r() - .5)*2.4, ph:r()*6 }); return f; })();

function launch(){
  things = buildCourse(); pops = []; splashes = [];
  time = 0; dist = 0; speed = 160; bx = riverAt(0)[0]; vx = 0; spin = 0; planks = 3; seeds = 0; lilies = 0; inv = 0; endT = 0; shown = false;
  state = 'play'; titleEl.hidden = true; endEl.hidden = true;
}
function pop(x, y, txt, col){ pops.push({ x, y, txt, col: col || '#fff6e4', life:1.1 }); }
function splash(x, y){ splashes.push({ x, y, life:.6 }); }
function hurt(txt){
  if (inv > 0) return;
  planks--; inv = 1.5; shake = .35; speed *= .5;
  pop(bx, BOAT_Y - 60, txt, '#ffd0d3'); splash(bx, BOAT_Y - 20);
  if (planks <= 0){ state = 'sunk'; endT = 0; }
}
function showEnd(won){
  shown = true;
  Save.addSeeds(seeds);
  if (won) Save.addTally('boatWins');
  const first = won && !Save.flag('boatDone');
  if (first){ Save.setFlag('boatDone'); Save.addSeeds(25); }
  document.getElementById('boatEndTitle').textContent = won ? 'The Moonlit Lake' : 'Shipwrecked!';
  document.getElementById('boatEndText').textContent = won
    ? (lilies >= 3 ? 'The river carried you out onto a still, moonlit lake beneath the mountains, with all three glow lilies aboard. Someone left a lantern burning on the little dock…' : `The river carried you out onto a still, moonlit lake beneath the mountains, with ${lilies} of 3 glow lilies. Someone left a lantern burning on the little dock…`)
    : 'The Dragonfly sprang one leak too many. You paddle back to the cove to patch her up.';
  document.getElementById('boatEndStats').innerHTML = `<span>Glow lilies ${lilies}/3</span><span>Seeds ${seeds}</span>` + (won ? `<span>Time ${time.toFixed(1)} s</span>` : '') + `<span>Wallet ${Save.seeds()}</span>` + (first ? '<span>Secret quest complete! +25 seeds</span>' : '');
  endEl.hidden = false;
}

// ---------- input ----------
const KEYMAP = { arrowleft:'l', a:'l', arrowright:'r', d:'r', arrowup:'row', w:'row', ' ':'row', arrowdown:'slow', s:'slow' };
addEventListener('keydown', e => {
  if (!isActive()) return;
  const k = e.key.toLowerCase();
  if (KEYMAP[k]){ e.preventDefault(); keys[KEYMAP[k]] = true; if (state === 'paused') state = 'play'; }
  if (k === 'p'){ if (state === 'play') state = 'paused'; else if (state === 'paused') state = 'play'; }
  if (k === 'enter' && (state === 'title' || shown)) launch();
});
addEventListener('keyup', e => { const k = KEYMAP[e.key.toLowerCase()]; if (k) keys[k] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; pointer.on = false; if (state === 'play' && isActive()) state = 'paused'; });
// hold on the left or right half of the river to steer
cv.addEventListener('pointerdown', e => { e.preventDefault(); if (state === 'paused') state = 'play'; pointer.on = true; const r = cv.getBoundingClientRect(); pointer.x = (e.clientX - r.left)/r.width*W; });
cv.addEventListener('pointermove', e => { if (!pointer.on) return; const r = cv.getBoundingClientRect(); pointer.x = (e.clientX - r.left)/r.width*W; });
addEventListener('pointerup', () => { pointer.on = false; });
function hold(id, key){
  const b = document.getElementById(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); b.classList.add('on'); keys[key] = true; if (state === 'paused') state = 'play'; });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => { b.classList.remove('on'); keys[key] = false; });
  b.addEventListener('contextmenu', e => e.preventDefault());
}
hold('rowLeft', 'l'); hold('rowRight', 'r'); hold('rowHard', 'row');
document.getElementById('boatStart').onclick = launch;
document.getElementById('boatAgain').onclick = launch;
function backToCove(){ if (state === 'play') state = 'paused'; showScreen(document.getElementById('villageScreen')); }
document.getElementById('boatBackBtn').onclick = backToCove;
document.getElementById('boatToCove').onclick = backToCove;

// ---------- update ----------
function update(dt){
  t += dt;
  if (state === 'play'){
    time += dt;
    const want = keys.row ? 250 : keys.slow ? 90 : 160;
    speed += (want - speed)*Math.min(1, dt*1.6);
    let steer = (keys.l ? -1 : 0) + (keys.r ? 1 : 0);
    if (!steer && pointer.on) steer = clamp((pointer.x - bx)/60, -1, 1);
    vx += steer*950*dt; vx *= Math.pow(.06, dt); vx = clamp(vx, -270, 270);
    // whirlpools pull you in, spin you around and slow you down
    for (const o of things){
      if (o.k !== 'whirl') continue;
      const sy = screenY(o.d), ox = thingX(o), dx = ox - bx, dy = sy - BOAT_Y, dd = Math.hypot(dx, dy);
      if (dd < o.r + 40){ vx += dx*3*dt; spin += dt*5; speed *= 1 - dt*1.2; }
    }
    spin *= Math.pow(.25, dt);
    bx += vx*dt; dist += speed*dt;
    // the banks bounce you back and slow you down
    const [c, hw] = riverAt(dist), L = c - hw + 20, R = c + hw - 20;
    if (bx < L){ bx = L; vx = Math.abs(vx)*.4 + 60; speed *= .75; splash(bx - 14, BOAT_Y); shake = .12; }
    if (bx > R){ bx = R; vx = -Math.abs(vx)*.4 - 60; speed *= .75; splash(bx + 14, BOAT_Y); shake = .12; }
    inv = Math.max(0, inv - dt);
    for (const o of things){
      if (o.got || o.k === 'whirl') continue;
      const sy = screenY(o.d); if (sy < BOAT_Y - 80 || sy > BOAT_Y + 60) continue;
      const ox = thingX(o);
      let hit;
      if (o.k === 'log'){
        // distance from the boat to the log's line
        const ex = Math.cos(o.ang)*o.len/2, ey = Math.sin(o.ang)*o.len/2;
        hit = [BOAT_Y - 22, BOAT_Y, BOAT_Y + 16].some(py => { const px = bx; const tt = clamp(((px - (ox - ex))*2*ex + (py - (sy - ey))*2*ey)/(4*(ex*ex + ey*ey)), 0, 1); return Math.hypot(px - (ox - ex + 2*ex*tt), py - (sy - ey + 2*ey*tt)) < o.r + 14; });
      } else hit = [BOAT_Y - 22, BOAT_Y, BOAT_Y + 16].some(py => Math.hypot(bx - ox, py - sy) < o.r + 14);
      if (!hit) continue;
      if (o.k === 'seed'){ o.got = true; seeds++; }
      else if (o.k === 'lily'){ o.got = true; lilies++; pop(ox, sy - 30, 'Glow lily!', '#ffe066');
        // all three lilies: up ahead, the moon is reflected on the water, though there's no moon in the dusk sky.
        // It's a warp hole in disguise.
        // (only once you've reached the lake 3 times)
        if (lilies === 3 && Save.tally('boatWins') >= 3) things.push({ k:'moon', d:dist + 560, u:bx < riverAt(dist + 560)[0] ? .45 : -.45, r:30 }); }
      else if (o.k === 'moon'){ o.got = true; state = 'warping'; endT = 0; warpAt = o; }
      else if (o.k === 'rock'){ hurt('Crunch!'); }
      else if (o.k === 'log'){ hurt('Thunk!'); }
    }
    if (dist >= GOAL){ state = 'won'; endT = 0; }
  } else if (state === 'won'){
    // glide gently up to the dock
    endT += dt; speed = Math.max(0, speed - dt*110); dist += speed*dt; bx += (400 - bx)*Math.min(1, dt*1.2); vx = 0;
    if (endT > 2.4 && !shown) showEnd(true);
  } else if (state === 'sunk'){
    endT += dt; speed = Math.max(0, speed - dt*200); dist += speed*dt;
    if (endT > 1.8 && !shown) showEnd(false);
  } else if (state === 'warping'){
    // row into the moon's reflection and get swirled away to the Moonlit Lake's game
    endT += dt; speed = Math.max(0, speed - dt*200); dist += speed*dt; bx += (thingX(warpAt) - bx)*Math.min(1, dt*3); spin += dt*6;
    if (endT > 1.2){
      Save.addSeeds(seeds);
      state = 'title'; titleEl.hidden = false; endEl.hidden = true;
      startWorldGame('moonlake', 'cove');
    }
  } else if (state === 'title'){
    dist = 0; bx = riverAt(0)[0] + Math.sin(t)*6;
  }
  pops.forEach(p => { p.y -= 36*dt; p.life -= dt; }); pops = pops.filter(p => p.life > 0);
  splashes.forEach(s => s.life -= dt); splashes = splashes.filter(s => s.life > 0);
  shake = Math.max(0, shake - dt);
}

// ---------- drawing ----------
function drawLand(){
  // dusk turns to night the further downriver you go
  const k = clamp(dist/GOAL, 0, 1);
  ctx.fillStyle = '#6f9474'; ctx.fillRect(0, 0, W, H);
  // rows of the river from the top of the screen to the bottom
  const rows = []; for (let sy = -8; sy <= H + 8; sy += 8){ const d = dist + (BOAT_Y - sy); rows.push([sy, ...riverAt(d), tunnelK(d)]); }
  // rocky tunnel walls take over the grass
  for (const [sy, c, hw, tk] of rows){ if (tk <= 0) continue; ctx.fillStyle = `rgba(58,52,72,${tk})`; ctx.fillRect(0, sy, W, 8); }
  // trees and flowers along the banks, seen from above
  const dTop = dist + BOAT_Y + 80, dBot = dist - (H - BOAT_Y) - 80;
  for (let i = Math.floor(dBot/55); i <= Math.ceil(dTop/55); i++){
    const d = i*55; if (tunnelK(d) > .2 || d > GOAL - 200) continue;
    const [c, hw] = riverAt(d), sy = screenY(d);
    for (const sd of [-1, 1]){
      const x = c + sd*(hw + 40 + hash(i*2 + (sd > 0 ? 1 : 0))*110), s = 18 + hash(i + (sd > 0 ? 7 : 3))*16;
      if (hash(i*5 + sd) > .35){ ctx.fillStyle = 'rgba(30,50,36,.35)'; circle(x + 5, sy + 6, s); ctx.fillStyle = '#4f6e58'; circle(x, sy, s); ctx.fillStyle = '#5c7d62'; circle(x - s*.3, sy - s*.3, s*.6); }
      else { ctx.fillStyle = ['#e79ab8', '#f2c230', '#9a86d8'][i % 3]; for (let f=0;f<4;f++) circle(x + f*7 - 10, sy + (f % 2)*6, 3); }
    }
  }
  // the water
  const wg = ctx.createLinearGradient(0, 0, 0, H); wg.addColorStop(0, '#5f8fb0'); wg.addColorStop(1, '#79a8c6');
  ctx.fillStyle = wg; ctx.beginPath();
  rows.forEach(([sy, c, hw], i) => i ? ctx.lineTo(c - hw, sy) : ctx.moveTo(c - hw, sy));
  for (let i = rows.length - 1; i >= 0; i--){ const [sy, c, hw] = rows[i]; ctx.lineTo(c + hw, sy); }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 5; for (const sd of [-1, 1]){ ctx.beginPath(); rows.forEach(([sy, c, hw], i) => i ? ctx.lineTo(c + sd*hw, sy) : ctx.moveTo(c + sd*hw, sy)); ctx.stroke(); }
  // the current: streaks that drift past
  ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i = Math.floor(dBot/42); i <= Math.ceil(dTop/42); i++){
    const d = i*42 - (reduceMotion ? 0 : (t*30) % 42), [c, hw] = riverAt(d), sy = screenY(d);
    for (let j=0;j<3;j++){ const u = (hash(i*3 + j) - .5)*1.7, x = c + u*hw; ctx.moveTo(x, sy); ctx.lineTo(x, sy + 12); }
  }
  ctx.stroke();
  // the lake and the little dock at the end
  const dockY = screenY(GOAL + 330);
  if (dockY > -120){
    ctx.fillStyle = 'rgba(255,250,230,.25)'; ctx.beginPath(); ctx.ellipse(560, dockY - 20, 60, 20, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a5a32'; ctx.fillRect(370, dockY - 120, 60, 130); ctx.strokeStyle = '#5c3a22'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let y = dockY - 110; y < dockY + 10; y += 12){ ctx.moveTo(370, y); ctx.lineTo(430, y); } ctx.stroke();
    for (const px of [366, 426]) for (const py of [dockY - 100, dockY - 40, dockY + 6]){ ctx.fillStyle = '#5c3a22'; circle(px + 4, py, 5); }
    const lg = ctx.createRadialGradient(424, dockY - 8, 2, 424, dockY - 8, 70); lg.addColorStop(0, 'rgba(255,220,130,.7)'); lg.addColorStop(1, 'rgba(255,220,130,0)');
    ctx.fillStyle = lg; circle(424, dockY - 8, 70); ctx.fillStyle = '#ffe27a'; ctx.fillRect(418, dockY - 14, 12, 12);
  }
  // evening deepens into night
  ctx.fillStyle = `rgba(20,24,60,${k*.35})`; ctx.fillRect(0, 0, W, H);
}
function drawThing(o){
  const sy = screenY(o.d); if (sy < -60 || sy > H + 60 || o.got) return;
  const x = thingX(o);
  if (o.k === 'seed'){
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, sy + 3, 11, 4, 0, 0, 7); ctx.stroke();
    ctx.save(); ctx.translate(x, sy + Math.sin(t*3 + o.d)*1.5); ctx.rotate(Math.sin(t*2 + o.d)*.3);
    ctx.fillStyle = '#3d3226'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#efe2b4'; for (const q of [-3, 0, 3]) ctx.fillRect(q - .7, -7, 1.4, 14); ctx.restore();
  } else if (o.k === 'lily'){
    const g = ctx.createRadialGradient(x, sy, 2, x, sy, 44); g.addColorStop(0, 'rgba(255,220,120,.7)'); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g; circle(x, sy, 44);
    ctx.fillStyle = '#5d8f4a'; ctx.beginPath(); ctx.moveTo(x, sy); ctx.arc(x, sy, 17, .4, Math.PI*2 - .1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd24a'; for (let p=0;p<6;p++){ const a = p/6*Math.PI*2 + t*.4; ctx.beginPath(); ctx.ellipse(x + Math.cos(a)*6, sy + Math.sin(a)*6, 6, 3, a, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#fff6d0'; circle(x, sy, 3.5);
  } else if (o.k === 'moon'){
    // a bright round moon on the water, shimmering in little stripes
    const g = ctx.createRadialGradient(x, sy, 4, x, sy, 60); g.addColorStop(0, 'rgba(255,250,220,.55)'); g.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = g; circle(x, sy, 60);
    ctx.fillStyle = '#fbf3d0'; ctx.beginPath(); ctx.ellipse(x, sy, 26, 20, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(95,143,176,.8)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i=-3;i<=3;i++){ const yy = sy + i*6, off = reduceMotion ? 0 : Math.sin(t*3 + i)*4; ctx.moveTo(x - 28 + off, yy); ctx.lineTo(x + 28 + off, yy); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(251,243,208,.6)'; ctx.beginPath(); for (let i=0;i<4;i++){ const yy = sy + 26 + i*7, wd = 20 - i*4, off = Math.sin(t*2 + i)*5; ctx.moveTo(x - wd + off, yy); ctx.lineTo(x + wd + off, yy); } ctx.stroke();
  } else if (o.k === 'rock'){
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, sy + 4, o.r + 7 + Math.sin(t*3 + o.ph)*2, o.r*.7 + 5, 0, 0, 7); ctx.stroke();
    ctx.fillStyle = '#6f675c'; ctx.beginPath(); ctx.ellipse(x, sy + 3, o.r, o.r*.8, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#9a9186'; ctx.beginPath(); ctx.ellipse(x - 2, sy, o.r*.85, o.r*.65, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(x - o.r*.3, sy - o.r*.25, o.r*.3, o.r*.18, -.4, 0, 7); ctx.fill();
  } else if (o.k === 'log'){
    ctx.save(); ctx.translate(x, sy); ctx.rotate(o.ang);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; rr(-o.len/2 - 4, -o.r - 3, o.len + 8, o.r*2 + 6, o.r + 3); ctx.fill();
    ctx.fillStyle = '#7a5230'; rr(-o.len/2, -o.r, o.len, o.r*2, o.r); ctx.fill();
    ctx.strokeStyle = 'rgba(40,24,12,.4)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=-1;i<=1;i++){ ctx.moveTo(-o.len/2 + 10, i*6); ctx.lineTo(o.len/2 - 10, i*6); } ctx.stroke();
    for (const sd of [-1, 1]){ ctx.fillStyle = '#c9a36a'; ctx.beginPath(); ctx.ellipse(sd*(o.len/2 - 3), 0, 4, o.r - 1, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  } else if (o.k === 'whirl'){
    ctx.save(); ctx.translate(x, sy); ctx.rotate(reduceMotion ? 0 : -t*3);
    ctx.fillStyle = 'rgba(40,70,100,.35)'; circle(0, 0, o.r);
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2.5;
    for (let a=0;a<3;a++){ ctx.beginPath(); for (let i=0;i<30;i++){ const r = o.r*(1 - i/30), an = a*Math.PI*2/3 + i*.25; i ? ctx.lineTo(Math.cos(an)*r, Math.sin(an)*r*.8) : ctx.moveTo(Math.cos(an)*r, Math.sin(an)*r*.8); } ctx.stroke(); }
    ctx.restore();
  }
}
// the Dragonfly from above, with the chinchilla rowing
function drawBoat(){
  if (inv > 0 && state === 'play' && Math.floor(inv*12) % 2 === 0) return;
  const rowing = state === 'play' && (keys.row || speed > 170), ph = t*(rowing ? 9 : 5);
  // wake behind the stern
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bx - 10, BOAT_Y + 26); ctx.lineTo(bx - 26 - speed*.06, BOAT_Y + 70); ctx.moveTo(bx + 10, BOAT_Y + 26); ctx.lineTo(bx + 26 + speed*.06, BOAT_Y + 70); ctx.stroke();
  ctx.save(); ctx.translate(bx, BOAT_Y); ctx.rotate(clamp(vx/900, -.3, .3) + Math.sin(spin)*spin*.2);
  // oars
  for (const sd of [-1, 1]){
    const a = Math.sin(ph)*.5;
    ctx.save(); ctx.translate(sd*16, 2); ctx.rotate(sd*a);
    ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sd*38, 4); ctx.stroke();
    ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.ellipse(sd*42, 5, 8, 4, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  // hull
  ctx.fillStyle = '#6b4226'; ctx.beginPath(); ctx.moveTo(0, -38); ctx.bezierCurveTo(22, -26, 22, 16, 15, 28); ctx.lineTo(-15, 28); ctx.bezierCurveTo(-22, 16, -22, -26, 0, -38); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#a9744a'; ctx.beginPath(); ctx.moveTo(0, -32); ctx.bezierCurveTo(17, -22, 17, 14, 11, 23); ctx.lineTo(-11, 23); ctx.bezierCurveTo(-17, 14, -17, -22, 0, -32); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(58,38,22,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const x of [-6, 0, 6]){ ctx.moveTo(x, -26); ctx.lineTo(x, 22); } ctx.stroke();
  ctx.fillStyle = '#8a5a32'; ctx.fillRect(-16, -3, 32, 6);
  // lantern on the bow
  const lg = ctx.createRadialGradient(0, -34, 1, 0, -34, 24); lg.addColorStop(0, 'rgba(255,220,130,.8)'); lg.addColorStop(1, 'rgba(255,220,130,0)');
  ctx.fillStyle = lg; circle(0, -34, 24); ctx.fillStyle = '#ffe27a'; ctx.fillRect(-4, -38, 8, 8);
  // the chinchilla from above: tail, body, ears poking out from under the hat
  ctx.strokeStyle = '#200204'; ctx.lineWidth = 2;
  ctx.fillStyle = '#a8a0a3'; ctx.beginPath(); ctx.ellipse(0, 18, 5, 7, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d6cbb8'; ctx.beginPath(); ctx.ellipse(0, 8, 12, 12, 0, 0, 7); ctx.fill(); ctx.stroke();
  for (const sd of [-1, 1]){ ctx.fillStyle = '#f3ede6'; ctx.beginPath(); ctx.ellipse(sd*15, -4, 6, 7, sd*.4, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fec592'; ctx.beginPath(); ctx.ellipse(sd*15, -4, 3, 4, sd*.4, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#b06a42'; ctx.beginPath(); ctx.arc(0, -4, 14, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6b3a2a'; ctx.beginPath(); ctx.arc(0, -4, 9.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#df9763'; ctx.beginPath(); ctx.arc(0, -4, 8, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// in the tunnel it's dark except near the boat's lantern, the fireflies and the glow lilies
function drawDark(){
  const tk = tunnelK(dist + 80); if (tk <= 0) return;
  const g = ctx.createRadialGradient(bx, BOAT_Y - 30, 40, bx, BOAT_Y - 30, 230);
  g.addColorStop(0, 'rgba(8,6,18,0)'); g.addColorStop(1, `rgba(8,6,18,${.88*tk})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (const f of FLIES){
    const sy = screenY(f.d) + Math.sin(t*1.3 + f.ph)*12; if (sy < -10 || sy > H + 10) continue;
    const [c, hw] = riverAt(f.d), x = c + f.u*hw*.9 + Math.sin(t*.8 + f.ph)*14, a = (.3 + .7*Math.max(0, Math.sin(t*2 + f.ph*3)))*tk;
    const fg = ctx.createRadialGradient(x, sy, 0, x, sy, 10); fg.addColorStop(0, `rgba(255,246,170,${a})`); fg.addColorStop(1, 'rgba(255,246,170,0)');
    ctx.fillStyle = fg; circle(x, sy, 10);
  }
  for (const o of things) if (o.k === 'lily' && !o.got && tunnelK(o.d) > 0){ const sy = screenY(o.d); if (sy > -40 && sy < H + 40) drawThing(o); }
}
function drawHUD(){
  ctx.fillStyle = 'rgba(43,33,24,.65)'; rr(10, 10, W - 20, 40, 10); ctx.fill();
  for (let i=0;i<3;i++){ ctx.fillStyle = i < planks ? '#a9744a' : 'rgba(246,234,214,.2)'; rr(22 + i*30, 22, 24, 14, 3); ctx.fill(); if (i < planks){ ctx.fillStyle = '#6b4226'; circle(26 + i*30, 29, 1.5); circle(42 + i*30, 29, 1.5); } }
  ctx.textBaseline = 'middle'; ctx.font = '700 20px "Pixelify Sans", monospace';
  ctx.save(); ctx.translate(134, 30); ctx.fillStyle = '#3d3226'; ctx.beginPath(); ctx.ellipse(0, 0, 6, 10, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#efe2b4'; ctx.fillRect(-.8, -7, 1.6, 14); ctx.restore();
  ctx.fillStyle = '#fff6e4'; ctx.fillText(`${seeds}`, 148, 31);
  for (let i=0;i<3;i++){ ctx.fillStyle = i < lilies ? '#ffd24a' : 'rgba(246,234,214,.22)'; for (let p=0;p<5;p++){ const a = p/5*Math.PI*2; circle(232 + i*26 + Math.cos(a)*4, 30 + Math.sin(a)*4, 3.4); } }
  const px = 330, pw = 340;
  ctx.strokeStyle = 'rgba(246,234,214,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, 30); ctx.lineTo(px + pw, 30); ctx.stroke();
  ctx.fillStyle = '#8a5a32'; ctx.fillRect(px + pw + 2, 24, 12, 12);
  ctx.fillStyle = '#a9744a'; ctx.beginPath(); ctx.ellipse(px + pw*Math.min(1, dist/GOAL), 30, 5, 8, Math.PI/2, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`${time.toFixed(0)} s`, W - 24, 31); ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}
function draw(){
  ctx.save();
  if (shake > 0 && !reduceMotion) ctx.translate((Math.random() - .5)*10*shake, (Math.random() - .5)*10*shake);
  drawLand();
  for (const o of things) if (o.k === 'whirl') drawThing(o);
  for (const o of things) if (o.k !== 'whirl') drawThing(o);
  for (const s of splashes){ ctx.strokeStyle = `rgba(255,255,255,${s.life*1.4})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(s.x, s.y, 10 + (1 - s.life)*40, 4 + (1 - s.life)*14, 0, 0, 7); ctx.stroke(); }
  drawBoat();
  drawDark();
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
    ctx.fillText('Paused', W/2, H/2 - 10); ctx.font = '600 18px Nunito, sans-serif'; ctx.fillText('Press P or steer to keep rowing', W/2, H/2 + 30);
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
