const PUZZLE_PHRASE = "CAN YOU PLEASE BE MY VALENTINE THIS YEAR MY AMAZING SARMS?";
const VOWEL_COST = 250;
const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

// Wheel segments (order matches conic-gradient: 0-36deg, 36-72deg, ... 324-360deg)
const WHEEL_SEGMENTS = [
  { label: '$50', value: 50 },
  { label: '$100', value: 100 },
  { label: '$150', value: 150 },
  { label: '$200', value: 200 },
  { label: '$250', value: 250 },
  { label: '$300', value: 300 },
  { label: '$750', value: 750 },
  { label: 'Bankrupt', value: 'bankrupt' },
  { label: 'Lose Turn', value: 'lose_turn' },
  { label: '$100', value: 100 },
];

const LEADERBOARD_NAMES = [
  'Diya', 'Nimai', 'Praneel', 'Thrisha', 'Vaish', 'Natania', 'Ria',
  'Will', 'Felix', 'Purvit', 'Jaysukh', 'Kritanko', 'Andy', 'Stephen',
  'Arjun', 'Kavya', 'Rohan', 'Ananya',
];

function generateLeaderboard() {
  const shuffled = [...LEADERBOARD_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.map(name => ({
    name,
    score: (Math.floor(Math.random() * 241) + 60) * 50,
    turns: Math.floor(Math.random() * (20 - 8 + 1) + 8),
  }));
}

const screens = {
  landing: document.getElementById('landing'),
  nameEntry: document.getElementById('name-entry'),
  game: document.getElementById('game'),
};

const elements = {
  leaderboardBtn: document.getElementById('leaderboard-btn'),
  gameLeaderboardBtn: document.getElementById('game-leaderboard-btn'),
  leaderboardOverlay: document.getElementById('leaderboard-overlay'),
  leaderboardBody: document.getElementById('leaderboard-body'),
  leaderboardCloseBtn: document.getElementById('leaderboard-close-btn'),
  startBtn: document.getElementById('start-btn'),
  nameForm: document.getElementById('name-form'),
  nameInput: document.getElementById('name-input'),
  nameError: document.getElementById('name-error'),
  greeting: document.getElementById('greeting'),
  scoreDisplay: document.getElementById('score'),
  turnCounterDisplay: document.getElementById('turn-counter'),
  puzzleDisplay: document.getElementById('puzzle-display'),
  messageArea: document.getElementById('message-area'),
  wheel: document.getElementById('wheel'),
  spinBtn: document.getElementById('spin-btn'),
  wheelValueDisplay: document.getElementById('wheel-value'),
  letterGrid: document.getElementById('letter-grid'),
  winOverlay: document.getElementById('win-overlay'),
  winMessage: document.getElementById('win-message'),
  playAgainBtn: document.getElementById('play-again-btn'),
};

let state = {
  playerName: '',
  revealedLetters: new Set(),
  score: 0,
  gameOver: false,
  currentWheelValue: null,
  spinning: false,
  wheelRotation: 0,
  turnCount: 0,
};

function showScreen(screenId) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[screenId].classList.add('active');
}

function isVowel(letter) {
  return VOWELS.has(letter.toUpperCase());
}

function getDisplayPhrase() {
  return PUZZLE_PHRASE.split('').map(char => {
    if (char === ' ') return { type: 'space', char: ' ' };
    if (/[^A-Za-z]/.test(char)) return { type: 'visible', char };
    return {
      type: state.revealedLetters.has(char.toUpperCase()) ? 'letter' : 'blank',
      char: char.toUpperCase(),
    };
  });
}

function renderPuzzle() {
  const display = getDisplayPhrase();
  elements.puzzleDisplay.innerHTML = display
    .map(({ type, char }) => {
      if (type === 'space') return '<span class="puzzle-space"></span>';
      if (type === 'visible') return `<span class="puzzle-box puzzle-punctuation">${char}</span>`;
      if (type === 'letter') return `<span class="puzzle-box puzzle-filled">${char}</span>`;
      return '<span class="puzzle-box puzzle-empty"></span>';
    })
    .join('');
}

function checkWin() {
  const allRevealed = PUZZLE_PHRASE.split('').every(char => {
    if (char === ' ' || /[^A-Za-z]/.test(char)) return true;
    return state.revealedLetters.has(char.toUpperCase());
  });
  if (allRevealed) {
    state.gameOver = true;
    showWin();
  }
}

function showWin() {
  elements.winMessage.textContent = `You solved it, ${state.playerName}! Great job!`;
  elements.winOverlay.classList.remove('hidden');
}

function showMessage(text, isError = false) {
  elements.messageArea.textContent = text;
  elements.messageArea.classList.toggle('error', isError);
}

const SEGMENT_DEGREES = 360 / WHEEL_SEGMENTS.length;

function getSegmentFromRotation(rotation) {
  // The wheel rotates clockwise by `rotation` degrees, so the segment
  // under the pointer (top) is at angle (360 - rotation%360) in the
  // original conic-gradient coordinate system.
  const normalized = ((360 - (rotation % 360)) % 360 + 360) % 360;
  const segmentIndex = Math.floor(normalized / SEGMENT_DEGREES) % WHEEL_SEGMENTS.length;
  return WHEEL_SEGMENTS[segmentIndex];
}

function spinWheel() {
  if (state.spinning || state.gameOver) return;

  state.spinning = true;
  elements.spinBtn.disabled = true;
  elements.wheel.classList.add('spinning');

  const fullSpins = 5 + Math.floor(Math.random() * 3);
  const targetSegment = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
  const segmentAngle = targetSegment * SEGMENT_DEGREES + SEGMENT_DEGREES / 2;
  const totalRotation = state.wheelRotation + fullSpins * 360 + (360 - segmentAngle);
  state.wheelRotation = totalRotation;

  elements.wheel.style.transition = 'transform 4s cubic-bezier(0.2, 0.8, 0.2, 1)';
  elements.wheel.style.transform = `rotate(${totalRotation}deg)`;

  setTimeout(() => {
    state.spinning = false;
    elements.wheel.classList.remove('spinning');
    elements.wheel.style.transition = '';

    const result = getSegmentFromRotation(totalRotation);
    state.currentWheelValue = result.value;

    if (result.value === 'bankrupt') {
      state.score = 0;
      state.currentWheelValue = null;
      state.turnCount += 1;
      elements.scoreDisplay.textContent = '0';
      elements.turnCounterDisplay.textContent = state.turnCount;
      showMessage('Bankrupt! You lost all your money. Spin again!', true);
    } else if (result.value === 'lose_turn') {
      state.currentWheelValue = null;
      state.turnCount += 1;
      elements.turnCounterDisplay.textContent = state.turnCount;
      showMessage('Lose a turn! Spin again.', true);
    } else {
      elements.wheelValueDisplay.textContent = result.label;
      showMessage(`You landed on ${result.label}! Guess a consonant.`);
    }

    elements.spinBtn.disabled = false;
    updateLetterButtons();
  }, 4000);
}

function createLetterButtons() {
  elements.letterGrid.innerHTML = '';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  letters.forEach(letter => {
    const btn = document.createElement('button');
    btn.className = 'letter-btn' + (isVowel(letter) ? ' vowel' : '');
    btn.textContent = letter;
    btn.dataset.letter = letter;

    if (state.revealedLetters.has(letter)) {
      btn.disabled = true;
    } else if (isVowel(letter) && state.score < VOWEL_COST) {
      btn.classList.add('disabled-funds');
      btn.disabled = true;
    } else if (!isVowel(letter) && (state.spinning || state.currentWheelValue === null || typeof state.currentWheelValue !== 'number')) {
      btn.disabled = true;
    }

    btn.addEventListener('click', () => guessLetter(letter));
    elements.letterGrid.appendChild(btn);
  });
}

function updateLetterButtons() {
  const btns = elements.letterGrid.querySelectorAll('.letter-btn');
  const canGuessConsonant = !state.spinning && typeof state.currentWheelValue === 'number';
  btns.forEach(btn => {
    const letter = btn.dataset.letter;
    if (state.revealedLetters.has(letter)) {
      btn.disabled = true;
      btn.classList.remove('disabled-funds');
    } else if (isVowel(letter) && state.score < VOWEL_COST) {
      btn.disabled = true;
      btn.classList.add('disabled-funds');
    } else if (!isVowel(letter)) {
      btn.disabled = !canGuessConsonant;
    } else {
      btn.disabled = false;
      btn.classList.remove('disabled-funds');
    }
  });
}

function guessLetter(letter) {
  if (state.gameOver) return;

  const upper = letter.toUpperCase();
  if (state.revealedLetters.has(upper)) return;

  if (isVowel(upper)) {
    if (state.score < VOWEL_COST) return;
    state.score -= VOWEL_COST;
  } else {
    if (typeof state.currentWheelValue !== 'number') return;
  }

  state.revealedLetters.add(upper);
  state.turnCount += 1;
  elements.turnCounterDisplay.textContent = state.turnCount;

  if (PUZZLE_PHRASE.toUpperCase().includes(upper)) {
    const regex = new RegExp(upper, 'g');
    const count = (PUZZLE_PHRASE.toUpperCase().match(regex) || []).length;
    const amount = isVowel(upper) ? 0 : state.currentWheelValue * count;
    if (!isVowel(upper)) state.score += amount;
    showMessage(`Correct! ${upper} appears ${count} time(s). +$${amount}`);
    state.currentWheelValue = null;
    elements.wheelValueDisplay.textContent = 'Spin to guess!';
  } else {
    showMessage(`Sorry, no ${upper}. Spin again!`, true);
    state.currentWheelValue = null;
    elements.wheelValueDisplay.textContent = 'Spin to guess!';
  }

  elements.scoreDisplay.textContent = state.score;
  renderPuzzle();
  updateLetterButtons();
  checkWin();
}

function resetGame() {
  state.revealedLetters = new Set();
  state.score = 0;
  state.gameOver = false;
  state.currentWheelValue = null;
  state.spinning = false;
  state.wheelRotation = 0;
  state.turnCount = 0;
  elements.turnCounterDisplay.textContent = '0';
  elements.winOverlay.classList.add('hidden');
  showMessage('');
  elements.scoreDisplay.textContent = '0';
  elements.wheelValueDisplay.textContent = 'Spin to guess!';
  elements.wheel.style.transform = 'rotate(0deg)';
  elements.spinBtn.disabled = false;
  createLetterButtons();
  renderPuzzle();
}

function renderLeaderboard() {
  const data = generateLeaderboard().sort((a, b) => b.score - a.score);
  elements.leaderboardBody.innerHTML = data
    .map((entry, i) =>
      `<tr><td>${i + 1}</td><td>${entry.name}</td><td>$${entry.score.toLocaleString()}</td><td>${entry.turns}</td></tr>`
    )
    .join('');
}

function init() {
  function openLeaderboard() {
    renderLeaderboard();
    elements.leaderboardOverlay.classList.remove('hidden');
  }

  elements.leaderboardBtn.addEventListener('click', openLeaderboard);
  elements.gameLeaderboardBtn.addEventListener('click', openLeaderboard);

  elements.leaderboardCloseBtn.addEventListener('click', () => {
    elements.leaderboardOverlay.classList.add('hidden');
  });

  elements.startBtn.addEventListener('click', () => {
    showScreen('nameEntry');
    elements.nameInput.focus();
  });

  elements.nameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = elements.nameInput.value.trim();
    if (!name) {
      elements.nameError.textContent = 'Please enter your name';
      return;
    }
    elements.nameError.textContent = '';
    state.playerName = name;
    elements.greeting.textContent = `Hello, ${name}!`;
    showScreen('game');
    resetGame();
  });

  elements.playAgainBtn.addEventListener('click', () => {
    resetGame();
  });

  elements.spinBtn.addEventListener('click', spinWheel);

  renderPuzzle();
  createLetterButtons();
}

init();
