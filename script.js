// Seeds and shop items, kept in this project's own browser storage
const Save = (() => {
  const KEY = 'theShift.save';
  let data = { seeds: 25, items: {}, flags: {}, tallies: {} };
  try { const raw = localStorage.getItem(KEY); if (raw) data = Object.assign(data, JSON.parse(raw)); } catch (e) {}
  const listeners = [];
  function changed() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    listeners.forEach(f => f());
  }
  return {
    seeds: () => data.seeds,
    addSeeds(n) { if (n > 0) { data.seeds += n; changed(); } },
    spend(n) { if (data.seeds < n) return false; data.seeds -= n; changed(); return true; },
    count: id => data.items[id] || 0,
    items: () => ({ ...data.items }),
    give(id) { data.items[id] = (data.items[id] || 0) + 1; changed(); },
    use(id) { if (!data.items[id]) return false; data.items[id]--; changed(); return true; },
    flag: id => !!data.flags[id],
    setFlag(id) { data.flags[id] = true; changed(); },
    // counters, like how many times each game has been won
    tally: id => (data.tallies || {})[id] || 0,
    addTally(id) { data.tallies = data.tallies || {}; data.tallies[id] = (data.tallies[id] || 0) + 1; changed(); },
    onChange(f) { listeners.push(f); }
  };
})();

const clickSound = document.getElementById('clickSound');
const bgMusic = document.getElementById('bgMusic');       // the home screen (and anywhere without its own song)
const gameMusic = document.getElementById('gameMusic');   // the game song, while playing a game
const climbMusic = document.getElementById('climbMusic'); // Climbing - The Shift, for Hoverboard
const homeMusic = document.getElementById('homeMusic');   // Take Me Home, for the café and tennis
const lakeMusic = document.getElementById('lakeMusic');   // Turn Back, while exploring the Moonlit Lake
const vineMusic = document.getElementById('vineMusic');   // Otherside, for Vine Swing in the Golden Jungle
const jungleMusic = document.getElementById('jungleMusic'); // Heart and Soul, while exploring the Golden Jungle
const villageMusic = document.getElementById('villageMusic'); // Out of My Head, while exploring Thistledown
const cityMusic = document.getElementById('cityMusic');     // Calling..., while exploring Neon City
const skiMusic = document.getElementById('skiMusic');       // Dragonfly High, for Moonlight Slalom
const raceMusic = document.getElementById('raceMusic');     // Don't Mess With A Spy, for the Neon Grand Prix
const westernMusic = document.getElementById('westernMusic'); // Turn Back, for the Outlaws of the West
const filmMusic = document.getElementById('filmMusic'); // Turn Back, for the Outlaws of the West
const coralMusic = document.getElementById('coralMusic'); // Heart and Soul, for the Coral Reef
const outlawMusic = document.getElementById('outlawMusic'); // Don't Mess With A Spy, for the Outlaws of the West
// worlds with their own song while you explore them
const REALM_SONGS = { thistledown: villageMusic, moonlake: lakeMusic, jungle: jungleMusic, city: cityMusic, west: westernMusic, silentfilm: filmMusic, sea: coralMusic, };

// Screen elements
const mainScreen = document.getElementById('mainScreen');
const gameScreen = document.getElementById('gameScreen');
const villageScreen = document.getElementById('villageScreen');
const balloonScreen = document.getElementById('balloonScreen');
const boatScreen = document.getElementById('boatScreen');

// Buttons
const startBtn = document.getElementById('startBtn');
const villageHomeBtn = document.getElementById('villageHomeBtn');
const soundBtn = document.getElementById('soundBtn');
const toVillageBtn = document.getElementById('toVillageBtn');

// Music on/off is remembered between visits
const SOUND_KEY = 'theShift.musicOn';
let musicOn = true;
try { musicOn = localStorage.getItem(SOUND_KEY) !== 'false'; } catch (e) {}

const ALL_SONGS = [bgMusic, gameMusic, climbMusic, homeMusic, lakeMusic, vineMusic, jungleMusic, villageMusic, cityMusic, skiMusic, raceMusic, westernMusic, filmMusic, coralMusic];
function renderSound() {
  soundBtn.textContent = musicOn ? 'Music: On' : 'Music: Off';
  soundBtn.setAttribute('aria-pressed', String(musicOn));
  for (const a of ALL_SONGS) a.muted = !musicOn;
}
renderSound();

soundBtn.addEventListener('click', () => {
  musicOn = !musicOn;
  try { localStorage.setItem(SOUND_KEY, String(musicOn)); } catch (e) {}
  renderSound();
  if (musicOn) startMusic();
  playClick();
});

function playClick() {
  clickSound.currentTime = 0;
  clickSound.play().catch(() => {});
}

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  screen.classList.add('active');
  // every game starts its song from the beginning; the home screen and worlds just carry on
  if (musicStarted) startMusic(screen !== mainScreen && screen !== villageScreen);
}

// games play the game song, except the world games listed here; everywhere else plays the main theme
const WORLD_GAME_SONGS = { nebula: climbMusic, cafe: homeMusic, moonlake: homeMusic, jungle: vineMusic, ski: skiMusic, race: raceMusic, outlaws: raceMusic, ghosthotel: raceMusic, silentfilm: filmMusic, outlaws: outlawMusic };
let musicStarted = false;
function currentTrack() {
  const worldGame = document.getElementById('worldGameScreen');
  if (worldGame.classList.contains('active') && WORLD_GAME_SONGS[worldGame.dataset.game]) return WORLD_GAME_SONGS[worldGame.dataset.game];
  const playing = [gameScreen, balloonScreen, boatScreen, worldGame].some(s => s && s.classList.contains('active'));
  if (playing) return gameMusic;
  // exploring a world that has its own song
  const realm = villageScreen.classList.contains('active') && window.realmNow ? window.realmNow() : null;
  return REALM_SONGS[realm] || bgMusic;
}
function startMusic(fromTheTop) {
  musicStarted = true;
  const track = currentTrack();
  for (const a of ALL_SONGS) if (a !== track) a.pause();
  if (fromTheTop) { try { track.currentTime = 0; } catch (e) {} }   // (a song that hasn't downloaded yet just starts at the top anyway)
  if (musicOn) {
    track.play().catch(err => {
      console.warn("Audio play was blocked:", err);
    });
  }
}

// the village is the hub; quests (levels) start from its Quest Board
startBtn.addEventListener('click', () => {
  playClick();
  startMusic();
  showScreen(villageScreen);
});

villageHomeBtn.addEventListener('click', () => {
  playClick();
  showScreen(mainScreen);
});

toVillageBtn.addEventListener('click', () => {
  playClick();
  showScreen(villageScreen);
});

// called by the Quest Board; only level 1 exists so far
function startLevel(level) {
  playClick();
  showScreen(gameScreen);
}

// the windmill's secret: the rope ladder and the Quest Board both lead here
function startBalloon() {
  playClick();
  showScreen(balloonScreen);
}

// the boat under the bridge leads here
function startBoat() {
  playClick();
  showScreen(boatScreen);
}
