const clickSound = document.getElementById('clickSound');
const bgMusic = document.getElementById('bgMusic');

// Screen elements
const mainScreen = document.getElementById('mainScreen');
const characterScreen = document.getElementById('characterScreen');
const levelScreen = document.getElementById('levelScreen');

// Buttons
const startBtn = document.getElementById('startBtn');
const toLevelBtn = document.getElementById('toLevelBtn');
const toGameBtn = document.getElementById('toGameBtn');

document.addEventListener('DOMContentLoaded', () => {
  const characterButtons = document.querySelectorAll('.character-btn');
  const selectedDisplay = document.getElementById('selectedCharacter');
  let selectedCharacter = null;

  toLevelBtn.disabled = true;

  characterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      characterButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedCharacter = btn.dataset.character;
      selectedDisplay.textContent = `You selected: ${selectedCharacter}`;

      toLevelBtn.disabled = false;
    });
  });
});

const levelButtons = document.querySelectorAll('.level-btn');
const gameScreen = document.getElementById('gameScreen');
const gameInfo = document.getElementById('gameInfo');

levelButtons.forEach(button => {
  button.addEventListener('click', () => {
    const level = button.dataset.level;
    clickSound.currentTime = 0;
    clickSound.play();

    // Show game screen
    showScreen(gameScreen);

    // You can load different levels here
    gameInfo.textContent = `Level ${level} loaded! (Now add your game logic here)`;
  });
});

function showScreen(screen) {
  mainScreen.classList.remove('active');
  characterScreen.classList.remove('active');
  levelScreen.classList.remove('active');

  screen.classList.add('active');
}

startBtn.addEventListener('click', () => {
  // ✅ Play click sound
  clickSound.currentTime = 0;
  clickSound.play();
 bgMusic.play().catch(err => {
    console.warn("Audio play was blocked:", err);
  });
  // ✅ Show next screen
  showScreen(characterScreen);
});

toLevelBtn.addEventListener('click', () => {
  clickSound.currentTime = 0;
  clickSound.play();
  showScreen(levelScreen);
});

toGameBtn.addEventListener('click', () => {
  clickSound.currentTime = 0;
  clickSound.play();
  // Here you would start your game or redirect
  alert("Starting the game! Replace this with your game logic or page.");
});
