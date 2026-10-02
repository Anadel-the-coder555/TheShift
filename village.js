// Thistledown village: walk the lane, visit the shops, spend the seeds you gathered in the meadow.
(() => {
const W = 800, H = 480, WORLD = 6000, GROUND = 400;
const cv = document.getElementById('villageCanvas'), ctx = cv.getContext('2d');
const screenEl = document.getElementById('villageScreen');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function fit(){ const dpr = Math.min(window.devicePixelRatio||1, 2); cv.width = W*dpr; cv.height = H*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); }
fit(); addEventListener('resize', fit);
const isActive = () => screenEl.classList.contains('active');

// ---------- shopkeepers (from the image folder) and their shops ----------
function loadImg(src){ const i = new Image(); i.src = src; return i; }
// the shopkeepers are the characters from the "Video Game" folder, cut out into characters/
// h = how tall each one stands in the village
const KEEPERS = {
  halvyn:  { name:'Halvyn',  img:loadImg('characters/halvyn.png'),  h:90 },
  junnian: { name:'Junnian', img:loadImg('characters/junnian.png'), h:92 },
  mia:     { name:'Mia',     img:loadImg('characters/mia.png'),     h:84 },
  bastien: { name:'Bastien', img:loadImg('characters/bastien.png'), h:118 },
  aero:    { name:'Aero',    img:loadImg('characters/aero.png'),    h:96 },
};

const SHOPS = [
  { keeper:'halvyn', name:"Halvyn's Outfitters", kind:'trail', x:640, wall:'#d8b98e', roof:'#5d6f9e', awning:['#f3e6c8','#e0762e'],
    greeting:"Packed and ready? Every good trip starts with the right gear!",
    thanks:["Safe travels!", "That one's been all over with me.", "Come back and tell me where you went!"],
    items:[
      { id:'charm',   name:'Clover Charm',  desc:'Start your next meadow run with an extra hat.', price:15, stack:true },
      { id:'map',     name:'Trail Map',     desc:'Every path from here to the far hills.', price:10 },
      { id:'compass', name:'Brass Compass', desc:'Always points toward home.', price:20 },
    ]},
  { keeper:'junnian', name:"Junnian's Bakery", kind:'bakery', x:1320, wall:'#e7c9a0', roof:'#a4553f', awning:['#f6ead6','#8a5a32'],
    greeting:"Acorns, seeds, and a little bit of love. Everything's fresh today!",
    thanks:["Still warm, careful!", "Best in the village, if I say so myself.", "Enjoy every crumb!"],
    items:[
      { id:'seedcake',  name:'Seed Cake',  desc:'Crunchy, sweet, and chinchilla approved.', price:4, stack:true, snack:true },
      { id:'berrytart', name:'Berry Tart', desc:'Made with the same berries that heal hearts.', price:6, stack:true, snack:true },
      { id:'acornbun',  name:'Acorn Bun',  desc:'A golden bun for a golden day.', price:8, stack:true, snack:true },
    ]},
  { keeper:'mia', name:"Mia's Flowers", kind:'blooms', x:2000, wall:'#f1d3d6', roof:'#8a5a9e', awning:['#fff4f6','#e0708f'],
    greeting:"Hi there! Pick something pretty for your burrow.",
    thanks:["It suits you!", "Keep it in a sunny spot.", "Flowers make everything better."],
    items:[
      { id:'lavender', name:'Lavender Bundle', desc:'Makes the whole burrow smell like dusk.', price:5 },
      { id:'posy',     name:'Wildflower Posy', desc:'Picked this morning at the edge of the meadow.', price:12 },
      { id:'ribbon',   name:'Pink Ribbon',     desc:'For a very dapper hat.', price:18 },
    ]},
  { keeper:'bastien', name:"Bastien's Shades", kind:'shades', x:2680, wall:'#cfd6c0', roof:'#3f6b5a', awning:['#f6ead6','#d0452f'],
    greeting:"Hey. Looking for something cool? You came to the right deer.",
    thanks:["Looking sharp.", "Now that's style.", "Cool. Very cool."],
    items:[
      { id:'shades',   name:'Cool Shades',     desc:'Just like mine. Instantly cooler.', price:14 },
      { id:'bandana',  name:'Dotted Bandana',  desc:'Keeps the fur out of your eyes on a run.', price:9 },
      { id:'feather',  name:'Feather Pin',     desc:'A little flair for any hat.', price:6 },
    ]},
  { keeper:'aero', name:"Aero's Tea House", kind:'tea', x:3360, wall:'#e3d0b3', roof:'#5a4636', awning:['#f6ead6','#b8453d'],
    greeting:"Welcome, friend. Sit, rest your paws, and have something warm.",
    thanks:["Sip it slowly.", "Good for the soul.", "Come by anytime."],
    items:[
      { id:'chamomile', name:'Chamomile Tea', desc:'Warm and calming after a long run.', price:3, stack:true, snack:true, verb:'Drink' },
      { id:'honey',     name:'Honey Drops',   desc:'Sweet little drops of sunshine.', price:5, stack:true, snack:true },
      { id:'mint',      name:'Mint Tea',      desc:'Fresh and bright, like morning dew.', price:4, stack:true, snack:true, verb:'Drink' },
    ]},
];
for (const s of SHOPS){ s.w = 290; s.h = 170; s.kx = s.x + 40; s.door = s.x - 95; }
const ITEMS = {}; for (const s of SHOPS) for (const it of s.items) ITEMS[it.id] = it;
// things you can find out in the meadow (not sold anywhere)
const FINDS = [
  { id:'wildberries', name:'Wild Berries', desc:'Sweet and juicy, picked from a bush in the meadow.', stack:true, snack:true },
  { id:'clover4', name:'Four-Leaf Clover', desc:'Found hiding in a patch of ordinary clover. Very lucky!' },
  { id:'pebble', name:'Shiny Pebble', desc:'Smooth and sparkly. It was tucked inside a hollow log.' },
  { id:'goldfeather', name:'Golden Feather', desc:'Warm like sunlight. Found in a nest in the Golden Jungle.' },
  { id:'fallenstar', name:'Fallen Star', desc:'It hums softly. It fell from a constellation in the Starry Nebula.' },
  { id:'holobadge', name:'Holo Badge', desc:'VISITOR \u2014 THISTLEDOWN. Printed for you by the info robot in Neon City.' },
  { id:'glownoodles', name:'Glow Noodles', desc:'A warm bowl from the robot chef in Neon City. Extra sparkle!', stack:true, snack:true },
  { id:'moonpebble', name:'Moon Pebble', desc:'Glows like a tiny moon. Found on the shore of the Moonlit Lake.' },
  { id:'button', name:'Brass Button', desc:'From the scarecrow\u2019s coat pocket. He won\u2019t miss it.' },
  { id:'rainbowshell', name:'Rainbow Shell', desc:'It shimmers every color at once. A gift from an anemone in the Coral Sea.' },
  { id:'dragonscale', name:'Dragon Scale', desc:'Warm and green as an emerald. Shed by a sleepy baby dragon in the Enchanted Kingdom.' },
  { id:'sheriffstar', name:'Deputy Star', desc:'A shiny tin star from the sheriff of Dusty Gulch. You\u2019re official now!' },
  { id:'geode', name:'Geode', desc:'Plain grey outside, a cave of purple crystals inside. From the Underground.' },
  { id:'floatfeather', name:'Floaty Feather', desc:'Let go of it and it falls UP. Caught on the sky-side of Topsy-Turvy Land.' },
  { id:'yarnball', name:'Ball of Yarn', desc:'Soft pink wool.' },
  { id:'grannycookies', name:'Grandma’s Cookies', desc:'Snickerdoodles, jam thumbprints and a gingerbread chinchilla, wrapped in a checkered cloth by Grandma Wolf.', stack:true, snack:true },
  { id:'musicbox', name:'Silver Music Box', desc:'Lift the lid and a tiny dancer turns to a lullaby. From the bandstand in Harmony Hollow.' },
  { id:'warpshard', name:'Warp Shard', desc:'A crystal that can’t decide what color to be. Found floating in THE WARP.' },
  { id:'sarsaparilla', name:'Sarsaparilla', desc:'A frosty fizzy drink from the Lemonade Saloon in Dusty Gulch.', stack:true, snack:true, verb:'Drink' },
];
for (const f of FINDS) ITEMS[f.id] = f;

const HOUSES = [
  { x:1660, w:200, h:140, wall:'#d9c2d6', roof:'#6e5a8a' },
  { x:2340, w:210, h:145, wall:'#cfe0e3', roof:'#a4553f' },
  // across the bridge
  { x:5380, w:210, h:150, wall:'#e3d0b3', roof:'#4f7a6a', kind:'grandma' },   // Grandma Wolf's cottage (you can go in)
  { x:5680, w:200, h:140, wall:'#f1d3d6', roof:'#6e5a8a', kind:'holiday' },   // the Holiday House (you can go in)
];
const LAMPS = [440, 860, 1110, 1510, 1815, 2190, 2495, 2900, 3140, 3580, 4260, 4640, 4960, 5230, 5530];

// the stream, the arched bridge over it, and the far side of the village
const BR = { x0:3700, x1:4200, peak:84, w0:3770, w1:4130 };
const WINDMILL_X = 4440, FOUNTAIN_X = 4800, BOARD_X = 5080, GATE_X = 5890;
// where the chinchilla's feet are: on the lane, or up on the bridge deck
function deckY(wx){
  if (wx <= BR.x0 || wx >= BR.x1) return GROUND + 14;
  return GROUND + 14 - BR.peak*Math.sin(Math.PI*(wx - BR.x0)/(BR.x1 - BR.x0));
}

// quests are the game's levels, picked from the board in the village square
const QUESTS = [
  { level:1, title:'The Long Way Home', giver:'junnian', flag:'quest1', reward:20,
    text:"I've run out of golden acorns for my Acorn Buns! Three are hidden out in the moonlit meadow. Find all three, then follow the path home to the burrow." },
];
for (let n=2;n<=7;n++) QUESTS.push({ level:n, locked:true });

// ---------- helpers ----------
let t = 0, camX = 0;
function rng(seed){ return () => { seed = (seed*16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function hash(n){ const s = Math.sin(n*127.1 + 17.3)*43758.5453; return s - Math.floor(s); }
function wrap(v, m){ return ((v % m) + m) % m; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function circle(x, y, r){ ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function rr(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
const onScreen = (sx, pad) => sx > -pad && sx < W + pad;

const CLOUDS = (() => { const r = rng(9), c = []; for (let i=0;i<7;i++){ const puffs = []; for (let j=0;j<5;j++) puffs.push([j*22 - 44 + r()*10, (r()-.5)*10, 16 + r()*14]); c.push({ x:r()*1200, y:50 + r()*150, sp:4 + r()*6, a:.35 + r()*.3, puffs }); } return c; })();
const PETALS = (() => { const r = rng(4), p = []; for (let i=0;i<26;i++) p.push({ x:r()*W, y:r()*H, sp:14 + r()*18, ph:r()*6, col:['#f4b6c8','#fff1cf','#d9c2f0'][i%3] }); return p; })();

// ---------- backdrop ----------
function drawSky(){
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, '#5b6aa8'); g.addColorStop(.45, '#b88fb4'); g.addColorStop(.8, '#f2b98c'); g.addColorStop(1, '#f7d6a0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
  const sx = 520 - camX*.04, sy = 255;
  const sg = ctx.createRadialGradient(sx, sy, 10, sx, sy, 170);
  sg.addColorStop(0, 'rgba(255,236,190,.9)'); sg.addColorStop(.25, 'rgba(255,220,160,.4)'); sg.addColorStop(1, 'rgba(255,220,160,0)');
  ctx.fillStyle = sg; ctx.fillRect(sx - 170, sy - 170, 340, 340);
  ctx.fillStyle = '#fff1cf'; circle(sx, sy, 34);
  for (const c of CLOUDS){
    const x = wrap(c.x - camX*.08 + (reduceMotion ? 0 : t*c.sp), W + 400) - 200;
    ctx.fillStyle = `rgba(255,238,228,${c.a})`;
    for (const [dx, dy, r] of c.puffs) circle(x + dx, c.y + dy, r);
  }
}
function ridge(par, base, waves, color){
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, GROUND);
  for (let sx = 0; sx <= W + 8; sx += 8){
    const wx = sx + camX*par; let y = base;
    for (const [amp, f, ph] of waves) y -= Math.sin(wx*f + ph)*amp;
    ctx.lineTo(sx, y);
  }
  ctx.lineTo(W, GROUND); ctx.fill();
}
function treeLine(par, step, base, cols, noHouses){
  const off = camX*par, i0 = Math.floor((off - 120)/step), i1 = Math.ceil((off + W + 120)/step);
  for (let i=i0;i<=i1;i++){
    const x = i*step - off + hash(i)*step*.5, s = 26 + hash(i+50)*22;
    if (!noHouses && hash(i + 99) > .72){
      const hw = s*.75, hh = s*.9;
      ctx.fillStyle = '#bfae9f'; ctx.fillRect(x - hw, base - hh, hw*2, hh);
      ctx.fillStyle = '#8c6b78'; ctx.beginPath(); ctx.moveTo(x - hw - 6, base - hh + 2); ctx.lineTo(x, base - hh - s*.7); ctx.lineTo(x + hw + 6, base - hh + 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd98a'; ctx.fillRect(x - 5, base - hh*.7, 10, 9);
      continue;
    }
    ctx.fillStyle = '#4a3a2c'; ctx.fillRect(x - 3, base - s*.9, 6, s*.9);
    ctx.fillStyle = cols[i & 1 ? 1 : 0];
    circle(x, base - s*1.3, s*.75); circle(x - s*.45, base - s*.95, s*.55); circle(x + s*.45, base - s*.95, s*.55);
  }
}
function drawBackdrop(){
  drawSky();
  ridge(.12, 300, [[18, .004, 1], [8, .011, 2]], '#b3a2c8');
  ridge(.3, 335, [[14, .006, 4], [6, .017, 0]], '#8fa08e');
  treeLine(.55, 90, GROUND - 6, ['#5c7d62', '#4f6e58']);
}
function drawGround(){
  ctx.fillStyle = '#6f9474'; ctx.fillRect(0, GROUND - 14, W, 20);
  ctx.fillStyle = '#5a7d60'; for (let sx = -wrap(camX, 12); sx < W; sx += 12) ctx.fillRect(sx, GROUND - 17 + (hash(Math.floor((sx + camX)/12))*4|0), 3, 6);
  ctx.fillStyle = '#c2a582'; ctx.fillRect(0, GROUND + 4, W, H - GROUND);
  for (let r=0;r<5;r++){
    const y = GROUND + 10 + r*15, off = (r % 2)*16, i0 = Math.floor((camX - off)/32) - 1;
    for (let i=i0; i*32 + off - camX < W; i++){
      if (i*32 + off > BR.w0 - 40 && i*32 + off < BR.w1 + 10) continue;
      ctx.fillStyle = hash(i*7 + r*131) > .5 ? '#b39574' : '#a88a6a';
      rr(i*32 + off - camX + 2, y, 28, 11, 5); ctx.fill();
    }
  }
  ctx.fillStyle = 'rgba(60,40,24,.18)'; ctx.fillRect(0, GROUND + 4, W, 5);
}

// ---------- buildings ----------
function glowWindow(x, y, w, h, arch){
  const a = .82 + (reduceMotion ? 0 : Math.sin(t*2.5 + x*.1)*.06);
  ctx.fillStyle = `rgba(255,214,130,${a})`; ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 3;
  ctx.beginPath();
  if (arch){ ctx.moveTo(x, y + h); ctx.lineTo(x, y + w/2); ctx.arc(x + w/2, y + w/2, w/2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath(); }
  else ctx.rect(x, y, w, h);
  ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + w/2, y + (arch ? 2 : 0)); ctx.lineTo(x + w/2, y + h); ctx.moveTo(x, y + h*.55); ctx.lineTo(x + w, y + h*.55); ctx.stroke();
}
function door(x){
  ctx.fillStyle = '#6b4226'; ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 20, GROUND); ctx.lineTo(x - 20, GROUND - 52); ctx.arc(x, GROUND - 52, 20, Math.PI, 0); ctx.lineTo(x + 20, GROUND); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#583520'; ctx.lineWidth = 2; for (const dx of [-8, 0, 8]){ ctx.beginPath(); ctx.moveTo(x + dx, GROUND - 2); ctx.lineTo(x + dx, GROUND - 66); ctx.stroke(); }
  ctx.fillStyle = '#f2c230'; circle(x + 12, GROUND - 32, 2.5);
}
function smoke(x, y, seed){
  if (reduceMotion) return;
  for (let i=0;i<4;i++){
    const k = wrap(t*.35 + i/4 + seed, 1);
    ctx.fillStyle = `rgba(240,232,236,${.35*(1 - k)})`;
    circle(x + Math.sin(k*6 + seed)*8 + k*18, y - k*70, 7 + k*12);
  }
}
function cottage(b, isShop){
  const x = b.x - camX; if (!onScreen(x, b.w/2 + 80)) return null;
  const L = x - b.w/2, top = GROUND - b.h;
  ctx.fillStyle = '#7a5a4a'; ctx.fillRect(x + b.w*.22, top - 78, 22, 60);
  ctx.fillStyle = '#5c4336'; ctx.fillRect(x + b.w*.22 - 3, top - 82, 28, 8);
  smoke(x + b.w*.22 + 11, top - 88, b.x*.001);
  ctx.fillStyle = b.wall; ctx.fillRect(L, top, b.w, b.h);
  ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 5; ctx.strokeRect(L, top, b.w, b.h);
  ctx.beginPath(); ctx.moveTo(L, top + b.h*.42); ctx.lineTo(L + b.w, top + b.h*.42); ctx.stroke();
  ctx.lineWidth = 4; for (const f of [.25, .75]){ ctx.beginPath(); ctx.moveTo(L + b.w*f, top); ctx.lineTo(L + b.w*f, top + b.h*.42); ctx.stroke(); }
  // roof with shingle rows
  const over = 22, rh = 100;
  ctx.fillStyle = b.roof; ctx.beginPath(); ctx.moveTo(L - over, top + 6); ctx.lineTo(x, top - rh + 6); ctx.lineTo(L + b.w + over, top + 6); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 2;
  for (let k=1;k<5;k++){ const y = top + 6 - k*20, hw = (b.w/2 + over)*(1 - k*20/rh); ctx.beginPath(); ctx.moveTo(x - hw, y); ctx.lineTo(x + hw, y); ctx.stroke(); }
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(L - over, top + 6); ctx.lineTo(x, top - rh + 6); ctx.lineTo(L + b.w + over, top + 6); ctx.stroke();
  glowWindow(x - 12, top - 50, 24, 26, true);
  if (!isShop){
    door(x - b.w*.22);
    glowWindow(x + b.w*.1, top + b.h*.52, 44, 40, false);
    // window box of flowers
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x + b.w*.1 - 4, top + b.h*.52 + 40, 52, 8);
    for (let i=0;i<5;i++){ ctx.fillStyle = ['#e79ab8','#f2c230','#9a86d8'][i%3]; circle(x + b.w*.1 + 2 + i*10, top + b.h*.52 + 38, 4); }
  }
  return { x, L, top };
}
function awning(x0, x1, y, cols){
  const n = Math.round((x1 - x0)/20), w = (x1 - x0)/n;
  for (let i=0;i<n;i++){
    ctx.fillStyle = cols[i % 2];
    ctx.beginPath(); ctx.moveTo(x0 + i*w, y); ctx.lineTo(x0 + (i+1)*w, y); ctx.lineTo(x0 + (i+1)*w + 4, y + 26); ctx.lineTo(x0 + i*w + 4, y + 26); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x0 + i*w + w/2 + 4, y + 26, w/2, 0, Math.PI); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(58,38,22,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
}
function goods(kind, x, y){
  if (kind === 'trail'){
    for (const [dx, c] of [[-24,'#efe2c0'], [-6,'#e6d3a8']]){ ctx.fillStyle = c; ctx.fillRect(x + dx, y - 10, 16, 10); ctx.fillStyle = '#c9a36a'; ctx.fillRect(x + dx - 2, y - 10, 3, 10); ctx.fillRect(x + dx + 15, y - 10, 3, 10); ctx.fillStyle = '#b8453d'; ctx.fillRect(x + dx + 6, y - 10, 3, 10); }
    ctx.fillStyle = '#c9a13a'; circle(x + 20, y - 7, 8); ctx.fillStyle = '#f6ead6'; circle(x + 20, y - 7, 5.5);
    ctx.strokeStyle = '#b8453d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 20, y - 7); ctx.lineTo(x + 23, y - 11); ctx.stroke();
  } else if (kind === 'bakery'){
    ctx.fillStyle = '#b8743a'; ctx.beginPath(); ctx.ellipse(x - 18, y - 6, 14, 7, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#e8b878'; ctx.lineWidth = 1.5; for (const d of [-6, 0, 6]){ ctx.beginPath(); ctx.moveTo(x - 18 + d - 2, y - 10); ctx.lineTo(x - 18 + d + 2, y - 3); ctx.stroke(); }
    ctx.fillStyle = '#c98a4b'; circle(x + 4, y - 6, 7); circle(x + 18, y - 6, 7);
    ctx.fillStyle = '#f4b6c8'; ctx.beginPath(); ctx.ellipse(x + 11, y - 17, 8, 4, 0, Math.PI, 0); ctx.fill();
  } else if (kind === 'shades'){
    for (const dx of [-20, 12]){
      ctx.fillStyle = '#1e1a16'; rr(x + dx - 12, y - 11, 10, 7, 3); ctx.fill(); rr(x + dx + 1, y - 11, 10, 7, 3); ctx.fill();
      ctx.fillRect(x + dx - 2, y - 10, 3, 2);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + dx - 10, y - 10, 3, 2); ctx.fillRect(x + dx + 3, y - 10, 3, 2);
    }
    ctx.fillStyle = '#d0452f'; ctx.beginPath(); ctx.moveTo(x - 4, y - 2); ctx.lineTo(x + 6, y - 14); ctx.lineTo(x + 14, y - 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f6ead6'; circle(x + 5, y - 6, 1.3); circle(x + 9, y - 5, 1.3);
  } else if (kind === 'tea'){
    ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.ellipse(x - 12, y - 10, 13, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b8453d'; ctx.fillRect(x - 25, y - 11, 26, 3);
    ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 1, y - 10); ctx.lineTo(x + 8, y - 16); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 25, y - 10, 5, Math.PI*.5, Math.PI*1.5); ctx.stroke();
    ctx.fillStyle = '#c9a36a'; circle(x - 12, y - 21, 3);
    for (const dx of [16, 30]){ ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + dx - 5, y - 9, 10, 9); ctx.fillStyle = '#8a5a32'; ctx.fillRect(x + dx - 4, y - 8, 8, 2); }
    if (!reduceMotion){ ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 8, y - 18); ctx.quadraticCurveTo(x + 4 + Math.sin(t*2)*4, y - 26, x + 9, y - 34); ctx.stroke(); }
  } else {
    for (const [dx, c] of [[-20,'#e0708f'], [0,'#9a86d8'], [20,'#f2c230']]){
      ctx.strokeStyle = '#4f7a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + dx, y - 10); ctx.lineTo(x + dx, y - 24); ctx.stroke();
      ctx.fillStyle = c; for (let p=0;p<5;p++){ const a = p/5*Math.PI*2 + t*.3; circle(x + dx + Math.cos(a)*4, y - 26 + Math.sin(a)*4, 3.4); }
      ctx.fillStyle = '#fff6d0'; circle(x + dx, y - 26, 2);
      ctx.fillStyle = '#c0674a'; ctx.beginPath(); ctx.moveTo(x + dx - 7, y - 12); ctx.lineTo(x + dx + 7, y - 12); ctx.lineTo(x + dx + 5, y); ctx.lineTo(x + dx - 5, y); ctx.closePath(); ctx.fill();
    }
  }
}
function drawShop(s){
  const b = cottage(s, true); if (!b) return;
  const { x, L, top } = b;
  door(s.door - camX);
  // sign board across the upper wall
  const sw = s.w*.78;
  ctx.fillStyle = '#4a3020'; rr(x - sw/2, top + 14, sw, 34, 6); ctx.fill();
  ctx.strokeStyle = '#c9a36a'; ctx.lineWidth = 2; rr(x - sw/2 + 4, top + 18, sw - 8, 26, 4); ctx.stroke();
  let fs = 17; ctx.font = `700 ${fs}px "Pixelify Sans", monospace`;
  while (fs > 11 && ctx.measureText(s.name).width > sw - 20){ fs--; ctx.font = `700 ${fs}px "Pixelify Sans", monospace`; }
  ctx.fillStyle = '#f6ead6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(s.name, x, top + 32); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  // shop window under a striped awning
  glowWindow(x - 30, top + s.h*.58, 150, 52, false);
  awning(x - 40, x + 130, top + s.h*.48, s.awning);
  // outdoor stall
  const sx = x + 118, sy = GROUND - 34;
  ctx.fillStyle = '#5c4336'; ctx.fillRect(sx - 36, sy, 5, 34); ctx.fillRect(sx + 31, sy, 5, 34);
  ctx.fillStyle = s.awning[1]; ctx.fillRect(sx - 40, sy - 2, 80, 12);
  ctx.fillStyle = s.awning[0]; for (let i=0;i<4;i++) ctx.fillRect(sx - 40 + i*20, sy + 10, 10, 6);
  ctx.fillStyle = '#8a5a32'; ctx.fillRect(sx - 42, sy - 4, 84, 5);
  goods(s.kind, sx, sy - 4);
}
function drawLamp(wx){
  const x = wx - camX; if (!onScreen(x, 60)) return;
  const ly = GROUND - 118, f = reduceMotion ? 1 : .9 + Math.sin(t*6 + wx)*.1;
  const g = ctx.createRadialGradient(x + 16, ly, 2, x + 16, ly, 46*f);
  g.addColorStop(0, 'rgba(255,220,130,.55)'); g.addColorStop(1, 'rgba(255,220,130,0)');
  ctx.fillStyle = g; circle(x + 16, ly, 46*f);
  ctx.fillStyle = '#3a2c20'; ctx.fillRect(x - 3, GROUND - 132, 6, 132); ctx.fillRect(x - 10, GROUND - 6, 20, 8); ctx.fillRect(x - 3, GROUND - 134, 22, 4);
  ctx.fillStyle = '#ffe27a'; ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 2; ctx.fillRect(x + 9, ly - 9, 14, 18); ctx.strokeRect(x + 9, ly - 9, 14, 18);
  ctx.fillStyle = '#2b1a0c'; ctx.fillRect(x + 8, ly - 12, 16, 3);
}
function bunting(a, b){
  const x0 = a - camX + 16, x1 = b - camX + 16; if (x1 < -20 || x0 > W + 20) return;
  const y = GROUND - 128, sag = 34, cols = ['#e79ab8','#f2c230','#9a86d8','#6fa24a','#f6ead6'];
  const at = u => [x0 + (x1 - x0)*u, y + sag*4*u*(1 - u)];
  ctx.strokeStyle = 'rgba(58,38,22,.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, y); ctx.quadraticCurveTo((x0 + x1)/2, y + sag*2, x1, y); ctx.stroke();
  const n = Math.max(4, Math.round((x1 - x0)/28));
  for (let i=1;i<n;i++){
    const [px, py] = at(i/n), sw = reduceMotion ? 0 : Math.sin(t*2 + i + a)*2;
    ctx.fillStyle = cols[i % cols.length]; ctx.beginPath(); ctx.moveTo(px - 7, py); ctx.lineTo(px + 7, py); ctx.lineTo(px + sw, py + 15); ctx.closePath(); ctx.fill();
  }
}
function drawArch(wx){
  const x = wx - camX; if (!onScreen(x, 140)) return;
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 90, GROUND - 150, 12, 150); ctx.fillRect(x + 78, GROUND - 150, 12, 150);
  ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x - 84, GROUND - 146); ctx.quadraticCurveTo(x, GROUND - 200, x + 84, GROUND - 146); ctx.stroke();
  // vines along the beam
  for (let i=0;i<11;i++){ const u = i/10; ctx.fillStyle = ['#6fa24a','#e79ab8','#5a8a4a'][i%3]; circle(x - 84 + 168*u, GROUND - 146 - 108*u*(1 - u), i % 3 === 1 ? 4 : 6); }
  // name board hanging under the beam
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 50, GROUND - 170); ctx.lineTo(x - 50, GROUND - 146); ctx.moveTo(x + 50, GROUND - 170); ctx.lineTo(x + 50, GROUND - 146); ctx.stroke();
  ctx.fillStyle = '#4a3020'; rr(x - 70, GROUND - 146, 140, 30, 6); ctx.fill();
  ctx.fillStyle = '#f6ead6'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Thistledown', x, GROUND - 130); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
function drawSignpost(wx){
  const x = wx - camX; if (!onScreen(x, 80)) return;
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 4, GROUND - 90, 8, 90);
  ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.moveTo(x + 50, GROUND - 76); ctx.lineTo(x + 36, GROUND - 90); ctx.lineTo(x - 40, GROUND - 90); ctx.lineTo(x - 40, GROUND - 62); ctx.lineTo(x + 36, GROUND - 62); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f6ead6'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textBaseline = 'middle'; ctx.fillText('Quests', x - 32, GROUND - 75); ctx.textBaseline = 'alphabetic';
}
function drawWell(wx){
  const x = wx - camX; if (!onScreen(x, 80)) return;
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 40, GROUND - 100, 6, 70); ctx.fillRect(x + 34, GROUND - 100, 6, 70);
  ctx.fillStyle = '#a4553f'; ctx.beginPath(); ctx.moveTo(x - 54, GROUND - 96); ctx.lineTo(x, GROUND - 130); ctx.lineTo(x + 54, GROUND - 96); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = '#5c4336'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, GROUND - 96); ctx.lineTo(x, GROUND - 60); ctx.stroke();
  ctx.fillStyle = '#8a6a4a'; ctx.fillRect(x - 8, GROUND - 62, 16, 12);
  ctx.fillStyle = '#9a9186'; rr(x - 46, GROUND - 38, 92, 38, 6); ctx.fill();
  ctx.fillStyle = '#b8b0a2'; for (let r=0;r<3;r++) for (let i=0;i<4;i++) { rr(x - 44 + i*22 + (r%2)*10, GROUND - 36 + r*12, 18, 9, 3); ctx.fill(); }
}
function drawFence(wx, n){
  const x = wx - camX; if (!onScreen(x, n*16 + 40)) return;
  ctx.fillStyle = '#efe2c0'; ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 1.5;
  ctx.fillRect(x, GROUND - 26, n*16, 5); ctx.fillRect(x, GROUND - 14, n*16, 5);
  for (let i=0;i<=n;i++){ ctx.beginPath(); ctx.moveTo(x + i*16 - 4, GROUND); ctx.lineTo(x + i*16 - 4, GROUND - 32); ctx.lineTo(x + i*16, GROUND - 38); ctx.lineTo(x + i*16 + 4, GROUND - 32); ctx.lineTo(x + i*16 + 4, GROUND); ctx.closePath(); ctx.fill(); ctx.stroke(); }
}
// the great old tree in the meadow, with a dark knothole low on its trunk
function drawOldTree(wx){
  const x = wx - camX; if (!onScreen(x, 220)) return;
  // roots and trunk
  ctx.fillStyle = '#5c4336';
  ctx.beginPath(); ctx.moveTo(x - 80, GROUND + 2); ctx.quadraticCurveTo(x - 44, GROUND - 10, x - 38, GROUND - 60);
  ctx.quadraticCurveTo(x - 30, GROUND - 150, x - 34, GROUND - 230); ctx.lineTo(x + 34, GROUND - 230);
  ctx.quadraticCurveTo(x + 30, GROUND - 150, x + 40, GROUND - 60); ctx.quadraticCurveTo(x + 46, GROUND - 10, x + 84, GROUND + 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#4a3528'; ctx.beginPath(); ctx.moveTo(x - 38, GROUND - 60); ctx.quadraticCurveTo(x - 30, GROUND - 150, x - 34, GROUND - 230); ctx.lineTo(x - 18, GROUND - 230); ctx.quadraticCurveTo(x - 14, GROUND - 150, x - 20, GROUND - 60); ctx.closePath(); ctx.fill();
  // bark lines
  ctx.strokeStyle = 'rgba(40,24,16,.45)'; ctx.lineWidth = 2.5; ctx.beginPath();
  for (const [bx, y0, y1] of [[-14, 220, 150], [8, 210, 120], [22, 170, 100], [-4, 110, 90]]){ ctx.moveTo(x + bx, GROUND - y0); ctx.quadraticCurveTo(x + bx + 4, GROUND - (y0 + y1)/2, x + bx - 2, GROUND - y1); }
  ctx.stroke();
  // big branches reaching into the crown
  ctx.strokeStyle = '#5c4336'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(x - 20, GROUND - 210); ctx.quadraticCurveTo(x - 70, GROUND - 250, x - 110, GROUND - 250);
  ctx.moveTo(x + 20, GROUND - 200); ctx.quadraticCurveTo(x + 70, GROUND - 240, x + 116, GROUND - 236); ctx.stroke(); ctx.lineCap = 'butt';
  // the knothole, with a faint warm glow from inside
  ctx.fillStyle = '#3a2618'; ctx.beginPath(); ctx.ellipse(x + 4, GROUND - 56, 20, 30, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#1e120a'; ctx.beginPath(); ctx.ellipse(x + 4, GROUND - 54, 14, 23, 0, 0, 7); ctx.fill();
  ctx.fillStyle = `rgba(255,214,130,${reduceMotion ? .14 : .08 + Math.max(0, Math.sin(t*1.1))*.16})`; ctx.beginPath(); ctx.ellipse(x + 4, GROUND - 50, 8, 14, 0, 0, 7); ctx.fill();
  // a huge leafy crown
  for (const [dx, dy, r, c] of [[0, -330, 110, '#4f6e58'], [-120, -270, 86, '#4f6e58'], [120, -265, 88, '#4f6e58'], [-70, -300, 90, '#5c7d62'], [74, -300, 92, '#5c7d62'], [-150, -225, 58, '#5c7d62'], [150, -222, 60, '#5c7d62'], [0, -250, 96, '#6f9474'], [-60, -225, 64, '#6f9474'], [64, -228, 64, '#6f9474']]){ ctx.fillStyle = c; circle(x + dx, GROUND + dy, r); }
  ctx.fillStyle = 'rgba(255,240,200,.12)'; for (const [dx, dy, r] of [[-50, -340, 36], [40, -300, 30], [-110, -280, 24]]) circle(x + dx, GROUND + dy, r);
}
function drawTree(wx, s){
  const x = wx - camX; if (!onScreen(x, 120)) return;
  ctx.fillStyle = '#5c4336'; ctx.fillRect(x - 8, GROUND - s*1.2, 16, s*1.2);
  for (const [dx, dy, r, c] of [[0, -1.9, .9, '#4f6e58'], [-.6, -1.4, .7, '#5c7d62'], [.6, -1.4, .7, '#5c7d62'], [0, -1.35, .6, '#6f9474']]){
    ctx.fillStyle = c; circle(x + dx*s, GROUND + dy*s, r*s);
  }
}

// ---------- stream and bridge ----------
function drawWater(){
  const a = BR.w0 - camX, b = BR.w1 - camX; if (b < -30 || a > W + 30) return;
  const g = ctx.createLinearGradient(0, GROUND - 16, 0, H);
  g.addColorStop(0, '#9cc2d6'); g.addColorStop(1, '#4f7fa3');
  ctx.fillStyle = g; ctx.beginPath();
  ctx.moveTo(a - 14, GROUND - 16); ctx.quadraticCurveTo(a + 8, GROUND + 30, a - 10, H);
  ctx.lineTo(b + 10, H); ctx.quadraticCurveTo(b - 8, GROUND + 30, b + 14, GROUND - 16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 5; ctx.beginPath();
  ctx.moveTo(a - 14, GROUND - 16); ctx.quadraticCurveTo(a + 8, GROUND + 30, a - 10, H);
  ctx.moveTo(b + 14, GROUND - 16); ctx.quadraticCurveTo(b - 8, GROUND + 30, b + 10, H); ctx.stroke();
  // ripples drifting downstream
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i=0;i<12;i++){
    const y = GROUND + i*7, off = wrap((reduceMotion ? 0 : t*18) + i*37, 60);
    for (let sx = a + 10 + off; sx < b - 16; sx += 60){ ctx.moveTo(sx, y); ctx.lineTo(sx + 14, y); }
  }
  ctx.stroke();
  // the bow of a little boat, tied up under the bridge
  { const bx = 3812 - camX, by = GROUND + 30 + (reduceMotion ? 0 : Math.sin(t*1.5)*1.5);
    ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.moveTo(bx - 30, by - 8); ctx.lineTo(bx + 34, by - 8); ctx.quadraticCurveTo(bx + 30, by + 6, bx + 10, by + 8); ctx.lineTo(bx - 30, by + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9854a'; ctx.fillRect(bx - 30, by - 10, 62, 4); }
  // lily pads and reeds
  for (const [wx, wy, fl] of [[3805, GROUND + 58, true], [4085, GROUND + 34, false], [3960, GROUND + 70, false]]){
    const x = wx - camX; ctx.fillStyle = '#5d8f4a';
    ctx.beginPath(); ctx.moveTo(x, wy); ctx.ellipse(x, wy, 14, 5, 0, .3, Math.PI*2 - .3); ctx.closePath(); ctx.fill();
    if (fl){ ctx.fillStyle = '#f4b6c8'; circle(x + 3, wy - 3, 4); ctx.fillStyle = '#fff6d0'; circle(x + 3, wy - 3, 1.6); }
  }
  ctx.strokeStyle = '#4f6e3a'; ctx.lineWidth = 2.5;
  for (const [wx, n] of [[BR.w0 - 6, 5], [BR.w1 + 4, 4]]){
    const x = wx - camX;
    for (let i=0;i<n;i++){ const sway = reduceMotion ? 0 : Math.sin(t*1.6 + i)*2; ctx.beginPath(); ctx.moveTo(x + i*5, GROUND + 8); ctx.quadraticCurveTo(x + i*5 + sway, GROUND - 14, x + i*5 + sway*2, GROUND - 30 - (i%2)*8); ctx.stroke(); }
    ctx.fillStyle = '#7a5230'; for (let i=0;i<n;i+=2) { ctx.beginPath(); ctx.ellipse(x + i*5, GROUND - 28 - (i%2)*8, 2.5, 7, 0, 0, 7); ctx.fill(); }
  }
}
function drawBridge(){
  const L = BR.x0 - camX, R = BR.x1 - camX; if (R < -20 || L > W + 20) return;
  const span = BR.x1 - BR.x0, mid = (L + R)/2, top = u => GROUND + 14 - BR.peak*Math.sin(Math.PI*u);
  const shape = () => {
    ctx.beginPath(); ctx.moveTo(L, H);
    for (let u=0; u<=1.0001; u+=.02) ctx.lineTo(L + u*span, top(u));
    ctx.lineTo(R, H); ctx.closePath();
    ctx.moveTo(mid + 150, H); ctx.ellipse(mid, H, 150, 96, 0, 0, Math.PI, true); ctx.closePath();
  };
  // parapet on the far side, drawn first so the stone deck sits in front of its feet
  ctx.strokeStyle = '#9a9186'; ctx.lineWidth = 5;
  ctx.beginPath(); for (let u=.03; u<=.98; u+=.063){ const x = L + u*span; ctx.moveTo(x, top(u) - 2); ctx.lineTo(x, top(u) - 30); } ctx.stroke();
  ctx.strokeStyle = '#8a8072'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); for (let u=.03; u<=.971; u+=.02){ const x = L + u*span; u === .03 ? ctx.moveTo(x, top(u) - 30) : ctx.lineTo(x, top(u) - 30); } ctx.stroke(); ctx.lineCap = 'butt';
  // stone body with an arch for the stream
  shape(); ctx.fillStyle = '#b3a896'; ctx.fill('evenodd');
  ctx.save(); shape(); ctx.clip('evenodd');
  ctx.strokeStyle = 'rgba(90,80,70,.35)'; ctx.lineWidth = 1.5;
  for (let y = GROUND - 80, row = 0; y < H; y += 14, row++){
    ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y);
    for (let x = L + (row % 2)*18; x < R; x += 36){ ctx.moveTo(x, y); ctx.lineTo(x, y + 14); }
    ctx.stroke();
  }
  ctx.restore();
  // arch stones and the walking surface
  ctx.strokeStyle = '#8a8072'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(mid, H, 154, 100, 0, Math.PI, 0); ctx.stroke();
  ctx.strokeStyle = '#6f675c'; ctx.lineWidth = 2; ctx.beginPath();
  for (let k=1;k<12;k++){ const a = Math.PI + k/12*Math.PI; ctx.moveTo(mid + Math.cos(a)*150, H + Math.sin(a)*96); ctx.lineTo(mid + Math.cos(a)*158, H + Math.sin(a)*104); }
  ctx.stroke();
  ctx.strokeStyle = '#d6cfc2'; ctx.lineWidth = 4; ctx.beginPath();
  for (let u=0; u<=1.0001; u+=.02){ const x = L + u*span; u === 0 ? ctx.moveTo(x, top(u) + 1) : ctx.lineTo(x, top(u) + 1); }
  ctx.stroke();
}

// ---------- the far side: windmill, fountain square, quest board, meadow gate ----------
function drawWindmill(wx){
  const x = wx - camX; if (!onScreen(x, 170)) return;
  ctx.fillStyle = '#e8dcc6'; ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x - 62, GROUND); ctx.lineTo(x - 40, GROUND - 190); ctx.lineTo(x + 40, GROUND - 190); ctx.lineTo(x + 62, GROUND); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#b8b0a2'; ctx.fillRect(x - 59, GROUND - 26, 118, 26);
  ctx.strokeStyle = 'rgba(90,80,70,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i=-50;i<60;i+=20){ ctx.moveTo(x + i, GROUND - 26); ctx.lineTo(x + i, GROUND); } ctx.stroke();
  door(x);
  glowWindow(x - 11, GROUND - 150, 22, 26, true);
  ctx.fillStyle = '#a4553f'; ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x - 50, GROUND - 186); ctx.quadraticCurveTo(x, GROUND - 262, x + 50, GROUND - 186); ctx.closePath(); ctx.fill(); ctx.stroke();
  const hubY = GROUND - 206, ang = reduceMotion ? .4 : millAng;
  ctx.save(); ctx.translate(x, hubY); ctx.rotate(ang);
  for (let k=0;k<4;k++){
    ctx.rotate(Math.PI/2);
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(-3, -128, 6, 128);
    ctx.fillStyle = 'rgba(246,234,214,.92)'; ctx.fillRect(4, -122, 24, 92);
    ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 1.5; ctx.strokeRect(4, -122, 24, 92);
    ctx.beginPath(); for (let j=1;j<6;j++){ ctx.moveTo(4, -122 + j*15.3); ctx.lineTo(28, -122 + j*15.3); } ctx.moveTo(16, -122); ctx.lineTo(16, -30); ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = '#4a3020'; circle(x, hubY, 9); ctx.fillStyle = '#c9a36a'; circle(x, hubY, 4);
}
function drawFountain(wx){
  const x = wx - camX; if (!onScreen(x, 110)) return;
  ctx.fillStyle = '#9a9186'; ctx.fillRect(x - 82, GROUND - 32, 164, 26);
  ctx.beginPath(); ctx.ellipse(x, GROUND - 6, 82, 12, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#b8b0a2'; ctx.beginPath(); ctx.ellipse(x, GROUND - 32, 82, 13, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#7fb2d0'; ctx.beginPath(); ctx.ellipse(x, GROUND - 31, 72, 9, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#a89f92'; ctx.fillRect(x - 7, GROUND - 84, 14, 52);
  ctx.fillStyle = '#b8b0a2'; ctx.beginPath(); ctx.ellipse(x, GROUND - 84, 30, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#7fb2d0'; ctx.beginPath(); ctx.ellipse(x, GROUND - 85, 24, 4, 0, 0, 7); ctx.fill();
  // water arcing out of the top bowl
  for (let i=0;i<18;i++){
    const u = wrap((reduceMotion ? .5 : t*.7) + i/18, 1), side = i % 2 ? 1 : -1;
    const px = x + side*(14 + u*44), py = GROUND - 90 - Math.sin(u*Math.PI)*26 + u*58;
    ctx.fillStyle = `rgba(210,235,250,${.85 - u*.4})`; circle(px, py, 2.4);
  }
}
function drawBoard(wx){
  const x = wx - camX; if (!onScreen(x, 110)) return;
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 64, GROUND - 146, 8, 146); ctx.fillRect(x + 56, GROUND - 146, 8, 146);
  ctx.fillStyle = '#5a4636'; ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x - 84, GROUND - 144); ctx.lineTo(x, GROUND - 178); ctx.lineTo(x + 84, GROUND - 144); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#4a3020'; rr(x - 58, GROUND - 146, 116, 24, 5); ctx.fill();
  ctx.fillStyle = '#f6ead6'; ctx.font = '700 14px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('QUEST BOARD', x, GROUND - 134); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#8a5a32'; rr(x - 70, GROUND - 118, 140, 78, 4); ctx.fill(); ctx.stroke();
  for (const [dx, dy, w, h, r] of [[-60, -110, 40, 32, -.06], [-12, -112, 38, 36, .05], [32, -108, 30, 30, -.04], [-44, -72, 50, 26, .03], [14, -70, 42, 24, -.05]]){
    ctx.save(); ctx.translate(x + dx + w/2, GROUND + dy + h/2); ctx.rotate(r);
    ctx.fillStyle = '#f6ead6'; ctx.fillRect(-w/2, -h/2, w, h);
    ctx.strokeStyle = 'rgba(80,60,40,.45)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let j=1;j<4;j++){ ctx.moveTo(-w/2 + 5, -h/2 + j*h/4.5 + 3); ctx.lineTo(w/2 - 6, -h/2 + j*h/4.5 + 3); } ctx.stroke();
    ctx.fillStyle = '#b8453d'; circle(0, -h/2 + 3, 2.6); ctx.restore();
  }
  // a bouncing "!" while there's a quest you haven't finished
  if (!Save.flag('quest1')){
    const by = GROUND - 198 + (reduceMotion ? 0 : Math.sin(t*4)*4);
    ctx.fillStyle = '#f2c230'; circle(x, by, 13); ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = '#2b1a0c'; ctx.fillRect(x - 2, by - 8, 4, 10); ctx.fillRect(x - 2, by + 4, 4, 4);
  }
}
function drawGate(wx){
  const x = wx - camX; if (!onScreen(x, 160)) return;
  // meadow beyond the gate
  for (let i=0;i<16;i++){
    const gx = x + 50 + i*9 + hash(i)*6, h = 16 + hash(i + 7)*20;
    ctx.strokeStyle = '#4f7a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(gx, GROUND + 2); ctx.lineTo(gx + 2, GROUND - h); ctx.stroke();
    ctx.fillStyle = ['#9a86d8', '#a487c6', '#e79ab8'][i % 3]; ctx.beginPath(); ctx.ellipse(gx + 2, GROUND - h - 4, 2.5, 6, 0, 0, 7); ctx.fill();
  }
  for (const px of [x - 74, x + 48]){
    ctx.fillStyle = '#9a9186'; ctx.fillRect(px, GROUND - 124, 26, 124);
    ctx.fillStyle = '#b8b0a2'; ctx.fillRect(px - 4, GROUND - 130, 34, 10);
    ctx.strokeStyle = 'rgba(90,80,70,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let y = GROUND - 110; y < GROUND; y += 16){ ctx.moveTo(px, y); ctx.lineTo(px + 26, y); } ctx.stroke();
    const g = ctx.createRadialGradient(px + 13, GROUND - 142, 2, px + 13, GROUND - 142, 30);
    g.addColorStop(0, 'rgba(255,220,130,.6)'); g.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = g; circle(px + 13, GROUND - 142, 30);
    ctx.fillStyle = '#ffe27a'; ctx.fillRect(px + 7, GROUND - 150, 12, 16); ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 2; ctx.strokeRect(px + 7, GROUND - 150, 12, 16);
  }
  // the gate itself, swung half open
  ctx.fillStyle = '#8a5a32'; ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 2;
  for (let i=0;i<4;i++){ ctx.fillRect(x - 48 + i*11, GROUND - 72, 8, 72); ctx.strokeRect(x - 48 + i*11, GROUND - 72, 8, 72); }
  ctx.fillRect(x - 48, GROUND - 60, 44, 6); ctx.fillRect(x - 48, GROUND - 22, 44, 6);
  ctx.fillStyle = '#4a3020'; rr(x - 62, GROUND - 180, 124, 28, 6); ctx.fill();
  ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 50, GROUND - 152); ctx.lineTo(x - 56, GROUND - 130); ctx.moveTo(x + 50, GROUND - 152); ctx.lineTo(x + 56, GROUND - 130); ctx.stroke();
  ctx.fillStyle = '#f6ead6'; ctx.font = '700 14px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('Meadow Gate', x, GROUND - 166); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}

// ---------- inside the windmill ----------
const MILL_W = 1100, MILL_DOOR = 110, CHEST_X = 930, HATCH_X = 800, BRAKE_X = 560;
// the secret is hidden: a small unlabeled brake lever stops the mill, and a loose floorboard
// by the barrels pops up to reveal the old chest. Nothing is marked and there's no prompt.
let millAng = 0, millSpeed = 1, brakeOn = false, floorPop = 0;
const chestFound = () => Save.flag('millFloor') || Save.flag('millChest');
let scene = 'village', fadeA = 0, fadeDir = 0, fadeMid = null, fadeWarp = false;
const MOTES_IN = (() => { const r = rng(12), m = []; for (let i=0;i<30;i++) m.push({ x:r(), y:r(), sp:.02 + r()*.04, ph:r()*6 }); return m; })();
// fade to black, swap scenes, fade back in
function transition(fn, warp){ if (fadeDir) return; fadeMid = fn; fadeDir = 1; fadeWarp = !!warp; P.target = null; pending = null; }
function enterMill(){ transition(() => { scene = 'mill'; P.x = 190; P.face = 1; P.vx = 0; camX = 0; }); }
function leaveMill(){ transition(() => { scene = 'village'; P.x = WINDMILL_X + 70; P.face = 1; P.vx = 0; camX = clamp(P.x - W*.42, 0, WORLD - W); }); }

function gear(x, y, r, teeth, ang, col){
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = col; for (let i=0;i<teeth;i++){ ctx.rotate(Math.PI*2/teeth); ctx.fillRect(-5, -r - 9, 10, 12); }
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#4a3020'; for (let i=0;i<4;i++){ ctx.rotate(Math.PI/2); ctx.fillRect(-4, 0, 8, r - 6); }
  circle(0, 0, 10); ctx.restore();
}
function drawMill(){
  const ox = -camX, opened = Save.flag('millChest');
  // back wall: planks above, stones below
  const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#2e2119'); g.addColorStop(1, '#5a4030');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
  ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = wrap(ox, 46); x < W; x += 46){ ctx.moveTo(x, 40); ctx.lineTo(x, 330); } ctx.stroke();
  ctx.fillStyle = '#6f675c'; ctx.fillRect(0, 330, W, GROUND - 330);
  for (let r=0;r<5;r++) for (let i = Math.floor(camX/40) - 1; i*40 - camX < W; i++){
    ctx.fillStyle = hash(i*5 + r*17) > .5 ? '#8a8072' : '#7d7466'; rr(i*40 + (r%2)*20 - camX + 2, 332 + r*14.5, 36, 12, 3); ctx.fill();
  }
  // round window with a shaft of evening light
  const wx = 560 + ox;
  ctx.fillStyle = 'rgba(255,214,150,.10)'; ctx.beginPath(); ctx.moveTo(wx - 30, 170); ctx.lineTo(wx + 30, 170); ctx.lineTo(wx + 190, GROUND + 60); ctx.lineTo(wx + 40, GROUND + 60); ctx.closePath(); ctx.fill();
  const sky = ctx.createLinearGradient(0, 136, 0, 204); sky.addColorStop(0, '#b88fb4'); sky.addColorStop(1, '#f7d6a0');
  ctx.fillStyle = sky; circle(wx, 170, 34);
  // a sail sweeps past the window now and then
  const sa = (reduceMotion ? .4 : millAng) % (Math.PI/2);
  ctx.save(); ctx.beginPath(); ctx.arc(wx, 170, 34, 0, 7); ctx.clip();
  ctx.translate(wx + 60, 110); ctx.rotate(sa*4); ctx.fillStyle = 'rgba(58,38,22,.55)'; ctx.fillRect(-6, 0, 12, 140); ctx.restore();
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(wx, 170, 34, 0, 7); ctx.stroke();
  ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(wx - 34, 170); ctx.lineTo(wx + 34, 170); ctx.moveTo(wx, 136); ctx.lineTo(wx, 204); ctx.stroke();
  // ceiling beams and the hatch
  ctx.fillStyle = '#3a2616'; ctx.fillRect(0, 0, W, 40);
  ctx.fillStyle = '#4a3020'; ctx.fillRect(0, 34, W, 14);
  for (let x = wrap(ox + 20, 260) - 260; x < W + 260; x += 260){ ctx.save(); ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x, 48); ctx.lineTo(x + 70, 130); ctx.stroke(); ctx.restore(); }
  const hx = HATCH_X + ox;
  if (opened){
    const lg = ctx.createRadialGradient(hx, 20, 4, hx, 20, 120); lg.addColorStop(0, 'rgba(255,236,190,.55)'); lg.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = lg; ctx.fillRect(hx - 120, 0, 240, 200);
    ctx.fillStyle = '#9cc2e6'; ctx.fillRect(hx - 38, 0, 76, 44);
    // the bottom of a balloon basket peeking through
    ctx.fillStyle = '#b8864a'; rr(hx - 26, -8, 52, 30, 4); ctx.fill();
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=1;i<4;i++){ ctx.moveTo(hx - 26, -8 + i*8); ctx.lineTo(hx + 26, -8 + i*8); } ctx.stroke();
    ctx.fillStyle = '#6b4a2b'; ctx.save(); ctx.translate(hx - 38, 44); ctx.rotate(-1.1); ctx.fillRect(0, -6, 76, 8); ctx.restore();
    // rope ladder down to the floor
    const sway = reduceMotion ? 0 : Math.sin(t*1.3)*3;
    ctx.strokeStyle = '#c9a36a'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(hx - 16, 30); ctx.quadraticCurveTo(hx - 16 + sway, 220, hx - 16 + sway*1.5, GROUND + 6);
    ctx.moveTo(hx + 16, 30); ctx.quadraticCurveTo(hx + 16 + sway, 220, hx + 16 + sway*1.5, GROUND + 6); ctx.stroke();
    ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 4; ctx.beginPath();
    for (let y = 60; y < GROUND; y += 30){ const k = (y - 30)/(GROUND - 24), off = sway*Math.min(1.5, k*2); ctx.moveTo(hx - 16 + off, y); ctx.lineTo(hx + 16 + off, y); } ctx.stroke();
  } else {
    ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 3; ctx.strokeRect(hx - 38, 2, 76, 42);
    ctx.fillStyle = '#c9a13a'; circle(hx + 28, 24, 3);
  }
  // the mill machinery, turned by the sails outside
  const ang = reduceMotion ? 0 : millAng, mx = 420 + ox;
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(mx - 9, 40, 18, 300);
  gear(mx, 96, 58, 16, ang, '#8a5a32');
  gear(mx + 96, 70, 30, 9, -ang*1.9, '#9a6b40');
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(mx + 90, 40, 12, 60);
  ctx.fillStyle = '#7a5230'; ctx.beginPath(); ctx.moveTo(mx - 50, 250); ctx.lineTo(mx + 50, 250); ctx.lineTo(mx + 16, 300); ctx.lineTo(mx - 16, 300); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#9a9186'; ctx.beginPath(); ctx.ellipse(mx, GROUND - 16, 96, 18, 0, 0, 7); ctx.fill(); ctx.fillRect(mx - 96, GROUND - 34, 192, 18);
  ctx.fillStyle = '#b8b0a2'; ctx.beginPath(); ctx.ellipse(mx, GROUND - 34, 96, 18, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(mx, GROUND - 34); ctx.scale(1, .19); ctx.rotate(ang*2); ctx.strokeStyle = 'rgba(90,80,70,.6)'; ctx.lineWidth = 8;
  ctx.beginPath(); for (let i=0;i<6;i++){ const a = i/6*Math.PI*2; ctx.moveTo(Math.cos(a)*20, Math.sin(a)*20); ctx.lineTo(Math.cos(a)*90, Math.sin(a)*90); } ctx.stroke(); ctx.restore();
  // flour sacks and barrels
  for (const [sx, sy, sw, sh] of [[230, GROUND - 60, 60, 64], [284, GROUND - 52, 54, 56], [256, GROUND - 104, 52, 52]]){
    const x = sx + ox; ctx.fillStyle = '#e8dcc6'; rr(x - sw/2, sy, sw, sh, 18); ctx.fill(); ctx.strokeStyle = '#8a7a60'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#8a7a60'; ctx.fillRect(x - 8, sy + 2, 16, 5);
  }
  ctx.fillStyle = '#8a7a60'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('FLOUR', 230 + ox, GROUND - 22); ctx.textAlign = 'left';
  for (const bx of [1016, 1062]){ const x = bx + ox; ctx.fillStyle = '#7a5230'; rr(x - 22, GROUND - 58, 44, 60, 10); ctx.fill(); ctx.fillStyle = '#4a3020'; ctx.fillRect(x - 22, GROUND - 46, 44, 5); ctx.fillRect(x - 22, GROUND - 16, 44, 5); }
  // hanging lantern
  const lx = 300 + ox, lg2 = ctx.createRadialGradient(lx, 170, 2, lx, 170, 70);
  lg2.addColorStop(0, 'rgba(255,214,130,.4)'); lg2.addColorStop(1, 'rgba(255,214,130,0)'); ctx.fillStyle = lg2; circle(lx, 170, 70);
  ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, 48); ctx.lineTo(lx, 158); ctx.stroke();
  ctx.fillStyle = '#ffe27a'; ctx.fillRect(lx - 8, 160, 16, 20); ctx.strokeRect(lx - 8, 160, 16, 20);
  // doorway back outside
  const dx = MILL_DOOR + ox, dg = ctx.createLinearGradient(0, GROUND - 110, 0, GROUND);
  dg.addColorStop(0, '#b88fb4'); dg.addColorStop(1, '#f2b98c');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(dx - 34, GROUND); ctx.lineTo(dx - 34, GROUND - 80); ctx.arc(dx, GROUND - 80, 34, Math.PI, 0); ctx.lineTo(dx + 34, GROUND); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#6f9474'; ctx.fillRect(dx - 31, GROUND - 14, 62, 14);
  // the brake: an iron bracket and a wooden handle, easy to mistake for part of the machinery
  const kx = BRAKE_X + ox, ky = 300;
  ctx.fillStyle = '#4a4440'; rr(kx - 12, ky - 12, 24, 24, 4); ctx.fill();
  ctx.fillStyle = '#6f675c'; circle(kx, ky, 5);
  ctx.save(); ctx.translate(kx, ky); ctx.rotate(brakeOn ? .9 : -.9);
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(-3, -40, 6, 40); ctx.fillStyle = '#4a3020'; circle(0, -40, 6); ctx.restore();
  ctx.fillStyle = 'rgba(246,234,214,.22)'; ctx.font = '700 8px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
  ctx.fillText("don't pull", kx, ky + 26); ctx.textAlign = 'left';
  // floorboards
  ctx.fillStyle = '#7a5a3e'; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.strokeStyle = 'rgba(40,24,12,.35)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let y = GROUND + 14; y < H; y += 16){ ctx.moveTo(0, y); ctx.lineTo(W, y); }
  for (let r=0; r<5; r++) for (let x = wrap(ox + r*47, 120); x < W; x += 120){ ctx.moveTo(x, GROUND + r*16); ctx.lineTo(x, GROUND + r*16 + 14); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, GROUND, W, 6);
  // the loose floorboard and the chest hidden under it
  const cx = CHEST_X + ox, cy = GROUND + 30;
  if (chestFound()){
    ctx.fillStyle = '#1e140c'; rr(cx - 50, GROUND - 2, 100, 40, 4); ctx.fill();
    // the board, flipped up against the barrels
    ctx.save(); ctx.translate(cx + 50, GROUND); ctx.rotate(1.25*Math.min(1, (1 - floorPop)*3));
    ctx.fillStyle = '#8a6a4a'; ctx.fillRect(-100, -8, 100, 10); ctx.restore();
    if (opened){
      const cg = ctx.createRadialGradient(cx, cy - 40, 4, cx, cy - 40, 60); cg.addColorStop(0, 'rgba(255,226,122,.45)'); cg.addColorStop(1, 'rgba(255,226,122,0)');
      ctx.fillStyle = cg; circle(cx, cy - 40, 60);
      ctx.fillStyle = '#5c3a22'; ctx.save(); ctx.translate(cx - 40, cy - 44); ctx.rotate(-1.9); rr(0, -6, 30, 80, 6); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = '#7a4a28'; rr(cx - 40, cy - 44, 80, 44, 5); ctx.fill();
    ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#c9a13a'; ctx.fillRect(cx - 28, cy - 44, 7, 44); ctx.fillRect(cx + 21, cy - 44, 7, 44);
    if (!opened){
      ctx.fillStyle = '#6b4226'; ctx.beginPath(); ctx.moveTo(cx - 42, cy - 44); ctx.quadraticCurveTo(cx, cy - 70, cx + 42, cy - 44); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c9a13a'; ctx.fillRect(cx - 5, cy - 50, 10, 12);
    } else {
      ctx.fillStyle = '#f6ead6'; ctx.save(); ctx.translate(cx + 4, cy - 50); ctx.rotate(.15); ctx.fillRect(-12, -8, 24, 16); ctx.restore();
    }
    // a puff of dust when the board first pops up
    if (floorPop > 0 && !reduceMotion){
      for (let i=0;i<14;i++){ const a = i/14*Math.PI, r = (1 - floorPop)*70; ctx.fillStyle = `rgba(230,214,190,${floorPop*.6})`; circle(cx + Math.cos(a)*r*1.4 - r*.1, GROUND - Math.sin(a)*r*.6, 5); }
    }
  } else {
    // just a floorboard that sits a little crooked
    ctx.strokeStyle = 'rgba(40,24,12,.5)'; ctx.lineWidth = 2; ctx.strokeRect(cx - 50, GROUND + 2, 100, 12);
  }
  // dust drifting in the light
  for (const m of MOTES_IN){
    const x = wrap(m.x*MILL_W + Math.sin(t*.6 + m.ph)*20 - camX, W), y = wrap(m.y*GROUND + t*m.sp*200, GROUND - 60) + 50;
    ctx.fillStyle = `rgba(255,236,190,${.25 + .35*Math.max(0, Math.sin(t + m.ph))})`; circle(x, y, 1.6);
  }
  drawPlayer();
  if (climbing) drawCeilingOver();
  // the round walls of the tower darken toward the edges
  const vg = ctx.createRadialGradient(W/2, H/2, 200, W/2, H/2, 520); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,6,4,.6)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

// ---------- inside the shops ----------
// each shop has a room: displays for its three items, and the owner behind the counter
const SHOP_W = 800, SHOP_DOOR = 90, COUNTER_X = 560, OWNER_X = 665, DISPLAY_X = [200, 310, 420]; // each room fits on one screen
let currentShop = null;
function enterShop(s){ transition(() => { scene = 'shop'; currentShop = s; P.x = 150; P.face = 1; P.vx = 0; camX = 0; }); }
function leaveShop(){ const s = currentShop; transition(() => { scene = 'village'; currentShop = null; P.x = s.door + 40; P.face = 1; P.vx = 0; camX = clamp(P.x - W*.42, 0, WORLD - W); }); }

// a little picture of each item, drawn around (x, y) at size k (about 40px across at k = 1)
function itemIcon(g, id, x, y, k){
  g.save(); g.translate(x, y); g.scale(k, k); g.lineJoin = 'round'; g.lineCap = 'round';
  const dot = (cx, cy, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); };
  const line = '#3a2616';
  if (id === 'charm'){
    g.strokeStyle = '#3f6b3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 4); g.quadraticCurveTo(4, 14, 10, 18); g.stroke();
    for (const [cx, cy] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) dot(cx, cy - 2, 8, '#5d9b4a');
    dot(0, -2, 4, '#7fbf5a'); g.strokeStyle = '#c9a13a'; g.lineWidth = 2; g.beginPath(); g.arc(0, -2, 20, 0, 7); g.stroke();
  } else if (id === 'map'){
    g.fillStyle = '#efe2c0'; g.beginPath(); g.moveTo(-20, -14); g.lineTo(-7, -11); g.lineTo(7, -14); g.lineTo(20, -11); g.lineTo(20, 15); g.lineTo(7, 12); g.lineTo(-7, 15); g.lineTo(-20, 12); g.closePath(); g.fill();
    g.strokeStyle = line; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = 'rgba(58,38,22,.35)'; g.beginPath(); g.moveTo(-7, -11); g.lineTo(-7, 15); g.moveTo(7, -14); g.lineTo(7, 12); g.stroke();
    g.strokeStyle = '#b8453d'; g.setLineDash([3, 3]); g.lineWidth = 2; g.beginPath(); g.moveTo(-15, 8); g.quadraticCurveTo(-4, -8, 11, -3); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.moveTo(10, -8); g.lineTo(16, -2); g.moveTo(16, -8); g.lineTo(10, -2); g.stroke();
    dot(-12, -4, 3, '#5d9b4a'); dot(2, 8, 2.5, '#5d9b4a');
  } else if (id === 'compass'){
    dot(0, 0, 19, '#c9a13a'); dot(0, 0, 15, '#f6ead6'); dot(0, -19, 4, '#c9a13a');
    g.fillStyle = '#b8453d'; g.beginPath(); g.moveTo(0, -12); g.lineTo(4, 0); g.lineTo(-4, 0); g.closePath(); g.fill();
    g.fillStyle = '#6f675c'; g.beginPath(); g.moveTo(0, 12); g.lineTo(4, 0); g.lineTo(-4, 0); g.closePath(); g.fill();
    dot(0, 0, 2, line);
  } else if (id === 'seedcake'){
    g.fillStyle = '#b8743a'; g.fillRect(-18, -4, 36, 16); g.beginPath(); g.ellipse(0, 12, 18, 5, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#f6ead6'; g.beginPath(); g.ellipse(0, -4, 18, 6, 0, 0, 7); g.fill(); g.fillRect(-18, -4, 36, 4);
    for (const [cx, cy] of [[-9, -5], [-2, -3], [6, -6], [11, -3], [0, -8]]){ g.save(); g.translate(cx, cy); g.rotate(cx*.2); g.fillStyle = '#3d3226'; g.beginPath(); g.ellipse(0, 0, 1.6, 2.6, 0, 0, 7); g.fill(); g.restore(); }
  } else if (id === 'berrytart'){
    g.fillStyle = '#c98a4b'; g.beginPath(); g.ellipse(0, 4, 20, 9, 0, 0, 7); g.fill(); g.fillStyle = '#e0a868'; g.beginPath(); g.ellipse(0, 1, 17, 7, 0, 0, 7); g.fill();
    for (const [cx, cy] of [[-9, 0], [-3, -3], [4, 1], [10, -2], [1, 4], [-6, 4], [7, 5]]) dot(cx, cy, 3.4, cx % 2 ? '#b8284a' : '#6a3a8a');
  } else if (id === 'acornbun'){
    g.fillStyle = '#d99a52'; g.beginPath(); g.ellipse(0, 4, 19, 13, 0, 0, 7); g.fill();
    g.fillStyle = '#7a4f1c'; g.beginPath(); g.ellipse(0, -7, 12, 6, 0, Math.PI, 0); g.fill(); g.fillRect(-1.5, -17, 3, 5);
    dot(0, -3, 6, '#f2c230'); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(-8, 2, 5, 3, -.4, 0, 7); g.fill();
  } else if (id === 'lavender'){
    for (let i=-2;i<=2;i++){
      g.strokeStyle = '#4f7a4a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(i*1.5, 18); g.lineTo(i*6, -14); g.stroke();
      for (let b=0;b<5;b++) dot(i*6*(1 - b*.06) + (b % 2 ? 1.5 : -1.5), -14 + b*4, 2.4, '#8f72b4');
    }
    g.fillStyle = '#e0708f'; g.fillRect(-5, 6, 10, 4);
  } else if (id === 'posy'){
    g.fillStyle = '#f6ead6'; g.beginPath(); g.moveTo(-14, -4); g.lineTo(14, -4); g.lineTo(3, 20); g.lineTo(-3, 20); g.closePath(); g.fill(); g.strokeStyle = '#c9a36a'; g.lineWidth = 1.5; g.stroke();
    for (const [cx, cy, c] of [[-9, -8, '#e79ab8'], [0, -12, '#f2c230'], [9, -8, '#9a86d8'], [-4, -3, '#fff'], [5, -3, '#e0708f']]){
      for (let p=0;p<5;p++){ const a = p/5*Math.PI*2; dot(cx + Math.cos(a)*3.2, cy + Math.sin(a)*3.2, 2.6, c); } dot(cx, cy, 1.6, '#f2c230');
    }
  } else if (id === 'ribbon'){
    g.fillStyle = '#e0708f'; g.strokeStyle = '#a84a66'; g.lineWidth = 1.5;
    for (const sd of [-1, 1]){ g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(sd*22, -16, sd*18, 4); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(sd*2, 2); g.lineTo(sd*10, 18); g.lineTo(sd*5, 15); g.lineTo(sd*1, 18); g.closePath(); g.fill(); g.stroke(); }
    dot(0, 0, 5, '#c85a7a');
  } else if (id === 'shades'){
    g.fillStyle = '#1e1a16'; g.beginPath(); g.ellipse(-10, 0, 9, 7, 0, 0, 7); g.ellipse(10, 0, 9, 7, 0, 0, 7); g.fill();
    g.strokeStyle = '#1e1a16'; g.lineWidth = 3; g.beginPath(); g.moveTo(-2, -2); g.quadraticCurveTo(0, -5, 2, -2); g.moveTo(-19, -2); g.lineTo(-22, -4); g.moveTo(19, -2); g.lineTo(22, -4); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-14, -4, 4, 2); g.fillRect(6, -4, 4, 2);
  } else if (id === 'bandana'){
    g.fillStyle = '#d0452f'; g.beginPath(); g.moveTo(-20, -10); g.lineTo(20, -10); g.lineTo(0, 16); g.closePath(); g.fill(); g.strokeStyle = '#8a2a1c'; g.lineWidth = 1.5; g.stroke();
    for (const [cx, cy] of [[-10, -5], [0, -4], [10, -5], [-5, 3], [5, 3], [0, 10]]) dot(cx, cy, 1.7, '#f6ead6');
  } else if (id === 'feather'){
    g.rotate(-.5);
    g.fillStyle = '#e8dcc6'; g.beginPath(); g.moveTo(0, 20); g.quadraticCurveTo(-12, 0, 0, -20); g.quadraticCurveTo(12, 0, 0, 20); g.fill();
    g.fillStyle = '#3f8a8a'; g.beginPath(); g.moveTo(0, -20); g.quadraticCurveTo(-7, -12, -5, -6); g.lineTo(5, -6); g.quadraticCurveTo(7, -12, 0, -20); g.fill();
    g.strokeStyle = '#8a6a4a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 24); g.lineTo(0, -18); g.stroke();
  } else if (id === 'goldfeather'){
    g.rotate(-.6);
    const fg = g.createLinearGradient(0, -22, 0, 22); fg.addColorStop(0, '#fff2a0'); fg.addColorStop(1, '#e0a020');
    g.fillStyle = fg; g.beginPath(); g.moveTo(0, 22); g.quadraticCurveTo(-13, 0, 0, -22); g.quadraticCurveTo(13, 0, 0, 22); g.fill();
    g.strokeStyle = '#b8860a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, 26); g.lineTo(0, -20); for (let i=-3;i<=3;i++){ g.moveTo(0, i*5); g.lineTo(i % 2 ? 7 : -7, i*5 - 4); } g.stroke();
  } else if (id === 'fallenstar'){
    const sg = g.createRadialGradient(0, 0, 2, 0, 0, 24); sg.addColorStop(0, 'rgba(255,250,210,.9)'); sg.addColorStop(1, 'rgba(255,250,210,0)'); g.fillStyle = sg; g.beginPath(); g.arc(0, 0, 24, 0, 7); g.fill();
    g.fillStyle = '#ffe066'; g.beginPath(); for (let k=0;k<10;k++){ const a = -Math.PI/2 + k*Math.PI/5, r = k % 2 ? 7 : 17; k ? g.lineTo(Math.cos(a)*r, Math.sin(a)*r) : g.moveTo(Math.cos(a)*r, Math.sin(a)*r); } g.closePath(); g.fill();
    g.strokeStyle = '#d0a020'; g.lineWidth = 1.5; g.stroke(); dot(-3, -2, 1.4, '#6a4a10'); dot(3, -2, 1.4, '#6a4a10');
  } else if (id === 'holobadge'){
    g.fillStyle = 'rgba(90,220,255,.25)'; g.fillRect(-20, -14, 40, 28); g.strokeStyle = '#5adcff'; g.lineWidth = 2; g.strokeRect(-20, -14, 40, 28);
    dot(-10, -2, 6, 'rgba(255,106,213,.8)'); g.fillStyle = '#5adcff'; g.fillRect(0, -6, 14, 3); g.fillRect(0, 0, 10, 3); g.fillRect(-16, 8, 32, 2);
    g.fillStyle = '#c9a13a'; g.fillRect(-4, -20, 8, 7);
  } else if (id === 'glownoodles'){
    g.fillStyle = '#e8e0d0'; g.beginPath(); g.moveTo(-18, -2); g.lineTo(18, -2); g.quadraticCurveTo(16, 16, 0, 16); g.quadraticCurveTo(-16, 16, -18, -2); g.fill();
    g.fillStyle = '#d0452f'; g.fillRect(-18, 2, 36, 3);
    g.strokeStyle = '#ffe66e'; g.lineWidth = 2; g.beginPath(); for (let i=-12;i<=12;i+=6){ g.moveTo(i, -2); g.quadraticCurveTo(i + 3, -10, i, -16); } g.stroke();
    g.strokeStyle = '#5adcff'; g.lineWidth = 2; g.beginPath(); g.moveTo(8, -20); g.lineTo(18, -4); g.moveTo(12, -21); g.lineTo(21, -6); g.stroke();
  } else if (id === 'moonpebble'){
    const mg = g.createRadialGradient(-4, -4, 2, 0, 0, 18); mg.addColorStop(0, '#ffffff'); mg.addColorStop(1, '#c8d8f0');
    g.fillStyle = mg; g.beginPath(); g.ellipse(0, 2, 17, 13, -.2, 0, 7); g.fill(); g.strokeStyle = '#8aa0c0'; g.lineWidth = 1.5; g.stroke();
    dot(-5, 0, 3, 'rgba(160,180,210,.5)'); dot(5, 6, 2, 'rgba(160,180,210,.5)');
  } else if (id === 'wildberries'){
    g.fillStyle = '#4f7a4a'; g.beginPath(); g.ellipse(-6, -12, 10, 5, -.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(8, -13, 9, 4.5, .5, 0, 7); g.fill();
    for (const [cx, cy] of [[-8, 0], [2, -3], [10, 3], [-3, 8], [7, 11], [-11, 10]]){ dot(cx, cy, 6, '#8a2a5a'); dot(cx - 2, cy - 2, 1.8, 'rgba(255,255,255,.5)'); }
  } else if (id === 'clover4'){
    g.strokeStyle = '#3f6b3a'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 4); g.quadraticCurveTo(4, 14, 10, 20); g.stroke();
    for (const [cx, cy] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) dot(cx, cy - 2, 8.5, '#5d9b4a');
    g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1.2; g.beginPath(); for (const [cx, cy] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]){ g.moveTo(0, -2); g.lineTo(cx*.9, cy*.9 - 2); } g.stroke();
  } else if (id === 'pebble'){
    const pg = g.createLinearGradient(-16, -12, 16, 12); pg.addColorStop(0, '#b8c8d8'); pg.addColorStop(1, '#6a7a90');
    g.fillStyle = pg; g.beginPath(); g.ellipse(0, 2, 18, 13, -.2, 0, 7); g.fill(); g.strokeStyle = '#4a5668'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-6, -4, 5, 2.5, -.4, 0, 7); g.fill();
    g.fillStyle = '#fff6d0'; g.beginPath(); g.moveTo(10, -14); g.lineTo(12, -9); g.lineTo(17, -7); g.lineTo(12, -5); g.lineTo(10, 0); g.lineTo(8, -5); g.lineTo(3, -7); g.lineTo(8, -9); g.closePath(); g.fill();
  } else if (id === 'button'){
    dot(0, 0, 17, '#b8862a'); dot(0, 0, 13, '#d9a83a'); g.strokeStyle = '#8a6a1a'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 13, 0, 7); g.stroke();
    for (const [cx, cy] of [[-4, -4], [4, -4], [-4, 4], [4, 4]]) dot(cx, cy, 2.4, '#6a4a10');
    g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(-7, -8, 4, 2, -.6, 0, 7); g.fill();
  } else if (id === 'honey'){
    g.fillStyle = '#f2c230'; g.beginPath(); g.moveTo(-13, -8); g.lineTo(13, -8); g.quadraticCurveTo(16, 6, 12, 16); g.lineTo(-12, 16); g.quadraticCurveTo(-16, 6, -13, -8); g.fill();
    g.strokeStyle = '#b8862a'; g.lineWidth = 1.5; g.stroke();
    g.fillStyle = '#8a5a32'; g.fillRect(-14, -14, 28, 7);
    g.fillStyle = '#f6ead6'; g.fillRect(-8, 0, 16, 9); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(-10, -5, 3, 14);
  } else if (id === 'rainbowshell'){
    const cols = ['#ff7a8a', '#ffb05a', '#ffe066', '#8ad89a', '#8ac8ff', '#c09aff'];
    for (let k=0;k<6;k++){ g.fillStyle = cols[k]; g.beginPath(); g.moveTo(0, 14); g.arc(0, 14, 26, Math.PI + k*Math.PI/6 + .05, Math.PI + (k + 1)*Math.PI/6 - .05); g.closePath(); g.fill(); }
    g.fillStyle = '#f6e6d6'; g.fillRect(-7, 12, 14, 7); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-8, -2, 4, 2, -.6, 0, 7); g.fill();
  } else if (id === 'dragonscale'){
    g.fillStyle = '#3aa860'; g.beginPath(); g.moveTo(0, -20); g.quadraticCurveTo(20, -10, 16, 8); g.quadraticCurveTo(8, 20, 0, 22); g.quadraticCurveTo(-8, 20, -16, 8); g.quadraticCurveTo(-20, -10, 0, -20); g.fill();
    g.fillStyle = '#6ad890'; g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(10, -4, 8, 8); g.quadraticCurveTo(0, 14, -8, 8); g.quadraticCurveTo(-10, -4, 0, -12); g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(-5, -6, 3, 6, .4, 0, 7); g.fill();
  } else if (id === 'sheriffstar'){
    g.fillStyle = '#c9c0a0'; g.beginPath(); for (let k=0;k<10;k++){ const a = -Math.PI/2 + k*Math.PI/5, r = k % 2 ? 9 : 20; k ? g.lineTo(Math.cos(a)*r, Math.sin(a)*r) : g.moveTo(Math.cos(a)*r, Math.sin(a)*r); } g.closePath(); g.fill();
    g.strokeStyle = '#8a8060'; g.lineWidth = 1.5; g.stroke(); for (let k=0;k<5;k++){ const a = -Math.PI/2 + k*Math.PI*2/5; dot(Math.cos(a)*20, Math.sin(a)*20, 2.5, '#e8e0c0'); } dot(0, 0, 5, '#e8e0c0');
  } else if (id === 'geode'){
    dot(0, 0, 20, '#6a6070'); dot(0, 0, 14, '#a070e0'); for (let k=0;k<8;k++){ const a = k/8*Math.PI*2; g.fillStyle = k % 2 ? '#e8d0ff' : '#c8a0ff'; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a)*13, Math.sin(a)*13); g.lineTo(Math.cos(a + .5)*13, Math.sin(a + .5)*13); g.fill(); } dot(-4, -4, 3, '#fff');
  } else if (id === 'floatfeather'){
    g.fillStyle = '#f0d8ff'; g.beginPath(); g.moveTo(-14, 16); g.quadraticCurveTo(-16, -10, 12, -20); g.quadraticCurveTo(10, 4, -14, 16); g.fill(); g.strokeStyle = '#a070d0'; g.lineWidth = 2; g.beginPath(); g.moveTo(-16, 20); g.quadraticCurveTo(-4, 0, 12, -20); g.stroke();
    g.strokeStyle = 'rgba(160,112,208,.5)'; g.lineWidth = 1; for (let k=0;k<5;k++){ g.beginPath(); g.moveTo(-10 + k*4, 10 - k*6); g.lineTo(-2 + k*4, 12 - k*6); g.stroke(); }
  } else if (id === 'yarnball'){
    dot(0, 0, 18, '#ff9ab8'); g.strokeStyle = '#e0607a'; g.lineWidth = 2; for (const [a, b] of [[-.6, 2.2], [.8, 3.6], [2.4, 5.2]]){ g.beginPath(); g.arc(0, 0, 13, a, b); g.stroke(); } g.beginPath(); g.moveTo(14, 10); g.quadraticCurveTo(22, 18, 16, 22); g.stroke();
  } else if (id === 'grannycookies'){
    g.fillStyle = '#c84b4b'; g.fillRect(-20, -4, 40, 22); g.fillStyle = '#f6efe4'; for (let k = 0; k < 5; k++) for (let j = 0; j < 3; j++) if ((k + j) % 2) g.fillRect(-20 + k*8, -4 + j*7.3, 8, 7.3);
    dot(-9, -8, 9, '#d9a462'); dot(8, -9, 9, '#e2b676'); dot(8, -10, 3, '#d0303e'); g.fillStyle = '#8a4a2a'; for (const [a, b] of [[-12, -10], [-7, -6], [-10, -5]]) g.fillRect(a, b, 2, 2);
    g.fillStyle = '#9a6232'; g.beginPath(); g.arc(0, -16, 6, 0, 7); g.arc(-4, -22, 3, 0, 7); g.arc(4, -22, 3, 0, 7); g.fill();
  } else if (id === 'musicbox'){
    g.fillStyle = '#b8c0cc'; g.fillRect(-16, -2, 32, 18); g.fillStyle = '#d8dee6'; g.fillRect(-16, -2, 32, 4); g.strokeStyle = '#8a929e'; g.lineWidth = 1.5; g.strokeRect(-16, -2, 32, 18);
    g.save(); g.translate(-16, -2); g.rotate(-.9); g.fillStyle = '#c8d0da'; g.fillRect(0, -3, 32, 4); g.restore();
    dot(0, -10, 3, '#f0c8d8'); g.fillStyle = '#f0c8d8'; g.beginPath(); g.moveTo(-6, -2); g.lineTo(0, -8); g.lineTo(6, -2); g.fill(); g.strokeStyle = '#c99a3a'; g.lineWidth = 1.5; g.beginPath(); g.arc(18, 7, 4, 0, 7); g.stroke();
  } else if (id === 'warpshard'){
    const cols = ['#ff7ab8', '#7ad0ff', '#c8a0ff', '#8ae0a0']; for (let k=0;k<4;k++){ g.fillStyle = cols[k]; g.beginPath(); g.moveTo(0, -20); g.lineTo(k < 2 ? -12 : 12, 0); g.lineTo(0, 20); g.lineTo(0, k % 2 ? -4 : 4); g.closePath(); g.fill(); } g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, -20); g.lineTo(-12, 0); g.lineTo(0, 20); g.lineTo(12, 0); g.closePath(); g.stroke();
  } else if (id === 'sarsaparilla'){
    g.fillStyle = '#6a3a1a'; g.beginPath(); g.moveTo(-8, 18); g.lineTo(-8, -2); g.quadraticCurveTo(-8, -8, -4, -10); g.lineTo(-4, -20); g.lineTo(4, -20); g.lineTo(4, -10); g.quadraticCurveTo(8, -8, 8, -2); g.lineTo(8, 18); g.closePath(); g.fill();
    g.fillStyle = '#f6ead6'; g.fillRect(-8, 0, 16, 10); g.fillStyle = '#d0452f'; g.fillRect(-5, -22, 10, 4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-6, -6, 3, 22);
  } else {
    // chamomile and mint: a cup of tea on a saucer
    g.fillStyle = '#e8e0d0'; g.beginPath(); g.ellipse(0, 14, 20, 4, 0, 0, 7); g.fill();
    g.beginPath(); g.moveTo(-14, -4); g.lineTo(14, -4); g.quadraticCurveTo(13, 12, 0, 12); g.quadraticCurveTo(-13, 12, -14, -4); g.fill();
    g.strokeStyle = '#e8e0d0'; g.lineWidth = 3; g.beginPath(); g.arc(15, 2, 5, -1.2, 1.2); g.stroke();
    g.fillStyle = id === 'mint' ? '#8fbf6a' : '#e8c060'; g.beginPath(); g.ellipse(0, -4, 13, 3, 0, 0, 7); g.fill();
    if (id === 'mint'){ g.fillStyle = '#4f8a3a'; g.beginPath(); g.ellipse(-3, -6, 5, 2.5, -.5, 0, 7); g.fill(); }
    else { for (let p=0;p<6;p++){ const a = p/6*Math.PI*2; dot(Math.cos(a)*3.5, -5 + Math.sin(a)*1.6, 1.8, '#fff'); } dot(0, -5, 1.6, '#f2c230'); }
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-4, -10); g.quadraticCurveTo(-8, -16, -3, -22); g.moveTo(4, -10); g.quadraticCurveTo(0, -16, 5, -22); g.stroke();
  }
  g.restore();
}

function drawShopInside(){
  const s = currentShop, ox = -camX, k = KEEPERS[s.keeper];
  // walls in the shop's own color, with soft stripes
  ctx.fillStyle = s.wall; ctx.fillRect(0, 0, W, GROUND);
  ctx.fillStyle = 'rgba(58,38,22,.28)'; ctx.fillRect(0, 0, W, GROUND);
  ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let x = wrap(ox, 40); x < W; x += 40) ctx.fillRect(x, 0, 16, GROUND);
  ctx.fillStyle = '#4a3020'; ctx.fillRect(0, 0, W, 26);
  // windows looking out at dusk, with curtains
  for (const wx0 of [255, 420]){
    const x = wx0 + ox, sky = ctx.createLinearGradient(0, 110, 0, 210);
    sky.addColorStop(0, '#b88fb4'); sky.addColorStop(1, '#f2b98c');
    ctx.fillStyle = sky; ctx.fillRect(x - 40, 110, 80, 100);
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 5; ctx.strokeRect(x - 40, 110, 80, 100);
    ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 110); ctx.lineTo(x, 210); ctx.moveTo(x - 40, 160); ctx.lineTo(x + 40, 160); ctx.stroke();
    ctx.fillStyle = s.awning[1]; for (const sd of [-1, 1]){ ctx.beginPath(); ctx.moveTo(x + sd*48, 100); ctx.lineTo(x + sd*30, 100); ctx.quadraticCurveTo(x + sd*36, 160, x + sd*46, 218); ctx.lineTo(x + sd*50, 218); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 56, 96, 112, 6);
  }
  // wood paneling along the bottom of the walls
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(0, GROUND - 96, W, 96);
  ctx.fillStyle = '#7a5838'; for (let x = wrap(ox, 70); x < W; x += 70) ctx.fillRect(x + 8, GROUND - 86, 54, 70);
  ctx.fillStyle = '#4a3020'; ctx.fillRect(0, GROUND - 100, W, 6);
  // hanging lamps
  for (const lx0 of [150, 500]){
    const lx = lx0 + ox, lg = ctx.createRadialGradient(lx, 80, 2, lx, 80, 90);
    lg.addColorStop(0, 'rgba(255,214,130,.35)'); lg.addColorStop(1, 'rgba(255,214,130,0)'); ctx.fillStyle = lg; circle(lx, 80, 90);
    ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, 26); ctx.lineTo(lx, 66); ctx.stroke();
    ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.moveTo(lx - 12, 80); ctx.lineTo(lx + 12, 80); ctx.lineTo(lx + 6, 66); ctx.lineTo(lx - 6, 66); ctx.closePath(); ctx.fill();
  }
  // the door back outside
  const dx = SHOP_DOOR + ox, dg = ctx.createLinearGradient(0, GROUND - 120, 0, GROUND);
  dg.addColorStop(0, '#b88fb4'); dg.addColorStop(1, '#f2b98c');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(dx - 32, GROUND); ctx.lineTo(dx - 32, GROUND - 90); ctx.arc(dx, GROUND - 90, 32, Math.PI, 0); ctx.lineTo(dx + 32, GROUND); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#c2a582'; ctx.fillRect(dx - 29, GROUND - 12, 58, 12);
  // shelves behind the counter, stocked with the shop's goods, and its sign
  const cx = COUNTER_X + ox;
  ctx.fillStyle = '#5c4336'; for (const sy of [150, 215]){ ctx.fillRect(cx + 10, sy, 210, 8); goods(s.kind, cx + 55, sy); goods(s.kind, cx + 175, sy); }
  ctx.fillStyle = '#4a3020'; rr(cx + 10, 50, 210, 34, 6); ctx.fill();
  ctx.strokeStyle = '#c9a36a'; ctx.lineWidth = 2; rr(cx + 14, 54, 202, 26, 4); ctx.stroke();
  let fs = 16; ctx.font = `700 ${fs}px "Pixelify Sans", monospace`;
  while (fs > 11 && ctx.measureText(s.name).width > 190){ fs--; ctx.font = `700 ${fs}px "Pixelify Sans", monospace`; }
  ctx.fillStyle = '#f6ead6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.name, cx + 115, 68); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  // the owner, a little bigger indoors, behind the counter
  if (k.img.complete && k.img.naturalWidth){
    const h = k.h*1.3, w = h*k.img.naturalWidth/k.img.naturalHeight, kx = OWNER_X + ox, br = reduceMotion ? 0 : Math.sin(t*2.2)*.018;
    ctx.save(); ctx.translate(kx, GROUND - 36); ctx.scale(-(1 - br*.5), 1 + br); ctx.drawImage(k.img, -w/2, -h, w, h); ctx.restore();
    if (near && near.owner && !panelOpen()){
      ctx.font = '700 14px "Pixelify Sans", monospace'; const tw = ctx.measureText(k.name).width + 20, ty = GROUND - 36 - h - 18;
      ctx.fillStyle = 'rgba(43,33,24,.85)'; rr(kx - tw/2, ty - 12, tw, 24, 8); ctx.fill();
      ctx.fillStyle = '#f6ead6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(k.name, kx, ty); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    }
  }
  // the counter
  ctx.fillStyle = '#7a5230'; ctx.fillRect(cx, GROUND - 56, 240, 56);
  ctx.fillStyle = '#6b4226'; for (let i=0;i<4;i++) ctx.fillRect(cx + 10 + i*58, GROUND - 46, 48, 38);
  ctx.fillStyle = '#9a6b40'; ctx.fillRect(cx - 8, GROUND - 64, 256, 10);
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.strokeRect(cx - 8, GROUND - 64, 256, 10);
  ctx.fillStyle = '#c9a13a'; ctx.beginPath(); ctx.arc(cx + 30, GROUND - 64, 9, Math.PI, 0); ctx.fill(); circle(cx + 30, GROUND - 75, 2.5);
  // floor
  ctx.fillStyle = '#8a6a4a'; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.strokeStyle = 'rgba(40,24,12,.3)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let y = GROUND + 14; y < H; y += 16){ ctx.moveTo(0, y); ctx.lineTo(W, y); }
  for (let r=0; r<5; r++) for (let x = wrap(ox + r*53, 110); x < W; x += 110){ ctx.moveTo(x, GROUND + r*16); ctx.lineTo(x, GROUND + r*16 + 14); }
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(0, GROUND, W, 6);
  // a rug by the displays
  ctx.fillStyle = s.awning[1]; ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(310 + ox, GROUND + 40, 180, 22, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  // the displays, one per item
  s.items.forEach((it, i) => {
    const x = DISPLAY_X[i] + ox, top = GROUND - 46, owned = Save.count(it.id), soldOut = !it.stack && owned > 0;
    ctx.fillStyle = '#5c4336'; ctx.fillRect(x - 30, top, 6, 46); ctx.fillRect(x + 24, top, 6, 46);
    ctx.fillStyle = s.awning[0]; ctx.fillRect(x - 36, top - 4, 72, 16);
    ctx.fillStyle = s.awning[1]; for (let j=0;j<4;j++) ctx.fillRect(x - 36 + j*18, top + 12, 9, 6);
    ctx.fillStyle = '#8a5a32'; ctx.fillRect(x - 38, top - 8, 76, 6);
    const bob = reduceMotion ? 0 : Math.sin(t*2 + i)*1.5;
    if (near && near.item === it && !panelOpen()){ const hg = ctx.createRadialGradient(x, top - 30, 2, x, top - 30, 40); hg.addColorStop(0, 'rgba(255,236,190,.5)'); hg.addColorStop(1, 'rgba(255,236,190,0)'); ctx.fillStyle = hg; circle(x, top - 30, 40); }
    itemIcon(ctx, it.id, x, top - 30 + bob, 1.05);
    // price tag, or an "Owned" ribbon
    ctx.fillStyle = soldOut ? '#5d8f4a' : '#f6ead6'; rr(x + 14, top - 64, soldOut ? 46 : 34, 16, 4); ctx.fill();
    ctx.fillStyle = soldOut ? '#f6ead6' : '#3a2616'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.textBaseline = 'middle';
    ctx.fillText(soldOut ? 'OWNED' : `${it.price}`, x + (soldOut ? 19 : 28), top - 56);
    if (!soldOut){ ctx.fillStyle = '#3d3226'; ctx.beginPath(); ctx.ellipse(x + 21, top - 56, 2.4, 4, 0, 0, 7); ctx.fill(); }
    ctx.textBaseline = 'alphabetic';
  });
  drawPlayer();
  const vg = ctx.createRadialGradient(W/2, H/2, 240, W/2, H/2, 560); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,12,6,.45)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
const shopSpots = () => {
  const s = currentShop, k = KEEPERS[s.keeper];
  return [
    { x:SHOP_DOOR, r:60, hit:[SHOP_DOOR - 45, SHOP_DOOR + 45], stand:SHOP_DOOR, gap:30, label:'Go back outside', open:() => leaveShop() },
    ...s.items.map((it, i) => ({ x:DISPLAY_X[i], r:48, hit:[DISPLAY_X[i] - 45, DISPLAY_X[i] + 45], stand:DISPLAY_X[i], gap:0, item:it, label:`Look at the ${it.name}`, open:() => openItem(it) })),
    { x:COUNTER_X - 40, r:50, hit:[COUNTER_X - 20, COUNTER_X + 240], stand:COUNTER_X - 40, gap:0, owner:true, label:`Talk to ${k.name}`, open:() => openShop(s) },
  ];
};

// ---------- secret places ----------
// found by clicking something in the village (or pressing E right beside it); nothing is marked.
// each hides a mystery for a secret quest to come.
const SECRET_FLAGS = { well:'secretWell', tree:'secretTree', cove:'secretCove' };
const secretsFound = () => ['well', 'tree', 'cove'].filter(k => Save.flag(SECRET_FLAGS[k])).length + (Save.flag('millFloor') || Save.flag('millChest') ? 1 : 0);
let currentSecret = null, toast = null;
function enterSecret(id){
  transition(() => {
    const first = !Save.flag(SECRET_FLAGS[id]);
    scene = 'secret'; currentSecret = SECRETS[id]; P.x = currentSecret.start; P.face = 1; P.vx = 0; camX = 0;
    if (first){ Save.setFlag(SECRET_FLAGS[id]); toast = { text:`Secret place found! (${secretsFound()} of 4)`, t:3.2 }; P.anim.happy = 3; }
  });
}
function leaveSecret(){ const back = currentSecret.back, to = currentSecret.backScene || 'village'; transition(() => { scene = to; if (to === 'meadow' && !meadow) meadow = newMeadowVisit(); currentSecret = null; P.x = back; P.face = 1; P.vx = 0; camX = clamp(P.x - W*.42, 0, (to === 'meadow' ? MEADOW_W : WORLD) - W); }); }
const secretPanel = document.getElementById('secretPanel');
document.getElementById('secretClose').addEventListener('click', closePanels);
function openMystery(title, text, foot = 'A secret for another day.'){
  closePanels(); P.target = null; pending = null; for (const k in keys) keys[k] = false;
  document.getElementById('secretFoot').textContent = foot;
  document.getElementById('secretTitle').textContent = title;
  document.getElementById('secretText').textContent = text;
  secretPanel.hidden = false; document.getElementById('secretClose').focus();
}
function crystal(x, y, h, col, ph){
  const glow = reduceMotion ? .5 : .4 + Math.sin(t*1.6 + ph)*.2;
  const g = ctx.createRadialGradient(x, y - h/2, 2, x, y - h/2, h*1.3); g.addColorStop(0, col.replace(')', `,${glow})`).replace('rgb', 'rgba')); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; circle(x, y - h/2, h*1.3);
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - h*.22, y); ctx.lineTo(x - h*.16, y - h*.8); ctx.lineTo(x, y - h); ctx.lineTo(x + h*.16, y - h*.8); ctx.lineTo(x + h*.22, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(x - h*.1, y - h*.1); ctx.lineTo(x - h*.06, y - h*.75); ctx.lineTo(x, y - h*.9); ctx.lineTo(x, y - h*.1); ctx.closePath(); ctx.fill();
}
function drawGrotto(){
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#15131f'); g.addColorStop(1, '#2e2a3e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // light falling from the well far above, and the rope back up
  const lg = ctx.createLinearGradient(0, 0, 0, GROUND); lg.addColorStop(0, 'rgba(255,236,200,.35)'); lg.addColorStop(1, 'rgba(255,236,200,0)');
  ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(130, 0); ctx.lineTo(190, 0); ctx.lineTo(240, GROUND); ctx.lineTo(80, GROUND); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f7e6c0'; ctx.beginPath(); ctx.ellipse(160, 0, 34, 12, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c9a36a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(160, 0); ctx.quadraticCurveTo(160 + (reduceMotion ? 0 : Math.sin(t)*4), 200, 160, GROUND - 6); ctx.stroke();
  ctx.fillStyle = '#8a6a4a'; ctx.fillRect(151, GROUND - 22, 18, 16);
  // rocky walls
  for (let i=0;i<14;i++){ ctx.fillStyle = i % 2 ? '#262233' : '#1d1a29'; circle(i*62 - 20, 10 + hash(i)*30, 60 + hash(i + 4)*30); }
  for (const [x, r] of [[-20, 180], [W + 20, 190]]){ ctx.fillStyle = '#1d1a29'; circle(x, 260, r); }
  // crystals
  for (const [x, h, c, ph] of [[290, 60, 'rgb(127,224,230)', 0], [318, 38, 'rgb(181,138,230)', 1], [262, 30, 'rgb(181,138,230)', 2], [520, 48, 'rgb(127,224,230)', 3], [548, 30, 'rgb(242,194,120)', 4], [760, 70, 'rgb(181,138,230)', 5], [735, 40, 'rgb(127,224,230)', 6]]) crystal(x, GROUND + 2, h, c, ph);
  for (const [x, y, h, c] of [[380, 40, 34, 'rgb(127,224,230)'], [610, 60, 28, 'rgb(181,138,230)']]){ ctx.save(); ctx.translate(x, y); ctx.scale(1, -1); crystal(0, 0, h, c, x); ctx.restore(); }
  // the round stone door, ringed with glowing marks
  const dx = 650, dy = GROUND - 80, near_ = Math.max(0, 1 - Math.abs(P.x - dx)/260);
  ctx.fillStyle = '#1d1a29'; circle(dx, dy, 96);
  if (Save.flag('wgWin_warp')){
    // the open doorway: a swirl of every color, and the stone door rolled off to one side
    for (let k=7;k>0;k--){ ctx.fillStyle = `hsl(${(t*40 + k*45) % 360},80%,${35 + k*6}%)`; circle(dx, dy, k*11); }
    ctx.save(); ctx.translate(dx, dy); ctx.rotate(reduceMotion ? 0 : t*2); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); for (let a = 0; a < 14; a += .3){ const r = a*5.5; a ? ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.moveTo(0, 0); } ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#5b566b'; ctx.beginPath(); ctx.ellipse(dx + 112, dy + 18, 24, 76, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(143,240,224,.5)'; for (let i=0;i<5;i++) ctx.fillRect(dx + 106, dy - 36 + i*20, 8, 4);
  } else {
  ctx.fillStyle = '#5b566b'; circle(dx, dy, 78); ctx.strokeStyle = '#3e3a4e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(dx, dy, 78, 0, 7); ctx.stroke();
  ctx.strokeStyle = '#4a4659'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(dx, dy, 44, 0, 7); ctx.moveTo(dx - 78, dy); ctx.lineTo(dx + 78, dy); ctx.stroke();
  const rg = reduceMotion ? .6 : .35 + near_*.5 + Math.sin(t*2)*.1, wp = warpProgress(), litN = Math.round(12*wp.open/wp.total);
  for (let i=0;i<12;i++){ const a = i/12*Math.PI*2 + (reduceMotion ? 0 : t*.1); ctx.fillStyle = i < litN ? `rgba(143,240,224,${Math.min(1, rg + .35)})` : 'rgba(143,240,224,.12)'; ctx.save(); ctx.translate(dx + Math.cos(a)*62, dy + Math.sin(a)*62); ctx.rotate(a); ctx.fillRect(-2, -6, 4, 12); ctx.fillRect(-5, -2, 10, 3); ctx.restore(); }
  }
  ctx.fillStyle = '#2a2638'; ctx.fillRect(dx - 80, GROUND - 4, 160, 8);
  // the floor and a still pool
  ctx.fillStyle = '#3a3448'; ctx.fillRect(0, GROUND, W, H - GROUND);
  for (let i=0;i<30;i++){ ctx.fillStyle = hash(i) > .5 ? '#443d55' : '#302a3e'; ctx.beginPath(); ctx.ellipse(hash(i + 9)*W, GROUND + 10 + hash(i + 3)*60, 6 + hash(i)*8, 3 + hash(i)*2, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(90,160,190,.45)'; ctx.beginPath(); ctx.ellipse(430, GROUND + 50, 110, 14, 0, 0, 7); ctx.fill();
  // water dripping from the ceiling
  for (let i=0;i<5;i++){ const x = 250 + i*120, y = wrap(t*160 + i*97, GROUND + 40); ctx.fillStyle = 'rgba(150,200,230,.6)'; ctx.beginPath(); ctx.ellipse(x, y, 1.5, 3, 0, 0, 7); ctx.fill(); }
  drawPlayer();
  const vg = ctx.createRadialGradient(W/2, H/2, 180, W/2, H/2, 520); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(6,4,12,.7)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
function drawHollow(){
  // inside the trunk: warm wood with growth rings
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(40,24,12,.3)'; ctx.lineWidth = 3;
  for (let r=60; r<700; r+=38){ ctx.beginPath(); ctx.ellipse(420, 170, r, r*.7, 0, 0, 7); ctx.stroke(); }
  // a round window high up, and its light
  ctx.fillStyle = 'rgba(255,220,160,.12)'; ctx.beginPath(); ctx.moveTo(560, 110); ctx.lineTo(600, 110); ctx.lineTo(700, GROUND + 40); ctx.lineTo(560, GROUND + 40); ctx.closePath(); ctx.fill();
  const sky = ctx.createLinearGradient(0, 80, 0, 140); sky.addColorStop(0, '#b88fb4'); sky.addColorStop(1, '#f2b98c');
  ctx.fillStyle = sky; circle(580, 110, 28); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(580, 110, 28, 0, 7); ctx.stroke();
  // pegs spiraling up toward a tiny round door near the top
  ctx.fillStyle = '#8a5a32'; for (let i=0;i<7;i++) ctx.fillRect(700 - (i % 2)*40, GROUND - 40 - i*44, 34, 8);
  ctx.fillStyle = '#4a3020'; circle(690, 56, 18); ctx.fillStyle = '#c9a13a'; circle(700, 58, 2.5);
  gateGlint(HOLLOW_GATE.x + 10, HOLLOW_GATE.y - 12);
  // the old map pinned to the wall
  const mx = 400, my = 190;
  ctx.save(); ctx.translate(mx, my); ctx.rotate(-.04);
  ctx.fillStyle = '#efe2c0'; ctx.fillRect(-70, -50, 140, 100); ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 2; ctx.strokeRect(-70, -50, 140, 100);
  ctx.fillStyle = '#9cc2d6'; ctx.fillRect(-64, -44, 128, 88);
  ctx.fillStyle = 'rgba(255,255,255,.7)'; for (const [cx, cy] of [[-30, -20], [-10, -24], [20, 22], [40, 18]]) circle(cx, cy, 10);
  ctx.fillStyle = '#8fa98a'; ctx.beginPath(); ctx.ellipse(8, 2, 30, 18, .2, 0, 7); ctx.fill();
  ctx.strokeStyle = '#b8453d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(20, 6); ctx.moveTo(20, -4); ctx.lineTo(10, 6); ctx.stroke();
  ctx.fillStyle = '#b8453d'; circle(0, -50, 4);
  ctx.restore();
  if (near && near.x === 400 && !panelOpen()){ ctx.strokeStyle = 'rgba(255,236,190,.6)'; ctx.lineWidth = 3; ctx.strokeRect(mx - 76, my - 56, 152, 112); }
  // bits of home: a little bookshelf, mushrooms, a lantern
  ctx.fillStyle = '#4a3020'; ctx.fillRect(220, GROUND - 110, 90, 110);
  for (let r=0;r<3;r++) for (let i=0;i<6;i++){ ctx.fillStyle = ['#b8453d', '#3f6b5a', '#c9a13a', '#5d6f9e'][(r + i) % 4]; ctx.fillRect(226 + i*14, GROUND - 104 + r*36, 10, 28 - (i % 3)*3); }
  for (const [x, h, c] of [[500, 22, '#d0452f'], [522, 14, '#e8dcc6'], [770, 18, '#d0452f']]){ ctx.fillStyle = '#efe2c0'; ctx.fillRect(x - 3, GROUND - h, 6, h); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, GROUND - h, 12, 8, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; circle(x - 4, GROUND - h - 4, 1.8); }
  const lx = 320, lgl = ctx.createRadialGradient(lx, 90, 2, lx, 90, 80); lgl.addColorStop(0, 'rgba(255,214,130,.4)'); lgl.addColorStop(1, 'rgba(255,214,130,0)');
  ctx.fillStyle = lgl; circle(lx, 90, 80); ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, 80); ctx.stroke();
  ctx.fillStyle = '#ffe27a'; ctx.fillRect(lx - 7, 80, 14, 18);
  // the way back out
  const dg = ctx.createLinearGradient(0, GROUND - 110, 0, GROUND); dg.addColorStop(0, '#b88fb4'); dg.addColorStop(1, '#6f9474');
  ctx.fillStyle = dg; ctx.beginPath(); ctx.moveTo(60, GROUND); ctx.lineTo(60, GROUND - 70); ctx.quadraticCurveTo(90, GROUND - 120, 120, GROUND - 70); ctx.lineTo(120, GROUND); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 6; ctx.stroke();
  // curved inner walls
  for (const [x, r] of [[-60, 200], [W + 60, 200]]){ ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.ellipse(x, 240, r*.5, 320, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#5c4336'; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.strokeStyle = 'rgba(40,24,12,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let r=40; r<500; r+=30){ ctx.moveTo(400 - r, GROUND + 40); ctx.quadraticCurveTo(400, GROUND + 40 + r*.08, 400 + r, GROUND + 40); } ctx.stroke();
  drawPlayer();
  const vg = ctx.createRadialGradient(W/2, H/2, 200, W/2, H/2, 520); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,4,.55)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
function drawCove(){
  // dusk beyond the bridge's arch
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND); sky.addColorStop(0, '#5b6aa8'); sky.addColorStop(1, '#f2b98c');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#6f8f7a'; ctx.beginPath(); ctx.moveTo(0, GROUND - 10); for (let x=0;x<=W;x+=20) ctx.lineTo(x, GROUND - 30 - Math.sin(x*.01)*14); ctx.lineTo(W, GROUND); ctx.lineTo(0, GROUND); ctx.fill();
  // the water
  const wg = ctx.createLinearGradient(0, GROUND - 10, 0, H); wg.addColorStop(0, '#9cc2d6'); wg.addColorStop(1, '#3f6f93');
  ctx.fillStyle = wg; ctx.fillRect(0, GROUND - 10, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let i=0;i<10;i++){ const y = GROUND + i*8, off = wrap((reduceMotion ? 0 : t*16) + i*41, 70); for (let x = off; x < W; x += 70){ ctx.moveTo(x, y); ctx.lineTo(x + 18, y); } }
  ctx.stroke();
  // the underside of the bridge overhead
  ctx.fillStyle = '#8a8072'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 250); ctx.ellipse(W/2, 250, W/2, 190, 0, 0, Math.PI, true); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(60,50,40,.4)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let a = Math.PI; a < Math.PI*2; a += Math.PI/14){ ctx.moveTo(W/2 + Math.cos(a)*W/2, 250 + Math.sin(a)*190); ctx.lineTo(W/2 + Math.cos(a)*(W/2 + 60), 250 + Math.sin(a)*250); } ctx.stroke();
  ctx.strokeStyle = '#6f675c'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(W/2, 250, W/2, 190, 0, Math.PI, 0); ctx.stroke();
  // light rippling on the stone
  for (let i=0;i<8;i++){ const x = 200 + i*55 + Math.sin(t + i)*10, y = 90 + Math.sin(t*1.3 + i*2)*8 + (i % 3)*14; ctx.fillStyle = 'rgba(220,240,255,.18)'; ctx.beginPath(); ctx.ellipse(x, y, 16, 3, 0, 0, 7); ctx.fill(); }
  // stone ledge to walk on, and steps back up
  ctx.fillStyle = '#9a9186'; ctx.fillRect(0, GROUND, 600, 26); ctx.fillStyle = '#b8b0a2'; ctx.fillRect(0, GROUND, 600, 6);
  ctx.fillStyle = '#7d7466'; ctx.fillRect(0, GROUND + 26, 600, 30);
  for (let i=0;i<5;i++){ ctx.fillStyle = i % 2 ? '#a89f92' : '#9a9186'; ctx.fillRect(0, GROUND - 22 - i*22, 110 - i*18, 22); }
  // mooring post and the little boat
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(588, GROUND - 40, 12, 66);
  const by = GROUND + 30 + (reduceMotion ? 0 : Math.sin(t*1.5)*2), bx = 680;
  ctx.strokeStyle = '#c9a36a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(596, GROUND - 30); ctx.quadraticCurveTo(620, by, bx - 60, by - 6); ctx.stroke();
  ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.moveTo(bx - 76, by - 12); ctx.lineTo(bx + 80, by - 12); ctx.quadraticCurveTo(bx + 70, by + 10, bx + 40, by + 14); ctx.lineTo(bx - 60, by + 14); ctx.quadraticCurveTo(bx - 76, by + 4, bx - 76, by - 12); ctx.fill();
  ctx.fillStyle = '#c9854a'; ctx.fillRect(bx - 76, by - 16, 156, 5);
  ctx.fillStyle = '#f6ead6'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('DRAGONFLY', bx, by + 4); ctx.textAlign = 'left';
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(bx + 50, by - 56, 4, 44);
  const lg = ctx.createRadialGradient(bx + 52, by - 60, 2, bx + 52, by - 60, 40); lg.addColorStop(0, 'rgba(255,220,130,.6)'); lg.addColorStop(1, 'rgba(255,220,130,0)');
  ctx.fillStyle = lg; circle(bx + 52, by - 60, 40); ctx.fillStyle = '#ffe27a'; ctx.fillRect(bx + 45, by - 68, 14, 14);
  // fireflies under the arch
  for (let i=0;i<10;i++){ const x = 250 + wrap(i*83 + t*12, 500), y = 200 + Math.sin(t*1.4 + i)*30 + (i % 4)*20, a = .3 + .6*Math.max(0, Math.sin(t*2 + i*3)); ctx.fillStyle = `rgba(255,246,190,${a})`; circle(x, y, 2.4); }
  drawPlayer();
}
const SECRETS = {
  well: { start:230, back:1020, draw:drawGrotto, max:560, spots:[
    { x:160, r:50, hit:[130, 190], stand:170, gap:0, label:'Climb back up the rope', open:() => leaveSecret() },
    { x:560, r:60, hit:[560, 750], stand:560, gap:0, get label(){ const w = warpProgress(); return Save.flag('wgWin_warp') ? 'Step through the stone door into THE WARP' : w.open >= w.total ? 'Push the stone door' : 'Look at the stone door'; }, open:() => {
        // the door stays shut until every other realm is open (each one lights one of its marks)
        const w = warpProgress();
        if (!Save.flag('wgWin_warp') && w.open < w.total){ openMystery('The Stone Door', `A huge round door of stone, sealed tight. Around its edge, ${w.open} of its ${w.total} marks are glowing, one for every realm you’ve opened. You push, but it won’t budge… not until every mark is lit.`, `${w.total - w.open} realm${w.total - w.open === 1 ? '' : 's'} still to open.`); return; }
        // the first push rolls the door aside; after that it's a doorway into THE WARP
        if (!Save.flag('wgWin_warp')){ Save.setFlag('wgWin_warp'); P.anim.happy = 3; openMystery('The Stone Door', 'You put both paws on the stone and push. The glowing marks blaze brighter and brighter… and with a deep rumble, the great round door rolls aside. Behind it, colors swirl like a whirlpool. THE WARP is open!', 'Step through whenever you’re ready.'); }
        else warpToWorld('warp', 'well'); } },
  ]},
  tree: { start:150, get back(){ return M_TREE + 30; }, backScene:'meadow', draw:drawHollow, max:740, spots:[
    { x:90, r:50, hit:[55, 125], stand:100, gap:0, label:'Go back outside', open:() => leaveSecret() },
    { x:400, r:70, hit:[325, 475], stand:400, gap:0, label:'Look at the old map', open:() => openMystery('The Old Map', 'A map of somewhere far past the hills: an island ringed by clouds, with a tiny X drawn in red. In the corner, someone has written: “When the lanterns are lit, the way will open.”') },
  ]},
  cove: { start:170, back:3700, draw:drawCove, max:570, spots:[
    { x:70, r:60, hit:[0, 120], stand:80, gap:0, label:'Climb back up to the bridge', open:() => leaveSecret() },
    { x:560, r:50, hit:[560, 780], stand:560, gap:0, label:'Take the Dragonfly out', open:() => transition(() => startBoat()) },
  ]},
};

// ---------- the Wildflower Meadow, past the Meadow Gate ----------
const MEADOW_W = 3500, M_BUSH = 520, M_POND = 1000, M_SCARECROW = 1450, M_CLOVER = 1900, M_LOG = 2350, M_TREE = 2780, M_SPYGLASS = 3200;
let meadow = null, pops = [];
// a fresh meadow each visit: new seeds on the ground, the bush full of berries again
function newMeadowVisit(){
  const r = rng(Math.floor(Math.random()*1e6) + 1), seeds = [], avoid = [M_BUSH, M_POND, M_SCARECROW, M_CLOVER, M_LOG, M_TREE, M_SPYGLASS];
  while (seeds.length < 16){ const x = 300 + r()*3050; if (avoid.every(a => Math.abs(a - x) > 70) && seeds.every(sd => Math.abs(sd.x - x) > 60)) seeds.push({ x, got:false, ph:r()*6 }); }
  const flies = []; for (let i=0;i<9;i++) flies.push({ x:300 + r()*2800, y:250 + r()*110, ph:r()*6, col:['#f2c230', '#e79ab8', '#9a86d8', '#fff6d0'][i % 4], vx:0 });
  return { seeds, berries:true, frog:{ state:'sit', t:0, y:0 }, flies, bunny:{ x:-200, t:3 } };
}
function enterMeadow(){ transition(() => { scene = 'meadow'; meadow = newMeadowVisit(); P.x = 220; P.face = 1; P.vx = 0; camX = 0; toast = { text:'The Wildflower Meadow', t:2.6 }; }); }
function leaveMeadow(){ transition(() => { scene = 'village'; P.x = GATE_X - 70; P.face = -1; P.vx = 0; camX = clamp(P.x - W*.42, 0, WORLD - W); }); }
function findThing(id, title, text, already){
  if (!Save.count(id)){ Save.give(id); P.anim.happy = 3; openMystery(title, text, 'Added to your satchel!'); }
  else openMystery(title, already, '');
}
function updateMeadow(dt){
  const m = meadow;
  for (const sd of m.seeds) if (!sd.got && Math.abs(sd.x - P.x) < 20){ sd.got = true; Save.addSeeds(1); P.anim.chew = .4; pops.push({ x:sd.x, y:GROUND - 50, txt:'+1 seed', life:1 }); }
  // the frog hops into the pond if you get close, and climbs back out once you've gone
  const f = m.frog, fx = M_POND + 40; f.t += dt;
  if (f.state === 'sit' && Math.abs(P.x - fx) < 130){ f.state = 'jump'; f.t = 0; }
  else if (f.state === 'jump' && f.t > .6){ f.state = 'gone'; f.t = 0; }
  else if (f.state === 'gone' && f.t > 3 && Math.abs(P.x - fx) > 260){ f.state = 'sit'; f.t = 0; }
  // butterflies drift about, and flutter away from the chinchilla
  for (const b of m.flies){ const d = b.x - P.x; if (Math.abs(d) < 90) b.vx += Math.sign(d || 1)*120*dt; b.vx *= Math.pow(.2, dt); b.x += (b.vx + Math.sin(t*.7 + b.ph)*14)*dt; }
  // now and then a bunny hops across far behind
  const bn = m.bunny; // (in screen space, far in the background)
  if (bn.x < -100){ bn.t -= dt; if (bn.t <= 0){ bn.x = -40; bn.t = 9 + Math.random()*6; } }
  else { bn.x += 70*dt; if (bn.x > W + 60) bn.x = -200; }
  pops.forEach(p => { p.y -= 36*dt; p.life -= dt; }); pops = pops.filter(p => p.life > 0);
}
function drawMeadow(){
  const m = meadow, sx = wx => wx - camX;
  drawSky();
  ridge(.12, 300, [[18, .004, 1], [8, .011, 2]], '#b3a2c8');
  ridge(.3, 335, [[14, .006, 4], [6, .017, 0]], '#8fa08e');
  // the bunny hopping far off
  if (m.bunny.x > -100){ const bx = m.bunny.x, hop = Math.abs(Math.sin(t*6))*10, by = 344 - hop;
    ctx.fillStyle = '#d8c8b0'; ctx.beginPath(); ctx.ellipse(bx, by, 9, 6, 0, 0, 7); ctx.fill(); circle(bx + 7, by - 5, 4.5);
    ctx.beginPath(); ctx.ellipse(bx + 6, by - 13, 1.8, 5, -.2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(bx + 9, by - 12, 1.8, 5, .2, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; circle(bx - 9, by - 1, 3); }
  treeLine(.55, 110, GROUND - 6, ['#5c7d62', '#4f6e58'], true);
  // the hill with the spyglass, behind the path
  { const x = sx(M_SPYGLASS + 60); if (onScreen(x, 320)){ ctx.fillStyle = '#7fa47e'; ctx.beginPath(); ctx.ellipse(x, GROUND, 300, 80, 0, Math.PI, 0); ctx.fill(); } }
  // grass, a worn dirt path, and little stones
  ctx.fillStyle = '#6f9474'; ctx.fillRect(0, GROUND - 14, W, H);
  ctx.fillStyle = '#62886a'; for (let x = -wrap(camX, 60); x < W; x += 60) ctx.fillRect(x, GROUND + 34, 30, H);
  ctx.fillStyle = '#b89a74'; ctx.beginPath(); ctx.moveTo(0, GROUND + 4); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, GROUND + 4 + Math.sin((x + camX)*.01)*3); for (let x = W; x >= 0; x -= 20) ctx.lineTo(x, GROUND + 28 + Math.sin((x + camX)*.013)*3); ctx.closePath(); ctx.fill();
  for (let i = Math.floor(camX/45) - 1; i*45 - camX < W; i++){ if (hash(i*3) > .6){ ctx.fillStyle = '#9a8a70'; ctx.beginPath(); ctx.ellipse(i*45 - camX + hash(i)*30, GROUND + 12 + hash(i + 2)*12, 4, 2.5, 0, 0, 7); ctx.fill(); } }
  // the gate back to the village
  { const x = sx(120); if (onScreen(x, 120)){
    for (const px of [x - 60, x + 36]){ ctx.fillStyle = '#9a9186'; ctx.fillRect(px, GROUND - 110, 24, 110); ctx.fillStyle = '#b8b0a2'; ctx.fillRect(px - 4, GROUND - 116, 32, 9); }
    ctx.fillStyle = '#4a3020'; rr(x - 58, GROUND - 158, 116, 26, 6); ctx.fill();
    ctx.fillStyle = '#f6ead6'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('← Thistledown', x, GROUND - 145); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 46, GROUND - 132); ctx.lineTo(x - 48, GROUND - 116); ctx.moveTo(x + 46, GROUND - 132); ctx.lineTo(x + 48, GROUND - 116); ctx.stroke(); } }
  // berry bush
  { const x = sx(M_BUSH); if (onScreen(x, 90)){
    for (const [dx, dy, r, c] of [[-30, -26, 30, '#4f6e58'], [26, -24, 28, '#4f6e58'], [0, -44, 34, '#5c7d62'], [-6, -20, 30, '#5c7d62']]){ ctx.fillStyle = c; circle(x + dx, GROUND + dy, r); }
    if (m.berries) for (let i=0;i<14;i++){ const bx = x - 40 + hash(i)*80, by = GROUND - 60 + hash(i + 5)*50; ctx.fillStyle = '#8a2a5a'; circle(bx, by, 4); ctx.fillStyle = 'rgba(255,255,255,.5)'; circle(bx - 1.2, by - 1.2, 1.2); } } }
  // pond with lily pads and a frog
  { const x = sx(M_POND); if (onScreen(x, 160)){
    const pg = ctx.createLinearGradient(0, GROUND - 22, 0, GROUND + 4); pg.addColorStop(0, '#9cc2d6'); pg.addColorStop(1, '#5f8fb0');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(x, GROUND - 8, 130, 16, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i=0;i<4;i++){ const rx = x - 80 + i*50 + Math.sin(t + i)*6; ctx.moveTo(rx, GROUND - 8 + (i % 2)*5); ctx.lineTo(rx + 16, GROUND - 8 + (i % 2)*5); } ctx.stroke();
    for (const [dx, dy] of [[-60, -10], [40, -6], [80, -12]]){ ctx.fillStyle = '#5d8f4a'; ctx.beginPath(); ctx.moveTo(x + dx, GROUND + dy); ctx.ellipse(x + dx, GROUND + dy, 14, 4.5, 0, .3, Math.PI*2 - .3); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#f4b6c8'; circle(x - 56, GROUND - 13, 4);
    const f = m.frog, fx = x + 40;
    if (f.state === 'sit' || f.state === 'jump'){
      const k = f.state === 'jump' ? Math.min(1, f.t/.6) : 0, jx = fx + k*50, jy = GROUND - 10 - Math.sin(k*Math.PI)*30 + k*6;
      if (k < .95){ ctx.fillStyle = '#5da04a'; ctx.strokeStyle = '#24401c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(jx, jy - 7, 10, 7, 0, 0, 7); ctx.fill(); ctx.stroke();
        for (const ex of [-5, 4]){ ctx.fillStyle = '#5da04a'; circle(jx + ex, jy - 14, 3.6); ctx.fillStyle = '#1e1a16'; circle(jx + ex, jy - 14, 1.6); } }
    }
    if (f.state === 'gone' && f.t < 1){ ctx.strokeStyle = `rgba(255,255,255,${.6*(1 - f.t)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(fx + 50, GROUND - 6, 8 + f.t*30, 3 + f.t*8, 0, 0, 7); ctx.stroke(); }
    ctx.strokeStyle = '#4f6e3a'; ctx.lineWidth = 2.5; for (let i=0;i<5;i++){ const rx = x + 110 + i*5; ctx.beginPath(); ctx.moveTo(rx, GROUND); ctx.lineTo(rx + Math.sin(t + i)*2, GROUND - 34 - (i % 2)*8); ctx.stroke(); } } }
  // the scarecrow, with a crow on its arm
  { const x = sx(M_SCARECROW); if (onScreen(x, 90)){
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 4, GROUND - 124, 8, 124); ctx.fillRect(x - 50, GROUND - 92, 100, 6);
    ctx.fillStyle = '#5d6f9e'; ctx.beginPath(); ctx.moveTo(x - 46, GROUND - 96); ctx.lineTo(x + 46, GROUND - 96); ctx.lineTo(x + 26, GROUND - 40); ctx.lineTo(x - 26, GROUND - 40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e0708f'; ctx.fillRect(x - 18, GROUND - 76, 12, 12); ctx.fillStyle = '#c9a13a'; circle(x + 12, GROUND - 60, 4);
    ctx.strokeStyle = '#e8c860'; ctx.lineWidth = 2; ctx.beginPath(); for (const sd of [-1, 1]) for (let i=0;i<4;i++){ ctx.moveTo(x + sd*48, GROUND - 92); ctx.lineTo(x + sd*(54 + i*2), GROUND - 86 + i*4); } for (let i=-2;i<=2;i++){ ctx.moveTo(x + i*6, GROUND - 40); ctx.lineTo(x + i*8, GROUND - 30); } ctx.stroke();
    ctx.fillStyle = '#d8c090'; circle(x, GROUND - 116, 18);
    ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 9, GROUND - 120); ctx.lineTo(x - 3, GROUND - 120); ctx.moveTo(x + 3, GROUND - 120); ctx.lineTo(x + 9, GROUND - 120); ctx.moveTo(x - 8, GROUND - 109); ctx.quadraticCurveTo(x, GROUND - 104, x + 8, GROUND - 109); ctx.stroke();
    ctx.fillStyle = '#c9a36a'; ctx.beginPath(); ctx.ellipse(x, GROUND - 130, 30, 7, 0, 0, 7); ctx.fill(); ctx.fillRect(x - 14, GROUND - 146, 28, 16);
    const flap = Math.sin(t*1.3) > .9 && !reduceMotion, cx = x + 40, cy = GROUND - 98;
    ctx.fillStyle = '#26222a'; ctx.beginPath(); ctx.ellipse(cx, cy - 6, 9, 7, 0, 0, 7); ctx.fill(); circle(cx + 7, cy - 13, 5);
    ctx.fillStyle = '#f2a03a'; ctx.beginPath(); ctx.moveTo(cx + 11, cy - 14); ctx.lineTo(cx + 17, cy - 12); ctx.lineTo(cx + 11, cy - 11); ctx.fill();
    if (flap){ ctx.fillStyle = '#26222a'; ctx.beginPath(); ctx.moveTo(cx - 2, cy - 8); ctx.lineTo(cx - 16, cy - 24); ctx.lineTo(cx + 4, cy - 10); ctx.fill(); } } }
  // the hollow log
  { const x = sx(M_LOG); if (onScreen(x, 100)){
    ctx.fillStyle = '#7a5230'; rr(x - 76, GROUND - 38, 152, 38, 18); ctx.fill();
    ctx.strokeStyle = 'rgba(40,24,12,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=0;i<4;i++){ ctx.moveTo(x - 50 + i*30, GROUND - 34); ctx.lineTo(x - 40 + i*30, GROUND - 6); } ctx.stroke();
    ctx.fillStyle = '#a4845a'; ctx.beginPath(); ctx.ellipse(x - 72, GROUND - 19, 12, 19, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.ellipse(x - 72, GROUND - 19, 8, 14, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6f9474'; ctx.beginPath(); ctx.ellipse(x + 10, GROUND - 38, 50, 6, 0, Math.PI, 0); ctx.fill();
    for (const [dx, h] of [[30, 12], [44, 8]]){ ctx.fillStyle = '#efe2c0'; ctx.fillRect(x + dx - 2, GROUND - 38 - h, 4, h); ctx.fillStyle = '#d0452f'; ctx.beginPath(); ctx.ellipse(x + dx, GROUND - 38 - h, 8, 5, 0, Math.PI, 0); ctx.fill(); } } }
  drawOldTree(M_TREE);
  // the spyglass on its tripod, with a bench
  { const x = sx(M_SPYGLASS); if (onScreen(x, 120)){
    ctx.fillStyle = '#8a5a32'; ctx.fillRect(x + 60, GROUND - 30, 70, 8); ctx.fillRect(x + 64, GROUND - 22, 6, 22); ctx.fillRect(x + 120, GROUND - 22, 6, 22); ctx.fillRect(x + 60, GROUND - 52, 70, 6);
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, GROUND - 60); ctx.lineTo(x - 18, GROUND); ctx.moveTo(x, GROUND - 60); ctx.lineTo(x + 16, GROUND); ctx.moveTo(x, GROUND - 60); ctx.lineTo(x, GROUND); ctx.stroke();
    ctx.save(); ctx.translate(x, GROUND - 64); ctx.rotate(-.35); ctx.fillStyle = '#c9a13a'; rr(-26, -6, 52, 12, 4); ctx.fill(); ctx.fillStyle = '#b8862a'; ctx.fillRect(10, -8, 18, 16); ctx.fillStyle = '#8ab8d8'; circle(28, 0, 6); ctx.restore(); } }
  // the four-leaf clover hides in a clover patch (only a rare glint gives it away)
  { const x = sx(M_CLOVER); if (onScreen(x, 60)){
    for (let i=0;i<22;i++){ const cx = x - 40 + hash(i*7)*80, cy = GROUND + 2 + hash(i*11)*10; ctx.fillStyle = i % 3 ? '#4f8a4a' : '#5d9b4a'; for (let l=0;l<3;l++){ const a = l/3*Math.PI*2 + i; circle(cx + Math.cos(a)*2.6, cy + Math.sin(a)*2.2, 2.6); } }
    if (!Save.count('clover4')){ const cx = x + 6, cy = GROUND + 6; ctx.fillStyle = '#6fb05a'; for (let l=0;l<4;l++){ const a = l/4*Math.PI*2 + .6; circle(cx + Math.cos(a)*2.8, cy + Math.sin(a)*2.4, 2.8); }
      const tw = Math.sin(t*.9); if (tw > .96 && !reduceMotion){ ctx.fillStyle = `rgba(255,250,210,${(tw - .96)*25})`; circle(cx + 3, cy - 4, 2.5); } } } }
  // seeds on the ground
  for (const sd of m.seeds){ if (sd.got) continue; const x = sx(sd.x); if (!onScreen(x, 20)) continue;
    ctx.save(); ctx.translate(x, GROUND + 4 + Math.sin(t*3 + sd.ph)*2); ctx.rotate(Math.sin(t*2 + sd.ph)*.3);
    ctx.fillStyle = '#3d3226'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 8, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#efe2b4'; for (const q of [-2.5, 0, 2.5]) ctx.fillRect(q - .6, -6, 1.2, 12); ctx.restore(); }
  drawPlayer();
  // wildflowers in the foreground
  for (let i = Math.floor(camX*1.15/34) - 1; i*34 - camX*1.15 < W + 34; i++){
    const x = i*34 - camX*1.15 + hash(i)*20, h = 20 + hash(i + 4)*26;
    ctx.strokeStyle = '#4f7a4a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + Math.sin(t + i)*2, H - h); ctx.stroke();
    const c = ['#9a86d8', '#e79ab8', '#f2c230', '#fff6d0', '#a487c6'][i % 5];
    if (i % 5 === 0 || i % 5 === 4){ ctx.fillStyle = c; for (let b=0;b<4;b++) circle(x + Math.sin(t + i)*2, H - h + b*5, 2.6); }
    else { ctx.fillStyle = c; for (let p=0;p<5;p++){ const a = p/5*Math.PI*2; circle(x + Math.sin(t + i)*2 + Math.cos(a)*3.4, H - h + Math.sin(a)*3.4, 2.6); } ctx.fillStyle = '#f2c230'; circle(x + Math.sin(t + i)*2, H - h, 1.8); }
  }
  // butterflies
  for (const b of m.flies){ const x = sx(b.x); if (!onScreen(x, 20)) continue; const y = b.y + Math.sin(t*2 + b.ph)*14, fl = Math.abs(Math.sin(t*14 + b.ph));
    ctx.fillStyle = b.col; ctx.beginPath(); ctx.ellipse(x - 4*fl, y, 5*fl + 1, 4, -.3, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 4*fl, y, 5*fl + 1, 4, .3, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2616'; ctx.fillRect(x - .8, y - 4, 1.6, 8); }
  // "+1 seed"
  ctx.font = '700 15px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
  for (const p of pops){ ctx.globalAlpha = Math.max(0, p.life); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,33,24,.75)'; ctx.strokeText(p.txt, sx(p.x), p.y); ctx.fillStyle = '#fff6e4'; ctx.fillText(p.txt, sx(p.x), p.y); }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
const MEADOW_SPOTS = [
  { x:120, r:80, hit:[50, 190], stand:150, gap:0, label:'Go back to the village', open:() => leaveMeadow() },
  { x:M_BUSH, r:75, hit:[M_BUSH - 70, M_BUSH + 70], stand:M_BUSH - 60, gap:0, label:'Pick some berries', open:() => {
      if (meadow.berries){ meadow.berries = false; Save.give('wildberries'); P.anim.chew = 1; P.anim.happy = 2; openMystery('Wild Berries', 'You pick a handful of ripe berries. The chinchilla sneaks one right away!', 'Added to your satchel!'); }
      else openMystery('Berry Bush', 'You picked all the ripe ones. More will grow by your next visit.', ''); } },
  { x:M_POND, r:95, hit:[M_POND - 130, M_POND + 130], stand:M_POND - 60, gap:0, label:'Look into the pond', open:() => openMystery('The Pond', 'Tiny fish dart between the lily pads. Down at the very bottom, something round and golden glints in the mud, just out of reach.') },
  { x:M_SCARECROW, r:70, hit:[M_SCARECROW - 55, M_SCARECROW + 55], stand:M_SCARECROW - 40, gap:0, label:'Check the scarecrow’s pockets', open:() => findThing('button', 'The Scarecrow', 'You reach into the scarecrow’s coat pocket and find a shiny brass button. The crow on his arm gives you a look.', 'Just straw in his pockets now. The crow is still watching you.') },
  { x:M_CLOVER, r:22, hit:[M_CLOVER - 45, M_CLOVER + 45], hitY:[GROUND - 30, GROUND + 26], stand:M_CLOVER, gap:0, hidden:true, label:'', open:() => findThing('clover4', 'A Four-Leaf Clover!', 'Down among the ordinary clover, one has four leaves. You carefully pick it.', 'Just ordinary three-leaf clover here now.') },
  { x:M_LOG, r:80, hit:[M_LOG - 80, M_LOG + 80], stand:M_LOG - 100, gap:0, label:'Peek inside the hollow log', open:() => findThing('pebble', 'The Hollow Log', 'Something sparkles in the dark inside the log. It’s a smooth, shiny pebble!', 'A sleepy beetle blinks at you from inside the log, then goes back to sleep.') },
  // the knothole: no prompt, just click it (or press E right beside it)
  { x:M_TREE, r:30, hit:[M_TREE - 22, M_TREE + 30], hitY:[GROUND - 90, GROUND - 20], stand:M_TREE, gap:0, hidden:true, label:'', open:() => enterSecret('tree') },
  { x:M_SPYGLASS, r:70, hit:[M_SPYGLASS - 40, M_SPYGLASS + 40], stand:M_SPYGLASS - 30, gap:0, label:'Look through the spyglass', open:() => openMystery('The Spyglass', 'Far past the hills, an island floats in a ring of clouds. You could almost swear there are tiny lanterns glowing on it.') },
];

// ---------- warp holes to other worlds ----------
// in every run of a game, collecting its three special items makes a disguised warp hole
// appear up ahead in that game (see game code, balloon.js and boat.js):
//   Burrow Bound, 3 golden acorns   -> a tropical flower floating in the meadow -> the Golden Jungle
//   Up, Up and Away, 3 sky lanterns  -> a soft white cloud among the storm clouds -> the Starry Nebula
//   Row the Dragonfly, 3 glow lilies -> the moon reflected on the dusk river     -> the Moonlit Lake
// The games call warpToWorld() and the world opens here, in the village screen.
// each world is drawn in layers, has its own little residents and things to try,
// and one keepsake to find for the satchel. (No quests yet.)
const WORLDS = {
  jungle: { name:'The Golden Jungle', w:2950, hub:() => ({ x:J_HEAD, y:GROUND - 150 }),
    init:() => ({ parrots:[{ x:560, y:GROUND - 196, col:'#d0452f' }, { x:620, y:GROUND - 190, col:'#3f7ad0' }, { x:1520, y:GROUND - 206, col:'#f2c230' }].map(p => ({ ...p, fly:0, hx:p.x, hy:p.y })),
      flowers:[430, 1330, 1700].map(x => ({ x, open:0 })) }),
    draw:() => drawJungle(), update:dt => updateJungle(dt), spots:() => jungleSpots() },
  nebula: { name:'The Starry Nebula', w:2750, float:true, hub:() => ({ x:N_CHIMES[1], y:GROUND - 60 }),
    init:() => ({ lit:[0, 0, 0, 0, 0], falling:null, landed:false, chime:[0, 0], shoot:{ t:2, x:0, y:0, life:0 },
      starlings:[0, 1, 2, 3, 4].map(i => ({ x:260 + i*40, y:GROUND - 120 - i*12, ph:i*1.3 })) }),
    draw:() => drawNebula(), update:dt => updateNebula(dt), spots:() => nebulaSpots() },
  moonlake: { name:'The Moonlit Lake', w:3400, hub:() => ({ x:L_CABIN2, y:GROUND - 60 }), inside:'lakecabin',
    init:() => ({ fish:{ t:2, x:0, k:1 }, hoot:0, fire:0 }),
    draw:() => drawMoonlake(), update:dt => updateMoonlake(dt), spots:() => moonlakeSpots() },
};
let currentWorld = null, currentWorldId = null, worldReturn = null, ws = null;
// called by a game when you go through its warp hole; `from` is where that game started,
// which is also where the warp home will take you
const WARP_HOMES = {
  windmill: () => ({ scene:'mill', x:HATCH_X }),
  cove:     () => ({ scene:'secret', secret:'cove', x:520 }),
  square:   () => ({ scene:'village', x:BOARD_X }),
  cafe:     () => ({ scene:'secret', secret:'firstcabin', world:'moonlake', x:450 }),
  hq:       () => ({ scene:'secret', secret:'hq', x:400 }),
  well:     () => ({ scene:'secret', secret:'well', x:590 }),
};
// lose a world's game and you land back in Thistledown, near where you set off from
const THISTLEDOWN_SPOTS = { windmill:() => WINDMILL_X + 70, cove:() => BR.x0 - 30, square:() => BOARD_X - 60, cafe:() => BOARD_X - 60 };
window.returnToThistledown = (from, gameId) => {
  closePanels(); climbing = null;
  // losing Neon Beats after Glow's warp puts you back in the Moonlit Café
  if (from === 'cafe'){
    currentWorld = WORLDS.moonlake; currentWorldId = 'moonlake'; ws = currentWorld.init(); currentShop = null;
    scene = 'secret'; currentSecret = SECRETS.firstcabin; P.x = 450; P.face = 1; P.vx = 0; P.target = null; pending = null; camX = 0;
    toast = { text:'Back at the Moonlit Caf\u00e9', t:2.2 };
    fadeA = 1; fadeDir = -1; fadeWarp = true; fadeMid = null; showScreen(screenEl); return;
  }
  // losing a newer realm's game puts you back in the Portal HQ, in front of its portal
  if (from === 'hq'){
    currentWorld = null; currentWorldId = null; ws = null; currentShop = null;
    scene = 'secret'; currentSecret = SECRETS.hq; P.x = (HQ_PORTALS.find(p => p.id === portalId(gameId)) || { x:400 }).x; P.face = 1; P.vx = 0; P.target = null; pending = null; camX = 0;
    toast = { text:'Back in the Portal HQ', t:2.2 };
    fadeA = 1; fadeDir = -1; fadeWarp = true; fadeMid = null; showScreen(screenEl); return;
  }
  // the balloon (inside the windmill) and the boat (in the Boat Cove): back to exactly where that game started
  if (from === 'windmill' || from === 'cove'){
    const home = WARP_HOMES[from](); currentWorld = null; currentWorldId = null; ws = null; currentShop = null;
    scene = home.scene; currentSecret = home.secret ? SECRETS[home.secret] : null; P.x = home.x; P.face = 1; P.vx = 0; P.target = null; pending = null;
    camX = clamp(P.x - W*.42, 0, (scene === 'mill' ? MILL_W : W) - W);
    toast = { text:'Back in Thistledown', t:2.2 };
    fadeA = 1; fadeDir = -1; fadeWarp = true; fadeMid = null; showScreen(screenEl); return;
  }
  scene = 'village'; currentWorld = null; currentShop = null; currentSecret = null; ws = null;
  P.x = THISTLEDOWN_SPOTS[from](); P.face = 1; P.vx = 0; P.target = null; pending = null;
  camX = clamp(P.x - W*.42, 0, WORLD - W);
  toast = { text:'Back in Thistledown', t:2.2 };
  fadeA = 1; fadeDir = -1; fadeWarp = true; fadeMid = null;
  showScreen(screenEl);
};
window.warpToWorld = (id, from) => {
  closePanels(); climbing = null;
  const half = WORLDS[id] && WORLDS[id].alias ? WORLDS[id] : null, name = (half || WORLDS[id]).name;   // the far half of a joined world
  worldReturn = WARP_HOMES[from](); scene = 'world'; currentWorld = WORLDS[half ? half.alias : id]; currentWorldId = half ? half.alias : id; ws = currentWorld.init(); pops = [];
  P.x = 200 + (half ? half.off : 0); P.face = 1; P.vx = 0; P.target = null; pending = null; camX = clamp(P.x - W*.42, 0, currentWorld.w - W);
  const first = !Save.flag('world_' + id);
  if (first) Save.setFlag('world_' + id);
  toast = { text: first ? `You found ${name}!` : name, t:3 };
  // arrive out of a purple swirl
  fadeA = 1; fadeDir = -1; fadeWarp = true; fadeMid = null;
  showScreen(screenEl);
};
function leaveWorld(){
  const back = worldReturn;
  transition(() => {
    scene = back.scene; currentShop = back.shop || null; currentSecret = back.secret ? SECRETS[back.secret] : null;
    currentWorld = null; currentWorldId = null; ws = null; P.x = back.x; P.face = 1; P.vx = 0;
    // coming home to a room inside another world (like the café by the lake)
    if (back.world){ currentWorld = WORLDS[back.world]; currentWorldId = back.world; ws = currentWorld.init(); }
    const ww = scene === 'meadow' ? MEADOW_W : scene === 'village' ? WORLD : scene === 'mill' ? MILL_W : W;
    camX = clamp(P.x - W*.42, 0, ww - W);
  }, true);
}
// a little swirling portal, used both for the way back and to hint at a disguise
function swirl(x, y, r, a){
  ctx.save(); ctx.translate(x, y); ctx.rotate(reduceMotion ? 0 : t*2.5);
  for (let i=0;i<4;i++){ ctx.strokeStyle = `rgba(200,160,255,${a*(.8 - i*.15)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, r - i*r*.2, (r - i*r*.2)*1.4, 0, i, i + Math.PI*1.4); ctx.stroke(); }
  ctx.restore();
}
function drawWarpBack(){
  if (worldOff) return;   // (the far half of a joined world has no warp home of its own)
  const px = 90 - camX, pg = ctx.createRadialGradient(px, GROUND - 60, 4, px, GROUND - 60, 70);
  pg.addColorStop(0, 'rgba(120,70,200,.8)'); pg.addColorStop(1, 'rgba(120,70,200,0)'); ctx.fillStyle = pg; circle(px, GROUND - 60, 70);
  swirl(px, GROUND - 60, 36, 1);
}
function drawPops(){
  ctx.font = '700 15px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
  for (const p of pops){ ctx.globalAlpha = Math.max(0, p.life); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(43,33,24,.75)'; ctx.strokeText(p.txt, p.x - camX, p.y); ctx.fillStyle = p.col || '#fff6e4'; ctx.fillText(p.txt, p.x - camX, p.y); }
  ctx.globalAlpha = 1; ctx.textAlign = 'left';
}
function tickPops(dt){ if (noTick) return; pops.forEach(p => { p.y -= 36*dt; p.life -= dt; }); pops = pops.filter(p => p.life > 0); }
const par = (wx, k) => wx - camX*k;
function drawWorld(){ currentWorld.draw(); if (!currentWorld.inside){ const h = currentWorld.hub(); gateGlint(h.x - camX + 8, h.y - 8); } drawPops(); }
function worldSpots(){ return [
  { x:90, r:60, hit:[40, 140], hitY:[GROUND - 130, GROUND + 20], stand:120, gap:0, label:'Step back through the warp', open:() => leaveWorld() },
  ...currentWorld.spots(),
]; }

// ---------- the Golden Jungle ----------
const J_NEST = 760, J_FALLS = 1000, J_SLOTH = 1180, J_HEAD = 1940, J_TEMPLE = 2330, J_RESCUE = 2690;
function palm(x, base, h, lean, col){
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(3, h*.05); ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + lean*.4, base - h*.5, x + lean, base - h); ctx.stroke();
  ctx.fillStyle = col;
  for (let f=0; f<7; f++){ const a = -Math.PI/2 + (f - 3)*.5 + (reduceMotion ? 0 : Math.sin(t*.8 + x)*.05), L = h*.42;
    ctx.beginPath(); ctx.moveTo(x + lean, base - h); ctx.quadraticCurveTo(x + lean + Math.cos(a)*L*.6, base - h + Math.sin(a)*L*.6 - 10, x + lean + Math.cos(a)*L, base - h + Math.sin(a)*L*.5 + L*.35);
    ctx.quadraticCurveTo(x + lean + Math.cos(a)*L*.5, base - h + Math.sin(a)*L*.4, x + lean, base - h); ctx.fill(); }
}
function updateJungle(dt){
  for (const p of ws.parrots){
    if (!p.fly && Math.abs(P.x - p.hx) < 150){ p.fly = 1; pops.push({ x:p.hx, y:p.hy - 20, txt:'Squawk!', life:1 }); }
    if (p.fly){ p.fly += dt; p.x = p.hx + p.fly*140; p.y = p.hy - p.fly*70 + Math.sin(p.fly*10)*6; if (p.fly > 7 && Math.abs(P.x - p.hx) > 320){ p.fly = 0; p.x = p.hx; p.y = p.hy; } }
  }
  for (const f of ws.flowers) f.open += ((Math.abs(P.x - f.x) < 160 ? 1 : 0) - f.open)*Math.min(1, dt*2);
  tickPops(dt);
}
function drawJungle(){
  const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#f6e7a8'); g.addColorStop(.6, '#f0c56a'); g.addColorStop(1, '#d9a24a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, GROUND);
  const sx = par(620, .05), sg = ctx.createRadialGradient(sx, 180, 10, sx, 180, 180);
  sg.addColorStop(0, 'rgba(255,250,220,.95)'); sg.addColorStop(.25, 'rgba(255,240,190,.45)'); sg.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = sg; ctx.fillRect(sx - 180, 0, 360, 360); ctx.fillStyle = '#fffbe6'; circle(sx, 180, 40);
  // birds far off
  ctx.strokeStyle = 'rgba(90,70,30,.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i=0;i<6;i++){ const bx = wrap(i*140 + t*18 - camX*.05, W + 100) - 50, by = 90 + (i % 3)*18 + Math.sin(t + i)*4, fl = Math.sin(t*6 + i)*3; ctx.moveTo(bx - 6, by - fl); ctx.lineTo(bx, by); ctx.lineTo(bx + 6, by - fl); }
  ctx.stroke();
  // misty hills and far palms
  ctx.fillStyle = 'rgba(190,170,100,.7)'; ctx.beginPath(); ctx.moveTo(0, GROUND); for (let x=0;x<=W;x+=10){ const wx = x + camX*.15; ctx.lineTo(x, 300 - Math.sin(wx*.004)*30 - Math.sin(wx*.011)*12); } ctx.lineTo(W, GROUND); ctx.fill();
  for (let i = Math.floor(camX*.25/120) - 1; i*120 - camX*.25 < W + 120; i++) palm(i*120 - camX*.25 + hash(i)*60, 330, 90 + hash(i + 3)*50, (hash(i + 5) - .5)*40, 'rgba(150,130,70,.8)');
  // big jungle trees with hanging vines
  for (let i = Math.floor(camX*.55/260) - 1; i*260 - camX*.55 < W + 260; i++){
    const x = i*260 - camX*.55 + hash(i + 11)*80;
    ctx.fillStyle = '#6b5a2a'; ctx.beginPath(); ctx.moveTo(x - 26, GROUND); ctx.quadraticCurveTo(x - 14, GROUND - 150, x - 16, GROUND - 330); ctx.lineTo(x + 16, GROUND - 330); ctx.quadraticCurveTo(x + 14, GROUND - 150, x + 26, GROUND); ctx.fill();
    for (const [dx, dy, r, c] of [[0, -340, 90, '#5f7a2e'], [-80, -300, 60, '#6f8a36'], [80, -305, 64, '#6f8a36'], [0, -290, 56, '#7f9a3e']]){ ctx.fillStyle = c; circle(x + dx, GROUND + dy, r); }
    ctx.strokeStyle = '#4f6a26'; ctx.lineWidth = 2.5;
    for (let v=0; v<4; v++){ const vx = x - 60 + v*40, len = 90 + hash(i*4 + v)*120, sw = reduceMotion ? 0 : Math.sin(t*1.1 + v + i)*8;
      ctx.beginPath(); ctx.moveTo(vx, GROUND - 280); ctx.quadraticCurveTo(vx + sw, GROUND - 280 + len*.6, vx + sw*1.5, GROUND - 280 + len); ctx.stroke();
      ctx.fillStyle = '#6f9a3a'; for (let l=1;l<5;l++){ ctx.beginPath(); ctx.ellipse(vx + sw*l/4*1.3 + (l % 2 ? 4 : -4), GROUND - 280 + len*l/5, 5, 2.5, l % 2 ? .6 : -.6, 0, 7); ctx.fill(); } }
  }
  // the waterfall, its pool and a little rainbow
  { const x = par(J_FALLS, 1); if (x > -220 && x < W + 220){
    ctx.fillStyle = '#8a7a5a'; ctx.beginPath(); ctx.moveTo(x - 150, GROUND); ctx.lineTo(x - 120, GROUND - 230); ctx.lineTo(x - 60, GROUND - 250); ctx.lineTo(x + 70, GROUND - 246); ctx.lineTo(x + 130, GROUND - 220); ctx.lineTo(x + 150, GROUND); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6f9a3a'; ctx.beginPath(); ctx.ellipse(x - 10, GROUND - 246, 100, 14, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#bfe3ef'; ctx.fillRect(x - 40, GROUND - 240, 80, 210);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i=0;i<8;i++){ const lx = x - 34 + i*10, off = wrap((reduceMotion ? 0 : t*160) + i*37, 60); for (let y = GROUND - 240 + off; y < GROUND - 30; y += 60){ ctx.moveTo(lx, y); ctx.lineTo(lx, y + 26); } }
    ctx.stroke();
    ctx.fillStyle = '#8ac8dc'; ctx.beginPath(); ctx.ellipse(x, GROUND - 14, 110, 18, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; for (let i=0;i<8;i++) circle(x - 40 + i*11, GROUND - 30 + Math.sin(t*4 + i)*3, 7 + (i % 3)*3);
    ctx.lineWidth = 5; ['rgba(230,80,80,.28)', 'rgba(240,180,60,.28)', 'rgba(120,200,90,.28)', 'rgba(80,140,220,.28)'].forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(x + 60, GROUND - 40, 70 - i*6, Math.PI*1.05, Math.PI*1.7); ctx.stroke(); }); } }
  // ground: earth, moss and roots
  ctx.fillStyle = '#6b5a2a'; ctx.fillRect(0, GROUND - 10, W, H);
  ctx.fillStyle = '#7a8a3a'; ctx.fillRect(0, GROUND - 12, W, 8);
  ctx.fillStyle = '#a8894e'; ctx.beginPath(); ctx.moveTo(0, GROUND + 4); for (let x=0;x<=W;x+=20) ctx.lineTo(x, GROUND + 4 + Math.sin((x + camX)*.01)*3); for (let x=W;x>=0;x-=20) ctx.lineTo(x, GROUND + 30 + Math.sin((x + camX)*.013)*3); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#5a4a22'; ctx.lineWidth = 4; ctx.beginPath(); for (let i = Math.floor(camX/170) - 1; i*170 - camX < W + 170; i++){ const x = i*170 - camX + hash(i)*60; ctx.moveTo(x, GROUND - 6); ctx.quadraticCurveTo(x + 30, GROUND + 10, x + 70, GROUND + 6); } ctx.stroke();
  drawWarpBack();
  // the nest on an old stump, with a golden feather sticking out
  { const x = par(J_NEST, 1); if (onScreen(x, 60)){
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 22, GROUND - 40, 44, 40); ctx.fillStyle = '#a4845a'; ctx.beginPath(); ctx.ellipse(x, GROUND - 40, 22, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.ellipse(x, GROUND - 46, 24, 10, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i=0;i<8;i++){ ctx.moveTo(x - 22 + i*6, GROUND - 42); ctx.lineTo(x - 16 + i*6, GROUND - 52); } ctx.stroke();
    if (!Save.count('goldfeather')) itemIcon(ctx, 'goldfeather', x + 8, GROUND - 60, .7); } }
  // the sloth, hanging from a branch
  { const x = par(J_SLOTH, 1); if (onScreen(x, 140)){
    ctx.strokeStyle = '#6b5a2a'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x - 130, GROUND - 210); ctx.quadraticCurveTo(x, GROUND - 230, x + 120, GROUND - 200); ctx.stroke();
    const sway = reduceMotion ? 0 : Math.sin(t*.7)*.08, blink = Math.sin(t*.35) > .9;
    ctx.save(); ctx.translate(x, GROUND - 222); ctx.rotate(sway);
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-12, 30); ctx.moveTo(14, 0); ctx.lineTo(12, 30); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#9a7a52'; ctx.beginPath(); ctx.ellipse(0, 50, 22, 28, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8d4b0'; ctx.beginPath(); ctx.ellipse(0, 50, 14, 11, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#5a4028'; for (const sd of [-1, 1]){ ctx.beginPath(); ctx.ellipse(sd*6, 48, 5, 3.5, sd*.3, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#1e1a16'; if (blink){ ctx.fillRect(-8, 48, 5, 1.5); ctx.fillRect(3, 48, 5, 1.5); } else { circle(-6, 48, 1.8); circle(6, 48, 1.8); }
    ctx.strokeStyle = '#5a4028'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 53, 4, .3, Math.PI - .3); ctx.stroke(); ctx.fillStyle = '#3a2a1a'; circle(0, 51, 2);
    ctx.restore(); } }
  // giant flowers that open as you pass
  for (const f of ws.flowers){ const x = par(f.x, 1); if (!onScreen(x, 60)) continue;
    ctx.strokeStyle = '#4f7a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.quadraticCurveTo(x - 10, GROUND - 40, x, GROUND - 70); ctx.stroke();
    ctx.fillStyle = '#5f8a2e'; ctx.beginPath(); ctx.ellipse(x - 14, GROUND - 30, 14, 6, -.5, 0, 7); ctx.fill();
    const o = f.open, col = f.x === 1330 ? '#f2a03a' : '#e0507a';
    for (let p=0;p<6;p++){ const a = -Math.PI/2 + (p - 2.5)*(.25 + o*.3); ctx.fillStyle = col; ctx.save(); ctx.translate(x, GROUND - 72); ctx.rotate(a + Math.PI/2); ctx.beginPath(); ctx.ellipse(0, -14 - o*6, 7 + o*3, 16 + o*4, 0, 0, 7); ctx.fill(); ctx.restore(); }
    if (o > .3){ const gg = ctx.createRadialGradient(x, GROUND - 74, 1, x, GROUND - 74, 22); gg.addColorStop(0, `rgba(255,240,150,${o*.8})`); gg.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = gg; circle(x, GROUND - 74, 22); }
    ctx.fillStyle = '#f6e27a'; circle(x, GROUND - 74, 5); }
  // the old stone head, half swallowed by the jungle
  { const x = par(J_HEAD, 1); if (onScreen(x, 140)){
    ctx.fillStyle = '#8a8272'; rr(x - 70, GROUND - 170, 140, 170, 30); ctx.fill();
    ctx.fillStyle = '#7a7262'; rr(x - 78, GROUND - 180, 156, 26, 10); ctx.fill();
    ctx.fillStyle = '#5a5448'; ctx.fillRect(x - 40, GROUND - 120, 26, 12); ctx.fillRect(x + 14, GROUND - 120, 26, 12);
    const eg = reduceMotion ? .5 : .3 + Math.max(0, Math.sin(t*.8))*.4; ctx.fillStyle = `rgba(255,214,90,${eg})`; ctx.fillRect(x - 36, GROUND - 118, 18, 8); ctx.fillRect(x + 18, GROUND - 118, 18, 8);
    ctx.fillStyle = '#5a5448'; ctx.fillRect(x - 8, GROUND - 100, 16, 30); ctx.fillRect(x - 30, GROUND - 56, 60, 10);
    ctx.strokeStyle = '#5a5448'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(x, GROUND - 150, 10, 11, 0, 0, 7); ctx.moveTo(x - 12, GROUND - 156); ctx.quadraticCurveTo(x, GROUND - 168, x + 12, GROUND - 156); ctx.stroke();
    ctx.strokeStyle = '#4f7a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 70, GROUND - 160); ctx.quadraticCurveTo(x - 40, GROUND - 90, x - 60, GROUND - 20); ctx.moveTo(x + 60, GROUND - 176); ctx.quadraticCurveTo(x + 76, GROUND - 100, x + 56, GROUND - 40); ctx.stroke();
    ctx.fillStyle = '#6f9a3a'; for (let i=0;i<8;i++){ circle(x - 62 + Math.sin(i)*12, GROUND - 150 + i*16, 5); circle(x + 64 + Math.cos(i)*8, GROUND - 166 + i*17, 5); } } }
  // parrots
  for (const p of ws.parrots){ const x = par(p.x, 1); if (!onScreen(x, 40)) continue;
    ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(x, p.y, 8, 12, p.fly ? -.8 : 0, 0, 7); ctx.fill(); circle(x + (p.fly ? 7 : 3), p.y - (p.fly ? 8 : 12), 6);
    ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(x + (p.fly ? 12 : 8), p.y - (p.fly ? 9 : 13)); ctx.lineTo(x + (p.fly ? 17 : 13), p.y - (p.fly ? 6 : 10)); ctx.lineTo(x + (p.fly ? 11 : 7), p.y - (p.fly ? 5 : 9)); ctx.fill();
    ctx.fillStyle = '#fff'; circle(x + (p.fly ? 8 : 4), p.y - (p.fly ? 10 : 14), 2); ctx.fillStyle = '#1e1a16'; circle(x + (p.fly ? 8.5 : 4.5), p.y - (p.fly ? 10 : 14), 1);
    ctx.fillStyle = p.col === '#f2c230' ? '#3f7ad0' : '#f2c230'; ctx.beginPath(); ctx.moveTo(x - 3, p.y + 8); ctx.lineTo(x - 8, p.y + 26); ctx.lineTo(x + 2, p.y + 10); ctx.fill();
    if (p.fly){ const w = Math.sin(t*16)*10; ctx.fillStyle = p.col; ctx.beginPath(); ctx.moveTo(x - 2, p.y - 4); ctx.lineTo(x - 18, p.y - 8 - w); ctx.lineTo(x - 4, p.y + 4); ctx.fill(); } }
  // golden pollen
  for (let i=0;i<30;i++){ const x = wrap(hash(i)*W*1.6 - camX*.6 + Math.sin(t*.5 + i)*20, W), y = wrap(hash(i + 7)*H - t*(8 + hash(i)*10), H); ctx.fillStyle = `rgba(255,226,140,${.3 + .5*Math.max(0, Math.sin(t*1.5 + i))})`; circle(x, y, 1.5 + hash(i + 3)*1.2); }

  // the Temple of the Golden Acorn, half swallowed by the jungle
  { const x = par(J_TEMPLE, 1); if (onScreen(x, 240)){
    for (let k=0;k<4;k++){ const w = 300 - k*60, h = 44; ctx.fillStyle = k % 2 ? '#8a7a5a' : '#7a6a4c'; ctx.fillRect(x - w/2, GROUND - 10 - (k + 1)*h, w, h + 2);
      ctx.strokeStyle = 'rgba(40,30,16,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let bx = x - w/2 + 30; bx < x + w/2; bx += 30){ ctx.moveTo(bx, GROUND - 10 - (k + 1)*h); ctx.lineTo(bx, GROUND - 10 - k*h); } ctx.stroke(); }
    ctx.fillStyle = '#1a1208'; ctx.beginPath(); ctx.moveTo(x - 36, GROUND - 10); ctx.lineTo(x - 36, GROUND - 90); ctx.lineTo(x, GROUND - 116); ctx.lineTo(x + 36, GROUND - 90); ctx.lineTo(x + 36, GROUND - 10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = `rgba(255,210,90,${.5 + .4*Math.max(0, Math.sin(t*2))})`; circle(x - 10, GROUND - 70, 3); circle(x + 10, GROUND - 70, 3);
    ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.ellipse(x, GROUND - 150, 12, 15, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#c9902a'; ctx.beginPath(); ctx.ellipse(x, GROUND - 164, 15, 6, 0, 0, 7); ctx.fill();
    for (const tx of [x - 70, x + 70]){ ctx.fillStyle = '#3a2a16'; ctx.fillRect(tx - 3, GROUND - 70, 6, 60); for (let k=0;k<3;k++){ ctx.fillStyle = ['#e0602a', '#f2a03a', '#ffe27a'][k]; ctx.beginPath(); ctx.ellipse(tx, GROUND - 78 - k*3 + Math.sin(t*12 + k + tx)*2, 7 - k*2, 12 - k*3, 0, 0, 7); ctx.fill(); } }
    ctx.strokeStyle = '#3f6a22'; ctx.lineWidth = 3; for (let i=0;i<7;i++){ const vx = x - 140 + i*46, len = 40 + hash(i + 50)*80; ctx.beginPath(); ctx.moveTo(vx, GROUND - 186); ctx.quadraticCurveTo(vx + Math.sin(t + i)*6, GROUND - 186 + len/2, vx + 4, GROUND - 186 + len); ctx.stroke(); }
  } }
  // the Animal Rescue station: a ranger hut on stilts, with a couple of rescued friends
  { const x = par(J_RESCUE, 1); if (onScreen(x, 200)){
    ctx.fillStyle = '#5a3a1a'; for (const sx of [-80, -20, 40, 80]) ctx.fillRect(x + sx, GROUND - 90, 8, 80);
    ctx.fillStyle = '#8a5a32'; ctx.fillRect(x - 100, GROUND - 170, 200, 84); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 110, GROUND - 92, 220, 10);
    ctx.fillStyle = '#4f7a2a'; ctx.beginPath(); ctx.moveTo(x - 124, GROUND - 166); ctx.lineTo(x, GROUND - 224); ctx.lineTo(x + 124, GROUND - 166); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#3f6a22'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=0;i<9;i++){ ctx.moveTo(x - 110 + i*28, GROUND - 170); ctx.lineTo(x - 104 + i*28, GROUND - 158); } ctx.stroke();
    ctx.fillStyle = '#f6ead6'; rr(x - 76, GROUND - 156, 152, 26, 6); ctx.fill(); ctx.fillStyle = '#3f6b3a'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ANIMAL RESCUE', x, GROUND - 142); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,220,140,.8)'; ctx.fillRect(x + 30, GROUND - 124, 40, 26);
    ctx.fillStyle = '#6b4a2b'; ctx.save(); ctx.translate(x - 130, GROUND - 10); ctx.rotate(-.9); ctx.fillRect(0, -4, 110, 8); ctx.restore();
    // a paw-print flag
    ctx.fillStyle = '#3a2a16'; ctx.fillRect(x + 104, GROUND - 260, 4, 100); ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(x + 108, GROUND - 258); ctx.lineTo(x + 150, GROUND - 246 + Math.sin(t*3)*3); ctx.lineTo(x + 108, GROUND - 232); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; circle(x + 124, GROUND - 244, 4); circle(x + 118, GROUND - 252, 2); circle(x + 124, GROUND - 254, 2); circle(x + 130, GROUND - 252, 2);
    // a baby elephant spraying water, and a monkey on the rail
    { const ex = x + 150, bob = Math.sin(t*2)*2; ctx.fillStyle = '#9aa0ac'; ctx.beginPath(); ctx.ellipse(ex, GROUND - 22 + bob, 24, 17, 0, 0, 7); ctx.fill(); circle(ex - 20, GROUND - 34 + bob, 13); ctx.fillStyle = '#b8bec8'; ctx.beginPath(); ctx.ellipse(ex - 12, GROUND - 34 + bob, 8, 12, .2, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(ex - 25, GROUND - 38 + bob, 1.8);
      ctx.strokeStyle = '#9aa0ac'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ex - 30, GROUND - 30 + bob); ctx.quadraticCurveTo(ex - 44, GROUND - 40, ex - 40, GROUND - 56); ctx.stroke();
      if (!reduceMotion) for (let i=0;i<5;i++){ const k = wrap(t*1.2 + i/5, 1); ctx.fillStyle = `rgba(150,210,255,${.8*(1 - k)})`; circle(ex - 40 - k*30, GROUND - 58 - Math.sin(k*Math.PI)*30, 3); } }
    { const mx = x - 60, my = GROUND - 100 + Math.sin(t*3)*2; ctx.fillStyle = '#7a4a2a'; circle(mx, my - 8, 8); circle(mx, my - 22, 7); ctx.fillStyle = '#e0b080'; circle(mx, my - 20, 5); ctx.fillStyle = '#1a1a1a'; circle(mx - 2, my - 23, 1.2); circle(mx + 2, my - 23, 1.2); ctx.strokeStyle = '#7a4a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(mx + 10, my + 2, 7, -1, 2); ctx.stroke(); }
  } }
  drawPlayer();
  // big leaves in the foreground
  for (let i = Math.floor(camX*1.2/300) - 1; i*300 - camX*1.2 < W + 300; i++){
    const x = i*300 - camX*1.2 + hash(i + 21)*100, sw = reduceMotion ? 0 : Math.sin(t*.9 + i)*.05;
    ctx.save(); ctx.translate(x, H + 10); ctx.rotate(-.5 + hash(i)*.6 + sw); ctx.fillStyle = i % 2 ? '#3f5a22' : '#4f6a2a';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-40, -60, 0, -120); ctx.quadraticCurveTo(40, -60, 0, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -110); ctx.stroke(); ctx.restore(); }
}
function jungleSpots(){ return [
  gateSpot(J_HEAD, GROUND - 150, 'jungle'),
  { x:J_TEMPLE, r:150, hit:[J_TEMPLE - 150, J_TEMPLE + 150], stand:J_TEMPLE - 60, gap:0, label:'Explore the Temple of the Golden Acorn', open:() => playHere('temple', 'Back to the jungle', '← Jungle', J_TEMPLE - 60) },
  { x:J_RESCUE, r:130, hit:[J_RESCUE - 130, J_RESCUE + 180], stand:J_RESCUE - 70, gap:0, label:'Help at the Animal Rescue station', open:() => playHere('rescue', 'Back to the jungle', '← Jungle', J_RESCUE - 70) },
  { x:J_NEST, r:60, hit:[J_NEST - 40, J_NEST + 40], stand:J_NEST - 40, gap:0, label:'Peek into the nest', open:() => findThing('goldfeather', 'The Nest', 'Tucked in the twigs is a long golden feather, warm like sunlight. A parrot must have left it for you.', 'Just soft twigs and a few seed husks now.') },
  { x:J_FALLS, r:90, hit:[J_FALLS - 110, J_FALLS + 110], stand:J_FALLS - 80, gap:0, label:'Swing on the vines by the waterfall', open:() => playHere('jungle', 'Back to the jungle', '← Jungle', J_FALLS - 80) },
  { x:J_SLOTH, r:70, hit:[J_SLOTH - 50, J_SLOTH + 50], stand:J_SLOTH - 30, gap:0, label:'Sing the sloth a lullaby', open:() => playHere('sloth', 'Back to the jungle', '← Jungle', J_SLOTH - 30) },
  { x:J_HEAD, r:90, hit:[J_HEAD - 80, J_HEAD + 80], stand:J_HEAD - 100, gap:0, label:'Look at the stone face', open:() => openMystery('The Stone Face', 'A huge stone face, half swallowed by vines. An acorn is carved on its forehead, and its eyes glow gold when the sun hits them. The path behind it is overgrown… for now.', 'A world for another day.') },
]; }

// ---------- the Starry Nebula ----------
const N_CHIMES = [520, 1240], N_STONES = [760, 880, 1000, 1120, 1360], N_STAR = 1560, N_WHALE = 1900, N_PAD = 370, N_PARK = 2380;
// the stars your steps light up make a little chinchilla in the sky
const CONST_STARS = [[520, 70], [560, 52], [600, 78], [640, 110], [590, 128]];
const NEB_STARS = (() => { const r = rng(88), s = []; for (let i=0;i<120;i++) s.push({ x:r()*1200, y:r()*300, r:.5 + r()*1.4, ph:r()*6 }); return s; })();
function updateNebula(dt){
  // stepping stones light up one star each
  N_STONES.forEach((sx, i) => { if (!ws.lit[i] && Math.abs(P.x - sx) < 26){ ws.lit[i] = 1; pops.push({ x:sx, y:GROUND - 70, txt:'✦', col:'#e8d0ff', life:1 }); } });
  if (ws.lit.every(Boolean) && !ws.falling && !ws.landed){ ws.falling = { t:0 }; toast = { text:'A star is falling!', t:2 }; }
  if (ws.falling){ ws.falling.t += dt; if (ws.falling.t > 1.6){ ws.falling = null; ws.landed = true; } }
  N_CHIMES.forEach((cx, i) => { if (Math.abs(P.x - cx) < 40 && ws.chime[i] <= 0) ws.chime[i] = 1.4; ws.chime[i] = Math.max(0, ws.chime[i] - dt); if (ws.chime[i] > 1.35) pops.push({ x:cx, y:GROUND - 110, txt:'♪', col:'#e8d0ff', life:1 }); });
  // little star creatures follow along behind you
  ws.starlings.forEach((s, i) => { const tx = P.x - P.face*(60 + i*34), ty = GROUND - 110 - Math.sin(t*2 + s.ph)*18 - (i % 2)*20; s.x += (tx - s.x)*Math.min(1, dt*(1.2 - i*.12)); s.y += (ty - s.y)*Math.min(1, dt*2); });
  const sh = ws.shoot; sh.t -= dt; if (sh.t <= 0 && sh.life <= 0){ sh.x = 200 + Math.random()*500; sh.y = 30 + Math.random()*100; sh.life = 1; sh.t = 2 + Math.random()*3; } sh.life = Math.max(0, sh.life - dt*1.4);
  tickPops(dt);
}
function drawNebula(){
  // the planet world sits on a platform high above Neon City: the city's night sky and skyline show behind it
  // (drawn by the Neon world's backdrop), and if you ever arrive here on its own, it gets the same backdrop
  if (!currentWorld || !currentWorld.joined) neonBackdrop(230);
  // a ringed planet and two small moons
  { const x = par(640, .08), y = 120; ctx.fillStyle = '#e8a07a'; circle(x, y, 42); ctx.fillStyle = 'rgba(180,90,80,.35)'; ctx.fillRect(x - 42, y - 8, 84, 8); ctx.fillRect(x - 38, y + 12, 76, 6);
    ctx.strokeStyle = 'rgba(240,210,240,.7)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x, y, 76, 16, -.25, 0, 7); ctx.stroke();
    ctx.fillStyle = '#d6cfe8'; circle(par(300, .1), 60, 12); ctx.fillStyle = '#b8a8d8'; circle(par(900, .1), 50, 8); }
  // the constellation you're lighting up
  const lit = ws.lit.filter(Boolean).length;
  ctx.strokeStyle = 'rgba(232,208,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let i=1;i<lit;i++){ const a = CONST_STARS[i - 1], b = CONST_STARS[i]; ctx.moveTo(a[0] - camX*.1, a[1]); ctx.lineTo(b[0] - camX*.1, b[1]); }
  if (lit === 5){ ctx.moveTo(CONST_STARS[4][0] - camX*.1, CONST_STARS[4][1]); ctx.lineTo(CONST_STARS[0][0] - camX*.1, CONST_STARS[0][1]); }
  ctx.stroke();
  CONST_STARS.forEach(([cx, cy], i) => { const x = cx - camX*.1, on = ws.lit[i]; if (on){ const sg = ctx.createRadialGradient(x, cy, 1, x, cy, 16); sg.addColorStop(0, 'rgba(255,240,255,.9)'); sg.addColorStop(1, 'rgba(255,240,255,0)'); ctx.fillStyle = sg; circle(x, cy, 16); } ctx.fillStyle = on ? '#fff' : 'rgba(255,255,255,.25)'; circle(x, cy, on ? 3 : 1.5); });
  // a shooting star now and then
  const sh = ws.shoot; if (sh.life > 0){ ctx.strokeStyle = `rgba(255,255,255,${sh.life})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sh.x + (1 - sh.life)*180, sh.y + (1 - sh.life)*60); ctx.lineTo(sh.x + (1 - sh.life)*180 - 50, sh.y + (1 - sh.life)*60 - 16); ctx.stroke(); }
  // the star whale swimming slowly overhead near the far end
  { const x = par(N_WHALE, .6), y = 150 + Math.sin(t*.4)*10; if (onScreen(x, 220)){
    ctx.save(); ctx.translate(x, y);
    const wg = ctx.createRadialGradient(0, 0, 10, 0, 0, 150); wg.addColorStop(0, 'rgba(120,160,255,.35)'); wg.addColorStop(1, 'rgba(120,160,255,0)'); ctx.fillStyle = wg; circle(0, 0, 150);
    ctx.fillStyle = 'rgba(90,120,220,.55)'; ctx.beginPath(); ctx.ellipse(0, 0, 110, 40, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(100, -6); ctx.quadraticCurveTo(150, -40 + Math.sin(t)*10, 170, -30 + Math.sin(t)*10); ctx.quadraticCurveTo(150, 0, 170, 30 + Math.sin(t)*10); ctx.quadraticCurveTo(150, 30, 100, 10); ctx.fill();
    ctx.fillStyle = '#fff'; for (let i=0;i<22;i++) circle(-90 + hash(i)*180, -28 + hash(i + 4)*56, hash(i + 9)*1.8 + .6);
    ctx.fillStyle = '#e8f0ff'; circle(-70, -8, 4); ctx.restore(); } }
  // floating islands far off, bobbing
  for (let i=0;i<5;i++){ const x = wrap(i*320 - camX*.3, 1600) - 200, y = 250 + (i % 2)*30 + Math.sin(t*.6 + i)*8;
    ctx.fillStyle = '#3a2a5a'; ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x + 40, y); ctx.lineTo(x + 10, y + 40); ctx.lineTo(x - 8, y + 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#b58ae6'; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x, y - 18); ctx.lineTo(x + 6, y); ctx.fill(); }
  // the path: the Planet Deck, a platform with glowing crystal edges and neon trim, held up high over the city
  for (let i = Math.floor(camX/220) - 1; i*220 - camX < W + 220; i++){ const x = i*220 - camX + 60; ctx.fillStyle = '#231440'; ctx.fillRect(x - 9, GROUND + 30, 18, 400); neonTube(x - 9, GROUND + 34, x - 9, GROUND + 400, '200,160,255', .45); }
  ctx.fillStyle = '#3a2a5a'; ctx.fillRect(0, GROUND - 6, W, 40); neonTube(0, GROUND + 34, W, GROUND + 34, '200,160,255', .8);
  ctx.fillStyle = '#4a3870'; ctx.fillRect(0, GROUND - 6, W, 12);
  ctx.strokeStyle = 'rgba(181,138,230,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, GROUND - 6); ctx.lineTo(W, GROUND - 6); ctx.stroke();
  for (let i = Math.floor(camX/90) - 1; i*90 - camX < W + 90; i++){ const x = i*90 - camX + hash(i)*40, h = 8 + hash(i + 2)*18; ctx.fillStyle = i % 3 ? 'rgba(181,138,230,.7)' : 'rgba(127,224,230,.6)'; ctx.beginPath(); ctx.moveTo(x - 5, GROUND - 6); ctx.lineTo(x, GROUND - 6 - h); ctx.lineTo(x + 5, GROUND - 6); ctx.fill(); }
  drawWarpBack();
  // the hoverboard launch pad: ride again any time
  { const x = par(N_PAD, 1); if (onScreen(x, 90)){
    const pg = ctx.createRadialGradient(x, GROUND - 4, 4, x, GROUND - 4, 70); pg.addColorStop(0, 'rgba(150,220,255,.45)'); pg.addColorStop(1, 'rgba(150,220,255,0)'); ctx.fillStyle = pg; circle(x, GROUND - 4, 70);
    ctx.fillStyle = '#4a3870'; ctx.beginPath(); ctx.ellipse(x, GROUND - 2, 54, 10, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(150,220,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, GROUND - 4, 46, 7, 0, 0, 7); ctx.stroke();
    ctx.strokeStyle = `rgba(150,220,255,${.3 + Math.sin(t*3)*.2})`; ctx.beginPath(); ctx.ellipse(x, GROUND - 4, 30, 4, 0, 0, 7); ctx.stroke();
    const hy = GROUND - 34 + (reduceMotion ? 0 : Math.sin(t*2)*5);
    ctx.fillStyle = '#b58ae6'; rr(x - 40, hy, 80, 10, 5); ctx.fill(); ctx.fillStyle = '#e8d0ff'; ctx.fillRect(x - 34, hy + 2, 68, 2);
    ctx.fillStyle = 'rgba(150,220,255,.6)'; ctx.beginPath(); ctx.moveTo(x - 40, hy + 3); ctx.lineTo(x - 52, hy + 5); ctx.lineTo(x - 40, hy + 8); ctx.fill();
    ctx.fillStyle = '#3a2a5a'; ctx.fillRect(x + 62, GROUND - 70, 5, 66);
    ctx.fillStyle = '#2a1850'; rr(x + 44, GROUND - 92, 42, 22, 5); ctx.fill(); ctx.strokeStyle = '#96dcff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#bfe3ff'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('RIDE', x + 65, GROUND - 81); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  } }
  // crystal chimes that ring as you pass
  N_CHIMES.forEach((cx, i) => { const x = par(cx, 1); if (!onScreen(x, 80)) return; const rg = ws.chime[i];
    if (rg > 0){ ctx.strokeStyle = `rgba(232,208,255,${rg/1.4})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, GROUND - 60, 30 + (1.4 - rg)*60, 12 + (1.4 - rg)*24, 0, 0, 7); ctx.stroke(); }
    for (const [dx, h, c] of [[-16, 50, '#b58ae6'], [0, 80, '#7fe0e6'], [16, 60, '#e8a0e0']]){ const wob = rg > 0 ? Math.sin(t*30)*rg*2 : 0; ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + dx - 7 + wob, GROUND - 6); ctx.lineTo(x + dx + wob, GROUND - 6 - h); ctx.lineTo(x + dx + 7 + wob, GROUND - 6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + dx - 2 + wob, GROUND - h + 4, 2, h - 14); } });
  // stepping stones that light the constellation
  N_STONES.forEach((sx, i) => { const x = par(sx, 1); if (!onScreen(x, 40)) return; const on = ws.lit[i];
    if (on){ const sg = ctx.createRadialGradient(x, GROUND + 6, 2, x, GROUND + 6, 30); sg.addColorStop(0, 'rgba(232,208,255,.7)'); sg.addColorStop(1, 'rgba(232,208,255,0)'); ctx.fillStyle = sg; circle(x, GROUND + 6, 30); }
    ctx.fillStyle = on ? '#d8c0ff' : '#5a4880'; ctx.beginPath(); ctx.ellipse(x, GROUND + 8, 22, 7, 0, 0, 7); ctx.fill();
    ctx.fillStyle = on ? '#fff' : 'rgba(255,255,255,.3)'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('✦', x, GROUND + 12); ctx.textAlign = 'left'; });
  // the falling star, then where it landed
  if (ws.falling){ const k = ws.falling.t/1.6, sx = CONST_STARS[1][0] - camX*.1 + (N_STAR - camX - (CONST_STARS[1][0] - camX*.1))*k, sy = 52 + (GROUND - 30 - 52)*k*k;
    ctx.strokeStyle = 'rgba(255,240,200,.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - 30, sy - 40); ctx.stroke(); itemIcon(ctx, 'fallenstar', sx, sy, .8); }
  if (ws.landed && !Save.count('fallenstar')){ const x = par(N_STAR, 1), gg = ctx.createRadialGradient(x, GROUND - 24, 2, x, GROUND - 24, 40); gg.addColorStop(0, 'rgba(255,240,180,.8)'); gg.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = gg; circle(x, GROUND - 24, 40); itemIcon(ctx, 'fallenstar', x, GROUND - 24 + Math.sin(t*3)*3, .9); }
  // starlings
  ws.starlings.forEach(s => { const x = s.x - camX, y = s.y; const sg = ctx.createRadialGradient(x, y, 1, x, y, 16); sg.addColorStop(0, 'rgba(255,245,200,.8)'); sg.addColorStop(1, 'rgba(255,245,200,0)'); ctx.fillStyle = sg; circle(x, y, 16);
    ctx.fillStyle = '#fff6c8'; ctx.beginPath(); for (let k=0;k<10;k++){ const a = -Math.PI/2 + k*Math.PI/5, r = k % 2 ? 3.5 : 8; k ? ctx.lineTo(x + Math.cos(a)*r, y + Math.sin(a)*r) : ctx.moveTo(x + Math.cos(a)*r, y + Math.sin(a)*r); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2a5a'; circle(x - 2, y, 1); circle(x + 2, y, 1); });
  // the Cosmic Carnival on its floating island, with Zib the alien at the ticket booth
  { const x = par(N_PARK, 1); if (onScreen(x, 320)){
    const iy = GROUND - 150 + Math.sin(t*.8)*4;
    ctx.fillStyle = '#3a2a5a'; ctx.beginPath(); ctx.moveTo(x - 60, iy); ctx.lineTo(x + 300, iy); ctx.lineTo(x + 220, iy + 60); ctx.lineTo(x + 40, iy + 70); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#6a4a9a'; ctx.fillRect(x - 60, iy - 6, 360, 8);
    const wx = x + 60, wy = iy - 110, rot = reduceMotion ? 0 : t*.25;
    ctx.strokeStyle = 'rgba(200,180,255,.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(wx, wy, 90, 0, 7); for (let i=0;i<8;i++){ const a = rot + i/8*Math.PI*2; ctx.moveTo(wx, wy); ctx.lineTo(wx + Math.cos(a)*90, wy + Math.sin(a)*90); } ctx.stroke();
    ctx.beginPath(); ctx.moveTo(wx - 50, iy); ctx.lineTo(wx, wy); ctx.lineTo(wx + 50, iy); ctx.stroke();
    for (let i=0;i<8;i++){ const a = rot + i/8*Math.PI*2; ctx.fillStyle = ['#ff6ad5', '#5adcff', '#ffe66e', '#82ffa0'][i % 4]; rr(wx + Math.cos(a)*90 - 10, wy + Math.sin(a)*90, 20, 14, 5); ctx.fill(); }
    for (let i=0;i<20;i++){ const a = rot + i/20*Math.PI*2; ctx.fillStyle = Math.sin(t*5 + i) > 0 ? '#ffe66e' : '#ff6ad5'; circle(wx + Math.cos(a)*90, wy + Math.sin(a)*90, 2.5); }
    // a striped tent
    const tx = x + 210; for (let i=0;i<6;i++){ ctx.fillStyle = i % 2 ? '#f6ead6' : '#d0452f'; ctx.beginPath(); ctx.moveTo(tx, iy - 110); ctx.lineTo(tx - 60 + i*20, iy); ctx.lineTo(tx - 40 + i*20, iy); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#ffe066'; ctx.beginPath(); ctx.moveTo(tx, iy - 110); ctx.lineTo(tx + 20, iy - 102 + Math.sin(t*4)*3); ctx.lineTo(tx, iy - 94); ctx.fill();
    // a little coaster loop off the side
    ctx.strokeStyle = '#ff6ad5'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + 290, iy - 40, 34, 0, 7); ctx.stroke();
    const ca = (reduceMotion ? 0 : t*2); ctx.fillStyle = '#ffe066'; circle(x + 290 + Math.cos(ca)*34, iy - 40 + Math.sin(ca)*34, 6);
    // the ticket booth on the ground, and Zib waving
    const bx = N_PARK - camX; ctx.fillStyle = '#2a1850'; rr(bx - 50, GROUND - 90, 100, 90, 8); ctx.fill(); ctx.strokeStyle = '#ff6ad5'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#120a22'; rr(bx - 46, GROUND - 124, 92, 28, 6); ctx.fill(); ctx.fillStyle = '#ffe66e'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CARNIVAL', bx, GROUND - 110); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(150,220,255,.4)'; ctx.fillRect(bx - 34, GROUND - 74, 68, 34);
    zib(bx, GROUND - 42, .8);
  } }
  drawPlayer();
}
// ride the hoverboard again from inside the nebula; win or lose, you come back here afterwards
function rideHoverboard(){
  const off = worldOff;
  transition(() => startWorldGame('nebula', 'windmill', { label:'Back to the nebula', leave:'\u2190 Nebula', done:() => {
    P.x = N_PAD - 60 + off; P.face = 1; P.vx = 0; P.target = null; pending = null;
    camX = clamp(P.x - W*.42, 0, currentWorld.w - W);
    fadeA = 1; fadeDir = -1; fadeWarp = true; fadeMid = null; showScreen(screenEl);
  } }));
}
function nebulaSpots(){ return [
  { x:N_PAD, r:70, hit:[N_PAD - 60, N_PAD + 90], stand:N_PAD - 40, gap:0, label:'Ride the hoverboard', open:() => rideHoverboard() },
  gateSpot(N_CHIMES[1], GROUND - 50, 'nebula'),
  { x:N_CHIMES[0], r:60, hit:[N_CHIMES[0] - 45, N_CHIMES[0] + 45], stand:N_CHIMES[0] - 50, gap:0, label:'Trace the constellations', open:() => playHere('stars', 'Back to the Nebula', '← Nebula', N_CHIMES[0] - 50) },
  ...(ws.landed ? [{ x:N_STAR, r:60, hit:[N_STAR - 40, N_STAR + 40], stand:N_STAR - 30, gap:0, label: Save.count('fallenstar') ? 'Look at where the star fell' : 'Pick up the fallen star', open:() => findThing('fallenstar', 'The Fallen Star', 'It’s warm and hums softly in your paws. The little star creatures cheer and twirl around you!', 'There’s a tiny star-shaped dent where it landed.') }] : []),
  { x:N_WHALE, r:110, hit:[N_WHALE - 100, N_WHALE + 100], stand:N_WHALE - 60, gap:0, label:'Ride the star whale', open:() => playHere('whale', 'Back to the nebula', '← Nebula', N_WHALE - 60) },
  { x:N_PARK, r:110, hit:[N_PARK - 70, N_PARK + 300], stand:N_PARK - 80, gap:0, label:'Visit the Cosmic Carnival', open:() => playHere('park', 'Back to the nebula', '← Nebula', N_PARK - 80) },
]; }

// ---------- the Moonlit Lake ----------
const L_OWL = 520, L_CABIN = 900, L_FIRE = 1300, L_DOCK = 1640, L_PEBBLE = 1900, L_COURT = 2230, L_CABIN2 = 2700, L_SKI = 3100, CABIN_GATE = { x:560, y:150 };
function pine(x, base, h, col){ ctx.fillStyle = col; for (let k=0;k<4;k++){ const w = h*(.34 - k*.06), y = base - h*.25 - k*h*.2; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x, y - h*.32); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill(); } ctx.fillRect(x - 3, base - h*.25, 6, h*.25); }
function updateMoonlake(dt){
  const f = ws.fish; f.t -= dt; if (f.t <= 0 && f.k >= 1){ f.x = camX + 200 + Math.random()*400; f.k = 0; f.t = 3 + Math.random()*3; } f.k = Math.min(1, f.k + dt*1.3);
  if (Math.abs(P.x - L_OWL) < 120 && ws.hoot <= 0){ ws.hoot = 5; pops.push({ x:L_OWL, y:GROUND - 230, txt:'Hoo!', life:1.2 }); } ws.hoot -= dt;
  ws.fire = Math.max(0, ws.fire - dt);
  tickPops(dt);
}
function drawMoonlake(){
  const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#0f2438'); g.addColorStop(.6, '#1d3e5a'); g.addColorStop(1, '#2e5a6e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i=0;i<90;i++){ const x = wrap(hash(i)*1200 - camX*.03, 1200) - 200, y = hash(i + 50)*230; ctx.fillStyle = `rgba(255,255,240,${.3 + .6*Math.max(0, Math.sin(t*1.2 + i))})`; circle(x, y, hash(i + 9)*1.3 + .4); }
  // aurora ribbons
  for (let b=0;b<2;b++){ ctx.strokeStyle = b ? 'rgba(120,230,190,.12)' : 'rgba(140,200,255,.1)'; ctx.lineWidth = 26; ctx.beginPath(); for (let x=-20;x<=W+20;x+=20){ const y = 70 + b*40 + Math.sin(x*.008 + t*.3 + b)*26 + Math.sin(x*.02 + t*.5)*8; x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  // the moon
  const mx = par(580, .03); const mg = ctx.createRadialGradient(mx, 110, 20, mx, 110, 140); mg.addColorStop(0, 'rgba(255,250,220,.5)'); mg.addColorStop(1, 'rgba(255,250,220,0)'); ctx.fillStyle = mg; circle(mx, 110, 140);
  ctx.fillStyle = '#fbf3d0'; circle(mx, 110, 48); ctx.fillStyle = 'rgba(200,190,150,.35)'; circle(mx - 14, 100, 9); circle(mx + 12, 122, 6); circle(mx + 18, 96, 4);
  // mountains, lit warm on one side like the painting
  for (let i = Math.floor(camX*.15/260) - 1; i*260 - camX*.15 < W + 260; i++){
    const x = i*260 - camX*.15 + hash(i)*80, h = 180 + hash(i + 3)*110, base = GROUND - 50;
    ctx.fillStyle = '#1e3a52'; ctx.beginPath(); ctx.moveTo(x - 170, base); ctx.lineTo(x, base - h); ctx.lineTo(x + 170, base); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9803a'; ctx.beginPath(); ctx.moveTo(x, base - h); ctx.lineTo(x + 40, base - h*.62); ctx.lineTo(x + 18, base - h*.55); ctx.lineTo(x + 60, base - h*.35); ctx.lineTo(x + 8, base - h*.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8eef4'; ctx.beginPath(); ctx.moveTo(x, base - h); ctx.lineTo(x - 22, base - h*.84); ctx.lineTo(x - 6, base - h*.86); ctx.lineTo(x + 14, base - h*.82); ctx.closePath(); ctx.fill(); }
  for (let i = Math.floor(camX*.35/40) - 1; i*40 - camX*.35 < W + 40; i++) pine(i*40 - camX*.35 + hash(i)*20, GROUND - 58, 50 + hash(i + 7)*40, '#0f2230');
  // the lake, with the moon's reflection
  const lg = ctx.createLinearGradient(0, GROUND - 60, 0, GROUND - 6); lg.addColorStop(0, '#1d4a66'); lg.addColorStop(1, '#16384e');
  ctx.fillStyle = lg; ctx.fillRect(0, GROUND - 60, W, 56);
  ctx.strokeStyle = 'rgba(251,243,208,.7)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=0;i<9;i++){ const y = GROUND - 56 + i*5.5, wv = Math.sin(t*2 + i)*6, wd = 34 - i*2; ctx.moveTo(mx - wd + wv, y); ctx.lineTo(mx + wd + wv, y); } ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.beginPath(); for (let i=0;i<12;i++){ const x = wrap(i*90 - camX*.8 + t*6, W + 60) - 30, y = GROUND - 50 + (i % 5)*9; ctx.moveTo(x, y); ctx.lineTo(x + 20, y); } ctx.stroke();
  // a fish leaping now and then
  const f = ws.fish; if (f.k < 1){ const x = f.x - camX + f.k*50, y = GROUND - 40 - Math.sin(f.k*Math.PI)*34; ctx.fillStyle = '#9ab8c8'; ctx.save(); ctx.translate(x, y); ctx.rotate(-1 + f.k*2); ctx.beginPath(); ctx.ellipse(0, 0, 9, 4, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-14, -4); ctx.lineTo(-14, 4); ctx.fill(); ctx.restore();
    ctx.strokeStyle = `rgba(255,255,255,${.5*(1 - f.k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(f.x - camX, GROUND - 40, 6 + f.k*16, 2 + f.k*4, 0, 0, 7); ctx.stroke(); }
  // a pair of loons floating
  for (const lx of [700, 1480]){ const x = par(lx, .9) + Math.sin(t*.3 + lx)*20, y = GROUND - 30; if (!onScreen(x, 30)) continue; ctx.fillStyle = '#1a1a22'; ctx.beginPath(); ctx.ellipse(x, y, 12, 5, 0, 0, 7); ctx.fill(); circle(x + 10, y - 7, 4); ctx.fillStyle = '#e8eef4'; ctx.fillRect(x - 8, y - 2, 12, 1.5); }
  // the dock, with the Dragonfly tied up (and the lantern someone left burning)
  { const x = par(L_DOCK, 1); if (onScreen(x, 160)){
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 20, GROUND - 58, 160, 12); for (let i=0;i<5;i++) ctx.fillRect(x - 14 + i*36, GROUND - 48, 6, 22);
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let i=0;i<9;i++){ ctx.moveTo(x - 20 + i*20, GROUND - 58); ctx.lineTo(x - 20 + i*20, GROUND - 46); } ctx.stroke();
    const by = GROUND - 40 + Math.sin(t*1.4)*1.5; ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.moveTo(x + 150, by - 8); ctx.lineTo(x + 250, by - 8); ctx.quadraticCurveTo(x + 244, by + 6, x + 226, by + 8); ctx.lineTo(x + 162, by + 8); ctx.quadraticCurveTo(x + 150, by + 2, x + 150, by - 8); ctx.fill();
    ctx.fillStyle = '#c9854a'; ctx.fillRect(x + 150, by - 11, 100, 4); ctx.fillStyle = '#f6ead6'; ctx.font = '700 8px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('DRAGONFLY', x + 200, by + 3); ctx.textAlign = 'left';
    const lg2 = ctx.createRadialGradient(x + 130, GROUND - 76, 2, x + 130, GROUND - 76, 50); lg2.addColorStop(0, 'rgba(255,220,130,.7)'); lg2.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = lg2; circle(x + 130, GROUND - 76, 50);
    ctx.fillStyle = '#4a3020'; ctx.fillRect(x + 128, GROUND - 92, 4, 36); ctx.fillStyle = '#ffe27a'; ctx.fillRect(x + 123, GROUND - 84, 14, 14); } }
  // shore
  ctx.fillStyle = '#3a4a56'; ctx.fillRect(0, GROUND - 8, W, H);
  ctx.fillStyle = '#4a5a66'; ctx.fillRect(0, GROUND - 8, W, 8);
  for (let i = Math.floor(camX/26) - 1; i*26 - camX < W + 26; i++){ ctx.fillStyle = hash(i) > .5 ? '#5a6a76' : '#4e5e6a'; ctx.beginPath(); ctx.ellipse(i*26 - camX + hash(i + 3)*14, GROUND + 10 + hash(i + 5)*40, 6 + hash(i)*5, 3 + hash(i + 1)*2, 0, 0, 7); ctx.fill(); }
  drawWarpBack();
  // the owl in its pine, head turning to watch you
  { const x = par(L_OWL, 1); if (onScreen(x, 90)){
    pine(x, GROUND, 260, '#16303e');
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, GROUND - 170); ctx.lineTo(x + 50, GROUND - 176); ctx.stroke();
    const ox = x + 34, oy = GROUND - 196, look = clamp((P.x - L_OWL)/200, -1, 1), blink = Math.sin(t*.6 + 1) > .95;
    ctx.fillStyle = '#8a6a4a'; ctx.beginPath(); ctx.ellipse(ox, oy, 14, 19, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#c9a882'; ctx.beginPath(); ctx.ellipse(ox, oy + 4, 9, 12, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(ox, oy - 18); ctx.rotate(look*.3);
    ctx.fillStyle = '#8a6a4a'; circle(0, 0, 13); ctx.beginPath(); ctx.moveTo(-11, -8); ctx.lineTo(-8, -18); ctx.lineTo(-3, -10); ctx.moveTo(11, -8); ctx.lineTo(8, -18); ctx.lineTo(3, -10); ctx.fill();
    for (const sd of [-1, 1]){ ctx.fillStyle = '#f2e2b0'; circle(sd*5.5, 0, 5); ctx.fillStyle = '#1e1a16'; if (blink) ctx.fillRect(sd*5.5 - 4, -.5, 8, 1.5); else circle(sd*5.5 + look*1.5, 0, 2.4); }
    ctx.fillStyle = '#e8a03a'; ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(2, 4); ctx.lineTo(0, 8); ctx.fill(); ctx.restore(); } }
  // the log cabin with warm windows
  { const x = par(L_CABIN, 1); if (onScreen(x, 160)){
    ctx.fillStyle = '#7a5230'; ctx.fillRect(x - 110, GROUND - 120, 220, 120);
    ctx.strokeStyle = '#5c3a22'; ctx.lineWidth = 3; ctx.beginPath(); for (let y = GROUND - 110; y < GROUND; y += 14){ ctx.moveTo(x - 110, y); ctx.lineTo(x + 110, y); } ctx.stroke();
    ctx.fillStyle = '#3a2a1e'; ctx.beginPath(); ctx.moveTo(x - 130, GROUND - 116); ctx.lineTo(x, GROUND - 190); ctx.lineTo(x + 130, GROUND - 116); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5c4336'; ctx.fillRect(x + 50, GROUND - 200, 22, 60); smoke(x + 61, GROUND - 204, .3);
    for (const wx of [-70, 40]){ const a = .8 + Math.sin(t*2 + wx)*.08; const wg = ctx.createRadialGradient(x + wx + 16, GROUND - 76, 2, x + wx + 16, GROUND - 76, 60); wg.addColorStop(0, `rgba(255,200,110,${a*.5})`); wg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = wg; circle(x + wx + 16, GROUND - 76, 60);
      ctx.fillStyle = `rgba(255,210,120,${a})`; ctx.fillRect(x + wx, GROUND - 92, 32, 30); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.strokeRect(x + wx, GROUND - 92, 32, 30); ctx.beginPath(); ctx.moveTo(x + wx + 16, GROUND - 92); ctx.lineTo(x + wx + 16, GROUND - 62); ctx.stroke(); }
    ctx.fillStyle = '#5c3a22'; ctx.fillRect(x - 18, GROUND - 70, 36, 70); ctx.fillStyle = '#c9a13a'; circle(x + 10, GROUND - 36, 2.5);
    ctx.fillStyle = '#6b4a2b'; for (let i=0;i<3;i++) for (let j=0;j<3 - i;j++){ ctx.beginPath(); ctx.arc(x + 128 + j*14 + i*7, GROUND - 7 - i*12, 7, 0, 7); ctx.fill(); ctx.fillStyle = '#c9a36a'; circle(x + 128 + j*14 + i*7, GROUND - 7 - i*12, 3.5); ctx.fillStyle = '#6b4a2b'; } } }
  // ...which is now the Moonlit Café: a striped awning, a hanging sign, an OPEN sign and a table outside
  { const x = par(L_CABIN, 1); if (onScreen(x, 200)){
    for (let i=0;i<11;i++){ ctx.fillStyle = i % 2 ? '#f6ead6' : '#3f6b5a'; ctx.beginPath(); ctx.moveTo(x - 110 + i*20, GROUND - 120); ctx.lineTo(x - 90 + i*20, GROUND - 120); ctx.lineTo(x - 88 + i*20, GROUND - 100); ctx.lineTo(x - 108 + i*20, GROUND - 100); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(x - 98 + i*20, GROUND - 100, 10, 0, Math.PI); ctx.fill(); }
    ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 60, GROUND - 190); ctx.lineTo(x - 60, GROUND - 170); ctx.moveTo(x + 60, GROUND - 190); ctx.lineTo(x + 60, GROUND - 170); ctx.stroke();
    ctx.fillStyle = '#2a2a2a'; rr(x - 78, GROUND - 176, 156, 34, 8); ctx.fill(); ctx.strokeStyle = '#c9a36a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#ffe9a8'; ctx.font = '700 15px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MOONLIT CAFÉ', x, GROUND - 159);
    const on = .75 + Math.sin(t*3)*.2; ctx.fillStyle = `rgba(255,106,160,${on})`; rr(x + 24, GROUND - 90, 36, 16, 4); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 10px "Pixelify Sans", monospace'; ctx.fillText('OPEN', x + 42, GROUND - 82);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    const tx = x - 170; ctx.fillStyle = '#6b4a2b'; ctx.fillRect(tx - 3, GROUND - 40, 6, 40); ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.ellipse(tx, GROUND - 40, 26, 6, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(tx - 8, GROUND - 54, 10, 12); ctx.fillStyle = '#ffe27a'; ctx.fillRect(tx + 6, GROUND - 56, 8, 12);
    for (const cx of [tx - 40, tx + 40]){ ctx.fillStyle = '#5c3a22'; ctx.fillRect(cx - 10, GROUND - 22, 20, 4); ctx.fillRect(cx - 8, GROUND - 22, 3, 22); ctx.fillRect(cx + 5, GROUND - 22, 3, 22); ctx.fillRect(cx + (cx < tx ? -10 : 7), GROUND - 44, 3, 22); }
  } }
  // the campfire
  { const x = par(L_FIRE, 1); if (onScreen(x, 90)){
    const fg = ctx.createRadialGradient(x, GROUND - 20, 4, x, GROUND - 20, 120); fg.addColorStop(0, 'rgba(255,170,80,.45)'); fg.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = fg; circle(x, GROUND - 20, 120);
    ctx.fillStyle = '#6b4a2b'; ctx.save(); ctx.translate(x, GROUND - 4); ctx.rotate(.3); ctx.fillRect(-26, -4, 52, 8); ctx.rotate(-.6); ctx.fillRect(-26, -4, 52, 8); ctx.restore();
    for (let i=0;i<3;i++){ const h = 26 + Math.sin(t*9 + i*2)*8 - i*6, w = 14 - i*3; ctx.fillStyle = ['#e0602a', '#f2a03a', '#ffe27a'][i]; ctx.beginPath(); ctx.moveTo(x - w, GROUND - 4); ctx.quadraticCurveTo(x - w*.6, GROUND - h*.6, x + Math.sin(t*7 + i)*3, GROUND - 4 - h); ctx.quadraticCurveTo(x + w*.6, GROUND - h*.6, x + w, GROUND - 4); ctx.fill(); }
    for (let i=0;i<6;i++){ const k = wrap(t*.6 + i/6, 1); ctx.fillStyle = `rgba(255,200,100,${1 - k})`; circle(x + Math.sin(k*8 + i)*10, GROUND - 30 - k*90, 1.6); }
    ctx.fillStyle = '#6f675c'; for (let i=0;i<7;i++){ ctx.beginPath(); ctx.ellipse(x - 30 + i*10, GROUND - 1 + Math.abs(i - 3)*.5, 6, 4, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#7a5230'; ctx.fillRect(x + 60, GROUND - 16, 60, 14); ctx.fillStyle = '#c9a36a'; ctx.beginPath(); ctx.ellipse(x + 60, GROUND - 9, 4, 7, 0, 0, 7); ctx.fill(); } }
  // reeds and fireflies along the shore
  for (let i = Math.floor(camX/140) - 1; i*140 - camX < W + 140; i++){ const x = i*140 - camX + hash(i + 40)*60; ctx.strokeStyle = '#2a4a3a'; ctx.lineWidth = 2; for (let r=0;r<4;r++){ ctx.beginPath(); ctx.moveTo(x + r*4, GROUND - 4); ctx.lineTo(x + r*4 + Math.sin(t + r)*2, GROUND - 30 - (r % 2)*8); ctx.stroke(); } }
  for (let i=0;i<16;i++){ const x = wrap(hash(i)*1400 - camX + Math.sin(t*.7 + i)*30, W + 40) - 20, y = GROUND - 30 - hash(i + 3)*80 + Math.sin(t*1.2 + i)*10, a = .3 + .7*Math.max(0, Math.sin(t*2 + i*3)); const fg = ctx.createRadialGradient(x, y, 0, x, y, 8); fg.addColorStop(0, `rgba(230,255,160,${a})`); fg.addColorStop(1, 'rgba(230,255,160,0)'); ctx.fillStyle = fg; circle(x, y, 8); }

  // the tennis court on the shore, with Luna waiting beside it
  { const x = par(L_COURT, 1); if (onScreen(x, 260)){
    ctx.fillStyle = '#8a5a44'; ctx.beginPath(); ctx.moveTo(x - 170, GROUND + 26); ctx.lineTo(x + 170, GROUND + 26); ctx.lineTo(x + 140, GROUND - 4); ctx.lineTo(x - 140, GROUND - 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 160, GROUND + 22); ctx.lineTo(x + 160, GROUND + 22); ctx.lineTo(x + 134, GROUND); ctx.lineTo(x - 134, GROUND); ctx.closePath(); ctx.moveTo(x, GROUND); ctx.lineTo(x, GROUND + 22); ctx.stroke();
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(x - 3, GROUND - 40, 5, 64);
    ctx.strokeStyle = 'rgba(240,240,240,.55)'; ctx.lineWidth = 1; ctx.beginPath(); for (let yy = GROUND - 36; yy < GROUND + 20; yy += 7){ ctx.moveTo(x - 7, yy); ctx.lineTo(x + 7, yy); } ctx.stroke();
    ctx.fillStyle = '#f6ead6'; ctx.fillRect(x - 8, GROUND - 42, 16, 4);
    for (const lx of [x - 190, x + 190]){ const lg = ctx.createRadialGradient(lx, GROUND - 110, 2, lx, GROUND - 110, 60); lg.addColorStop(0, 'rgba(255,220,130,.45)'); lg.addColorStop(1, 'rgba(255,220,130,0)'); ctx.fillStyle = lg; circle(lx, GROUND - 110, 60); ctx.fillStyle = '#4a3020'; ctx.fillRect(lx - 3, GROUND - 110, 6, 110); ctx.fillStyle = '#ffe27a'; ctx.fillRect(lx - 7, GROUND - 118, 14, 14); }
    drawLuna(x + 120, GROUND + 6, near && near.court);
  } }
  // the little cabin at the end of the shore (you can go in)
  { const x = par(L_CABIN2, 1); if (onScreen(x, 160)){
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 90, GROUND - 110, 180, 110);
    ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 3; ctx.beginPath(); for (let y = GROUND - 100; y < GROUND; y += 13){ ctx.moveTo(x - 90, y); ctx.lineTo(x + 90, y); } ctx.stroke();
    ctx.fillStyle = '#2e2218'; ctx.beginPath(); ctx.moveTo(x - 108, GROUND - 106); ctx.lineTo(x, GROUND - 176); ctx.lineTo(x + 108, GROUND - 106); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5c4336'; ctx.fillRect(x - 60, GROUND - 180, 20, 50); smoke(x - 50, GROUND - 184, .7);
    const a = .8 + Math.sin(t*2)*.08, wg = ctx.createRadialGradient(x + 50, GROUND - 70, 2, x + 50, GROUND - 70, 50); wg.addColorStop(0, `rgba(255,200,110,${a*.5})`); wg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = wg; circle(x + 50, GROUND - 70, 50);
    ctx.fillStyle = `rgba(255,210,120,${a})`; circle(x + 50, GROUND - 70, 14); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x + 50, GROUND - 70, 14, 0, 7); ctx.moveTo(x + 36, GROUND - 70); ctx.lineTo(x + 64, GROUND - 70); ctx.stroke();
    ctx.fillStyle = '#4a2e1a'; ctx.fillRect(x - 30, GROUND - 66, 34, 66); ctx.fillStyle = '#c9a13a'; circle(x - 4, GROUND - 32, 2.5);
    ctx.fillStyle = '#ffe27a'; ctx.fillRect(x - 44, GROUND - 76, 8, 10);
  } }
  // the ski hut at the far end of the shore, with a snowy slope and a chairlift up the mountain
  { const x = par(L_SKI, 1); if (onScreen(x, 540)){
    const sg = ctx.createLinearGradient(0, GROUND - 360, 0, GROUND); sg.addColorStop(0, '#c8d6ec'); sg.addColorStop(1, '#8ea4c4');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(x - 220, GROUND); ctx.quadraticCurveTo(x + 40, GROUND - 30, x + 160, GROUND - 170); ctx.lineTo(x + 330, GROUND - 360); ctx.lineTo(x + 560, GROUND - 360); ctx.lineTo(x + 560, GROUND); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 220, GROUND); ctx.quadraticCurveTo(x + 40, GROUND - 30, x + 160, GROUND - 170); ctx.lineTo(x + 330, GROUND - 360); ctx.stroke();
    // a skier's zigzag tracks down the slope
    ctx.strokeStyle = 'rgba(110,130,180,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + 300, GROUND - 330); for (let i=1;i<7;i++) ctx.lineTo(x + 300 - i*44 + (i % 2 ? 40 : -10), GROUND - 330 + i*52); ctx.stroke();
    for (const [dx, dy, h] of [[200, 150, 70], [260, 210, 60], [330, 120, 80], [410, 270, 55], [460, 170, 70], [520, 300, 60]]){ pine(x + dx, GROUND - dy, h, '#1d3d4a');
      ctx.fillStyle = '#eef4fb'; ctx.beginPath(); ctx.moveTo(x + dx - h*.13, GROUND - dy - h*.98); ctx.lineTo(x + dx, GROUND - dy - h*1.17); ctx.lineTo(x + dx + h*.13, GROUND - dy - h*.98); ctx.closePath(); ctx.fill(); }
    // the chairlift: two towers, a cable, and little chairs creeping up the mountain
    const t0 = [x + 30, GROUND - 160], t1 = [x + 320, GROUND - 480];
    ctx.fillStyle = '#4a4a5a'; ctx.fillRect(t0[0] - 4, t0[1], 8, 158); ctx.fillRect(t0[0] - 22, t0[1] - 4, 44, 6); ctx.fillRect(t1[0] - 4, t1[1], 8, 150); ctx.fillRect(t1[0] - 22, t1[1] - 4, 44, 6);
    ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(t0[0] - 18, t0[1]); ctx.lineTo(t1[0] - 18, t1[1]); ctx.moveTo(t0[0] + 18, t0[1]); ctx.lineTo(t1[0] + 18, t1[1]); ctx.stroke();
    for (let k=0;k<5;k++){ const up = k % 2 === 0, u = wrap((reduceMotion ? 0 : t*.04)*(up ? 1 : -1) + k/5, 1), side = up ? 18 : -18;
      const cx = t0[0] + side + (t1[0] - t0[0])*u, cy = t0[1] + (t1[1] - t0[1])*u;
      ctx.strokeStyle = '#2a2a3a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy + 22); ctx.stroke();
      ctx.fillStyle = up ? '#d0452f' : '#3f7ad0'; rr(cx - 11, cy + 20, 22, 6, 2); ctx.fill(); ctx.fillRect(cx + (up ? 8 : -11), cy + 10, 3, 12); }
    // the hut, with warm windows, a snowy roof and a rack of skis
    const hx = x - 80;
    ctx.fillStyle = '#7a5230'; ctx.fillRect(hx - 60, GROUND - 90, 120, 90);
    ctx.strokeStyle = '#5c3a22'; ctx.lineWidth = 3; ctx.beginPath(); for (let y = GROUND - 80; y < GROUND; y += 13){ ctx.moveTo(hx - 60, y); ctx.lineTo(hx + 60, y); } ctx.stroke();
    ctx.fillStyle = '#3a2a1e'; ctx.beginPath(); ctx.moveTo(hx - 76, GROUND - 86); ctx.lineTo(hx, GROUND - 140); ctx.lineTo(hx + 76, GROUND - 86); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#eef4fb'; ctx.beginPath(); ctx.moveTo(hx - 80, GROUND - 84); ctx.lineTo(hx, GROUND - 146); ctx.lineTo(hx + 80, GROUND - 84); ctx.lineTo(hx + 66, GROUND - 90); ctx.lineTo(hx, GROUND - 134); ctx.lineTo(hx - 66, GROUND - 90); ctx.closePath(); ctx.fill();
    for (let i=0;i<7;i++){ ctx.fillStyle = '#e8f2ff'; ctx.fillRect(hx - 70 + i*20, GROUND - 88, 3, 6 + (i % 3)*3); }
    const a = .8 + Math.sin(t*2)*.08, wg = ctx.createRadialGradient(hx + 30, GROUND - 56, 2, hx + 30, GROUND - 56, 50); wg.addColorStop(0, `rgba(255,200,110,${a*.5})`); wg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = wg; circle(hx + 30, GROUND - 56, 50);
    ctx.fillStyle = `rgba(255,210,120,${a})`; ctx.fillRect(hx + 16, GROUND - 68, 28, 24); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.strokeRect(hx + 16, GROUND - 68, 28, 24);
    ctx.fillStyle = '#4a2e1a'; ctx.fillRect(hx - 40, GROUND - 60, 30, 60); ctx.fillStyle = '#c9a13a'; circle(hx - 16, GROUND - 30, 2.5);
    ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(hx - 40, GROUND - 170); ctx.lineTo(hx - 40, GROUND - 140); ctx.moveTo(hx + 40, GROUND - 170); ctx.lineTo(hx + 40, GROUND - 140); ctx.stroke();
    ctx.fillStyle = '#2a2a2a'; rr(hx - 70, GROUND - 190, 140, 30, 8); ctx.fill(); ctx.strokeStyle = '#c9a36a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#e8f2ff'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MOONLIGHT SLOPE', hx, GROUND - 175); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#5c3a22'; ctx.fillRect(hx - 130, GROUND - 50, 50, 5);
    for (let i=0;i<3;i++){ const sx = hx - 124 + i*16; ctx.save(); ctx.translate(sx, GROUND); ctx.rotate(-.12); ctx.fillStyle = ['#d0452f', '#3f7ad0', '#f2c230'][i]; rr(-3, -72, 4, 72, 2); ctx.fill(); rr(3, -72, 4, 72, 2); ctx.fill(); ctx.restore(); }
  } }
  // a pebble glowing like a tiny moon
  if (!Save.count('moonpebble')){ const x = par(L_PEBBLE, 1); if (onScreen(x, 40)){ const pg = ctx.createRadialGradient(x, GROUND + 6, 1, x, GROUND + 6, 24); pg.addColorStop(0, 'rgba(230,240,255,.8)'); pg.addColorStop(1, 'rgba(230,240,255,0)'); ctx.fillStyle = pg; circle(x, GROUND + 6, 24); itemIcon(ctx, 'moonpebble', x, GROUND + 6, .5); } }
  drawPlayer();
  if (ws.fire > 0){ const x = P.x - camX; ctx.fillStyle = `rgba(255,120,120,${Math.min(1, ws.fire)})`; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('♥', x + 18, GROUND - 90 - (2 - ws.fire)*10); ctx.textAlign = 'left'; }
}
// Luna the owl, standing on the ground with her racket

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
const LUNA_IMG = loadImg('characters/luna.png');
function drawLuna(x, base, tagged){
  const h = 104;
  drawLunaPic(ctx, LUNA_IMG, x, base + 2, h, t, reduceMotion ? 0 : Math.max(0, Math.sin(t*3))*.12, true);
  if (tagged){ ctx.font = '700 14px "Pixelify Sans", monospace'; const tw = ctx.measureText('Luna').width + 20, ty = base - h - 16;
    ctx.fillStyle = 'rgba(43,33,24,.85)'; rr(x - tw/2, ty - 12, tw, 24, 8); ctx.fill(); ctx.fillStyle = '#f6ead6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Luna', x, ty); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
}
// play Luna again by the lake; win or lose, you come back here afterwards
function playLakeTennis(){
  transition(() => startWorldGame('moonlake', 'cove', { label:'Back to the lake', leave:'← Lake', done:() => {
    P.x = L_COURT - 120; P.face = 1; P.vx = 0; P.target = null; pending = null;
    camX = clamp(P.x - W*.42, 0, currentWorld.w - W);
    fadeA = 1; fadeDir = -1; fadeWarp = true; fadeMid = null; showScreen(screenEl);
  } }));
}
// ride the chairlift up and ski down the Moonlight Slope; win or lose, you come back to the ski hut
function goSkiing(){
  transition(() => startWorldGame('ski', 'cove', { label:'Back to the lake', leave:'← Lake', done:() => {
    P.x = L_SKI - 150; P.face = 1; P.vx = 0; P.target = null; pending = null;
    camX = clamp(P.x - W*.42, 0, currentWorld.w - W);
    fadeA = 1; fadeDir = -1; fadeWarp = true; fadeMid = null; showScreen(screenEl);
  } }));
}
// inside the little lakeside cabin
function enterLakeCabin(){ transition(() => { scene = 'secret'; currentSecret = SECRETS.lakecabin; P.x = 150; P.face = 1; P.vx = 0; camX = 0; }); }
function leaveLakeCabin(){ transition(() => { scene = 'world'; currentSecret = null; P.x = L_CABIN2 + 30; P.face = 1; P.vx = 0; camX = clamp(P.x - W*.42, 0, currentWorld.w - W); }); }
function drawLakeCabin(){
  // log walls
  for (let y = 0; y < GROUND; y += 26){ ctx.fillStyle = (y/26) % 2 ? '#7a5230' : '#6b4a2b'; ctx.fillRect(0, y, W, 26); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, y + 22, W, 4); }
  ctx.fillStyle = '#4a3020'; ctx.fillRect(0, 0, W, 30);
  // a window onto the moon and the lake
  const sky = ctx.createLinearGradient(0, 110, 0, 230); sky.addColorStop(0, '#0f2438'); sky.addColorStop(1, '#2e5a6e');
  ctx.fillStyle = sky; ctx.fillRect(210, 110, 110, 120);
  ctx.fillStyle = '#fbf3d0'; circle(282, 140, 14); ctx.fillStyle = '#16384e'; ctx.fillRect(210, 196, 110, 34);
  ctx.strokeStyle = 'rgba(251,243,208,.6)'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=0;i<4;i++){ const wv = Math.sin(t*2 + i)*3; ctx.moveTo(272 + wv, 202 + i*6); ctx.lineTo(292 + wv, 202 + i*6); } ctx.stroke();
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 6; ctx.strokeRect(210, 110, 110, 120); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(265, 110); ctx.lineTo(265, 230); ctx.moveTo(210, 170); ctx.lineTo(320, 170); ctx.stroke();
  ctx.fillStyle = '#3f6b5a'; for (const sd of [-1, 1]){ ctx.beginPath(); ctx.moveTo(265 + sd*72, 100); ctx.lineTo(265 + sd*52, 100); ctx.quadraticCurveTo(265 + sd*58, 170, 265 + sd*68, 238); ctx.lineTo(265 + sd*74, 238); ctx.closePath(); ctx.fill(); }
  // the stone fireplace, with a round mirror above it (the Realm Gate)
  const fx = CABIN_GATE.x;
  ctx.fillStyle = '#6f675c'; ctx.fillRect(fx - 90, GROUND - 150, 180, 150); ctx.fillRect(fx - 40, 30, 80, GROUND - 180);
  ctx.fillStyle = '#8a8072'; for (let r=0;r<6;r++) for (let i=0;i<5;i++){ rr(fx - 88 + i*36 + (r % 2)*14, GROUND - 146 + r*24, 30, 20, 4); ctx.fill(); }
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(fx - 100, GROUND - 158, 200, 12);
  ctx.fillStyle = '#1e140c'; ctx.beginPath(); ctx.moveTo(fx - 50, GROUND); ctx.lineTo(fx - 50, GROUND - 70); ctx.quadraticCurveTo(fx, GROUND - 110, fx + 50, GROUND - 70); ctx.lineTo(fx + 50, GROUND); ctx.closePath(); ctx.fill();
  const fg = ctx.createRadialGradient(fx, GROUND - 20, 4, fx, GROUND - 20, 140); fg.addColorStop(0, 'rgba(255,170,80,.5)'); fg.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = fg; circle(fx, GROUND - 20, 140);
  for (let i=0;i<3;i++){ const h = 36 + Math.sin(t*9 + i*2)*8 - i*8, w = 20 - i*5; ctx.fillStyle = ['#e0602a', '#f2a03a', '#ffe27a'][i]; ctx.beginPath(); ctx.moveTo(fx - w, GROUND - 6); ctx.quadraticCurveTo(fx - w*.6, GROUND - h*.6, fx + Math.sin(t*7 + i)*3, GROUND - 6 - h); ctx.quadraticCurveTo(fx + w*.6, GROUND - h*.6, fx + w, GROUND - 6); ctx.fill(); }
  ctx.fillStyle = '#c9a13a'; circle(CABIN_GATE.x, CABIN_GATE.y, 32);
  const mg = ctx.createRadialGradient(CABIN_GATE.x - 8, CABIN_GATE.y - 8, 2, CABIN_GATE.x, CABIN_GATE.y, 27); mg.addColorStop(0, '#dfe8f4'); mg.addColorStop(1, '#8a9ab8');
  ctx.fillStyle = mg; circle(CABIN_GATE.x, CABIN_GATE.y, 26);
  // look closely: the stars in the mirror aren't the stars outside
  ctx.save(); ctx.beginPath(); ctx.arc(CABIN_GATE.x, CABIN_GATE.y, 26, 0, 7); ctx.clip();
  ctx.fillStyle = 'rgba(120,80,190,.25)'; circle(CABIN_GATE.x + 6, CABIN_GATE.y + 6, 20);
  for (let i=0;i<7;i++){ const a = i*.9 + t*.2; ctx.fillStyle = `rgba(255,255,255,${.4 + .4*Math.sin(t*2 + i)})`; circle(CABIN_GATE.x + Math.cos(a)*14, CABIN_GATE.y + Math.sin(a)*10, 1.2); }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.ellipse(CABIN_GATE.x - 10, CABIN_GATE.y - 10, 7, 4, -.6, 0, 7); ctx.fill();
  gateGlint(CABIN_GATE.x + 20, CABIN_GATE.y - 20);
  // the table with two warm cups and a note
  ctx.fillStyle = '#8a5a32'; ctx.fillRect(360, GROUND - 60, 110, 10); ctx.fillRect(368, GROUND - 50, 8, 50); ctx.fillRect(454, GROUND - 50, 8, 50);
  for (const cx of [388, 440]){ ctx.fillStyle = '#e8e0d0'; ctx.fillRect(cx - 7, GROUND - 76, 14, 16); ctx.strokeStyle = '#e8e0d0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(cx + 9, GROUND - 68, 4, -1.3, 1.3); ctx.stroke();
    if (!reduceMotion){ ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx, GROUND - 80); ctx.quadraticCurveTo(cx - 4 + Math.sin(t*2 + cx)*3, GROUND - 90, cx + 1, GROUND - 100); ctx.stroke(); } }
  ctx.fillStyle = '#f6ead6'; ctx.save(); ctx.translate(414, GROUND - 64); ctx.rotate(-.1); ctx.fillRect(-10, -5, 20, 10); ctx.restore();
  // a rocking chair by the fire, and a rug
  ctx.fillStyle = 'rgba(208,69,47,.55)'; ctx.beginPath(); ctx.ellipse(470, GROUND + 30, 150, 16, 0, 0, 7); ctx.fill();
  { const rock = reduceMotion ? 0 : Math.sin(t*1.4)*.08; ctx.save(); ctx.translate(700, GROUND - 4); ctx.rotate(rock);
    ctx.strokeStyle = '#6b4226'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, -80, 90, Math.PI*.38, Math.PI*.62); ctx.stroke();
    ctx.fillStyle = '#7a5230'; ctx.fillRect(-30, -40, 60, 8); ctx.fillRect(22, -110, 8, 72); ctx.fillRect(-26, -40, 6, 34); ctx.fillRect(20, -40, 6, 34);
    ctx.fillStyle = '#3f6b5a'; rr(-26, -52, 52, 14, 6); ctx.fill(); ctx.restore(); }
  // the door back out
  const dg = ctx.createLinearGradient(0, GROUND - 120, 0, GROUND); dg.addColorStop(0, '#0f2438'); dg.addColorStop(1, '#2e5a6e');
  ctx.fillStyle = dg; ctx.fillRect(60, GROUND - 120, 64, 120); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 6; ctx.strokeRect(60, GROUND - 120, 64, 120);
  ctx.fillStyle = '#fbf3d0'; circle(100, GROUND - 90, 6);
  // floorboards
  ctx.fillStyle = '#8a6a4a'; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.strokeStyle = 'rgba(40,24,12,.3)'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = GROUND + 14; y < H; y += 16){ ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
  drawPlayer();
  const vg = ctx.createRadialGradient(W/2, H/2, 220, W/2, H/2, 540); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,4,.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
SECRETS.lakecabin = { start:150, draw:drawLakeCabin, max:740, spots:[
  { x:92, r:55, hit:[60, 124], stand:110, gap:0, label:'Go back outside', open:() => leaveLakeCabin() },
  { x:414, r:60, hit:[360, 470], stand:414, gap:0, label:'Look at the table', open:() => openMystery('The Table', 'Two cups of cocoa, still warm, and a little note in loopy writing: “Gone to the court. Come and play! — Luna”', '') },
  { x:250, r:50, hit:[210, 320], hitY:[100, 240], stand:265, gap:0, label:'Look out the window', open:() => openMystery('The Window', 'The moon is sitting right on top of the lake, like it came down for a drink.', '') },
]};

// the first cabin on the shore is the Moonlit Café. Walk up to the counter to work a shift.
function enterFirstCabin(){ transition(() => { scene = 'secret'; currentSecret = SECRETS.firstcabin; P.x = 235; P.face = 1; P.vx = 0; camX = 0; }); }
function leaveFirstCabin(){ transition(() => { scene = 'world'; currentSecret = null; P.x = L_CABIN + 20; P.face = 1; P.vx = 0; camX = clamp(P.x - W*.42, 0, currentWorld.w - W); }); }
// play the café game; win or lose, you come back to the counter
function workCafeShift(){
  transition(() => startWorldGame('cafe', 'cove', { label:'Back to the café', leave:'← Café', done:() => {
    scene = 'secret'; currentSecret = SECRETS.firstcabin; P.x = 450; P.face = 1; P.vx = 0; P.target = null; pending = null; camX = 0;
    fadeA = 1; fadeDir = -1; fadeWarp = false; fadeMid = null; showScreen(screenEl);
  } }));
}
const BARISTA_PIC = loadImg('characters/barista.png'), HAZEL_PIC = loadImg('characters/hazel.png');
// a picture standing on (x, y), h tall, facing right (face 1) or left (-1), feet `fx` of the way across
function standPic(img, x, y, h, face, fx){ if (!img.complete || !img.naturalWidth) return; const w = h*img.naturalWidth/img.naturalHeight; ctx.save(); ctx.translate(x, y); ctx.scale(face, 1); ctx.drawImage(img, -w*fx, -h, w, h); ctx.restore(); }
const JUNIPER_LINES = [
  '“Welcome to the Moonlit Café! I’m Juniper. I make the cocoa, the cookies and, on Tuesdays, a very good lemon cake.”',
  '“If you’d like to help behind the counter, the apron’s on the hook. Customers here are lovely… mostly.”',
  '“Luna comes in every evening for cocoa with two marshmallows. Never one. Never three.”',
  '“Sometimes a customer comes in who glows a little. I never ask where she’s from.”',
];
let juniperLine = 0;
function drawFirstCabin(){
  // warm plank walls
  ctx.fillStyle = '#7a5838'; ctx.fillRect(0, 0, W, GROUND);
  ctx.strokeStyle = 'rgba(40,24,12,.3)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = 20; x < W; x += 44){ ctx.moveTo(x, 30); ctx.lineTo(x, GROUND); } ctx.stroke();
  ctx.fillStyle = '#5c3a22'; ctx.fillRect(0, 0, W, 30);
  // a window onto the lake
  const sky = ctx.createLinearGradient(0, 70, 0, 190); sky.addColorStop(0, '#0f2438'); sky.addColorStop(1, '#2e5a6e');
  ctx.fillStyle = sky; ctx.fillRect(40, 70, 140, 120); ctx.fillStyle = '#fbf3d0'; circle(140, 100, 14); ctx.fillStyle = '#16384e'; ctx.fillRect(40, 160, 140, 30);
  ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 6; ctx.strokeRect(40, 70, 140, 120); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(110, 70); ctx.lineTo(110, 190); ctx.stroke();
  // the chalkboard menu
  ctx.fillStyle = '#2a2a2a'; rr(360, 50, 200, 100, 8); ctx.fill(); ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 6; ctx.stroke();
  ctx.fillStyle = '#f6ead6'; ctx.font = '700 15px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('MOONLIT CAFÉ', 460, 76);
  ctx.font = '600 12px Nunito, sans-serif'; ctx.fillStyle = 'rgba(246,234,214,.85)'; ctx.fillText('Cocoa · Tea · Milkshakes', 460, 100); ctx.fillText('Cookies · Cake', 460, 120); ctx.fillText('Help wanted! Ask at the counter', 460, 140); ctx.textAlign = 'left';
  // hanging lamps
  for (const lx of [300, 620]){ const lg = ctx.createRadialGradient(lx, 90, 2, lx, 90, 130); lg.addColorStop(0, 'rgba(255,214,130,.35)'); lg.addColorStop(1, 'rgba(255,214,130,0)'); ctx.fillStyle = lg; circle(lx, 90, 130);
    ctx.strokeStyle = '#2b1a0c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx, 30); ctx.lineTo(lx, 76); ctx.stroke(); ctx.fillStyle = '#ffe27a'; ctx.beginPath(); ctx.moveTo(lx - 12, 90); ctx.lineTo(lx + 12, 90); ctx.lineTo(lx + 6, 76); ctx.lineTo(lx - 6, 76); ctx.closePath(); ctx.fill(); }
  // shelves of jars and cups behind the counter
  ctx.fillStyle = '#5c3a22'; ctx.fillRect(590, 180, 180, 8); ctx.fillRect(590, 230, 180, 8);
  for (let i=0;i<6;i++){ ctx.fillStyle = ['#e8e0d0', '#d09a4a', '#e79ab8'][i % 3]; ctx.fillRect(598 + i*28, 164, 16, 16); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(600 + i*28, 216, 12, 14); }
  // the counter, with an espresso machine and a cake stand
  const cx0 = 380, cx1 = 780;
  ctx.fillStyle = '#9a9aa2'; rr(420, GROUND - 150, 70, 60, 8); ctx.fill(); ctx.fillStyle = '#5a5a62'; ctx.fillRect(436, GROUND - 112, 38, 8); ctx.fillStyle = '#d0452f'; circle(455, GROUND - 132, 7);
  if (!reduceMotion){ ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(480, GROUND - 152); ctx.quadraticCurveTo(476 + Math.sin(t*2)*4, GROUND - 170, 482, GROUND - 188); ctx.stroke(); }
  ctx.fillStyle = 'rgba(220,240,255,.35)'; ctx.beginPath(); ctx.arc(650, GROUND - 104, 30, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#e79ab8'; ctx.fillRect(630, GROUND - 114, 40, 14); ctx.fillStyle = '#f6ead6'; ctx.fillRect(630, GROUND - 104, 40, 12); ctx.fillStyle = '#d0452f'; circle(650, GROUND - 118, 4);
  // Juniper the goat, who owns the café, behind the counter
  standPic(BARISTA_PIC, 728, GROUND - 14 - (reduceMotion ? 0 : Math.sin(t*1.6)*2), 200, -1, .54);
  ctx.fillStyle = '#8a5a32'; ctx.fillRect(cx0, GROUND - 92, cx1 - cx0, 12); ctx.fillStyle = '#7a4a28'; ctx.fillRect(cx0 + 6, GROUND - 80, cx1 - cx0 - 12, 80);
  ctx.strokeStyle = 'rgba(40,24,12,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let x = cx0 + 60; x < cx1; x += 70){ ctx.moveTo(x, GROUND - 76); ctx.lineTo(x, GROUND - 4); } ctx.stroke();
  // a little apron hanging on a hook: "put me on to work a shift"
  ctx.fillStyle = '#3f6b5a'; ctx.beginPath(); ctx.moveTo(540, GROUND - 180); ctx.lineTo(560, GROUND - 180); ctx.lineTo(566, GROUND - 130); ctx.lineTo(534, GROUND - 130); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c9a36a'; circle(550, GROUND - 184, 3);
  // two little tables with chairs
  for (const tx of [250, 150]){ ctx.fillStyle = '#6b4a2b'; ctx.fillRect(tx - 3, GROUND - 46, 6, 46); ctx.fillStyle = '#8a5a32'; ctx.beginPath(); ctx.ellipse(tx, GROUND - 46, 30, 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(tx - 6, GROUND - 60, 10, 12); }
  // floor and rug
  ctx.fillStyle = '#7a5a3e'; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.strokeStyle = 'rgba(40,24,12,.3)'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = GROUND + 14; y < H; y += 16){ ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
  ctx.fillStyle = 'rgba(63,107,90,.55)'; ctx.beginPath(); ctx.ellipse(420, GROUND + 34, 220, 16, 0, 0, 7); ctx.fill();
  // the door back out
  const dg = ctx.createLinearGradient(0, GROUND - 120, 0, GROUND); dg.addColorStop(0, '#0f2438'); dg.addColorStop(1, '#2e5a6e');
  ctx.fillStyle = dg; ctx.fillRect(210, GROUND - 120, 50, 120); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 5; ctx.strokeRect(210, GROUND - 120, 50, 120);
  drawPlayer();
  const vg = ctx.createRadialGradient(W/2, H/2, 220, W/2, H/2, 540); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,4,.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
SECRETS.firstcabin = { start:235, draw:drawFirstCabin, max:740, spots:[
  { x:235, r:40, hit:[210, 260], stand:235, gap:0, label:'Go back outside', open:() => leaveFirstCabin() },
  { x:450, r:110, hit:[380, 680], stand:450, gap:0, label:'Work a shift at the café', open:() => workCafeShift() },
  { x:720, r:60, hit:[680, 780], stand:680, gap:0, label:'Talk to Juniper', open:() => { P.anim.happy = 1; openMystery('Juniper', JUNIPER_LINES[juniperLine], ''); juniperLine = (juniperLine + 1) % JUNIPER_LINES.length; } },
  { x:110, r:60, hit:[40, 180], hitY:[60, 200], stand:110, gap:0, label:'Look out the window', open:() => openMystery('The Window', 'Moonlight on the lake, and the lanterns of the tennis court twinkling further along the shore.', '') },
]};

function moonlakeSpots(){ return [
  { x:L_OWL, r:70, hit:[L_OWL - 20, L_OWL + 70], stand:L_OWL - 20, gap:0, label:'Say hello to the owl', open:() => openMystery('The Owl', 'Hoo! The owl tilts its head all the way sideways, blinks twice, then points one wing across the lake toward the mountains.', '') },
  { x:L_CABIN, r:90, hit:[L_CABIN - 110, L_CABIN + 110], stand:L_CABIN - 10, gap:0, label:'Go into the Moonlit Caf\u00e9', open:() => enterFirstCabin() },
  { x:L_FIRE, r:80, hit:[L_FIRE - 60, L_FIRE + 120], stand:L_FIRE - 50, gap:0, label:'Tell campfire stories with Luna', open:() => { ws.fire = 2; playHere('campfire', 'Back to the lake', '← Moonlit Lake', L_FIRE - 50); } },
  { x:L_DOCK + 100, r:90, hit:[L_DOCK - 20, L_DOCK + 250], stand:L_DOCK + 60, gap:0, label:'Look at the Dragonfly', open:() => openMystery('The Dock', 'Your little boat is tied up right where you left it, and the lantern on the dock is still burning. Someone must be keeping it lit…', '') },
  { x:L_COURT, r:150, hit:[L_COURT - 170, L_COURT + 170], stand:L_COURT - 120, gap:0, court:true, label:'Play tennis with Luna', open:() => playLakeTennis() },
  { x:L_CABIN2, r:80, hit:[L_CABIN2 - 90, L_CABIN2 + 90], stand:L_CABIN2 - 14, gap:0, label:'Go into the cabin', open:() => enterLakeCabin() },
  { x:L_SKI - 80, r:110, hit:[L_SKI - 220, L_SKI + 60], stand:L_SKI - 150, gap:0, label:'Go skiing on the Moonlight Slope', open:() => goSkiing() },
  { x:L_PEBBLE, r:60, hit:[L_PEBBLE - 40, L_PEBBLE + 40], stand:L_PEBBLE - 30, gap:0, label: Save.count('moonpebble') ? 'Look at the shore' : 'Pick up the glowing pebble', open:() => findThing('moonpebble', 'A Moon Pebble', 'A smooth pebble that glows softly, like a tiny piece of the moon. It’s cool in your paws.', 'Just ordinary pebbles and moonlight now.') },
]; }

// ---------- Neon City ----------
// reached through the Moonlit Café: after 3 finished shifts, 3 star beans bring a neon visitor,
// and serving them opens the warp to Neon Beats. Win that and you arrive here.
const C_STAGE = 560, C_NOODLE = 1000, C_KIOSK = 1420, C_GARAGE = 1630, C_VEND = 1840, C_SURF = 2260, C_W = 2750;
const CITY_TOWERS_FAR = (() => { const r = rng(71), a = []; for (let i=0;i<40;i++) a.push({ x:i*70 + r()*30, w:40 + r()*40, h:90 + r()*140, s:r() }); return a; })();
const CITY_TOWERS_MID = (() => { const r = rng(72), a = []; for (let i=0;i<26;i++) a.push({ x:i*130 + r()*50, w:60 + r()*50, h:150 + r()*150, s:r(), col:r() < .5 ? '255,106,213' : '90,220,255' }); return a; })();
WORLDS.city = { name:'Neon City', w:C_W, hub:() => ({ x:C_VEND + 18, y:GROUND - 70 }),
  init:() => ({ noodles:true, tram:{ x:-400, t:2 }, drone:{ x:260, y:GROUND - 170 }, cars:[0, 1, 2, 3, 4, 5].map(i => ({ y:100 + (i % 3)*44, x:Math.random()*W, v:(i % 2 ? 1 : -1)*(120 + i*30), col:i % 2 ? '255,90,90' : '255,250,220' })) }),
  draw:() => drawCity(), update:dt => updateCity(dt), spots:() => citySpots() };
function updateCity(dt){
  for (const c of ws.cars){ c.x += c.v*dt; if (c.x > W + 60) c.x = -60; if (c.x < -60) c.x = W + 60; }
  const tr = ws.tram; if (tr.x < -300){ tr.t -= dt; if (tr.t <= 0){ tr.x = -250; } } else { tr.x += 260*dt; if (tr.x > W + 300){ tr.x = -400; tr.t = 6 + Math.random()*5; } }
  const d = ws.drone; d.x += (P.x + 70*P.face - d.x)*Math.min(1, dt*1.5); d.y = GROUND - 170 + Math.sin(t*2)*10;
  tickPops(dt);
}
function neonTube(x0, y0, x1, y1, col, a){ ctx.strokeStyle = `rgba(${col},${a*.25})`; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = 3; ctx.stroke(); }
function neonText(txt, x, y, size, col, flicker){
  const a = flicker && !reduceMotion && Math.sin(t*23) > .92 ? .35 : 1;
  ctx.font = `700 ${size}px "Pixelify Sans", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = `rgba(${col},${.25*a})`; for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) ctx.fillText(txt, x + dx, y + dy);
  ctx.fillStyle = `rgba(${col},${a})`; ctx.fillText(txt, x, y); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
function drawCity(){
  // as part of the Neon world, the sky and both skylines come from the shared neon backdrop instead
  const ownSky = !(currentWorld && currentWorld.joined);
  if (ownSky){
  const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#0b0620'); g.addColorStop(.55, '#2a0f4a'); g.addColorStop(1, '#4a1a5a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i=0;i<70;i++){ const x = wrap(hash(i)*1200 - camX*.02, 1200) - 200; ctx.fillStyle = `rgba(255,255,255,${.3 + .5*Math.max(0, Math.sin(t*1.3 + i))})`; circle(x, hash(i + 5)*200, hash(i + 2)*1.2 + .4); }
  }
  if (ownSky){
  // a giant ringed planet and two moons
  { const x = par(640, .03); const pg = ctx.createRadialGradient(x, 110, 30, x, 110, 150); pg.addColorStop(0, 'rgba(90,160,255,.4)'); pg.addColorStop(1, 'rgba(90,160,255,0)'); ctx.fillStyle = pg; circle(x, 110, 150);
    ctx.fillStyle = '#3a6ad0'; circle(x, 110, 68); ctx.fillStyle = 'rgba(150,210,255,.35)'; circle(x - 20, 90, 30); ctx.fillStyle = 'rgba(20,40,110,.4)'; ctx.fillRect(x - 68, 120, 136, 10);
    ctx.strokeStyle = 'rgba(160,230,255,.75)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x, 110, 118, 22, -.18, 0, 7); ctx.stroke();
    ctx.fillStyle = '#b8c8f0'; circle(par(300, .05), 70, 14); ctx.fillStyle = '#e8d0ff'; circle(par(900, .05), 50, 9); }
  }
  // flying cars with light trails
  for (const c of ws.cars){ const dir = Math.sign(c.v); const tg = ctx.createLinearGradient(c.x, c.y, c.x - dir*90, c.y); tg.addColorStop(0, `rgba(${c.col},.8)`); tg.addColorStop(1, `rgba(${c.col},0)`);
    ctx.strokeStyle = tg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(c.x - dir*90, c.y); ctx.stroke(); ctx.fillStyle = '#2a2040'; rr(c.x - 12, c.y - 5, 24, 9, 4); ctx.fill(); ctx.fillStyle = `rgb(${c.col})`; circle(c.x + dir*11, c.y, 2.4); }
  if (ownSky){
  // far skyline, with lit windows and blinking antenna lights
  for (const tw of CITY_TOWERS_FAR){ const x = tw.x - camX*.15; if (x < -80 || x > W + 80) continue; const top = 330 - tw.h;
    ctx.fillStyle = '#1a1030'; ctx.fillRect(x, top, tw.w, tw.h + 20);
    for (let y = top + 8; y < 330; y += 12) for (let wx = 4; wx < tw.w - 4; wx += 8) if (hash(wx*.3 + y*.7 + tw.s*9) > .6){ ctx.fillStyle = hash(wx + y) > .5 ? 'rgba(255,230,140,.6)' : 'rgba(120,220,255,.5)'; ctx.fillRect(x + wx, y, 3, 4); }
    if (tw.s > .6){ ctx.fillStyle = '#1a1030'; ctx.fillRect(x + tw.w/2 - 1, top - 20, 2, 20); ctx.fillStyle = `rgba(255,80,80,${.4 + .6*Math.max(0, Math.sin(t*3 + tw.s*9))})`; circle(x + tw.w/2, top - 20, 2.5); } }
  }
  // the elevated tram line, and the tram gliding past now and then
  { const ry = 262; ctx.fillStyle = '#231440'; ctx.fillRect(0, ry, W, 6); for (let i = Math.floor(camX*.6/160) - 1; i*160 - camX*.6 < W + 160; i++) ctx.fillRect(i*160 - camX*.6, ry, 8, 80);
    neonTube(0, ry, W, ry, '90,220,255', .5);
    const tr = ws.tram; if (tr.x > -300){ ctx.fillStyle = '#e8e0f0'; rr(tr.x, ry - 30, 240, 28, 12); ctx.fill(); ctx.fillStyle = '#ff6ad5'; ctx.fillRect(tr.x + 10, ry - 8, 220, 3);
      for (let i=0;i<7;i++){ ctx.fillStyle = 'rgba(255,230,150,.9)'; rr(tr.x + 18 + i*30, ry - 24, 20, 12, 3); ctx.fill(); } } }
  if (ownSky){
  // mid skyline: tall towers with neon edges, and a hologram billboard
  for (const tw of CITY_TOWERS_MID){ const x = tw.x - camX*.4; if (x < -140 || x > W + 140) continue; const top = GROUND - 30 - tw.h;
    ctx.fillStyle = '#20123a'; ctx.fillRect(x, top, tw.w, tw.h);
    for (let y = top + 10; y < GROUND - 40; y += 16) for (let wx = 6; wx < tw.w - 6; wx += 12) if (hash(wx + y*.5 + tw.s*7) > .55){ ctx.fillStyle = 'rgba(255,230,160,.55)'; ctx.fillRect(x + wx, y, 5, 7); }
    neonTube(x, top, x, GROUND - 30, tw.col, .7); neonTube(x + tw.w, top, x + tw.w, GROUND - 30, tw.col, .7); neonTube(x, top, x + tw.w, top, tw.col, .7);
    if (tw.s > .82){ const bx = x + tw.w/2, by = top + 50; ctx.fillStyle = 'rgba(90,220,255,.12)'; rr(bx - 60, by - 30, 120, 60, 8); ctx.fill(); ctx.strokeStyle = 'rgba(90,220,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      neonText('NEON BEATS', bx, by - 12, 13, '255,106,213', true);
      for (let b=0;b<8;b++){ const h = 6 + Math.abs(Math.sin(t*6 + b))*16; ctx.fillStyle = 'rgba(90,220,255,.7)'; ctx.fillRect(bx - 40 + b*10, by + 22 - h, 6, h); } } }
  }
  // holographic koi swimming through the air
  for (let i=0;i<4;i++){ const cx = wrap(1100 + i*170 + t*25 - camX, C_W) - (C_W - W)*0 , kx = cx, ky = 200 + i*28 + Math.sin(t + i)*14;
    if (kx < -40 || kx > W + 40) continue; ctx.save(); ctx.translate(kx, ky); ctx.rotate(Math.sin(t*1.5 + i)*.2);
    ctx.fillStyle = `rgba(${i % 2 ? '255,160,90' : '255,106,213'},.45)`; ctx.beginPath(); ctx.ellipse(0, 0, 18, 7, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(-28, -8 + Math.sin(t*8)*3); ctx.lineTo(-28, 8 + Math.sin(t*8)*3); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
  // the walkway
  ctx.fillStyle = '#1a1428'; ctx.fillRect(0, GROUND - 8, W, H);
  ctx.strokeStyle = 'rgba(90,220,255,.2)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = -wrap(camX, 60); x < W; x += 60){ ctx.moveTo(x, GROUND); ctx.lineTo(x - 30, H); } ctx.stroke();
  neonTube(0, GROUND - 6, W, GROUND - 6, '90,220,255', .9);
  for (let i = Math.floor(camX/340) - 1; i*340 - camX < W + 340; i++){ const x = i*340 - camX + 120; ctx.fillStyle = 'rgba(255,106,213,.18)'; ctx.beginPath(); ctx.ellipse(x, GROUND + 40, 50, 6, 0, 0, 7); ctx.fill(); }
  // neon street lamps
  for (let i = Math.floor(camX/300) - 1; i*300 - camX < W + 300; i++){ const x = i*300 - camX + 40; ctx.fillStyle = '#231440'; ctx.fillRect(x - 3, GROUND - 150, 6, 150); neonTube(x - 18, GROUND - 150, x + 18, GROUND - 150, i % 2 ? '255,106,213' : '90,220,255', .9); }
  drawWarpBack();
  // the Rooftop Stage: a club door with a flickering sign (play Neon Beats again)
  { const x = par(C_STAGE, 1); if (onScreen(x, 160)){
    ctx.fillStyle = '#2a1848'; ctx.fillRect(x - 110, GROUND - 190, 220, 190);
    neonTube(x - 110, GROUND - 190, x + 110, GROUND - 190, '255,106,213', .9);
    ctx.fillStyle = '#120a22'; rr(x - 96, GROUND - 170, 192, 40, 6); ctx.fill(); neonText('ROOFTOP STAGE', x, GROUND - 150, 16, '255,106,213', true);
    const dg = ctx.createLinearGradient(0, GROUND - 110, 0, GROUND); dg.addColorStop(0, 'rgba(255,106,213,.7)'); dg.addColorStop(1, 'rgba(90,220,255,.7)');
    ctx.fillStyle = dg; rr(x - 32, GROUND - 110, 64, 110, 6); ctx.fill();
    for (let b=0;b<6;b++){ const h = 8 + Math.abs(Math.sin(t*5 + b))*20; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x - 24 + b*9, GROUND - 20 - h, 5, h); }
    ctx.fillStyle = '#ffe66e'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('♪', x - 70 + Math.sin(t*2)*4, GROUND - 60 - Math.abs(Math.sin(t*3))*10); ctx.fillText('♫', x + 70, GROUND - 80 - Math.abs(Math.sin(t*3 + 1))*10); ctx.textAlign = 'left'; } }
  // the noodle stand, run by a robot chef
  { const x = par(C_NOODLE, 1); if (onScreen(x, 160)){
    ctx.fillStyle = '#3a1a2a'; ctx.fillRect(x - 100, GROUND - 60, 200, 60); ctx.fillStyle = '#d0452f'; ctx.fillRect(x - 110, GROUND - 150, 220, 18);
    for (let i=0;i<5;i++){ ctx.fillStyle = i % 2 ? '#f6ead6' : '#d0452f'; ctx.fillRect(x - 100 + i*40, GROUND - 132, 40, 14); }
    for (const lx of [x - 90, x + 90]){ const lg = ctx.createRadialGradient(lx, GROUND - 110, 2, lx, GROUND - 110, 40); lg.addColorStop(0, 'rgba(255,120,90,.6)'); lg.addColorStop(1, 'rgba(255,120,90,0)'); ctx.fillStyle = lg; circle(lx, GROUND - 110, 40); ctx.fillStyle = '#e0503a'; ctx.beginPath(); ctx.ellipse(lx, GROUND - 110, 10, 13, 0, 0, 7); ctx.fill(); }
    neonText('NOODLES', x, GROUND - 170, 16, '255,230,110', false);
    // the robot chef: a boxy body and a screen face that blinks
    ctx.fillStyle = '#9aa0b8'; rr(x - 20, GROUND - 118, 40, 56, 8); ctx.fill(); ctx.fillStyle = '#2a2a3a'; rr(x - 22, GROUND - 158, 44, 36, 8); ctx.fill();
    ctx.fillStyle = '#82ffa0'; if (Math.sin(t*.8) > .95){ ctx.fillRect(x - 12, GROUND - 142, 8, 2); ctx.fillRect(x + 4, GROUND - 142, 8, 2); } else { circle(x - 8, GROUND - 142, 3.5); circle(x + 8, GROUND - 142, 3.5); }
    ctx.strokeStyle = '#82ffa0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, GROUND - 136, 7, .3, Math.PI - .3); ctx.stroke();
    ctx.fillStyle = '#f6ead6'; ctx.beginPath(); ctx.ellipse(x, GROUND - 162, 16, 8, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.ellipse(x + 50, GROUND - 64, 18, 6, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(x + 32, GROUND - 70, 36, 6);
    if (!reduceMotion) for (let i=0;i<3;i++){ const k = wrap(t*.7 + i/3, 1); ctx.fillStyle = `rgba(240,240,250,${.4*(1 - k)})`; circle(x + 50 + Math.sin(k*6 + i)*6, GROUND - 76 - k*40, 4 + k*6); } } }
  // the info kiosk and its friendly robot
  { const x = par(C_KIOSK, 1); if (onScreen(x, 120)){
    ctx.fillStyle = '#2a2040'; rr(x - 26, GROUND - 170, 52, 170, 10); ctx.fill(); neonTube(x - 26, GROUND - 170, x + 26, GROUND - 170, '90,220,255', .8);
    ctx.fillStyle = '#0e1a30'; rr(x - 20, GROUND - 160, 40, 56, 6); ctx.fill();
    ctx.fillStyle = '#5adcff'; circle(x - 8, GROUND - 138, 4); circle(x + 8, GROUND - 138, 4); ctx.strokeStyle = '#5adcff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, GROUND - 128, 7, .3, Math.PI - .3); ctx.stroke();
    ctx.save(); ctx.translate(x, GROUND - 200); ctx.rotate(reduceMotion ? 0 : t*.8); ctx.strokeStyle = 'rgba(90,220,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(0, 0, 24, 10, 0, 0, 7); ctx.moveTo(-24, 0); ctx.lineTo(24, 0); ctx.moveTo(0, -10); ctx.lineTo(0, 10); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#ff6ad5'; ctx.fillRect(x - 14, GROUND - 90, 28, 4); ctx.fillStyle = '#ffe66e'; ctx.fillRect(x - 14, GROUND - 80, 18, 4); } }
  // the Neon Grand Prix garage: a hover car waiting behind the open door
  { const x = par(C_GARAGE, 1); if (onScreen(x, 140)){
    ctx.fillStyle = '#231440'; ctx.fillRect(x - 95, GROUND - 170, 190, 170);
    neonTube(x - 95, GROUND - 170, x + 95, GROUND - 170, '90,220,255', .9); neonTube(x - 95, GROUND - 170, x - 95, GROUND - 6, '90,220,255', .6); neonTube(x + 95, GROUND - 170, x + 95, GROUND - 6, '90,220,255', .6);
    ctx.fillStyle = '#120a22'; rr(x - 80, GROUND - 158, 160, 34, 6); ctx.fill(); neonText('NEON GP', x, GROUND - 141, 18, '255,230,110', true);
    for (let i=0;i<16;i++){ ctx.fillStyle = (i + (i > 7 ? 1 : 0)) % 2 ? '#f6f0ff' : '#1a1030'; ctx.fillRect(x - 80 + (i % 8)*20, GROUND - 120 + (i > 7 ? 6 : 0), 20, 6); }
    const dg = ctx.createLinearGradient(0, GROUND - 104, 0, GROUND); dg.addColorStop(0, '#0e0820'); dg.addColorStop(1, '#2a1848'); ctx.fillStyle = dg; ctx.fillRect(x - 74, GROUND - 104, 148, 104);
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = GROUND - 100; y < GROUND - 90; y += 4){ ctx.moveTo(x - 74, y); ctx.lineTo(x + 74, y); } ctx.stroke();
    const hov = Math.sin(t*3)*3, cy = GROUND - 26 + hov;
    const ug = ctx.createRadialGradient(x, GROUND - 6, 2, x, GROUND - 6, 70); ug.addColorStop(0, 'rgba(255,106,213,.6)'); ug.addColorStop(1, 'rgba(255,106,213,0)'); ctx.fillStyle = ug; ctx.beginPath(); ctx.ellipse(x, GROUND - 6, 70, 12, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(140,220,255,.55)'; ctx.beginPath(); ctx.moveTo(x - 24, cy - 18); ctx.lineTo(x - 8, cy - 32); ctx.lineTo(x + 22, cy - 32); ctx.lineTo(x + 34, cy - 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff6ad5'; ctx.beginPath(); ctx.moveTo(x - 60, cy - 4); ctx.lineTo(x - 52, cy - 18); ctx.lineTo(x + 50, cy - 18); ctx.lineTo(x + 64, cy - 8); ctx.lineTo(x + 60, cy + 4); ctx.lineTo(x - 56, cy + 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1a1030'; ctx.fillRect(x - 64, cy - 22, 8, 8); ctx.fillRect(x - 56, cy - 3, 112, 3);
    ctx.fillStyle = '#fff6c8'; circle(x + 60, cy - 6, 3); ctx.fillStyle = '#ff4a6a'; ctx.fillRect(x - 60, cy - 10, 5, 4);
    ctx.fillStyle = '#f6ead6'; ctx.font = '700 9px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('7', x + 2, cy - 5); ctx.textAlign = 'left'; } }
  // the vending machine, whose strange purple button is really the Realm Gate
  { const x = par(C_VEND, 1); if (onScreen(x, 100)){
    const vg = ctx.createRadialGradient(x, GROUND - 80, 10, x, GROUND - 80, 110); vg.addColorStop(0, 'rgba(90,220,255,.25)'); vg.addColorStop(1, 'rgba(90,220,255,0)'); ctx.fillStyle = vg; circle(x, GROUND - 80, 110);
    ctx.fillStyle = '#e8e0f0'; rr(x - 40, GROUND - 160, 80, 160, 8); ctx.fill(); ctx.fillStyle = '#1a1030'; rr(x - 32, GROUND - 150, 48, 110, 4); ctx.fill();
    for (let r2=0;r2<4;r2++) for (let c=0;c<3;c++){ ctx.fillStyle = ['#ff6ad5', '#5adcff', '#ffe66e', '#82ffa0'][(r2 + c) % 4]; rr(x - 28 + c*15, GROUND - 144 + r2*26, 10, 18, 3); ctx.fill(); }
    ctx.fillStyle = '#2a2040'; ctx.fillRect(x + 22, GROUND - 150, 12, 60); for (let i=0;i<3;i++){ ctx.fillStyle = '#9aa0b8'; circle(x + 28, GROUND - 140 + i*14, 3.5); }
    ctx.fillStyle = '#b58ae6'; circle(C_VEND + 18 - camX, GROUND - 70, 5);
    ctx.fillStyle = '#1a1030'; ctx.fillRect(x - 30, GROUND - 30, 60, 14); } }
  // the little delivery drone that follows you around
  { const d = ws.drone, x = d.x - camX; ctx.fillStyle = '#9aa0b8'; rr(x - 12, d.y - 5, 24, 10, 4); ctx.fill(); ctx.strokeStyle = 'rgba(220,230,255,.6)'; ctx.lineWidth = 2;
    for (const px of [x - 14, x + 14]){ ctx.beginPath(); ctx.ellipse(px, d.y - 8, 9*Math.abs(Math.sin(t*30)), 2, 0, 0, 7); ctx.stroke(); }
    ctx.fillStyle = Math.sin(t*4) > 0 ? '#ff5a5a' : '#5adcff'; circle(x, d.y + 7, 2.5); ctx.fillStyle = '#d09a4a'; ctx.fillRect(x - 5, d.y + 5, 10, 8); }
  // the end of the walkway: the sea, where the rainbow electricity tide rolls in, and the surf shack
  { const x = par(C_SURF, 1); if (onScreen(x, 700)){
    const sea0 = x + 140, sy = GROUND - 120, seaW = Math.max(0, par(C_W, 1) - sea0);   // (it ends at the edge of the city)
    ctx.fillStyle = '#120a28'; ctx.fillRect(sea0, sy, seaW, GROUND - sy);
    for (let b = 0; b < 6; b++){ const col = ['255,70,90', '255,150,60', '255,230,90', '90,230,130', '80,170,255', '190,110,255'][b];
      ctx.fillStyle = `rgba(${col},.75)`; ctx.beginPath(); ctx.moveTo(sea0, GROUND - 10 - b*14);
      for (let wx = 0; wx <= seaW; wx += 20) ctx.lineTo(sea0 + wx, GROUND - 10 - b*14 - 40*Math.max(0, Math.sin(wx*.012 - t*1.2)) - Math.sin(wx*.05 + t*3)*3);
      ctx.lineTo(sea0 + seaW, GROUND - 10 - b*14 + 14); ctx.lineTo(sea0, GROUND - 10 - b*14 + 14); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1.5; if (Math.sin(t*7) > .4){ const bx = sea0 + 80 + wrap(t*90, 400); ctx.beginPath(); ctx.moveTo(bx, GROUND - 100); ctx.lineTo(bx + 10, GROUND - 80); ctx.lineTo(bx - 4, GROUND - 72); ctx.lineTo(bx + 8, GROUND - 50); ctx.stroke(); }
    ctx.fillStyle = '#1a1428'; ctx.fillRect(sea0, GROUND - 8, seaW, 8); neonTube(sea0, GROUND - 40, sea0 + seaW, GROUND - 40, '255,106,213', .6); for (let px = sea0; px < sea0 + seaW; px += 50){ ctx.fillStyle = '#231440'; ctx.fillRect(px, GROUND - 40, 4, 34); }
    // the shack, with glowing surfboards leaning on it
    ctx.fillStyle = '#2a1848'; ctx.fillRect(x - 100, GROUND - 150, 200, 150); neonTube(x - 100, GROUND - 150, x + 100, GROUND - 150, '90,230,130', .9);
    ctx.fillStyle = '#120a22'; rr(x - 86, GROUND - 140, 172, 34, 6); ctx.fill(); neonText('RAINBOW TIDE SURF', x, GROUND - 123, 13, '255,230,110', true);
    ctx.fillStyle = '#0e0820'; ctx.fillRect(x - 30, GROUND - 90, 60, 90); ctx.fillStyle = 'rgba(90,220,255,.5)'; ctx.fillRect(x - 30, GROUND - 90, 60, 4);
    ['255,70,90', '255,230,90', '80,170,255', '190,110,255'].forEach((col, i) => { const bx = (i < 2 ? x - 80 + i*24 : x + 50 + (i - 2)*24); ctx.save(); ctx.translate(bx, GROUND - 4); ctx.rotate((i < 2 ? -1 : 1)*.12);
      const glow = .6 + .4*Math.sin(t*3 + i); ctx.fillStyle = `rgba(${col},${glow})`; ctx.beginPath(); ctx.ellipse(0, -46, 9, 46, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-1, -86, 2, 80); ctx.restore(); }); } }
  drawPlayer();
}
function citySpots(){ return [
  gateSpot(C_VEND + 18, GROUND - 70, 'city'),
  { x:C_STAGE, r:90, hit:[C_STAGE - 110, C_STAGE + 110], stand:C_STAGE - 10, gap:0, label:'Go up to the Rooftop Stage', open:() => playNeonBeats() },
  { x:C_NOODLE, r:100, hit:[C_NOODLE - 110, C_NOODLE + 110], stand:C_NOODLE - 60, gap:0, label:'Order some noodles', open:() => {
      if (ws.noodles){ ws.noodles = false; Save.give('glownoodles'); P.anim.chew = 1; P.anim.happy = 2; openMystery('The Noodle Stand', '“One bowl of Glow Noodles, extra sparkle!” beeps the robot chef, sliding a bowl across the counter.', 'Added to your satchel!'); }
      else openMystery('The Noodle Stand', 'The robot chef is busy stirring a fresh pot. “Come back next visit!”', ''); } },
  { x:C_KIOSK, r:70, hit:[C_KIOSK - 40, C_KIOSK + 40], stand:C_KIOSK - 40, gap:0, label:'Talk to the info robot', open:() => findThing('holobadge', 'The Info Robot', '“Welcome to Neon City, visitor!” The robot prints you a shiny badge that reads VISITOR — THISTLEDOWN.', '“Enjoy your stay, visitor! Don’t forget to try the noodles.”') },
  { x:C_GARAGE, r:90, hit:[C_GARAGE - 90, C_GARAGE + 90], stand:C_GARAGE - 50, gap:0, label:'Race in the Neon Grand Prix', open:() => goRacing() },
  { x:C_VEND - 10, r:50, hit:[C_VEND - 40, C_VEND + 12], stand:C_VEND - 50, gap:0, label:'Look at the vending machine', open:() => openMystery('The Vending Machine', 'Rows of fizzy drinks in every neon color. One of the buttons is a strange shade of purple, and it hums very softly…', '') },
  { x:C_SURF, r:110, hit:[C_SURF - 110, C_SURF + 110], stand:C_SURF - 60, gap:0, label:'Surf the rainbow tide', open:() => playHere('tide', 'Back to the city', '← City', C_SURF - 60) },
  { x:C_W - 120, r:80, hit:[C_W - 200, C_W - 40], stand:C_W - 140, gap:0, label:'Relight the city’s neon signs', open:() => playHere('circuit', 'Back to the city', '← City', C_W - 140) },
]; }
// play Neon Beats again from the Rooftop Stage; win or lose, you come back to the street
function playNeonBeats(){
  transition(() => startWorldGame('city', 'cafe', { label:'Back to the city', leave:'← City', done:() => {
    P.x = C_STAGE - 60; P.face = 1; P.vx = 0; P.target = null; pending = null;
    camX = clamp(P.x - W*.42, 0, currentWorld.w - W);
    fadeA = 1; fadeDir = -1; fadeWarp = true; fadeMid = null; showScreen(screenEl);
  } }));
}

// race in the Neon Grand Prix from the garage; win or lose, you come back to the street
function goRacing(){
  transition(() => startWorldGame('race', 'cafe', { label:'Back to the city', leave:'← City', done:() => {
    P.x = C_GARAGE - 50; P.face = 1; P.vx = 0; P.target = null; pending = null;
    camX = clamp(P.x - W*.42, 0, currentWorld.w - W);
    fadeA = 1; fadeDir = -1; fadeWarp = true; fadeMid = null; showScreen(screenEl);
  } }));
}

// Zib the alien, who runs the Cosmic Carnival
function zib(x, y, s){
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#7ee06a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -40); ctx.quadraticCurveTo(-14, -56, -18, -60); ctx.moveTo(8, -40); ctx.quadraticCurveTo(14, -56, 18, -60); ctx.stroke();
  ctx.fillStyle = '#ffe066'; circle(-18, -61, 4); circle(18, -61, 4);
  ctx.fillStyle = '#7ee06a'; ctx.beginPath(); ctx.ellipse(0, -26, 24, 20, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(18, -8); ctx.rotate(-1.2 + (reduceMotion ? 0 : Math.sin(t*4)*.5)); rr(-3, -18, 7, 20, 3); ctx.fill(); ctx.restore();
  for (const ex of [-10, 0, 10]){ ctx.fillStyle = '#fff'; circle(ex, -30 + (ex ? 0 : -6), 5.5); ctx.fillStyle = '#1a1a2a'; circle(ex + 1, -29 + (ex ? 0 : -6), 2.6); }
  ctx.strokeStyle = '#1a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -18, 7, .3, Math.PI - .3); ctx.stroke();
  ctx.restore();
}
// play one of a world's games again from inside it; win or lose, you come back to where you stood
function playHere(game, label, leave, backX){
  const off = worldOff;   // (in the far half of a joined world)
  transition(() => startWorldGame(game, 'windmill', { label, leave, done:() => {
    P.x = backX + off; P.face = 1; P.vx = 0; P.target = null; pending = null;
    camX = clamp(P.x - W*.42, 0, currentWorld.w - W);
    fadeA = 1; fadeDir = -1; fadeWarp = true; fadeMid = null; showScreen(screenEl);
  } }));
}

// ---------- the Coral Sea ----------
// reached by winning Coral Dive (the flickering blue portal in the Portal HQ). You walk along the
// sea floor in a bubble helmet.
const S_SHIP = 560, S_OCTO = 980, S_SHELL = 1260, S_CLAM = 1520, S_TURTLE = 1800, S_PALACE = 2180, S_W = 2450;
const PALACE_IMG = loadImg('characters/coral-palace.png');
WORLDS.sea = { name:'The Coral Sea', w:S_W, hub:() => ({ x:S_CLAM, y:GROUND - 30 }),
  init:() => ({ fish:[0, 1, 2, 3, 4, 5, 6, 7].map(i => ({ x:Math.random()*S_W, y:90 + i*26, v:(i % 2 ? 1 : -1)*(40 + i*8), col:['#ffb05a', '#5ac8e0', '#ff7a8a', '#f2e27a'][i % 4] })), bubbles:[], ride:0 }),
  draw:() => drawSea(), update:dt => updateSea(dt), spots:() => seaSpots() };
function updateSea(dt){
  for (const f of ws.fish){ f.x += f.v*dt; if (f.x > S_W + 100) f.x = -100; if (f.x < -100) f.x = S_W + 100; }
  if (!reduceMotion && Math.random() < dt*3) ws.bubbles.push({ x:P.x + P.face*6, y:GROUND - 80, life:2 });
  ws.bubbles.forEach(b => { b.y -= 50*dt; b.life -= dt; }); ws.bubbles = ws.bubbles.filter(b => b.life > 0);
  ws.ride = Math.max(0, ws.ride - dt);
  tickPops(dt);
}
function drawSea(){
  const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#4ab8d8'); g.addColorStop(.5, '#1f7aaa'); g.addColorStop(1, '#0f4a7a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (!reduceMotion) for (let i=0;i<7;i++){ const bx = wrap(i*160 - camX*.1 + Math.sin(t*.3 + i)*30, W + 200) - 100; ctx.fillStyle = 'rgba(255,255,230,.06)'; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx + 60, 0); ctx.lineTo(bx + 170, GROUND); ctx.lineTo(bx + 90, GROUND); ctx.closePath(); ctx.fill(); }
  // far rock arches and coral hills
  for (let i = Math.floor(camX*.2/340) - 1; i*340 - camX*.2 < W + 340; i++){ const x = i*340 - camX*.2 + hash(i)*80; ctx.fillStyle = 'rgba(20,60,100,.6)'; ctx.beginPath(); ctx.moveTo(x - 120, GROUND); ctx.quadraticCurveTo(x - 110, GROUND - 180 - hash(i + 2)*60, x, GROUND - 170); ctx.quadraticCurveTo(x + 110, GROUND - 180, x + 120, GROUND); ctx.lineTo(x + 70, GROUND); ctx.quadraticCurveTo(x, GROUND - 110, x - 70, GROUND); ctx.closePath(); ctx.fill(); }
  // fish
  for (const f of ws.fish){ const x = f.x - camX*.6, d = Math.sign(f.v); if (!onScreen(x, 30)) continue; ctx.fillStyle = f.col; ctx.beginPath(); ctx.ellipse(x, f.y, 11, 6, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - d*9, f.y); ctx.lineTo(x - d*18, f.y - 6); ctx.lineTo(x - d*18, f.y + 6); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(x + d*5, f.y - 1, 1.5); }
  // sand
  ctx.fillStyle = '#e0c890'; ctx.fillRect(0, GROUND - 8, W, H); ctx.fillStyle = '#ecd8a4'; ctx.fillRect(0, GROUND - 8, W, 6);
  for (let i = Math.floor(camX/60) - 1; i*60 - camX < W + 60; i++){ ctx.fillStyle = 'rgba(180,150,100,.4)'; ctx.beginPath(); ctx.ellipse(i*60 - camX + hash(i)*30, GROUND + 20 + hash(i + 1)*50, 12, 3, 0, 0, 7); ctx.fill(); }
  // kelp and coral along the way
  for (let i = Math.floor(camX/110) - 1; i*110 - camX < W + 110; i++){ const x = i*110 - camX + hash(i + 9)*50, k = hash(i + 4);
    if (k < .45){ ctx.strokeStyle = '#3f8a4a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x, GROUND - 4); for (let s=1;s<8;s++) ctx.lineTo(x + Math.sin(t*1.4 + s*.7 + i)*9, GROUND - 4 - s*24); ctx.stroke(); }
    else { ctx.fillStyle = ['#ff7a8a', '#ffb05a', '#c07ae0', '#5ad0c0'][((i % 4) + 4) % 4]; for (let s=0;s<5;s++){ ctx.beginPath(); ctx.ellipse(x - 16 + s*8, GROUND - 22 - (s % 2)*12, 5, 18 + (s % 2)*6, (s - 2)*.25, 0, 7); ctx.fill(); } } }
  drawWarpBack();
  // the sunken ship (dive again)
  { const x = par(S_SHIP, 1); if (onScreen(x, 240)){ ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.moveTo(x - 180, GROUND); ctx.lineTo(x + 160, GROUND - 20); ctx.lineTo(x + 190, GROUND - 120); ctx.lineTo(x - 200, GROUND - 90); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a2416'; ctx.fillRect(x - 10, GROUND - 330, 12, 230); ctx.fillStyle = 'rgba(230,220,200,.55)'; ctx.beginPath(); ctx.moveTo(x + 2, GROUND - 320); ctx.lineTo(x + 90, GROUND - 260); ctx.lineTo(x + 2, GROUND - 200); ctx.fill();
    for (let k=0;k<4;k++){ ctx.fillStyle = '#1a0e08'; circle(x - 140 + k*80, GROUND - 60 - k*6, 11); }
    ctx.fillStyle = '#c9a13a'; rr(x - 40, GROUND - 40, 50, 32, 4); ctx.fill(); ctx.fillStyle = '#8a5a32'; ctx.fillRect(x - 40, GROUND - 30, 50, 6); const cg = ctx.createRadialGradient(x - 15, GROUND - 40, 2, x - 15, GROUND - 40, 50); cg.addColorStop(0, 'rgba(255,230,120,.6)'); cg.addColorStop(1, 'rgba(255,230,120,0)'); ctx.fillStyle = cg; circle(x - 15, GROUND - 40, 50); } }
  // the octopus, juggling shells
  { const x = par(S_OCTO, 1); if (onScreen(x, 120)){ const bob = Math.sin(t*1.5)*4; ctx.fillStyle = '#e07aa0';
    for (let k=0;k<8;k++){ const a = Math.PI*(.1 + k*.11); ctx.strokeStyle = '#e07aa0'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, GROUND - 50 + bob); ctx.quadraticCurveTo(x + Math.cos(a)*50, GROUND - 20, x + Math.cos(a)*60 + Math.sin(t*3 + k)*6, GROUND - 6); ctx.stroke(); } ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.ellipse(x, GROUND - 76 + bob, 34, 38, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; circle(x - 12, GROUND - 80 + bob, 8); circle(x + 12, GROUND - 80 + bob, 8); ctx.fillStyle = '#1a1a1a'; circle(x - 11, GROUND - 79 + bob, 4); circle(x + 13, GROUND - 79 + bob, 4);
    ctx.strokeStyle = '#8a3a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, GROUND - 66 + bob, 8, .3, Math.PI - .3); ctx.stroke();
    for (let k=0;k<3;k++){ const a = t*3 + k*Math.PI*2/3; ctx.fillStyle = ['#ffb05a', '#f6f0ff', '#5ad0c0'][k]; ctx.beginPath(); ctx.ellipse(x + Math.cos(a)*50, GROUND - 150 + Math.sin(a)*24, 8, 7, 0, 0, 7); ctx.fill(); } } }
  // the rainbow shell in a big anemone
  { const x = par(S_SHELL, 1); if (onScreen(x, 90)){ ctx.strokeStyle = '#ff9ab8'; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (let k=0;k<12;k++){ const a = Math.PI + k/11*Math.PI; ctx.beginPath(); ctx.moveTo(x, GROUND - 10); ctx.quadraticCurveTo(x + Math.cos(a)*30, GROUND - 30, x + Math.cos(a)*44 + Math.sin(t*2 + k)*4, GROUND - 20 + Math.sin(a)*40); ctx.stroke(); } ctx.lineCap = 'butt';
    if (!Save.count('rainbowshell')){ const sg = ctx.createRadialGradient(x, GROUND - 26, 2, x, GROUND - 26, 30); sg.addColorStop(0, 'rgba(255,255,255,.8)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; circle(x, GROUND - 26, 30); itemIcon(ctx, 'rainbowshell', x, GROUND - 26 + Math.sin(t*2)*2, .7); } } }
  // the giant clam, with its purple pearl (the Realm Gate)
  { const x = par(S_CLAM, 1); if (onScreen(x, 100)){ const open = .5 + Math.sin(t*.8)*.2;
    ctx.fillStyle = '#8a9ab8'; ctx.beginPath(); ctx.ellipse(x, GROUND - 14, 60, 20, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(x - 60, GROUND - 16, 120, 6);
    ctx.fillStyle = '#f0d8e0'; ctx.beginPath(); ctx.ellipse(x, GROUND - 16, 52, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#d8b0ff'; circle(x, GROUND - 30, 12); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(x - 4, GROUND - 34, 4);
    ctx.save(); ctx.translate(x - 60, GROUND - 16); ctx.rotate(-open); ctx.fillStyle = '#9aaac8'; ctx.beginPath(); ctx.ellipse(60, 0, 60, 22, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = 'rgba(60,70,100,.4)'; ctx.lineWidth = 2; ctx.beginPath(); for (let k=1;k<6;k++){ ctx.moveTo(60, 0); ctx.lineTo(60 + Math.cos(Math.PI + k/6*Math.PI)*58, Math.sin(Math.PI + k/6*Math.PI)*20); } ctx.stroke(); ctx.restore(); } }
  // the sea turtle, who gives rides
  { const x = par(S_TURTLE, 1) + (ws.ride > 0 ? Math.sin(ws.ride*2)*60 : 0), y = GROUND - 90 + Math.sin(t*1.2)*8 - (ws.ride > 0 ? Math.sin(ws.ride/3*Math.PI)*100 : 0); if (onScreen(x, 120)){
    ctx.fillStyle = '#6aaa6a'; for (const [fx, fy, r] of [[-40, 12, .6], [40, 12, -.6]]){ ctx.save(); ctx.translate(x + fx, y + fy); ctx.rotate(r + Math.sin(t*3)*.3); ctx.beginPath(); ctx.ellipse(0, 0, 26, 9, 0, 0, 7); ctx.fill(); ctx.restore(); }
    circle(x + 62, y - 4, 14); ctx.fillStyle = '#3a7a4a'; ctx.beginPath(); ctx.ellipse(x, y, 54, 30, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#5a9a5a'; for (let k=0;k<4;k++){ ctx.beginPath(); ctx.ellipse(x - 30 + k*20, y - 14, 9, 7, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#e8d8a0'; ctx.fillRect(x - 54, y - 3, 108, 6); ctx.fillStyle = '#1a1a1a'; circle(x + 68, y - 7, 2.5); ctx.fillStyle = '#d0452f'; ctx.beginPath(); ctx.ellipse(x, y - 30, 20, 6, 0, Math.PI, 0); ctx.fill(); } }
  // the coral palace at the far end (the palace sticker), glowing softly
  { const x = par(S_PALACE, 1); if (onScreen(x, 260)){ const pg = ctx.createRadialGradient(x, GROUND - 140, 20, x, GROUND - 140, 260); pg.addColorStop(0, `rgba(255,190,200,${.3 + .1*Math.sin(t*1.5)})`); pg.addColorStop(1, 'rgba(255,190,200,0)'); ctx.fillStyle = pg; circle(x, GROUND - 140, 260);
    if (PALACE_IMG.complete && PALACE_IMG.naturalWidth){ const h = 330, w = h*PALACE_IMG.naturalWidth/PALACE_IMG.naturalHeight; ctx.drawImage(PALACE_IMG, x - w/2, GROUND - h + 18, w, h); }
    if (!reduceMotion) for (let k=0;k<5;k++){ const by = GROUND - 60 - wrap(t*40 + k*70, 300); ctx.strokeStyle = 'rgba(230,250,255,.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x - 60 + k*30 + Math.sin(t + k)*6, by, 3 + k % 3, 0, 7); ctx.stroke(); } } }
  drawPlayer();
  // your bubble helmet, and the bubbles you breathe out
  { const x = P.x - camX, hy = GROUND - 46; ctx.fillStyle = 'rgba(200,240,255,.18)'; circle(x + P.face*3, hy, 30); ctx.strokeStyle = 'rgba(230,250,255,.75)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + P.face*3, hy, 30, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x + P.face*3 - 12, hy - 14, 7, 3, -.6, 0, 7); ctx.fill(); }
  for (const b of ws.bubbles){ ctx.strokeStyle = `rgba(230,250,255,${b.life*.4})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(b.x - camX + Math.sin(b.y*.08)*4, b.y, 3.5, 0, 7); ctx.stroke(); }
}
function seaSpots(){ return [
  gateSpot(S_CLAM, GROUND - 30, 'sea'),
  { x:S_SHIP, r:150, hit:[S_SHIP - 180, S_SHIP + 170], stand:S_SHIP - 60, gap:0, label:'Go diving around the sunken ship', open:() => playHere('sea', 'Back to the sea floor', '← Coral Sea', S_SHIP - 60) },
  { x:S_OCTO, r:80, hit:[S_OCTO - 60, S_OCTO + 60], stand:S_OCTO - 80, gap:0, label:'Juggle shells with the octopus', open:() => playHere('juggle', 'Back to the sea floor', '← Coral Sea', S_OCTO - 80) },
  { x:S_SHELL, r:60, hit:[S_SHELL - 45, S_SHELL + 45], stand:S_SHELL - 40, gap:0, label: Save.count('rainbowshell') ? 'Look at the anemone' : 'Reach into the anemone', open:() => findThing('rainbowshell', 'A Rainbow Shell', 'The anemone tickles your paws and gently hands you a shell that shimmers every color of the rainbow.', 'The anemone waves its soft arms at you. Tickly!') },
  { x:S_CLAM, r:70, hit:[S_CLAM - 60, S_CLAM + 60], hitY:[GROUND - 26, GROUND + 20], stand:S_CLAM - 70, gap:0, label:'Look at the giant clam', open:() => openMystery('The Giant Clam', 'The giant clam opens and closes slowly, like it’s breathing. Inside sits a big pearl with a strange purple shimmer…', '') },
  { x:S_TURTLE, r:90, hit:[S_TURTLE - 70, S_TURTLE + 90], stand:S_TURTLE - 70, gap:0, label:'Drive the Turtle Taxi', open:() => playHere('taxi', 'Back to the sea floor', '← Coral Sea', S_TURTLE - 70) },
  { x:S_PALACE, r:120, hit:[S_PALACE - 140, S_PALACE + 140], stand:S_PALACE - 60, gap:0, label:'Swim into the coral palace', open:() => playHere('mermaid', 'Back to the sea floor', '← Coral Sea', S_PALACE - 60) },
]; }

// ---------- the Enchanted Kingdom ----------
// reached by winning The Wizard's Tower. Rolling hills, a unicorn, a fairy ring and a very sleepy baby dragon.
const F_TOWER = 480, F_UNICORN = 880, F_FAIRY = 1220, F_SWORD = 1500, F_DRAGON = 1800, F_CASTLE = 2200, F_POTION = 2590, F_W = 2780;
WORLDS.fantasy = { name:'The Enchanted Kingdom', w:F_W, hub:() => ({ x:F_SWORD, y:GROUND - 88 }),
  init:() => ({ sparkles:[], snore:0, daisy:false }),
  draw:() => drawFantasy(), update:dt => updateFantasy(dt), spots:() => fantasySpots() };
function updateFantasy(dt){
  if (Math.random() < dt*4) ws.sparkles.push({ x:F_FAIRY + (Math.random() - .5)*140, y:GROUND - 20, life:1.6 });
  ws.sparkles.forEach(s => { s.y -= 30*dt; s.life -= dt; }); ws.sparkles = ws.sparkles.filter(s => s.life > 0);
  ws.snore -= dt; if (ws.snore <= 0 && Math.abs(P.x - F_DRAGON) < 300){ ws.snore = 3; pops.push({ x:F_DRAGON + 40, y:GROUND - 110, txt:'z z z', col:'#e8d0ff', life:1.6 }); }
  tickPops(dt);
}
function drawFantasy(){
  const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#8ab0f0'); g.addColorStop(.6, '#f0c0d8'); g.addColorStop(1, '#ffe0c0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // a rainbow and floating islands
  { const rx = par(900, .05); for (let k=0;k<6;k++){ ctx.strokeStyle = `rgba(${['255,110,110', '255,180,90', '255,230,110', '130,220,130', '110,170,255', '180,130,230'][k]},.35)`; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(rx, GROUND + 60, 380 - k*9, Math.PI, 0); ctx.stroke(); } }
  for (let i=0;i<4;i++){ const x = wrap(i*330 - camX*.1, 1320) - 200, y = 90 + (i % 2)*50 + Math.sin(t*.5 + i)*8; ctx.fillStyle = '#8a7aa0'; ctx.beginPath(); ctx.moveTo(x - 50, y); ctx.lineTo(x + 50, y); ctx.lineTo(x + 10, y + 50); ctx.lineTo(x - 10, y + 40); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7ac070'; ctx.fillRect(x - 50, y - 6, 100, 8); ctx.fillStyle = '#5a9a5a'; circle(x - 20, y - 16, 12); circle(x + 18, y - 12, 9); }
  // clouds
  for (let i=0;i<6;i++){ const x = wrap(i*240 - camX*.15 + t*6, W + 300) - 150, y = 50 + hash(i)*60; ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(x, y, 22); circle(x + 24, y + 4, 18); circle(x - 22, y + 6, 16); }
  // the royal castle far away on the hill
  { const x = par(1500, .15); ctx.fillStyle = '#a8a0d0'; ctx.beginPath(); ctx.moveTo(x - 400, GROUND - 60); ctx.quadraticCurveTo(x, GROUND - 200, x + 400, GROUND - 60); ctx.fill();
    for (const [dx, h] of [[-60, 100], [-20, 150], [20, 150], [60, 100]]){ ctx.fillStyle = '#c8c0e8'; ctx.fillRect(x + dx - 12, GROUND - 150 - h, 24, h); ctx.fillStyle = '#7a6ac0'; ctx.beginPath(); ctx.moveTo(x + dx - 16, GROUND - 150 - h); ctx.lineTo(x + dx, GROUND - 190 - h); ctx.lineTo(x + dx + 16, GROUND - 150 - h); ctx.fill(); } }
  for (let i = Math.floor(camX*.4/70) - 1; i*70 - camX*.4 < W + 70; i++){ const x = i*70 - camX*.4 + hash(i)*30; ctx.fillStyle = '#6aa070'; circle(x, GROUND - 40 - hash(i + 2)*20, 34 + hash(i + 3)*14); }
  // grass, flowers and the cobbled road
  ctx.fillStyle = '#7ac070'; ctx.fillRect(0, GROUND - 10, W, H); ctx.fillStyle = '#c8b898'; ctx.fillRect(0, GROUND + 14, W, 34);
  for (let i = Math.floor(camX/34) - 1; i*34 - camX < W + 34; i++){ ctx.fillStyle = hash(i) > .5 ? '#b8a888' : '#d8c8a8'; rr(i*34 - camX + 2, GROUND + 16 + (i % 2)*16, 30, 14, 5); ctx.fill(); }
  for (let i = Math.floor(camX/50) - 1; i*50 - camX < W + 50; i++){ const x = i*50 - camX + hash(i + 5)*30; ctx.fillStyle = ['#ff9ab8', '#fff', '#ffe066', '#b8a0ff'][((i % 4) + 4) % 4]; circle(x, GROUND - 6 + hash(i)*6, 3); }
  drawWarpBack();
  // the wizard's tower (climb it again)
  { const x = par(F_TOWER, 1); if (onScreen(x, 140)){ ctx.fillStyle = '#7a6a8a'; ctx.fillRect(x - 46, GROUND - 330, 92, 330); ctx.strokeStyle = 'rgba(40,30,60,.3)'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = GROUND - 320; y < GROUND; y += 22){ ctx.moveTo(x - 46, y); ctx.lineTo(x + 46, y); } ctx.stroke();
    ctx.fillStyle = '#3a4ab0'; ctx.beginPath(); ctx.moveTo(x - 64, GROUND - 330); ctx.lineTo(x, GROUND - 440); ctx.lineTo(x + 64, GROUND - 330); ctx.fill(); ctx.fillStyle = '#ffe066'; for (let k=0;k<5;k++) circle(x - 30 + k*14, GROUND - 350 - (k % 2)*30, 2.5);
    for (const wy of [GROUND - 260, GROUND - 170]){ ctx.fillStyle = '#ffd878'; ctx.beginPath(); ctx.moveTo(x - 12, wy + 24); ctx.lineTo(x - 12, wy); ctx.arc(x, wy, 12, Math.PI, 0); ctx.lineTo(x + 12, wy + 24); ctx.fill(); }
    ctx.fillStyle = '#4a2e1a'; ctx.beginPath(); ctx.moveTo(x - 22, GROUND); ctx.lineTo(x - 22, GROUND - 50); ctx.arc(x, GROUND - 50, 22, Math.PI, 0); ctx.lineTo(x + 22, GROUND); ctx.fill(); } }
  // the unicorn
  { const x = par(F_UNICORN, 1); if (onScreen(x, 120)){ const bob = Math.sin(t*2)*2;
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(x, GROUND - 60 + bob, 44, 24, 0, 0, 7); ctx.fill(); for (const lx of [-28, -12, 14, 30]) ctx.fillRect(x + lx - 4, GROUND - 44, 8, 42);
    ctx.save(); ctx.translate(x + 40, GROUND - 76 + bob); ctx.rotate(-.5); ctx.fillRect(-8, -30, 18, 36); ctx.restore(); ctx.beginPath(); ctx.ellipse(x + 60, GROUND - 104 + bob, 20, 13, .3, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.moveTo(x + 58, GROUND - 116 + bob); ctx.lineTo(x + 66, GROUND - 146 + bob); ctx.lineTo(x + 68, GROUND - 114 + bob); ctx.fill();
    for (let k=0;k<5;k++){ ctx.fillStyle = ['#ff9ab8', '#b8a0ff', '#8ad0ff', '#ffe066', '#9ae0a0'][k]; circle(x + 40 - k*6, GROUND - 110 + k*8 + bob, 7); } for (let k=0;k<4;k++){ ctx.fillStyle = ['#ff9ab8', '#b8a0ff', '#8ad0ff', '#ffe066'][k]; circle(x - 46 - k*3, GROUND - 60 + k*9 + bob + Math.sin(t*3 + k)*3, 6); }
    ctx.fillStyle = '#1a1a1a'; circle(x + 66, GROUND - 106 + bob, 2.5); if (ws.daisy){ ctx.fillStyle = '#fff'; for (let k=0;k<5;k++) circle(x + 34 + Math.cos(k*1.25)*4, GROUND - 118 + Math.sin(k*1.25)*4 + bob, 2.5); ctx.fillStyle = '#ffe066'; circle(x + 34, GROUND - 118 + bob, 2); } } }
  // the fairy ring
  { const x = par(F_FAIRY, 1); if (onScreen(x, 120)){ for (let k=0;k<9;k++){ const a = k/9*Math.PI*2, mx = x + Math.cos(a)*80, my = GROUND + 4 + Math.sin(a)*14; ctx.fillStyle = '#f6ead6'; ctx.fillRect(mx - 3, my - 12, 6, 12); ctx.fillStyle = '#e0464f'; ctx.beginPath(); ctx.ellipse(mx, my - 12, 11, 8, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; circle(mx - 4, my - 15, 1.8); circle(mx + 4, my - 16, 1.5); }
    for (let k=0;k<4;k++){ const a = t*1.5 + k*Math.PI/2, fx = x + Math.cos(a)*50, fy = GROUND - 50 + Math.sin(a*2)*16; const fg = ctx.createRadialGradient(fx, fy, 1, fx, fy, 14); fg.addColorStop(0, 'rgba(255,250,200,.9)'); fg.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = fg; circle(fx, fy, 14); ctx.fillStyle = 'rgba(200,230,255,.8)'; ctx.beginPath(); ctx.ellipse(fx - 4, fy - 3, 5, 3, -.6 + Math.sin(t*30)*.4, 0, 7); ctx.ellipse(fx + 4, fy - 3, 5, 3, .6 - Math.sin(t*30)*.4, 0, 7); ctx.fill(); }
    for (const s of ws.sparkles){ ctx.fillStyle = `rgba(255,240,180,${s.life/1.6})`; circle(s.x - camX, s.y, 2); } } }
  // the sword in the stone (its gem is the Realm Gate)
  { const x = par(F_SWORD, 1); if (onScreen(x, 60)){ ctx.fillStyle = '#8a8a90'; ctx.beginPath(); ctx.moveTo(x - 40, GROUND); ctx.lineTo(x - 30, GROUND - 40); ctx.lineTo(x + 26, GROUND - 46); ctx.lineTo(x + 42, GROUND); ctx.fill();
    ctx.fillStyle = '#d8dce8'; ctx.fillRect(x - 4, GROUND - 76, 8, 36); ctx.fillStyle = '#c9a13a'; ctx.fillRect(x - 18, GROUND - 80, 36, 6); ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 3, GROUND - 100, 6, 20); ctx.fillStyle = '#b58ae6'; circle(x, GROUND - 88, 4); } }
  // the sleepy baby dragon on its pile of gold
  { const x = par(F_DRAGON, 1); if (onScreen(x, 140)){ ctx.fillStyle = '#e0b030'; ctx.beginPath(); ctx.ellipse(x, GROUND - 6, 90, 22, 0, Math.PI, 0); ctx.fill(); for (let k=0;k<14;k++){ ctx.fillStyle = hash(k) > .5 ? '#ffd84a' : '#c9902a'; circle(x - 70 + hash(k + 3)*140, GROUND - 10 - hash(k + 5)*14, 5); }
    const br = Math.sin(t*1.2)*3; ctx.fillStyle = '#5ab870'; ctx.beginPath(); ctx.ellipse(x, GROUND - 40, 50 + br, 26 + br*.5, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + 52, GROUND - 34, 22, 16, .2, 0, 7); ctx.fill();
    ctx.strokeStyle = '#5ab870'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 44, GROUND - 32); ctx.quadraticCurveTo(x - 90, GROUND - 20, x - 70, GROUND - 60); ctx.stroke(); ctx.lineCap = 'butt';
    ctx.fillStyle = '#4a9860'; ctx.beginPath(); ctx.moveTo(x - 10, GROUND - 60); ctx.lineTo(x - 30, GROUND - 96); ctx.lineTo(x + 20, GROUND - 64); ctx.fill(); for (let k=0;k<5;k++){ ctx.beginPath(); ctx.moveTo(x - 30 + k*14, GROUND - 62 - br*.3); ctx.lineTo(x - 24 + k*14, GROUND - 74 - br*.3); ctx.lineTo(x - 18 + k*14, GROUND - 62 - br*.3); ctx.fill(); }
    ctx.strokeStyle = '#1a3a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 58, GROUND - 38, 5, .2, Math.PI - .2); ctx.stroke(); ctx.fillStyle = 'rgba(255,150,170,.6)'; circle(x + 64, GROUND - 30, 4);
    if (!Save.count('dragonscale')){ const sg = ctx.createRadialGradient(x - 30, GROUND - 14, 1, x - 30, GROUND - 14, 20); sg.addColorStop(0, 'rgba(160,255,200,.8)'); sg.addColorStop(1, 'rgba(160,255,200,0)'); ctx.fillStyle = sg; circle(x - 30, GROUND - 14, 20); itemIcon(ctx, 'dragonscale', x - 30, GROUND - 14, .45); } } }
  // the castle gate at the end of the road, with a bunny guard
  { const x = par(F_CASTLE, 1); if (onScreen(x, 220)){ ctx.fillStyle = '#c8c0e8'; ctx.fillRect(x - 180, GROUND - 200, 360, 200); for (let k=0;k<9;k++) ctx.fillRect(x - 180 + k*42, GROUND - 222, 24, 24);
    for (const tx of [x - 190, x + 190]){ ctx.fillStyle = '#b8b0d8'; ctx.fillRect(tx - 30, GROUND - 280, 60, 280); ctx.fillStyle = '#7a6ac0'; ctx.beginPath(); ctx.moveTo(tx - 38, GROUND - 280); ctx.lineTo(tx, GROUND - 350); ctx.lineTo(tx + 38, GROUND - 280); ctx.fill(); ctx.fillStyle = '#e0464f'; ctx.beginPath(); ctx.moveTo(tx, GROUND - 350); ctx.lineTo(tx, GROUND - 380); ctx.lineTo(tx + 24, GROUND - 372 + Math.sin(t*3)*3); ctx.lineTo(tx, GROUND - 364); ctx.fill(); }
    ctx.fillStyle = '#5a3a24'; ctx.beginPath(); ctx.moveTo(x - 50, GROUND); ctx.lineTo(x - 50, GROUND - 100); ctx.arc(x, GROUND - 100, 50, Math.PI, 0); ctx.lineTo(x + 50, GROUND); ctx.fill(); ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 3; ctx.beginPath(); for (let k=-2;k<=2;k++){ ctx.moveTo(x + k*20, GROUND); ctx.lineTo(x + k*20, GROUND - 130 + Math.abs(k)*10); } ctx.stroke();
    const bx = x - 90; ctx.fillStyle = '#f6f0ff'; ctx.beginPath(); ctx.ellipse(bx, GROUND - 24, 14, 22, 0, 0, 7); ctx.fill(); circle(bx, GROUND - 54, 12); ctx.beginPath(); ctx.ellipse(bx - 5, GROUND - 76, 4, 14, -.1, 0, 7); ctx.ellipse(bx + 5, GROUND - 76, 4, 14, .1, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(bx - 4, GROUND - 56, 1.8); circle(bx + 4, GROUND - 56, 1.8);
    ctx.fillStyle = '#c9a13a'; ctx.fillRect(bx + 14, GROUND - 90, 3, 90); ctx.beginPath(); ctx.moveTo(bx + 10, GROUND - 90); ctx.lineTo(bx + 15, GROUND - 104); ctx.lineTo(bx + 21, GROUND - 90); ctx.fill(); } }
  // Madame Hazel's crooked potion cottage, past the castle, with a cauldron bubbling outside
  { const x = par(F_POTION, 1); if (onScreen(x, 160)){
    ctx.fillStyle = '#8a6a9a'; ctx.save(); ctx.translate(x, GROUND); ctx.rotate(-.04); ctx.fillRect(-70, -150, 140, 150); ctx.fillStyle = '#4a2a5a'; ctx.beginPath(); ctx.moveTo(-90, -146); ctx.quadraticCurveTo(-10, -200, 20, -260); ctx.quadraticCurveTo(40, -200, 90, -146); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#5c3a22'; ctx.beginPath(); ctx.moveTo(x - 22, GROUND); ctx.lineTo(x - 22, GROUND - 60); ctx.arc(x, GROUND - 60, 22, Math.PI, 0); ctx.lineTo(x + 22, GROUND); ctx.fill();
    const wg = ctx.createRadialGradient(x + 40, GROUND - 100, 2, x + 40, GROUND - 100, 40); wg.addColorStop(0, 'rgba(200,255,170,.6)'); wg.addColorStop(1, 'rgba(200,255,170,0)'); ctx.fillStyle = wg; circle(x + 40, GROUND - 100, 40); ctx.fillStyle = '#c8f0a0'; circle(x + 40, GROUND - 100, 14); ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 40, GROUND - 100, 14, 0, 7); ctx.moveTo(x + 26, GROUND - 100); ctx.lineTo(x + 54, GROUND - 100); ctx.stroke();
    ctx.fillStyle = '#2a1a3a'; rr(x - 60, GROUND - 190, 120, 26, 6); ctx.fill(); ctx.fillStyle = '#c8f0a0'; ctx.font = 'italic 700 13px Georgia, serif'; ctx.textAlign = 'center'; ctx.fillText('Hazel’s Potions', x, GROUND - 172); ctx.textAlign = 'left';
    const cx = x - 110; ctx.fillStyle = '#2a2a32'; ctx.beginPath(); ctx.ellipse(cx, GROUND - 22, 30, 22, 0, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = `hsl(${(t*30) % 360},70%,65%)`; ctx.beginPath(); ctx.ellipse(cx, GROUND - 38, 26, 6, 0, 0, 7); ctx.fill();
    if (!reduceMotion) for (let k = 0; k < 4; k++){ const a = wrap(t*.6 + k/4, 1); ctx.strokeStyle = `rgba(220,255,200,${.7*(1 - a)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx - 10 + k*7, GROUND - 44 - a*50, 4 + a*4, 0, 7); ctx.stroke(); }
    standPic(HAZEL_PIC, cx - 64, GROUND + 2, 120, 1, .55); } }
  drawPlayer();
}
function fantasySpots(){ return [
  gateSpot(F_SWORD, GROUND - 88, 'fantasy'),
  { x:F_TOWER, r:80, hit:[F_TOWER - 60, F_TOWER + 60], stand:F_TOWER - 70, gap:0, label:'Climb the Wizard’s Tower', open:() => playHere('fantasy', 'Back to the kingdom', '← Kingdom', F_TOWER - 70) },
  { x:F_UNICORN, r:90, hit:[F_UNICORN - 60, F_UNICORN + 80], stand:F_UNICORN - 80, gap:0, label:'Say hello to the unicorn', open:() => { ws.daisy = true; P.anim.happy = 3; openMystery('The Unicorn', 'The unicorn lowers its head so you can tuck a daisy into its rainbow mane. It whinnies happily and its horn sparkles.', ''); } },
  { x:F_FAIRY, r:100, hit:[F_FAIRY - 90, F_FAIRY + 90], stand:F_FAIRY - 100, gap:0, label:'Play hide-and-seek with the fairies', open:() => playHere('fairymemory', 'Back to the kingdom', '← Kingdom', F_FAIRY - 100) },
  { x:F_SWORD, r:50, hit:[F_SWORD - 40, F_SWORD + 40], hitY:[GROUND - 60, GROUND + 20], stand:F_SWORD - 50, gap:0, label:'Try to pull the sword from the stone', open:() => openMystery('The Sword in the Stone', 'You pull and pull… it won’t budge even a little. But the purple gem on the handle glints at you, as if it has a secret.', '') },
  { x:F_DRAGON, r:110, hit:[F_DRAGON - 100, F_DRAGON + 100], stand:F_DRAGON - 110, gap:0, label: Save.count('dragonscale') ? 'Tiptoe past the sleeping dragon' : 'Pick up the shiny scale', open:() => findThing('dragonscale', 'A Dragon Scale', 'Next to the snoring baby dragon lies a shiny green scale it must have shed. It’s warm, and it glitters like an emerald.', 'The baby dragon snores a tiny puff of smoke and smiles in its sleep.') },
  { x:F_CASTLE, r:140, hit:[F_CASTLE - 140, F_CASTLE + 60], stand:F_CASTLE - 130, gap:0, label:'Enter the Royal Tournament', open:() => playHere('joust', 'Back to the kingdom', '← Kingdom', F_CASTLE - 130) },
  { x:F_POTION, r:100, hit:[F_POTION - 100, F_POTION + 100], stand:F_POTION - 110, gap:0, label:'Help in Madame Hazel’s potion shop', open:() => playHere('potions', 'Back to the kingdom', '← Kingdom', F_POTION - 110) },
]; }

// ---------- Dusty Gulch ----------
// reached by winning Sheriff's Target Practice. A little desert town with a lemonade saloon,
// a haunted hotel full of ghost guests and the Bijou, which shows silent pictures.
const W_GALLERY = 480, W_SALOON = 900, W_SHERIFF = 1320, W_HORSE = 1680, W_TOWER = 1960, W_TRAIN = 2250, W_HOTEL = 2700, W_BIJOU = 3040, W_W = 3260;
WORLDS.west = { name:'Dusty Gulch', w:W_W, hub:() => ({ x:W_TOWER + 10, y:GROUND - 160 }),
  init:() => ({ weeds:[{ x:-100, t:1 }, { x:-400, t:6 }], drink:true, neigh:0 }),
  draw:() => drawWest(), update:dt => updateWest(dt), spots:() => westSpots() };
function updateWest(dt){
  for (const w of ws.weeds){ if (w.x < -80){ w.t -= dt; if (w.t <= 0){ w.x = camX - 60; w.t = 5 + Math.random()*6; } } else { w.x += 180*dt; if (w.x > camX + W + 80) w.x = -200; } }
  ws.neigh -= dt; if (ws.neigh <= 0 && Math.abs(P.x - W_HORSE) < 140){ ws.neigh = 6; pops.push({ x:W_HORSE + 40, y:GROUND - 150, txt:'Neigh!', life:1.2 }); }
  tickPops(dt);
}
function westFront(x, w, h, col, name, sign){
  ctx.fillStyle = col; ctx.fillRect(x - w/2, GROUND - h, w, h); ctx.fillRect(x - w/2 + 20, GROUND - h - 30, w - 40, 32);
  ctx.strokeStyle = 'rgba(40,24,12,.3)'; ctx.lineWidth = 2; ctx.beginPath(); for (let bx = x - w/2 + 16; bx < x + w/2; bx += 16){ ctx.moveTo(bx, GROUND - h); ctx.lineTo(bx, GROUND); } ctx.stroke();
  ctx.fillStyle = sign; rr(x - w/2 + 26, GROUND - h - 24, w - 52, 22, 4); ctx.fill(); ctx.fillStyle = '#3a2616'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, x, GROUND - h - 13); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - w/2 - 10, GROUND - 80, w + 20, 8); for (let px = x - w/2 - 6; px <= x + w/2 + 6; px += (w + 12)/4) ctx.fillRect(px, GROUND - 76, 5, 76);
  ctx.fillStyle = '#8a6a44'; ctx.fillRect(x - w/2 - 10, GROUND - 6, w + 20, 6);
}
const PEPPER_IMG = loadImg('characters/pepper.png');
const SHERIFF_IMG = loadImg('characters/sheriff.png');
function drawWest(){
  const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#f28a5a'); g.addColorStop(.5, '#f6c07a'); g.addColorStop(1, '#f8e0a0');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  { const sx = par(700, .03); const sg = ctx.createRadialGradient(sx, 120, 10, sx, 120, 140); sg.addColorStop(0, 'rgba(255,250,210,.8)'); sg.addColorStop(1, 'rgba(255,250,210,0)'); ctx.fillStyle = sg; circle(sx, 120, 140); ctx.fillStyle = '#fff3c0'; circle(sx, 120, 40); }
  // mesas and far cacti
  for (let i = Math.floor(camX*.12/420) - 1; i*420 - camX*.12 < W + 420; i++){ const x = i*420 - camX*.12 + hash(i)*120, h = 90 + hash(i + 2)*80, w = 160 + hash(i + 4)*120; ctx.fillStyle = '#c0704a'; ctx.beginPath(); ctx.moveTo(x - w/2 - 30, GROUND - 40); ctx.lineTo(x - w/2, GROUND - 40 - h); ctx.lineTo(x + w/2, GROUND - 40 - h); ctx.lineTo(x + w/2 + 30, GROUND - 40); ctx.fill(); ctx.fillStyle = '#a85a3a'; ctx.fillRect(x - w/2, GROUND - 40 - h, w, 10); }
  for (let i = Math.floor(camX*.35/160) - 1; i*160 - camX*.35 < W + 160; i++){ const x = i*160 - camX*.35 + hash(i + 7)*60, h = 40 + hash(i + 8)*40; ctx.fillStyle = '#6a8a4a'; rr(x - 6, GROUND - 30 - h, 12, h + 10, 6); ctx.fill(); rr(x - 18, GROUND - 30 - h*.7, 8, h*.35, 4); ctx.fill(); rr(x + 10, GROUND - 30 - h*.8, 8, h*.3, 4); ctx.fill(); }
  // the dusty street
  ctx.fillStyle = '#d8b070'; ctx.fillRect(0, GROUND - 8, W, H); ctx.strokeStyle = 'rgba(150,110,60,.4)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GROUND + 30); ctx.lineTo(W, GROUND + 30); ctx.moveTo(0, GROUND + 50); ctx.lineTo(W, GROUND + 50); ctx.stroke();
  drawWarpBack();
  { const x = par(W_GALLERY, 1); if (onScreen(x, 160)){ westFront(x, 200, 150, '#8a5a32', 'SHOOTIN’ GALLERY', '#f6ead6'); ctx.fillStyle = '#2a1a0e'; ctx.fillRect(x - 70, GROUND - 130, 140, 50); for (let k=0;k<5;k++){ ctx.fillStyle = k % 2 ? '#b8c0c8' : '#5aaa6e'; rr(x - 60 + k*28, GROUND - 106 - Math.abs(Math.sin(t*2 + k))*4, 12, 22, 3); ctx.fill(); } } }
  { const x = par(W_SALOON, 1); if (onScreen(x, 180)){ westFront(x, 240, 170, '#a0683a', 'LEMONADE SALOON', '#ffe066');
    ctx.fillStyle = '#6b4a2b'; for (const s of [-1, 1]){ ctx.save(); ctx.translate(x + s*2, GROUND - 90); ctx.scale(s, 1); ctx.rotate(Math.sin(t*2)*.05); ctx.fillRect(0, 0, 30, 52); ctx.restore(); }
    for (const wx of [x - 80, x + 80]){ ctx.fillStyle = 'rgba(255,220,140,.8)'; ctx.fillRect(wx - 22, GROUND - 150, 44, 40); } } }
  { const x = par(W_SHERIFF, 1); if (onScreen(x, 160)){ westFront(x, 200, 150, '#7a6a5a', 'SHERIFF', '#e8e0d0'); ctx.fillStyle = '#4a2e1a'; ctx.fillRect(x - 20, GROUND - 80, 40, 80);
    ctx.fillStyle = '#f2c230'; ctx.beginPath(); for (let k=0;k<10;k++){ const a = -Math.PI/2 + k*Math.PI/5, r = k % 2 ? 7 : 16; k ? ctx.lineTo(x + Math.cos(a)*r, GROUND - 124 + Math.sin(a)*r) : ctx.moveTo(x + Math.cos(a)*r, GROUND - 124 + Math.sin(a)*r); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x + 60, GROUND - 60, 30, 8); ctx.fillStyle = '#f0e8d0'; rr(x + 56, GROUND - 120, 38, 50, 3); ctx.fill(); ctx.fillStyle = '#3a2616'; ctx.font = '700 8px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('WANTED', x + 75, GROUND - 108); ctx.fillText('DEPUTY', x + 75, GROUND - 76); ctx.textAlign = 'left'; ctx.fillStyle = '#c9a06a'; circle(x + 75, GROUND - 93, 8);
    if (SHERIFF_IMG.complete && SHERIFF_IMG.naturalWidth){ const h = 112, w = h*SHERIFF_IMG.naturalWidth/SHERIFF_IMG.naturalHeight, bob = reduceMotion ? 0 : Math.max(0, Math.sin(t*1.8))*1.5; ctx.drawImage(SHERIFF_IMG, x - 140 - w/2, GROUND - h + 2 - bob, w, h); } } }
  // Pepper the pony, waiting at the hitching post with a sign about the Raccoon Gang
  { const x = par(W_HORSE, 1); if (onScreen(x, 140)){ ctx.fillStyle = '#6b4a2b'; ctx.fillRect(x - 90, GROUND - 60, 6, 60); ctx.fillRect(x - 96, GROUND - 60, 64, 6);
    ctx.fillStyle = '#f0e8d0'; rr(x - 150, GROUND - 150, 64, 70, 3); ctx.fill(); ctx.fillStyle = '#3a2616'; ctx.font = '700 8px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('WANTED', x - 118, GROUND - 138); ctx.fillText('RACCOON', x - 118, GROUND - 94); ctx.fillText('GANG', x - 118, GROUND - 85); ctx.textAlign = 'left';
    ctx.fillStyle = '#8a8a96'; circle(x - 118, GROUND - 116, 11); ctx.fillStyle = '#2a2a32'; ctx.fillRect(x - 128, GROUND - 120, 20, 6);
    if (PEPPER_IMG.complete && PEPPER_IMG.naturalWidth){ const h = 118, w = h*PEPPER_IMG.naturalWidth/PEPPER_IMG.naturalHeight, bob = reduceMotion ? 0 : Math.max(0, Math.sin(t*2.2))*2; ctx.drawImage(PEPPER_IMG, x - w/2 + 10, GROUND - h + 4 - bob, w, h); } } }
  // the water tower (the knot-hole is the Realm Gate)
  { const x = par(W_TOWER, 1); if (onScreen(x, 120)){ ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - 40, GROUND); ctx.lineTo(x - 30, GROUND - 130); ctx.moveTo(x + 40, GROUND); ctx.lineTo(x + 30, GROUND - 130); ctx.moveTo(x - 36, GROUND - 40); ctx.lineTo(x + 36, GROUND - 90); ctx.moveTo(x + 36, GROUND - 40); ctx.lineTo(x - 36, GROUND - 90); ctx.stroke();
    ctx.fillStyle = '#8a5a32'; ctx.fillRect(x - 50, GROUND - 210, 100, 80); ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - 50, GROUND - 190); ctx.lineTo(x + 50, GROUND - 190); ctx.moveTo(x - 50, GROUND - 150); ctx.lineTo(x + 50, GROUND - 150); ctx.stroke();
    ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.moveTo(x - 58, GROUND - 210); ctx.lineTo(x, GROUND - 240); ctx.lineTo(x + 58, GROUND - 210); ctx.fill(); ctx.fillStyle = '#3a2416'; ctx.beginPath(); ctx.ellipse(x + 10, GROUND - 160, 4, 5, 0, 0, 7); ctx.fill(); } }
  // the train station at the end of town
  { const x = par(W_TRAIN, 1); if (onScreen(x, 220)){ ctx.fillStyle = '#6a6a6a'; ctx.fillRect(x - 200, GROUND - 8, 420, 6); westFront(x, 180, 130, '#7a5a8a', 'STATION', '#f6ead6');
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x + 110, GROUND - 90, 110, 70); ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x + 190, GROUND - 130, 22, 40); ctx.fillStyle = '#d0452f'; ctx.fillRect(x + 110, GROUND - 44, 110, 10); for (const wx of [x + 130, x + 170, x + 205]){ ctx.fillStyle = '#1a1a1a'; circle(wx, GROUND - 16, 12); ctx.fillStyle = '#c9a13a'; circle(wx, GROUND - 16, 4); } smoke(x + 201, GROUND - 134, .5); } }
  // the haunted Gilded Spur Hotel (its windows glow and flicker as ghosts drift past)
  { const x = par(W_HOTEL, 1); if (onScreen(x, 160)){ westFront(x, 230, 230, '#5a4a5a', 'GILDED SPUR HOTEL', '#d8c8e0');
    ctx.fillStyle = '#4a3a2a'; ctx.fillRect(x - 125, GROUND - 150, 250, 8); for (let bx = x - 120; bx <= x + 120; bx += 20) ctx.fillRect(bx, GROUND - 168, 3, 18); ctx.fillRect(x - 125, GROUND - 170, 250, 4);
    for (const [wx, wy, k] of [[x - 70, GROUND - 210, 0], [x, GROUND - 210, 1], [x + 70, GROUND - 210, 2], [x - 70, GROUND - 130, 3], [x + 70, GROUND - 130, 4]]){
      const on = Math.sin(t*1.3 + k*2.1) > .3; ctx.fillStyle = on ? 'rgba(170,210,255,.85)' : '#1a1424'; ctx.fillRect(wx - 16, wy, 32, 38); ctx.fillStyle = '#3a2a3a'; ctx.fillRect(wx - 16, wy + 18, 32, 2); ctx.fillRect(wx - 1, wy, 2, 38);
      ctx.fillStyle = '#2a1e2a'; ctx.save(); ctx.translate(wx - 18, wy); ctx.rotate(k === 2 ? .25 : 0); ctx.fillRect(-8, 0, 8, 38); ctx.restore(); ctx.fillRect(wx + 18, wy, 8, 38);
      if (on && k % 2 === 0){ ctx.fillStyle = 'rgba(240,248,255,.7)'; ctx.beginPath(); ctx.arc(wx + Math.sin(t*2 + k)*6, wy + 18, 7, Math.PI, 0); ctx.lineTo(wx + 7 + Math.sin(t*2 + k)*6, wy + 30); ctx.lineTo(wx - 7 + Math.sin(t*2 + k)*6, wy + 30); ctx.fill(); ctx.fillStyle = '#1a1424'; circle(wx - 2 + Math.sin(t*2 + k)*6, wy + 17, 1.5); circle(wx + 3 + Math.sin(t*2 + k)*6, wy + 17, 1.5); } }
    ctx.fillStyle = '#2a1a24'; ctx.fillRect(x - 22, GROUND - 76, 44, 76); ctx.fillStyle = '#c9a13a'; circle(x + 14, GROUND - 38, 3);
    ctx.strokeStyle = 'rgba(230,230,240,.5)'; ctx.lineWidth = 1; ctx.beginPath(); for (const rad of [10, 20, 30]){ ctx.moveTo(x + 115 - rad, GROUND - 230); ctx.arc(x + 115, GROUND - 230, rad, Math.PI, Math.PI/2, true); } ctx.stroke(); } }
  // the Bijou picture house, with its marquee lights chasing round
  { const x = par(W_BIJOU, 1); if (onScreen(x, 150)){ westFront(x, 210, 180, '#7a3a3a', 'THE BIJOU', '#ffe066');
    ctx.fillStyle = '#2a1414'; ctx.fillRect(x - 95, GROUND - 150, 190, 40); for (let k = 0; k < 16; k++){ const on = (Math.floor(t*6) + k) % 3 === 0; ctx.fillStyle = on ? '#fff3a0' : '#8a6a3a'; circle(x - 90 + k*12, GROUND - 153, 3); circle(x - 90 + k*12, GROUND - 107, 3); }
    ctx.fillStyle = '#f6ead6'; ctx.font = '700 10px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('NOW SHOWING:', x, GROUND - 136); ctx.fillStyle = '#ffe066'; ctx.font = '700 11px "Pixelify Sans", monospace';
    ctx.fillText(['THE PERILS OF PEPPER', 'A TRIP TO THE MOON', 'THE GREATEST SHOW IN THE WEST'][Math.floor(t/3) % 3], x, GROUND - 119);
    // posters: a moon with a shell in its eye, and the big top with its elephant
    for (const px of [x - 70, x + 70]){ ctx.fillStyle = '#e8dcc0'; ctx.fillRect(px - 20, GROUND - 96, 40, 56); ctx.fillStyle = px < x ? '#1e1a22' : '#5a2a22'; ctx.fillRect(px - 16, GROUND - 92, 32, 40); ctx.fillStyle = '#e8dcc0'; ctx.font = '700 7px "Pixelify Sans", monospace'; ctx.fillText(px < x ? 'MOON!' : 'CIRCUS!', px, GROUND - 44);
      if (px < x){ ctx.fillStyle = '#f0ead8'; circle(px, GROUND - 72, 11); ctx.fillStyle = '#3a3428'; circle(px - 3, GROUND - 74, 1.4); circle(px + 3, GROUND - 74, 1.4); ctx.fillStyle = '#c8c0b0'; ctx.save(); ctx.translate(px - 5, GROUND - 75); ctx.rotate(-.7); ctx.fillRect(-10, -2, 10, 4); ctx.restore(); }
      else { for (let k = 0; k < 4; k++){ ctx.fillStyle = k % 2 ? '#e8dcc0' : '#a0442f'; ctx.beginPath(); ctx.moveTo(px, GROUND - 90); ctx.lineTo(px - 16 + k*8, GROUND - 60); ctx.lineTo(px - 8 + k*8, GROUND - 60); ctx.fill(); } ctx.fillStyle = '#9a9590'; ctx.beginPath(); ctx.ellipse(px, GROUND - 58, 9, 6, 0, 0, 7); ctx.fill(); } }
    ctx.textAlign = 'left'; ctx.fillStyle = '#1a0e0e'; ctx.fillRect(x - 24, GROUND - 90, 48, 90); ctx.fillStyle = '#c9302a'; ctx.fillRect(x - 24, GROUND - 90, 48, 5); } }
  for (const w of ws.weeds){ if (w.x < -80) continue; const x = w.x - camX, y = GROUND + 10 - Math.abs(Math.sin(w.x*.03))*26; ctx.save(); ctx.translate(x, y); ctx.rotate(w.x*.05); ctx.strokeStyle = '#a07a40'; ctx.lineWidth = 2; for (let k=0;k<8;k++){ ctx.beginPath(); ctx.arc(0, 0, 6 + k*2, k, k + 3); ctx.stroke(); } ctx.restore(); }
  drawPlayer();
}
function westSpots(){ return [
  gateSpot(W_TOWER + 10, GROUND - 160, 'west'),
  { x:W_GALLERY, r:100, hit:[W_GALLERY - 100, W_GALLERY + 100], stand:W_GALLERY - 60, gap:0, label:'Try the shooting gallery', open:() => playHere('west', 'Back to Main Street', '← Dusty Gulch', W_GALLERY - 60) },
  { x:W_SALOON, r:110, hit:[W_SALOON - 120, W_SALOON + 120], stand:W_SALOON - 40, gap:0, label:'Order a sarsaparilla', open:() => {
      if (ws.drink){ ws.drink = false; Save.give('sarsaparilla'); P.anim.chew = 1; P.anim.happy = 2; openMystery('The Lemonade Saloon', 'The bartender, a very tall lizard in a waistcoat, slides a frosty bottle down the counter. “On the house, deputy!”', 'Added to your satchel!'); }
      else openMystery('The Lemonade Saloon', 'A piano plinks a cheerful tune while two jackrabbits play checkers in the corner. “Come back next visit for another round!”', ''); } },
  { x:W_SHERIFF, r:100, hit:[W_SHERIFF - 100, W_SHERIFF + 100], stand:W_SHERIFF - 60, gap:0, label: Save.count('sheriffstar') ? 'Visit the sheriff' : 'Visit the sheriff’s office', open:() => findThing('sheriffstar', 'The Sheriff’s Office', 'The sheriff, a sharp-eyed weasel in a cowgirl hat, polishes a tin star and pins it on you. “Every deputy needs a badge!”', '“Keeping the town safe, deputy?” The sheriff tips her hat.') },
  { x:W_HORSE, r:90, hit:[W_HORSE - 80, W_HORSE + 90], stand:W_HORSE - 90, gap:0, label:'Ride Pepper after the Pie Bandits', open:() => playHere('outlaws', 'Back to Main Street', '← Dusty Gulch', W_HORSE - 90) },
  { x:W_TOWER, r:60, hit:[W_TOWER - 50, W_TOWER + 50], hitY:[GROUND - 130, GROUND + 20], stand:W_TOWER - 60, gap:0, label:'Look at the water tower', open:() => openMystery('The Water Tower', 'Water drips from a crack near the top. There’s a funny round knot-hole up there too, and sometimes it seems to glow…', '') },
  { x:W_HOTEL, r:120, hit:[W_HOTEL - 115, W_HOTEL + 115], stand:W_HOTEL - 60, gap:0, label:'Investigate the haunted hotel', open:() => playHere('ghosthotel', 'Back to Main Street', '← Dusty Gulch', W_HOTEL - 60) },
  { x:W_BIJOU, r:110, hit:[W_BIJOU - 105, W_BIJOU + 105], stand:W_BIJOU - 60, gap:0, label:'Watch a picture show', open:() => playHere('silentfilm', 'Back to Main Street', '← Dusty Gulch', W_BIJOU - 60) },
  { x:W_TRAIN, r:150, hit:[W_TRAIN - 100, W_TRAIN + 220], stand:W_TRAIN - 60, gap:0, label:'Look down the train tracks', open:() => openMystery('The Station', 'The tracks run all the way to the horizon. “Next train to Canyon Country: another day!” reads the chalkboard.', 'A world for another day.') },
]; }

// ---------- the Underground ----------
// reached by winning Mine Cart Mayhem. Crystal caves, a mole family, glowing mushrooms and a hidden lake.
const U_MINE = 520, U_MOLES = 930, U_MUSH = 1280, U_LAKE = 1640, U_GEODE = 1960, U_CRYSTAL = 2260, U_W = 2500;
WORLDS.underground = { name:'The Underground', w:U_W, hub:() => ({ x:U_CRYSTAL, y:GROUND - 120 }),
  init:() => ({ bounce:0, dig:0 }),
  draw:() => drawUnderground(), update:dt => { ws.bounce = Math.max(0, ws.bounce - dt); ws.dig += dt; tickPops(dt); }, spots:() => undergroundSpots() };
function drawUnderground(){
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120e1a'); g.addColorStop(1, '#2a2236'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // far cave walls with crystal veins
  for (const [k, col, y0] of [[.15, '#1c1626', 200], [.4, '#241c30', 260]]){ ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); for (let sx = 0; sx <= W; sx += 20){ const wx = sx + camX*k; ctx.lineTo(sx, y0 - Math.sin(wx*.006)*50 - Math.sin(wx*.017)*18); } ctx.lineTo(W, H); ctx.fill(); }
  for (let i = Math.floor(camX*.4/150) - 1; i*150 - camX*.4 < W + 150; i++){ const x = i*150 - camX*.4 + hash(i)*70, y = 240 + hash(i + 2)*60, c = ['127,224,230', '181,138,230', '242,194,120'][((i % 3) + 3) % 3], tw = .5 + .5*Math.sin(t*2 + i);
    const cg = ctx.createRadialGradient(x, y, 1, x, y, 30); cg.addColorStop(0, `rgba(${c},${.35*tw})`); cg.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = cg; circle(x, y, 30);
    ctx.fillStyle = `rgba(${c},.85)`; ctx.beginPath(); ctx.moveTo(x - 8, y + 10); ctx.lineTo(x, y - 18); ctx.lineTo(x + 8, y + 10); ctx.fill(); }
  // stalactites hanging from the ceiling
  ctx.fillStyle = '#1a1424'; ctx.fillRect(0, 0, W, 40);
  for (let i = Math.floor(camX*.8/70) - 1; i*70 - camX*.8 < W + 70; i++){ const x = i*70 - camX*.8 + hash(i + 7)*30, h = 30 + hash(i + 9)*70; ctx.fillStyle = '#2a2236'; ctx.beginPath(); ctx.moveTo(x - 14, 36); ctx.lineTo(x, 36 + h); ctx.lineTo(x + 14, 36); ctx.fill(); if (hash(i) > .7){ ctx.fillStyle = 'rgba(150,200,230,.7)'; circle(x, 40 + h + wrap(t*60 + i*40, 120), 2); } }
  // the floor, with old mine rails along it
  ctx.fillStyle = '#3a3044'; ctx.fillRect(0, GROUND - 8, W, H); ctx.fillStyle = '#4a4054'; ctx.fillRect(0, GROUND - 8, W, 6);
  ctx.fillStyle = '#4a3020'; for (let i = Math.floor(camX/26) - 1; i*26 - camX < W + 26; i++) ctx.fillRect(i*26 - camX, GROUND + 28, 14, 6);
  ctx.strokeStyle = '#7a7a8a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, GROUND + 28); ctx.lineTo(W, GROUND + 28); ctx.stroke();
  drawWarpBack();
  // the mine entrance, with a cart waiting
  { const x = par(U_MINE, 1); if (onScreen(x, 160)){ ctx.fillStyle = '#0a060e'; ctx.beginPath(); ctx.moveTo(x - 80, GROUND); ctx.lineTo(x - 80, GROUND - 120); ctx.quadraticCurveTo(x, GROUND - 170, x + 80, GROUND - 120); ctx.lineTo(x + 80, GROUND); ctx.fill();
    ctx.fillStyle = '#5a3a1a'; ctx.fillRect(x - 92, GROUND - 140, 16, 140); ctx.fillRect(x + 76, GROUND - 140, 16, 140); ctx.fillRect(x - 100, GROUND - 150, 200, 18);
    ctx.fillStyle = '#ffe9a8'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('MINE No. 7', x, GROUND - 137); ctx.textAlign = 'left';
    const lg = ctx.createRadialGradient(x - 110, GROUND - 120, 2, x - 110, GROUND - 120, 60); lg.addColorStop(0, 'rgba(255,200,110,.6)'); lg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = lg; circle(x - 110, GROUND - 120, 60); ctx.fillStyle = '#ffd278'; ctx.fillRect(x - 116, GROUND - 128, 12, 14);
    ctx.fillStyle = '#7a6a5a'; ctx.beginPath(); ctx.moveTo(x - 40, GROUND - 40); ctx.lineTo(x + 40, GROUND - 40); ctx.lineTo(x + 34, GROUND - 8); ctx.lineTo(x - 34, GROUND - 8); ctx.closePath(); ctx.fill(); for (const wx of [-20, 20]){ ctx.fillStyle = '#2a2a2a'; circle(x + wx, GROUND - 6, 8); } } }
  // the mole family, digging and waving
  { const x = par(U_MOLES, 1); if (onScreen(x, 140)){ ctx.fillStyle = '#5a4030'; ctx.beginPath(); ctx.ellipse(x, GROUND - 4, 110, 22, 0, Math.PI, 0); ctx.fill();
    for (const [dx, s, ph] of [[-50, 1, 0], [10, .8, 1.5], [60, .65, 3]]){ const up = 6 + Math.max(0, Math.sin(t*2 + ph))*14, mx = x + dx, my = GROUND - 14 - up*s;
      ctx.fillStyle = '#4a3a3a'; ctx.beginPath(); ctx.ellipse(mx, my, 20*s, 18*s, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#ff9ab8'; circle(mx + 14*s, my - 2*s, 5*s); ctx.fillStyle = '#1a1a1a'; circle(mx + 4*s, my - 8*s, 2*s);
      ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.ellipse(mx - 2*s, my - 16*s, 16*s, 8*s, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff6c8'; circle(mx + 6*s, my - 20*s, 3*s); }
    ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + 90, GROUND - 4); ctx.lineTo(x + 104 + Math.sin(t*4)*6, GROUND - 50); ctx.stroke(); ctx.fillStyle = '#9aa0ac'; ctx.beginPath(); ctx.moveTo(x + 96 + Math.sin(t*4)*6, GROUND - 52); ctx.lineTo(x + 118 + Math.sin(t*4)*6, GROUND - 46); ctx.lineTo(x + 108 + Math.sin(t*4)*6, GROUND - 60); ctx.fill(); } }
  // glowing mushrooms (they glow brighter when you bounce on them)
  { const x = par(U_MUSH, 1); if (onScreen(x, 160)){ for (const [dx, h, c] of [[-90, 60, '120,230,200'], [-40, 90, '200,140,255'], [10, 50, '120,230,200'], [60, 110, '255,160,220'], [110, 70, '200,140,255']]){ const mx = x + dx, glow = .4 + ws.bounce*.6 + Math.sin(t*2 + dx)*.1, sq = ws.bounce > 0 ? Math.sin(ws.bounce*12)*4 : 0;
      const gg = ctx.createRadialGradient(mx, GROUND - h, 2, mx, GROUND - h, 60); gg.addColorStop(0, `rgba(${c},${glow*.5})`); gg.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gg; circle(mx, GROUND - h, 60);
      ctx.fillStyle = '#e8e0d0'; ctx.fillRect(mx - 5, GROUND - h, 10, h); ctx.fillStyle = `rgba(${c},.95)`; ctx.beginPath(); ctx.ellipse(mx, GROUND - h + sq, 26, 16 - sq*.5, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(mx - 8, GROUND - h - 8, 3); circle(mx + 8, GROUND - h - 6, 2); } } }
  // the underground lake, with a glowing axolotl
  { const x = par(U_LAKE, 1); if (onScreen(x, 180)){ const lg = ctx.createLinearGradient(0, GROUND - 6, 0, GROUND + 50); lg.addColorStop(0, '#2a6a8a'); lg.addColorStop(1, '#123a5a'); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(x, GROUND + 14, 170, 30, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(160,230,255,.4)'; ctx.lineWidth = 2; for (let k=0;k<3;k++){ ctx.beginPath(); ctx.ellipse(x - 60 + k*60, GROUND + 10, 20 + wrap(t*20 + k*10, 30), 4, 0, 0, 7); ctx.stroke(); }
    const ax = x + Math.sin(t*.5)*90, ay = GROUND + 8; ctx.fillStyle = '#ff9ab8'; ctx.beginPath(); ctx.ellipse(ax, ay, 22, 7, 0, 0, 7); ctx.fill(); circle(ax + 20, ay - 2, 8); ctx.strokeStyle = '#ff6ab8'; ctx.lineWidth = 2; for (const k of [-1, 0, 1]){ ctx.beginPath(); ctx.moveTo(ax + 18, ay - 6 + k*3); ctx.lineTo(ax + 12, ay - 14 + k*5); ctx.stroke(); } ctx.fillStyle = '#1a1a1a'; circle(ax + 24, ay - 4, 1.5); } }
  // a cracked-open geode (the keepsake)
  { const x = par(U_GEODE, 1); if (onScreen(x, 80)){ ctx.fillStyle = '#6a6070'; ctx.beginPath(); ctx.ellipse(x, GROUND - 16, 30, 22, 0, 0, 7); ctx.fill(); if (!Save.count('geode')){ ctx.fillStyle = '#c8a0ff'; ctx.beginPath(); ctx.ellipse(x, GROUND - 16, 20, 14, 0, 0, 7); ctx.fill(); for (let k=0;k<8;k++){ const a = k/8*Math.PI*2; ctx.fillStyle = k % 2 ? '#e8d0ff' : '#a070e0'; ctx.beginPath(); ctx.moveTo(x, GROUND - 16); ctx.lineTo(x + Math.cos(a)*18, GROUND - 16 + Math.sin(a)*12); ctx.lineTo(x + Math.cos(a + .4)*18, GROUND - 16 + Math.sin(a + .4)*12); ctx.fill(); } const sg = ctx.createRadialGradient(x, GROUND - 16, 2, x, GROUND - 16, 40); sg.addColorStop(0, `rgba(220,190,255,${.4 + .3*Math.sin(t*3)})`); sg.addColorStop(1, 'rgba(220,190,255,0)'); ctx.fillStyle = sg; circle(x, GROUND - 16, 40); } } }
  // the giant crystal (its purple heart is the Realm Gate)
  { const x = par(U_CRYSTAL, 1); if (onScreen(x, 200)){ const cg = ctx.createRadialGradient(x, GROUND - 120, 10, x, GROUND - 120, 200); cg.addColorStop(0, 'rgba(160,240,255,.45)'); cg.addColorStop(1, 'rgba(160,240,255,0)'); ctx.fillStyle = cg; circle(x, GROUND - 120, 200);
    for (const [dx, h, w, c] of [[-70, 140, 30, '#7fe0e6'], [0, 250, 46, '#a0f0ff'], [64, 170, 34, '#b58ae6'], [-30, 100, 22, '#b58ae6'], [100, 90, 22, '#7fe0e6']]){ ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x + dx - w, GROUND); ctx.lineTo(x + dx - w*.7, GROUND - h*.8); ctx.lineTo(x + dx, GROUND - h); ctx.lineTo(x + dx + w*.7, GROUND - h*.8); ctx.lineTo(x + dx + w, GROUND); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(x + dx - w*.3, GROUND - 10); ctx.lineTo(x + dx - w*.2, GROUND - h*.8); ctx.lineTo(x + dx, GROUND - h*.9); ctx.lineTo(x + dx, GROUND - 10); ctx.fill(); }
    ctx.fillStyle = '#b58ae6'; circle(x, GROUND - 120, 6); } }
  drawPlayer();
  // a soft headlamp glow around you, the cave darker further away
  { const px = P.x - camX, dk = ctx.createRadialGradient(px, GROUND - 60, 120, px, GROUND - 60, 560); dk.addColorStop(0, 'rgba(6,4,10,0)'); dk.addColorStop(1, 'rgba(6,4,10,.55)'); ctx.fillStyle = dk; ctx.fillRect(0, 0, W, H); }
}
function undergroundSpots(){ return [
  gateSpot(U_CRYSTAL, GROUND - 120, 'underground'),
  { x:U_MINE, r:110, hit:[U_MINE - 100, U_MINE + 100], stand:U_MINE - 70, gap:0, label:'Ride the mine cart', open:() => playHere('underground', 'Back to the caves', '← Underground', U_MINE - 70) },
  { x:U_MOLES, r:120, hit:[U_MOLES - 110, U_MOLES + 120], stand:U_MOLES - 130, gap:0, label:'Dig for gems with the mole family', open:() => playHere('dig', 'Back to the caves', '← Underground', U_MOLES - 130) },
  { x:U_MUSH, r:130, hit:[U_MUSH - 120, U_MUSH + 140], stand:U_MUSH - 130, gap:0, label:'Bounce up the mushroom cave', open:() => playHere('bounce', 'Back to the caves', '← Underground', U_MUSH - 130) },
  { x:U_LAKE, r:150, hit:[U_LAKE - 160, U_LAKE + 160], stand:U_LAKE - 180, gap:0, label:'Go fishing in the hidden lake', open:() => playHere('fish', 'Back to the caves', '← Underground', U_LAKE - 180) },
  { x:U_GEODE, r:60, hit:[U_GEODE - 40, U_GEODE + 40], stand:U_GEODE - 50, gap:0, label: Save.count('geode') ? 'Look at the empty geode' : 'Pick up the sparkly geode', open:() => findThing('geode', 'A Geode', 'An ordinary-looking rock… cracked open to show a cave of purple crystals inside. It sparkles every time you turn it.', 'Just the plain grey outside of the rock now.') },
  { x:U_CRYSTAL, r:90, hit:[U_CRYSTAL - 100, U_CRYSTAL + 110], hitY:[GROUND - 100, GROUND + 20], stand:U_CRYSTAL - 120, gap:0, label:'Touch the giant crystal', open:() => openMystery('The Giant Crystal', 'It hums when you touch it, and the hum goes all the way up your arm. Deep inside, a little purple spark is glowing…', '') },
]; }

// ---------- Topsy-Turvy Land ----------
// reached by winning Gravity Flip. There's a floor AND a ceiling you can walk on: walk up a beanstalk
// (or bounce on a Flip Spring) and you're strolling upside down along the sky-meadow, where different
// things are waiting. The sun and the moon are both out, the rainbow smiles, waterfalls pour upward,
// petals fall up, and the birds fly upside down.
const T_GAME = 460, T_WALL1 = 760, T_LAKE = 1100, T_WALL2 = 1500, T_GATE = 1860, T_HOUSE = 1000, T_FEATHER = 1300, T_LOOK = 2050, T_SPRING = 2200, T_W = 2350, T_CEIL = 120;
const TOPSY_TREES = ['#ff9ec8', '#9be3c8', '#c8a8ff', '#ffd08a'];
WORLDS.nograv = { name:'Topsy-Turvy Land', w:T_W, hub:() => ({ x:T_GATE, y:GROUND - 110 }),
  init:() => ({ flip:0, climb:null,
    fl:Array.from({ length:10 }, (_, i) => ({ x:hash(i)*T_W, y:175 + hash(i + 4)*140, k:i % 5, ph:i })),
    petals:Array.from({ length:26 }, (_, i) => ({ x:hash(i + 30)*W, y:hash(i + 60)*H, s:.6 + hash(i + 90)*.8, ph:i })),
    birds:[{ x:-100, y:180, v:70 }, { x:-500, y:230, v:55 }] }),
  draw:() => drawTopsy(), update:dt => updateTopsy(dt), spots:() => topsySpots() };
function updateTopsy(dt){
  // walking up (or down) a beanstalk, or flying on a Flip Spring: hold still while it plays out
  const c = ws.climb; if (c){ c.t += dt; const dur = c.spring ? 1.1 : 1.3; P.x = c.x - (c.spring ? 0 : 34); P.vx = 0; P.target = null; pending = null;
    if (c.t >= dur){ ws.flip = c.up ? 1 : 0; ws.climb = null; P.face = 1; toast = { text: ws.flip ? 'You’re walking on the sky!' : 'Back on the ground', t:2 }; } }
  for (const p of ws.petals){ p.y -= (24 + p.s*20)*dt; p.x += Math.sin(t*.8 + p.ph)*14*dt; if (p.y < T_CEIL - 10){ p.y = H + 10; p.x = Math.random()*W; } }
  for (const b of ws.birds){ b.x += b.v*dt; if (b.x > T_W + 200) b.x = -200 - Math.random()*400; }
  tickPops(dt);
}
function climbWall(x){ if (ws.climb) return; closePanels(); ws.climb = { t:0, x, up:!ws.flip }; P.anim.happy = 1; }
function flipSpring(){ if (ws.climb) return; closePanels(); ws.climb = { t:0, x:T_SPRING, up:!ws.flip, spring:true }; P.anim.happy = 2; }
// draw something as if it were growing from the sky-meadow (mirrored about the middle of the two lands)
function onSky(fn){ ctx.save(); ctx.translate(0, T_CEIL + GROUND); ctx.scale(1, -1); fn(); ctx.restore(); }
// a round, candy-colored tree (drawn growing up from y; use onSky to hang it from the sky)
function lollyTree(x, y, h, col){
  ctx.fillStyle = '#9a7058'; rr(x - 5, y - h, 10, h, 4); ctx.fill();
  ctx.fillStyle = col; circle(x, y - h - 18, 30); circle(x - 22, y - h, 20); circle(x + 22, y - h, 20);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; circle(x - 10, y - h - 30, 9);
}
function topsyFlower(x, y, col, s = 1){ ctx.strokeStyle = '#6ab86a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 16*s); ctx.stroke(); ctx.fillStyle = col; for (let k = 0; k < 5; k++){ const a = k/5*Math.PI*2 + t*.2; circle(x + Math.cos(a)*4*s, y - 18*s + Math.sin(a)*4*s, 3.2*s); } ctx.fillStyle = '#fff6c8'; circle(x, y - 18*s, 2*s); }
function topsyMushroom(x, y, col){ ctx.fillStyle = '#f6ead6'; rr(x - 4, y - 14, 8, 14, 3); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y - 14, 13, 9, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(x - 5, y - 18, 2); circle(x + 4, y - 16, 1.6); }
// a twisting candy beanstalk from the ground to the sky (the "walls" you can walk up)
function beanstalk(x){
  const top = T_CEIL - 6, bot = GROUND;
  for (const [ph, col] of [[0, '#7fd8a8'], [Math.PI, '#c8a0f0']]){ ctx.strokeStyle = col; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.beginPath();
    for (let y = bot; y >= top; y -= 6){ const k = (y - top)/(bot - top), wob = Math.sin(y*.035 + ph + t*.6)*14; y === bot ? ctx.moveTo(x + wob, y) : ctx.lineTo(x + wob, y); } ctx.stroke(); }
  ctx.lineCap = 'butt';
  for (let y = bot - 30; y > top + 20; y -= 46){ const s = (y/46) % 2 ? 1 : -1, lx = x + Math.sin(y*.035 + t*.6)*14; ctx.fillStyle = '#5ac08a'; ctx.beginPath(); ctx.ellipse(lx + s*18, y, 13, 6, s*.5, 0, 7); ctx.fill(); }
  // glowing arrows showing which way you'll walk
  for (let k = 0; k < 4; k++){ const yy = bot - 26 - wrap(t*50 + k*70, bot - top - 50); ctx.fillStyle = `rgba(255,240,180,${.5 + .4*Math.sin(t*3 + k)})`; ctx.font = '700 15px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(ws.flip ? '▼' : '▲', x - 36, yy); ctx.textAlign = 'left'; }
}
// a bouncy Flip Spring (drawn standing on y; onSky hangs the sky one)
function flipSpringPad(x, y, squish){
  ctx.fillStyle = '#6a5aa0'; rr(x - 30, y - 8, 60, 8, 3); ctx.fill();
  ctx.strokeStyle = '#ff8ac0'; ctx.lineWidth = 4; ctx.beginPath(); for (let k = 0; k <= 6; k++){ const yy = y - 8 - k*(4 - squish*2); ctx.lineTo(x + (k % 2 ? 14 : -14), yy); } ctx.stroke();
  ctx.fillStyle = '#ffd860'; rr(x - 26, y - 38 + squish*12, 52, 10, 5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x - 20, y - 36 + squish*12, 30, 3);
}
function drawTopsy(){
  // a dreamy pastel sky with the sun AND the moon out at the same time
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffd8ea'); g.addColorStop(.45, '#e6dcff'); g.addColorStop(1, '#c8ecff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  { const sx = par(420, .05), mx = par(1100, .05); const sg = ctx.createRadialGradient(sx, 300, 10, sx, 300, 110); sg.addColorStop(0, 'rgba(255,240,170,.9)'); sg.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = sg; circle(sx, 300, 110); ctx.fillStyle = '#fff2a8'; circle(sx, 300, 34);
    ctx.fillStyle = '#f6f0ff'; circle(mx, 230, 24); ctx.fillStyle = 'rgba(230,220,255,1)'; circle(mx + 9, 224, 20); }
  // the upside-down rainbow: a big smile across the sky
  for (const rwx of [700, 1900]){ const rx = par(rwx, .4), ry = 150; if (!onScreen(rx, 220)) continue; const cols = ['#ff9aa8', '#ffc88a', '#fff0a0', '#a8e8b8', '#a8d0ff', '#c8a8ff'];
    cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.globalAlpha = .5; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(rx, ry, 150 - i*9, .08*Math.PI, .92*Math.PI); ctx.stroke(); }); ctx.globalAlpha = 1; }
  // far floating islands (some growing upside down) and clouds drifting both ways up
  for (let i = Math.floor(camX*.25/300) - 1; i*300 - camX*.25 < W + 300; i++){ const x = i*300 - camX*.25 + hash(i)*120, y = 190 + hash(i + 3)*120, up = hash(i + 7) > .5, w = 50 + hash(i + 5)*40;
    ctx.save(); ctx.translate(x, y + Math.sin(t*.6 + i)*6); if (!up) ctx.scale(1, -1); ctx.globalAlpha = .75;
    ctx.fillStyle = '#c8b0a8'; ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(0, w*.9, w, 0); ctx.fill(); ctx.fillStyle = '#a8e0b0'; rr(-w - 4, -8, w*2 + 8, 12, 6); ctx.fill();
    ctx.fillStyle = TOPSY_TREES[((i % 4) + 4) % 4]; circle(-w*.3, -24, 14); ctx.fillStyle = '#9a7058'; ctx.fillRect(-w*.3 - 2, -14, 4, 10); ctx.restore(); }
  for (let i = Math.floor(camX*.35/260) - 1; i*260 - camX*.35 < W + 260; i++){ const x = i*260 - camX*.35 + hash(i + 11)*90 + wrap(t*6, 260) - 130, y = 160 + hash(i + 13)*200, flipC = hash(i + 15) > .5;
    ctx.save(); ctx.translate(x, y); if (flipC) ctx.scale(1, -1); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(0, 0, 46, 12, 0, 0, 7); ctx.fill(); circle(-16, -8, 16); circle(10, -12, 20); circle(30, -4, 12); ctx.restore(); }
  // waterfalls that pour UP from little pools into the sky
  for (const wx of [330, 1260, 1990]){ const x = par(wx, 1); if (!onScreen(x, 60)) continue;
    const fg = ctx.createLinearGradient(0, GROUND, 0, T_CEIL); fg.addColorStop(0, 'rgba(140,210,255,.35)'); fg.addColorStop(1, 'rgba(160,220,255,.75)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(x - 18, GROUND - 4); ctx.lineTo(x - 12, T_CEIL); ctx.lineTo(x + 12, T_CEIL); ctx.lineTo(x + 18, GROUND - 4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; for (let k = 0; k < 6; k++){ const yy = GROUND - wrap(t*140 + k*48, GROUND - T_CEIL); ctx.beginPath(); ctx.moveTo(x - 10 + k*4, yy); ctx.lineTo(x - 10 + k*4, yy - 16); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 5; k++) circle(x - 16 + k*8, T_CEIL + 4 + Math.sin(t*6 + k)*3, 6);
    ctx.fillStyle = '#7ac8f0'; ctx.beginPath(); ctx.ellipse(x, GROUND + 4, 40, 9, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, GROUND + 4, 20 + wrap(t*15, 18), 4, 0, 0, 7); ctx.stroke(); }
  // the floating curiosities: teacups, books, fish swimming through the air, apples and stars
  for (const f of ws.fl){ const fx = wrap(f.x - camX*.7, T_W + 200) - 100, fy = f.y + Math.sin(t + f.ph)*16; if (fx < -40 || fx > W + 40) continue; ctx.save(); ctx.translate(fx, fy); ctx.rotate(Math.sin(t*.5 + f.ph)*.6 + (f.k === 1 ? 0 : t*.2));
    if (f.k === 0){ ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-11, -7); ctx.lineTo(11, -7); ctx.lineTo(8, 7); ctx.lineTo(-8, 7); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(12, 0, 4, -1.5, 1.5); ctx.stroke(); ctx.fillStyle = '#ff9ec8'; ctx.fillRect(-9, -3, 18, 3); }
    else if (f.k === 1){ ctx.fillStyle = '#5ac8e0'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 6, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(-19, -6 + Math.sin(t*8)*2); ctx.lineTo(-19, 6 + Math.sin(t*8)*2); ctx.fill(); ctx.fillStyle = '#1a1a2a'; circle(6, -1, 1.5); }
    else if (f.k === 2){ ctx.fillStyle = '#ff6a7a'; circle(0, 0, 8); ctx.fillStyle = '#6ab86a'; ctx.beginPath(); ctx.ellipse(3, -10, 4, 2, -.5, 0, 7); ctx.fill(); }
    else if (f.k === 3){ ctx.fillStyle = '#7a8ae0'; ctx.fillRect(-11, -8, 22, 16); ctx.fillStyle = '#fff'; ctx.fillRect(-9, -6, 18, 12); ctx.fillStyle = '#7a8ae0'; ctx.fillRect(-1, -8, 2, 16); }
    else { ctx.fillStyle = '#ffe066'; ctx.beginPath(); for (let k = 0; k < 10; k++){ const a = -Math.PI/2 + k*Math.PI/5, r = k % 2 ? 4 : 9; ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r); } ctx.fill(); }
    ctx.restore(); }
  // birds flying upside down
  for (const b of ws.birds){ const x = b.x - camX*.8, y = b.y + Math.sin(t*2 + b.v)*8; if (x < -30 || x > W + 30) continue; ctx.save(); ctx.translate(x, y); ctx.scale(1, -1); const fl = Math.sin(t*10 + b.v)*6;
    ctx.fillStyle = '#7a8ae0'; ctx.beginPath(); ctx.ellipse(0, 0, 10, 6, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-10, -12 - fl); ctx.lineTo(4, -4); ctx.fill(); ctx.fillStyle = '#ffb05a'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(15, 2); ctx.lineTo(10, 3); ctx.fill(); ctx.fillStyle = '#1a1a2a'; circle(6, -1, 1.4); ctx.restore(); }
  // the sky-meadow, hanging upside down overhead: soil, grass fringe, trees, flowers and lanterns
  { const sg2 = ctx.createLinearGradient(0, 0, 0, T_CEIL); sg2.addColorStop(0, '#8a6aa8'); sg2.addColorStop(1, '#b896d0'); ctx.fillStyle = sg2; ctx.fillRect(0, 0, W, T_CEIL - 6);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let i = Math.floor(camX/90) - 1; i*90 - camX < W + 90; i++) circle(i*90 - camX + hash(i)*40, 30 + hash(i + 2)*50, 4 + hash(i + 4)*5);
    ctx.fillStyle = '#8fdcae'; ctx.beginPath(); ctx.moveTo(0, T_CEIL - 12); for (let sx = 0; sx <= W; sx += 14){ const wx = sx + camX; ctx.lineTo(sx, T_CEIL - 4 + Math.sin(wx*.08)*3 + (Math.floor(wx/14) % 2)*6); } ctx.lineTo(W, T_CEIL - 12); ctx.fill();
    ctx.fillStyle = '#6ac890'; ctx.fillRect(0, T_CEIL - 14, W, 4);
    for (let i = Math.floor(camX/170) - 1; i*170 - camX < W + 170; i++){ const wx = i*170 + hash(i + 3)*70, x = wx - camX; if (Math.abs(wx - T_HOUSE) < 130 || Math.abs(wx - T_WALL1) < 60 || Math.abs(wx - T_WALL2) < 60 || Math.abs(wx - T_LOOK) < 50 || Math.abs(wx - T_SPRING) < 60) continue;
      const k = hash(i + 9); onSky(() => { if (k < .55) lollyTree(x, GROUND + 4, 40 + hash(i)*40, TOPSY_TREES[((i % 4) + 4) % 4]); else if (k < .8) topsyMushroom(x, GROUND + 4, TOPSY_TREES[((i + 1) % 4 + 4) % 4]); });
      if (k >= .8){ const ly = T_CEIL + 26 + Math.sin(t*1.5 + i)*3; ctx.strokeStyle = '#6a5a8a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, T_CEIL - 4); ctx.lineTo(x, ly - 10); ctx.stroke(); const lg = ctx.createRadialGradient(x, ly, 2, x, ly, 22); lg.addColorStop(0, 'rgba(255,220,140,.7)'); lg.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = lg; circle(x, ly, 22); ctx.fillStyle = '#ffc870'; rr(x - 7, ly - 10, 14, 18, 5); ctx.fill(); } }
    for (let i = Math.floor(camX/55) - 1; i*55 - camX < W + 55; i++){ const x = i*55 - camX + hash(i + 20)*30; onSky(() => topsyFlower(x, GROUND + 6, TOPSY_TREES[((i % 4) + 4) % 4], .8)); } }
  // the ground: rolling grass, a pastel path, flowers and mushrooms
  { const gg = ctx.createLinearGradient(0, GROUND - 8, 0, H); gg.addColorStop(0, '#9be3a8'); gg.addColorStop(1, '#6ac08a'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(0, H); for (let sx = 0; sx <= W; sx += 12) ctx.lineTo(sx, GROUND - 6 + Math.sin((sx + camX)*.012)*4); ctx.lineTo(W, H); ctx.fill();
    for (let i = Math.floor(camX/48) - 1; i*48 - camX < W + 48; i++){ const x = i*48 - camX; ctx.fillStyle = ((i % 2) + 2) % 2 ? '#ffe8f0' : '#e8e0ff'; rr(x + 2, GROUND + 22, 42, 14, 6); ctx.fill(); }
    for (let i = Math.floor(camX/70) - 1; i*70 - camX < W + 70; i++){ const x = i*70 - camX + hash(i + 40)*36, k = hash(i + 41); if (k < .6) topsyFlower(x, GROUND + 14, TOPSY_TREES[((i % 4) + 4) % 4], .8); else if (k < .75) topsyMushroom(x, GROUND + 16, TOPSY_TREES[((i + 2) % 4 + 4) % 4]); } }
  drawWarpBack();
  // the Gravity Hall (play Gravity Flip again), with its twin hanging from the sky
  { const x = par(T_GAME, 1); if (onScreen(x, 140)){ const hall = (sky) => { ctx.fillStyle = sky ? '#d8c8f0' : '#8a78c8'; rr(x - 70, GROUND - 150, 140, 150, 16); ctx.fill(); ctx.fillStyle = sky ? '#c8b0e8' : '#6a5aa8'; ctx.beginPath(); ctx.moveTo(x - 82, GROUND - 146); ctx.lineTo(x, GROUND - 196); ctx.lineTo(x + 82, GROUND - 146); ctx.fill();
        ctx.fillStyle = '#ffe9a8'; rr(x - 28, GROUND - 92, 56, 92, 26); ctx.fill(); for (const wx of [-48, 48]){ ctx.fillStyle = '#bfe8ff'; circle(x + wx, GROUND - 100, 12); } };
      hall(false); onSky(() => { ctx.translate(x, GROUND); ctx.scale(.55, .55); ctx.translate(-x, -GROUND); hall(true); });
      ctx.fillStyle = '#6a5aa8'; ctx.font = '700 22px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('⇅', x, GROUND - 40); ctx.fillStyle = '#ffe9a8'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.fillText('GRAVITY HALL', x, GROUND - 124); ctx.textAlign = 'left'; } }
  // the beanstalks you can walk up
  for (const wx of [T_WALL1, T_WALL2]){ const x = par(wx, 1); if (onScreen(x, 70)) beanstalk(x); }
  // the Flip Springs: one on the ground and one hanging from the sky
  { const x = par(T_SPRING, 1); if (onScreen(x, 80)){ const sq = ws.climb && ws.climb.spring && ws.climb.t < .2 ? 1 - ws.climb.t*5 : 0;
      flipSpringPad(x, GROUND + 4, !ws.flip ? sq : 0); onSky(() => flipSpringPad(x, GROUND + 4, ws.flip ? sq : 0));
      ctx.fillStyle = '#6a5aa8'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('FLIP SPRING', x, GROUND - 46); ctx.textAlign = 'left'; } }
  // the floating lake: a big wobbly ball of water with fish swimming inside
  { const x = par(T_LAKE, 1), y = 262 + Math.sin(t*.8)*12; if (onScreen(x, 120)){ const r = 72 + Math.sin(t*2)*3;
    const halo = ctx.createRadialGradient(x, y, r*.8, x, y, r*1.4); halo.addColorStop(0, 'rgba(160,220,255,.35)'); halo.addColorStop(1, 'rgba(160,220,255,0)'); ctx.fillStyle = halo; circle(x, y, r*1.4);
    const lg = ctx.createRadialGradient(x - 20, y - 20, 10, x, y, r); lg.addColorStop(0, 'rgba(220,248,255,.95)'); lg.addColorStop(1, 'rgba(90,170,230,.8)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(x, y, r, r*.86 - Math.sin(t*2)*4, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y, r - 8, r*.86 - 12, 0, .2, 1.4); ctx.stroke();
    for (let k = 0; k < 4; k++){ const fx = x + Math.cos(t*(1 + k*.3) + k)*42, fy = y + Math.sin(t*(1.2 + k*.2) + k)*30; ctx.fillStyle = ['#ffb05a', '#ff7a8a', '#f2e27a', '#c8a0ff'][k]; ctx.beginPath(); ctx.ellipse(fx, fy, 8, 4, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(x - 30, y - 34, 14, 6, -.6, 0, 7); ctx.fill(); circle(x - 12, y - 46, 3); } }
  // the floating purple orb (the Realm Gate)
  { const x = par(T_GATE, 1), y = GROUND - 110 + Math.sin(t*1.5)*8; if (onScreen(x, 60)){ const og = ctx.createRadialGradient(x, y, 2, x, y, 44); og.addColorStop(0, 'rgba(200,160,255,.75)'); og.addColorStop(1, 'rgba(200,160,255,0)'); ctx.fillStyle = og; circle(x, y, 44); ctx.fillStyle = '#b58ae6'; circle(x, y, 11); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(x - 3, y - 3, 3);
    ctx.strokeStyle = 'rgba(200,170,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y, 24, 8, t, 0, 7); ctx.stroke(); ctx.fillStyle = '#9a8ac0'; ctx.fillRect(x - 3, y + 22, 6, GROUND - y - 22); } }
  // up on the sky-meadow: Flip the bunny's upside-down cottage, the floaty feather and the lookout
  { const x = par(T_HOUSE, 1); if (onScreen(x, 160)){ onSky(() => {
      ctx.fillStyle = '#fff4e0'; rr(x - 62, GROUND - 84, 124, 84, 6); ctx.fill(); ctx.fillStyle = '#ff8ab0'; ctx.beginPath(); ctx.moveTo(x - 78, GROUND - 80); ctx.lineTo(x, GROUND - 136); ctx.lineTo(x + 78, GROUND - 80); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 1; k < 4; k++) ctx.fillRect(x - 70 + k*12, GROUND - 82 - k*13, 140 - k*24, 3);
      ctx.fillStyle = '#9a6a4a'; rr(x - 14, GROUND - 48, 28, 48, 12); ctx.fill(); ctx.fillStyle = '#bfe8ff'; rr(x + 22, GROUND - 66, 24, 20, 4); ctx.fill(); rr(x - 46, GROUND - 66, 24, 20, 4); ctx.fill(); ctx.fillStyle = '#8a6a5a'; ctx.fillRect(x + 32, GROUND - 140, 14, 38);
      for (let k = 0; k < 5; k++) topsyFlower(x - 60 + k*30, GROUND + 4, TOPSY_TREES[k % 4], .9); });
    // Flip himself, standing upside down by his door
    const bx = x - 92, by = T_CEIL + 6 + Math.sin(t*3)*2; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(bx, by + 18, 12, 16, 0, 0, 7); ctx.fill(); circle(bx, by + 40, 11); ctx.beginPath(); ctx.ellipse(bx - 5, by + 60, 4, 13, .1, 0, 7); ctx.ellipse(bx + 5, by + 60, 4, 13, -.1, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffb0c8'; ctx.beginPath(); ctx.ellipse(bx - 5, by + 61, 2, 9, .1, 0, 7); ctx.ellipse(bx + 5, by + 61, 2, 9, -.1, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1a1a'; circle(bx - 4, by + 42, 1.8); circle(bx + 4, by + 42, 1.8); ctx.fillStyle = '#ff9ab8'; circle(bx, by + 36, 2); } }
  if (!Save.count('floatfeather')){ const x = par(T_FEATHER, 1), y = T_CEIL + 44 + Math.sin(t*2)*6; if (onScreen(x, 40)){ const fg = ctx.createRadialGradient(x, y, 1, x, y, 28); fg.addColorStop(0, 'rgba(255,240,255,.85)'); fg.addColorStop(1, 'rgba(255,240,255,0)'); ctx.fillStyle = fg; circle(x, y, 28); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t)*.4); itemIcon(ctx, 'floatfeather', 0, 0, .55); ctx.restore(); } }
  { const x = par(T_LOOK, 1); if (onScreen(x, 70)){ ctx.fillStyle = '#9a7058'; ctx.fillRect(x - 3, T_CEIL - 8, 6, 54); ctx.fillStyle = '#fff4e0'; rr(x - 40, T_CEIL + 42, 80, 26, 6); ctx.fill(); ctx.strokeStyle = '#c8a0f0'; ctx.lineWidth = 2; rr(x - 40, T_CEIL + 42, 80, 26, 6); ctx.stroke();
    ctx.fillStyle = '#6a5a9a'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('ǝʇnoʞooꞀ', x, T_CEIL + 60); ctx.textAlign = 'left'; } }
  // petals and bubbles drifting UP
  for (const p of ws.petals){ ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t + p.ph); if (p.ph % 3 === 0){ ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, 4*p.s, 0, 7); ctx.stroke(); }
    else { ctx.fillStyle = TOPSY_TREES[p.ph % 4]; ctx.globalAlpha = .8; ctx.beginPath(); ctx.ellipse(0, 0, 4*p.s, 2.4*p.s, 0, 0, 7); ctx.fill(); } ctx.restore(); }
  // you: on the ground, on the sky, walking up a beanstalk, or somersaulting off a Flip Spring
  const c = ws.climb;
  if (c && c.spring){ const k = Math.min(1, c.t/1.1), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2, y0 = c.up ? GROUND : T_CEIL, y1 = c.up ? T_CEIL : GROUND, yy = y0 + (y1 - y0)*e;
    ctx.save(); ctx.translate(c.x - camX, yy); ctx.rotate((c.up ? 1 : -1)*k*Math.PI); Chin.draw(ctx, 'me', P.anim, 0, 0, { scale:.12, face:1, grounded:false, speed:0 }); ctx.restore();
    ctx.fillStyle = 'rgba(255,240,180,.7)'; for (let s = 0; s < 6; s++) circle(c.x - camX + Math.cos(s + t*4)*30, yy + Math.sin(s + t*4)*30, 2.5); }
  else if (c){ const k = Math.min(1, c.t/1.3), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2, yy = c.up ? GROUND - e*(GROUND - T_CEIL) : T_CEIL + e*(GROUND - T_CEIL);
    ctx.save(); ctx.translate(c.x - 18 - camX, yy); ctx.rotate(-Math.PI/2); Chin.draw(ctx, 'me', P.anim, 0, 0, { scale:.12, face:c.up ? 1 : -1, grounded:true, speed:160 }); ctx.restore(); }
  else if (ws.flip){ ctx.save(); ctx.translate(0, GROUND + 14 + T_CEIL); ctx.scale(1, -1); drawPlayer(); ctx.restore(); }
  else drawPlayer();
}
function topsySpots(){
  const walls = [T_WALL1, T_WALL2].map(wx => ({ x:wx - 20, r:70, hit:[wx - 80, wx + 24], stand:wx - 34, gap:0, label: ws.flip ? 'Walk down the wall' : 'Walk up the wall', open:() => climbWall(wx) }));
  if (ws.climb) return [];
  if (ws.flip) return [...walls,
    { x:T_SPRING, r:60, hit:[T_SPRING - 40, T_SPRING + 40], stand:T_SPRING, gap:0, label:'Bounce back down on the Flip Spring', open:() => flipSpring() },
    { x:T_HOUSE, r:110, hit:[T_HOUSE - 120, T_HOUSE + 80], stand:T_HOUSE - 130, gap:0, label:'Make upside-down pancakes with Flip', open:() => playHere('pancake', 'Back to Topsy-Turvy Land', '← Topsy-Turvy', T_HOUSE - 130) },
    { x:T_FEATHER, r:60, hit:[T_FEATHER - 40, T_FEATHER + 40], stand:T_FEATHER - 50, gap:0, label: Save.count('floatfeather') ? 'Look at where the feather was' : 'Catch the floaty feather', open:() => findThing('floatfeather', 'A Floaty Feather', 'You reach for the feather and it drifts right into your paw. When you let go, it floats up instead of down!', 'Nothing here but sky, right below your feet.') },
    { x:T_LOOK, r:60, hit:[T_LOOK - 50, T_LOOK + 50], stand:T_LOOK - 60, gap:0, label:'Race the Backwards Dash', open:() => playHere('backwards', 'Back to Topsy-Turvy Land', '← Topsy-Turvy', T_LOOK - 60) },
  ];
  return [gateSpot(T_GATE, GROUND - 110, 'nograv'), ...walls,
    { x:T_SPRING, r:60, hit:[T_SPRING - 40, T_SPRING + 40], stand:T_SPRING, gap:0, label:'Bounce up to the sky on the Flip Spring', open:() => flipSpring() },
    { x:T_GAME, r:90, hit:[T_GAME - 80, T_GAME + 80], stand:T_GAME - 70, gap:0, label:'Run through the Gravity Hall', open:() => playHere('nograv', 'Back to Topsy-Turvy Land', '← Topsy-Turvy', T_GAME - 70) },
    { x:T_LAKE, r:100, hit:[T_LAKE - 90, T_LAKE + 90], stand:T_LAKE - 100, gap:0, label:'Roll through the Topsy Maze', open:() => playHere('tilt', 'Back to Topsy-Turvy Land', '← Topsy-Turvy', T_LAKE - 100) },
  ];
}

// ---------- Harmony Hollow ----------
// reached by winning The Painted Melody. A painted landscape at golden hour, full of music: a path of
// ivory and ebony steps that sings as you walk, an easel, a golden harp, an enchanted bandstand.
const A_POTS = 480, A_PIANO = 760, A_KEYS = 8, A_KEYW = 54, A_EASEL = 1400, A_HARP = 1720, A_BAND = 2060, A_BOX = 2190, A_FRAME = 2400, A_W = 2600;
const PIANO_NOTES = [261.6, 293.7, 329.6, 349.2, 392.0, 440.0, 493.9, 523.3];
// a painter's palette: rose madder, cadmium orange, gold ochre, sap green, cerulean, violet, and soft pinks
const PAINT_COLS = ['#c84b4b', '#e08a3c', '#e6c34a', '#5f9e6e', '#4a7fb8', '#8c63b8', '#e8a0a8', '#7ab8b0'];
const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif';
WORLDS.arts = { name:'Harmony Hollow', w:A_W, hub:() => ({ x:A_FRAME, y:GROUND - 196 }),
  init:() => ({ key:-1, keyT:0, pic:0, notes:[], harp:0, band:0 }),
  draw:() => drawHarmony(), update:dt => updateHarmony(dt), spots:() => harmonySpots() };
function updateHarmony(dt){
  // the Singing Path plays as you walk across it
  const k = P.x > A_PIANO && P.x < A_PIANO + A_KEYS*A_KEYW ? Math.floor((P.x - A_PIANO)/A_KEYW) : -1;
  if (k !== ws.key){ ws.key = k; if (k >= 0){ ws.keyT = .5; if (window.playNote) window.playNote(PIANO_NOTES[k], .9); ws.notes.push({ x:A_PIANO + k*A_KEYW + A_KEYW/2, y:GROUND - 30, life:2, ph:Math.random()*6 }); } }
  ws.keyT = Math.max(0, ws.keyT - dt); ws.harp = Math.max(0, ws.harp - dt); ws.band = Math.max(0, ws.band - dt);
  ws.notes.forEach(n => { n.y -= 34*dt; n.life -= dt; }); ws.notes = ws.notes.filter(n => n.life > 0);
  tickPops(dt);
}
function playPhrase(notes, gap, len){ notes.forEach((f, i) => setTimeout(() => window.playNote && window.playNote(f, len || .9), i*(gap || 220))); }
// a soft dab of paint: several overlapping strokes so edges look brushed rather than drawn
function dab(x, y, w, h, col, a, seed){ ctx.fillStyle = col; for (let k=0;k<4;k++){ ctx.globalAlpha = a*(.35 + hash(seed + k)*.3); ctx.beginPath(); ctx.ellipse(x + (hash(seed + k + 9) - .5)*w*.3, y + (hash(seed + k + 4) - .5)*h*.4, w*(.7 + hash(seed + k + 2)*.4), h*(.7 + hash(seed + k + 6)*.4), (hash(seed + k + 7) - .5)*.3, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }
function willow(x, base, h){
  // a weeping willow: a leaning trunk, a broad soft crown, and a curtain of long strands swaying to the ground
  ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x - 12, base - h*.45, x + 4, base - h*.8); ctx.stroke();
  ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 2, base - h*.7); ctx.quadraticCurveTo(x - h*.25, base - h*.95, x - h*.4, base - h*.82); ctx.moveTo(x + 4, base - h*.75); ctx.quadraticCurveTo(x + h*.25, base - h*.98, x + h*.42, base - h*.84); ctx.stroke();
  for (let k=0;k<7;k++) dab(x - h*.36 + k*h*.12, base - h*.9 - Math.sin(k/6*Math.PI)*h*.12, h*.12, h*.07, k % 2 ? '#8aa86a' : '#a4bc78', .9, x*.01 + k);
  for (let k=0;k<34;k++){ const u = k/33, sx = x - h*.44 + u*h*.88, sy = base - h*.86 - Math.sin(u*Math.PI)*h*.12, len = h*(.45 + Math.sin(u*Math.PI)*.35) + hash(k + x)*20, sway = reduceMotion ? 0 : Math.sin(t*.7 + k*.4)*7;
    ctx.strokeStyle = k % 3 === 0 ? 'rgba(170,190,110,.8)' : k % 3 === 1 ? 'rgba(120,155,90,.8)' : 'rgba(95,130,80,.75)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + (u - .5)*16, sy + len*.5, sx + (u - .5)*24 + sway, sy + len); ctx.stroke(); }
}
// the easel's paintings: a handful of impressionist scenes, painted in dabs
function easelPainting(x, y, w, h, n){
  const r = rng(900 + n), scene = n % 4;
  const P_ = [['#f2c89a', '#e89a7a', '#8a7ab0', '#e8b060', '#5a7a9a'], ['#c8d8f0', '#b8a0d8', '#8c63b8', '#a0c070', '#f0e0a0'], ['#1a2a5a', '#2a4a8a', '#e8d070', '#4a7fb8', '#0e1a3a'], ['#f6e6d6', '#e8a0a8', '#c84b4b', '#5f9e6e', '#f0d0b0']][scene];
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, P_[0]); g.addColorStop(1, P_[1]); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  if (scene === 2){ for (let k=0;k<5;k++){ ctx.strokeStyle = 'rgba(232,208,112,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 20 + r()*(w - 40), y + 14 + r()*30, 6 + r()*6, 0, 5); ctx.stroke(); } ctx.fillStyle = '#e8d070'; circle(x + w - 22, y + 16, 7); }
  else { ctx.fillStyle = P_[3]; ctx.globalAlpha = .9; circle(x + w*.72, y + h*.3, 9); ctx.globalAlpha = 1; }
  for (let k=0;k<30;k++){ const dx = x + r()*w, dy = y + h*.55 + r()*h*.45; ctx.fillStyle = P_[2 + Math.floor(r()*3)]; ctx.globalAlpha = .55 + r()*.4; ctx.beginPath(); ctx.ellipse(dx, dy, 3 + r()*6, 2 + r()*3, r()*3, 0, 7); ctx.fill(); }
  ctx.globalAlpha = 1;
}
function drawHarmony(){
  // a watercolor sky at golden hour
  const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, '#8fb3d9'); g.addColorStop(.45, '#e9c6c0'); g.addColorStop(.8, '#f6d7aa'); g.addColorStop(1, '#f8e6c4'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  { const sx = par(1500, .04), sg = ctx.createRadialGradient(sx, 250, 10, sx, 250, 300); sg.addColorStop(0, 'rgba(255,240,200,.95)'); sg.addColorStop(.2, 'rgba(255,220,170,.5)'); sg.addColorStop(1, 'rgba(255,220,170,0)'); ctx.fillStyle = sg; circle(sx, 250, 300); }
  // brushstroke clouds
  for (let i=0;i<7;i++){ const cx = wrap(i*230 - camX*.08 + t*3, W + 300) - 150, cy = 60 + hash(i)*120; for (let k=0;k<6;k++) dab(cx + k*26 - 70, cy + Math.sin(k + i)*6, 46, 12, k % 2 ? '#fbeee4' : '#f2d6d0', .9, i*20 + k); }
  // the music on the breeze: a golden staff flowing across the sky, with notes drifting along it
  { const off = camX*.12; ctx.strokeStyle = 'rgba(190,150,70,.45)'; ctx.lineWidth = 1.2;
    for (let l=0;l<5;l++){ ctx.beginPath(); for (let sx = -10; sx <= W + 10; sx += 10){ const y = 150 + l*7 + Math.sin((sx + off)*.006 + t*.25)*30; sx < 0 ? ctx.moveTo(sx, y) : ctx.lineTo(sx, y); } ctx.stroke(); }
    ctx.fillStyle = 'rgba(170,125,50,.75)'; ctx.font = `italic 600 26px ${SERIF}`; ctx.textAlign = 'center';
    for (let i=0;i<9;i++){ const nx = wrap(i*130 - off - t*14, W + 120) - 60, ny = 150 + (i % 5)*7 + Math.sin((nx + off)*.006 + t*.25)*30 - 4; ctx.fillText(['♪', '♩', '♫', '♬'][i % 4], nx, ny + 6); } ctx.textAlign = 'left'; }
  // far hills, painted in soft layers
  for (const [k, col, y0, amp] of [[.12, 'rgba(160,150,200,.8)', GROUND - 120, 40], [.25, 'rgba(150,170,150,.85)', GROUND - 80, 30]]){ ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, GROUND); for (let sx = 0; sx <= W; sx += 16){ const wx = sx + camX*k; ctx.lineTo(sx, y0 - Math.sin(wx*.004)*amp - Math.sin(wx*.013)*10); } ctx.lineTo(W, GROUND); ctx.fill(); }
  // the lake, catching the sunset
  { const lx0 = par(1250, 1), lx1 = par(2050, 1); if (lx1 > -40 && lx0 < W + 40){ const lg = ctx.createLinearGradient(0, GROUND - 50, 0, GROUND - 10); lg.addColorStop(0, '#d8b8c0'); lg.addColorStop(1, '#8aa8c8'); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse((lx0 + lx1)/2, GROUND - 30, (lx1 - lx0)/2, 22, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,210,.7)'; ctx.lineWidth = 2; for (let k=0;k<6;k++){ const y = GROUND - 40 + k*5, wv = Math.sin(t + k)*8, w = 50 - k*6; const sx = par(1500, .04); ctx.beginPath(); ctx.moveTo(sx - w + wv, y); ctx.lineTo(sx + w + wv, y); ctx.stroke(); } } }
  // willows along the way
  for (let i = Math.floor(camX*.7/420) - 1; i*420 - camX*.7 < W + 420; i++){ const x = i*420 - camX*.7 + hash(i + 40)*120; willow(x, GROUND - 20, 150 + hash(i)*40); }
  // the painted meadow
  ctx.fillStyle = '#8aa86a'; ctx.fillRect(0, GROUND - 14, W, H);
  for (let i = Math.floor(camX/18) - 1; i*18 - camX < W + 18; i++){ const x = i*18 - camX, h = 8 + hash(i)*14; ctx.strokeStyle = hash(i + 2) > .5 ? 'rgba(110,140,80,.9)' : 'rgba(170,180,100,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, GROUND - 6); ctx.quadraticCurveTo(x + 3, GROUND - 6 - h*.6, x + 6 + Math.sin(t + i)*2, GROUND - 6 - h); ctx.stroke();
    if (hash(i + 5) > .82){ ctx.fillStyle = ['#f0d0e0', '#fff6e8', '#e8c060', '#c8b0e0'][((i % 4) + 4) % 4]; circle(x + 6, GROUND - 8 - h, 2.6); } }
  ctx.fillStyle = '#c8b090'; ctx.fillRect(0, GROUND + 10, W, 26); for (let i = Math.floor(camX/30) - 1; i*30 - camX < W + 30; i++) dab(i*30 - camX, GROUND + 22, 14, 6, hash(i) > .5 ? '#b89c78' : '#d8c4a0', .8, i);
  drawWarpBack();
  // the atelier (play The Painted Melody again)
  { const x = par(A_POTS, 1); if (onScreen(x, 160)){ ctx.fillStyle = '#e8dccb'; ctx.fillRect(x - 90, GROUND - 170, 180, 160); ctx.fillStyle = '#c9b8a0'; for (let k=0;k<6;k++) ctx.fillRect(x - 90, GROUND - 160 + k*26, 180, 2);
    ctx.fillStyle = '#7a5a8a'; ctx.beginPath(); ctx.moveTo(x - 104, GROUND - 168); ctx.lineTo(x, GROUND - 226); ctx.lineTo(x + 104, GROUND - 168); ctx.fill();
    const wg = ctx.createRadialGradient(x, GROUND - 90, 4, x, GROUND - 90, 80); wg.addColorStop(0, 'rgba(255,220,150,.6)'); wg.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = wg; circle(x, GROUND - 90, 80);
    ctx.fillStyle = '#ffe2a8'; ctx.beginPath(); ctx.moveTo(x - 30, GROUND - 40); ctx.lineTo(x - 30, GROUND - 110); ctx.arc(x, GROUND - 110, 30, Math.PI, 0); ctx.lineTo(x + 30, GROUND - 40); ctx.fill(); ctx.strokeStyle = '#7a6a5a'; ctx.lineWidth = 3; ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, GROUND - 140); ctx.lineTo(x, GROUND - 40); ctx.moveTo(x - 30, GROUND - 90); ctx.lineTo(x + 30, GROUND - 90); ctx.stroke();
    for (let k=0;k<6;k++){ ctx.fillStyle = PAINT_COLS[k]; ctx.globalAlpha = .9; rr(x - 28 + k*9.5, GROUND - 56, 7, 12, 2); ctx.fill(); } ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(90,130,70,.8)'; ctx.lineWidth = 3; for (let k=0;k<5;k++){ ctx.beginPath(); ctx.moveTo(x + 90, GROUND - 170 + k*30); ctx.quadraticCurveTo(x + 100, GROUND - 150 + k*30, x + 92, GROUND - 130 + k*30); ctx.stroke(); }
    ctx.fillStyle = '#5a4a3a'; ctx.font = `italic 700 18px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillText('Atelier', x, GROUND - 180); ctx.textAlign = 'left'; } }
  // the Singing Path: ivory and ebony steps edged in gold
  { const x0 = par(A_PIANO, 1); if (onScreen(x0 + A_KEYS*A_KEYW/2, A_KEYS*A_KEYW)){ ctx.fillStyle = '#b8945a'; rr(x0 - 8, GROUND - 16, A_KEYS*A_KEYW + 16, 42, 6); ctx.fill();
    for (let k=0;k<A_KEYS;k++){ const kx = x0 + k*A_KEYW, on = ws.key === k; const kg = ctx.createLinearGradient(0, GROUND - 10, 0, GROUND + 22); kg.addColorStop(0, on ? '#fff3d0' : '#fbf6ec'); kg.addColorStop(1, on ? '#f0d890' : '#e6dccb'); ctx.fillStyle = kg; ctx.fillRect(kx + 2, GROUND - 10, A_KEYW - 4, 32);
      if (on){ const lg = ctx.createRadialGradient(kx + A_KEYW/2, GROUND, 2, kx + A_KEYW/2, GROUND, 60); lg.addColorStop(0, `rgba(255,230,160,${.6*ws.keyT*2})`); lg.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = lg; circle(kx + A_KEYW/2, GROUND, 60); } }
    for (const k of [0, 1, 3, 4, 5]){ ctx.fillStyle = '#1e1a22'; rr(x0 + (k + 1)*A_KEYW - 11, GROUND - 10, 22, 18, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x0 + (k + 1)*A_KEYW - 7, GROUND - 8, 3, 14); }
    ctx.fillStyle = '#b8945a'; rr(x0 - 110, GROUND - 74, 96, 30, 4); ctx.fill(); ctx.fillStyle = '#fbf3e0'; ctx.font = `italic 600 13px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillText('The Singing Path', x0 - 62, GROUND - 54); ctx.textAlign = 'left'; ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x0 - 64, GROUND - 44, 4, 34); } }
  for (const n of ws.notes){ ctx.globalAlpha = Math.min(1, n.life*.8); ctx.fillStyle = '#b8862a'; ctx.font = `italic 600 26px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillText('♪', n.x - camX + Math.sin(n.life*2 + n.ph)*10, n.y); ctx.textAlign = 'left'; ctx.globalAlpha = 1; }
  // the painter's easel by the lake
  { const x = par(A_EASEL, 1); if (onScreen(x, 110)){ ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 40, GROUND); ctx.lineTo(x - 8, GROUND - 180); ctx.moveTo(x + 40, GROUND); ctx.lineTo(x + 8, GROUND - 180); ctx.moveTo(x, GROUND - 176); ctx.lineTo(x + 14, GROUND); ctx.stroke(); ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - 54, GROUND - 74, 108, 6);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 52, GROUND - 168, 104, 92); ctx.clip(); easelPainting(x - 52, GROUND - 168, 104, 92, ws.pic); ctx.restore(); ctx.strokeStyle = '#f6efe2'; ctx.lineWidth = 3; ctx.strokeRect(x - 52, GROUND - 168, 104, 92);
    ctx.fillStyle = '#c9a36a'; ctx.beginPath(); ctx.ellipse(x + 62, GROUND - 46, 24, 15, -.3, 0, 7); ctx.fill(); for (let k=0;k<5;k++) dab(x + 50 + k*7, GROUND - 50 + (k % 2)*6, 4, 3, PAINT_COLS[k], 1, k + 3); } }
  // the golden harp under its own willow
  { const x = par(A_HARP, 1); if (onScreen(x, 160)){ willow(x + 70, GROUND - 6, 190);
    ctx.strokeStyle = '#c99a3a'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 30, GROUND - 4); ctx.lineTo(x - 34, GROUND - 150); ctx.quadraticCurveTo(x + 10, GROUND - 180, x + 40, GROUND - 140); ctx.quadraticCurveTo(x + 10, GROUND - 60, x - 30, GROUND - 4); ctx.stroke(); ctx.lineCap = 'butt';
    for (let k=0;k<9;k++){ const sx = x - 26 + k*7, top = GROUND - 150 - Math.sin(k/8*Math.PI)*16 + k*3, bot = GROUND - 12 - k*4, vib = ws.harp > 0 ? Math.sin(t*60 + k)*ws.harp*2 : 0; ctx.strokeStyle = 'rgba(255,245,220,.85)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx, top); ctx.quadraticCurveTo(sx + vib, (top + bot)/2, sx, bot); ctx.stroke(); }
    ctx.fillStyle = '#e8c870'; circle(x - 34, GROUND - 152, 6); } }
  // the enchanted bandstand, where the instruments play by themselves
  { const x = par(A_BAND, 1); if (onScreen(x, 180)){ ctx.fillStyle = '#efe8dc'; ctx.fillRect(x - 110, GROUND - 22, 220, 18); ctx.fillStyle = '#d8cfc0'; ctx.fillRect(x - 110, GROUND - 6, 220, 6);
    for (const cx of [-96, -32, 32, 96]){ ctx.fillStyle = '#f6f0e6'; ctx.fillRect(x + cx - 4, GROUND - 150, 8, 130); }
    ctx.fillStyle = '#7a8aa8'; ctx.beginPath(); ctx.moveTo(x - 124, GROUND - 148); ctx.quadraticCurveTo(x, GROUND - 230, x + 124, GROUND - 148); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c9a36a'; ctx.fillRect(x - 124, GROUND - 152, 248, 6); circle(x, GROUND - 206, 5);
    for (let k=0;k<7;k++){ ctx.strokeStyle = '#efe8dc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x - 96 + k*32, GROUND - 146, 16, 0, Math.PI); ctx.stroke(); }
    const play = ws.band > 0 ? 1 : .4, f = Math.sin(t*3)*4;
    // a violin and its bow
    ctx.save(); ctx.translate(x - 40, GROUND - 90 + f); ctx.rotate(-.5); ctx.fillStyle = '#9a4a24'; ctx.beginPath(); ctx.ellipse(0, 8, 11, 14, 0, 0, 7); ctx.ellipse(0, -10, 9, 11, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#3a2416'; ctx.fillRect(-2, -38, 4, 30); ctx.restore();
    ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 2; ctx.beginPath(); const bx = Math.sin(t*4*play)*14; ctx.moveTo(x - 66 + bx, GROUND - 110 + f); ctx.lineTo(x - 14 + bx, GROUND - 80 + f); ctx.stroke();
    // a cello
    ctx.save(); ctx.translate(x + 40, GROUND - 70 - f*.5); ctx.fillStyle = '#8a3a1c'; ctx.beginPath(); ctx.ellipse(0, 10, 16, 22, 0, 0, 7); ctx.ellipse(0, -18, 13, 16, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#3a2416'; ctx.fillRect(-2, -66, 4, 46); ctx.fillRect(-1, 30, 2, 12); ctx.restore();
    ctx.strokeStyle = '#d8c8a0'; ctx.lineWidth = 2; ctx.beginPath(); const cb = Math.sin(t*2.5*play + 1)*16; ctx.moveTo(x + 10 + cb, GROUND - 70); ctx.lineTo(x + 76 + cb, GROUND - 60); ctx.stroke();
    if (ws.band > 0 || Math.sin(t*.7) > 0){ ctx.fillStyle = 'rgba(180,135,60,.8)'; ctx.font = `italic 600 22px ${SERIF}`; ctx.textAlign = 'center'; for (let k=0;k<3;k++){ const q = wrap(t*.4 + k/3, 1); ctx.globalAlpha = 1 - q; ctx.fillText(['♪', '♫', '♩'][k], x - 30 + k*30 + Math.sin(q*6)*8, GROUND - 140 - q*70); } ctx.globalAlpha = 1; ctx.textAlign = 'left'; }
    // the silver music box on the bandstand steps
    if (!Save.count('musicbox')){ const mx = par(A_BOX, 1); const sg = ctx.createRadialGradient(mx, GROUND - 32, 2, mx, GROUND - 32, 30); sg.addColorStop(0, 'rgba(255,250,235,.7)'); sg.addColorStop(1, 'rgba(255,250,235,0)'); ctx.fillStyle = sg; circle(mx, GROUND - 32, 30); itemIcon(ctx, 'musicbox', mx, GROUND - 34, .6); } } }
  // the golden frame standing in the meadow (the jewel at its top is the Realm Gate)
  { const x = par(A_FRAME, 1); if (onScreen(x, 120)){ ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 30, GROUND); ctx.lineTo(x - 10, GROUND - 60); ctx.moveTo(x + 30, GROUND); ctx.lineTo(x + 10, GROUND - 60); ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.rect(x - 60, GROUND - 180, 120, 120); ctx.clip(); const fg = ctx.createLinearGradient(0, GROUND - 180, 0, GROUND - 60); fg.addColorStop(0, '#b8a0d8'); fg.addColorStop(1, '#f6d7aa'); ctx.fillStyle = fg; ctx.fillRect(x - 60, GROUND - 180, 120, 120); for (let k=0;k<12;k++) dab(x - 50 + hash(k)*100, GROUND - 90 + hash(k + 3)*30, 10, 5, hash(k + 1) > .5 ? '#8aa86a' : '#c8b0e0', .9, k + 50); ctx.restore();
    ctx.strokeStyle = '#c99a3a'; ctx.lineWidth = 10; ctx.strokeRect(x - 64, GROUND - 184, 128, 128); ctx.strokeStyle = '#e8c870'; ctx.lineWidth = 3; ctx.strokeRect(x - 58, GROUND - 178, 116, 116);
    for (const [cx, cy] of [[-64, -184], [64, -184], [-64, -56], [64, -56]]){ ctx.fillStyle = '#e8c870'; circle(x + cx, GROUND + cy, 7); }
    ctx.fillStyle = '#c99a3a'; ctx.beginPath(); ctx.ellipse(x, GROUND - 192, 16, 10, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8c63b8'; circle(x, GROUND - 194, 6); ctx.fillStyle = 'rgba(255,255,255,.7)'; circle(x - 2, GROUND - 196, 2); } }
  drawPlayer();
  // a warm, soft vignette like the edge of a painting
  const vg = ctx.createRadialGradient(W/2, H/2, 260, W/2, H/2, 560); vg.addColorStop(0, 'rgba(120,80,40,0)'); vg.addColorStop(1, 'rgba(120,80,40,.22)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
function harmonySpots(){ return [
  gateSpot(A_FRAME, GROUND - 194, 'arts'),
  { x:A_POTS, r:100, hit:[A_POTS - 90, A_POTS + 90], stand:A_POTS - 80, gap:0, label:'Step into the atelier', open:() => playHere('arts', 'Back to Harmony Hollow', '← Harmony Hollow', A_POTS - 80) },
  { x:A_EASEL, r:90, hit:[A_EASEL - 70, A_EASEL + 90], stand:A_EASEL - 80, gap:0, label:'Mix paints at the easel', open:() => playHere('mixer', 'Back to Harmony Hollow', '← Harmony Hollow', A_EASEL - 80) },
  { x:A_HARP, r:100, hit:[A_HARP - 80, A_HARP + 80], stand:A_HARP - 90, gap:0, label:'Play Harp Up or Down', open:() => playHere('pitch', 'Back to Harmony Hollow', '← Harmony Hollow', A_HARP - 90) },
  { x:A_BAND, r:110, hit:[A_BAND - 120, A_BAND + 70], stand:A_BAND - 140, gap:0, label:'Fix the bandstand’s music box', open:() => playHere('musicbox', 'Back to Harmony Hollow', '← Harmony Hollow', A_BAND - 140) },
  { x:A_BOX, r:60, hit:[A_BOX - 40, A_BOX + 40], stand:A_BOX - 50, gap:0, label: Save.count('musicbox') ? 'Sit on the bandstand steps' : 'Open the silver music box', open:() => { if (!Save.count('musicbox')) playPhrase([659.3, 587.3, 523.3, 587.3, 659.3, 659.3, 659.3], 260, .8); findThing('musicbox', 'A Silver Music Box', 'A tiny silver box with a dancer inside. When you lift the lid, it plays a sweet little lullaby.', 'You sit on the warm steps and listen to the music drift across the meadow.'); } },
  { x:A_FRAME, r:90, hit:[A_FRAME - 70, A_FRAME + 70], hitY:[GROUND - 180, GROUND + 20], stand:A_FRAME - 90, gap:0, label:'Look through the golden frame', open:() => openMystery('The Golden Frame', 'Through the frame the meadow looks like a painting, and the painting looks like the meadow. The violet jewel at the top glimmers when you look at it.', '') },
]; }

// ---------- THE WARP ----------
// behind the round stone door in the Crystal Grotto, deep under Thistledown's well. A strange,
// swirling place where colors shift, doors float, clocks melt and a giant eye watches you.
const P_TUNNEL = 520, P_DOORS = 920, P_TOCK = 1300, P_MIRROR = 1660, P_SHARD = 1980, P_EYE = 2300, P_W = 2600;
WORLDS.warp = { name:'THE WARP', w:P_W, hub:() => ({ x:P_EYE, y:GROUND - 170 }),
  init:() => ({ door:-1, doorT:0 }),
  draw:() => drawWarpLand(), update:dt => { ws.doorT = Math.max(0, ws.doorT - dt); if (ws.doorT <= 0) ws.door = -1; tickPops(dt); }, spots:() => warpSpots() };
function drawWarpLand(){
  const hue = (t*25) % 360;
  const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, `hsl(${hue},60%,18%)`); g.addColorStop(.6, `hsl(${(hue + 80) % 360},60%,35%)`); g.addColorStop(1, `hsl(${(hue + 160) % 360},70%,55%)`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // giant spirals turning in the sky
  for (let i=0;i<4;i++){ const sx = wrap(i*360 - camX*.15, 1440) - 200, sy = 90 + (i % 2)*80; ctx.save(); ctx.translate(sx, sy); ctx.rotate((reduceMotion ? 0 : t*(i % 2 ? .4 : -.3)));
    ctx.strokeStyle = `hsla(${(hue + i*70) % 360},90%,75%,.35)`; ctx.lineWidth = 4; ctx.beginPath(); for (let a = 0; a < 18; a += .2){ const r = a*4; a ? ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.moveTo(0, 0); } ctx.stroke(); ctx.restore(); }
  // melting clocks floating by
  for (let i=0;i<5;i++){ const cx = wrap(i*290 - camX*.35 + t*8, W + 300) - 150, cy = 200 + Math.sin(t*.7 + i)*20 + (i % 2)*40; ctx.save(); ctx.translate(cx, cy); ctx.rotate(Math.sin(t*.5 + i)*.3);
    ctx.fillStyle = '#f6ead6'; ctx.beginPath(); ctx.moveTo(-22, -20); ctx.quadraticCurveTo(0, -30, 22, -20); ctx.quadraticCurveTo(26, 6, 14, 30 + Math.sin(t + i)*6); ctx.quadraticCurveTo(0, 22, -16, 12); ctx.quadraticCurveTo(-28, 0, -22, -20); ctx.fill();
    ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(Math.cos(t*2 + i)*12, -4 + Math.sin(t*2 + i)*12); ctx.moveTo(0, -4); ctx.lineTo(Math.cos(t*.2 + i)*8, -4 + Math.sin(t*.2 + i)*8); ctx.stroke(); ctx.restore(); }
  // the wobbly checkerboard floor
  for (let i = Math.floor(camX/40) - 1; i*40 - camX < W + 40; i++) for (let j=0;j<3;j++){ const x = i*40 - camX, y = GROUND - 8 + j*28 + Math.sin(i*.5 + t*2 + j)*3; ctx.fillStyle = (i + j) % 2 ? `hsl(${(hue + 200) % 360},50%,20%)` : `hsl(${(hue + 20) % 360},70%,85%)`; ctx.fillRect(x, y, 40, 30); }
  drawWarpBack();
  // the tunnel mouth (ride the Warp Tunnel again)
  { const x = par(P_TUNNEL, 1); if (onScreen(x, 140)){ for (let k=6;k>0;k--){ ctx.fillStyle = `hsl(${(hue + k*40) % 360},80%,${30 + k*8}%)`; ctx.beginPath(); ctx.ellipse(x, GROUND - 90, k*16, k*20, 0, 0, 7); ctx.fill(); }
    ctx.save(); ctx.translate(x, GROUND - 90); ctx.rotate(reduceMotion ? 0 : t*3); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 3; ctx.beginPath(); for (let a = 0; a < 12; a += .3){ const r = a*7; a ? ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r*1.2) : ctx.moveTo(0, 0); } ctx.stroke(); ctx.restore(); } }
  // the floating doors (open one and peek into another realm)
  { const x0 = par(P_DOORS, 1); if (onScreen(x0, 200)){ ['#d0452f', '#3f8ad0', '#5ab870'].forEach((c, k) => { const dx = x0 - 90 + k*90, dy = GROUND - 150 + Math.sin(t*1.2 + k*2)*12, open = ws.door === k;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(dx, GROUND + 6, 24, 5, 0, 0, 7); ctx.fill();
      if (open){ const pg = ctx.createRadialGradient(dx, dy + 40, 4, dx, dy + 40, 50); pg.addColorStop(0, '#fffbe0'); pg.addColorStop(1, ['#f6c07a', '#9ad8ff', '#7ac070'][k]); ctx.fillStyle = pg; ctx.fillRect(dx - 24, dy, 48, 84); }
      ctx.fillStyle = c; ctx.save(); ctx.translate(dx - 24, dy); if (open) ctx.scale(.3, 1); ctx.fillRect(0, 0, 48, 84); ctx.fillStyle = '#f2c230'; circle(40, 44, 4); ctx.restore(); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.strokeRect(dx - 24, dy, 48, 84); }); } }
  // Tock, the pocket-watch creature who looks after THE WARP
  { const x = par(P_TOCK, 1); if (onScreen(x, 100)){ const bob = Math.abs(Math.sin(t*2))*4, y = GROUND - 70 - bob;
    ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x - 14, y + 34); ctx.lineTo(x - 18, GROUND - 2); ctx.moveTo(x + 14, y + 34); ctx.lineTo(x + 18, GROUND - 2); ctx.moveTo(x - 36, y); ctx.lineTo(x - 52, y + 18 + Math.sin(t*3)*6); ctx.moveTo(x + 36, y); ctx.lineTo(x + 52, y - 14); ctx.stroke();
    ctx.fillStyle = '#c9a13a'; circle(x, y, 40); ctx.fillStyle = '#fffbe8'; circle(x, y, 32); ctx.fillStyle = '#c9a13a'; ctx.fillRect(x - 6, y - 52, 12, 12); circle(x, y - 54, 6);
    for (let k=0;k<12;k++){ const a = k/12*Math.PI*2; ctx.fillStyle = '#6b4a2b'; circle(x + Math.cos(a)*27, y + Math.sin(a)*27, 1.6); }
    ctx.fillStyle = '#1a1a1a'; circle(x - 10, y - 6, 3.5); circle(x + 10, y - 6, 3.5); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 8, 8, .3, Math.PI - .3); ctx.stroke();
    ctx.strokeStyle = '#d0452f'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(t*6)*24, y + Math.sin(t*6)*24); ctx.stroke(); } }
  // the mirror whose reflection doesn't quite copy you
  { const x = par(P_MIRROR, 1); if (onScreen(x, 100)){ ctx.fillStyle = '#c9a13a'; rr(x - 54, GROUND - 190, 108, 190, 54); ctx.fill(); ctx.fillStyle = `hsl(${(hue + 180) % 360},40%,80%)`; rr(x - 44, GROUND - 180, 88, 172, 44); ctx.fill();
    ctx.save(); ctx.beginPath(); rr(x - 44, GROUND - 180, 88, 172, 44); ctx.clip(); const near = Math.abs(P.x - P_MIRROR) < 200; Chin.draw(ctx, 'me', P.anim, x + Math.sin(t*1.3)*10, GROUND - 12, { scale:.09, face:near ? -P.face : Math.sin(t) > 0 ? 1 : -1, grounded:true, speed:0 }); ctx.restore();
    if (Math.sin(t*.9) > .9){ ctx.fillStyle = '#fff'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('wink!', x, GROUND - 196); ctx.textAlign = 'left'; } } }
  // the warp shard (keepsake)
  if (!Save.count('warpshard')){ const x = par(P_SHARD, 1), y = GROUND - 70 + Math.sin(t*2)*8; if (onScreen(x, 40)){ const sg = ctx.createRadialGradient(x, y, 2, x, y, 40); sg.addColorStop(0, `hsla(${hue},90%,80%,.8)`); sg.addColorStop(1, `hsla(${hue},90%,80%,0)`); ctx.fillStyle = sg; circle(x, y, 40); ctx.save(); ctx.translate(x, y); ctx.rotate(t); itemIcon(ctx, 'warpshard', 0, 0, .6); ctx.restore(); } }
  // the giant eye at the end of THE WARP; its purple pupil is the Realm Gate and it follows you around
  { const x = par(P_EYE, 1), y = GROUND - 170; if (onScreen(x, 160)){ const blink = Math.sin(t*.5) > .97 ? .1 : 1;
    ctx.fillStyle = `hsl(${(hue + 120) % 360},40%,25%)`; ctx.fillRect(x - 8, y + 60, 16, GROUND - y - 60);
    ctx.fillStyle = '#fffbe8'; ctx.beginPath(); ctx.ellipse(x, y, 110, 66*blink, 0, 0, 7); ctx.fill(); ctx.strokeStyle = `hsl(${hue},80%,40%)`; ctx.lineWidth = 6; ctx.stroke();
    if (blink > .5){ const lx = clamp((P.x - P_EYE)/12, -50, 50); const ig = ctx.createRadialGradient(x + lx, y, 4, x + lx, y, 46); ig.addColorStop(0, `hsl(${(hue + 60) % 360},80%,60%)`); ig.addColorStop(1, `hsl(${(hue + 200) % 360},80%,35%)`); ctx.fillStyle = ig; circle(x + lx, y, 46); ctx.fillStyle = '#7a4ac0'; circle(x + lx, y, 18); ctx.fillStyle = 'rgba(255,255,255,.8)'; circle(x + lx - 10, y - 12, 7); } } }
  drawPlayer();
}
function warpSpots(){ return [
  gateSpot(P_EYE, GROUND - 170, 'warp'),
  { x:P_TUNNEL, r:100, hit:[P_TUNNEL - 100, P_TUNNEL + 100], stand:P_TUNNEL - 110, gap:0, label:'Dive into the Warp Tunnel', open:() => playHere('warp', 'Back to THE WARP', '← THE WARP', P_TUNNEL - 110) },
  { x:P_DOORS, r:140, hit:[P_DOORS - 130, P_DOORS + 130], stand:P_DOORS - 150, gap:0, label:'Help lost creatures through the doors', open:() => playHere('doors', 'Back to THE WARP', '← THE WARP', P_DOORS - 150) },
  { x:P_TOCK, r:80, hit:[P_TOCK - 70, P_TOCK + 70], stand:P_TOCK - 90, gap:0, label:'Play Time Freeze with Tock', open:() => playHere('freeze', 'Back to THE WARP', '← THE WARP', P_TOCK - 90) },
  { x:P_MIRROR, r:80, hit:[P_MIRROR - 60, P_MIRROR + 60], stand:P_MIRROR - 80, gap:0, label:'Step into the mirror', open:() => playHere('mirror', 'Back to THE WARP', '← THE WARP', P_MIRROR - 80) },
  { x:P_SHARD, r:60, hit:[P_SHARD - 40, P_SHARD + 40], stand:P_SHARD - 50, gap:0, label: Save.count('warpshard') ? 'Look at the swirling air' : 'Catch the warp shard', open:() => findThing('warpshard', 'A Warp Shard', 'A little crystal that won’t stay one color. Hold it up to your eye and the world swirls.', 'The air still swirls a little where the shard was.') },
  { x:P_EYE, r:120, hit:[P_EYE - 120, P_EYE + 120], hitY:[GROUND - 120, GROUND + 20], stand:P_EYE - 140, gap:0, label:'Look into the giant eye', open:() => openMystery('The Eye of THE WARP', 'The giant eye blinks slowly and follows you wherever you go. It doesn’t seem scary, more… curious. Its purple pupil glimmers like a door.', '') },
]; }

// ---------- the Realm Gates ----------
// every realm hides a Realm Gate. Find it and you can travel to any realm you've unlocked
// (a world unlocks the first time you win its game). Nothing is marked; each gate only
// gives off a faint purple glint now and then.
//   Thistledown:    the tiny round door high up inside the Hollow Tree
//   Golden Jungle:  the acorn carved on the stone face's forehead
//   Starry Nebula:  the tall teal crystal among the chiming crystals
//   Moonlit Lake:   the round mirror above the fireplace, inside the little cabin by the court
//   Neon City:      the strange purple button on the vending machine
//   Coral Sea:      the purple pearl inside the giant clam
//   Enchanted Kingdom: the gem on the handle of the sword in the stone
//   Dusty Gulch:    the knot-hole high up on the water tower
//   Underground:    the purple spark inside the giant crystal
//   Topsy-Turvy:    the floating purple orb on the ground side
//   Harmony Hollow: the violet jewel on top of the golden frame
//   THE WARP:       the purple pupil of the giant eye
// ---------- joined worlds ----------
// Some worlds are one big world: Dusty Gulch runs straight into the Underground through an old mine
// tunnel, Neon City's Skyway climbs right up into the Starry Nebula, and THE WARP twists into
// Topsy-Turvy Land. Each half keeps its own landmarks and games; the joined world just lays the two
// side by side with a walkable passage between them. While a half's own code runs (drawing, its spots,
// its updates) everything is shifted so that half still thinks it starts at 0.
let worldOff = 0, noTick = false;
const JOINED_PAIRS = {};
function inHalf(J, h, fn){
  const js = ws, off = h === 'b' ? J.joined.OFF : 0, n = pops.length;
  ws = js[h]; worldOff = off; P.x -= off; camX -= off;
  try { return fn(); }
  finally { P.x += off; camX += off; ws = js; worldOff = 0; if (off) for (let i = n; i < pops.length; i++) pops[i].x += off; }
}
function joinWorlds(idA, idB, seamW, drawSeam, opts = {}){
  const A = WORLDS[idA], B = WORLDS[idB], OFF = A.w + seamW, mid = A.w + seamW/2;
  const J = { name:A.name, w:OFF + B.w, hub:A.hub, joined:{ idA, idB, A, B, OFF, mid, seamW, oneSong:!!opts.oneSong },
    get float(){ return !!B.float && P.x > mid; },
    init:() => ({ a:A.init(), b:B.init(), lift:null }),
    // with a climb (opts.lift), the second half sits up on a platform: how high you are at world position x
    heightAt(x){ const L = opts.lift; if (!L) return 0; const rel = x - A.w; return x >= OFF ? L.H : rel <= L.s0 ? 0 : rel >= L.s1 ? L.H : L.H*(rel - L.s0)/(L.s1 - L.s0); },
    update(dt){
      inHalf(J, 'a', () => A.update(dt)); noTick = true; try { inHalf(J, 'b', () => B.update(dt)); } finally { noTick = false; }
      // the camera rises with you as you climb (and arrives already up there if you start on the platform)
      if (opts.lift){ const h = J.heightAt(P.x); ws.lift = ws.lift === null ? h : ws.lift + (h - ws.lift)*Math.min(1, dt*9); }
      // some things can't cross the passage (like walking upside down on Topsy-Turvy's sky)
      if (opts.stayInB && opts.stayInB(ws.b) && P.x < OFF + 30){ P.x = OFF + 30; P.vx = 0; P.target = null; }
    },
    draw(){
      // each world is drawn a little way into the passage, and the passage is laid over the top in thin strips
      // that fade out toward both ends, so the three pictures melt into one another with no edge
      const aEnd = A.w - camX, bStart = OFF - camX, FZ = 150, N = 12;
      // with a climb, the first half is drawn lower and the second half higher as the camera rises with you
      const LH = opts.lift ? opts.lift.H : 0, L = opts.lift ? (ws.lift || 0) : 0, h = J.heightAt(P.x), onStairs = !!opts.lift && P.x > A.w && P.x < OFF;
      if (opts.backdrop) opts.backdrop(L);
      const fa = opts.fadeA !== false, fb = opts.fadeB !== false, aR = aEnd + (fa ? FZ : (opts.extendA || 0)), bL = bStart - (fb ? FZ : 0);
      if (aR > 0){ ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.min(W, aR), H); ctx.clip(); ctx.translate(0, L); noPlayer = onStairs || L > .5; inHalf(J, 'a', () => A.draw()); noPlayer = false; ctx.restore(); }
      if (bL < W){ ctx.save(); ctx.beginPath(); ctx.rect(Math.max(0, bL), 0, W, H); ctx.clip(); ctx.translate(0, L - LH); noPlayer = onStairs || LH - L > .5; inHalf(J, 'b', () => { B.draw(); const g = B.hub(); gateGlint(g.x - camX + 8, g.y - 8); }); noPlayer = false; ctx.restore(); }
      if (aEnd < W && bStart > 0){
        const strip = (x0, x1, a) => { const l = Math.max(0, x0), r = Math.min(W, x1); if (r <= l || a <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(l, 0, r - l, H); ctx.clip(); ctx.translate(0, L); ctx.globalAlpha = a; drawSeam(aEnd, bStart); ctx.restore(); };
        strip(aEnd + (fa ? FZ : 0), bStart - (fb ? FZ : 0), 1);
        for (let i = 0; i < N; i++){ const k = (i + .5)/N; if (fa) strip(aEnd + i*FZ/N, aEnd + (i + 1)*FZ/N + .5, k); if (fb) strip(bStart - (i + 1)*FZ/N - .5, bStart - i*FZ/N, k); }
        if (!opts.lift && P.x > A.w - 90 && P.x < OFF + 90 && !(ws.b.flip || ws.b.climb)) inHalf(J, P.x > mid ? 'b' : 'a', () => drawPlayer());
      }
      // on the stairs (or while the camera is still catching up) you're drawn at your own height
      if (opts.lift && (onStairs || (L > .5 && LH - L > .5))){ ctx.save(); ctx.translate(0, L - h); inHalf(J, P.x > mid ? 'b' : 'a', () => drawPlayer()); ctx.restore(); }
    },
    spots(){
      const a = inHalf(J, 'a', () => A.spots());
      const b = inHalf(J, 'b', () => B.spots()).map(sp => ({ ...sp, label:sp.label, x:sp.x + OFF, hit:[sp.hit[0] + OFF, sp.hit[1] + OFF], stand:sp.stand + OFF, open:() => inHalf(J, 'b', () => sp.open()) }));
      return [...a, ...b];
    } };
  WORLDS[idA] = J;
  // the second half's old name still works (the Portal HQ, its warp game, old saved places): it just means "over there"
  WORLDS[idB] = { alias:idA, off:OFF, name:B.name, hub:() => { const h = B.hub(); return { x:h.x + OFF, y:h.y }; } };
  JOINED_PAIRS[idA] = idB; JOINED_PAIRS[idB] = idA;
  return J;
}
// which half of a joined world you're standing in (so the music, and "You are here", can match)
const worldHalfId = () => currentWorld && currentWorld.joined ? (currentWorld.joined.oneSong || P.x <= currentWorld.joined.mid ? currentWorld.joined.idA : currentWorld.joined.idB) : currentWorldId;
const seamK = (x, x0, x1) => clamp((x - x0)/(x1 - x0), 0, 1);

// Dusty Gulch → the Underground: the desert (Dusty Gulch keeps drawing its own sky, mesas and street a little
// way in) runs up to a big rocky mountain with a proper mine entrance at its foot. Past the timber portal, the
// mountain is cut away so you can see the lantern-lit tunnel, which opens out into the crystal caves.
function seamMine(x0, x1){
  const mx = x0 + 250, px = mx + 70, pw = 130, inside = px + pw;   // the mountain's edge, the portal, and where the cutaway starts
  // inside the mountain: the tunnel's back wall (the same dark as the caves), its rocky roof and floor
  const tg = ctx.createLinearGradient(0, 0, 0, H); tg.addColorStop(0, '#120e1a'); tg.addColorStop(1, '#2a2236'); ctx.fillStyle = tg; ctx.fillRect(px, 0, x1 - px + 2, H);
  ctx.fillStyle = '#3a3044'; ctx.fillRect(px, GROUND - 8, x1 - px + 2, H);
  // the rails run across the street and into the mine
  ctx.fillStyle = '#6b4a2b'; for (let x = x0 + 60 + (26 - wrap(camX, 26)); x < x1; x += 26) ctx.fillRect(x, GROUND + 24, 14, 7);
  ctx.strokeStyle = '#8a8a9a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + 60, GROUND + 26); ctx.lineTo(x1, GROUND + 26); ctx.moveTo(x0 + 60, GROUND + 33); ctx.lineTo(x1, GROUND + 33); ctx.stroke();
  for (let k = 0; k < 9; k++){ const sx = inside + k*70 + hash(k + 3)*30; if (sx > x1) break; ctx.fillStyle = 'rgba(80,60,90,.5)'; ctx.beginPath(); ctx.ellipse(sx, 200 + hash(k)*120, 40 + hash(k + 1)*30, 26, 0, 0, 7); ctx.fill(); }
  const rg = ctx.createLinearGradient(0, 0, 0, 130); rg.addColorStop(0, '#5a3a28'); rg.addColorStop(1, '#3a2a2a'); ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(inside - 10, 0); ctx.lineTo(x1 + 2, 0); ctx.lineTo(x1 + 2, 90);
  for (let x = x1; x > inside; x -= 30) ctx.lineTo(x, 112 + Math.sin(x*.07)*8 + hash(Math.floor(x))*6); ctx.lineTo(inside - 10, 120); ctx.closePath(); ctx.fill();
  for (let k = 0; k < 10; k++){ const sx = inside + 30 + k*52; if (sx > x1) break; ctx.fillStyle = '#3a2a2a'; ctx.beginPath(); ctx.moveTo(sx - 9, 112); ctx.lineTo(sx, 126 + hash(k)*22); ctx.lineTo(sx + 9, 112); ctx.fill(); }
  // timber supports and swinging lanterns down the tunnel, and a few crystals glinting as you get near the caves
  for (let k = 0; k < 5; k++){ const sx = inside + 50 + k*110; if (sx > x1 - 20) break; ctx.fillStyle = '#6b4a2b'; ctx.fillRect(sx - 6, 108, 12, GROUND - 108); ctx.fillRect(sx - 34, 104, 68, 12);
    if (k % 2 === 0){ const ly = 150 + Math.sin(t*1.5 + k)*3, lx = sx + 34; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, 116); ctx.lineTo(lx, ly - 10); ctx.stroke();
      const lg = ctx.createRadialGradient(lx, ly, 3, lx, ly, 90); lg.addColorStop(0, 'rgba(255,200,110,.5)'); lg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = lg; circle(lx, ly, 90); ctx.fillStyle = '#ffd278'; rr(lx - 7, ly - 10, 14, 18, 4); ctx.fill(); } }
  for (let k = 0; k < 4; k++){ const cx = x1 - 160 + k*40, cy = GROUND - 12 - (k % 2)*10; ctx.fillStyle = ['#7fe0e6', '#b58ae6'][k % 2]; ctx.beginPath(); ctx.moveTo(cx - 7, GROUND - 6); ctx.lineTo(cx, cy - 26); ctx.lineTo(cx + 7, GROUND - 6); ctx.fill(); }
  // the mountain's face, rising right up out of the desert, with the mine's portal at its foot
  const rock = ctx.createLinearGradient(mx, 0, inside, 0); rock.addColorStop(0, '#c0703e'); rock.addColorStop(1, '#9a5430'); ctx.fillStyle = rock;
  ctx.beginPath(); ctx.moveTo(mx - 40, GROUND); ctx.lineTo(mx - 10, GROUND - 120); ctx.lineTo(mx + 10, GROUND - 210); ctx.lineTo(mx + 40, GROUND - 300); ctx.lineTo(mx + 70, -10); ctx.lineTo(inside + 12, -10);
  for (let y = 0; y < GROUND; y += 40) ctx.lineTo(inside + 12 + Math.sin(y*.09)*8, y);
  ctx.lineTo(inside + 12, GROUND); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(110,50,25,.45)'; ctx.lineWidth = 3; for (const y of [60, 130, 210]){ ctx.beginPath(); ctx.moveTo(mx + 30 - y*.05, y); ctx.quadraticCurveTo(mx + 90, y + 10, inside + 8, y - 6); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,220,170,.18)'; ctx.beginPath(); ctx.moveTo(mx + 10, GROUND - 210); ctx.lineTo(mx + 40, GROUND - 300); ctx.lineTo(mx + 70, 0); ctx.lineTo(mx + 56, 0); ctx.lineTo(mx + 28, GROUND - 290); ctx.lineTo(mx, GROUND - 200); ctx.closePath(); ctx.fill();
  // the dark tunnel mouth
  ctx.fillStyle = '#100a10'; ctx.beginPath(); ctx.moveTo(px, GROUND); ctx.lineTo(px, GROUND - 130); ctx.lineTo(px + pw, GROUND - 130); ctx.lineTo(px + pw, GROUND); ctx.closePath(); ctx.fill();
  const mg = ctx.createLinearGradient(px, 0, px + pw, 0); mg.addColorStop(0, 'rgba(255,190,110,.18)'); mg.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = mg; ctx.fillRect(px, GROUND - 130, pw, 130);
  // the timber portal: thick posts, a big header beam with the mine's name, and boards on top
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(px - 16, GROUND - 140, 18, 140); ctx.fillRect(px + pw - 2, GROUND - 140, 18, 140);
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(px - 30, GROUND - 160, pw + 60, 26); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(px - 30, GROUND - 138, pw + 60, 4);
  ctx.fillStyle = '#4a3020'; for (let k = 0; k < 5; k++) ctx.fillRect(px - 24 + k*((pw + 48)/4), GROUND - 176, 8, 18);
  ctx.fillStyle = '#c9a06a'; for (const nx of [px - 22, px + pw + 14]) circle(nx, GROUND - 147, 3);
  ctx.fillStyle = '#f0e8d0'; ctx.font = '700 16px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OLD MINE', px + pw/2, GROUND - 147);
  // lanterns hung on either side of the entrance
  for (const lx of [px - 26, px + pw + 26]){ const ly = GROUND - 112 + Math.sin(t*1.8 + lx)*2; ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, GROUND - 134); ctx.lineTo(lx, ly - 10); ctx.stroke();
    const lg = ctx.createRadialGradient(lx, ly, 3, lx, ly, 60); lg.addColorStop(0, 'rgba(255,200,110,.55)'); lg.addColorStop(1, 'rgba(255,200,110,0)'); ctx.fillStyle = lg; circle(lx, ly, 60); ctx.fillStyle = '#ffd278'; rr(lx - 7, ly - 10, 14, 18, 4); ctx.fill(); ctx.fillStyle = '#3a2a1a'; ctx.fillRect(lx - 8, ly - 12, 16, 3); }
  // a warning sign on a post, a stack of crates, and a cart of crystals waiting by the door
  ctx.fillStyle = '#5a3a1a'; ctx.fillRect(mx - 52, GROUND - 76, 6, 76); ctx.fillStyle = '#f6d860'; ctx.beginPath(); ctx.moveTo(mx - 49, GROUND - 120); ctx.lineTo(mx - 9, GROUND - 82); ctx.lineTo(mx - 89, GROUND - 82); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#3a2616'; ctx.font = '700 9px "Pixelify Sans", monospace'; ctx.fillText('CAUTION', mx - 49, GROUND - 96); ctx.fillText('MOLES AT WORK', mx - 49, GROUND - 87);
  for (const [cx, cy] of [[mx - 4, 0], [mx + 26, 0], [mx + 11, 1]]){ const y = GROUND - 26 - cy*26; ctx.fillStyle = '#a07040'; ctx.fillRect(cx - 13, y, 26, 26); ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2; ctx.strokeRect(cx - 13, y, 26, 26); ctx.beginPath(); ctx.moveTo(cx - 13, y); ctx.lineTo(cx + 13, y + 26); ctx.stroke(); }
  { const cx = px + pw + 70; ctx.fillStyle = '#7a6a5a'; ctx.beginPath(); ctx.moveTo(cx - 34, GROUND - 34); ctx.lineTo(cx + 34, GROUND - 34); ctx.lineTo(cx + 28, GROUND - 6); ctx.lineTo(cx - 28, GROUND - 6); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#7fe0e6'; ctx.beginPath(); ctx.moveTo(cx - 14, GROUND - 34); ctx.lineTo(cx - 6, GROUND - 52); ctx.lineTo(cx + 2, GROUND - 34); ctx.fill(); ctx.fillStyle = '#b58ae6'; ctx.beginPath(); ctx.moveTo(cx + 4, GROUND - 34); ctx.lineTo(cx + 12, GROUND - 48); ctx.lineTo(cx + 20, GROUND - 34); ctx.fill(); for (const wx of [-18, 18]){ ctx.fillStyle = '#2a2a2a'; circle(cx + wx, GROUND - 4, 7); } }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
}
// THE WARP → Topsy-Turvy Land: the dark swirls spin out into a giant spiral, the floor turns to grass,
// and the upside-down sky-meadow fades in overhead
function seamTwist(x0, x1){
  const g = ctx.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, '#1a0a30'); g.addColorStop(.45, '#7a4aa0'); g.addColorStop(1, '#e6dcff'); ctx.fillStyle = g; ctx.fillRect(x0, 0, x1 - x0, H);
  // the giant spiral in the middle
  { const sx = x0 + (x1 - x0)*.45, sy = 250; ctx.save(); ctx.translate(sx, sy); ctx.rotate(reduceMotion ? 0 : t*.6);
    for (let k = 0; k < 7; k++){ ctx.strokeStyle = ['rgba(255,154,208,.6)', 'rgba(200,160,255,.6)', 'rgba(154,232,200,.6)', 'rgba(255,224,120,.6)'][k % 4]; ctx.lineWidth = 7; ctx.beginPath(); for (let a = 0; a < Math.PI*2.2; a += .1){ const r = 14 + a*22 + k*6; ctx.lineTo(Math.cos(a + k*.9)*r, Math.sin(a + k*.9)*r*.85); } ctx.stroke(); } ctx.restore(); }
  // tumbling things: warp clocks on one side turning into flowers on the other
  for (let i = 0; i < 12; i++){ const fx = x0 + hash(i)*(x1 - x0), f = seamK(fx, x0, x1), fy = 150 + hash(i + 12)*180 + Math.sin(t + i)*14; ctx.save(); ctx.translate(fx, fy); ctx.rotate(t*.8 + i);
    if (f < .5){ ctx.fillStyle = '#e8d8a8'; circle(0, 0, 11); ctx.fillStyle = '#fff8e8'; circle(0, 0, 8); ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -6); ctx.moveTo(0, 0); ctx.lineTo(4, 0); ctx.stroke(); }
    else { ctx.fillStyle = TOPSY_TREES[i % 4]; for (let k = 0; k < 5; k++){ const a = k/5*Math.PI*2; circle(Math.cos(a)*6, Math.sin(a)*6, 4.5); } ctx.fillStyle = '#fff6c8'; circle(0, 0, 3.5); }
    ctx.restore(); }
  // the floor: warp tiles melting into pastel grass
  const fg = ctx.createLinearGradient(x0, 0, x1, 0); fg.addColorStop(0, '#2a1848'); fg.addColorStop(1, '#9be3a8'); ctx.fillStyle = fg; ctx.fillRect(x0, GROUND - 8, x1 - x0, H - GROUND + 8);
  for (let x = x0 + (0 - wrap(camX, 48)); x < x1; x += 48){ const f = seamK(x, x0, x1); ctx.fillStyle = `hsla(${(x*.5 + t*40) % 360},70%,75%,${.25 + f*.3})`; rr(x + 2, GROUND + 22, 42, 14, 6); ctx.fill(); }
  // the sky-meadow fading in overhead as you get closer to Topsy-Turvy Land
  { const sx = x0 + (x1 - x0)*.55; ctx.save(); ctx.beginPath(); ctx.rect(sx, 0, x1 - sx, T_CEIL); ctx.clip(); const cg = ctx.createLinearGradient(sx, 0, x1, 0); cg.addColorStop(0, 'rgba(184,150,208,0)'); cg.addColorStop(1, 'rgba(184,150,208,1)'); ctx.fillStyle = cg; ctx.fillRect(sx, 0, x1 - sx, T_CEIL - 6);
    ctx.fillStyle = 'rgba(143,220,174,.9)'; for (let x = sx; x < x1; x += 14){ const f = seamK(x, sx, x1); ctx.globalAlpha = f; ctx.fillRect(x, T_CEIL - 14, 14, 6 + (Math.floor((x + camX)/14) % 2)*6); } ctx.globalAlpha = 1; ctx.restore(); }
  ctx.fillStyle = 'rgba(30,16,50,.85)'; rr(x0 + 170, GROUND - 120, 180, 40, 10); ctx.fill(); ctx.strokeStyle = '#ff9ad0'; ctx.lineWidth = 2; rr(x0 + 170, GROUND - 120, 180, 40, 10); ctx.stroke();
  ctx.fillStyle = '#ffe9a8'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('THE TWIST', x0 + 260, GROUND - 103); ctx.fillStyle = '#ff9ad0'; ctx.font = '700 10px "Pixelify Sans", monospace'; ctx.fillText('to Topsy-Turvy Land →', x0 + 260, GROUND - 89); ctx.textAlign = 'left';
  ctx.fillStyle = '#4a3a6a'; ctx.fillRect(x0 + 257, GROUND - 80, 6, 74);
}
// the Neon world's backdrop, behind both the city and the planet platform: a neon night sky and skyline,
// with the city's lights sinking away below you as you climb
function neonBackdrop(L){
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0b0620'); g.addColorStop(.55, '#2a0f4a'); g.addColorStop(1, '#4a1a5a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++){ const x = wrap(hash(i)*1200 - camX*.02, 1200) - 200; ctx.fillStyle = `rgba(255,255,255,${.3 + .5*Math.max(0, Math.sin(t*1.3 + i))})`; circle(x, hash(i + 5)*220, hash(i + 2)*1.2 + .4); }
  // Neon City's giant ringed blue planet and its two moons
  { const x = par(640, .03); const pg = ctx.createRadialGradient(x, 110, 30, x, 110, 150); pg.addColorStop(0, 'rgba(90,160,255,.4)'); pg.addColorStop(1, 'rgba(90,160,255,0)'); ctx.fillStyle = pg; circle(x, 110, 150);
    ctx.fillStyle = '#3a6ad0'; circle(x, 110, 68); ctx.fillStyle = 'rgba(150,210,255,.35)'; circle(x - 20, 90, 30); ctx.fillStyle = 'rgba(20,40,110,.4)'; ctx.fillRect(x - 68, 120, 136, 10);
    ctx.strokeStyle = 'rgba(160,230,255,.75)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(x, 110, 118, 22, -.18, 0, 7); ctx.stroke();
    ctx.fillStyle = '#b8c8f0'; circle(par(300, .05), 70, 14); ctx.fillStyle = '#e8d0ff'; circle(par(900, .05), 50, 9); }
  // far towers, then nearer ones with neon edges (they drop as you rise)
  for (let i = Math.floor(camX*.12/70) - 1; i*70 - camX*.12 < W + 70; i++){ const x = i*70 - camX*.12 + hash(i)*30, w = 40 + hash(i + 1)*40, h = 90 + hash(i + 2)*150, base = 340 + L*.35;
    ctx.fillStyle = '#1a1030'; ctx.fillRect(x, base - h, w, h + 200);
    for (let y = base - h + 8; y < base + 60; y += 12) for (let wx = 4; wx < w - 4; wx += 8) if (hash(i*9 + wx*.3 + y*.7) > .62){ ctx.fillStyle = hash(wx + y + i) > .5 ? 'rgba(255,230,140,.55)' : 'rgba(120,220,255,.5)'; ctx.fillRect(x + wx, y, 3, 4); }
    if (hash(i + 3) > .6){ ctx.fillStyle = `rgba(255,80,80,${.4 + .6*Math.max(0, Math.sin(t*3 + i))})`; circle(x + w/2, base - h - 12, 2.5); ctx.fillStyle = '#1a1030'; ctx.fillRect(x + w/2 - 1, base - h - 12, 2, 12); } }
  for (let i = Math.floor(camX*.3/130) - 1; i*130 - camX*.3 < W + 130; i++){ const x = i*130 - camX*.3 + hash(i + 40)*50, w = 60 + hash(i + 41)*50, h = 160 + hash(i + 42)*150, base = 470 + L*.75, col = hash(i + 43) < .5 ? '255,106,213' : '90,220,255';
    ctx.fillStyle = '#20123a'; ctx.fillRect(x, base - h, w, h + 300);
    for (let y = base - h + 10; y < base + 80; y += 16) for (let wx = 6; wx < w - 6; wx += 12) if (hash(i*5 + wx + y*.5) > .55){ ctx.fillStyle = 'rgba(255,230,160,.5)'; ctx.fillRect(x + wx, y, 5, 7); }
    ctx.strokeStyle = `rgba(${col},.7)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, base + 300); ctx.lineTo(x, base - h); ctx.lineTo(x + w, base - h); ctx.lineTo(x + w, base + 300); ctx.stroke();
    if (hash(i + 44) > .8){ const bx = x + w/2, by = base - h + 50; ctx.fillStyle = 'rgba(90,220,255,.12)'; rr(bx - 60, by - 30, 120, 60, 8); ctx.fill(); ctx.strokeStyle = 'rgba(90,220,255,.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      neonText('NEON BEATS', bx, by - 12, 13, '255,106,213', true); for (let k = 0; k < 8; k++){ const bh = 6 + Math.abs(Math.sin(t*6 + k))*16; ctx.fillStyle = 'rgba(90,220,255,.7)'; ctx.fillRect(bx - 40 + k*10, by + 22 - bh, 6, bh); } } }
  // the glow of the streets far below
  const sg = ctx.createLinearGradient(0, H - 120 + L*.6, 0, H + L*.6); sg.addColorStop(0, 'rgba(255,106,213,0)'); sg.addColorStop(1, 'rgba(255,106,213,.35)'); ctx.fillStyle = sg; ctx.fillRect(0, H - 120 + L*.6, W, 120);
}
// Neon City → the planet platform: the street runs on under a grand neon staircase that climbs up to the Planet Deck
const NEON_LIFT = { H:230, s0:150, s1:560 };
function seamStairs(x0, x1){
  const s0 = x0 + NEON_LIFT.s0, s1 = x0 + NEON_LIFT.s1, top = GROUND - NEON_LIFT.H, steps = 16;
  // the street carrying on underneath
  ctx.fillStyle = '#1a1428'; ctx.fillRect(x0, GROUND - 8, x1 - x0, H); neonTube(x0, GROUND - 6, x1, GROUND - 6, '90,220,255', .9);
  // pillars holding up the stairs and the landing
  for (let x = s0 + 90; x < s1; x += 120){ const yTop = GROUND - NEON_LIFT.H*(x - s0)/(s1 - s0); ctx.fillStyle = '#231440'; ctx.fillRect(x - 7, yTop + 16, 14, GROUND - yTop - 16); neonTube(x - 7, yTop + 20, x - 7, GROUND - 8, '255,106,213', .5); }
  // the staircase: each step's edge glows, pink and blue in turn
  ctx.fillStyle = '#2a1848'; ctx.beginPath(); ctx.moveTo(s0, GROUND); for (let k = 0; k < steps; k++){ const sx = s0 + k*(s1 - s0)/steps, sy = GROUND - (k + 1)*NEON_LIFT.H/steps; ctx.lineTo(sx, sy); ctx.lineTo(sx + (s1 - s0)/steps, sy); }
  ctx.lineTo(x1 + 2, top); ctx.lineTo(x1 + 2, top + 34); ctx.lineTo(s1, top + 34); ctx.lineTo(s0 + 40, GROUND); ctx.closePath(); ctx.fill();
  for (let k = 0; k < steps; k++){ const sx = s0 + k*(s1 - s0)/steps, sy = GROUND - (k + 1)*NEON_LIFT.H/steps, lit = (Math.floor(t*8) - k) % steps === 0;
    ctx.strokeStyle = lit ? '#ffffff' : k % 2 ? '#ff6ad5' : '#5adcff'; ctx.lineWidth = lit ? 3 : 2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (s1 - s0)/steps, sy); ctx.stroke(); }
  // the landing at the top, the same deck as the Planet Deck beyond
  ctx.fillStyle = '#3a2a5a'; ctx.fillRect(s1, top - 6, x1 + 2 - s1, 40); ctx.fillStyle = '#4a3870'; ctx.fillRect(s1, top - 6, x1 + 2 - s1, 12);
  ctx.strokeStyle = 'rgba(181,138,230,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s1, top - 6); ctx.lineTo(x1 + 2, top - 6); ctx.stroke(); neonTube(s1, top + 34, x1 + 2, top + 34, '200,160,255', .8);
  for (let x = s1 + 60; x < x1; x += 110){ ctx.fillStyle = '#231440'; ctx.fillRect(x - 9, top + 30, 18, GROUND - top - 38); neonTube(x - 9, top + 34, x - 9, GROUND - 8, '200,160,255', .45); }
  // a neon handrail up the side
  ctx.strokeStyle = 'rgba(90,220,255,.35)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(s0, GROUND - 42); ctx.lineTo(s1, top - 42); ctx.lineTo(x1 + 2, top - 42); ctx.stroke(); ctx.strokeStyle = '#5adcff'; ctx.lineWidth = 2.5; ctx.stroke();
  for (let k = 0; k <= 8; k++){ const sx = s0 + k*(s1 - s0)/8, sy = GROUND - NEON_LIFT.H*k/8; ctx.fillStyle = '#5adcff'; ctx.fillRect(sx - 1.5, sy - 42, 3, 40); }
  // the sign at the bottom
  const sx = s0 + 40; ctx.fillStyle = '#231440'; ctx.fillRect(sx - 3, GROUND - 150, 6, 142);
  ctx.fillStyle = '#120a22'; rr(sx - 66, GROUND - 196, 132, 42, 8); ctx.fill(); ctx.strokeStyle = '#ff6ad5'; ctx.lineWidth = 2; rr(sx - 66, GROUND - 196, 132, 42, 8); ctx.stroke();
  ctx.fillStyle = '#ffe66e'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('PLANET DECK ↑', sx, GROUND - 178); ctx.fillStyle = '#5adcff'; ctx.font = '700 10px "Pixelify Sans", monospace'; ctx.fillText('climb the stairs', sx, GROUND - 163); ctx.textAlign = 'left';
}
joinWorlds('west', 'underground', 720, seamMine, { fadeA:false, extendA:420 });
joinWorlds('city', 'nebula', 720, seamStairs, { lift:NEON_LIFT, backdrop:neonBackdrop, oneSong:true, fadeA:false, fadeB:false });
joinWorlds('warp', 'nograv', 720, seamTwist, { stayInB:s => s.flip || s.climb });

const REALMS = [
  { id:'thistledown', name:'Thistledown', desc:'Home: the village, the meadow and all their secrets.' },
  { id:'jungle', name:'The Golden Jungle', desc:'Vines, a waterfall and a very sleepy sloth.' },
  { id:'moonlake', name:'The Moonlit Lake', desc:'A cabin, a campfire and an owl who loves tennis.' },
  { id:'city', name:'Neon City & the Starry Nebula', desc:'Neon towers, flying cars and a noodle robot, then up the glowing Skyway to floating islands among the stars.' },
  { id:'sea', name:'The Coral Sea', desc:'A sunken ship, a juggling octopus and a turtle who gives rides.' },
  { id:'fantasy', name:'The Enchanted Kingdom', desc:'A wizard’s tower, a unicorn and a very sleepy baby dragon.' },
  { id:'west', name:'Dusty Gulch & the Underground', desc:'A desert town with a lemonade saloon, then down the old mine into crystal caves and a mole family in hard hats.' },
  { id:'arts', name:'Harmony Hollow', desc:'Painted meadows at golden hour, and music drifting on the breeze.' },
  { id:'warp', name:'THE WARP & Topsy-Turvy Land', desc:'Floating doors and melting clocks, then through the Twist to a land where you can walk on the sky.' },
];
// the newer realms can be opened right from their flickering portals in the Portal HQ, by winning their game
const TRIAL_REALMS = ['sea', 'fantasy', 'west', 'arts'];
// ...but only the next realm in line flickers; the rest stay sealed until you've opened the ones before them
const trialOpen = id => !realmOpen(id) && TRIAL_REALMS.includes(id) && UNLOCK_ORDER.find(r => !realmOpen(r)) === id;
function playRealmTrial(id){ closePanels(); transition(() => startWorldGame(id, 'hq'), true); }
const HOLLOW_GATE = { x:690, y:56 };
const realmOpen = id => id === 'thistledown' || Save.flag('wgWin_' + id) || (!!JOINED_PAIRS[id] && Save.flag('wgWin_' + JOINED_PAIRS[id]));
const realmPanel = document.getElementById('realmPanel');
document.getElementById('realmClose').addEventListener('click', closePanels);
function openRealmGate(here){
  closePanels(); P.target = null; pending = null; for (const k in keys) keys[k] = false;
  const list = document.getElementById('realmList'); list.innerHTML = '';
  for (const r of REALMS){
    const open = !r.never && realmOpen(r.id), li = document.createElement('li');
    li.className = 'shop-item' + (open ? '' : ' locked');
    li.innerHTML = `<div class="info"><div class="name"></div><div class="desc"></div></div><div class="side"><button class="btn btn-sm"></button></div>`;
    li.querySelector('.name').textContent = r.name;
    li.querySelector('.desc').textContent = open ? r.desc : r.never ? r.desc : 'Locked. Win this world’s game to open the way.';
    const b = li.querySelector('button');
    if (r.id === portalId(here)){ b.textContent = 'You are here'; b.className = 'btn btn-secondary btn-sm'; b.disabled = true; }
    else if (!open){ b.textContent = 'Locked'; b.className = 'btn btn-secondary btn-sm'; b.disabled = true; }
    else { b.textContent = 'Travel'; b.className = 'btn btn-primary btn-sm'; b.addEventListener('click', () => travelTo(r.id)); }
    list.appendChild(li);
  }
  realmPanel.hidden = false; document.getElementById('realmClose').focus();
}
// step through a Realm Gate and come out beside the gate in the other realm
function travelTo(id){
  closePanels();
  transition(() => {
    if (id === 'thistledown'){ scene = 'secret'; currentSecret = SECRETS.tree; currentWorld = null; currentWorldId = null; ws = null; P.x = HOLLOW_GATE.x - 40; }
    else {
      const rid = WORLDS[id].alias || id;   // the far half of a joined world lives inside its partner
      scene = 'world'; currentSecret = null; currentWorld = WORLDS[rid]; currentWorldId = rid; ws = currentWorld.init(); pops = [];
      P.x = WORLDS[id].hub().x - 60;
      if (currentWorld.inside){ scene = 'secret'; currentSecret = SECRETS[currentWorld.inside]; P.x = CABIN_GATE.x - 70; }
      worldReturn = { scene:'secret', secret:'tree', x:HOLLOW_GATE.x - 40 };   // the warp home leads to the Hollow Tree
      if (!Save.flag('world_' + id)) Save.setFlag('world_' + id);
    }
    P.face = 1; P.vx = 0; P.target = null; pending = null;
    camX = clamp(P.x - W*.42, 0, (scene === 'world' ? currentWorld.w : W) - W);
    toast = { text: (REALMS.find(r => r.id === id) || WORLDS[id] || { name:'' }).name, t:2.4 };
  }, true);
}
// warp holes in the games: where they can take you (any other realm you've opened), and the trip itself
window.warpTargets = here => REALMS.filter(r => r.id !== here && realmOpen(r.id)).map(r => ({ id:r.id, name:r.name, col:(HQ_PORTALS.find(p => p.id === r.id) || { col:'200,160,255' }).col }));
// the worlds open in this order; each warp leads to the first one you haven't found yet (THE WARP comes last, through the well)
const UNLOCK_ORDER = ['jungle', 'moonlake', 'city', 'sea', 'fantasy', 'west', 'arts'];
window.warpNext = here => {
  const id = UNLOCK_ORDER.find(r => !realmOpen(r)), col = r => (HQ_PORTALS.find(p => p.id === r) || { col:'200,160,255' }).col;
  if (id) return { id, name:(REALMS.find(r => r.id === id) || { name:id }).name, col:col(id), locked:true, game:id === 'city' ? 'nebula' : id };   // Neon City & the Nebula opens with Hoverboard
  const open = window.warpTargets(here); return open.length ? open[Math.floor(Math.random()*open.length)] : null;   // everything found: a shortcut instead
};
window.warpFromGame = id => { closePanels(); climbing = null; fadeDir = 0; fadeA = 0; showScreen(screenEl); travelTo(id); };
// THE WARP is the last realm: its stone door opens only once every other realm is open
const warpProgress = () => { const others = REALMS.filter(r => r.id !== 'warp' && r.id !== 'thistledown'); return { open:others.filter(r => realmOpen(r.id)).length, total:others.length }; };
// a faint purple glint every few seconds, the only clue a gate is there
function gateGlint(sx, sy){
  if (reduceMotion) return;
  const a = Math.pow(Math.max(0, Math.sin(t*1.3)), 10); if (a < .02) return;
  const k = 5 + a*4;
  ctx.fillStyle = `rgba(200,160,255,${a*.9})`; ctx.beginPath();
  ctx.moveTo(sx, sy - k); ctx.lineTo(sx + 1.5, sy - 1.5); ctx.lineTo(sx + k, sy); ctx.lineTo(sx + 1.5, sy + 1.5); ctx.lineTo(sx, sy + k); ctx.lineTo(sx - 1.5, sy + 1.5); ctx.lineTo(sx - k, sy); ctx.lineTo(sx - 1.5, sy - 1.5); ctx.closePath(); ctx.fill();
}
// ---------- the portal hubs inside each world ----------
// Every world's Realm Gate is a place you can go inside: step into the stone face, squeeze behind the
// vending machine, climb into the water tower… Each room has a door back out, something to look at, and one
// secret (but rather obvious) thing that glows and hums. Touch it and you're in the Portal HQ with every portal.
// (Thistledown's Hollow Tree and the Moonlit Lake's cabin already work like this, so they keep their own rooms.)
const HUB_X = 560;
function hubGlow(x, y, col, r = 70){ const k = .55 + .25*Math.sin(t*2.6); const g = ctx.createRadialGradient(x, y, 4, x, y, r*1.6); g.addColorStop(0, `rgba(${col},${k})`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; circle(x, y, r*1.6);
  for (let i = 0; i < 8; i++){ const a = t*.8 + i/8*Math.PI*2, rr2 = r + Math.sin(t*2 + i)*10; ctx.fillStyle = `rgba(255,255,255,${.5 + .4*Math.sin(t*3 + i)})`; circle(x + Math.cos(a)*rr2, y + Math.sin(a)*rr2*.7, 2.2); } }
function hubSwirl(x, y, r, col){ ctx.save(); ctx.translate(x, y); ctx.rotate(reduceMotion ? 0 : t*1.6); for (let i = 0; i < 4; i++){ ctx.strokeStyle = `rgba(${col},${.9 - i*.18})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, r - i*r*.2, (r - i*r*.2)*1.3, 0, i, i + Math.PI*1.4); ctx.stroke(); } ctx.restore(); }
function hubDoor(col, sky){ ctx.fillStyle = sky; ctx.fillRect(60, GROUND - 120, 64, 120); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.strokeRect(60, GROUND - 120, 64, 120); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(66, GROUND - 114, 20, 108); }
const HUB_ROOMS = {
  jungle:{ name:'Inside the Stone Face', enter:'Step into the stone face', wall:['#6a5a3a', '#4a3e28'], floor:'#3a3020', door:['#3a2a18', '#f2c86a'], col:'255,210,110',
    decor(){ for (let y = 30; y < GROUND; y += 36) for (let x = (y/36 % 2)*40; x < W; x += 80){ ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x, y, 76, 32); }
      ctx.strokeStyle = '#3f8a4a'; ctx.lineWidth = 5; for (const vx of [180, 300, 700]){ ctx.beginPath(); ctx.moveTo(vx, 0); for (let s = 1; s < 8; s++) ctx.lineTo(vx + Math.sin(t + s + vx)*8, s*30); ctx.stroke(); }
      for (const tx of [220, 400]){ ctx.fillStyle = '#5a3a1a'; ctx.fillRect(tx - 4, GROUND - 160, 8, 50); const f = 1 + Math.sin(t*9 + tx)*.15; ctx.fillStyle = '#ffb030'; ctx.beginPath(); ctx.ellipse(tx, GROUND - 170, 9*f, 16*f, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#ffe080'; circle(tx, GROUND - 166, 5); }
      ctx.fillStyle = '#c9a13a'; ctx.beginPath(); ctx.ellipse(300, GROUND - 22, 24, 14, 0, 0, 7); ctx.fill(); circle(300, GROUND - 46, 14); },
    secret:{ label:'Press the glowing sun carving', draw(x, y){ ctx.fillStyle = '#e8b040'; circle(x, y, 46); ctx.fillStyle = '#c9902a'; for (let i = 0; i < 12; i++){ const a = i/12*Math.PI*2 + t*.2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a)*44, y + Math.sin(a)*44); ctx.lineTo(x + Math.cos(a + .13)*66, y + Math.sin(a + .13)*66); ctx.lineTo(x + Math.cos(a + .26)*44, y + Math.sin(a + .26)*44); ctx.fill(); } hubSwirl(x, y, 26, '255,240,200'); } },
    look:{ x:300, label:'Look at the golden idol', title:'The Golden Idol', text:'A little golden statue of an acorn wearing a crown. Someone has left it a banana.' } },
  nebula:{ name:'Inside the Star Chime', enter:'Step inside the big star chime', wall:['#2a1850', '#140c30'], floor:'#3a2a5a', door:['#5a4a8a', '#0e0a24'], col:'200,160,255',
    decor(){ for (let i = 0; i < 60; i++){ ctx.fillStyle = `rgba(255,255,255,${.3 + .4*Math.sin(t*2 + i)})`; circle(hash(i)*W, hash(i + 60)*(GROUND - 20), 1.4); }
      for (const [cx, h, c] of [[200, 180, '#b58ae6'], [260, 240, '#7fe0e6'], [330, 200, '#e8a0e0'], [720, 220, '#7fe0e6'], [770, 160, '#b58ae6']]){ const wob = Math.sin(t*2 + cx)*2; ctx.fillStyle = c; ctx.globalAlpha = .8; ctx.beginPath(); ctx.moveTo(cx - 16 + wob, GROUND); ctx.lineTo(cx + wob, GROUND - h); ctx.lineTo(cx + 16 + wob, GROUND); ctx.fill(); ctx.globalAlpha = 1; } },
    secret:{ label:'Touch the glowing constellation', draw(x, y){ const pts = [[-50, 30], [-20, -20], [10, 10], [40, -40], [55, 20]]; ctx.strokeStyle = 'rgba(232,208,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(x + px, y + py) : ctx.moveTo(x + px, y + py)); ctx.stroke(); for (const [px, py] of pts){ ctx.fillStyle = '#fff'; circle(x + px, y + py, 5); } hubSwirl(x, y, 22, '220,200,255'); } },
    look:{ x:260, label:'Listen to the crystals', title:'The Humming Crystals', text:'Every crystal hums a different note. Together they sound like a lullaby for the stars.' } },
  city:{ name:'Behind the Vending Machine', enter:'Squeeze behind the vending machine', wall:['#2a1848', '#160c2a'], floor:'#1a1428', door:['#5adcff', '#0b0620'], col:'181,138,230',
    decor(){ for (let k = 0; k < 4; k++){ const x = 180 + k*64; for (let r = 0; r < 3 - (k % 2); r++){ ctx.fillStyle = ['#ff6ad5', '#5adcff', '#ffe66e', '#82ffa0'][(k + r) % 4]; rr(x, GROUND - 46 - r*46, 56, 42, 4); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x, GROUND - 26 - r*46, 56, 4); } }
      neonText('STOCKROOM', 300, 80, 18, '90,220,255', true); ctx.strokeStyle = 'rgba(90,220,255,.3)'; ctx.lineWidth = 2; for (let x = 0; x < W; x += 40){ ctx.beginPath(); ctx.moveTo(x, 110); ctx.lineTo(x, 116); ctx.stroke(); } },
    secret:{ label:'Press the big purple button', draw(x, y){ ctx.fillStyle = '#3a3448'; rr(x - 70, y - 50, 140, 150, 12); ctx.fill(); ctx.strokeStyle = '#5adcff'; ctx.lineWidth = 2; rr(x - 70, y - 50, 140, 150, 12); ctx.stroke(); for (let i = 0; i < 6; i++){ ctx.fillStyle = Math.sin(t*4 + i) > 0 ? '#82ffa0' : '#2a4a3a'; circle(x - 50 + i*20, y - 30, 4); }
      ctx.fillStyle = '#7a4ab8'; circle(x, y + 30, 34); ctx.fillStyle = '#b58ae6'; circle(x, y + 26, 28); ctx.fillStyle = 'rgba(255,255,255,.5)'; circle(x - 9, y + 16, 8); hubSwirl(x, y + 26, 16, '255,240,255'); } },
    look:{ x:240, label:'Look at the soda crates', title:'The Stockroom', text:'Crates and crates of fizzy drinks: Neon Lemon, Galaxy Grape, and one crate labelled “DO NOT SHAKE”.' } },
  sea:{ name:'Inside the Giant Clam', enter:'Swim inside the giant clam', wall:['#f0c8d8', '#d898b8'], floor:'#e8d0b0', door:['#c890b0', '#2a7ab0'], col:'230,190,255',
    decor(){ ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3; for (let k = 0; k < 9; k++){ ctx.beginPath(); ctx.moveTo(400, GROUND + 60); ctx.lineTo(k*100, 0); ctx.stroke(); }
      for (let i = 0; i < 12; i++){ const bx = hash(i)*W, by = GROUND - wrap(t*30 + i*40, GROUND); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by, 4, 0, 7); ctx.stroke(); }
      for (const [x, c] of [[220, '#ff9ab8'], [290, '#ffd0a0'], [740, '#c8a0ff']]){ ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x, GROUND); for (let k = 0; k <= 6; k++){ const a = Math.PI + k/6*Math.PI; ctx.lineTo(x + Math.cos(a)*22, GROUND - 6 + Math.sin(a)*20); } ctx.fill(); } },
    secret:{ label:'Touch the swirling pearl', draw(x, y){ const g = ctx.createRadialGradient(x - 14, y - 14, 4, x, y, 50); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c8a0f0'); ctx.fillStyle = g; circle(x, y, 50); hubSwirl(x, y, 30, '150,90,220'); } },
    look:{ x:260, label:'Look at the little shells', title:'The Pearl Room', text:'The walls shimmer pink and silver, like the inside of a seashell. It smells like the sea and, somehow, like strawberries.' } },
  fantasy:{ name:'Beneath the Sword in the Stone', enter:'Climb down the steps under the sword', wall:['#6a6878', '#4a4858'], floor:'#5a4a3a', door:['#3a3848', '#8bbf6a'], col:'190,220,255',
    decor(){ for (let y = 20; y < GROUND; y += 40) for (let x = (y/40 % 2)*50; x < W; x += 100){ ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(x, y, 96, 36); }
      for (const [bx, c] of [[200, '#c8304a'], [330, '#3a5ab8'], [760, '#c8304a']]){ ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(bx - 24, 40); ctx.lineTo(bx + 24, 40); ctx.lineTo(bx + 24, 170); ctx.lineTo(bx, 150); ctx.lineTo(bx - 24, 170); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#f2c230'; circle(bx, 90, 9); }
      ctx.fillStyle = '#c9a13a'; rr(240, GROUND - 40, 70, 40, 6); ctx.fill(); ctx.fillStyle = '#8a6a2a'; ctx.fillRect(240, GROUND - 28, 70, 5); ctx.fillStyle = '#f2c230'; circle(275, GROUND - 46, 8); },
    secret:{ label:'Look into the shimmering mirror', draw(x, y){ ctx.fillStyle = '#c9a13a'; ctx.beginPath(); ctx.ellipse(x, y, 48, 70, 0, 0, 7); ctx.fill(); const g = ctx.createLinearGradient(x, y - 60, x, y + 60); g.addColorStop(0, '#dfe8f4'); g.addColorStop(1, '#8a9ab8'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, 38, 60, 0, 0, 7); ctx.fill(); hubSwirl(x, y, 26, '160,120,230'); } },
    look:{ x:275, label:'Peek into the treasure chest', title:'The Royal Vault', text:'Gold coins, a jeweled crown… and a very old sandwich. The king really should clean this out.' } },
  west:{ name:'Inside the Water Tower', enter:'Climb up into the water tower', wall:['#9a6a3a', '#7a4a28'], floor:'#6a4a2a', door:['#5a3a1a', '#f6c07a'], col:'255,200,140',
    decor(){ ctx.strokeStyle = 'rgba(40,24,12,.35)'; ctx.lineWidth = 3; for (let x = 20; x < W; x += 34){ ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GROUND); ctx.stroke(); }
      ctx.strokeStyle = '#4a4a4a'; ctx.lineWidth = 6; for (const y of [70, 200, 330]){ ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.fillStyle = 'rgba(100,170,220,.45)'; ctx.fillRect(140, GROUND - 10, 320, 10); for (let k = 0; k < 3; k++){ const dx = 180 + k*110, dy = wrap(t*80 + k*60, GROUND - 40); ctx.fillStyle = 'rgba(140,200,240,.7)'; ctx.beginPath(); ctx.ellipse(dx, dy, 3, 5, 0, 0, 7); ctx.fill(); } },
    secret:{ label:'Peer through the glowing knot-hole', draw(x, y){ ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.ellipse(x, y, 40, 50, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#2a1408'; ctx.beginPath(); ctx.ellipse(x, y, 26, 34, 0, 0, 7); ctx.fill(); hubSwirl(x, y, 20, '220,160,255'); } },
    look:{ x:300, label:'Look at the drips', title:'The Water Tower', text:'Drip… drip… drip. A family of tiny frogs has turned the leaky corner into a swimming pool.' } },
  underground:{ name:'Inside the Giant Crystal', enter:'Step into the giant crystal', wall:['#2a4a5a', '#1a2a3a'], floor:'#2a3a4a', door:['#7fe0e6', '#120e1a'], col:'160,240,255',
    decor(){ for (let i = 0; i < 14; i++){ const x = hash(i)*W, y = hash(i + 14)*(GROUND - 40), s = 30 + hash(i + 28)*50; ctx.fillStyle = `rgba(${['127,224,230', '181,138,230', '160,240,255'][i % 3]},.25)`; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s*.6, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s*.6, y); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.08)'; for (let k = 0; k < 6; k++){ ctx.beginPath(); ctx.moveTo(k*160, 0); ctx.lineTo(k*160 + 60, 0); ctx.lineTo(k*160 + 200, GROUND); ctx.lineTo(k*160 + 140, GROUND); ctx.fill(); } },
    secret:{ label:'Touch the purple heart of the crystal', draw(x, y){ ctx.fillStyle = '#b58ae6'; ctx.beginPath(); ctx.moveTo(x, y - 60); ctx.lineTo(x + 40, y); ctx.lineTo(x, y + 60); ctx.lineTo(x - 40, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(x, y - 60); ctx.lineTo(x + 14, y); ctx.lineTo(x, y + 20); ctx.fill(); hubSwirl(x, y, 20, '255,240,255'); } },
    look:{ x:280, label:'Look at your reflection', title:'The Crystal Room', text:'Hundreds of tiny chinchillas look back at you from every crystal face. They all wave when you do.' } },
  nograv:{ name:'Inside the Floating Orb', enter:'Float into the purple orb', wall:['#e6d0ff', '#c8b0f0'], floor:'#b8e0c8', door:['#9a7ac8', '#ffd8ea'], col:'200,160,255',
    decor(){ onSky(() => { ctx.fillStyle = '#ff9ec8'; rr(180, GROUND - 60, 120, 14, 6); ctx.fill(); ctx.fillRect(190, GROUND - 46, 8, 46); ctx.fillRect(282, GROUND - 46, 8, 46); ctx.fillStyle = '#9be3c8'; rr(200, GROUND - 92, 40, 32, 8); ctx.fill(); ctx.fillStyle = '#ffd08a'; circle(700, GROUND - 40, 30); });
      for (let i = 0; i < 6; i++){ const fx = 160 + i*110, fy = 200 + Math.sin(t + i)*30; ctx.save(); ctx.translate(fx, fy); ctx.rotate(t*.5 + i); ctx.fillStyle = TOPSY_TREES[i % 4]; rr(-12, -8, 24, 16, 5); ctx.fill(); ctx.restore(); } },
    secret:{ label:'Step into the swirl in the floor', floor:true, draw(x, y){ ctx.fillStyle = 'rgba(160,110,220,.4)'; ctx.beginPath(); ctx.ellipse(x, GROUND - 4, 70, 18, 0, 0, 7); ctx.fill(); ctx.save(); ctx.translate(x, GROUND - 4); ctx.scale(1, .26); hubSwirl(0, 0, 60, '120,60,200'); ctx.restore(); } },
    look:{ x:240, label:'Look up at the table on the ceiling', title:'The Upside-Down Room', text:'The table, the chairs and a bowl of fruit are all stuck to the ceiling. A grape falls UP while you watch.' } },
  arts:{ name:'Through the Golden Frame', enter:'Step through the golden frame', wall:['#f6e8c8', '#e8d0a8'], floor:'#a07a58', door:['#c9a13a', '#f6c890'], col:'255,220,150',
    decor(){ for (const [px, py, w, h, c] of [[170, 90, 90, 70, '#9fd3ef'], [290, 70, 70, 100, '#e0a0b8'], [700, 90, 80, 70, '#a8e0a8']]){ ctx.fillStyle = c; ctx.fillRect(px, py, w, h); ctx.fillStyle = 'rgba(255,255,255,.4)'; circle(px + w*.3, py + h*.4, h*.2); ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 6; ctx.strokeRect(px - 3, py - 3, w + 6, h + 6); }
      ctx.fillStyle = '#7a5230'; ctx.fillRect(160, GROUND - 4, 520, 4); ctx.fillStyle = '#8a5a3a'; rr(240, GROUND - 70, 50, 70, 4); ctx.fill(); ctx.fillStyle = '#e0708f'; circle(265, GROUND - 78, 12); },
    secret:{ label:'Step into the swirling empty frame', draw(x, y){ ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 12; ctx.strokeRect(x - 56, y - 76, 112, 152); ctx.fillStyle = 'rgba(200,160,255,.25)'; ctx.fillRect(x - 50, y - 70, 100, 140); hubSwirl(x, y, 30, '170,110,230'); } },
    look:{ x:265, label:'Look at the paintings', title:'The Painted Gallery', text:'Every painting is of Harmony Hollow at golden hour… and in each one, a little painted chinchilla is waving at you.' } },
  warp:{ name:'Inside the Giant Eye', enter:'Walk into the giant eye', wall:['#3a1a5a', '#1a0a30'], floor:'#2a1848', door:['#e8a0ff', '#4a2a7a'], col:'232,160,255',
    decor(){ ctx.save(); ctx.translate(400, 220); ctx.rotate(t*.1); for (let k = 0; k < 10; k++){ ctx.rotate(Math.PI/5); ctx.strokeStyle = 'rgba(232,160,255,.08)'; ctx.lineWidth = 40; ctx.beginPath(); ctx.moveTo(60, 0); ctx.lineTo(600, 0); ctx.stroke(); } ctx.restore();
      for (let i = 0; i < 5; i++){ const cx = 160 + i*130, cy = 120 + Math.sin(t + i)*20; ctx.save(); ctx.translate(cx, cy); ctx.scale(1, .7 + Math.sin(t*.7 + i)*.2); ctx.fillStyle = '#e8d8a8'; circle(0, 0, 22); ctx.fillStyle = '#fff8e8'; circle(0, 0, 17); ctx.strokeStyle = '#3a2416'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(t*(1 + i*.3))*12, Math.sin(t*(1 + i*.3))*12); ctx.moveTo(0, 0); ctx.lineTo(0, -8); ctx.stroke(); ctx.restore(); } },
    secret:{ label:'Step through the iris door', draw(x, y){ ctx.fillStyle = '#f6f0ff'; ctx.beginPath(); ctx.ellipse(x, y, 70, 46, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8a4ac8'; circle(x, y, 34); ctx.fillStyle = '#1a0a30'; circle(x, y, 16 + Math.sin(t*2)*4); hubSwirl(x, y, 26, '255,200,255'); } },
    look:{ x:290, label:'Look at the melting clocks', title:'The Clock Room', text:'The clocks float about, ticking in every direction at once. One of them says it’s Tuesday. It isn’t.' } },
};
let hubFrom = null;
function enterHub(id){
  closePanels(); hubFrom = id;
  transition(() => { scene = 'secret'; currentSecret = SECRETS['hub_' + id]; P.x = 160; P.face = 1; P.vx = 0; P.target = null; pending = null; camX = 0; toast = { text:HUB_ROOMS[id].name, t:2.4 }; });
}
function leaveHub(id){
  closePanels();
  // back out in front of the landmark (in the right half of a joined world)
  transition(() => { scene = 'world'; currentSecret = null; hubFrom = null; P.x = WORLDS[id].hub().x - 70; P.face = 1; P.vx = 0; P.target = null; pending = null; camX = clamp(P.x - W*.42, 0, currentWorld.w - W); });
}
function drawHubRoom(id){
  const h = HUB_ROOMS[id], g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, h.wall[0]); g.addColorStop(1, h.wall[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  h.decor();
  ctx.fillStyle = h.floor; ctx.fillRect(0, GROUND, W, H - GROUND); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, GROUND, W, 6);
  hubDoor(h.door[0], h.door[1]);
  // the secret: it glows, hums and sparkles, so you can't really miss it
  const sy = GROUND - 150 + Math.sin(t*1.5)*4; hubGlow(HUB_X, h.secret.floor ? GROUND - 10 : sy, h.col, h.secret.floor ? 50 : 70); h.secret.draw(HUB_X, sy);
  drawPlayer();
  const vg = ctx.createRadialGradient(W/2, H/2, 220, W/2, H/2, 540); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}
for (const id of Object.keys(HUB_ROOMS)){
  const h = HUB_ROOMS[id];
  SECRETS['hub_' + id] = { hub:id, start:160, draw:() => drawHubRoom(id), max:740, spots:[
    { x:92, r:55, hit:[60, 124], stand:110, gap:0, label:'Go back outside', open:() => leaveHub(id) },
    { x:h.look.x, r:60, hit:[h.look.x - 50, h.look.x + 50], stand:h.look.x - 60, gap:0, label:h.look.label, open:() => openMystery(h.look.title, h.look.text, '') },
    { x:HUB_X, r:80, hit:[HUB_X - 80, HUB_X + 80], hitY:[GROUND - 240, GROUND + 20], stand:HUB_X - 40, gap:0, label:h.secret.label, open:() => { P.anim.happy = 2; enterHQ(id); } },
  ]};
}

// a world's Realm Gate: you go inside its landmark first (Thistledown's tree and the lake cabin are already inside)
const gateSpot = (x, y, here) => HUB_ROOMS[here] ? { x, r:70, hit:[x - 60, x + 60], stand:x - 60, gap:0, label:HUB_ROOMS[here].enter, open:() => enterHub(here) }
  : { x, r:24, hit:[x - 18, x + 18], hitY:[y - 26, y + 26], stand:x, gap:0, hidden:true, label:'', open:() => enterHQ(here) };

// ---------- the Portal Headquarters ----------
// every realm's hidden gate leads into this round chamber. Five portals line the back wall, one per realm;
// walk up to one and step through. Sealed portals open once you've won that world's game.
const HQ_PORTALS = [
  { id:'thistledown', col:'150,220,120', icon:'tree' },   { id:'jungle', col:'255,200,90', icon:'palm' },
  { id:'moonlake', col:'120,190,255', icon:'moon' },     { id:'city', col:'255,106,213', icon:'tower', label:'Neon Portal' },
  { id:'sea', col:'90,210,230', icon:'shell' },           { id:'fantasy', col:'255,160,210', icon:'castle' },
  { id:'west', col:'240,170,90', icon:'cactus', label:'Western Portal' },   { id:'arts', col:'255,154,184', icon:'note' },
  { id:'warp', col:'232,160,255', icon:'eye', label:'Warp Portal' },
];
// the far half of a joined world uses its partner's portal (Neon City & the Nebula share the Neon Portal, and so on)
const portalId = id => HQ_PORTALS.some(p => p.id === id) ? id : (JOINED_PAIRS[id] || id);
HQ_PORTALS.forEach((p, i) => { p.x = Math.round(38 + i*(W - 76)/(HQ_PORTALS.length - 1)); });
let hqFrom = 'thistledown';
function enterHQ(here){
  closePanels();
  transition(() => {
    hqFrom = portalId(here); scene = 'secret'; currentSecret = SECRETS.hq;
    P.x = HQ_PORTALS.find(p => p.id === hqFrom).x; P.face = 1; P.vx = 0; P.target = null; pending = null; camX = 0;
    toast = { text:'The Portal Headquarters', t:2.4 };
  }, true);
}
function portalIcon(kind, x, y, col){
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = `rgba(${col},.95)`; ctx.strokeStyle = `rgba(${col},.95)`; ctx.lineWidth = 3;
  if (kind === 'tree'){ ctx.fillRect(-3, 0, 6, 16); circle(0, -6, 12); circle(-9, 2, 8); circle(9, 2, 8); }
  else if (kind === 'palm'){ ctx.beginPath(); ctx.moveTo(0, 18); ctx.quadraticCurveTo(4, 0, 0, -12); ctx.stroke(); for (const a of [-2.4, -1.6, -.8, -.2]){ ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(Math.cos(a)*14, -12 + Math.sin(a)*14 - 4, Math.cos(a)*20, -12 + Math.sin(a)*10 + 6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(-Math.cos(a)*14, -12 + Math.sin(a)*14 - 4, -Math.cos(a)*20, -12 + Math.sin(a)*10 + 6); ctx.stroke(); } }
  else if (kind === 'star'){ ctx.beginPath(); for (let k=0;k<10;k++){ const a = -Math.PI/2 + k*Math.PI/5, r = k % 2 ? 7 : 17; k ? ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r) : ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r); } ctx.closePath(); ctx.fill(); }
  else if (kind === 'moon'){ circle(0, 0, 15); ctx.globalCompositeOperation = 'destination-out'; circle(7, -5, 13); ctx.globalCompositeOperation = 'source-over'; }
  else if (kind === 'shell'){ for (let k=0;k<5;k++){ ctx.beginPath(); ctx.moveTo(0, 12); ctx.arc(0, 12, 20, Math.PI + k*Math.PI/5 + .08, Math.PI + (k + 1)*Math.PI/5 - .08); ctx.closePath(); ctx.fill(); } ctx.fillRect(-5, 11, 10, 6); }
  else if (kind === 'castle'){ ctx.fillRect(-14, -4, 28, 20); for (const cx of [-14, 8]){ ctx.fillRect(cx, -16, 6, 12); } ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(0, -20); ctx.lineTo(6, -4); ctx.fill(); }
  else if (kind === 'pick'){ ctx.save(); ctx.rotate(-.6); ctx.fillRect(-2, -16, 4, 32); ctx.beginPath(); ctx.moveTo(-16, -12); ctx.quadraticCurveTo(0, -24, 16, -12); ctx.lineTo(14, -9); ctx.quadraticCurveTo(0, -18, -14, -9); ctx.closePath(); ctx.fill(); ctx.restore(); }
  else if (kind === 'flip'){ ctx.beginPath(); ctx.moveTo(-6, 16); ctx.lineTo(-6, -10); ctx.lineTo(-12, -10); ctx.lineTo(-3, -20); ctx.lineTo(6, -10); ctx.lineTo(0, -10); ctx.lineTo(0, 16); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(6, -16); ctx.lineTo(6, 10); ctx.lineTo(0, 10); ctx.lineTo(9, 20); ctx.lineTo(18, 10); ctx.lineTo(12, 10); ctx.lineTo(12, -16); ctx.closePath(); ctx.fill(); }
  else if (kind === 'note'){ circle(-6, 10, 6); circle(10, 6, 6); ctx.fillRect(-1, -16, 3, 26); ctx.fillRect(15, -20, 3, 26); ctx.fillRect(-1, -18, 19, 6); }
  else if (kind === 'eye'){ ctx.beginPath(); ctx.ellipse(0, 0, 18, 10, 0, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; circle(0, 0, 6); ctx.globalCompositeOperation = 'source-over'; circle(0, 0, 3); }
  else if (kind === 'cactus'){ rr(-4, -18, 8, 36, 4); ctx.fill(); rr(-14, -8, 6, 14, 3); ctx.fill(); rr(8, -12, 6, 12, 3); ctx.fill(); ctx.fillRect(-12, 2, 10, 4); ctx.fillRect(2, -2, 10, 4); }
  else { ctx.fillRect(-14, -6, 9, 24); ctx.fillRect(-3, -18, 9, 36); ctx.fillRect(8, -2, 8, 20); }
  ctx.restore();
}
function drawHQ(){
  // a round stone chamber, lit by the portals
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120a28'); g.addColorStop(1, '#2a1a48');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(200,170,255,.12)'; ctx.lineWidth = 2;
  for (let r = 1; r < 8; r++){ ctx.beginPath(); ctx.ellipse(W/2, -40, 140 + r*90, 90 + r*60, 0, 0, Math.PI); ctx.stroke(); }
  for (let i=0;i<40;i++){ ctx.fillStyle = `rgba(230,210,255,${.2 + .5*Math.max(0, Math.sin(t*1.2 + i))})`; circle(hash(i)*W, wrap(hash(i + 3)*GROUND - t*(6 + hash(i)*8), GROUND), 1.3); }
  // the Shift Stone, floating in the middle, with a socket lit for each realm you've opened
  { const sy = 120 + (reduceMotion ? 0 : Math.sin(t*1.2)*8), open = HQ_PORTALS.filter(p => realmOpen(p.id));
    const sg = ctx.createRadialGradient(W/2, sy, 6, W/2, sy, 110); sg.addColorStop(0, 'rgba(210,180,255,.5)'); sg.addColorStop(1, 'rgba(210,180,255,0)'); ctx.fillStyle = sg; circle(W/2, sy, 110);
    ctx.save(); ctx.translate(W/2, sy); ctx.rotate(reduceMotion ? 0 : Math.sin(t*.6)*.15);
    const cg = ctx.createLinearGradient(0, -48, 0, 48); cg.addColorStop(0, '#f0e6ff'); cg.addColorStop(1, '#8a6ad0');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(24, -10); ctx.lineTo(0, 48); ctx.lineTo(-24, -10); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.moveTo(0, -48); ctx.lineTo(8, -10); ctx.lineTo(0, 30); ctx.lineTo(-6, -10); ctx.closePath(); ctx.fill();
    ctx.restore();
    HQ_PORTALS.forEach((p, i) => { const a = -Math.PI/2 + i/HQ_PORTALS.length*Math.PI*2 + t*.3, x = W/2 + Math.cos(a)*62, y = sy + Math.sin(a)*24, on = realmOpen(p.id);
      if (on){ const og = ctx.createRadialGradient(x, y, 1, x, y, 14); og.addColorStop(0, `rgba(${p.col},.9)`); og.addColorStop(1, `rgba(${p.col},0)`); ctx.fillStyle = og; circle(x, y, 14); }
      ctx.fillStyle = on ? `rgb(${p.col})` : 'rgba(120,110,150,.6)'; circle(x, y, 5); });
    ctx.fillStyle = 'rgba(230,210,255,.8)'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText(`${open.length} of ${HQ_PORTALS.length} realms open`, W/2, sy + 70); ctx.textAlign = 'left'; }
  // the portals: twelve of them now, so they're slim, and the name of the one you're standing at shows above
  const PO = 30, PI_ = 23, here_ = HQ_PORTALS.reduce((m, p) => Math.abs(p.x - P.x) < Math.abs(m.x - P.x) ? p : m, HQ_PORTALS[0]);
  for (const p of HQ_PORTALS){
    const on = realmOpen(p.id), x = p.x, top = GROUND - 170, trial = trialOpen(p.id);
    ctx.fillStyle = '#4a3a6a'; ctx.beginPath(); ctx.moveTo(x - PO, GROUND); ctx.lineTo(x - PO, top + 50); ctx.arc(x, top + 50, PO, Math.PI, 0); ctx.lineTo(x + PO, GROUND); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#5a4a7e'; for (let k=0;k<7;k++){ const a = Math.PI + k/6*Math.PI; ctx.save(); ctx.translate(x + Math.cos(a)*(PO - 4), top + 50 + Math.sin(a)*(PO - 4)); ctx.rotate(a + Math.PI/2); ctx.fillRect(-5, -3, 10, 6); ctx.restore(); }
    ctx.save(); ctx.beginPath(); ctx.moveTo(x - PI_, GROUND); ctx.lineTo(x - PI_, top + 50); ctx.arc(x, top + 50, PI_, Math.PI, 0); ctx.lineTo(x + PI_, GROUND); ctx.closePath(); ctx.clip();
    if (on){
      const pg = ctx.createRadialGradient(x, GROUND - 80, 4, x, GROUND - 80, 90); pg.addColorStop(0, `rgba(${p.col},.95)`); pg.addColorStop(.6, `rgba(${p.col},.45)`); pg.addColorStop(1, 'rgba(20,10,40,.9)');
      ctx.fillStyle = pg; ctx.fillRect(x - PI_, top, PI_*2, 170);
      ctx.save(); ctx.translate(x, GROUND - 80); ctx.rotate(reduceMotion ? 0 : t*(1 + HQ_PORTALS.indexOf(p)*.12));
      for (let k=0;k<3;k++){ ctx.strokeStyle = `rgba(255,255,255,${.35 - k*.08})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 10 + k*6, (10 + k*6)*1.7, 0, k, k + Math.PI*1.3); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.translate(x, GROUND - 82); ctx.scale(.75, .75); portalIcon(p.icon, 0, 0, '255,255,255'); ctx.restore();
    } else {
      ctx.fillStyle = '#2a2240'; ctx.fillRect(x - PI_, top, PI_*2, 170);
      ctx.strokeStyle = 'rgba(160,140,200,.35)'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = top + 20; y < GROUND; y += 22){ ctx.moveTo(x - PI_, y); ctx.lineTo(x + PI_, y); } ctx.stroke();
      // the newer realms' portals flicker with a little of their color: touch one to try its game
      if (trial){ const f = .25 + .2*Math.max(0, Math.sin(t*3 + x)) + (Math.sin(t*17 + x) > .9 ? .25 : 0); const fg = ctx.createRadialGradient(x, GROUND - 80, 4, x, GROUND - 80, 60); fg.addColorStop(0, `rgba(${p.col},${f})`); fg.addColorStop(1, `rgba(${p.col},0)`); ctx.fillStyle = fg; ctx.fillRect(x - PI_, top, PI_*2, 170);
        ctx.save(); ctx.translate(x, GROUND - 82); ctx.rotate(reduceMotion ? 0 : t*1.5); for (let k=0;k<3;k++){ ctx.strokeStyle = `rgba(${p.col},${.7 - k*.2})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 6 + k*6, (6 + k*6)*1.5, 0, k, k + Math.PI*1.3); ctx.stroke(); } ctx.restore(); }
      else { ctx.fillStyle = 'rgba(160,140,200,.6)'; ctx.fillRect(x - 7, GROUND - 88, 14, 11); ctx.strokeStyle = 'rgba(160,140,200,.6)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, GROUND - 88, 5, Math.PI, 0); ctx.stroke(); }
    }
    ctx.restore();
    // a little marker over the portal you came through
    if (p.id === hqFrom){ ctx.fillStyle = 'rgba(255,246,228,.85)'; ctx.font = '700 12px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('▼', x, GROUND - 178 + Math.sin(t*3)*2); ctx.textAlign = 'left'; }
  }
  // the name sign for the portal you're standing at
  { const p = here_, on = realmOpen(p.id), trial = trialOpen(p.id), r = REALMS.find(q => q.id === p.id);
    const txt = on ? (p.label ? `${p.label}: ${r.name}` : r.name) : trial ? `${p.label ? p.label + ' ' : ''}? ? ?  (flickering)` : p.label ? `${p.label} (sealed)` : 'A sealed portal';
    ctx.font = '700 13px "Pixelify Sans", monospace'; const tw = ctx.measureText(txt).width + 26, nx = clamp(p.x, tw/2 + 8, W - tw/2 - 8);
    ctx.fillStyle = 'rgba(20,12,36,.9)'; rr(nx - tw/2, GROUND - 222, tw, 26, 8); ctx.fill(); ctx.strokeStyle = on || trial ? `rgba(${p.col},.8)` : 'rgba(160,140,200,.4)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = on ? `rgb(${p.col})` : trial ? `rgba(${p.col},.9)` : 'rgba(200,190,230,.8)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, nx, GROUND - 209); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
  // the floor, with a glowing rune circle
  ctx.fillStyle = '#1e1436'; ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.strokeStyle = `rgba(200,160,255,${.35 + Math.sin(t*2)*.15})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(W/2, GROUND + 40, 250, 26, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(W/2, GROUND + 40, 190, 18, 0, 0, 7); ctx.stroke();
  for (let k=0;k<12;k++){ const a = k/12*Math.PI*2 + t*.2; ctx.fillStyle = 'rgba(200,160,255,.5)'; ctx.fillRect(W/2 + Math.cos(a)*220 - 3, GROUND + 40 + Math.sin(a)*22 - 2, 6, 4); }
  drawPlayer();
}
SECRETS.hq = { start:400, draw:drawHQ, max:760, get spots(){
  return [
    ...HQ_PORTALS.map(p => { const r = REALMS.find(q => q.id === p.id), on = realmOpen(p.id);
      const trial = trialOpen(p.id);
      return { x:p.x, r:30, hit:[p.x - 32, p.x + 32], stand:p.x, gap:0,
        label: trial ? `Touch the flickering ${p.label || 'portal'}` : !on ? `A sealed ${p.label || 'portal'}` : p.id === hqFrom ? `Go back through the ${p.label || 'portal'}` : p.label ? `Step through the ${p.label}` : `Step through to ${r.name}`,
        open:() => on ? travelTo(p.id) : trial ? playRealmTrial(p.id) : p.id === 'warp' ? openMystery('A Strange Sealed Portal', 'This portal is sealed, and its stone is covered in swirling marks… the same marks as the round door at the bottom of Thistledown’s well.', '') : openMystery('A Sealed Portal', TRIAL_REALMS.includes(p.id) ? `This portal is sealed with old stone. ${r.name} is further along the path: open the realms before it first, and this portal will start to flicker.` : `This portal is sealed with old stone. It will open once you’ve won ${r.name}’s game.`, '') }; }),
    { x:W/2, r:0, hit:[W/2 - 40, W/2 + 40], hitY:[60, 190], stand:W/2, gap:0, hidden:true, label:'', open:() => openMystery('The Shift Stone', `A great crystal humming with the light of every realm you’ve opened: ${HQ_PORTALS.filter(p => realmOpen(p.id)).length} of ${HQ_PORTALS.length} so far.`, '') },
  ]; } };

// Thistledown's gate, inside the Hollow Tree (added here, once the gate code exists)
SECRETS.tree.spots.unshift(gateSpot(HOLLOW_GATE.x, HOLLOW_GATE.y, 'thistledown'));
// the Moonlit Lake's gate: the round mirror above the fireplace in the little cabin
SECRETS.lakecabin.spots.unshift(gateSpot(CABIN_GATE.x, CABIN_GATE.y, 'moonlake'));

// ---------- the chinchilla and the keepers ----------
const P = { x:200, vx:0, face:1, anim: Chin.newAnim(), target:null };
let pending = null, near = null, openShopRef = null;
// ---------- the last two cottages, past the bridge: Grandma Wolf's, and the Holiday House ----------
const GRANNY_HOUSE = HOUSES.find(h => h.kind === 'grandma'), HOLIDAY_HOUSE = HOUSES.find(h => h.kind === 'holiday');
const houseDoor = h => h.x - h.w*.22;
function enterCottage(id){ transition(() => { scene = 'secret'; currentSecret = SECRETS[id]; P.x = currentSecret.start; P.face = 1; P.vx = 0; P.target = null; pending = null; camX = 0; }); }
// the little extras outside each one, so you can tell them apart
function cottageExtras(h){
  const x = h.x - camX; if (!onScreen(x, h.w/2 + 80)) return;
  const top = GROUND - h.h, dx = houseDoor(h) - camX;
  if (h.kind === 'grandma'){
    // a hanging sign and a basket of yarn by the door
    ctx.fillStyle = '#f6ead6'; rr(x - 62, top + 14, 124, 30, 6); ctx.fill(); ctx.strokeStyle = '#8a5a32'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#6e5a8a'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GRANDMA WOLF', x, top + 30); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#e0708f'; for (const sx of [x - 52, x + 52]){ for (let p = 0; p < 5; p++){ const a = p/5*Math.PI*2; circle(sx + Math.cos(a)*3, top + 29 + Math.sin(a)*3, 2.2); } }
    ctx.fillStyle = '#a07a40'; ctx.beginPath(); ctx.moveTo(dx + 26, GROUND - 22); ctx.lineTo(dx + 56, GROUND - 22); ctx.lineTo(dx + 52, GROUND); ctx.lineTo(dx + 30, GROUND); ctx.closePath(); ctx.fill();
    for (const [ox, c] of [[34, '#e0708f'], [44, '#9a86d8'], [52, '#f2c230']]){ ctx.fillStyle = c; circle(dx + ox, GROUND - 24, 7); }
    ctx.strokeStyle = '#e0708f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(dx + 34, GROUND - 24); ctx.quadraticCurveTo(dx + 70, GROUND - 4, dx + 90, GROUND - 2); ctx.stroke();
  } else {
    // a wreath on the door, a string of colored lights and a sign
    const wy = GROUND - 62;
    ctx.strokeStyle = '#4f7a4a'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(dx, wy, 12, 0, 7); ctx.stroke();
    for (let k = 0; k < 6; k++){ const a = k/6*Math.PI*2; ctx.fillStyle = ['#e0602a', '#f2c230', '#d0452f'][k % 3]; circle(dx + Math.cos(a)*12, wy + Math.sin(a)*12, 2.5); }
    ctx.fillStyle = '#d0452f'; ctx.beginPath(); ctx.moveTo(dx - 6, wy + 12); ctx.lineTo(dx, wy + 18); ctx.lineTo(dx + 6, wy + 12); ctx.fill();
    const L = x - h.w/2, R = x + h.w/2, ly = top + 4, cols = ['255,140,180', '255,220,90', '230,120,50', '120,200,255'];
    ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let k = 0; k <= 14; k++){ const px = L + (R - L)*k/14, py = ly + Math.sin(k/14*Math.PI*3)*6 + 6; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    for (let k = 0; k < 14; k++){ const px = L + (R - L)*(k + .5)/14, py = ly + Math.sin((k + .5)/14*Math.PI*3)*6 + 12, on = reduceMotion || (Math.floor(t*3) + k) % 4 !== 0, c = cols[k % 4];
      if (on){ const g = ctx.createRadialGradient(px, py, 1, px, py, 9); g.addColorStop(0, `rgba(${c},.8)`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; circle(px, py, 9); }
      ctx.fillStyle = `rgba(${c},${on ? 1 : .4})`; ctx.beginPath(); ctx.ellipse(px, py, 3, 4.5, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#4a3020'; rr(x - 62, top + 16, 124, 30, 6); ctx.fill(); ctx.strokeStyle = '#f2c230'; ctx.lineWidth = 2; rr(x - 58, top + 20, 116, 22, 4); ctx.stroke();
    ctx.fillStyle = '#ffe9a8'; ctx.font = '700 13px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HOLIDAY HOUSE', x, top + 31); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
}

// ----- Grandma Wolf's cottage -----
const GRANNY_X = 500;
const GRANNY_LINES = [
  '“Oh! Come in, come in, dear. Mind the yarn. I’m knitting a scarf for every chinchilla in Thistledown… so far that’s you.”',
  '“My, what big ears you have! …Oh, don’t look at me like that, I’ve always wanted to say it.”',
  '“There are snickerdoodles in the oven. They’ll be ready in a minute. They’ve been ready in a minute for about an hour.”',
  '“When I was a pup, the windmill turned all by itself at night. Nobody ever found out why. Hmm.”',
  '“Have you met the little fox at the lake café? Lovely girl. Sparkles a lot.”',
  '“Sit, sit. Tell me all about your adventures. Did you wear a sweater? You should wear a sweater.”',
];
let grannyLine = 0, grannyBlink = 0;
const GRANNY_ROCK = loadImg('characters/grandma-rocking.png');
function drawGrandmaWolf(x, y){
  // rocking gently in her chair, knitting (the chair rocks on its runners, so it tips around the bottom)
  if (!GRANNY_ROCK.complete || !GRANNY_ROCK.naturalWidth) return;
  const h = 196, w = h*GRANNY_ROCK.naturalWidth/GRANNY_ROCK.naturalHeight, rock = reduceMotion ? 0 : Math.sin(t*1.2)*.05;
  ctx.fillStyle = 'rgba(60,30,20,.18)'; ctx.beginPath(); ctx.ellipse(x, y + 2, w*.42, 8, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.rotate(rock); ctx.drawImage(GRANNY_ROCK, -w/2, -h, w, h); ctx.restore();
  if (grannyBlink > 0){ ctx.fillStyle = '#e8b0c8'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.fillText('♥', x + 30, y - h - 6 + grannyBlink*20); ctx.textAlign = 'left'; }
}
// bake with Grandma Wolf; afterwards you're back in her cottage by the oven
function bakeWithGranny(){
  transition(() => startWorldGame('baking', 'square', { label:'Back to Grandma’s', leave:'← Grandma’s', done:() => {
    scene = 'secret'; currentSecret = SECRETS.grandma; P.x = 600; P.face = 1; P.vx = 0; P.target = null; pending = null; camX = 0;
    fadeA = 1; fadeDir = -1; fadeWarp = false; fadeMid = null; showScreen(screenEl);
  } }));
}
function drawGrannyHouse(){
  // striped wallpaper with little flowers, and a wooden wainscot
  for (let x = 0; x < W; x += 40){ ctx.fillStyle = (x/40) % 2 ? '#f0dfe4' : '#f6e8ec'; ctx.fillRect(x, 0, 40, GROUND); }
  for (let x = 20; x < W; x += 80) for (let y = 40; y < GROUND - 90; y += 70){ ctx.fillStyle = '#e0a0b8'; for (let k = 0; k < 5; k++){ const a = k/5*Math.PI*2; circle(x + Math.cos(a)*4, y + Math.sin(a)*4, 2.6); } ctx.fillStyle = '#f2c230'; circle(x, y, 2); }
  ctx.fillStyle = '#a07a58'; ctx.fillRect(0, GROUND - 80, W, 80); ctx.fillStyle = '#8a6448'; ctx.fillRect(0, GROUND - 82, W, 6);
  ctx.strokeStyle = 'rgba(60,36,20,.25)'; ctx.lineWidth = 2; for (let x = 30; x < W; x += 60){ ctx.strokeRect(x, GROUND - 66, 44, 52); }
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(0, 0, W, 24);
  // a window onto the village, with ruffled curtains
  const sky = ctx.createLinearGradient(0, 70, 0, 190); sky.addColorStop(0, '#9fd3ef'); sky.addColorStop(1, '#e8f4dc'); ctx.fillStyle = sky; ctx.fillRect(200, 70, 110, 120);
  ctx.fillStyle = '#8bbf6a'; ctx.beginPath(); ctx.ellipse(255, 196, 80, 34, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#fff'; circle(230, 100, 9); circle(242, 96, 11); circle(254, 101, 8);
  ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 6; ctx.strokeRect(200, 70, 110, 120); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(255, 70); ctx.lineTo(255, 190); ctx.moveTo(200, 130); ctx.lineTo(310, 130); ctx.stroke();
  ctx.fillStyle = '#e0708f'; for (const sd of [-1, 1]){ ctx.beginPath(); ctx.moveTo(255 + sd*70, 60); ctx.lineTo(255 + sd*50, 60); ctx.quadraticCurveTo(255 + sd*62, 130, 255 + sd*60, 200); ctx.lineTo(255 + sd*72, 200); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#f6c8d8'; for (let x = 180; x < 332; x += 12) circle(x, 62, 6);
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(190, 190, 130, 8);
  // the family photos: a wall of grandpups
  for (const [px, py, s] of [[380, 70, 1], [440, 60, 1.1], [500, 82, .9], [400, 140, .9], [465, 132, 1]]){
    ctx.fillStyle = '#c9a13a'; rr(px - 22*s, py - 26*s, 44*s, 52*s, 4); ctx.fill(); ctx.fillStyle = '#f6efe0'; ctx.fillRect(px - 17*s, py - 21*s, 34*s, 42*s);
    ctx.fillStyle = '#9a9aa4'; circle(px, py + 2*s, 9*s); ctx.beginPath(); ctx.moveTo(px - 8*s, py - 4*s); ctx.lineTo(px - 6*s, py - 15*s); ctx.lineTo(px - 2*s, py - 6*s); ctx.moveTo(px + 8*s, py - 4*s); ctx.lineTo(px + 6*s, py - 15*s); ctx.lineTo(px + 2*s, py - 6*s); ctx.fill();
    ctx.fillStyle = '#2a2a30'; circle(px - 3*s, py, 1.4*s); circle(px + 3*s, py, 1.4*s); }
  // the oven, with cookies inside (and a cookie smell)
  { const ox = 690; ctx.fillStyle = '#2a2a30'; ctx.fillRect(ox - 60, GROUND - 120, 120, 120); ctx.fillRect(ox - 10, 24, 22, GROUND - 144);
    ctx.fillStyle = '#4a4a54'; ctx.fillRect(ox - 66, GROUND - 126, 132, 12); for (const kx of [-30, 0, 30]){ ctx.fillStyle = '#c9a13a'; circle(ox + kx, GROUND - 104, 4); }
    const og = ctx.createLinearGradient(0, GROUND - 90, 0, GROUND - 30); og.addColorStop(0, '#ffb060'); og.addColorStop(1, '#e06020'); ctx.fillStyle = og; rr(ox - 44, GROUND - 90, 88, 56, 6); ctx.fill();
    ctx.fillStyle = '#8a8a90'; ctx.fillRect(ox - 40, GROUND - 52, 80, 4); for (const cx of [-24, -6, 12, 28]){ ctx.fillStyle = '#d8a060'; ctx.beginPath(); ctx.ellipse(ox + cx, GROUND - 56, 7, 4, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#8a5a32'; circle(ox + cx - 2, GROUND - 57, 1.2); circle(ox + cx + 2, GROUND - 56, 1.2); }
    ctx.strokeStyle = '#c9a13a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(ox - 30, GROUND - 28); ctx.lineTo(ox + 30, GROUND - 28); ctx.stroke();
    if (!reduceMotion){ ctx.strokeStyle = 'rgba(255,230,200,.6)'; ctx.lineWidth = 2; for (let k = 0; k < 3; k++){ const a = wrap(t*.4 + k/3, 1); ctx.globalAlpha = 1 - a; ctx.beginPath(); ctx.moveTo(ox - 20 + k*20, GROUND - 130 - a*60); ctx.quadraticCurveTo(ox - 26 + k*20 + Math.sin(t*2 + k)*6, GROUND - 145 - a*60, ox - 18 + k*20, GROUND - 160 - a*60); ctx.stroke(); } ctx.globalAlpha = 1; } }
  // a round rug
  ctx.fillStyle = '#c86a8a'; ctx.beginPath(); ctx.ellipse(GRANNY_X + 20, GROUND + 26, 170, 18, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#f6c8d8'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(GRANNY_X + 20, GROUND + 26, 150, 12, 0, 0, 7); ctx.stroke();
  drawGrandmaWolf(GRANNY_X, GROUND - 4);
  // the door back out
  ctx.fillStyle = '#6b4226'; ctx.fillRect(60, GROUND - 120, 64, 120); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 6; ctx.strokeRect(60, GROUND - 120, 64, 120); ctx.fillStyle = '#f2c230'; circle(112, GROUND - 60, 4);
  ctx.fillStyle = '#9fd3ef'; ctx.fillRect(74, GROUND - 108, 36, 26); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 3; ctx.strokeRect(74, GROUND - 108, 36, 26);
  // floorboards
  ctx.fillStyle = '#9a7a54'; ctx.fillRect(0, GROUND, W, H - GROUND); ctx.strokeStyle = 'rgba(40,24,12,.25)'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = GROUND + 14; y < H; y += 16){ ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
  drawPlayer();
  grannyBlink = Math.max(0, grannyBlink - 1/60);
}
SECRETS.grandma = { start:150, get back(){ return houseDoor(GRANNY_HOUSE); }, draw:drawGrannyHouse, max:740, spots:[
  { x:92, r:55, hit:[60, 124], stand:110, gap:0, label:'Go back outside', open:() => leaveSecret() },
  { x:GRANNY_X, r:90, hit:[GRANNY_X - 60, GRANNY_X + 70], stand:GRANNY_X - 90, gap:0, label:'Talk to Grandma Wolf', open:() => { P.anim.happy = 1.5; grannyBlink = .3; openMystery('Grandma Wolf', GRANNY_LINES[grannyLine], ''); grannyLine = (grannyLine + 1) % GRANNY_LINES.length; } },
  { x:690, r:70, hit:[630, 750], stand:620, gap:0, label:'Bake with Grandma Wolf', open:() => bakeWithGranny() },
  { x:440, r:60, hit:[355, 525], hitY:[30, 175], stand:440, gap:0, label:'Look at the family photos', open:() => openMystery('The Family Photos', 'Grandpups everywhere! Grandpups in sweaters, grandpups in the snow, and one very fluffy grandpup who seems to be wearing a whole scarf as a hat.', '') },
  { x:255, r:60, hit:[200, 310], hitY:[60, 200], stand:255, gap:0, label:'Look out the window', open:() => openMystery('The Window', 'You can see the windmill turning slowly over the rooftops of Thistledown. A bird lands on the sill, looks at you, and leaves.', '') },
]};

// ----- the Holiday House: a door for each season (the games are coming another day) -----
const SEASONS = [
  { id:'spring', name:'Spring', col:'#f4a6c8', dark:'#c8607e', x:230, text:'Painted eggs hang from ribbons around the door, and tiny flowers are growing right out of the door frame.' },
  { id:'summer', name:'Summer', col:'#ffd66e', dark:'#e0902a', x:380, text:'The door is warm to touch! A beach ball, a pail and a pair of sunglasses are piled up beside it.' },
  { id:'autumn', name:'Autumn', col:'#f0a050', dark:'#b85a2a', x:530, text:'Pumpkins sit on either side of the door, and every time you look away, a few more leaves have fallen.' },
  { id:'winter', name:'Winter', col:'#a8d8f8', dark:'#5a8ab8', x:680, text:'Frost covers the door in curly patterns, and a little snowman stands guard with a carrot nose.' },
];
// which season it is right now (northern hemisphere), so that door glows
const seasonNow = () => { const m = new Date().getMonth(); return m >= 2 && m <= 4 ? 'spring' : m >= 5 && m <= 7 ? 'summer' : m >= 8 && m <= 10 ? 'autumn' : 'winter'; };
function seasonDoor(s, now){
  const x = s.x, w = 110, h = 190, top = GROUND - h;
  if (now){ const g = ctx.createRadialGradient(x, GROUND - 90, 10, x, GROUND - 90, 130); g.addColorStop(0, 'rgba(255,240,180,.55)'); g.addColorStop(1, 'rgba(255,240,180,0)'); ctx.fillStyle = g; circle(x, GROUND - 90, 130); }
  // an arched frame in the season's color, and a closed door
  ctx.fillStyle = s.dark; ctx.beginPath(); ctx.moveTo(x - w/2, GROUND); ctx.lineTo(x - w/2, top + w/2); ctx.arc(x, top + w/2, w/2, Math.PI, 0); ctx.lineTo(x + w/2, GROUND); ctx.closePath(); ctx.fill();
  ctx.fillStyle = s.col; ctx.beginPath(); ctx.moveTo(x - w/2 + 10, GROUND); ctx.lineTo(x - w/2 + 10, top + w/2); ctx.arc(x, top + w/2, w/2 - 10, Math.PI, 0); ctx.lineTo(x + w/2 - 10, GROUND); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x - 2, top + 20, 4, h - 20); ctx.fillStyle = s.dark; circle(x + 30, GROUND - 80, 5);
  // a sign over each door
  ctx.fillStyle = '#4a3020'; rr(x - 46, top - 30, 92, 26, 6); ctx.fill(); ctx.fillStyle = s.col; ctx.font = '700 15px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.name, x, top - 17);
  ctx.fillStyle = 'rgba(255,255,255,.85)'; rr(x - 34, GROUND - 120, 68, 22, 5); ctx.fill(); ctx.fillStyle = s.dark; ctx.font = '700 10px "Pixelify Sans", monospace'; ctx.fillText('COMING SOON', x, GROUND - 109);
  if (now){ ctx.fillStyle = '#ffe066'; rr(x - 38, top - 56, 76, 20, 6); ctx.fill(); ctx.fillStyle = '#5a3a10'; ctx.font = '700 11px "Pixelify Sans", monospace'; ctx.fillText('In season!', x, top - 46); }
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  // and each one decorated for its season
  if (s.id === 'spring'){
    for (const [ex, ey, c] of [[-44, 70, '#9ad8f8'], [44, 90, '#ffe066'], [-40, 140, '#c8a0f0']]){ ctx.strokeStyle = '#e0708f'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + ex, top + ey - 20); ctx.lineTo(x + ex, top + ey - 8); ctx.stroke(); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + ex, top + ey, 7, 9, 0, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x + ex - 6, top + ey); ctx.lineTo(x + ex + 6, top + ey); ctx.stroke(); }
    for (let k = 0; k < 7; k++){ const fx = x - 50 + k*16; ctx.fillStyle = ['#ff8ab8', '#ffe066', '#ffffff'][k % 3]; for (let p = 0; p < 5; p++){ const a = p/5*Math.PI*2; circle(fx + Math.cos(a)*3.5, GROUND - 6 + Math.sin(a)*3.5, 2.6); } ctx.fillStyle = '#f2c230'; circle(fx, GROUND - 6, 1.8); }
    const bx = x + 20 + Math.sin(t*1.5)*20, by = top + 30 + Math.cos(t*2)*10, fl = Math.abs(Math.sin(t*12)); ctx.fillStyle = '#f0a0d0'; ctx.beginPath(); ctx.ellipse(bx - 5*fl, by, 5*fl + 1, 4, 0, 0, 7); ctx.ellipse(bx + 5*fl, by, 5*fl + 1, 4, 0, 0, 7); ctx.fill();
  } else if (s.id === 'summer'){
    ctx.fillStyle = '#ffe066'; circle(x, top + 34, 14); ctx.strokeStyle = '#ffe066'; ctx.lineWidth = 3; for (let k = 0; k < 8; k++){ const a = k/8*Math.PI*2 + t*.5; ctx.beginPath(); ctx.moveTo(x + Math.cos(a)*18, top + 34 + Math.sin(a)*18); ctx.lineTo(x + Math.cos(a)*25, top + 34 + Math.sin(a)*25); ctx.stroke(); }
    const bb = Math.abs(Math.sin(t*3))*10; ctx.save(); ctx.translate(x - 48, GROUND - 14 - bb); for (let k = 0; k < 4; k++){ ctx.fillStyle = ['#d0452f', '#fff', '#5aa0e0', '#ffe066'][k]; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 13, k*Math.PI/2, (k + 1)*Math.PI/2); ctx.fill(); } ctx.restore();
    ctx.fillStyle = '#5aa0e0'; ctx.beginPath(); ctx.moveTo(x + 36, GROUND - 22); ctx.lineTo(x + 58, GROUND - 22); ctx.lineTo(x + 54, GROUND); ctx.lineTo(x + 40, GROUND); ctx.fill(); ctx.strokeStyle = '#5aa0e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + 47, GROUND - 22, 10, Math.PI, 0); ctx.stroke();
  } else if (s.id === 'autumn'){
    for (const [px, r] of [[x - 50, 14], [x + 48, 11], [x + 62, 8]]){ ctx.fillStyle = '#e0702a'; ctx.beginPath(); ctx.ellipse(px, GROUND - r, r*1.25, r, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(120,50,10,.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(px, GROUND - r, r*.45, r, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#4f7a4a'; ctx.fillRect(px - 1.5, GROUND - r*2 - 5, 3, 6); }
    for (let k = 0; k < 6; k++){ const fy = wrap(t*30 + k*37, h + 20) + top - 10, fx = x - 50 + k*20 + Math.sin(t*2 + k)*8; ctx.save(); ctx.translate(fx, fy); ctx.rotate(t*2 + k); ctx.fillStyle = ['#e0602a', '#f2c230', '#b8453d'][k % 3]; ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, 7); ctx.fill(); ctx.restore(); }
  } else {
    ctx.fillStyle = '#ffffff'; for (let k = 0; k < 9; k++){ ctx.beginPath(); ctx.moveTo(x - w/2 + 6 + k*12, top + w/2 - 4); ctx.lineTo(x - w/2 + 10 + k*12, top + w/2 + 10 + (k % 3)*5); ctx.lineTo(x - w/2 + 14 + k*12, top + w/2 - 4); ctx.fill(); }
    ctx.fillStyle = '#ffffff'; circle(x + 50, GROUND - 14, 14); circle(x + 50, GROUND - 36, 10); ctx.fillStyle = '#2a2a30'; circle(x + 47, GROUND - 38, 1.5); circle(x + 53, GROUND - 38, 1.5); ctx.fillStyle = '#f0802a'; ctx.beginPath(); ctx.moveTo(x + 50, GROUND - 35); ctx.lineTo(x + 60, GROUND - 33); ctx.lineTo(x + 50, GROUND - 31); ctx.fill();
    for (let k = 0; k < 8; k++){ const sy = wrap(t*20 + k*29, h + 40) + top - 30, sx = x - 50 + k*14 + Math.sin(t + k)*6; ctx.fillStyle = 'rgba(255,255,255,.9)'; circle(sx, sy, 2); }
    ctx.fillStyle = '#d0452f'; rr(x - 60, GROUND - 18, 18, 18, 2); ctx.fill(); ctx.fillStyle = '#4f7a4a'; rr(x - 40, GROUND - 14, 14, 14, 2); ctx.fill(); ctx.fillStyle = '#ffe066'; ctx.fillRect(x - 52, GROUND - 18, 3, 18); ctx.fillRect(x - 34, GROUND - 14, 3, 14);
  }
}
function drawHolidayHouse(){
  // warm plank walls with a bunting of all four seasons' colors along the top
  for (let x = 0; x < W; x += 34){ ctx.fillStyle = (x/34) % 2 ? '#e8d4b8' : '#f0dec4'; ctx.fillRect(x, 0, 34, GROUND); }
  ctx.fillStyle = '#6b4a2b'; ctx.fillRect(0, 0, W, 24);
  ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 40); for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 40 + Math.sin(x/W*Math.PI)*24); ctx.stroke();
  for (let k = 0; k < 20; k++){ const x = k*40 + 20, y = 40 + Math.sin(x/W*Math.PI)*24; ctx.fillStyle = SEASONS[k % 4].col; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.lineTo(x, y + 22); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = '#4a3020'; rr(W/2 - 120, 76, 240, 34, 8); ctx.fill(); ctx.fillStyle = '#ffe9a8'; ctx.font = '700 18px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('THE HOLIDAY HOUSE', W/2, 93); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  // the floor, then the four season doors
  ctx.fillStyle = '#a07a58'; ctx.fillRect(0, GROUND, W, H - GROUND); ctx.strokeStyle = 'rgba(40,24,12,.25)'; ctx.lineWidth = 2; ctx.beginPath(); for (let y = GROUND + 14; y < H; y += 16){ ctx.moveTo(0, y); ctx.lineTo(W, y); } ctx.stroke();
  const now = seasonNow(); for (const s of SEASONS) seasonDoor(s, s.id === now);
  // the door back out
  ctx.fillStyle = '#6b4226'; ctx.fillRect(40, GROUND - 120, 64, 120); ctx.strokeStyle = '#3a2616'; ctx.lineWidth = 6; ctx.strokeRect(40, GROUND - 120, 64, 120); ctx.fillStyle = '#f2c230'; circle(92, GROUND - 60, 4);
  drawPlayer();
}
SECRETS.holiday = { start:130, get back(){ return houseDoor(HOLIDAY_HOUSE); }, draw:drawHolidayHouse, max:760, spots:[
  { x:72, r:50, hit:[40, 104], stand:90, gap:0, label:'Go back outside', open:() => leaveSecret() },
  ...SEASONS.map(s => ({ x:s.x, r:60, hit:[s.x - 55, s.x + 55], stand:s.x - 70, gap:0, label:`Try the ${s.name} door`, open:() => openMystery(`${s.name} Games`, `${s.text} A little sign on the door says: “${s.name} games, opening soon!”`, s.id === seasonNow() ? 'It’s in season right now! Check back soon.' : 'Coming soon!') })),
]};

const SPOTS = [
  ...SHOPS.map(s => ({ x:s.x + 20, r:150, hit:[s.x - s.w/2 - 20, s.x + s.w/2 + 40], stand:s.door, gap:0, label:`Go into ${s.name}`, shop:s, open:() => enterShop(s) })),
  { x:BOARD_X, r:100, hit:[BOARD_X - 90, BOARD_X + 90], stand:BOARD_X, gap:40, label:'Read the Quest Board', open:() => openBoard() },
  { x:GATE_X, r:150, hit:[GATE_X - 80, GATE_X + 90], stand:GATE_X, gap:40, label:'Head out to the Meadow', open:() => enterMeadow() },
  { x:WINDMILL_X, r:60, hit:[WINDMILL_X - 45, WINDMILL_X + 45], stand:WINDMILL_X, gap:30, label:'Go inside the windmill', open:() => enterMill() },
  { x:houseDoor(GRANNY_HOUSE), r:110, hit:[GRANNY_HOUSE.x - GRANNY_HOUSE.w/2, GRANNY_HOUSE.x + GRANNY_HOUSE.w/2], stand:houseDoor(GRANNY_HOUSE), gap:0, label:'Visit Grandma Wolf', open:() => enterCottage('grandma') },
  { x:houseDoor(HOLIDAY_HOUSE), r:110, hit:[HOLIDAY_HOUSE.x - HOLIDAY_HOUSE.w/2, HOLIDAY_HOUSE.x + HOLIDAY_HOUSE.w/2], stand:houseDoor(HOLIDAY_HOUSE), gap:0, label:'Go into the Holiday House', open:() => enterCottage('holiday') },
  // secret places: no prompt, just click the thing (or press E right next to it)
  { x:980, r:30, hit:[962, 998], hitY:[GROUND - 100, GROUND - 44], stand:980, gap:0, hidden:true, label:'', open:() => enterSecret('well') },
  { x:3752, r:18, hit:[3752, 3850], hitY:[GROUND - 40, H], stand:3752, gap:0, hidden:true, label:'', open:() => enterSecret('cove') },
];
const MILL_SPOTS = [
  { x:MILL_DOOR, r:80, hit:[MILL_DOOR - 50, MILL_DOOR + 50], stand:MILL_DOOR, gap:40, label:'Go back outside', open:() => leaveMill() },
  { x:BRAKE_X, r:45, hit:[BRAKE_X - 26, BRAKE_X + 26], hitY:[250, 330], stand:BRAKE_X, gap:0, hidden:true, label:'', open:() => pullBrake() },
  { x:CHEST_X, r:70, hit:[CHEST_X - 55, CHEST_X + 55], stand:CHEST_X, gap:70, label:'Open the old chest', needs:chestFound, open:() => openChest() },
  { x:HATCH_X, r:65, hit:[HATCH_X - 40, HATCH_X + 40], stand:HATCH_X, gap:0, label:'Climb the rope ladder', needs:'millChest', open:() => climbToBalloon() },
];
const spotsHere = () => (scene === 'world' ? worldSpots() : scene === 'meadow' ? MEADOW_SPOTS.filter(sp => !sp.needs || sp.needs()) : scene === 'secret' ? currentSecret.spots : scene === 'shop' ? shopSpots() : scene === 'mill' ? MILL_SPOTS.filter(sp => !sp.needs || (typeof sp.needs === 'function' ? sp.needs() : Save.flag(sp.needs))) : SPOTS.filter(sp => !sp.needs || sp.needs()));
function pullBrake(){
  brakeOn = !brakeOn;
  if (brakeOn && !chestFound()){ Save.setFlag('millFloor'); floorPop = 1; P.anim.happy = 2; }
}

function drawKeeper(s){
  const k = KEEPERS[s.keeper], x = s.kx - camX;
  if (!onScreen(x, 80) || !k.img.complete || !k.img.naturalWidth) return;
  const h = k.h, w = h*k.img.naturalWidth/k.img.naturalHeight;
  const face = P.x < s.kx ? -1 : 1, br = reduceMotion ? 0 : Math.sin(t*2.2 + s.kx)*.018;
  ctx.fillStyle = 'rgba(40,24,16,.28)'; ctx.beginPath(); ctx.ellipse(x, GROUND + 8, w*.42, 6, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(x, GROUND + 10); ctx.scale(face*(1 - br*.5), 1 + br);
  ctx.drawImage(k.img, -w/2, -h, w, h); ctx.restore();
  if (near && near.shop === s && !panelOpen()){
    const label = k.name; ctx.font = '700 14px "Pixelify Sans", monospace';
    const tw = ctx.measureText(label).width + 20, signBottom = GROUND - s.h + 52;
    let tx = x, ty = GROUND + 10 - h - 22;
    ctx.fillStyle = 'rgba(43,33,24,.85)';
    if (ty - 13 < signBottom){
      // tall keepers: the tag sits beside the head so it doesn't cover the shop sign
      tx = x + w/2 + tw/2 + 6; ty = GROUND + 10 - h*.72;
      rr(tx - tw/2, ty - 12, tw, 24, 8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(tx - tw/2, ty - 6); ctx.lineTo(tx - tw/2 - 6, ty); ctx.lineTo(tx - tw/2, ty + 6); ctx.fill();
    } else {
      rr(tx - tw/2, ty - 13, tw, 24, 8); ctx.fill();
      ctx.beginPath(); ctx.moveTo(tx - 6, ty + 11); ctx.lineTo(tx + 6, ty + 11); ctx.lineTo(tx, ty + 17); ctx.fill();
    }
    ctx.fillStyle = '#f6ead6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, tx, ty);
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  }
}
let noPlayer = false;
function drawPlayer(){
  if (noPlayer) return;
  const inMill = scene !== 'village'; // indoors the floor is flat
  const x = P.x - camX, y = inMill ? GROUND + 14 : deckY(P.x), slope = inMill ? 0 : (deckY(P.x + 2) - deckY(P.x - 2))/4;
  if (climbing){
    const ct = climbing.t;
    // first a quick turn to face the ladder: the side view squeezes away and the back view opens up
    if (ct < TURN_TIME){
      const u = ct/TURN_TIME;
      ctx.fillStyle = 'rgba(40,24,16,.3)'; ctx.beginPath(); ctx.ellipse(x, GROUND + 14, 34, 6, 0, 0, 7); ctx.fill();
      if (u < .5){ ctx.save(); ctx.translate(x, 0); ctx.scale(1 - u*2, 1); Chin.draw(ctx, 'me', P.anim, 0, GROUND + 14, { scale:.12, face:P.face, grounded:true, speed:0 }); ctx.restore(); }
      else drawChinBack(x, GROUND + 14, 0, (u - .5)*2);
      return;
    }
    // then hand over hand up the rope, rising in little pulls and swaying with the ladder
    const k = Math.min(1, (ct - TURN_TIME)/(CLIMB_TIME - TURN_TIME)), ph = (ct - TURN_TIME)*Math.PI*2.5;
    const pull = reduceMotion ? 0 : Math.abs(Math.sin(ph))*5;
    const cy = GROUND + 14 - k*(GROUND - 6) - pull, sway = reduceMotion ? 0 : Math.sin(t*1.3)*3*Math.min(1.5, k*2);
    const lift = Math.min(1, k*4);
    ctx.fillStyle = `rgba(40,24,16,${.3*(1 - lift)})`; ctx.beginPath(); ctx.ellipse(x, GROUND + 14, 34*(1 - lift*.5), 6, 0, 0, 7); ctx.fill();
    drawChinBack(x + sway, cy, reduceMotion ? 0 : ph, 1);
    return;
  }
  const floaty = scene === 'world' && currentWorld.float && !reduceMotion ? 8 + Math.sin(t*2)*6 : 0; // light as a feather in the nebula
  ctx.fillStyle = `rgba(40,24,16,${floaty ? .18 : .3})`; ctx.beginPath(); ctx.ellipse(x, y, 34 - floaty, 6, 0, 0, 7); ctx.fill();
  // leans into the climb on the bridge
  Chin.draw(ctx, 'me', P.anim, x, y - floaty, { scale:.12, face:P.face, grounded:true, speed:Math.abs(P.vx), tilt:Math.atan(slope)*.6 });
}
function drawPetals(){
  if (reduceMotion) return;
  for (const p of PETALS){
    const x = wrap(p.x + t*p.sp*.6 - camX*.2 + Math.sin(t + p.ph)*14, W + 40) - 20, y = wrap(p.y + t*p.sp, H + 20) - 10;
    ctx.fillStyle = p.col; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(x, y, 3.5, 2, t + p.ph, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function draw(){
  drawBackdrop();
  drawGround();
  drawWater();
  drawTree(40, 60); drawSignpost(130); drawArch(290);
  for (let i=0;i<LAMPS.length-1;i++){
    const a = LAMPS[i], b = LAMPS[i+1];
    if (b - a < 480 && !(a < WINDMILL_X && b > WINDMILL_X)) bunting(a, b);
  }
  drawWindmill(WINDMILL_X);
  for (const h of HOUSES){ cottage(h, false); if (h.kind) cottageExtras(h); }
  for (const s of SHOPS) drawShop(s);
  drawWell(980); drawWell(3020); drawFence(3600, 3);
  drawFountain(FOUNTAIN_X); drawBoard(BOARD_X); drawGate(GATE_X); drawFence(5140, 3);
  for (const l of LAMPS) drawLamp(l);
  drawBridge();
  for (const s of SHOPS) drawKeeper(s);
  drawPlayer();
  drawPetals();
}

// ---------- input ----------
const keys = {}, pad = { l:false, r:false };
const panelOpen = () => !shopPanel.hidden || !satchelPanel.hidden || !boardPanel.hidden || !notePanel.hidden || !itemPanel.hidden || !secretPanel.hidden || !realmPanel.hidden;
addEventListener('keydown', e => {
  if (!isActive()) return;
  const k = e.key.toLowerCase();
  if (k === 'escape'){ closePanels(); return; }
  if (panelOpen()) return;
  if (['arrowleft','arrowright','a','d'].includes(k)){ e.preventDefault(); keys[k] = true; P.target = null; pending = null; }
  if (['e','arrowup','w'].includes(k) && near && !fadeDir && !climbing){ e.preventDefault(); near.open(); }
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; pad.l = pad.r = false; });

cv.addEventListener('pointerdown', e => {
  if (panelOpen() || fadeDir || climbing) return;
  const r = cv.getBoundingClientRect(), wx = (e.clientX - r.left)/r.width*W + camX, wy = (e.clientY - r.top)/r.height*H;
  // clicking a shop, the board, or the gate walks there and goes in
  const WW = scene === 'mill' ? MILL_W : scene === 'meadow' ? MEADOW_W : scene === 'world' ? currentWorld.w : scene === 'shop' || scene === 'secret' ? W : WORLD;
  const spot = spotsHere().find(sp => (sp.hitY ? wy > sp.hitY[0] && wy < sp.hitY[1] : wy < GROUND + 20) && wx > sp.hit[0] && wx < sp.hit[1]);
  if (spot){ P.target = clamp(spot.stand + (P.x < spot.stand ? -spot.gap : spot.gap), 50, WW - 50); pending = spot; }
  else { P.target = clamp(wx, 50, WW - 50); pending = null; }
});
function hold(id, key){
  const b = document.getElementById(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); b.classList.add('on'); pad[key] = true; P.target = null; pending = null; });
  const up = () => { b.classList.remove('on'); pad[key] = false; };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
}
hold('vLeft', 'l'); hold('vRight', 'r');

// ---------- shop and satchel panels ----------
const shopPanel = document.getElementById('shopPanel'), satchelPanel = document.getElementById('satchelPanel');
const shopPrompt = document.getElementById('shopPrompt'), shopPromptName = document.getElementById('shopPromptName');
const shopItems = document.getElementById('shopItems'), shopMsg = document.getElementById('shopMsg');
const walletEls = document.querySelectorAll('.wallet-seeds');

shopPrompt.addEventListener('click', () => { if (near) near.open(); });
document.getElementById('shopClose').addEventListener('click', closePanels);
document.getElementById('satchelClose').addEventListener('click', closePanels);
document.getElementById('satchelBtn').addEventListener('click', () => { closePanels(); renderSatchel(); satchelPanel.hidden = false; document.getElementById('satchelClose').focus(); });

function openShop(s){
  if (openShopRef === s) return;
  openShopRef = s; P.target = null; pending = null; for (const k in keys) keys[k] = false;
  const k = KEEPERS[s.keeper];
  document.getElementById('shopKeeperImg').src = k.img.src;
  document.getElementById('shopKeeperImg').alt = k.name;
  document.getElementById('shopName').textContent = s.name;
  document.getElementById('shopGreeting').textContent = `${k.name}: “${s.greeting}”`;
  shopMsg.textContent = '';
  renderShop();
  shopPanel.hidden = false;
  document.getElementById('shopClose').focus();
}
function closePanels(){ realmPanel.hidden = true; shopPanel.hidden = true; satchelPanel.hidden = true; boardPanel.hidden = true; notePanel.hidden = true; itemPanel.hidden = true; secretPanel.hidden = true; openShopRef = null; openItemRef = null; }

// looking closely at one item on its display
const itemPanel = document.getElementById('itemPanel'), itemCv = document.getElementById('itemCanvas'), itemCtx = itemCv.getContext('2d');
let openItemRef = null;
document.getElementById('itemClose').addEventListener('click', closePanels);
document.getElementById('itemBuy').addEventListener('click', () => {
  const it = openItemRef, s = currentShop; if (!it || !s || !Save.spend(it.price)) return;
  Save.give(it.id); P.anim.happy = 2.5; P.anim.chew = .6;
  document.getElementById('itemMsg').textContent = `${KEEPERS[s.keeper].name}: “${s.thanks[Math.floor(Math.random()*s.thanks.length)]}”`;
});
function openItem(it){
  closePanels(); P.target = null; pending = null; for (const k in keys) keys[k] = false;
  openItemRef = it; document.getElementById('itemMsg').textContent = '';
  renderItem(); itemPanel.hidden = false; document.getElementById('itemBuy').focus();
}
function renderItem(){
  const it = openItemRef; if (!it) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  itemCv.width = 200*dpr; itemCv.height = 150*dpr; itemCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = itemCtx.createRadialGradient(100, 75, 10, 100, 75, 110); bg.addColorStop(0, '#fff4dc'); bg.addColorStop(1, '#e8d4b0');
  itemCtx.fillStyle = bg; itemCtx.fillRect(0, 0, 200, 150);
  itemIcon(itemCtx, it.id, 100, 78, 2.6);
  const owned = Save.count(it.id), soldOut = !it.stack && owned > 0, short = it.price - Save.seeds();
  document.getElementById('itemName').textContent = it.name;
  document.getElementById('itemDesc').textContent = it.desc;
  document.getElementById('itemPrice').textContent = it.price;
  document.getElementById('itemOwned').textContent = owned ? (it.stack ? `You have ${owned}` : 'You own this') : '';
  const b = document.getElementById('itemBuy');
  b.textContent = soldOut ? 'Owned' : 'Buy'; b.disabled = soldOut || short > 0;
  b.title = !soldOut && short > 0 ? `You need ${short} more seed${short === 1 ? '' : 's'}` : '';
  if (!soldOut && short > 0 && !document.getElementById('itemMsg').textContent) document.getElementById('itemMsg').textContent = `You need ${short} more seed${short === 1 ? '' : 's'}.`;
}

// the secret: a note in the windmill's old chest, and a ladder up to a balloon
const notePanel = document.getElementById('notePanel');
document.getElementById('noteClose').addEventListener('click', closePanels);
document.getElementById('noteClimb').addEventListener('click', () => { closePanels(); climbToBalloon(); });
function openChest(){
  const first = !Save.flag('millChest');
  if (first){ Save.setFlag('millChest'); P.anim.happy = 3; }
  closePanels(); P.target = null; pending = null; for (const k in keys) keys[k] = false;
  document.getElementById('noteLead').textContent = first ? 'Something rustles as the lid creaks open. A hatch in the ceiling swings down, and a rope ladder tumbles to the floor.' : 'The note is still here, and the ladder still hangs from the hatch.';
  notePanel.hidden = false; document.getElementById('noteClimb').focus();
}
// walk to the rope ladder, climb up through the hatch into the basket, then fly
const CLIMB_TIME = 2.7, TURN_TIME = .3;
// the chinchilla seen from behind, for climbing: hat, ears, fluffy back and tail,
// with hands and feet taking turns on the rungs. (x, y) = the feet, ph = climbing rhythm
const INK = '#200204', FUR = '#d6cbb8', FUR_SHADE = '#a8a0a3';
function drawChinBack(x, y, ph, sx){
  const a = Math.max(0, Math.sin(ph)), b = Math.max(0, -Math.sin(ph));
  ctx.save(); ctx.translate(x, y); ctx.scale(sx, 1);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const blob = (bx, by, rx, ry, fill) => { ctx.beginPath(); ctx.ellipse(bx, by, rx, ry, 0, 0, 7); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke(); };
  // tail curling down between the feet
  blob(4, -10, 12, 14, FUR_SHADE); blob(0, -4, 9, 8, FUR);
  // feet on the rungs, one stepping up while the other pushes
  for (const [fx, fy] of [[-15, -3 - b*10], [15, -3 - a*10]]){ blob(fx, fy, 10, 6, '#f1b487'); }
  // back
  blob(0, -36, 30, 30, FUR);
  ctx.fillStyle = FUR_SHADE; ctx.beginPath(); ctx.ellipse(0, -24, 22, 12, 0, 0, Math.PI); ctx.fill();
  // arms reaching up for the next rung
  for (const [side, up] of [[-1, a], [1, b]]){
    const hx = side*44, hy = -98 - up*10;
    ctx.strokeStyle = INK; ctx.lineWidth = 13; ctx.beginPath(); ctx.moveTo(side*24, -50); ctx.quadraticCurveTo(side*42, -72, hx, hy); ctx.stroke();
    ctx.strokeStyle = FUR; ctx.lineWidth = 7.5; ctx.beginPath(); ctx.moveTo(side*24, -50); ctx.quadraticCurveTo(side*42, -72, hx, hy); ctx.stroke();
  }
  // head and big round ears
  // ears stick up past the brim
  blob(-25, -104, 11, 15, '#f3ede6'); blob(25, -104, 11, 15, '#f3ede6');
  blob(0, -72, 27, 24, FUR);
  // the hat from behind: brim, crown, band
  blob(0, -86, 44, 11, '#b06a42');
  ctx.beginPath(); ctx.moveTo(-22, -88); ctx.quadraticCurveTo(-24, -112, 0, -114); ctx.quadraticCurveTo(24, -112, 22, -88); ctx.closePath();
  ctx.fillStyle = '#df9763'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.5; ctx.stroke();
  ctx.fillStyle = '#6b3a2a'; ctx.fillRect(-21, -95, 42, 6);
  // paws holding the rungs
  blob(-44, -98 - a*10, 6, 5.5, '#f1b487'); blob(44, -98 - b*10, 6, 5.5, '#f1b487');
  ctx.restore();
}
let climbing = null;
function climbToBalloon(){
  closePanels();
  if (scene !== 'mill'){ startBalloon(); return; }
  const begin = () => { P.x = HATCH_X; P.face = 1; P.vx = 0; climbing = { t:0, done:false }; };
  if (Math.abs(P.x - HATCH_X) < 6) begin();
  else { P.target = HATCH_X; pending = { stand:HATCH_X, open:begin }; }
}
// the ceiling and basket drawn again in front, so the chinchilla climbs up into the hatch
function drawCeilingOver(){
  const hx = HATCH_X - camX;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 48); ctx.rect(hx - 38, 0, 76, 44); ctx.clip('evenodd');
  ctx.fillStyle = '#3a2616'; ctx.fillRect(0, 0, W, 40); ctx.fillStyle = '#4a3020'; ctx.fillRect(0, 34, W, 14);
  ctx.restore();
  ctx.fillStyle = '#b8864a'; rr(hx - 26, -8, 52, 30, 4); ctx.fill();
  ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2; ctx.beginPath(); for (let i=1;i<4;i++){ ctx.moveTo(hx - 26, -8 + i*8); ctx.lineTo(hx + 26, -8 + i*8); } ctx.stroke();
}

const boardPanel = document.getElementById('boardPanel');
document.getElementById('boardClose').addEventListener('click', closePanels);
function openBoard(){
  if (!boardPanel.hidden) return;
  closePanels(); P.target = null; pending = null; for (const k in keys) keys[k] = false;
  renderBoard(); boardPanel.hidden = false;
  (boardPanel.querySelector('.btn-primary') || document.getElementById('boardClose')).focus();
}
function renderBoard(){
  const list = document.getElementById('questItems'); list.innerHTML = '';
  for (const q of QUESTS){
    const li = document.createElement('li');
    li.className = 'shop-item quest' + (q.locked ? ' locked' : '');
    if (q.locked){
      li.innerHTML = `<div class="info"><div class="name">Quest ${q.level}</div><div class="desc">Coming soon</div></div><div class="side"><button class="btn btn-secondary btn-sm" disabled>Locked</button></div>`;
    } else {
      const k = KEEPERS[q.giver], done = Save.flag(q.flag);
      li.innerHTML = `<img class="giver" alt=""><div class="info"><div class="name"></div><div class="desc"></div><div class="reward"></div></div><div class="side"><button class="btn btn-primary btn-sm"></button></div>`;
      li.querySelector('img').src = k.img.src; li.querySelector('img').alt = k.name;
      li.querySelector('.name').textContent = `Quest ${q.level}: ${q.title}`;
      li.querySelector('.desc').textContent = `${k.name}: “${q.text}”`;
      li.querySelector('.reward').textContent = done ? `Done! ${k.name} paid you ${q.reward} seeds.` : `Reward: ${q.reward} seeds from ${k.name}`;
      if (done) li.querySelector('.reward').classList.add('done');
      const b = li.querySelector('button'); b.textContent = done ? 'Play again' : 'Start quest';
      b.addEventListener('click', () => { closePanels(); startLevel(q.level); });
    }
    list.appendChild(li);
  }
}

function renderShop(){
  const s = openShopRef; if (!s) return;
  shopItems.innerHTML = '';
  for (const it of s.items){
    const owned = Save.count(it.id), soldOut = !it.stack && owned > 0, short = it.price - Save.seeds();
    const li = document.createElement('li'); li.className = 'shop-item';
    li.innerHTML = `<div class="info"><div class="name"></div><div class="desc"></div></div>
      <div class="side"><span class="price"><i class="seed-icon"></i>${it.price}</span><button class="btn btn-primary btn-sm"></button></div>`;
    li.querySelector('.name').textContent = it.name + (it.stack && owned ? `  ×${owned}` : '');
    li.querySelector('.desc').textContent = it.desc;
    const btn = li.querySelector('button');
    btn.textContent = soldOut ? 'Owned' : 'Buy';
    btn.disabled = soldOut || short > 0;
    if (!soldOut && short > 0) btn.title = `You need ${short} more seed${short === 1 ? '' : 's'}`;
    btn.addEventListener('click', () => buy(it));
    shopItems.appendChild(li);
  }
}
function buy(it){
  const s = openShopRef;
  if (!Save.spend(it.price)) return;
  Save.give(it.id);
  P.anim.happy = 2.5; P.anim.chew = .6;
  shopMsg.textContent = `${KEEPERS[s.keeper].name}: “${s.thanks[Math.floor(Math.random()*s.thanks.length)]}”`;
}
function renderSatchel(){
  const list = document.getElementById('satchelItems'); list.innerHTML = '';
  const owned = Object.entries(Save.items()).filter(([id, n]) => n > 0 && ITEMS[id]);
  document.getElementById('satchelEmpty').hidden = owned.length > 0;
  const found = secretsFound(); document.getElementById('secretsFound').textContent = found ? `Secret places found: ${found} of 4` : 'Secret places found: none yet. Keep exploring!';
  for (const [id, n] of owned){
    const it = ITEMS[id], li = document.createElement('li'); li.className = 'shop-item';
    li.innerHTML = `<div class="info"><div class="name"></div><div class="desc"></div></div><div class="side"></div>`;
    li.querySelector('.name').textContent = it.name + (n > 1 ? `  ×${n}` : '');
    li.querySelector('.desc').textContent = it.desc;
    if (it.snack){
      const b = document.createElement('button'); b.className = 'btn btn-secondary btn-sm'; b.textContent = it.verb || 'Eat';
      b.addEventListener('click', () => { if (Save.use(id)){ P.anim.chew = 1.4; P.anim.happy = 3; } });
      li.querySelector('.side').appendChild(b);
    }
    list.appendChild(li);
  }
}
function renderWallet(){ for (const el of walletEls) el.textContent = Save.seeds(); }
Save.onChange(() => { renderWallet(); if (!shopPanel.hidden) renderShop(); if (!satchelPanel.hidden) renderSatchel(); if (!boardPanel.hidden) renderBoard(); if (!itemPanel.hidden) renderItem(); });
renderWallet();

// ---------- loop ----------
// which world you're exploring right now (the lake counts its cabins too), so the music can match (see REALM_SONGS in script.js)
window.realmNow = () => scene === 'world' ? worldHalfId()
  : scene === 'secret' && (currentSecret === SECRETS.lakecabin || currentSecret === SECRETS.firstcabin) ? currentWorldId
  : scene === 'secret' && currentSecret === SECRETS.hq ? null      // the Portal Headquarters sits between realms
  : scene === 'secret' && currentSecret && currentSecret.hub ? (currentWorld && currentWorld.joined && currentWorld.joined.oneSong ? currentWorld.joined.idA : currentSecret.hub)   // inside a world's portal hub
  : 'thistledown';                                                 // the village, its shops, the windmill, the meadow and secret places
let lastRealm;
function update(dt){
  t += dt;
  // arriving in (or leaving) a world with its own song switches the music; a new song starts from the top
  const realm = window.realmNow();
  if (realm !== lastRealm){ lastRealm = realm; if (typeof musicStarted !== 'undefined' && musicStarted) startMusic(!!REALM_SONGS[realm]); }
  placeT += dt; if (placeT > .5){ placeT = 0; savePlace(); }
  millSpeed += ((brakeOn ? 0 : 1) - millSpeed)*Math.min(1, dt*1.5); millAng += dt*.5*millSpeed;
  floorPop = Math.max(0, floorPop - dt*.8);
  if (fadeDir){
    fadeA += fadeDir*dt*4;
    if (fadeA >= 1){ fadeA = 1; fadeDir = -1; const fn = fadeMid; fadeMid = null; fn(); }
    else if (fadeA <= 0){ fadeA = 0; fadeDir = 0; }
  }
  const WW = scene === 'mill' ? MILL_W : scene === 'meadow' ? MEADOW_W : scene === 'world' ? currentWorld.w : scene === 'shop' ? SHOP_W : scene === 'secret' ? W : WORLD;
  if (climbing){
    climbing.t += dt;
    if (climbing.t > CLIMB_TIME - .15 && !climbing.done){
      climbing.done = true;
      transition(() => { climbing = null; startBalloon(); });
    }
  }
  let dir = 0;
  if (!panelOpen() && !fadeDir && !climbing){
    if (keys.arrowleft || keys.a || pad.l) dir -= 1;
    if (keys.arrowright || keys.d || pad.r) dir += 1;
    if (!dir && P.target !== null){
      const d = P.target - P.x;
      if (Math.abs(d) < 6){ P.target = null; if (pending){ const sp = pending; pending = null; P.face = P.x < sp.stand ? 1 : -1; sp.open(); } }
      else dir = Math.sign(d);
    }
  }
  P.vx += (dir*190 - P.vx)*Math.min(1, dt*10);
  if (!dir && Math.abs(P.vx) < 3) P.vx = 0;
  if (dir) P.face = dir;
  P.x = clamp(P.x + P.vx*dt, 50, scene === 'shop' ? COUNTER_X - 30 : scene === 'secret' ? currentSecret.max : WW - 50);
  Chin.tickAnim(P.anim, dt, Math.abs(P.vx), true);
  const want = clamp(P.x - W*.42, 0, WW - W);
  camX += (want - camX)*Math.min(1, dt*6);
  near = spotsHere().find(sp => Math.abs(P.x - sp.x) < sp.r) || null;
  if (near && near.x === CHEST_X && scene === 'mill') near.label = Save.flag('millChest') ? 'Read the note' : 'Open the old chest';
  const showPrompt = !!near && !near.hidden && !panelOpen() && !fadeDir && !climbing;
  if (shopPrompt.hidden === showPrompt){ shopPrompt.hidden = !showPrompt; }
  if (near && shopPromptName.textContent !== near.label) shopPromptName.textContent = near.label;
}
camX = clamp(P.x - W*.42, 0, WORLD - W);

// ---------- remembering where you were ----------
// your spot (realm, room and where you're standing) is saved every half second, so a refresh
// or coming back later puts you right where you left off. Mid-game, it's the spot you started from.
const PLACE_KEY = 'theShift.place';
const PLACE_NAMES = { hq:'the Portal Headquarters', tree:'The Hollow Tree', well:'The Crystal Grotto', cove:'The Boat Cove', lakecabin:'The Little Cabin', firstcabin:'the Moonlit Caf\u00e9', grandma:'Grandma Wolf’s Cottage', holiday:'the Holiday House' };
for (const id of Object.keys(HUB_ROOMS)) PLACE_NAMES['hub_' + id] = HUB_ROOMS[id].name.replace(/^(Inside|Behind|Beneath|Through) the /, 'the ');
let placeT = 0;
const secretKey = sec => Object.keys(SECRETS).find(k => SECRETS[k] === sec) || null;
function savePlace(){
  if (fadeDir || climbing) return;
  const place = { scene, x:Math.round(P.x), face:P.face, world:currentWorldId, back:worldReturn,
    secret: scene === 'secret' ? secretKey(currentSecret) : null, shop: scene === 'shop' ? SHOPS.indexOf(currentShop) : -1 };
  try { localStorage.setItem(PLACE_KEY, JSON.stringify(place)); } catch (e) {}
}
function restorePlace(){
  let pl = null;
  try { pl = JSON.parse(localStorage.getItem(PLACE_KEY)); } catch (e) {}
  if (!pl || !pl.scene) return;
  if (pl.scene === 'secret' && !SECRETS[pl.secret]) return;
  if (pl.scene === 'shop' && !SHOPS[pl.shop]) return;
  if ((pl.scene === 'world' || pl.world) && !WORLDS[pl.world]) return;
  if (pl.world && WORLDS[pl.world].alias){ if (pl.scene === 'world') pl.x += WORLDS[pl.world].off; pl.world = WORLDS[pl.world].alias; }   // saved before the worlds were joined
  if (pl.world){ currentWorld = WORLDS[pl.world]; currentWorldId = pl.world; ws = currentWorld.init(); worldReturn = pl.back || { scene:'village', x:BOARD_X }; }
  if (pl.scene === 'secret') currentSecret = SECRETS[pl.secret];
  if (pl.scene === 'shop') currentShop = SHOPS[pl.shop];
  if (pl.scene === 'meadow') meadow = newMeadowVisit();
  scene = pl.scene; P.x = pl.x; P.face = pl.face || 1;
  const ww = { mill:MILL_W, meadow:MEADOW_W, world: currentWorld ? currentWorld.w : W, shop:SHOP_W, secret:W, village:WORLD }[scene] || WORLD;
  camX = clamp(P.x - W*.42, 0, ww - W);
  const name = scene === 'world' ? currentWorld.name : scene === 'secret' ? PLACE_NAMES[pl.secret] || 'where you left off'
    : scene === 'shop' ? currentShop.name : scene === 'mill' ? 'the windmill' : scene === 'meadow' ? 'the Wildflower Meadow' : 'Thistledown';
  toast = { text:`Welcome back to ${name}!`, t:3 };
}
restorePlace();
let last = performance.now();
function loop(now){
  // the next frame is booked first, so one bad frame can never stop the game
  requestAnimationFrame(loop);
  try {
    const dt = Math.min(.033, (now - last)/1000); last = now;
    if (isActive()){
      update(dt);
      if (scene === 'meadow' && !meadow) meadow = newMeadowVisit();
      if (scene === 'meadow') updateMeadow(dt);
      if (scene === 'world') currentWorld.update(dt);
      if (scene === 'mill') drawMill(); else if (scene === 'shop') drawShopInside(); else if (scene === 'secret') currentSecret.draw(); else if (scene === 'meadow') drawMeadow(); else if (scene === 'world') drawWorld(); else draw();
      if (fadeA > 0){
        if (fadeWarp){
          // a swirl of purple rings closing in, then opening onto the other world
          ctx.fillStyle = `rgba(40,16,70,${fadeA})`; ctx.fillRect(0, 0, W, H);
          ctx.save(); ctx.translate(W/2, H/2); ctx.rotate(t*3);
          for (let i=0;i<7;i++){ ctx.strokeStyle = `rgba(200,160,255,${fadeA*(.7 - i*.08)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, 0, (1.2 - fadeA)*400 + i*40, ((1.2 - fadeA)*400 + i*40)*.6, i*.4, 0, Math.PI*1.5); ctx.stroke(); }
          ctx.restore();
        } else { ctx.fillStyle = `rgba(12,8,6,${fadeA})`; ctx.fillRect(0, 0, W, H); }
      }
      if (toast && fadeA < .5){
        toast.t -= dt; const a = Math.min(1, toast.t*2);
        ctx.globalAlpha = Math.max(0, a); ctx.font = '700 20px "Pixelify Sans", monospace'; const tw = ctx.measureText(toast.text).width + 36;
        ctx.fillStyle = 'rgba(43,33,24,.88)'; rr(W/2 - tw/2, 22, tw, 40, 10); ctx.fill(); ctx.strokeStyle = '#c9854a'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#ffe066'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(toast.text, W/2, 43); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = 1; if (toast.t <= 0) toast = null;
      }
    }
    loopErrors = 0;
  } catch (err) {
    console.error(err);
    // if something keeps going wrong every frame, get you somewhere safe instead of staying stuck
    if (++loopErrors > 30){ loopErrors = 0; try { returnToThistledown('square'); } catch (e) {} }
  }
}
let loopErrors = 0;
requestAnimationFrame(loop);
})();
