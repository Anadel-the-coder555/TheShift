// The games inside the other worlds. Going through a warp hole starts one of these:
// win it and you arrive in that world, lose it and you're sent back to Thistledown.
//   Golden Jungle: Vine Swing       (hold to grab a vine, let go to fly to the next one)
//   Starry Nebula: Hoverboard        (glide smoothly up and down across the stars)
//   Moonlit Lake:  Moonlight Tennis  (a match against Luna, the owl who lives by the lake)
// and some you can play once you're inside a world:
//   Moonlit Lake:  Moonlight Slalom  (ski down the mountain, from the ski hut at the end of the shore)
//                  Shadow Tales      (campfire stories told in shadow puppets, at the campfire on the shore)
//   Neon City:     Neon Grand Prix   (a hover-car race, from the garage on the main street)
//                  Rainbow Tide      (surf the wave of rainbow electricity, from the surf shack at the end of the walkway)
//   Starry Nebula: Ride the Star Whale, and the Cosmic Carnival (rides with alien missions)
//   Golden Jungle: Temple of the Golden Acorn (a boulder chase), and Jungle Animal Rescue
// and the games that open the newer worlds (from their sealed portals in the Portal HQ):
//   Coral Sea: Coral Dive (and, inside the coral palace, The Moon Pearl: a mermaid quest)
//   Enchanted Kingdom: The Wizard's Tower   Dusty Gulch: Sheriff's Target Practice
//   Dusty Gulch also has Pepper & the Pie Bandits (ride Pepper the pony after the Raccoon Gang)
//   …and The Ghosts of the Gilded Spur (a ghost-hotel mystery) and The Perils of Pepper (a silent picture)
//   Underground: Mine Cart Mayhem   Topsy-Turvy Land: Gravity Flip   Harmony Hollow: The Painted Melody
//   THE WARP (behind the stone door in the well): Warp Tunnel
// and more games inside the worlds, so every world has four:
//   Golden Jungle: Sloth's Lullaby   Starry Nebula: Constellations   Neon City: Neon Circuit
//   Coral Sea: Octopus Juggle, Turtle Taxi   Underground: Mole Tunnels, Mushroom Bounce, Glowfish Fishing
//   Topsy-Turvy Land: Topsy Maze, Upside-Down Pancakes, Backwards Dash
//   Harmony Hollow: Color Mixer, Harp Up or Down, The Music Box   THE WARP: Time Freeze, Mirror Match, Door Hopper
(() => {
const W = 800, H = 480;
const cv = document.getElementById('wgCanvas'), ctx = cv.getContext('2d');
const screenEl = document.getElementById('worldGameScreen');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function fit(){ const dpr = Math.min(window.devicePixelRatio||1, 2); cv.width = W*dpr; cv.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
fit(); addEventListener('resize', fit);
const isActive = () => screenEl.classList.contains('active');
const el = id => document.getElementById(id);

function rng(seed){ return () => { seed = (seed*16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function hash(n){ const s = Math.sin(n*127.1 + 17.3)*43758.5453; return s - Math.floor(s); }
function wrap(v, m){ return ((v % m) + m) % m; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function circle(x, y, r){ ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function rr(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function heart(x, y, on){ ctx.fillStyle = on ? '#e0464f' : 'rgba(246,234,214,.25)'; ctx.beginPath(); ctx.moveTo(x, y+9); ctx.bezierCurveTo(x-14,y,x-10,y-10,x,y-4); ctx.bezierCurveTo(x+10,y-10,x+14,y,x,y+9); ctx.fill(); }
function hudBar(){ ctx.fillStyle = 'rgba(20,14,30,.6)'; rr(10, 10, W - 20, 40, 10); ctx.fill(); ctx.textBaseline = 'middle'; ctx.font = '700 20px "Pixelify Sans", monospace'; }
function progress(k, col){ const px = 330, pw = 340; ctx.strokeStyle = 'rgba(246,234,214,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, 30); ctx.lineTo(px + pw, 30); ctx.stroke(); ctx.fillStyle = col; circle(px + pw*clamp(k, 0, 1), 30, 7); }

// ---------- shared input ----------
const input = { action:false, up:false, down:false, left:false, right:false, pressed:false, click:null, keys:[], taps:[] };
const KEYS = { arrowleft:'left', a:'left', arrowright:'right', d:'right', arrowup:'up', w:'up', arrowdown:'down', s:'down', ' ':'action' };
addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'e' && hole && state === 'play' && isActive()){ e.preventDefault(); enterHole(); return; }
  if (!isActive()) return;
  const k = e.key.toLowerCase();
  if (KEYS[k]){ e.preventDefault(); if (!input[KEYS[k]] && KEYS[k] === 'action') input.pressed = true; if (!e.repeat) input.taps.push(KEYS[k]); input[KEYS[k]] = true; if (state === 'paused') state = 'play'; }
  if (k === 'p'){ if (state === 'play') state = 'paused'; else if (state === 'paused') state = 'play'; }
  if (k === 'enter' && state === 'title') begin();
  if (/^[0-9]$/.test(k) && state === 'play') input.keys.push(k);
});
addEventListener('keyup', e => { const k = KEYS[e.key.toLowerCase()]; if (k) input[k] = false; });
addEventListener('blur', () => { for (const k in input) input[k] = false; if (state === 'play' && isActive()) state = 'paused'; });
cv.addEventListener('pointerdown', e => { e.preventDefault();
  if (hole && state === 'play'){ const r = cv.getBoundingClientRect(), hx = (e.clientX - r.left)/r.width*W, hy = (e.clientY - r.top)/r.height*H; if (Math.hypot(hx - HOLE.x, hy - HOLE.y) < HOLE.r + 14){ enterHole(); return; } }
  if (state === 'paused') state = 'play'; input.action = true;
  const r = cv.getBoundingClientRect(); input.click = { x:(e.clientX - r.left)/r.width*W, y:(e.clientY - r.top)/r.height*H };
  if (!G || !G.clicks) input.pressed = true; });
addEventListener('pointerup', () => { input.action = false; });
// where the mouse is over the canvas, for games you aim with the pointer
cv.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); input.aim = { x:(e.clientX - r.left)/r.width*W, y:(e.clientY - r.top)/r.height*H }; });
for (const [id, key] of [['wgLeft', 'left'], ['wgRight', 'right'], ['wgUp', 'up'], ['wgDown', 'down'], ['wgAction', 'action']]){
  const b = el(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); b.classList.add('on'); if (key === 'action') input.pressed = true; input.taps.push(key); input[key] = true; if (state === 'paused') state = 'play'; });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => { b.classList.remove('on'); input[key] = false; });
  b.addEventListener('contextmenu', e => e.preventDefault());
}

// ---------- shared game flow ----------
let G = null, gid = null, from = null, state = 'title', t = 0, time = 0, pops = [], shake = 0, lastWon = false, replay = null;
// ---------- warp holes ----------
// One game in every realm (played from inside that realm) has a warp hole that opens partway through
// (Thistledown's is the cloud in the windmill balloon game). Jump in (click it or press E) and it takes you
// to the next world in line (each world's leads somewhere different; see WARP_LEADS in village.js). If you haven't
// found that world yet you play its own game, and winning it opens the world; once it's open, the hole is a shortcut.
const WARP_HOLE_GAMES = new Set(['temple', 'ski', 'race', 'sea', 'fairymemory', 'underground', 'arts', 'warp']);
let hole = null, holeAt = Infinity, holeClock = 0, holeHere = null;
const HOLE = { x:W - 104, y:146, r:46 };
function enterHole(){
  if (!hole || state !== 'play') return;
  const tg = hole.tg, here = holeHere, origin = replay; hole = null; state = 'done'; Save.addSeeds(G.seeds()); replay = null;
  if (tg.locked){
    // a world you haven't found: play its game; win and you arrive there (it's unlocked), lose and you're put
    // back exactly where you started the game that had the warp (its own "back" step does that)
    startWorldGame(tg.game, 'hq', { trip:true, label:'Continue', leave:'← Back', done:won => won ? window.warpToWorld(tg.game, 'hq') : origin ? origin.done(false) : window.warpFromGame(here) });
  } else if (window.warpFromGame) window.warpFromGame(tg.id);
}
function drawHole(){
  if (!hole) return;
  const { x, y, r } = HOLE, a = Math.min(1, hole.t*2, hole.life), col = hole.tg.col;
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x, y, 4, x, y, r*1.6); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.35, `rgba(${col},.75)`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r*1.6, 0, 7); ctx.fill();
  ctx.translate(x, y); ctx.rotate(reduceMotion ? 0 : t*3);
  for (let k = 0; k < 4; k++){ ctx.strokeStyle = `rgba(255,255,255,${.75 - k*.15})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, r - k*9, (r - k*9)*.8, 0, k, k + Math.PI*1.4); ctx.stroke(); }
  ctx.rotate(reduceMotion ? 0 : -t*3);
  // a ring that runs down as the hole is about to close
  ctx.strokeStyle = `rgb(${col})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r + 8, -Math.PI/2, -Math.PI/2 + Math.PI*2*Math.max(0, hole.life/hole.max)); ctx.stroke();
  ctx.restore(); ctx.globalAlpha = a;
  ctx.font = '700 13px "Pixelify Sans", monospace'; const l1 = hole.tg.locked ? `A warp to a new world: ${hole.tg.name}!` : `A warp to ${hole.tg.name}!`, l2 = hole.tg.locked ? 'Win its game to open it. Click or press E!' : 'Click it or press E to jump in', tw = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width) + 24;
  const bx = Math.min(W - 12 - tw, x - tw/2); ctx.fillStyle = 'rgba(20,12,36,.85)'; rr(bx, y + r + 14, tw, 40, 10); ctx.fill();
  ctx.textAlign = 'left'; ctx.fillStyle = `rgb(${col})`; ctx.fillText(l1, bx + 12, y + r + 30); ctx.fillStyle = '#fff6e4'; ctx.font = '600 12px Nunito, sans-serif'; ctx.fillText(l2, bx + 12, y + r + 47);
  ctx.globalAlpha = 1;
}
const anim = Chin.newAnim();
const WORLD_NAMES = { jungle:'the Golden Jungle', nebula:'the Starry Nebula', moonlake:'the Moonlit Lake', city:'Neon City', sea:'the Coral Sea', fantasy:'the Enchanted Kingdom', west:'Dusty Gulch', underground:'the Underground', nograv:'Topsy-Turvy Land', arts:'Harmony Hollow', warp:'THE WARP' };
const FROM_LABELS = { cafe:['← Café', 'Back to the café'], hq:['← Portal HQ', 'Back to the Portal HQ'] };
// replay = { label, done(won) } when you're playing again from inside the world, so you come back there either way
window.startWorldGame = (id, origin, again) => {
  replay = again || null;
  el('wgLeaveBtn').textContent = replay ? replay.leave : FROM_LABELS[origin] ? FROM_LABELS[origin][0] : '← Thistledown';
  gid = id; from = origin; G = GAMES[id]; state = 'title'; t = 0; pops = [];
  el('wgName').textContent = G.title; el('wgSub').textContent = G.sub;
  el('wgTitleH').textContent = G.title; el('wgTitleP').textContent = G.blurb;
  const lg = el('wgLegend'); lg.innerHTML = ''; for (const x of G.legend){ const sp = document.createElement('span'); sp.textContent = x; lg.appendChild(sp); }
  const hn = el('wgHints'); hn.innerHTML = ''; for (const x of G.hints){ const sp = document.createElement('span'); sp.textContent = x; hn.appendChild(sp); }
  el('wgTitle').hidden = false; el('wgEnd').hidden = true;
  for (const b of ['wgLeft', 'wgRight', 'wgUp', 'wgDown', 'wgAction']) el(b).hidden = !G.pad.includes(b);
  el('wgAction').textContent = G.actionLabel || 'Go';
  screenEl.dataset.game = id;   // lets the music pick this game's song
  holeHere = window.realmNow ? window.realmNow() : null;
  G.reset(); showScreen(screenEl);
};
function begin(){ hole = null; holeClock = 0; holeAt = replay && !replay.trip && holeHere && WARP_HOLE_GAMES.has(gid) && window.warpNext && window.warpNext(holeHere) ? 14 + Math.random()*16 : Infinity;
  G.reset(); state = 'play'; time = 0; pops = []; input.pressed = false; input.click = null; input.keys.length = 0; input.taps.length = 0; el('wgTitle').hidden = true; }
function finish(won){
  if (state === 'done') return;
  state = 'done'; lastWon = won;
  Save.addSeeds(G.seeds());
  const first = won && !Save.flag('wgWin_' + gid);
  if (first){ Save.setFlag('wgWin_' + gid); Save.addSeeds(30); }
  el('wgEndH').textContent = won ? G.winTitle : G.loseTitle;
  el('wgEndP').textContent = replay ? (won ? G.againWinText || G.winText : G.againLoseText || G.loseText) : won ? G.winText : G.loseText;
  const special = G.end && G.end(); if (special){ el('wgEndH').textContent = special.title; el('wgEndP').textContent = special.text; }
  el('wgEndStats').innerHTML = G.stats() + `<span>Wallet ${Save.seeds()}</span>` + (first ? '<span>First win! +30 seeds</span>' : '');
  el('wgContinue').textContent = replay ? replay.label : won ? `Enter ${WORLD_NAMES[gid]}` : FROM_LABELS[from] ? FROM_LABELS[from][1] : 'Back to Thistledown';
  el('wgEnd').hidden = false; el('wgContinue').focus();
}
el('wgStart').onclick = begin;
el('wgContinue').onclick = () => { if (replay) replay.done(lastWon); else if (lastWon) warpToWorld(gid, from); else returnToThistledown(from, gid); };
// leaving partway counts as not finishing
el('wgLeaveBtn').onclick = () => { state = 'done'; if (replay) replay.done(false); else returnToThistledown(from, gid); };
function pop(x, y, txt, col){ pops.push({ x, y, txt, col: col || '#fff6e4', life:1.1 }); }
function drawPops(camX){
  ctx.font = '700 17px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
  for (const p of pops){ ctx.globalAlpha = Math.max(0, p.life); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(30,20,40,.75)'; ctx.strokeText(p.txt, p.x - camX, p.y); ctx.fillStyle = p.col; ctx.fillText(p.txt, p.x - camX, p.y); }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}

// ================= Golden Jungle: Vine Swing =================
const VINES = (() => {
  const GRAV = 900, FEET = 70, SWAMP = 446, END_X = 3700, END_Y = 330;
  let vines, fruit, p, hearts, got, camX, cp, landedT, splashT;
  function build(){
    const r = rng(31); vines = []; fruit = [];
    let x = 170;
    while (x < END_X - 150){ vines.push({ x, y:34, len:170 + r()*60, ph:r()*6 }); x += 215 + r()*80; }
    vines.forEach((v, i) => { const nx = vines[i + 1] ? vines[i + 1].x : END_X; if (r() < .75) fruit.push({ x:(v.x + nx)/2 + (r() - .5)*30, y:210 + r()*90, got:false }); });
  }
  function hangOn(i){ const v = vines[i]; p = { x:v.x, y:v.y + v.len, vx:0, vy:0, att:i, th:-.85, w:0, L:v.len, hold:true, lastRel:-1, relT:0, onEnd:false }; cp = i; }
  return {
    title:'Vine Swing', sub:'Swing through the Golden Jungle to find the way in.',
    blurb:'The warp dropped you high in the jungle canopy, hanging from a vine! Swing from vine to vine over the swamp and reach the great tree on the other side.',
    legend:['Hold Space, ↑ or the mouse to hold on / grab a vine', 'Let go at the top of a swing to fly', 'Don’t fall in the swamp (3 hearts)', 'Grab the golden sun fruit'],
    hints:['Hold Space to grab, let go to fly', 'P to pause'], pad:['wgAction'], actionLabel:'Hold to grab',
    winTitle:'You made it across!', winText:'You land on the great tree’s branch, and the Golden Jungle opens up in front of you.',
    loseTitle:'Splash!', loseText:'Too many dips in the swamp. The warp fizzles out and you tumble back to Thistledown.',
    reset(){ build(); hearts = 3; got = 0; camX = 0; landedT = 0; splashT = 0; hangOn(0); },
    seeds:() => got, stats:() => `<span>Sun fruit ${got}</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      if (input.pressed){ p.hold = false; input.pressed = false; }
      const holding = p.hold || input.action;
      if (splashT > 0){ splashT -= dt; if (splashT <= 0){ if (hearts <= 0) finish(false); else hangOn(cp); } return; }
      if (landedT > 0){ landedT += dt; if (landedT > 1.2) finish(true); return; }
      if (p.att !== null){
        const v = vines[p.att];
        p.w += -(GRAV/p.L)*Math.sin(p.th)*dt;
        if (p.w > 0) p.w += .8*dt;             // a little help: forward swings build up by themselves
        p.w *= Math.pow(.96, dt);
        p.th += p.w*dt;
        if (Math.abs(p.th) > 1.35){ p.th = Math.sign(p.th)*1.35; p.w *= -.3; }
        p.x = v.x + p.L*Math.sin(p.th); p.y = v.y + p.L*Math.cos(p.th);
        if (!holding){ p.vx = p.L*p.w*Math.cos(p.th); p.vy = -p.L*p.w*Math.sin(p.th); p.lastRel = p.att; p.relT = .3; p.att = null; }
      } else {
        p.vy += GRAV*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.relT -= dt;
        if (holding){
          vines.forEach((v, i) => {
            if (p.att !== null || (i === p.lastRel && p.relT > 0)) return;
            const d = Math.hypot(p.x - v.x, p.y - v.y);
            if (p.y > v.y + 50 && d <= v.len + 16){
              p.att = i; p.L = clamp(d, 70, v.len); p.th = Math.atan2(p.x - v.x, p.y - v.y);
              p.w = (p.vx*Math.cos(p.th) - p.vy*Math.sin(p.th))/p.L; cp = i;
            }
          });
        }
        if (p.x > END_X - 20 && p.y + FEET >= END_Y && p.y + FEET - p.vy*dt <= END_Y + 8 && p.vy > 0){ p.y = END_Y - FEET; landedT = .01; anim.happy = 4; }
        else if (p.y + FEET > SWAMP){ hearts--; shake = .35; splashT = 1; pop(p.x, SWAMP - 60, 'Splash!', '#bfe3ef'); }
      }
      for (const f of fruit) if (!f.got && Math.hypot(f.x - p.x, f.y - (p.y + 30)) < 34){ f.got = true; got++; anim.chew = .5; pop(f.x, f.y - 20, '+1', '#ffe066'); }
      camX += (clamp(p.x - 280, 0, END_X + 400 - W) - camX)*Math.min(1, dt*5);
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f6e7a8'); g.addColorStop(.6, '#f0c56a'); g.addColorStop(1, '#c99a4a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const sg = ctx.createRadialGradient(560 - camX*.03, 170, 10, 560 - camX*.03, 170, 160); sg.addColorStop(0, 'rgba(255,250,220,.9)'); sg.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(170,150,80,.6)'; ctx.beginPath(); ctx.moveTo(0, H); for (let x=0;x<=W;x+=10){ const wx = x + camX*.15; ctx.lineTo(x, 330 - Math.sin(wx*.005)*30 - Math.sin(wx*.013)*12); } ctx.lineTo(W, H); ctx.fill();
      // big trees behind
      for (let i = Math.floor(camX*.5/300) - 1; i*300 - camX*.5 < W + 300; i++){ const x = i*300 - camX*.5 + hash(i)*90;
        ctx.fillStyle = '#7a6a36'; ctx.fillRect(x - 18, 60, 36, H); ctx.fillStyle = 'rgba(90,110,40,.8)'; circle(x, 70, 80); circle(x - 60, 100, 50); circle(x + 60, 96, 54); }
      // the swamp
      ctx.fillStyle = '#4a5a2a'; ctx.fillRect(0, SWAMP, W, H - SWAMP);
      ctx.strokeStyle = 'rgba(200,220,150,.3)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=0;i<14;i++){ const x = wrap(i*80 - camX + t*10, W + 80) - 40, y = SWAMP + 8 + (i % 3)*9; ctx.moveTo(x, y); ctx.lineTo(x + 20, y); } ctx.stroke();
      for (let i = Math.floor(camX/420) - 1; i*420 - camX < W + 420; i++){ const x = i*420 - camX + hash(i + 3)*200; ctx.fillStyle = '#3a5a2a'; ctx.beginPath(); ctx.ellipse(x, SWAMP + 14, 16, 5, 0, 0, 7); ctx.fill();
        if (hash(i + 8) > .5){ const ex = x + 60; ctx.fillStyle = '#4f6a2a'; ctx.beginPath(); ctx.ellipse(ex, SWAMP + 4, 14, 5, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#f2e27a'; circle(ex - 5, SWAMP, 2.4); circle(ex + 5, SWAMP, 2.4); ctx.fillStyle = '#1e1a16'; circle(ex - 5, SWAMP, 1); circle(ex + 5, SWAMP, 1); } }
      // the great tree at the far side
      { const x = END_X - camX; if (x < W + 60){ ctx.fillStyle = '#6b5a2a'; ctx.fillRect(x + 150, 0, 120, H); ctx.fillStyle = '#7a6a36'; rr(x - 30, END_Y, 300, 26, 12); ctx.fill(); ctx.fillStyle = '#6f8a36'; ctx.fillRect(x - 30, END_Y - 4, 300, 8);
        ctx.fillStyle = '#4a3020'; rr(x + 20, END_Y - 70, 120, 30, 6); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Golden Jungle →', x + 80, END_Y - 55); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; } }
      // the canopy the vines hang from
      for (let i = Math.floor(camX/60) - 1; i*60 - camX < W + 60; i++){ const x = i*60 - camX; ctx.fillStyle = i % 2 ? '#4f6a26' : '#5f7a2e'; circle(x, 14 + hash(i)*14, 44); }
      // vines
      vines.forEach((v, i) => {
        const x = v.x - camX; if (x < -260 || x > W + 260) return;
        let ex, ey;
        if (p.att === i){ ex = p.x - camX; ey = p.y; }
        else { const sw = reduceMotion ? 0 : Math.sin(t*1.2 + v.ph)*.08; ex = x + Math.sin(sw)*v.len; ey = v.y + Math.cos(sw)*v.len; }
        ctx.strokeStyle = '#4f7a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, v.y); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.fillStyle = '#6f9a3a'; for (let l=1;l<6;l++){ const k = l/6; ctx.beginPath(); ctx.ellipse(x + (ex - x)*k + (l % 2 ? 5 : -5), v.y + (ey - v.y)*k, 6, 3, l % 2 ? .6 : -.6, 0, 7); ctx.fill(); }
      });
      // sun fruit
      for (const f of fruit){ if (f.got) continue; const x = f.x - camX, y = f.y + Math.sin(t*2 + f.x)*4; if (x < -30 || x > W + 30) continue;
        const fg = ctx.createRadialGradient(x, y, 2, x, y, 22); fg.addColorStop(0, 'rgba(255,220,100,.7)'); fg.addColorStop(1, 'rgba(255,220,100,0)'); ctx.fillStyle = fg; circle(x, y, 22);
        ctx.fillStyle = '#f2a03a'; circle(x, y, 9); ctx.fillStyle = '#ffd24a'; circle(x - 2, y - 2, 5); ctx.fillStyle = '#4f7a2a'; ctx.beginPath(); ctx.ellipse(x + 3, y - 10, 5, 2.5, -.5, 0, 7); ctx.fill(); }
      // the chinchilla, hanging on (or flying)
      if (splashT <= 0){
        const tilt = p.att !== null ? -p.th*.9 : clamp(p.vx/900, -.4, .4);
        ctx.save(); ctx.translate(p.x - camX, p.y); ctx.rotate(tilt);
        Chin.draw(ctx, 'me', anim, 0, FEET, { scale:.09, face:1, grounded:landedT > 0, speed:0 });
        ctx.restore();
      } else { ctx.strokeStyle = `rgba(220,240,200,${splashT})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(p.x - camX, SWAMP + 4, 20 + (1 - splashT)*50, 6 + (1 - splashT)*10, 0, 0, 7); ctx.stroke(); }
      drawPops(camX);
    },
    hud(){
      hudBar(); for (let i=0;i<3;i++) heart(30 + i*28, 30, i < hearts);
      ctx.fillStyle = '#f2a03a'; circle(134, 30, 8); ctx.fillStyle = '#fff6e4'; ctx.fillText(`${got}`, 148, 31);
      progress((p.x - vines[0].x)/(END_X - vines[0].x), '#f2a03a');
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`${time.toFixed(0)} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ if (p.att !== null){ const v = vines[p.att]; p.w += -(GRAV/p.L)*Math.sin(p.th)*dt; p.th += p.w*dt; p.x = v.x + p.L*Math.sin(p.th); p.y = v.y + p.L*Math.cos(p.th); } },
  };
})();

// ================= Starry Nebula: Hoverboard =================
const HOVER = (() => {
  const GOAL = 9000, PX = 190;
  let things, y, vy, dist, speed, shields, dust, inv, won, winT, trail;
  function build(){
    const r = rng(505); things = [];
    for (let x = 700; x < GOAL - 300; x += 170 + r()*170){
      const k = r(), late = x/GOAL;
      if (k < .28){ const y0 = 100 + r()*300, amp = (r() - .5)*120; for (let i=0;i<5;i++) things.push({ k:'dust', x:x + i*36, y:y0 + Math.sin(i/4*Math.PI)*amp, r:10 }); }
      else if (k < .6){ const n = r() < late ? 2 : 1; for (let i=0;i<n;i++) things.push({ k:'rock', x:x + i*60, y:90 + r()*330, r:16 + r()*18, rot:r()*6, spin:(r() - .5)*2 }); }
      else if (k < .72 + late*.1){ things.push({ k:'comet', x:x + 400, y:80 + r()*320, vy:(r() - .5)*80, r:12 }); }
      else things.push({ k:'ring', x, y:110 + r()*290, r:34 });
    }
  }
  return {
    title:'Hoverboard', sub:'Glide across the Starry Nebula.',
    blurb:'The warp spat you out onto a hoverboard in the middle of space! Glide across the nebula to the glowing Nebula Gate. The board stays right where you steer it.',
    legend:['↑ ↓ to glide up and down', '→ to go faster, ← to slow down', 'Dodge asteroids and comets (3 shields)', 'Zoom through rings for a boost', 'Collect stardust'],
    hints:['↑ ↓ to steer, → faster, ← slower', 'P to pause'], pad:['wgUp', 'wgDown', 'wgLeft', 'wgRight'],
    winTitle:'Through the Nebula Gate!', winText:'You zoom through the glowing gate, and the Starry Nebula spreads out all around you.',
    againWinText:'You zip through the Nebula Gate again. The starlings cheer you on!', againLoseText:'One bump too many. You glide back down to the launch pad for another try.',
    loseTitle:'Wipeout!', loseText:'One bump too many and your board sputters out. The warp gently carries you back to Thistledown.',
    reset(){ build(); y = 250; vy = 0; dist = 0; speed = 230; shields = 3; dust = 0; inv = 0; won = false; winT = 0; trail = []; },
    seeds:() => Math.floor(dust/2), stats:() => `<span>Stardust ${dust}</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      if (won){ winT += dt; dist += speed*dt; if (winT > 1.3) finish(true); return; }
      // smooth, floaty steering: no gravity, the board just drifts to a stop
      const dir = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      vy += dir*1300*dt; vy *= Math.pow(.04, dt); vy = clamp(vy, -300, 300);
      y = clamp(y + vy*dt, 80, 440);
      const want = input.right ? 340 : input.left ? 150 : 230;
      speed += (want - speed)*Math.min(1, dt*2);
      dist += speed*dt; inv = Math.max(0, inv - dt);
      for (const o of things){
        if (o.k === 'comet') { o.x -= 180*dt; o.y += o.vy*dt; }
        if (o.k === 'rock') o.rot += o.spin*dt;
        if (o.got) continue;
        const sx = o.x - dist; if (sx < PX - 80 || sx > PX + 80) continue;
        const d = Math.hypot(sx - PX, o.y - (y - 30));
        if (o.k === 'dust' && d < o.r + 30){ o.got = true; dust++; anim.chew = .3; }
        else if (o.k === 'ring' && Math.abs(sx - PX) < 12 && Math.abs(o.y - (y - 30)) < o.r){ o.got = true; speed = 480; dust += 2; pop(o.x, o.y - 40, 'Boost!', '#bfe3ff'); }
        else if ((o.k === 'rock' || o.k === 'comet') && d < o.r + 24 && inv <= 0){ shields--; inv = 1.4; shake = .35; vy = (y > o.y ? 1 : -1)*260; pop(PX + dist, y - 90, 'Bonk!', '#ffd0d3'); if (shields <= 0) finish(false); }
      }
      trail.push({ x:dist + PX - 30, y:y + 4, life:.6 }); trail.forEach(q => q.life -= dt); trail = trail.filter(q => q.life > 0);
      if (dist >= GOAL){ won = true; winT = 0; anim.happy = 4; }
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0e0a24'); g.addColorStop(.6, '#2a1850'); g.addColorStop(1, '#44285e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const [cx, cy, r, c] of [[200, 140, 180, '224,138,200'], [600, 300, 200, '138,106,224'], [1000, 120, 170, '100,180,220'], [1400, 330, 190, '224,138,200']]){
        const x = wrap(cx - dist*.05, 1600) - 300, ng = ctx.createRadialGradient(x, cy, 10, x, cy, r); ng.addColorStop(0, `rgba(${c},.3)`); ng.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = ng; circle(x, cy, r); }
      // stars stream past faster the quicker you go
      ctx.strokeStyle = 'rgba(255,250,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i=0;i<70;i++){ const par = .2 + hash(i)*.8, x = wrap(hash(i + 3)*W*2 - dist*par, W + 20) - 10, yy = hash(i + 7)*H, len = 1 + speed*par*.02; ctx.moveTo(x, yy); ctx.lineTo(x + len, yy); }
      ctx.stroke();
      { const x = wrap(700 - dist*.08, 1800) - 200; ctx.fillStyle = '#e8a07a'; circle(x, 90, 36); ctx.strokeStyle = 'rgba(240,210,240,.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, 90, 64, 13, -.25, 0, 7); ctx.stroke(); }
      // the Nebula Gate at the finish
      { const x = GOAL + PX - dist; if (x < W + 120){ ctx.save(); ctx.translate(x, 250); ctx.rotate(reduceMotion ? 0 : t*.6);
        for (let i=0;i<4;i++){ ctx.strokeStyle = `rgba(200,160,255,${.8 - i*.15})`; ctx.lineWidth = 8 - i*1.5; ctx.beginPath(); ctx.ellipse(0, 0, 60 + i*14, 170 + i*14, 0, 0, 7); ctx.stroke(); }
        ctx.restore(); } }
      for (const q of trail){ ctx.fillStyle = `rgba(150,220,255,${q.life})`; circle(q.x - dist, q.y, 3*q.life + 1); }
      for (const o of things){
        if (o.got) continue; const x = o.x - dist; if (x < -60 || x > W + 60) continue;
        if (o.k === 'dust'){ const sg = ctx.createRadialGradient(x, o.y, 1, x, o.y, 14); sg.addColorStop(0, 'rgba(255,245,200,.9)'); sg.addColorStop(1, 'rgba(255,245,200,0)'); ctx.fillStyle = sg; circle(x, o.y, 14); ctx.fillStyle = '#fff6c8'; circle(x, o.y, 3.5); }
        else if (o.k === 'ring'){ ctx.strokeStyle = 'rgba(150,220,255,.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x, o.y, 10, o.r, 0, 0, 7); ctx.stroke(); ctx.strokeStyle = 'rgba(150,220,255,.3)'; ctx.lineWidth = 12; ctx.stroke(); }
        else if (o.k === 'rock'){ ctx.save(); ctx.translate(x, o.y); ctx.rotate(o.rot); ctx.fillStyle = '#5a4a6a'; ctx.beginPath(); for (let a=0;a<8;a++){ const rr2 = o.r*(.8 + hash(a + o.r)*.3); ctx.lineTo(Math.cos(a/8*Math.PI*2)*rr2, Math.sin(a/8*Math.PI*2)*rr2); } ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7a6a8a'; circle(-o.r*.3, -o.r*.3, o.r*.3); ctx.fillStyle = '#44385a'; circle(o.r*.3, o.r*.2, o.r*.2); ctx.restore(); }
        else if (o.k === 'comet'){ const cg = ctx.createLinearGradient(x, o.y, x + 90, o.y); cg.addColorStop(0, 'rgba(255,200,150,.8)'); cg.addColorStop(1, 'rgba(255,200,150,0)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(x, o.y - o.r); ctx.lineTo(x + 90, o.y); ctx.lineTo(x, o.y + o.r); ctx.fill(); ctx.fillStyle = '#ffe0b0'; circle(x, o.y, o.r); }
      }
      // the chinchilla on its hoverboard
      if (!(inv > 0 && Math.floor(inv*12) % 2 === 0)){
        const tilt = clamp(vy/1400, -.25, .25);
        ctx.save(); ctx.translate(PX, y); ctx.rotate(tilt);
        const bg = ctx.createRadialGradient(0, 12, 2, 0, 12, 50); bg.addColorStop(0, 'rgba(150,220,255,.55)'); bg.addColorStop(1, 'rgba(150,220,255,0)'); ctx.fillStyle = bg; circle(0, 12, 50);
        ctx.fillStyle = '#b58ae6'; rr(-40, 0, 80, 10, 5); ctx.fill(); ctx.fillStyle = '#e8d0ff'; ctx.fillRect(-34, 2, 68, 2);
        ctx.fillStyle = `rgba(150,220,255,${.6 + Math.random()*.3})`; ctx.beginPath(); ctx.moveTo(-40, 3); ctx.lineTo(-58 - speed*.05, 5); ctx.lineTo(-40, 8); ctx.fill();
        Chin.draw(ctx, 'me', anim, 0, 2, { scale:.085, face:1, grounded:true, speed:0 });
        ctx.restore();
      }
      drawPops(dist);
    },
    hud(){
      hudBar();
      for (let i=0;i<3;i++){ ctx.strokeStyle = i < shields ? '#96dcff' : 'rgba(246,234,214,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(30 + i*28, 30, 9, 0, 7); ctx.stroke(); }
      ctx.fillStyle = '#fff6c8'; circle(134, 30, 5); ctx.fillStyle = '#fff6e4'; ctx.fillText(`${dust}`, 148, 31);
      progress(dist/GOAL, '#b58ae6');
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`${time.toFixed(0)} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ y = 250 + Math.sin(t*1.4)*12; dist += 60*dt; },
  };
})();

// ================= Moonlit Lake: Moonlight Tennis =================
const LUNA = new Image(); LUNA.src = 'characters/luna.png';

// Luna from characters/luna.png, flipped so she looks left toward the chinchilla.
// She blinks now and then and holds her racket in the wing that peeks out of her cape.
// (u, v) are spots on the picture from 0 to 1, before flipping.
const LUNA_EYES = [{ u:.624, v:.31, rx:.052, ry:.055 }, { u:.793, v:.28, rx:.036, ry:.05 }];
function drawLunaPic(g, img, x, base, h, time, swing, bouncing){
  const w = h*454/400, at = (u, v) => [x + w/2 - u*w, base - h + v*h];
  g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(x, base, w*.4, 6, 0, 0, 7); g.fill();
  if (!img.complete || !img.naturalWidth) return;
  g.save(); g.translate(x, base); g.scale(-1, 1); g.drawImage(img, -w/2, -h, w, h); g.restore();
  // a blink every few seconds
  if (time % 3.7 < .13 || (time % 11.3 > 5 && time % 11.3 < 5.12)){
    for (const e of LUNA_EYES){ const [ex, ey] = at(e.u, e.v);
      g.fillStyle = '#ead6b8'; g.beginPath(); g.ellipse(ex, ey, e.rx*w + 2, e.ry*h + 2, 0, 0, 7); g.fill();
      g.strokeStyle = '#3a2616'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(ex - e.rx*w, ey + 2); g.quadraticCurveTo(ex, ey + e.ry*h*.7, ex + e.rx*w, ey + 2); g.stroke(); }
  }
  // the racket, gripped by her wing tip; it swings forward toward the net
  const [hx, hy] = at(.9, .74);
  g.save(); g.translate(hx, hy); g.rotate(-.5 - swing*1.7);
  g.fillStyle = '#6b4a2b'; g.fillRect(-2.5, -26, 5, 28);
  g.strokeStyle = '#d0452f'; g.lineWidth = 3.5; g.beginPath(); g.ellipse(0, -44, 13, 18, 0, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.beginPath(); for (let i=-9;i<=9;i+=4.5){ g.moveTo(i, -60); g.lineTo(i, -28); } for (let j=-58;j<=-30;j+=6){ g.moveTo(-11, j); g.lineTo(11, j); } g.stroke();
  g.fillStyle = '#9a7250'; g.strokeStyle = '#3a2616'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -6, 8, 11, 0, 0, 7); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(58,38,22,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-4, -12); g.lineTo(-3, 0); g.moveTo(2, -13); g.lineTo(3, -1); g.stroke();
  // waiting for a game: a ball bouncing on the strings
  if (bouncing){ g.fillStyle = '#d8f06a'; g.beginPath(); g.arc(0, -66 - Math.abs(Math.sin(time*3))*26, 5, 0, 7); g.fill(); }
  g.restore();
}
const TENNIS = (() => {
  const COURT = 420, NET_X = 400, NET_TOP = 356, G_B = 900, TO_WIN = 5;
  let me, owl, ball, score, server, serveT, rally, msgT, msg, over;
  const reach = (who, b) => Math.abs(b.x - (who.x + (who.side < 0 ? 26 : -26))) < 52 && b.y > COURT - 170 && b.y < COURT - 4;
  function newPoint(){
    ball = { x:0, y:0, vx:0, vy:0, bounces:0, side:0, last:0, live:false, held:true };
    me.x = 150; owl.x = 650; rally = 0; serveT = server === 1 ? 1.1 : 0;
  }
  function side(x){ return x < NET_X ? -1 : 1; }
  // every shot aims for a spot in the other court; hard shots are low and deep, lobs are high
  function hit(who, kind, miss){
    let vy = kind === 'hard' ? -340 : kind === 'lob' ? -640 : -440;
    vy += (Math.random() - .5)*40;
    const deep = kind === 'normal' ? .45 + Math.random()*.35 : .7 + Math.random()*.25;
    let tx;
    if (who.side < 0) tx = NET_X + 60 + deep*(W - 190 - NET_X);   // deep, but still somewhere Luna can reach
    else {
      // Luna aims away from you, so you have to run for it
      const shortSpot = NET_X - 70 - Math.random()*50, longSpot = 90 + Math.random()*60;
      tx = Math.abs(me.x - shortSpot) > Math.abs(me.x - longSpot) ? shortSpot : longSpot;
      if (Math.random() < .3) tx = 140 + Math.random()*(NET_X - 200);
    }
    if (miss) tx += (who.side < 0 ? 1 : -1)*(200 + Math.random()*120);   // Luna sometimes hits it long
    // lift the shot until it clears the net
    let T, vx;
    for (let k=0;k<12;k++){
      T = (-vy + Math.sqrt(vy*vy + 2*G_B*(COURT - ball.y)))/G_B; vx = (tx - ball.x)/T;
      const tn = (NET_X - ball.x)/vx;
      if (tn <= 0 || ball.y + vy*tn + .5*G_B*tn*tn < NET_TOP - 18) break;
      vy -= 45;
    }
    ball.vx = vx; ball.vy = vy; ball.bounces = 0; ball.last = who.side; ball.live = true; ball.held = false; ball.whiffed = false;
    who.swing = .25; rally++;
  }
  function point(to, why){
    if (over) return;
    if (to < 0) score[0]++; else score[1]++;
    msg = why; msgT = 1.4; ball.live = false;
    pop(to < 0 ? 200 : 600, 150, to < 0 ? 'Your point!' : 'Luna’s point', to < 0 ? '#ffe066' : '#ffd0d3');
    const [a, b] = score;
    if ((a >= TO_WIN || b >= TO_WIN) && Math.abs(a - b) >= 2){ over = true; const match = G; setTimeout(() => { if (G === match && state === 'play') finish(a > b); }, 1300); return; }
    server = -server;
  }
  return {
    title:'Moonlight Tennis', sub:'A match by the lake against Luna the owl.',
    blurb:'Luna the owl has been waiting by the lake with two rackets. Win the match under the moon and she’ll show you around the Moonlit Lake!',
    legend:['← → to run', 'Space to swing (or serve)', 'Hold → while swinging for a hard shot, ← for a lob', 'Let it bounce once at most', 'First to 5 points, win by 2'],
    hints:['← → run, Space swing', 'Hold → for a hard shot, ← for a lob', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgAction'], actionLabel:'Swing',
    winTitle:'You win the match!', winText:'Luna hoots and flaps her wings in delight. “Well played! Come, let me show you the lake.”',
    againWinText:'Luna hoots and flaps her wings. \u201cWell played! Rematch anytime.\u201d', againLoseText:'\u201cHoo hoo! Good game,\u201d says Luna. \u201cCome back and play again soon!\u201d',
    loseTitle:'Luna wins this one', loseText:'“Hoo hoo! Good game,” says Luna. The warp fades, and you find yourself back in Thistledown.',
    reset(){ me = { x:150, vx:0, side:-1, swing:0, cool:0 }; owl = { x:650, vx:0, side:1, swing:0, think:0, aim:650 }; score = [0, 0]; server = -1; msgT = 0; msg = ''; over = false; newPoint(); },
    seeds:() => score[0]*2, stats:() => `<span>You ${score[0]} – ${score[1]} Luna</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      // you
      const mv = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      me.vx += (mv*330 - me.vx)*Math.min(1, dt*12); me.x = clamp(me.x + me.vx*dt, 40, NET_X - 40);
      me.swing = Math.max(0, me.swing - dt); owl.swing = Math.max(0, owl.swing - dt); me.cool = Math.max(0, me.cool - dt);
      if (input.pressed){
        input.pressed = false;
        if (ball.held && server === -1 && msgT <= 0){ ball.x = me.x + 20; ball.y = COURT - 110; hit(me, 'normal'); }
        else if (!ball.held && me.cool <= 0){
          if (ball.live && reach(me, ball) && (ball.side <= 0 || ball.bounces === 0) && ball.last !== -1) hit(me, input.right ? 'hard' : input.left ? 'lob' : 'normal');
          else { me.swing = .25; me.cool = .55; }   // swung at nothing: it takes a moment to get ready again
        }
      }
      if (msgT > 0){ msgT -= dt; if (msgT <= 0 && !over) newPoint(); }
      // Luna: runs to where the ball will come down, swings when it's close, and sometimes misses
      if (ball.held && server === 1 && msgT <= 0){ serveT -= dt; if (serveT <= 0){ ball.x = owl.x - 20; ball.y = COURT - 110; hit(owl, 'normal'); } }
      let target = 650;
      if (ball.live && ball.vx > 0 && ball.last === -1){
        // where will it first bounce? stand a little past that, racket side toward the ball
        const T = (-ball.vy + Math.sqrt(Math.max(0, ball.vy*ball.vy + 2*G_B*(COURT - ball.y))))/G_B;
        target = clamp(ball.x + ball.vx*T + 70, NET_X + 50, W - 40);
      } else if (ball.live && ball.bounces >= 1 && ball.side > 0) target = clamp(ball.x + 26, NET_X + 50, W - 40);
      owl.vx += (clamp((target - owl.x)*5, -330, 330) - owl.vx)*Math.min(1, dt*7); owl.x = clamp(owl.x + owl.vx*dt, NET_X + 40, W - 40);
      if (ball.live && ball.last !== 1 && ball.side > 0 && reach(owl, ball) && owl.swing <= 0 && !ball.whiffed){
        const r = Math.random();
        if (r < .1 + rally*.008){ owl.swing = .25; ball.whiffed = true; }   // a whiff! (no second try at this one)
        else hit(owl, Math.random() < .2 ? 'lob' : Math.random() < .25 ? 'hard' : 'normal', r < .16 + rally*.01);
      }
      // the ball
      if (ball.held){ const who = server === -1 ? me : owl; ball.x = who.x + (server === -1 ? 20 : -20); ball.y = COURT - 60 + Math.sin(t*4)*4; return; }
      if (!ball.live && msgT <= 0) return;
      ball.vy += G_B*dt; const ox = ball.x; ball.x += ball.vx*dt; ball.y += ball.vy*dt;
      ball.side = side(ball.x);
      // the net
      if (ball.live && (ox - NET_X)*(ball.x - NET_X) <= 0 && ball.y > NET_TOP){ ball.x = ox; ball.vx *= -.25; point(-ball.last, 'Into the net'); }
      if (ball.y >= COURT && ball.vy > 0){
        ball.y = COURT; ball.vy *= -.7; ball.vx *= .92;
        if (ball.live){
          if (ball.x < 20 || ball.x > W - 20) point(-ball.last, 'Out!');
          else if (ball.side === ball.last) point(-ball.last, 'Bounced on your own side');
          else { ball.bounces++; if (ball.bounces >= 2) point(ball.last, 'Two bounces'); }
        }
      }
      // off the side of the screen: never bounced means it was out, otherwise the other player couldn't reach it
      if (ball.live && (ball.x < -30 || ball.x > W + 30)) point(ball.bounces === 0 ? -ball.last : ball.last, ball.bounces === 0 ? 'Out!' : 'Missed it!');
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0f2438'); g.addColorStop(.7, '#1d3e5a'); g.addColorStop(1, '#2e5a6e');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i=0;i<60;i++){ ctx.fillStyle = `rgba(255,255,240,${.3 + .6*Math.max(0, Math.sin(t*1.2 + i))})`; circle(hash(i)*W, hash(i + 50)*200, hash(i + 9)*1.3 + .4); }
      const mg = ctx.createRadialGradient(620, 90, 20, 620, 90, 120); mg.addColorStop(0, 'rgba(255,250,220,.5)'); mg.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = mg; circle(620, 90, 120); ctx.fillStyle = '#fbf3d0'; circle(620, 90, 40);
      for (const [x, h] of [[80, 150], [260, 200], [470, 170], [700, 210]]){
        ctx.fillStyle = '#0e2032'; ctx.beginPath(); ctx.moveTo(x - 160, 330); ctx.lineTo(x, 330 - h); ctx.lineTo(x + 160, 330); ctx.fill();
        ctx.fillStyle = '#c9803a'; ctx.beginPath(); ctx.moveTo(x, 330 - h); ctx.lineTo(x + 30, 330 - h*.6); ctx.lineTo(x + 8, 330 - h*.55); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.moveTo(x, 330 - h); ctx.lineTo(x - 18, 330 - h*.86); ctx.lineTo(x - 4, 330 - h*.88); ctx.lineTo(x + 10, 330 - h*.84); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#16384e'; ctx.fillRect(0, 330, W, 40);
      ctx.strokeStyle = 'rgba(251,243,208,.6)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=0;i<6;i++){ const yy = 336 + i*5, wv = Math.sin(t*2 + i)*5; ctx.moveTo(620 - 26 + i*3 + wv, yy); ctx.lineTo(620 + 26 - i*3 + wv, yy); } ctx.stroke();
      // lantern posts and fireflies watching the match
      for (const lx of [30, 770]){ const lg = ctx.createRadialGradient(lx, 280, 2, lx, 280, 70); lg.addColorStop(0, 'rgba(255,220,130,.5)'); lg.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = lg; circle(lx, 280, 70); ctx.fillStyle = '#4a3020'; ctx.fillRect(lx - 3, 280, 6, COURT - 280); ctx.fillStyle = '#ffe27a'; ctx.fillRect(lx - 7, 272, 14, 14); }
      for (let i=0;i<14;i++){ const x = 60 + hash(i)*680 + Math.sin(t*.8 + i)*20, yy = 250 + hash(i + 3)*60 + Math.sin(t*1.3 + i)*8; ctx.fillStyle = `rgba(230,255,160,${.3 + .6*Math.max(0, Math.sin(t*2 + i*2))})`; circle(x, yy, 2.2); }
      // the court
      ctx.fillStyle = '#6a4a3a'; ctx.fillRect(0, 370, W, H - 370);
      ctx.fillStyle = '#8a5a44'; ctx.beginPath(); ctx.moveTo(10, COURT); ctx.lineTo(W - 10, COURT); ctx.lineTo(W - 60, 372); ctx.lineTo(60, 372); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(20, COURT); ctx.lineTo(W - 20, COURT); ctx.moveTo(60, 372); ctx.lineTo(W - 60, 372); ctx.moveTo(20, COURT); ctx.lineTo(60, 372); ctx.moveTo(W - 20, COURT); ctx.lineTo(W - 60, 372); ctx.stroke();
      ctx.fillStyle = '#4a3a2a'; ctx.fillRect(0, COURT, W, H - COURT);
      // the net
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(NET_X - 3, NET_TOP - 4, 6, COURT - NET_TOP + 4);
      ctx.strokeStyle = 'rgba(240,240,240,.55)'; ctx.lineWidth = 1; ctx.beginPath(); for (let yy = NET_TOP; yy < COURT; yy += 8){ ctx.moveTo(NET_X - 8, yy); ctx.lineTo(NET_X + 8, yy); } ctx.stroke();
      ctx.fillStyle = '#f6ead6'; ctx.fillRect(NET_X - 9, NET_TOP - 4, 18, 5);
      // Luna, facing you across the net; she hops a little when she swings
      { const sw = owl.swing > 0 ? Math.sin((1 - owl.swing/.25)*Math.PI) : 0;
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(owl.x, COURT, 48, 6, 0, 0, 7); ctx.fill();
        drawLunaPic(ctx, LUNA, owl.x, COURT - sw*8 + 2, 112, t, sw); }
      // the chinchilla, with a racket
      { const x = me.x, sw = me.swing > 0 ? Math.sin((1 - me.swing/.25)*Math.PI) : 0;
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, COURT, 28, 5, 0, 0, 7); ctx.fill();
        Chin.draw(ctx, 'me', anim, x, COURT, { scale:.1, face:1, grounded:true, speed:Math.abs(me.vx) });
        ctx.save(); ctx.translate(x + 22, COURT - 44); ctx.rotate(.6 + sw*1.6);
        ctx.fillStyle = '#6b4a2b'; ctx.fillRect(-2, 0, 4, 24); ctx.strokeStyle = '#3f7ad0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, -14, 11, 15, 0, 0, 7); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i=-8;i<=8;i+=4){ ctx.moveTo(i, -26); ctx.lineTo(i, -2); } ctx.stroke(); ctx.restore(); }
      // the ball, glowing a little like the moon, with its shadow
      if (ball.live || ball.held || msgT > 0){
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(ball.x, COURT, 8*(1 - Math.min(.7, (COURT - ball.y)/400)), 2.5, 0, 0, 7); ctx.fill();
        const bg = ctx.createRadialGradient(ball.x, ball.y, 1, ball.x, ball.y, 16); bg.addColorStop(0, 'rgba(230,255,160,.6)'); bg.addColorStop(1, 'rgba(230,255,160,0)'); ctx.fillStyle = bg; circle(ball.x, ball.y, 16);
        ctx.fillStyle = '#d8f06a'; circle(ball.x, ball.y, 6); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(ball.x - 3, ball.y, 5, -1, 1); ctx.stroke();
      }
      if (ball.held && server === -1 && state === 'play' && msgT <= 0){ ctx.fillStyle = 'rgba(255,246,228,.9)'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('Press Space to serve', me.x + 20, COURT - 130); ctx.textAlign = 'left'; }
      if (msgT > 0 && msg){ ctx.fillStyle = 'rgba(255,246,228,.9)'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(msg, W/2, 200); ctx.textAlign = 'left'; }
      drawPops(0);
    },
    hud(){
      hudBar();
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'center';
      ctx.fillText(`You  ${score[0]}   –   ${score[1]}  Luna`, W/2, 31);
      ctx.font = '600 13px Nunito, sans-serif'; ctx.fillStyle = 'rgba(246,234,214,.75)';
      ctx.fillText(`First to ${TO_WIN}, win by 2`, W/2 + 250, 31); ctx.fillText(server === -1 ? 'Your serve' : 'Luna serves', W/2 - 250, 31);
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
})();

// ================= Moonlit Lake: the Moonlit Café =================
// Customers come to the counter with an order. Click the ingredients (or press 1-7) to make it,
// then click the customer (or press Space) to serve. Serve 8 before 3 mix-ups.
// Star beans pop up on the counter now and then; after 3 finished shifts, collecting 3 of them
// brings Glow the fox, whose order opens the warp to Neon City.
// characters drawn from pictures in the characters folder (feet = how far across the picture their feet are)
const BARISTA = new Image(); BARISTA.src = 'characters/barista.png';
const HAZEL_IMG = new Image(); HAZEL_IMG.src = 'characters/hazel.png';
const BANDIT = new Image(); BANDIT.src = 'characters/bandit.png';
const KNIGHT_RABBIT = new Image(); KNIGHT_RABBIT.src = 'characters/knight-rabbit.png';
const KNIGHT_TURTLE = new Image(); KNIGHT_TURTLE.src = 'characters/knight-turtle.png';
// draw a picture standing on (x, y): h tall, facing right (face 1) or left (-1), feet `fx` of the way across
function figure(img, x, y, h, face, fx, bottom){ if (!img.complete || !img.naturalWidth) return false; const w = h*img.naturalWidth/img.naturalHeight; ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.drawImage(img, -w*fx, -h*(bottom || 1), w, h); ctx.restore(); return true; }
const CAFE = (() => {
  const GOAL = 8, SLOTS = [230, 410, 590], COUNTER = 300;
  const FACES = ['halvyn', 'junnian', 'mia', 'bastien', 'aero', 'luna'].map(n => { const i = new Image(); i.src = `characters/${n}.png`; return { n, img:i }; });
  // Glow the fox, the special visitor who opens the way to Neon City
  const GLOW = (() => { const i = new Image(); i.src = 'characters/glow-cutout.png'; return { n:'glow', img:i }; })();
  const SAY = { cocoa:'cocoa', tea:'tea', milkshake:'a strawberry milkshake', marsh:'marshmallows', cream:'cream', berries:'berries', cookie:'a cookie', cake:'a slice of cake' };
  const sayOrder = o => { const s = SAY[o.drink] + (o.top ? ` with ${SAY[o.top]}` : '') + (o.treat ? ` and ${SAY[o.treat]}` : ''); return s[0].toUpperCase() + s.slice(1) + ', please!'; };
  const DRINKS = ['cocoa', 'tea', 'milkshake'], TOPS = ['marsh', 'cream', 'berries'], TREATS = ['cookie', 'cake'];
  const LIQUID = { cocoa:'#7a4a2a', tea:'#d09a4a', milkshake:'#e89ab0' };
  // the café's menu, painted: one strip of 180 × 180 pictures (from the Cozy Kawaii Treats sheet)
  const TREAT_PICS = new Image(); TREAT_PICS.src = 'characters/cafe-treats.png';
  const TREAT_AT = { cocoa:0, milkshake:1, tea:2, marsh:3, berries:4, cream:5, cake:6, cookie:7 }, TCELL = 180;
  const picsReady = () => TREAT_PICS.complete && TREAT_PICS.naturalWidth > 0;
  function treatPic(id, x, y, size){ ctx.drawImage(TREAT_PICS, TREAT_AT[id]*TCELL, 0, TCELL, TCELL, x - size/2, y - size/2, size, size); }
  const BUTTONS = [
    { id:'cocoa', kind:'drink', key:'1', label:'Cocoa' }, { id:'tea', kind:'drink', key:'2', label:'Tea' }, { id:'milkshake', kind:'drink', key:'3', label:'Milkshake' },
    { id:'marsh', kind:'top', key:'4', label:'Marshmallows' }, { id:'cream', kind:'top', key:'5', label:'Cream' }, { id:'berries', kind:'top', key:'6', label:'Berries' },
    { id:'cookie', kind:'treat', key:'7', label:'Cookie' }, { id:'cake', kind:'treat', key:'8', label:'Cake' },
    { id:'trash', kind:'trash', key:'0', label:'Start over' },
  ];
  BUTTONS.forEach((b, i) => { b.x = 8 + i*88; b.y = 392; b.w = 82; b.h = 76; });
  let custs, tray, served, mistakes, tips, beans, beanOn, spawnT, beanT, neon, neonDone, flashT;
  const pick = a => a[Math.floor(Math.random()*a.length)];
  function makeOrder(){
    const o = { drink:pick(DRINKS), top:null, treat:null };
    if (served >= 2 && Math.random() < .7) o.top = pick(TOPS);
    if (served >= 4 && Math.random() < .6) o.treat = pick(TREATS);
    return o;
  }
  function spawn(){
    const free = SLOTS.findIndex((_, i) => !custs[i]); if (free < 0) return;
    const face = pick(FACES.filter(f => !custs.some(c => c && c.face === f)));
    const max = Math.max(11, 20 - served*1.1);
    custs[free] = { face, order:makeOrder(), pat:max, max, x:-80, state:'walk', t:0 };
  }
  const same = (a, b) => a.drink === b.drink && a.top === b.top && a.treat === b.treat;
  function serve(i){
    const c = custs[i]; if (!c || c.state !== 'wait') return;
    if (!tray.drink){ c.say = 2.2; return; }
    if (same(c.order, tray)){
      const tip = 1 + Math.round(c.pat/c.max*2); tips += tip; c.state = 'happy'; c.t = 0; anim.happy = 2;
      pop(SLOTS[i], COUNTER - 170, c.neon ? 'Thank you…' : `+${tip} seeds`, c.neon ? '#ff9ae8' : '#ffe066');
      if (c.neon){ neonDone = true; flashT = 2.4; Save.setFlag('cityGlimpse'); pop(SLOTS[i], COUNTER - 200, 'Glow winks\u2026', '#ff9ae8'); } else served++;
    } else { mistakes++; c.state = 'sad'; c.t = 0; shake = .25; pop(SLOTS[i], COUNTER - 170, 'That’s not it…', '#ffd0d3'); }
    tray = { drink:null, top:null, treat:null };
  }
  function press(b){
    if (b.kind === 'trash'){ tray = { drink:null, top:null, treat:null }; return; }
    tray[b.kind] = tray[b.kind] === b.id ? null : b.id;
    anim.chew = .2;
  }
  // little pictures for each ingredient
  function cupIcon(x, y, k, drink, top){
    if (picsReady()){
      if (drink) treatPic(drink, x - (top ? 5*k : 0), y - 2*k, 36*k);
      if (top) treatPic(top, drink ? x + 13*k : x, drink ? y + 9*k : y, (drink ? 20 : 36)*k);
      return;
    }
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = '#f6ead6'; ctx.beginPath(); ctx.moveTo(-12, -10); ctx.lineTo(12, -10); ctx.lineTo(9, 12); ctx.lineTo(-9, 12); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#f6ead6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(13, 0, 5, -1.3, 1.3); ctx.stroke();
    ctx.fillStyle = drink ? LIQUID[drink] : 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(0, -9, 11, 3, 0, 0, 7); ctx.fill();
    if (top === 'marsh'){ ctx.fillStyle = '#fff'; for (const [dx, dy] of [[-6, -13], [0, -15], [6, -13], [-2, -11], [4, -11]]) ctx.fillRect(dx - 2.5, dy - 2.5, 5, 5); }
    if (top === 'cream'){ ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(0, -13, 11, 5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -18, 7, 4, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(1, -22, 3, 3, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function treatIcon(x, y, k, treat){
    if (picsReady()){ treatPic(treat, x, y - 2*k, 28*k); return; }
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    if (treat === 'cookie'){ ctx.fillStyle = '#c98a4b'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, 7); ctx.fill(); ctx.fillStyle = '#4a2e1a'; for (const [dx, dy] of [[-4, -3], [3, -5], [5, 3], [-3, 5], [0, 0]]){ ctx.beginPath(); ctx.arc(dx, dy, 1.8, 0, 7); ctx.fill(); } }
    else if (treat === 'cake'){ ctx.fillStyle = '#f6ead6'; ctx.beginPath(); ctx.moveTo(-12, 8); ctx.lineTo(12, 8); ctx.lineTo(12, -4); ctx.lineTo(-12, 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e79ab8'; ctx.beginPath(); ctx.moveTo(-12, 2); ctx.lineTo(12, -4); ctx.lineTo(12, -8); ctx.lineTo(-12, -2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#d0452f'; ctx.beginPath(); ctx.arc(6, -10, 3, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function orderBubble(x, y, o, neonGlow){
    const n = 1 + (o.treat ? 1 : 0), w = Math.max(96, 60 + n*30);
    ctx.fillStyle = neonGlow ? 'rgba(40,10,50,.92)' : 'rgba(255,248,236,.95)'; rr(x - w/2, y - 30, w, 52, 12); ctx.fill();
    if (neonGlow){ ctx.strokeStyle = '#ff6ad5'; ctx.lineWidth = 2; ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - 8, y + 22); ctx.lineTo(x + 8, y + 22); ctx.lineTo(x, y + 32); ctx.fill();
    cupIcon(x - (o.treat ? 18 : 0), y - 6, 1, o.drink, o.top);
    if (o.treat) treatIcon(x + 22, y - 4, 1, o.treat);
    // the order in words too, so every drink and topping is easy to tell apart
    const NAMES = { cocoa:'Cocoa', tea:'Tea', milkshake:'Milkshake', marsh:'+ marsh', cream:'+ cream', berries:'+ berries' };
    ctx.fillStyle = neonGlow ? '#ffb8ec' : '#3a2616'; ctx.font = '700 10px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
    ctx.fillText(NAMES[o.drink] + (o.top ? ' ' + NAMES[o.top] : ''), x, y + 16); ctx.textAlign = 'left';
  }
  return {
    title:'The Moonlit Café', sub:'Pour cocoa for the regulars by the lake.',
    blurb:'Luna needs a hand at the café tonight! Customers come to the counter with their orders. Make each one just right and serve it before they get tired of waiting.',
    legend:['Click the ingredients (or press 1–8) to make the order', 'Click the customer (or press Space) to serve it', '0 starts the order over', 'Tap the glowing star beans', 'Serve 8 customers; 3 mix-ups ends the shift'],
    hints:['1–3 drinks, 4–6 toppings, 7–8 treats, 0 start over', 'Space or click a customer to serve', 'P to pause'], pad:[], clicks:true,
    winTitle:'Shift complete!', winText:'Every cup served just right. Luna hands you your tips with a happy hoot.',
    againWinText:'Every cup served just right. Luna hands you your tips with a happy hoot.', againLoseText:'A few too many mix-ups tonight. Luna pats you on the back: “We’ll get them next time!”',
    loseTitle:'What a rush!', loseText:'A few too many mix-ups tonight.',
    reset(){ custs = [null, null, null]; tray = { drink:null, top:null, treat:null }; served = 0; mistakes = 0; tips = 0; beans = 0; beanOn = null; spawnT = .6; beanT = 6; neon = false; neonDone = false; flashT = 0; },
    seeds:() => tips, stats:() => `<span>Served ${served}/${GOAL}</span><span>Tips ${tips} seeds</span><span>Star beans ${beans}</span>`,
    end(){ return neonDone ? { title:'A flicker of neon…', text:'The mysterious customer tips their glowing hood, and for a moment the café window shows a city made of lights. Then it’s gone. The way there isn’t open yet… but it will be.' } : null; },
    update(dt){
      time += dt;
      // clicks and number keys
      if (input.click){ const { x, y } = input.click; input.click = null;
        const b = BUTTONS.find(b => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h); if (b) press(b);
        if (beanOn && Math.hypot(x - beanOn.x, y - (COUNTER - 12)) < 26){ beans++; beanOn = null; pop(x, COUNTER - 50, 'Star bean!', '#ffe066'); }
        SLOTS.forEach((sx, i) => { if (custs[i] && Math.abs(x - sx) < 70 && y > COUNTER - 190 && y < COUNTER + 10) serve(i); });
      }
      for (const k of input.keys.splice(0)){ const b = BUTTONS.find(b => b.key === k); if (b) press(b); }
      if (input.pressed){ input.pressed = false;
        const i = custs.findIndex(c => c && c.state === 'wait' && same(c.order, tray));
        if (i >= 0) serve(i); else { const oldest = custs.map((c, j) => c && c.state === 'wait' ? j : -1).filter(j => j >= 0).sort((a, b) => custs[a].pat - custs[b].pat)[0]; if (oldest !== undefined) serve(oldest); } }
      // customers arrive, wait, and leave
      spawnT -= dt;
      if (spawnT <= 0 && served + custs.filter(c => c && c.state !== 'happy' && !c.neon).length < GOAL){ spawn(); spawnT = Math.max(2.2, 4.2 - served*.2); }
      custs.forEach((c, i) => {
        if (!c) return; c.t += dt; if (c.say) c.say = Math.max(0, c.say - dt);
        if (c.state === 'walk'){ c.x += (SLOTS[i] - c.x)*Math.min(1, dt*3); if (Math.abs(c.x - SLOTS[i]) < 2){ c.x = SLOTS[i]; c.state = 'wait'; } }
        else if (c.state === 'wait'){ c.pat -= dt; if (c.pat <= 0){ mistakes++; c.state = 'sad'; c.t = 0; pop(SLOTS[i], COUNTER - 170, 'Too slow…', '#ffd0d3'); } }
        else if (c.t > .9){ custs[i] = null; }
        if (c.state === 'happy' || c.state === 'sad') c.x += dt*260;
      });
      // star beans
      beanT -= dt;
      if (!beanOn && beanT <= 0){ beanOn = { x:180 + Math.random()*460, life:4 }; beanT = 7 + Math.random()*5; }
      if (beanOn){ beanOn.life -= dt; if (beanOn.life <= 0) beanOn = null; }
      // after 3 finished shifts, 3 star beans bring the neon customer
      if (!neon && beans >= 3 && Save.tally('cafeWins') >= 3){ const free = custs.findIndex(c => !c); if (free >= 0){ neon = true; custs[free] = { neon:true, face:GLOW, order:{ drink:'milkshake', top:'berries', treat:'cake' }, pat:30, max:30, x:-80, state:'walk', t:0 }; } }
      if (flashT > 0){ flashT -= dt; if (flashT <= 0){ Save.addSeeds(tips); startWorldGame('city', 'cafe'); } }
      if (!neonDone && served >= GOAL && !custs.some(c => c && c.state === 'happy')){ Save.addTally('cafeWins'); finish(true); }
      if (mistakes >= 3 && !custs.some(c => c && c.state === 'sad' && c.t < .8)) finish(false);
    },
    draw(){
      // the café: warm wood, a window onto the lake, a chalkboard menu, lamps
      ctx.fillStyle = '#6b4a2b'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(40,24,12,.3)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 20; x < W; x += 40){ ctx.moveTo(x, 0); ctx.lineTo(x, COUNTER); } ctx.stroke();
      const sky = ctx.createLinearGradient(0, 40, 0, 170); sky.addColorStop(0, '#0f2438'); sky.addColorStop(1, '#2e5a6e');
      ctx.fillStyle = sky; ctx.fillRect(560, 40, 190, 130);
      if (flashT > 0){
        // the city glimpse: the window fills with neon towers for a moment
        const a = Math.min(1, flashT); ctx.fillStyle = `rgba(20,10,40,${a})`; ctx.fillRect(560, 40, 190, 130);
        for (let i=0;i<9;i++){ const bx = 566 + i*20, bh = 40 + hash(i)*70; ctx.fillStyle = `rgba(${i % 2 ? '255,106,213' : '90,220,255'},${a*.8})`; ctx.fillRect(bx, 170 - bh, 14, bh); ctx.fillStyle = `rgba(255,255,200,${a*.6})`; for (let w2 = 0; w2 < bh - 8; w2 += 10) ctx.fillRect(bx + 4, 170 - bh + 6 + w2, 3, 3); }
      } else { ctx.fillStyle = '#fbf3d0'; circle(700, 76, 18); ctx.fillStyle = '#16384e'; ctx.fillRect(560, 140, 190, 30); }
      ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 6; ctx.strokeRect(560, 40, 190, 130); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(655, 40); ctx.lineTo(655, 170); ctx.stroke();
      ctx.fillStyle = '#2a2a2a'; rr(40, 34, 230, 120, 8); ctx.fill(); ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 6; ctx.stroke();
      ctx.fillStyle = '#f6ead6'; ctx.font = '700 17px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('MOONLIT CAFÉ', 155, 62);
      ctx.font = '600 13px Nunito, sans-serif'; ctx.fillStyle = 'rgba(246,234,214,.85)'; ctx.fillText('Cocoa · Tea · Milkshakes', 155, 88); ctx.fillText('Marshmallows · Cream · Berries', 155, 108); ctx.fillText('Cookies · Cake', 155, 128); ctx.textAlign = 'left';
      for (const lx of [330, 480]){ const lg = ctx.createRadialGradient(lx, 60, 2, lx, 60, 110); lg.addColorStop(0, 'rgba(255,214,130,.35)'); lg.addColorStop(1, 'rgba(255,214,130,0)'); ctx.fillStyle = lg; circle(lx, 60, 110); ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 44); ctx.stroke(); ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.moveTo(lx - 12, 58); ctx.lineTo(lx + 12, 58); ctx.lineTo(lx + 6, 44); ctx.lineTo(lx - 6, 44); ctx.closePath(); ctx.fill(); }
      // customers, standing behind the counter
      custs.forEach((c, i) => {
        if (!c) return;
        const x = c.x, base = COUNTER + 40, bob = c.state === 'walk' ? Math.abs(Math.sin(c.t*10))*4 : 0;
        if (c.neon){ const f = .75 + Math.sin(t*6)*.15, ag = ctx.createRadialGradient(x, base - 80, 10, x, base - 80, 110); ag.addColorStop(0, `rgba(255,106,213,${.35*f})`); ag.addColorStop(.6, `rgba(90,220,255,${.18*f})`); ag.addColorStop(1, 'rgba(90,220,255,0)'); ctx.fillStyle = ag; circle(x, base - 80, 110); }
        if (c.face.img.complete && c.face.img.naturalWidth){ const h = 150, w = h*c.face.img.naturalWidth/c.face.img.naturalHeight; ctx.save(); ctx.translate(x, base - bob); if (c.face.n !== 'luna' && c.face.n !== 'glow') ctx.scale(-1, 1); ctx.drawImage(c.face.img, -w/2, -h, w, h); ctx.restore(); }
        if (c.state === 'wait'){
          orderBubble(x, COUNTER - 200, c.order, c.neon);
          const k = c.pat/c.max; ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(x - 34, COUNTER - 160, 68, 7, 3); ctx.fill();
          ctx.fillStyle = k > .5 ? '#7fc86a' : k > .25 ? '#f2c230' : '#e0464f'; rr(x - 34, COUNTER - 160, 68*k, 7, 3); ctx.fill();
        }
        if (c.say > 0 && c.state === 'wait'){ ctx.font = '700 13px "Pixelify Sans", monospace'; const txt = sayOrder(c.order), tw = ctx.measureText(txt).width + 22;
          ctx.fillStyle = 'rgba(255,248,236,.97)'; rr(x - tw/2, COUNTER - 142, tw, 26, 10); ctx.fill(); ctx.fillStyle = '#3a2616'; ctx.textAlign = 'center'; ctx.fillText(txt, x, COUNTER - 124); ctx.textAlign = 'left'; }
        if (c.neon && c.state === 'wait'){ ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.fillStyle = '#ff9ae8'; ctx.textAlign = 'center'; ctx.fillText('Glow', x, COUNTER - 236); ctx.textAlign = 'left'; }
        if (c.state === 'happy'){ ctx.fillStyle = '#e0708f'; ctx.font = '700 20px "Pixelify Sans", monospace'; ctx.fillText('♥', x - 6, COUNTER - 170 - c.t*30); }
      });
      // Juniper the goat, who owns the café, watching from behind the counter
      { const bob = reduceMotion ? 0 : Math.sin(t*1.6)*2; figure(BARISTA, 738, COUNTER + 60 - bob, 210, -1, .54);
        if (time < 4){ ctx.globalAlpha = Math.min(1, (4 - time)*2); ctx.font = '600 14px Nunito, sans-serif'; const txt = '“Welcome, helper! Get every order just right.”', tw = ctx.measureText(txt).width + 24; ctx.fillStyle = 'rgba(255,248,236,.97)'; rr(738 - tw + 30, COUNTER - 250, tw, 30, 10); ctx.fill(); ctx.fillStyle = '#3a2616'; ctx.fillText(txt, 738 - tw + 42, COUNTER - 230); ctx.globalAlpha = 1; } }
      // the counter, with an espresso machine and the tray you're filling
      ctx.fillStyle = '#8a5a32'; ctx.fillRect(0, COUNTER, W, 10); ctx.fillStyle = '#7a4a28'; ctx.fillRect(0, COUNTER + 10, W, 80);
      ctx.strokeStyle = 'rgba(40,24,12,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x < W; x += 100){ ctx.moveTo(x, COUNTER + 14); ctx.lineTo(x, COUNTER + 88); } ctx.stroke();
      ctx.fillStyle = '#9a9aa2'; rr(24, COUNTER - 70, 70, 70, 8); ctx.fill(); ctx.fillStyle = '#5a5a62'; ctx.fillRect(40, COUNTER - 30, 38, 8); ctx.fillStyle = '#d0452f'; circle(59, COUNTER - 52, 7);
      if (!reduceMotion){ ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(84, COUNTER - 72); ctx.quadraticCurveTo(80 + Math.sin(t*2)*4, COUNTER - 90, 86, COUNTER - 108); ctx.stroke(); }
      Chin.draw(ctx, 'me', anim, 130, COUNTER + 50, { scale:.1, face:1, grounded:true, speed:0 });
      ctx.fillStyle = '#6b3a2a'; rr(690, COUNTER - 8, 96, 10, 4); ctx.fill();
      if (tray.drink || tray.top) cupIcon(725, COUNTER - 24, 1.3, tray.drink, tray.top);
      if (tray.treat) treatIcon(762, COUNTER - 16, 1.2, tray.treat);
      ctx.fillStyle = 'rgba(246,234,214,.7)'; ctx.font = '600 12px Nunito, sans-serif'; ctx.fillText('Your order', 704, COUNTER + 26);
      // a star bean on the counter
      if (beanOn){ const x = beanOn.x, y = COUNTER - 12 + Math.sin(t*5)*3, a = Math.min(1, beanOn.life);
        const g = ctx.createRadialGradient(x, y, 2, x, y, 26); g.addColorStop(0, `rgba(255,230,120,${.8*a})`); g.addColorStop(1, 'rgba(255,230,120,0)'); ctx.fillStyle = g; circle(x, y, 26);
        ctx.fillStyle = `rgba(90,50,24,${a})`; ctx.beginPath(); ctx.ellipse(x, y, 7, 10, .4, 0, 7); ctx.fill(); ctx.strokeStyle = `rgba(255,230,120,${a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 3, y - 7); ctx.quadraticCurveTo(x + 2, y, x - 2, y + 7); ctx.stroke(); }
      // the ingredient buttons along the bottom
      ctx.fillStyle = '#3a2616'; ctx.fillRect(0, 384, W, H - 384);
      for (const b of BUTTONS){
        const on = tray[b.kind] === b.id;
        ctx.fillStyle = on ? '#dd9a5c' : '#5c3a22'; rr(b.x, b.y, b.w, b.h, 10); ctx.fill();
        ctx.strokeStyle = on ? '#ffe9a8' : 'rgba(246,234,214,.15)'; ctx.lineWidth = 2; ctx.stroke();
        if (b.kind === 'drink') cupIcon(b.x + b.w/2, b.y + 30, 1.1, b.id, null);
        else if (b.kind === 'top') cupIcon(b.x + b.w/2, b.y + 30, 1.1, null, b.id);
        else if (b.kind === 'treat') treatIcon(b.x + b.w/2, b.y + 30, 1.3, b.id);
        else { ctx.strokeStyle = '#f6ead6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(b.x + b.w/2, b.y + 30, 12, .6, Math.PI*2 - .2); ctx.stroke(); ctx.fillStyle = '#f6ead6'; ctx.beginPath(); ctx.moveTo(b.x + b.w/2 + 12, b.y + 16); ctx.lineTo(b.x + b.w/2 + 16, b.y + 28); ctx.lineTo(b.x + b.w/2 + 4, b.y + 26); ctx.fill(); }
        ctx.fillStyle = on ? '#2b1a0c' : '#f6ead6'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(b.label, b.x + b.w/2, b.y + 60);
        ctx.fillStyle = on ? 'rgba(43,26,12,.6)' : 'rgba(246,234,214,.45)'; ctx.fillText(b.key, b.x + b.w - 10, b.y + 14); ctx.textAlign = 'left';
      }
      drawPops(0);
    },
    hud(){
      hudBar();
      ctx.fillStyle = '#fff6e4'; ctx.fillText(`Served ${served}/${GOAL}`, 24, 31);
      for (let i=0;i<3;i++){ ctx.fillStyle = i < mistakes ? '#e0464f' : 'rgba(246,234,214,.25)'; ctx.font = '700 20px "Pixelify Sans", monospace'; ctx.fillText('✕', 190 + i*24, 31); }
      ctx.fillStyle = '#ffe066'; ctx.fillText(`★ ${beans}`, 300, 31);
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`Tips ${tips}`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
})();

// ================= Neon City: Neon Beats =================
// Dance moves fall down four lanes, each with its own color. Glow the fox calls out every move just
// before it lands (holding up a card in that move's color); press its key (or A S W D, or tap the lane)
// as it reaches its circle and the chinchilla strikes that pose. Good timing keeps your Groove up;
// let it run out and the show's over.
const BEATS = (() => {
  // each lane is a move from the dancing chinchilla sticker sheet (frames 0 and 2 are his in-between groove)
  const LANES = [
    { x:250, key:'left',  col:'255,106,213', move:'Hat Tip',  pose:5 },
    { x:330, key:'down',  col:'90,220,255',  move:'Kick',     pose:3 },
    { x:410, key:'up',    col:'255,230,110', move:'Hands Up', pose:1 },
    { x:490, key:'right', col:'130,255,160', move:'Point',    pose:4 },
  ];
  const DANCE = new Image(); DANCE.src = 'characters/chin-dance.png';
  // Glow's dance sheet has the very same six moves in the same order, so she can show you each one
  const GLOWDANCE = new Image(); GLOWDANCE.src = 'characters/glow-dance.png';
  const CELL_W = 361, CELL_H = 304, GLOW_W = 309, IDLE = [0, 2];
  // one pose from a sheet, standing with its feet at (x, y), h tall
  function pose(i, x, y, h){ if (!DANCE.complete || !DANCE.naturalWidth) return; const w = h*CELL_W/CELL_H; ctx.drawImage(DANCE, i*CELL_W, 0, CELL_W, CELL_H, x - w/2, y - h, w, h); }
  function glowPose(i, x, y, h){ if (!GLOWDANCE.complete || !GLOWDANCE.naturalWidth) return; const w = h*GLOW_W/CELL_H; ctx.drawImage(GLOWDANCE, i*GLOW_W, 0, GLOW_W, CELL_H, x - w/2, y - h, w, h); }
  // arrows fall slowly enough to read; the song starts with a 3-2-1 countdown
  const HIT_Y = 392, SPEED = 200, BPM = 112, BEAT = 60/BPM, LEAD = 3, LEN = 63;
  const KEYNAMES = ['←', '↓', '↑', '→'];
  const TOWERS = (() => { const r = rng(61), a = []; for (let i=0;i<22;i++) a.push({ x:i*40 - 20 + r()*20, w:30 + r()*30, h:80 + r()*200, win:r() }); return a; })();
  let notes, groove, score, combo, best, perfects, prev, judge, dance, flash, struck, missT, call;
  // the song builds up: an arrow every other beat at first, then every beat,
  // and only near the end the quick in-between arrows and two at once
  function build(){
    const r = rng(909); notes = [];
    for (let b = 2; LEAD + b*BEAT < LEN - 2; b++){
      const tt = LEAD + b*BEAT, k = (tt - LEAD)/(LEN - LEAD);
      if (k < .25){ if (b % 2 === 0 && r() < .85) notes.push({ t:tt, lane:Math.floor(r()*4) }); continue; }
      if (r() < (k < .6 ? .55 : .65)){
        const lane = Math.floor(r()*4); notes.push({ t:tt, lane });
        if (k > .6 && r() < .12) notes.push({ t:tt, lane:(lane + 1 + Math.floor(r()*3)) % 4 });
      }
      if (k > .6 && r() < .14) notes.push({ t:tt + BEAT/2, lane:Math.floor(r()*4) });
    }
  }
  // a move bubble: the pose inside a circle in its lane's color
  function bubble(x, y, l, s, grey){
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = grey ? 'rgba(60,56,72,.85)' : 'rgba(14,8,30,.9)'; circle(0, 0, 28);
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.clip(); if (grey) ctx.globalAlpha = .35; pose(l.pose, 0, 25, 50); ctx.restore();
    ctx.strokeStyle = grey ? 'rgba(150,150,170,.7)' : `rgb(${l.col})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, 28, 0, 7); ctx.stroke();
    ctx.restore();
  }
  return {
    title:'Neon Beats', sub:'Dance the night away on a rooftop in Neon City.',
    blurb:'Glow the fox winked, the caf\u00e9 melted into neon light, and now you\u2019re on a glowing rooftop stage with the crowd waiting! Glow dances each move first, glowing in its color; copy her as it lands and you\u2019ll strike the same pose. Keep your Groove up until the song ends.',
    legend:['Four dance moves, each with its own color: ← Hat Tip (pink), ↓ Kick (blue), ↑ Hands Up (yellow), → Point (green)', 'Glow dances each move just before it lands, glowing in that move’s color: copy her!', 'Press the move’s key (or A S W D, or tap its lane) as it reaches its circle', 'Hits fill your Groove and misses drain it; keep it up until the song ends'],
    hints:['← Hat Tip  ↓ Kick  ↑ Hands Up  → Point', 'A S W D or tap a lane too', 'P to pause'], pad:['wgLeft', 'wgDown', 'wgUp', 'wgRight'], clicks:true,
    winTitle:'The crowd goes wild!', winText:'The last beat lands, the lights flash, and the doors to Neon City swing open for you.',
    againWinText:'Encore! The crowd chants your name all the way down the street.', againLoseText:'The beat got away from you this time. The DJ waves: “Come back and try again!”',
    loseTitle:'Lost the beat', loseText:'The music slips away and the neon fades… and you’re back in the Moonlit Café. Glow will be back another night!',
    reset(){ build(); groove = 70; score = 0; combo = 0; best = 0; perfects = 0; prev = { left:false, down:false, up:false, right:false }; judge = null; dance = 0; flash = [0, 0, 0, 0]; struck = null; missT = 0; call = null; },
    seeds:() => Math.floor(score/200), stats:() => `<span>Score ${score}</span><span>Best combo ${best}</span><span>Perfects ${perfects}</span>`,
    update(dt){
      time += dt;
      const presses = [];
      for (const k of input.taps.splice(0)){ const i = LANES.findIndex(l => l.key === k); if (i >= 0) presses.push(i); }
      if (input.click){ const x = input.click.x; input.click = null; const i = LANES.findIndex(l => Math.abs(x - l.x) < 40); if (i >= 0) presses.push(i); }
      input.pressed = false; input.keys.length = 0;
      for (const i of presses){
        flash[i] = .15;
        let hitN = null, bd = 1;
        for (const n of notes) if (n.lane === i && !n.hit && !n.miss){ const d = Math.abs(n.t - time); if (d < bd){ bd = d; hitN = n; } }
        if (hitN && bd < .26){
          hitN.hit = true;
          const q = bd < .09 ? 'Perfect!' : bd < .16 ? 'Great' : 'Good';
          score += q === 'Perfect!' ? 100 : q === 'Great' ? 60 : 30;
          groove = Math.min(100, groove + (q === 'Perfect!' ? 3 : 2));
          combo++; best = Math.max(best, combo); if (q === 'Perfect!') perfects++;
          judge = { txt:q, t:.5, col:LANES[i].col }; dance = 1; anim.happy = .6; struck = { lane:i, t:BEAT*1.1 };
        }
      }
      for (const n of notes) if (!n.hit && !n.miss && time - n.t > .26){ n.miss = true; combo = 0; groove -= 6; judge = { txt:'Miss', t:.5, col:'255,150,150' }; missT = .4; struck = null; }
      if (struck){ struck.t -= dt; if (struck.t <= 0) struck = null; } missT = Math.max(0, missT - dt);
      // Glow calls the next move about a beat and a half before it lands
      { const next = notes.filter(n => !n.hit && !n.miss && n.t - time > -.05 && n.t - time < BEAT*1.6).sort((a, b) => a.t - b.t);
        const lanes = [...new Set(next.filter(n => n.t - next[0]?.t < .05).map(n => n.lane))];
        if (lanes.length){ if (!call || call.lanes.join() !== lanes.join() || call.t0 !== next[0].t) call = { lanes, t0:next[0].t, age:0 }; else call.age += dt; } else call = null; }
      flash = flash.map(f => Math.max(0, f - dt)); dance = Math.max(0, dance - dt*2);
      if (judge){ judge.t -= dt; if (judge.t <= 0) judge = null; }
      if (groove <= 0){ groove = 0; finish(false); }
      else if (time > LEN) finish(true);
    },
    draw(){
      const phase = (time % BEAT)/BEAT, pulse = Math.pow(1 - phase, 3);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0620'); g.addColorStop(.6, '#2a0f4a'); g.addColorStop(1, '#4a1a5a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i=0;i<50;i++){ ctx.fillStyle = `rgba(255,255,255,${.3 + .5*Math.max(0, Math.sin(t*1.3 + i))})`; circle(hash(i)*W, hash(i + 5)*180, hash(i + 2)*1.2 + .4); }
      const pg = ctx.createRadialGradient(660, 100, 20, 660, 100, 110); pg.addColorStop(0, 'rgba(90,160,255,.35)'); pg.addColorStop(1, 'rgba(90,160,255,0)'); ctx.fillStyle = pg; circle(660, 100, 110);
      ctx.fillStyle = '#3a6ad0'; circle(660, 100, 52); ctx.strokeStyle = 'rgba(150,220,255,.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(660, 100, 90, 18, -.2, 0, 7); ctx.stroke();
      // the skyline behind the stage
      for (const tw of TOWERS){ const top = 330 - tw.h; ctx.fillStyle = '#1a1030'; ctx.fillRect(tw.x, top, tw.w, tw.h + 10);
        for (let y = top + 8; y < 330; y += 12) for (let x = tw.x + 4; x < tw.x + tw.w - 4; x += 8) if (hash(x*.3 + y*.7 + tw.win) > .55){ ctx.fillStyle = hash(x + y) > .5 ? 'rgba(255,230,140,.7)' : 'rgba(120,220,255,.6)'; ctx.fillRect(x, y, 3, 4); } }
      // spotlights sweeping over the crowd
      for (let i=0;i<3;i++){ const a = Math.sin(t*.7 + i*2)*.5, bx = 150 + i*250; ctx.fillStyle = `rgba(${['255,106,213', '90,220,255', '255,230,110'][i]},.08)`;
        ctx.beginPath(); ctx.moveTo(bx, H); ctx.lineTo(bx + Math.sin(a)*500 - 60, 0); ctx.lineTo(bx + Math.sin(a)*500 + 60, 0); ctx.closePath(); ctx.fill(); }
      // the stage floor, pulsing on the beat
      ctx.fillStyle = '#140a24'; ctx.fillRect(0, 420, W, H - 420);
      for (let i=0;i<10;i++){ ctx.fillStyle = `rgba(${['255,106,213', '90,220,255'][i % 2]},${.15 + (i % 3 === Math.floor(time/BEAT) % 3 ? pulse*.4 : 0)})`; ctx.fillRect(i*80 + 2, 424, 76, 18); }
      // the crowd
      for (let i=0;i<9;i++){ const cx = 30 + i*90 + (i % 2)*20, bob = Math.abs(Math.sin((time/BEAT + i*.3)*Math.PI))*6; ctx.fillStyle = '#0b0618'; circle(cx, H - 10 - bob, 16); ctx.fillRect(cx - 18, H - 8 - bob, 36, 20);
        ctx.fillStyle = `rgba(${['255,106,213', '90,220,255', '255,230,110'][i % 3]},.8)`; ctx.fillRect(cx - 1, H - 42 - bob - (i % 2)*6, 2, 14); circle(cx, H - 44 - bob - (i % 2)*6, 3); }
      // the four lanes and their targets
      LANES.forEach((l, i) => {
        ctx.fillStyle = 'rgba(10,6,24,.55)'; ctx.fillRect(l.x - 34, 48, 68, HIT_Y + 28 - 48);
        ctx.fillStyle = `rgba(${l.col},${.08 + flash[i]*2})`; ctx.fillRect(l.x - 34, 48, 68, HIT_Y + 28 - 48);
        const soon = notes.some(n => n.lane === i && !n.hit && !n.miss && Math.abs(n.t - time) < .22);
        if (soon){ const sg = ctx.createRadialGradient(l.x, HIT_Y, 4, l.x, HIT_Y, 44); sg.addColorStop(0, `rgba(${l.col},.55)`); sg.addColorStop(1, `rgba(${l.col},0)`); ctx.fillStyle = sg; circle(l.x, HIT_Y, 44); }
        // the target: a ring in the lane's color with a faint picture of its move
        { const k = 1 + flash[i]*.8 + (soon ? .1 : 0); ctx.save(); ctx.translate(l.x, HIT_Y); ctx.scale(k, k);
          ctx.fillStyle = flash[i] > 0 ? `rgba(${l.col},.55)` : soon ? `rgba(${l.col},.25)` : 'rgba(10,6,24,.6)'; circle(0, 0, 30);
          ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 28, 0, 7); ctx.clip(); ctx.globalAlpha = .3; pose(l.pose, 0, 27, 54); ctx.restore();
          ctx.strokeStyle = `rgb(${l.col})`; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.stroke(); ctx.setLineDash([]); ctx.restore(); }
        // its name tag: the key and the move, in the same color
        ctx.fillStyle = 'rgba(10,6,24,.9)'; rr(l.x - 36, HIT_Y + 34, 72, 34, 7); ctx.fill(); ctx.strokeStyle = `rgba(${l.col},.8)`; ctx.lineWidth = 1.5; rr(l.x - 36, HIT_Y + 34, 72, 34, 7); ctx.stroke();
        ctx.fillStyle = `rgb(${l.col})`; ctx.textAlign = 'center'; ctx.font = '700 15px "Pixelify Sans", monospace'; ctx.fillText(KEYNAMES[i], l.x, HIT_Y + 49); ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.fillText(l.move, l.x, HIT_Y + 63); ctx.textAlign = 'left';
      });
      // 3, 2, 1, Go!
      if (time < LEAD + .6){ const n = Math.ceil(LEAD - time), txt = n > 0 ? String(n) : 'Go!', k = 1 - ((LEAD - time) % 1);
        ctx.fillStyle = `rgba(255,246,228,${time < LEAD ? 1 - k*.4 : 1})`; ctx.font = `700 ${60 + k*20}px "Pixelify Sans", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, 370, 220);
        ctx.font = '600 15px Nunito, sans-serif'; ctx.fillText('Watch Glow, then press each move’s key as it reaches its circle', 370, 280); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
      // the falling arrows
      for (const n of notes){ if (n.hit) continue; const y = HIT_Y - (n.t - time)*SPEED; if (y < 30 || y > H + 30) continue; const l = LANES[n.lane];
        if (!n.miss){ const gg = ctx.createRadialGradient(l.x, y, 4, l.x, y, 40); gg.addColorStop(0, `rgba(${l.col},.5)`); gg.addColorStop(1, `rgba(${l.col},0)`); ctx.fillStyle = gg; circle(l.x, y, 40); }
        bubble(l.x, y, l, 1, n.miss); }
      // Glow the fox on the left of the stage: she dances each move just before it lands, glowing in its
      // color with its key and name over her head (two moves at once: she switches between them)
      { const n = call ? call.lanes.length : 0, li = n ? call.lanes[Math.floor(time/(BEAT/2)) % n] : -1, cl = li >= 0 ? LANES[li] : null;
        const bob = cl ? 0 : Math.abs(Math.sin(phase*Math.PI))*8, gx = 112, gy = 426, gh = 190;
        const ag = ctx.createRadialGradient(gx, gy - 90, 10, gx, gy - 90, 130); ag.addColorStop(0, cl ? `rgba(${cl.col},.55)` : 'rgba(200,220,255,.22)'); ag.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = ag; circle(gx, gy - 90, 130);
        if (cl){ ctx.strokeStyle = `rgba(${cl.col},.9)`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(gx, gy - 2, 62, 12, 0, 0, 7); ctx.stroke(); }
        ctx.save(); ctx.translate(gx, gy - bob); if (!cl) ctx.rotate((Math.floor(time/BEAT) % 2 ? 1 : -1)*.05); glowPose(cl ? cl.pose : IDLE[Math.floor(time/BEAT) % 2], 0, 0, gh); ctx.restore();
        if (call){ const pop = Math.min(1, call.age*8), bw = 64 + n*72, bx = gx - bw/2, by = 60;
          ctx.save(); ctx.translate(gx, by + 22); ctx.scale(.85 + pop*.15, .85 + pop*.15); ctx.translate(-gx, -(by + 22));
          ctx.fillStyle = 'rgba(14,8,30,.92)'; rr(bx, by, bw, 44, 12); ctx.fill(); ctx.strokeStyle = `rgb(${cl.col})`; ctx.lineWidth = 4; rr(bx, by, bw, 44, 12); ctx.stroke();
          ctx.textAlign = 'center'; ctx.font = '700 17px "Pixelify Sans", monospace';
          call.lanes.forEach((k, j) => { const l = LANES[k]; ctx.fillStyle = `rgb(${l.col})`; ctx.fillText(`${KEYNAMES[k]} ${l.move}`, gx + (j - (n - 1)/2)*(bw/n), by + 28); });
          ctx.textAlign = 'left'; ctx.restore();
          ctx.fillStyle = `rgb(${cl.col})`; ctx.beginPath(); ctx.moveTo(gx - 8, by + 44); ctx.lineTo(gx + 8, by + 44); ctx.lineTo(gx, by + 56); ctx.fill(); }
        else if (time < LEAD){ ctx.fillStyle = 'rgba(14,8,30,.9)'; rr(gx - 60, 70, 120, 36, 10); ctx.fill(); ctx.fillStyle = '#fff6e4'; ctx.font = '700 14px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('Watch me!', gx, 93); ctx.textAlign = 'left'; } }
      // the chinchilla dancing on the stage, bouncing on every beat
      { const bounce = Math.abs(Math.sin(phase*Math.PI))*12, sway = (Math.floor(time/BEAT) % 2 ? 1 : -1)*(.08 + dance*.1);
        const sg = ctx.createRadialGradient(660, 420, 10, 660, 420, 110); sg.addColorStop(0, 'rgba(255,240,200,.35)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = sg; circle(660, 420, 110);
        const fr = struck ? LANES[struck.lane].pose : IDLE[Math.floor(time/BEAT) % 2], wob = missT > 0 ? Math.sin(missT*30)*.15 : 0;
        if (struck){ const l = LANES[struck.lane], rg = ctx.createRadialGradient(660, 350, 10, 660, 350, 100); rg.addColorStop(0, `rgba(${l.col},.45)`); rg.addColorStop(1, `rgba(${l.col},0)`); ctx.fillStyle = rg; circle(660, 350, 100); }
        ctx.save(); ctx.translate(660, 424 - (struck ? 6 : bounce)); ctx.rotate(struck ? 0 : sway*.6 + wob); pose(fr, 0, 0, 160); ctx.restore();
        if (struck){ const l = LANES[struck.lane]; ctx.fillStyle = `rgb(${l.col})`; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(l.move + '!', 660, 250); ctx.textAlign = 'left'; } }
      if (judge){ ctx.globalAlpha = Math.min(1, judge.t*3); ctx.fillStyle = `rgb(${judge.col})`; ctx.font = '700 30px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(judge.txt, 370, 250 - (.5 - judge.t)*30);
        if (combo > 2){ ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.fillStyle = '#fff6e4'; ctx.fillText(`${combo} combo`, 370, 276); } ctx.globalAlpha = 1; ctx.textAlign = 'left'; }
      drawPops(0);
    },
    hud(){
      hudBar();
      ctx.fillStyle = '#fff6e4'; ctx.fillText('Groove', 24, 31);
      ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(110, 22, 200, 16, 6); ctx.fill();
      ctx.fillStyle = groove > 50 ? '#82ffa0' : groove > 25 ? '#ffe66e' : '#ff6a8a'; rr(110, 22, 200*groove/100, 16, 6); ctx.fill();
      ctx.fillStyle = '#fff6e4'; ctx.fillText(`${score}`, 340, 31);
      progress(time/LEN, '#ff6ad5');
      ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
})();

// ================= Moonlit Lake: Moonlight Slalom =================
// Ski down the snowy mountain above the lake by moonlight (seen from above). Steer through
// the flag gates, hop off the snow ramps, and don't bump into the pines or the rocks.
const SKI = (() => {
  const GOAL = 11000, PY = 150, EDGE = 70;
  let things, x, ang, speed, dist, hearts, flakes, gates, gateN, inv, tumble, air, airMax, boost, won, winT, trail;
  function build(){
    const r = rng(417); things = []; gateN = 0; let side = 1;
    for (let d = 520; d < GOAL - 500; d += 120 + r()*110){
      const k = r(), late = d/GOAL;
      if (k < .26){ side = -side; things.push({ k:'gate', x:W/2 + side*(60 + r()*150), y:d, w:130, n:gateN++ }); }
      else if (k < .6){ const n = 1 + (r() < late ? 1 : 0) + (r() < .3 ? 1 : 0); for (let i=0;i<n;i++) things.push({ k:'tree', x:EDGE + 30 + r()*(W - 2*EDGE - 60), y:d + r()*50, s:.85 + r()*.45 }); }
      else if (k < .72) things.push({ k:'rock', x:EDGE + 40 + r()*(W - 2*EDGE - 80), y:d, s:.8 + r()*.5 });
      else if (k < .82) things.push({ k:'ramp', x:EDGE + 60 + r()*(W - 2*EDGE - 120), y:d });
      else { const x0 = EDGE + 100 + r()*(W - 2*EDGE - 200), sw = (r() - .5)*140; for (let i=0;i<5;i++) things.push({ k:'flake', x:x0 + Math.sin(i/4*Math.PI)*sw, y:d + i*34 }); d += 90; }
    }
    things.sort((a, b) => a.y - b.y);
  }
  function crash(txt){ hearts--; tumble = 1; inv = 2.2; air = 0; shake = .35; pop(x, PY - 60, txt, '#ffd0d3'); }
  // a snowy pine seen from above and a little to the side, with a moon shadow
  function pine(px, py, s){
    ctx.fillStyle = 'rgba(70,90,150,.22)'; ctx.beginPath(); ctx.ellipse(px + 16*s, py + 3*s, 24*s, 7*s, .25, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a3020'; ctx.fillRect(px - 3*s, py - 12*s, 6*s, 12*s);
    for (let k=0;k<3;k++){ const w = (24 - k*6)*s, yy = py - 8*s - k*14*s, hh = 26*s;
      ctx.fillStyle = k % 2 ? '#24505a' : '#1d3d4a'; ctx.beginPath(); ctx.moveTo(px - w, yy); ctx.lineTo(px, yy - hh); ctx.lineTo(px + w, yy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#eef4fb'; ctx.beginPath(); ctx.moveTo(px - w*.5, yy - hh*.5); ctx.lineTo(px, yy - hh); ctx.lineTo(px + w*.5, yy - hh*.5); ctx.lineTo(px + w*.15, yy - hh*.42); ctx.lineTo(px - w*.2, yy - hh*.46); ctx.closePath(); ctx.fill(); }
  }
  function flag(fx, fy, col, faded){
    ctx.globalAlpha = faded ? .35 : 1;
    ctx.strokeStyle = '#3a3a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 44); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(fx, fy - 44); ctx.lineTo(fx + 22, fy - 36); ctx.lineTo(fx, fy - 28); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(70,90,150,.25)'; ctx.beginPath(); ctx.ellipse(fx + 10, fy + 2, 12, 3, .2, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  }
  function snowflake(fx, fy, r, a){
    const sg = ctx.createRadialGradient(fx, fy, 1, fx, fy, r*2); sg.addColorStop(0, `rgba(190,230,255,${.8*a})`); sg.addColorStop(1, 'rgba(190,230,255,0)'); ctx.fillStyle = sg; circle(fx, fy, r*2);
    ctx.strokeStyle = `rgba(90,150,230,${a})`; ctx.lineWidth = 2; ctx.beginPath();
    for (let i=0;i<3;i++){ const q = i*Math.PI/3 + t*.8; ctx.moveTo(fx - Math.cos(q)*r, fy - Math.sin(q)*r); ctx.lineTo(fx + Math.cos(q)*r, fy + Math.sin(q)*r); }
    ctx.stroke(); ctx.fillStyle = `rgba(255,255,255,${a})`; circle(fx, fy, 2.5);
  }
  function drawThing(o){
    const sy = o.y - dist + PY; if (sy < -80 || sy > H + 60) return;
    if (o.k === 'tree') pine(o.x, sy, o.s);
    else if (o.k === 'rock'){ ctx.fillStyle = 'rgba(70,90,150,.25)'; ctx.beginPath(); ctx.ellipse(o.x + 8*o.s, sy + 3, 20*o.s, 6*o.s, .2, 0, 7); ctx.fill();
      ctx.fillStyle = '#6a7488'; ctx.beginPath(); ctx.ellipse(o.x, sy - 6*o.s, 17*o.s, 11*o.s, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8a94a8'; ctx.beginPath(); ctx.ellipse(o.x - 4*o.s, sy - 9*o.s, 9*o.s, 5*o.s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#eef4fb'; ctx.beginPath(); ctx.ellipse(o.x - 2*o.s, sy - 14*o.s, 11*o.s, 4*o.s, 0, 0, 7); ctx.fill(); }
    else if (o.k === 'ramp'){ ctx.fillStyle = 'rgba(70,90,150,.3)'; ctx.beginPath(); ctx.moveTo(o.x - 36, sy + 12); ctx.lineTo(o.x + 36, sy + 12); ctx.lineTo(o.x + 30, sy + 18); ctx.lineTo(o.x - 30, sy + 18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f6faff'; ctx.beginPath(); ctx.moveTo(o.x - 30, sy - 14); ctx.lineTo(o.x + 30, sy - 14); ctx.lineTo(o.x + 36, sy + 12); ctx.lineTo(o.x - 36, sy + 12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#7ab0e0'; ctx.lineWidth = 3; ctx.beginPath(); for (const k of [-1, 1]){ ctx.moveTo(o.x + k*12 - 8, sy + 4); ctx.lineTo(o.x + k*12, sy - 6); ctx.lineTo(o.x + k*12 + 8, sy + 4); } ctx.stroke(); }
    else if (o.k === 'flake'){ if (!o.got) snowflake(o.x, sy - 10 + Math.sin(t*3 + o.y)*3, 8, 1); }
    else if (o.k === 'gate'){ const col = o.n % 2 ? '#3f7ad0' : '#d0452f', faded = o.done && !o.hit;
      if (o.hit){ ctx.fillStyle = 'rgba(255,240,180,.25)'; ctx.fillRect(o.x - o.w/2, sy - 4, o.w, 8); }
      flag(o.x - o.w/2, sy, col, faded); flag(o.x + o.w/2, sy, col, faded); }
  }
  return {
    title:'Moonlight Slalom', sub:'Ski down the mountain above the Moonlit Lake.',
    blurb:'The chairlift carried you all the way up the snowy mountain. Ski down under the moon, swoosh through the flag gates, and make it to the lodge by the lake!',
    legend:['← → to turn (let go to point straight down)', '↓ to tuck and go faster, ↑ to slow down', 'Pass between the two flags of each gate for a speed boost', 'Snow ramps make you jump', 'Don’t hit the pines or rocks (3 hearts)', 'Catch the snowflakes'],
    hints:['← → to turn, ↓ faster, ↑ slower', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgUp', 'wgDown'],
    winTitle:'You made it down!', winText:'You swoosh to a stop by the lodge, cheeks tingling, and the lake glitters under the moon.',
    againWinText:'What a run! The chairlift is waiting if you want to go again.', againLoseText:'Too many tumbles in the snow. You dust yourself off and ride the chairlift back down.',
    loseTitle:'Snowed under!', loseText:'Too many tumbles in the snow. You dust yourself off and ride the chairlift back down.',
    reset(){ build(); x = W/2; ang = 0; speed = 0; dist = 0; hearts = 3; flakes = 0; gates = 0; inv = 0; tumble = 0; air = 0; airMax = 1; boost = 0; won = false; winT = 0; trail = []; },
    seeds:() => flakes + gates, stats:() => `<span>Snowflakes ${flakes}</span><span>Gates ${gates}/${gateN}</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      if (won){ winT += dt; speed *= Math.pow(.2, dt); dist += speed*dt; ang *= Math.pow(.1, dt); if (winT > 1.6) finish(true); return; }
      inv = Math.max(0, inv - dt);
      if (tumble > 0){ tumble -= dt; speed *= Math.pow(.02, dt); dist += speed*dt; if (tumble <= 0){ tumble = 0; ang = 0; if (hearts <= 0) finish(false); } return; }
      const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (air > 0){ air -= dt; if (air <= 0){ air = 0; pop(x, PY - 50, 'Nice landing!', '#bfe3ff'); } }
      else if (steer) ang += steer*2.8*dt; else ang *= Math.pow(.3, dt);
      ang = clamp(ang, -1.3, 1.3);
      let want = 190 + 300*Math.cos(ang);
      if (input.down) want += 160; if (input.up) want *= .45;
      if (boost > 0){ boost -= dt; want += 130; }
      speed += (want - speed)*Math.min(1, dt*(want > speed ? .9 : 2.4));
      x += Math.sin(ang)*speed*dt; dist += Math.cos(ang)*speed*dt;
      // the forest on either side just nudges you back onto the slope
      if (x < EDGE){ x = EDGE; ang = Math.abs(ang)*.5; speed *= .85; } else if (x > W - EDGE){ x = W - EDGE; ang = -Math.abs(ang)*.5; speed *= .85; }
      for (const o of things){
        const dy = o.y - dist; if (dy < -40) continue; if (dy > 40) break;
        if (o.k === 'flake'){ if (!o.got && Math.abs(o.x - x) < 24 && Math.abs(dy - 10) < 26){ o.got = true; flakes++; anim.chew = .3; } }
        else if (o.k === 'gate'){ if (!o.done && dy <= 0){ o.done = true; if (Math.abs(x - o.x) < o.w/2){ o.hit = true; gates++; boost = .9; pop(x, PY - 60, 'Gate!', '#ffe066'); } else pop(o.x, PY - 60, 'Missed', 'rgba(230,236,250,.9)'); } }
        else if (air > 0 || tumble > 0) continue;
        else if (o.k === 'ramp'){ if (!o.used && Math.abs(o.x - x) < 36 && Math.abs(dy) < 12){ o.used = true; air = airMax = .55 + speed/900; flakes += 2; anim.happy = 1.5; pop(x, PY - 60, 'Whee! +2', '#bfe3ff'); } }
        else if (inv <= 0 && o.k === 'tree' && Math.abs(o.x - x) < 14*o.s + 8 && Math.abs(dy) < 12) crash('Oof!');
        else if (inv <= 0 && o.k === 'rock' && Math.abs(o.x - x) < 15*o.s + 7 && Math.abs(dy) < 10) crash('Bonk!');
      }
      if (air <= 0) trail.push({ x, y:dist, a:ang }); trail = trail.filter(q => q.y > dist - PY - 20);
      if (dist >= GOAL){ won = true; winT = 0; anim.happy = 4; }
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#a9bbdc'); g.addColorStop(1, '#dde6f4');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const mg = ctx.createRadialGradient(140, -60, 20, 140, -60, 520); mg.addColorStop(0, 'rgba(255,250,225,.4)'); mg.addColorStop(1, 'rgba(255,250,225,0)'); ctx.fillStyle = mg; ctx.fillRect(0, 0, W, H);
      // soft bumps in the snow, and sparkles that twinkle in the moonlight
      for (let j = Math.floor((dist - PY - 60)/130); j*130 - dist + PY < H + 60; j++){ const yy = j*130 - dist + PY, mx = EDGE + hash(j)*(W - 2*EDGE);
        ctx.fillStyle = 'rgba(110,130,190,.12)'; ctx.beginPath(); ctx.ellipse(mx + 8, yy + 5, 46, 11, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(mx - 6, yy - 3, 36, 8, 0, 0, 7); ctx.fill(); }
      for (let i=0;i<90;i++){ const sx = hash(i)*W, sy = wrap(hash(i + 11)*900 - dist, 900) - 200; if (sy < -5 || sy > H + 5) continue;
        ctx.fillStyle = `rgba(255,255,255,${.3 + .7*Math.max(0, Math.sin(t*2 + i*1.7))})`; circle(sx, sy, hash(i + 4)*1.4 + .5); }
      // the finish line, the lodge and the frozen lake at the bottom
      { const fy = GOAL - dist + PY; if (fy < H + 100){
        for (let i=0;i<20;i++){ ctx.fillStyle = i % 2 ? '#2a2a3a' : '#f6faff'; ctx.fillRect(EDGE + i*(W - 2*EDGE)/20, fy - 4, (W - 2*EDGE)/20, 8); }
        for (const px of [EDGE + 10, W - EDGE - 10]){ ctx.fillStyle = '#5a3a2a'; ctx.fillRect(px - 3, fy - 90, 6, 90); }
        ctx.fillStyle = '#3f6b5a'; rr(EDGE + 10, fy - 100, W - 2*EDGE - 20, 30, 6); ctx.fill();
        ctx.fillStyle = '#ffe9a8'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FINISH  ·  MOONLIT LAKE LODGE', W/2, fy - 85); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        const ly = fy + 420, lk = fy + 540;
        const ig = ctx.createLinearGradient(0, lk, 0, lk + 200); ig.addColorStop(0, '#7a9cc4'); ig.addColorStop(1, '#4a6a94'); ctx.fillStyle = ig; ctx.fillRect(0, lk, W, 400);
        ctx.fillStyle = 'rgba(251,243,208,.6)'; ctx.beginPath(); ctx.ellipse(W/2, lk + 70, 44, 14, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(120, lk + 40); ctx.lineTo(260, lk + 90); ctx.moveTo(520, lk + 30); ctx.lineTo(640, lk + 110); ctx.stroke();
        ctx.fillStyle = 'rgba(70,90,150,.3)'; ctx.fillRect(572, ly + 6, 180, 14);
        ctx.fillStyle = '#7a5230'; ctx.fillRect(560, ly - 70, 170, 76); ctx.fillStyle = '#eef4fb'; ctx.beginPath(); ctx.moveTo(545, ly - 66); ctx.lineTo(645, ly - 120); ctx.lineTo(745, ly - 66); ctx.closePath(); ctx.fill();
        for (const wx of [580, 680]){ const wg = ctx.createRadialGradient(wx + 14, ly - 38, 2, wx + 14, ly - 38, 44); wg.addColorStop(0, 'rgba(255,200,110,.5)'); wg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = wg; circle(wx + 14, ly - 38, 44); ctx.fillStyle = '#ffd278'; ctx.fillRect(wx, ly - 50, 28, 24); }
        ctx.fillStyle = '#4a2e1a'; ctx.fillRect(632, ly - 44, 26, 50);
        for (const px of [180, 300, 420]) pine(px, ly + 20 + hash(px)*40, 1); } }
      // ski tracks
      ctx.strokeStyle = 'rgba(120,140,190,.35)'; ctx.lineWidth = 2;
      for (const off of [-5, 5]){ ctx.beginPath(); let started = false;
        for (let i=0;i<trail.length;i++){ const q = trail[i], px = q.x + Math.cos(q.a)*off, py = q.y - dist + PY; if (i && trail[i].y - trail[i - 1].y > 30){ started = false; } started ? ctx.lineTo(px, py) : ctx.moveTo(px, py); started = true; }
        ctx.stroke(); }
      // things up the hill from you, then you, then things further down (so they overlap properly)
      for (const o of things) if (o.y < dist) drawThing(o);
      const lift = air > 0 ? Math.sin((1 - air/airMax)*Math.PI)*28 : 0;
      ctx.fillStyle = 'rgba(70,90,150,.3)'; ctx.beginPath(); ctx.ellipse(x + 6 + lift*.3, PY + 4, 20 - lift*.2, 6, 0, 0, 7); ctx.fill();
      if (!(inv > 0 && tumble <= 0 && Math.floor(inv*12) % 2 === 0)){
        ctx.save(); ctx.translate(x, PY - lift);
        if (tumble > 0) ctx.rotate((1 - tumble)*Math.PI*2);
        const sc = 1 + lift/120; ctx.scale(sc, sc);
        ctx.save(); ctx.rotate(-ang*.9); for (const sx of [-7, 7]){ ctx.fillStyle = '#d0452f'; rr(sx - 2.5, -24, 5, 46, 2.5); ctx.fill(); ctx.fillStyle = '#f6ead6'; ctx.fillRect(sx - 2.5, 12, 5, 3); } ctx.restore();
        ctx.strokeStyle = '#4a4a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-15, -26); ctx.lineTo(-19, 4); ctx.moveTo(15, -26); ctx.lineTo(19, 4); ctx.stroke();
        Chin.draw(ctx, 'me', anim, 0, 4, { scale:.075, face:ang < -.05 ? -1 : 1, grounded:true, speed:0 });
        ctx.restore();
        if (tumble > 0){ for (let i=0;i<3;i++){ const q = t*5 + i*2.1; ctx.fillStyle = '#ffe066'; ctx.font = '700 14px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('✦', x + Math.cos(q)*22, PY - 70 + Math.sin(q)*6); } ctx.textAlign = 'left'; }
      }
      for (const o of things) if (o.y >= dist) drawThing(o);
      // the dark forest on both sides of the run
      for (let j = Math.floor((dist - PY - 60)/48); j*48 - dist + PY < H + 80; j++){ const yy = j*48 - dist + PY;
        pine(18 + hash(j)*34, yy, 1 + hash(j + 2)*.3); pine(W - 18 - hash(j + 5)*34, yy + 20, 1 + hash(j + 7)*.3); }
      // gently falling snow
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      for (let i=0;i<50;i++){ const sx = wrap(hash(i + 30)*W + Math.sin(t*.8 + i)*20 - x*.05*(.5 + hash(i)), W), sy = wrap(hash(i + 60)*H + t*(30 + hash(i + 2)*40) - dist*.15, H + 10) - 5; circle(sx, sy, 1 + hash(i + 8)*1.6); }
      const vg = ctx.createRadialGradient(W/2, H/2, 260, W/2, H/2, 560); vg.addColorStop(0, 'rgba(20,30,60,0)'); vg.addColorStop(1, 'rgba(20,30,60,.35)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
      drawPops(0);
    },
    hud(){
      hudBar(); for (let i=0;i<3;i++) heart(30 + i*28, 30, i < hearts);
      snowflake(134, 30, 7, 1); ctx.fillStyle = '#fff6e4'; ctx.fillText(`${flakes}`, 150, 31);
      ctx.fillStyle = '#ffe066'; ctx.fillText(`⚑ ${gates}/${gateN}`, 200, 31);
      progress(dist/GOAL, '#bfe3ff');
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`${time.toFixed(0)} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ dist += 140*dt; x = W/2 + Math.sin(t*.9)*140; ang = Math.cos(t*.9)*.6; if (dist > GOAL - 800) dist = 0; },
  };
})();

// ================= Neon City: Neon Grand Prix =================
// A hover-car race through the glowing streets, seen from behind your car (the road is drawn
// the old arcade way: a strip of segments projected toward the horizon, bending and rising
// as they go). Three laps against seven rivals; finish in the top three to win.
const CHIN_BACK = new Image(); CHIN_BACK.src = 'characters/chinchilla-back.png';
const RACE = (() => {
  const SEG = 200, ROADW = 2000, CAMH = 1000, DEPTH = 1/Math.tan(50*Math.PI/180), PLAYERZ = CAMH*DEPTH, DRAWN = 150, LAPS = 3, MAXV = 10000, CARW = 470, RUMBLE = 3;
  const RIVAL_COLS = ['255,106,213', '90,220,255', '255,230,110', '130,255,160', '255,150,90', '180,140,255', '255,90,90'];
  const SKYLINE = (() => { const r = rng(88), a = []; for (let i=0;i<34;i++) a.push({ x:i*44 + r()*20, w:30 + r()*34, h:40 + r()*130, s:r() }); return a; })();
  // the track: stretches of road that ease into a curve (+ right, - left) and up or down a hill
  const segs = [];
  const easeIn = (a, b, p) => a + (b - a)*p*p, easeInOut = (a, b, p) => a + (b - a)*(-Math.cos(p*Math.PI)/2 + .5);
  function addRoad(enter, hold, leave, curve, hill){
    const y0 = segs.length ? segs[segs.length - 1].y2 : 0, y1 = y0 + hill*SEG, total = enter + hold + leave;
    for (let n=0;n<total;n++){
      const c = n < enter ? easeIn(0, curve, n/enter) : n < enter + hold ? curve : easeInOut(curve, 0, (n - enter - hold)/leave);
      const i = segs.length; segs.push({ i, curve:c, y1:i ? segs[i - 1].y2 : 0, y2:easeInOut(y0, y1, (n + 1)/total), sprites:[], s1:{}, s2:{}, clip:H });
    }
  }
  addRoad(10, 30, 10, 0, 0);
  addRoad(25, 40, 25, 3, 20);
  addRoad(20, 30, 20, 0, -20);
  addRoad(25, 50, 25, -4, 0);
  addRoad(20, 20, 20, 0, 30);
  addRoad(20, 30, 20, 5, -30);
  addRoad(25, 40, 25, -2, 20);
  addRoad(20, 30, 20, 3, -20);
  addRoad(30, 40, 30, -5, 0);
  addRoad(20, 30, 20, 0, 0);
  const N = segs.length, TL = N*SEG;
  { // what stands along the road: neon posts, billboards, towers, curve arrows, boost pads and chips
    const r = rng(2024), SIGNS = ['NEON GP', 'GLOW NOODLES', 'ZOOM!', 'NEON BEATS', 'HI THISTLEDOWN'];
    for (let i=0;i<N;i++){
      const s = segs[i];
      if (i % 10 === 0){ s.sprites.push({ k:'post', off:-1.3, col:RIVAL_COLS[(i/10) % 2 ? 0 : 1], solid:true }); s.sprites.push({ k:'post', off:1.3, col:RIVAL_COLS[(i/10) % 2 ? 1 : 0], solid:true }); }
      if (i % 16 === 8){ const side = hash(i) > .5 ? 1 : -1; s.sprites.push({ k:'tower', off:side*(2.6 + hash(i + 1)*1.4), h:3000 + hash(i + 2)*4000, w:1400 + hash(i + 3)*900, s:hash(i + 4), col:RIVAL_COLS[i % 7] }); }
      if (i % 60 === 30) s.sprites.push({ k:'sign', off:(i % 120 === 30 ? -1 : 1)*2, txt:SIGNS[(i/60 | 0) % SIGNS.length], col:RIVAL_COLS[(i/60 | 0) % 7] });
      if (Math.abs(s.curve) > 2 && i % 6 === 0) s.sprites.push({ k:'arrow', off:-Math.sign(s.curve)*1.65, dir:Math.sign(s.curve) });
      if (i > 40 && i % 90 === 45) s.sprites.push({ k:'boost', off:(r() - .5)*1.2 });
      if (i > 20 && i % 70 === 20){ const o0 = (r() - .5)*1.2, sw = (r() - .5)*.8; for (let j=0;j<6;j++) segs[(i + j*3) % N].sprites.push({ k:'chip', off:clamp(o0 + Math.sin(j/5*Math.PI)*sw, -.8, .8), got:0 }); }
    }
  }
  let pos, px, speed, skyOff, boost, chips, bumpT, rivals, place, lap, done, doneT, steerV;
  const ord = n => n + (['th', 'st', 'nd', 'rd'][n] || 'th');
  const segAt = z => segs[Math.floor(wrap(z, TL)/SEG) % N];
  function proj(o, wy, wz, cx, cy, cz){ o.cz = wz - cz; o.sc = DEPTH/o.cz; o.x = W/2 - o.sc*cx*W/2; o.y = H/2 - o.sc*(wy - cy)*H/2; o.w = o.sc*ROADW*W/2; }
  function poly(x1, y1, x2, y2, x3, y3, x4, y4, col){ ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4); ctx.closePath(); ctx.fill(); }
  // a hover car seen from behind: (x, y) is where it floats over the road, w its width in pixels
  function car(x, y, w, col, who){
    const h = w*.42, hover = y - w*.06;
    const ug = ctx.createRadialGradient(x, y, 1, x, y, w*.6); ug.addColorStop(0, `rgba(${col},.55)`); ug.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = ug; ctx.beginPath(); ctx.ellipse(x, y, w*.6, h*.3, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#241a3c'; rr(x - w*.44, hover - h*.78, w*.88, h*.4, h*.15); ctx.fill();
    if (who) who(x, hover - h*.45);
    else { ctx.fillStyle = 'rgba(140,220,255,.5)'; ctx.beginPath(); ctx.moveTo(x - w*.3, hover - h*.62); ctx.lineTo(x + w*.3, hover - h*.62); ctx.lineTo(x + w*.2, hover - h*.95); ctx.lineTo(x - w*.2, hover - h*.95); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = `rgb(${col})`; rr(x - w/2, hover - h*.55, w, h*.42, h*.14); ctx.fill();
    ctx.fillStyle = '#1a1030'; rr(x - w*.46, hover - h*.3, w*.92, h*.2, h*.08); ctx.fill();
    ctx.fillStyle = '#ff4a6a'; rr(x - w*.42, hover - h*.46, w*.2, h*.09, 2); ctx.fill(); rr(x + w*.22, hover - h*.46, w*.2, h*.09, 2); ctx.fill();
    ctx.fillStyle = `rgba(${col},.9)`; ctx.fillRect(x - w*.4, hover - h*.08, w*.8, Math.max(1, h*.05));
    // a spoiler on top
    ctx.fillStyle = '#1a1030'; ctx.fillRect(x - w*.47, hover - h*.86, w*.94, h*.08); ctx.fillRect(x - w*.36, hover - h*.8, w*.04, h*.25); ctx.fillRect(x + w*.32, hover - h*.8, w*.04, h*.25);
  }
  function drawSprite(sp, x, y, f){
    // f turns world units into pixels at this distance
    if (sp.k === 'post'){ const h = 1500*f, w = Math.max(1, 70*f); ctx.fillStyle = '#231440'; ctx.fillRect(x - w/2, y - h, w, h);
      ctx.strokeStyle = `rgba(${sp.col},.3)`; ctx.lineWidth = Math.max(2, 90*f); ctx.beginPath(); ctx.moveTo(x - 260*f, y - h); ctx.lineTo(x + 260*f, y - h); ctx.stroke();
      ctx.strokeStyle = `rgb(${sp.col})`; ctx.lineWidth = Math.max(1, 30*f); ctx.stroke(); }
    else if (sp.k === 'tower'){ const h = sp.h*f, w = sp.w*f; ctx.fillStyle = '#1c1034'; ctx.fillRect(x - w/2, y - h, w, h);
      ctx.strokeStyle = `rgba(${sp.col},.8)`; ctx.lineWidth = Math.max(1, 30*f); ctx.strokeRect(x - w/2, y - h, w, h);
      const cw = Math.max(2, 90*f), ch = Math.max(2, 130*f), gx = Math.max(4, 240*f), gy = Math.max(5, 320*f);
      if (gx > 5) for (let yy = y - h + gy; yy < y - gy; yy += gy) for (let xx = x - w/2 + gx*.6; xx < x + w/2 - gx*.4; xx += gx) if (hash(xx*.01 + yy*.013 + sp.s*9) > .5){ ctx.fillStyle = hash(xx + yy + sp.s) > .5 ? 'rgba(255,230,140,.7)' : 'rgba(120,220,255,.6)'; ctx.fillRect(xx, yy, cw, ch); } }
    else if (sp.k === 'sign'){ const w = 1900*f, h = 700*f, top = y - 1300*f - h; ctx.fillStyle = '#231440'; ctx.fillRect(x - w*.35, top + h, 60*f, 1300*f); ctx.fillRect(x + w*.35 - 60*f, top + h, 60*f, 1300*f);
      ctx.fillStyle = 'rgba(14,8,30,.92)'; ctx.fillRect(x - w/2, top, w, h); ctx.strokeStyle = `rgb(${sp.col})`; ctx.lineWidth = Math.max(1, 40*f); ctx.strokeRect(x - w/2, top, w, h);
      const fs = h*.45; if (fs > 5){ ctx.font = `700 ${fs}px "Pixelify Sans", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = `rgba(${sp.col},.35)`; ctx.fillText(sp.txt, x + 2, top + h/2 + 2); ctx.fillStyle = `rgb(${sp.col})`; ctx.fillText(sp.txt, x, top + h/2); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; } }
    else if (sp.k === 'arrow'){ const w = 700*f, h = 420*f, top = y - 500*f - h; ctx.fillStyle = '#231440'; ctx.fillRect(x - 30*f, top + h, 60*f, 500*f);
      ctx.fillStyle = '#ffe66e'; ctx.fillRect(x - w/2, top, w, h); ctx.fillStyle = '#1a1030';
      for (let k=0;k<2;k++){ const cx = x + (k - .5)*w*.36, d = sp.dir; ctx.beginPath(); ctx.moveTo(cx - d*w*.12, top + h*.15); ctx.lineTo(cx + d*w*.12, top + h/2); ctx.lineTo(cx - d*w*.12, top + h*.85); ctx.lineTo(cx - d*w*.02, top + h/2); ctx.closePath(); ctx.fill(); } }
    else if (sp.k === 'boost'){ const w = 600*f, h = Math.max(2, 120*f), pulse = .6 + .4*Math.sin(t*10);
      ctx.fillStyle = `rgba(90,220,255,${.35*pulse})`; ctx.beginPath(); ctx.ellipse(x, y - h/2, w*.7, h*1.4, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(90,220,255,.85)'; rr(x - w/2, y - h, w, h, Math.min(h/2, 6)); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, 25*f); ctx.beginPath(); for (let k=-1;k<=1;k++){ ctx.moveTo(x + k*w*.25 - w*.08, y - h*.2); ctx.lineTo(x + k*w*.25, y - h*.8); ctx.lineTo(x + k*w*.25 + w*.08, y - h*.2); } ctx.stroke(); }
    else if (sp.k === 'chip'){ const r = 110*f, cy = y - 350*f + Math.sin(t*4 + x*.01)*40*f;
      const cg = ctx.createRadialGradient(x, cy, 1, x, cy, r*2.2); cg.addColorStop(0, 'rgba(255,230,110,.7)'); cg.addColorStop(1, 'rgba(255,230,110,0)'); ctx.fillStyle = cg; circle(x, cy, r*2.2);
      const sq = Math.abs(Math.cos(t*3 + x*.02)); ctx.fillStyle = '#ffe66e'; ctx.beginPath(); ctx.moveTo(x, cy - r); ctx.lineTo(x + r*sq, cy); ctx.lineTo(x, cy + r); ctx.lineTo(x - r*sq, cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.moveTo(x, cy - r*.5); ctx.lineTo(x + r*sq*.5, cy); ctx.lineTo(x, cy + r*.5); ctx.lineTo(x - r*sq*.5, cy); ctx.closePath(); ctx.fill(); }
  }
  return {
    title:'Neon Grand Prix', sub:'Race hover cars through the streets of Neon City.',
    blurb:'The garage robot tossed you the keys to a hover car! Race three laps through the glowing streets against seven rivals, and finish in the top three to make the podium.',
    legend:['Your car speeds up by itself', '← → to steer, ↓ to brake', 'Lean into the curves so you don’t slide off the road', 'Drive over the blue pads for a boost', 'Grab the gold chips', 'Finish 1st, 2nd or 3rd to win'],
    hints:['← → to steer, ↓ to brake', 'P to pause'], pad:['wgLeft', 'wgDown', 'wgRight'],
    winTitle:'Podium finish!', winText:'The crowd cheers as you glide over the finish line.',
    loseTitle:'Off the podium', loseText:'So close! The garage robot pats your car. “Next time!”',
    reset(){ pos = 0; px = 0; speed = 0; skyOff = 0; boost = 0; chips = 0; bumpT = 0; lap = 1; done = false; doneT = 0; place = 8; steerV = 0;
      const sp = [.9, .85, .8, .76, .72, .68, .64];
      rivals = RIVAL_COLS.map((col, i) => ({ col, z:PLAYERZ + SEG*(3 + Math.floor((6 - i)/2)*4) + (i % 2)*SEG, off:i % 2 ? .45 : -.45, lane:i % 2 ? .45 : -.45, v:0, top:sp[i]*MAXV, ph:i*1.7 }));
      for (const s of segs) for (const o of s.sprites) if (o.k === 'chip') o.got = 0; },
    seeds:() => chips + Math.max(0, 4 - place)*4, stats:() => `<span>Finished ${ord(place)}</span><span>Chips ${chips}</span><span>Time ${time.toFixed(1)} s</span>`,
    end:() => place === 1 ? { title:'You win the Grand Prix!', text:'First across the line! Fireworks burst over the towers, and the garage robot hands you a shiny golden trophy.' }
      : place <= 3 ? { title:`Podium finish, ${ord(place)}!`, text:'The crowd cheers as you glide onto the podium under the neon lights.' }
      : { title:`You finished ${ord(place)}`, text:'So close! The garage robot pats your car. “Make the top three next time!”' },
    update(dt){
      time += dt;
      const go = time > 3 && !done, pct = speed/MAXV;
      const pSeg = segAt(pos + PLAYERZ);
      // steering, and the curves pulling you toward the outside
      const steer = go ? (input.right ? 1 : 0) - (input.left ? 1 : 0) : 0;
      steerV += (steer - steerV)*Math.min(1, dt*8);
      px += steer*dt*2.2*pct;
      px -= dt*2*pct*pct*pSeg.curve*.32;
      if (done){ speed *= Math.pow(.3, dt); px *= Math.pow(.3, dt); }
      else if (!go) speed = 0;
      else if (input.down) speed -= MAXV*1.2*dt;
      else speed += MAXV*.3*dt;
      boost = Math.max(0, boost - dt); bumpT = Math.max(0, bumpT - dt);
      const top = boost > 0 ? MAXV*1.4 : MAXV;
      if (speed > top) speed = Math.max(top, speed - MAXV*.6*dt);
      if (Math.abs(px) > 1 && speed > MAXV*.3) speed -= MAXV*.9*dt;   // bumpy and slow off the road
      speed = Math.max(0, speed); px = clamp(px, -2.2, 2.2);
      const was = pos + PLAYERZ;
      pos += speed*dt;
      skyOff += pSeg.curve*speed*dt/SEG*1.5;
      // what you run over, and what you run into (every segment passed this frame, so nothing is skipped at top speed)
      for (let k = Math.floor(was/SEG); k <= Math.floor((pos + PLAYERZ)/SEG); k++) for (const sp of segs[k % N].sprites){
        const d = Math.abs(px - sp.off);
        if (sp.k === 'chip' && sp.got !== lap && d < .3){ sp.got = lap; chips++; anim.chew = .3; pop(W/2, H - 170, '+1', '#ffe66e'); }
        else if (sp.k === 'boost' && d < .35 && boost < 1){ boost = 1.6; speed = Math.max(speed, MAXV*1.25); pop(W/2, H - 170, 'Boost!', '#5adcff'); }
        else if (sp.solid && d < .22 && bumpT <= 0){ speed = Math.min(speed, MAXV*.2); px += sp.off > px ? -.2 : .2; bumpT = .5; shake = .3; pop(W/2, H - 170, 'Clonk!', '#ffd0d3'); }
      }
      // the rivals: each has its own top speed, drifts around its lane and eases off in tight curves
      const me = pos + PLAYERZ;
      for (const c of rivals){
        if (time > 3){ const s = segAt(c.z), ahead = c.z - me > SEG*25 ? .93 : 1; c.v += (c.top*ahead*(1 - Math.abs(s.curve)*.02) - c.v)*Math.min(1, dt*.6); }
        c.z += c.v*dt; c.off = c.lane + Math.sin(c.z*.00012 + c.ph)*.3;
        const dz = c.z - me;
        if (dz > 0 && dz < SEG*1.4 && speed > c.v && Math.abs(px - c.off) < .5 && bumpT <= 0){ speed = c.v*.75; bumpT = .5; shake = .3; pop(W/2, H - 170, 'Bump!', '#ffd0d3'); }
      }
      if (!done){
        place = 1 + rivals.filter(c => c.z > me).length;
        const nl = Math.min(LAPS, Math.floor(pos/TL) + 1);
        if (nl > lap){ lap = nl; pop(W/2, 150, lap === LAPS ? 'Final lap!' : `Lap ${lap}!`, '#ff9ae8'); }
        if (pos >= LAPS*TL){ done = true; doneT = 0; anim.happy = 4; pop(W/2, 150, place <= 3 ? `${ord(place)} place!` : `${ord(place)}…`, place <= 3 ? '#ffe66e' : '#fff6e4'); }
      } else { doneT += dt; if (doneT > 1.8) finish(place <= 3); }
    },
    draw(){
      const p = wrap(pos, TL), base = segAt(p), bpct = (p % SEG)/SEG, pSeg = segAt(p + PLAYERZ), ppct = ((p + PLAYERZ) % SEG)/SEG;
      const camY = CAMH + pSeg.y1 + (pSeg.y2 - pSeg.y1)*ppct, curLap = Math.min(LAPS, Math.floor(pos/TL) + 1);
      // the night sky, the ringed planet and the far skyline, sliding sideways in the curves
      const g = ctx.createLinearGradient(0, 0, 0, H/2 + 40); g.addColorStop(0, '#0b0620'); g.addColorStop(.6, '#2a0f4a'); g.addColorStop(1, '#6a1f6a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i=0;i<60;i++){ ctx.fillStyle = `rgba(255,255,255,${.3 + .5*Math.max(0, Math.sin(t*1.3 + i))})`; circle(wrap(hash(i)*1200 - skyOff*.2, 1200) - 200, 50 + hash(i + 5)*150, hash(i + 2)*1.2 + .4); }
      { const x = wrap(560 - skyOff*.3, 1400) - 300; const pg = ctx.createRadialGradient(x, 120, 20, x, 120, 110); pg.addColorStop(0, 'rgba(90,160,255,.35)'); pg.addColorStop(1, 'rgba(90,160,255,0)'); ctx.fillStyle = pg; circle(x, 120, 110);
        ctx.fillStyle = '#3a6ad0'; circle(x, 120, 46); ctx.strokeStyle = 'rgba(160,230,255,.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, 120, 80, 15, -.18, 0, 7); ctx.stroke(); }
      for (const tw of SKYLINE){ const x = wrap(tw.x - skyOff*.6, 1500) - 200, bot = H/2 + 30, top = bot - tw.h; if (x < -80 || x > W + 10) continue;
        ctx.fillStyle = '#1a1030'; ctx.fillRect(x, top, tw.w, tw.h);
        for (let y = top + 6; y < bot - 4; y += 10) for (let wx = 4; wx < tw.w - 4; wx += 7) if (hash(wx*.3 + y*.7 + tw.s*9) > .62){ ctx.fillStyle = hash(wx + y) > .5 ? 'rgba(255,230,140,.6)' : 'rgba(120,220,255,.5)'; ctx.fillRect(x + wx, y, 3, 4); }
        if (tw.s > .7){ ctx.fillStyle = `rgba(255,80,80,${.4 + .6*Math.max(0, Math.sin(t*3 + tw.s*9))})`; circle(x + tw.w/2, top - 4, 2.5); } }
      // the road, from near to far; each segment remembers how far down the screen it may draw
      let maxy = H, x = 0, dx = -base.curve*bpct;
      for (let n=0;n<DRAWN;n++){
        const s = segs[(base.i + n) % N], camZ = p - (s.i < base.i ? TL : 0);
        proj(s.s1, s.y1, s.i*SEG, px*ROADW - x, camY, camZ);
        proj(s.s2, s.y2, (s.i + 1)*SEG, px*ROADW - x - dx, camY, camZ);
        x += dx; dx += s.curve; s.clip = maxy; s.n = n;
        const a = s.s1, b = s.s2;
        if (a.cz <= DEPTH || b.y >= a.y || b.y >= maxy) continue;
        const alt = Math.floor(s.i/RUMBLE) % 2, fog = Math.min(.85, Math.pow(n/DRAWN, 1.6)*1.1);
        ctx.fillStyle = alt ? '#140a26' : '#190c2e'; ctx.fillRect(0, b.y, W, a.y - b.y + 1);
        if (s.i % 4 === 0){ ctx.fillStyle = 'rgba(255,106,213,.35)'; ctx.fillRect(0, b.y, W, Math.max(1, (a.y - b.y)*.25)); }
        const r1 = a.w*.12, r2 = b.w*.12;
        poly(a.x - a.w - r1, a.y, a.x - a.w, a.y, b.x - b.w, b.y, b.x - b.w - r2, b.y, alt ? '#ff6ad5' : '#5adcff');
        poly(a.x + a.w + r1, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x + b.w + r2, b.y, alt ? '#ff6ad5' : '#5adcff');
        poly(a.x - a.w, a.y, a.x + a.w, a.y, b.x + b.w, b.y, b.x - b.w, b.y, alt ? '#2c2148' : '#272040');
        if (s.i < 3){ for (let c=0;c<10;c++){ if ((c + s.i) % 2) continue; const k1 = -1 + c*.2, k2 = k1 + .2; poly(a.x + a.w*k1, a.y, a.x + a.w*k2, a.y, b.x + b.w*k2, b.y, b.x + b.w*k1, b.y, '#f6f0ff'); } }
        else if (alt){ const l1 = a.w/40, l2 = b.w/40; for (const k of [-1/3, 1/3]) poly(a.x + a.w*k - l1, a.y, a.x + a.w*k + l1, a.y, b.x + b.w*k + l2, b.y, b.x + b.w*k - l2, b.y, 'rgba(255,255,255,.55)'); }
        if (fog > .02){ ctx.fillStyle = `rgba(40,12,60,${fog})`; ctx.fillRect(0, b.y, W, a.y - b.y + 1); }
        maxy = b.y;
      }
      // everything standing on the road, from far to near, cut off where a hill hides it
      const carsAt = {};
      for (const c of rivals){ const s = segAt(c.z), n = (s.i - base.i + N) % N; if (n >= 1 && n < DRAWN) (carsAt[s.i] = carsAt[s.i] || []).push(c); }
      for (let n = DRAWN - 1; n >= 1; n--){
        const s = segs[(base.i + n) % N], a = s.s1, b = s.s2;
        if (a.cz <= DEPTH) continue;
        const list = carsAt[s.i]; if (!s.sprites.length && !list) continue;
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, s.clip); ctx.clip();
        const f = a.sc*W/2, fog = Math.min(1, Math.pow(n/DRAWN, 1.6)*1.1);
        ctx.globalAlpha = 1 - fog*.8;
        for (const sp of s.sprites){ if (sp.k === 'chip' && sp.got === curLap) continue; drawSprite(sp, a.x + f*sp.off*ROADW, a.y, f); }
        if (list) for (const c of list){ const k = (wrap(c.z, TL) % SEG)/SEG, sc = a.sc + (b.sc - a.sc)*k, cf = sc*W/2, cx = a.x + (b.x - a.x)*k + cf*c.off*ROADW, cy = a.y + (b.y - a.y)*k; car(cx, cy, CARW*cf, c.col); }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      // speed streaks when you're boosting
      if (boost > 0 && !reduceMotion){ ctx.strokeStyle = `rgba(160,240,255,${.5*Math.min(1, boost)})`; ctx.lineWidth = 2; ctx.beginPath();
        for (let i=0;i<24;i++){ const q = hash(i)*Math.PI*2, k = wrap(t*3 + hash(i + 3), 1), r0 = 120 + k*400; ctx.moveTo(W/2 + Math.cos(q)*r0, H/2 + Math.sin(q)*r0*.6); ctx.lineTo(W/2 + Math.cos(q)*(r0 + 60), H/2 + Math.sin(q)*(r0 + 60)*.6); } ctx.stroke(); }
      // your car, with you in the driver's seat
      { const off = Math.abs(px) > 1 && speed > 100, bob = (off ? (Math.random() - .5)*6 : Math.sin(t*6)*1.5), cx = W/2, cy = H - 22 + bob;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(steerV*.06);
        // you, seen from behind, sitting in the driver's seat (leaning into the turns)
        car(0, 0, 200, '255,106,213', (hx, hy) => {
          if (CHIN_BACK.complete && CHIN_BACK.naturalWidth){ const S = 118; ctx.save(); ctx.translate(hx, hy + 10); ctx.rotate(steerV*.12); ctx.drawImage(CHIN_BACK, -S*.586, -S*.9, S, S); ctx.restore(); }
          else Chin.draw(ctx, 'me', anim, hx, hy, { scale:.06, face:1, grounded:true, speed:0 });
        });
        if (boost > 0){ for (const ex of [-60, 60]){ const fl = 18 + Math.random()*14; const fg = ctx.createRadialGradient(ex, -24, 1, ex, -24, fl); fg.addColorStop(0, 'rgba(255,255,255,.9)'); fg.addColorStop(.4, 'rgba(90,220,255,.8)'); fg.addColorStop(1, 'rgba(90,220,255,0)'); ctx.fillStyle = fg; circle(ex, -24, fl); } }
        ctx.restore(); }
      // 3, 2, 1, Go!
      if (time < 3.7){ const n = Math.ceil(3 - time), txt = n > 0 ? String(n) : 'GO!', k = time < 3 ? 1 - ((3 - time) % 1) : 1;
        ctx.fillStyle = n > 0 ? '#fff6e4' : '#82ffa0'; ctx.font = `700 ${60 + k*24}px "Pixelify Sans", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(20,8,40,.8)'; ctx.strokeText(txt, W/2, 190); ctx.fillText(txt, W/2, 190); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
      drawPops(0);
    },
    hud(){
      hudBar();
      ctx.fillStyle = '#fff6e4'; ctx.fillText(`Lap ${lap}/${LAPS}`, 24, 31);
      ctx.fillStyle = place <= 3 ? '#ffe66e' : '#fff6e4'; ctx.fillText(`${ord(place)}/8`, 130, 31);
      ctx.fillStyle = '#ffe66e'; ctx.fillText(`◆ ${chips}`, 220, 31);
      progress(pos/(LAPS*TL), '#ff6ad5');
      ctx.fillStyle = boost > 0 ? '#5adcff' : '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`${Math.round(speed/MAXV*180)} km/h`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ pos += 3500*dt; },
  };
})();

// ================= Starry Nebula: Ride the Star Whale =================
// Ride on the star whale's back through the nebula. Swim through the stars of each
// constellation to light it up, snack on star-krill, and steer clear of the space jellies.
const WHALE = (() => {
  const GOAL = 7800, SPEED = 165, NEED = 3;
  const SHAPES = [
    { name:'The Teacup',    pts:[[0,.3],[.2,.9],[.7,.9],[.9,.3],[1,.5],[.95,.7]] },
    { name:'The Kite',      pts:[[.5,0],[.9,.4],[.5,.8],[.1,.4],[.3,1]] },
    { name:'The Acorn',     pts:[[.2,.2],[.8,.2],[.5,0],[.85,.55],[.5,1],[.15,.55]] },
    { name:'The Crown',     pts:[[0,1],[0,.2],[.3,.6],[.5,0],[.7,.6],[1,.2],[1,1]] },
    { name:'The Little Fox', pts:[[0,.2],[.25,.45],[.5,.2],[.45,.75],[.8,.8],[1,.5]] },
    { name:'The Chinchilla', pts:[[.1,.1],[.3,.35],[.2,.7],[.6,.95],[.95,.6],[.7,.3],[.45,.3]] },
  ];
  let wx, wy, vx, vy, dist, hearts, krill, lit, cons, jellies, swarms, inv, done, doneT, sparks, spoutT;
  function build(){
    const r = rng(333); cons = []; jellies = []; swarms = [];
    SHAPES.forEach((s, i) => { const x0 = 700 + i*1150, y0 = 90 + r()*170, w = 230, h = 150;
      cons.push({ name:s.name, done:false, t:0, stars:s.pts.map(([u, v]) => ({ x:x0 + u*w, y:y0 + v*h, on:false })) }); });
    for (let x = 1100; x < GOAL - 300; x += 380 + r()*260) jellies.push({ x, y0:100 + r()*300, ph:r()*6, amp:30 + r()*50, col:r() < .5 ? '255,140,220' : '140,220,255' });
    for (let x = 500; x < GOAL - 200; x += 520 + r()*300){ const y = 90 + r()*320; for (let i=0;i<7;i++) swarms.push({ x:x + (r() - .5)*80, y:y + (r() - .5)*60, got:false, ph:r()*6 }); }
  }
  const inWhale = (px, py, rx, ry) => { const dx = (px - (wx + 10))/rx, dy = (py - wy)/ry; return dx*dx + dy*dy < 1; };
  function drawWhale(x, y, blink){
    ctx.save(); ctx.translate(x, y); ctx.rotate(clamp(vy/900, -.2, .2));
    const gl = ctx.createRadialGradient(0, 0, 10, 0, 0, 170); gl.addColorStop(0, 'rgba(120,160,255,.35)'); gl.addColorStop(1, 'rgba(120,160,255,0)'); ctx.fillStyle = gl; circle(0, 0, 170);
    const fl = reduceMotion ? 0 : Math.sin(t*3)*14;
    const bg = ctx.createLinearGradient(0, -50, 0, 50); bg.addColorStop(0, '#6f8ce8'); bg.addColorStop(1, '#3a4aa8');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(-100, -4); ctx.quadraticCurveTo(-150, -34 + fl, -178, -30 + fl); ctx.quadraticCurveTo(-160, 0, -178, 30 + fl); ctx.quadraticCurveTo(-150, 30 + fl, -100, 10); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0, 118, 46, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b8c8ff'; ctx.beginPath(); ctx.ellipse(10, 22, 96, 20, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = 'rgba(58,74,168,.5)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=0;i<5;i++){ ctx.moveTo(-40 + i*22, 26); ctx.lineTo(-36 + i*22, 40); } ctx.stroke();
    ctx.fillStyle = '#4a5ac0'; ctx.beginPath(); ctx.moveTo(20, 24); ctx.quadraticCurveTo(10, 60 - fl*.5, -20, 58 - fl*.5); ctx.quadraticCurveTo(0, 40, 0, 24); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i=0;i<26;i++){ const a = .4 + .6*Math.max(0, Math.sin(t*2 + i)); ctx.globalAlpha = a; circle(-95 + hash(i)*190, -32 + hash(i + 4)*44, hash(i + 9)*1.8 + .6); } ctx.globalAlpha = 1;
    ctx.fillStyle = '#e8f0ff'; circle(78, -6, 7); ctx.fillStyle = '#1a1a3a'; if (blink) ctx.fillRect(72, -6, 12, 2); else circle(80, -6, 3.5);
    ctx.strokeStyle = '#1a1a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(96, 8, 12, .2, 1.3); ctx.stroke();
    ctx.fillStyle = 'rgba(255,150,190,.5)'; circle(88, 12, 5);
    // a little saddle blanket, and you riding on top
    ctx.fillStyle = '#d0452f'; ctx.beginPath(); ctx.ellipse(-4, -40, 30, 9, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#f2c230'; ctx.fillRect(-32, -42, 56, 3);
    Chin.draw(ctx, 'me', anim, -4, -40, { scale:.07, face:1, grounded:true, speed:0 });
    ctx.restore();
  }
  function jelly(j, x, y){
    const pulse = reduceMotion ? 0 : Math.sin(t*3 + j.ph)*3;
    const g = ctx.createRadialGradient(x, y, 2, x, y, 44); g.addColorStop(0, `rgba(${j.col},.4)`); g.addColorStop(1, `rgba(${j.col},0)`); ctx.fillStyle = g; circle(x, y, 44);
    ctx.fillStyle = `rgba(${j.col},.75)`; ctx.beginPath(); ctx.ellipse(x, y, 22 + pulse, 16 - pulse*.5, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(${j.col},.6)`; ctx.lineWidth = 2; ctx.beginPath();
    for (let i=0;i<5;i++){ const tx = x - 16 + i*8; ctx.moveTo(tx, y); for (let k=1;k<=4;k++) ctx.lineTo(tx + Math.sin(t*4 + i + k)*4, y + k*8); } ctx.stroke();
    ctx.fillStyle = '#2a1a3a'; circle(x - 6, y - 6, 1.8); circle(x + 6, y - 6, 1.8);
  }
  return {
    title:'Ride the Star Whale', sub:'Swim through the constellations of the Starry Nebula.',
    blurb:'The star whale swam down and let you climb onto its back! Ride it through the nebula and swim through every star of a constellation to light it up. Light at least 3 constellations before the whale reaches the Singing Gate.',
    legend:['↑ ↓ ← → to steer the whale', 'Swim through all the stars of a constellation to light it up', 'Light at least 3 of the 6 constellations', 'Munch star-krill for seeds', 'Avoid the space jellies (3 hearts)'],
    hints:['Arrow keys to swim', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgUp', 'wgDown'],
    winTitle:'The whale sings!', winText:'The Singing Gate glows with every constellation you lit, and the whale hums a song so deep the whole nebula shimmers.',
    loseTitle:'The whale swims home', loseText:'The whale gently carries you back to the floating island. Try again another time!',
    againWinText:'The whale sings its thanks, and all your constellations twinkle overhead.', againLoseText:'The whale gently carries you back to the floating island. It’ll wait for you!',
    reset(){ build(); wx = 230; wy = 240; vx = 0; vy = 0; dist = 0; hearts = 3; krill = 0; lit = 0; inv = 0; done = false; doneT = 0; sparks = []; spoutT = 2; },
    seeds:() => Math.floor(krill/3) + lit*3, stats:() => `<span>Constellations ${lit}/6</span><span>Star-krill ${krill}</span><span>Time ${time.toFixed(0)} s</span>`,
    end:() => done && lit < NEED ? { title:'Not enough stars…', text:`You lit ${lit} of the ${NEED} constellations the Singing Gate needs. The whale nuzzles you: “Again tomorrow?”` } : null,
    update(dt){
      time += dt;
      if (done){ doneT += dt; dist += SPEED*dt; wx += 120*dt; if (doneT > 1.8) finish(lit >= NEED); return; }
      const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0), ay = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      vx += ax*900*dt; vy += ay*900*dt; vx *= Math.pow(.08, dt); vy *= Math.pow(.08, dt);
      wx = clamp(wx + vx*dt, 190, 460); wy = clamp(wy + vy*dt, 140, 420);
      dist += SPEED*dt; inv = Math.max(0, inv - dt);
      // stars, in world space
      for (const c of cons){ if (c.done){ c.t += dt; continue; }
        for (const s of c.stars) if (!s.on && inWhale(s.x - dist, s.y, 135, 60)){ s.on = true; sparks.push({ x:s.x, y:s.y, life:.6 }); }
        if (c.stars.every(s => s.on)){ c.done = true; lit++; anim.happy = 2; pop(wx + dist, wy - 90, `${c.name}!`, '#ffe9a8'); }
      }
      for (const k of swarms) if (!k.got && inWhale(k.x - dist, k.y, 125, 55)){ k.got = true; krill++; anim.chew = .3; }
      for (const j of jellies){ const x = j.x - dist, y = j.y0 + Math.sin(t*.9 + j.ph)*j.amp; if (inv <= 0 && inWhale(x, y + 10, 118, 44)){ hearts--; inv = 1.6; shake = .35; vy = (wy < y ? -1 : 1)*300; pop(wx + dist, wy - 70, 'Zap!', '#ffd0d3'); if (hearts <= 0) finish(false); } }
      spoutT -= dt; if (spoutT <= 0){ spoutT = 3 + Math.random()*3; for (let i=0;i<12;i++) sparks.push({ x:wx + dist + 40, y:wy - 40, vx:(Math.random() - .5)*80, vy:-80 - Math.random()*80, life:1 }); }
      sparks.forEach(s => { s.life -= dt; if (s.vx !== undefined){ s.x += s.vx*dt; s.y += s.vy*dt; s.vy += 60*dt; } }); sparks = sparks.filter(s => s.life > 0);
      if (dist >= GOAL){ done = true; doneT = 0; }
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0820'); g.addColorStop(.6, '#241650'); g.addColorStop(1, '#3a2266');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const [cx, cy, r, c] of [[300, 120, 200, '224,138,200'], [800, 340, 220, '138,106,224'], [1300, 160, 180, '100,180,220']]){ const x = wrap(cx - dist*.08, 1600) - 300, ng = ctx.createRadialGradient(x, cy, 10, x, cy, r); ng.addColorStop(0, `rgba(${c},.28)`); ng.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = ng; circle(x, cy, r); }
      for (let i=0;i<110;i++){ const par = .1 + hash(i)*.4; ctx.fillStyle = `rgba(255,250,255,${.3 + .5*Math.max(0, Math.sin(t + i))})`; circle(wrap(hash(i + 3)*1600 - dist*par, W + 20) - 10, hash(i + 7)*H, hash(i + 1)*1.3 + .4); }
      // a ringed planet drifting far behind
      { const x = wrap(900 - dist*.05, 1700) - 250; ctx.fillStyle = '#d88a6a'; circle(x, 380, 44); ctx.strokeStyle = 'rgba(255,220,200,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, 380, 78, 14, -.3, 0, 7); ctx.stroke(); }
      // constellations
      for (const c of cons){ const x0 = c.stars[0].x - dist; if (x0 < -400 || x0 > W + 300) continue;
        ctx.strokeStyle = c.done ? 'rgba(255,240,200,.75)' : 'rgba(200,190,255,.18)'; ctx.lineWidth = c.done ? 2.5 : 1.5; ctx.setLineDash(c.done ? [] : [4, 6]); ctx.beginPath();
        c.stars.forEach((s, i) => { const x = s.x - dist; i ? ctx.lineTo(x, s.y) : ctx.moveTo(x, s.y); }); ctx.stroke(); ctx.setLineDash([]);
        for (const s of c.stars){ const x = s.x - dist, r = s.on ? 7 : 4.5, sg = ctx.createRadialGradient(x, s.y, 1, x, s.y, r*4); sg.addColorStop(0, s.on ? 'rgba(255,240,180,.9)' : 'rgba(200,200,255,.5)'); sg.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = sg; circle(x, s.y, r*4);
          ctx.fillStyle = s.on ? '#fff6c8' : '#c8c0ff'; ctx.beginPath(); for (let k=0;k<10;k++){ const a = -Math.PI/2 + k*Math.PI/5, rr2 = k % 2 ? r*.45 : r*1.3; k ? ctx.lineTo(x + Math.cos(a)*rr2, s.y + Math.sin(a)*rr2) : ctx.moveTo(x + Math.cos(a)*rr2, s.y + Math.sin(a)*rr2); } ctx.closePath(); ctx.fill(); }
        if (c.done && c.t < 3){ ctx.globalAlpha = Math.min(1, 3 - c.t); ctx.fillStyle = '#ffe9a8'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(c.name, x0 + 110, c.stars.reduce((m, s) => Math.max(m, s.y), 0) + 30); ctx.textAlign = 'left'; ctx.globalAlpha = 1; } }
      for (const k of swarms){ if (k.got) continue; const x = k.x - dist + Math.sin(t*2 + k.ph)*5, y = k.y + Math.cos(t*2.3 + k.ph)*5; if (x < -10 || x > W + 10) continue; ctx.fillStyle = 'rgba(160,255,220,.9)'; circle(x, y, 2.6); ctx.fillStyle = 'rgba(160,255,220,.25)'; circle(x, y, 7); }
      for (const j of jellies){ const x = j.x - dist; if (x < -60 || x > W + 60) continue; jelly(j, x, j.y0 + Math.sin(t*.9 + j.ph)*j.amp); }
      // the Singing Gate
      { const x = GOAL + 300 - dist; if (x < W + 200){ for (let i=0;i<5;i++){ ctx.strokeStyle = `rgba(${i < lit ? '255,240,180' : '160,140,220'},${.8 - i*.12})`; ctx.lineWidth = 7 - i; ctx.beginPath(); ctx.ellipse(x, 250, 70 + i*16, 180 + i*16, 0, 0, 7); ctx.stroke(); } } }
      for (const s of sparks){ ctx.fillStyle = `rgba(255,250,220,${s.life})`; circle(s.x - dist, s.y, 2.5); }
      if (!(inv > 0 && Math.floor(inv*10) % 2 === 0)) drawWhale(wx, wy, Math.sin(t*.7) > .96);
      drawPops(dist);
    },
    hud(){
      hudBar(); for (let i=0;i<3;i++) heart(30 + i*28, 30, i < hearts);
      ctx.fillStyle = lit >= NEED ? '#ffe066' : '#fff6e4'; ctx.fillText(`✦ ${lit}/6`, 116, 31);
      ctx.fillStyle = '#a0ffdc'; ctx.fillText(`${krill}`, 212, 31); circle(202, 30, 3);
      progress(dist/GOAL, '#8aa0ff');
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`need ${NEED}`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ dist += 60*dt; wy = 240 + Math.sin(t)*30; if (dist > GOAL - 1000) dist = 0; },
  };
})();

// ================= Starry Nebula: the Cosmic Carnival =================
// An amusement park on a floating island. Zib the alien has a mission for every ride:
//   Comet Coaster:  hop to grab 12 star tickets in one ride
//   Planet Wheel:   spot 5 of Zib's cousins peeking out of the cabins (not the teddies!)
//   UFO Ring Toss:  ring 4 flying saucers with 8 rings
// Each ride costs a token. Finish all three missions before your tokens run out.
function alien(x, y, s, col, wave){
  col = col || '#7ee06a';
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -40); ctx.quadraticCurveTo(-14, -56, -18, -60); ctx.moveTo(8, -40); ctx.quadraticCurveTo(14, -56, 18, -60); ctx.stroke();
  ctx.fillStyle = '#ffe066'; circle(-18, -61, 4); circle(18, -61, 4);
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -26, 24, 20, 0, 0, 7); ctx.fill();
  rr(-16, -10, 32, 30, 10); ctx.fill();
  if (wave !== undefined){ ctx.save(); ctx.translate(16, -2); ctx.rotate(-1.2 + Math.sin(wave)*.5); rr(-3, -18, 7, 20, 3); ctx.fill(); ctx.restore(); }
  for (const ex of [-10, 0, 10]){ ctx.fillStyle = '#fff'; circle(ex, -30 + (ex ? 0 : -6), 5.5); ctx.fillStyle = '#1a1a2a'; circle(ex + 1, -29 + (ex ? 0 : -6), 2.6); }
  ctx.strokeStyle = '#1a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -18, 7, .3, Math.PI - .3); ctx.stroke();
  ctx.restore();
}
const PARK = (() => {
  const RIDES = [
    { id:'coaster', name:'COMET COASTER', x:150, col:'255,106,213', mission:'Hop on the Comet Coaster and grab 12 star tickets in one ride!', how:'Space / tap to hop. Grab tickets, hop over the space rocks.' },
    { id:'wheel', name:'PLANET WHEEL', x:400, col:'90,220,255', mission:'My cousins are hiding on the Planet Wheel. Spot 5 of them in 30 seconds! (Not the teddies!)', how:'← → to pick a cabin and Space, or tap the cabin.' },
    { id:'toss', name:'UFO RING TOSS', x:650, col:'255,230,110', mission:'Toss rings onto the flying saucers. Ring 4 of them with 8 rings!', how:'← → to aim and Space to throw, or tap where to throw.' },
  ];
  let sub, sel, tokens, done, banner, bT, R, mapT;
  // ---- ride: Comet Coaster ----
  const TL = 5400, CX = 200;
  const ty = x => 330 - 70*Math.sin(x*.006) - 40*Math.sin(x*.017 + 1);
  function startCoaster(){ const r = rng(71 + tokens); const items = [];
    for (let x = 500; x < TL - 300; x += 200 + r()*80){ if (r() < .22) items.push({ k:'rock', x }); else items.push({ k:'ticket', x, up:40 + r()*80 }); }
    R = { x:0, v:300, hy:0, vy:0, tickets:0, items, over:false }; }
  function coaster(dt){
    if (!R.over){
      const slope = (ty(R.x + 5) - ty(R.x - 5))/10;
      R.v += ((300 + 160*slope) - R.v)*Math.min(1, dt*2); R.x += R.v*dt;
      if ((input.pressed || input.click) && R.hy >= 0){ R.vy = -440; R.hy = -1; }
      input.pressed = false; input.click = null;
      if (R.hy < 0){ R.vy += 1150*dt; R.hy += R.vy*dt; if (R.hy >= 0){ R.hy = 0; R.vy = 0; } }
      const cy = ty(R.x) + R.hy;
      for (const it of R.items){ if (it.got || Math.abs(it.x - R.x) > 24) continue;
        if (it.k === 'ticket' && Math.abs((ty(it.x) - it.up) - (cy - 30)) < 36){ it.got = true; R.tickets++; anim.chew = .3; pop(CX, cy - 70, '+1', '#ffe066'); }
        else if (it.k === 'rock' && R.hy > -22){ it.got = true; R.tickets = Math.max(0, R.tickets - 2); shake = .3; pop(CX, cy - 70, 'Bonk! −2', '#ffd0d3'); } }
      if (R.x >= TL){ R.over = true; rideDone(R.tickets >= 12, `${R.tickets} tickets`); }
    }
  }
  function drawCoaster(){
    const cam = R.x - CX;
    sky(); farWheel(620 - cam*.05, 200, .6);
    ctx.strokeStyle = '#5a4a8a'; ctx.lineWidth = 3;
    for (let x = Math.floor(cam/60)*60; x < cam + W + 60; x += 60){ ctx.beginPath(); ctx.moveTo(x - cam, ty(x) + 6); ctx.lineTo(x - cam, H); ctx.stroke(); }
    for (const [off, col, w] of [[0, '#ff6ad5', 5], [10, '#b58ae6', 3]]){ ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (let sx = -10; sx <= W + 10; sx += 8){ const y = ty(sx + cam) + off; sx < 0 ? ctx.moveTo(sx, y) : ctx.lineTo(sx, y); } ctx.stroke(); }
    { const fx = TL - cam; if (fx < W + 40){ ctx.fillStyle = '#fff'; ctx.fillRect(fx - 3, ty(TL) - 90, 6, 90); for (let i=0;i<6;i++){ ctx.fillStyle = i % 2 ? '#1a1030' : '#fff'; ctx.fillRect(fx + 3 + (i % 3)*12, ty(TL) - 90 + Math.floor(i/3)*10, 12, 10); } } }
    for (const it of R.items){ if (it.got) continue; const x = it.x - cam; if (x < -30 || x > W + 30) continue;
      if (it.k === 'ticket'){ const y = ty(it.x) - it.up + Math.sin(t*3 + it.x)*4; ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t*2 + it.x)*.2); ctx.fillStyle = '#ffe066'; rr(-14, -9, 28, 18, 3); ctx.fill(); ctx.fillStyle = '#d0452f'; ctx.font = '700 10px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('★', 0, 4); ctx.textAlign = 'left'; ctx.restore(); }
      else { const y = ty(it.x); ctx.fillStyle = '#6a5a7a'; ctx.beginPath(); for (let a=0;a<8;a++){ const r = 15*(.8 + hash(a + it.x)*.35); ctx.lineTo(x + Math.cos(a/8*Math.PI*2)*r, y - 13 + Math.sin(a/8*Math.PI*2)*r); } ctx.closePath(); ctx.fill(); ctx.fillStyle = '#8a7a9a'; circle(x - 4, y - 17, 5); } }
    const y = ty(R.x) + R.hy, slope = (ty(R.x + 5) - ty(R.x - 5))/10;
    ctx.save(); ctx.translate(CX, y); ctx.rotate(R.hy < 0 ? R.vy/3000 : Math.atan(slope));
    Chin.draw(ctx, 'me', anim, 0, -14, { scale:.06, face:1, grounded:true, speed:0 });
    ctx.fillStyle = '#ff6ad5'; rr(-30, -24, 60, 22, 7); ctx.fill(); ctx.fillStyle = '#ffe066'; ctx.fillRect(-30, -16, 60, 3);
    ctx.fillStyle = '#2a2040'; circle(-18, -2, 5); circle(18, -2, 5);
    ctx.restore();
    ctx.fillStyle = '#fff6e4'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.fillText(`Tickets ${R.tickets}/12`, 24, 76);
    progressBar(R.x/TL);
  }
  // ---- ride: Planet Wheel ----
  const WC = { x:400, y:245, r:165 };
  function startWheel(){ R = { rot:0, cabins:Array.from({ length:8 }, () => null), next:.8, cur:0, found:0, left:30, over:false }; }
  const cabinPos = i => { const a = R.rot + i/8*Math.PI*2; return { x:WC.x + Math.cos(a)*WC.r, y:WC.y + Math.sin(a)*WC.r }; };
  function spot(i){
    const c = R.cabins[i], p = cabinPos(i);
    if (c && c.k === 'alien' && !c.hit){ c.hit = true; c.t = Math.min(c.t, .4); R.found++; anim.happy = 1; pop(p.x, p.y - 40, 'Found one!', '#7ee06a'); }
    else if (c && c.k === 'teddy'){ R.left -= 3; shake = .2; pop(p.x, p.y - 40, 'A teddy! −3 s', '#ffd0d3'); }
    else pop(p.x, p.y - 40, 'Nobody…', 'rgba(230,236,250,.8)');
  }
  function wheel(dt){
    if (R.over) return;
    R.rot += .32*dt; R.left -= dt;
    for (const k of input.taps.splice(0)){ if (k === 'left') R.cur = (R.cur + 7) % 8; if (k === 'right') R.cur = (R.cur + 1) % 8; }
    if (input.pressed){ input.pressed = false; spot(R.cur); }
    if (input.click){ const c = input.click; input.click = null; let best = -1, bd = 60; for (let i=0;i<8;i++){ const p = cabinPos(i), d = Math.hypot(p.x - c.x, p.y + 14 - c.y); if (d < bd){ bd = d; best = i; } } if (best >= 0){ R.cur = best; spot(best); } }
    R.cabins.forEach((c, i) => { if (c){ c.t -= dt; if (c.t <= 0) R.cabins[i] = null; } });
    R.next -= dt; if (R.next <= 0){ R.next = .7 + Math.random()*.6; const free = R.cabins.map((c, i) => c ? -1 : i).filter(i => i >= 0); if (free.length){ const i = free[Math.floor(Math.random()*free.length)]; R.cabins[i] = { k:Math.random() < .72 ? 'alien' : 'teddy', t:1.4, max:1.4 }; } }
    if (R.found >= 5){ R.over = true; rideDone(true, `${R.found} cousins`); } else if (R.left <= 0){ R.over = true; rideDone(false, `${R.found} cousins`); }
  }
  function drawWheel(){
    sky();
    ctx.fillStyle = '#3a2a5a'; ctx.beginPath(); ctx.moveTo(WC.x - 110, H); ctx.lineTo(WC.x, WC.y); ctx.lineTo(WC.x + 110, H); ctx.lineTo(WC.x + 90, H); ctx.lineTo(WC.x, WC.y + 30); ctx.lineTo(WC.x - 90, H); ctx.closePath(); ctx.fill();
    farWheel(WC.x, WC.y, 1, R.rot);
    for (let i=0;i<8;i++){ const p = cabinPos(i), c = R.cabins[i], col = ['255,106,213', '90,220,255', '255,230,110', '130,255,160'][i % 4];
      ctx.strokeStyle = '#8a7ab0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + 8); ctx.stroke();
      if (c){ const k = Math.min(1, (c.max - c.t)*5, c.t*5), py = p.y + 22 - k*26;
        ctx.save(); ctx.beginPath(); ctx.rect(p.x - 30, p.y - 40, 60, 60); ctx.clip();
        if (c.k === 'alien') alien(p.x, py + 18, .55, c.hit ? '#ffe066' : ['#7ee06a', '#6ad0e0', '#e08ae0'][i % 3]);
        else { ctx.fillStyle = '#a0703a'; circle(p.x - 9, py - 12, 6); circle(p.x + 9, py - 12, 6); circle(p.x, py - 2, 12); ctx.fillStyle = '#e0b080'; circle(p.x, py + 2, 5); ctx.fillStyle = '#1a1a1a'; circle(p.x - 4, py - 4, 1.8); circle(p.x + 4, py - 4, 1.8); }
        ctx.restore(); }
      ctx.fillStyle = `rgb(${col})`; rr(p.x - 26, p.y + 8, 52, 26, 8); ctx.fill(); ctx.fillStyle = 'rgba(20,10,40,.35)'; ctx.fillRect(p.x - 22, p.y + 14, 44, 4);
      if (i === R.cur){ ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.ellipse(p.x, p.y + 4, 40, 38, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); } }
    ctx.fillStyle = '#fff6e4'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.fillText(`Cousins ${R.found}/5`, 24, 76); ctx.textAlign = 'right'; ctx.fillStyle = R.left < 8 ? '#ff8a9a' : '#fff6e4'; ctx.fillText(`${Math.max(0, R.left).toFixed(0)} s`, W - 24, 76); ctx.textAlign = 'left';
    alien(700, 460, .8, '#7ee06a', t*4);
  }
  // ---- ride: UFO Ring Toss ----
  function startToss(){ const ufos = []; for (let i=0;i<5;i++) ufos.push({ x:Math.random()*W, lane:i % 3, v:(i % 2 ? 1 : -1)*(90 + Math.random()*90), col:['255,106,213', '90,220,255', '130,255,160'][i % 3], ring:0 }); R = { aim:W/2, rings:8, flying:[], got:0, ufos, over:false, endT:0 }; }
  const laneY = l => 110 + l*70;
  function toss(dt){
    if (R.over) return;
    if (input.left) R.aim -= 320*dt; if (input.right) R.aim += 320*dt; R.aim = clamp(R.aim, 60, W - 60);
    let throwIt = input.pressed; input.pressed = false;
    if (input.click){ R.aim = clamp(input.click.x, 60, W - 60); input.click = null; throwIt = true; }
    if (throwIt && R.rings > 0 && R.flying.length < 2){ R.rings--; R.flying.push({ x:R.aim, y:430, vy:-560, hit:false }); }
    for (const u of R.ufos){ u.x += u.v*dt; if (u.x > W + 60) u.x = -60; if (u.x < -60) u.x = W + 60; if (u.ring){ u.ring += dt; if (u.ring > 1.2){ u.ring = 0; u.x = u.v > 0 ? -60 : W + 60; } } }
    for (const f of R.flying){ f.y += f.vy*dt; f.vy += 180*dt;
      for (const u of R.ufos){ const uy = laneY(u.lane); if (!f.hit && !u.ring && Math.abs(f.x - u.x) < 34 && Math.abs(f.y - uy) < 14){ f.hit = true; u.ring = .01; R.got++; anim.happy = 1; pop(u.x, uy - 30, 'Ringed!', '#ffe066'); } } }
    R.flying = R.flying.filter(f => !f.hit && f.y > 40);
    if (R.got >= 4){ R.over = true; rideDone(true, `${R.got} saucers`); }
    else if (R.rings === 0 && !R.flying.length){ R.endT += dt; if (R.endT > .4){ R.over = true; rideDone(false, `${R.got} saucers`); } }
  }
  function saucer(x, y, col, s){ ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(180,240,255,.6)'; ctx.beginPath(); ctx.ellipse(0, -8, 16, 14, 0, Math.PI, 0); ctx.fill();
    alien(0, 6, .3, '#7ee06a');
    ctx.fillStyle = '#b8c0d8'; ctx.beginPath(); ctx.ellipse(0, 0, 38, 11, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8a90a8'; ctx.beginPath(); ctx.ellipse(0, 4, 30, 6, 0, 0, Math.PI); ctx.fill();
    for (let i=0;i<5;i++){ ctx.fillStyle = Math.sin(t*6 + i) > 0 ? `rgb(${col})` : '#fff'; circle(-24 + i*12, 2, 2.5); }
    ctx.restore(); }
  function drawToss(){
    sky();
    for (let i=0;i<9;i++){ ctx.fillStyle = i % 2 ? '#d0452f' : '#f6ead6'; ctx.beginPath(); ctx.moveTo(i*90, 0); ctx.lineTo(i*90 + 90, 0); ctx.lineTo(i*90 + 90, 40); ctx.quadraticCurveTo(i*90 + 45, 60, i*90, 40); ctx.closePath(); ctx.fill(); }
    for (const u of R.ufos){ const y = laneY(u.lane) + Math.sin(t*3 + u.x*.01)*4; saucer(u.x, y, u.col, 1); if (u.ring){ ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(u.x, y, 40 + u.ring*10, 12 + u.ring*3, 0, 0, 7); ctx.stroke(); } }
    for (const f of R.flying){ const s = .6 + (f.y - 60)/370*.6; ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 5*s; ctx.beginPath(); ctx.ellipse(f.x, f.y, 22*s, 8*s, 0, 0, 7); ctx.stroke(); }
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(0, 440, W, 40); ctx.fillStyle = '#8a5a32'; ctx.fillRect(0, 436, W, 8);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([4, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(R.aim, 425); ctx.lineTo(R.aim, 90); ctx.stroke(); ctx.setLineDash([]);
    Chin.draw(ctx, 'me', anim, R.aim, 450, { scale:.07, face:1, grounded:true, speed:0 });
    for (let i=0;i<R.rings;i++){ ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(W - 30 - i*22, 458, 9, 4, 0, 0, 7); ctx.stroke(); }
    ctx.fillStyle = '#fff6e4'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.fillText(`Saucers ${R.got}/4`, 24, 76);
  }
  // ---- shared bits ----
  function sky(){ const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120a30'); g.addColorStop(.7, '#3a2066'); g.addColorStop(1, '#5a2a70'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i=0;i<60;i++){ ctx.fillStyle = `rgba(255,255,255,${.3 + .5*Math.max(0, Math.sin(t*1.4 + i))})`; circle(hash(i)*W, hash(i + 5)*300, hash(i + 2)*1.2 + .4); }
    ctx.fillStyle = '#d88a6a'; circle(680, 80, 26); ctx.strokeStyle = 'rgba(255,220,200,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(680, 80, 44, 9, -.3, 0, 7); ctx.stroke(); }
  function farWheel(x, y, s, rot){ rot = rot === undefined ? t*.2 : rot;
    ctx.strokeStyle = `rgba(200,180,255,${s < 1 ? .35 : .9})`; ctx.lineWidth = 3*s; ctx.beginPath(); ctx.arc(x, y, 165*s, 0, 7); ctx.stroke();
    ctx.beginPath(); for (let i=0;i<8;i++){ const a = rot + i/8*Math.PI*2; ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a)*165*s, y + Math.sin(a)*165*s); } ctx.stroke();
    for (let i=0;i<24;i++){ const a = rot + i/24*Math.PI*2; ctx.fillStyle = Math.sin(t*4 + i) > 0 ? 'rgba(255,230,110,.9)' : 'rgba(255,106,213,.9)'; circle(x + Math.cos(a)*165*s, y + Math.sin(a)*165*s, 3*s); }
    ctx.fillStyle = '#b58ae6'; circle(x, y, 12*s); }
  function progressBar(k){ ctx.fillStyle = 'rgba(255,255,255,.2)'; rr(W - 224, 66, 200, 10, 5); ctx.fill(); ctx.fillStyle = '#ff6ad5'; rr(W - 224, 66, 200*clamp(k, 0, 1), 10, 5); ctx.fill(); }
  function rideDone(ok, what){
    const r = RIDES.find(q => q.id === sub), first = ok && !done[sub];
    if (ok) done[sub] = true;
    banner = { title: ok ? (first ? 'Mission complete!' : 'Great ride!') : 'So close!', text: ok ? `${what}! Zib does a happy little dance.` : `${what}. Zib says: “Try again, you can do it!”`, ok }; bT = 2.4; sub = 'result';
  }
  function startRide(i){
    if (tokens <= 0) return; tokens--; const r = RIDES[i]; sub = r.id; banner = { title:r.name, text:r.how, ride:true }; bT = 2.2;
    input.pressed = false; input.click = null; input.taps.length = 0;
    if (r.id === 'coaster') startCoaster(); else if (r.id === 'wheel') startWheel(); else startToss();
  }
  function drawMap(){
    sky();
    // the floating island with the rides on it
    ctx.fillStyle = '#3a2a5a'; ctx.beginPath(); ctx.moveTo(20, 380); ctx.lineTo(780, 380); ctx.lineTo(620, 470); ctx.lineTo(420, 490); ctx.lineTo(180, 460); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6a4a9a'; ctx.fillRect(20, 370, 760, 14);
    // little pictures of each ride
    ctx.strokeStyle = '#ff6ad5'; ctx.lineWidth = 4; ctx.beginPath(); for (let x = 70; x <= 230; x += 5){ const y = 300 - 50*Math.abs(Math.sin((x - 70)*.03)); x === 70 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
    ctx.fillStyle = '#ff6ad5'; { const k = wrap(t*.25, 1), x = 70 + k*160, y = 300 - 50*Math.abs(Math.sin((x - 70)*.03)); rr(x - 12, y - 14, 24, 12, 4); ctx.fill(); }
    farWheel(400, 250, .55);
    for (let i=0;i<3;i++) saucer(600 + i*50 + Math.sin(t*2 + i)*10, 230 + (i % 2)*30, '255,230,110', .6);
    RIDES.forEach((r, i) => { const on = i === sel;
      ctx.fillStyle = 'rgba(14,8,30,.9)'; rr(r.x - 90, 322, 180, 40, 8); ctx.fill(); ctx.strokeStyle = `rgb(${r.col})`; ctx.lineWidth = on ? 4 : 2; ctx.stroke();
      ctx.fillStyle = `rgb(${r.col})`; ctx.font = '700 15px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(r.name, r.x, 342);
      if (done[r.id]){ ctx.fillStyle = '#7ee06a'; ctx.font = '700 26px "Pixelify Sans", monospace'; ctx.fillText('✔', r.x + 76, 318); }
      if (on){ ctx.fillStyle = '#fff6e4'; ctx.font = '700 22px "Pixelify Sans", monospace'; ctx.fillText('▼', r.x, 170 + Math.sin(t*5)*5); }
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; });
    // Zib and the mission for the ride you're looking at
    alien(90, 450, .75, '#7ee06a', t*3);
    ctx.fillStyle = 'rgba(255,248,236,.96)'; rr(140, 390, 640, 70, 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(140, 420); ctx.lineTo(118, 428); ctx.lineTo(140, 436); ctx.fill();
    ctx.fillStyle = '#3a2616'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.fillText(done[RIDES[sel].id] ? 'Zib: “You did it! Ride again for fun, or try another!”' : 'Zib’s mission:', 156, 412);
    ctx.font = '600 14px Nunito, sans-serif'; wrapText(done[RIDES[sel].id] ? RIDES[sel].how : RIDES[sel].mission, 156, 432, 610, 17);
    ctx.fillStyle = '#fff6e4'; ctx.font = '600 14px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(tokens > 0 ? '← → to pick a ride, Space (or tap it) to ride. Each ride costs 1 token.' : 'Out of tokens!', W/2, 90); ctx.textAlign = 'left';
  }
  function wrapText(txt, x, y, w, lh){ const words = txt.split(' '); let line = ''; for (const wd of words){ const tr = line ? line + ' ' + wd : wd; if (ctx.measureText(tr).width > w){ ctx.fillText(line, x, y); line = wd; y += lh; } else line = tr; } ctx.fillText(line, x, y); }
  return {
    title:'Cosmic Carnival', sub:'An amusement park floating in the Starry Nebula.',
    blurb:'A carnival on a floating island, run by Zib the alien! Zib has a mission for each of the three rides. Finish all three before your 6 ride tokens run out.',
    legend:['← → to pick a ride, Space or tap to ride it', 'Comet Coaster: hop to grab 12 star tickets', 'Planet Wheel: spot 5 hiding aliens (not the teddies!)', 'UFO Ring Toss: ring 4 saucers with 8 rings', 'You have 6 tokens'],
    hints:['← → and Space, or tap', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgAction'], actionLabel:'Go', clicks:true,
    winTitle:'All missions done!', winText:'Zib gives you a big three-armed hug and a glowing Carnival Star. “Best visitor ever!”',
    loseTitle:'Out of tokens', loseText:'The carnival lights dim for the night. Zib waves: “Come back tomorrow!”',
    reset(){ sub = 'map'; sel = 0; tokens = 6; done = {}; banner = null; bT = 0; R = null; mapT = 0; },
    seeds:() => Object.keys(done).length*5 + tokens*2, stats:() => `<span>Missions ${Object.keys(done).length}/3</span><span>Tokens left ${tokens}</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      if (bT > 0){ bT -= dt; input.pressed = false; input.click = null; input.taps.length = 0;
        if (bT <= 0 && sub === 'result'){ banner = null; sub = 'map'; mapT = .3;
          if (RIDES.every(r => done[r.id])) finish(true); else if (tokens <= 0) finish(false); }
        return; }
      banner = null;
      if (sub === 'map'){ mapT = Math.max(0, mapT - dt);
        for (const k of input.taps.splice(0)){ if (k === 'left') sel = (sel + 2) % 3; if (k === 'right') sel = (sel + 1) % 3; }
        if (input.click){ const c = input.click; input.click = null; const i = RIDES.findIndex(r => Math.abs(c.x - r.x) < 110 && c.y > 150 && c.y < 380); if (i >= 0){ if (i === sel && mapT <= 0) startRide(i); else sel = i; } }
        if (input.pressed){ input.pressed = false; if (mapT <= 0) startRide(sel); }
      }
      else if (sub === 'coaster') coaster(dt); else if (sub === 'wheel') wheel(dt); else if (sub === 'toss') toss(dt);
    },
    draw(){
      if (sub === 'coaster' || (sub === 'result' && R && R.items)) drawCoaster();
      else if (sub === 'wheel' || (sub === 'result' && R && R.cabins)) drawWheel();
      else if (sub === 'toss' || (sub === 'result' && R && R.ufos)) drawToss();
      else drawMap();
      if (banner){ ctx.fillStyle = 'rgba(14,8,30,.85)'; rr(170, 170, 460, 120, 16); ctx.fill(); ctx.strokeStyle = banner.ok === false ? '#ff8a9a' : '#b58ae6'; ctx.lineWidth = 3; ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9a8'; ctx.font = '700 26px "Pixelify Sans", monospace'; ctx.fillText(banner.title, W/2, 215); ctx.fillStyle = '#fff6e4'; ctx.font = '600 15px Nunito, sans-serif'; wrapText2(banner.text); ctx.textAlign = 'left'; }
      drawPops(0);
    },
    hud(){
      hudBar();
      ctx.fillStyle = '#fff6e4'; ctx.fillText('Tokens', 24, 31); for (let i=0;i<6;i++){ ctx.fillStyle = i < tokens ? '#ffe066' : 'rgba(246,234,214,.25)'; circle(112 + i*20, 30, 7); }
      RIDES.forEach((r, i) => { ctx.fillStyle = done[r.id] ? '#7ee06a' : 'rgba(246,234,214,.4)'; ctx.fillText(done[r.id] ? '✔' : '○', 280 + i*26, 31); });
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`Missions ${Object.keys(done).length}/3`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
  function wrapText2(txt){ const words = txt.split(' '); let line = '', y = 248; for (const wd of words){ const tr = line ? line + ' ' + wd : wd; if (ctx.measureText(tr).width > 420){ ctx.fillText(line, W/2, y); line = wd; y += 19; } else line = tr; } ctx.fillText(line, W/2, y); }
})();

// ================= Golden Jungle: Temple of the Golden Acorn =================
// Grab the golden idol, and then RUN: a giant boulder rolls after you down the temple halls.
// Jump over pits and snakes, slide under darts and low beams, and burst out into the daylight.
const TEMPLE = (() => {
  const GOAL = 7200, PX = 330, FLOOR = 400, GRAV = 1900;
  const SLIDE = .7, HIT_COST = 75, CATCH_UP = 18;   // how long a slide lasts, how close a stumble lets the boulder come, how fast it falls back
  let things, x, y, vy, speed, slide, slideQ, gap, gems, intro, stumble, done, doneT, dust, falling, fp;
  function build(){
    const r = rng(1937); things = [];
    for (let d = 700; d < GOAL - 400; d += 300 + r()*230){
      const k = r(), late = d/GOAL;
      if (k < .3) things.push({ k:'pit', x:d, w:90 + r()*60 + late*40 });
      else if (k < .5) things.push({ k:'snake', x:d });
      else if (k < .72) things.push({ k:'darts', x:d, fired:false });
      else if (k < .88) things.push({ k:'beam', x:d });
      else { for (let i=0;i<4;i++) things.push({ k:'gem', x:d + i*40, y:FLOOR - 40 - Math.sin(i/3*Math.PI)*70 }); }
      if (r() < .4) things.push({ k:'gem', x:d + 150, y:FLOOR - 50 - r()*60 });
    }
  }
  const pitAt = px => things.find(o => o.k === 'pit' && px > o.x + 10 && px < o.x + o.w - 10);
  function hit(txt){ if (stumble > 0) return; stumble = .6; gap -= HIT_COST; shake = .35; pop(PX + x, y - 90, txt, '#ffd0d3'); }
  return {
    title:'Temple of the Golden Acorn', sub:'An adventure deep inside the jungle temple.',
    blurb:'Behind the waterfall, an old temple hides the legendary Golden Acorn idol. Grab it, and then run! A giant boulder will chase you all the way out.',
    legend:['Space or ↑ to jump over pits and snakes', '↓ to slide under darts and low beams (press it mid-jump to slide as you land)', 'Every stumble lets the boulder catch up', 'Grab the jewels on the way', 'Reach the daylight at the end!'],
    hints:['Space jump, ↓ slide', 'P to pause'], pad:['wgDown', 'wgAction'], actionLabel:'Jump',
    winTitle:'You escaped!', winText:'You dive out of the temple just as the boulder thunders past, the Golden Acorn idol safe in your paws.',
    loseTitle:'Squashed! (well, almost)', loseText:'The boulder rolls over you… and you pop back up, flat as a pancake. The idol rolls back to its pedestal. Try again!',
    againWinText:'Out into the sunshine again! The monkeys cheer from the trees.', againLoseText:'The boulder gets you! You puff back into shape and dust yourself off.',
    reset(){ build(); x = 0; y = FLOOR; vy = 0; speed = 0; slide = 0; slideQ = false; gap = 300; gems = 0; intro = 2.2; stumble = 0; done = false; doneT = 0; dust = []; falling = 0; },
    seeds:() => gems, stats:() => `<span>Jewels ${gems}</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      if (intro > 0){ intro -= dt; if (intro < 1) shake = .15; input.pressed = false; return; }
      if (done){ doneT += dt; x += 300*dt; if (y < FLOOR){ vy += GRAV*dt; y = Math.min(FLOOR, y + vy*dt); } if (doneT > 1.5) finish(true); return; }
      speed += ((stumble > 0 ? 200 : 300 + x/GOAL*90) - speed)*Math.min(1, dt*3);
      stumble = Math.max(0, stumble - dt);
      const onGround = y >= FLOOR && !falling;
      if ((input.pressed || input.up) && onGround && slide <= 0){ vy = -760; y = FLOOR - 1; }
      input.pressed = false;
      // a ↓ tap counts even if it's let go before the next frame, and one pressed in the air slides as you land
      if (input.taps.includes('down') || (input.down && !onGround)) slideQ = true;
      input.taps.length = 0;
      if ((input.down || slideQ) && onGround){ slide = SLIDE; slideQ = false; } else slide = Math.max(0, slide - dt);
      if (falling){ falling -= dt; if (falling <= 0){ falling = 0; y = FLOOR; vy = 0; if (fp) x = Math.max(x, fp.x + fp.w + 12 - PX); fp = null; } }
      else if (y < FLOOR){ vy += GRAV*dt; y += vy*dt; if (y >= FLOOR){ y = FLOOR; vy = 0; if (pitAt(PX + x)){ fp = pitAt(PX + x); falling = .6; hit('Whoa!'); } } }
      else if (pitAt(PX + x)){ fp = pitAt(PX + x); falling = .6; hit('Whoa!'); }
      if (!falling) x += speed*dt;
      // the boulder creeps back if you run cleanly
      gap = Math.min(300, gap + CATCH_UP*dt);
      for (const o of things){
        const dx = o.x - (PX + x);
        if (o.k === 'gem' && !o.got && Math.abs(dx) < 24 && Math.abs(o.y - (y - 30)) < 40){ o.got = true; gems++; anim.chew = .3; }
        else if (o.k === 'snake' && !o.hit && Math.abs(dx) < 26 && y > FLOOR - 30){ o.hit = true; hit('Hiss!'); }
        else if (o.k === 'darts' && !o.fired && dx < 260){ o.fired = true; o.fx = o.x + 300; }
        else if (o.k === 'beam' && !o.hit && Math.abs(dx) < 22 && slide <= 0){ o.hit = true; hit('Bonk!'); }
        if (o.k === 'darts' && o.fired && !o.hit){ o.fx -= 700*dt; if (Math.abs(o.fx - (PX + x)) < 20 && slide <= 0 && y > FLOOR - 90){ o.hit = true; hit('Ouch!'); } }
      }
      if (!reduceMotion) dust.push({ x:PX + x - gap - 60, y:FLOOR - Math.random()*20, life:.7 }); dust.forEach(d => d.life -= dt); dust = dust.filter(d => d.life > 0);
      if (gap <= 30) finish(false);
      if (x >= GOAL){ done = true; doneT = 0; anim.happy = 4; vy = -500; y = FLOOR - 1; }
    },
    draw(){
      const cam = x;
      // the temple hall: stone blocks, carvings and flickering torches
      ctx.fillStyle = '#3a2c1c'; ctx.fillRect(0, 0, W, H);
      for (let row = 0; row < 9; row++) for (let i = Math.floor(cam*.6/80) - 1; i*80 - cam*.6 < W + 80; i++){ const bx = i*80 - cam*.6 + (row % 2)*40, by = 40 + row*42;
        ctx.fillStyle = hash(i*7 + row) > .5 ? '#56432c' : '#4e3c28'; ctx.fillRect(bx + 2, by + 2, 76, 38);
        if (hash(i*3 + row*11) > .93){ ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx + 40, by + 21, 10, 0, 7); ctx.moveTo(bx + 30, by + 21); ctx.lineTo(bx + 50, by + 21); ctx.stroke(); } }
      for (let i = Math.floor(cam/420) - 1; i*420 - cam < W + 420; i++){ const tx = i*420 - cam + 200;
        const tg = ctx.createRadialGradient(tx, 150, 4, tx, 150, 120); tg.addColorStop(0, 'rgba(255,170,80,.45)'); tg.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = tg; circle(tx, 150, 120);
        ctx.fillStyle = '#2a1a0c'; ctx.fillRect(tx - 4, 160, 8, 30); for (let k=0;k<3;k++){ ctx.fillStyle = ['#e0602a', '#f2a03a', '#ffe27a'][k]; ctx.beginPath(); ctx.ellipse(tx, 150 - k*4 + Math.sin(t*12 + k + i)*2, 8 - k*2, 14 - k*3, 0, 0, 7); ctx.fill(); } }
      // ceiling
      ctx.fillStyle = '#2a1e12'; ctx.fillRect(0, 0, W, 34);
      // the floor, with pits
      ctx.fillStyle = '#6b5236'; ctx.fillRect(0, FLOOR, W, H - FLOOR); ctx.fillStyle = '#8a6a44'; ctx.fillRect(0, FLOOR, W, 6);
      for (const o of things){ const sx = o.x - cam; if (sx > W + 200 || sx < -300) continue;
        if (o.k === 'pit'){ ctx.fillStyle = '#120a04'; ctx.fillRect(sx, FLOOR, o.w, H - FLOOR); ctx.fillStyle = '#8a8a8a'; for (let s = sx + 6; s < sx + o.w - 6; s += 14){ ctx.beginPath(); ctx.moveTo(s, H); ctx.lineTo(s + 6, H - 26); ctx.lineTo(s + 12, H); ctx.fill(); } } }
      // the golden idol's pedestal at the start
      { const sx = PX + 60 - cam; if (sx > -60){ ctx.fillStyle = '#7a6a54'; ctx.fillRect(sx - 20, FLOOR - 60, 40, 60); ctx.fillStyle = '#9a8a70'; ctx.fillRect(sx - 26, FLOOR - 64, 52, 8);
        if (intro > 1.2){ ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.ellipse(sx, FLOOR - 82, 12, 15, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#c9902a'; ctx.beginPath(); ctx.ellipse(sx, FLOOR - 96, 14, 6, 0, 0, 7); ctx.fill(); } } }
      // daylight exit at the end
      { const sx = GOAL + PX + 120 - cam; if (sx < W + 200){ const dg = ctx.createRadialGradient(sx + 60, FLOOR - 120, 10, sx + 60, FLOOR - 120, 260); dg.addColorStop(0, 'rgba(255,250,210,1)'); dg.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = dg; ctx.fillRect(sx - 200, 0, 500, FLOOR);
        ctx.fillStyle = '#f6e7a8'; ctx.beginPath(); ctx.moveTo(sx, FLOOR); ctx.lineTo(sx, FLOOR - 200); ctx.arc(sx + 70, FLOOR - 200, 70, Math.PI, 0); ctx.lineTo(sx + 140, FLOOR); ctx.closePath(); ctx.fill(); } }
      for (const o of things){ const sx = o.x - cam; if (sx > W + 400 || sx < -300) continue;
        if (o.k === 'gem' && !o.got){ const yy = o.y + Math.sin(t*3 + o.x)*3; ctx.fillStyle = ['#e0464f', '#3f9ad0', '#4fc07a'][o.x % 3 | 0]; ctx.beginPath(); ctx.moveTo(sx, yy - 10); ctx.lineTo(sx + 8, yy - 2); ctx.lineTo(sx, yy + 10); ctx.lineTo(sx - 8, yy - 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(sx - 3, yy - 5, 3, 3); }
        else if (o.k === 'snake'){ const wig = Math.sin(t*6 + o.x)*3; ctx.fillStyle = '#4f8a3a'; for (let k=0;k<4;k++) circle(sx - 18 + k*9, FLOOR - 6 + Math.sin(k + t*6)*2, 6);
          ctx.beginPath(); ctx.ellipse(sx + 18, FLOOR - 22 + wig, 9, 7, 0, 0, 7); ctx.fill(); ctx.fillRect(sx + 12, FLOOR - 20 + wig, 7, 16); ctx.fillStyle = '#f2e27a'; circle(sx + 21, FLOOR - 24 + wig, 2); ctx.strokeStyle = '#e0464f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx + 27, FLOOR - 20 + wig); ctx.lineTo(sx + 34, FLOOR - 19 + wig + Math.sin(t*20)*2); ctx.stroke(); }
        else if (o.k === 'beam'){ ctx.fillStyle = '#5a4028'; ctx.fillRect(sx - 30, 34, 60, FLOOR - 80 - 34); ctx.fillStyle = '#7a5a38'; ctx.fillRect(sx - 36, FLOOR - 92, 72, 16); ctx.fillStyle = '#c9a13a'; ctx.fillRect(sx - 20, FLOOR - 88, 40, 3); }
        else if (o.k === 'darts'){ ctx.fillStyle = '#2a1e12'; for (let k=0;k<3;k++) circle(o.x + 300 - cam + 30, FLOOR - 60 + k*6, 4);
          if (o.fired && !o.hit){ const fx = o.fx - cam; ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 2; for (let k=0;k<2;k++){ ctx.beginPath(); ctx.moveTo(fx, FLOOR - 58 + k*10); ctx.lineTo(fx + 20, FLOOR - 58 + k*10); ctx.stroke(); ctx.fillStyle = '#e0464f'; ctx.fillRect(fx + 16, FLOOR - 61 + k*10, 6, 6); } } } }
      // you: running, jumping or sliding
      if (!falling || falling > .3){
        ctx.save(); ctx.translate(PX, y + (falling ? (.6 - falling)*80 : 0));
        if (slide > 0){ ctx.rotate(-1.1); Chin.draw(ctx, 'me', anim, 20, 30, { scale:.075, face:1, grounded:true, speed:0 }); }
        else Chin.draw(ctx, 'me', anim, 0, 0, { scale:.08, face:intro > 0 ? 1 : 1, grounded:y >= FLOOR, speed:intro > 0 ? 0 : speed });
        if (intro <= 1.2 && !done){ ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.ellipse(slide > 0 ? 30 : 18, slide > 0 ? -10 : -48, 7, 9, 0, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      // the boulder!
      if (intro < 1.2){ const bx = PX - gap - 90, br = 130, rot = x/br;
        for (const d of dust){ ctx.fillStyle = `rgba(200,170,120,${d.life*.5})`; circle(d.x - cam, d.y, 14*(1.4 - d.life)); }
        const bg = ctx.createRadialGradient(bx + 30, FLOOR - br - 40, 20, bx, FLOOR - br, br); bg.addColorStop(0, '#a08a6a'); bg.addColorStop(1, '#5a4a36'); ctx.fillStyle = bg; circle(bx, FLOOR - br, br);
        ctx.save(); ctx.translate(bx, FLOOR - br); ctx.rotate(rot); ctx.strokeStyle = 'rgba(40,28,16,.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-60, -40); ctx.lineTo(-10, -20); ctx.lineTo(20, -60); ctx.moveTo(30, 40); ctx.lineTo(70, 10); ctx.moveTo(-40, 50); ctx.lineTo(-10, 80); ctx.stroke(); ctx.restore(); }
      if (intro > 0){ ctx.fillStyle = 'rgba(20,12,4,.55)'; rr(200, 70, 400, 50, 12); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.font = '700 22px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(intro > 1.2 ? 'You grab the Golden Acorn…' : 'RUMBLE… RUN!', W/2, 102); ctx.textAlign = 'left'; }
      drawPops(cam);
    },
    hud(){
      hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText('Boulder', 24, 31);
      ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(112, 22, 150, 16, 6); ctx.fill(); const k = clamp((gap - 30)/270, 0, 1); ctx.fillStyle = k > .5 ? '#82ffa0' : k > .25 ? '#ffe66e' : '#ff6a8a'; rr(112, 22, 150*k, 16, 6); ctx.fill();
      ctx.fillStyle = '#e0464f'; ctx.fillText(`◆ ${gems}`, 276, 31);
      progress(x/GOAL, '#f2c230'); ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
})();

// ================= Golden Jungle: Jungle Animal Rescue =================
// A storm has left five baby animals in trouble. Explore the jungle (seen from above), find
// the things that can help, and lead every baby home to the sanctuary before sunset.
const RESCUE = (() => {
  const MW = 2000, MH = 1300, RIVER = [380, 470], BRIDGE = [975, 1065], HOME = { x:1000, y:1170 }, DAY = 200;
  const ANIMALS = [
    { id:'monkey', name:'baby monkey', x:300, y:720, need:'banana', stuck:'is stuck up in a tall tree!', hint:'Maybe something tasty would coax it down…', ok:'The monkey slides down for the banana!' },
    { id:'toucan', name:'baby toucan', x:1760, y:640, need:'shears', stuck:'is all tangled up in vines!', hint:'Something sharp could snip those vines…', ok:'Snip, snip! The toucan is free!' },
    { id:'elephant', name:'baby elephant', x:1420, y:1080, need:'rope', stuck:'is stuck in the mud!', hint:'If only you had a rope to pull it out…', ok:'Heave-ho! Out of the mud it comes!' },
    { id:'turtle', name:'baby turtle', x:640, y:600, need:null, stuck:'', hint:'', ok:'You flip the turtle back over. It blinks at you gratefully!' },
    { id:'sloth', name:'baby sloth', x:1500, y:210, need:null, stuck:'', hint:'', ok:'The sloth s-l-o-w-l-y climbs onto your back.' },
  ];
  const ITEMS = [
    { id:'banana', name:'Bananas', x:1660, y:930 },
    { id:'shears', name:'Shears', x:560, y:1030 },
    { id:'rope', name:'Rope', x:230, y:1160 },
    { id:'plank', name:'Plank', x:180, y:540 },
  ];
  const TREES = (() => { const r = rng(4242), a = [], keep = [...ANIMALS, ...ITEMS, HOME, { x:800, y:680 }, { x:1020, y:430 }, { x:560, y:1030 }];
    while (a.length < 70){ const x = 60 + r()*(MW - 120), y = 60 + r()*(MH - 120); if (y > RIVER[0] - 50 && y < RIVER[1] + 50) continue; if (keep.some(k => Math.hypot(k.x - x, k.y - y) < 130)) continue; if (a.some(q => Math.hypot(q.x - x, q.y - y) < 90)) continue; a.push({ x, y, r:24 + r()*14, s:r() }); }
    return a; })();
  const POND = { x:820, y:700, rx:110, ry:70 };
  let px, py, face, moving, animals, have, fixed, saved, trail, msg, msgT, hintCD, done, doneT;
  const blocked = (x, y) => {
    if (x < 30 || y < 40 || x > MW - 30 || y > MH - 20) return true;
    if (y > RIVER[0] && y < RIVER[1] && !(fixed && x > BRIDGE[0] + 10 && x < BRIDGE[1] - 10)) return true;
    if (((x - POND.x)/POND.rx)**2 + ((y - POND.y)/POND.ry)**2 < 1) return true;
    for (const tr of TREES) if (Math.hypot(tr.x - x, tr.y - y) < tr.r*.5 + 12) return true;
    return false;
  };
  function say(txt){ msg = txt; msgT = 3.2; }
  // --- little drawings ---
  function monkey(x, y){ ctx.fillStyle = '#7a4a2a'; ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 12, y - 8, 7, 0, 4); ctx.stroke(); circle(x, y - 10, 10); circle(x, y - 26, 9); circle(x - 9, y - 28, 4); circle(x + 9, y - 28, 4); ctx.fillStyle = '#e0b080'; circle(x, y - 24, 6); ctx.fillStyle = '#1a1a1a'; circle(x - 2.5, y - 27, 1.4); circle(x + 2.5, y - 27, 1.4); }
  function toucan(x, y){ ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.ellipse(x, y - 12, 9, 13, 0, 0, 7); ctx.fill(); circle(x, y - 28, 8); ctx.fillStyle = '#f6ead6'; ctx.beginPath(); ctx.ellipse(x + 2, y - 22, 5, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#f2a03a'; ctx.beginPath(); ctx.moveTo(x + 5, y - 32); ctx.quadraticCurveTo(x + 24, y - 32, x + 22, y - 24); ctx.lineTo(x + 5, y - 25); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; circle(x + 2, y - 30, 2.4); ctx.fillStyle = '#1a1a1a'; circle(x + 2.5, y - 30, 1.2); }
  function elephant(x, y, sunk){ ctx.fillStyle = '#9aa0ac'; ctx.beginPath(); ctx.ellipse(x, y - 14 + sunk, 20, 14, 0, 0, 7); ctx.fill(); circle(x + 16, y - 24 + sunk, 11); ctx.fillStyle = '#b8bec8'; ctx.beginPath(); ctx.ellipse(x + 10, y - 24 + sunk, 7, 10, -.2, 0, 7); ctx.fill(); ctx.strokeStyle = '#9aa0ac'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 24, y - 20 + sunk); ctx.quadraticCurveTo(x + 32, y - 10 + sunk, x + 28 + Math.sin(t*3)*3, y - 4 + sunk); ctx.stroke(); ctx.fillStyle = '#1a1a1a'; circle(x + 19, y - 27 + sunk, 1.6); }
  function turtle(x, y, flipped){ if (flipped){ ctx.fillStyle = '#c9b07a'; ctx.beginPath(); ctx.ellipse(x, y - 8, 16, 10, 0, 0, Math.PI); ctx.fill(); ctx.strokeStyle = '#6a9a4a'; ctx.lineWidth = 3; for (const s of [-1, 1]){ ctx.beginPath(); ctx.moveTo(x + s*10, y - 10); ctx.lineTo(x + s*14, y - 18 - Math.abs(Math.sin(t*8))*4); ctx.stroke(); } ctx.fillStyle = '#4f7a3a'; ctx.beginPath(); ctx.ellipse(x, y - 4, 16, 6, 0, 0, Math.PI); ctx.fill(); return; }
    ctx.fillStyle = '#6a9a4a'; circle(x + 16, y - 8, 5); ctx.fillStyle = '#4f7a3a'; ctx.beginPath(); ctx.ellipse(x, y - 8, 16, 11, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = '#3a5a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 6, y - 17); ctx.lineTo(x - 8, y - 8); ctx.moveTo(x + 6, y - 17); ctx.lineTo(x + 8, y - 8); ctx.stroke(); ctx.fillStyle = '#1a1a1a'; circle(x + 18, y - 9, 1.2); }
  function sloth(x, y){ ctx.fillStyle = '#b89a78'; ctx.beginPath(); ctx.ellipse(x, y - 14, 12, 14, 0, 0, 7); ctx.fill(); circle(x, y - 30, 10); ctx.fillStyle = '#f0e0c8'; circle(x, y - 29, 7); ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.ellipse(x - 4, y - 30, 4, 2.5, .3, 0, 7); ctx.ellipse(x + 4, y - 30, 4, 2.5, -.3, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(x - 4, y - 30, 1.2); circle(x + 4, y - 30, 1.2); ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y - 26, 3, .3, Math.PI - .3); ctx.stroke(); }
  const DRAW_ANIMAL = { monkey, toucan, elephant:(x, y) => elephant(x, y, 0), turtle:(x, y) => turtle(x, y, false), sloth };
  function itemPic(id, x, y, s){ ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (id === 'banana'){ ctx.fillStyle = '#f2d23a'; for (let k=0;k<3;k++){ ctx.save(); ctx.rotate(-.4 + k*.4); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(14, -6, 16, -20); ctx.quadraticCurveTo(8, -10, 0, -4); ctx.closePath(); ctx.fill(); ctx.restore(); } ctx.fillStyle = '#6a4a2a'; circle(0, -2, 3); }
    else if (id === 'shears'){ ctx.strokeStyle = '#b8c0c8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(10, -14); ctx.moveTo(8, 8); ctx.lineTo(-10, -14); ctx.stroke(); ctx.strokeStyle = '#d0452f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-9, 11, 5, 0, 7); ctx.moveTo(14, 11); ctx.arc(9, 11, 5, 0, 7); ctx.stroke(); }
    else if (id === 'rope'){ ctx.strokeStyle = '#c9a36a'; ctx.lineWidth = 4; for (let k=0;k<3;k++){ ctx.beginPath(); ctx.ellipse(0, -4, 14 - k*4, 9 - k*2.5, 0, 0, 7); ctx.stroke(); } }
    else { ctx.fillStyle = '#9a6a3a'; ctx.save(); ctx.rotate(-.3); rr(-20, -6, 40, 12, 3); ctx.fill(); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(12, 0); ctx.stroke(); ctx.restore(); }
    ctx.restore(); }
  function tree(tr, sx, sy){ ctx.fillStyle = 'rgba(20,40,10,.3)'; ctx.beginPath(); ctx.ellipse(sx + 8, sy + 4, tr.r*1.1, tr.r*.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(sx - 6, sy - 30, 12, 32);
    ctx.fillStyle = tr.s > .5 ? '#3f7a2a' : '#4f8a32'; circle(sx, sy - 44, tr.r); circle(sx - tr.r*.6, sy - 34, tr.r*.7); circle(sx + tr.r*.6, sy - 36, tr.r*.7);
    ctx.fillStyle = 'rgba(200,240,140,.25)'; circle(sx - tr.r*.3, sy - 52, tr.r*.45); }
  return {
    title:'Jungle Animal Rescue', sub:'Help the baby animals get home safe.',
    blurb:'Last night’s storm left five baby animals in trouble all over the jungle. Find them, find what they need, and lead them all back to the Animal Sanctuary before the sun goes down!',
    legend:['Arrow keys to walk around', 'Walk up to an animal to help it', 'Some need a special thing first (look around!)', 'Rescued babies follow you; bring them to the sanctuary', 'The map in the corner shows where things are', 'Save all 5 before sunset'],
    hints:['Arrow keys to explore', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgUp', 'wgDown'],
    winTitle:'Everyone is safe!', winText:'Five happy babies snuggle up together at the sanctuary, and their families come to thank you with a jungle parade.',
    loseTitle:'The sun went down', loseText:'It’s too dark to keep searching. The rangers will look for the rest tonight, and you can help again tomorrow.',
    againWinText:'Another perfect rescue! The babies wave as you leave.', againLoseText:'Night falls on the jungle. The rangers take over for tonight.',
    reset(){ px = HOME.x; py = HOME.y - 90; face = 1; moving = false; animals = ANIMALS.map(a => ({ ...a, state:'stuck' })); have = {}; fixed = false; saved = 0; trail = []; msg = 'Find the five baby animals and bring them to the sanctuary!'; msgT = 4; hintCD = {}; done = false; doneT = 0; for (const it of ITEMS) it.got = false; },
    seeds:() => saved*4, stats:() => `<span>Rescued ${saved}/5</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      if (done){ doneT += dt; if (doneT > 1.6) finish(true); return; }
      const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0), ay = (input.down ? 1 : 0) - (input.up ? 1 : 0), len = Math.hypot(ax, ay) || 1, sp = 220;
      moving = !!(ax || ay); if (ax) face = ax;
      const nx = px + ax/len*sp*dt, ny = py + ay/len*sp*dt;
      if (!blocked(nx, py)) px = nx; if (!blocked(px, ny)) py = ny;
      Chin.tickAnim(anim, dt, moving ? sp : 0, true);
      if (moving){ trail.push({ x:px, y:py }); if (trail.length > 500) trail.shift(); }
      msgT -= dt; for (const k in hintCD) hintCD[k] -= dt;
      for (const it of ITEMS) if (!it.got && Math.hypot(it.x - px, it.y - py) < 40){ it.got = true; have[it.id] = true; anim.happy = 1; say(it.id === 'plank' ? 'A sturdy plank! That could fix the broken bridge.' : `You found the ${it.name.toLowerCase()}!`); }
      if (!fixed && have.plank && Math.abs(px - (BRIDGE[0] + BRIDGE[1])/2) < 80 && py > RIVER[1] && py < RIVER[1] + 80){ fixed = true; say('You lay the plank across the gap. The bridge is fixed!'); anim.happy = 2; }
      if (!fixed && !have.plank && Math.abs(px - (BRIDGE[0] + BRIDGE[1])/2) < 80 && py > RIVER[1] && py < RIVER[1] + 70 && !(hintCD.bridge > 0)){ hintCD.bridge = 6; say('The bridge has a big gap in it. A plank would fix it…'); }
      let follow = 0;
      for (const a of animals){
        if (a.state === 'stuck' && Math.hypot(a.x - px, a.y - py) < 70){
          if (!a.need || have[a.need]){ a.state = 'follow'; anim.happy = 2; say(a.ok); pop(a.x, a.y - 70, '♥', '#ff8aa0'); }
          else if (!(hintCD[a.id] > 0)){ hintCD[a.id] = 6; say(`The ${a.name} ${a.stuck} ${a.hint}`); }
        }
        if (a.state === 'follow'){ follow++; const q = trail[Math.max(0, trail.length - 1 - follow*22)] || { x:px, y:py }; a.x += (q.x - a.x)*Math.min(1, dt*6); a.y += (q.y - a.y)*Math.min(1, dt*6); }
      }
      if (Math.hypot(HOME.x - px, HOME.y - py) < 130){ const n = animals.filter(a => a.state === 'follow');
        n.forEach((a, i) => { a.state = 'saved'; saved++; a.x = HOME.x - 70 + (ANIMALS.findIndex(b => b.id === a.id))*35; a.y = HOME.y + 20; }); if (n.length){ anim.happy = 3; say(saved === 5 ? 'Every baby is safe!' : `${n.length === 1 ? 'A baby is' : n.length + ' babies are'} safe at the sanctuary! ${5 - saved} to go.`); } }
      if (saved === 5){ done = true; doneT = 0; }
      else if (time > DAY) finish(false);
    },
    draw(){
      const cx = clamp(px - W/2, 0, MW - W), cy = clamp(py - H/2 - 20, 0, MH - H);
      ctx.save(); ctx.translate(-cx, -cy);
      ctx.fillStyle = '#5a9a3a'; ctx.fillRect(cx, cy, W, H);
      for (let i=0;i<260;i++){ const gx = hash(i)*MW, gy = hash(i + 7)*MH; if (gx < cx - 20 || gx > cx + W + 20 || gy < cy - 20 || gy > cy + H + 20) continue; ctx.fillStyle = hash(i + 3) > .5 ? '#4f8a32' : '#6aaa46'; ctx.beginPath(); ctx.ellipse(gx, gy, 14, 5, 0, 0, 7); ctx.fill(); if (hash(i + 5) > .85){ ctx.fillStyle = ['#f2c230', '#e0464f', '#e8a0e0'][i % 3]; circle(gx + 6, gy - 3, 3); } }
      // dirt paths
      ctx.strokeStyle = '#b89a62'; ctx.lineWidth = 34; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(HOME.x, HOME.y); ctx.lineTo(1020, 520); ctx.moveTo(1020, 900); ctx.lineTo(400, 900); ctx.lineTo(300, 760); ctx.moveTo(1020, 900); ctx.lineTo(1700, 900); ctx.lineTo(1760, 700); ctx.moveTo(1020, 330); ctx.lineTo(1480, 240); ctx.stroke(); ctx.lineCap = 'butt';
      // the river and its bridge
      ctx.fillStyle = '#3f8ac0'; ctx.fillRect(0, RIVER[0], MW, RIVER[1] - RIVER[0]);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=0;i<40;i++){ const wx = wrap(hash(i)*MW + t*40, MW), wy = RIVER[0] + 12 + hash(i + 2)*(RIVER[1] - RIVER[0] - 24); ctx.moveTo(wx, wy); ctx.lineTo(wx + 24, wy); } ctx.stroke();
      ctx.fillStyle = '#8a5a32'; for (let y = RIVER[0] - 10; y < RIVER[1] + 10; y += 16){ if (!fixed && y > 405 && y < 445) continue; ctx.fillRect(BRIDGE[0], y, BRIDGE[1] - BRIDGE[0], 12); }
      ctx.fillStyle = '#5a3a1a'; ctx.fillRect(BRIDGE[0] - 4, RIVER[0] - 10, 5, RIVER[1] - RIVER[0] + 20); ctx.fillRect(BRIDGE[1] - 1, RIVER[0] - 10, 5, RIVER[1] - RIVER[0] + 20);
      // pond and mud
      ctx.fillStyle = '#3f8ac0'; ctx.beginPath(); ctx.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#4f9a3a'; for (const [lx, ly] of [[780, 680], [860, 720], [820, 660]]){ ctx.beginPath(); ctx.ellipse(lx, ly, 12, 8, 0, .3, 6); ctx.fill(); }
      ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.ellipse(1420, 1080, 70, 34, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#7a5a3a'; circle(1400, 1070, 8); circle(1450, 1090, 6);
      // explorer's camp and old ruins
      ctx.fillStyle = '#c9a36a'; ctx.beginPath(); ctx.moveTo(500, 1000); ctx.lineTo(540, 950); ctx.lineTo(580, 1000); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.moveTo(530, 1000); ctx.lineTo(540, 972); ctx.lineTo(550, 1000); ctx.fill();
      ctx.fillStyle = '#8a8a7a'; for (const [rx, ry, w, h] of [[160, 1100, 40, 30], [210, 1090, 30, 50], [280, 1120, 50, 24]]) ctx.fillRect(rx, ry, w, h);
      // the sanctuary
      ctx.fillStyle = '#c9a36a'; ctx.fillRect(HOME.x - 110, HOME.y - 10, 220, 8); ctx.fillRect(HOME.x - 110, HOME.y + 60, 220, 8);
      for (let k=0;k<12;k++){ ctx.fillStyle = '#8a5a32'; ctx.fillRect(HOME.x - 110 + k*20, HOME.y - 20, 6, 30); ctx.fillRect(HOME.x - 110 + k*20, HOME.y + 50, 6, 30); }
      ctx.fillStyle = '#3f6b5a'; rr(HOME.x - 90, HOME.y - 70, 180, 30, 8); ctx.fill(); ctx.fillStyle = '#f6ead6'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('ANIMAL SANCTUARY', HOME.x, HOME.y - 50); ctx.textAlign = 'left';
      // items
      for (const it of ITEMS){ if (it.got) continue; const bob = Math.sin(t*3 + it.x)*3; ctx.fillStyle = 'rgba(255,240,150,.35)'; circle(it.x, it.y - 8, 20 + Math.sin(t*4)*3); itemPic(it.id, it.x, it.y - 8 + bob, 1); }
      // everything that stands up, drawn from back to front
      const list = TREES.filter(tr => tr.x > cx - 80 && tr.x < cx + W + 80 && tr.y > cy - 20 && tr.y < cy + H + 120).map(tr => ({ y:tr.y, f:() => tree(tr, tr.x, tr.y) }));
      for (const a of animals){ const f = DRAW_ANIMAL[a.id];
        if (a.state === 'stuck' && a.id === 'monkey') list.push({ y:a.y + 1, f:() => { tree({ r:44, s:.2 }, a.x, a.y); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(a.x - 8, a.y - 110, 16, 70); ctx.fillStyle = '#3f7a2a'; circle(a.x, a.y - 120, 50); monkey(a.x + 20, a.y - 100 + Math.sin(t*4)*2); } });
        else if (a.state === 'stuck' && a.id === 'toucan') list.push({ y:a.y, f:() => { toucan(a.x, a.y); ctx.strokeStyle = '#3f7a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a.x - 16, a.y - 40); ctx.lineTo(a.x + 16, a.y); ctx.moveTo(a.x + 18, a.y - 38); ctx.lineTo(a.x - 16, a.y - 4); ctx.moveTo(a.x - 20, a.y - 20); ctx.lineTo(a.x + 22, a.y - 22); ctx.stroke(); } });
        else if (a.state === 'stuck' && a.id === 'elephant') list.push({ y:a.y, f:() => { elephant(a.x, a.y, 10); ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.ellipse(a.x, a.y, 40, 12, 0, 0, 7); ctx.fill(); } });
        else if (a.state === 'stuck' && a.id === 'turtle') list.push({ y:a.y, f:() => turtle(a.x, a.y, true) });
        else if (a.state === 'stuck' && a.id === 'sloth') list.push({ y:a.y, f:() => { ctx.fillStyle = '#6b4a2b'; ctx.fillRect(a.x - 40, a.y - 60, 80, 8); sloth(a.x, a.y - 20 + Math.sin(t)*2); } });
        else list.push({ y:a.y, f:() => f(a.x, a.y) });
        if (a.state === 'stuck') list.push({ y:a.y + 2, f:() => { ctx.fillStyle = `rgba(255,255,255,${.6 + .4*Math.sin(t*5)})`; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('!', a.x, a.y - (a.id === 'monkey' ? 170 : 60)); ctx.textAlign = 'left'; } }); }
      list.push({ y:py, f:() => { ctx.fillStyle = 'rgba(20,40,10,.3)'; ctx.beginPath(); ctx.ellipse(px, py, 16, 5, 0, 0, 7); ctx.fill(); Chin.draw(ctx, 'me', anim, px, py, { scale:.065, face, grounded:true, speed:moving ? 200 : 0 }); } });
      list.sort((a, b) => a.y - b.y); for (const d of list) d.f();
      drawPops(0);
      ctx.restore();
      // sunset: the light slowly turns golden, then blue
      const k = time/DAY; if (k > .5){ ctx.fillStyle = `rgba(${k < .8 ? '255,140,60' : '40,40,110'},${Math.min(.4, (k - .5)*.9)})`; ctx.fillRect(0, 0, W, H); }
      // the little map
      { const mx = W - 172, my = H - 118, s = 160/MW; ctx.fillStyle = 'rgba(20,30,10,.75)'; rr(mx - 6, my - 6, 172, MH*s + 12, 8); ctx.fill(); ctx.fillStyle = '#4f8a32'; ctx.fillRect(mx, my, 160, MH*s); ctx.fillStyle = '#3f8ac0'; ctx.fillRect(mx, my + RIVER[0]*s, 160, (RIVER[1] - RIVER[0])*s);
        ctx.fillStyle = '#c9a36a'; ctx.fillRect(mx + HOME.x*s - 6, my + HOME.y*s - 3, 12, 6);
        for (const it of ITEMS) if (!it.got){ ctx.fillStyle = '#ffe066'; circle(mx + it.x*s, my + it.y*s, 2.5); }
        for (const a of animals) if (a.state === 'stuck'){ ctx.fillStyle = Math.sin(t*6) > 0 ? '#ff6a8a' : '#fff'; circle(mx + a.x*s, my + a.y*s, 3); }
        ctx.fillStyle = '#fff'; circle(mx + px*s, my + py*s, 3.5); }
      if (msgT > 0){ ctx.globalAlpha = Math.min(1, msgT*2); ctx.font = '600 15px Nunito, sans-serif'; const tw = ctx.measureText(msg).width + 30; ctx.fillStyle = 'rgba(255,248,236,.95)'; rr(W/2 - tw/2 - 90, 64, tw, 32, 10); ctx.fill(); ctx.fillStyle = '#3a2616'; ctx.textAlign = 'center'; ctx.fillText(msg, W/2 - 90, 85); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
    },
    hud(){
      hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Rescued ${saved}/5`, 24, 31);
      ITEMS.forEach((it, i) => { ctx.globalAlpha = have[it.id] ? 1 : .25; itemPic(it.id, 200 + i*40, 34, .7); }); ctx.globalAlpha = 1;
      const left = Math.max(0, DAY - time); ctx.fillStyle = left < 30 ? '#ff8a9a' : '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`☀ ${Math.floor(left/60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
})();

// ================= The Coral Sea: Coral Dive =================
// Swim through the reef in a bubble helmet. Grab pearls, keep your air topped up at the
// bubble vents (or the surface), dodge jellyfish and pufferfish, and find the sunken ship.
const SEA = (() => {
  const GOAL = 6200, TOP = 70, BOT = 430;
  let things, x, y, vx, vy, air, hearts, pearls, inv, done, doneT, bubbles, face;
  function build(){
    const r = rng(8080); things = [];
    for (let d = 500; d < GOAL - 300; d += 240 + r()*200){
      const k = r();
      if (k < .3) things.push({ k:'jelly', x:d, y0:150 + r()*200, ph:r()*6 });
      else if (k < .48) things.push({ k:'puff', x:d, y:140 + r()*240, ph:r()*6, puff:0 });
      else if (k < .6) things.push({ k:'eel', x:d, t:r()*4 });
      else { const y0 = 130 + r()*240; for (let i=0;i<4;i++) things.push({ k:'pearl', x:d + i*34, y:y0 + Math.sin(i)*20 }); }
    }
    for (let d = 900; d < GOAL; d += 1000 + r()*200) things.push({ k:'vent', x:d });
  }
  const hitMe = (ox, oy, r) => Math.hypot(ox - x, oy - (y - 20)) < r + 22;
  function hurt(txt){ if (inv > 0) return; hearts--; inv = 1.6; shake = .3; pop(x, y - 80, txt, '#ffd0d3'); if (hearts <= 0) finish(false); }
  return {
    title:'Coral Dive', sub:'Swim down to the Coral Sea.',
    blurb:'The flickering portal splashed you into warm blue water, wearing a shiny bubble helmet! Swim through the reef to the old sunken ship. Keep an eye on your air: the bubbling vents on the sea floor fill it back up.',
    legend:['Arrow keys to swim (you sink slowly)', 'Your air goes down as you swim', 'Swim through bubble vents or up to the surface for more air', 'Grab pearls', 'Watch out for jellyfish, pufferfish and eels (3 hearts)', 'Find the sunken ship!'],
    hints:['Arrow keys to swim', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgUp', 'wgDown'],
    winTitle:'You found the ship!', winText:'Inside the sunken ship, a treasure chest creaks open, and a whole city of sea creatures swims out to welcome you to the Coral Sea.',
    loseTitle:'Back to the surface', loseText:'You bob back up and the portal pulls you home, dripping. The sea will wait for you!',
    againWinText:'Back at the sunken ship! The fish do a little twirl for you.', againLoseText:'Time to head up for air. The dolphins give you a lift back.',
    reset(){ build(); x = 150; y = 200; vx = 0; vy = 0; air = 100; hearts = 3; pearls = 0; inv = 0; done = false; doneT = 0; bubbles = []; face = 1; },
    seeds:() => pearls, stats:() => `<span>Pearls ${pearls}</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      if (done){ doneT += dt; x += 80*dt; if (doneT > 1.5) finish(true); return; }
      const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0), ay = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      if (ax) face = ax;
      vx += ax*700*dt; vy += ay*700*dt + 40*dt; vx *= Math.pow(.15, dt); vy *= Math.pow(.15, dt);
      x = clamp(x + vx*dt, 40, GOAL + 200); y = clamp(y + vy*dt, TOP, BOT);
      inv = Math.max(0, inv - dt);
      air -= (4 + Math.hypot(vx, vy)/200)*dt;
      if (y < TOP + 16){ if (air < 99) pop(x, y - 60, 'Gasp!', '#bfe3ff'); air = 100; }
      for (const o of things){ const dx = o.x - x; if (dx < -300 || dx > 500) continue;
        if (o.k === 'pearl' && !o.got && hitMe(o.x, o.y, 10)){ o.got = true; pearls++; anim.chew = .3; }
        else if (o.k === 'jelly' && hitMe(o.x, o.y0 + Math.sin(t*.8 + o.ph)*60, 20)) hurt('Sting!');
        else if (o.k === 'puff'){ o.puff += ((Math.abs(dx) < 150 ? 1 : 0) - o.puff)*Math.min(1, dt*3); if (hitMe(o.x, o.y + Math.sin(t + o.ph)*20, 12 + o.puff*16)) hurt('Poke!'); }
        else if (o.k === 'eel'){ o.t += dt; const out = Math.max(0, Math.sin(o.t*1.2)); o.out = out; if (out > .3 && hitMe(o.x + 10, BOT + 10 - out*140, 16)) hurt('Chomp!'); }
        else if (o.k === 'vent' && Math.abs(dx) < 40 && y > BOT - 200){ if (air < 99 && Math.random() < dt*3) pop(x, y - 60, 'Ahh, air!', '#bfe3ff'); air = Math.min(100, air + 60*dt); }
      }
      if (!reduceMotion && Math.random() < dt*5) bubbles.push({ x:x + face*14, y:y - 40, life:1.4 });
      bubbles.forEach(b => { b.y -= 60*dt; b.x += Math.sin(b.y*.1)*.5; b.life -= dt; }); bubbles = bubbles.filter(b => b.life > 0);
      if (air <= 0){ air = 0; finish(false); }
      if (x >= GOAL){ done = true; doneT = 0; anim.happy = 4; }
    },
    draw(){
      const cam = clamp(x - 280, 0, GOAL + 400 - W);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5ec8e0'); g.addColorStop(.25, '#2a8ab8'); g.addColorStop(1, '#0f3a6a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // sunbeams from the surface
      if (!reduceMotion) for (let i=0;i<6;i++){ const bx = wrap(i*170 - cam*.2 + Math.sin(t*.3 + i)*30, W + 200) - 100; ctx.fillStyle = 'rgba(255,255,230,.07)'; ctx.beginPath(); ctx.moveTo(bx, TOP - 10); ctx.lineTo(bx + 50, TOP - 10); ctx.lineTo(bx + 140, H); ctx.lineTo(bx + 60, H); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(220,250,255,.6)'; ctx.beginPath(); ctx.moveTo(0, TOP - 14); for (let sx = 0; sx <= W; sx += 20) ctx.lineTo(sx, TOP - 14 + Math.sin(sx*.03 + t*2)*4); ctx.lineTo(W, 0); ctx.lineTo(0, 0); ctx.fill();
      // a school of fish far behind
      for (let i=0;i<14;i++){ const fx = wrap(i*60 - cam*.3 - t*40, W + 400) - 200, fy = 180 + Math.sin(i*1.7)*40 + Math.sin(t + i)*6; ctx.fillStyle = 'rgba(160,220,240,.35)'; ctx.beginPath(); ctx.ellipse(fx, fy, 8, 3.5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx + 6, fy); ctx.lineTo(fx + 12, fy - 4); ctx.lineTo(fx + 12, fy + 4); ctx.fill(); }
      // sandy floor with coral and kelp
      ctx.fillStyle = '#e8d098'; ctx.beginPath(); ctx.moveTo(0, H); for (let sx = 0; sx <= W; sx += 20) ctx.lineTo(sx, BOT + 24 + Math.sin((sx + cam)*.01)*8); ctx.lineTo(W, H); ctx.fill();
      for (let i = Math.floor(cam/90) - 1; i*90 - cam < W + 90; i++){ const cx = i*90 - cam + hash(i)*40, cy = BOT + 26, kind = hash(i + 3);
        if (kind < .35){ ctx.strokeStyle = '#3f8a4a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx, cy); for (let k=1;k<7;k++) ctx.lineTo(cx + Math.sin(t*1.5 + k*.7 + i)*8, cy - k*22); ctx.stroke(); }
        else if (kind < .7){ ctx.fillStyle = ['#ff7a8a', '#ffb05a', '#c07ae0'][((i % 3) + 3) % 3]; for (let k=0;k<5;k++){ ctx.beginPath(); ctx.ellipse(cx - 16 + k*8, cy - 14 - (k % 2)*10, 5, 16 + (k % 2)*6, (k - 2)*.25, 0, 7); ctx.fill(); } }
        else { ctx.fillStyle = '#e07a9a'; circle(cx, cy - 8, 14); ctx.fillStyle = '#ffa0b8'; for (let k=0;k<6;k++) circle(cx + Math.cos(k)*10, cy - 10 + Math.sin(k)*6, 3); } }
      // the sunken ship
      { const sx = GOAL + 120 - cam; if (sx < W + 300){ ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.moveTo(sx - 40, BOT + 20); ctx.lineTo(sx + 300, BOT - 10); ctx.lineTo(sx + 330, BOT - 110); ctx.lineTo(sx - 60, BOT - 80); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#3a2416'; ctx.fillRect(sx + 120, BOT - 300, 12, 220); ctx.fillStyle = 'rgba(230,220,200,.6)'; ctx.beginPath(); ctx.moveTo(sx + 132, BOT - 290); ctx.lineTo(sx + 210, BOT - 230); ctx.lineTo(sx + 132, BOT - 170); ctx.fill();
        for (let k=0;k<4;k++){ ctx.fillStyle = '#1a0e08'; circle(sx + 20 + k*60, BOT - 50 + k*-5, 10); }
        const cg = ctx.createRadialGradient(sx + 60, BOT - 40, 2, sx + 60, BOT - 40, 60); cg.addColorStop(0, 'rgba(255,230,120,.7)'); cg.addColorStop(1, 'rgba(255,230,120,0)'); ctx.fillStyle = cg; circle(sx + 60, BOT - 40, 60); } }
      for (const o of things){ const sx = o.x - cam; if (sx < -80 || sx > W + 80) continue;
        if (o.k === 'pearl' && !o.got){ ctx.fillStyle = 'rgba(255,255,255,.3)'; circle(sx, o.y, 12); ctx.fillStyle = '#f6f0ff'; circle(sx, o.y, 7); ctx.fillStyle = '#fff'; circle(sx - 2, o.y - 2, 2.5); }
        else if (o.k === 'jelly'){ const jy = o.y0 + Math.sin(t*.8 + o.ph)*60, p = Math.sin(t*3 + o.ph)*3; ctx.fillStyle = 'rgba(255,160,220,.7)'; ctx.beginPath(); ctx.ellipse(sx, jy, 20 + p, 16 - p*.5, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,160,220,.6)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=0;i<5;i++){ ctx.moveTo(sx - 14 + i*7, jy); for (let k=1;k<5;k++) ctx.lineTo(sx - 14 + i*7 + Math.sin(t*4 + i + k)*3, jy + k*8); } ctx.stroke(); }
        else if (o.k === 'puff'){ const py = o.y + Math.sin(t + o.ph)*20, r = 12 + o.puff*16; ctx.fillStyle = '#f2c230'; circle(sx, py, r); if (o.puff > .3){ ctx.strokeStyle = '#b8862a'; ctx.lineWidth = 2; ctx.beginPath(); for (let k=0;k<12;k++){ const a = k/12*Math.PI*2; ctx.moveTo(sx + Math.cos(a)*r, py + Math.sin(a)*r); ctx.lineTo(sx + Math.cos(a)*(r + 6), py + Math.sin(a)*(r + 6)); } ctx.stroke(); } ctx.fillStyle = '#fff'; circle(sx - r*.4, py - r*.3, 4); ctx.fillStyle = '#1a1a1a'; circle(sx - r*.45, py - r*.3, 2); ctx.fillStyle = '#e8a03a'; ctx.beginPath(); ctx.moveTo(sx + r - 2, py); ctx.lineTo(sx + r + 10, py - 7); ctx.lineTo(sx + r + 10, py + 7); ctx.fill(); }
        else if (o.k === 'eel'){ ctx.fillStyle = '#6a6a5a'; ctx.beginPath(); ctx.ellipse(sx, BOT + 20, 36, 16, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#1a1a14'; ctx.beginPath(); ctx.ellipse(sx + 10, BOT + 16, 14, 8, 0, Math.PI, 0); ctx.fill();
          const out = o.out || 0; if (out > .05){ ctx.strokeStyle = '#6a9a3a'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx + 10, BOT + 14); ctx.quadraticCurveTo(sx + 10 + Math.sin(t*4)*12, BOT - out*70, sx + 10, BOT + 10 - out*140); ctx.stroke(); ctx.lineCap = 'butt'; ctx.fillStyle = '#fff'; circle(sx + 14, BOT + 6 - out*140, 3); ctx.fillStyle = '#1a1a1a'; circle(sx + 15, BOT + 6 - out*140, 1.5); } }
        else if (o.k === 'vent'){ ctx.fillStyle = '#6a6a7a'; ctx.beginPath(); ctx.ellipse(sx, BOT + 22, 26, 10, 0, Math.PI, 0); ctx.fill(); for (let i=0;i<10;i++){ const by = BOT + 10 - wrap(t*90 + i*40, 380), bx = sx + Math.sin(t*3 + i)*10; ctx.strokeStyle = 'rgba(230,250,255,.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by, 3 + (i % 3)*2, 0, 7); ctx.stroke(); } }
      }
      for (const b of bubbles){ ctx.strokeStyle = `rgba(230,250,255,${b.life*.6})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x - cam, b.y, 3, 0, 7); ctx.stroke(); }
      // you, swimming in your bubble helmet with a little air tank
      if (!(inv > 0 && Math.floor(inv*12) % 2 === 0)){ const sx = x - cam;
        ctx.save(); ctx.translate(sx, y); ctx.rotate(clamp(vx/900, -.3, .3)*face*0 + Math.sin(t*4)*.05);
        ctx.fillStyle = '#e0464f'; rr(-face*18 - 6, -48, 12, 26, 5); ctx.fill();
        Chin.draw(ctx, 'me', anim, 0, 0, { scale:.07, face, grounded:false, speed:0 });
        ctx.fillStyle = 'rgba(200,240,255,.22)'; circle(face*4, -40, 26); ctx.strokeStyle = 'rgba(230,250,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(face*4, -40, 26, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(face*4 - 10, -52, 6, 3, -.6, 0, 7); ctx.fill();
        ctx.restore(); }
      drawPops(cam);
    },
    hud(){
      hudBar(); for (let i=0;i<3;i++) heart(30 + i*28, 30, i < hearts);
      ctx.fillStyle = '#fff6e4'; ctx.fillText('Air', 118, 31); ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(156, 22, 120, 16, 6); ctx.fill(); ctx.fillStyle = air > 40 ? '#8ae0ff' : air > 20 ? '#ffe66e' : '#ff6a8a'; rr(156, 22, 120*air/100, 16, 6); ctx.fill();
      progress(x/GOAL, '#8ae0ff');
      ctx.fillStyle = '#f6f0ff'; ctx.textAlign = 'right'; ctx.fillText(`○ ${pearls}`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ y = 220 + Math.sin(t)*20; x = 150 + Math.sin(t*.5)*30; },
  };
})();

// ================= The Enchanted Kingdom: the Wizard's Tower =================
// Bounce up the floating stepping stones around the wizard's tower, all the way to the top where
// a friendly dragon is waiting. You bounce by yourself; just steer left and right.
const TOWER = (() => {
  const GOAL = 5600, JUMP = -820, GRAV = 1500;
  let plats, gems, wisps, x, y, vx, vy, camY, hearts, got, inv, done, doneT, best, face;
  // every row has a stepping stone you can always reach from the one below (a bounce carries you
  // about 300px sideways), and sometimes a bonus stone too. Crumbly stones are only ever bonus stones,
  // and moving stones sway around their spot instead of sliding across the whole tower.
  function build(){
    const r = rng(1212); plats = [{ x:400, y:440, w:760, k:'ground' }]; gems = []; wisps = [];
    let py = 440, lastX = 400;
    while (py > -GOAL + 80){
      const late = -py/GOAL; py -= 72 + r()*(30 + late*20);
      const k = r(), kind = k < .1 ? 'spring' : k < .32 + late*.2 ? 'move' : 'stone';
      const dir = r() < .5 ? -1 : 1, d = 40 + r()*190; let px = lastX + dir*d; if (px < 70 || px > 730) px = lastX - dir*d; lastX = px;
      plats.push({ x:px, y:py, w:kind === 'spring' ? 80 : 108, k:kind, home:px, vx:kind === 'move' ? (r() < .5 ? -1 : 1)*(30 + r()*25) : 0 });
      if (r() < .4){ const bx = 70 + r()*660, bk = r() < .45 + late*.3 ? 'crumble' : r() < .3 ? 'spring' : 'stone'; plats.push({ x:bx, y:py - 20 + r()*40, w:bk === 'spring' ? 74 : 90, k:bk, home:bx, vx:0 }); }
      if (r() < .35) gems.push({ x:px, y:py - 44 });
      if (py < -1200 && r() < .07) wisps.push({ x:r()*800, y:py - 60, v:(r() < .5 ? -1 : 1)*(50 + r()*30), ph:r()*6 });
    }
    plats.push({ x:400, y:-GOAL, w:360, k:'top' });
  }
  function respawn(){ const py = camY + H - 70; plats.push({ x, y:py, w:110, k:'cloud', life:4 }); y = py - 2; vy = JUMP*1.1; inv = 1.5; }
  return {
    title:'The Wizard’s Tower', sub:'Bounce your way to the Enchanted Kingdom.',
    blurb:'The flickering portal dropped you at the foot of a wizard’s tower, with magic stepping stones floating all the way up. You bounce by yourself: steer onto the stones and climb to the very top!',
    legend:['← → to steer (you bounce by yourself)', 'Go off one side and you come back on the other', 'Mushrooms bounce you extra high', 'Cracked stones crumble after one bounce', 'Dodge the grumpy wisps', 'If you fall, a fairy catches you (5 hearts)'],
    hints:['← → to steer', 'P to pause'], pad:['wgLeft', 'wgRight'],
    winTitle:'You reached the top!', winText:'At the top of the tower, a friendly little dragon curls its tail around you and flies you down into the Enchanted Kingdom.',
    loseTitle:'The fairy’s tired', loseText:'The fairy catches you one last time and carries you home. The tower will still be here tomorrow!',
    againWinText:'Top of the tower again! The dragon gives you a warm, toasty hug.', againLoseText:'The fairy gently floats you back down to the kingdom.',
    reset(){ build(); x = 400; y = 440; vx = 0; vy = JUMP; camY = 0; hearts = 5; got = 0; inv = 0; done = false; doneT = 0; best = 440; face = 1; },
    seeds:() => got*2, stats:() => `<span>Gems ${got}</span><span>Height ${Math.round((440 - best)/10)} m</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      if (done){ doneT += dt; if (doneT > 1.6) finish(true); return; }
      const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0); if (ax) face = ax;
      vx += (ax*340 - vx)*Math.min(1, dt*8);
      x += vx*dt; if (x < -20) x += 840; if (x > 820) x -= 840;
      const oy = y; vy += GRAV*dt; y += vy*dt; inv = Math.max(0, inv - dt);
      for (const p of plats){
        if (p.k === 'move'){ p.x += p.vx*dt; if (Math.abs(p.x - p.home) > 70) p.vx = -Math.sign(p.x - p.home)*Math.abs(p.vx); }
        if (p.k === 'cloud'){ p.life -= dt; }
        if (p.broken){ p.broken += dt; continue; }
        if (vy > 0 && oy <= p.y && y >= p.y && Math.abs(x - p.x) < p.w/2 + 16){
          if (p.k === 'top'){ y = p.y; vy = 0; done = true; doneT = 0; anim.happy = 4; return; }
          y = p.y; vy = p.k === 'spring' ? JUMP*1.55 : JUMP; if (p.k === 'spring') pop(x, y - camY - 60, 'Boing!', '#ff9ae8');
          if (p.k === 'crumble') p.broken = .01;
        }
      }
      plats = plats.filter(p => !(p.k === 'cloud' && p.life <= 0) && !(p.broken > 1));
      for (const gm of gems) if (!gm.got && Math.hypot(gm.x - x, gm.y - (y - 30)) < 30){ gm.got = true; got++; anim.chew = .3; }
      for (const w of wisps){ w.x += w.v*dt; if (w.x < -40) w.x = 840; if (w.x > 840) w.x = -40; const wy = w.y + Math.sin(t*2 + w.ph)*14;
        if (inv <= 0 && Math.hypot(w.x - x, wy - (y - 30)) < 32){ hearts--; inv = 1.5; shake = .3; vy = Math.max(vy, 150); pop(x, y - camY - 80, 'Boo!', '#d8c0ff'); if (hearts <= 0){ finish(false); return; } } }
      best = Math.min(best, y);
      camY = Math.min(camY, y - 250);
      if (y > camY + H + 60){ hearts--; shake = .3; if (hearts <= 0){ finish(false); return; } pop(x, H - 140, 'Caught by a fairy!', '#ffe9a8'); respawn(); }
    },
    draw(){
      const k = clamp(-camY/GOAL, 0, 1);
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, `rgb(${Math.round(90 - k*70)},${Math.round(110 - k*90)},${Math.round(190 - k*120)})`); g.addColorStop(1, `rgb(${Math.round(240 - k*170)},${Math.round(170 - k*110)},${Math.round(150 - k*40)})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (k > .3) for (let i=0;i<70;i++){ ctx.fillStyle = `rgba(255,255,255,${(k - .3)*1.4*(.4 + .6*Math.max(0, Math.sin(t + i)))})`; circle(hash(i)*W, wrap(hash(i + 2)*H*2 - camY*.05, H), hash(i + 5)*1.4 + .4); }
      ctx.fillStyle = `rgba(255,250,230,${.4 + k*.5})`; circle(650, 90 - camY*.02, 30);
      // far-off castle hills at the bottom, sliding away as you climb
      { const hy = 420 - camY*.3; if (hy < H + 200){ ctx.fillStyle = '#6a8ac0'; ctx.beginPath(); ctx.moveTo(0, hy); for (let sx = 0; sx <= W; sx += 40) ctx.lineTo(sx, hy - 40 - Math.sin(sx*.01)*30); ctx.lineTo(W, H + 400); ctx.lineTo(0, H + 400); ctx.fill();
        ctx.fillStyle = '#8a9ad0'; for (const [cx, h] of [[140, 90], [180, 130], [220, 90]]){ ctx.fillRect(cx - 14, hy - 40 - h, 28, h); ctx.beginPath(); ctx.moveTo(cx - 18, hy - 40 - h); ctx.lineTo(cx, hy - 70 - h); ctx.lineTo(cx + 18, hy - 40 - h); ctx.fill(); } } }
      // clouds drifting by
      for (let i=0;i<8;i++){ const cy = wrap(hash(i)*1400 - camY*.5, 1400) - 300, cx = wrap(hash(i + 3)*W + t*(8 + i*2), W + 200) - 100; ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(cx, cy, 30); circle(cx + 30, cy + 6, 24); circle(cx - 28, cy + 8, 20); }
      // the wizard's tower in the middle
      ctx.fillStyle = '#7a6a8a'; ctx.fillRect(300, 0, 200, H);
      for (let row = Math.floor(camY/30) - 1; row*30 - camY < H + 30; row++){ const sy = row*30 - camY; ctx.strokeStyle = 'rgba(40,30,60,.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(300, sy); ctx.lineTo(500, sy); for (let c=0;c<5;c++){ const bx = 300 + c*44 + (row % 2)*22; ctx.moveTo(bx, sy); ctx.lineTo(bx, sy + 30); } ctx.stroke();
        if (row % 9 === 0){ const wg = ctx.createRadialGradient(400, sy + 15, 2, 400, sy + 15, 40); wg.addColorStop(0, 'rgba(255,220,120,.5)'); wg.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = wg; circle(400, sy + 15, 40); ctx.fillStyle = '#ffd878'; ctx.beginPath(); ctx.moveTo(388, sy + 30); ctx.lineTo(388, sy + 10); ctx.arc(400, sy + 10, 12, Math.PI, 0); ctx.lineTo(412, sy + 30); ctx.fill(); } }
      // the top: a balcony, a pointy roof and the dragon
      { const ty = -GOAL - camY; if (ty > -300){ ctx.fillStyle = '#5a4a6a'; ctx.fillRect(220, ty, 360, 20); ctx.fillStyle = '#3a4ab0'; ctx.beginPath(); ctx.moveTo(290, ty - 150); ctx.lineTo(400, ty - 300); ctx.lineTo(510, ty - 150); ctx.fill(); ctx.fillStyle = '#7a6a8a'; ctx.fillRect(310, ty - 150, 180, 150); ctx.fillStyle = '#ffe066'; circle(400, ty - 300, 8);
        const dx = 520, dy = ty - 4, bob = Math.sin(t*2)*3; ctx.fillStyle = '#5ab870'; ctx.beginPath(); ctx.ellipse(dx, dy - 24 + bob, 30, 22, 0, 0, 7); ctx.fill(); circle(dx + 26, dy - 50 + bob, 16); ctx.fillStyle = '#8ad89a'; ctx.beginPath(); ctx.ellipse(dx, dy - 18 + bob, 18, 12, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#4a9860'; ctx.beginPath(); ctx.moveTo(dx - 8, dy - 40 + bob); ctx.lineTo(dx - 40, dy - 70 + bob + Math.sin(t*6)*8); ctx.lineTo(dx - 10, dy - 30 + bob); ctx.fill(); ctx.fillStyle = '#fff'; circle(dx + 30, dy - 54 + bob, 5); ctx.fillStyle = '#1a1a1a'; circle(dx + 31, dy - 54 + bob, 2.5); ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(dx + 20, dy - 64 + bob); ctx.lineTo(dx + 22, dy - 76 + bob); ctx.lineTo(dx + 27, dy - 65 + bob); ctx.fill(); } }
      // stepping stones
      for (const p of plats){ const sy = p.y - camY; if (sy < -40 || sy > H + 40 || p.k === 'ground' || p.k === 'top') continue; const a = p.broken ? Math.max(0, 1 - p.broken) : 1; ctx.globalAlpha = a;
        if (p.k === 'spring'){ ctx.fillStyle = '#f6ead6'; ctx.fillRect(p.x - 6, sy, 12, 16); ctx.fillStyle = '#e0464f'; ctx.beginPath(); ctx.ellipse(p.x, sy, p.w/2, 16, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; circle(p.x - 14, sy - 8, 4); circle(p.x + 10, sy - 10, 5); }
        else if (p.k === 'cloud'){ ctx.globalAlpha = Math.min(1, p.life); ctx.fillStyle = '#fff'; circle(p.x - 30, sy + 4, 16); circle(p.x, sy, 20); circle(p.x + 30, sy + 4, 16); ctx.fillStyle = '#ffe9a8'; circle(p.x + 44, sy - 20 + Math.sin(t*8)*3, 5); }
        else { const col = p.k === 'move' ? '#3a4a9a' : p.k === 'crumble' ? '#7a5a4a' : '#4a3a6a'; ctx.fillStyle = 'rgba(30,20,50,.3)'; ctx.beginPath(); ctx.ellipse(p.x, sy + 18, p.w/2 - 6, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = col; rr(p.x - p.w/2, sy - 4 + (p.broken ? p.broken*30 : 0), p.w, 16, 6); ctx.fill(); ctx.fillStyle = p.k === 'move' ? '#9ab0ff' : '#c8b8e8'; ctx.fillRect(p.x - p.w/2 + 4, sy - 4 + (p.broken ? p.broken*30 : 0), p.w - 8, 4);
          if (p.k === 'crumble'){ ctx.strokeStyle = 'rgba(40,30,60,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p.x - 20, sy - 4); ctx.lineTo(p.x - 8, sy + 6); ctx.lineTo(p.x + 4, sy - 2); ctx.lineTo(p.x + 16, sy + 10); ctx.stroke(); }
          if (p.k === 'move'){ ctx.fillStyle = 'rgba(180,220,255,.6)'; circle(p.x - p.w/2 - 4, sy + 4, 4 + Math.sin(t*6)*1.5); circle(p.x + p.w/2 + 4, sy + 4, 4 + Math.cos(t*6)*1.5); } }
        ctx.globalAlpha = 1; }
      { const gy = 440 - camY; if (gy < H + 10){ ctx.fillStyle = '#5a8a4a'; ctx.fillRect(0, gy, W, H); } }
      for (const gm of gems){ if (gm.got) continue; const sy = gm.y - camY + Math.sin(t*3 + gm.x)*4; if (sy < -20 || sy > H + 20) continue; ctx.fillStyle = 'rgba(200,160,255,.35)'; circle(gm.x, sy, 14); ctx.fillStyle = '#b58ae6'; ctx.beginPath(); ctx.moveTo(gm.x, sy - 11); ctx.lineTo(gm.x + 9, sy - 2); ctx.lineTo(gm.x, sy + 11); ctx.lineTo(gm.x - 9, sy - 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(gm.x - 3, sy - 5, 3, 3); }
      for (const w of wisps){ const sy = w.y + Math.sin(t*2 + w.ph)*14 - camY; if (sy < -40 || sy > H + 40) continue; ctx.fillStyle = 'rgba(200,190,255,.8)'; ctx.beginPath(); ctx.arc(w.x, sy, 16, Math.PI, 0); for (let k=0;k<4;k++) ctx.lineTo(w.x + 16 - k*10.6 - 5, sy + 14 + (k % 2)*6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2a1a4a'; circle(w.x - 6, sy - 2, 2.5); circle(w.x + 6, sy - 2, 2.5); ctx.strokeStyle = '#2a1a4a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(w.x, sy + 8, 4, Math.PI + .3, -.3); ctx.stroke(); }
      // you
      if (!(inv > 0 && Math.floor(inv*12) % 2 === 0)){ const sy = y - camY; for (const ox of [0, x < 60 ? 840 : x > 740 ? -840 : null]){ if (ox === null) continue; ctx.save(); ctx.translate(x + ox, sy); if (vy < 0) ctx.scale(.95, 1.05); Chin.draw(ctx, 'me', anim, 0, 0, { scale:.075, face, grounded:false, speed:0 }); ctx.restore(); } }
      drawPops(0);
    },
    hud(){
      hudBar(); for (let i=0;i<5;i++) heart(30 + i*26, 30, i < hearts);
      ctx.fillStyle = '#b58ae6'; ctx.fillText(`◆ ${got}`, 170, 31);
      progress((440 - best)/(GOAL + 440), '#b58ae6');
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`${Math.round((440 - best)/10)} m`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ vy += GRAV*dt; y += vy*dt; if (y >= 440){ y = 440; vy = JUMP; } },
  };
})();

// ================= Dusty Gulch: Sheriff's Target Practice =================
// A cork-popper shooting gallery on Main Street. Knock the cans and bottles off the fence and pop
// the wooden bandits when they peek out, but don't hit Granny or Biscuit the dog!
const WEST = (() => {
  const LEN = 45, NEED = 45, WINDOWS = [[250, 170], [400, 170], [550, 170]], BARRELS = [120, 330, 530, 700];
  let targets, score, ammo, reload, aim, spawnT, puffs, hits, oops, timeLeft;
  function spawn(){
    const r = Math.random();
    if (r < .35){ const x = 80 + Math.floor(Math.random()*10)*70; if (targets.some(q => q.fence && Math.abs(q.x - x) < 40)) return; targets.push({ k:Math.random() < .6 ? 'can' : 'bottle', x, y:382, fence:true, life:6, up:1 }); }
    else if (r < .92){ const spot = Math.random() < .5 ? { x:WINDOWS[Math.floor(Math.random()*3)][0], y:190, win:true } : { x:BARRELS[Math.floor(Math.random()*4)], y:330 };
      if (targets.some(q => !q.fence && Math.abs(q.x - spot.x) < 50 && Math.abs(q.y - spot.y) < 50)) return;
      const f = Math.random(); targets.push({ k:f < .72 ? 'bandit' : f < .86 ? 'granny' : 'dog', x:spot.x, y:spot.y, win:spot.win, life:1.5 + Math.random()*.9, up:0, max:0 }); }
    else targets.push({ k:'weed', x:-40, y:440, vx:260 + Math.random()*120, life:6, up:1 });
  }
  const POINTS = { can:1, bottle:2, bandit:3, weed:5, granny:-5, dog:-5 };
  function shoot(px, py){
    if (reload > 0 || ammo <= 0) return; ammo--; puffs.push({ x:px, y:py, life:.35 });
    let best = null;
    for (const tg of targets){ if (tg.dead) continue; const cy = tg.fence ? tg.y - 16 : tg.k === 'weed' ? tg.y - 16 : tg.y - 40*tg.up; const r = tg.fence ? 16 : tg.k === 'weed' ? 22 : 30;
      if (tg.up > .5 && Math.hypot(px - tg.x, py - cy) < r) best = tg; }
    if (best){ best.dead = .01; const pts = POINTS[best.k]; score = Math.max(0, score + pts);
      if (pts > 0){ hits++; pop(best.x, py - 20, `+${pts}`, '#ffe066'); anim.happy = .5; } else { oops++; shake = .25; pop(best.x, py - 20, best.k === 'dog' ? 'Not Biscuit! −5' : 'Not Granny! −5', '#ff8a9a'); } }
    if (ammo <= 0) reload = 1;
  }
  function board(x, y, k, up, win){
    ctx.save(); ctx.translate(x, y); ctx.beginPath(); if (win) ctx.rect(-44, -160, 88, 144); else ctx.rect(-50, -120, 100, 120); ctx.clip(); ctx.translate(0, 70*(1 - up));
    ctx.fillStyle = '#c9a06a'; ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, -46, 26, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillRect(-22, -24, 44, 30); ctx.strokeRect(-22, -24, 44, 30);
    if (k === 'bandit'){ ctx.fillStyle = '#2a2020'; ctx.fillRect(-32, -70, 64, 8); rr(-18, -92, 36, 24, 6); ctx.fill(); ctx.fillStyle = '#d0452f'; ctx.beginPath(); ctx.moveTo(-24, -42); ctx.lineTo(24, -42); ctx.lineTo(0, -22); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(-9, -50, 3); circle(9, -50, 3); ctx.fillRect(-14, -58, 10, 2); ctx.fillRect(4, -58, 10, 2); }
    else if (k === 'granny'){ ctx.fillStyle = '#d8d8e0'; circle(0, -70, 12); circle(-20, -54, 9); circle(20, -54, 9); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-9, -48, 6, 0, 7); ctx.moveTo(15, -48); ctx.arc(9, -48, 6, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -36, 7, .3, Math.PI - .3); ctx.stroke(); ctx.fillStyle = '#e79ab8'; ctx.fillRect(-22, -20, 44, 26); ctx.fillStyle = 'rgba(255,120,140,.5)'; circle(-16, -38, 4); circle(16, -38, 4); }
    else { ctx.fillStyle = '#a0703a'; ctx.beginPath(); ctx.ellipse(-24, -44, 9, 20, .3, 0, 7); ctx.ellipse(24, -44, 9, 20, -.3, 0, 7); ctx.fill(); ctx.fillStyle = '#f6ead6'; ctx.beginPath(); ctx.ellipse(0, -38, 12, 10, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(0, -44, 4); circle(-9, -54, 3); circle(9, -54, 3); ctx.fillStyle = '#e0464f'; ctx.beginPath(); ctx.ellipse(0, -30, 4, 6, 0, 0, Math.PI); ctx.fill(); }
    ctx.restore();
  }
  return {
    title:'Sheriff’s Target Practice', sub:'Prove your aim on Main Street in Dusty Gulch.',
    blurb:'The flickering portal whisked you to a dusty desert town! The sheriff hands you a cork popper: score 45 points at the shooting gallery and she’ll make you an honorary deputy.',
    legend:['Move the mouse (or ← → ↑ ↓) to aim, click (or Space) to pop a cork', 'Cans 1, bottles 2, wooden bandits 3, tumbleweeds 5', 'Don’t hit Granny or Biscuit the dog (−5)!', '6 corks, then a quick reload', 'Score 45 before the clock runs out'],
    hints:['Mouse or arrows to aim, click or Space to shoot', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgUp', 'wgDown', 'wgAction'], actionLabel:'Pop!', clicks:true,
    winTitle:'Welcome, Deputy!', winText:'The sheriff pins a shiny tin star on your chest and tips her hat. “Welcome to Dusty Gulch, Deputy!”',
    loseTitle:'Out of time', loseText:'“Not bad, pardner!” says the sheriff. “Come back and practice some more.” The portal whisks you home.',
    againWinText:'Sharpshooter! The whole town claps from the boardwalk.', againLoseText:'“Keep practicing, Deputy!” The sheriff hands you more corks for next time.',
    reset(){ targets = []; score = 0; ammo = 6; reload = 0; aim = { x:W/2, y:260 }; spawnT = .5; puffs = []; hits = 0; oops = 0; timeLeft = LEN; },
    seeds:() => Math.floor(score/5), stats:() => `<span>Score ${score}</span><span>Hits ${hits}</span><span>Oopsies ${oops}</span>`,
    update(dt){
      time += dt; timeLeft = LEN - time;
      if (input.aim){ aim.x = input.aim.x; aim.y = input.aim.y; input.aim = null; }
      aim.x = clamp(aim.x + ((input.right ? 1 : 0) - (input.left ? 1 : 0))*420*dt, 10, W - 10); aim.y = clamp(aim.y + ((input.down ? 1 : 0) - (input.up ? 1 : 0))*420*dt, 60, H - 10);
      if (input.pressed){ input.pressed = false; shoot(aim.x, aim.y); }
      if (input.click){ aim.x = input.click.x; aim.y = input.click.y; input.click = null; shoot(aim.x, aim.y); }
      if (reload > 0){ reload -= dt; if (reload <= 0){ reload = 0; ammo = 6; } }
      spawnT -= dt; if (spawnT <= 0){ spawnT = .45 + Math.random()*.45; spawn(); }
      for (const tg of targets){
        if (tg.dead){ tg.dead += dt; continue; }
        tg.life -= dt; if (tg.k === 'weed') tg.x += tg.vx*dt;
        if (!tg.fence && tg.k !== 'weed') tg.up = tg.life > .3 ? Math.min(1, tg.up + dt*5) : Math.max(0, tg.life/.3);
      }
      targets = targets.filter(tg => (!tg.dead || tg.dead < .8) && tg.life > 0 && tg.x < W + 60);
      puffs.forEach(p => p.life -= dt); puffs = puffs.filter(p => p.life > 0);
      if (score >= NEED){ finish(true); return; }
      if (timeLeft <= 0) finish(false);
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f2a060'); g.addColorStop(.5, '#f6d08a'); g.addColorStop(1, '#e8c080');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fff3c0'; circle(680, 110, 36);
      ctx.fillStyle = '#c0704a'; ctx.beginPath(); ctx.moveTo(0, 250); ctx.lineTo(60, 250); ctx.lineTo(80, 200); ctx.lineTo(200, 200); ctx.lineTo(220, 250); ctx.lineTo(560, 250); ctx.lineTo(590, 180); ctx.lineTo(720, 180); ctx.lineTo(750, 250); ctx.lineTo(W, 250); ctx.lineTo(W, 300); ctx.lineTo(0, 300); ctx.fill();
      // the saloon front
      ctx.fillStyle = '#8a5a32'; ctx.fillRect(170, 90, 460, 210); ctx.fillStyle = '#7a4a28'; ctx.fillRect(150, 70, 500, 34);
      ctx.fillStyle = '#f6ead6'; ctx.font = '700 22px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('SHOOTIN’ GALLERY', 400, 95); ctx.textAlign = 'left';
      ctx.strokeStyle = 'rgba(40,24,12,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 190; x < 630; x += 22){ ctx.moveTo(x, 104); ctx.lineTo(x, 300); } ctx.stroke();
      for (const [wx, wy] of WINDOWS){ ctx.fillStyle = '#2a1a0e'; ctx.fillRect(wx - 44, wy - 70, 88, 74); ctx.strokeStyle = '#5c3a22'; ctx.lineWidth = 5; ctx.strokeRect(wx - 44, wy - 70, 88, 74); }
      // cutouts in the windows go behind the sills
      for (const tg of targets) if (tg.win && !tg.dead) board(tg.x, tg.y, tg.k, tg.up, true);
      for (const [wx, wy] of WINDOWS){ ctx.fillStyle = '#6b4a2b'; ctx.fillRect(wx - 50, wy + 2, 100, 10); }
      // the street, barrels and the fence
      ctx.fillStyle = '#d8b070'; ctx.fillRect(0, 300, W, H - 300);
      for (const tg of targets) if (!tg.win && !tg.fence && tg.k !== 'weed' && !tg.dead) board(tg.x, tg.y, tg.k, tg.up);
      for (const bx of BARRELS){ ctx.fillStyle = '#8a5a32'; rr(bx - 30, 300, 60, 60, 8); ctx.fill(); ctx.fillStyle = '#4a4a4a'; ctx.fillRect(bx - 30, 312, 60, 5); ctx.fillRect(bx - 30, 342, 60, 5); }
      ctx.fillStyle = '#7a5230'; ctx.fillRect(0, 382, W, 12); for (let x = 20; x < W; x += 70) ctx.fillRect(x, 382, 10, 60); ctx.fillRect(0, 410, W, 8);
      for (const tg of targets){
        if (tg.fence){ const d = tg.dead || 0, x = tg.x + d*200, y = tg.y - d*220 + d*d*500; ctx.save(); ctx.translate(x, y); ctx.rotate(d*12);
          if (tg.k === 'can'){ ctx.fillStyle = '#b8c0c8'; rr(-9, -26, 18, 26, 3); ctx.fill(); ctx.fillStyle = '#d0452f'; ctx.fillRect(-9, -18, 18, 10); }
          else { ctx.fillStyle = 'rgba(90,170,110,.85)'; rr(-8, -24, 16, 24, 4); ctx.fill(); ctx.fillRect(-3, -36, 6, 14); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-5, -20, 3, 14); }
          ctx.restore(); }
        else if (tg.k === 'weed'){ ctx.save(); ctx.translate(tg.x, tg.y - 20 - Math.abs(Math.sin(tg.x*.03))*20); ctx.rotate(tg.x*.05); ctx.strokeStyle = tg.dead ? 'rgba(160,120,60,.3)' : '#a07a40'; ctx.lineWidth = 2; for (let k=0;k<8;k++){ ctx.beginPath(); ctx.arc(0, 0, 8 + k*2, k, k + 3); ctx.stroke(); } ctx.restore(); }
        else if (tg.dead && tg.dead < .5 && tg.k === 'bandit'){ ctx.fillStyle = `rgba(255,230,120,${1 - tg.dead*2})`; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('POP!', tg.x, tg.y - 50); ctx.textAlign = 'left'; }
      }
      for (const p of puffs){ ctx.fillStyle = `rgba(255,250,240,${p.life*2})`; circle(p.x, p.y, 10 + (.35 - p.life)*40); }
      // the crosshair and your cork popper
      ctx.strokeStyle = reload > 0 ? 'rgba(120,80,60,.6)' : '#e0464f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(aim.x, aim.y, 16, 0, 7); ctx.moveTo(aim.x - 24, aim.y); ctx.lineTo(aim.x - 8, aim.y); ctx.moveTo(aim.x + 8, aim.y); ctx.lineTo(aim.x + 24, aim.y); ctx.moveTo(aim.x, aim.y - 24); ctx.lineTo(aim.x, aim.y - 8); ctx.moveTo(aim.x, aim.y + 8); ctx.lineTo(aim.x, aim.y + 24); ctx.stroke();
      { const gx = 400 + (aim.x - 400)*.3, a = Math.atan2(aim.y - 505, aim.x - gx); ctx.save(); ctx.translate(gx, 505); ctx.rotate(a); ctx.fillStyle = '#6b4a2b'; rr(-10, -9, 70, 18, 5); ctx.fill(); ctx.fillStyle = '#c9a13a'; ctx.fillRect(40, -6, 30, 12); ctx.fillStyle = '#e8d8b8'; circle(74, 0, 5); ctx.restore(); }
      if (reload > 0){ ctx.fillStyle = '#fff6e4'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('Reloading…', aim.x, aim.y + 44); ctx.textAlign = 'left'; }
      drawPops(0);
    },
    hud(){
      hudBar(); ctx.fillStyle = score >= NEED ? '#ffe066' : '#fff6e4'; ctx.fillText(`Score ${score}/${NEED}`, 24, 31);
      for (let i=0;i<6;i++){ ctx.fillStyle = i < ammo ? '#e8d8b8' : 'rgba(246,234,214,.2)'; rr(190 + i*16, 22, 10, 16, 4); ctx.fill(); }
      progress(score/NEED, '#e0a040');
      ctx.fillStyle = timeLeft < 10 ? '#ff8a9a' : '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
})();

// ================= Dusty Gulch: Pepper & the Pie Bandits =================
// The Raccoon Gang (they were born wearing bandit masks) has robbed the Dusty Gulch pie train!
// Ride Pepper the pony through three acts:
//   1. The Chase:          gallop after the runaway train, jump cacti and dodge the pies they throw
//   2. Train-Top Tango:    run along the roof, lasso raccoons, stomp them, duck under low bridges
//   3. The Great Getaway:  Big Bramble escapes in a hot-air balloon; lasso its sandbags to bring it down
// Getting hit means a cream pie in the face (and your hat flies off). Fill the Yeehaw meter for a stampede!
const PEPPER = new Image(); PEPPER.src = 'characters/pepper.png';
// Big Bramble, the raccoon outlaw who leads the Raccoon Gang, and the town's weasel sheriff
const BRAMBLE = new Image(); BRAMBLE.src = 'characters/bramble.png';
const SHERIFF = new Image(); SHERIFF.src = 'characters/sheriff.png';
// draws a picture standing with its feet at (x, y), h tall; face -1 turns it to the left
function standee(img, x, y, h, face){ const iw = img.naturalWidth ?? img.width, ih = img.naturalHeight ?? img.height; if (!iw || img.complete === false) return; const w = h*iw/ih; ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.drawImage(img, -w/2, -h, w, h); ctx.restore(); }
// Pepper's gallop: 12 frames side by side (standing, then an 11-frame gallop loop), lined up on her
// nose so her head stays steady. SEAT is where her back is in each frame, so you ride along with her.
const GALLOP = new Image(); GALLOP.src = 'characters/pepper-gallop.png';
const G_CELL = { w:285, h:240, feet:229, seatX:118, SEAT:[114, 109, 109, 108, 108, 111, 115, 119, 119, 120, 120, 122] }, G_RUN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], G_AIR = 6, G_DUCK = 9;
const OUTLAWS = (() => {
  const GROUND = 410, ROOF = 300, PW = 128, PH = 120, TRAIN_V = 330, CAR = 270, GAP = 60, NCARS = 8;
  const QUIPS = ['Yeehaw!', 'Neigh-ce!', 'Hold onto your hat!', 'Giddy-up!', 'Hoof-tastic!'];
  let act, banner, bT, hats, pies, shoes, yee, stamp, inv, splat, blobs, dizzy, px, py, vy, duck, face, speed, slowT, cam;
  let things, nextSpawn, flying, decals, trainX, throwT, lasso, bandits, bridges, bridgeT, bgOff, cars, loco;
  let boss, bags, popped, bossT, doneT, bison, whoa, lassoCD, dodgeT, gPhase = 0;
  // ---------- setting up each act ----------
  function act1(){ act = 1; px = 0; py = GROUND; vy = 0; speed = 400; trainX = 1300; things = []; nextSpawn = 600; flying = []; throwT = 2; cam = 0; show('Act 1: The Chase', 'The pie train is getting away! Gallop after it: → faster, Space to jump. Dodge the flying pies!'); }
  function act2(){ act = 2; hats = 3; px = 60; py = ROOF; vy = 0; flying = []; things = []; bridges = []; bridgeT = 3.5; bgOff = 0; cam = 0; lasso = null;
    cars = []; for (let i=0;i<NCARS;i++) cars.push({ x:i*(CAR + GAP), w:CAR, col:['#a0442f', '#7a4a2a', '#8a5a2a', '#6a3a2a'][i % 4] }); loco = { x:NCARS*(CAR + GAP), w:320 };
    const r = rng(77); bandits = [];
    for (let i=1;i<NCARS;i++){ const n = i > 4 ? 2 : 1; for (let k=0;k<n;k++) bandits.push({ x:cars[i].x + 70 + k*120 + r()*30, y:ROOF, state:'stand', throwT:1 + r()*2, ph:r()*6 }); }
    for (let i=0;i<NCARS;i++) if (i % 2) things.push({ k:'shoe', x:cars[i].x + 140, y:ROOF - 70 });
    things.push({ k:'hat', x:cars[4].x + 60, y:ROOF - 90 });
    show('Act 2: Train-Top Tango', 'You leap onto the train, and your 3 hats are back! ↑ lasso a raccoon, land on them to stomp, ↓ to duck under low bridges.'); }
  function act3(){ act = 3; hats = 3; px = 200; py = GROUND; vy = 0; flying = []; lasso = null; popped = 0; bossT = 2; doneT = 0; face = 1; cam = 0;
    boss = { x:500, y:120, sink:0 }; bags = [-46, 0, 46].map(o => ({ o, alive:true, fall:0, fy:0 })); lassoCD = 0; dodgeT = 0;
    show('Act 3: The Great Getaway', 'A fresh set of 3 hats! Big Bramble is floating away with the Golden Pie: ↑ to lasso the sandbags on his balloon. Golden pies give you a hat back.'); }
  function show(title, text){ banner = { title, text }; bT = 3; }
  // ---------- shared helpers ----------
  // every hit costs a hat; only a real pie gives you a face full of cream, anything else just makes you dizzy
  function hurt(txt, byPie){
    if (inv > 0 || stamp > 0) return;
    hats--; inv = 1.6; shake = .35; pop(px, py - 150, txt || 'Pie in the face!', '#fff6e4');
    if (byPie){ splat = 1.1; blobs = Array.from({ length:6 }, () => ({ x:80 + Math.random()*640, y:60 + Math.random()*300, r:36 + Math.random()*50 })); }
    else dizzy = 1.2;
    flying.push({ k:'hat', x:px + 10, y:py - 120, vx:-120, vy:-420, spin:0 });
    if (hats <= 0) finish(false);
  }
  // Pepper's body, for pies: a box around her (smaller when she ducks)
  function pieHits(f){ return f.x > px - 58 && f.x < px + 62 && f.y > py - (duck ? 82 : 122) && f.y < py - 8; }
  function addYee(n){ yee = Math.min(100, yee + n); if (yee >= 100 && act < 3){ yee = 0; stamp = 5; anim.happy = 3; pop(px, py - 170, 'STAMPEDE!', '#ffe066'); bison = [0, 1, 2, 3].map(i => ({ x:-200 - i*140, y:GROUND + (i % 2)*18 })); } }
  function jump(){ if (py >= groundAt(px) - 1 && !duck){ vy = act === 2 ? -640 : -700; } }
  // the floor under Pepper: the desert, or the train roof (with gaps between the cars) in act 2
  function groundAt(x){ if (act !== 2) return GROUND; for (const c of [...cars, loco]) if (x + 36 > c.x && x - 36 < c.x + c.w) return ROOF; return 9999; }
  // ---------- drawings ----------
  function rider(x, y, lean, scaleY){
    // Pepper, with the chinchilla riding on her back
    const air = py < groundAt(px) - 2, moving = act === 3 ? Math.abs(speed) > 1 : speed > 20 && !whoa;
    const frame = air ? G_AIR : duck ? G_DUCK : moving ? G_RUN[Math.floor(gPhase) % G_RUN.length] : 0;
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.rotate(lean + (air ? (vy < 0 ? -.1 : .06) : 0)); ctx.scale(1, scaleY);
    if (stamp > 0){ const g = ctx.createRadialGradient(0, -PH/2, 10, 0, -PH/2, 110); g.addColorStop(0, `hsla(${(t*300) % 360},90%,70%,.55)`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; circle(0, -PH/2, 110); }
    if (GALLOP.complete && GALLOP.naturalWidth){
      const k = PH/G_CELL.h*1.07, ox = -G_CELL.w/2*k, oy = -G_CELL.feet*k;
      ctx.drawImage(GALLOP, frame*G_CELL.w, 0, G_CELL.w, G_CELL.h, ox, oy, G_CELL.w*k, G_CELL.h*k);
      Chin.draw(ctx, 'me', anim, ox + G_CELL.seatX*k, oy + (G_CELL.SEAT[frame] + 4)*k, { scale:.058, face:1, grounded:true, speed:0 });
    } else if (PEPPER.complete && PEPPER.naturalWidth){
      ctx.drawImage(PEPPER, -PW/2, -PH, PW, PH);
      Chin.draw(ctx, 'me', anim, -PW/2 + PW*.36, -PH*.47, { scale:.058, face:1, grounded:true, speed:0 });
    }
    ctx.restore();
  }
  function raccoon(x, y, s, f, hat){
    // the Raccoon Gang, from the bandit picture (it faces right, so f = -1 turns them toward Pepper)
    if (!BANDIT.complete || !BANDIT.naturalWidth) return;
    const h = 100*s, w = h*BANDIT.naturalWidth/BANDIT.naturalHeight;
    ctx.save(); ctx.translate(x, y); ctx.scale(f, 1); ctx.rotate(reduceMotion ? 0 : Math.sin(t*3 + x*.05)*.04);   // a little swagger
    ctx.drawImage(BANDIT, -w*.64, -h*.973, w, h);   // feet 64% across, standing right on the spot
    ctx.restore();
  }
  function pie(x, y, gold, rot){
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.fillStyle = gold ? '#c9902a' : '#9aa0ac'; ctx.beginPath(); ctx.moveTo(-16, -2); ctx.lineTo(16, -2); ctx.lineTo(12, 6); ctx.lineTo(-12, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = gold ? '#ffe066' : '#fffaf0'; ctx.beginPath(); ctx.ellipse(0, -3, 16, 7, 0, Math.PI, 0); ctx.fill(); circle(-6, -8, 4); circle(3, -9, 5); circle(10, -6, 3);
    ctx.fillStyle = gold ? '#fff6c8' : '#e0464f'; circle(1, -13, 3);
    ctx.restore();
  }
  function lassoLoop(fx, fy, lx, ly, k){
    ctx.strokeStyle = '#c9a36a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo((fx + lx)/2, Math.min(fy, ly) - 40*(1 - k), lx, ly); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(lx, ly, 18, 9, t*8, 0, 7); ctx.stroke();
  }
  function desert(par){
    const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#f28a5a'); g.addColorStop(.5, '#f6c07a'); g.addColorStop(1, '#f8e0a0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff3c0'; circle(660, 110, 38);
    for (let i = Math.floor(par*.1/420) - 1; i*420 - par*.1 < W + 420; i++){ const x = i*420 - par*.1 + hash(i)*120, h = 80 + hash(i + 2)*80, w = 160 + hash(i + 4)*120; ctx.fillStyle = '#c0704a'; ctx.beginPath(); ctx.moveTo(x - w/2 - 30, GROUND - 60); ctx.lineTo(x - w/2, GROUND - 60 - h); ctx.lineTo(x + w/2, GROUND - 60 - h); ctx.lineTo(x + w/2 + 30, GROUND - 60); ctx.fill(); ctx.fillStyle = '#a85a3a'; ctx.fillRect(x - w/2, GROUND - 60 - h, w, 10); }
    for (let i = Math.floor(par*.4/150) - 1; i*150 - par*.4 < W + 150; i++){ const x = i*150 - par*.4 + hash(i + 7)*60, h = 30 + hash(i + 8)*30; ctx.fillStyle = '#7a9a5a'; rr(x - 5, GROUND - 40 - h, 10, h + 10, 5); ctx.fill(); rr(x - 15, GROUND - 40 - h*.7, 7, h*.35, 3); ctx.fill(); }
    ctx.fillStyle = '#d8b070'; ctx.fillRect(0, GROUND - 4, W, H);
    ctx.strokeStyle = 'rgba(150,110,60,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i = Math.floor(par/60) - 1; i*60 - par < W + 60; i++){ const x = i*60 - par; ctx.moveTo(x, GROUND + 20 + hash(i)*40); ctx.lineTo(x + 18, GROUND + 20 + hash(i)*40); } ctx.stroke();
  }
  function trainCar(x, y, w, col, kind){
    // y is the roof line
    ctx.fillStyle = col; rr(x, y, w, 86, 6); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.15)'; for (let k=1;k<6;k++) ctx.fillRect(x + k*w/6, y + 8, 3, 72);
    ctx.fillStyle = '#4a2e1a'; ctx.fillRect(x - 4, y - 6, w + 8, 8);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x + 6, y + 86, w - 12, 10);
    for (const wx of [x + 34, x + 74, x + w - 74, x + w - 34]){ ctx.fillStyle = '#2a2a2a'; circle(wx, y + 104, 14); ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2; ctx.beginPath(); const a = time*14; ctx.moveTo(wx + Math.cos(a)*12, y + 104 + Math.sin(a)*12); ctx.lineTo(wx - Math.cos(a)*12, y + 104 - Math.sin(a)*12); ctx.stroke(); }
    if (kind === 'pies'){ ctx.fillStyle = '#f6ead6'; rr(x + w/2 - 60, y + 26, 120, 30, 6); ctx.fill(); ctx.fillStyle = '#a0442f'; ctx.font = '700 14px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('PIE EXPRESS', x + w/2, y + 46); ctx.textAlign = 'left'; }
  }
  function locomotive(x, y, w){
    ctx.fillStyle = '#2a2a32'; rr(x, y + 10, w - 90, 76, 8); ctx.fill(); ctx.fillStyle = '#d0452f'; ctx.fillRect(x, y + 50, w - 90, 8);
    ctx.fillStyle = '#3a3a44'; rr(x + w - 130, y - 30, 110, 116, 10); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x + w - 110, y - 12, 34, 30);
    ctx.fillStyle = '#2a2a32'; ctx.fillRect(x + 50, y - 50, 30, 60); ctx.fillRect(x + 42, y - 58, 46, 12);
    ctx.fillStyle = '#c9a13a'; circle(x + 140, y + 4, 12);
    ctx.fillStyle = '#d0452f'; ctx.beginPath(); ctx.moveTo(x + w - 20, y + 86); ctx.lineTo(x + w + 20, y + 100); ctx.lineTo(x + w - 20, y + 100); ctx.fill();
    for (const wx of [x + 40, x + 110, x + 180]){ ctx.fillStyle = '#d0452f'; circle(wx, y + 100, 22); ctx.fillStyle = '#2a2a32'; circle(wx, y + 100, 8); }
    if (!reduceMotion) for (let k=0;k<6;k++){ const q = wrap(time*1.5 + k/6, 1); ctx.fillStyle = `rgba(240,240,240,${.6*(1 - q)})`; circle(x + 65 - q*160, y - 64 - q*70, 12 + q*26); }
  }
  // ---------- the game ----------
  return {
    title:'Pepper & the Pie Bandits', sub:'A wild ride after the Raccoon Gang.',
    blurb:'The Raccoon Gang just robbed the Dusty Gulch pie train, and Big Bramble took the prize-winning Golden Pie! Saddle up on Pepper the pony and get those pies back in a three-act adventure.',
    legend:['Space to jump, ↓ to duck, ← → to slow down and speed up', '↑ throws your lasso at the nearest raccoon (or straight up at the balloon)', 'Land on a raccoon to stomp it', 'Pies and bumps knock your hat off: 3 hats, and a fresh 3 every act', 'A shadow shows where each pie will land', 'Fill the Yeehaw! meter for a buffalo STAMPEDE', 'Three acts: the chase, the train roof and the balloon getaway'],
    hints:['Space jump, ↓ duck, ↑ lasso', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgUp', 'wgDown', 'wgAction'], actionLabel:'Jump',
    winTitle:'The pies are saved!', winText:'Big Bramble splashes down in the horse trough, the Raccoon Gang says sorry, and the whole town has a pie party with Pepper as guest of honor.',
    loseTitle:'Out of hats!', loseText:'You’ve lost every hat in Dusty Gulch! The raccoons get away this time, but Pepper is already stomping to try again.',
    againWinText:'Pie party again! Pepper gets the first slice.', againLoseText:'The raccoons got away with the pies! Pepper snorts: “Next time!”',
    reset(){ hats = 3; pies = 0; shoes = 0; yee = 0; stamp = 0; inv = 0; splat = 0; dizzy = 0; blobs = []; duck = false; face = 1; slowT = 0; decals = []; lasso = null; bison = []; whoa = 0; act1(); },
    seeds:() => pies*2 + shoes, stats:() => `<span>Pies saved ${pies}</span><span>Horseshoes ${shoes}</span><span>Hats left ${Math.max(0, hats)}</span>`,
    update(dt){
      time += dt;
      if (bT > 0){ bT -= dt; input.pressed = false; input.taps.length = 0; return; }
      inv = Math.max(0, inv - dt); splat = Math.max(0, splat - dt); dizzy = Math.max(0, dizzy - dt); stamp = Math.max(0, stamp - dt); slowT = Math.max(0, slowT - dt);
      gPhase += dt*(8 + Math.abs(speed)/20);
      let lassoTap = false, jumpTap = input.pressed; input.pressed = false;
      for (const k of input.taps.splice(0)){ if (k === 'up') lassoTap = true; }
      duck = input.down && py >= groundAt(px) - 1 && act < 3;
      if (jumpTap) jump();
      // gravity
      const fl = groundAt(px); vy += 1800*dt; py += vy*dt; if (py >= fl && py - vy*dt <= fl + 4){ py = fl; vy = 0; }
      for (const f of flying){ f.vy += 900*dt; f.x += f.vx*dt; f.y += f.vy*dt; if (f.spin !== undefined) f.spin += dt*10; }
      for (const b of bison) b.x += 700*dt;
      if (act === 1){
        const want = stamp > 0 ? 560 : slowT > 0 ? 220 : input.right ? 480 : input.left ? 300 : 400;
        speed += (want - speed)*Math.min(1, dt*3); px += speed*dt; trainX += TRAIN_V*dt; trainX = Math.min(trainX, px + 1500);
        cam = px - 220;
        // obstacles, spawned just ahead
        while (nextSpawn < px + 900){ const k = Math.random(); nextSpawn += 400 + Math.random()*320;
          if (hats < 3 && Math.random() < .12){ things.push({ k:'hat', x:nextSpawn, y:GROUND - 110 }); continue; }
          if (k < .3) things.push({ k:'cactus', x:nextSpawn }); else if (k < .5) things.push({ k:'fence', x:nextSpawn }); else if (k < .65) things.push({ k:'snake', x:nextSpawn });
          else if (k < .8) things.push({ k:'weed', x:nextSpawn + 300, vx:-160, y:GROUND - 20, vy:0 });
          else for (let i=0;i<3;i++) things.push({ k:'shoe', x:nextSpawn + i*40, y:GROUND - 60 - Math.sin(i/2*Math.PI)*60 }); }
        for (const o of things){ if (o.got) continue; const dx = o.x - px;
          if (o.k === 'weed'){ o.x += o.vx*dt; o.vy += 900*dt; o.y += o.vy*dt; if (o.y > GROUND - 20){ o.y = GROUND - 20; o.vy = -300; } }
          if (o.k === 'shoe'){ if (Math.abs(dx) < 36 && Math.abs(o.y - (py - 70)) < 50){ o.got = true; shoes++; addYee(12); anim.chew = .3; } continue; }
          if (o.k === 'hat'){ if (Math.abs(dx) < 44 && Math.abs(o.y - (py - 70)) < 60){ o.got = true; spareHat(o); } continue; }
          if (Math.abs(dx) < 34 && py > (o.k === 'weed' ? o.y - 10 : GROUND - 34)){ o.got = true; if (stamp > 0){ pop(o.x, GROUND - 90, 'Smash!', '#ffe066'); continue; } slowT = .6; hurt(o.k === 'snake' ? 'Hisss!' : o.k === 'fence' ? 'Crash!' : 'Ouch, prickly!'); } }
        things = things.filter(o => o.x > px - 400);
        // the raccoon on the caboose throws pies back at you
        throwT -= dt; if (throwT <= 0 && trainX + 30 - cam < W - 40){ throwT = 2 + Math.random()*1.4; flying.push({ k:'pie', x:trainX + 30, y:GROUND - 150, vx:TRAIN_V - 520 - Math.random()*120, vy:-260 - Math.random()*120, rot:0 }); }
        if (px >= trainX - 40){ pop(px, py - 150, 'All aboard!', '#ffe066'); act2(); }
      } else if (act === 2){
        const want = stamp > 0 ? 330 : input.right ? 290 : input.left ? 70 : 170;
        speed += (want - speed)*Math.min(1, dt*4); px += speed*dt; bgOff += TRAIN_V*dt;
        cam = clamp(px - 260, -60, loco.x + loco.w - W + 60);
        if (py > ROOF + 60){ hurt('Whoops!'); const c = [...cars].reverse().find(q => q.x < px) || cars[0]; px = c.x + 30; py = ROOF; vy = 0; }
        // raccoons: throw pies, get lassoed, get stomped
        for (const b of bandits){
          if (b.state === 'fly'){ b.vy += 900*dt; b.x += b.vx*dt; b.y += b.vy*dt; b.spin += dt*9; continue; }
          const dx = b.x - px;
          b.throwT -= dt; if (b.throwT <= 0 && dx > 60 && b.x - cam < W - 40){ b.throwT = 1.8 + Math.random()*1.4; flying.push({ k:'pie', x:b.x - 20, y:ROOF - 60, vx:-340 - Math.random()*80, vy:-160, rot:0 }); }
          if (Math.abs(dx) < 40 && py < ROOF - 30 && py > ROOF - 95 && vy > 0){ defeat(b, 'Stomp!'); vy = -520; addYee(25); }
          else if (Math.abs(dx) < 32 && py > ROOF - 30){ if (stamp > 0) defeat(b, 'Bowled over!'); else { hurt('Bonk!'); px -= 60; } }
        }
        if (lassoTap && !lasso){ const tg = bandits.filter(b => b.state === 'stand' && b.x - px > 0 && b.x - px < 380).sort((a, c) => a.x - c.x)[0];
          lasso = tg ? { k:0, tg, x:tg.x, y:ROOF - 40 } : { k:0, tg:null, x:px + 260, y:ROOF - 80 }; }
        // low bridges: warned with a DUCK! sign, then they sweep toward you
        bridgeT -= dt; if (bridgeT <= 0 && px < loco.x - 400){ bridgeT = 4 + Math.random()*2.5; bridges.push({ x:cam + W + 520 }); }
        for (const br of bridges){ br.x -= TRAIN_V*dt; const hit = Math.abs(br.x - px) < 26 && !br.hit;
          if (hit && !(duck && py >= ROOF - 1)){ br.hit = true; hurt('Bonk! Low bridge!'); } else if (hit){ br.hit = true; pop(px, ROOF - 110, 'Phew!', '#bfe3ff'); addYee(8); } }
        bridges = bridges.filter(br => br.x > cam - 100);
        for (const o of things) if (!o.got && Math.abs(o.x - px) < 40 && Math.abs(o.y - (py - 70)) < 56){ o.got = true; if (o.k === 'hat') spareHat(o); else { shoes++; addYee(12); } }
        if (px >= loco.x + 60){ if (!whoa){ whoa = 1.4; pop(px, ROOF - 150, 'Whoa there!', '#ffe066'); anim.happy = 2; } }
        if (whoa){ whoa -= dt; speed = 0; if (whoa <= 0){ whoa = 0; act3(); } }
      } else {
        const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0); if (ax) face = ax;
        speed = ax*340; px = clamp(px + speed*dt, 50, W - 50);
        if (doneT > 0){ doneT += dt; boss.sink += 90*dt; if (doneT > 2.6) finish(true); }
        else {
          // Bramble gets faster and twitchier with every sandbag he loses, and bobs out of reach right after a hit
          const sp = 1 + popped*.35; dodgeT = Math.max(0, dodgeT - dt); lassoCD = Math.max(0, lassoCD - dt);
          boss.x = 400 + Math.sin(time*.55*sp)*210 + Math.sin(time*1.7*sp)*60; boss.y = 110 + popped*40 + Math.sin(time*1.3)*8 - Math.sin(Math.min(1, dodgeT/2.4)*Math.PI)*55;
          bossT -= dt; if (bossT <= 0){ bossT = 1.15 - popped*.18; const gold = Math.random() < .14; flying.push({ k:gold ? 'gold' : 'pie', x:boss.x, y:boss.y + 70, vx:(px - boss.x)*.55 + (Math.random() - .5)*60, vy:-60, rot:0 }); }
          if (lassoTap && !lasso && lassoCD <= 0){ lasso = { k:0, up:true, x:px, y:py - 100 }; lassoCD = .8; }
          if (lasso && lasso.up){ lasso.y -= 820*dt; lasso.x = px;
            for (const b of bags){ const bx = boss.x + bagSwing(b), by = boss.y + 104; if (b.alive && dodgeT <= 0 && Math.abs(lasso.x - bx) < 24 && Math.abs(lasso.y - by) < 20){ b.alive = false; b.fy = by; b.fx = bx; popped++; shake = .3; addYee(30); lasso = null; dodgeT = 2.4;
              pop(bx, by - 30, ['“My sandbag!”', '“Not the other one!”', '“Aw, shucks!”'][popped - 1], '#ffe9a8'); if (popped === 3){ doneT = .01; anim.happy = 4; pop(boss.x, boss.y - 40, 'SPLASH!', '#bfe3ff'); pies += 5; } break; } }
            if (lasso && lasso.y < 30) lasso = null; }
        }
        for (const b of bags) if (!b.alive){ b.fall += dt; b.fy += 500*b.fall*dt; }
      }
      // pies (and hats) in the air
      for (const f of flying){ if (f.k === 'hat' || f.done) continue; f.rot += dt*6;
        if (pieHits(f)){ f.done = true;
          if (f.k === 'gold'){ hats = Math.min(3, hats + 1); pies++; pop(px, py - 150, 'Golden pie! +1 hat', '#ffe066'); anim.chew = .6; }
          else if (stamp > 0){ pies++; pop(px, py - 150, 'Caught it! +1 pie', '#ffe066'); } else hurt('Pie in the face!', true); }
        else if (f.y > (act === 2 ? ROOF + 200 : GROUND)){ f.done = true; if (act !== 2) decals.push({ x:f.x, y:Math.min(f.y, act === 2 ? 9999 : GROUND), life:3 }); } }
      flying = flying.filter(f => !f.done && f.y < H + 200);
      decals.forEach(d => d.life -= dt); decals = decals.filter(d => d.life > 0);
      // the lasso's throw
      if (lasso && !lasso.up){ lasso.k += dt*3.2; if (lasso.tg){ lasso.x = lasso.tg.x; }
        if (lasso.k >= 1){ if (lasso.tg && lasso.tg.state === 'stand'){ defeat(lasso.tg, 'Yoink!'); addYee(25); } else if (!lasso.tg) pop(px + 200, ROOF - 120, 'Missed!', 'rgba(255,246,228,.8)'); lasso = null; } }
      if (hats <= 0) finish(false);
    },
    draw(){
      if (act === 1){
        desert(cam);
        // the train, rolling away ahead
        { const x = trainX - cam; if (x < W + 60){ const ry = GROUND - 120;
          ctx.fillStyle = '#6a5a4a'; ctx.fillRect(0, GROUND - 6, W, 4);
          trainCar(x, ry, 150, '#c0442f');
          ctx.fillStyle = '#c0442f'; ctx.fillRect(x + 60, ry - 26, 50, 26); ctx.fillStyle = '#ffe9a8'; ctx.fillRect(x + 70, ry - 20, 30, 14);
          raccoon(x + 30, ry, .9, -1, true); { const up = throwT < .6 ? 1 - throwT/.6 : 0; pie(x + 18 - up*6, ry - 52 - up*26 + Math.sin(time*6)*3, false, -up*.6); if (up > .2){ ctx.fillStyle = '#fff6e4'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('!', x + 30, ry - 110); ctx.textAlign = 'left'; } }
          for (let i=0;i<4;i++) trainCar(x + 170 + i*290, ry, 270, ['#a0442f', '#7a4a2a', '#8a5a2a', '#6a3a2a'][i], i === 1 ? 'pies' : '');
          locomotive(x + 170 + 4*290, ry, 320); } }
        for (const o of things){ if (o.got) continue; const x = o.x - cam; if (x < -60 || x > W + 60) continue;
          if (o.k === 'cactus'){ ctx.fillStyle = '#5a8a3a'; rr(x - 10, GROUND - 70, 20, 70, 10); ctx.fill(); rr(x - 28, GROUND - 50, 12, 28, 6); ctx.fill(); rr(x + 16, GROUND - 56, 12, 30, 6); ctx.fill(); ctx.fillRect(x - 22, GROUND - 28, 14, 8); ctx.fillRect(x + 8, GROUND - 32, 14, 8); ctx.fillStyle = '#ff9ab8'; circle(x, GROUND - 72, 5); }
          else if (o.k === 'fence'){ ctx.fillStyle = '#8a5a32'; for (const fx of [-24, 0, 24]) ctx.fillRect(x + fx - 4, GROUND - 46, 8, 46); ctx.fillRect(x - 32, GROUND - 40, 64, 7); ctx.fillRect(x - 32, GROUND - 22, 64, 7); }
          else if (o.k === 'snake'){ ctx.fillStyle = '#b8903a'; for (let k=0;k<4;k++) circle(x - 18 + k*9, GROUND - 6 + Math.sin(k + time*6)*2, 6); circle(x + 18, GROUND - 22, 8); ctx.fillRect(x + 13, GROUND - 20, 7, 16); ctx.fillStyle = '#1a1a1a'; circle(x + 21, GROUND - 24, 1.8); ctx.fillStyle = '#f2e27a'; circle(x - 24, GROUND - 10 + Math.sin(time*30)*2, 3); }
          else if (o.k === 'weed'){ ctx.save(); ctx.translate(x, o.y); ctx.rotate(o.x*.05); ctx.strokeStyle = '#a07a40'; ctx.lineWidth = 2.5; for (let k=0;k<8;k++){ ctx.beginPath(); ctx.arc(0, 0, 6 + k*2.4, k, k + 3); ctx.stroke(); } ctx.restore(); }
          else if (o.k === 'shoe') shoe(x, o.y);
          else if (o.k === 'hat') hatPickup(x, o.y); }
      } else if (act === 2){
        desert(bgOff);
        for (const c of cars){ const x = c.x - cam; if (x > W + 20 || x + c.w < -20) continue; trainCar(x, ROOF, c.w, c.col, cars.indexOf(c) % 3 === 1 ? 'pies' : ''); }
        { const x = loco.x - cam; if (x < W + 40) locomotive(x, ROOF, loco.w); }
        for (let i=0;i<NCARS;i++){ const x = cars[i].x + CAR - cam; ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x, ROOF + 60, GAP, 6); }
        for (const o of things) if (!o.got){ if (o.k === 'hat') hatPickup(o.x - cam, o.y); else shoe(o.x - cam, o.y); }
        for (const b of bandits){ const x = b.x - cam; if (x < -80 || x > W + 80) continue;
          if (b.state === 'fly'){ ctx.save(); ctx.translate(x, b.y - 30); ctx.rotate(b.spin); raccoon(0, 30, .9, -1, true); ctx.restore(); ctx.fillStyle = '#fff6e4'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('Yeeeeow!', x, b.y - 80); ctx.textAlign = 'left'; }
          else { raccoon(x, ROOF - 2 + Math.abs(Math.sin(time*3 + b.ph))*-3, .9, -1, true); if (b.throwT < .5) pie(x - 24, ROOF - 64, false, 0); } }
        // low bridges and their warning sign
        for (const br of bridges){ const x = br.x - cam;
          if (x > W - 10){ const a = .6 + .4*Math.sin(time*12); ctx.fillStyle = `rgba(224,70,79,${a})`; rr(W - 110, ROOF - 150, 96, 40, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 20px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('DUCK! ↓', W - 62, ROOF - 123); ctx.textAlign = 'left'; }
          else if (x > -80){ ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 30, 0, 14, ROOF - 70); ctx.fillRect(x + 16, 0, 14, ROOF - 70); ctx.fillStyle = '#8a5a32'; ctx.fillRect(x - 60, ROOF - 92, 120, 26); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 60, ROOF - 70, 120, 4); ctx.fillStyle = '#ffe066'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('LOW BRIDGE', x, ROOF - 75); ctx.textAlign = 'left'; } }
      } else {
        desert(0);
        // the horse trough where Bramble will splash down, and the town behind
        ctx.fillStyle = '#8a5a32'; ctx.fillRect(560, GROUND - 40, 200, 40); ctx.fillStyle = '#5ab8e0'; ctx.fillRect(566, GROUND - 36, 188, 14);
        // the balloon
        { const bx = doneT > 0 ? boss.x + (660 - boss.x)*Math.min(1, doneT) : boss.x, by = doneT > 0 ? boss.y + boss.sink : boss.y;
          ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 44, by - 20); ctx.lineTo(bx - 26, by + 40); ctx.moveTo(bx + 44, by - 20); ctx.lineTo(bx + 26, by + 40); ctx.stroke();
          for (let k=0;k<6;k++){ ctx.fillStyle = k % 2 ? '#ffe066' : '#d0452f'; ctx.beginPath(); ctx.moveTo(bx, by - 150); ctx.bezierCurveTo(bx - 90 + k*30, by - 150, bx - 90 + k*30, by - 50, bx - 44 + k*15, by - 20); ctx.lineTo(bx - 44 + (k + 1)*15, by - 20); ctx.bezierCurveTo(bx - 60 + (k + 1)*30, by - 50, bx - 60 + (k + 1)*30, by - 150, bx, by - 150); ctx.fill(); }
          ctx.fillStyle = '#d0452f'; ctx.beginPath(); ctx.ellipse(bx, by - 90, 88, 72, 0, 0, 7); ctx.fill(); for (let k=-2;k<=2;k++){ ctx.fillStyle = k % 2 ? '#ffe066' : '#d0452f'; ctx.beginPath(); ctx.ellipse(bx + k*30, by - 90, 16, 70, 0, 0, 7); ctx.fill(); }
          ctx.fillStyle = '#f6ead6'; ctx.font = '700 14px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('BRAMBLE AIR', bx, by - 90); ctx.textAlign = 'left';
          standee(BRAMBLE, bx + 2, by + 64, 92, px < bx ? -1 : 1); pie(bx - 30, by + 18, true, Math.sin(time*2)*.2);
          ctx.fillStyle = '#8a5a32'; rr(bx - 36, by + 40, 72, 44, 6); ctx.fill(); ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); for (let k=1;k<4;k++){ ctx.moveTo(bx - 36 + k*18, by + 40); ctx.lineTo(bx - 36 + k*18, by + 84); } ctx.stroke();
          for (const b of bags){ const x = b.alive ? bx + bagSwing(b) : b.fx, y = b.alive ? by + 104 : b.fy; if (b.alive && dodgeT > 0 && Math.floor(dodgeT*10) % 2) continue; if (b.alive){ ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx + b.o*.6, by + 84); ctx.lineTo(x, y - 14); ctx.stroke(); } if (y < GROUND + 20){ ctx.fillStyle = '#c9a36a'; ctx.beginPath(); ctx.ellipse(x, y, 13, 16, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8a6a3a'; ctx.font = '700 9px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('SAND', x, y + 3); ctx.textAlign = 'left'; } }
          if (doneT > 1.2){ for (let k=0;k<10;k++){ ctx.fillStyle = 'rgba(150,210,255,.8)'; circle(660 + Math.cos(k)*(doneT - 1.2)*120, GROUND - 40 - Math.sin(k*1.7)*40*(doneT - 1.2) + (doneT - 1.2)*(doneT - 1.2)*60, 5); } } }
        if (lasso && lasso.up){ lassoLoop(px, py - 90, lasso.x, lasso.y, 1); }
      }
      // pie splats on the ground
      for (const d of decals){ const x = d.x - cam; ctx.globalAlpha = Math.min(1, d.life); ctx.fillStyle = '#fffaf0'; ctx.beginPath(); ctx.ellipse(x, d.y, 22, 6, 0, 0, 7); ctx.fill(); circle(x - 12, d.y - 4, 5); circle(x + 10, d.y - 3, 4); ctx.globalAlpha = 1; }
      // Pepper and you
      if (!(inv > 0 && Math.floor(inv*12) % 2 === 0)){
        const x = px - cam; ctx.fillStyle = 'rgba(80,50,20,.25)'; ctx.beginPath(); ctx.ellipse(x, groundAt(px) < 9000 ? groundAt(px) : py, 50, 8, 0, 0, 7); ctx.fill();
        rider(x, py, 0, duck ? .72 : 1);
        if (dizzy > 0) for (let k=0;k<3;k++){ const q = time*6 + k*2.1; ctx.fillStyle = '#ffe066'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('✦', x + 20*face + Math.cos(q)*26, py - 140 + Math.sin(q)*7); ctx.textAlign = 'left'; }
        if (stamp > 0 && !reduceMotion) for (let k=0;k<3;k++){ ctx.fillStyle = `rgba(210,180,130,${.5 - k*.15})`; circle(x - 70 - k*30, py - 10, 14 + k*6); }
      }
      // the lasso heading for a raccoon
      if (lasso && !lasso.up){ const k = Math.min(1, lasso.k); lassoLoop(px - cam + 30, py - 90, px - cam + 30 + (lasso.x - px - 30)*k, py - 90 + (lasso.y - py + 90)*k, k); }
      // flying pies and hats
      for (const f of flying){ const x = f.x - cam;
        if (f.k === 'hat'){ ctx.save(); ctx.translate(x, f.y); ctx.rotate(f.spin); ctx.fillStyle = '#8a5a32'; ctx.fillRect(-18, 0, 36, 5); rr(-10, -14, 20, 16, 5); ctx.fill(); ctx.restore(); continue; }
        if (act !== 2){ const hgt = clamp((GROUND - f.y)/300, 0, 1); ctx.fillStyle = `rgba(80,50,20,${.35 - hgt*.2})`; ctx.beginPath(); ctx.ellipse(x, GROUND + 2, 18 - hgt*8, 5 - hgt*2, 0, 0, 7); ctx.fill(); }
        for (let k=1;k<4;k++){ ctx.fillStyle = `rgba(255,250,236,${.35 - k*.1})`; circle(x - f.vx*.025*k, f.y - f.vy*.025*k, 12 - k*2); }
        ctx.save(); ctx.translate(x, f.y); ctx.scale(1.3, 1.3); pie(0, 0, f.k === 'gold', f.rot); ctx.restore(); }
      // the stampede: friendly buffalo thundering past
      for (const b of bison){ const x = b.x; if (x < -120 || x > W + 120) continue; const bob = Math.abs(Math.sin(time*14 + b.y))*6;
        ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.ellipse(x, b.y - 34 - bob, 44, 26, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#3a2416'; ctx.beginPath(); ctx.ellipse(x + 34, b.y - 44 - bob, 24, 24, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#f6ead6'; ctx.beginPath(); ctx.moveTo(x + 44, b.y - 62 - bob); ctx.quadraticCurveTo(x + 60, b.y - 70 - bob, x + 56, b.y - 58 - bob); ctx.fill();
        ctx.fillStyle = '#3a2416'; for (const lx of [-26, -8, 14, 30]) ctx.fillRect(x + lx, b.y - 14 - bob, 7, 16); ctx.fillStyle = '#fff'; circle(x + 44, b.y - 46 - bob, 3); }
      drawPops(cam);
      // a pie in the face!
      if (splat > 0){ const a = Math.min(1, splat/.8), k = 1.1 - splat; for (const b of blobs){ ctx.fillStyle = `rgba(255,250,236,${.9*a})`; circle(b.x, b.y + k*40, b.r*(.8 + a*.2)); circle(b.x + b.r*.7, b.y + b.r*.5 + k*55, b.r*.4); ctx.fillRect(b.x - 5, b.y, 10, b.r + k*70); }
        ctx.fillStyle = `rgba(224,70,79,${a})`; circle(blobs[0].x, blobs[0].y - 10 + k*40, 10); }
      // act banners
      if (bT > 0){ ctx.fillStyle = 'rgba(40,20,10,.82)'; rr(140, 150, 520, 150, 16); ctx.fill(); ctx.strokeStyle = '#e0a040'; ctx.lineWidth = 3; ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9a8'; ctx.font = '700 28px "Pixelify Sans", monospace'; ctx.fillText(banner.title, W/2, 196);
        ctx.fillStyle = '#fff6e4'; ctx.font = '600 15px Nunito, sans-serif'; const words = banner.text.split(' '); let line = '', y = 230; for (const wd of words){ const tr = line ? line + ' ' + wd : wd; if (ctx.measureText(tr).width > 470){ ctx.fillText(line, W/2, y); line = wd; y += 20; } else line = tr; } ctx.fillText(line, W/2, y); ctx.textAlign = 'left'; }
    },
    hud(){
      hudBar();
      for (let i=0;i<3;i++){ ctx.fillStyle = i < hats ? '#a0683a' : 'rgba(246,234,214,.2)'; ctx.fillRect(18 + i*30, 32, 26, 4); rr(24 + i*30, 20, 14, 13, 4); ctx.fill(); }
      ctx.fillStyle = '#fff6e4'; ctx.fillText('Yeehaw!', 116, 31); ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(204, 22, 110, 16, 6); ctx.fill();
      ctx.fillStyle = stamp > 0 ? `hsl(${(t*300) % 360},90%,65%)` : '#ffb05a'; rr(204, 22, 110*(stamp > 0 ? stamp/5 : yee/100), 16, 6); ctx.fill();
      const k = act === 1 ? clamp(1 - (trainX - px - 40)/1300, 0, 1)/3 : act === 2 ? 1/3 + clamp(px/(loco.x + 60), 0, 1)/3 : 2/3 + popped/9;
      progress(k, '#e0a040'); ctx.fillStyle = '#fff6e4'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.fillText(`ACT ${act}`, 336, 18);
      ctx.font = '700 20px "Pixelify Sans", monospace'; ctx.textAlign = 'right'; ctx.fillStyle = '#ffe066'; ctx.fillText(`${pies}`, W - 24, 31); pie(W - 70, 36, false, 0); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ if (act === 1){ speed = 400; px += 400*dt; trainX = px + 700; cam = px - 220; gPhase += dt*28; } },
  };
  function defeat(b, txt){ b.state = 'fly'; b.vx = -260; b.vy = -520; b.spin = 0; pies++; anim.happy = 1; pop(b.x, ROOF - 110, `${txt} +1 pie`, '#ffe066'); if (Math.random() < .5) pop(px, py - 160, QUIPS[Math.floor(Math.random()*QUIPS.length)], '#fff6e4'); }
  function spareHat(o){ if (hats < 3){ hats++; pop(o.x, o.y - 40, 'Spare hat! +1', '#ffe066'); } else { shoes += 3; pop(o.x, o.y - 40, '+3', '#ffe066'); } anim.happy = 1; }
  // a spare cowboy hat, twirling in the air with a sparkle
  function hatPickup(x, y){ const b = Math.sin(time*3)*5; const g = ctx.createRadialGradient(x, y + b, 2, x, y + b, 30); g.addColorStop(0, 'rgba(255,240,160,.6)'); g.addColorStop(1, 'rgba(255,240,160,0)'); ctx.fillStyle = g; circle(x, y + b, 30);
    ctx.save(); ctx.translate(x, y + b); ctx.scale(Math.cos(time*3), 1); ctx.fillStyle = '#a0683a'; rr(-22, 4, 44, 7, 3); ctx.fill(); rr(-12, -14, 24, 20, 6); ctx.fill(); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(-12, 0, 24, 4); ctx.restore(); }
  function bagSwing(b){ return b.o + Math.sin(time*2.4 + b.o)*14*(1 + popped*.4); }
  function shoe(x, y){ ctx.strokeStyle = '#c9c0a0'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y + Math.sin(time*4 + x)*3, 11, -1, Math.PI + 1, false); ctx.stroke(); ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2; ctx.stroke(); }
})();

// ================= The Underground: Mine Cart Mayhem =================
// Ride a mine cart through the dark tunnels by headlamp. Two tracks run side by side (upper and lower):
// ↑ ↓ hop between them, Space jumps over rocks and broken rails. Grab the gems, reach the crystal cavern.
const MINE = (() => {
  const GOAL = 9000, CX = 230, TRACK = [250, 390], GRAV = 1900;
  let things, x, speed, lane, hop, jy, jvy, hearts, gems, inv, done, doneT, sparks;
  function build(){
    const r = rng(6060); things = [];
    for (let d = 800; d < GOAL - 400; d += 300 + r()*240){
      // one hazard per slot, on one track only, so there's always a way through
      const L = r() < .5 ? 0 : 1, k = r();
      if (k < .3) things.push({ k:'rock', x:d, lane:L });
      else if (k < .55) things.push({ k:'gap', x:d, lane:L, w:70 + r()*30 });
      else if (k < .75) things.push({ k:'drip', x:d, lane:L });
      else if (k < .87) things.push({ k:'bats', x:d, lane:L });
      if (r() < .6){ const gl = r() < .5 ? 0 : 1; for (let i=0;i<3;i++) things.push({ k:'gem', x:d + 140 + i*36, lane:gl, up:r() < .4 ? 70 : 30, col:['#e0464f', '#5adcff', '#82ffa0', '#ffe066'][Math.floor(r()*4)] }); }
    }
  }
  const trackY = L => TRACK[L];
  function cartY(){ const base = hop ? TRACK[hop.from] + (TRACK[hop.to] - TRACK[hop.from])*hop.k - Math.sin(hop.k*Math.PI)*50 : TRACK[lane]; return base + jy; }
  function hurt(txt){ if (inv > 0) return; hearts--; inv = 1.6; shake = .4; speed *= .6; pop(CX + x, cartY() - 90, txt, '#ffd0d3'); if (hearts <= 0) finish(false); }
  return {
    title:'Mine Cart Mayhem', sub:'Ride the rails down to the Underground.',
    blurb:'The flickering portal dropped you into an old mine cart, and it’s already rolling! Two tracks run through the dark: hop between them, jump the rocks and broken rails, and ride all the way to the crystal cavern.',
    legend:['↑ ↓ to hop between the upper and lower track', 'Space to jump over rocks and broken rails', 'Switch tracks to dodge dripping stalactites and bats', 'Grab the gems', '3 hearts'],
    hints:['↑ ↓ switch track, Space jump', 'P to pause'], pad:['wgUp', 'wgDown', 'wgAction'], actionLabel:'Jump',
    winTitle:'The crystal cavern!', winText:'The cart bursts out of the tunnel into a cavern full of glowing crystals, and a family of moles waves hello. Welcome to the Underground!',
    loseTitle:'Off the rails!', loseText:'The cart rattles to a stop and a friendly mole helps you climb out. The portal pulls you back to try again.',
    againWinText:'Back in the crystal cavern! The moles cheer.', againLoseText:'The cart tips over. The moles push it back onto the rails for you.',
    reset(){ build(); x = 0; speed = 320; lane = 1; hop = null; jy = 0; jvy = 0; hearts = 3; gems = 0; inv = 0; done = false; doneT = 0; sparks = []; },
    seeds:() => gems, stats:() => `<span>Gems ${gems}</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      if (done){ doneT += dt; x += speed*dt; speed *= Math.pow(.4, dt); if (doneT > 1.6) finish(true); return; }
      speed += ((300 + x/GOAL*180) - speed)*Math.min(1, dt*.8); x += speed*dt; inv = Math.max(0, inv - dt);
      for (const k of input.taps.splice(0)){ if (!hop && jy === 0){ if (k === 'up' && lane === 1) hop = { from:1, to:0, k:0 }; if (k === 'down' && lane === 0) hop = { from:0, to:1, k:0 }; } }
      if (input.pressed && !hop && jy === 0){ jvy = -620; jy = -1; } input.pressed = false;
      if (hop){ hop.k += dt*3; if (hop.k >= 1){ lane = hop.to; hop = null; } }
      if (jy < 0 || jvy < 0){ jvy += GRAV*dt; jy += jvy*dt; if (jy >= 0){ jy = 0; jvy = 0; } }
      const onRail = !hop && jy === 0, cx = CX + x;
      for (const o of things){ const dx = o.x - cx; if (dx < -120 || dx > 120 || o.done) continue;
        if (o.k === 'gem'){ const gy = trackY(o.lane) - 30 - o.up; if (Math.abs(dx) < 30 && Math.abs(gy - (cartY() - 40)) < 40){ o.done = true; gems++; anim.chew = .3; sparks.push({ x:o.x, y:gy, life:.5 }); } continue; }
        if (hop || o.lane !== lane) continue;
        if (o.k === 'rock' && Math.abs(dx) < 34 && jy > -40){ o.done = true; hurt('Clang!'); }
        else if (o.k === 'gap' && dx > 10 && dx < o.w - 10 && onRail){ o.done = true; hurt('Bump!'); }
        else if ((o.k === 'drip' || o.k === 'bats') && Math.abs(dx) < 30){ o.done = true; hurt(o.k === 'bats' ? 'Squeak!' : 'Drip!'); }
      }
      sparks.forEach(s => s.life -= dt); sparks = sparks.filter(s => s.life > 0);
      if (x >= GOAL){ done = true; doneT = 0; anim.happy = 4; }
    },
    draw(){
      const cam = x;
      ctx.fillStyle = '#1a1420'; ctx.fillRect(0, 0, W, H);
      // rock layers sliding past
      for (const [par, col, y0, amp] of [[.2, '#241c2c', 140, 40], [.45, '#2e2436', 60, 30]]){ ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); for (let sx = 0; sx <= W; sx += 20) ctx.lineTo(sx, y0 + Math.sin((sx + cam*par)*.01)*amp + Math.sin((sx + cam*par)*.031)*12); ctx.lineTo(W, 0); ctx.fill(); }
      // crystal veins and lanterns on the far wall
      for (let i = Math.floor(cam*.5/180) - 1; i*180 - cam*.5 < W + 180; i++){ const sx = i*180 - cam*.5 + hash(i)*80, sy = 150 + hash(i + 3)*60;
        if (hash(i + 5) > .5){ ctx.fillStyle = ['rgba(127,224,230,.8)', 'rgba(181,138,230,.8)', 'rgba(242,194,120,.8)'][((i % 3) + 3) % 3]; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 8, sy - 26); ctx.lineTo(sx + 16, sy); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(sx + 12, sy); ctx.lineTo(sx + 18, sy - 16); ctx.lineTo(sx + 24, sy); ctx.fill(); }
        else { const lg = ctx.createRadialGradient(sx, sy, 2, sx, sy, 60); lg.addColorStop(0, 'rgba(255,200,110,.5)'); lg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = lg; circle(sx, sy, 60); ctx.fillStyle = '#ffd278'; ctx.fillRect(sx - 5, sy - 6, 10, 12); } }
      // wooden supports
      for (let i = Math.floor(cam/400) - 1; i*400 - cam < W + 400; i++){ const sx = i*400 - cam; ctx.fillStyle = '#5a3a1a'; ctx.fillRect(sx - 8, 60, 16, H); ctx.fillRect(sx - 60, 60, 120, 14); }
      // the two tracks
      for (const L of [0, 1]){ const ty = TRACK[L];
        ctx.fillStyle = '#3a2a1a'; for (let i = Math.floor(cam/30) - 1; i*30 - cam < W + 30; i++) ctx.fillRect(i*30 - cam, ty + 2, 16, 8);
        ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, ty); ctx.lineTo(W, ty); ctx.stroke();
        if (L === 0){ ctx.fillStyle = '#3a2a1a'; ctx.fillRect(0, ty + 10, W, 8); for (let i = Math.floor(cam/200) - 1; i*200 - cam < W + 200; i++) ctx.fillRect(i*200 - cam + 90, ty + 10, 10, TRACK[1] - ty - 10); } }
      // hazards and gems
      for (const o of things){ const sx = o.x - cam; if (sx < -140 || sx > W + 140) continue; const ty = trackY(o.lane);
        if (o.k === 'gap'){ ctx.fillStyle = '#1a1420'; ctx.fillRect(sx - o.w + 6, ty - 4, o.w - 12, 18); ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx - o.w + 6, ty); ctx.lineTo(sx - o.w + 18, ty + 10); ctx.moveTo(sx - 6, ty); ctx.lineTo(sx - 18, ty + 10); ctx.stroke(); }
        else if (o.k === 'rock' && !o.done){ ctx.fillStyle = '#6a5a5a'; ctx.beginPath(); ctx.ellipse(sx, ty - 14, 24, 16, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#8a7a7a'; circle(sx - 8, ty - 22, 7); circle(sx + 10, ty - 14, 8); }
        else if (o.k === 'drip' && !o.done){ ctx.fillStyle = '#4a3a54'; ctx.beginPath(); ctx.moveTo(sx - 20, ty - 150); ctx.lineTo(sx, ty - 60); ctx.lineTo(sx + 20, ty - 150); ctx.fill(); ctx.fillStyle = 'rgba(150,200,230,.8)'; circle(sx, ty - 56 + wrap(time*80, 30), 3); }
        else if (o.k === 'bats' && !o.done){ for (let i=0;i<3;i++){ const bx = sx + Math.sin(time*5 + i*2)*14, by = ty - 70 + Math.cos(time*6 + i)*10 - i*12, f = Math.sin(time*25 + i)*8; ctx.fillStyle = '#2a1a3a'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 14, by - 4 - f); ctx.lineTo(bx - 6, by + 2); ctx.lineTo(bx, by + 4); ctx.lineTo(bx + 6, by + 2); ctx.lineTo(bx + 14, by - 4 - f); ctx.fill(); ctx.fillStyle = '#ff5a5a'; circle(bx - 2, by, 1.2); circle(bx + 2, by, 1.2); } }
        else if (o.k === 'gem' && !o.done){ const gy = ty - 30 - o.up + Math.sin(time*3 + o.x)*3; ctx.fillStyle = o.col; ctx.beginPath(); ctx.moveTo(sx, gy - 10); ctx.lineTo(sx + 8, gy - 2); ctx.lineTo(sx, gy + 10); ctx.lineTo(sx - 8, gy - 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(sx - 3, gy - 5, 3, 3); } }
      // the crystal cavern at the end of the line
      { const sx = GOAL + CX + 200 - cam; if (sx < W + 300){ const cg = ctx.createRadialGradient(sx + 150, 260, 20, sx + 150, 260, 340); cg.addColorStop(0, 'rgba(160,240,255,.9)'); cg.addColorStop(1, 'rgba(160,240,255,0)'); ctx.fillStyle = cg; ctx.fillRect(sx - 200, 0, 700, H);
        for (let i=0;i<8;i++){ ctx.fillStyle = ['#7fe0e6', '#b58ae6', '#f2c278'][i % 3]; ctx.beginPath(); ctx.moveTo(sx + i*50, H); ctx.lineTo(sx + i*50 + 18, H - 80 - hash(i)*120); ctx.lineTo(sx + i*50 + 36, H); ctx.fill(); } } }
      // your cart, with a headlamp on
      const cy = cartY();
      if (!(inv > 0 && Math.floor(inv*12) % 2 === 0)){
        ctx.save(); ctx.translate(CX, cy); ctx.rotate(hop ? (hop.to < hop.from ? -.15 : .15) : jy < 0 ? -.08 : Math.sin(time*20)*.01);
        Chin.draw(ctx, 'me', anim, -2, -30, { scale:.07, face:1, grounded:true, speed:0 });
        ctx.fillStyle = '#ffe066'; circle(14, -78, 4);
        ctx.fillStyle = '#7a6a5a'; ctx.beginPath(); ctx.moveTo(-34, -40); ctx.lineTo(34, -40); ctx.lineTo(28, -6); ctx.lineTo(-28, -6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#5a4a3a'; ctx.fillRect(-34, -44, 68, 6); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-26, -34, 52, 4);
        for (const wx of [-18, 18]){ ctx.fillStyle = '#2a2a2a'; circle(wx, -4, 8); ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx + Math.cos(time*20)*6, -4 + Math.sin(time*20)*6); ctx.lineTo(wx - Math.cos(time*20)*6, -4 - Math.sin(time*20)*6); ctx.stroke(); }
        ctx.restore();
        if (!reduceMotion && !hop && jy === 0) for (let i=0;i<2;i++){ ctx.fillStyle = `rgba(255,200,100,${Math.random()})`; circle(CX - 20 + Math.random()*40, cy + 2, 1.5); }
      }
      for (const s of sparks){ ctx.fillStyle = `rgba(255,255,220,${s.life*2})`; for (let k=0;k<6;k++){ const a = k/6*Math.PI*2; circle(s.x - cam + Math.cos(a)*(.5 - s.life)*60, s.y + Math.sin(a)*(.5 - s.life)*60, 2); } }
      // darkness everywhere except your headlamp's beam
      { const dark = ctx.createRadialGradient(CX + 160, cy - 60, 60, CX + 160, cy - 60, 520); dark.addColorStop(0, 'rgba(8,4,14,0)'); dark.addColorStop(.6, 'rgba(8,4,14,.35)'); dark.addColorStop(1, 'rgba(8,4,14,.8)'); ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,240,180,.07)'; ctx.beginPath(); ctx.moveTo(CX + 16, cy - 78); ctx.lineTo(W, cy - 200); ctx.lineTo(W, cy + 40); ctx.closePath(); ctx.fill(); }
      drawPops(cam);
    },
    hud(){
      hudBar(); for (let i=0;i<3;i++) heart(30 + i*28, 30, i < hearts);
      ctx.fillStyle = '#7fe0e6'; ctx.fillText(`◆ ${gems}`, 118, 31);
      progress(x/GOAL, '#7fe0e6');
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`${time.toFixed(0)} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ x += 200*dt; if (x > GOAL - 1000) x = 0; },
  };
})();

// ================= Topsy-Turvy Land: Gravity Flip =================
// Run down a floating corridor where gravity does whatever you tell it. Flip to run along the
// ceiling (or back to the floor) to dodge spikes and jump over holes. You run by yourself.
const FLIP = (() => {
  const GOAL = 8200, PX = 220, FLOOR = 420, CEIL = 115, GRAV = 2300;
  let things, x, y, vy, up, speed, hearts, orbs, inv, done, doneT, trail, floaters;
  // which surface you're standing on (or heading to)
  const surf = () => up ? CEIL : FLOOR;
  function build(){
    const r = rng(8484); things = []; let side = 0;
    for (let d = 700; d < GOAL - 300; ){
      // obstacles alternate surfaces now and then; switching sides always leaves room to flip
      const swap = r() < .5; if (swap) side = 1 - side;
      const k = r();
      if (k < .55) things.push({ k:'spikes', x:d, side, w:60 + r()*50 });
      else if (k < .8) things.push({ k:'hole', x:d, side, w:110 + r()*60 });
      else things.push({ k:'block', x:d, side, h:130 + r()*50 });
      if (r() < .6) for (let i=0;i<4;i++) things.push({ k:'orb', x:d + 120 + i*40, side:1 - side });
      d += swap ? 360 + r()*200 : 260 + r()*200;
    }
    floaters = []; for (let i=0;i<14;i++) floaters.push({ x:r()*1600, y:160 + r()*200, k:Math.floor(r()*4), ph:r()*6, s:.2 + r()*.5 });
  }
  function hurt(txt){ if (inv > 0) return; hearts--; inv = 1.6; shake = .35; pop(PX + x, (up ? CEIL + 80 : FLOOR - 90), txt, '#ffd0d3'); if (hearts <= 0) finish(false); }
  const surfaceY = side => side ? CEIL : FLOOR;
  return {
    title:'Gravity Flip', sub:'Run on the floor and the ceiling of Topsy-Turvy Land.',
    blurb:'The flickering portal turned you upside down… then right side up… then upside down! In Topsy-Turvy Land you can run on the ceiling. Flip gravity to dodge the spikes and holes, and reach the end of the floating hall.',
    legend:['You run by yourself', 'Space, ↑ or ↓ (or tap) flips gravity: you fall up to the ceiling or down to the floor', 'Flip away from spikes and holes', 'Big blocks only leave room on one side', 'Grab the glowing orbs', '3 hearts'],
    hints:['Space to flip gravity', 'P to pause'], pad:['wgAction'], actionLabel:'Flip',
    winTitle:'You made it through!', winText:'You tumble out of the hall into a land where trees grow on the clouds and the rivers flow upward. Welcome to Topsy-Turvy Land!',
    loseTitle:'Dizzy!', loseText:'Too many bumps and your head is spinning. The portal floats you gently home.',
    againWinText:'Through the hall again, upside down and right side up!', againLoseText:'Whoa, dizzy! You float back to the start.',
    reset(){ build(); x = 0; y = FLOOR; vy = 0; up = false; speed = 300; hearts = 3; orbs = 0; inv = 0; done = false; doneT = 0; trail = []; },
    seeds:() => Math.floor(orbs/2), stats:() => `<span>Orbs ${orbs}</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      if (done){ doneT += dt; x += 200*dt; if (doneT > 1.5) finish(true); return; }
      speed += ((300 + x/GOAL*110) - speed)*Math.min(1, dt); x += speed*dt; inv = Math.max(0, inv - dt);
      let flip = input.pressed; input.pressed = false;
      for (const k of input.taps.splice(0)) if (k === 'up' || k === 'down') flip = true;
      const target = surf(), grounded = Math.abs(y - target) < 40;
      if (flip && grounded){ up = !up; vy = 0; anim.happy = .3; }
      // fall toward whichever surface gravity points at, unless there's a hole under you
      const cx = PX + x, mySide = up ? 1 : 0;
      const hole = things.find(o => o.k === 'hole' && !o.filled && o.side === mySide && cx > o.x + 14 && cx < o.x + o.w - 14);
      const g = up ? -GRAV : GRAV; vy += g*dt; y += vy*dt;
      if (!hole){ if (!up && y >= FLOOR){ y = FLOOR; vy = 0; } if (up && y <= CEIL){ y = CEIL; vy = 0; } }
      else if ((!up && y > FLOOR + 70) || (up && y < CEIL - 70)){ hurt('Whoops!'); hole.filled = true; y = surf(); vy = 0; }
      if (!hole){ y = clamp(y, CEIL, FLOOR); }
      for (const o of things){ const dx = o.x - cx; if (o.done || dx < -200 || dx > 200) continue;
        if (o.k === 'orb'){ const oy = o.side ? CEIL + 40 : FLOOR - 40; if (Math.abs(dx) < 26 && Math.abs(oy - (y + (up ? 30 : -30))) < 40){ o.done = true; orbs++; anim.chew = .2; } continue; }
        const onIt = (o.side === 1) === up && Math.abs(y - surfaceY(o.side)) < 30;
        if (o.k === 'spikes' && onIt && cx > o.x - 10 && cx < o.x + o.w + 10){ o.done = true; hurt('Ouch!'); }
        else if (o.k === 'block' && cx > o.x - 16 && cx < o.x + 46){ const reach = o.side ? CEIL + o.h : FLOOR - o.h; if ((o.side === 0 && y > reach) || (o.side === 1 && y < reach)){ o.done = true; hurt('Bonk!'); } }
      }
      trail.push({ x:cx - 20, y:y + (up ? 26 : -26), life:.4 }); trail.forEach(q => q.life -= dt); trail = trail.filter(q => q.life > 0);
      if (x >= GOAL){ done = true; doneT = 0; anim.happy = 4; }
    },
    draw(){
      const cam = x;
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#c8b0f0'); g.addColorStop(.5, '#f0c8e8'); g.addColorStop(1, '#b8d8f8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // things floating about in the middle of the hall
      for (const f of floaters){ const fx = wrap(f.x - cam*f.s, 1700) - 100, fy = f.y + Math.sin(time + f.ph)*14; ctx.save(); ctx.translate(fx, fy); ctx.rotate(time*.4 + f.ph); ctx.globalAlpha = .6;
        if (f.k === 0){ ctx.fillStyle = '#f6ead6'; ctx.beginPath(); ctx.moveTo(-12, -8); ctx.lineTo(12, -8); ctx.lineTo(9, 8); ctx.lineTo(-9, 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#f6ead6'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(13, 0, 5, -1.2, 1.2); ctx.stroke(); }
        else if (f.k === 1){ ctx.fillStyle = '#5ac8e0'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 7, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(20, -6); ctx.lineTo(20, 6); ctx.fill(); }
        else if (f.k === 2){ ctx.fillStyle = '#d0452f'; ctx.fillRect(-12, -8, 24, 16); ctx.fillStyle = '#f6ead6'; ctx.fillRect(-10, -6, 20, 12); }
        else { ctx.fillStyle = '#8a7aa0'; circle(0, 0, 10); circle(8, 4, 7); }
        ctx.globalAlpha = 1; ctx.restore(); }
      // the floor and the ceiling (with holes)
      for (const side of [0, 1]){ const sy = surfaceY(side), dir = side ? -1 : 1;
        ctx.fillStyle = side ? '#9a7ac8' : '#7ab070'; ctx.fillRect(0, side ? 0 : sy, W, side ? sy : H - sy);
        ctx.fillStyle = side ? '#b89ae0' : '#9ad08a'; ctx.fillRect(0, side ? sy - 8 : sy, W, 8);
        for (let i = Math.floor(cam/60) - 1; i*60 - cam < W + 60; i++){ const tx = i*60 - cam + hash(i + side*9)*30; ctx.fillStyle = side ? '#c8b0f0' : '#b8e0a0'; ctx.beginPath(); ctx.moveTo(tx, sy); ctx.lineTo(tx + 4, sy - dir*10); ctx.lineTo(tx + 8, sy); ctx.fill(); }
        for (const o of things){ if (o.k !== 'hole' || o.side !== side || o.filled) continue; const sx = o.x - cam; if (sx > W + 20 || sx + o.w < -20) continue; const hg = ctx.createLinearGradient(0, sy, 0, side ? 0 : H); hg.addColorStop(0, '#2a1a4a'); hg.addColorStop(1, '#4a2a7a'); ctx.fillStyle = hg; ctx.fillRect(sx, side ? 0 : sy, o.w, side ? sy : H - sy);
          for (let k=0;k<6;k++){ ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(sx + hash(k + o.x)*o.w, side ? hash(k + 3 + o.x)*sy : sy + 10 + hash(k + 3 + o.x)*50, 1.4); } } }
      // spikes and blocks
      for (const o of things){ const sx = o.x - cam; if (sx < -200 || sx > W + 200 || o.k === 'hole' || o.k === 'orb') continue; const sy = surfaceY(o.side), dir = o.side ? -1 : 1;
        if (o.k === 'spikes'){ ctx.fillStyle = '#e0464f'; for (let k=0; k*20 < o.w; k++){ ctx.beginPath(); ctx.moveTo(sx + k*20, sy); ctx.lineTo(sx + k*20 + 10, sy - dir*26); ctx.lineTo(sx + k*20 + 20, sy); ctx.fill(); } }
        else { const top = o.side ? CEIL : FLOOR - o.h; ctx.fillStyle = '#6a5a9a'; rr(sx, top, 30, o.h, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(sx + 4, top + 6, 6, o.h - 12); ctx.fillStyle = '#ffe066'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(o.side ? '▲' : '▼', sx + 15, o.side ? CEIL + o.h + 22 : FLOOR - o.h - 10); ctx.textAlign = 'left'; } }
      for (const o of things){ if (o.k !== 'orb' || o.done) continue; const sx = o.x - cam; if (sx < -20 || sx > W + 20) continue; const oy = (o.side ? CEIL + 40 : FLOOR - 40) + Math.sin(time*3 + o.x)*4; const og = ctx.createRadialGradient(sx, oy, 1, sx, oy, 16); og.addColorStop(0, 'rgba(255,240,255,.95)'); og.addColorStop(1, 'rgba(255,160,230,0)'); ctx.fillStyle = og; circle(sx, oy, 16); }
      // the exit door
      { const sx = GOAL + PX + 60 - cam; if (sx < W + 60){ ctx.fillStyle = '#ffe9a8'; rr(sx, CEIL + 40, 70, FLOOR - CEIL - 80, 30); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 14px "Pixelify Sans", monospace'; ctx.fillText('EXIT', sx + 18, (CEIL + FLOOR)/2); } }
      for (const q of trail){ ctx.fillStyle = `rgba(255,200,240,${q.life})`; circle(q.x - cam, q.y, 4*q.life + 1); }
      // you, right side up or upside down
      if (!(inv > 0 && Math.floor(inv*12) % 2 === 0)){ ctx.save(); ctx.translate(PX, y); if (up) ctx.scale(1, -1); const air = y !== surf(); Chin.draw(ctx, 'me', anim, 0, 0, { scale:.075, face:1, grounded:!air, speed:air ? 0 : speed }); ctx.restore(); }
      drawPops(cam);
    },
    hud(){
      hudBar(); for (let i=0;i<3;i++) heart(30 + i*28, 30, i < hearts);
      ctx.fillStyle = '#ff9ae8'; ctx.fillText(`● ${orbs}`, 118, 31);
      progress(x/GOAL, '#ff9ae8');
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(up ? 'upside down!' : 'right side up', W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ x += 120*dt; if (x > GOAL - 800) x = 0; },
  };
})();

// ================= Harmony Hollow: The Painted Melody =================
// Six paint pots, each with its own color and musical note. Watch (and listen to) the tune they play,
// then play it back. Every tune you get right paints another stripe of the big picture. Make it to
// the end of the song to finish the painting.
let notesCtx = null;
// a soft little bell tone (Web Audio), quiet enough to sit under the music
function playNote(freq, len){
  try {
    notesCtx = notesCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = notesCtx.currentTime, o = notesCtx.createOscillator(), o2 = notesCtx.createOscillator(), gn = notesCtx.createGain();
    o.type = 'triangle'; o.frequency.value = freq; o2.type = 'sine'; o2.frequency.value = freq*2;
    gn.gain.setValueAtTime(0, now); gn.gain.linearRampToValueAtTime(.18, now + .02); gn.gain.exponentialRampToValueAtTime(.001, now + (len || .5));
    o.connect(gn); o2.connect(gn); gn.connect(notesCtx.destination); o.start(now); o2.start(now); o.stop(now + (len || .5) + .05); o2.stop(now + (len || .5) + .05);
  } catch (e) {}
}
window.playNote = playNote;
const PAINT = (() => {
  const POTS = [
    { col:'#c84b4b', name:'Rose madder', f:261.6 }, { col:'#e08a3c', name:'Cadmium orange', f:293.7 }, { col:'#e6c34a', name:'Gold ochre', f:329.6 },
    { col:'#5f9e6e', name:'Sap green', f:392.0 }, { col:'#4a7fb8', name:'Cerulean', f:440.0 }, { col:'#8c63b8', name:'Violet', f:523.3 },
  ];
  const ROUNDS = 7, PY = 380, potX = i => 130 + i*108, PAINT_FLOWERS = ['#e8a0a8', '#fff0e0', '#e6c34a', '#b8a0d8'];
  let seq, round, step, phase, phaseT, showI, lit, litT, drops, cur, stripes, chinX, splats, oops, again;
  function newRound(){ seq.push(Math.floor(Math.random()*6)); step = 0; phase = 'show'; phaseT = .9; showI = 0; }
  function press(i){
    if (phase !== 'play') return;
    lit = i; litT = .3; playNote(POTS[i].f, .45); cur = i; splats.push({ x:potX(i), y:PY - 40, col:POTS[i].col, life:.6 });
    if (seq[step] === i){ step++; if (step === seq.length){ round++; stripes++; anim.happy = 1.5; pop(W/2, 150, round >= ROUNDS ? 'The painting is finished' : ['Lovely', 'Bravo', 'Beautiful', 'Exquisite', 'Encore'][round % 5], '#fff6e4');
      if (round >= ROUNDS){ phase = 'done'; phaseT = 1.8; for (let k=0;k<6;k++) setTimeout(() => playNote(POTS[k].f, .6), k*120); } else { phase = 'wait'; phaseT = 1.2; } } }
    else { drops--; oops = .8; shake = .25; pop(W/2, 150, 'Listen once more…', '#ffd0d3'); playNote(130, .4); if (drops <= 0){ phase = 'lost'; phaseT = 1.2; } else { phase = 'wait'; phaseT = 1.2; step = 0; again = true; } }
  }
  return {
    title:'The Painted Melody', sub:'Paint with music in the atelier of Harmony Hollow.',
    blurb:'The flickering portal opens onto a sunlit atelier where six jars of pigment sing. Watch and listen as they play a melody, then play it back in the same order. Each melody you play paints another layer of the canvas.',
    legend:['Watch which jars glow and listen to their notes', 'Then play them back in the same order', 'Press 1 2 3 4 5 6, or ← → and Space, or tap a jar', 'Each melody is one note longer', 'Play 7 melodies to finish the painting (3 drops of paint for mistakes)'],
    hints:['1–6, ← → and Space, or tap', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgAction'], actionLabel:'Play', clicks:true,
    winTitle:'A masterpiece', winText:'The final brushstroke settles, the painting begins to glow, and its music carries you through the canvas into the golden meadows of Harmony Hollow.',
    loseTitle:'Out of paint', loseText:'Your palette has run dry. The jars hum softly: come back and paint with us again.',
    againWinText:'Another masterpiece for the atelier walls.', againLoseText:'Out of paint for now. The jars will be ready for another melody.',
    reset(){ seq = []; round = 0; drops = 3; lit = -1; litT = 0; cur = 2; stripes = 0; chinX = potX(2); splats = []; oops = 0; again = false; seq.push(Math.floor(Math.random()*6)); step = 0; phase = 'show'; phaseT = 1.6; showI = 0; },
    seeds:() => round*3, stats:() => `<span>Tunes played ${round}/${ROUNDS}</span><span>Longest tune ${seq.length} notes</span>`,
    update(dt){
      time += dt; litT = Math.max(0, litT - dt); oops = Math.max(0, oops - dt);
      splats.forEach(s => s.life -= dt); splats = splats.filter(s => s.life > 0);
      chinX += (potX(cur) - chinX)*Math.min(1, dt*10);
      if (phase === 'show'){ input.taps.length = 0; input.keys.length = 0; input.pressed = false; input.click = null;
        phaseT -= dt; if (phaseT <= 0){ if (showI < seq.length){ const i = seq[showI++]; lit = i; litT = .45; cur = i; playNote(POTS[i].f, .5); phaseT = Math.max(.35, .65 - round*.04); } else { phase = 'play'; } } }
      else if (phase === 'wait'){ input.taps.length = 0; input.keys.length = 0; input.pressed = false; input.click = null; phaseT -= dt;
        if (phaseT <= 0){ if (again){ again = false; phase = 'show'; phaseT = .5; showI = 0; step = 0; } else newRound(); } }
      else if (phase === 'play'){
        for (const k of input.keys.splice(0)){ const i = +k - 1; if (i >= 0 && i < 6) press(i); }
        for (const k of input.taps.splice(0)){ if (k === 'left') cur = Math.max(0, cur - 1); if (k === 'right') cur = Math.min(5, cur + 1); }
        if (input.pressed){ input.pressed = false; press(cur); }
        if (input.click){ const c = input.click; input.click = null; const i = POTS.findIndex((p, k) => Math.abs(c.x - potX(k)) < 48 && c.y > PY - 90 && c.y < PY + 60); if (i >= 0) press(i); }
      }
      else if (phase === 'done'){ phaseT -= dt; if (phaseT <= 0) finish(true); }
      else if (phase === 'lost'){ phaseT -= dt; if (phaseT <= 0) finish(false); }
    },
    draw(){
      const SER = '"Cormorant Garamond", Georgia, serif';
      // a sunlit atelier: warm plaster, a tall arched window, light falling across the floor
      const wall = ctx.createLinearGradient(0, 0, 0, H); wall.addColorStop(0, '#efe3d0'); wall.addColorStop(1, '#e2cfb4'); ctx.fillStyle = wall; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.beginPath(); ctx.moveTo(600, 300); ctx.lineTo(600, 120); ctx.arc(670, 120, 70, Math.PI, 0); ctx.lineTo(740, 300); ctx.closePath(); ctx.clip();
      const sky = ctx.createLinearGradient(0, 50, 0, 300); sky.addColorStop(0, '#9ab8dc'); sky.addColorStop(.6, '#f0c8b4'); sky.addColorStop(1, '#f6dcaa'); ctx.fillStyle = sky; ctx.fillRect(600, 50, 140, 250);
      ctx.fillStyle = 'rgba(150,170,140,.9)'; ctx.beginPath(); ctx.moveTo(600, 300); for (let x = 600; x <= 740; x += 10) ctx.lineTo(x, 250 - Math.sin(x*.05)*12); ctx.lineTo(740, 300); ctx.fill(); ctx.restore();
      ctx.strokeStyle = '#a8906c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(600, 300); ctx.lineTo(600, 120); ctx.arc(670, 120, 70, Math.PI, 0); ctx.lineTo(740, 300); ctx.stroke(); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(670, 50); ctx.lineTo(670, 300); ctx.moveTo(600, 180); ctx.lineTo(740, 180); ctx.stroke();
      ctx.fillStyle = 'rgba(255,236,190,.22)'; ctx.beginPath(); ctx.moveTo(600, 300); ctx.lineTo(740, 300); ctx.lineTo(560, 480); ctx.lineTo(300, 480); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c8ad88'; ctx.fillRect(0, 300, W, H - 300); ctx.strokeStyle = 'rgba(120,90,60,.2)'; ctx.lineWidth = 1; ctx.beginPath(); for (let y = 312; y < H; y += 18){ ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
      // the canvas: one layer of the painting for every melody you play
      { const cx = 150, cy = 60, cw = 360, ch = 210; ctx.fillStyle = '#7a5a3a'; ctx.fillRect(cx + cw/2 - 4, cy + ch, 8, 50); ctx.fillRect(cx + 30, cy + ch, 6, 60); ctx.fillRect(cx + cw - 36, cy + ch, 6, 60);
        ctx.fillStyle = '#f8f3e8'; ctx.fillRect(cx, cy, cw, ch);
        ctx.save(); ctx.beginPath(); ctx.rect(cx, cy, cw, ch); ctx.clip(); const r = rng(42), L = Math.min(stripes, 7);
        const daub = (x, y, w, h, col, a) => { ctx.fillStyle = col; ctx.globalAlpha = a; ctx.beginPath(); ctx.ellipse(x, y, w, h, (r() - .5)*.5, 0, 7); ctx.fill(); ctx.globalAlpha = 1; };
        if (L >= 1){ const g2 = ctx.createLinearGradient(0, cy, 0, cy + ch*.62); g2.addColorStop(0, '#8fb0d8'); g2.addColorStop(.7, '#eec4b4'); g2.addColorStop(1, '#f6d8a8'); ctx.fillStyle = g2; ctx.fillRect(cx, cy, cw, ch*.62); for (let k=0;k<40;k++) daub(cx + r()*cw, cy + r()*ch*.55, 14 + r()*16, 4 + r()*4, r() < .5 ? '#f6e0d6' : '#c8d4ea', .35); }
        if (L >= 2){ const sx = cx + cw*.62, sy = cy + ch*.5; const sg = ctx.createRadialGradient(sx, sy, 4, sx, sy, 90); sg.addColorStop(0, 'rgba(255,236,190,.95)'); sg.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = sg; circle(sx, sy, 90); ctx.fillStyle = '#ffe6b0'; circle(sx, sy, 16); }
        if (L >= 3){ for (let k=0;k<60;k++) daub(cx + r()*cw, cy + ch*.52 + Math.sin(k)*6 + r()*10, 12 + r()*14, 5 + r()*5, r() < .5 ? '#9a8cc0' : '#a8b8a0', .55); }
        if (L >= 4){ const lg = ctx.createLinearGradient(0, cy + ch*.62, 0, cy + ch); lg.addColorStop(0, '#e8c0b0'); lg.addColorStop(1, '#7a98c0'); ctx.fillStyle = lg; ctx.fillRect(cx, cy + ch*.62, cw, ch*.38); for (let k=0;k<50;k++) daub(cx + r()*cw, cy + ch*.64 + r()*ch*.34, 10 + r()*16, 2, r() < .5 ? '#f6dcc0' : '#8ab0d0', .5); }
        if (L >= 5){ for (const tx of [cx + 40, cx + 70, cx + cw - 50]){ ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tx, cy + ch*.64); ctx.lineTo(tx + 2, cy + ch*.3); ctx.stroke(); for (let k=0;k<26;k++) daub(tx + (r() - .5)*60, cy + ch*.2 + r()*ch*.35, 7, 10, r() < .5 ? '#5f9e6e' : '#8ab070', .7); } }
        if (L >= 6){ for (let k=0;k<12;k++){ const y = cy + ch*.66 + k*5; daub(cx + cw*.62 + (r() - .5)*20, y, 34 - k*2, 2.4, '#fff0c8', .7); } }
        if (L >= 7){ for (let k=0;k<40;k++) daub(cx + r()*cw, cy + ch*.9 + r()*ch*.1, 3 + r()*3, 3, PAINT_FLOWERS[Math.floor(r()*4)], .9); ctx.strokeStyle = 'rgba(60,50,60,.7)'; ctx.lineWidth = 1.6; for (let k=0;k<3;k++){ const bx = cx + 120 + k*26, by = cy + 40 + k*8; ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.quadraticCurveTo(bx - 3, by - 4, bx, by); ctx.quadraticCurveTo(bx + 3, by - 4, bx + 6, by); ctx.stroke(); } }
        ctx.restore(); ctx.strokeStyle = '#b8945a'; ctx.lineWidth = 8; ctx.strokeRect(cx - 4, cy - 4, cw + 8, ch + 8); }
      // the jars of pigment on a long table
      ctx.fillStyle = '#8a6a48'; ctx.fillRect(60, PY + 20, 680, 14); ctx.fillStyle = '#6e5238'; ctx.fillRect(80, PY + 34, 10, 70); ctx.fillRect(710, PY + 34, 10, 70);
      POTS.forEach((p, i) => { const x = potX(i), on = lit === i && litT > 0, rise = on ? -8*Math.sin(litT/.45*Math.PI) : 0;
        if (on){ const g = ctx.createRadialGradient(x, PY - 30, 4, x, PY - 30, 90); g.addColorStop(0, p.col + '99'); g.addColorStop(1, p.col + '00'); ctx.fillStyle = g; circle(x, PY - 30, 90); }
        // a glazed jar: a soft shoulder, a band of the color, a cork stopper
        const jg = ctx.createLinearGradient(x - 32, 0, x + 32, 0); jg.addColorStop(0, '#d8cfc4'); jg.addColorStop(.5, '#f6f1ea'); jg.addColorStop(1, '#c8bdb0'); ctx.fillStyle = jg;
        ctx.beginPath(); ctx.moveTo(x - 22, PY - 54 + rise); ctx.quadraticCurveTo(x - 36, PY - 40 + rise, x - 32, PY + 10); ctx.quadraticCurveTo(x, PY + 22, x + 32, PY + 10); ctx.quadraticCurveTo(x + 36, PY - 40 + rise, x + 22, PY - 54 + rise); ctx.closePath(); ctx.fill();
        ctx.fillStyle = p.col; ctx.beginPath(); ctx.moveTo(x - 33, PY - 22 + rise*.5); ctx.quadraticCurveTo(x, PY - 14 + rise*.5, x + 33, PY - 22 + rise*.5); ctx.lineTo(x + 32, PY + 4); ctx.quadraticCurveTo(x, PY + 14, x - 32, PY + 4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#b8945a'; rr(x - 14, PY - 64 + rise, 28, 12, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x - 18, PY - 30 + rise, 3, 12, 0, 0, 7); ctx.fill();
        if (on){ ctx.fillStyle = 'rgba(180,135,60,.9)'; ctx.font = `italic 600 28px ${SER}`; ctx.textAlign = 'center'; ctx.fillText('♪', x + 26, PY - 74 + rise*2); ctx.textAlign = 'left'; }
        ctx.fillStyle = '#6e5238'; ctx.font = `italic 600 15px ${SER}`; ctx.textAlign = 'center'; ctx.fillText(String(i + 1), x, PY + 52); ctx.textAlign = 'left'; });
      for (const s of splats){ ctx.globalAlpha = s.life*1.2; for (let k=0;k<7;k++){ const a = k/7*Math.PI*2; ctx.fillStyle = s.col; ctx.beginPath(); ctx.ellipse(s.x + Math.cos(a)*(.6 - s.life)*70, s.y - 20 + Math.sin(a)*(.6 - s.life)*40 - (.6 - s.life)*40, 4, 2.5, a, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
      // you, with a fine brush, by the jar you're about to play
      ctx.save(); ctx.translate(chinX, PY + 94); Chin.draw(ctx, 'me', anim, 0, 0, { scale:.07, face:1, grounded:true, speed:0 });
      ctx.strokeStyle = '#6e5238'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(18, -40); ctx.lineTo(36, -80); ctx.stroke(); ctx.fillStyle = POTS[cur].col; ctx.beginPath(); ctx.ellipse(37, -84, 3, 6, .4, 0, 7); ctx.fill(); ctx.restore();
      if (phase === 'play'){ ctx.strokeStyle = 'rgba(184,148,90,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(potX(cur), PY - 18, 48, 62, 0, 0, 7); ctx.stroke(); }
      ctx.textAlign = 'center'; ctx.font = `italic 600 22px ${SER}`; ctx.fillStyle = phase === 'show' ? '#7a5a8a' : '#4a6a52';
      ctx.fillText(phase === 'show' ? 'Listen…' : phase === 'play' ? `Your turn  (${step} of ${seq.length})` : '', W/2, 298); ctx.textAlign = 'left';
      if (oops > 0){ ctx.fillStyle = `rgba(200,75,75,${oops*.18})`; ctx.fillRect(0, 0, W, H); }
      drawPops(0);
    },
    hud(){
      hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText('Paint', 24, 31); for (let i=0;i<3;i++){ ctx.fillStyle = i < drops ? POTS[i*2].col : 'rgba(246,234,214,.25)'; ctx.beginPath(); ctx.moveTo(90 + i*22, 20); ctx.quadraticCurveTo(100 + i*22, 34, 90 + i*22, 40); ctx.quadraticCurveTo(80 + i*22, 34, 90 + i*22, 20); ctx.fill(); }
      progress(round/ROUNDS, '#a070d0');
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`Tune ${Math.min(round + 1, ROUNDS)}/${ROUNDS}`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
})();

// ================= THE WARP: Warp Tunnel =================
// Zoom down a swirling tunnel. Rings rush toward you with one gap in each; turn the tunnel
// (← →) so the gap comes around to where you're standing. Grab the warp stars on the way.
const WARPT = (() => {
  const CX = 400, CY = 230, R0 = 200, RINGS = 36, A0 = Math.PI/2;
  let rings, stars, a, spawnT, lastGap, passed, made, hearts, starsGot, inv, done, doneT, v, flash;
  const angDist = (p, q) => { let d = ((p - q) % (Math.PI*2) + Math.PI*3) % (Math.PI*2) - Math.PI; return Math.abs(d); };
  function spawn(){
    if (made >= RINGS) return;
    const k = made/RINGS, gw = 1.5 - k*.5;
    lastGap += (Math.random() - .5)*2*(1.1 + k*.5); made++;
    rings.push({ z:12, gap:lastGap, gw, hue:(made*37) % 360, checked:false });
    if (Math.random() < .5) stars.push({ z:12.8, a:lastGap + (Math.random() - .5)*gw*.6, got:false });
  }
  function hurt(){ if (inv > 0) return; hearts--; inv = 1.2; shake = .35; flash = .4; pop(CX, CY + R0 - 120, 'Zzzap!', '#ffd0d3'); if (hearts <= 0) finish(false); }
  // where something at tunnel angle q and depth z shows up on screen (you stay at the bottom; the tunnel turns)
  const scr = (q, z) => { const r = R0/z, s = q - a + A0; return [CX + Math.cos(s)*r, CY + Math.sin(s)*r, r]; };
  return {
    title:'Warp Tunnel', sub:'Zoom through the swirling heart of THE WARP.',
    blurb:'Behind the stone door, a tunnel of swirling color pulls you in! Rings come rushing at you, each with one gap. Turn the tunnel so the gap lines up with you and zoom through all 36 rings.',
    legend:['← → to turn the tunnel around you', 'Line up with the gap in each ring before it reaches you', 'Grab the warp stars', 'The rings come faster and the gaps get smaller', '3 hearts'],
    hints:['← → to turn', 'P to pause'], pad:['wgLeft', 'wgRight'],
    winTitle:'Through the Warp!', winText:'The last ring flashes past and you tumble out into a land where time goes sideways and doors float in the air. Welcome to THE WARP.',
    loseTitle:'Warped out!', loseText:'The tunnel spins you right back out the stone door into the Crystal Grotto. Dizzy, but fine!',
    againWinText:'Through the tunnel again! THE WARP hums with approval.', againLoseText:'Spun right back out! Tock the clock creature tuts kindly: “Again?”',
    reset(){ rings = []; stars = []; a = 0; spawnT = 1; lastGap = 0; passed = 0; made = 0; hearts = 3; starsGot = 0; inv = 0; done = false; doneT = 0; v = 2.6; flash = 0; },
    seeds:() => starsGot + Math.floor(passed/4), stats:() => `<span>Rings ${passed}/${RINGS}</span><span>Warp stars ${starsGot}</span>`,
    update(dt){
      time += dt; inv = Math.max(0, inv - dt); flash = Math.max(0, flash - dt);
      if (done){ doneT += dt; v += dt*6; if (doneT > 1.6) finish(true); }
      const turn = (input.right ? 1 : 0) - (input.left ? 1 : 0); a -= turn*3.3*dt;
      v = done ? v : 2.6 + passed/RINGS*1.4;
      spawnT -= dt; if (spawnT <= 0){ spawn(); spawnT = Math.max(.62, 1.05 - passed/RINGS*.4); }
      for (const r of rings){ r.z -= v*dt;
        if (!r.checked && r.z <= 1){ r.checked = true; if (angDist(a, r.gap) < r.gw/2 - .06){ passed++; if (passed % 6 === 0) pop(CX, CY + R0 - 130, ['Whoosh!', 'Zoom!', 'Wheee!'][passed % 3], '#e8d0ff'); } else { hurt(); passed++; } } }
      for (const s of stars){ s.z -= v*dt; if (!s.got && s.z <= 1 && s.z > .7 && angDist(a, s.a) < .32){ s.got = true; starsGot++; anim.chew = .3; } }
      rings = rings.filter(r => r.z > .25); stars = stars.filter(s => s.z > .25 && !s.got);
      if (!done && passed >= RINGS){ done = true; doneT = 0; anim.happy = 4; }
    },
    draw(){
      const hue = (time*40) % 360;
      const g = ctx.createRadialGradient(CX, CY, 4, CX, CY, 520); g.addColorStop(0, `hsl(${hue},80%,92%)`); g.addColorStop(.15, `hsl(${(hue + 60) % 360},70%,55%)`); g.addColorStop(.6, `hsl(${(hue + 160) % 360},60%,30%)`); g.addColorStop(1, `hsl(${(hue + 220) % 360},60%,14%)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // spiral streaks spinning down the tunnel
      ctx.lineWidth = 2;
      for (let k=0;k<16;k++){ const q = k/16*Math.PI*2 + time*.6; ctx.strokeStyle = `hsla(${(hue + k*22) % 360},90%,75%,.35)`; ctx.beginPath(); for (let z = 8; z > .6; z -= .4){ const [sx, sy] = scr(q + z*.35, z); z === 8 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy); } ctx.stroke(); }
      // depth rings for speed
      for (let k=0;k<10;k++){ const z = 1 + ((k - time*v*.9) % 10 + 10) % 10; ctx.strokeStyle = `rgba(255,255,255,${.1/z + .02})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(CX, CY, R0/z, 0, 7); ctx.stroke(); }
      // stars and rings, far to near
      const objs = [...rings.map(r => ({ z:r.z, r })), ...stars.map(s => ({ z:s.z, s }))].sort((p, q) => q.z - p.z);
      for (const o of objs){
        if (o.r){ const r = o.r, rad = R0/r.z, s0 = r.gap - a + A0; if (r.z < .9) continue;
          ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(CX, CY, rad, s0 + r.gw/2, s0 - r.gw/2 + Math.PI*2);
          ctx.strokeStyle = `rgba(20,10,40,${Math.min(.7, 1.2/r.z)})`; ctx.lineWidth = Math.max(4, 58/r.z); ctx.stroke();
          ctx.strokeStyle = `hsla(${(r.hue + hue + 180) % 360},95%,${r.z < 1.6 ? 66 : 58}%,${Math.min(1, 1.6/r.z + .1)})`; ctx.lineWidth = Math.max(2, 46/r.z); ctx.stroke(); ctx.lineCap = 'butt';
          // a soft glow marks the gap when it's close
          if (r.z < 3){ const [gx, gy] = scr(r.gap, r.z); const gg = ctx.createRadialGradient(gx, gy, 2, gx, gy, 50/r.z); gg.addColorStop(0, 'rgba(255,255,255,.5)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gg; circle(gx, gy, 50/r.z); } }
        else { const st = o.s; const [sx, sy, rr2] = scr(st.a, st.z); const k = Math.max(3, 16/st.z); ctx.fillStyle = '#fff6c8'; ctx.beginPath(); for (let j=0;j<10;j++){ const q = -Math.PI/2 + j*Math.PI/5 + time*2, r = j % 2 ? k*.45 : k; j ? ctx.lineTo(sx + Math.cos(q)*r, sy + Math.sin(q)*r*.9) : ctx.moveTo(sx + Math.cos(q)*r, sy + Math.sin(q)*r*.9); } ctx.closePath(); ctx.fill(); }
      }
      // you, standing on the inside of the tunnel at the bottom
      if (!(inv > 0 && Math.floor(inv*12) % 2 === 0)){ const tilt = ((input.right ? 1 : 0) - (input.left ? 1 : 0))*.15; ctx.save(); ctx.translate(CX, CY + R0 - 6); ctx.rotate(tilt); Chin.draw(ctx, 'me', anim, 0, 0, { scale:.075, face:input.left ? -1 : 1, grounded:true, speed:(input.left || input.right) ? 200 : 0 }); ctx.restore(); }
      if (flash > 0){ ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(0, 0, W, H); }
      if (done){ ctx.fillStyle = `rgba(255,255,255,${Math.min(1, doneT/1.4)})`; ctx.fillRect(0, 0, W, H); }
      drawPops(0);
    },
    hud(){
      hudBar(); for (let i=0;i<3;i++) heart(30 + i*28, 30, i < hearts);
      ctx.fillStyle = '#fff6c8'; ctx.fillText(`★ ${starsGot}`, 118, 31);
      progress(passed/RINGS, '#e8a0ff');
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`${passed}/${RINGS}`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ a += dt*.4; },
  };
})();

// ================= Dusty Gulch: The Ghosts of the Gilded Spur =================
// The old hotel's lobby clock stopped at midnight long ago, so its ghost guests live the same night,
// 9 o'clock to midnight, over and over. Wind the clock back and forth to watch the night replay, and
// shine your lantern into a room to see who's there: ghosts only show up in lantern light (but a
// candle burns blue wherever a ghost is). Three cases a visit, shuffled fresh every time:
//   1. The Floating Pearls:     pearls are real, so you can see them drift about in the dark. Who's carrying them?
//   2. The Bell at the Desk:    every ghost gives an alibi. Check each one against the replay: one is a fib.
//   3. The Ghost in the Mirror: one "ghost" is a living swindler in a bedsheet. Real ghosts have no reflection…
const HOTEL = (() => {
  const HX = 30, HY = 82, RW = 180, RH = 96, STEPS = 13, PX = 588, TL = { x0:64, x1:556, y:428 };
  const ROOMS = ['Lobby', 'Dining Hall', 'Kitchen', 'Library', 'Billiards', 'Room 4', 'Attic', 'Bridal Suite', 'Room 7'];
  const WALLS = ['#6a3a3a', '#5a4a2a', '#4a5a4a', '#3a3a5a', '#2a4a3a', '#5a4a5a', '#4a3a2a', '#6a3a5a', '#3a4a5a'];
  const MIRRORS = [0, 4, 7], SUITE = 7;
  const GHOSTS = [
    { name:'Miss Clementine', who:'the saloon singer', col:'255,150,210' },
    { name:'Doc Hollow', who:'the old dentist', col:'150,235,180' },
    { name:'Prospector Pete', who:'still looking for gold', col:'255,215,120' },
    { name:'Marshal Moss', who:'the very first marshal', col:'150,200,255' },
    { name:'Lil’ Tumble', who:'the bellhop’s kid', col:'255,170,110' },
  ];
  let cases, ci, hunches, solved, ts, tv, lit, paths, banner, bannerT, lastAim, cardFlash, drag;
  const rand = n => Math.floor(Math.random()*n);
  const pick = a => a[rand(a.length)];
  const clock = s => { const m = 21*60 + s*15, h = Math.floor(m/60), mm = m % 60; return `${h > 12 ? h - 12 : h}:${String(mm).padStart(2, '0')}`; };
  function nbrs(r){ const f = Math.floor(r/3), c = r % 3, out = []; if (c > 0) out.push(r - 1); if (c < 2) out.push(r + 1); if (f > 0) out.push(r - 3); if (f < 2) out.push(r + 3); return out; }
  function walk(r0, n, stay){ const p = [r0]; while (p.length < n) p.push(Math.random() < stay ? p[p.length - 1] : pick(nbrs(p[p.length - 1]))); return p; }
  function roomXY(r){ return { x:HX + (r % 3)*RW, y:HY + (2 - Math.floor(r/3))*RH }; }
  function slot(r, g){ const p = roomXY(r); return { x:p.x + 40 + g*25, y:p.y + RH - 14 }; }
  const ease = f => f*f*(3 - 2*f);
  function at(path, g){ const s0 = Math.floor(tv), s1 = Math.min(STEPS - 1, s0 + 1), f = ease(tv - s0), a = slot(path[g][s0], g), b = slot(path[g][s1], g); return { x:a.x + (b.x - a.x)*f, y:a.y + (b.y - a.y)*f }; }

  // ----- the three cases -----
  function makePearls(){
    const thief = rand(5), s0 = 2 + rand(4), len = 3 + rand(2), P = [];
    for (let g = 0; g < 5; g++){
      if (g !== thief){ P.push(walk(rand(9), STEPS, .45)); continue; }
      const before = walk(SUITE, s0 + 1, .4).reverse();            // wander, ending up in the Bridal Suite
      const carry = [SUITE]; while (carry.length <= len) carry.push(pick(nbrs(carry[carry.length - 1]).filter(r => r !== SUITE)));
      P.push(before.concat(carry.slice(1), walk(carry[carry.length - 1], STEPS, .5).slice(1)).slice(0, STEPS));
    }
    return { kind:'pearls', title:'The Floating Pearls', culprit:thief, paths:P, s0, s1:s0 + len,
      text:'The Widow Wren’s pearls have vanished from the Bridal Suite! Pearls aren’t ghosts, so you can see them in the dark… but who’s carrying them?',
      reveal:`${GHOSTS[thief].name} blushes right through. “They were just so shiny!” The pearls go home to the Widow Wren.` };
  }
  function makeAlibi(){
    const liar = rand(5), P = [], claims = [], steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].sort(() => Math.random() - .5);
    for (let g = 0; g < 5; g++){ const p = walk(rand(9), STEPS, .45); P.push(p); const s = steps[g];
      claims.push({ s, r: g === liar ? pick([0, 1, 2, 3, 4, 5, 6, 7, 8].filter(r => r !== p[s] && r !== p[s - 1] && r !== p[s + 1])) : p[s] }); }
    return { kind:'alibi', title:'The Bell at the Desk', culprit:liar, paths:P, claims,
      text:'Somebody rang the front desk bell a hundred times and woke the whole hotel! Every ghost swears where they were. Wind the clock and check: one of them is fibbing.',
      reveal:`“Fine, it was me!” giggles ${GHOSTS[liar].name}. “It’s the only fun to be had around here after nine!”` };
  }
  function makeMirror(){
    const fake = rand(5); let P;
    for (let tries = 0; tries < 400; tries++){
      P = []; for (let g = 0; g < 5; g++) P.push(walk(MIRRORS[rand(3)], STEPS, .35));
      const visits = P.map(p => p.filter(r => MIRRORS.includes(r)).length);
      if (visits[fake] >= 3 && visits.every(v => v >= 2)) break;
    }
    return { kind:'mirror', title:'The Ghost in the Mirror', culprit:fake, paths:P,
      text:'One of these “ghosts” is a living swindler in a bedsheet, scaring guests away to buy the hotel for a nickel. Remember: real ghosts have no reflection…',
      reveal:'You tug the sheet… it’s Slick Sal the weasel! “I’d have bought this hotel for a nickel, if it weren’t for you meddling chinchillas!”' };
  }
  function startCase(i){ ci = i; paths = cases[i].paths; ts = 0; tv = 0; banner = null; }

  // ----- drawing -----
  function ghostFig(x, y, g, a, s){
    const c = GHOSTS[g].col, bob = Math.sin(t*2.4 + g*1.7)*3;
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(s, s); ctx.globalAlpha = a;
    const gg = ctx.createRadialGradient(0, -22, 2, 0, -22, 34); gg.addColorStop(0, `rgba(${c},.4)`); gg.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gg; circle(0, -22, 34);
    ctx.fillStyle = `rgba(${c},.55)`; ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(-13, -26); ctx.arc(0, -26, 13, Math.PI, 0); ctx.lineTo(13, 0);
    for (let k = 0; k < 4; k++){ const x0 = 13 - k*6.5; ctx.quadraticCurveTo(x0 - 3.2, 5 + Math.sin(t*6 + k)*2, x0 - 6.5, 0); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.ellipse(-4, -30, 5, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1a1424'; ctx.beginPath(); ctx.ellipse(-5, -27, 2.4, 3.4, 0, 0, 7); ctx.ellipse(5, -27, 2.4, 3.4, 0, 0, 7); ctx.fill(); circle(0, -19, 2);
    if (g === 0){ ctx.fillStyle = '#ff7ac0'; for (let k = -2; k <= 2; k++) circle(k*5, -14 + Math.abs(k), 3.5); ctx.strokeStyle = '#ffb0e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(6, -38); ctx.quadraticCurveTo(14, -52, 22, -48); ctx.stroke(); }
    else if (g === 1){ ctx.fillStyle = '#2a2430'; ctx.fillRect(-10, -52, 20, 14); ctx.fillRect(-15, -39, 30, 3); ctx.strokeStyle = '#e8e0c0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-5, -27, 4.5, 0, 7); ctx.moveTo(9.5, -27); ctx.arc(5, -27, 4.5, 0, 7); ctx.stroke(); }
    else if (g === 2){ ctx.fillStyle = 'rgba(240,240,240,.85)'; ctx.beginPath(); ctx.moveTo(-10, -21); ctx.lineTo(10, -21); ctx.lineTo(0, -4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.ellipse(0, -38, 17, 4, -.1, 0, 7); ctx.fill(); rr(-9, -48, 18, 11, 4); ctx.fill(); }
    else if (g === 3){ ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.ellipse(0, -38, 19, 4, 0, 0, 7); ctx.fill(); rr(-9, -50, 18, 13, 5); ctx.fill(); ctx.fillStyle = '#f2c230'; ctx.beginPath(); for (let k = 0; k < 10; k++){ const an = -Math.PI/2 + k*Math.PI/5, r = k % 2 ? 2 : 5; k ? ctx.lineTo(Math.cos(an)*r, -10 + Math.sin(an)*r) : ctx.moveTo(Math.cos(an)*r, -10 + Math.sin(an)*r); } ctx.closePath(); ctx.fill(); }
    else { ctx.fillStyle = '#d0452f'; ctx.beginPath(); ctx.arc(0, -36, 10, Math.PI, 0); ctx.fill(); ctx.fillRect(-16, -37, 10, 3); ctx.fillStyle = 'rgba(200,120,80,.7)'; circle(-7, -22, 1.2); circle(-4, -21, 1.2); circle(7, -22, 1.2); circle(4, -21, 1.2); }
    ctx.restore();
  }
  // the swindler's reflection: a plain bedsheet with eye holes… and a pair of boots sticking out
  function sheetFig(x, y){
    ctx.fillStyle = '#e8e4dc'; ctx.beginPath(); ctx.moveTo(-9 + x, y - 4); ctx.lineTo(-9 + x, y - 22); ctx.arc(x, y - 22, 9, Math.PI, 0); ctx.lineTo(9 + x, y - 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a1424'; circle(x - 3, y - 23, 1.6); circle(x + 3, y - 23, 1.6); ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 8, y - 4, 6, 4); ctx.fillRect(x + 2, y - 4, 6, 4);
  }
  function decor(r, x, y){
    ctx.fillStyle = WALLS[r]; ctx.fillRect(x, y, RW, RH);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 10; k < RW; k += 20) ctx.fillRect(x + k, y, 6, RH - 14);
    ctx.fillStyle = '#4a2e1a'; ctx.fillRect(x, y + RH - 14, RW, 14); ctx.fillStyle = '#5c3a22'; ctx.fillRect(x, y + RH - 14, RW, 3);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, y, RW, 6);
    const f = y + RH - 14;
    ctx.save();
    if (r === 0){ ctx.fillStyle = '#7a4a28'; ctx.fillRect(x + 50, f - 30, 80, 30); ctx.fillStyle = '#c9a13a'; ctx.beginPath(); ctx.arc(x + 90, f - 31, 6, Math.PI, 0); ctx.fill(); ctx.fillRect(x + 82, f - 31, 16, 2); ctx.fillStyle = '#3a2416'; ctx.fillRect(x + 56, y + 16, 40, 26); for (let k = 0; k < 6; k++){ ctx.fillStyle = '#c9a13a'; circle(x + 62 + (k % 3)*14, y + 24 + Math.floor(k/3)*12, 2); } }
    else if (r === 1){ ctx.fillStyle = '#e8dcc8'; ctx.fillRect(x + 30, f - 26, 110, 6); ctx.fillStyle = '#5a3a22'; ctx.fillRect(x + 36, f - 20, 5, 20); ctx.fillRect(x + 130, f - 20, 5, 20); ctx.fillStyle = '#c9a13a'; ctx.fillRect(x + 82, f - 46, 4, 20); ctx.fillRect(x + 72, f - 46, 24, 3); for (const dx of [72, 84, 96]) ctx.fillRect(x + dx - 1, f - 54, 3, 8); ctx.fillStyle = '#fff'; for (const dx of [48, 116]){ ctx.beginPath(); ctx.ellipse(x + dx, f - 27, 9, 2.5, 0, 0, 7); ctx.fill(); } }
    else if (r === 2){ ctx.fillStyle = '#2a2a2e'; ctx.fillRect(x + 40, f - 40, 60, 40); ctx.fillRect(x + 84, y + 10, 10, f - 40 - y - 10); ctx.fillStyle = '#d0702a'; ctx.fillRect(x + 50, f - 16, 40, 8); ctx.fillStyle = '#6a6a72'; rr(x + 52, f - 56, 30, 16, 4); ctx.fill(); ctx.fillStyle = '#8a6a44'; for (let k = 0; k < 3; k++) ctx.fillRect(x + 118 + k*14, y + 20, 3, 18); }
    else if (r === 3){ for (let sh = 0; sh < 3; sh++){ ctx.fillStyle = '#4a2e1a'; ctx.fillRect(x + 22, y + 18 + sh*22, 110, 4); for (let b = 0; b < 12; b++){ ctx.fillStyle = ['#8a3a3a', '#3a5a8a', '#6a8a3a', '#8a7a3a'][(b + sh) % 4]; ctx.fillRect(x + 24 + b*9, y + 4 + sh*22, 7, 14 - (b*7 + sh) % 4); } } ctx.fillStyle = '#7a3a2a'; rr(x + 120, f - 26, 26, 26, 6); ctx.fill(); }
    else if (r === 4){ ctx.fillStyle = '#3a2416'; ctx.fillRect(x + 26, f - 26, 112, 8); ctx.fillStyle = '#2a7a4a'; ctx.fillRect(x + 30, f - 30, 104, 6); ctx.fillStyle = '#3a2416'; ctx.fillRect(x + 32, f - 18, 6, 18); ctx.fillRect(x + 126, f - 18, 6, 18); for (const [dx, cl] of [[60, '#f2c230'], [70, '#d0452f'], [100, '#fff']]){ ctx.fillStyle = cl; circle(x + dx, f - 33, 3); } ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 20, y + 20); ctx.lineTo(x + 30, f - 30); ctx.stroke(); }
    else if (r === 5 || r === 8){ ctx.fillStyle = '#e8dcc8'; ctx.fillRect(x + 24, f - 22, 70, 14); ctx.fillStyle = r === 5 ? '#5a6a9a' : '#8a5a4a'; ctx.fillRect(x + 40, f - 24, 54, 12); ctx.fillStyle = '#4a2e1a'; ctx.fillRect(x + 20, f - 40, 6, 40); ctx.fillRect(x + 92, f - 26, 6, 26); ctx.fillStyle = '#fff'; rr(x + 27, f - 30, 16, 9, 4); ctx.fill();
      ctx.fillStyle = '#2a1a10'; ctx.fillRect(x + 60, y + 14, 34, 26); ctx.fillStyle = 'rgba(150,170,220,.4)'; ctx.fillRect(x + 63, y + 17, 28, 20);
      if (r === 8){ ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 128, f, 16, Math.PI*1.1, Math.PI*1.9); ctx.moveTo(x + 118, f - 4); ctx.lineTo(x + 118, f - 40); ctx.moveTo(x + 138, f - 4); ctx.lineTo(x + 138, f - 22); ctx.stroke(); } }
    else if (r === 6){ ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60, y); ctx.lineTo(x, y + 50); ctx.fill(); ctx.fillStyle = '#6b4a2b'; rr(x + 70, f - 28, 56, 28, 5); ctx.fill(); ctx.fillStyle = '#c9a13a'; ctx.fillRect(x + 70, f - 18, 56, 3); ctx.fillRect(x + 96, f - 22, 5, 7);
      ctx.strokeStyle = 'rgba(230,230,240,.4)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 5; k++){ ctx.moveTo(x + RW, y); ctx.lineTo(x + RW - 40*Math.cos(k*.4), y + 40*Math.sin(k*.4)); } for (const rad of [14, 26, 38]){ ctx.moveTo(x + RW - rad, y); ctx.arc(x + RW, y, rad, Math.PI, Math.PI/2, true); } ctx.stroke(); }
    else if (r === 7){ ctx.fillStyle = '#f0d0e0'; ctx.fillRect(x + 20, f - 22, 76, 14); ctx.fillStyle = '#c86a9a'; ctx.fillRect(x + 36, f - 24, 60, 12); ctx.fillStyle = '#4a2e1a'; ctx.fillRect(x + 18, y + 14, 5, f - y - 14); ctx.fillRect(x + 94, y + 14, 5, f - y - 14); ctx.fillStyle = 'rgba(255,200,230,.5)'; ctx.fillRect(x + 18, y + 12, 81, 10); ctx.beginPath(); ctx.moveTo(x + 23, y + 22); ctx.quadraticCurveTo(x + 30, y + 50, x + 23, f - 24); ctx.lineTo(x + 23, y + 22); ctx.fill();
      ctx.fillStyle = '#7a4a28'; ctx.fillRect(x + 108, f - 26, 44, 26); }
    ctx.restore();
    if (MIRRORS.includes(r)){ const mx = x + RW - 34, my = y + 34; ctx.fillStyle = '#c9a13a'; ctx.beginPath(); ctx.ellipse(mx, my, 15, 21, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#9ab0c8'; ctx.beginPath(); ctx.ellipse(mx, my, 11, 17, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(mx - 6, my - 10, 3, 12); }
  }
  function roomAt(px, py){ if (px < HX || px >= HX + 3*RW || py < HY || py >= HY + 3*RH) return -1; return (2 - Math.floor((py - HY)/RH))*3 + Math.floor((px - HX)/RW); }
  function cardRect(i){ return { x:PX, y:186 + i*56, w:W - PX - 10, h:50 }; }
  function wrapText(txt, x, y, maxW, lh){ const words = txt.split(' '); let line = ''; for (const w of words){ const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line){ ctx.fillText(line, x, y); y += lh; line = w; } else line = test; } ctx.fillText(line, x, y); return y; }
  function pearlsPos(){
    const c = cases[ci]; if (c.kind !== 'pearls') return null;
    const one = s => { if (s < c.s0){ const p = roomXY(SUITE); return { x:p.x + 130, y:p.y + RH - 42, carried:false }; }
      if (s <= c.s1){ const q = slot(c.paths[c.culprit][s], c.culprit); return { x:q.x + 12, y:q.y - 16, carried:true }; }
      const p = roomXY(c.paths[c.culprit][c.s1]); return { x:p.x + 100, y:p.y + RH - 16, carried:false }; };
    const s0 = Math.floor(tv), s1 = Math.min(STEPS - 1, s0 + 1), f = ease(tv - s0), a = one(s0), b = one(s1);
    return { x:a.x + (b.x - a.x)*f, y:a.y + (b.y - a.y)*f + (a.carried ? Math.sin(t*2.4 + c.culprit*1.7)*3 : 0) };
  }
  function accuse(i){
    if (banner || i < 0 || i > 4) return;
    const c = cases[ci], r = cardRect(i);
    if (i === c.culprit){ solved++; banner = { title:'Case closed!', text:c.reveal }; bannerT = 0; anim.happy = 2; pop(r.x + r.w/2, r.y, 'Gotcha!', '#ffe066'); }
    else { hunches--; shake = .3; cardFlash[i] = 1; pop(r.x + r.w/2, r.y + 10, pick(['“Not I!”', '“How rude!”', '“Boo-hoo, wrong!”', '“I never!”']), '#ff8a9a'); if (hunches <= 0) finish(false); }
  }

  return {
    title:'The Ghosts of the Gilded Spur', sub:'Solve three spooky cases in the haunted hotel.',
    blurb:'The Gilded Spur Hotel’s clock stopped at midnight long ago, so its ghost guests live the same night over and over. Wind the clock back and forth to replay the night, and shine your lantern into the rooms: ghosts only show up in lantern light! Solve three cases to earn your detective’s badge.',
    legend:['← → (or drag the clock) to wind time back and forth', 'Point at a room (or ↑ ↓ and Space) to shine your lantern in', 'A candle burns blue when a ghost is in the room', 'Click a suspect (or press 1–5) to accuse them', 'Three wrong hunches and the ghosts chase you out!'],
    hints:['← → wind the clock', 'Point to light a room', 'Click a suspect to accuse', 'P to pause'],
    pad:['wgLeft', 'wgRight', 'wgUp', 'wgDown', 'wgAction'], actionLabel:'Next room', clicks:true,
    winTitle:'Mystery solved!', winText:'Three cases cracked! The ghosts give you a spooky round of applause, and the hotel clock ticks for the first time in a hundred years.',
    loseTitle:'Out of hunches', loseText:'“Boooo!” The ghosts chase you out of the hotel, giggling. Maybe next time, detective.',
    againWinText:'Three more cases closed! The ghosts are starting to think you’re part of the hotel.', againLoseText:'The ghosts shoo you out with a giggle. Come back and replay the night again!',
    reset(){ cases = [makePearls(), makeAlibi(), makeMirror()]; hunches = 3; solved = 0; lit = 0; lastAim = null; cardFlash = [0, 0, 0, 0, 0]; drag = false; startCase(0); },
    seeds:() => solved*5 + (solved === 3 ? hunches*3 : 0), stats:() => `<span>Cases solved ${solved}/3</span><span>Hunches left ${Math.max(0, hunches)}</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt;
      if (banner){ bannerT += dt; if (bannerT > 3.2 || (bannerT > .8 && (input.pressed || input.click))){ input.pressed = false; input.click = null; if (solved >= 3) finish(true); else startCase(ci + 1); } return; }
      for (const k of input.taps){ if (k === 'left') ts = Math.max(0, ts - 1); else if (k === 'right') ts = Math.min(STEPS - 1, ts + 1);
        else if (k === 'up' && lit < 6) lit += 3; else if (k === 'down' && lit > 2) lit -= 3; else if (k === 'action') lit = Math.floor(lit/3)*3 + (lit + 1) % 3; }
      input.taps.length = 0; input.pressed = false;
      for (const k of input.keys) accuse(+k - 1); input.keys.length = 0;
      if (input.aim && input.aim !== lastAim){ lastAim = input.aim; const r = roomAt(input.aim.x, input.aim.y); if (r >= 0) lit = r;
        if (drag && input.action) ts = clamp(Math.round((input.aim.x - TL.x0)/(TL.x1 - TL.x0)*(STEPS - 1)), 0, STEPS - 1); }
      if (!input.action) drag = false;
      if (input.click){ const { x, y } = input.click; input.click = null; const r = roomAt(x, y);
        if (r >= 0) lit = r;
        else if (y > TL.y - 30 && y < TL.y + 34 && x > TL.x0 - 30 && x < TL.x1 + 30){ ts = clamp(Math.round((x - TL.x0)/(TL.x1 - TL.x0)*(STEPS - 1)), 0, STEPS - 1); drag = true; }
        else for (let i = 0; i < 5; i++){ const c = cardRect(i); if (x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h) accuse(i); } }
      tv += (ts - tv)*Math.min(1, dt*7); if (Math.abs(ts - tv) < .002) tv = ts;
      cardFlash = cardFlash.map(f => Math.max(0, f - dt*2));
    },
    draw(){
      // a starry desert night
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120c24'); g.addColorStop(1, '#3a2440'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 50; i++){ ctx.fillStyle = `rgba(255,250,230,${.3 + .3*Math.sin(t*2 + i)})`; ctx.fillRect(hash(i)*W, hash(i + 50)*200, 2, 2); }
      ctx.fillStyle = '#fff3c8'; circle(540, 70, 18); ctx.fillStyle = '#120c24'; circle(548, 64, 16);
      ctx.fillStyle = '#2a1a24'; ctx.fillRect(0, HY + 3*RH, W, H);
      // the hotel: a false front, a porch and the roof sign
      ctx.fillStyle = '#3a2416'; ctx.fillRect(HX - 10, HY - 26, 3*RW + 20, 3*RH + 30);
      ctx.fillStyle = '#5a3a22'; ctx.fillRect(HX + 120, HY - 46, 300, 26); ctx.fillStyle = '#e8d8b0'; ctx.font = '700 15px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GILDED SPUR HOTEL', HX + 270, HY - 32); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      const c = cases[ci], P = paths, round = Math.round(tv);
      for (let r = 0; r < 9; r++){ const { x, y } = roomXY(r); ctx.save(); ctx.beginPath(); ctx.rect(x, y, RW, RH); ctx.clip(); decor(r, x, y);
        if (r === lit){
          // your lantern light, and whoever is here right now
          const lg = ctx.createRadialGradient(x + 22, y + RH - 40, 10, x + 22, y + RH - 40, 200); lg.addColorStop(0, 'rgba(255,220,140,.35)'); lg.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = lg; ctx.fillRect(x, y, RW, RH);
          if (MIRRORS.includes(r)){ const mx = x + RW - 34, my = y + 34; ctx.save(); ctx.beginPath(); ctx.ellipse(mx, my, 11, 17, 0, 0, 7); ctx.clip();
            if (c.kind === 'mirror' && c.paths[c.culprit][round] === r) sheetFig(mx, my + 16); ctx.restore(); }
          for (let gi = 0; gi < 5; gi++){ const p = at(P, gi); ghostFig(p.x, p.y, gi, .95, gi === 4 ? .8 : 1); }
          Chin.draw(ctx, 'me', anim, x + 14, y + RH - 12, { scale:.05, face:1, grounded:true, speed:0 });
          const lx = x + 28, ly = y + RH - 34; ctx.fillStyle = '#c9a13a'; ctx.fillRect(lx - 4, ly - 9, 8, 2); ctx.fillStyle = 'rgba(255,220,130,.95)'; rr(lx - 4, ly - 7, 8, 11, 2); ctx.fill();
        } else { ctx.fillStyle = 'rgba(8,6,20,.84)'; ctx.fillRect(x, y, RW, RH); }
        ctx.restore();
        // every room's candle burns blue when a ghost is close by (you can always see a candle)
        const cold = P.some(p => p[round] === r), cx = x + RW - 12, cy = y + RH - 30;
        ctx.fillStyle = '#e8e0d0'; ctx.fillRect(cx - 3, cy, 6, 14); const fl = 1 + Math.sin(t*12 + r)*.15;
        const cg = ctx.createRadialGradient(cx, cy - 6, 1, cx, cy - 6, 22); cg.addColorStop(0, cold ? 'rgba(120,180,255,.6)' : 'rgba(255,200,100,.5)'); cg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = cg; circle(cx, cy - 6, 22);
        ctx.fillStyle = cold ? '#9ad0ff' : '#ffd070'; ctx.beginPath(); ctx.ellipse(cx, cy - 5, 3*fl, 6*fl, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,220,.7)'; ctx.font = '700 10px "Pixelify Sans", monospace'; ctx.fillText(ROOMS[r], x + 6, y + 14);
      }
      // the floors between rooms, and the outline around the room your lantern is in
      ctx.fillStyle = '#3a2416'; for (let f = 1; f < 3; f++) ctx.fillRect(HX, HY + f*RH - 2, 3*RW, 4); for (let k = 1; k < 3; k++) ctx.fillRect(HX + k*RW - 2, HY, 4, 3*RH);
      { const { x, y } = roomXY(lit); ctx.strokeStyle = '#ffd278'; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, RW - 3, RH - 3); }
      // the pearls are real, so they show up in the dark
      const pp = pearlsPos(); if (pp){ ctx.fillStyle = '#f6f0ff'; for (let k = 0; k < 7; k++){ const a = Math.PI*(.15 + k*.12); circle(pp.x + Math.cos(a)*9, pp.y + Math.sin(a)*7, 2.6); }
        ctx.fillStyle = `rgba(255,255,255,${.5 + .5*Math.sin(t*5)})`; ctx.fillRect(pp.x - 1, pp.y - 6, 2, 8); ctx.fillRect(pp.x - 4, pp.y - 3, 8, 2); }
      // the clock: the night from 9 to midnight
      ctx.fillStyle = 'rgba(20,14,30,.6)'; rr(HX - 10, TL.y - 34, 3*RW + 20, 70, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(246,234,214,.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(TL.x0, TL.y); ctx.lineTo(TL.x1, TL.y); ctx.stroke();
      ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
      for (let s = 0; s < STEPS; s++){ const x = TL.x0 + s/(STEPS - 1)*(TL.x1 - TL.x0); ctx.fillStyle = 'rgba(246,234,214,.7)'; ctx.fillRect(x - 1, TL.y - (s % 4 ? 5 : 9), 2, s % 4 ? 10 : 18); if (s % 4 === 0){ ctx.fillText(s === 12 ? '12 midnight' : `${9 + s/4} pm`, x, TL.y + 24); } }
      { const x = TL.x0 + tv/(STEPS - 1)*(TL.x1 - TL.x0); ctx.fillStyle = '#c9a13a'; circle(x, TL.y, 13); ctx.fillStyle = '#f6ead6'; circle(x, TL.y, 10); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, TL.y); ctx.lineTo(x + Math.cos(tv*1.57 - 1.57)*7, TL.y + Math.sin(tv*1.57 - 1.57)*7); ctx.stroke();
        ctx.fillStyle = '#ffe066'; ctx.fillText(clock(ts), x, TL.y - 18); }
      ctx.textAlign = 'left';
      // the case file and the suspects
      ctx.fillStyle = 'rgba(240,228,200,.95)'; rr(PX, 58, W - PX - 10, 122, 8); ctx.fill();
      ctx.fillStyle = '#7a3a2a'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.fillText(`CASE ${ci + 1} OF 3`, PX + 10, 76);
      ctx.fillStyle = '#2a1a10'; ctx.font = '700 15px "Pixelify Sans", monospace'; ctx.fillText(c.title, PX + 10, 94);
      ctx.font = '600 11px Nunito, sans-serif'; wrapText(c.text, PX + 10, 110, W - PX - 30, 13);
      for (let i = 0; i < 5; i++){ const r = cardRect(i), hov = input.aim && input.aim.x > r.x && input.aim.x < r.x + r.w && input.aim.y > r.y && input.aim.y < r.y + r.h;
        ctx.fillStyle = cardFlash[i] > 0 ? `rgba(220,90,110,${.5 + cardFlash[i]*.4})` : hov ? 'rgba(90,70,120,.95)' : 'rgba(40,30,60,.9)'; rr(r.x, r.y, r.w, r.h, 8); ctx.fill();
        ghostFig(r.x + 22, r.y + r.h - 4, i, 1, .8);
        ctx.fillStyle = '#fff6e4'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.fillText(`${i + 1}. ${GHOSTS[i].name}`, r.x + 44, r.y + 17);
        ctx.font = '600 10.5px Nunito, sans-serif'; ctx.fillStyle = 'rgba(246,234,214,.8)';
        if (c.kind === 'alibi'){ const cl = c.claims[i]; wrapText(`“At ${clock(cl.s)} I was in the ${ROOMS[cl.r]}.”`, r.x + 44, r.y + 31, r.w - 50, 12); }
        else ctx.fillText(GHOSTS[i].who, r.x + 44, r.y + 33); }
      drawPops(0);
      if (banner){ ctx.fillStyle = 'rgba(10,6,20,.78)'; rr(80, 150, 460, 170, 14); ctx.fill(); ctx.strokeStyle = '#ffd278'; ctx.lineWidth = 2; rr(80, 150, 460, 170, 14); ctx.stroke();
        ctx.textAlign = 'center'; ctx.fillStyle = '#ffe066'; ctx.font = '700 26px "Pixelify Sans", monospace'; ctx.fillText(banner.title, 310, 190);
        ctx.fillStyle = '#fff6e4'; ctx.font = '600 15px Nunito, sans-serif'; const words = banner.text.split(' '); let line = '', y = 222; for (const w of words){ const tt = line ? line + ' ' + w : w; if (ctx.measureText(tt).width > 420 && line){ ctx.fillText(line, 310, y); y += 20; line = w; } else line = tt; } ctx.fillText(line, 310, y);
        if (bannerT > .8){ ctx.fillStyle = 'rgba(246,234,214,.6)'; ctx.font = '600 12px Nunito, sans-serif'; ctx.fillText(solved >= 3 ? 'Click to finish' : 'Click for the next case', 310, 306); }
        ctx.textAlign = 'left'; }
    },
    hud(){
      hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Case ${Math.min(3, ci + 1)}/3`, 24, 31);
      ctx.fillText(`🕰 ${clock(ts)} pm`.replace('12:00 pm', '12:00 midnight'), 160, 31);
      ctx.textAlign = 'right'; ctx.fillText('Hunches', W - 110, 31); ctx.textAlign = 'left';
      for (let i = 0; i < 3; i++){ const x = W - 92 + i*26, on = i < hunches; ctx.strokeStyle = on ? '#ffe066' : 'rgba(246,234,214,.25)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, 28, 7, 0, 7); ctx.moveTo(x + 5, 33); ctx.lineTo(x + 11, 39); ctx.stroke(); }
      ctx.textBaseline = 'alphabetic';
    },
    idle(){ tv = (Math.sin(t*.4)*.5 + .5)*(STEPS - 1); ts = Math.round(tv); lit = Math.floor(t/2.5) % 9; },
  };
})();

// ================= Dusty Gulch: The Bijou Picture Show (silent pictures) =================
// Three pictures on the programme: The Perils of Pepper (five reels), A Trip to the Moon and
// The Greatest Show in the West (three reels each). They all share the same title cards.
// The Bijou's old silent western has come alive, and you're in it! There's no sound and nobody can
// talk… but whatever the TITLE CARDS say comes true. Each scene, the dastardly Black Bart (played by
// Big Bramble, the raccoon outlaw, mustache and all) cooks up a new peril, and you hold a hand of title cards to splice in:
//   SUDDENLY… A MIGHTY WIND!   THEN CAME THE RAIN.   AND THEN NIGHT FELL.
//   THE FILM RAN BACKWARDS!    IT WAS LOVE AT FIRST SIGHT.   IN A TERRIBLE HURRY…
// Most perils have more than one way out (the film running backwards un-explodes a bridge!), and a
// wrong card still gets a laugh from the audience. Fail a scene and they throw a tomato at the screen:
// three tomatoes and the projectionist pulls the plug. Night scenes are tinted blue and love scenes
// rose, just like the real old pictures.
const FILM = (() => {
  const SX = 70, SY = 58, SW = 660, SH = 322, GY = 262, FPS = 16;
  const CARDS = { wind:'SUDDENLY… A MIGHTY WIND!', rain:'THEN CAME THE RAIN.', night:'AND THEN NIGHT FELL.', rewind:'THE FILM RAN BACKWARDS!', love:'IT WAS LOVE AT FIRST SIGHT.', fast:'IN A TERRIBLE HURRY…' };
  const ALL = Object.keys(CARDS), DUR = { wind:4, love:5, fast:5, rewind:1.6 };
  let sc, S, ST, kx, kface, kmove, fx, rain, night, hand, tc, phase, phaseT, tomatoes, applause, splats, throws, laughT, cheerT, iris, solvedN, take, bits, said, film = 0, scenes = null, menuCur = 0;
  const rand = n => Math.floor(Math.random()*n);
  const near = (a, b, d) => Math.abs(a - b) < d;
  function say(txt){ said = said.slice(-1); said.push({ txt, life:2.6 }); }
  function laugh(){ applause += 4; laughT = 2.2; }

  // ----- the cast, drawn plainly (the film tints them) -----
  // the villain is played by Big Bramble, the raccoon outlaw (hopping along when he runs, sooty after a blast)
  let sooty = null;
  function bart(x, y, face, o = {}){
    const h = o.h || 100, hop = o.run ? Math.abs(Math.sin(t*14))*7 : 0;
    ctx.save(); ctx.translate(x, y - hop); if (o.run) ctx.rotate(face*.08);
    if (o.soot && BRAMBLE.complete && BRAMBLE.naturalWidth){
      if (!sooty){ sooty = document.createElement('canvas'); sooty.width = BRAMBLE.naturalWidth; sooty.height = BRAMBLE.naturalHeight; const c = sooty.getContext('2d'); c.drawImage(BRAMBLE, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(25,20,18,.72)'; c.fillRect(0, 0, sooty.width, sooty.height); }
      standee(sooty, 0, 0, h, face);
    } else standee(BRAMBLE, 0, 0, h, face);
    if (o.love){ ctx.fillStyle = '#e04060'; heartAt(0, -h - 10, 8); }
    ctx.restore();
  }
  function heartAt(x, y, s){ ctx.beginPath(); ctx.moveTo(x, y + s); ctx.bezierCurveTo(x - s*1.6, y - s*.2, x - s*.6, y - s*1.4, x, y - s*.4); ctx.bezierCurveTo(x + s*.6, y - s*1.4, x + s*1.6, y - s*.2, x, y + s); ctx.fill(); }
  function pepper(x, y, h, face){ if (!PEPPER.complete || !PEPPER.naturalWidth) return; const w = h*PEPPER.naturalWidth/PEPPER.naturalHeight; ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.drawImage(PEPPER, -w/2, -h, w, h); ctx.restore(); }
  function loco(x, y, o = {}){
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 24, y - 34); ctx.lineTo(x + 24, y - 6); ctx.fill();
    ctx.fillStyle = '#2a2a2a'; rr(x + 20, y - 82, 140, 50, 8); ctx.fill(); ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x + 160, y - 110, 70, 80); ctx.fillStyle = '#d8d0b0'; ctx.fillRect(x + 176, y - 100, 36, 26);
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x + 44, y - 118, 20, 38); ctx.fillRect(x + 38, y - 124, 32, 10);
    for (const wx of [60, 112, 190]){ ctx.fillStyle = '#111'; circle(x + wx, y - 18, wx === 190 ? 18 : 15); ctx.fillStyle = '#888'; circle(x + wx, y - 18, 4); }
    ctx.strokeStyle = '#999'; ctx.lineWidth = 4; const ph = o.still ? 0 : t*10; ctx.beginPath(); ctx.moveTo(x + 60 + Math.cos(ph)*8, y - 18 + Math.sin(ph)*8); ctx.lineTo(x + 112 + Math.cos(ph)*8, y - 18 + Math.sin(ph)*8); ctx.stroke();
    // a big round face on the front of the engine
    ctx.fillStyle = '#c8c0a8'; circle(x + 22, y - 57, 22); ctx.fillStyle = '#111'; circle(x + 14, y - 62, 3); circle(x + 28, y - 62, 3);
    if (o.love){ ctx.fillStyle = 'rgba(220,80,110,.7)'; circle(x + 10, y - 52, 5); circle(x + 34, y - 52, 5); ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 22, y - 50, 6, .2, Math.PI - .2); ctx.stroke(); }
    else { ctx.fillStyle = '#111'; ctx.fillRect(x + 12, y - 48, 20, 4); ctx.fillRect(x + 10, y - 70, 8, 2); ctx.fillRect(x + 26, y - 70, 8, 2); }
    if (o.lamp){ ctx.fillStyle = 'rgba(255,250,210,.35)'; ctx.beginPath(); ctx.moveTo(x + 24, y - 84); ctx.lineTo(x - 300, y - 130); ctx.lineTo(x - 300, y - 20); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#e8d8a0'; circle(x + 30, y - 90, 7);
  }
  function smokePuffs(x, y, n, love){ for (let k = 0; k < n; k++){ const a = wrap(t*1.2 + k/n, 1); ctx.fillStyle = `rgba(230,230,230,${.6*(1 - a)})`; if (love){ ctx.fillStyle = `rgba(230,90,120,${.8*(1 - a)})`; heartAt(x + a*30, y - a*80, 6 + a*8); } else circle(x + a*30, y - a*80, 8 + a*18); } }
  function sky(){ const g = ctx.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, '#d8d8d8'); g.addColorStop(1, '#f4f0e8'); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, GY);
    ctx.fillStyle = '#b0a898'; ctx.beginPath(); ctx.moveTo(0, GY - 40); ctx.lineTo(60, GY - 90); ctx.lineTo(180, GY - 90); ctx.lineTo(220, GY - 40); ctx.lineTo(420, GY - 40); ctx.lineTo(470, GY - 120); ctx.lineTo(600, GY - 120); ctx.lineTo(640, GY - 40); ctx.lineTo(SW, GY - 40); ctx.lineTo(SW, GY); ctx.lineTo(0, GY); ctx.fill();
    if (night){ ctx.fillStyle = '#fff'; circle(560, 50, 22); } else { ctx.fillStyle = '#fff'; circle(90, 50, 24); } }
  function ground(x0, x1){ ctx.fillStyle = '#8a7a64'; ctx.fillRect(x0, GY, x1 - x0, SH - GY); ctx.fillStyle = '#6a5a48'; ctx.fillRect(x0, GY, x1 - x0, 4); }
  function cactus(x, h){ ctx.fillStyle = '#4a5a40'; rr(x - 9, GY - h, 18, h, 8); ctx.fill(); rr(x - 26, GY - h*.7, 12, h*.35, 6); ctx.fill(); rr(x + 14, GY - h*.8, 12, h*.3, 6); ctx.fill(); }

  // ----- the five scenes -----
  const SCENES = [
    { // 1. The bridge over Pinecone Gorge
      intro:'CHAPTER ONE. Black Bart has blown up the bridge over Pinecone Gorge!', fixes:['rain', 'wind', 'rewind'], reel:32,
      fail:'The audience grew bored of waiting at the gorge…',
      setup:() => ({ bridge:1, water:0, fall:0, kdy:0, bx:520, gone:false }),
      card(k){ if (k === 'night') say('“Still no bridge,” thought the Kid.', 200, 120); if (k === 'love') say('The Kid fell in love… with the view.', 200, 120); if (k === 'fast') say('Faster is not always better!', 200, 120); },
      update(dt){
        if (ST > 1.2 && S.bridge === 1 && !S.blown){ S.blown = true; S.bridge = 0; S.flash = .5; shake = .5; for (let i = 0; i < 14; i++) bits.push({ x:260 + i*10, y:GY, vx:(Math.random() - .5)*300, vy:-200 - Math.random()*200, r:Math.random()*6 }); }
        if (S.blown && ST > 2 && !S.gone) S.bx += 140*dt; if (S.bx > SW + 60) S.gone = true;
        if (fx.rewind > 0 && S.bridge < 1){ S.bridge = Math.min(1, S.bridge + dt/1.4); bits.length = 0; if (S.gone){ S.gone = false; S.bx = SW + 40; } S.back = true; }
        if (S.back && S.bx > 520) S.bx -= 160*dt;
        if (rain) S.water = Math.min(1, S.water + dt/2.5);
        const over = kx > 262 && kx < 398, held = S.bridge >= 1 || S.water >= 1;
        S.float = over && fx.wind > 0 && !held;
        if (S.float) kx += 150*dt;
        if (S.fall > 0){ S.fall += dt; kx = S.fallX; S.kdy = S.fall < .7 ? 0 : (S.fall - .7)**2*900; if (S.fall > 1.5){ S.fall = 0; S.kdy = 0; kx = 40; laugh(); say('The audience howled!', 330, 60); } }
        else if (over && !held && !S.float){ S.fall = .01; S.fallX = kx; }
        if (kx > SW - 30) return 'win';
      },
      draw(){ sky(); ground(0, 260); ground(400, SW);
        ctx.fillStyle = '#4a4034'; ctx.fillRect(260, GY, 140, SH - GY); ctx.fillStyle = '#2a241c'; ctx.fillRect(272, GY + 10, 116, SH - GY);
        if (S.water > 0){ ctx.fillStyle = '#9aa4b0'; const wy = SH - (SH - GY + 4)*S.water; ctx.fillRect(262, wy, 136, SH - wy); ctx.fillStyle = '#6a5040'; rr(266, wy - 8, 128, 12, 6); ctx.fill(); }
        if (S.bridge > 0){ ctx.fillStyle = '#7a5a3a'; const n = Math.floor(S.bridge*12); for (let i = 0; i < n; i++) ctx.fillRect(262 + i*11.5, GY - 4, 9, 8); ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(260, GY - 24); ctx.lineTo(260 + 140*S.bridge, GY - 24); ctx.stroke(); }
        else { ctx.fillStyle = '#7a5a3a'; ctx.save(); ctx.translate(262, GY); ctx.rotate(1.2); ctx.fillRect(0, -4, 40, 8); ctx.restore(); ctx.save(); ctx.translate(398, GY); ctx.rotate(-1.9); ctx.fillRect(0, -4, 40, 8); ctx.restore(); }
        for (const p of [255, 405]){ ctx.fillStyle = '#5a4030'; ctx.fillRect(p - 4, GY - 30, 8, 30); }
        cactus(120, 70); cactus(560, 90);
        if (!S.gone) bart(S.bx, GY, S.blown && !S.back ? 1 : -1, { run:S.blown && ST > 2 && !S.back });
        if (!S.blown){ ctx.fillStyle = '#6a3a2a'; ctx.fillRect(480, GY - 22, 18, 22); ctx.fillStyle = '#333'; ctx.fillRect(487, GY - 34, 4, 14); ctx.fillRect(478, GY - 36, 22, 4); }
      } },
    { // 2. Brutus the bulldog guards Bart's hideout
      intro:'CHAPTER TWO. Brutus, the meanest bulldog in the West, guards Black Bart’s hideout.', fixes:['love', 'night', 'fast'], reel:32,
      fail:'Brutus guarded that gate all day long…',
      setup:() => ({ mood:'guard', chase:0 }),
      card(k){ if (k === 'love'){ S.mood = 'love'; say('Brutus had never seen a chinchilla so fluffy.', 160, 110); } if (k === 'night' && S.mood === 'guard') S.mood = 'sleep';
        if (k === 'rain') say('Brutus LOVES puddles. Still guarding, though.', 150, 110); if (k === 'wind') say('Brutus tried his best to fly.', 200, 110); },
      update(dt){
        if (S.chase > 0){ S.chase -= dt; kx = Math.max(40, kx - 380*dt); return; }
        if (S.mood === 'guard' && kx > 270){ if (fx.fast > 0){ S.mood = 'dizzy'; say('Brutus spun round and round!', 260, 110); } else { S.chase = 1.1; laugh(); say('WOOF!', 360, 120); shake = .3; } }
        if (kx > SW - 30) return 'win';
      },
      draw(){ sky(); ground(0, SW);
        ctx.fillStyle = '#6a5040'; for (let x = 300; x < SW; x += 18) if (x < 380 || x > 440) ctx.fillRect(x, GY - 70, 12, 70); ctx.fillRect(300, GY - 56, SW - 300, 6); ctx.fillRect(300, GY - 26, SW - 300, 6);
        ctx.fillStyle = '#e8e0d0'; ctx.fillRect(470, GY - 120, 96, 40); ctx.fillStyle = '#111'; ctx.font = '700 13px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('KEEP OUT', 518, GY - 102); ctx.fillText('— B. B.', 518, GY - 86); ctx.textAlign = 'left'; ctx.fillStyle = '#5a4030'; ctx.fillRect(514, GY - 80, 6, 80);
        cactus(90, 80);
        const dx = S.chase > 0 ? 360 - (1.1 - S.chase)*150 : 360, mood = S.mood, wob = mood === 'dizzy' ? t*12 : 0;
        ctx.save(); ctx.translate(dx, GY); if (mood === 'love'){ ctx.translate(0, -44); ctx.rotate(Math.PI); }
        if (mood === 'dizzy') ctx.scale(Math.cos(wob), 1);
        ctx.fillStyle = '#9a8a7a'; ctx.beginPath(); ctx.ellipse(0, -24, 30, 20, 0, 0, 7); ctx.fill(); ctx.fillRect(-24, -12, 10, 12); ctx.fillRect(14, -12, 10, 12);
        ctx.beginPath(); ctx.ellipse(-26, -40, 18, 16, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#7a6a5a'; ctx.beginPath(); ctx.ellipse(-30, -32, 14, 9, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(-40, -36, 3, 5); ctx.fillRect(-26, -36, 3, 5); ctx.fillStyle = '#111';
        if (mood === 'sleep'){ ctx.fillRect(-36, -46, 7, 2); ctx.fillRect(-24, -46, 7, 2); } else { circle(-32, -45, 2.5); circle(-20, -45, 2.5); ctx.fillRect(-38, -51, 9, 2); ctx.fillRect(-22, -51, 9, 2); }
        ctx.fillStyle = '#333'; ctx.fillRect(-14, -34, 6, 18); for (let k = 0; k < 3; k++){ ctx.fillStyle = '#ccc'; ctx.beginPath(); ctx.moveTo(-14, -30 + k*6); ctx.lineTo(-20, -28 + k*6); ctx.lineTo(-14, -26 + k*6); ctx.fill(); }
        ctx.restore();
        if (mood === 'sleep'){ ctx.fillStyle = '#fff'; ctx.font = '700 18px Georgia, serif'; for (let k = 0; k < 3; k++){ const a = wrap(t*.6 + k/3, 1); ctx.globalAlpha = 1 - a; ctx.fillText('z', dx - 20 + a*30, GY - 60 - a*50); } ctx.globalAlpha = 1; }
        if (mood === 'love'){ ctx.fillStyle = '#e04060'; for (let k = 0; k < 3; k++){ const a = wrap(t*.5 + k/3, 1); heartAt(dx - 10 + Math.sin(a*8)*10, GY - 50 - a*60, 6); } }
      } },
    { // 3. The dynamite at the pass
      intro:'CHAPTER THREE. The villain lights a fuse to close the mountain pass forever!', fixes:['rain', 'rewind'], reel:60,
      fail:'KA-BOOM! The pass was buried under a mountain of rocks.',
      setup:() => ({ sp:580, lit:false, out:0, sootBart:false, bx:600 }),
      card(k){ if (k === 'wind' && S.lit) say('The wind fanned the spark! Hurry!', 200, 110);
        if (k === 'night') say('The spark glowed brighter in the dark.', 200, 110); if (k === 'love') say('Black Bart fell in love… with his own reflection.', 140, 110); if (k === 'rain' && S.lit && !S.out) { S.out = .01; say('Fsssst! The fuse fizzled out.', 230, 110); } },
      update(dt){
        if (ST > 1 && !S.lit){ S.lit = true; }
        if (S.lit && !S.out){
          if (fx.rewind > 0){ S.sp += 320*dt; if (S.sp >= 590){ S.out = .01; S.sootBart = true; S.bx = 610; S.flash = .5; shake = .4; say('BOOM! Right in the villain’s paws!', 260, 110); applause += 6; } }
          else S.sp -= (fx.wind > 0 ? 130 : 52)*dt;
          if (input.pressed && near(kx, S.sp, 34)){ S.out = .01; anim.happy = 1; say('STOMP!', S.sp, 150); }
          if (S.sp <= 160){ S.flash = .7; shake = .6; return 'fail'; }
        }
        input.pressed = false;
        if (S.lit && !S.sootBart) S.bx = Math.min(SW + 80, S.bx + 150*dt);
        if (S.out){ S.out += dt; if (S.out > 1.6) return 'win'; }
      },
      draw(){ sky(); ground(0, SW);
        ctx.fillStyle = '#7a6a58'; ctx.beginPath(); ctx.moveTo(60, GY); ctx.lineTo(80, 30); ctx.lineTo(220, 20); ctx.lineTo(250, GY); ctx.fill(); ctx.fillStyle = '#2a241c'; ctx.beginPath(); ctx.moveTo(110, GY); ctx.lineTo(110, GY - 90); ctx.quadraticCurveTo(155, GY - 140, 200, GY - 90); ctx.lineTo(200, GY); ctx.fill();
        ctx.fillStyle = '#7a3a2a'; rr(140, GY - 34, 32, 34, 4); ctx.fill(); ctx.fillStyle = '#e8e0d0'; ctx.font = '700 10px Georgia, serif'; ctx.fillText('TNT', 145, GY - 14);
        ctx.strokeStyle = '#3a3028'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(170, GY - 4); ctx.lineTo(S.lit ? S.sp : 580, GY - 4); ctx.stroke();
        if (S.lit && !S.out){ ctx.fillStyle = '#fff'; for (let k = 0; k < 6; k++){ const a = k + t*20; ctx.fillRect(S.sp + Math.cos(a)*(4 + k*1.5), GY - 6 + Math.sin(a)*(4 + k*1.5), 2, 2); } circle(S.sp, GY - 5, night ? 6 : 4); }
        cactus(480, 70);
        if (S.bx < SW + 60) bart(S.bx, GY, S.sootBart ? -1 : S.lit ? 1 : -1, { run:S.lit && !S.sootBart, soot:S.sootBart, noHat:S.sootBart });
        if (S.sootBart){ ctx.fillStyle = 'rgba(200,200,200,.5)'; circle(S.bx, GY - 110 - (ST % 2)*10, 14); }
      } },
    { // 4. Pepper is tied to the railroad tracks!
      intro:'CHAPTER FOUR. Sweet Pepper is tied to the tracks… and the 3:10 Express is coming!', fixes:['fast', 'rewind', 'love', 'rain'], reel:60,
      fail:'THE FILM SNAPPED!  (Nobody saw what happened next.)',
      setup:() => ({ tx:1100, v:92, untie:0, free:0, love:false }),
      card(k){ if (k === 'love'){ S.love = true; S.v = 0; say('The engine had never seen such a lovely pony.', 140, 100); } if (k === 'rain'){ S.v = 40; say('The wheels slipped on the wet rails!', 200, 100); }
        if (k === 'night') say('The 3:10 has a very bright lamp.', 220, 100); if (k === 'wind') say('Pepper’s mane blew dramatically.', 220, 100); },
      update(dt){
        if (S.free){ S.free += dt; if (S.free > 1.6) return 'win'; return; }
        if (fx.rewind > 0) S.tx += 380*dt; else S.tx -= S.v*dt;
        if (input.action && near(kx, 450, 46)){ S.untie += dt*(fx.fast > 0 ? 3 : 1)/3.2; if (S.untie >= 1){ S.free = .01; anim.happy = 2; say('Pepper is FREE!', 430, 120); } }
        if (S.tx < 500){ S.tx = 500; return 'fail'; }
      },
      draw(){ sky(); ground(0, SW);
        ctx.fillStyle = '#5a4838'; for (let x = -10; x < SW + 10; x += 22) ctx.fillRect(x, GY + 6, 14, 6); ctx.fillStyle = '#aaa'; ctx.fillRect(0, GY + 3, SW, 3); ctx.fillRect(0, GY + 12, SW, 3);
        if (S.tx > SW + 30) smokePuffs(SW - 40, GY - 140, 5, false);
        ctx.fillStyle = '#5a4030'; if (!S.free){ ctx.fillRect(500, GY - 50, 8, 56); }
        const px = S.free ? 450 - S.free*240 : 470;
        pepper(px, GY + 4, 92, S.free ? -1 : -1);
        if (!S.free){ ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++){ ctx.beginPath(); ctx.ellipse(470, GY - 26 - k*12, 34, 6, 0, 0, 7); ctx.stroke(); }
          if (S.untie > 0){ ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(420, GY - 110, 100, 10); ctx.fillStyle = '#fff'; ctx.fillRect(420, GY - 110, 100*S.untie, 10); } }
        if (S.tx < SW + 240){ loco(S.tx, GY + 6, { love:S.love, lamp:night, still:S.v === 0 }); smokePuffs(S.tx + 54, GY - 118, 5, S.love); }
      } },
    { // 5. The getaway balloon
      intro:'FINALE. Black Bart escapes in a balloon with the whole town’s pie money!', fixes:['wind', 'rain', 'rewind', 'love'], reel:60,
      fail:'Black Bart floated away into the sunset, laughing.',
      setup:() => ({ bx:430, by:GY, v:24, drop:false, pop:false, sit:0 }),
      card(k){ if (k === 'wind'){ S.blow = true; } if (k === 'rain' || k === 'love'){ S.drop = true; if (k === 'love') { S.smit = true; say('Bart fell head over heels for the Sheriff!', 140, 100); } else say('A soggy balloon can’t fly!', 220, 100); }
        if (k === 'night'){ S.v = 48; say('He slipped away into the night!', 220, 100); } if (k === 'fast'){ S.v = 70; say('He floated off in a terrible hurry!', 220, 100); } },
      update(dt){
        if (S.sit){ S.sit += dt; if (S.sit > 1.8) return 'win'; return; }
        if (S.pop){ S.by = Math.min(GY, S.by + 260*dt); S.bx += 40*dt; if (S.by >= GY) S.sit = .01; return; }
        const up = ST > 1.5 && !S.drop && fx.rewind <= 0;
        if (up){ S.by -= S.v*dt; S.bx -= 8*dt; }
        if (fx.rewind > 0 || S.drop){ S.by = Math.min(GY, S.by + 90*dt); if (S.by >= GY){ S.sit = .01; say('The Sheriff nabbed him!', 160, 100); } }
        if (S.blow){ S.bx += 170*dt; if (S.bx > 560){ S.pop = true; S.blow = false; say('POP!', 590, 120); shake = .4; } }
        if (S.by < -10) return 'fail';
      },
      draw(){ sky(); ground(0, SW);
        ctx.fillStyle = '#6a5040'; ctx.fillRect(570, GY - 150, 70, 60); ctx.fillStyle = '#5a4030'; ctx.fillRect(576, GY - 90, 6, 90); ctx.fillRect(628, GY - 90, 6, 90); ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.moveTo(565, GY - 150); ctx.lineTo(605, GY - 172); ctx.lineTo(645, GY - 150); ctx.fill();
        // the Sheriff: Dusty Gulch's own weasel sheriff
        standee(SHERIFF, 110, GY + 2, 104, 1);
        if (S.smit){ ctx.fillStyle = '#e04060'; for (let k = 0; k < 3; k++){ const a = wrap(t*.5 + k/3, 1); heartAt(110 + Math.sin(a*7)*12, GY - 80 - a*60, 6); } }
        const bx = S.bx, by = S.by;
        if (!S.pop){ ctx.fillStyle = '#d8d0c0'; ctx.beginPath(); ctx.ellipse(bx, by - 120, 44, 54, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8a7a6a'; for (const k of [-1, 1]){ ctx.beginPath(); ctx.ellipse(bx + k*22, by - 120, 9, 52, 0, 0, 7); ctx.fill(); } }
        else { ctx.fillStyle = '#d8d0c0'; ctx.beginPath(); ctx.ellipse(bx, by - 76, 24, 12, Math.sin(t*20)*.3, 0, 7); ctx.fill(); }
        ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(bx - 30, by - 84); ctx.lineTo(bx - 16, by - 34); ctx.moveTo(bx + 30, by - 84); ctx.lineTo(bx + 16, by - 34); ctx.stroke();
        bart(bx - 2, by + 2, S.smit ? -1 : 1, { love:S.smit, h:76 });
        ctx.fillStyle = '#7a5a3a'; ctx.fillRect(bx - 20, by - 36, 40, 34); ctx.fillStyle = '#c8b898'; circle(bx + 26, by - 26, 10); ctx.fillStyle = '#333'; ctx.font = '700 11px Georgia, serif'; ctx.fillText('$', bx + 23, by - 22);
      } },
  ];

  // ----- the cast and sets of A TRIP TO THE MOON -----
  function starsBg(){ ctx.fillStyle = '#16141c'; ctx.fillRect(0, 0, SW, SH); for (let i = 0; i < 60; i++){ ctx.fillStyle = `rgba(255,255,255,${.4 + .5*Math.max(0, Math.sin(t*2 + i))})`; circle(hash(i)*SW, hash(i + 3)*SH*.8, hash(i + 5)*1.5 + .5); } }
  function moonFace(x, y, r, o = {}){
    ctx.fillStyle = '#f0ead8'; circle(x, y, r); ctx.fillStyle = 'rgba(160,150,130,.5)'; circle(x - r*.4, y - r*.45, r*.14); circle(x + r*.45, y + r*.4, r*.11); circle(x - r*.15, y + r*.55, r*.09);
    ctx.fillStyle = '#3a3428'; ctx.strokeStyle = '#3a3428'; ctx.lineWidth = 2;
    if (o.ouch){ ctx.beginPath(); ctx.moveTo(x - r*.42, y - r*.22); ctx.lineTo(x - r*.18, y + r*.02); ctx.moveTo(x - r*.18, y - r*.22); ctx.lineTo(x - r*.42, y + r*.02); ctx.stroke(); } else circle(x - r*.3, y - r*.1, r*.07);
    circle(x + r*.3, y - r*.1, r*.07); ctx.beginPath(); if (o.ouch) ctx.ellipse(x + r*.05, y + r*.42, r*.14, r*.17, 0, 0, 7); else ctx.arc(x, y + r*.2, r*.32, .35, Math.PI - .35); ctx.stroke();
    if (o.blush){ ctx.fillStyle = 'rgba(230,120,140,.6)'; circle(x - r*.48, y + r*.18, r*.12); circle(x + r*.48, y + r*.18, r*.12); }
  }
  function shell(x, y, rot, s){ ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s || 1, s || 1);
    ctx.fillStyle = '#c8c0b0'; ctx.beginPath(); ctx.moveTo(-30, -14); ctx.lineTo(10, -14); ctx.quadraticCurveTo(40, -14, 46, 0); ctx.quadraticCurveTo(40, 14, 10, 14); ctx.lineTo(-30, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a8070'; ctx.fillRect(-32, -14, 6, 28); ctx.fillStyle = '#3a3428'; circle(4, 0, 6); ctx.fillStyle = '#e8e0c8'; circle(4, 0, 4); ctx.restore(); }
  function professor(x, y, h){ if (LUNA.complete && LUNA.naturalWidth){ const w = h*LUNA.naturalWidth/LUNA.naturalHeight; ctx.drawImage(LUNA, x - w/2, y - h, w, h); }
    ctx.fillStyle = '#111'; ctx.fillRect(x - 14, y - h - 4, 28, 6); ctx.fillRect(x - 9, y - h - 26, 18, 22); }
  function moonMouse(x, y, face, o = {}){ ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.translate(0, o.still ? 0 : -Math.abs(Math.sin(t*10 + x*.1))*4);
    ctx.fillStyle = '#d8d4cc'; ctx.beginPath(); ctx.ellipse(0, -14, 18, 13, 0, 0, 7); ctx.fill(); circle(16, -22, 10); ctx.fillStyle = '#c8b8b0'; circle(10, -32, 7); circle(22, -32, 6);
    ctx.fillStyle = '#111'; circle(20, -24, 2); ctx.fillStyle = '#e8a0a8'; circle(26, -20, 2.4);
    ctx.strokeStyle = '#d8d4cc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(13, -31); ctx.lineTo(8, -48); ctx.moveTo(19, -31); ctx.lineTo(24, -48); ctx.stroke(); ctx.fillStyle = '#fff'; circle(8, -49, 2.5); circle(24, -49, 2.5);
    ctx.strokeStyle = '#d8d4cc'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -12); ctx.quadraticCurveTo(-34, -20, -30, -32); ctx.stroke();
    if (o.love){ ctx.fillStyle = '#e04060'; heartAt(10, -60, 5); } ctx.restore(); }
  function moonGround(edge){ ctx.fillStyle = '#b8b4a8'; ctx.beginPath(); ctx.moveTo(0, GY);
    if (edge){ ctx.lineTo(edge - 30, GY); ctx.quadraticCurveTo(edge, GY, edge + 10, GY + 40); ctx.lineTo(edge + 10, SH); } else { ctx.lineTo(SW, GY); ctx.lineTo(SW, SH); }
    ctx.lineTo(0, SH); ctx.fill(); ctx.fillStyle = '#8a867a'; ctx.fillRect(0, GY, edge ? edge - 30 : SW, 3);
    for (let i = 0; i < 7; i++){ const cx = 40 + i*90 + hash(i)*30; if (edge && cx > edge - 50) continue; ctx.fillStyle = '#9a968a'; ctx.beginPath(); ctx.ellipse(cx, GY + 20 + hash(i + 2)*30, 16 + hash(i)*12, 5, 0, 0, 7); ctx.fill(); } }
  function earthBall(x, y, r){ ctx.fillStyle = '#7a90a8'; circle(x, y, r); ctx.fillStyle = '#9aa888'; ctx.beginPath(); ctx.ellipse(x - r*.3, y - r*.2, r*.35, r*.25, .5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + r*.35, y + r*.3, r*.25, r*.3, -.3, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - r*.1, y - r*.6, r*.4, r*.1, 0, 0, 7); ctx.fill(); }

  const MOON_SCENES = [
    { // 1. The great moon cannon
      intro:'A TRIP TO THE MOON. Professor Luna will fire the Kid to the Moon in her great cannon… but a cloud is in the way!', fixes:['wind', 'rain', 'rewind'], reel:40,
      fail:'The Moon set before the cannon could fire.',
      setup:() => ({ cx:470, cs:1, fired:0, ouch:0 }),
      card(k){ if (k === 'night') say('It was already night. VERY night.'); if (k === 'love'){ S.blush = true; say('The Moon blushed behind the cloud.'); } if (k === 'fast'){ S.cx = 520; say('The cloud hurried… right back in front of the Moon.'); } },
      update(dt){
        if (S.fired){ S.fired += dt; const k = Math.min(1, S.fired/1.4); S.sx = 260 + (500 - 260)*k; S.sy = GY - 120 - (GY - 120 - 80)*k - Math.sin(k*Math.PI)*70;
          if (k >= 1 && !S.ouch){ S.ouch = .01; shake = .5; S.flash = .4; laugh(); say('Right in the eye!'); } if (S.ouch){ S.ouch += dt; if (S.ouch > 1.8) return 'win'; } return; }
        // the cloud drifts back over the Moon on its own
        if (fx.wind > 0) S.cx += 260*dt; else if (fx.rewind > 0) S.cx -= 300*dt; else if (S.cx > 520 && S.cx < 640) S.cx -= 8*dt;
        if (rain) S.cs = Math.max(0, S.cs - dt/2.4);
        S.clear = S.cs <= .05 || S.cx > 640 || S.cx < 400;
        if (input.pressed){ input.pressed = false; if (near(kx, 190, 50)){ if (S.clear){ S.fired = .01; S.lock = true; S.hideKid = true; shake = .6; S.flash = .5; anim.happy = 2; say('BOOM!'); } else say('“Wait for the Moon!” hooted the Professor.'); } }
      },
      draw(){ starsBg(); moonFace(520, 80, 44, { ouch:S.ouch > 0, blush:S.blush });
        if (S.ouch) shell(492, 74, -2.6, .7);
        if (S.cs > .05 && S.cx < SW + 90 && S.cx > -130){ for (let k = 0; k < 6; k++){ ctx.fillStyle = '#d0ccc4'; circle(S.cx - 60 + k*24, 84 + Math.sin(k*1.7)*10, (24 + (k % 3)*8)*S.cs); }
          if (rain){ ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 10; i++){ const x = S.cx - 60 + i*14, y = 110 + wrap(time*300 + i*30, 140); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 10); } ctx.stroke(); } }
        ctx.fillStyle = '#5a5448'; ctx.fillRect(0, GY, SW, SH - GY); ctx.fillStyle = '#3a3428'; ctx.fillRect(0, GY, SW, 4);
        ctx.save(); ctx.translate(250, GY - 44); ctx.rotate(-.55); ctx.fillStyle = '#3a3a3a'; rr(-40, -26, 220, 52, 22); ctx.fill(); ctx.fillStyle = '#5a5a5a'; for (let k = 0; k < 4; k++) ctx.fillRect(-10 + k*48, -28, 8, 56); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(180, 0, 8, 22, 0, 0, 7); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.moveTo(170, GY); ctx.lineTo(220, GY - 50); ctx.lineTo(300, GY - 50); ctx.lineTo(320, GY); ctx.fill(); ctx.fillStyle = '#2a2a2a'; circle(200, GY - 6, 18); circle(298, GY - 6, 18);
        ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(172, GY); ctx.lineTo(192, GY - 62); ctx.moveTo(192, GY); ctx.lineTo(212, GY - 62); for (let k = 1; k < 4; k++){ ctx.moveTo(172 + k*5, GY - k*15); ctx.lineTo(192 + k*5, GY - k*15); } ctx.stroke();
        professor(80, GY, 100);
        if (S.fired && !S.ouch) shell(S.sx, S.sy, -.7, .8);
        if (!S.fired && S.clear){ ctx.fillStyle = '#fff'; ctx.font = 'italic 700 16px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('The Moon is clear! (Space at the cannon)', SW/2, GY + 34); ctx.textAlign = 'left'; }
      } },
    { // 2. The Moon Mice
      intro:'CHAPTER TWO. The shell lands among the Moon Mice, who guard the cheese caves very fiercely.', fixes:['rain', 'love', 'fast'], reel:40,
      fail:'The Moon Mice squeaked at the Kid until the reel ran out.',
      setup:() => ({ mice:[{ x:290, d:1, lo:250, hi:350 }, { x:420, d:-1, lo:370, hi:470 }, { x:530, d:1, lo:490, hi:570 }], chase:0, cheese:[], love:false, eat:false }),
      card(k){ if (k === 'rain'){ S.eat = true; say('IT RAINED… CHEESE?!'); for (let i = 0; i < 14; i++) S.cheese.push({ x:40 + Math.random()*560, y:-Math.random()*220, vy:0, land:false }); }
        if (k === 'love'){ S.love = true; say('The Moon Mice had never seen anyone so fluffy.'); }
        if (k === 'night') say('Moon Mice can see perfectly well in the dark.'); if (k === 'wind') say('There is no wind on the Moon. It got lost.'); if (k === 'rewind') say('The mice moonwalked backwards… still in the way!'); },
      update(dt){
        for (const c of S.cheese) if (!c.land){ c.vy += 400*dt; c.y += c.vy*dt; if (c.y >= GY - 6){ c.y = GY - 6; c.land = true; } }
        for (const m of S.mice){
          if (S.eat){ const tg = S.cheese.filter(c => c.land && !c.eaten && c.x < 200).sort((a, b) => Math.abs(a.x - m.x) - Math.abs(b.x - m.x))[0] || S.cheese.find(c => c.land && !c.eaten); if (tg){ m.d = Math.sign(tg.x - m.x) || 1; m.x += m.d*150*dt; if (Math.abs(tg.x - m.x) < 8) tg.eaten = true; } continue; }
          if (S.love) continue;
          m.x += m.d*(fx.rewind > 0 ? -60 : 60)*dt; if (m.x > m.hi) m.d = -1; if (m.x < m.lo) m.d = 1;
        }
        if (S.chase > 0){ S.chase -= dt; kx = Math.max(40, kx - 360*dt); return; }
        if (!S.love && !S.eat && fx.fast <= 0) for (const m of S.mice) if (near(kx, m.x, 30)){ S.chase = 1; laugh(); say('SQUEAK!'); shake = .3; break; }
        if (kx > SW - 46) return 'win';
      },
      draw(){ starsBg(); earthBall(560, 70, 40); moonGround(0);
        ctx.fillStyle = '#e8d070'; ctx.beginPath(); ctx.moveTo(SW - 90, GY); ctx.lineTo(SW - 90, GY - 70); ctx.quadraticCurveTo(SW - 45, GY - 110, SW, GY - 80); ctx.lineTo(SW, GY); ctx.fill();
        ctx.fillStyle = '#1a1814'; ctx.beginPath(); ctx.ellipse(SW - 46, GY - 24, 18, 26, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(SW - 64, GY - 24, 36, 24); ctx.fillStyle = '#c8b050'; circle(SW - 76, GY - 58, 6); circle(SW - 30, GY - 70, 5);
        shell(70, GY - 18, 2.2, .8);
        for (const c of S.cheese){ if (c.eaten) continue; ctx.fillStyle = '#e8d070'; ctx.beginPath(); ctx.moveTo(c.x - 8, c.y + 4); ctx.lineTo(c.x + 8, c.y + 4); ctx.lineTo(c.x + 8, c.y - 6); ctx.closePath(); ctx.fill(); }
        for (const m of S.mice) moonMouse(m.x, GY, m.d, { love:S.love, still:S.love });
      } },
    { // 3. Falling home
      intro:'FINALE. Time to go home! But the shell is stuck in a crater, a long way from the edge of the Moon.', fixes:['wind', 'fast', 'rewind'], reel:26,
      fail:'The Kid had to stay on the Moon. (The cheese was very nice.)',
      setup:() => ({ sx:250, fall:0, home:0 }),
      card(k){ if (k === 'rewind'){ S.home = .01; S.hideKid = true; S.lock = true; say('The shell flew back the way it came: straight home!'); } if (k === 'love') say('The Moon didn’t want the Kid to leave.'); if (k === 'night') say('The Earth glowed in the dark.'); if (k === 'rain') say('It rained cheese again. Delicious, not helpful.'); },
      update(dt){
        if (S.home){ S.home += dt; if (S.home > 2.2) return 'win'; return; }
        if (S.fall){ S.fall += dt; if (S.fall > 2.4) return 'win'; return; }
        const behind = kx < S.sx - 10 && kx > S.sx - 80;
        let v = 0; if (fx.wind > 0) v = 120; else if (behind && input.action) v = fx.fast > 0 ? 70 : 9;
        S.sx += v*dt; if (v > 0 && kx > S.sx - 34) kx = S.sx - 34;
        S.push = behind && input.action;
        if (S.sx >= 540){ S.fall = .01; S.hideKid = true; S.lock = true; anim.happy = 2; say('Over the edge… and home to Earth!'); }
      },
      draw(){ starsBg(); earthBall(590, 170, 58); moonGround(560);
        if (S.home){ const k = Math.min(1, S.home/1.8); shell(S.sx - k*300, GY - 20 - k*220, Math.PI + .4, .8 - k*.5); }
        else if (S.fall){ const k = Math.min(1, S.fall/2); shell(S.sx + 30 + k*70, GY - 18 + k*220, .8 + k*2, .8 - k*.45); }
        else shell(S.sx, GY - 18, 0, .8);
        if (!S.fall && !S.home){ ctx.fillStyle = '#fff'; ctx.font = 'italic 700 14px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(S.push ? 'Heave… ho…' : 'Hold Space behind the shell to push', S.sx, GY - 70); ctx.textAlign = 'left'; }
      } },
  ];

  // ----- the cast and sets of THE GREATEST SHOW IN THE WEST -----
  const WIRE = 120;
  function bigTop(){ for (let i = 0; i < 12; i++){ ctx.fillStyle = i % 2 ? '#e8e0d0' : '#8a3a2a'; ctx.beginPath(); ctx.moveTo(SW/2, -40); ctx.lineTo(i*SW/12 - 30, GY); ctx.lineTo((i + 1)*SW/12 - 30, GY); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, 0, SW, GY);
    ctx.fillStyle = '#c8a878'; ctx.fillRect(0, GY, SW, SH - GY); ctx.fillStyle = '#8a3a2a'; ctx.fillRect(0, GY, SW, 6);
    for (const sx of [160, 500]){ const sw = Math.sin(t*.8 + sx)*40; ctx.fillStyle = 'rgba(255,250,220,.12)'; ctx.beginPath(); ctx.moveTo(sx - 10, 0); ctx.lineTo(sx + 10, 0); ctx.lineTo(sx + 70 + sw, GY); ctx.lineTo(sx - 70 + sw, GY); ctx.fill(); } }
  function elephant(x, y, face, o = {}){ ctx.save(); ctx.translate(x, y); ctx.scale(face*(o.s || 1), o.s || 1); const run = o.run ? Math.sin(t*12)*8 : 0;
    ctx.fillStyle = '#9a9590'; [-40, -18, 14, 36].forEach((lx, i) => ctx.fillRect(lx + (i % 2 ? run : -run)*.4, -40, 16, 40));
    ctx.beginPath(); ctx.ellipse(0, -62, 58, 40, 0, 0, 7); ctx.fill(); circle(52, -80, 30);
    ctx.fillStyle = '#8a8580'; ctx.beginPath(); ctx.ellipse(36, -78, 20, 28, -.2, 0, 7); ctx.fill();
    ctx.strokeStyle = '#9a9590'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(76, -70);
    if (o.up) ctx.quadraticCurveTo(112, -110, 98, -150); else ctx.quadraticCurveTo(98, -40, 100, -14); ctx.stroke(); ctx.lineCap = 'butt';
    if (o.sleep){ ctx.fillStyle = '#111'; ctx.fillRect(56, -90, 12, 2.5); } else if (o.scared){ ctx.fillStyle = '#fff'; circle(62, -90, 7); ctx.fillStyle = '#111'; circle(64, -90, 3); } else { ctx.fillStyle = '#111'; circle(62, -90, 3.5); }
    ctx.fillStyle = '#8a3a2a'; ctx.beginPath(); ctx.moveTo(40, -106); ctx.lineTo(56, -134); ctx.lineTo(70, -106); ctx.fill(); ctx.fillStyle = '#e8d070'; circle(56, -136, 4);
    ctx.strokeStyle = '#9a9590'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-56, -64); ctx.quadraticCurveTo(-70, -50, -66, -36); ctx.stroke();
    if (o.love){ ctx.fillStyle = '#e04060'; heartAt(60, -152, 8); } ctx.restore(); }
  function scissors(x, y, open){ ctx.strokeStyle = '#ddd'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 26, y - 6 - open*8); ctx.moveTo(x, y); ctx.lineTo(x - 26, y + 6 + open*8); ctx.stroke(); ctx.strokeStyle = '#aaa'; ctx.beginPath(); ctx.arc(x + 6, y - 5, 5, 0, 7); ctx.moveTo(x + 11, y + 5); ctx.arc(x + 6, y + 5, 5, 0, 7); ctx.stroke(); }

  const CIRCUS_SCENES = [
    { // 1. The high wire
      intro:'THE GREATEST SHOW IN THE WEST! Tonight the Kid walks the high wire… but jealous Black Bart has a pair of scissors.', fixes:['rewind', 'love', 'wind'], reel:40,
      fail:'The ringmaster sent in the clowns instead.',
      setup:() => ({ wire:1, snip:false, held:false, fall:0 }),
      card(k){ if (k === 'rewind' && !S.snip){ S.snip = true; S.saved = true; say('Black Bart walked backwards… and his scissors never reached the wire!'); }
        if (k === 'love'){ S.held = true; say('Dumpling the elephant fell in love… and held up the wire with her trunk!'); } if (k === 'rain') say('Rain? Under the big top?'); if (k === 'night') say('The spotlight followed the Kid everywhere.'); if (k === 'fast') say('Wire-walking in a hurry is a terrible idea.'); },
      update(dt){
        if (ST > 1.6 && !S.snip){ S.snip = true; S.wire = 0; say('SNIP!'); shake = .3; }
        if (fx.rewind > 0 && S.wire < 1) S.wire = Math.min(1, S.wire + dt/1.2);
        const onWire = kx > 104 && kx < 556, held = S.wire >= 1 || S.held;
        S.float = onWire && fx.wind > 0 && !held && !S.fall; if (S.float) kx += 150*dt;
        if (S.fall > 0){ S.fall += dt; S.lock = true; S.kidAt = { x:S.fallX, y:WIRE + (S.fall < .5 ? 0 : Math.min(GY - 30 - WIRE, (S.fall - .5)**2*900)) };
          if (S.fall > 1.5){ S.fall = 0; S.lock = false; kx = 60; laugh(); say('Boing! Right into the safety net.'); } }
        else { if (onWire && !held && !S.float){ S.fall = .01; S.fallX = kx; } S.kidAt = { x:kx, y:WIRE }; }
        if (kx > 570) return 'win';
      },
      draw(){ bigTop();
        for (const px of [60, 600]){ ctx.fillStyle = '#5a4030'; ctx.fillRect(px - 6, WIRE, 12, GY - WIRE); ctx.fillStyle = '#8a3a2a'; ctx.fillRect(px - 46, WIRE, 92, 8); }
        ctx.strokeStyle = 'rgba(240,230,210,.7)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = 110; x < 550; x += 16){ ctx.moveTo(x, GY - 40); ctx.lineTo(x + 8, GY - 30); ctx.lineTo(x + 16, GY - 40); } ctx.stroke();
        if (S.held) elephant(310, GY, 1, { love:true, up:true, s:.85 });
        ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
        if (S.wire >= 1 || S.held){ ctx.beginPath(); ctx.moveTo(100, WIRE); ctx.quadraticCurveTo(330, WIRE + 12, 560, WIRE); ctx.stroke(); }
        else { const k = 1 - S.wire; ctx.beginPath(); ctx.moveTo(100, WIRE); ctx.lineTo(100 + 230*S.wire + 6*k, WIRE + 130*k); ctx.moveTo(560, WIRE); ctx.lineTo(560 - 230*S.wire - 6*k, WIRE + 130*k); ctx.stroke(); }
        bart(S.saved ? 650 : 626, WIRE, -1, {}); scissors(S.saved ? 624 : 600, WIRE - 40, S.snip && S.wire < 1 ? 0 : .6 + Math.sin(t*6)*.4);
      } },
    { // 2. The human cannonball
      intro:'CHAPTER TWO. Next, the Human Cannonball! Fly through the flaming hoop and land in the net.', fixes:['wind', 'fast'], reel:40,
      fail:'The cannon ran out of gunpowder.',
      setup:() => ({ fly:0, landed:0, splash:0 }),
      card(k){ if (k === 'rain'){ S.hoopOut = true; say('The rain put out the flaming hoop. Phew!'); } if (k === 'love') say('The Kid fell in love with the trapeze artist. Still on the ground, though.'); if (k === 'night') say('The flaming hoop glowed beautifully in the dark.'); if (k === 'rewind' && S.fly) { S.back = true; say('Backwards… right back into the cannon!'); } },
      update(dt){
        if (S.landed){ S.landed += dt; if (S.landed > 1.6) return 'win'; return; }
        if (S.splash){ S.splash += dt; if (S.splash > 1.4){ S.splash = 0; S.lock = false; S.hideKid = false; S.kidAt = null; kx = 60; } return; }
        if (S.fly){ S.fly += dt;
          if (S.back){ S.px -= 320*dt; S.py = Math.min(S.py + 120*dt, GY - 70); S.kidAt = { x:S.px, y:S.py, rot:-S.fly*6 }; if (S.px <= 160){ S.fly = 0; S.back = false; S.lock = false; S.kidAt = null; kx = 110; laugh(); } return; }
          if (fx.wind > 0) S.vx = Math.max(S.vx, 290); S.vy += 600*dt; S.px += S.vx*dt; S.py += S.vy*dt; S.kidAt = { x:S.px, y:S.py, rot:S.fly*6 };
          if (!S.hot && !S.hoopOut && Math.abs(S.px - 300) < 14){ S.hot = true; say('Hot! Hot! Hot!'); laugh(); }
          if (S.py >= GY - 30){ if (S.px > 512 && S.px < 618){ S.landed = .01; S.kidAt = { x:S.px, y:GY - 34 }; anim.happy = 3; say('A perfect landing!'); }
            else { S.splash = .01; S.splashX = S.px; S.hideKid = true; laugh(); say(S.px > 330 && S.px < 430 ? 'SPLASH! Right in the water tub.' : 'Bump! Into the sawdust.'); } }
          return; }
        if (input.pressed){ input.pressed = false; if (near(kx, 130, 46)){ S.fly = .01; S.hot = false; S.lock = true; S.px = 160; S.py = GY - 70; S.vx = fx.fast > 0 ? 285 : 160; S.vy = -420; shake = .5; S.flash = .3; say('BOOM!'); } }
      },
      draw(){ bigTop();
        ctx.save(); ctx.translate(130, GY - 40); ctx.rotate(-.75); ctx.fillStyle = '#8a3a2a'; rr(-30, -20, 110, 40, 16); ctx.fill(); ctx.fillStyle = '#e8d070'; for (let k = 0; k < 3; k++) ctx.fillRect(-10 + k*30, -22, 6, 44); ctx.restore();
        ctx.fillStyle = '#5a4030'; circle(112, GY - 14, 16); circle(156, GY - 14, 16);
        const hx = 300, hy = GY - 200; ctx.fillStyle = '#5a4030'; ctx.fillRect(hx - 3, hy + 40, 6, GY - hy - 40); ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(hx, hy, 14, 40, 0, 0, 7); ctx.stroke();
        if (!S.hoopOut) for (let k = 0; k < 10; k++){ const a = k/10*Math.PI*2; ctx.fillStyle = k % 2 ? '#fff' : '#ccc'; ctx.beginPath(); ctx.ellipse(hx + Math.cos(a)*16, hy + Math.sin(a)*42 - 6 - Math.abs(Math.sin(t*10 + k))*6, 4, 8, 0, 0, 7); ctx.fill(); }
        ctx.fillStyle = '#6a5040'; rr(330, GY - 36, 100, 36, 6); ctx.fill(); ctx.fillStyle = '#a8b4c0'; ctx.fillRect(334, GY - 32, 92, 10);
        if (S.splash && S.splashX > 330 && S.splashX < 430) for (let k = 0; k < 8; k++){ const a = Math.PI + k/7*Math.PI; ctx.fillStyle = '#d8e0e8'; circle(S.splashX + Math.cos(a)*S.splash*70, GY - 36 + Math.sin(a)*S.splash*60 + S.splash*S.splash*30, 4); }
        ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = 512; x < 618; x += 12){ ctx.moveTo(x, GY - 34); ctx.lineTo(x + 6, GY - 24); ctx.lineTo(x + 12, GY - 34); } ctx.stroke(); ctx.fillStyle = '#5a4030'; ctx.fillRect(508, GY - 40, 6, 40); ctx.fillRect(616, GY - 40, 6, 40);
        if (!S.fly && !S.landed && !S.splash){ ctx.fillStyle = '#fff'; ctx.font = 'italic 700 14px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('Space at the cannon to fire', 130, GY - 120); ctx.textAlign = 'left'; }
      } },
    { // 3. The runaway elephant
      intro:'FINALE. Dumpling the elephant thinks the Kid is a MOUSE, and she’s stampeding straight for the tent pole!', fixes:['love', 'rain', 'rewind', 'night'], reel:30,
      fail:'CRASH! Down came the big top.',
      setup:() => ({ ex:150, v:0, calm:0, how:'' }),
      card(k){ if (k === 'love'){ S.how = 'love'; say('Dumpling fell in love with the little “mouse”!'); } if (k === 'rain'){ S.how = 'slip'; say('Dumpling slipped on the wet sawdust… and sat down.'); }
        if (k === 'night'){ S.how = 'sleep'; say('Elephants sleep standing up, you know.'); } if (k === 'fast'){ S.v = 90; say('Faster?! That was NOT a good idea!'); } if (k === 'wind') say('Dumpling’s ears flapped… she almost flew!'); },
      update(dt){
        if (S.how && !S.calm) S.calm = .01;
        if (S.calm){ S.calm += dt; if (S.calm > 2) return 'win'; return; }
        if (ST > 1.2){ if (!S.v) S.v = 34; if (fx.rewind > 0){ S.ex -= 150*dt; if (S.ex < 110) S.how = 'back'; } else S.ex += S.v*dt; }
        if (S.ex + 100 >= 560){ S.flash = .6; shake = .6; return 'fail'; }
      },
      draw(){ bigTop();
        ctx.fillStyle = '#5a4030'; ctx.fillRect(566, 0, 14, GY); ctx.strokeStyle = 'rgba(60,40,30,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(573, 20); ctx.lineTo(650, GY); ctx.moveTo(573, 20); ctx.lineTo(500, GY); ctx.stroke();
        const run = ST > 1.2 && !S.calm, sleep = S.how === 'sleep', sit = S.how === 'slip';
        ctx.save(); if (sit){ ctx.translate(S.ex, GY); ctx.rotate(-.25); ctx.translate(-S.ex, -GY + 14); }
        elephant(S.ex, GY, 1, { run, scared:!S.how, love:S.how === 'love', sleep, up:!S.how, s:.9 }); ctx.restore();
        if (sleep){ ctx.fillStyle = '#fff'; ctx.font = '700 20px Georgia, serif'; for (let k = 0; k < 3; k++){ const a = wrap(t*.6 + k/3, 1); ctx.globalAlpha = 1 - a; ctx.fillText('z', S.ex + 40 + a*30, GY - 150 - a*50); } ctx.globalAlpha = 1; }
        if (S.how === 'love'){ ctx.fillStyle = '#e04060'; for (let k = 0; k < 3; k++){ const a = wrap(t*.5 + k/3, 1); heartAt(S.ex + 40 + Math.sin(a*8)*12, GY - 140 - a*60, 7); } }
        if (!S.how && ST > 1.2){ ctx.fillStyle = '#fff'; ctx.font = 'italic 700 18px Georgia, serif'; ctx.fillText('A MOUSE!!', S.ex + 50, GY - 170); }
      } },
  ];

  // ----- the Bijou's programme: three pictures to choose from -----
  const FILMS = [
    { id:'pepper', title:'THE PERILS OF PEPPER', tag:'a thrilling picture in five reels', scenes:SCENES,
      win:'The audience leaps to its feet! Black Bart is behind bars, the pie money is back in the bank, and Pepper gives you a big sloppy pony kiss.' },
    { id:'moon', title:'A TRIP TO THE MOON', tag:'a fantastical voyage in three reels', scenes:MOON_SCENES,
      win:'The shell splashes down in the sea, Professor Luna hoots with joy, and the whole audience swears they saw the Moon wink.' },
    { id:'circus', title:'THE GREATEST SHOW IN THE WEST', tag:'a circus comedy in three reels', scenes:CIRCUS_SCENES,
      win:'Dumpling gives the Kid a ride around the ring, the band strikes up, and the audience throws roses instead of tomatoes.' },
  ];
  const posterRect = i => ({ x:30 + i*206, y:52, w:186, h:236 });
  function pickFilm(i){ film = i; scenes = FILMS[i].scenes; phase = 'play'; solvedN = 0; take = 1; S = null; hand = [];
    tc = { text:`${FILMS[i].title}  ~  ${FILMS[i].tag}`, dur:2.6, t:0, after:() => startScene(0) }; }
  function drawMenu(){
    ctx.fillStyle = '#0c0a08'; ctx.fillRect(0, 0, SW, SH);
    ctx.fillStyle = '#e8e0d0'; ctx.font = 'italic 700 26px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('~ Now Showing at the Bijou ~', SW/2, 36);
    FILMS.forEach((f, i) => { const r = posterRect(i), sel = i === menuCur, lift = sel ? -4 : 0;
      ctx.fillStyle = '#e8dcc0'; ctx.fillRect(r.x, r.y + lift, r.w, r.h); ctx.strokeStyle = sel ? '#fff3a0' : '#7a6a50'; ctx.lineWidth = sel ? 5 : 2; ctx.strokeRect(r.x, r.y + lift, r.w, r.h);
      ctx.save(); ctx.beginPath(); ctx.rect(r.x + 8, r.y + 8 + lift, r.w - 16, r.h - 74); ctx.clip(); ctx.translate(r.x + 8, r.y + 8 + lift); const pw = r.w - 16, ph = r.h - 74;
      if (i === 0){ ctx.fillStyle = '#c8b898'; ctx.fillRect(0, 0, pw, ph); ctx.fillStyle = '#e8e0d0'; circle(pw - 30, 30, 18); ctx.save(); ctx.translate(46, ph); ctx.scale(.9, .9); bart(0, 0, 1, {}); ctx.restore(); pepper(pw - 52, ph + 4, 86, -1); }
      else if (i === 1){ ctx.fillStyle = '#16141c'; ctx.fillRect(0, 0, pw, ph); for (let k = 0; k < 20; k++){ ctx.fillStyle = '#fff'; circle(hash(k + 40)*pw, hash(k + 41)*ph, 1.2); } moonFace(pw/2, ph/2, 52, { ouch:true }); shell(pw/2 - 30, ph/2 - 6, -2.6, .7); }
      else { for (let k = 0; k < 8; k++){ ctx.fillStyle = k % 2 ? '#e8e0d0' : '#8a3a2a'; ctx.beginPath(); ctx.moveTo(pw/2, -20); ctx.lineTo(k*pw/8 - 10, ph); ctx.lineTo((k + 1)*pw/8 - 10, ph); ctx.fill(); } elephant(pw/2 - 26, ph, 1, { s:.62, love:true }); }
      ctx.restore();
      ctx.fillStyle = '#2a1a10'; ctx.font = 'italic 700 15px Georgia, serif'; wrapCenter(f.title, r.x + r.w/2, r.y + r.h - 46 + lift, r.w - 16, 17);
      ctx.font = 'italic 11px Georgia, serif'; ctx.fillStyle = '#5a4030'; ctx.fillText(f.tag, r.x + r.w/2, r.y + r.h - 12 + lift);
      if (Save.flag('film_' + f.id)){ ctx.fillStyle = '#c9302a'; ctx.font = '700 12px Georgia, serif'; ctx.fillText('★ SEEN ★', r.x + r.w/2, r.y + 24 + lift); }
      ctx.fillStyle = sel ? '#fff3a0' : '#a89878'; ctx.font = '700 13px Georgia, serif'; ctx.fillText(String(i + 1), r.x + r.w/2, r.y + r.h + 18); });
    ctx.fillStyle = '#e8e0d0'; ctx.font = 'italic 14px Georgia, serif'; ctx.fillText('← → and Space, press 1 2 3, or click a poster', SW/2, SH - 6); ctx.textAlign = 'left';
    ctx.globalCompositeOperation = 'color'; ctx.fillStyle = '#b08a58'; ctx.fillRect(0, 0, SW, SH); ctx.globalCompositeOperation = 'source-over';
  }

  // ----- the picture's flow -----
  function deal(i){ const d = ALL.slice().sort(() => Math.random() - .5).slice(0, 3); if (!d.some(k => scenes[i].fixes.includes(k))) d[rand(3)] = scenes[i].fixes[rand(scenes[i].fixes.length)]; return d; }
  function startScene(i, retake){
    sc = i; S = scenes[i].setup(); ST = 0; kx = 40; kface = 1; kmove = 0; fx = { wind:0, love:0, fast:0, rewind:0 }; rain = false; night = false; hand = deal(i); bits = []; said = []; iris = 0; input.pressed = false;
    tc = { text: retake ? `TAKE ${take}!` : scenes[i].intro, dur: retake ? 1.4 : 2.8, t:0, clap:retake };
  }
  function playCard(i){ if (tc || phase !== 'play' || !hand[i]) return; const k = hand.splice(i, 1)[0]; tc = { text:CARDS[k], dur:1.6, t:0, after:() => useCard(k) }; }
  function useCard(k){
    if (DUR[k]) fx[k] = DUR[k]; if (k === 'rain') rain = true; if (k === 'night') night = true;
    scenes[sc].card(k);
    if (!scenes[sc].fixes.includes(k)) laugh();
  }
  function cardRect(i){ return { x:400 - hand.length*92 + i*184 + 4, y:398, w:176, h:62 }; }
  function wrapCenter(txt, x, y, maxW, lh){ const lines = []; let line = ''; for (const w of txt.split(' ')){ const tt = line ? line + ' ' + w : w; if (ctx.measureText(tt).width > maxW && line){ lines.push(line); line = w; } else line = tt; } lines.push(line); lines.forEach((l, i) => ctx.fillText(l, x, y + (i - (lines.length - 1)/2)*lh)); }
  function intertitle(txt, clap){
    ctx.fillStyle = '#0c0a08'; ctx.fillRect(0, 0, SW, SH);
    ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 3; ctx.strokeRect(22, 18, SW - 44, SH - 36); ctx.lineWidth = 1; ctx.strokeRect(30, 26, SW - 60, SH - 52);
    for (const [x, y] of [[30, 26], [SW - 30, 26], [30, SH - 26], [SW - 30, SH - 26]]){ ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 7, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 7, y); ctx.fill(); }
    ctx.fillStyle = '#f0e8d8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (clap){ ctx.fillStyle = '#e8e0d0'; ctx.fillRect(SW/2 - 70, SH/2 - 30, 140, 80); ctx.fillStyle = '#0c0a08'; ctx.font = '700 26px Georgia, serif'; ctx.fillText(txt, SW/2, SH/2 + 12); ctx.save(); ctx.translate(SW/2 - 70, SH/2 - 34); ctx.rotate(-.25 + Math.min(1, tc.t*3)*.25); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, -16, 140, 16); ctx.fillStyle = '#0c0a08'; for (let k = 0; k < 5; k++){ ctx.beginPath(); ctx.moveTo(10 + k*28, -16); ctx.lineTo(24 + k*28, -16); ctx.lineTo(16 + k*28, 0); ctx.lineTo(2 + k*28, 0); ctx.fill(); } ctx.restore(); }
    else { ctx.font = 'italic 700 30px Georgia, "Times New Roman", serif'; wrapCenter(txt, SW/2, SH/2, SW - 130, 40); }
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
  function filmLook(){
    const fr = Math.floor(time*FPS), r = rng(fr*7 + 3);
    for (let i = 0; i < 70; i++){ ctx.fillStyle = r() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)'; ctx.fillRect(r()*SW, r()*SH, 1.5, 1.5); }
    for (let i = 0; i < 2; i++) if (r() < .5){ ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(r()*SW, 0, 1, SH); }
    if (r() < .1){ ctx.fillStyle = 'rgba(0,0,0,.6)'; circle(r()*SW, r()*SH, 2 + r()*3); }
    ctx.fillStyle = `rgba(0,0,0,${r()*.08})`; ctx.fillRect(0, 0, SW, SH);
    const vg = ctx.createRadialGradient(SW/2, SH/2, SH*.4, SW/2, SH/2, SW*.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, SW, SH);
  }
  function tomato(){ const tx = 120 + Math.random()*(SW - 240), ty = 60 + Math.random()*(SH - 140); throws.push({ x0:200 + Math.random()*400, y0:470, x1:SX + tx, y1:SY + ty, t:0 }); }
  function audience(){
    // rows of silhouettes in the dark theater, bouncing when they laugh or cheer
    for (let row = 0; row < 2; row++) for (let i = 0; i < 16; i++){
      const x = 20 + i*50 + row*25 + hash(i + row*20)*10, base = 486 - row*14, kind = (i*3 + row) % 4;
      const hop = cheerT > 0 ? Math.abs(Math.sin(t*10 + i))*10 : laughT > 0 ? Math.abs(Math.sin(t*14 + i*2))*4 : 0, y = base - hop;
      ctx.fillStyle = row ? '#1c1218' : '#100a0e'; ctx.beginPath(); ctx.ellipse(x, y - 14, 16, 18, 0, 0, 7); ctx.fill();
      if (kind === 0){ ctx.beginPath(); ctx.ellipse(x - 6, y - 38, 4, 12, -.2, 0, 7); ctx.ellipse(x + 6, y - 38, 4, 12, .2, 0, 7); ctx.fill(); }
      else if (kind === 1){ ctx.fillRect(x - 16, y - 32, 32, 4); ctx.fillRect(x - 9, y - 44, 18, 13); }
      else if (kind === 2){ circle(x - 12, y - 30, 7); circle(x + 12, y - 30, 7); }
    }
    if (laughT > 0){ ctx.fillStyle = 'rgba(255,240,200,.85)'; ctx.font = '700 14px "Pixelify Sans", monospace'; for (let i = 0; i < 4; i++) ctx.fillText('HA!', 110 + i*180 + Math.sin(t*9 + i)*6, 452 - Math.abs(Math.sin(t*7 + i))*10); }
    // the piano player in the corner
    ctx.fillStyle = '#1a1014'; ctx.fillRect(4, 412, 60, 50); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(8, 404, 52, 8); ctx.fillStyle = '#100a0e'; for (let k = 0; k < 7; k++) ctx.fillRect(10 + k*7, 404, 3, 5);
    ctx.fillStyle = '#100a0e'; circle(46, 392 + Math.sin(t*8)*2, 11); ctx.fillRect(38, 398, 16, 20);
  }

  return {
    title:'The Bijou Picture Show', sub:'Silent pictures where the title cards come true.',
    blurb:'The Bijou’s old silent pictures come to life, and you’re the star! Nobody can talk in a silent picture… but whatever the TITLE CARDS say really happens. Pick a picture from tonight’s programme, splice in the right cards, and get the audience cheering.',
    legend:['Pick one of three pictures: The Perils of Pepper, A Trip to the Moon, or The Greatest Show in the West', '← → to walk, Space to act (stomp, untie, push, climb in the cannon)', 'Click a title card (or press 1, 2, 3) to splice it into the film', 'Whatever the card says comes true!', 'Most perils have more than one answer', '3 tomatoes from the audience and the show is over'],
    hints:['← → walk, Space to act', 'Click a card (or 1 2 3) to splice it in', 'P to pause'],
    pad:['wgLeft', 'wgRight', 'wgAction'], actionLabel:'Act', clicks:true,
    winTitle:'THE END', winText:'The audience leaps to its feet! Black Bart is behind bars, the pie money is back in the bank, and Pepper gives you a big sloppy pony kiss.',
    loseTitle:'The show’s over', loseText:'Splat! One tomato too many. The projectionist pulls the plug and the lights come up. Better luck at the next showing!',
    againWinText:'Another standing ovation! The Bijou wants you back for the sequel.', againLoseText:'The projectionist rewinds the reel. Next showing in five minutes!',
    reset(){ tomatoes = 0; applause = 0; splats = []; throws = []; laughT = 0; cheerT = 0; solvedN = 0; take = 1; phaseT = 0;
      film = 0; scenes = FILMS[0].scenes; phase = 'menu'; S = null; hand = []; tc = null; said = []; bits = []; iris = 1; rain = false; night = false; fx = { wind:0, love:0, fast:0, rewind:0 }; },
    seeds:() => Math.floor(applause/10) + solvedN, stats:() => `<span>${FILMS[film].title.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase())}</span><span>Scenes ${solvedN}/${scenes.length}</span><span>Applause ${applause}</span><span>Tomatoes ${tomatoes}</span>`,
    end:() => lastWon ? { title:'THE END', text:FILMS[film].win } : null,
    update(dt){
      time += dt; laughT = Math.max(0, laughT - dt); cheerT = Math.max(0, cheerT - dt);
      for (const s of splats) s.life -= dt*.12; splats = splats.filter(s => s.life > 0);
      for (const th of throws){ th.t += dt/.6; if (th.t >= 1 && !th.done){ th.done = true; splats.push({ x:th.x1 - SX, y:th.y1 - SY, life:1, r:14 + Math.random()*8 }); shake = .2; } } throws = throws.filter(th => !th.done);
      for (const s of said) s.life -= dt; said = said.filter(s => s.life > 0);
      for (const b of bits){ b.x += b.vx*dt; b.y += b.vy*dt; b.vy += 600*dt; } bits = bits.filter(b => b.y < SH + 20);
      if (S && S.flash) S.flash = Math.max(0, S.flash - dt);
      if (tc){ tc.t += dt; input.pressed = false; input.click = null; input.keys.length = 0;
        if (tc.t >= tc.dur){ const f = tc.after; tc = null; if (f) f(); } return; }
      if (phase === 'win'){ phaseT += dt; iris = Math.max(0, 1 - phaseT/.9); if (phaseT > 1.1){ phase = 'play';
          if (sc >= scenes.length - 1){ tc = { text:'THE END', dur:2.2, t:0, after:() => { Save.setFlag('film_' + FILMS[film].id); finish(true); } }; phase = 'over'; } else startScene(sc + 1); } return; }
      if (phase === 'menu'){
        for (const k of input.taps.splice(0)){ if (k === 'left') menuCur = (menuCur + 2) % 3; if (k === 'right') menuCur = (menuCur + 1) % 3; }
        for (const k of input.keys.splice(0)){ const i = +k - 1; if (i >= 0 && i < 3) return pickFilm(i); }
        if (input.click){ const c = input.click; input.click = null; for (let i = 0; i < 3; i++){ const r = posterRect(i); if (c.x - SX > r.x && c.x - SX < r.x + r.w && c.y - SY > r.y && c.y - SY < r.y + r.h) return pickFilm(i); } }
        if (input.pressed){ input.pressed = false; pickFilm(menuCur); }
        return; }
      if (phase === 'fail'){ phaseT += dt; if (phaseT > 1.2){ if (tomatoes >= 3){ phase = 'over'; finish(false); } else { take++; phase = 'play'; startScene(sc, true); } } return; }
      if (phase !== 'play') return;
      iris = Math.min(1, iris + dt*1.4); ST += dt;
      for (const k of input.keys) playCard(+k - 1); input.keys.length = 0;
      if (input.click){ const { x, y } = input.click; input.click = null; for (let i = hand.length - 1; i >= 0; i--){ const r = cardRect(i); if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h){ playCard(i); break; } } }
      if (tc) return;
      for (const k in fx) fx[k] = Math.max(0, fx[k] - dt);
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0), sp = 125*(fx.fast > 0 ? 2.8 : 1);
      if (!S.fall && !(S.chase > 0) && !S.free && !S.lock){ if (fx.rewind > 0){ kx -= 130*dt; kmove = 130; } else { kx += dir*sp*dt; kmove = Math.abs(dir)*sp; if (dir) kface = dir; } }
      kx = clamp(kx, 18, SW - 18);
      let res = scenes[sc].update(dt);
      if (!res && ST > scenes[sc].reel) res = 'fail';
      if (res === 'win'){ phase = 'win'; phaseT = 0; solvedN++; applause += 25 + hand.length*5; cheerT = 2.5; }
      else if (res === 'fail'){ phase = 'failing'; tomatoes++; tc = { text:scenes[sc].fail, dur:2.2, t:0, after:() => { tomato(); phase = 'fail'; phaseT = 0; } }; }
    },
    draw(){
      // the theater: curtains, the screen and the audience
      ctx.fillStyle = '#140a0e'; ctx.fillRect(0, 0, W, H);
      const fr = Math.floor(time*FPS), wr = rng(fr + 11), weave = reduceMotion ? 0 : (wr() - .5)*2.2;
      ctx.save(); ctx.translate(SX, SY + weave); ctx.beginPath(); ctx.rect(0, 0, SW, SH); ctx.clip();
      if (tc) intertitle(tc.text, tc.clap);
      else if (phase === 'menu') drawMenu();
      else if (S){
        scenes[sc].draw();
        for (const b of bits){ ctx.fillStyle = '#7a5a3a'; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.y*.05); ctx.fillRect(-6, -3, 12, 6); ctx.restore(); }
        // you, the star of the picture
        const kdy = S.kdy || 0, kp = S.kidAt || { x:kx, y:GY + kdy };
        if (S.float){ ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(kp.x, kp.y - 40); ctx.lineTo(kp.x, kp.y - 78); ctx.stroke(); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(kp.x, kp.y - 78, 30, Math.PI, 0); ctx.fill(); }
        if (S.hideKid){}
        else if (film === 0 && sc === 3 && S.free) Chin.draw(ctx, 'me', anim, 450 - S.free*240, GY - 60, { scale:.06, face:-1, grounded:true, speed:0 });
        else { ctx.save(); ctx.translate(kp.x, kp.y); if (kp.rot) ctx.rotate(kp.rot); Chin.draw(ctx, 'me', anim, 0, 0, { scale:.075, face:kface, grounded:true, speed:kp.rot ? 0 : kmove }); ctx.restore(); }
        if (S.fall > 0 && S.fall < .7){ ctx.fillStyle = '#fff'; ctx.font = '700 22px Georgia, serif'; ctx.fillText('!', kp.x + 14, kp.y - 64); }
        // the card effects
        if (fx.wind > 0){ ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; for (let i = 0; i < 14; i++){ const x = wrap(time*700 + i*97, SW + 200) - 100, y = 30 + hash(i)*(GY - 20); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60, y); ctx.stroke(); } }
        if (rain){ ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i = 0; i < 60; i++){ const x = wrap(hash(i)*SW - time*120, SW), y = wrap(hash(i + 60)*SH + time*520, SH); ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 16); } ctx.stroke(); }
        if (fx.love > 0){ ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 8; i++){ const a = wrap(time*.3 + i/8, 1); heartAt(hash(i)*SW, SH - a*SH, 6 + hash(i + 3)*6); } }
        if (fx.fast > 0){ ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++){ ctx.beginPath(); ctx.moveTo(kx - kface*(20 + k*12), GY - 20 - k*12); ctx.lineTo(kx - kface*(50 + k*12), GY - 20 - k*12); ctx.stroke(); } }
        if (night){ ctx.fillStyle = 'rgba(0,0,10,.35)'; ctx.fillRect(0, 0, SW, SH); }
        said.forEach((s, i) => { ctx.globalAlpha = Math.min(1, s.life*2); ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(40, 18 + i*34, SW - 80, 28, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'italic 700 16px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.txt, SW/2, 33 + i*34, SW - 100); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.globalAlpha = 1; });
        if (S.flash > 0){ ctx.fillStyle = `rgba(255,255,255,${S.flash})`; ctx.fillRect(0, 0, SW, SH); }
        // the old picture tints: sepia, blue for night, rose for love
        ctx.globalCompositeOperation = 'color'; ctx.fillStyle = S.flash > 0 ? '#e0a050' : fx.love > 0 ? '#d07a94' : night ? '#4a6ab8' : '#b08a58'; ctx.fillRect(0, 0, SW, SH); ctx.globalCompositeOperation = 'source-over';
        if (fx.rewind > 0){ ctx.fillStyle = '#fff'; ctx.font = '700 26px Georgia, serif'; ctx.fillText('◀◀', 20, 40); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(0, wrap(-time*600, SH), SW, 20); }
        if (iris < 1){ ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, SW, SH); const ir = Math.max(0, iris)*SW*.8; ctx.moveTo(kx + ir, GY - 30); ctx.arc(kx, GY - 30, ir, 0, Math.PI*2); ctx.fill('evenodd'); }
      }
      filmLook();
      for (const s of splats){ ctx.globalAlpha = Math.min(1, s.life*2); ctx.fillStyle = '#c8302a'; circle(s.x, s.y, s.r); for (let k = 0; k < 6; k++){ const a = k*1.05; circle(s.x + Math.cos(a)*s.r, s.y + Math.sin(a)*s.r, s.r*.4); } ctx.fillRect(s.x - 3, s.y, 5, s.r*2.2); ctx.fillStyle = '#5a8a3a'; ctx.fillRect(s.x - 4, s.y - s.r - 2, 8, 4); ctx.globalAlpha = 1; }
      ctx.restore();
      // the projector beam from the back of the room
      const pb = ctx.createLinearGradient(400, 480, 400, SY); pb.addColorStop(0, 'rgba(255,250,220,.12)'); pb.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = pb; ctx.beginPath(); ctx.moveTo(390, 480); ctx.lineTo(SX, SY); ctx.lineTo(SX + SW, SY); ctx.lineTo(410, 480); ctx.fill();
      // red velvet curtains
      for (const side of [0, 1]){ const x0 = side ? SX + SW : 0, w = side ? W - SX - SW : SX; const cg = ctx.createLinearGradient(x0, 0, x0 + w, 0); cg.addColorStop(0, '#5a0e18'); cg.addColorStop(.5, '#9a1a28'); cg.addColorStop(1, '#5a0e18'); ctx.fillStyle = cg; ctx.fillRect(x0, 0, w, H);
        ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 3; for (let k = 1; k < 4; k++){ ctx.beginPath(); ctx.moveTo(x0 + k*w/4, 0); ctx.lineTo(x0 + k*w/4, H); ctx.stroke(); } }
      ctx.fillStyle = '#7a1420'; ctx.fillRect(SX - 10, SY - 8, SW + 20, 10); ctx.fillStyle = '#c9a13a'; ctx.fillRect(SX - 10, SY + 1, SW + 20, 2);
      audience();
      for (const th of throws){ const x = th.x0 + (th.x1 - th.x0)*th.t, y = th.y0 + (th.y1 - th.y0)*th.t - Math.sin(th.t*Math.PI)*120; ctx.fillStyle = '#d03a2a'; circle(x, y, 9 - th.t*3); }
      // your hand of title cards
      if (hand && state !== 'title') hand.forEach((k, i) => { const r = cardRect(i), hov = input.aim && input.aim.x > r.x && input.aim.x < r.x + r.w && input.aim.y > r.y && input.aim.y < r.y + r.h, lift = hov && phase === 'play' && !tc ? 6 : 0;
        ctx.fillStyle = '#0c0a08'; rr(r.x, r.y - lift, r.w, r.h, 4); ctx.fill(); ctx.strokeStyle = hov ? '#ffe066' : '#e8e0d0'; ctx.lineWidth = 2; ctx.strokeRect(r.x + 4, r.y + 4 - lift, r.w - 8, r.h - 8);
        ctx.fillStyle = '#f0e8d8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'italic 700 13px Georgia, serif'; wrapCenter(CARDS[k], r.x + r.w/2, r.y + r.h/2 - lift + 2, r.w - 30, 16);
        ctx.fillStyle = '#c9a13a'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.fillText(String(i + 1), r.x + 12, r.y + 12 - lift); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; });
      drawPops(0);
    },
    hud(){
      hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(phase === 'menu' ? 'Now Showing' : `Reel ${Math.min(scenes.length, sc + 1)}/${scenes.length}`, 24, 31);
      if (phase !== 'menu') ctx.fillText(`Applause ${applause}`, 140, 31);
      if (phase === 'play' && !tc && S){ const left = Math.max(0, scenes[sc].reel - ST); if (scenes[sc].reel < 60){ ctx.fillStyle = left < 8 ? '#ff8a9a' : 'rgba(246,234,214,.7)'; ctx.fillText(`🎞 ${Math.ceil(left)} s`, 330, 31); } }
      ctx.textAlign = 'right'; ctx.fillStyle = '#fff6e4'; ctx.fillText('Tomatoes', W - 110, 31); ctx.textAlign = 'left';
      for (let i = 0; i < 3; i++){ ctx.fillStyle = i < tomatoes ? '#d03a2a' : 'rgba(246,234,214,.2)'; circle(W - 92 + i*26, 30, 9); }
      ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ if (tc) tc.t = Math.min(tc.t, 1); },
  };
})();

// ================= Neon City: Rainbow Tide =================
// Past the end of the walkway, the sea glows: every night a tide of rainbow electricity rolls in.
// Ride on top of the rolling waves on a glow-board. One button: hold to dive down the slopes and
// pick up speed, let go to sail off the tops of the waves. Land smoothly on a downslope for a boost
// (three in a row = Rainbow Surge), grab sparks in the air, and fly over the static jellyfish.
const TIDE = (() => {
  const GOAL = 14000, TIDE_T = 60, SX = 230, G = 520, BANDS = ['255,70,90', '255,150,60', '255,230,90', '90,230,130', '80,170,255', '190,110,255'];
  let x, y, vx, vy, ground, airT, hearts, inv, things, nextT, smooth, surge, score, camY, trail, best, flips, holdLook;
  // the height of the sea at x: rolling waves that get a bit bigger the further out you go
  const amp = wx => .75 + .55*Math.min(1, wx/9000);
  const sea = wx => 330 - amp(wx)*(62*Math.sin(wx*.0072) + 20*Math.sin(wx*.019 + 1.3));
  const slope = wx => (sea(wx + 2) - sea(wx - 2))/4;
  function crestsAhead(from){ const out = []; let prev = slope(from); for (let wx = from; wx < from + 900; wx += 6){ const s = slope(wx); if (prev < 0 && s >= 0) out.push(wx); prev = s; } return out; }
  function spawn(){
    for (const c of crestsAhead(nextT)){
      if (c < nextT) continue;
      const r = Math.random();
      if (r < .5) for (let k = 0; k < 3; k++) things.push({ k:'spark', x:c + 60 + k*55, y:sea(c) - 70 - k*14 - Math.random()*30, band:Math.floor(Math.random()*6) });
      else if (r < .78 && c > 2200) things.push({ k:'jelly', x:c, ph:Math.random()*6 });   // sitting right on top of a wave: jump it!
      nextT = c + 10;
    }
    nextT = Math.max(nextT, x + 700);
  }
  function hurt(){ inv = 1.2; shake = .3; vx = Math.max(180, vx*.6); vy = -200; ground = false; smooth = 0; pop(SX, y - 60, 'ZAP! Slowed down', '#9ae0ff'); }
  function bolt(x0, y0, x1, y1, seed){ const r = rng(seed); ctx.beginPath(); ctx.moveTo(x0, y0); for (let k = 1; k <= 5; k++){ const f = k/5; ctx.lineTo(x0 + (x1 - x0)*f + (k < 5 ? (r() - .5)*16 : 0), y0 + (y1 - y0)*f + (k < 5 ? (r() - .5)*16 : 0)); } ctx.stroke(); }
  return {
    title:'Rainbow Tide', sub:'Surf the rolling waves of rainbow electricity.',
    blurb:'Every night a tide of rainbow electricity rolls in past the end of the walkway. Grab a glow-board and surf the waves all the way to the lighthouse! Hold to dive down the waves, let go to fly off the tops.',
    legend:['Hold Space, ↓ or the mouse to dive down a wave', 'Let go as you go up a wave to fly off the top', 'Land smoothly on the far side for a speed boost', '3 smooth landings in a row = Rainbow Surge!', 'Fly over the static jellyfish (a zap slows you down)', 'Reach the lighthouse before the tide goes out!'],
    hints:['Hold to dive, let go to fly', 'P to pause'], pad:['wgAction'], actionLabel:'Hold to dive',
    winTitle:'What a ride!', winText:'You surf the rainbow all the way to the lighthouse, and the whole city flashes its lights for you.',
    loseTitle:'The tide went out!', loseText:'The rainbow tide fizzles out before you reach the lighthouse. You paddle back to shore with sparkles in your fur. Try again!',
    againWinText:'Another epic ride! The surf robots give you a perfect 10.', againLoseText:'Fizz! Shake the sparkles out of your fur and paddle back out.',
    reset(){ x = 200; y = sea(200); vx = 260; vy = 0; ground = true; airT = 0; hearts = 3; inv = 1; things = []; nextT = 600; smooth = 0; surge = 0; score = 0; camY = 0; trail = []; best = 0; flips = 0; holdLook = 0; },
    seeds:() => Math.floor(score/40), stats:() => `<span>Score ${Math.floor(score)}</span><span>Longest flight ${best.toFixed(1)} s</span><span>Ridden ${Math.min(100, Math.floor(x/GOAL*100))}%</span>`,
    update(dt){
      time += dt; inv = Math.max(0, inv - dt); surge = Math.max(0, surge - dt);
      input.pressed = false; input.taps.length = 0;
      const hold = input.action || input.down; holdLook += ((hold ? 1 : 0) - holdLook)*Math.min(1, dt*10);
      // gravity is much stronger while you hold, so you stick to the wave and dive down it
      const g = G*(hold ? 3.2 : 1);
      if (ground){
        const s = slope(x), len = Math.hypot(1, s), tx = 1/len, ty = s/len;
        let sp = vx*tx + vy*ty;
        sp += g*ty*dt;                         // downhill speeds you up, uphill slows you down
        sp -= sp*.04*dt;
        if (surge) sp = Math.max(sp, 520);
        sp = clamp(sp, 150, 760);
        vx = sp*tx; vy = sp*ty;
        x += vx*dt; y = sea(x);
        // going over the top of a wave fast enough (and not holding on), you fly off it
        const s2 = slope(x), l2 = Math.hypot(1, s2), curve = (sea(x + 8) + sea(x - 8) - 2*sea(x))/64;
        if (curve > 0 && sp*sp*curve/(l2*l2*l2) > g/l2){ ground = false; airT = 0; }
      } else {
        airT += dt; vy += g*dt; x += vx*dt; y += vy*dt;
        if (y >= sea(x)){
          // landing: smooth if you come down along the slope of the wave
          const s = slope(x), len = Math.hypot(1, s), tx = 1/len, ty = s/len, sp = Math.hypot(vx, vy);
          const along = (vx*tx + vy*ty)/sp;
          y = sea(x); ground = true;
          if (airT > .35){ best = Math.max(best, airT); score += Math.floor(airT*40); }
          if (airT > .35 && along > .93 && ty > 0){ smooth++; const boost = surge ? 1 : 1.12; vx = sp*boost*tx; vy = sp*boost*ty; score += 30; pop(SX, y - 60, smooth >= 3 ? 'RAINBOW SURGE!' : ['Smooth!', 'Super smooth!'][smooth - 1] || 'Smooth!', smooth >= 3 ? '#ffffff' : '#ffe066');
            if (smooth >= 3){ smooth = 0; surge = 5; score += 150; anim.happy = 2; } }
          else { const keep = Math.max(.55, along); vx = sp*keep*tx; vy = sp*keep*ty; if (airT > .35){ smooth = 0; pop(SX, y - 60, 'Splash!', '#9ae0ff'); } }
        }
      }
      // the camera rises to follow you on big jumps
      camY += (Math.min(0, y - 120) - camY)*Math.min(1, dt*4);
      score += vx*dt*.015;
      if (x > nextT - 300) spawn();
      for (const th of things){ if (th.got) continue;
        if (th.k === 'spark'){ if (Math.abs(th.x - x) < 28 && Math.abs(th.y - (y - 20)) < 34){ th.got = true; score += 15; pop(SX + (th.x - x), th.y - 18, '+15', `rgb(${BANDS[th.band]})`); } }
        else { const jy = sea(th.x) - 10; if (Math.abs(th.x - x) < 20 && Math.abs(jy - y) < 22){ th.got = true; if (surge){ score += 20; pop(SX + (th.x - x), jy - 30, 'Zoom!', '#ffb0ff'); } else if (!inv) hurt(); } } }
      things = things.filter(th => !th.got && th.x > x - 400);
      trail.push({ x, y }); if (trail.length > 24) trail.shift();
      if (x >= GOAL) finish(true); else if (time >= TIDE_T) finish(false);
    },
    draw(){
      const cy = -camY, toS = wx => SX + (wx - x);
      // the night sky over Neon City
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0620'); g.addColorStop(1, '#3a1450'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 50; i++){ ctx.fillStyle = `rgba(255,255,255,${.3 + .4*Math.sin(t*2 + i)})`; ctx.fillRect(wrap(hash(i)*900 - x*.02, 900) - 50, hash(i + 9)*260 + cy*.3, 2, 2); }
      ctx.fillStyle = '#3a6ad0'; circle(640, 90 + cy*.2, 34); ctx.strokeStyle = 'rgba(160,230,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(640, 90 + cy*.2, 58, 11, -.18, 0, 7); ctx.stroke();
      // the city skyline far behind
      const sky0 = 300 + cy*.5;
      for (let i = Math.floor(x*.15/60) - 1; i*60 - x*.15 < W + 60; i++){ const bx = i*60 - x*.15, h = 50 + hash(i)*110; ctx.fillStyle = '#1a1030'; ctx.fillRect(bx, sky0 - h, 50, h + 40); ctx.fillStyle = `rgba(${hash(i + 3) > .5 ? '255,106,213' : '90,220,255'},.7)`; ctx.fillRect(bx, sky0 - h, 50, 2);
        for (let wy = sky0 - h + 10; wy < sky0; wy += 12) for (let wx = 6; wx < 44; wx += 10) if (hash(i*7 + wx + wy) > .6){ ctx.fillStyle = 'rgba(255,230,150,.45)'; ctx.fillRect(bx + wx, wy, 3, 4); } }
      // the lighthouse at the finish
      { const lx = toS(GOAL + 150), ly = sea(GOAL + 150) + cy - 20; if (lx < W + 100){ ctx.fillStyle = '#e8e0f0'; ctx.beginPath(); ctx.moveTo(lx - 22, ly + 30); ctx.lineTo(lx - 12, ly - 150); ctx.lineTo(lx + 12, ly - 150); ctx.lineTo(lx + 22, ly + 30); ctx.fill(); ctx.fillStyle = '#ff6ad5'; ctx.fillRect(lx - 17, ly - 90, 34, 12); ctx.fillRect(lx - 15, ly - 30, 30, 12); ctx.fillStyle = '#fff6c8'; circle(lx, ly - 162, 12);
        ctx.fillStyle = 'rgba(255,250,200,.18)'; const sw = Math.sin(t*2)*.5; ctx.beginPath(); ctx.moveTo(lx, ly - 162); ctx.lineTo(lx - 400, ly - 200 + sw*160); ctx.lineTo(lx - 400, ly - 120 + sw*160); ctx.fill(); } }
      // the rainbow sea: six glowing bands that follow the shape of the waves
      for (let b = BANDS.length - 1; b >= 0; b--){ ctx.fillStyle = `rgba(${BANDS[b]},.9)`; ctx.beginPath(); ctx.moveTo(0, H);
        for (let s = 0; s <= W; s += 8) ctx.lineTo(s, sea(x + s - SX) + cy + b*22); ctx.lineTo(W, H); ctx.fill(); }
      ctx.fillStyle = 'rgba(30,10,60,.25)'; ctx.beginPath(); ctx.moveTo(0, H); for (let s = 0; s <= W; s += 8) ctx.lineTo(s, sea(x + s - SX) + cy + 132); ctx.lineTo(W, H); ctx.fill();
      // white foam along the top of the water, and crackles of electricity
      ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 4; ctx.beginPath(); for (let s = 0; s <= W; s += 8){ const yy = sea(x + s - SX) + cy - 1 - Math.abs(Math.sin((x + s)*.05 + t*4))*1.5; s ? ctx.lineTo(s, yy) : ctx.moveTo(s, yy); } ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; for (let k = 0; k < 3; k++){ const fr = Math.floor(t*9) + k*13; if (hash(fr) > .45){ const bx = hash(fr + 1)*W; const by = sea(x + bx - SX) + cy + 20 + hash(fr + 2)*80; bolt(bx, by, bx + 34, by + 16, fr); } }
      // sparks to grab, and static jellyfish to fly over
      for (const th of things){ const tx = toS(th.x); if (tx < -40 || tx > W + 40) continue;
        if (th.k === 'spark'){ const c = BANDS[th.band], ty = th.y + cy + Math.sin(t*3 + th.x)*4, sg = ctx.createRadialGradient(tx, ty, 1, tx, ty, 20); sg.addColorStop(0, `rgba(${c},.9)`); sg.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = sg; circle(tx, ty, 20);
          ctx.fillStyle = `rgb(${c})`; ctx.beginPath(); for (let k = 0; k < 8; k++){ const an = k*Math.PI/4 + t*3, r = k % 2 ? 4.5 : 11; k ? ctx.lineTo(tx + Math.cos(an)*r, ty + Math.sin(an)*r) : ctx.moveTo(tx + Math.cos(an)*r, ty + Math.sin(an)*r); } ctx.closePath(); ctx.fill(); ctx.fillStyle = '#fff'; circle(tx, ty, 3); }
        else { const jy = sea(th.x) + cy - 14 + Math.sin(t*2 + th.ph)*4; ctx.fillStyle = 'rgba(210,245,255,.85)'; ctx.beginPath(); ctx.arc(tx, jy, 18, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(160,230,255,.9)'; ctx.lineWidth = 2;
          for (let k = -2; k <= 2; k++){ ctx.beginPath(); ctx.moveTo(tx + k*6, jy); ctx.quadraticCurveTo(tx + k*6 + Math.sin(t*5 + k)*5, jy + 10, tx + k*6, jy + 18); ctx.stroke(); }
          ctx.fillStyle = '#1a1030'; circle(tx - 6, jy - 7, 2); circle(tx + 6, jy - 7, 2); ctx.strokeStyle = '#1a1030'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(tx, jy - 4, 3, .2, Math.PI - .2); ctx.stroke();
          if (hash(Math.floor(t*10) + th.ph) > .55){ ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; bolt(tx - 24, jy - 16, tx + 24, jy + 6, Math.floor(t*10)); } } }
      // your wake (a rainbow ribbon during a surge)
      ctx.lineCap = 'round'; for (let i = 1; i < trail.length; i++){ const p0 = trail[i - 1], p1 = trail[i]; ctx.lineWidth = surge ? 7 : 3; ctx.strokeStyle = surge ? `rgba(${BANDS[i % 6]},.85)` : `rgba(255,255,255,${i/trail.length*.6})`; ctx.beginPath(); ctx.moveTo(toS(p0.x), p0.y + cy - 4); ctx.lineTo(toS(p1.x), p1.y + cy - 4); ctx.stroke(); } ctx.lineCap = 'butt';
      // you, on your glow-board, tilted to the wave (or to where you're flying)
      if (!(inv > 0 && !surge && Math.floor(t*12) % 2)){
        const ang = ground ? Math.atan(slope(x)) : Math.atan2(vy, vx)*.8;
        ctx.save(); ctx.translate(SX, y + cy); ctx.rotate(ang);
        const bg = ctx.createRadialGradient(0, 0, 2, 0, 0, 44); bg.addColorStop(0, `rgba(90,220,255,${.35 + holdLook*.35})`); bg.addColorStop(1, 'rgba(90,220,255,0)'); ctx.fillStyle = bg; circle(0, 0, 44);
        ctx.fillStyle = surge ? `rgb(${BANDS[Math.floor(t*12) % 6]})` : '#5adcff'; ctx.beginPath(); ctx.ellipse(0, -3, 36, 6, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#ff6ad5'; ctx.fillRect(-28, -4.5, 56, 3);
        ctx.scale(1, 1 - holdLook*.15); Chin.draw(ctx, 'me', anim, 0, -7, { scale:.075, face:1, grounded:true, speed:0 }); ctx.restore(); }
      drawPops(0);
    },
    hud(){
      hudBar(); { const left = Math.max(0, TIDE_T - time); ctx.fillStyle = left < 10 ? '#ff8a9a' : '#5adcff'; ctx.fillText(`🌊 ${Math.ceil(left)}`, 24, 31); }
      ctx.fillStyle = '#fff6e4'; ctx.fillText(`${Math.floor(score)}`, 120, 31);
      for (let i = 0; i < 3; i++){ ctx.fillStyle = surge || i < smooth ? `rgb(${BANDS[i*2]})` : 'rgba(246,234,214,.18)'; circle(210 + i*18, 30, 6); }
      progress(x/GOAL, '#ff6ad5');
      ctx.textAlign = 'right'; ctx.fillStyle = surge ? '#ffb0ff' : 'rgba(246,234,214,.7)'; ctx.fillText(surge ? 'SURGE!' : `${Math.round(Math.hypot(vx, vy)/10)} knots`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ x += 240*dt; y = sea(x); vx = 240; vy = 0; ground = true; },
  };
})();

// ================= The Enchanted Kingdom: The Fairy Ring Game =================
// Fairies are hiding under the toadstools of the fairy ring. Lift two caps at a time to find
// matching pairs; matched fairies fly out and dance around the ring. Three rounds, bigger each time.
const FAIRYMEM = (() => {
  const KINDS = [
    { name:'Rose', col:'#f08aa8', wing:'rgba(255,200,220,.75)', mark:'♥' }, { name:'Bluebell', col:'#7aa0f0', wing:'rgba(200,220,255,.75)', mark:'✿' },
    { name:'Sunbeam', col:'#f2c94a', wing:'rgba(255,240,180,.75)', mark:'☀' }, { name:'Clover', col:'#6ac07a', wing:'rgba(200,255,210,.75)', mark:'♣' },
    { name:'Lavender', col:'#a080d8', wing:'rgba(230,210,255,.75)', mark:'❀' }, { name:'Moth', col:'#c8b090', wing:'rgba(240,230,210,.75)', mark:'☾' },
    { name:'Firefly', col:'#f6e870', wing:'rgba(255,255,200,.8)', mark:'✦' }, { name:'Dewdrop', col:'#7ad8e0', wing:'rgba(200,250,255,.75)', mark:'◆' },
    { name:'Starlight', col:'#ffffff', wing:'rgba(255,255,255,.8)', mark:'★' },
  ];
  const ROUNDS = [5, 7, 9];   // pairs in each round
  const CX = 400, CY = 318;
  let round, caps, open, cur, moves, waitT, done, roundT, stars, dancers, msg, msgT;
  function layout(n){
    // one ring of toadstools, or an outer and an inner ring for the big round
    const pos = [];
    if (n <= 14){ for (let i = 0; i < n; i++){ const a = -Math.PI/2 + i/n*Math.PI*2; pos.push([CX + Math.cos(a)*300, CY + Math.sin(a)*108]); } }
    else { const outer = 12, inner = n - outer; for (let i = 0; i < outer; i++){ const a = -Math.PI/2 + i/outer*Math.PI*2; pos.push([CX + Math.cos(a)*310, CY + Math.sin(a)*112]); }
      for (let i = 0; i < inner; i++){ const a = -Math.PI/2 + (i + .5)/inner*Math.PI*2; pos.push([CX + Math.cos(a)*165, CY + Math.sin(a)*58]); } }
    return pos;
  }
  function startRound(r){ round = r; const pairs = ROUNDS[r], kinds = KINDS.slice().sort(() => Math.random() - .5).slice(0, pairs);
    const deck = [...kinds, ...kinds].sort(() => Math.random() - .5), pos = layout(deck.length);
    caps = deck.map((k, i) => ({ k, x:pos[i][0], y:pos[i][1], lift:0, up:false, found:false })); open = []; cur = 0; moves = 0; waitT = 0; done = false; roundT = 0; dancers = []; say(['“Find the fairies hiding under the toadstools!”', '“More fairies have come to play!”', '“The whole fairy court is here! Can you find them all?”'][r]); }
  const say = (txt, d) => { msg = txt; msgT = d || 3; };
  function lift(i){
    const c = caps[i]; if (!c || c.found || c.up || open.length >= 2 || waitT > 0) return;
    c.up = true; open.push(i); anim.happy = .3;
    if (open.length === 2){ moves++; const [a, b] = open.map(j => caps[j]);
      if (a.k === b.k){ a.found = b.found = true; open = []; dancers.push({ k:a.k, ph:Math.random()*6, from:[a.x, a.y], t:0 }); pop(CX, 170, [`${a.k.name} fairies!`, 'A pair!', 'Hooray!'][moves % 3], '#fff6c8');
        if (caps.every(c => c.found)){ done = true; roundT = 0; const pairs = ROUNDS[round], s = moves <= pairs*1.6 ? 3 : moves <= pairs*2.3 ? 2 : 1; stars += s; say(['“Well found!”', '“Splendid! The fairies are dancing!”', '“Wonderful! You found every one!”'][s - 1], 2.6); } }
      else waitT = 1.1; }
  }
  return {
    title:'The Fairy Ring Game', sub:'Find the fairies hiding under the toadstools.',
    blurb:'At dusk the fairies of the Enchanted Kingdom play hide-and-seek under the toadstools of their fairy ring. Lift two caps at a time and find the matching pairs. Three rounds, each with more fairies.',
    legend:['Click a toadstool to lift its cap (or ← → and Space)', 'Lift two at a time: find the matching fairies', 'Matched fairies fly out and dance', 'Fewer tries earn more stars (up to 3 per round)'],
    hints:['Click a toadstool, or ← → and Space', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgAction'], actionLabel:'Lift', clicks:true,
    winTitle:'The fairies dance for you!', winText:'Every fairy is found, and the whole fairy court dances around you in a glowing ring until the moon is high.',
    loseTitle:'The fairies flew home', loseText:'The fairies giggle and fly off to bed. Come and play again!',
    reset(){ stars = 0; msg = ''; msgT = 0; startRound(0); },
    seeds:() => stars*2, stats:() => `<span>Stars ${stars}/9</span><span>Round ${round + 1}/3</span>`,
    update(dt){
      time += dt; msgT = Math.max(0, msgT - dt);
      for (const c of caps) c.lift += ((c.up || c.found ? 1 : 0) - c.lift)*Math.min(1, dt*9);
      for (const d of dancers) d.t += dt;
      const taps = input.taps.splice(0), click = input.click, press = input.pressed; input.click = null; input.pressed = false; input.keys.length = 0;
      if (done){ roundT += dt; if (roundT > 2.4){ if (round < ROUNDS.length - 1) startRound(round + 1); else finish(true); } return; }
      if (waitT > 0){ waitT -= dt; if (waitT <= 0){ for (const j of open) caps[j].up = false; open = []; } return; }
      const n = caps.length;
      for (const k of taps){ if (k === 'right' || k === 'down') cur = (cur + 1) % n; if (k === 'left' || k === 'up') cur = (cur + n - 1) % n; }
      if (press) lift(cur);
      if (click){ let best = -1, bd = 46; caps.forEach((c, i) => { const d = Math.hypot(click.x - c.x, click.y - (c.y - 22)); if (d < bd){ bd = d; best = i; } }); if (best >= 0){ cur = best; lift(best); } }
    },
    draw(){
      // a meadow at dusk, with fireflies and the moon
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a2a5a'); g.addColorStop(.45, '#6a5a9a'); g.addColorStop(.5, '#4a6a5a'); g.addColorStop(1, '#2a4a3a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++){ ctx.fillStyle = `rgba(255,255,240,${.3 + .5*Math.max(0, Math.sin(t*1.5 + i))})`; circle(hash(i)*W, hash(i + 4)*170, hash(i + 2)*1.3 + .4); }
      ctx.fillStyle = '#fff6d8'; circle(660, 70, 26); const mg = ctx.createRadialGradient(660, 70, 10, 660, 70, 90); mg.addColorStop(0, 'rgba(255,250,220,.4)'); mg.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = mg; circle(660, 70, 90);
      ctx.fillStyle = '#3a5a4a'; ctx.beginPath(); ctx.moveTo(0, 230); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 214 - Math.sin(x*.012)*14); ctx.lineTo(W, 240); ctx.lineTo(0, 240); ctx.fill();
      // the ring itself, worn into the grass and glowing faintly
      ctx.strokeStyle = `rgba(200,255,200,${.15 + .1*Math.sin(t*2)})`; ctx.lineWidth = 18; ctx.beginPath(); ctx.ellipse(CX, CY, 300, 108, 0, 0, 7); ctx.stroke();
      for (let i = 0; i < 18; i++){ const x = wrap(hash(i + 9)*W + Math.sin(t*.6 + i)*30, W), y = 240 + hash(i + 3)*220 + Math.sin(t + i)*8, a = .3 + .7*Math.max(0, Math.sin(t*2 + i*1.7)); const fg = ctx.createRadialGradient(x, y, 1, x, y, 10); fg.addColorStop(0, `rgba(240,255,160,${a})`); fg.addColorStop(1, 'rgba(240,255,160,0)'); ctx.fillStyle = fg; circle(x, y, 10); }
      // you, in the middle of the ring
      Chin.draw(ctx, 'me', anim, CX, CY + 30, { scale:.075, face:1, grounded:true, speed:0 });
      // the toadstools, back ones first
      const order = caps.map((c, i) => i).sort((a, b) => caps[a].y - caps[b].y);
      for (const i of order){ const c = caps[i], sel = i === cur && !done;
        if (sel){ ctx.fillStyle = 'rgba(255,240,160,.35)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 4, 34, 12, 0, 0, 7); ctx.fill(); }
        ctx.fillStyle = 'rgba(20,30,20,.35)'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 4, 24, 7, 0, 0, 7); ctx.fill();
        // the fairy under the cap (only seen when it's lifted)
        if (c.lift > .05 && !c.found){ fairy(c.x, c.y - 18, c.k, 1, 0); }
        ctx.fillStyle = '#f6efe0'; rr(c.x - 8, c.y - 24, 16, 26, 6); ctx.fill();
        if (!c.found || c.lift < .95){ const ly = c.y - 26 - c.lift*44, tilt = c.lift*.4*(i % 2 ? 1 : -1); ctx.save(); ctx.translate(c.x, ly); ctx.rotate(tilt); ctx.globalAlpha = c.found ? 1 - c.lift : 1;
          ctx.fillStyle = '#d0453f'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 18, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#b8352f'; ctx.fillRect(-26, -1, 52, 4);
          ctx.fillStyle = '#fff6e8'; for (const [dx, dy, r] of [[-12, -7, 4], [4, -12, 3.5], [14, -5, 3], [-2, -4, 2.5]]) circle(dx, dy, r); ctx.restore(); ctx.globalAlpha = 1; } }
      // found fairies dance around the ring
      dancers.forEach((d, i) => { const k = Math.min(1, d.t/1.2), a = d.ph + t*.7 + i*.7, tx = CX + Math.cos(a)*(200 + (i % 3)*40), ty = 150 + Math.sin(a*1.3)*40 + (i % 2)*20; fairy(d.from[0] + (tx - d.from[0])*k, d.from[1] - 20 + (ty - d.from[1] + 20)*k, d.k, .9, i); });
      if (msg && msgT > 0){ ctx.globalAlpha = Math.min(1, msgT*2); ctx.fillStyle = 'rgba(30,20,50,.75)'; rr(W/2 - 280, 62, 560, 34, 12); ctx.fill(); ctx.fillStyle = '#fff6e4'; ctx.font = 'italic 600 17px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(msg, W/2, 85); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
      drawPops(0);
    },
    hud(){
      hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Round ${round + 1}/3`, 24, 31);
      ctx.fillStyle = '#ffe066'; ctx.fillText(`★ ${stars}`, 160, 31);
      ctx.fillStyle = '#fff6e4'; ctx.fillText(`Pairs ${caps.filter(c => c.found).length/2}/${ROUNDS[round]}`, 260, 31);
      ctx.textAlign = 'right'; ctx.fillText(`Tries ${moves}`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
  // a little fairy with shimmering wings, her flower color and a mark on her dress
  function fairy(x, y, k, s, i){
    const flap = Math.sin(t*22 + i)*.5, bob = Math.sin(t*3 + i)*3;
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(s, s);
    const gl = ctx.createRadialGradient(0, 0, 2, 0, 0, 30); gl.addColorStop(0, k.wing); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; circle(0, 0, 30);
    ctx.fillStyle = k.wing; for (const sd of [-1, 1]){ ctx.save(); ctx.scale(sd, 1); ctx.rotate(-.3 + flap*.4); ctx.beginPath(); ctx.ellipse(10, -8, 12, 7, -.4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(8, 2, 8, 5, .3, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = k.col; ctx.beginPath(); ctx.moveTo(-7, 12); ctx.lineTo(7, 12); ctx.lineTo(3, -2); ctx.lineTo(-3, -2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f6dcc8'; circle(0, -7, 6); ctx.fillStyle = k.col; ctx.beginPath(); ctx.arc(0, -9, 6.5, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#3a2a3a'; circle(-2, -6, 1); circle(2, -6, 1);
    ctx.fillStyle = '#fff'; ctx.font = '700 8px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(k.mark, 0, 10); ctx.textAlign = 'left';
    ctx.restore();
  }
})();

// ================= The Enchanted Kingdom: The Royal Tournament =================
// Joust against three knights at the castle. Each pass you charge down the tilt on Pepper:
// keep your lance tip on the bullseye of their shield (↑ ↓), then strike (Space) when the
// marker crosses the gold. A great hit unhorses them; otherwise points decide each match.
const JOUST = (() => {
  const KNIGHTS = [
    { name:'Sir Hops', sheet:KNIGHT_RABBIT, cell:{ w:268, h:200, feet:.57 }, title:'the Bunny Knight', col:'#f0ece4', armor:'#c8ccd4', shield:'#5a8ad0', skill:.35, bob:16, kind:'bunny', hello:'“Sir Hops, at your service! Be gentle, I bruise like a carrot.”' },
    { name:'Sir Clank', sheet:KNIGHT_TURTLE, cell:{ w:289, h:200, feet:.49 }, title:'the Tortoise Knight', col:'#7a9a5a', armor:'#a8a088', shield:'#c8a040', skill:.55, bob:26, kind:'tortoise', hello:'“Sir… Clank. I am… very… fast. (He is not.)”' },
    { name:'The Black Knight', title:'(a badger, really)', col:'#3a3a40', armor:'#2a2a30', shield:'#7a2a3a', skill:.72, bob:38, kind:'badger', hello:'“None shall pass! Well… one might. We shall see.”' },
  ];
  const BARRIER = 330, MEET = 400;
  let ki, pass, myPts, theirPts, phase, phT, tipY, eye, meter, struck, quality, theirQ, result, shields, fall, splinters, cheer, flags;
  function startMatch(i){ ki = i; pass = 0; myPts = 0; theirPts = 0; newPass(); result = { big:KNIGHTS[i].name, small:KNIGHTS[i].title, sub:KNIGHTS[i].hello }; phase = 'herald'; phT = 0; }
  function newPass(){ phase = 'ready'; phT = 0; tipY = 0; meter = -1; struck = false; quality = 0; fall = 0; }
  // where the two riders are, from 0 (start of the run) to 1 (they meet)
  const runK = () => phase === 'charge' ? Math.min(1, phT/2.6) : phase === 'impact' ? 1 : 0;
  function eyeY(){ const k = KNIGHTS[ki]; return Math.sin(time*2.6 + ki)*k.bob + Math.sin(time*5.3)*k.bob*.25; }
  return {
    title:'The Royal Tournament', sub:'Joust for the honor of the Enchanted Kingdom.',
    blurb:'The bunny guard swings open the castle gate: it’s tournament day! Ride Pepper down the tilt against three knights. Aim your lance at their shield and strike at just the right moment.',
    legend:['↑ ↓ (or the mouse) to keep your lance tip on their shield’s bullseye', 'Press Space (or click) as the marker crosses the gold', 'A great hit unhorses them and wins the match', 'Otherwise the most points after 3 passes wins', 'Lose a match and it costs a shield: 3 shields'],
    hints:['↑ ↓ aim, Space to strike', 'P to pause'], pad:['wgUp', 'wgDown', 'wgAction'], actionLabel:'Strike!', clicks:true,
    winTitle:'Champion of the Realm!', winText:'The crowd throws roses, the bunny guard plays a fanfare on a very small trumpet, and the King crowns you Champion of the Realm.',
    loseTitle:'Out of shields', loseText:'Your last shield is dented beyond repair. Sir Hops helps you up: “Next tournament, friend!”',
    reset(){ shields = 3; splinters = []; cheer = 0; flags = 0; startMatch(0); },
    seeds:() => ki*4 + myPts, stats:() => `<span>Knights beaten ${phase === 'won' ? 3 : ki}/3</span><span>Shields left ${shields}</span>`,
    update(dt){
      time += dt; phT += dt; cheer = Math.max(0, cheer - dt);
      splinters.forEach(s => { s.x += s.vx*dt; s.y += s.vy*dt; s.vy += 500*dt; s.r += dt*8; }); splinters = splinters.filter(s => s.y < H + 20);
      const press = input.pressed || !!input.click; input.pressed = false; input.click = null;
      if (phase === 'herald'){ if (phT > 2.8 || (press && phT > .6)) newPass(); return; }
      if (phase === 'ready'){ if (phT > 1.3){ phase = 'charge'; phT = 0; } return; }
      if (phase === 'charge'){
        // aim with the keys or the mouse
        if (input.up) tipY -= 240*dt; if (input.down) tipY += 240*dt; if (input.aim && input.aim.y > 150 && input.aim.y < 420) tipY += ((input.aim.y - 300) - tipY)*Math.min(1, dt*10);
        tipY = clamp(tipY, -70, 70); eye = eyeY();
        // the strike meter sweeps across during the last stretch of the run
        if (phT > 1.4) meter = Math.min(1, (phT - 1.4)/1.1);
        if (press && meter >= 0 && !struck){ struck = true; quality = Math.max(0, 1 - Math.abs(meter - .78)/.22); }
        if (phT >= 2.6){
          const aim = Math.max(0, 1 - Math.abs(tipY - eye)/32), q = struck ? aim*(.35 + .65*quality) : aim*.25;
          const k = KNIGHTS[ki]; theirQ = Math.min(.95, Math.random()*.6 + k.skill*.55);
          const pts = q >= .72 ? 3 : q >= .45 ? 2 : q >= .18 ? 1 : 0, theirPts_ = theirQ >= .78 ? 2 : theirQ >= .4 ? 1 : 0;
          myPts += pts; theirPts += theirPts_; pass++;
          result = { pts, txt:['Missed!', 'A glancing blow', 'A solid hit!', 'UNHORSED!'][pts], them:theirPts_ };
          if (pts > 0){ shake = .25 + pts*.1; for (let i = 0; i < 6 + pts*5; i++) splinters.push({ x:MEET + 20, y:BARRIER - 70 + eye*.5, vx:(Math.random() - .3)*260, vy:-160 - Math.random()*200, r:Math.random()*6 }); }
          if (pts === 3){ fall = .01; cheer = 2.5; }
          phase = 'impact'; phT = 0; anim.happy = pts > 1 ? 1.5 : 0;
        }
        return; }
      if (phase === 'impact'){ if (fall) fall += dt;
        if (phT > 2){
          const unhorsed = result.pts === 3;
          if (unhorsed || pass >= 3){
            const won = unhorsed || myPts > theirPts || (myPts === theirPts && myPts > 0);
            if (won){ cheer = 2.5; if (ki >= KNIGHTS.length - 1){ phase = 'won'; phT = 0; result = { big:'Champion of the Realm!', small:'', sub:'“Huzzah!” cries the whole kingdom.' }; } else { result = { big:'Victory!', small:`${KNIGHTS[ki].name} bows to you.`, sub:'' }; phase = 'between'; phT = 0; } }
            else { shields--; if (shields <= 0){ phase = 'over'; phT = 0; result = { big:'Defeated…', small:'', sub:'' }; } else { result = { big:`${KNIGHTS[ki].name} wins this one`, small:`${myPts} to ${theirPts}. Try again!`, sub:'' }; phase = 'retry'; phT = 0; } }
          } else newPass();
        }
        return; }
      if (phase === 'between'){ if (phT > 2.4) startMatch(ki + 1); return; }
      if (phase === 'retry'){ if (phT > 2.4) startMatch(ki); return; }
      if (phase === 'won'){ if (phT > 2.6) finish(true); return; }
      if (phase === 'over'){ if (phT > 1.8) finish(false); return; }
    },
    draw(){
      const K = KNIGHTS[ki];
      // a bright tournament day below the castle
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#8ab8f0'); g.addColorStop(.5, '#cfe4f6'); g.addColorStop(1, '#e8f0e0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (const [cx, h] of [[120, 120], [180, 170], [250, 120]]){ ctx.fillStyle = '#c8c0e8'; ctx.fillRect(cx - 18, 210 - h, 36, h); ctx.fillStyle = '#7a6ac0'; ctx.beginPath(); ctx.moveTo(cx - 24, 210 - h); ctx.lineTo(cx, 170 - h); ctx.lineTo(cx + 24, 210 - h); ctx.fill(); ctx.fillStyle = '#e0464f'; ctx.beginPath(); ctx.moveTo(cx, 170 - h); ctx.lineTo(cx, 150 - h); ctx.lineTo(cx + 16, 156 - h + Math.sin(t*3 + cx)*3); ctx.lineTo(cx, 162 - h); ctx.fill(); }
      // the stands, full of cheering animals with little flags
      ctx.fillStyle = '#8a5a3a'; ctx.fillRect(300, 150, 500, 60); for (let k = 0; k < 7; k++){ ctx.fillStyle = k % 2 ? '#e0464f' : '#f2d23a'; ctx.beginPath(); ctx.moveTo(300 + k*72, 150); ctx.lineTo(372 + k*72, 150); ctx.lineTo(336 + k*72, 172); ctx.fill(); }
      for (let i = 0; i < 18; i++){ const x = 316 + i*27, hop = cheer > 0 ? Math.abs(Math.sin(t*12 + i))*8 : Math.abs(Math.sin(t*2 + i))*2; ctx.fillStyle = ['#c8a078', '#9a9aa4', '#f0ece4', '#a07050'][i % 4]; circle(x, 196 - hop, 9); circle(x - 6, 186 - hop, 3.5); circle(x + 6, 186 - hop, 3.5);
        if (i % 3 === 0){ ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 8, 192 - hop); ctx.lineTo(x + 12, 172 - hop); ctx.stroke(); ctx.fillStyle = i % 2 ? '#5a8ad0' : '#e0464f'; ctx.fillRect(x + 12, 172 - hop, 10, 6); } }
      // the tilt yard: grass, and the barrier the riders gallop along
      ctx.fillStyle = '#7ab070'; ctx.fillRect(0, 210, W, H - 210); ctx.fillStyle = '#c8b090'; ctx.fillRect(0, BARRIER + 40, W, 70);
      const rk = runK(), ease = rk*rk*(3 - 2*rk);
      // the knight coming the other way (on the far side of the barrier, so drawn first)
      if (K.sheet && K.sheet.complete && K.sheet.naturalWidth){
        // a knight with a sprite sheet: 12 gallop frames, flipped to face you; unhorsed, they tumble back
        const x = 760 - (760 - (MEET + 70))*ease, y = BARRIER + 12, C = K.cell, fr = phase === 'charge' ? Math.floor(time*18) % 12 : 0, hh = 176, ww = hh*C.w/C.h;
        ctx.save(); ctx.translate(x, y); ctx.scale(-1, 1);
        if (fall > 0){ ctx.translate(-Math.min(90, fall*130), -Math.sin(Math.min(1, fall*1.6)*Math.PI)*40); ctx.rotate(-Math.min(1.1, fall*2.4)); }
        ctx.drawImage(K.sheet, fr*C.w, 0, C.w, C.h, -ww*C.feet, -hh*.98, ww, hh);
        ctx.restore();
        if (fall > 0) for (let k = 0; k < 3; k++){ const q = t*6 + k*2.1; ctx.fillStyle = '#ffe066'; ctx.font = '700 16px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('✦', x + 60 + Math.cos(q)*26, y - 150 + Math.sin(q)*8); ctx.textAlign = 'left'; }
      } else
      { const x = 760 - (760 - (MEET + 70))*ease, y = BARRIER + 10, gal = phase === 'charge' ? Math.sin(t*16)*4 : 0, tip = fall > 0;
        ctx.save(); ctx.translate(x, y - Math.abs(gal)); ctx.scale(-.85, .85);
        const run = phase === 'charge' ? 1 : 0; ctx.fillStyle = '#7a5a44';
        [-34, -20, 18, 32].forEach((lx, j) => { const sw = Math.sin(t*16 + j*1.6)*10*run; ctx.save(); ctx.translate(lx, -30); ctx.rotate(sw*.04); ctx.fillRect(-4, 0, 8, 34); ctx.fillStyle = '#3a2a1e'; ctx.fillRect(-5, 30, 10, 6); ctx.fillStyle = '#7a5a44'; ctx.restore(); });
        ctx.beginPath(); ctx.ellipse(0, -44, 48, 22, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.moveTo(30, -56); ctx.lineTo(52, -96); ctx.lineTo(66, -90); ctx.lineTo(46, -46); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.ellipse(66, -94, 18, 10, .5, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(64, -98, 2); ctx.fillStyle = '#7a5a44'; ctx.beginPath(); ctx.moveTo(54, -102); ctx.lineTo(56, -114); ctx.lineTo(62, -103); ctx.fill();
        ctx.fillStyle = '#3a2a1e'; ctx.beginPath(); ctx.moveTo(32, -58); ctx.quadraticCurveTo(44, -96, 54, -104); ctx.lineTo(48, -90); ctx.quadraticCurveTo(40, -72, 36, -52); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-46, -48); ctx.quadraticCurveTo(-70, -40 + Math.sin(t*10)*6*run, -64, -14); ctx.quadraticCurveTo(-56, -30, -44, -40); ctx.fill();
        ctx.fillStyle = K.shield; ctx.fillRect(-44, -48, 88, 16);
        ctx.save(); if (tip){ ctx.translate(-10, -70); ctx.rotate(-Math.min(1.6, fall*3)); ctx.translate(Math.min(60, fall*90), -Math.sin(Math.min(1, fall*2)*Math.PI)*40 + Math.max(0, fall - .5)*100); ctx.translate(10, 70); }
        knight(0, -60, K); ctx.restore();
        ctx.restore(); }
      // the barrier
      ctx.fillStyle = '#e0464f'; ctx.fillRect(0, BARRIER, W, 12); ctx.fillStyle = '#f6efe0'; for (let x = 0; x < W; x += 40) ctx.fillRect(x, BARRIER, 20, 12); ctx.fillStyle = '#8a5a3a'; for (let x = 20; x < W; x += 120) ctx.fillRect(x, BARRIER + 12, 6, 30);
      // you on Pepper, galloping in from the left with your lance
      { const x = 60 + (MEET - 60 - 20)*ease, y = H - 26, cx = x;
        if (GALLOP.complete && GALLOP.naturalWidth){ const k = 150/G_CELL.h, fr = phase === 'charge' ? G_RUN[Math.floor(time*20) % G_RUN.length] : 0; ctx.drawImage(GALLOP, fr*G_CELL.w, 0, G_CELL.w, G_CELL.h, cx - G_CELL.w*k/2, y - G_CELL.feet*k, G_CELL.w*k, G_CELL.h*k);
          const sx = cx - G_CELL.w*k/2 + G_CELL.seatX*k, sy = y - G_CELL.feet*k + (G_CELL.SEAT[fr] + 4)*k; Chin.draw(ctx, 'me', anim, sx, sy, { scale:.07, face:1, grounded:true, speed:0 });
          // the lance, pointing at where you're aiming, and your shield
          const lx0 = sx + 10, ly0 = sy - 40, lx1 = MEET + 26 - (1 - ease)*120, ly1 = BARRIER - 70 + tipY*.9;
          ctx.strokeStyle = '#e8d8b0'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lx0 - 30, ly0 + 8); ctx.lineTo(lx1, ly1); ctx.stroke(); ctx.strokeStyle = '#e0464f'; ctx.lineWidth = 6; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(lx0 - 30, ly0 + 8); ctx.lineTo(lx1, ly1); ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
          ctx.fillStyle = '#c8a040'; ctx.beginPath(); ctx.moveTo(lx0 - 4, ly0 - 6); ctx.lineTo(lx0 + 14, ly0 - 6); ctx.lineTo(lx0 + 14, ly0 + 14); ctx.quadraticCurveTo(lx0 + 5, ly0 + 26, lx0 - 4, ly0 + 14); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e0464f'; ctx.fillRect(lx0 + 3, ly0 - 4, 4, 16);
          if (phase === 'charge'){ // the bullseye you're aiming for, and where your tip is
            const bx = MEET + 26, by = BARRIER - 70 + eye*.9; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(bx, by, 14, 0, 7); ctx.stroke(); ctx.fillStyle = '#ffe066'; circle(bx, by, 5);
            ctx.fillStyle = 'rgba(224,70,79,.9)'; circle(MEET + 26, BARRIER - 70 + tipY*.9, 4); } } }
      for (const s of splinters){ ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.r); ctx.fillStyle = '#e8d8b0'; ctx.fillRect(-6, -2, 12, 4); ctx.restore(); }
      // the strike meter
      if (phase === 'charge' && meter >= 0){ const mx = 250, my = 440, mw = 300; ctx.fillStyle = 'rgba(30,20,40,.7)'; rr(mx - 8, my - 16, mw + 16, 30, 10); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(mx, my - 6, mw, 10);
        ctx.fillStyle = '#ffe066'; ctx.fillRect(mx + mw*.62, my - 6, mw*.32, 10); ctx.fillStyle = '#fff6c8'; ctx.fillRect(mx + mw*.74, my - 6, mw*.08, 10);
        ctx.fillStyle = struck ? '#82ffa0' : '#fff'; ctx.fillRect(mx + mw*meter - 2, my - 12, 4, 22); ctx.fillStyle = '#fff'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(struck ? 'STRUCK!' : 'Space to strike!', mx + mw/2, my - 22); ctx.textAlign = 'left'; }
      // announcements
      let big = '', small = '';
      if (phase === 'herald' || phase === 'between' || phase === 'retry' || phase === 'won' || phase === 'over'){ big = result.big; small = result.small; }
      else if (phase === 'ready'){ big = phT < .8 ? `Pass ${pass + 1}` : 'CHARGE!'; small = `vs ${K.name}`; }
      else if (phase === 'impact'){ big = result.txt; small = `You +${result.pts}   ·   ${K.name} +${result.them}`; }
      if (big){ ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(30,20,40,.6)'; rr(W/2 - 230, 56, 460, small || (phase === 'herald' && result.sub) ? 84 : 52, 14); ctx.fill();
        ctx.fillStyle = '#ffe9a8'; ctx.font = 'italic 700 30px Georgia, serif'; ctx.fillText(big, W/2, 92); ctx.fillStyle = '#fff6e4'; ctx.font = 'italic 600 15px Georgia, serif'; if (small) ctx.fillText(small, W/2, 116);
        if (phase === 'herald' && result.sub){ ctx.fillStyle = 'rgba(30,20,40,.6)'; rr(W/2 - 300, 146, 600, 34, 12); ctx.fill(); ctx.fillStyle = '#fff6e4'; ctx.fillText(result.sub, W/2, 169); } ctx.textAlign = 'left'; }
      drawPops(0);
    },
    hud(){
      hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Knight ${ki + 1}/3`, 24, 31);
      for (let i = 0; i < 3; i++){ const x = 150 + i*24, on = i < shields; ctx.fillStyle = on ? '#c8a040' : 'rgba(246,234,214,.2)'; ctx.beginPath(); ctx.moveTo(x - 8, 22); ctx.lineTo(x + 8, 22); ctx.lineTo(x + 8, 32); ctx.quadraticCurveTo(x, 42, x - 8, 32); ctx.closePath(); ctx.fill(); }
      ctx.fillText(`You ${myPts}  ·  ${KNIGHTS[ki].name} ${theirPts}`, 250, 31);
      ctx.textAlign = 'right'; ctx.fillText(`Pass ${Math.min(3, pass + (phase === 'impact' ? 0 : 1))}/3`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
  // a knight in armor (an animal underneath), drawn facing right, around (x, y) at the waist
  function knight(x, y, K){
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = K.armor; rr(-14, -34, 28, 36, 8); ctx.fill(); ctx.fillStyle = K.shield; rr(-4, -28, 22, 26, 6); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 12px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(K.kind === 'badger' ? '✠' : K.kind === 'bunny' ? '✿' : '◆', 7, -10); ctx.textAlign = 'left';
    ctx.fillStyle = K.col; circle(4, -46, 13);
    if (K.kind === 'bunny'){ ctx.beginPath(); ctx.ellipse(-2, -70, 4, 14, -.2, 0, 7); ctx.ellipse(8, -70, 4, 14, .2, 0, 7); ctx.fill(); }
    if (K.kind === 'badger'){ ctx.fillStyle = '#f0f0f0'; ctx.fillRect(2, -58, 5, 22); }
    if (K.kind === 'tortoise'){ ctx.fillStyle = '#5a7a3a'; ctx.beginPath(); ctx.ellipse(-10, -20, 18, 22, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#3a5a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-18, -30); ctx.lineTo(-2, -10); ctx.moveTo(-18, -10); ctx.lineTo(-2, -30); ctx.stroke(); }
    ctx.fillStyle = K.armor; ctx.beginPath(); ctx.arc(4, -48, 14, Math.PI, 0); ctx.fill(); ctx.fillRect(-10, -50, 28, 4); ctx.fillStyle = '#e0464f'; ctx.beginPath(); ctx.moveTo(4, -62); ctx.quadraticCurveTo(-14, -78, -20, -60); ctx.quadraticCurveTo(-8, -66, 4, -60); ctx.fill();
    ctx.fillStyle = '#1a1a1a'; circle(12, -44, 2);
    ctx.restore();
  }
})();

// ================= The Enchanted Kingdom: Madame Hazel's Potions =================
// Madame Hazel (a hedgehog witch) has a line of customers. Ingredients tumble down from her
// shelves: slide the cauldron (← → or the mouse) to catch what the order needs. Catch a wrong
// one, or one of the old socks and boots, and the brew spoils. Five spoils and the shop closes.
const POTIONS = (() => {
  const ING = {
    dew:{ name:'Moon dew' }, lavender:{ name:'Lavender' }, star:{ name:'Star dust' }, mushroom:{ name:'Toadstool' },
    pepper:{ name:'Dragon pepper' }, honey:{ name:'Honeycomb' }, feather:{ name:'Rainbow feather' }, rose:{ name:'Rose petal' },
    sock:{ name:'Old sock', bad:true }, boot:{ name:'Old boot', bad:true },
  };
  const ORDERS = [
    { who:'knight', name:'Sir Clank', potion:'Get-Well Soup', need:{ pepper:2, honey:1, mushroom:1 }, col:'#e8803a', hello:'“I have… a terrible… cold. Achoo… clank.”', after:'Sir Clank’s armor turns toasty warm. “I feel… marvelous!”' },
    { who:'dragon', name:'Little Ember', potion:'Sleepy Tea', need:{ lavender:2, dew:1, honey:1 }, col:'#a08ad8', hello:'“I can’t get to sleep on my gold pile. It’s very lumpy.”', after:'Little Ember yawns a tiny puff of smoke and curls up for a nap.' },
    { who:'fairy', name:'Twinkle', potion:'Glow Potion', need:{ star:2, dew:2 }, col:'#f6e870', hello:'“My glow has gone all dim! Can you help?”', after:'Twinkle lights up so brightly the whole shop glows gold.' },
    { who:'bunny', name:'the Bunny Guard', potion:'Bravery Brew', need:{ pepper:1, rose:1, star:1, feather:1 }, col:'#e0464f', hello:'“I’m… a little scared of the dark. Don’t tell the King.”', after:'The bunny guard stands up very tall. “Nothing scares me now! …Except spiders.”' },
    { who:'unicorn', name:'Moonbeam', potion:'Rainbow Shine', need:{ feather:2, rose:1, star:1, lavender:1 }, col:'#ff9ad8', hello:'“My mane has lost its sparkle. It’s a mane emergency.”', after:'Moonbeam’s mane bursts into every color of the rainbow!' },
  ];
  const POT_Y = 418, TOP = 96;
  let oi, have, falling, spawnT, potX, potV, spoils, phase, phT, fizz, splash, bubbles, served, say_, sayT;
  const say = (txt, d) => { say_ = txt; sayT = d || 3; };
  function startOrder(i){ oi = i; have = {}; falling = []; spawnT = 1.2; phase = 'order'; phT = 0; say(ORDERS[i].hello, 3.2); }
  const needLeft = id => (ORDERS[oi].need[id] || 0) - (have[id] || 0);
  function spawn(){
    const O = ORDERS[oi], want = Object.keys(O.need).filter(id => needLeft(id) > 0);
    const r = Math.random(); let id;
    if (r < .5 && want.length) id = want[Math.floor(Math.random()*want.length)];
    else if (r < .66) id = Math.random() < .5 ? 'sock' : 'boot';
    else { const all = Object.keys(ING).filter(k => !ING[k].bad); id = all[Math.floor(Math.random()*all.length)]; }
    falling.push({ id, x:120 + Math.random()*560, y:TOP, vy:70 + Math.random()*50 + oi*12, sway:Math.random()*6, rot:0 });
  }
  return {
    title:'Madame Hazel’s Potions', sub:'Brew potions for the folk of the Enchanted Kingdom.',
    blurb:'Madame Hazel the hedgehog witch has a queue of customers and her hands full. Catch the ingredients each potion needs as they tumble from her shelves, but keep the old socks and boots out of the cauldron!',
    legend:['← → (or the mouse) to slide the cauldron', 'Catch what the order needs (shown in the bubble)', 'Wrong ingredients, socks and boots spoil the brew', 'Brew all five potions; five spoils and the shop closes'],
    hints:['← → or the mouse to move', 'P to pause'], pad:['wgLeft', 'wgRight'],
    winTitle:'Best potion shop in the kingdom!', winText:'Every customer leaves happy (and some of them glowing). Madame Hazel gives you a little hat of your own: “Apprentice witch, first class!”',
    loseTitle:'The shop is closed', loseText:'Too many spoiled brews! Madame Hazel laughs and opens a window to let the sock smell out. “Tomorrow, dear apprentice.”',
    reset(){ spoils = 0; served = 0; potX = W/2; potV = 0; fizz = 0; splash = []; bubbles = []; startOrder(0); },
    seeds:() => served*4, stats:() => `<span>Potions brewed ${served}/5</span><span>Spoiled ${spoils}</span>`,
    update(dt){
      time += dt; phT += dt; sayT = Math.max(0, sayT - dt); fizz = Math.max(0, fizz - dt);
      splash.forEach(s => { s.x += s.vx*dt; s.y += s.vy*dt; s.vy += 500*dt; s.life -= dt; }); splash = splash.filter(s => s.life > 0);
      if (Math.random() < dt*8) bubbles.push({ x:potX + (Math.random() - .5)*60, y:POT_Y - 40, life:1 }); bubbles.forEach(b => { b.y -= 30*dt; b.life -= dt; }); bubbles = bubbles.filter(b => b.life > 0);
      // the cauldron slides with a little weight to it
      const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0); if (ax) potV += ax*2600*dt; potV *= Math.pow(.002, dt);
      if (input.aim && !ax) potV += (input.aim.x - potX)*14*dt;
      potX = clamp(potX + potV*dt, 90, W - 90);
      if (phase === 'order'){ if (phT > 2.2){ phase = 'brew'; phT = 0; } return; }
      if (phase === 'serve'){ if (phT > 3){ if (oi < ORDERS.length - 1) startOrder(oi + 1); else { phase = 'done'; phT = 0; say('“Best apprentice I’ve ever had!”', 3); } } return; }
      if (phase === 'done'){ if (phT > 2) finish(true); return; }
      if (phase === 'closed'){ if (phT > 1.6) finish(false); return; }
      spawnT -= dt; if (spawnT <= 0){ spawnT = Math.max(.55, 1 - oi*.08); spawn(); }
      for (const f of falling){ f.y += f.vy*dt; f.x += Math.sin(time*2 + f.sway)*20*dt; f.rot += dt*2;
        if (!f.done && f.y > POT_Y - 56 && f.y < POT_Y - 20 && Math.abs(f.x - potX) < 58){ f.done = true;
          const O = ORDERS[oi];
          if (!ING[f.id].bad && needLeft(f.id) > 0){ have[f.id] = (have[f.id] || 0) + 1; anim.chew = .3; for (let k = 0; k < 6; k++) splash.push({ x:potX, y:POT_Y - 44, vx:(Math.random() - .5)*160, vy:-120 - Math.random()*100, life:.6, col:O.col });
            if (Object.keys(O.need).every(id => needLeft(id) <= 0)){ served++; phase = 'serve'; phT = 0; falling = []; anim.happy = 2; say(O.after, 3); return; } }
          else { spoils++; fizz = .8; shake = .25; have = {}; pop(potX, POT_Y - 90, ING[f.id].bad ? `Eww, ${ING[f.id].name.toLowerCase()}!` : `Not ${ING[f.id].name.toLowerCase()}!`, '#c8f0a0');
            say(ING[f.id].bad ? '“Oh dear, oh dear! Start that one again, dearie.”' : '“That’s not on the order! Start again, dearie.”', 2.2);
            if (spoils >= 5){ phase = 'closed'; phT = 0; } } } }
      falling = falling.filter(f => !f.done && f.y < H + 20);
    },
    draw(){
      const O = ORDERS[oi];
      // inside Madame Hazel's crooked little shop
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a2a4a'); g.addColorStop(1, '#5a4060'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 2; for (let y = 20; y < 430; y += 36){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); for (let x = (y/36 % 2)*40; x < W; x += 80){ ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 36); ctx.stroke(); } }
      // the high shelves the ingredients tumble off
      ctx.fillStyle = '#6b4a2b'; ctx.fillRect(60, TOP - 14, 680, 12);
      for (let i = 0; i < 12; i++){ const x = 84 + i*56; ctx.fillStyle = ['rgba(160,220,255,.7)', 'rgba(200,160,255,.7)', 'rgba(255,200,120,.7)', 'rgba(160,255,180,.7)'][i % 4]; rr(x - 12, TOP - 46, 24, 32, 6); ctx.fill(); ctx.fillStyle = '#8a6a48'; ctx.fillRect(x - 6, TOP - 52, 12, 8); }
      // hanging herbs and a window with the moon
      for (let i = 0; i < 6; i++){ const x = 40 + i*140; ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 26); ctx.stroke(); ctx.fillStyle = ['#7ab070', '#a080d8', '#c8a050'][i % 3]; for (let k = 0; k < 5; k++){ ctx.beginPath(); ctx.ellipse(x + (k - 2)*3, 32 + Math.abs(k - 2)*3, 3, 8, (k - 2)*.3, 0, 7); ctx.fill(); } }
      // Madame Hazel, the hedgehog witch, on the left
      hazel(112, 400);
      // the customer, on the right, with the order in a bubble
      customer(O.who, 690, 400, phase === 'serve');
      { const ids = Object.keys(O.need), bw = 40 + ids.length*58, bx = 690 - bw/2, by = 150; ctx.fillStyle = 'rgba(255,250,240,.96)'; rr(bx, by, bw, 92, 14); ctx.fill(); ctx.strokeStyle = O.col; ctx.lineWidth = 3; ctx.stroke();
        ctx.fillStyle = '#4a2a3a'; ctx.font = 'italic 700 15px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(O.potion, 690, by + 22);
        ids.forEach((id, k) => { const x = bx + 48 + k*58, left = Math.max(0, needLeft(id)); ingredient(id, x, by + 52, .8); ctx.fillStyle = left ? '#4a2a3a' : '#5ab870'; ctx.font = '700 13px Georgia, serif'; ctx.fillText(left ? `×${left}` : '✓', x, by + 84); });
        ctx.textAlign = 'left'; }
      // falling ingredients
      for (const f of falling){ ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(Math.sin(f.rot)*.4); ingredient(f.id, 0, 0, 1); ctx.restore(); }
      // you, pushing the cauldron along
      Chin.draw(ctx, 'me', anim, potX - 70, POT_Y + 40, { scale:.07, face:1, grounded:true, speed:Math.abs(potV) > 30 ? 200 : 0 });
      { const col = fizz > 0 ? '#9ad870' : Object.keys(have).length ? O.col : '#6a7aa0'; const pg = ctx.createRadialGradient(potX, POT_Y - 40, 4, potX, POT_Y - 40, 80); pg.addColorStop(0, col + '88'); pg.addColorStop(1, col + '00'); ctx.fillStyle = pg; circle(potX, POT_Y - 40, 80);
        ctx.fillStyle = '#2a2a32'; ctx.beginPath(); ctx.ellipse(potX, POT_Y, 62, 44, 0, 0, Math.PI); ctx.lineTo(potX - 62, POT_Y - 36); ctx.ellipse(potX, POT_Y - 36, 62, 12, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(potX, POT_Y - 36, 56, 9, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#3a3a44'; ctx.fillRect(potX - 70, POT_Y - 40, 140, 6);
        ctx.fillStyle = '#1a1a20'; for (const lx of [-40, 40]) ctx.fillRect(potX + lx - 4, POT_Y + 34, 8, 16);
        for (const b of bubbles){ ctx.strokeStyle = `rgba(255,255,255,${b.life*.6})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x, b.y, 4, 0, 7); ctx.stroke(); }
        if (fizz > 0){ ctx.fillStyle = `rgba(160,220,120,${fizz*.6})`; for (let k = 0; k < 5; k++) circle(potX - 40 + k*20, POT_Y - 60 - (1 - fizz)*60 - k*6, 14 + k*2); } }
      for (const s of splash){ ctx.fillStyle = s.col; ctx.globalAlpha = s.life*1.6; circle(s.x, s.y, 4); ctx.globalAlpha = 1; }
      if (say_ && sayT > 0){ ctx.globalAlpha = Math.min(1, sayT*2); ctx.font = 'italic 600 15px Georgia, serif'; const tw = Math.min(560, ctx.measureText(say_).width + 30); ctx.fillStyle = 'rgba(255,250,240,.95)'; rr(W/2 - tw/2, 262, tw, 32, 12); ctx.fill(); ctx.fillStyle = '#4a2a3a'; ctx.textAlign = 'center'; ctx.fillText(say_, W/2, 284, 540); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
      drawPops(0);
    },
    hud(){
      hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Potion ${Math.min(5, oi + 1)}/5`, 24, 31);
      ctx.fillText('Spoils', 170, 31); for (let i = 0; i < 5; i++){ ctx.fillStyle = i < spoils ? '#9ad870' : 'rgba(246,234,214,.2)'; circle(250 + i*20, 30, 7); }
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(ORDERS[oi].potion, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
  // ----- the cast and the ingredients -----
  function hazel(x, y){
    // Madame Hazel from her picture, swaying a little as she waves her staff over the brew
    if (!HAZEL_IMG.complete || !HAZEL_IMG.naturalWidth) return;
    const h = 200, w = h*HAZEL_IMG.naturalWidth/HAZEL_IMG.naturalHeight;
    ctx.save(); ctx.translate(x + 10, y); ctx.rotate(reduceMotion ? 0 : Math.sin(t*2.2)*.035); ctx.drawImage(HAZEL_IMG, -w*.55, -h, w, h); ctx.restore();
  }
  function customer(who, x, y, happy){
    const bob = Math.sin(t*2)*3; ctx.save(); ctx.translate(x, y + bob);
    if (who === 'knight'){ ctx.fillStyle = '#5a7a3a'; ctx.beginPath(); ctx.ellipse(-14, -50, 26, 34, 0, 0, 7); ctx.fill(); ctx.fillStyle = happy ? '#e8a060' : '#a8a088'; rr(-18, -96, 40, 70, 10); ctx.fill(); ctx.fillStyle = '#7a9a5a'; circle(0, -116, 16); ctx.fillStyle = '#a8a088'; ctx.beginPath(); ctx.arc(0, -118, 17, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(8, -112, 2); ctx.fillStyle = '#e0464f'; circle(14, -106, 3); }
    else if (who === 'dragon'){ ctx.fillStyle = '#5ab870'; ctx.beginPath(); ctx.ellipse(0, -36, 34, 30, 0, 0, 7); ctx.fill(); circle(-24, -80, 22); ctx.fillStyle = '#8ad89a'; ctx.beginPath(); ctx.ellipse(0, -30, 20, 18, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#4a9860'; ctx.beginPath(); ctx.moveTo(10, -60); ctx.lineTo(40, -92 + Math.sin(t*6)*6); ctx.lineTo(24, -52); ctx.fill(); ctx.fillStyle = '#1a1a1a'; if (happy){ ctx.fillRect(-36, -86, 10, 2); } else circle(-32, -86, 3); ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(-30, -100); ctx.lineTo(-26, -112); ctx.lineTo(-20, -100); ctx.fill(); }
    else if (who === 'fairy'){ const gl = ctx.createRadialGradient(0, -90, 4, 0, -90, happy ? 120 : 50); gl.addColorStop(0, 'rgba(255,240,150,.8)'); gl.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = gl; circle(0, -90, happy ? 120 : 50); ctx.fillStyle = 'rgba(220,240,255,.8)'; for (const sd of [-1, 1]){ ctx.beginPath(); ctx.ellipse(sd*18, -100, 18, 9, sd*.4 + Math.sin(t*20)*.2, 0, 7); ctx.fill(); } ctx.fillStyle = '#f6e870'; ctx.beginPath(); ctx.moveTo(-10, -70); ctx.lineTo(10, -70); ctx.lineTo(5, -96); ctx.lineTo(-5, -96); ctx.fill(); ctx.fillStyle = '#f6dcc8'; circle(0, -106, 9); ctx.fillStyle = '#1a1a1a'; circle(-3, -106, 1.4); circle(3, -106, 1.4); }
    else if (who === 'bunny'){ ctx.fillStyle = '#f6f0ff'; ctx.beginPath(); ctx.ellipse(0, -40, 26, 40, 0, 0, 7); ctx.fill(); circle(0, -96, 20); ctx.beginPath(); ctx.ellipse(-8, -130, 6, 22, -.1, 0, 7); ctx.ellipse(8, -130, 6, 22, .1, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(-6, -98, 2.4); circle(6, -98, 2.4); ctx.fillStyle = '#c9a13a'; ctx.fillRect(30, -150, 4, 150); ctx.beginPath(); ctx.moveTo(26, -150); ctx.lineTo(32, -170); ctx.lineTo(38, -150); ctx.fill(); if (happy){ ctx.fillStyle = '#e0464f'; ctx.beginPath(); ctx.moveTo(-24, -60); ctx.lineTo(24, -60); ctx.lineTo(0, -20); ctx.fill(); } }
    else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(10, -44, 38, 22, 0, 0, 7); ctx.fill(); for (const lx of [-16, -2, 22, 36]) ctx.fillRect(lx, -26, 8, 26); ctx.save(); ctx.translate(-20, -60); ctx.rotate(.5); ctx.fillRect(-8, -30, 18, 34); ctx.restore(); ctx.beginPath(); ctx.ellipse(-36, -90, 18, 12, -.4, 0, 7); ctx.fill(); ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(-36, -100); ctx.lineTo(-44, -128); ctx.lineTo(-30, -102); ctx.fill();
      const cols = happy ? ['#ff6a8a', '#f2a03a', '#f2d23a', '#5ab870', '#5a8ad0', '#a070d0'] : ['#d8d0e0', '#c8c0d0', '#d8d0e0']; cols.forEach((c, k) => { ctx.fillStyle = c; circle(-16 + k*6, -84 + k*5, 7); }); ctx.fillStyle = '#1a1a1a'; circle(-42, -92, 2.2); }
    ctx.restore();
  }
  function ingredient(id, x, y, s){
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (id === 'dew'){ ctx.fillStyle = '#8ad0ff'; ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(14, 4, 0, 12); ctx.quadraticCurveTo(-14, 4, 0, -16); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(-4, 0, 3); }
    else if (id === 'lavender'){ ctx.strokeStyle = '#6a9a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -14); ctx.stroke(); ctx.fillStyle = '#a080d8'; for (let k = 0; k < 6; k++){ circle(-3, -12 + k*4, 3); circle(3, -10 + k*4, 3); } }
    else if (id === 'star'){ ctx.fillStyle = '#ffe066'; ctx.beginPath(); for (let k = 0; k < 10; k++){ const a = -Math.PI/2 + k*Math.PI/5, r = k % 2 ? 6 : 14; k ? ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r); } ctx.closePath(); ctx.fill(); }
    else if (id === 'mushroom'){ ctx.fillStyle = '#f6efe0'; ctx.fillRect(-4, -2, 8, 14); ctx.fillStyle = '#d0453f'; ctx.beginPath(); ctx.ellipse(0, -2, 14, 11, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; circle(-5, -7, 2.4); circle(5, -9, 2); }
    else if (id === 'pepper'){ ctx.fillStyle = '#e0302a'; ctx.beginPath(); ctx.moveTo(-10, -8); ctx.quadraticCurveTo(14, -10, 10, 14); ctx.quadraticCurveTo(0, 2, -10, -8); ctx.fill(); ctx.fillStyle = '#5a9a3a'; ctx.fillRect(-12, -12, 6, 6); ctx.fillStyle = '#ffb020'; circle(4, 0, 2); }
    else if (id === 'honey'){ ctx.fillStyle = '#f2b030'; for (const [a, b] of [[-7, -6], [7, -6], [0, 6], [-14, 6], [14, 6]]){ ctx.beginPath(); for (let k = 0; k < 6; k++){ const q = k/6*Math.PI*2; ctx.lineTo(a + Math.cos(q)*7, b + Math.sin(q)*7); } ctx.closePath(); ctx.fill(); } }
    else if (id === 'feather'){ ['#e0464f', '#f2a03a', '#f2d23a', '#5ab870', '#5a8ad0'].forEach((c, k) => { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(-6 + k*3, -8 + k*4, 5, 9, .6, 0, 7); ctx.fill(); }); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, -14); ctx.lineTo(10, 16); ctx.stroke(); }
    else if (id === 'rose'){ ctx.fillStyle = '#f07a9a'; for (let k = 0; k < 5; k++){ const a = k/5*Math.PI*2; ctx.beginPath(); ctx.ellipse(Math.cos(a)*6, Math.sin(a)*6, 7, 5, a, 0, 7); ctx.fill(); } ctx.fillStyle = '#d04a6a'; circle(0, 0, 5); }
    else if (id === 'sock'){ ctx.fillStyle = '#c8c0a0'; ctx.beginPath(); ctx.moveTo(-6, -16); ctx.lineTo(6, -16); ctx.lineTo(6, 4); ctx.lineTo(14, 8); ctx.quadraticCurveTo(16, 16, 6, 16); ctx.lineTo(-6, 14); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#9a8a6a'; ctx.fillRect(-6, -16, 12, 5); ctx.fillStyle = '#8aaa5a'; ctx.globalAlpha = .7; circle(12, -14, 3); circle(16, -20, 2); ctx.globalAlpha = 1; }
    else if (id === 'boot'){ ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.moveTo(-8, -16); ctx.lineTo(6, -16); ctx.lineTo(6, 4); ctx.lineTo(16, 6); ctx.lineTo(16, 14); ctx.lineTo(-8, 14); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#3a2416'; ctx.fillRect(-8, 10, 24, 4); ctx.fillStyle = '#8aaa5a'; ctx.globalAlpha = .7; circle(10, -14, 3); ctx.globalAlpha = 1; }
    ctx.restore();
  }
})();

// ================= Thistledown: Baking with Grandma Wolf =================
// Bake three batches of treats with Grandma Wolf in her cottage kitchen. Every batch goes:
//   gather the ingredients from her shelves  ->  stir the dough  ->  scoop it onto the tray
//   ->  bake until golden  ->  decorate.
// Nothing can go wrong (Grandma says every cookie made with love is a good cookie), but each step
// done nicely earns a star, and you take home a plate of treats at the end.
const GRANNY_STAND = new Image(); GRANNY_STAND.src = 'characters/grandma-standing.png';
const BAKING = (() => {
  const ITEMS_ = [
    { id:'flour', name:'Flour' }, { id:'sugar', name:'Sugar' }, { id:'butter', name:'Butter' }, { id:'egg', name:'Eggs' }, { id:'cinnamon', name:'Cinnamon' },
    { id:'jam', name:'Jam' }, { id:'honey', name:'Honey' }, { id:'ginger', name:'Ginger' }, { id:'salt', name:'Salt' }, { id:'pickle', name:'Pickles' },
  ];
  const RECIPES = [
    { name:'Snickerdoodles', need:['flour', 'sugar', 'butter', 'egg', 'cinnamon'], dough:'#ecd2a0', baked:'#d9a462', deco:'cinnamon', decoTip:'Roll each one in cinnamon sugar',
      hello:'“Snickerdoodles first, dear. They were your great-grandpup’s favorite.”' },
    { name:'Jam Thumbprints', need:['flour', 'butter', 'sugar', 'jam'], dough:'#f2dcae', baked:'#e2b676', deco:'jam', decoTip:'Press a thumbprint and fill it with jam',
      hello:'“Now thumbprint cookies. Strawberry jam, of course. It’s the only jam.”' },
    { name:'Gingerbread Chinchillas', need:['flour', 'honey', 'ginger', 'butter', 'egg'], dough:'#c08850', baked:'#9a6232', deco:'icing', decoTip:'Give every chinchilla an icing face',
      hello:'“And last, gingerbread chinchillas. They’ll look just like you!”' },
  ];
  const JAR = i => ({ x:44 + (i % 5)*84, y:i < 5 ? 114 : 206, w:70, h:70 });
  const SPOTS = [[180, 356], [290, 356], [400, 356], [180, 398], [290, 398], [400, 398]];
  const BOWL = { x:300, y:318 };
  const OVEN = { x:690, y:392 };
  const WRONG = { salt:'“Salt? Only a pinch, dear… and not today.”', pickle:'“A pickle?! Oh my. Not in cookies, dear.”', jam:'“Jam! Lovely… but not for this batch.”', honey:'“Honey’s for the gingerbread, sweetheart.”', ginger:'“Ginger goes in the gingerbread, dear.”', cinnamon:'“Cinnamon is for the snickerdoodles.”', egg:'“No eggs in this one, dear.”', sugar:'“No extra sugar in this one, dear.”' };
  let ri, step, stepT, cur, got, wrongs, mix, mixT, lastDir, lastAng, spots, toolX, toolV, rowOff, bake, bakeT, decoN, stars, batchStars, talk, talkT, sparks, plate, crumbs, gaveCookies;
  const say = (txt, dur) => { talk = txt; talkT = dur || 3.4; };
  function startBatch(i){ ri = i; step = 'intro'; stepT = 0; cur = 0; got = []; wrongs = 0; mix = 0; mixT = 0; lastDir = null; lastAng = null; spots = SPOTS.map(([x, y]) => ({ x, y, on:false, off:0, deco:false })); toolX = 160; toolV = 220; rowOff = []; bake = 0; bakeT = 0; decoN = 0; batchStars = 0; say(RECIPES[i].hello, 3); }
  function next(){
    const R = RECIPES[ri];
    // each step pauses for a moment once it's done ("gathered", "mixed"…) before moving on
    step = { gathered:'gather', mixed:'mix', shaped:'shape', baked:'bake', decorated:'decorate' }[step] || step;
    if (step === 'intro'){ step = 'gather'; say(`“First, fetch everything on the recipe card from my shelves.”`); }
    else if (step === 'gather'){ if (!wrongs) batchStars++; step = 'mix'; mixT = 0; say('“Into the bowl! Now stir, stir, stir: ← ↑ → ↓ round and round.”'); }
    else if (step === 'mix'){ if (mixT < 8) batchStars++; step = 'shape'; say(R.name === 'Gingerbread Chinchillas' ? '“Now cut out the chinchillas. Press when the cutter is over a spot.”' : '“Now scoop little balls onto the tray. Press when the spoon is over a spot.”'); }
    else if (step === 'shape'){ const avg = spots.reduce((s, p) => s + p.off, 0)/spots.length; if (avg < 16) batchStars++; step = 'bake'; bake = 0; say('“Into the oven they go. Take them out when they’re golden brown!”'); }
    else if (step === 'bake'){ step = 'decorate'; say(`“Now the fun part. ${R.decoTip}!”`); }
    else if (step === 'decorate'){ step = 'serve'; stepT = 0; stars += batchStars;
      say([`“Every cookie made with love is a good cookie.”`, `“Mmm, lovely and homemade.”`, `“Delicious, dear! Just delicious.”`, `“Wonderful! Even better than mine.”`, `“PERFECT. Just like I make them!”`][batchStars], 3.6);
      for (let k = 0; k < 14; k++) crumbs.push({ x:640 + (Math.random() - .5)*30, y:170, vx:(Math.random() - .5)*90, vy:-80 - Math.random()*60, life:1.2 }); }
    else if (step === 'serve'){ if (ri < RECIPES.length - 1) startBatch(ri + 1); else { step = 'done'; stepT = 0; say('“What a lovely afternoon. Take some home with you, dear!”', 4); } }
  }
  // ----- little pictures -----
  function ingredient(id, x, y, s){
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (id === 'flour'){ ctx.fillStyle = '#f6f0e4'; ctx.beginPath(); ctx.moveTo(-18, 22); ctx.lineTo(-20, -10); ctx.quadraticCurveTo(0, -24, 20, -10); ctx.lineTo(18, 22); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#c8b898'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#c87a4a'; ctx.font = '700 9px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('FLOUR', 0, 10); }
    else if (id === 'sugar'){ ctx.fillStyle = 'rgba(220,235,245,.8)'; rr(-16, -18, 32, 40, 6); ctx.fill(); ctx.fillStyle = '#fff'; for (const [a, b] of [[-8, 4], [4, 6], [-2, -6], [8, -4], [-8, 14], [4, 14]]) ctx.fillRect(a - 4, b - 4, 8, 8); ctx.fillStyle = '#c87a4a'; ctx.fillRect(-18, -22, 36, 6); }
    else if (id === 'butter'){ ctx.fillStyle = '#e8e0d0'; ctx.fillRect(-22, 8, 44, 8); ctx.fillStyle = '#f6d86a'; ctx.beginPath(); ctx.moveTo(-18, 8); ctx.lineTo(-12, -6); ctx.lineTo(18, -6); ctx.lineTo(18, 8); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#e8c048'; ctx.fillRect(-18, 2, 36, 6); }
    else if (id === 'egg'){ ctx.fillStyle = '#c8a070'; rr(-22, 4, 44, 16, 4); ctx.fill(); for (const ex of [-11, 11]){ ctx.fillStyle = '#fbf3e6'; ctx.beginPath(); ctx.ellipse(ex, -2, 9, 12, 0, 0, 7); ctx.fill(); } }
    else if (id === 'cinnamon'){ ctx.fillStyle = '#8a4a2a'; for (const k of [-8, 0, 8]){ ctx.save(); ctx.rotate(k*.03); rr(k - 4, -20, 8, 40, 4); ctx.fill(); ctx.restore(); } ctx.fillStyle = '#6a3a1e'; ctx.fillRect(-14, -20, 28, 3); }
    else if (id === 'jam'){ ctx.fillStyle = '#c8303a'; rr(-15, -12, 30, 32, 6); ctx.fill(); ctx.fillStyle = '#f6efe0'; ctx.fillRect(-17, -20, 34, 9); ctx.fillStyle = '#e04050'; for (let k = 0; k < 4; k++) ctx.fillRect(-16 + k*9, -20, 4, 9); ctx.fillStyle = '#fff6e0'; ctx.fillRect(-9, -2, 18, 10); }
    else if (id === 'honey'){ ctx.fillStyle = '#e8a83a'; ctx.beginPath(); ctx.ellipse(0, 6, 18, 16, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#c88a2a'; ctx.fillRect(-14, -14, 28, 8); ctx.fillStyle = '#f6c860'; ctx.beginPath(); ctx.moveTo(-12, -6); ctx.quadraticCurveTo(-6, 4, -10, 10); ctx.quadraticCurveTo(-14, 4, -12, -6); ctx.fill(); }
    else if (id === 'ginger'){ ctx.fillStyle = '#d8b07a'; for (const [a, b, r] of [[-8, 4, 10], [6, 0, 9], [12, 10, 7], [-14, -8, 6], [2, -12, 6]]){ ctx.beginPath(); ctx.ellipse(a, b, r, r*.75, a*.05, 0, 7); ctx.fill(); } ctx.strokeStyle = 'rgba(120,80,40,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(-4, 6); ctx.moveTo(4, -2); ctx.lineTo(10, 2); ctx.stroke(); }
    else if (id === 'salt'){ ctx.fillStyle = '#f6f6f6'; rr(-12, -10, 24, 32, 6); ctx.fill(); ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.ellipse(0, -12, 12, 8, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#333'; for (const k of [-4, 0, 4]) circle(k, -15, 1.2); }
    else if (id === 'pickle'){ ctx.fillStyle = 'rgba(200,230,200,.7)'; rr(-15, -14, 30, 36, 6); ctx.fill(); ctx.fillStyle = '#5a8a3a'; for (const k of [-6, 6]){ ctx.beginPath(); ctx.ellipse(k, 4, 5, 13, k*.03, 0, 7); ctx.fill(); } ctx.fillStyle = '#c8a050'; ctx.fillRect(-17, -20, 34, 7); }
    ctx.restore();
  }
  function cookie(x, y, R, k, o = {}){
    const col = o.bake === undefined ? R.dough : lerpCol(R.dough, o.bake > 1 ? '#6a3a1e' : R.baked, o.bake > 1 ? Math.min(1, (o.bake - 1)*2) : o.bake);
    ctx.fillStyle = 'rgba(80,40,20,.18)'; ctx.beginPath(); ctx.ellipse(x + 2, y + 6, 22, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = col;
    if (R.name === 'Gingerbread Chinchillas'){ circle(x, y - 4, 13); circle(x - 9, y - 15, 6); circle(x + 9, y - 15, 6); ctx.beginPath(); ctx.ellipse(x, y + 10, 15, 10, 0, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(x, y, 20, 14, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(x - 6, y - 4, 8, 4, -.3, 0, 7); ctx.fill(); }
    if (o.deco){ if (R.deco === 'cinnamon'){ ctx.fillStyle = '#8a4a2a'; for (let j = 0; j < 9; j++) circle(x - 12 + hash(j + k*9)*24, y - 8 + hash(j + 3 + k*9)*16, 1.4); ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let j = 0; j < 7; j++) circle(x - 12 + hash(j + 40 + k)*24, y - 8 + hash(j + 50 + k)*16, 1.2); }
      else if (R.deco === 'jam'){ ctx.fillStyle = 'rgba(80,40,20,.25)'; ctx.beginPath(); ctx.ellipse(x, y - 1, 8, 6, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#d0303e'; ctx.beginPath(); ctx.ellipse(x, y - 2, 7, 5, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(x - 2, y - 4, 1.6); }
      else { ctx.strokeStyle = '#fbf3e6'; ctx.lineWidth = 2; ctx.fillStyle = '#fbf3e6'; circle(x - 5, y - 6, 2); circle(x + 5, y - 6, 2); ctx.beginPath(); ctx.arc(x, y - 1, 4, .3, Math.PI - .3); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 10, y + 8); ctx.quadraticCurveTo(x - 5, y + 4, x, y + 8); ctx.quadraticCurveTo(x + 5, y + 12, x + 10, y + 8); ctx.stroke(); } }
  }
  function lerpCol(a, b, k){ const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16)), pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16)); return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v)*clamp(k, 0, 1))).join(',')})`; }
  function grandma(x, y, h){
    if (!GRANNY_STAND.complete || !GRANNY_STAND.naturalWidth) return;
    const w = h*GRANNY_STAND.naturalWidth/GRANNY_STAND.naturalHeight, breathe = reduceMotion ? 0 : Math.sin(t*2)*.012, nod = talkT > 0 && !reduceMotion ? Math.sin(t*9)*.02 : 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(nod); ctx.scale(1 - breathe*.4, 1 + breathe); ctx.drawImage(GRANNY_STAND, -w/2, -h, w, h); ctx.restore();
  }
  function bubble(txt, x, y, w){
    ctx.font = 'italic 600 14px Georgia, serif'; const words = txt.split(' '), lines = []; let line = '';
    for (const wd of words){ const tt = line ? line + ' ' + wd : wd; if (ctx.measureText(tt).width > w - 28 && line){ lines.push(line); line = wd; } else line = tt; } lines.push(line);
    const h = lines.length*18 + 18; ctx.fillStyle = 'rgba(255,250,240,.97)'; rr(x - w, y - h, w, h, 14); ctx.fill(); ctx.strokeStyle = '#c8a078'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 30, y - 2); ctx.lineTo(x - 6, y + 14); ctx.lineTo(x - 12, y - 2); ctx.closePath(); ctx.fillStyle = 'rgba(255,250,240,.97)'; ctx.fill();
    ctx.fillStyle = '#5a3a24'; lines.forEach((l, i) => ctx.fillText(l, x - w + 14, y - h + 22 + i*18));
  }
  return {
    title:'Baking with Grandma Wolf', sub:'Cookies and treats in Grandma’s cottage kitchen.',
    blurb:'Grandma Wolf has her apron on and the oven warming. Bake three batches of treats together: snickerdoodles, jam thumbprints and gingerbread chinchillas. Every step done nicely earns a star, and you take a plate home at the end.',
    legend:['Gather: click the jars on the recipe card (or ← → ↑ ↓ and Space)', 'Stir: press ← ↑ → ↓ round and round, or circle the mouse over the bowl', 'Scoop: press Space (or click) when the spoon is over a spot', 'Bake: take them out (Space) when they’re golden', 'Decorate: click each treat (or press Space)'],
    hints:['Arrows and Space, or the mouse', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgUp', 'wgDown', 'wgAction'], actionLabel:'Go', clicks:true,
    winTitle:'A plate of treats!', winText:'You and Grandma Wolf share a pot of tea and a plate of everything you baked. She wraps up the rest for you to take home.',
    loseTitle:'Out of flour', loseText:'Grandma pats your head. “We’ll bake another day, dear.”',
    reset(){ stars = 0; sparks = []; crumbs = []; plate = []; gaveCookies = false; startBatch(0); },
    seeds:() => stars*2, stats:() => `<span>Stars ${stars}/12</span><span>Treats baked ${Math.min(18, (ri + (step === 'done' ? 1 : 0))*6)}</span>`,
    end:() => ({ title:stars >= 10 ? 'Master bakers!' : 'A plate of treats!', text:`You and Grandma Wolf share a pot of tea and a plate of everything you baked (${stars} of 12 stars). She wraps the rest in a checkered cloth for you to take home.` }),
    update(dt){
      time += dt; stepT += dt; talkT = Math.max(0, talkT - dt);
      sparks.forEach(s => { s.x += s.vx*dt; s.y += s.vy*dt; s.vy += 200*dt; s.life -= dt; }); sparks = sparks.filter(s => s.life > 0);
      crumbs.forEach(s => { s.x += s.vx*dt; s.y += s.vy*dt; s.vy += 300*dt; s.life -= dt; }); crumbs = crumbs.filter(s => s.life > 0);
      const taps = input.taps.splice(0), keys = input.keys.splice(0), click = input.click, press = input.pressed; input.click = null; input.pressed = false;
      const R = RECIPES[ri];
      if (step === 'intro'){ if (stepT > 2.6) next(); return; }
      if (step === 'gather'){
        for (const k of taps){ if (k === 'left') cur = (cur + 9) % 10; if (k === 'right') cur = (cur + 1) % 10; if (k === 'up' || k === 'down') cur = (cur + 5) % 10; }
        let pick = press ? cur : -1;
        if (click){ const i = ITEMS_.findIndex((it, i) => { const j = JAR(i); return click.x > j.x && click.x < j.x + j.w && click.y > j.y && click.y < j.y + j.h; }); if (i >= 0){ cur = i; pick = i; } }
        if (pick >= 0){ const id = ITEMS_[pick].id;
          if (R.need.includes(id) && !got.includes(id)){ got.push(id); anim.happy = .6; const j = JAR(pick); sparks.push({ x:j.x + 35, y:j.y + 30, vx:(BOWL.x - j.x - 35)*1.6, vy:-180, life:.6, id });
            if (got.length === R.need.length){ step = 'gathered'; stepT = 0; say('“That’s everything! Clever thing.”', 1.6); } else say(['“Yes, that one!”', '“Good, dear.”', '“Just right.”', '“Perfect.”'][got.length % 4], 1.4); }
          else if (got.includes(id)) say('“We already have that one, dear.”', 1.8);
          else { wrongs++; say(WRONG[id] || '“Hmm, not that one, dear.”', 2.6); shake = .15; } }
        return; }
      if (step === 'gathered'){ if (stepT > 1.2) next(); return; }
      if (step === 'mix'){ mixT += dt;
        for (const k of taps){ if (k !== lastDir){ mix += 1/24; lastDir = k; } }
        if (input.aim && Math.hypot(input.aim.x - BOWL.x, input.aim.y - (BOWL.y + 10)) < 170){ const a = Math.atan2(input.aim.y - (BOWL.y + 10), input.aim.x - BOWL.x); if (lastAng !== null){ let d = a - lastAng; if (d > Math.PI) d -= Math.PI*2; if (d < -Math.PI) d += Math.PI*2; mix += Math.abs(d)/(Math.PI*2)/3; } lastAng = a; }
        if (click && Math.hypot(click.x - BOWL.x, click.y - BOWL.y) < 90) mix += 1/24;
        if (mix >= 1){ mix = 1; step = 'mixed'; stepT = 0; say('“Lovely smooth dough!”', 1.6); }
        return; }
      if (step === 'mixed'){ if (stepT > 1.2) next(); return; }
      if (step === 'shape'){
        const row = spots.findIndex(p => !p.on) < 3 ? 0 : 1;
        toolX += toolV*dt; if (toolX > 450){ toolX = 450; toolV = -Math.abs(toolV); } if (toolX < 130){ toolX = 130; toolV = Math.abs(toolV); }
        if (press || click){ const free = spots.filter((p, i) => !p.on && (i < 3 ? 0 : 1) === row); if (free.length){ const best = free.reduce((m, p) => Math.abs(p.x - toolX) < Math.abs(m.x - toolX) ? p : m); best.on = true; best.off = Math.abs(best.x - toolX); anim.chew = .3;
            if (best.off < 12) sparks.push(...[0, 1, 2, 3, 4].map(k => ({ x:best.x, y:best.y - 10, vx:Math.cos(k*1.26)*80, vy:-60 - Math.sin(k*1.26)*40, life:.5, star:true }))); }
          if (spots.every(p => p.on)){ step = 'shaped'; stepT = 0; say('“Nice and neat!”', 1.4); } }
        return; }
      if (step === 'shaped'){ if (stepT > 1.1) next(); return; }
      if (step === 'bake'){ bake += dt/7; if (press || click || bake >= 1.45){ const golden = bake > .74 && bake < .96; if (golden){ batchStars++; say('“Golden brown! Perfect.”', 1.8); } else say(bake < .74 ? '“A little pale… but soft and chewy!”' : '“A little crispy… just how Grandpa liked them.”', 2.2); bakeT = bake; step = 'baked'; stepT = 0; } return; }
      if (step === 'baked'){ if (stepT > 1.4) next(); return; }
      if (step === 'decorate'){
        let pick = -1; if (press) pick = spots.findIndex(p => !p.deco); for (const k of keys){ const i = +k - 1; if (i >= 0 && i < 6) pick = i; }
        if (click){ const i = spots.findIndex(p => Math.hypot(click.x - p.x, click.y - p.y) < 26); if (i >= 0) pick = i; }
        if (pick >= 0 && !spots[pick].deco){ spots[pick].deco = true; decoN++; anim.happy = .5; sparks.push(...[0, 1, 2, 3, 4, 5].map(k => ({ x:spots[pick].x, y:spots[pick].y - 6, vx:Math.cos(k*1.05)*70, vy:-50 - Math.sin(k*1.05)*50, life:.6, star:true }))); }
        if (spots.every(p => p.deco)){ step = 'decorated'; stepT = 0; say('“Oh, they’re beautiful!”', 1.4); }
        return; }
      if (step === 'decorated'){ if (stepT > 1.2) next(); return; }
      if (step === 'serve'){ if (stepT > 3.8 || ((press || click) && stepT > 1)) next(); return; }
      if (step === 'done'){ if (!gaveCookies){ gaveCookies = true; try { Save.give('grannycookies'); } catch (e) {} } if (stepT > 3) finish(true); }
    },
    draw(){
      const R = RECIPES[ri];
      // the cottage kitchen: rosy wallpaper, a window, shelves of ingredients
      for (let x = 0; x < W; x += 40){ ctx.fillStyle = (x/40) % 2 ? '#f0dfe0' : '#f6e8e6'; ctx.fillRect(x, 0, 40, 330); }
      for (let x = 20; x < W; x += 80) for (let y = 30; y < 300; y += 70){ ctx.fillStyle = '#e8b8c4'; for (let k = 0; k < 5; k++){ const a = k/5*Math.PI*2; circle(x + Math.cos(a)*3.5, y + Math.sin(a)*3.5, 2.2); } }
      ctx.fillStyle = '#6b4a2b'; ctx.fillRect(0, 0, W, 18);
      for (const sy of [186, 278]){ ctx.fillStyle = '#8a6448'; ctx.fillRect(30, sy, 440, 10); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(40, sy + 10, 8, 14); ctx.fillRect(452, sy + 10, 8, 14); }
      ITEMS_.forEach((it, i) => { const j = JAR(i), used = got.includes(it.id), sel = step === 'gather' && cur === i;
        if (sel){ ctx.fillStyle = 'rgba(255,230,160,.6)'; rr(j.x - 4, j.y - 4, j.w + 8, j.h + 8, 10); ctx.fill(); }
        ctx.globalAlpha = used ? .3 : 1; ingredient(it.id, j.x + j.w/2, j.y + j.h/2 - 4, 1); ctx.globalAlpha = 1;
        ctx.fillStyle = '#5a3a24'; ctx.font = 'italic 600 11px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(it.name, j.x + j.w/2, j.y + j.h + 2); ctx.textAlign = 'left'; });
      // the recipe card, pinned to the wall
      { const cx = 484, cy = 118, cw = 128, ch = 50 + R.need.length*22; ctx.save(); ctx.translate(cx + cw/2, cy); ctx.rotate(-.03); ctx.translate(-cx - cw/2, -cy);
        ctx.fillStyle = '#fffaf0'; ctx.fillRect(cx, cy, cw, ch); ctx.strokeStyle = '#d8a0a8'; ctx.lineWidth = 1; for (let y = cy + 34; y < cy + ch; y += 22){ ctx.beginPath(); ctx.moveTo(cx + 6, y); ctx.lineTo(cx + cw - 6, y); ctx.stroke(); }
        ctx.fillStyle = '#c8303a'; circle(cx + cw/2, cy + 6, 4);
        ctx.fillStyle = '#5a3a24'; ctx.font = 'italic 700 13px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText(R.name, cx + cw/2, cy + 26, cw - 10); ctx.textAlign = 'left';
        R.need.forEach((id, k) => { const y = cy + 48 + k*22, done = got.includes(id); ctx.fillStyle = done ? '#7a9a6a' : '#5a3a24'; ctx.font = '600 13px Georgia, serif'; ctx.fillText(`${done ? '✓' : '○'}  ${ITEMS_.find(it => it.id === id).name}`, cx + 12, y); });
        ctx.restore(); }
      // Grandma Wolf, behind the counter
      grandma(694, 352, 250);
      // the counter
      ctx.fillStyle = '#c89a6a'; ctx.fillRect(0, 330, W, 16); ctx.fillStyle = '#a07a52'; ctx.fillRect(0, 346, W, H - 346);
      ctx.strokeStyle = 'rgba(60,36,20,.25)'; ctx.lineWidth = 2; for (let x = 10; x < 590; x += 100) ctx.strokeRect(x, 360, 86, 104);
      // the oven, with its window glowing while the treats bake
      { const ox = OVEN.x, oy = OVEN.y; ctx.fillStyle = '#3a3438'; rr(ox - 100, oy - 40, 200, 100, 8); ctx.fill(); ctx.fillStyle = '#4a444a'; ctx.fillRect(ox - 100, oy - 44, 200, 10);
        const glow = step === 'bake' ? 1 : .25, og = ctx.createLinearGradient(0, oy - 26, 0, oy + 30); og.addColorStop(0, `rgba(255,170,90,${glow})`); og.addColorStop(1, `rgba(220,90,30,${glow})`); ctx.fillStyle = og; rr(ox - 76, oy - 26, 152, 56, 6); ctx.fill();
        if (step === 'bake'){ for (let k = 0; k < 3; k++) cookie(ox - 46 + k*46, oy + 6, R, k, { bake }); }
        ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ox - 50, oy + 46); ctx.lineTo(ox + 50, oy + 46); ctx.stroke(); }
      // the mixing bowl
      if (['intro', 'gather', 'gathered', 'mix', 'mixed'].includes(step)){
        const bx = BOWL.x, by = BOWL.y;
        ctx.fillStyle = '#e8d8c8'; ctx.beginPath(); ctx.moveTo(bx - 70, by - 10); ctx.quadraticCurveTo(bx - 66, by + 26, bx, by + 28); ctx.quadraticCurveTo(bx + 66, by + 26, bx + 70, by - 10); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#5a8aa0'; ctx.fillRect(bx - 66, by + 2, 132, 6);
        if (got.length){ const k = step === 'mix' || step === 'mixed' ? mix : 0; ctx.fillStyle = lerpCol('#f6efe4', R.dough, k); ctx.beginPath(); ctx.ellipse(bx, by - 10, 64, 10, 0, 0, 7); ctx.fill();
          if (k < 1) got.forEach((id, i) => { ctx.save(); ctx.translate(bx - 36 + i*18, by - 14); ctx.rotate(k*12 + i); ingredient(id, 0, 0, .35); ctx.restore(); }); }
        if (step === 'mix'){ const a = mix*Math.PI*2*6; ctx.strokeStyle = '#a07a52'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx + Math.cos(a)*34, by - 10 + Math.sin(a)*6); ctx.lineTo(bx + Math.cos(a)*20 + 30, by - 90); ctx.stroke(); ctx.lineCap = 'butt';
          ctx.fillStyle = 'rgba(0,0,0,.2)'; rr(bx - 70, by + 36, 140, 12, 6); ctx.fill(); ctx.fillStyle = '#e8a050'; rr(bx - 70, by + 36, 140*mix, 12, 6); ctx.fill();
          ctx.fillStyle = '#fff6e4'; ctx.font = 'italic 700 20px Georgia, serif'; ctx.fillText('stir!  ' + ['←', '↑', '→', '↓'][Math.floor(t*4) % 4], bx + 96, by + 30); } }
      // the baking tray, for scooping and decorating
      if (['shape', 'shaped', 'decorate', 'decorated'].includes(step)){
        ctx.fillStyle = '#9aa0a8'; rr(130, 328, 320, 98, 8); ctx.fill(); ctx.fillStyle = '#b8bec6'; rr(136, 334, 308, 86, 6); ctx.fill();
        spots.forEach((p, i) => { if (!p.on){ ctx.strokeStyle = 'rgba(90,96,104,.5)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y, 20, 13, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
          else cookie(p.x, p.y, R, i, { bake:step.startsWith('decor') ? bakeT : undefined, deco:p.deco });
          if (step === 'decorate' && !p.deco){ ctx.fillStyle = '#5a3a24'; ctx.font = '700 11px Georgia, serif'; ctx.fillText(String(i + 1), p.x + 18, p.y - 10); } });
        if (step === 'shape'){ const row = spots.findIndex(p => !p.on) < 3 ? 0 : 1, ty = SPOTS[row*3][1] - 34;
          if (R.name === 'Gingerbread Chinchillas'){ ctx.strokeStyle = '#8a8a90'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(toolX, ty + 6, 14, 0, 7); ctx.moveTo(toolX - 4, ty - 8); ctx.arc(toolX - 9, ty - 6, 6, 0, 7); ctx.moveTo(toolX + 15, ty - 6); ctx.arc(toolX + 9, ty - 6, 6, 0, 7); ctx.stroke(); }
          else { ctx.strokeStyle = '#a07a52'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(toolX + 10, ty - 6); ctx.lineTo(toolX + 50, ty - 50); ctx.stroke(); ctx.fillStyle = '#c8c8d0'; ctx.beginPath(); ctx.ellipse(toolX, ty, 16, 10, 0, 0, 7); ctx.fill(); ctx.fillStyle = R.dough; circle(toolX, ty - 4, 10); }
          ctx.strokeStyle = 'rgba(90,58,36,.4)'; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(toolX, ty + 12); ctx.lineTo(toolX, SPOTS[row*3][1]); ctx.stroke(); ctx.setLineDash([]); } }
      // the bake meter under the oven: pale, golden, crispy
      if (step === 'bake' || step === 'baked'){ const mx = OVEN.x - 90, my = 470, mw = 180, b = step === 'bake' ? bake : bakeT;
        const g = ctx.createLinearGradient(mx, 0, mx + mw, 0); g.addColorStop(0, R.dough); g.addColorStop(.6, R.baked); g.addColorStop(1, '#5a3018'); ctx.fillStyle = g; rr(mx, my - 10, mw, 10, 5); ctx.fill();
        ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 2; ctx.strokeRect(mx + mw*.74/1.45, my - 12, mw*(.22/1.45), 14);
        ctx.fillStyle = '#3a2416'; const px = mx + mw*Math.min(1, b/1.45); ctx.beginPath(); ctx.moveTo(px, my - 12); ctx.lineTo(px - 6, my - 22); ctx.lineTo(px + 6, my - 22); ctx.fill(); }
      // you, at the counter
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 336); ctx.clip(); Chin.draw(ctx, 'me', anim, 84, 358, { scale:.09, face:1, grounded:true, speed:0 }); ctx.restore();
      // ingredients flying into the bowl, sparkles, crumbs
      for (const s of sparks){ ctx.globalAlpha = Math.min(1, s.life*2); if (s.id) ingredient(s.id, s.x, s.y, .5); else { ctx.fillStyle = '#ffe066'; ctx.font = '700 12px Georgia, serif'; ctx.fillText('✦', s.x, s.y); } ctx.globalAlpha = 1; }
      for (const c of crumbs){ ctx.fillStyle = `rgba(200,150,90,${c.life})`; circle(c.x, c.y, 2.5); }
      // the finished plate
      if (step === 'serve' || step === 'done'){ ctx.fillStyle = 'rgba(40,20,10,.35)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#f6f2ea'; ctx.beginPath(); ctx.ellipse(400, 300, 170, 50, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#7aa0c8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(400, 300, 150, 40, 0, 0, 7); ctx.stroke();
        const batches = step === 'done' ? RECIPES : [R]; let k = 0; for (const B of batches) for (let i = 0; i < 6; i++, k++){ const n = batches.length*6, a = k/n*Math.PI*2; cookie(400 + Math.cos(a)*(batches.length > 1 ? 100 : 80), 296 + Math.sin(a)*24, B, k, { bake:B === R ? (bakeT || .85) : .85, deco:true }); }
        ctx.textAlign = 'center'; ctx.fillStyle = '#fff6e4'; ctx.font = 'italic 700 30px Georgia, serif'; ctx.fillText(step === 'done' ? 'A plate of treats!' : R.name, 400, 200);
        if (step === 'serve'){ ctx.font = '700 30px Georgia, serif'; for (let i = 0; i < 4; i++){ ctx.fillStyle = i < batchStars ? '#ffe066' : 'rgba(255,255,255,.3)'; ctx.fillText('★', 340 + i*40, 245); } }
        ctx.textAlign = 'left'; }
      if (talk && talkT > 0){ ctx.globalAlpha = Math.min(1, talkT*3); bubble(talk, 604, 106, 470); ctx.globalAlpha = 1; }
      drawPops(0);
    },
    hud(){
      hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Batch ${ri + 1}/3`, 24, 31);
      ctx.fillStyle = '#ffe066'; ctx.fillText(`★ ${stars + (step === 'serve' || step === 'done' ? 0 : batchStars)}`, 140, 31);
      const steps = ['gather', 'mix', 'shape', 'bake', 'decorate'], names = ['Gather', 'Stir', 'Scoop', 'Bake', 'Decorate'], si = steps.findIndex(s => step.startsWith(s.slice(0, 4)));
      ctx.font = '700 13px "Pixelify Sans", monospace'; names.forEach((n, i) => { ctx.fillStyle = i === si ? '#ffe066' : i < si || step === 'serve' || step === 'done' ? 'rgba(246,234,214,.75)' : 'rgba(246,234,214,.3)'; ctx.fillText(n, 300 + i*92, 31); });
      ctx.textBaseline = 'alphabetic';
    },
    idle(){},
  };
})();

// ================= The Coral Sea: The Moon Pearl (a mermaid quest, inside the coral palace) =================
// Queen Marisol the seahorse has lost the Moon Pearl from her crown: the Gloom, the giant anglerfish of
// the Midnight Trench, took it, and now the color is draining out of the reef. Pick your tail and go!
//   1. The Palace:   meet the Queen and choose your mermaid tail
//   2. The Reef:     make three friends by helping them. They follow you, and each one becomes a power:
//                      Pip the pufferfish (tangled in a net) puffs up and blocks a hit for you
//                      Echo the dolphin pup (play tag!) teaches you to sing: Space sends out an echo
//                      Lumi the little jellyfish (lost in a dark cave: sing to show her the way) lights the dark
//   3. The Trench:   it's pitch black. Your echo outlines what's hidden for a moment, but every song (and
//                    swimming fast) makes noise, and too much noise wakes the Gloom. Not every light down
//                    there is friendly: some are the lures of little anglerfish. Your echo shows which.
//   4. The Den:      the Moon Pearl is the Gloom's own lure! Sneak up slowly and take it…
//   5. The Escape:   …and swim for your life back up the trench, while your friends come back to help.
const MERMAID = (() => {
  const img = src => { const i = new Image(); i.src = src; return i; };
  const SHEETS = { coral:img('characters/mermaid-coral.png'), blue:img('characters/mermaid-blue.png') }, FW = 411, FH = 200;
  const RW = 3400, TD = 2700, DEN_Y = 2480;
  const FRIEND_COL = { pip:'#ffd84a', echo:'#8ac8e8', lumi:'#ff9ad0' };
  let stage, tail, choice, hearts, inv, p, camX, camY, frame, hist, friends, pipT, talkQ, talk, noise, pings, objs, drops, gloom, events, sat, score, stageT, blocked, hintT, dark, darkCtx, flash;
  const ready = i => i.complete && i.naturalWidth;
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  // ----- talking: a little speech box at the bottom (click or wait to move on) -----
  // a new line replaces whatever was still waiting; pass more = true to queue a follow-on line
  function say(who, text, col, more){ if (!more){ talkQ = []; talk = null; } talkQ.push({ who, text, col:col || '#ffe9a8' }); }
  function nextTalk(){ talk = talkQ.length ? { ...talkQ.shift(), t:0 } : null; }

  // ----- the places -----
  const floorY = x => 420 - 18*Math.sin(x*.008) - 10*Math.sin(x*.021 + 1);
  function wallL(y){ const d = clamp((y - 2250)/250, 0, 1); return (150 + 80*Math.sin(y*.0045) + 35*Math.sin(y*.013 + 1))*(1 - d) + 30*d; }
  function wallR(y){ const d = clamp((y - 2250)/250, 0, 1); return (650 + 80*Math.sin(y*.004 + 2) + 35*Math.sin(y*.011 + 3))*(1 - d) + 770*d; }
  function buildReef(){
    const r = rng(77); objs = [];
    for (const x of [500, 1150, 1400, 2050, 2300, 2950]) objs.push({ k:'urchin', x, y:floorY(x) - 12, r:16 });
    for (const x of [1000, 1300, 2150, 2450, 3050]) objs.push({ k:'sting', x, y0:180 + r()*140, y:0, ph:r()*6 });
    drops = []; for (let i = 0; i < 26; i++){ const x = 300 + i*115 + r()*40; drops.push({ x, y:120 + r()*240 }); }
    objs.push({ k:'pip', x:820, y:300, knots:[{ dx:-34, dy:-26 }, { dx:36, dy:-14 }, { dx:-6, dy:34 }].map(k => ({ ...k, cut:false })), free:false });
    objs.push({ k:'echo', x:1760, y:220, tags:0, tx:1760, ty:220, cool:0 });
    objs.push({ k:'lumi', x:2690, y:330, free:false, home:{ x:2690, y:330 } });
  }
  function buildTrench(){
    const r = rng(91); objs = []; drops = [];
    for (let y = 260; y < 2250; y += 150 + r()*60){ const left = r() < .5, x = left ? wallL(y) + 14 : wallR(y) - 14; objs.push({ k:'urchin', x, y, r:18 + r()*6 }); }
    for (let y = 500; y < 2200; y += 330){ const x = (wallL(y) + wallR(y))/2 + (r() - .5)*120; objs.push({ k:'urchin', x, y, r:22 }); }
    for (let i = 0; i < 9; i++){ const y = 380 + i*210 + r()*60, x = wallL(y) + 60 + r()*(wallR(y) - wallL(y) - 120); objs.push({ k:'angler', x, y, x0:x, face:r() < .5 ? -1 : 1, ph:r()*6 }); }
    for (let i = 0; i < 46; i++){ const y = 200 + r()*2100, x = wallL(y) + 30 + r()*(wallR(y) - wallL(y) - 60); drops.push({ x, y, plank:true }); }
  }
  function enterStage(s){
    stage = s; stageT = 0; pings = []; noise = 0; blocked = 0; hintT = 0;
    if (s === 'palace' || s === 'home'){ p = { x:200, y:300, vx:0, vy:0, face:1 }; camX = 0; camY = 0; }
    if (s === 'reef'){ buildReef(); p = { x:120, y:260, vx:0, vy:0, face:1 }; camX = 0; camY = 0; }
    if (s === 'trench'){ buildTrench(); p = { x:400, y:60, vx:0, vy:60, face:1 }; camX = 0; camY = 0; gloom = { x:400, y:DEN_Y, awake:false, a:0 }; }
    if (s === 'escape'){ gloom.awake = true; events = { pod:false, bloom:false, pip:false }; gloom.stun = 1.4; }
    hist = Array.from({ length:60 }, () => ({ x:p.x, y:p.y }));
  }

  // ----- the cast -----
  function mer(x, y, face, fr, h = 64, tilt = 0, sheet){
    const im = SHEETS[sheet || tail]; if (!ready(im)) return; const w = h*FW/FH;
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.rotate(tilt); ctx.drawImage(im, (fr % 6)*FW, 0, FW, FH, -w/2, -h/2, w, h); ctx.restore();
  }
  function queen(x, y, s, pearl){
    ctx.save(); ctx.translate(x, y + Math.sin(t*1.3)*5); ctx.scale(s, s);
    ctx.strokeStyle = '#e8a050'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(4, 40); ctx.quadraticCurveTo(-6, 90, 20, 96); ctx.quadraticCurveTo(40, 98, 34, 80); ctx.quadraticCurveTo(28, 70, 20, 78); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#f2b860'; ctx.beginPath(); ctx.ellipse(0, 14, 26, 36, -.15, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(190,110,40,.5)'; ctx.lineWidth = 2; for (let k = 0; k < 6; k++){ ctx.beginPath(); ctx.moveTo(-18, -8 + k*9); ctx.quadraticCurveTo(0, -4 + k*9, 20, -10 + k*9); ctx.stroke(); }
    ctx.fillStyle = '#ffd890'; ctx.beginPath(); ctx.ellipse(10, 18, 12, 26, -.15, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2b860'; ctx.beginPath(); ctx.ellipse(-4, -30, 20, 18, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(8, -36); ctx.quadraticCurveTo(34, -38, 44, -28); ctx.lineTo(44, -20); ctx.quadraticCurveTo(30, -22, 8, -20); ctx.fill();
    ctx.fillStyle = '#e88aa0'; ctx.beginPath(); ctx.moveTo(-22, -26); ctx.quadraticCurveTo(-40, -10, -30, 10); ctx.quadraticCurveTo(-22, -6, -18, -14); ctx.fill();
    ctx.fillStyle = '#1a1a2a'; circle(2, -34, 4); ctx.fillStyle = '#fff'; circle(3.5, -35.5, 1.4); ctx.fillStyle = 'rgba(255,120,150,.5)'; circle(6, -24, 4);
    // her crown, with a hole where the Moon Pearl goes
    ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.moveTo(-20, -46); ctx.lineTo(-18, -66); ctx.lineTo(-10, -54); ctx.lineTo(-4, -72); ctx.lineTo(2, -54); ctx.lineTo(10, -66); ctx.lineTo(12, -46); ctx.closePath(); ctx.fill();
    if (pearl){ const g = ctx.createRadialGradient(-4, -60, 1, -4, -60, 24); g.addColorStop(0, 'rgba(230,245,255,.9)'); g.addColorStop(1, 'rgba(200,230,255,0)'); ctx.fillStyle = g; circle(-4, -60, 24); ctx.fillStyle = '#eef6ff'; circle(-4, -60, 7); }
    else { ctx.fillStyle = '#5a4020'; circle(-4, -56, 4); }
    ctx.restore();
  }
  function pip(x, y, puff){
    const r = 12 + puff*12; ctx.save(); ctx.translate(x, y);
    if (puff > .2){ ctx.strokeStyle = '#c89a20'; ctx.lineWidth = 2; for (let k = 0; k < 14; k++){ const a = k/14*Math.PI*2; ctx.beginPath(); ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r); ctx.lineTo(Math.cos(a)*(r + 6*puff), Math.sin(a)*(r + 6*puff)); ctx.stroke(); } }
    ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.ellipse(0, 0, r*1.15, r, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff3c0'; ctx.beginPath(); ctx.ellipse(0, r*.35, r*.8, r*.5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffb030'; ctx.beginPath(); ctx.moveTo(-r*1.1, 0); ctx.lineTo(-r*1.1 - 9, -7 + Math.sin(t*12)*2); ctx.lineTo(-r*1.1 - 9, 7 + Math.sin(t*12)*2); ctx.fill();
    ctx.fillStyle = '#1a1a2a'; circle(r*.5, -r*.25, 2.6); ctx.strokeStyle = '#1a1a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(r*.75, r*.15, 2.5, -.5, 1.8); ctx.stroke();
    ctx.restore();
  }
  function echoFish(x, y, face){
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.rotate(Math.sin(t*3)*.08);
    ctx.fillStyle = '#8ac8e8'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 13, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(26, -3); ctx.quadraticCurveTo(42, -2, 44, 3); ctx.quadraticCurveTo(36, 6, 24, 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4, -11); ctx.lineTo(4, -24); ctx.lineTo(10, -10); ctx.fill();
    const fl = Math.sin(t*8)*6; ctx.beginPath(); ctx.moveTo(-28, 0); ctx.lineTo(-42, -10 + fl); ctx.lineTo(-38, 0); ctx.lineTo(-42, 10 + fl); ctx.fill();
    ctx.fillStyle = '#d8f0fa'; ctx.beginPath(); ctx.ellipse(6, 5, 18, 6, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#1a1a2a'; circle(18, -3, 2.4); ctx.strokeStyle = '#1a1a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(30, 1, 6, .3, 1.4); ctx.stroke();
    ctx.restore();
  }
  function jelly(x, y, col, s, eyes){
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    const g = ctx.createRadialGradient(0, -4, 2, 0, -4, 36); g.addColorStop(0, `rgba(${col},.55)`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; circle(0, -4, 36);
    ctx.fillStyle = `rgba(${col},.85)`; ctx.beginPath(); ctx.arc(0, 0, 16, Math.PI, 0); ctx.quadraticCurveTo(8, 4, 0, 2); ctx.quadraticCurveTo(-8, 4, -16, 0); ctx.fill();
    ctx.strokeStyle = `rgba(${col},.8)`; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++){ ctx.beginPath(); ctx.moveTo(k*6, 2); ctx.quadraticCurveTo(k*6 + Math.sin(t*4 + k)*5, 14, k*6, 26); ctx.stroke(); }
    if (eyes){ ctx.fillStyle = '#2a1a2a'; circle(-5, -6, 2); circle(5, -6, 2); ctx.strokeStyle = '#2a1a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, -3, 3, .3, Math.PI - .3); ctx.stroke(); }
    ctx.restore();
  }
  function urchin(x, y, r){ ctx.strokeStyle = '#3a2048'; ctx.lineWidth = 2; for (let k = 0; k < 16; k++){ const a = k/16*Math.PI*2 + Math.sin(t + x)*.05; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a)*(r + 8), y + Math.sin(a)*(r + 8)); ctx.stroke(); } ctx.fillStyle = '#4a2a5a'; circle(x, y, r*.7); ctx.fillStyle = 'rgba(200,120,255,.4)'; circle(x - r*.2, y - r*.2, r*.25); }
  function angler(x, y, face, open, lit){
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
    ctx.fillStyle = '#2a2438'; ctx.beginPath(); ctx.ellipse(0, 0, 26, 18, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-38, -12); ctx.lineTo(-38, 12); ctx.fill();
    ctx.fillStyle = '#120e1a'; ctx.beginPath(); ctx.moveTo(26, -4); ctx.lineTo(8, 2 + open*6); ctx.lineTo(26, 10 + open*8); ctx.fill();
    ctx.fillStyle = '#e8e0f0'; for (let k = 0; k < 4; k++){ ctx.beginPath(); ctx.moveTo(12 + k*4, 0); ctx.lineTo(14 + k*4, 5); ctx.lineTo(16 + k*4, 0); ctx.fill(); }
    ctx.fillStyle = '#c8f0ff'; circle(10, -8, 3);
    ctx.strokeStyle = '#3a3448'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(4, -16); ctx.quadraticCurveTo(28, -40, 36, -18); ctx.stroke();
    if (lit){ ctx.fillStyle = '#c8fff0'; circle(36, -16, 4); }
    ctx.restore();
  }
  function gloomFish(g, sleeping){
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.a || 0);
    const s = 2.6; ctx.scale(s, s);
    ctx.fillStyle = '#1c1830'; ctx.beginPath(); ctx.ellipse(0, 0, 60, 40, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-52, 0); ctx.lineTo(-84, -26); ctx.lineTo(-78, 0); ctx.lineTo(-84, 26); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-20, -36); ctx.lineTo(-6, -54); ctx.lineTo(8, -38); ctx.fill();
    const open = sleeping ? .15 : .6 + Math.sin(t*6)*.25;
    ctx.fillStyle = '#08060e'; ctx.beginPath(); ctx.moveTo(60, -8); ctx.quadraticCurveTo(20, 4, 20, 10); ctx.quadraticCurveTo(30, 20 + open*20, 62, 18 + open*24); ctx.fill();
    ctx.fillStyle = '#e8e4f0'; for (let k = 0; k < 7; k++){ ctx.beginPath(); ctx.moveTo(24 + k*5, 6); ctx.lineTo(26 + k*5, 14); ctx.lineTo(28 + k*5, 6); ctx.fill(); ctx.beginPath(); ctx.moveTo(26 + k*5, 18 + open*20); ctx.lineTo(28 + k*5, 10 + open*20); ctx.lineTo(30 + k*5, 18 + open*20); ctx.fill(); }
    if (sleeping){ ctx.strokeStyle = '#6a6488'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(30, -14, 4, .2, Math.PI - .2); ctx.stroke(); }
    else { ctx.fillStyle = '#ff5a6a'; circle(30, -14, 4.5); ctx.fillStyle = '#fff'; circle(31, -15, 1.4); }
    ctx.strokeStyle = '#2a2640'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(14, -36); ctx.quadraticCurveTo(50, -76, 74, -46); ctx.stroke();
    ctx.restore();
  }
  // where the Gloom's lure (the Moon Pearl) dangles
  const lureAt = g => { const c = Math.cos(g.a || 0), s = Math.sin(g.a || 0), lx = 74*2.6, ly = -46*2.6; return { x:g.x + lx*c - ly*s, y:g.y + lx*s + ly*c }; };
  function moonPearl(x, y, r){ const g = ctx.createRadialGradient(x, y, 2, x, y, r*5); g.addColorStop(0, 'rgba(230,245,255,.9)'); g.addColorStop(1, 'rgba(200,230,255,0)'); ctx.fillStyle = g; circle(x, y, r*5); ctx.fillStyle = '#f2f8ff'; circle(x, y, r); ctx.fillStyle = 'rgba(180,210,255,.8)'; circle(x + r*.3, y + r*.3, r*.45); }

  // ----- getting hurt (Pip blocks one hit when he's ready) -----
  function hurt(why){
    if (inv > 0) return;
    if (friends.includes('pip') && pipT <= 0){ pipT = 8; inv = 1; pop(p.x - camX, p.y - camY - 40, 'Pip puffs up! Blocked!', '#ffd84a'); return; }
    hearts--; inv = 1.6; shake = .4; pop(p.x - camX, p.y - camY - 40, why, '#ff9aaa');
    if (hearts <= 0) finish(false);
  }
  // ----- Echo's song: a ring that shows what's hidden in the dark for a moment -----
  function sing(){
    if (!friends.includes('echo')) return;
    pings.push({ x:p.x, y:p.y, t:0 }); if (stage === 'trench') noise += 26;
    pop(p.x - camX, p.y - camY - 46, '♪ ~', '#bff0ff');
  }

  // ----- swimming -----
  function swim(dt, maxV){
    const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0), ay = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    p.vx += ax*720*dt; p.vy += ay*720*dt; p.vx -= p.vx*2.4*dt; p.vy -= p.vy*2.4*dt;
    const sp = Math.hypot(p.vx, p.vy); if (sp > maxV){ p.vx *= maxV/sp; p.vy *= maxV/sp; }
    p.x += p.vx*dt; p.y += p.vy*dt; if (Math.abs(p.vx) > 15) p.face = Math.sign(p.vx);
    frame += dt*(4 + sp/30);
    hist.unshift({ x:p.x, y:p.y }); hist.length = 60;
    return sp;
  }
  const friendPos = i => { const h = hist[Math.min(59, 14 + i*14)]; return { x:h.x - p.face*10, y:h.y + Math.sin(t*2 + i)*6 }; };

  return {
    title:'The Moon Pearl', sub:'A mermaid quest beneath the Coral Palace.',
    blurb:'The Gloom, the giant anglerfish of the Midnight Trench, has taken the Moon Pearl from Queen Marisol’s crown, and the color is draining out of the reef! Choose your tail, make friends on the way, and bring the pearl home.',
    legend:['Arrow keys (or WASD) to swim', 'Help the sea creatures you meet: they’ll follow you, and each one gives you a power', 'Once Echo teaches you, Space sings: your echo shows what’s hidden in the dark…', '…but in the Midnight Trench, noise wakes the Gloom. Sing only when you need to, and swim slowly near it', 'Not every light in the dark is friendly!'],
    hints:['Arrows swim', 'Space sings (once you learn how)', 'Click to skip talking', 'P to pause'],
    pad:['wgLeft', 'wgUp', 'wgDown', 'wgRight', 'wgAction'], actionLabel:'Sing', clicks:true,
    winTitle:'The Moon Pearl is home!', winText:'The pearl clicks into Queen Marisol’s crown and light pours out across the whole reef. Every color comes rushing back, and your three friends do loop-the-loops around the throne.',
    loseTitle:'Swept away', loseText:'The current tumbles you all the way back to the palace doors. The Queen pats you with her tail: “Rest, little one, and try again.”',
    againWinText:'The reef glows brighter than ever. Pip, Echo and Lumi want to go again!', againLoseText:'Back to the palace to catch your breath. The pearl is still down there…',
    reset(){ tail = 'coral'; choice = 0; hearts = 3; inv = 0; frame = 0; friends = []; pipT = 0; talkQ = []; talk = null; score = 0; sat = .5; flash = 0;
      if (!dark){ dark = document.createElement('canvas'); dark.width = W; dark.height = H; darkCtx = dark.getContext('2d'); }
      enterStage('palace'); stage = 'choose';
      say('Queen Marisol', 'Oh, thank the tides you’re here! I am Marisol, Queen of the Coral Sea.', '#ffc070');
      say('Queen Marisol', 'Last night the Gloom swam up from the Midnight Trench and stole the Moon Pearl from my crown. Without it, the reef is losing its colors.', '#ffc070', true);
      say('Queen Marisol', 'Choose your tail, little one. And remember: nobody should go into the Trench alone. Make some friends on the way!', '#ffc070', true); nextTalk(); },
    seeds:() => Math.floor(score/4) + (stage === 'done' ? 10 : 0), stats:() => `<span>Friends ${friends.length}/3</span><span>Pearl drops ${score}</span><span>Shells ${Math.max(0, hearts)}</span>`,
    update(dt){
      time += dt; stageT += dt; inv = Math.max(0, inv - dt); pipT = Math.max(0, pipT - dt); flash = Math.max(0, flash - dt); hintT = Math.max(0, hintT - dt);
      // a click skips talking, except a click on a tail card while choosing: that picks the tail
      const onCard = stage === 'choose' && input.click && input.click.y > 200 && input.click.y < 400 && (Math.abs(input.click.x - 300) < 90 || Math.abs(input.click.x - 500) < 90);
      if (talk){ talk.t += dt; if (talk.t > clamp(talk.text.length*.05, 2.8, 5.5) || (input.click && !onCard && talk.t > .3)){ input.click = null; nextTalk(); } }
      const taps = input.taps.splice(0); const sang = input.pressed; input.pressed = false; input.keys.length = 0;
      pings.forEach(g => g.t += dt); pings = pings.filter(g => g.t < 2.4);

      if (stage === 'choose'){
        for (const k of taps){ if (k === 'left' || k === 'right') choice = 1 - choice; }
        if (input.click){ const { x, y } = input.click; input.click = null; if (y > 200 && y < 400){ if (Math.abs(x - 300) < 90){ choice = 0; tail = 'coral'; } else if (Math.abs(x - 500) < 90){ choice = 1; tail = 'blue'; } else return; stage = 'palace'; say('Queen Marisol', 'A fine tail! Now swim out through the doors, to the right. Hurry!', '#ffc070', true); if (!talk) nextTalk(); } }
        tail = choice ? 'blue' : 'coral';
        if (sang){ stage = 'palace'; say('Queen Marisol', 'A fine tail! Now swim out through the doors, to the right. Hurry!', '#ffc070', true); if (!talk) nextTalk(); }
        return;
      }
      if (stage === 'palace'){ swim(dt, 240); p.x = clamp(p.x, 30, W + 40); p.y = clamp(p.y, 90, 410); if (p.x > W + 20) enterStage('reef'); return; }
      if (stage === 'home'){ swim(dt, 240); p.x = clamp(p.x, 30, W - 30); p.y = clamp(p.y, 90, 410); sat = Math.max(0, sat - dt*.4); if (stageT > 7 || (stageT > 2 && sang)){ stage = 'done'; finish(true); } return; }

      if (stage === 'reef'){
        swim(dt, 250); p.x = clamp(p.x, 20, RW + 60); p.y = clamp(p.y, 50, floorY(p.x) - 20);
        camX = clamp(p.x - 300, 0, RW - W); sat = .3 + .45*clamp(p.x/RW, 0, 1);
        if (sang) sing();
        for (const o of objs){
          if (o.k === 'urchin' && dist(p.x, p.y, o.x, o.y) < o.r + 18) hurt('Ouch! Spiky!');
          else if (o.k === 'sting'){ o.y = o.y0 + Math.sin(t*1.1 + o.ph)*90; if (dist(p.x, p.y, o.x, o.y) < 30) hurt('Zap! A stinging jelly!'); }
          else if (o.k === 'pip' && !o.free){
            if (dist(p.x, p.y, o.x, o.y) < 200 && !o.met){ o.met = true; say('Pip', 'Help! I’m all tangled up in this net! Can you swim through the glowing knots and snap them?', FRIEND_COL.pip); if (!talk) nextTalk(); }
            for (const k of o.knots) if (!k.cut && dist(p.x, p.y, o.x + k.dx, o.y + k.dy) < 26){ k.cut = true; pop(o.x + k.dx - camX, o.y + k.dy - 20, 'Snap!', '#ffe9a8'); }
            if (o.knots.every(k => k.cut)){ o.free = true; friends.push('pip'); anim.happy = 2; say('Pip', 'I’m free! I’m Pip! I’m coming with you, and if anything tries to hurt you, I’ll PUFF UP!', FRIEND_COL.pip); if (!talk) nextTalk(); }
          }
          else if (o.k === 'echo' && !friends.includes('echo')){
            if (dist(p.x, p.y, o.x, o.y) < 260 && !o.met){ o.met = true; say('Echo', 'Hee hee! You’re new! Bet you can’t tag me… three times!', FRIEND_COL.echo); if (!talk) nextTalk(); }
            if (o.met){ o.x += (o.tx - o.x)*Math.min(1, dt*3); o.y += (o.ty - o.y)*Math.min(1, dt*3); o.cool -= dt;
              if (o.cool <= 0 && dist(p.x, p.y, o.x, o.y) < 44){ o.tags++; o.cool = .6; pop(o.x - camX, o.y - 30, `Tag! ${o.tags}/3`, FRIEND_COL.echo);
                if (o.tags >= 3){ friends.push('echo'); anim.happy = 2; say('Echo', 'Okay, okay, you win! I’m Echo. I’ll teach you my song: press Space to sing! Your echo bounces back and shows you things hidden in the dark.', FRIEND_COL.echo); if (!talk) nextTalk(); }
                else { const a = Math.random()*Math.PI*2; o.tx = clamp(o.x + Math.cos(a)*240, camX + 80, camX + W - 60); o.ty = clamp(o.y + Math.sin(a)*160, 90, floorY(o.x) - 60); } } }
          }
          else if (o.k === 'lumi' && !o.free){
            if (dist(p.x, p.y, o.x, o.y) < 300 && !o.met){ o.met = true; say('Lumi', '(a tiny voice from inside the cave) …Is somebody there? It’s so dark in here. I can’t find the way out…', FRIEND_COL.lumi); say('Pip', 'She’s lost! Sing your echo, so she can see the way!', FRIEND_COL.pip, true); if (!talk) nextTalk(); }
            if (o.met && pings.some(g => g.t < .1 && dist(g.x, g.y, o.x, o.y) < 360)){ o.free = true; friends.push('lumi'); anim.happy = 2; say('Lumi', 'I can see the way! Thank you! I’m Lumi. I’m small, but I glow, and I’ll light up the dark for you.', FRIEND_COL.lumi); if (!talk) nextTalk(); }
          }
        }
        for (const d of drops) if (!d.got && dist(p.x, p.y, d.x, d.y) < 26){ d.got = true; score++; }
        // the reef ends at the edge of the Midnight Trench
        if (p.x > RW - 160){
          if (friends.length < 3){ p.x = RW - 160; if (hintT <= 0){ hintT = 4; say('Pip', friends.length ? 'Wait! We need more friends before we go down there. Somebody back there needs help!' : 'You can’t go down there alone!', FRIEND_COL.pip); if (!talk) nextTalk(); } }
          else if (p.y > floorY(p.x) - 40 || p.x > RW){ enterStage('trench'); say('Lumi', 'It’s so dark… stay close to me. And sing only when you need to: the Gloom hears everything.', FRIEND_COL.lumi); if (!talk) nextTalk(); }
        }
        return;
      }

      // the Midnight Trench, going down, and the escape, going up
      const near = stage === 'trench' ? dist(p.x, p.y, gloom.x, gloom.y) : 9999;
      const sp = swim(dt, stage === 'escape' ? 270 : 230);
      const l = wallL(p.y), r = wallR(p.y); if (p.x < l + 22){ p.x = l + 22; p.vx = Math.abs(p.vx)*.3; } if (p.x > r - 22){ p.x = r - 22; p.vx = -Math.abs(p.vx)*.3; }
      p.y = clamp(p.y, 30, TD - 40);
      // during the escape you stay near the top of the screen, so you can see the Gloom coming
      camY += (clamp(p.y - (stage === 'escape' ? 130 : p.y > 2150 ? 200 : 240), 0, TD - H) - camY)*Math.min(1, dt*5);
      if (sang) sing();
      noise = Math.max(0, noise - dt*9);
      if (stage === 'trench'){
        if (sp > 175) noise += dt*(near < 500 ? 40 : 7);
        if (near < 500 && sp > 120 && hintT <= 0){ hintT = 5; say('Lumi', 'Shhh! Swim slowly, we’re right next to it…', FRIEND_COL.lumi); if (!talk) nextTalk(); }
        if (noise >= 100){ noise = 45; flash = .5; shake = .6; hurt('The Gloom stirs and snaps in the dark!'); }
      }
      for (const o of objs){
        if (o.k === 'urchin' && dist(p.x, p.y, o.x, o.y) < o.r + 16) hurt('Ouch! Spiky!');
        if (o.k === 'angler'){ o.x = o.x0 + Math.sin(t*.5 + o.ph)*30; o.snap = Math.max(0, (o.snap || 0) - dt); if (dist(p.x, p.y, o.x, o.y) < 34){ o.snap = .4; hurt('Chomp! That light was a little anglerfish!'); } }
      }
      for (const d of drops) if (!d.got && dist(p.x, p.y, d.x, d.y) < 26){ d.got = true; score++; if (score % 12 === 0 && hearts < 3){ hearts++; pop(p.x - camX, p.y - camY - 40, '+1 shell!', '#bff0ff'); } }
      if (stage === 'trench'){
        // the pearl dangles from the sleeping Gloom's lure: take it!
        const L = lureAt(gloom); if (dist(p.x, p.y, L.x, L.y) < 30){ enterStage('escape'); flash = .8; shake = .8; say('Pip', 'YOU GOT IT! …uh oh. It’s waking up. SWIM!', FRIEND_COL.pip); if (!talk) nextTalk(); }
      } else {
        // the escape: the Gloom chases you up the trench, and your friends come back to help
        gloom.stun = Math.max(0, gloom.stun - dt);
        const chase = gloom.stun > 0 ? 20 : 150 + Math.min(80, stageT*6);
        gloom.y -= chase*dt; gloom.x += (p.x - gloom.x)*Math.min(1, dt*1.5); gloom.a = -Math.PI/2;
        if (gloom.y > p.y + 330) gloom.y = p.y + 330;
        if (gloom.y - p.y < 150 && gloom.stun <= 0){ hurt('The Gloom’s jaws snap shut behind you!'); gloom.y = p.y + 300; gloom.stun = 1; }
        if (!events.pod && p.y < 1900){ events.pod = true; gloom.stun = 3; gloom.y += 120; say('Echo', 'I called my whole family! Dolphins, GO!', FRIEND_COL.echo); if (!talk) nextTalk(); events.podT = 0; }
        if (!events.bloom && p.y < 1150){ events.bloom = true; gloom.stun = 3.5; flash = .6; say('Lumi', 'Everybody, GLOW AS BRIGHT AS YOU CAN!', FRIEND_COL.lumi); if (!talk) nextTalk(); events.bloomT = 0; }
        if (!events.pip && p.y < 480){ events.pip = true; gloom.stun = 99; say('Pip', 'Not this time! PUUUUFF!', FRIEND_COL.pip); if (!talk) nextTalk(); events.pipT = 0; }
        if (events.podT !== undefined) events.podT += dt; if (events.bloomT !== undefined) events.bloomT += dt; if (events.pipT !== undefined) events.pipT += dt;
        if (p.y < 60){ enterStage('home'); sat = .6; say('Queen Marisol', 'The Moon Pearl! You brought it home!', '#ffc070'); say('Queen Marisol', 'Look at my reef. Every color is coming back. Thank you, brave little mermaid, and thank you, Pip, Echo and Lumi!', '#ffc070', true); if (!talk) nextTalk(); }
      }
    },
    draw(){
      if (stage === 'choose' || stage === 'palace' || stage === 'home'){ this.drawPalace(); }
      else if (stage === 'reef') this.drawReef();
      else this.drawTrench();
      // the color drains out of the reef while the pearl is missing
      if (sat > .01){ ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${sat})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      if (flash > 0){ ctx.fillStyle = `rgba(230,245,255,${flash*.6})`; ctx.fillRect(0, 0, W, H); }
      drawPops(0);
      if (talk){ const a = Math.min(1, talk.t*6); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(10,20,40,.88)'; rr(40, H - 108, W - 80, 92, 14); ctx.fill(); ctx.strokeStyle = talk.col; ctx.lineWidth = 3; rr(40, H - 108, W - 80, 92, 14); ctx.stroke();
        ctx.fillStyle = talk.col; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.fillText(talk.who, 60, H - 82);
        ctx.fillStyle = '#f2f8ff'; ctx.font = '600 15px Nunito, sans-serif'; const words = talk.text.split(' '); let line = '', y = H - 58; for (const w of words){ const tt = line ? line + ' ' + w : w; if (ctx.measureText(tt).width > W - 130 && line){ ctx.fillText(line, 60, y); y += 20; line = w; } else line = tt; } ctx.fillText(line, 60, y);
        ctx.globalAlpha = 1; }
    },
    drawPalace(){
      // the throne room: pink shell walls, pillars, and windows onto the sea
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f8d0d8'); g.addColorStop(1, '#e0a0b8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let k = 0; k < 5; k++){ const x = 80 + k*160; ctx.fillStyle = '#2a6aa0'; ctx.beginPath(); ctx.moveTo(x - 34, 260); ctx.lineTo(x - 34, 130); ctx.arc(x, 130, 34, Math.PI, 0); ctx.lineTo(x + 34, 260); ctx.fill();
        ctx.fillStyle = 'rgba(160,220,255,.35)'; for (let b = 0; b < 3; b++) circle(x - 14 + b*14, 220 - wrap(t*30 + b*40 + k*20, 120), 3); ctx.strokeStyle = '#f2c860'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 34, 260); ctx.lineTo(x - 34, 130); ctx.arc(x, 130, 34, Math.PI, 0); ctx.lineTo(x + 34, 260); ctx.stroke(); }
      for (let k = 0; k < 6; k++){ const x = k*160; ctx.fillStyle = '#fff0f0'; ctx.fillRect(x - 12, 60, 24, 380); ctx.fillStyle = 'rgba(200,120,150,.3)'; for (let s = 0; s < 8; s++) ctx.fillRect(x - 12, 70 + s*48, 24, 4); }
      ctx.fillStyle = '#c86a8a'; ctx.fillRect(0, 0, W, 50); for (let k = 0; k < 20; k++){ ctx.fillStyle = k % 2 ? '#f6c0d0' : '#ffe0e8'; ctx.beginPath(); ctx.arc(k*42 + 21, 50, 21, 0, Math.PI); ctx.fill(); }
      ctx.fillStyle = '#e8c890'; ctx.fillRect(0, 430, W, 50); ctx.fillStyle = 'rgba(160,110,60,.3)'; for (let k = 0; k < 16; k++) ctx.fillRect(k*52, 440 + (k % 2)*10, 30, 3);
      // the shell throne and the Queen
      ctx.fillStyle = '#ffd8e0'; ctx.beginPath(); ctx.moveTo(560, 430); for (let k = 0; k <= 8; k++){ const a = Math.PI + k/8*Math.PI; ctx.lineTo(660 + Math.cos(a)*110, 300 + Math.sin(a)*130); } ctx.lineTo(760, 430); ctx.fill();
      ctx.strokeStyle = 'rgba(200,110,140,.5)'; ctx.lineWidth = 3; for (let k = 1; k < 8; k++){ const a = Math.PI + k/8*Math.PI; ctx.beginPath(); ctx.moveTo(660, 330); ctx.lineTo(660 + Math.cos(a)*104, 300 + Math.sin(a)*122); ctx.stroke(); }
      queen(660, 300, 1.3, stage === 'home');
      // the doors out, on the right
      if (stage !== 'home'){ ctx.fillStyle = 'rgba(30,90,140,.25)'; ctx.fillRect(W - 30, 140, 30, 290); ctx.fillStyle = '#7a3a5a'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'right'; if (stage === 'palace') ctx.fillText('To the reef →', W - 36, 130); ctx.textAlign = 'left'; }
      if (stage === 'choose'){
        ctx.fillStyle = 'rgba(20,40,80,.55)'; rr(170, 150, 460, 250, 18); ctx.fill();
        ctx.fillStyle = '#fff6e4'; ctx.font = '700 20px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('Choose your tail', W/2, 182);
        for (const [i, sh, x, name] of [[0, 'coral', 300, 'Coral'], [1, 'blue', 500, 'Sea Glass']]){ const on = choice === i;
          ctx.fillStyle = on ? 'rgba(255,240,200,.35)' : 'rgba(255,255,255,.1)'; rr(x - 90, 200, 180, 170, 14); ctx.fill(); if (on){ ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 3; rr(x - 90, 200, 180, 170, 14); ctx.stroke(); }
          mer(x, 285 + Math.sin(t*2 + i)*6, 1, Math.floor(t*8), on ? 84 : 70, 0, sh); ctx.fillStyle = on ? '#ffe066' : '#fff6e4'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.fillText(name, x, 356); }
        ctx.font = '600 13px Nunito, sans-serif'; ctx.fillStyle = '#fff6e4'; ctx.fillText('← → to pick, Space (or click one) to choose', W/2, 392); ctx.textAlign = 'left';
      } else {
        if (stage === 'home') friends.forEach((f, i) => { const a = t*2 + i*2.1, fx = 420 + Math.cos(a)*120, fy = 230 + Math.sin(a)*60; if (f === 'pip') pip(fx, fy, .3); else if (f === 'echo') echoFish(fx, fy, Math.sin(a) > 0 ? -1 : 1); else jelly(fx, fy, '255,154,208', 1, true); });
        else this.drawFriends();
        if (!(inv > 0 && Math.floor(t*12) % 2)) mer(p.x, p.y, p.face, Math.floor(frame), 64, Math.atan2(p.vy, Math.abs(p.vx) + 60)*.6);
      }
      if (stage === 'home'){ for (let k = 0; k < 30; k++){ ctx.fillStyle = `hsla(${(k*37 + t*60) % 360},90%,70%,.8)`; circle(hash(k)*W, wrap(hash(k + 3)*H - t*60*(1 + hash(k + 5)), H), 3 + hash(k)*3); } }
    },
    drawFriends(){
      friends.forEach((f, i) => { const q = friendPos(i), x = q.x - camX, y = q.y - camY;
        if (f === 'pip') pip(x, y, pipT > 6 ? (pipT - 6)/2 : 0); else if (f === 'echo') echoFish(x, y, p.face); else jelly(x, y, '255,154,208', .8, true); });
    },
    drawReef(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5ac0e0'); g.addColorStop(.6, '#1e78a8'); g.addColorStop(1, '#0e4a78'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++){ const bx = wrap(i*170 - camX*.1 + Math.sin(t*.3 + i)*20, W + 200) - 100; ctx.fillStyle = 'rgba(255,255,230,.07)'; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + 50, 0); ctx.lineTo(bx + 150, H); ctx.lineTo(bx + 80, H); ctx.fill(); }
      // far coral hills, then the near reef
      for (let i = Math.floor(camX*.3/220) - 1; i*220 - camX*.3 < W + 220; i++){ const x = i*220 - camX*.3 + hash(i)*60; ctx.fillStyle = 'rgba(30,80,120,.55)'; ctx.beginPath(); ctx.ellipse(x, 400, 140, 90 + hash(i + 2)*60, 0, Math.PI, 0); ctx.fill(); }
      ctx.fillStyle = '#e8d098'; ctx.beginPath(); ctx.moveTo(0, H); for (let s = 0; s <= W; s += 10) ctx.lineTo(s, floorY(s + camX)); ctx.lineTo(W, H); ctx.fill();
      for (let i = Math.floor(camX/90) - 1; i*90 - camX < W + 90; i++){ const x = i*90 - camX + hash(i)*40, fy = floorY(x + camX), k = hash(i + 4); if (x + camX > RW - 200) continue;
        if (k < .4){ ctx.strokeStyle = '#3f9a5a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, fy); for (let s = 1; s < 7; s++) ctx.lineTo(x + Math.sin(t*1.4 + s*.7 + i)*8, fy - s*22); ctx.stroke(); }
        else { ctx.fillStyle = ['#ff7a8a', '#ffb05a', '#c07ae0', '#5ad0c0'][((i % 4) + 4) % 4]; for (let s = 0; s < 5; s++){ ctx.beginPath(); ctx.ellipse(x - 16 + s*8, fy - 16 - (s % 2)*10, 5, 16 + (s % 2)*6, (s - 2)*.25, 0, 7); ctx.fill(); } } }
      // the edge of the Midnight Trench, at the far end of the reef
      { const ex = RW - 140 - camX; if (ex < W + 200){ const tg = ctx.createLinearGradient(0, 300, 0, H); tg.addColorStop(0, 'rgba(4,8,24,.4)'); tg.addColorStop(1, '#02040e'); ctx.fillStyle = tg; ctx.fillRect(ex, 260, W + 400, H); ctx.fillStyle = '#02040e'; ctx.fillRect(ex, 380, W + 400, H);
        ctx.fillStyle = '#6a8ab0'; ctx.font = '700 14px "Pixelify Sans", monospace'; ctx.fillText('THE MIDNIGHT TRENCH ↓', ex + 20, 240); } }
      // pearl drops to collect
      for (const d of drops){ if (d.got) continue; const x = d.x - camX; if (x < -20 || x > W + 20) continue; ctx.fillStyle = 'rgba(255,255,255,.3)'; circle(x, d.y, 9); ctx.fillStyle = '#f6f0ff'; circle(x, d.y + Math.sin(t*2 + d.x)*3, 5); ctx.fillStyle = 'rgba(180,200,255,.8)'; circle(x + 1.5, d.y + 1.5 + Math.sin(t*2 + d.x)*3, 2); }
      for (const o of objs){ const x = o.x - camX; if (x < -160 || x > W + 160) continue;
        if (o.k === 'urchin') urchin(x, o.y, o.r);
        else if (o.k === 'sting') jelly(x, o.y, '190,110,255', 1, false);
        else if (o.k === 'pip'){ if (!o.free){ ctx.strokeStyle = 'rgba(230,220,190,.85)'; ctx.lineWidth = 2; ctx.beginPath(); for (let k = -3; k <= 3; k++){ ctx.moveTo(x + k*16 - 30, o.y - 50); ctx.lineTo(x + k*16 + 30, o.y + 50); ctx.moveTo(x + k*16 + 30, o.y - 50); ctx.lineTo(x + k*16 - 30, o.y + 50); } ctx.stroke();
            for (const k of o.knots){ if (k.cut) continue; const g2 = ctx.createRadialGradient(x + k.dx, o.y + k.dy, 1, x + k.dx, o.y + k.dy, 16); g2.addColorStop(0, 'rgba(255,240,150,.9)'); g2.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = g2; circle(x + k.dx, o.y + k.dy, 16 + Math.sin(t*5)*3); ctx.fillStyle = '#c8a050'; circle(x + k.dx, o.y + k.dy, 5); }
            pip(x, o.y, .5 + Math.sin(t*3)*.2); ctx.fillStyle = '#fff'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('Help!', x, o.y - 62); ctx.textAlign = 'left'; } }
        else if (o.k === 'echo' && !friends.includes('echo')) echoFish(x, o.y + Math.sin(t*3)*5, o.tx > o.x ? 1 : -1);
        else if (o.k === 'lumi'){
          // a dark cave in a big rock, with a tiny glow inside
          ctx.fillStyle = '#4a5a6a'; ctx.beginPath(); ctx.ellipse(x, 360, 160, 140, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#3a4858'; ctx.beginPath(); ctx.ellipse(x - 40, 330, 60, 40, -.3, 0, 7); ctx.fill();
          ctx.fillStyle = '#05080e'; ctx.beginPath(); ctx.ellipse(x, 340, 70, 60, 0, 0, 7); ctx.fill();
          if (!o.free) jelly(x, o.y, '255,154,208', .55, true); } }
      this.drawFriends();
      for (const g of pings){ const r = g.t*650; ctx.strokeStyle = `rgba(190,240,255,${Math.max(0, .8 - g.t*.4)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(g.x - camX, g.y, r, 0, 7); ctx.stroke(); }
      if (!(inv > 0 && Math.floor(t*12) % 2)) mer(p.x - camX, p.y, p.face, Math.floor(frame), 64, Math.atan2(p.vy, Math.abs(p.vx) + 60)*.6);
    },
    drawTrench(){
      // the walls of the trench, drawn plainly; the darkness goes over the top
      ctx.fillStyle = '#0a1830'; ctx.fillRect(0, 0, W, H);
      const y0 = camY - 20, y1 = camY + H + 20;
      ctx.fillStyle = '#2a3448'; ctx.beginPath(); ctx.moveTo(0, -20); for (let y = y0; y <= y1; y += 20) ctx.lineTo(wallL(y), y - camY); ctx.lineTo(0, H + 20); ctx.fill();
      ctx.beginPath(); ctx.moveTo(W, -20); for (let y = y0; y <= y1; y += 20) ctx.lineTo(wallR(y), y - camY); ctx.lineTo(W, H + 20); ctx.fill();
      if (camY + H > TD - 120){ ctx.fillStyle = '#1a2030'; ctx.fillRect(0, TD - 60 - camY, W, 200); }
      const lights = [];
      for (const d of drops){ if (d.got) continue; const y = d.y - camY; if (y < -20 || y > H + 20) continue; ctx.fillStyle = '#9af8e0'; circle(d.x, y, 3 + Math.sin(t*3 + d.x)*1); lights.push([d.x, y, 26]); }
      for (const o of objs){ const y = o.y - camY; if (y < -60 || y > H + 60) continue;
        if (o.k === 'urchin') urchin(o.x, y, o.r);
        else if (o.k === 'angler'){ angler(o.x, y, o.face, o.snap > 0 ? 1 : 0, false); const lx = o.x + o.face*36, ly = y - 16; ctx.fillStyle = '#c8fff0'; circle(lx, ly, 4); lights.push([lx, ly, 30]); } }
      // the Gloom, asleep in its den (or chasing you)
      const gy = gloom.y - camY; if (gy > -400 && gy < H + 400){ gloomFish({ ...gloom, y:gy }, !gloom.awake);
        if (!gloom.awake){ const L = lureAt(gloom); moonPearl(L.x, L.y - camY, 9); lights.push([L.x, L.y - camY, 140]);
          ctx.fillStyle = 'rgba(200,220,255,.6)'; ctx.font = '700 16px Nunito, sans-serif'; for (let k = 0; k < 3; k++){ const a = wrap(t*.4 + k/3, 1); ctx.globalAlpha = 1 - a; ctx.fillText('z', gloom.x - 60 + a*30, gy - 120 - a*60); } ctx.globalAlpha = 1; } }
      this.drawFriends();
      if (!(inv > 0 && Math.floor(t*12) % 2)) mer(p.x, p.y - camY, p.face, Math.floor(frame), 64, Math.atan2(p.vy, Math.abs(p.vx) + 60)*.6);
      if (stage === 'escape') moonPearl(p.x + p.face*30, p.y - camY + 6, 6);
      // the escape: dolphins, a bloom of jellies, and Pip, enormous
      if (stage === 'escape'){
        if (events.podT !== undefined && events.podT < 3){ for (let k = 0; k < 6; k++){ const dx = -200 + events.podT*500 + k*60 - (k % 2)*30, dy = gloom.y - camY - 60 + (k % 3)*40; echoFish(dx, dy, 1); } }
        if (events.bloomT !== undefined && events.bloomT < 3.5) for (let k = 0; k < 14; k++){ const a = k/14*Math.PI*2 + t; jelly(gloom.x + Math.cos(a)*170, gloom.y - camY - 80 + Math.sin(a)*90, '255,154,208', .9, true); }
        if (events.pipT !== undefined){ const s = Math.min(1, events.pipT*2); pip(p.x + 30, Math.max(p.y + 200, 520) - camY, 1 + s*5); }
      }
      // the dark: only what's lit (by Lumi, the pearl and the glowing things) shows through
      const dc = darkCtx; dc.globalCompositeOperation = 'source-over'; dc.clearRect(0, 0, W, H); dc.fillStyle = 'rgba(1,3,10,.96)'; dc.fillRect(0, 0, W, H);
      dc.globalCompositeOperation = 'destination-out';
      const rad = stage === 'escape' ? 230 : friends.includes('lumi') ? 120 : 60; lights.push([p.x, p.y - camY, rad]);
      if (stage === 'escape' && events.bloomT !== undefined && events.bloomT < 3.5) lights.push([gloom.x, gloom.y - camY - 80, 260]);
      for (const [lx, ly, lr] of lights){ const g = dc.createRadialGradient(lx, ly, lr*.2, lx, ly, lr); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); dc.fillStyle = g; dc.beginPath(); dc.arc(lx, ly, lr, 0, 7); dc.fill(); }
      ctx.drawImage(dark, 0, 0, W, H);
      // Lumi's glow tints the light pink
      { const lg = ctx.createRadialGradient(p.x, p.y - camY, 10, p.x, p.y - camY, rad); lg.addColorStop(0, stage === 'escape' ? 'rgba(200,230,255,.12)' : 'rgba(255,150,210,.1)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = lg; circle(p.x, p.y - camY, rad); }
      // your echo: an expanding ring that outlines the walls and shows what's behind each light
      for (const g of pings){ const r = g.t*650, a = Math.max(0, 1 - g.t/2.4), gy2 = g.y - camY;
        ctx.strokeStyle = `rgba(190,240,255,${a*.7})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(g.x, gy2, r, 0, 7); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = `rgba(140,220,255,${a*.8})`;
        for (const wall of [wallL, wallR]){ ctx.beginPath(); let on = false; for (let y = y0; y <= y1; y += 14){ const wx = wall(y), inR = Math.hypot(wx - g.x, y - g.y) < r; if (inR){ on ? ctx.lineTo(wx, y - camY) : ctx.moveTo(wx, y - camY); on = true; } else on = false; } ctx.stroke(); }
        for (const o of objs){ const oy = o.y - camY; if (oy < -40 || oy > H + 40 || Math.hypot(o.x - g.x, o.y - g.y) > r) continue;
          if (o.k === 'angler'){ ctx.strokeStyle = `rgba(255,110,120,${a})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(o.x, oy, 30, 22, 0, 0, 7); ctx.stroke(); ctx.fillStyle = `rgba(255,140,150,${a})`; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('anglerfish!', o.x, oy - 30); ctx.textAlign = 'left'; }
          else { ctx.strokeStyle = `rgba(200,140,255,${a})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(o.x, oy, o.r + 8, 0, 7); ctx.stroke(); } }
        for (const d of drops){ if (d.got) continue; const dy = d.y - camY; if (dy < -10 || dy > H + 10 || Math.hypot(d.x - g.x, d.y - g.y) > r) continue; ctx.strokeStyle = `rgba(150,255,210,${a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(d.x, dy, 8, 0, 7); ctx.stroke(); }
        if (Math.hypot(gloom.x - g.x, gloom.y - g.y) < r + 200){ ctx.strokeStyle = `rgba(255,90,110,${a*.8})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(gloom.x, gloom.y - camY, 170, 110, gloom.a || 0, 0, 7); ctx.stroke(); } }
      // how loud you've been (the Gloom wakes at the top)
      if (stage === 'trench'){ ctx.fillStyle = 'rgba(10,20,40,.7)'; rr(W - 150, 60, 130, 44, 8); ctx.fill(); ctx.fillStyle = '#bfe0ff'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.fillText('NOISE', W - 140, 77); ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(W - 140, 84, 110, 10, 4); ctx.fill();
        ctx.fillStyle = noise > 70 ? '#ff6a7a' : noise > 40 ? '#ffd060' : '#7ad8ff'; rr(W - 140, 84, 110*Math.min(1, noise/100), 10, 4); ctx.fill(); }
      if (stage === 'escape'){ ctx.fillStyle = '#ffd0d0'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; if (Math.floor(t*3) % 2) ctx.fillText('SWIM UP!  ↑', W/2, 80); ctx.textAlign = 'left'; }
    },
    hud(){
      hudBar();
      for (let i = 0; i < 3; i++){ const x = 30 + i*28, on = i < hearts; ctx.fillStyle = on ? '#ffc8d8' : 'rgba(246,234,214,.2)'; ctx.beginPath(); ctx.moveTo(x, 38); for (let k = 0; k <= 5; k++){ const a = Math.PI + k/5*Math.PI; ctx.lineTo(x + Math.cos(a)*11, 30 + Math.sin(a)*11); } ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'center'; ctx.fillText({ choose:'The Coral Palace', palace:'The Coral Palace', reef:'The Fading Reef', trench:'The Midnight Trench', escape:'ESCAPE!', home:'The Coral Palace', done:'The Coral Palace' }[stage], W/2, 31); ctx.textAlign = 'left';
      // your friends, and whether Pip is ready to block
      ['pip', 'echo', 'lumi'].forEach((f, i) => { const x = W - 110 + i*34, has = friends.includes(f); ctx.globalAlpha = has ? 1 : .25;
        if (f === 'pip') pip(x, 30, 0); else if (f === 'echo'){ ctx.save(); ctx.translate(x, 30); ctx.scale(.5, .5); echoFish(0, 0, 1); ctx.restore(); } else jelly(x, 32, '255,154,208', .5, true);
        ctx.globalAlpha = 1; if (f === 'pip' && has && pipT > 0){ ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, 30, 14, -Math.PI/2, -Math.PI/2 + (1 - pipT/8)*Math.PI*2); ctx.stroke(); } });
      ctx.fillStyle = '#f6f0ff'; ctx.fillText(`◦ ${score}`, 120, 31); ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ frame += dt*8; },
  };
})();

// ================= Moonlit Lake: Shadow Tales (campfire stories) =================
// Luna tells a story by the campfire, and the forest friends act it out as shadow puppets on the big
// rock behind the fire. Shadows work like real ones: step a friend close to the fire and their shadow
// grows HUGE; step back toward the rock and it shrinks to their real size. Each line of the story shows
// a faint outline on the rock: pick the right friend, strike the right pose, and find the right spot
// to fill it. (The giant dragon in the story? Just Flit the bat, standing very close to the fire.)
// The fire slowly burns down while you think; every scene you get right throws on another log.
const CAMPFIRE = (() => {
  const L = { x:400, y:425 }, FUEL0 = 40, FUEL_MAX = 55, FUEL_LOST = .85;
  const CAST = [
    { id:'bunny', name:'Bun', col:'#d8c8b8', dark:'#8a7a6a', poses:['sitting', 'stretching'] },
    { id:'hedge', name:'Hazel', col:'#a07a52', dark:'#5a4028', poses:['walking', 'curled up'] },
    { id:'bat',   name:'Flit', col:'#7a6a8a', dark:'#3a2e48', poses:['wings folded', 'wings out'] },
    { id:'frog',  name:'Puddle', col:'#7ab86a', dark:'#3a6a2a', poses:['sitting', 'leaping'] },
  ];
  const STORIES = [
    { title:'The Dragon of Moonlit Lake', lines:[
      ['Long ago, a tiny hedgehog named Hazel lived down by the lake…', 'hedge', 0, .05, .2],
      ['One night, a GIANT DRAGON swooped down from the mountains!', 'bat', 1, .82, .95],
      ['Hazel curled up into a spiky ball and rolled away as fast as she could!', 'hedge', 1, .4, .6],
      ['Then the mighty Frog King leapt out of the reeds to save her!', 'frog', 1, .55, .75],
      ['And the dragon? It was only little Flit the bat, flapping too close to the campfire!', 'bat', 1, .05, .15]] },
    { title:'The Two-Horned Monster', lines:[
      ['Bun the bunny hopped out one night to look at the stars.', 'bunny', 0, .1, .25],
      ['Suddenly, a MONSTER with two enormous horns rose up over the hill!', 'bunny', 1, .85, .97],
      ['Puddle the frog leapt into the lake to hide. SPLASH!', 'frog', 1, .3, .5],
      ['And a great spiky boulder came rumbling down the mountain…', 'hedge', 1, .8, .92],
      ['But the monster was only Bun, stretching by the fire. Everybody laughed and laughed!', 'bunny', 1, .08, .2]] },
    { title:'The Night Flyer', lines:[
      ['Flit the bat couldn’t sleep, so she folded her wings and listened to the night.', 'bat', 0, .15, .3],
      ['Down by the water sat the Frog King, as big as a hill!', 'frog', 0, .82, .95],
      ['The Frog King leapt so high, he nearly touched the moon!', 'frog', 1, .6, .8],
      ['Flit spread her wings and swooped right past his nose.', 'bat', 1, .4, .6],
      ['And little Hazel waddled home to bed. Goodnight, everyone.', 'hedge', 0, .1, .25]] },
  ];
  const LUNA_PIC = (() => { const i = new Image(); i.src = 'characters/luna.png'; return i; })();
  let story, li, target, sel, poses, px, d, fuel, match, hold, doneT, scenes, hintT, mask, maskCtx, mframe, react, finale, storyN = -1;
  const k = dd => 1 + 1.7*dd, sp = dd => .75 + .4*dd, baseY = dd => 325 + 72*dd;
  const TALL = { bunny:[93, 126], hedge:[52, 63], bat:[78, 80], frog:[48, 78] };   // how tall each friend is, in each pose

  // ----- the four friends, as simple shapes (drawn lit, or filled flat as a shadow) -----
  function E(c, x, y, rx, ry, rot = 0){ c.moveTo(x + rx*Math.cos(rot), y + rx*Math.sin(rot)); c.ellipse(x, y, rx, ry, rot, 0, Math.PI*2); }
  function P(c, pts){ c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  function shape(c, id, pose){
    c.beginPath();
    if (id === 'bunny'){
      if (!pose){ E(c, 0, -22, 22, 22); E(c, 14, -50, 14, 13); E(c, 8, -76, 5, 17, -.15); E(c, 20, -75, 5, 17, .2); E(c, -22, -16, 7, 7); E(c, 10, -4, 10, 4); }
      else { E(c, 0, -32, 15, 32); E(c, 6, -70, 13, 12); E(c, 0, -102, 5, 24, -.25); E(c, 14, -101, 5, 24, .3); E(c, -16, -26, 7, 7); E(c, 4, -2, 9, 4); E(c, 16, -50, 4, 12, -.5); }
    } else if (id === 'hedge'){
      if (!pose){ const sp2 = []; for (let i = 0; i <= 12; i++){ const a = Math.PI + i/12*Math.PI, r = i % 2 ? 26 : 36; sp2.push([Math.cos(a)*r*1.2, -14 + Math.sin(a)*r]); } P(c, sp2); E(c, 0, -14, 30, 14); P(c, [[24, -24], [46, -12], [26, -6]]); E(c, -14, -2, 5, 5); E(c, 14, -2, 5, 5); }
      else { const sp2 = []; for (let i = 0; i < 22; i++){ const a = i/22*Math.PI*2, r = i % 2 ? 22 : 33; sp2.push([Math.cos(a)*r, -30 + Math.sin(a)*r]); } P(c, sp2); }
    } else if (id === 'bat'){
      if (!pose){ E(c, 0, -30, 11, 20); E(c, 2, -56, 10, 9); P(c, [[-6, -60], [-4, -76], [2, -62]]); P(c, [[4, -62], [10, -76], [10, -58]]); P(c, [[-10, -44], [-18, -10], [-6, -14]]); P(c, [[10, -44], [18, -10], [6, -14]]); E(c, -4, -6, 3, 6); E(c, 4, -6, 3, 6); }
      else { E(c, 0, -34, 11, 19); E(c, 2, -58, 10, 9); P(c, [[-6, -62], [-4, -78], [2, -64]]); P(c, [[4, -64], [10, -78], [10, -60]]);
        for (const s of [-1, 1]) P(c, [[s*8, -46], [s*36, -64], [s*62, -56], [s*76, -40], [s*62, -38], [s*54, -26], [s*42, -32], [s*30, -20], [s*20, -30], [s*8, -24]]);
        E(c, -4, -10, 3, 7); E(c, 4, -10, 3, 7); }
    } else {
      if (!pose){ E(c, 0, -16, 28, 16); E(c, 12, -28, 14, 12); E(c, 6, -40, 7, 7); E(c, 20, -40, 7, 7); E(c, -22, -6, 12, 6); E(c, 22, -4, 9, 4); }
      else { E(c, 0, -42, 30, 13, -.45); E(c, 26, -58, 12, 10, -.45); E(c, 24, -70, 6, 6); E(c, 36, -66, 6, 6); P(c, [[-20, -30], [-46, -8], [-58, -2], [-40, -14], [-24, -24]]); P(c, [[-14, -26], [-34, 0], [-44, 6], [-30, -8], [-18, -20]]); P(c, [[24, -46], [44, -40], [48, -32], [38, -38], [22, -40]]); }
    }
  }
  // put a friend at depth dd (0 by the rock, 1 by the fire) and across at x; shadow = true draws their shadow on the rock
  function place(c, x, dd, shadow, flick = 0){ const s = sp(dd); if (shadow){ const kk = k(dd)*(1 + flick); c.translate(L.x, L.y); c.scale(kk, kk); c.translate(-L.x, -L.y); } c.translate(x, baseY(dd)); c.scale(s, s); }
  function drawFriend(id, pose, x, dd){
    const f = CAST.find(c => c.id === id); ctx.save(); place(ctx, x, dd, false); shape(ctx, id, pose);
    ctx.fillStyle = f.col; ctx.fill(); ctx.strokeStyle = f.dark; ctx.lineWidth = 2/sp(dd); ctx.stroke();
    // a bit of face, so they're friends and not just shapes
    ctx.fillStyle = '#1a1420'; const eye = { bunny:pose ? [9, -72] : [18, -52], hedge:[30, -16], bat:[5, -58], frog:pose ? [26, -70] : [8, -40] }[id]; ctx.beginPath(); ctx.arc(eye[0], eye[1], 2.2, 0, 7); ctx.fill();
    ctx.restore();
  }
  // how much the shadow covers the outline (0..1), worked out on a small hidden canvas
  function overlap(){
    const mw = 200, mh = 120, sc = mw/W; maskCtx.setTransform(1, 0, 0, 1, 0, 0); maskCtx.clearRect(0, 0, mw, mh);
    maskCtx.setTransform(sc, 0, 0, sc, 0, 0); maskCtx.save(); place(maskCtx, target.px, target.d, true); shape(maskCtx, target.id, target.pose); maskCtx.fillStyle = '#f00'; maskCtx.fill(); maskCtx.restore();
    maskCtx.globalCompositeOperation = 'lighter'; maskCtx.save(); place(maskCtx, px, d, true); shape(maskCtx, sel, poses[sel]); maskCtx.fillStyle = '#0f0'; maskCtx.fill(); maskCtx.restore(); maskCtx.globalCompositeOperation = 'source-over';
    const data = maskCtx.getImageData(0, 0, mw, mh).data; let both = 0, any = 0;
    for (let i = 0; i < data.length; i += 4){ const r = data[i] > 100, g = data[i + 1] > 100; if (r || g) any++; if (r && g) both++; }
    return any ? both/any : 0;
  }
  function startLine(i){
    li = i; const [, id, pose, d0, d1] = story.lines[i]; let dd = d0 + Math.random()*(d1 - d0);
    // big shadows still have to fit on the rock: step back a little if the top would be hidden
    const tall = TALL[id][pose], top = q => L.y + (baseY(q) - tall*sp(q) - L.y)*k(q); while (dd > .05 && top(dd) < 64) dd -= .01;
    const kk = k(dd);
    // keep the whole shadow on the rock: the bigger it is, the nearer the middle it has to be
    const spread = Math.max(20, 190/kk), x = L.x + 20 + (Math.random()*2 - 1)*spread;
    target = { id, pose, d:dd, px:x }; hold = 0; hintT = 0; react = null;
  }
  function wrapText(txt, x, y, maxW, lh){ const words = txt.split(' '); let line = ''; for (const w of words){ const tt = line ? line + ' ' + w : w; if (ctx.measureText(tt).width > maxW && line){ ctx.fillText(line, x, y); y += lh; line = w; } else line = tt; } ctx.fillText(line, x, y); }
  function trayRect(i){ return { x:8 + (i % 2)*68, y:338 + Math.floor(i/2)*66, w:64, h:60 }; }
  return {
    title:'Shadow Tales', sub:'Campfire stories by the Moonlit Lake, told in shadows.',
    blurb:'Luna is telling a story by the campfire, and the forest friends are acting it out as shadow puppets on the big rock! Shadows work like real ones: close to the fire they grow HUGE, back by the rock they shrink. Fill each outline before the fire burns down.',
    legend:['Each line of the story puts a faint outline on the rock: make a shadow that fills it', 'Pick a friend (1 2 3 4, or click them): Bun, Hazel, Flit or Puddle', '← → to move them across, ↑ to step back toward the rock (smaller shadow), ↓ to step toward the fire (BIGGER shadow)', 'Space to change their pose', 'The fire burns down while you think: every scene you get right adds a log'],
    hints:['1–4 pick a friend', '← → move  ↑ ↓ nearer the rock / the fire', 'Space changes pose', 'P to pause'],
    pad:['wgLeft', 'wgUp', 'wgDown', 'wgRight', 'wgAction'], actionLabel:'Pose', clicks:true,
    winTitle:'The End!', winText:'Luna takes a bow, the friends take a bow, and the fire crackles up tall and bright. Everyone agrees it was the best story yet.',
    loseTitle:'The fire went out', loseText:'The last embers fade, and the story will have to wait for another night. Luna yawns: “To be continued…”',
    againWinText:'Another tale told! The friends are already arguing about who gets to be the dragon next time.', againLoseText:'The fire burned down. Gather more sticks and try again!',
    reset(){
      if (!mask){ mask = document.createElement('canvas'); mask.width = 200; mask.height = 120; maskCtx = mask.getContext('2d', { willReadFrequently:true }); }
      storyN = (storyN + 1) % STORIES.length; story = STORIES[storyN];
      sel = 'bunny'; poses = { bunny:0, hedge:0, bat:0, frog:0 }; px = 400; d = .5; fuel = FUEL0; match = 0; doneT = 0; scenes = 0; mframe = 0; finale = 0; startLine(0); },
    seeds:() => scenes*3 + (finale ? 6 : 0), stats:() => `<span>Scenes ${scenes}/5</span><span>“${story.title}”</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt; hintT += dt;
      if (finale){ finale += dt; fuel = Math.min(FUEL_MAX, fuel + dt*10); if (finale > 3.4) finish(true); return; }
      fuel -= FUEL_LOST*dt; if (fuel <= 0){ fuel = 0; finish(false); return; }
      for (const key of input.keys){ const i = +key - 1; if (CAST[i]) sel = CAST[i].id; } input.keys.length = 0;
      if (input.click){ const { x, y } = input.click; input.click = null; CAST.forEach((c, i) => { const r = trayRect(i); if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h){ if (sel === c.id) poses[sel] = 1 - poses[sel]; sel = c.id; } }); }
      if (input.pressed){ input.pressed = false; poses[sel] = 1 - poses[sel]; }
      input.taps.length = 0;
      if (doneT > 0){ doneT += dt; if (doneT > 2.4){ doneT = 0; if (li + 1 < story.lines.length) startLine(li + 1); else finale = .01; } return; }
      px = clamp(px + ((input.right ? 1 : 0) - (input.left ? 1 : 0))*230*dt, 150, 650);
      d = clamp(d + ((input.down ? 1 : 0) - (input.up ? 1 : 0))*.55*dt, 0, 1);
      // the right friend in the right pose, close to the outline: the shadow gently settles into place
      const right = sel === target.id && poses[sel] === target.pose, dx = target.px - px, dd = target.d - d;
      if (right && Math.abs(dx) < 50 && Math.abs(dd) < .15){ px += dx*Math.min(1, dt*3.5); d += dd*Math.min(1, dt*3.5); }
      match = right ? clamp(1 - Math.abs(target.px - px)/120 - Math.abs(target.d - d)/.4, 0, 1) : sel === target.id ? .15 : 0;
      if (right && Math.abs(target.px - px) < 6 && Math.abs(target.d - d) < .02){ hold += dt; if (hold > .45){ doneT = .01; scenes++; fuel = Math.min(FUEL_MAX, fuel + 12); anim.happy = 1.5; react = ['Ooooh!', 'Wow!', 'Eek!', 'Hee hee!', 'Ahhh!'][li % 5]; pop(L.x, 150, 'Perfect shadow!', '#ffe9a8'); } }
      else hold = Math.max(0, hold - dt*2);
    },
    draw(){
      const flick = reduceMotion ? 0 : Math.sin(t*13)*.008 + Math.sin(t*7.3)*.006, glow = .35 + .65*Math.min(1, fuel/FUEL0);
      // the night sky, the moon over the lake, and the big rock behind the fire
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a1028'); g.addColorStop(1, '#1e2448'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++){ ctx.fillStyle = `rgba(255,250,230,${.3 + .4*Math.sin(t*1.5 + i)})`; ctx.fillRect(hash(i)*W, hash(i + 40)*90, 2, 2); }
      ctx.fillStyle = '#fbf3d0'; circle(720, 46, 20);
      ctx.save(); ctx.beginPath(); ctx.moveTo(30, 340); ctx.quadraticCurveTo(20, 70, 160, 54); ctx.quadraticCurveTo(400, 26, 640, 54); ctx.quadraticCurveTo(780, 70, 770, 340); ctx.closePath();
      const rg = ctx.createRadialGradient(L.x, L.y, 40, L.x, L.y, 520); rg.addColorStop(0, `rgb(${Math.round(150 + 70*glow)},${Math.round(100 + 40*glow)},${Math.round(70 + 10*glow)})`); rg.addColorStop(1, '#3a3040'); ctx.fillStyle = rg; ctx.fill(); ctx.clip();
      ctx.strokeStyle = 'rgba(40,24,20,.25)'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++){ ctx.beginPath(); ctx.moveTo(60 + i*80, 80 + hash(i)*40); ctx.quadraticCurveTo(90 + i*80, 160, 70 + i*80, 240 + hash(i + 3)*60); ctx.stroke(); }
      // the outline the story asks for (dashed), and every shadow on the rock
      if (!doneT){ ctx.save(); place(ctx, target.px, target.d, true); shape(ctx, target.id, target.pose); ctx.restore(); ctx.save(); ctx.fillStyle = `rgba(255,244,214,${.2 + .06*Math.sin(t*3)})`; ctx.fill(); ctx.setLineDash([6, 4]); ctx.lineDashOffset = -t*16; ctx.strokeStyle = 'rgba(255,248,224,.9)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
      ctx.save(); place(ctx, px, d, true, flick); shape(ctx, sel, poses[sel]); ctx.restore(); ctx.fillStyle = `rgba(20,10,16,${doneT ? .82 : .7})`; ctx.fill();
      ctx.restore();
      // the ground in front of the rock, and a log for the audience on each side
      const gg = ctx.createLinearGradient(0, 320, 0, H); gg.addColorStop(0, '#2a2420'); gg.addColorStop(1, '#14100c'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, 336); ctx.quadraticCurveTo(400, 316, W, 336); ctx.lineTo(W, H); ctx.fill();
      const lg = ctx.createRadialGradient(L.x, L.y + 20, 10, L.x, L.y + 20, 300); lg.addColorStop(0, `rgba(255,170,80,${.45*glow})`); lg.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 300, W, H - 300);
      // the friend on stage, between the fire and the rock
      drawFriend(sel, poses[sel], px, d);
      // the campfire, in front of everything (it grows as you add logs)
      { const fs = .6 + .5*Math.min(1, fuel/FUEL0) + (finale ? Math.min(.6, finale*.3) : 0);
        ctx.fillStyle = '#5a3a20'; ctx.save(); ctx.translate(L.x, 462); ctx.rotate(.18); rr(-50, -7, 100, 14, 6); ctx.fill(); ctx.rotate(-.36); rr(-50, -7, 100, 14, 6); ctx.fill(); ctx.restore();
        for (let i = 0; i < 4; i++){ const h = (54 - i*10)*fs*(1 + Math.sin(t*9 + i*2)*.12), w = (26 - i*5)*fs; ctx.fillStyle = ['#d0401a', '#f07a20', '#ffb830', '#fff0a0'][i]; ctx.beginPath(); ctx.moveTo(L.x - w, 458); ctx.quadraticCurveTo(L.x - w*.7, 458 - h*.6, L.x + Math.sin(t*6 + i)*4, 458 - h); ctx.quadraticCurveTo(L.x + w*.7, 458 - h*.6, L.x + w, 458); ctx.fill(); }
        if (!reduceMotion) for (let i = 0; i < 6; i++){ const a = wrap(t*.8 + i/6, 1); ctx.fillStyle = `rgba(255,200,90,${1 - a})`; ctx.fillRect(L.x - 20 + hash(i)*40 + Math.sin(t*3 + i)*10, 440 - a*120*fs, 2, 2); } }
      // Luna the owl telling the story, and you listening
      if (LUNA_PIC.complete && LUNA_PIC.naturalWidth){ const h = 96, w = h*LUNA_PIC.naturalWidth/LUNA_PIC.naturalHeight; ctx.save(); ctx.translate(708, 468 - h); ctx.scale(-1, 1); ctx.drawImage(LUNA_PIC, -w/2, 0, w, h); ctx.restore(); }
      ctx.fillStyle = '#4a3020'; rr(650, 462, 120, 16, 6); ctx.fill(); rr(150, 462, 110, 16, 6); ctx.fill();
      Chin.draw(ctx, 'me', anim, 205, 466, { scale:.07, face:1, grounded:true, speed:0 });
      if (react && doneT){ ctx.fillStyle = '#fff6e4'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(react, 205, 392 - Math.min(10, doneT*20)); ctx.textAlign = 'left'; }
      // the story, in Luna's words
      ctx.fillStyle = 'rgba(16,12,30,.85)'; rr(8, 56, 132, 274, 10); ctx.fill(); ctx.strokeStyle = '#ffd58a'; ctx.lineWidth = 2; rr(8, 56, 132, 274, 10); ctx.stroke();
      ctx.fillStyle = '#ffd58a'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.fillText('Luna says…', 18, 76);
      ctx.fillStyle = '#f6efe0'; ctx.font = '600 14px Nunito, sans-serif';
      wrapText(finale ? '…and that’s the end of the story. Hoo-ray!' : story.lines[li][0], 18, 98, 114, 18);
      if (!finale && hintT > 14 && !doneT){ const f = CAST.find(c => c.id === target.id); ctx.fillStyle = '#9ad8ff'; ctx.font = '600 12px Nunito, sans-serif';
        wrapText(`Psst… try ${f.name}, ${f.poses[target.pose]}, ${target.d > .6 ? 'close to the fire' : target.d < .3 ? 'back by the rock' : 'in the middle'}.`, 18, 262, 114, 15); }
      // the cast: pick a friend (click again, or Space, to change their pose)
      CAST.forEach((c, i) => { const r = trayRect(i), on = sel === c.id; ctx.fillStyle = on ? 'rgba(255,214,140,.3)' : 'rgba(16,12,30,.7)'; rr(r.x, r.y, r.w, r.h, 10); ctx.fill(); if (on){ ctx.strokeStyle = '#ffd58a'; ctx.lineWidth = 2.5; rr(r.x, r.y, r.w, r.h, 10); ctx.stroke(); }
        ctx.save(); ctx.translate(r.x + r.w/2, r.y + r.h - 18); ctx.scale(.3, .3); shape(ctx, c.id, poses[c.id]); ctx.fillStyle = c.col; ctx.fill(); ctx.restore();
        ctx.fillStyle = on ? '#ffe9a8' : '#f6efe0'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(`${i + 1} ${c.name}`, r.x + r.w/2, r.y + r.h - 5); ctx.textAlign = 'left'; });
      if (finale){ ctx.fillStyle = `rgba(255,233,168,${Math.min(1, finale)})`; ctx.font = '700 44px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('The End', L.x, 200); ctx.textAlign = 'left'; }
      drawPops(0);
    },
    hud(){
      hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Scene ${Math.min(5, li + 1)}/5`, 24, 31);
      // how well the shadow fills the outline
      ctx.fillText('Match', 160, 31); ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(222, 23, 130, 14, 6); ctx.fill(); const mk = doneT || finale ? 1 : match;
      ctx.fillStyle = mk >= 1 ? '#ffe066' : '#9ad8ff'; rr(222, 23, 130*mk, 14, 6); ctx.fill();
      ctx.fillStyle = '#fff6e4'; ctx.fillText('Fire', 420, 31); ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(466, 23, 160, 14, 6); ctx.fill();
      ctx.fillStyle = fuel < 12 ? '#ff6a5a' : '#ffa040'; rr(466, 23, 160*fuel/FUEL_MAX, 14, 6); ctx.fill();
      ctx.textBaseline = 'alphabetic';
    },
    idle(dt){ px = 400 + Math.sin(t*.6)*120; d = .5 + Math.sin(t*.4)*.45; },
  };
})();

// ================= Golden Jungle: Sloth's Lullaby =================
// The sloth is trying to fall asleep, but the jungle is noisy! Monkeys, parrots, frogs and toucans pop
// up around the clearing and get ready to shout. Shush each one (click it) before it shouts. Catch the
// drifting fireflies to make it extra sleepy. Fill the sleep meter to win; if the sloth wakes all the
// way up, it's too grumpy to try again tonight.
const SLOTH = (() => {
  const SPOTS = [[110, 330], [210, 175], [590, 170], [690, 330], [400, 420], [90, 160], [710, 160], [250, 410], [560, 410]];
  const KINDS = [
    { id:'monkey', say:'OOK OOK!', col:'#a0703a' }, { id:'parrot', say:'SQUAWK!', col:'#e0402a' },
    { id:'frog', say:'RIBBIT!', col:'#5aaa4a' }, { id:'toucan', say:'TOK TOK!', col:'#2a2a2a' },
  ];
  let sleep, critters, flies, spawnT, cur, zs, shushes, wokeT, lastAim;
  function spawn(){
    const free = SPOTS.map((p, i) => i).filter(i => !critters.some(c => c.spot === i)); if (!free.length) return;
    const spot = free[Math.floor(Math.random()*free.length)], k = KINDS[Math.floor(Math.random()*KINDS.length)];
    critters.push({ spot, k, t:0, fuse:2.6 - Math.min(1.2, sleep/80), up:0, shushed:0 });
  }
  function critter(c, x, y){
    const up = c.up, s = .9; ctx.save(); ctx.translate(x, y + (1 - up)*40); ctx.scale(s, s);
    if (c.k.id === 'monkey'){ ctx.fillStyle = c.k.col; circle(0, -30, 22); circle(-22, -36, 8); circle(22, -36, 8); ctx.fillStyle = '#e8c8a0'; circle(0, -24, 13); ctx.fillStyle = '#1a1a1a'; circle(-6, -32, 2.5); circle(6, -32, 2.5); }
    else if (c.k.id === 'parrot'){ ctx.fillStyle = c.k.col; ctx.beginPath(); ctx.ellipse(0, -30, 16, 24, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2a7ad0'; ctx.beginPath(); ctx.ellipse(-12, -24, 7, 16, .3, 0, 7); ctx.fill(); ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(10, -42); ctx.lineTo(22, -36); ctx.lineTo(10, -32); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(4, -42, 2.5); }
    else if (c.k.id === 'frog'){ ctx.fillStyle = c.k.col; ctx.beginPath(); ctx.ellipse(0, -18, 24, 16, 0, 0, 7); ctx.fill(); circle(-11, -32, 8); circle(11, -32, 8); ctx.fillStyle = '#fff'; circle(-11, -33, 5); circle(11, -33, 5); ctx.fillStyle = '#1a1a1a'; circle(-11, -33, 2.5); circle(11, -33, 2.5); }
    else { ctx.fillStyle = c.k.col; ctx.beginPath(); ctx.ellipse(0, -28, 15, 22, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; circle(2, -40, 8); ctx.fillStyle = '#f08a2a'; ctx.beginPath(); ctx.moveTo(6, -46); ctx.quadraticCurveTo(40, -44, 34, -34); ctx.lineTo(6, -36); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(2, -41, 2.4); }
    if (c.shushed){ ctx.fillStyle = '#fff6e4'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('…shh', 0, -64); ctx.textAlign = 'left'; }
    else if (up > .9){ const k = c.t/c.fuse; ctx.strokeStyle = `rgba(255,${Math.round(230 - k*170)},${Math.round(120 - k*100)},.95)`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -30, 34, -Math.PI/2, -Math.PI/2 + k*Math.PI*2); ctx.stroke(); }
    ctx.restore();
  }
  function shush(x, y){
    let best = null, bd = 60; for (const c of critters){ if (c.shushed) continue; const [sx, sy] = SPOTS[c.spot], dd = Math.hypot(x - sx, y - (sy - 28)); if (dd < bd){ bd = dd; best = c; } }
    if (best){ best.shushed = .01; shushes++; pop(SPOTS[best.spot][0], SPOTS[best.spot][1] - 80, 'Shhh!', '#bfe8ff'); return; }
    for (const f of flies) if (!f.got && Math.hypot(x - f.x, y - f.y) < 30){ f.got = true; sleep = Math.min(100, sleep + 5); pop(f.x, f.y - 16, '+sleepy', '#fff3a0'); return; }
  }
  return {
    title:'Sloth’s Lullaby', sub:'Help the sleepy sloth fall asleep in the noisy jungle.',
    blurb:'The sloth is SO tired, but the jungle is full of noisy neighbors! Shush every monkey, parrot, frog and toucan before they shout, and catch the fireflies to make the sloth extra sleepy.',
    legend:['Critters pop up around the clearing, getting ready to shout', 'Click one (or move the paw with the arrows and press Space) to shush it before its circle fills', 'Catch the drifting fireflies for extra sleepiness', 'Fill the sleep meter to win, but don’t let the sloth wake right up!'],
    hints:['Click to shush', 'Arrows + Space work too', 'P to pause'], pad:['wgLeft', 'wgUp', 'wgDown', 'wgRight', 'wgAction'], actionLabel:'Shh!', clicks:true,
    winTitle:'Fast asleep!', winText:'The sloth gives one enormous yawn, curls its claws around the branch and starts to snore. The whole jungle tiptoes away.',
    loseTitle:'Wide awake!', loseText:'The sloth is so grumpy it climbs to the very top of the tree. Maybe tomorrow night.',
    againWinText:'Snoring again! You’re the best sloth-sitter in the jungle.', againLoseText:'The jungle was just too noisy tonight. Try again!',
    reset(){ sleep = 35; critters = []; flies = []; spawnT = 1; cur = { x:400, y:300 }; zs = []; shushes = 0; wokeT = 0; lastAim = null; },
    seeds:() => Math.floor(shushes/2), stats:() => `<span>Shushed ${shushes}</span><span>Sleep ${Math.round(sleep)}%</span><span>Time ${time.toFixed(0)} s</span>`,
    update(dt){
      time += dt; wokeT = Math.max(0, wokeT - dt);
      sleep = Math.min(100, sleep + dt*(critters.some(c => !c.shushed && c.up > .9) ? .5 : 2.2));
      spawnT -= dt; if (spawnT <= 0){ spawn(); spawnT = Math.max(.6, 1.9 - sleep/70) + Math.random()*.6; }
      if (Math.random() < dt*.5) flies.push({ x:Math.random() < .5 ? -10 : W + 10, y:120 + Math.random()*260, vx:0, ph:Math.random()*6, life:9 });
      for (const f of flies){ f.life -= dt; f.x += (f.x < 400 ? 1 : -1)*0 + Math.sin(t + f.ph)*30*dt + (f.ph > 3 ? 40 : -40)*dt; f.y += Math.cos(t*1.3 + f.ph)*20*dt; }
      flies = flies.filter(f => !f.got && f.life > 0 && f.x > -30 && f.x < W + 30);
      for (const c of critters){
        if (c.shushed){ c.shushed += dt; c.up = Math.max(0, 1 - (c.shushed - .6)*3); continue; }
        c.up = Math.min(1, c.up + dt*4); if (c.up >= 1) c.t += dt;
        if (c.t >= c.fuse){ c.shushed = .01; sleep -= 16; wokeT = 1; shake = .4; anim.happy = 0; pop(SPOTS[c.spot][0], SPOTS[c.spot][1] - 80, c.k.say, '#ffb0a0'); }
      }
      critters = critters.filter(c => !c.shushed || c.shushed < 1);
      if (input.aim && input.aim !== lastAim){ lastAim = input.aim; cur = { ...input.aim }; }
      cur.x = clamp(cur.x + ((input.right ? 1 : 0) - (input.left ? 1 : 0))*420*dt, 20, W - 20); cur.y = clamp(cur.y + ((input.down ? 1 : 0) - (input.up ? 1 : 0))*420*dt, 60, H - 20);
      if (input.click){ cur = { ...input.click }; shush(input.click.x, input.click.y); input.click = null; }
      if (input.pressed){ input.pressed = false; shush(cur.x, cur.y); }
      input.taps.length = 0;
      if (Math.random() < dt*1.5) zs.push({ x:430, y:150, life:2 }); for (const z of zs){ z.life -= dt; z.y -= 20*dt; z.x += 10*dt; } zs = zs.filter(z => z.life > 0);
      if (sleep >= 100) finish(true); else if (sleep <= 0){ sleep = 0; finish(false); }
    },
    draw(){
      // a jungle clearing at dusk
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a3a5a'); g.addColorStop(.6, '#3a5a3a'); g.addColorStop(1, '#1e3a1e'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 12; i++){ ctx.fillStyle = `rgba(20,50,25,${.5 + hash(i)*.4})`; ctx.beginPath(); ctx.ellipse(hash(i + 3)*W, 470 - hash(i)*60, 90 + hash(i + 5)*60, 70, 0, Math.PI, 0); ctx.fill(); }
      for (const [x, y] of SPOTS){ ctx.fillStyle = '#2a5a2a'; ctx.beginPath(); ctx.ellipse(x, y + 4, 46, 22, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#3a7a3a'; for (let k = -2; k <= 2; k++){ ctx.beginPath(); ctx.ellipse(x + k*16, y - 4, 10, 18, k*.3, 0, 7); ctx.fill(); } }
      // the branch and the sleepy sloth hanging from it
      ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(150, 90); ctx.quadraticCurveTo(400, 70, 650, 100); ctx.stroke();
      { const sw = Math.sin(t*.8)*.05, awake = wokeT > 0 || sleep < 25; ctx.save(); ctx.translate(400, 84); ctx.rotate(sw);
        ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 9; ctx.lineCap = 'round'; for (const ax of [-30, 30]){ ctx.beginPath(); ctx.moveTo(ax, 4); ctx.lineTo(ax*.6, 70); ctx.stroke(); } ctx.lineCap = 'butt';
        ctx.fillStyle = '#9a7a5a'; ctx.beginPath(); ctx.ellipse(0, 100, 46, 40, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#c8a888'; ctx.beginPath(); ctx.ellipse(0, 128, 30, 24, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#e8d8c0'; ctx.beginPath(); ctx.ellipse(0, 132, 22, 16, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#5a3a2a'; ctx.beginPath(); ctx.ellipse(-10, 128, 9, 5, -.3, 0, 7); ctx.ellipse(10, 128, 9, 5, .3, 0, 7); ctx.fill();
        ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; if (awake){ ctx.fillStyle = '#1a1a1a'; circle(-10, 128, 3); circle(10, 128, 3); } else { ctx.beginPath(); ctx.arc(-10, 127, 4, .2, Math.PI - .2); ctx.moveTo(14, 127); ctx.arc(10, 127, 4, .2, Math.PI - .2); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 140, awake ? 5 : 3, .3, Math.PI - .3); ctx.stroke(); ctx.restore(); }
      ctx.fillStyle = '#fff6e4'; ctx.font = '700 20px "Pixelify Sans", monospace'; for (const z of zs){ ctx.globalAlpha = Math.min(1, z.life); ctx.fillText('z', z.x, z.y); } ctx.globalAlpha = 1;
      for (const f of flies){ const fg = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, 16); fg.addColorStop(0, 'rgba(255,250,160,.9)'); fg.addColorStop(1, 'rgba(255,250,160,0)'); ctx.fillStyle = fg; circle(f.x, f.y, 16); }
      for (const c of critters){ const [x, y] = SPOTS[c.spot]; critter(c, x, y); }
      // your shushing paw
      ctx.fillStyle = 'rgba(255,246,228,.9)'; ctx.beginPath(); ctx.ellipse(cur.x, cur.y, 11, 13, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,180,190,.9)'; circle(cur.x, cur.y + 2, 4); for (let k = -1; k <= 1; k++) circle(cur.x + k*6, cur.y - 10, 2.6);
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText('Sleepy', 24, 31); ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(110, 22, 260, 16, 6); ctx.fill(); ctx.fillStyle = sleep > 60 ? '#b8a0ff' : sleep > 25 ? '#9ad8ff' : '#ff8a7a'; rr(110, 22, 260*sleep/100, 16, 6); ctx.fill();
      ctx.fillStyle = '#fff6e4'; ctx.textAlign = 'right'; ctx.fillText(`Shushed ${shushes}`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Starry Nebula: Constellations =================
// The star chimes ring, and a picture appears faintly in the sky: a bunny, a teacup, a whale… Trace it by
// clicking its stars one after another along the picture's outline (other stars are just there to trick
// you). Finish the picture and the constellation comes alive and swims, hops or sails away.
const STARS = (() => {
  const PICS = [
    { name:'the Moon Bunny', pts:[[0,40],[-10,0],[-26,-60],[-14,-58],[-2,-10],[10,-58],[22,-60],[14,0],[30,30],[10,50],[-20,50]] },
    { name:'the Teacup', pts:[[-50,-20],[50,-20],[40,40],[-40,40],[-50,-20]].concat([[50,-20],[78,-6],[70,24],[44,20]]) },
    { name:'the Star Whale', pts:[[-80,0],[-40,-30],[30,-30],[70,-6],[96,-34],[100,10],[70,10],[30,32],[-40,30],[-80,0]] },
    { name:'the Rocket', pts:[[0,-80],[24,-40],[24,30],[44,56],[14,46],[0,60],[-14,46],[-44,56],[-24,30],[-24,-40],[0,-80]] },
    { name:'the Chinchilla', pts:[[-40,50],[-50,0],[-36,-40],[-50,-80],[-20,-56],[0,-60],[20,-56],[50,-80],[36,-40],[50,0],[40,50],[-40,50]] },
  ];
  let pic, pi, stars, path, done, cx, cy, mistakes, timeLeft, aliveT, cur, lastAim, total;
  function setup(i){
    pi = i; pic = PICS[i]; cx = 400 + (Math.random() - .5)*120; cy = 260 + (Math.random() - .5)*40;
    // the picture's own stars (a star repeated in the outline is the same star), plus decoys
    const uniq = []; pic.idx = pic.pts.map(([x, y]) => { let j = uniq.findIndex(u => u[0] === x && u[1] === y); if (j < 0){ uniq.push([x, y]); j = uniq.length - 1; } return j; });
    stars = uniq.map(([x, y]) => ({ x:cx + x*1.6, y:cy + y*1.6, real:true }));
    for (let k = 0; k < 9; k++){ let x, y, ok; do { x = 120 + Math.random()*560; y = 90 + Math.random()*330; ok = stars.every(s => Math.hypot(s.x - x, s.y - y) > 46); } while (!ok); stars.push({ x, y, real:false }); }
    path = [pic.idx[0]]; done = false; aliveT = 0; timeLeft = 30;
  }
  function pick(x, y){
    if (done) return; let best = -1, bd = 26; stars.forEach((s, i) => { const dd = Math.hypot(s.x - x, s.y - y); if (dd < bd){ bd = dd; best = i; } }); if (best < 0) return;
    const want = pic.idx[path.length];
    if (best === want){ path.push(best); playNote(392 + path.length*30, .4); if (path.length === pic.idx.length){ done = true; aliveT = .01; total++; pop(cx, cy - 120, `It’s ${pic.name}!`, '#fff3c0'); anim.happy = 2; } }
    else if (best !== path[path.length - 1]){ mistakes++; timeLeft -= 3; shake = .2; pop(stars[best].x, stars[best].y - 16, 'Not that one…', '#ffb0c0'); }
  }
  return {
    title:'Constellations', sub:'Trace the pictures in the stars over the Starry Nebula.',
    blurb:'The star chimes ring and a picture appears faintly across the sky. Click its stars one after another along the outline to bring it to life! Watch out: some stars are just there to trick you.',
    legend:['A faint picture appears in the sky, starting from the glowing star', 'Click the next star along its outline, then the next, all the way round', 'Decoy stars don’t belong to the picture (a wrong one costs 3 seconds)', 'Finish all five constellations'],
    hints:['Click stars along the outline', 'Arrows + Space work too', 'P to pause'], pad:['wgLeft', 'wgUp', 'wgDown', 'wgRight', 'wgAction'], actionLabel:'Pick star', clicks:true,
    winTitle:'The sky is full of stories!', winText:'All five constellations twinkle over the Nebula, and every one of them winks at you.',
    loseTitle:'Clouds rolled in', loseText:'A sleepy cloud drifted over the stars before you could finish. Try again another night!',
    againWinText:'Five more pictures in the sky! The Star Whale sings for you.', againLoseText:'The clouds won this time. The stars will be back!',
    reset(){ mistakes = 0; total = 0; cur = { x:400, y:260 }; lastAim = null; setup(0); },
    seeds:() => total*3, stats:() => `<span>Constellations ${total}/5</span><span>Wrong stars ${mistakes}</span>`,
    update(dt){
      time += dt;
      if (done){ aliveT += dt; if (aliveT > 2.6){ if (pi + 1 >= PICS.length) finish(true); else setup(pi + 1); } return; }
      timeLeft -= dt; if (timeLeft <= 0){ finish(false); return; }
      if (input.aim && input.aim !== lastAim){ lastAim = input.aim; cur = { ...input.aim }; }
      cur.x = clamp(cur.x + ((input.right ? 1 : 0) - (input.left ? 1 : 0))*380*dt, 10, W - 10); cur.y = clamp(cur.y + ((input.down ? 1 : 0) - (input.up ? 1 : 0))*380*dt, 60, H - 10);
      if (input.click){ cur = { ...input.click }; pick(input.click.x, input.click.y); input.click = null; }
      if (input.pressed){ input.pressed = false; pick(cur.x, cur.y); }
      input.taps.length = 0;
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0620'); g.addColorStop(1, '#2a1048'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 90; i++){ ctx.fillStyle = `rgba(255,255,255,${.2 + .3*Math.sin(t*2 + i)})`; ctx.fillRect(hash(i)*W, hash(i + 90)*H, 1.5, 1.5); }
      const ng = ctx.createRadialGradient(560, 140, 20, 560, 140, 260); ng.addColorStop(0, 'rgba(200,120,255,.2)'); ng.addColorStop(1, 'rgba(200,120,255,0)'); ctx.fillStyle = ng; circle(560, 140, 260);
      // the faint picture to trace
      const off = done ? Math.min(1, aliveT)*Math.sin(aliveT*3)*14 : 0;
      ctx.strokeStyle = done ? 'rgba(255,240,180,.9)' : 'rgba(200,190,255,.22)'; ctx.lineWidth = done ? 3 : 6; ctx.lineJoin = 'round'; ctx.beginPath();
      pic.idx.forEach((j, k) => { const s = stars[j]; k ? ctx.lineTo(s.x + off, s.y - off*.5) : ctx.moveTo(s.x + off, s.y - off*.5); }); ctx.stroke();
      // the lines you've traced
      ctx.strokeStyle = '#fff3c0'; ctx.lineWidth = 2.5; ctx.beginPath(); path.forEach((j, k) => { const s = stars[j]; k ? ctx.lineTo(s.x + off, s.y - off*.5) : ctx.moveTo(s.x + off, s.y - off*.5); }); ctx.stroke();
      stars.forEach((s, i) => { const on = path.includes(i), next = !done && i === pic.idx[path.length], r = on ? 5 : 3.5 + Math.sin(t*3 + i)*.8;
        const sg = ctx.createRadialGradient(s.x, s.y, 1, s.x, s.y, on ? 18 : 12); sg.addColorStop(0, on ? 'rgba(255,240,180,.9)' : 'rgba(220,220,255,.7)'); sg.addColorStop(1, 'rgba(220,220,255,0)'); ctx.fillStyle = sg; circle(s.x + (done && s.real ? off : 0), s.y, on ? 18 : 12);
        ctx.fillStyle = '#fff'; circle(s.x + (done && s.real ? off : 0), s.y, r); if (i === path[path.length - 1] && !done){ ctx.strokeStyle = 'rgba(255,240,180,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, 12 + Math.sin(t*5)*2, 0, 7); ctx.stroke(); } void next; });
      ctx.strokeStyle = 'rgba(255,246,228,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cur.x, cur.y, 14, 0, 7); ctx.stroke();
      ctx.fillStyle = '#e8d8ff'; ctx.font = '600 15px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(done ? `${pic.name[0].toUpperCase()}${pic.name.slice(1)} comes alive!` : 'Trace the picture, starting from the glowing star', 400, H - 20); ctx.textAlign = 'left';
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Picture ${pi + 1}/5`, 24, 31); progress(pic ? path.length/pic.idx.length : 0, '#fff3c0');
      ctx.textAlign = 'right'; ctx.fillStyle = timeLeft < 8 ? '#ff8a9a' : '#fff6e4'; ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Neon City: Neon Circuit =================
// The city's neon signs have gone dark! Rotate the wire tiles (click them) to carry power from the plug
// on the left to every sign on the right. Powered wires glow. Relight four blocks before the timer runs out.
const CIRCUIT = (() => {
  const COLS = 8, ROWS = 5, TS = 70, OX = 400 - COLS*TS/2, OY = 100, N = 1, E = 2, S = 4, Wd = 8, SIGNS = ['NOODLES', 'ARCADE', 'HOTEL', 'BEATS', 'BOTS', 'TACOS'];
  const SIGN_COLS = ['255,106,213', '90,220,255', '255,230,110', '130,255,160'];
  let grid, src, signs, lit, level, timeLeft, cur, moves, doneT, wins;
  const rot = (m, r) => { for (let i = 0; i < r; i++) m = ((m << 1) | (m >> 3)) & 15; return m; };
  function build(){
    // a random spanning tree over the grid (every tile ends up with a wire), then each tile is spun
    const conn = Array.from({ length:ROWS }, () => Array(COLS).fill(0)), seen = Array.from({ length:ROWS }, () => Array(COLS).fill(false));
    const start = [Math.floor(ROWS/2), 0], stack = [start]; seen[start[0]][start[1]] = true;
    while (stack.length){ const [r, c] = stack[stack.length - 1]; const opts = [[r - 1, c, N, S], [r, c + 1, E, Wd], [r + 1, c, S, N], [r, c - 1, Wd, E]].filter(([rr2, cc]) => rr2 >= 0 && rr2 < ROWS && cc >= 0 && cc < COLS && !seen[rr2][cc]);
      if (!opts.length){ stack.pop(); continue; } const [r2, c2, a, b] = opts[Math.floor(Math.random()*opts.length)]; conn[r][c] |= a; conn[r2][c2] |= b; seen[r2][c2] = true; stack.push([r2, c2]); }
    conn[start[0]][0] |= Wd; src = start[0];
    const rows = [0, 1, 2, 3, 4].sort(() => Math.random() - .5).slice(0, 2 + Math.min(1, level)); signs = rows.map((r, i) => ({ r, name:SIGNS[(level*2 + i) % SIGNS.length], col:SIGN_COLS[(level + i) % 4] }));
    for (const s of signs) conn[s.r][COLS - 1] |= E;
    grid = conn.map(row => row.map(m => ({ m, r:Math.floor(Math.random()*4), spin:0 })));
    doneT = 0; check();
  }
  const mask = (r, c) => rot(grid[r][c].m, grid[r][c].r);
  function check(){
    lit = Array.from({ length:ROWS }, () => Array(COLS).fill(false));
    if (!(mask(src, 0) & Wd)) return false;
    const q = [[src, 0]]; lit[src][0] = true;
    while (q.length){ const [r, c] = q.shift(), m = mask(r, c);
      for (const [d, dr, dc, back] of [[N, -1, 0, S], [E, 0, 1, Wd], [S, 1, 0, N], [Wd, 0, -1, E]]){ const r2 = r + dr, c2 = c + dc; if (!(m & d) || r2 < 0 || r2 >= ROWS || c2 < 0 || c2 >= COLS || lit[r2][c2]) continue; if (mask(r2, c2) & back){ lit[r2][c2] = true; q.push([r2, c2]); } } }
    return signs.every(s => lit[s.r][COLS - 1] && (mask(s.r, COLS - 1) & E));
  }
  function spin(r, c){ if (doneT || r < 0 || r >= ROWS || c < 0 || c >= COLS) return; grid[r][c].r = (grid[r][c].r + 1) % 4; grid[r][c].spin = 1; moves++; if (check()){ doneT = .01; wins++; playNote(523, .5); anim.happy = 2; pop(400, OY - 20, 'The block lights up!', '#ffe066'); } }
  return {
    title:'Neon Circuit', sub:'Rewire the dark neon signs of Neon City.',
    blurb:'A power cut has turned the neon signs dark! Spin the wire tiles to carry power from the plug to every sign. Relight four city blocks before the timer runs out.',
    legend:['Click a tile to spin it a quarter turn (or move with the arrows and press Space)', 'Power flows from the plug on the left through every connected wire', 'Connect every sign on the right to light up the block', 'Four blocks to relight'],
    hints:['Click tiles to spin them', 'Arrows + Space work too', 'P to pause'], pad:['wgLeft', 'wgUp', 'wgDown', 'wgRight', 'wgAction'], actionLabel:'Spin', clicks:true,
    winTitle:'The city glows again!', winText:'Sign after sign flickers back on, and Neon City shines brighter than ever. The noodle robot gives you a standing ovation.',
    loseTitle:'Still dark', loseText:'The power company robot sighs and switches the city to emergency candles. Try again!',
    againWinText:'Every sign is buzzing. Electrician of the year!', againLoseText:'A few blocks are still dark. Give it another go!',
    reset(){ level = 0; wins = 0; moves = 0; timeLeft = 180; cur = [2, 0]; build(); },
    seeds:() => wins*4, stats:() => `<span>Blocks lit ${wins}/4</span><span>Spins ${moves}</span><span>Time left ${Math.max(0, Math.ceil(timeLeft))} s</span>`,
    update(dt){
      time += dt; for (const row of grid) for (const g of row) g.spin = Math.max(0, g.spin - dt*8);
      if (doneT){ doneT += dt; if (doneT > 1.8){ level++; if (wins >= 4) finish(true); else build(); } return; }
      timeLeft -= dt; if (timeLeft <= 0){ finish(false); return; }
      for (const k of input.taps){ if (k === 'left') cur[1] = Math.max(0, cur[1] - 1); if (k === 'right') cur[1] = Math.min(COLS - 1, cur[1] + 1); if (k === 'up') cur[0] = Math.max(0, cur[0] - 1); if (k === 'down') cur[0] = Math.min(ROWS - 1, cur[0] + 1); }
      input.taps.length = 0;
      if (input.pressed){ input.pressed = false; spin(cur[0], cur[1]); }
      if (input.click){ const c = Math.floor((input.click.x - OX)/TS), r = Math.floor((input.click.y - OY)/TS); input.click = null; if (r >= 0 && r < ROWS && c >= 0 && c < COLS){ cur = [r, c]; spin(r, c); } }
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0620'); g.addColorStop(1, '#2a0f4a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 16; i++){ const x = i*52, h = 80 + hash(i)*180; ctx.fillStyle = '#140a28'; ctx.fillRect(x, H - h, 46, h); }
      // the plug, and the signs waiting for power
      { const y = OY + src*TS + TS/2; ctx.fillStyle = '#9aa0b8'; rr(OX - 66, y - 18, 44, 36, 6); ctx.fill(); ctx.fillStyle = '#ffe066'; ctx.fillRect(OX - 24, y - 4, 24, 8); ctx.fillStyle = '#2a2040'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.fillText('PWR', OX - 58, y + 4); }
      for (const s of signs){ const y = OY + s.r*TS + TS/2, on = lit[s.r][COLS - 1] && (mask(s.r, COLS - 1) & E), x = OX + COLS*TS + 10; ctx.fillStyle = '#120a22'; rr(x, y - 20, 100, 40, 8); ctx.fill();
        ctx.fillStyle = `rgba(${s.col},${on ? 1 : .18})`; ctx.font = '700 15px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; if (on){ ctx.shadowColor = `rgb(${s.col})`; ctx.shadowBlur = 14; } ctx.fillText(s.name, x + 50, y + 5); ctx.shadowBlur = 0; ctx.textAlign = 'left'; }
      // the wire tiles
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++){ const x = OX + c*TS, y = OY + r*TS, gt = grid[r][c], m = mask(r, c), on = lit[r][c];
        ctx.fillStyle = '#1a1030'; rr(x + 3, y + 3, TS - 6, TS - 6, 8); ctx.fill(); ctx.strokeStyle = 'rgba(90,220,255,.15)'; ctx.lineWidth = 1; rr(x + 3, y + 3, TS - 6, TS - 6, 8); ctx.stroke();
        ctx.save(); ctx.translate(x + TS/2, y + TS/2); ctx.rotate(-gt.spin*Math.PI/2);
        ctx.strokeStyle = on ? '#ffe066' : '#4a4060'; ctx.lineWidth = 9; ctx.lineCap = 'round'; if (on){ ctx.shadowColor = '#ffd040'; ctx.shadowBlur = 12; }
        ctx.beginPath(); for (const [d, dx, dy] of [[N, 0, -1], [E, 1, 0], [S, 0, 1], [Wd, -1, 0]]) if (m & d){ ctx.moveTo(0, 0); ctx.lineTo(dx*TS/2, dy*TS/2); } ctx.stroke(); ctx.shadowBlur = 0; ctx.lineCap = 'butt';
        ctx.fillStyle = on ? '#fff3a0' : '#5a5070'; circle(0, 0, 7); ctx.restore(); }
      ctx.strokeStyle = '#ff6ad5'; ctx.lineWidth = 3; rr(OX + cur[1]*TS + 2, OY + cur[0]*TS + 2, TS - 4, TS - 4, 9); ctx.stroke();
      ctx.fillStyle = '#e8d8ff'; ctx.font = '600 14px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Spin the tiles so power reaches every sign', 400, H - 24); ctx.textAlign = 'left';
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Block ${Math.min(4, wins + 1)}/4`, 24, 31); progress(wins/4, '#ff6ad5');
      ctx.textAlign = 'right'; ctx.fillStyle = timeLeft < 20 ? '#ff8a9a' : '#fff6e4'; ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Coral Sea: Octopus Juggle =================
// The octopus is showing off, and you're its juggling partner! Shells sink slowly through the water;
// slide the octopus under them (← →) so they bounce back up off its arms. More shells join in as you go.
// Space flails all eight arms at once for a big catch. Drop three and the show's over.
const JUGGLE = (() => {
  const FLOOR = 470, ARM_Y = 370, LEN = 50;
  let ox, shells, drops, bounces, nextAdd, flail, flailCD, bubbles;
  const addShell = () => shells.push({ x:120 + Math.random()*560, y:80, vx:(Math.random() - .5)*80, vy:0, col:['#ffb05a', '#f6f0ff', '#5ad0c0', '#ff8ab8', '#c8a0ff'][shells.length % 5], spin:0 });
  return {
    title:'Octopus Juggle', sub:'Help the octopus juggle shells under the sea.',
    blurb:'The octopus wants to juggle more shells than anyone in the Coral Sea! Slide under each sinking shell to bounce it back up. Drop three and the show is over.',
    legend:['← → to slide the octopus under the sinking shells', 'Shells bounce up off its arms; more join in every few seconds', 'Space waves all eight arms for a wide catch (it needs a moment to recharge)', 'Keep it going for 50 seconds'],
    hints:['← → slide', 'Space for a big catch', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgAction'], actionLabel:'Flail!',
    winTitle:'Standing ovation!', winText:'The whole reef claps its fins. The octopus is so happy it juggles you a thank-you pearl.',
    loseTitle:'Clatter!', loseText:'Three shells hit the sand. The octopus laughs so hard it squirts ink. Try again!',
    againWinText:'What a show! The fish are asking for an encore.', againLoseText:'The shells got away this time. Try again!',
    reset(){ ox = 400; shells = []; addShell(); drops = 0; bounces = 0; nextAdd = 5; flail = 0; flailCD = 0; bubbles = []; },
    seeds:() => Math.floor(bounces/4), stats:() => `<span>Bounces ${bounces}</span><span>Most shells ${shells.length}</span><span>Drops ${drops}</span>`,
    update(dt){
      time += dt; flail = Math.max(0, flail - dt); flailCD = Math.max(0, flailCD - dt);
      ox = clamp(ox + ((input.right ? 1 : 0) - (input.left ? 1 : 0))*430*dt, 70, W - 70);
      if (input.pressed){ input.pressed = false; if (flailCD <= 0){ flail = 1; flailCD = 5; } }
      input.taps.length = 0;
      if (time > nextAdd && shells.length < 6){ addShell(); nextAdd = time + 8; pop(400, 90, 'Another shell!', '#bff0ff'); }
      const reach = flail > 0 ? 120 : 62;
      for (const s of shells){
        s.vy += 260*dt; s.x += s.vx*dt; s.y += s.vy*dt; s.spin += s.vx*dt*.05;
        if (s.x < 20 || s.x > W - 20){ s.vx = -s.vx; s.x = clamp(s.x, 20, W - 20); }
        if (s.vy > 0 && s.y > ARM_Y - 14 && s.y < ARM_Y + 18 && Math.abs(s.x - ox) < reach){ s.vy = -(400 + Math.random()*90); s.vx = (s.x - ox)*3 + (Math.random() - .5)*120; bounces++; anim.happy = .4; for (let k = 0; k < 3; k++) bubbles.push({ x:s.x, y:s.y, life:1 }); }
        if (s.y > FLOOR){ drops++; shake = .3; pop(s.x, FLOOR - 30, 'Clonk!', '#ffb0a0'); s.y = 80; s.vy = 0; s.x = 120 + Math.random()*560; }
      }
      bubbles.forEach(b => { b.y -= 40*dt; b.life -= dt; }); bubbles = bubbles.filter(b => b.life > 0);
      if (drops >= 3) finish(false); else if (time >= 50) finish(true);
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#4ab8d8'); g.addColorStop(1, '#0f4a7a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++){ const bx = wrap(i*160 + Math.sin(t*.3 + i)*30, W + 200) - 100; ctx.fillStyle = 'rgba(255,255,230,.06)'; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + 60, 0); ctx.lineTo(bx + 150, H); ctx.lineTo(bx + 80, H); ctx.fill(); }
      ctx.fillStyle = '#e0c890'; ctx.fillRect(0, FLOOR - 10, W, H); for (let i = 0; i < 9; i++){ ctx.fillStyle = ['#ff7a8a', '#ffb05a', '#c07ae0'][i % 3]; ctx.beginPath(); ctx.ellipse(40 + i*92, FLOOR - 20, 8, 24, 0, 0, 7); ctx.fill(); }
      // the octopus: arms reaching up, wiggling (all of them when it flails)
      const wig = flail > 0 ? 1.8 : 1;
      ctx.strokeStyle = '#e07aa0'; ctx.lineWidth = 9; ctx.lineCap = 'round';
      for (let k = 0; k < 8; k++){ const a = -Math.PI*(.1 + k*.114), len = flail > 0 ? 90 : 60; ctx.beginPath(); ctx.moveTo(ox, ARM_Y + 40); ctx.quadraticCurveTo(ox + Math.cos(a)*len*.6 + Math.sin(t*6*wig + k)*8, ARM_Y + 30 + Math.sin(a)*len*.6, ox + Math.cos(a)*len, ARM_Y + 10 + Math.sin(a)*len*.3 + Math.sin(t*5 + k)*4); ctx.stroke(); }
      ctx.lineCap = 'butt'; ctx.fillStyle = '#e07aa0'; ctx.beginPath(); ctx.ellipse(ox, ARM_Y + 60, 50, 44, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; circle(ox - 16, ARM_Y + 52, 10); circle(ox + 16, ARM_Y + 52, 10); ctx.fillStyle = '#1a1a1a';
      const near = shells.reduce((a, s) => s.y > a.y ? s : a, { x:ox, y:0 }); for (const ex of [-16, 16]){ const ang = Math.atan2(near.y - (ARM_Y + 52), near.x - ox - ex); circle(ox + ex + Math.cos(ang)*4, ARM_Y + 52 + Math.sin(ang)*4, 4.5); }
      ctx.strokeStyle = '#8a3a5a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ox, ARM_Y + 70, 10, .3, Math.PI - .3); ctx.stroke();
      for (const s of shells){ ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.spin); ctx.fillStyle = s.col; ctx.beginPath(); ctx.moveTo(0, 12); for (let k = 0; k <= 6; k++){ const a = Math.PI + k/6*Math.PI; ctx.lineTo(Math.cos(a)*16, 4 + Math.sin(a)*16); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1.5; for (let k = 1; k < 6; k++){ const a = Math.PI + k/6*Math.PI; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(Math.cos(a)*15, 4 + Math.sin(a)*15); ctx.stroke(); } ctx.restore(); }
      for (const b of bubbles){ ctx.strokeStyle = `rgba(230,250,255,${b.life})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x + Math.sin(b.y*.1)*4, b.y, 4, 0, 7); ctx.stroke(); }
      drawPops(0);
    },
    hud(){ hudBar(); for (let i = 0; i < 3; i++){ ctx.fillStyle = i < 3 - drops ? '#bff0ff' : 'rgba(246,234,214,.2)'; circle(30 + i*26, 30, 9); } ctx.fillStyle = '#fff6e4'; ctx.fillText(`Bounces ${bounces}`, 120, 31); progress(time/50, '#e07aa0');
      ctx.textAlign = 'right'; ctx.fillStyle = flailCD > 0 ? 'rgba(246,234,214,.5)' : '#ffe066'; ctx.fillText(flailCD > 0 ? 'Resting arms…' : 'Space: FLAIL!', W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Coral Sea: Turtle Taxi =================
// Ride the sea turtle around the reef, picking up lost baby sea creatures and carrying each one home:
// the color of their bubble matches the color of their home. Currents push you along (or against you),
// and stinging jellies make passengers jump off. Deliver eight before the tide turns.
const TAXI = (() => {
  const HOMES = [
    { id:'pink', name:'the anemone', col:'#ff8ab8', x:80, y:130 }, { id:'orange', name:'the coral', col:'#ffb05a', x:720, y:120 },
    { id:'purple', name:'the shell', col:'#c8a0ff', x:90, y:410 }, { id:'green', name:'the kelp', col:'#6ad08a', x:710, y:410 },
  ];
  const CURRENTS = [{ x:250, y:230, w:300, h:60, vx:150, vy:0 }, { x:330, y:330, w:140, h:120, vx:0, vy:-130 }];
  let tx, ty, vx, vy, face, riders, waiting, jellies, delivered, timeLeft, spawnT;
  function addWaiting(){ const h = HOMES[Math.floor(Math.random()*4)]; let x, y; do { x = 160 + Math.random()*480; y = 110 + Math.random()*300; } while (Math.hypot(x - h.x, y - h.y) < 220); waiting.push({ x, y, home:h, ph:Math.random()*6 }); }
  return {
    title:'Turtle Taxi', sub:'Carry lost baby sea creatures home on the sea turtle.',
    blurb:'Baby sea creatures have drifted away from home! Ride the sea turtle, pick them up and carry each one back. Their bubble color tells you where they live. Deliver eight before the tide turns.',
    legend:['Arrow keys to swim the turtle', 'Swim into a little lost creature to pick it up (you can carry two)', 'Their bubble color matches their home: pink anemone, orange coral, purple shell, green kelp', 'Ride the currents (the arrows), but stay away from the stinging jellies!'],
    hints:['Arrows swim', 'Match bubble colors to homes', 'P to pause'], pad:['wgLeft', 'wgUp', 'wgDown', 'wgRight'],
    winTitle:'Everyone’s home!', winText:'Eight happy little families wave their fins and claws at you. The turtle does a proud loop-the-loop.',
    loseTitle:'The tide turned', loseText:'The tide carried the last little ones off to bed somewhere else. They’ll find their way home in the morning!',
    againWinText:'The best taxi in the whole Coral Sea!', againLoseText:'The tide was too quick this time. Try again!',
    reset(){ tx = 400; ty = 270; vx = 0; vy = 0; face = 1; riders = []; waiting = []; for (let i = 0; i < 3; i++) addWaiting(); jellies = [0, 1, 2].map(i => ({ x:200 + i*200, y:150 + i*90, ph:i*2 })); delivered = 0; timeLeft = 80; spawnT = 3; },
    seeds:() => delivered*2, stats:() => `<span>Delivered ${delivered}/8</span><span>Time left ${Math.max(0, Math.ceil(timeLeft))} s</span>`,
    update(dt){
      time += dt; timeLeft -= dt;
      const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0), ay = (input.down ? 1 : 0) - (input.up ? 1 : 0);
      vx += ax*600*dt; vy += ay*600*dt; vx -= vx*2*dt; vy -= vy*2*dt;
      for (const c of CURRENTS) if (tx > c.x && tx < c.x + c.w && ty > c.y && ty < c.y + c.h){ vx += c.vx*1.6*dt; vy += c.vy*1.6*dt; }
      tx = clamp(tx + vx*dt, 40, W - 40); ty = clamp(ty + vy*dt, 80, H - 40); if (Math.abs(vx) > 20) face = Math.sign(vx);
      input.pressed = false; input.taps.length = 0;
      for (const w of waiting) if (riders.length < 2 && !w.got && Math.hypot(w.x - tx, w.y - ty) < 44){ w.got = true; riders.push(w); pop(tx, ty - 50, `To ${w.home.name}!`, w.home.col); }
      waiting = waiting.filter(w => !w.got);
      spawnT -= dt; if (spawnT <= 0 && waiting.length < 3){ addWaiting(); spawnT = 2.5; }
      for (const h of HOMES) if (Math.hypot(h.x - tx, h.y - ty) < 70){ const off = riders.filter(r => r.home === h); if (off.length){ riders = riders.filter(r => r.home !== h); delivered += off.length; anim.happy = 1; pop(h.x, h.y - 50, 'Home sweet home!', h.col); } }
      for (const j of jellies){ j.y += Math.sin(t*.9 + j.ph)*40*dt; j.x += Math.cos(t*.5 + j.ph)*30*dt; if (Math.hypot(j.x - tx, j.y - ty) < 40 && riders.length){ const r = riders.pop(); addWaiting(); waiting[waiting.length - 1].x = r.x; shake = .3; pop(tx, ty - 50, 'Zap! Your passenger hopped off!', '#ff9ad0'); vx = -vx; vy = -vy; } }
      if (delivered >= 8) finish(true); else if (timeLeft <= 0) finish(false);
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5ac0e0'); g.addColorStop(1, '#0e4a78'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#e8d098'; ctx.fillRect(0, H - 22, W, 22);
      for (const c of CURRENTS){ ctx.fillStyle = 'rgba(220,250,255,.08)'; rr(c.x, c.y, c.w, c.h, 20); ctx.fill(); ctx.strokeStyle = 'rgba(230,250,255,.4)'; ctx.lineWidth = 2;
        for (let k = 0; k < 4; k++){ const f = wrap(t*.8 + k/4, 1), x = c.vx ? c.x + f*c.w : c.x + c.w/2 - 30 + k*20, y = c.vy ? c.y + c.h - f*c.h : c.y + c.h/2; ctx.beginPath(); if (c.vx){ ctx.moveTo(x - 10, y - 8); ctx.lineTo(x, y); ctx.lineTo(x - 10, y + 8); } else { ctx.moveTo(x - 8, y + 10); ctx.lineTo(x, y); ctx.lineTo(x + 8, y + 10); } ctx.stroke(); } }
      for (const h of HOMES){ ctx.fillStyle = h.col; if (h.id === 'pink'){ ctx.strokeStyle = h.col; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (let k = 0; k < 9; k++){ const a = Math.PI + k/8*Math.PI; ctx.beginPath(); ctx.moveTo(h.x, h.y + 20); ctx.lineTo(h.x + Math.cos(a)*30 + Math.sin(t*2 + k)*3, h.y + 20 + Math.sin(a)*34); ctx.stroke(); } ctx.lineCap = 'butt'; }
        else if (h.id === 'orange'){ for (let k = 0; k < 5; k++){ ctx.beginPath(); ctx.ellipse(h.x - 24 + k*12, h.y + 6 - (k % 2)*10, 6, 26, (k - 2)*.25, 0, 7); ctx.fill(); } }
        else if (h.id === 'purple'){ ctx.beginPath(); ctx.moveTo(h.x, h.y + 24); for (let k = 0; k <= 8; k++){ const a = Math.PI + k/8*Math.PI; ctx.lineTo(h.x + Math.cos(a)*36, h.y + 10 + Math.sin(a)*34); } ctx.closePath(); ctx.fill(); }
        else { ctx.strokeStyle = h.col; ctx.lineWidth = 6; for (let k = -1; k <= 1; k++){ ctx.beginPath(); ctx.moveTo(h.x + k*16, h.y + 40); for (let s = 1; s < 5; s++) ctx.lineTo(h.x + k*16 + Math.sin(t*1.4 + s + k)*7, h.y + 40 - s*20); ctx.stroke(); } }
        ctx.strokeStyle = h.col; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(h.x, h.y, 64, 0, 7); ctx.stroke(); ctx.setLineDash([]); }
      const baby = (x, y, col, s) => { ctx.fillStyle = 'rgba(255,255,255,.25)'; circle(x, y, 18*s); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 18*s, 0, 7); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, 9*s, 6*s, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 8*s, y); ctx.lineTo(x - 14*s, y - 5*s); ctx.lineTo(x - 14*s, y + 5*s); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(x + 4*s, y - 1, 1.5); };
      for (const w of waiting) baby(w.x, w.y + Math.sin(t*2 + w.ph)*5, w.home.col, 1);
      for (const j of jellies){ ctx.fillStyle = 'rgba(255,154,208,.75)'; ctx.beginPath(); ctx.arc(j.x, j.y, 16, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(255,154,208,.8)'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++){ ctx.beginPath(); ctx.moveTo(j.x + k*6, j.y); ctx.quadraticCurveTo(j.x + k*6 + Math.sin(t*4 + k)*5, j.y + 12, j.x + k*6, j.y + 24); ctx.stroke(); } }
      // the turtle, with you and your passengers riding on its shell
      { ctx.save(); ctx.translate(tx, ty); ctx.scale(face, 1); ctx.fillStyle = '#6aaa6a'; for (const [fx, fy, r] of [[-30, 10, .6], [30, 10, -.6]]){ ctx.save(); ctx.translate(fx, fy); ctx.rotate(r + Math.sin(t*4)*.3); ctx.beginPath(); ctx.ellipse(0, 0, 20, 7, 0, 0, 7); ctx.fill(); ctx.restore(); }
        circle(48, -2, 11); ctx.fillStyle = '#3a7a4a'; ctx.beginPath(); ctx.ellipse(0, 0, 42, 24, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#e8d8a0'; ctx.fillRect(-42, -2, 84, 5); ctx.fillStyle = '#1a1a1a'; circle(52, -5, 2); ctx.restore();
        Chin.draw(ctx, 'me', anim, tx - face*6, ty - 18, { scale:.045, face, grounded:true, speed:0 });
        riders.forEach((r, i) => baby(tx - face*(26 + i*20), ty - 36 - i*8, r.home.col, .7)); }
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Home ${delivered}/8`, 24, 31); progress(delivered/8, '#6ad08a');
      ctx.textAlign = 'right'; ctx.fillStyle = timeLeft < 15 ? '#ff8a9a' : '#fff6e4'; ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Underground: Mole Tunnels =================
// Dig through the dirt with the mole family to collect gems. Careful: rocks fall into any tunnel you
// dig underneath them (and you can push a rock sideways into an empty space). Collect every gem, then
// climb the ladder out. Two digs; three bonks on the head and the moles send you home.
const DIG = (() => {
  const C = 16, R = 8, TS = 50, OY = 58, DIRT = 1, ROCK = 2, GEM = 3, WALL = 4, EMPTY = 0;
  let g, px, py, face, gems, need, lives, level, moveT, fallT, exitOpen, bonkT, dust, falling = new Set();
  function build(){
    const r = rng(500 + level*31 + Math.floor(Math.random()*1000));
    g = Array.from({ length:R }, (_, y) => Array.from({ length:C }, (_, x) => (y === R - 1 || x === 0 || x === C - 1) ? WALL : DIRT));
    for (let y = 1; y < R - 1; y++) for (let x = 1; x < C - 1; x++){ const v = r(); g[y][x] = v < .16 ? ROCK : v < .23 ? WALL : DIRT; }
    px = 1; py = 0; g[0][1] = EMPTY; g[0][C - 2] = EMPTY; g[1][1] = DIRT; g[1][C - 2] = DIRT;
    // gems only go where you can actually dig to (rocks and bedrock count as in the way)
    const reach = new Set(['1,0']), q = [[1, 0]]; while (q.length){ const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (nx < 0 || ny < 0 || nx >= C || ny >= R || reach.has(k) || g[ny][nx] === WALL || g[ny][nx] === ROCK) continue; reach.add(k); q.push([nx, ny]); } }
    const spots = [...reach].map(k => k.split(',').map(Number)).filter(([x, y]) => y > 0 && g[y][x] === DIRT && !(x === 1 && y === 1)).sort(() => r() - .5);
    need = Math.min(8, spots.length); for (let k = 0; k < need; k++){ const [x, y] = spots[k]; g[y][x] = GEM; }
    for (let x = 1; x < C - 1; x++) if (g[0][x] !== EMPTY) g[0][x] = DIRT;
    gems = 0; exitOpen = false; moveT = 0; fallT = 0; face = 1; falling = new Set();
  }
  function step(dx, dy){
    const nx = px + dx, ny = py + dy; if (nx < 0 || nx >= C || ny < 0 || ny >= R) return;
    const c = g[ny][nx];
    if (c === WALL) return;
    if (c === ROCK){ if (dy === 0 && g[ny][nx + dx] === EMPTY){ g[ny][nx + dx] = ROCK; g[ny][nx] = EMPTY; px = nx; } return; }
    if (c === GEM){ gems++; pop(nx*TS + TS/2, OY + ny*TS, '+gem!', '#9af8ff'); if (gems >= need){ exitOpen = true; pop(400, 100, 'The ladder is down! Climb out!', '#ffe066'); } }
    if (c === DIRT) dust.push({ x:nx*TS + TS/2, y:OY + ny*TS + TS/2, life:.4 });
    g[ny][nx] = EMPTY; px = nx; py = ny;
    if (exitOpen && px === C - 2 && py === 0){ level++; if (level >= 2) finish(true); else { build(); pop(400, 100, 'Down to the deeper tunnels!', '#ffe066'); } }
  }
  function settle(){
    // rocks (and gems) drop into empty space below them. A rock resting on your head stays put (you're
    // holding it up), but one that's already falling bonks you
    const nf = new Set();
    for (let y = R - 2; y >= 0; y--) for (let x = 0; x < C; x++){ const c = g[y][x]; if ((c === ROCK || c === GEM) && g[y + 1][x] === EMPTY){
      if (x === px && y + 1 === py){ if (c === ROCK && falling.has(x + ',' + y)){ g[y][x] = EMPTY; hit(); } continue; }
      g[y + 1][x] = c; g[y][x] = EMPTY; nf.add(x + ',' + (y + 1)); } }
    falling = nf;
  }
  function hit(){ if (bonkT > 0) return; lives--; bonkT = 1.4; shake = .5; pop(px*TS + TS/2, OY + py*TS - 10, 'Bonk!', '#ffb0a0'); if (lives <= 0) finish(false); }
  return {
    title:'Mole Tunnels', sub:'Dig for gems with the mole family.',
    blurb:'The mole family has found a seam of glowing gems, and they need a digger! Tunnel through the dirt and collect every gem, but watch out: rocks drop down into any tunnel you dig beneath them.',
    legend:['Arrow keys to dig and move one square at a time', 'Rocks (and gems) fall into the space below them; don’t stand under a rock!', 'You can push a rock sideways into an empty space', 'Collect all 8 gems, then climb the ladder in the top right corner'],
    hints:['Arrows dig', 'Mind the falling rocks', 'P to pause'], pad:['wgLeft', 'wgUp', 'wgDown', 'wgRight'],
    winTitle:'What a haul!', winText:'The moles cheer and hold up their gems so they sparkle in their hard-hat lights. “Best digger we’ve ever had!”',
    loseTitle:'Too many bonks', loseText:'The moles put a bandage on your head and a hard hat on top. “Back to the surface for a rest!”',
    againWinText:'Another seam of gems cleared out!', againLoseText:'Those rocks are sneaky. Try again!',
    reset(){ level = 0; lives = 3; bonkT = 0; dust = []; build(); },
    seeds:() => gems + level*8, stats:() => `<span>Dig ${level + 1}/2</span><span>Gems ${gems}/${need}</span>`,
    update(dt){
      time += dt; moveT -= dt; bonkT = Math.max(0, bonkT - dt); fallT -= dt;
      const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0), dy = dx ? 0 : (input.down ? 1 : 0) - (input.up ? 1 : 0);
      const tap = input.taps.splice(0)[0]; input.pressed = false;
      if (tap && ['left', 'right', 'up', 'down'].includes(tap)){ const m = { left:[-1, 0], right:[1, 0], up:[0, -1], down:[0, 1] }[tap]; if (m[0]) face = m[0]; step(m[0], m[1]); moveT = .22; }
      else if ((dx || dy) && moveT <= 0){ if (dx) face = dx; step(dx, dy); moveT = .16; }
      if (fallT <= 0){ fallT = .2; settle(); }
      dust.forEach(d => d.life -= dt); dust = dust.filter(d => d.life > 0);
    },
    draw(){
      ctx.fillStyle = '#120e1a'; ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < R; y++) for (let x = 0; x < C; x++){ const c = g[y][x], X = x*TS, Y = OY + y*TS;
        if (c === DIRT){ ctx.fillStyle = (x + y) % 2 ? '#6a4a30' : '#634428'; ctx.fillRect(X, Y, TS, TS); ctx.fillStyle = 'rgba(40,24,12,.4)'; circle(X + 12 + hash(x*7 + y)*20, Y + 14 + hash(x + y*5)*20, 3); }
        else if (c === WALL){ ctx.fillStyle = '#3a3448'; ctx.fillRect(X, Y, TS, TS); ctx.fillStyle = '#4a4458'; rr(X + 4, Y + 4, TS - 8, TS - 8, 8); ctx.fill(); }
        else { ctx.fillStyle = '#2a2030'; ctx.fillRect(X, Y, TS, TS); }
        if (c === ROCK){ ctx.fillStyle = '#7a7a8a'; ctx.beginPath(); ctx.ellipse(X + TS/2, Y + TS/2 + 2, 21, 19, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; circle(X + TS/2 - 7, Y + TS/2 - 6, 5); }
        if (c === GEM){ if (g[y][x] === GEM && (g[y - 1] && true)){ ctx.fillStyle = '#2a2030'; ctx.fillRect(X, Y, TS, TS); }
          const gg = ctx.createRadialGradient(X + TS/2, Y + TS/2, 2, X + TS/2, Y + TS/2, 26); gg.addColorStop(0, 'rgba(150,240,255,.6)'); gg.addColorStop(1, 'rgba(150,240,255,0)'); ctx.fillStyle = gg; circle(X + TS/2, Y + TS/2, 26);
          ctx.fillStyle = ['#7fe0e6', '#c8a0ff', '#ffb05a'][(x + y) % 3]; ctx.beginPath(); ctx.moveTo(X + TS/2, Y + 10); ctx.lineTo(X + TS - 12, Y + TS/2); ctx.lineTo(X + TS/2, Y + TS - 10); ctx.lineTo(X + 12, Y + TS/2); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(X + TS/2 - 3, Y + 16, 4, 8); } }
      // the way out: a ladder up through the roof once every gem is found
      { const X = (C - 2)*TS, Y = OY; ctx.strokeStyle = exitOpen ? '#c9a06a' : 'rgba(201,160,106,.25)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(X + 12, Y - 50); ctx.lineTo(X + 12, Y + TS); ctx.moveTo(X + 38, Y - 50); ctx.lineTo(X + 38, Y + TS); for (let k = 0; k < 5; k++){ ctx.moveTo(X + 12, Y - 40 + k*18); ctx.lineTo(X + 38, Y - 40 + k*18); } ctx.stroke(); }
      for (const d of dust){ ctx.fillStyle = `rgba(160,120,80,${d.life*2})`; for (let k = 0; k < 4; k++) circle(d.x + Math.cos(k*1.7)*(1 - d.life)*40, d.y + Math.sin(k*1.7)*(1 - d.life)*30, 4); }
      // you, in a hard hat with a lamp
      if (!(bonkT > 0 && Math.floor(bonkT*12) % 2)){ const X = px*TS + TS/2, Y = OY + py*TS + TS - 4; const lg = ctx.createRadialGradient(X, Y - 20, 10, X, Y - 20, 110); lg.addColorStop(0, 'rgba(255,230,150,.18)'); lg.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = lg; circle(X, Y - 20, 110);
        Chin.draw(ctx, 'me', anim, X, Y, { scale:.042, face, grounded:true, speed:0 }); ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.ellipse(X, Y - 38, 15, 9, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff6c8'; circle(X + face*6, Y - 42, 3); }
      drawPops(0);
    },
    hud(){ hudBar(); for (let i = 0; i < 3; i++){ ctx.fillStyle = i < lives ? '#f2c230' : 'rgba(246,234,214,.2)'; ctx.beginPath(); ctx.ellipse(30 + i*28, 32, 11, 7, 0, Math.PI, 0); ctx.fill(); }
      ctx.fillStyle = '#fff6e4'; ctx.fillText(`Gems ${gems}/${need}`, 120, 31); progress(gems/need, '#9af8ff'); ctx.textAlign = 'right'; ctx.fillText(`Dig ${level + 1}/2`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Underground: Mushroom Bounce =================
// Bounce up a deep cave shaft on glowing mushrooms, all the way to the skylight at the top! You bounce
// by yourself; steer left and right. Pink mushrooms bounce you extra high, grey ones crumble after one
// bounce, and some drift side to side. Fall too far and you're back at the last crystal you touched.
const BOUNCE = (() => {
  const TOP = -3200, G = 1100, V = 640, VPINK = 930;
  let p, plat, cam, spores, got, check, lives, best;
  function build(){
    const r = rng(77 + Math.floor(Math.random()*500)); plat = [{ x:400, y:420, k:'blue', w:90 }];
    // each mushroom stays within a jump (sideways) of the one before it
    let px0 = 400; for (let y = 320; y > TOP + 120; y -= 95 + r()*45){ const v = r(), k = v < .14 ? 'pink' : v < .3 ? 'grey' : v < .42 ? 'move' : 'blue'; px0 = clamp(px0 + (r() - .5)*480, 110, 690); plat.push({ x:px0, y, k, w:k === 'grey' ? 70 : 84, ph:r()*6, gone:false }); }
    for (const pl of plat) if (pl.y < 0 && Math.round(-pl.y/800) !== Math.round(-(pl.y + 120)/800)) pl.crystal = true;
    spores = plat.filter((_, i) => i % 3 === 1).map(pl => ({ x:pl.x + (r() - .5)*120, y:pl.y - 60 - r()*40 }));
  }
  return {
    title:'Mushroom Bounce', sub:'Bounce up the glowing mushroom cave to the skylight.',
    blurb:'Way up at the top of this cave there’s a hole that lets in the sunlight. Bounce from glowing mushroom to glowing mushroom to reach it! You bounce all by yourself: just steer.',
    legend:['← → to steer while you bounce', 'Pink mushrooms bounce you extra high', 'Grey ones crumble after one bounce, and some drift side to side', 'Touch a glowing crystal to save your place; fall too far and you go back to it', 'Reach the skylight at the top'],
    hints:['← → steer', 'Pink = super bounce', 'P to pause'], pad:['wgLeft', 'wgRight'],
    winTitle:'Sunshine!', winText:'You pop out of the skylight into warm sunshine, and the moles down below give a cheer that echoes all the way up.',
    loseTitle:'Too many tumbles', loseText:'You tumble all the way down into a soft pile of moss. Have a rest and try again!',
    againWinText:'Up and out again! The mushrooms glow extra bright for you.', againLoseText:'Those grey mushrooms are tricky. Try again!',
    reset(){ build(); p = { x:400, y:400, vx:0, vy:-V, face:1 }; cam = 0; got = 0; check = { x:400, y:400 }; lives = 3; best = 400; },
    seeds:() => got + Math.floor((400 - best)/300), stats:() => `<span>Spores ${got}</span><span>Height ${Math.max(0, Math.round((400 - best)/10))} m</span>`,
    update(dt){
      time += dt; input.pressed = false; input.taps.length = 0;
      const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0); p.vx += ax*1400*dt; p.vx -= p.vx*3*dt; p.vx = clamp(p.vx, -330, 330); if (ax) p.face = ax;
      const prevY = p.y; p.vy += G*dt; p.x += p.vx*dt; p.y += p.vy*dt;
      if (p.x < 30){ p.x = 30; p.vx = 0; } if (p.x > W - 30){ p.x = W - 30; p.vx = 0; }
      for (const pl of plat){ if (pl.gone) continue; if (pl.k === 'move') pl.x = clamp(pl.x + Math.sin(t*1.3 + pl.ph)*90*dt, 80, W - 80);
        if (p.vy > 0 && prevY <= pl.y && p.y >= pl.y && Math.abs(p.x - pl.x) < pl.w/2 + 14){ p.y = pl.y; p.vy = -(pl.k === 'pink' ? VPINK : V); pl.squish = .3; if (pl.k === 'grey'){ pl.gone = true; pop(pl.x, pl.y - 20, 'Crumble!', '#c8c8d0'); } if (pl.crystal){ check = { x:pl.x, y:pl.y - 10 }; } } }
      plat.forEach(pl => pl.squish = Math.max(0, (pl.squish || 0) - dt));
      for (const s of spores) if (!s.got && Math.hypot(s.x - p.x, s.y - (p.y - 20)) < 26){ s.got = true; got++; }
      best = Math.min(best, p.y); cam += (Math.min(0, p.y - 300) - cam)*Math.min(1, dt*5);
      if (p.y > cam + H + 60){ lives--; shake = .4; if (lives <= 0){ finish(false); return; } p.x = check.x; p.y = check.y - 40; p.vx = 0; p.vy = -V; cam = Math.min(0, p.y - 300); plat.forEach(pl => { if (pl.k === 'grey') pl.gone = false; }); pop(400, 120, 'Back to the crystal!', '#9af8ff'); }
      if (p.y < TOP) finish(true);
    },
    draw(){
      const k = clamp(-cam/-TOP, 0, 1), g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgb(${Math.round(18 + k*60)},${Math.round(14 + k*60)},${Math.round(26 + k*50)})`); g.addColorStop(1, '#120e1a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // the walls of the shaft
      ctx.fillStyle = '#2a2236'; for (const side of [0, 1]){ ctx.beginPath(); ctx.moveTo(side ? W : 0, 0); for (let y = 0; y <= H; y += 20){ const wy = y + cam; ctx.lineTo(side ? W - 18 - Math.sin(wy*.02)*10 : 18 + Math.sin(wy*.023)*10, y); } ctx.lineTo(side ? W : 0, H); ctx.fill(); }
      // the skylight at the very top
      const sy = TOP - cam; if (sy > -200){ const sg = ctx.createRadialGradient(400, sy, 10, 400, sy, 260); sg.addColorStop(0, 'rgba(255,250,210,.9)'); sg.addColorStop(1, 'rgba(255,250,210,0)'); ctx.fillStyle = sg; circle(400, sy, 260); ctx.fillStyle = '#bfe8ff'; ctx.beginPath(); ctx.ellipse(400, sy - 20, 90, 30, 0, 0, 7); ctx.fill(); }
      const cols = { blue:'120,230,200', pink:'255,150,220', grey:'190,190,200', move:'200,140,255' };
      for (const pl of plat){ if (pl.gone) continue; const y = pl.y - cam; if (y < -60 || y > H + 60) continue; const c = cols[pl.k], sq = Math.sin((pl.squish || 0)*20)*4;
        const gg = ctx.createRadialGradient(pl.x, y, 2, pl.x, y, 70); gg.addColorStop(0, `rgba(${c},.4)`); gg.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gg; circle(pl.x, y, 70);
        ctx.fillStyle = '#e8e0d0'; ctx.fillRect(pl.x - 6, y, 12, 26); ctx.fillStyle = `rgb(${c})`; ctx.beginPath(); ctx.ellipse(pl.x, y + sq, pl.w/2, 18 - sq*.5, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; circle(pl.x - 12, y - 8, 3); circle(pl.x + 10, y - 6, 2.5);
        if (pl.k === 'grey'){ ctx.strokeStyle = 'rgba(60,60,70,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(pl.x - 10, y - 14); ctx.lineTo(pl.x - 2, y - 4); ctx.lineTo(pl.x + 8, y - 12); ctx.stroke(); }
        if (pl.crystal){ ctx.fillStyle = check.y === pl.y - 10 ? '#9af8ff' : 'rgba(154,248,255,.5)'; ctx.beginPath(); ctx.moveTo(pl.x + 30, y - 6); ctx.lineTo(pl.x + 36, y - 28); ctx.lineTo(pl.x + 42, y - 6); ctx.fill(); } }
      for (const s of spores){ if (s.got) continue; const y = s.y - cam; if (y < -20 || y > H + 20) continue; ctx.fillStyle = '#fff3a0'; circle(s.x, y + Math.sin(t*3 + s.x)*3, 4); ctx.fillStyle = 'rgba(255,243,160,.3)'; circle(s.x, y, 10); }
      Chin.draw(ctx, 'me', anim, p.x, p.y - cam, { scale:.06, face:p.face, grounded:false, speed:Math.abs(p.vx) });
      drawPops(0);
    },
    hud(){ hudBar(); for (let i = 0; i < 3; i++){ ctx.fillStyle = i < lives ? '#9af8ff' : 'rgba(246,234,214,.2)'; circle(30 + i*26, 30, 9); } ctx.fillStyle = '#fff6e4'; ctx.fillText(`Spores ${got}`, 120, 31); progress((400 - best)/(400 - TOP), '#78e6c8'); ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Underground: Glowfish Fishing =================
// The axolotl in the hidden lake is hungry for one particular glowfish at a time. Lower your line (↑ ↓)
// to the right depth and wait for that fish to swim onto the hook, then reel it up. Watch the tug meter:
// when the fish pulls hard (the line flashes red), stop reeling or the line snaps! Old boots and grumpy
// eels are not on the menu.
const FISH = (() => {
  const SURF = 140, BOTTOM = 450, HX = 400, COLS = [{ id:'blue', col:'#7ad8ff' }, { id:'pink', col:'#ff9ad0' }, { id:'gold', col:'#ffd860' }, { id:'green', col:'#8af0a0' }];
  let hookY, fish, caught, tug, pulling, want, served, timeLeft, snaps, spawnT, reelBlink;
  function addFish(){ const left = Math.random() < .5, v = Math.random(), k = v < .1 ? 'boot' : v < .2 ? 'eel' : 'fish'; fish.push({ k, c:COLS[Math.floor(Math.random()*4)], x:left ? -40 : W + 40, y:SURF + 50 + Math.random()*(BOTTOM - SURF - 70), v:(left ? 1 : -1)*(50 + Math.random()*60), ph:Math.random()*6 }); }
  function newOrder(){ want = COLS[Math.floor(Math.random()*4)]; }
  return {
    title:'Glowfish Fishing', sub:'Catch the glowfish the axolotl is hungry for.',
    blurb:'The little pink axolotl in the hidden lake is SO hungry, and it only wants one color of glowfish at a time! Lower your line, hook the right one, and reel it in without snapping the line.',
    legend:['↑ ↓ to raise and lower your hook', 'Wait for the glowfish the axolotl wants to swim onto it', 'Hold ↑ to reel it in, but when the line flashes red the fish is pulling: stop reeling or it snaps!', 'Space lets a fish go. Feed the axolotl 6 fish'],
    hints:['↑ ↓ move the hook', 'Hold ↑ to reel, stop when red', 'Space lets go', 'P to pause'], pad:['wgUp', 'wgDown', 'wgAction'], actionLabel:'Let go',
    winTitle:'One full axolotl!', winText:'The axolotl pats its round tummy, smiles its enormous smile and blows you a bubble that says thank you.',
    loseTitle:'Out of time', loseText:'The axolotl yawns and drifts off for a nap. It’ll be hungry again tomorrow!',
    againWinText:'Another feast! The axolotl does a happy wiggle.', againLoseText:'The fish were extra slippery today. Try again!',
    reset(){ hookY = 220; fish = []; for (let i = 0; i < 5; i++){ addFish(); fish[i].x = 100 + Math.random()*600; } caught = null; tug = 0; pulling = false; served = 0; timeLeft = 90; snaps = 0; spawnT = 1; reelBlink = 0; newOrder(); },
    seeds:() => served*2, stats:() => `<span>Fed ${served}/6</span><span>Snapped lines ${snaps}</span>`,
    update(dt){
      time += dt; timeLeft -= dt; reelBlink = Math.max(0, reelBlink - dt); input.taps.length = 0;
      if (caught){
        // the fish fights: every so often it pulls hard
        pulling = Math.sin(t*2.6 + caught.ph) > .35; tug = clamp(tug + (input.up ? (pulling ? 1.6 : -.3) : -.8)*dt, 0, 1);
        if (input.up && !pulling) hookY -= 120*dt; else if (pulling) hookY += 30*dt;
        hookY = clamp(hookY, SURF - 30, BOTTOM); caught.y = hookY + 14; caught.x = HX;
        if (tug >= 1){ snaps++; shake = .4; pop(HX, hookY - 20, 'SNAP!', '#ffb0a0'); caught.x = HX + 1; caught.v = 120; fish.push(caught); caught = null; tug = 0; hookY = 200; }
        else if (hookY <= SURF - 20){ if (caught.k === 'fish' && caught.c === want){ served++; anim.happy = 1.5; pop(620, 90, 'Yum!', want.col); if (served >= 6){ finish(true); return; } newOrder(); } else pop(HX, SURF - 40, caught.k === 'boot' ? 'An old boot…' : caught.k === 'eel' ? 'The eel wriggles away!' : 'Not that color!', '#c8c8d0'); caught = null; tug = 0; hookY = 220; }
        if (input.pressed){ input.pressed = false; caught.v = 80; fish.push(caught); caught = null; tug = 0; }
      } else {
        input.pressed = false; hookY = clamp(hookY + ((input.down ? 1 : 0) - (input.up ? 1 : 0))*220*dt, SURF + 10, BOTTOM);
        for (const f of fish) if (Math.abs(f.x - HX) < 22 && Math.abs(f.y - hookY) < 18){ caught = f; fish = fish.filter(o => o !== f); reelBlink = .8; pop(HX + 40, hookY - 10, 'Bite! Hold ↑ to reel', '#fff6e4'); break; }
      }
      for (const f of fish){ f.x += f.v*dt; f.y += Math.sin(t*1.5 + f.ph)*10*dt; }
      fish = fish.filter(f => f.x > -60 && f.x < W + 60); spawnT -= dt; if (spawnT <= 0 && fish.length < 8){ addFish(); spawnT = .8 + Math.random(); }
      if (timeLeft <= 0) finish(false);
    },
    draw(){
      ctx.fillStyle = '#120e1a'; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 20; i++){ const x = i*44 + hash(i)*20; ctx.fillStyle = '#2a2236'; ctx.beginPath(); ctx.moveTo(x - 16, 0); ctx.lineTo(x, 30 + hash(i + 3)*50); ctx.lineTo(x + 16, 0); ctx.fill(); }
      const lg = ctx.createLinearGradient(0, SURF, 0, H); lg.addColorStop(0, '#2a6a8a'); lg.addColorStop(1, '#0a2238'); ctx.fillStyle = lg; ctx.fillRect(0, SURF, W, H - SURF);
      ctx.strokeStyle = 'rgba(160,230,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, SURF + Math.sin(x*.05 + t*2)*3); ctx.stroke();
      // the rock you sit on, with your rod, and the axolotl waiting with its order
      ctx.fillStyle = '#3a3048'; ctx.beginPath(); ctx.ellipse(250, SURF + 4, 110, 40, 0, Math.PI, 0); ctx.fill();
      Chin.draw(ctx, 'me', anim, 240, SURF - 6, { scale:.055, face:1, grounded:true, speed:0 });
      ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(262, SURF - 34); ctx.lineTo(HX, SURF - 80); ctx.stroke();
      ctx.strokeStyle = caught && pulling ? '#ff6a6a' : 'rgba(230,240,255,.8)'; ctx.lineWidth = caught && pulling ? 2.5 : 1.5; ctx.beginPath(); ctx.moveTo(HX, SURF - 80); ctx.lineTo(HX + (caught && pulling ? Math.sin(t*40)*2 : 0), hookY); ctx.stroke();
      ctx.strokeStyle = '#c8c8d0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(HX - 5, hookY + 4, 6, 0, Math.PI); ctx.stroke();
      { const ax = 640, ay = SURF + 6; ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.ellipse(ax, ay, 30, 12, 0, 0, 7); ctx.fill(); circle(ax - 28, ay - 6, 13); ctx.strokeStyle = '#ff6ab8'; ctx.lineWidth = 3; for (const k of [-1, 0, 1]){ ctx.beginPath(); ctx.moveTo(ax - 34, ay - 12 + k*4); ctx.lineTo(ax - 44, ay - 22 + k*8); ctx.stroke(); } ctx.fillStyle = '#1a1a1a'; circle(ax - 34, ay - 8, 2); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ax - 28, ay - 2, 6, .3, 2.6); ctx.stroke();
        ctx.fillStyle = 'rgba(16,12,30,.85)'; rr(ax - 60, 62, 150, 50, 10); ctx.fill(); ctx.fillStyle = '#fff6e4'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.fillText('I want…', ax - 48, 82); ctx.fillStyle = want.col; ctx.beginPath(); ctx.ellipse(ax + 40, 88, 18, 9, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(ax + 24, 88); ctx.lineTo(ax + 14, 80); ctx.lineTo(ax + 14, 96); ctx.fill(); ctx.fillStyle = '#fff6e4'; ctx.fillText(want.id, ax - 48, 102); }
      const drawFish = f => { ctx.save(); ctx.translate(f.x, f.y); ctx.scale(Math.sign(f.v) || 1, 1);
        if (f.k === 'boot'){ ctx.fillStyle = '#5a4030'; ctx.fillRect(-12, -14, 14, 20); ctx.fillRect(-12, 0, 26, 8); }
        else if (f.k === 'eel'){ ctx.strokeStyle = '#4a6a3a'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k < 6; k++) ctx.lineTo(-30 + k*10, Math.sin(t*6 + k)*5); ctx.stroke(); ctx.lineCap = 'butt'; ctx.fillStyle = '#ffd860'; circle(20, -2, 2); }
        else { const gg = ctx.createRadialGradient(0, 0, 2, 0, 0, 28); gg.addColorStop(0, f.c.col); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.globalAlpha = .4; ctx.fillStyle = gg; circle(0, 0, 28); ctx.globalAlpha = 1; ctx.fillStyle = f.c.col; ctx.beginPath(); ctx.ellipse(0, 0, 16, 8, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-24, -7); ctx.lineTo(-24, 7); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(8, -2, 1.8); }
        ctx.restore(); };
      fish.forEach(drawFish); if (caught) drawFish(caught);
      if (caught){ ctx.fillStyle = 'rgba(16,12,30,.8)'; rr(HX + 30, hookY - 40, 110, 18, 6); ctx.fill(); ctx.fillStyle = tug > .7 ? '#ff6a6a' : '#ffd860'; rr(HX + 34, hookY - 36, 102*tug, 10, 4); ctx.fill(); ctx.fillStyle = '#fff6e4'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.fillText(pulling ? 'IT’S PULLING! Stop!' : 'Reel! (hold ↑)', HX + 30, hookY - 46); }
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Fed ${served}/6`, 24, 31); progress(served/6, '#ff9ab8'); ctx.textAlign = 'right'; ctx.fillStyle = timeLeft < 15 ? '#ff8a9a' : '#fff6e4'; ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Topsy-Turvy Land: Topsy Maze =================
// In Topsy-Turvy Land you don't move the marble, you turn the whole world! Spin the floating maze left
// and right and gravity rolls the bubble-marble wherever "down" happens to be. Get it to Flip's carrot
// in three mazes before time runs out.
const TILT = (() => {
  const CX = 400, CY = 268;
  let N, CS, blocks, goal, mx, my, vx, vy, ang, level, timeLeft, doneT, trail;
  function build(){
    const cells = 5 + level, n = cells*2 + 1; N = n; CS = Math.floor(330/n);
    blocks = Array.from({ length:n }, () => Array(n).fill(1));
    const st = [[0, 0]], seen = new Set(['0,0']); blocks[1][1] = 0;
    while (st.length){ const [cx, cy] = st[st.length - 1], opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy, dx, dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < cells && y < cells && !seen.has(x + ',' + y));
      if (!opts.length){ st.pop(); continue; } const [x, y, dx, dy] = opts[Math.floor(Math.random()*opts.length)]; seen.add(x + ',' + y); blocks[cy*2 + 1 + dy][cx*2 + 1 + dx] = 0; blocks[y*2 + 1][x*2 + 1] = 0; st.push([x, y]); }
    // a few extra openings so there's more than one way round
    for (let k = 0; k < cells; k++){ const x = 1 + Math.floor(Math.random()*(n - 2)), y = 1 + Math.floor(Math.random()*(n - 2)); if ((x + y) % 2) blocks[y][x] = 0; }
    goal = { x:n - 2, y:n - 2 }; mx = (1.5 - n/2)*CS; my = (1.5 - n/2)*CS; vx = 0; vy = 0; ang = 0; doneT = 0; trail = [];
  }
  const solid = (lx, ly) => { const j = Math.floor(lx/CS + N/2), i = Math.floor(ly/CS + N/2); return i < 0 || j < 0 || i >= N || j >= N || blocks[i][j] === 1; };
  const hits = (x, y, r) => solid(x - r, y - r) || solid(x + r, y - r) || solid(x - r, y + r) || solid(x + r, y + r);
  return {
    title:'Topsy Maze', sub:'Turn the whole world to roll the marble home.',
    blurb:'In Topsy-Turvy Land you don’t roll the marble, you turn the WORLD! Spin the floating maze and let gravity roll the bubble wherever “down” happens to be. Get it to Flip’s carrot in three mazes.',
    legend:['← → to spin the whole maze', 'Gravity always pulls straight down the screen, so the bubble rolls as you turn', 'Roll it to the carrot', 'Three mazes, each a bit bigger, before time runs out'],
    hints:['← → spin the maze', 'P to pause'], pad:['wgLeft', 'wgRight'],
    winTitle:'Topsy-turvy champion!', winText:'Flip the bunny munches the last carrot upside down and declares you an honorary Topsy-Turvian.',
    loseTitle:'All in a spin', loseText:'You’re so dizzy the maze looks like it’s spinning by itself. Have a rest and try again!',
    againWinText:'Round and round and right on target!', againLoseText:'Dizzy! Try again!',
    reset(){ level = 0; timeLeft = 120; build(); },
    seeds:() => level*4, stats:() => `<span>Mazes ${level}/3</span><span>Time left ${Math.max(0, Math.ceil(timeLeft))} s</span>`,
    update(dt){
      time += dt; input.pressed = false; input.taps.length = 0;
      if (doneT){ doneT += dt; ang *= Math.max(0, 1 - dt*3); if (doneT > 1.6){ level++; if (level >= 3) finish(true); else build(); } return; }
      timeLeft -= dt; if (timeLeft <= 0){ finish(false); return; }
      ang += ((input.right ? 1 : 0) - (input.left ? 1 : 0))*1.9*dt;
      const g = 520, r = CS*.32;
      vx += g*Math.sin(ang)*dt; vy += g*Math.cos(ang)*dt; vx *= 1 - dt*.6; vy *= 1 - dt*.6;
      const sp = Math.hypot(vx, vy); if (sp > 420){ vx *= 420/sp; vy *= 420/sp; }
      for (let s = 0; s < 4; s++){ const nx = mx + vx*dt/4; if (hits(nx, my, r)) vx *= -.25; else mx = nx; const ny = my + vy*dt/4; if (hits(mx, ny, r)) vy *= -.25; else my = ny; }
      trail.push({ x:mx, y:my }); if (trail.length > 14) trail.shift();
      const gx = (goal.x + .5 - N/2)*CS, gy = (goal.y + .5 - N/2)*CS; if (Math.hypot(mx - gx, my - gy) < CS*.55){ doneT = .01; anim.happy = 2; pop(CX, 90, 'Carrot!', '#ffb05a'); }
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#c8b0f0'); g.addColorStop(1, '#b8e0f8'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 10; i++){ ctx.save(); ctx.translate(hash(i)*W, hash(i + 4)*H); ctx.rotate(t*.2 + i); ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(-14, -6, 28, 12, 6); ctx.fill(); ctx.restore(); }
      // the arrow shows which way is down right now
      ctx.fillStyle = 'rgba(90,60,140,.5)'; ctx.font = '700 14px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('gravity ↓', 720, 460); ctx.textAlign = 'left';
      ctx.save(); ctx.translate(CX, CY); ctx.rotate(ang);
      const half = N*CS/2; ctx.fillStyle = 'rgba(160,210,250,.55)'; rr(-half - 10, -half - 10, N*CS + 20, N*CS + 20, 22); ctx.fill();
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (blocks[i][j]){ const x = (j - N/2)*CS, y = (i - N/2)*CS; ctx.fillStyle = (i + j) % 2 ? '#f6d0e8' : '#e8c0f0'; rr(x + 1, y + 1, CS - 2, CS - 2, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 4, y + 3, CS - 8, 3); }
      { const x = (goal.x + .5 - N/2)*CS, y = (goal.y + .5 - N/2)*CS; ctx.save(); ctx.translate(x, y); ctx.rotate(-ang); ctx.fillStyle = '#f08a2a'; ctx.beginPath(); ctx.moveTo(-CS*.3, -CS*.15); ctx.lineTo(CS*.3, -CS*.15); ctx.lineTo(0, CS*.4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#5aaa4a'; ctx.beginPath(); ctx.ellipse(-4, -CS*.28, 3, 8, -.4, 0, 7); ctx.ellipse(4, -CS*.28, 3, 8, .4, 0, 7); ctx.fill(); ctx.restore(); }
      for (let k = 0; k < trail.length; k++){ ctx.fillStyle = `rgba(255,255,255,${k/trail.length*.4})`; circle(trail[k].x, trail[k].y, CS*.18); }
      const r = CS*.32; const bg = ctx.createRadialGradient(mx - r*.3, my - r*.3, 1, mx, my, r); bg.addColorStop(0, '#ffffff'); bg.addColorStop(1, '#7ac8f0'); ctx.fillStyle = bg; circle(mx, my, r); ctx.strokeStyle = 'rgba(40,90,140,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mx, my, r, 0, 7); ctx.stroke();
      ctx.restore();
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Maze ${Math.min(3, level + 1)}/3`, 24, 31); progress(level/3, '#c8a0ff'); ctx.textAlign = 'right'; ctx.fillStyle = timeLeft < 15 ? '#ff8a9a' : '#fff6e4'; ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(dt){ ang = Math.sin(t*.5)*.5; },
  };
})();

// ================= Topsy-Turvy Land: Upside-Down Pancakes =================
// Flip the bunny's cottage is upside down, so when Flip tosses a pancake it falls UP! You're standing on
// the ceiling holding a plate: catch the pancakes and build a stack (it hangs down from your plate).
// Move too fast and the stack wobbles; wobble too much and pancakes slide off. Skip the burnt ones.
const PANCAKE = (() => {
  const CEIL = 96, PAN_Y = 440;
  let plx, plv, stack, sway, swayV, cakes, missed, tossT, berries;
  const height = () => stack.length*9;
  return {
    title:'Upside-Down Pancakes', sub:'Catch Flip’s pancakes as they fall UP.',
    blurb:'Flip the bunny’s kitchen is upside down, so when Flip tosses a pancake it falls UP! Stand on the ceiling, catch them on your plate, and build the tallest (hanging) stack in Topsy-Turvy Land.',
    legend:['← → to move your plate along the ceiling', 'Catch the pancakes as they fly up (they stack down from the plate)', 'Move gently: a fast plate makes the stack wobble, and a big wobble knocks pancakes off', 'Skip the burnt black ones! Blueberry pancakes count double', 'Stack 15 pancakes; miss 5 and Flip runs out of batter'],
    hints:['← → move the plate', 'Move gently!', 'P to pause'], pad:['wgLeft', 'wgRight'],
    winTitle:'A towering stack!', winText:'Fifteen pancakes hanging from your plate, wobbling but proud. Flip pours syrup on them… and it drips UP. Delicious!',
    loseTitle:'Out of batter', loseText:'Flip scrapes the bowl and shrugs. “That’s all the batter! Same time tomorrow?”',
    againWinText:'Another tower of pancakes! Flip is very impressed.', againLoseText:'The pancakes were extra slippery today. Try again!',
    reset(){ plx = 400; plv = 0; stack = []; sway = 0; swayV = 0; cakes = []; missed = 0; tossT = 1; berries = 0; },
    seeds:() => stack.length + berries, stats:() => `<span>Stack ${stack.length}/15</span><span>Missed ${missed}</span><span>Blueberry ${berries}</span>`,
    update(dt){
      time += dt; input.pressed = false; input.taps.length = 0;
      const target = ((input.right ? 1 : 0) - (input.left ? 1 : 0))*360; plv += (target - plv)*Math.min(1, dt*6); plx = clamp(plx + plv*dt, 60, W - 60);
      // the stack is a wobbly spring: speeding up and slowing down sets it swaying
      swayV += (-(plv - (this._lastV || 0))/dt*.0016 - sway*28 - swayV*2.4)*dt; sway += swayV*dt; this._lastV = plv;
      if (Math.abs(sway) > Math.max(.25, .9 - stack.length*.04) && stack.length > 2){ const n = Math.min(stack.length - 1, 2 + Math.floor(stack.length/5)); for (let k = 0; k < n; k++){ const c = stack.pop(); cakes.push({ x:plx + Math.sign(sway)*30, y:CEIL + 20 + height(), vx:Math.sign(sway)*200, vy:60, burnt:c.burnt, berry:c.berry, off:true }); } sway *= .3; shake = .3; pop(plx, CEIL + 60, 'Whoa! Too wobbly!', '#ffb0a0'); }
      tossT -= dt; if (tossT <= 0){ tossT = Math.max(.9, 2 - stack.length*.06) + Math.random()*.5; const r = Math.random(); cakes.push({ x:400, y:PAN_Y - 30, vx:(Math.random() - .5)*300, vy:-(420 + Math.random()*160), burnt:r < .15, berry:r > .85 }); }
      const stackBottom = CEIL + 26 + height();
      for (const c of cakes){
        c.vy -= (c.off ? -500 : 380)*dt; c.x += c.vx*dt; c.y += c.vy*dt; if (c.x < 30 || c.x > W - 30) c.vx = -c.vx;
        if (!c.off && c.vy < 0 && c.y < stackBottom + 10 && c.y > stackBottom - 30 && Math.abs(c.x - (plx + sway*stack.length*6)) < 46){ c.done = true;
          if (c.burnt){ swayV += 3; pop(plx, stackBottom + 30, 'Burnt! Bleh!', '#c8c8d0'); }
          else { stack.push({ burnt:false, berry:c.berry }); if (c.berry) berries++; anim.happy = .5; swayV += (c.x - plx)*.02; pop(plx, stackBottom + 30, c.berry ? 'Blueberry! +2' : '+1', '#ffe9a8'); } }
        else if (!c.off && c.y < CEIL){ c.done = true; if (!c.burnt){ missed++; pop(c.x, CEIL + 20, 'Splat on the ceiling!', '#ffb0a0'); } }
        if (c.off && c.y > H + 40) c.done = true;
      }
      cakes = cakes.filter(c => !c.done);
      if (stack.length + berries >= 15) finish(true); else if (missed >= 5) finish(false);
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f6e0c8'); g.addColorStop(1, '#f0d0e0'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // the ceiling is the floor here: floorboards up top, and the furniture hanging upside down
      ctx.fillStyle = '#a07a58'; ctx.fillRect(0, 0, W, CEIL); ctx.strokeStyle = 'rgba(60,36,20,.3)'; ctx.lineWidth = 2; for (let y = 20; y < CEIL; y += 18){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.fillStyle = '#8a5a32'; ctx.fillRect(560, CEIL, 120, 10); ctx.fillRect(570, CEIL + 10, 8, 50); ctx.fillRect(662, CEIL + 10, 8, 50); ctx.fillStyle = '#e0708f'; rr(590, CEIL + 10, 30, 20, 4); ctx.fill();
      ctx.fillStyle = '#c8b090'; ctx.fillRect(80, CEIL, 50, 8); ctx.fillRect(84, CEIL + 8, 6, 60); ctx.fillRect(120, CEIL + 8, 6, 60); ctx.fillRect(80, CEIL + 60, 50, 6); ctx.fillRect(84, CEIL + 66, 6, 30);
      // the stove (Flip's side) at the bottom
      ctx.fillStyle = '#4a4a54'; ctx.fillRect(320, PAN_Y, 160, H - PAN_Y); ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.ellipse(400, PAN_Y - 8, 40, 10, 0, 0, 7); ctx.fill(); ctx.fillRect(436, PAN_Y - 12, 40, 6);
      { const toss = Math.max(0, Math.sin(Math.max(0, 1 - tossT)*Math.PI)*12); ctx.save(); ctx.translate(500, PAN_Y + 4 - toss); ctx.fillStyle = '#e8e0f0'; ctx.beginPath(); ctx.ellipse(0, -30, 18, 26, 0, 0, 7); ctx.fill(); circle(0, -66, 16); ctx.beginPath(); ctx.ellipse(-8, -94, 5, 16, -.2, 0, 7); ctx.ellipse(8, -94, 5, 16, .2, 0, 7); ctx.fill(); ctx.fillStyle = '#ffb0c8'; ctx.beginPath(); ctx.ellipse(-8, -94, 2.5, 11, -.2, 0, 7); ctx.ellipse(8, -94, 2.5, 11, .2, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(-5, -68, 2); circle(5, -68, 2); ctx.fillStyle = '#fff'; rr(-16, -48, 32, 30, 6); ctx.fill(); ctx.restore(); }
      // you, upside down on the ceiling, holding the plate (and the stack hanging from it)
      ctx.save(); ctx.translate(plx, CEIL); ctx.scale(1, -1); Chin.draw(ctx, 'me', anim, -46, 0, { scale:.055, face:1, grounded:true, speed:Math.abs(plv) }); ctx.restore();
      ctx.fillStyle = '#f6f6fa'; ctx.beginPath(); ctx.ellipse(plx, CEIL + 22, 46, 7, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#c8c8d8'; ctx.lineWidth = 2; ctx.stroke();
      stack.forEach((c, i) => { const x = plx + sway*i*6, y = CEIL + 30 + i*9; ctx.fillStyle = '#e8b060'; ctx.beginPath(); ctx.ellipse(x, y, 38, 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#c88a40'; ctx.fillRect(x - 38, y, 76, 2); if (c.berry){ ctx.fillStyle = '#5a5ab8'; circle(x - 12, y - 2, 3); circle(x + 10, y - 1, 3); } });
      for (const c of cakes){ ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.off ? t*6 : Math.sin(t*8 + c.x)*.2); ctx.fillStyle = c.burnt ? '#3a2a20' : '#e8b060'; ctx.beginPath(); ctx.ellipse(0, 0, 34, 7, 0, 0, 7); ctx.fill(); if (c.berry){ ctx.fillStyle = '#5a5ab8'; circle(-10, -2, 3); circle(10, -1, 3); } if (c.burnt){ ctx.fillStyle = 'rgba(120,120,120,.5)'; circle(6, -14 - Math.sin(t*4)*3, 5); } ctx.restore(); }
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Stack ${stack.length + berries}/15`, 24, 31); progress((stack.length + berries)/15, '#e8b060');
      ctx.textAlign = 'right'; ctx.fillText(`Missed ${missed}/5`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Topsy-Turvy Land: Backwards Dash =================
// A race along the sky-path where nothing stays the right way round for long. Normally ↑ jumps over the
// stumps and ↓ ducks under the branches… until a "TOPSY!" sign flips the whole world and the keys swap!
// Reach the finish flag with your hearts to spare.
const BACKWARDS = (() => {
  const GY = 380, PX = 170, GOAL = 9000;
  let dist, speed, py, vy, duck, topsy, swapT, warn, obs, nextObs, hearts, inv, flipK;
  const keys = () => topsy ? { jump:'down', duck:'up' } : { jump:'up', duck:'down' };
  return {
    title:'Backwards Dash', sub:'A race where the controls keep turning upside down!',
    blurb:'Run along Topsy-Turvy Land’s sky-path! ↑ jumps over stumps and ↓ ducks under branches… until a TOPSY! sign flips the world over and the keys swap places. Keep your wits and reach the flag!',
    legend:['You run by yourself', 'Normally: ↑ jumps over stumps, ↓ ducks under branches', 'When the world flips (TOPSY!), the keys swap: ↓ jumps and ↑ ducks', 'The banner at the top always shows which key does what', 'Reach the finish flag with at least one heart left'],
    hints:['Watch the banner!', 'P to pause'], pad:['wgUp', 'wgDown'],
    winTitle:'Topsy-turvy champion!', winText:'You cross the finish line right side up (or maybe upside down?) and the whole of Topsy-Turvy Land cheers backwards: “!yaroo-H”',
    loseTitle:'In a muddle', loseText:'Too many stumps and branches. You sit down on the path, very dizzy. Try again!',
    againWinText:'Faster than ever, and the right way up!', againLoseText:'The keys got the better of you. Try again!',
    reset(){ dist = 0; speed = 250; py = GY; vy = 0; duck = false; topsy = false; swapT = 7; warn = 0; obs = []; nextObs = 500; hearts = 3; inv = 0; flipK = 0; },
    seeds:() => Math.floor(dist/700), stats:() => `<span>Distance ${Math.round(dist/10)} m</span><span>Hearts ${hearts}</span>`,
    update(dt){
      time += dt; inv = Math.max(0, inv - dt); speed = Math.min(380, speed + dt*3); dist += speed*dt;
      swapT -= dt; if (swapT <= 1.3 && !warn) warn = 1.3; if (warn){ warn = Math.max(0, warn - dt); }
      if (swapT <= 0){ topsy = !topsy; swapT = 6 + Math.random()*4; warn = 0; pop(400, 140, topsy ? 'TOPSY!' : 'TURVY! (back to normal)', topsy ? '#ff9ad0' : '#9ad8ff'); }
      flipK += ((topsy ? 1 : 0) - flipK)*Math.min(1, dt*6);
      const k = keys();
      for (const tp of input.taps) if (tp === k.jump && py >= GY - .5){ vy = -600; } input.taps.length = 0; input.pressed = false;
      duck = !!input[k.duck] && py >= GY - .5;
      vy += 1600*dt; py = Math.min(GY, py + vy*dt); if (py >= GY) vy = 0;
      if (dist > nextObs){ obs.push({ x:dist + 700, k:Math.random() < .5 ? 'stump' : 'branch' }); nextObs = dist + 380 + Math.random()*260; }
      for (const o of obs){ const sx = PX + (o.x - dist); if (o.hit || sx < PX - 30 || sx > PX + 30) continue;
        const hitStump = o.k === 'stump' && py > GY - 44, hitBranch = o.k === 'branch' && !duck;
        if ((hitStump || hitBranch) && inv <= 0){ o.hit = true; hearts--; inv = 1.2; shake = .4; pop(PX, GY - 90, o.k === 'stump' ? 'Trip!' : 'Bonk!', '#ffb0a0'); if (hearts <= 0){ finish(false); return; } } }
      obs = obs.filter(o => o.x > dist - 200);
      if (dist >= GOAL) finish(true);
    },
    draw(){
      // the whole picture turns upside down when it's TOPSY time
      ctx.save(); if (flipK > .01){ ctx.translate(W/2, H/2 + 20); ctx.scale(1, 1 - 2*flipK); ctx.translate(-W/2, -(H/2 + 20)); }
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#c8b0f0'); g.addColorStop(.5, '#f6d0e8'); g.addColorStop(1, '#b8e0f8'); ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);
      for (let i = 0; i < 6; i++){ const x = wrap(i*170 - dist*.2, W + 200) - 100; ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(x, 120 + (i % 3)*30, 26); circle(x + 26, 120 + (i % 3)*30, 20); }
      ctx.fillStyle = '#8ac87a'; ctx.fillRect(0, GY, W, H - GY + 40); ctx.fillStyle = '#6aa85a'; for (let i = 0; i < 20; i++){ const x = wrap(i*60 - dist, W + 60) - 30; ctx.fillRect(x, GY, 30, 6); }
      { const fx = PX + (GOAL - dist); if (fx < W + 60){ ctx.fillStyle = '#5a3a1a'; ctx.fillRect(fx, GY - 120, 6, 120); ctx.fillStyle = '#ff6ab8'; ctx.beginPath(); ctx.moveTo(fx + 6, GY - 120); ctx.lineTo(fx + 60, GY - 104); ctx.lineTo(fx + 6, GY - 88); ctx.fill(); } }
      for (const o of obs){ const sx = PX + (o.x - dist); if (sx < -60 || sx > W + 60) continue;
        if (o.k === 'stump'){ ctx.fillStyle = '#8a5a32'; ctx.fillRect(sx - 18, GY - 40, 36, 40); ctx.fillStyle = '#c8a070'; ctx.beginPath(); ctx.ellipse(sx, GY - 40, 18, 6, 0, 0, 7); ctx.fill(); }
        else { ctx.fillStyle = '#5a3a1a'; ctx.fillRect(sx - 4, 0, 8, GY - 70); ctx.fillStyle = '#4a8a3a'; ctx.beginPath(); ctx.ellipse(sx, GY - 66, 46, 16, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#5aa84a'; for (let k = -2; k <= 2; k++) circle(sx + k*16, GY - 60, 9); } }
      if (!(inv > 0 && Math.floor(inv*12) % 2)){ ctx.save(); ctx.translate(PX, py); if (duck) ctx.scale(1.15, .6); Chin.draw(ctx, 'me', anim, 0, 0, { scale:.07, face:1, grounded:py >= GY, speed:speed }); ctx.restore(); }
      ctx.restore();
      // the key banner: always the right way up, always showing what the keys do right now
      const k = keys(), col = topsy ? '#ff9ad0' : '#9ad8ff';
      ctx.fillStyle = 'rgba(30,20,50,.82)'; rr(230, 58, 340, 46, 12); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; rr(230, 58, 340, 46, 12); ctx.stroke();
      ctx.fillStyle = col; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(`${k.jump === 'up' ? '↑' : '↓'} = JUMP     ${k.duck === 'up' ? '↑' : '↓'} = DUCK`, 400, 88);
      if (warn && Math.floor(warn*6) % 2){ ctx.fillStyle = '#ffe066'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.fillText('Get ready… the world is about to flip!', 400, 128); }
      ctx.textAlign = 'left'; drawPops(0);
    },
    hud(){ hudBar(); for (let i = 0; i < 3; i++){ ctx.fillStyle = i < hearts ? '#ff8ab8' : 'rgba(246,234,214,.2)'; circle(30 + i*26, 30, 9); } progress(dist/GOAL, '#ff9ad0'); ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Harmony Hollow: Color Mixer =================
// The paintings on the easel have faded patches! Mix paint drops (red, yellow, blue, white and a dot of
// black) on your palette until the color matches the patch, and it paints itself back in. Paint mixes
// like real paint: red and yellow make orange, blue and yellow make green, and white makes it paler.
const MIXER = (() => {
  const POTS = [{ id:'r', name:'Red', col:'#d8342a' }, { id:'y', name:'Yellow', col:'#f6d02a' }, { id:'b', name:'Blue', col:'#2a5ab8' }, { id:'w', name:'White', col:'#fbfbf6' }, { id:'k', name:'Black', col:'#2a2420' }];
  const PICTURES = ['sun', 'sea', 'flower', 'tree', 'house'];
  // real-paint mixing (red-yellow-blue), the way painters' colors blend
  const CORN = [[1, 1, 1], [1, 0, 0], [1, 1, 0], [1, .5, 0], [.163, .373, .6], [.5, 0, .5], [0, .66, .2], [.2, .094, 0]];
  function ryb(r, y, b){ const L = (a, c, f) => a + (c - a)*f, out = [0, 0, 0];
    for (let i = 0; i < 3; i++){ const c00 = L(CORN[0][i], CORN[1][i], r), c01 = L(CORN[4][i], CORN[5][i], r), c10 = L(CORN[2][i], CORN[3][i], r), c11 = L(CORN[6][i], CORN[7][i], r); out[i] = L(L(c00, c10, y), L(c01, c11, y), b); } return out; }
  function mixColor(m){ const pig = m.r + m.y + m.b, mx = Math.max(m.r, m.y, m.b, 1); let c = pig ? ryb(m.r/mx, m.y/mx, m.b/mx) : [1, 1, 1];
    const tot = pig + m.w + m.k; if (!tot) return null; const wf = m.w/tot, kf = m.k/tot; c = c.map(v => v*(1 - wf) + wf); c = c.map(v => v*(1 - kf*.85)); return c.map(v => Math.round(v*255)); }
  let mix, target, targetRGB, pi, timeLeft, doneT, drops, cur, best;
  function newTarget(){ let m; do { m = { r:Math.floor(Math.random()*3), y:Math.floor(Math.random()*3), b:Math.floor(Math.random()*3), w:Math.random() < .45 ? 1 + Math.floor(Math.random()*2) : 0, k:Math.random() < .12 ? 1 : 0 }; } while (m.r + m.y + m.b === 0 || m.r + m.y + m.b + m.w + m.k > 6);
    target = m; targetRGB = mixColor(m); mix = { r:0, y:0, b:0, w:0, k:0 }; doneT = 0; drops = 0; }
  const dist = (a, b) => a && b ? Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) : 999;
  function add(i){ if (doneT || i < 0 || i > 4) return; if (drops >= 12){ pop(400, 380, 'Too much paint! Wash the palette', '#ffb0a0'); return; } mix[POTS[i].id]++; drops++; playNote(330 + i*60, .25);
    if (dist(mixColor(mix), targetRGB) < 16){ doneT = .01; best++; anim.happy = 1.5; pop(400, 120, 'A perfect match!', '#ffe9a8'); } }
  const rgb = c => c ? `rgb(${c[0]},${c[1]},${c[2]})` : '#e8e0d0';
  function painting(kind, x, y, fill, faded){
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#f6efe0'; ctx.fillRect(-120, -90, 240, 180);
    const patch = faded ? 'rgba(200,190,180,.9)' : fill;
    if (kind === 'sun'){ ctx.fillStyle = '#9fd3ef'; ctx.fillRect(-110, -80, 220, 110); ctx.fillStyle = '#7ab86a'; ctx.fillRect(-110, 30, 220, 50); ctx.fillStyle = patch; circle(40, -30, 30); }
    else if (kind === 'sea'){ ctx.fillStyle = '#f6d8a8'; ctx.fillRect(-110, -80, 220, 70); ctx.fillStyle = patch; ctx.fillRect(-110, -10, 220, 90); ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let k = 0; k < 4; k++) ctx.fillRect(-90 + k*50, 10 + (k % 2)*20, 26, 3); }
    else if (kind === 'flower'){ ctx.fillStyle = '#d8ecc8'; ctx.fillRect(-110, -80, 220, 160); ctx.strokeStyle = '#4a8a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 70); ctx.lineTo(0, -10); ctx.stroke(); ctx.fillStyle = patch; for (let k = 0; k < 6; k++){ const a = k/6*Math.PI*2; circle(Math.cos(a)*26, -30 + Math.sin(a)*26, 18); } ctx.fillStyle = '#f2c230'; circle(0, -30, 14); }
    else if (kind === 'tree'){ ctx.fillStyle = '#f6e8c8'; ctx.fillRect(-110, -80, 220, 160); ctx.fillStyle = '#7a5230'; ctx.fillRect(-10, 0, 20, 70); ctx.fillStyle = patch; circle(0, -20, 50); circle(-34, 0, 30); circle(34, 0, 30); }
    else { ctx.fillStyle = '#bfe0f0'; ctx.fillRect(-110, -80, 220, 160); ctx.fillStyle = patch; ctx.fillRect(-60, -20, 120, 90); ctx.fillStyle = '#a4553f'; ctx.beginPath(); ctx.moveTo(-74, -20); ctx.lineTo(0, -70); ctx.lineTo(74, -20); ctx.fill(); ctx.fillStyle = '#6b4226'; ctx.fillRect(-14, 20, 28, 50); }
    if (faded){ ctx.setLineDash([5, 4]); ctx.strokeStyle = 'rgba(120,90,60,.6)'; ctx.lineWidth = 1.5; ctx.strokeRect(-110, -80, 220, 160); ctx.setLineDash([]); }
    ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 8; ctx.strokeRect(-124, -94, 248, 188); ctx.restore();
  }
  const potRect = i => ({ x:150 + i*104, y:384, w:84, h:60 });
  return {
    title:'Color Mixer', sub:'Mix paints to restore the faded paintings.',
    blurb:'The paintings on the easel have faded patches! Mix drops of paint on your palette until the color matches the patch exactly, just like a real painter. Red and yellow make orange, blue and yellow make green, white makes it paler.',
    legend:['The patch to fill is shown in the little swatch on the left', 'Click a paint pot (or press 1–5) to add a drop to your palette', 'Paint mixes like real paint: red + yellow = orange, yellow + blue = green, red + blue = purple', 'White makes it paler, black makes it darker. Press 0 (or Wash) to start over', 'Restore all five paintings'],
    hints:['1–5 or click a pot to add paint', '0 or Wash to start over', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgAction'], actionLabel:'Add drop', clicks:true,
    winTitle:'The gallery is complete!', winText:'All five paintings glow with color again. The harp plays a little fanfare, and someone hangs your paw print in the corner of each one.',
    loseTitle:'The paint dried', loseText:'The palette has gone all crusty. Rinse your brushes and try again!',
    againWinText:'Another five masterpieces restored!', againLoseText:'The paint dried too quickly today. Try again!',
    reset(){ pi = 0; timeLeft = 180; best = 0; cur = 0; newTarget(); },
    seeds:() => best*3, stats:() => `<span>Paintings ${best}/5</span><span>Time left ${Math.max(0, Math.ceil(timeLeft))} s</span>`,
    update(dt){
      time += dt; input.taps.forEach(k => { if (k === 'left') cur = (cur + 4) % 5; if (k === 'right') cur = (cur + 1) % 5; }); input.taps.length = 0;
      if (doneT){ doneT += dt; input.pressed = false; input.keys.length = 0; input.click = null; if (doneT > 1.8){ pi++; if (pi >= 5) finish(true); else newTarget(); } return; }
      timeLeft -= dt; if (timeLeft <= 0){ finish(false); return; }
      for (const k of input.keys){ if (k === '0'){ mix = { r:0, y:0, b:0, w:0, k:0 }; drops = 0; } else add(+k - 1); } input.keys.length = 0;
      if (input.pressed){ input.pressed = false; add(cur); }
      if (input.click){ const { x, y } = input.click; input.click = null; for (let i = 0; i < 5; i++){ const r = potRect(i); if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h){ cur = i; add(i); } } if (x > 690 && x < 780 && y > 300 && y < 340){ mix = { r:0, y:0, b:0, w:0, k:0 }; drops = 0; } }
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f6e0b8'); g.addColorStop(1, '#e8b890'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(330, 340); ctx.lineTo(400, 50); ctx.lineTo(470, 340); ctx.moveTo(400, 50); ctx.lineTo(400, 360); ctx.stroke();
      const cur2 = mixColor(mix); painting(PICTURES[pi % 5], 400, 190, doneT ? rgb(targetRGB) : null, !doneT);
      // the patch to match, and your palette
      ctx.fillStyle = 'rgba(40,24,12,.75)'; rr(30, 110, 130, 150, 12); ctx.fill(); ctx.fillStyle = '#fff6e4'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.fillText('The patch needs:', 42, 132); ctx.fillStyle = rgb(targetRGB); rr(52, 144, 86, 86, 10); ctx.fill(); ctx.strokeStyle = '#fff6e4'; ctx.lineWidth = 2; rr(52, 144, 86, 86, 10); ctx.stroke();
      ctx.fillStyle = 'rgba(40,24,12,.75)'; rr(640, 110, 140, 240, 12); ctx.fill(); ctx.fillStyle = '#fff6e4'; ctx.fillText('Your palette:', 654, 132);
      ctx.fillStyle = '#e8d8b8'; ctx.beginPath(); ctx.ellipse(710, 200, 54, 44, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#c8b898'; circle(686, 222, 8); ctx.fillStyle = rgb(cur2); circle(712, 192, 30);
      const m = Math.round(Math.max(0, 1 - dist(cur2, targetRGB)/160)*100); ctx.fillStyle = '#fff6e4'; ctx.font = '600 13px Nunito, sans-serif'; ctx.fillText(cur2 ? `Close: ${m}%` : 'Add some paint!', 656, 266); ctx.fillText(`Drops: ${drops}/12`, 656, 286);
      ctx.fillStyle = '#5a8ab8'; rr(690, 300, 90, 40, 8); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 14px "Pixelify Sans", monospace'; ctx.fillText('0 Wash', 708, 326);
      POTS.forEach((p, i) => { const r = potRect(i); ctx.fillStyle = i === cur ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.25)'; rr(r.x, r.y, r.w, r.h, 10); ctx.fill(); ctx.fillStyle = '#8a8a96'; rr(r.x + 22, r.y + 10, 40, 32, 6); ctx.fill(); ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(r.x + 42, r.y + 14, 18, 6, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#3a2416'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(`${i + 1} ${p.name}`, r.x + r.w/2, r.y + 56); ctx.textAlign = 'left'; });
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Painting ${Math.min(5, pi + 1)}/5`, 24, 31); progress(best/5, '#e8a0a8'); ctx.textAlign = 'right'; ctx.fillStyle = timeLeft < 20 ? '#ff8a9a' : '#fff6e4'; ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Harmony Hollow: Harp Up or Down =================
// A listening game. The golden harp plays two notes, one after the other: was the second one HIGHER
// or LOWER? Every right answer lets you climb a rung up the harp toward the clouds. The notes get closer
// together as you go higher, so listen carefully!
const PITCH = (() => {
  const SCALE = [196.0, 220.0, 246.9, 293.7, 329.6, 392.0, 440.0, 493.9, 587.3, 659.3, 784.0, 880.0], GOAL = 10;
  let a, b, phase, phaseT, climb, oops, answer, flash, shown;
  function newPair(){ const gap = Math.max(1, 6 - Math.floor(climb/2)); a = Math.floor(Math.random()*SCALE.length); b = a + (Math.random() < .5 ? gap : -gap); if (b < 0 || b >= SCALE.length) b = a - (b - a); phase = 'play'; phaseT = 0; shown = false; }
  function guess(up){ if (phase !== 'ask') return; const right = (b > a) === up; phase = 'show'; phaseT = 0; shown = true; answer = right;
    if (right){ climb++; anim.happy = 1; pop(400, 120, up ? 'Yes, higher!' : 'Yes, lower!', '#ffe9a8'); } else { oops++; shake = .3; pop(400, 120, b > a ? 'Oops, it went up!' : 'Oops, it went down!', '#ffb0a0'); } }
  return {
    title:'Harp Up or Down', sub:'Listen to the golden harp and climb to the clouds.',
    blurb:'The golden harp plays two notes, one after the other. Was the second note higher or lower? Every right answer lets you climb higher up the harp. The notes get closer together as you climb, so listen closely!',
    legend:['Listen: the harp plays note 1, then note 2', 'Press ↑ (or click Higher) if the second note was higher, ↓ (or Lower) if it was lower', 'Space plays the two notes again', 'Climb 10 rungs to reach the clouds; three wrong guesses and you slide back down'],
    hints:['Listen with the sound on!', '↑ higher  ↓ lower', 'Space to hear it again'], pad:['wgUp', 'wgDown', 'wgAction'], actionLabel:'Again', clicks:true,
    winTitle:'Up in the clouds!', winText:'You reach the very top of the harp and sit on a cloud while every string plays at once. What wonderful ears you have!',
    loseTitle:'Down you slide', loseText:'Whoosh, back down the harp strings! Listen extra closely and try again.',
    againWinText:'Sharp ears! The harp plays a song just for you.', againLoseText:'Those notes were very close together. Try again!',
    reset(){ climb = 0; oops = 0; flash = [-1, -1]; newPair(); phase = 'wait'; phaseT = -.6; },
    seeds:() => climb, stats:() => `<span>Climbed ${climb}/${GOAL}</span><span>Wrong guesses ${oops}</span>`,
    update(dt){
      time += dt; phaseT += dt;
      const taps = input.taps.splice(0);
      if (input.pressed){ input.pressed = false; if (phase === 'ask'){ phase = 'play'; phaseT = 0; } }
      if (input.click){ const { x, y } = input.click; input.click = null; if (y > 400 && y < 460){ if (x > 230 && x < 380) guess(true); if (x > 420 && x < 570) guess(false); } }
      for (const k of taps){ if (k === 'up') guess(true); if (k === 'down') guess(false); }
      if (phase === 'wait' && phaseT > 0){ phase = 'play'; phaseT = 0; }
      if (phase === 'play'){ if (phaseT > .05 && flash[0] < 0){ playNote(SCALE[a], .7); flash = [a, -1]; } if (phaseT > .8 && flash[1] < 0){ playNote(SCALE[b], .7); flash = [a, b]; } if (phaseT > 1.4){ phase = 'ask'; } }
      if (phase === 'show' && phaseT > 1.6){ flash = [-1, -1]; if (climb >= GOAL) finish(true); else if (oops >= 3) finish(false); else newPair(); }
      if (phase === 'play' && phaseT < .05) flash = [-1, -1];
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f6c890'); g.addColorStop(1, '#c87a8a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,.8)'; for (const [x, y] of [[150, 70], [600, 60], [400, 40]]){ circle(x, y, 30); circle(x + 30, y + 6, 24); circle(x - 30, y + 6, 22); }
      // the harp: a golden frame with twelve strings (you climb up the middle)
      ctx.strokeStyle = '#d8a830'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(240, 400); ctx.quadraticCurveTo(210, 120, 400, 70); ctx.quadraticCurveTo(560, 60, 570, 130); ctx.moveTo(240, 400); ctx.lineTo(560, 400); ctx.moveTo(560, 400); ctx.lineTo(570, 130); ctx.stroke(); ctx.lineCap = 'butt';
      for (let i = 0; i < SCALE.length; i++){ const x = 270 + i*24, top = 110 + i*3, lit = shown && (flash[0] === i || flash[1] === i); const vib = phase === 'play' ? Math.sin(t*50 + i)*1.2 : 0;   // every string shimmers, so your ears have to do the work
        ctx.strokeStyle = lit ? (i === flash[1] ? '#ffffff' : '#ffe9a8') : 'rgba(255,240,200,.75)'; ctx.lineWidth = lit ? 3 : 1.6; ctx.beginPath(); ctx.moveTo(x, top); ctx.quadraticCurveTo(x + vib, 255, x, 396); ctx.stroke();
        if (lit){ ctx.fillStyle = i === flash[1] ? '#fff' : '#ffe9a8'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(i === flash[0] ? '1' : '2', x, top - 8); ctx.textAlign = 'left'; } }
      // you, climbing up the harp
      { const y = 390 - climb*28; Chin.draw(ctx, 'me', anim, 410, y, { scale:.055, face:1, grounded:true, speed:0 }); }
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.fillText('the clouds ↑', 600, 104);
      // the two notes as they play
      ctx.textAlign = 'center'; ctx.font = '700 22px "Pixelify Sans", monospace';
      if (phase === 'play'){ ctx.fillStyle = '#fff6e4'; ctx.fillText(phaseT < .8 ? '♪ note 1…' : '♪ note 2…', 130, 240); }
      else if (phase === 'ask'){ ctx.fillStyle = '#fff6e4'; ctx.fillText('Higher or lower?', 130, 240); ctx.font = '600 13px Nunito, sans-serif'; ctx.fillText('(Space to hear it again)', 130, 264); }
      ctx.textAlign = 'left';
      for (const [x, label, up] of [[230, '↑ Higher', true], [420, '↓ Lower', false]]){ ctx.fillStyle = phase === 'ask' ? (up ? '#7a5ab8' : '#4a7ab8') : 'rgba(80,60,100,.4)'; rr(x, 404, 150, 52, 12); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 20px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(label, x + 75, 438); ctx.textAlign = 'left'; }
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Climbed ${climb}/${GOAL}`, 24, 31); progress(climb/GOAL, '#ffe9a8'); ctx.textAlign = 'right'; ctx.fillText(`Slips ${oops}/3`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= Harmony Hollow: The Music Box =================
// The bandstand's old music box has lost its pins, so it plays the wrong tune! Listen to how the tune
// SHOULD go (the right pins light up as it plays), then put the pins back on the drum yourself. When the
// box plays your pins and it sounds right, the little dancer on top spins again.
const MUSICBOX = (() => {
  const NOTES = [261.6, 293.7, 329.6, 392.0, 440.0, 523.3], ROWS = NOTES.length, GX = 190, GY = 150, CW = 54, CH = 38;
  const TUNES = [[0, 2, 4, 2], [4, 3, 2, -1, 2, 3, 4, -1], [0, 2, 1, 3, 2, 4, 3, 5], [2, 2, 3, 4, 4, 3, 2, 0]];
  let tune, ti, pins, cur, play, playT, playStep, doneT, listens, timeLeft, solved;
  function startTune(i){ ti = i; tune = TUNES[i]; pins = Array(tune.length).fill(-1); cur = [0, ROWS - 1]; play = null; doneT = 0; listens = 0; }
  function startPlay(kind){ play = kind; playT = 0; playStep = -1; if (kind === 'target') listens++; }
  function check(){ if (pins.every((p, i) => p === tune[i])){ doneT = .01; solved++; startPlay('mine'); anim.happy = 2; pop(400, 110, 'That’s the tune!', '#ffe9a8'); } }
  function toggle(c, r){ if (doneT || c < 0 || c >= tune.length || r < 0 || r >= ROWS) return; pins[c] = pins[c] === r ? -1 : r; playNote(NOTES[r], .3); check(); }
  return {
    title:'The Music Box', sub:'Put the pins back so the old music box plays its tune.',
    blurb:'The silver music box on the bandstand has lost its pins, so the little dancer on top won’t spin. Listen to the tune it should play (watch the pins light up), then put the pins back yourself!',
    legend:['Press 1 (or click Listen) to hear the tune and see its pins light up as it plays', 'Click a spot on the drum (or arrows + Space) to place a pin there; one pin per column', 'Higher rows play higher notes. Press 2 (or click Play mine) to hear your pins', 'Get it exactly right and the dancer spins. Fix four tunes'],
    hints:['1 Listen  2 Play mine', 'Click to place pins', 'P to pause'], pad:['wgLeft', 'wgUp', 'wgDown', 'wgRight', 'wgAction'], actionLabel:'Pin', clicks:true,
    winTitle:'The music box sings!', winText:'All four tunes tinkle out of the music box and the little dancer twirls and twirls. The whole bandstand claps along.',
    loseTitle:'The box wound down', loseText:'The music box key has run out of wind for today. Wind it up and try again!',
    againWinText:'Every pin in the right place, again!', againLoseText:'So many pins, so little time. Try again!',
    reset(){ timeLeft = 240; solved = 0; startTune(0); },
    seeds:() => solved*3, stats:() => `<span>Tunes fixed ${solved}/4</span><span>Time left ${Math.max(0, Math.ceil(timeLeft))} s</span>`,
    update(dt){
      time += dt;
      if (play){ playT += dt; const st = Math.floor(playT/.42); if (st !== playStep){ playStep = st; const seq = play === 'target' ? tune : pins; if (st < seq.length){ if (seq[st] >= 0) playNote(NOTES[seq[st]], .5); } else play = null; } }
      if (doneT){ doneT += dt; input.taps.length = 0; input.keys.length = 0; input.click = null; input.pressed = false; if (doneT > 3.8){ if (ti + 1 >= TUNES.length) finish(true); else startTune(ti + 1); } return; }
      timeLeft -= dt; if (timeLeft <= 0){ finish(false); return; }
      for (const k of input.taps){ if (k === 'left') cur[0] = Math.max(0, cur[0] - 1); if (k === 'right') cur[0] = Math.min(tune.length - 1, cur[0] + 1); if (k === 'up') cur[1] = Math.min(ROWS - 1, cur[1] + 1); if (k === 'down') cur[1] = Math.max(0, cur[1] - 1); } input.taps.length = 0;
      if (input.pressed){ input.pressed = false; toggle(cur[0], cur[1]); }
      for (const k of input.keys){ if (k === '1') startPlay('target'); if (k === '2') startPlay('mine'); } input.keys.length = 0;
      if (input.click){ const { x, y } = input.click; input.click = null; const c = Math.floor((x - GX)/CW), r = ROWS - 1 - Math.floor((y - GY)/CH);
        if (x > GX && c < tune.length && y > GY && y < GY + ROWS*CH){ cur = [c, r]; toggle(c, r); }
        else if (y > 400 && y < 450){ if (x > 190 && x < 360) startPlay('target'); if (x > 440 && x < 610) startPlay('mine'); } }
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#e8c8a0'); g.addColorStop(1, '#a87a5a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // the box, its drum of pin holes, and the dancer on the lid
      ctx.fillStyle = '#c8c8d8'; rr(GX - 30, GY - 30, tune.length*CW + 60, ROWS*CH + 60, 14); ctx.fill(); ctx.fillStyle = '#9a9aac'; rr(GX - 20, GY - 20, tune.length*CW + 40, ROWS*CH + 40, 10); ctx.fill();
      for (let c = 0; c < tune.length; c++) for (let r = 0; r < ROWS; r++){ const x = GX + c*CW + CW/2, y = GY + (ROWS - 1 - r)*CH + CH/2; ctx.fillStyle = 'rgba(40,40,60,.35)'; circle(x, y, 4); }
      for (let c = 0; c < tune.length; c++){ const playing = play && playStep === c; if (playing){ ctx.fillStyle = 'rgba(255,240,180,.25)'; ctx.fillRect(GX + c*CW, GY, CW, ROWS*CH); }
        // while you listen, the right pin lights up for each step
        if (play === 'target' && playStep === c && tune[c] >= 0){ const y = GY + (ROWS - 1 - tune[c])*CH + CH/2; ctx.fillStyle = 'rgba(255,240,150,.9)'; circle(GX + c*CW + CW/2, y, 13); }
        if (pins[c] >= 0){ const y = GY + (ROWS - 1 - pins[c])*CH + CH/2; ctx.fillStyle = '#e8e8f6'; circle(GX + c*CW + CW/2, y, 9); ctx.fillStyle = `hsl(${pins[c]*50},70%,60%)`; circle(GX + c*CW + CW/2, y, 6); } }
      ctx.strokeStyle = '#ff6ab8'; ctx.lineWidth = 2.5; ctx.strokeRect(GX + cur[0]*CW + 3, GY + (ROWS - 1 - cur[1])*CH + 3, CW - 6, CH - 6);
      ctx.fillStyle = '#3a2416'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.fillText('high', GX - 26, GY + 12); ctx.fillText('low', GX - 24, GY + ROWS*CH - 4);
      { const dx = GX + tune.length*CW + 80, dy = 140, spin = doneT ? t*8 : 0; ctx.fillStyle = '#e8d8f0'; ctx.beginPath(); ctx.ellipse(dx, dy + 60, 40, 10, 0, 0, 7); ctx.fill(); ctx.save(); ctx.translate(dx, dy + 54); ctx.scale(Math.cos(spin), 1); ctx.fillStyle = '#ff9ad0'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(-22, 0); ctx.lineTo(22, 0); ctx.fill(); ctx.fillStyle = '#f6e0d0'; circle(0, -38, 9); ctx.strokeStyle = '#f6e0d0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, -26); ctx.lineTo(-20, -44); ctx.moveTo(4, -26); ctx.lineTo(20, -44); ctx.stroke(); ctx.restore(); }
      for (const [x, label, on] of [[190, '1 ♪ Listen', play === 'target'], [440, '2 ▶ Play mine', play === 'mine']]){ ctx.fillStyle = on ? '#ffd27a' : '#6a4a8a'; rr(x, 404, 170, 46, 12); ctx.fill(); ctx.fillStyle = on ? '#3a2416' : '#fff'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(label, x + 85, 433); ctx.textAlign = 'left'; }
      ctx.fillStyle = '#3a2416'; ctx.font = '600 13px Nunito, sans-serif'; ctx.fillText(listens ? 'Watch which pins light up, then copy them!' : 'Press Listen to hear how the tune should go', 190, 128);
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Tune ${Math.min(4, ti + 1)}/4`, 24, 31); progress(solved/4, '#ff9ad0'); ctx.textAlign = 'right'; ctx.fillStyle = timeLeft < 20 ? '#ff8a9a' : '#fff6e4'; ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= THE WARP: Time Freeze =================
// Tock the clock creature has a trick: in this corner of THE WARP, time only moves when YOU move. Stand
// still and the warp bolts freeze in mid-air; take a step and the whole world ticks forward with you.
// Collect ten grains of sand for Tock's hourglass without getting zapped.
const FREEZE = (() => {
  const TOPY = 60;
  let p, bolts, sand, got, hearts, inv, spawnT, scale, gtime;
  const newSand = () => { let x, y; do { x = 60 + Math.random()*680; y = TOPY + 40 + Math.random()*340; } while (Math.hypot(x - p.x, y - p.y) < 180); sand = { x, y }; };
  return {
    title:'Time Freeze', sub:'In Tock’s corner of THE WARP, time only moves when you do.',
    blurb:'Tock the clock has a trick: here, time only moves when YOU move. Stand still and the warp bolts freeze in mid-air. Take a step and everything moves again. Gather ten grains of sand for Tock’s hourglass!',
    legend:['Arrow keys to move. When you stop, time (almost) stops too', 'Warp bolts fly in from the edges; plan your path while they’re frozen', 'Collect 10 grains of sand', 'Three zaps and Tock rewinds you home'],
    hints:['Arrows move (and move time)', 'Stand still to think', 'P to pause'], pad:['wgLeft', 'wgUp', 'wgDown', 'wgRight'],
    winTitle:'Tick-tock, well done!', winText:'Tock’s hourglass fills to the very top, and for one second every clock in every world chimes at once.',
    loseTitle:'Zapped!', loseText:'Tock winds you back to the beginning. “Time for another try,” he ticks.',
    againWinText:'Perfect timing, every time!', againLoseText:'Those bolts are sneaky. Take your time!',
    reset(){ p = { x:400, y:270, face:1 }; bolts = []; got = 0; hearts = 3; inv = 0; spawnT = 1; scale = .05; gtime = 0; newSand(); },
    seeds:() => got*2, stats:() => `<span>Sand ${got}/10</span><span>Hearts ${hearts}</span>`,
    update(dt){
      time += dt; input.pressed = false; input.taps.length = 0;
      const ax = (input.right ? 1 : 0) - (input.left ? 1 : 0), ay = (input.down ? 1 : 0) - (input.up ? 1 : 0), moving = ax || ay;
      scale += ((moving ? 1 : .04) - scale)*Math.min(1, dt*10); const gdt = dt*scale; gtime += gdt;
      if (moving){ const l = Math.hypot(ax, ay); p.x = clamp(p.x + ax/l*230*dt, 24, W - 24); p.y = clamp(p.y + ay/l*230*dt, TOPY + 24, H - 16); if (ax) p.face = ax; }
      inv = Math.max(0, inv - gdt);
      spawnT -= gdt; if (spawnT <= 0){ spawnT = Math.max(.35, 1.1 - got*.07); const side = Math.floor(Math.random()*4), sx = side === 0 ? -20 : side === 1 ? W + 20 : Math.random()*W, sy = side === 2 ? TOPY - 20 : side === 3 ? H + 20 : TOPY + Math.random()*(H - TOPY);
        const a = Math.atan2(p.y - sy, p.x - sx) + (Math.random() - .5)*.6, v = 170 + got*12; bolts.push({ x:sx, y:sy, vx:Math.cos(a)*v, vy:Math.sin(a)*v, trail:[] }); }
      for (const b of bolts){ b.x += b.vx*gdt; b.y += b.vy*gdt; b.trail.push({ x:b.x, y:b.y }); if (b.trail.length > 8) b.trail.shift();
        if (inv <= 0 && Math.hypot(b.x - p.x, b.y - (p.y - 18)) < 20){ b.hit = true; hearts--; inv = 1.2; shake = .4; pop(p.x, p.y - 50, 'Zap!', '#ff9ad0'); if (hearts <= 0){ finish(false); return; } } }
      bolts = bolts.filter(b => !b.hit && b.x > -60 && b.x < W + 60 && b.y > -60 && b.y < H + 60);
      if (Math.hypot(sand.x - p.x, sand.y - (p.y - 16)) < 26){ got++; anim.happy = 1; pop(sand.x, sand.y - 20, `${got}/10`, '#ffe9a8'); if (got >= 10){ finish(true); return; } newSand(); }
    },
    draw(){
      const g = ctx.createRadialGradient(400, 270, 40, 400, 270, 520); g.addColorStop(0, '#3a1a5a'); g.addColorStop(1, '#0a0418'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(400, 270); ctx.rotate(gtime*.2); for (let k = 0; k < 12; k++){ ctx.rotate(Math.PI/6); ctx.strokeStyle = 'rgba(200,150,255,.08)'; ctx.lineWidth = 30; ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(600, 0); ctx.stroke(); } ctx.restore();
      // Tock, in the corner, his hands moving only as fast as time does
      { const tx = 720, ty = 110; ctx.fillStyle = '#e8d8a8'; circle(tx, ty, 42); ctx.fillStyle = '#fff8e8'; circle(tx, ty, 34); ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(gtime*2 - 1.57)*26, ty + Math.sin(gtime*2 - 1.57)*26); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(gtime*.2 - 1.57)*16, ty + Math.sin(gtime*.2 - 1.57)*16); ctx.stroke();
        ctx.fillStyle = '#1a1a1a'; circle(tx - 12, ty - 10, 3); circle(tx + 12, ty - 10, 3); ctx.fillStyle = '#c9a13a'; ctx.fillRect(tx - 6, ty - 52, 12, 10); }
      if (scale < .3){ ctx.fillStyle = 'rgba(160,120,255,.12)'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(220,200,255,.7)'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('⏸ time is frozen', 400, 100); ctx.textAlign = 'left'; }
      { const sg = ctx.createRadialGradient(sand.x, sand.y, 2, sand.x, sand.y, 26); sg.addColorStop(0, 'rgba(255,230,150,.8)'); sg.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = sg; circle(sand.x, sand.y, 26); ctx.fillStyle = '#f2d080'; ctx.beginPath(); ctx.moveTo(sand.x - 8, sand.y - 10); ctx.lineTo(sand.x + 8, sand.y - 10); ctx.lineTo(sand.x, sand.y); ctx.lineTo(sand.x + 8, sand.y + 10); ctx.lineTo(sand.x - 8, sand.y + 10); ctx.lineTo(sand.x, sand.y); ctx.closePath(); ctx.fill(); }
      for (const b of bolts){ ctx.strokeStyle = 'rgba(255,120,220,.5)'; ctx.lineWidth = 4; ctx.beginPath(); b.trail.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y)); ctx.stroke(); ctx.fillStyle = '#ffd0f0'; circle(b.x, b.y, 7); ctx.fillStyle = '#ff6ad5'; circle(b.x, b.y, 4); }
      if (!(inv > 0 && Math.floor(time*12) % 2)) Chin.draw(ctx, 'me', anim, p.x, p.y, { scale:.06, face:p.face, grounded:true, speed:scale > .5 ? 120 : 0 });
      drawPops(0);
    },
    hud(){ hudBar(); for (let i = 0; i < 3; i++){ ctx.fillStyle = i < hearts ? '#ff9ad0' : 'rgba(246,234,214,.2)'; circle(30 + i*26, 30, 9); } ctx.fillStyle = '#fff6e4'; ctx.fillText(`Sand ${got}/10`, 120, 31); progress(got/10, '#f2d080'); ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= THE WARP: Mirror Match =================
// In the warp mirror, your reflection doesn't quite copy you: when you step left it steps right (up and
// down stay the same), and it lives in a different room with different walls. Get yourself AND your
// reflection onto your stars at the same time. A wall can hold one of you still while the other moves:
// that's the trick! Mind the spikes.
const MIRROR = (() => {
  const CC = 7, RR = 8, TS = 44, LX = 38, RX = 454, OY = 74;
  let L, R, me, ref, level, moves, solvedN, timeLeft, doneT, resetT;
  function gen(){
    for (let tries = 0; tries < 600; tries++){
      const mk = () => Array.from({ length:RR }, () => Array.from({ length:CC }, () => { const v = Math.random(); return v < .24 ? 'wall' : v < .3 ? 'spike' : ''; }));
      const a = mk(), b = mk(); const s1 = [0, RR - 1], s2 = [CC - 1, RR - 1]; a[s1[1]][s1[0]] = ''; b[s2[1]][s2[0]] = '';
      const g1 = [Math.floor(Math.random()*CC), Math.floor(Math.random()*3)], g2 = [Math.floor(Math.random()*CC), Math.floor(Math.random()*3)]; if (a[g1[1]][g1[0]] || b[g2[1]][g2[0]]) continue;
      // check it can be solved (and isn't too easy) by trying every move from the start
      const key = (p, q) => p.join() + '|' + q.join(), seen = new Map([[key(s1, s2), 0]]), q = [[s1, s2]]; let found = -1;
      while (q.length){ const [p1, p2] = q.shift(), dd = seen.get(key(p1, p2)); if (p1[0] === g1[0] && p1[1] === g1[1] && p2[0] === g2[0] && p2[1] === g2[1]){ found = dd; break; }
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){ const n1 = [p1[0] + dx, p1[1] + dy], n2 = [p2[0] - dx, p2[1] + dy];
          const ok = (n, gd) => n[0] >= 0 && n[0] < CC && n[1] >= 0 && n[1] < RR && gd[n[1]][n[0]] !== 'wall';
          const m1 = ok(n1, a) ? n1 : p1, m2 = ok(n2, b) ? n2 : p2; if (a[m1[1]][m1[0]] === 'spike' || b[m2[1]][m2[0]] === 'spike') continue;
          const k = key(m1, m2); if (!seen.has(k)){ seen.set(k, dd + 1); q.push([m1, m2]); } } }
      if (found >= Math.max(4, 9 + level*2 - Math.floor(tries/120)*2) && found <= 30){ L = { grid:a, goal:g1, start:s1 }; R = { grid:b, goal:g2, start:s2 }; me = [...s1]; ref = [...s2]; moves = 0; doneT = 0; return; }
    }
  }
  function step(dx, dy){
    if (doneT || resetT) return; moves++;
    const ok = (n, side) => n[0] >= 0 && n[0] < CC && n[1] >= 0 && n[1] < RR && side.grid[n[1]][n[0]] !== 'wall';
    const n1 = [me[0] + dx, me[1] + dy], n2 = [ref[0] - dx, ref[1] + dy]; if (ok(n1, L)) me = n1; if (ok(n2, R)) ref = n2;
    if (L.grid[me[1]][me[0]] === 'spike' || R.grid[ref[1]][ref[0]] === 'spike'){ resetT = .8; shake = .3; pop(400, 100, 'Ouch! Back to the start', '#ffb0c0'); return; }
    if (me[0] === L.goal[0] && me[1] === L.goal[1] && ref[0] === R.goal[0] && ref[1] === R.goal[1]){ doneT = .01; solvedN++; anim.happy = 2; pop(400, 100, 'Both of you made it!', '#ffe9a8'); }
  }
  function board(side, ox, who, mirror){
    ctx.fillStyle = 'rgba(30,20,60,.8)'; rr(ox - 8, OY - 8, CC*TS + 16, RR*TS + 16, 12); ctx.fill();
    for (let r = 0; r < RR; r++) for (let c = 0; c < CC; c++){ const x = ox + c*TS, y = OY + r*TS, v = side.grid[r][c];
      ctx.fillStyle = (r + c) % 2 ? '#3a2a5a' : '#423064'; ctx.fillRect(x, y, TS, TS);
      if (v === 'wall'){ ctx.fillStyle = '#8a7ab8'; rr(x + 3, y + 3, TS - 6, TS - 6, 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(x + 6, y + 6, TS - 12, 4); }
      if (v === 'spike'){ ctx.fillStyle = '#ff6ab8'; for (let k = 0; k < 3; k++){ ctx.beginPath(); ctx.moveTo(x + 6 + k*12, y + TS - 6); ctx.lineTo(x + 12 + k*12, y + 10); ctx.lineTo(x + 18 + k*12, y + TS - 6); ctx.fill(); } } }
    const [gx, gy] = side.goal; ctx.fillStyle = '#ffe066'; ctx.beginPath(); for (let k = 0; k < 10; k++){ const a = -Math.PI/2 + k*Math.PI/5, r = k % 2 ? 7 : 16; ctx.lineTo(ox + gx*TS + TS/2 + Math.cos(a)*r, OY + gy*TS + TS/2 + Math.sin(a)*r); } ctx.closePath(); ctx.fill();
    ctx.save(); if (mirror) ctx.globalAlpha = .8; Chin.draw(ctx, 'me', anim, ox + who[0]*TS + TS/2, OY + who[1]*TS + TS - 4, { scale:.038, face:mirror ? -1 : 1, grounded:true, speed:0 }); ctx.restore();
  }
  return {
    title:'Mirror Match', sub:'Guide yourself and your reflection to your stars.',
    blurb:'In the warp mirror, your reflection doesn’t quite copy you: when you step left, it steps RIGHT. And it lives in a different room, with different walls! Get both of you onto your stars at the same moment.',
    legend:['Arrow keys move you; your reflection moves the mirror way (left and right swap, up and down stay)', 'Walls stop one of you while the other keeps going: use that to line things up!', 'Both of you must stand on your stars at the same time', 'Spikes send you both back to the start. Space restarts the room. Solve four rooms'],
    hints:['Arrows move both of you', 'Space restarts the room', 'P to pause'], pad:['wgLeft', 'wgUp', 'wgDown', 'wgRight', 'wgAction'], actionLabel:'Restart',
    winTitle:'Perfect reflection!', winText:'You and your reflection high-five through the glass, and the mirror ripples like water. THE WARP thinks you’re very clever.',
    loseTitle:'Out of time', loseText:'Your reflection yawns and wanders off. Mirrors get sleepy too! Try again.',
    againWinText:'You and your reflection make a great team!', againLoseText:'Mirror puzzles are tricky. Try again!',
    reset(){ level = 0; solvedN = 0; timeLeft = 240; resetT = 0; gen(); },
    seeds:() => solvedN*3, stats:() => `<span>Rooms ${solvedN}/4</span><span>Steps ${moves}</span>`,
    update(dt){
      time += dt;
      if (resetT){ resetT -= dt; input.taps.length = 0; if (resetT <= 0){ resetT = 0; me = [...L.start]; ref = [...R.start]; } return; }
      if (doneT){ doneT += dt; input.taps.length = 0; if (doneT > 1.6){ level++; if (solvedN >= 4) finish(true); else gen(); } return; }
      timeLeft -= dt; if (timeLeft <= 0){ finish(false); return; }
      for (const k of input.taps){ if (k === 'left') step(-1, 0); if (k === 'right') step(1, 0); if (k === 'up') step(0, -1); if (k === 'down') step(0, 1); } input.taps.length = 0;
      if (input.pressed){ input.pressed = false; me = [...L.start]; ref = [...R.start]; }
    },
    draw(){
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a0a30'); g.addColorStop(1, '#3a1a5a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      board(L, LX, me, false); board(R, RX, ref, true);
      // the mirror down the middle
      const mg = ctx.createLinearGradient(380, 0, 420, 0); mg.addColorStop(0, 'rgba(200,220,255,.1)'); mg.addColorStop(.5, 'rgba(230,240,255,.7)'); mg.addColorStop(1, 'rgba(200,220,255,.1)'); ctx.fillStyle = mg; ctx.fillRect(388, OY - 10, 24, RR*TS + 20);
      ctx.fillStyle = '#e8d8ff'; ctx.font = '600 14px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('you', LX + CC*TS/2, H - 16); ctx.fillText('your reflection', RX + CC*TS/2, H - 16); ctx.textAlign = 'left';
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Room ${Math.min(4, solvedN + 1)}/4`, 24, 31); progress(solvedN/4, '#c8a0ff'); ctx.textAlign = 'right'; ctx.fillStyle = timeLeft < 20 ? '#ff8a9a' : '#fff6e4'; ctx.fillText(`${Math.max(0, Math.ceil(timeLeft))} s`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

// ================= THE WARP: Door Hopper =================
// The floating doors of THE WARP each open onto a different world, and creatures keep tumbling in who
// have lost their way home. Each one tells you a little about where they live: open the right door
// before they get too worried. The doors drift and swap places, so keep your eyes on them!
const DOORS = (() => {
  const WORLDS2 = [
    { id:'jungle', sky:'#f2c86a', ground:'#3f8a4a', icon:'palm', who:'a sleepy sloth', clue:'“I live where golden vines hang from the trees!”' },
    { id:'lake', sky:'#1a2a58', ground:'#2a4a6a', icon:'moon', who:'a little owl', clue:'“I live by the water, under a great big moon.”' },
    { id:'city', sky:'#2a0f4a', ground:'#ff6ad5', icon:'neon', who:'a tiny robot', clue:'“I live where the signs glow pink and blue all night!”' },
    { id:'sea', sky:'#2a8ac0', ground:'#e0c890', icon:'fish', who:'a baby fish', clue:'“I live under the waves, in the coral!”' },
    { id:'nebula', sky:'#2a1048', ground:'#c8a0ff', icon:'star', who:'a star-whale calf', clue:'“I swim through the stars and the space-clouds!”' },
    { id:'under', sky:'#120e1a', ground:'#7fe0e6', icon:'crystal', who:'a young mole', clue:'“I live deep, deep underground, by the crystals.”' },
    { id:'castle', sky:'#9fd3ef', ground:'#8bbf6a', icon:'castle', who:'a baby dragon', clue:'“I live near a castle with a wizard’s tower!”' },
    { id:'west', sky:'#f6c07a', ground:'#d8b070', icon:'cactus', who:'a dusty jackrabbit', clue:'“I live in the desert, with cactuses and tumbleweeds.”' },
    { id:'topsy', sky:'#c8b0f0', ground:'#b8e0f8', icon:'flip', who:'an upside-down bunny', clue:'“I live where everything is upside down!”' },
    { id:'music', sky:'#f6c890', ground:'#c87a8a', icon:'note', who:'a singing songbird', clue:'“I live where the whole land plays music!”' },
  ];
  let doors, creature, patience, sent, oops, cur, swapT, anim2, doneT;
  function newRound(){
    const home = WORLDS2[Math.floor(Math.random()*WORLDS2.length)], others = WORLDS2.filter(w => w !== home).sort(() => Math.random() - .5).slice(0, 4);
    const ws2 = [home, ...others].sort(() => Math.random() - .5); doors = ws2.map((w, i) => ({ w, slot:i, x:120 + i*140, tx:120 + i*140, open:0 }));
    creature = home; patience = Math.max(4.5, 9 - sent*.35); swapT = 2.5; doneT = 0;
  }
  function choose(i){ if (doneT || !doors[i]) return; const d = doors.slice().sort((a, b) => a.tx - b.tx)[i]; d.open = .01;
    if (d.w === creature){ sent++; doneT = .01; anim.happy = 1.5; pop(d.tx, 120, 'Home!', '#ffe9a8'); }
    else { oops++; shake = .3; pop(d.tx, 120, 'Not this one!', '#ffb0c0'); if (oops >= 3) finish(false); } }
  function icon(kind, x, y){ ctx.save(); ctx.translate(x, y);
    if (kind === 'palm'){ ctx.strokeStyle = '#7a5230'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 20); ctx.quadraticCurveTo(4, 0, 0, -10); ctx.stroke(); ctx.fillStyle = '#4a9a4a'; for (const a of [-2.6, -2, -1.2, -.6]){ ctx.beginPath(); ctx.ellipse(Math.cos(a)*10, -10 + Math.sin(a)*6, 12, 4, a, 0, 7); ctx.fill(); } }
    else if (kind === 'moon'){ ctx.fillStyle = '#fbf3d0'; circle(0, -4, 12); ctx.fillStyle = 'rgba(0,0,0,.25)'; circle(5, -7, 9); }
    else if (kind === 'neon'){ ctx.fillStyle = '#5adcff'; ctx.fillRect(-14, -14, 6, 30); ctx.fillStyle = '#ff6ad5'; ctx.fillRect(-2, -8, 6, 24); ctx.fillStyle = '#ffe66e'; ctx.fillRect(10, -18, 6, 34); }
    else if (kind === 'fish'){ ctx.fillStyle = '#ffb05a'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 7, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-18, -7); ctx.lineTo(-18, 7); ctx.fill(); }
    else if (kind === 'star'){ ctx.fillStyle = '#fff3c0'; ctx.beginPath(); for (let k = 0; k < 10; k++){ const a = -Math.PI/2 + k*Math.PI/5, r = k % 2 ? 6 : 14; ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r); } ctx.fill(); }
    else if (kind === 'crystal'){ ctx.fillStyle = '#7fe0e6'; ctx.beginPath(); ctx.moveTo(-8, 16); ctx.lineTo(0, -16); ctx.lineTo(8, 16); ctx.fill(); ctx.fillStyle = '#b58ae6'; ctx.beginPath(); ctx.moveTo(6, 16); ctx.lineTo(12, -4); ctx.lineTo(18, 16); ctx.fill(); }
    else if (kind === 'castle'){ ctx.fillStyle = '#e8e0f0'; ctx.fillRect(-14, -6, 28, 22); ctx.fillRect(-16, -18, 8, 14); ctx.fillRect(8, -18, 8, 14); ctx.fillStyle = '#7a5ab8'; ctx.beginPath(); ctx.moveTo(-17, -18); ctx.lineTo(-12, -28); ctx.lineTo(-7, -18); ctx.fill(); }
    else if (kind === 'cactus'){ ctx.fillStyle = '#6a8a4a'; rr(-5, -16, 10, 34, 5); ctx.fill(); rr(-15, -6, 8, 14, 4); ctx.fill(); rr(7, -10, 8, 14, 4); ctx.fill(); }
    else if (kind === 'flip'){ ctx.fillStyle = '#e8b0d0'; ctx.fillRect(-12, -16, 24, 18); ctx.fillStyle = '#a4553f'; ctx.beginPath(); ctx.moveTo(-16, 2); ctx.lineTo(0, 16); ctx.lineTo(16, 2); ctx.fill(); }
    else { ctx.fillStyle = '#3a2416'; circle(-4, 10, 6); ctx.fillRect(1, -14, 3, 24); ctx.fillRect(1, -14, 12, 4); }
    ctx.restore(); }
  return {
    title:'Door Hopper', sub:'Send the lost creatures home through the right floating door.',
    blurb:'Creatures keep tumbling into THE WARP and they’ve lost their way home! Listen to where each one lives and open the right floating door before they get too worried. The doors drift around, so keep an eye on them!',
    legend:['A lost creature tells you about its home', 'Each door shows a peek of a world through its window', 'Click the right door (or ← → to choose and Space to open)', 'The doors swap places now and then. Send 12 creatures home; three wrong doors and you’re out'],
    hints:['Click the right door', '← → and Space work too', 'P to pause'], pad:['wgLeft', 'wgRight', 'wgAction'], actionLabel:'Open', clicks:true,
    winTitle:'Everyone found their way!', winText:'Twelve creatures, twelve doors, twelve happy homecomings. THE WARP hums a thank-you song.',
    loseTitle:'Too many wrong doors', loseText:'A very confused penguin is now living in the desert. Better try again!',
    againWinText:'The best guide THE WARP has ever had!', againLoseText:'Those doors are slippery. Try again!',
    reset(){ sent = 0; oops = 0; cur = 2; newRound(); },
    seeds:() => sent, stats:() => `<span>Sent home ${sent}/12</span><span>Wrong doors ${oops}</span>`,
    update(dt){
      time += dt; for (const d of doors){ d.x += (d.tx - d.x)*Math.min(1, dt*3); if (d.open) d.open = Math.min(1, d.open + dt*3); }
      if (doneT){ doneT += dt; input.taps.length = 0; input.click = null; input.pressed = false; if (doneT > 1.2){ if (sent >= 12) finish(true); else newRound(); } return; }
      patience -= dt; if (patience <= 0){ oops++; pop(400, 300, 'They wandered off, worried!', '#ffb0c0'); if (oops >= 3){ finish(false); return; } newRound(); return; }
      swapT -= dt; if (swapT <= 0 && sent >= 1){ swapT = Math.max(1.6, 3.4 - sent*.15); const a = Math.floor(Math.random()*5); let b = Math.floor(Math.random()*5); if (b === a) b = (a + 1) % 5; const da = doors.find(d => d.slot === a), db = doors.find(d => d.slot === b); [da.slot, db.slot] = [db.slot, da.slot]; da.tx = 120 + da.slot*140; db.tx = 120 + db.slot*140; }
      for (const k of input.taps){ if (k === 'left') cur = (cur + 4) % 5; if (k === 'right') cur = (cur + 1) % 5; } input.taps.length = 0;
      if (input.pressed){ input.pressed = false; choose(cur); }
      if (input.click){ const { x, y } = input.click; input.click = null; if (y > 150 && y < 360){ const i = Math.round((x - 120)/140); if (i >= 0 && i < 5){ cur = i; choose(i); } } }
    },
    draw(){
      const g = ctx.createRadialGradient(400, 250, 40, 400, 250, 520); g.addColorStop(0, '#4a2a7a'); g.addColorStop(1, '#0a0418'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++){ ctx.fillStyle = `rgba(255,220,255,${.2 + .3*Math.sin(t*2 + i)})`; circle(wrap(hash(i)*W + t*20*(hash(i + 2) - .5), W), hash(i + 5)*H, 1.5); }
      const sorted = doors.slice().sort((a, b) => a.tx - b.tx);
      doors.forEach(d => { const x = d.x, y = 250 + Math.sin(t*1.5 + d.slot)*8, sel = sorted.indexOf(d) === cur;
        ctx.fillStyle = '#6b4226'; rr(x - 50, y - 100, 100, 190, 10); ctx.fill(); ctx.strokeStyle = sel ? '#ffe066' : '#3a2416'; ctx.lineWidth = sel ? 5 : 3; rr(x - 50, y - 100, 100, 190, 10); ctx.stroke();
        // a peek into its world through the window
        ctx.save(); ctx.beginPath(); ctx.ellipse(x, y - 40, 34, 40, 0, 0, 7); ctx.clip(); ctx.fillStyle = d.w.sky; ctx.fillRect(x - 40, y - 84, 80, 90); ctx.fillStyle = d.w.ground; ctx.fillRect(x - 40, y - 12, 80, 30); icon(d.w.icon, x, y - 34); ctx.restore();
        ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, y - 40, 34, 40, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#f2c230'; circle(x + 34, y + 30, 5);
        if (d.open){ ctx.fillStyle = `rgba(255,250,220,${d.open*.8})`; rr(x - 46, y - 96, 92, 182, 8); ctx.fill(); } });
      // the lost creature and its clue
      { const x = 400, y = 420 + Math.sin(t*3)*3, worry = 1 - patience/9; ctx.fillStyle = 'rgba(20,10,40,.85)'; rr(150, 372, 500, 40, 12); ctx.fill(); ctx.fillStyle = '#fff6e4'; ctx.font = '600 15px Nunito, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${creature.who[0].toUpperCase()}${creature.who.slice(1)}: ${creature.clue}`, 400, 398, 480); ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(255,255,255,.15)'; rr(300, 446, 200, 10, 5); ctx.fill(); ctx.fillStyle = worry > .7 ? '#ff6a7a' : '#ffd060'; rr(300, 446, 200*Math.max(0, patience/9), 10, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,246,228,.7)'; ctx.font = '600 11px Nunito, sans-serif'; ctx.fillText('patience', 300, 470); void x; void y; }
      drawPops(0);
    },
    hud(){ hudBar(); ctx.fillStyle = '#fff6e4'; ctx.fillText(`Home ${sent}/12`, 24, 31); progress(sent/12, '#c8a0ff'); ctx.textAlign = 'right'; ctx.fillText(`Wrong ${oops}/3`, W - 24, 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; },
    idle(){},
  };
})();

const GAMES = { jungle:VINES, nebula:HOVER, moonlake:TENNIS, cafe:CAFE, city:BEATS, ski:SKI, race:RACE,
  whale:WHALE, park:PARK, temple:TEMPLE, rescue:RESCUE, sea:SEA, fantasy:TOWER, west:WEST, outlaws:OUTLAWS,
  underground:MINE, nograv:FLIP, arts:PAINT, warp:WARPT, ghosthotel:HOTEL, silentfilm:FILM, tide:TIDE, baking:BAKING, mermaid:MERMAID, fairymemory:FAIRYMEM, joust:JOUST, potions:POTIONS, campfire:CAMPFIRE, sloth:SLOTH, stars:STARS, circuit:CIRCUIT, juggle:JUGGLE, taxi:TAXI, dig:DIG, bounce:BOUNCE, fish:FISH, tilt:TILT, pancake:PANCAKE, backwards:BACKWARDS, mixer:MIXER, pitch:PITCH, musicbox:MUSICBOX, freeze:FREEZE, mirror:MIRROR, doors:DOORS };

// ---------- loop ----------
let last = performance.now();
function loop(now){
  // the next frame is booked first, so one bad frame can never stop the game
  requestAnimationFrame(loop);
  try {
    const dt = Math.min(.033, (now - last)/1000); last = now;
    if (isActive() && G){
      t += dt;
      Chin.tickAnim(anim, dt, 0, true);
      if (state === 'play') G.update(dt); else if (state === 'title') G.idle(dt);
      if (state === 'play'){ holeClock += dt;
        if (!hole && holeClock > holeAt){ const tg = window.warpNext(holeHere); if (tg) hole = { tg, t:0, life:12, max:12 }; holeAt = Infinity; }
        if (hole){ hole.t += dt; hole.life -= dt; if (hole.life <= 0) hole = null; } }
      pops.forEach(p => { p.y -= 36*dt; p.life -= dt; }); pops = pops.filter(p => p.life > 0);
      shake = Math.max(0, shake - dt);
      ctx.save(); if (shake > 0 && !reduceMotion) ctx.translate((Math.random() - .5)*10*shake, (Math.random() - .5)*10*shake);
      G.draw(); ctx.restore();
      if (state === 'play' || state === 'paused') drawHole();
      if (state !== 'title') G.hud();
      if (state === 'paused'){
        ctx.fillStyle = 'rgba(20,14,30,.5)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff6e4'; ctx.font = '700 44px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Paused', W/2, H/2 - 10); ctx.font = '600 18px Nunito, sans-serif'; ctx.fillText('Press P to keep playing', W/2, H/2 + 30);
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      }
    }
  } catch (err) { console.error(err); }
}
requestAnimationFrame(loop);
})();
