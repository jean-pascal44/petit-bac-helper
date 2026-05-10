const setupPanel = document.getElementById("setupPanel");
const gamePanel = document.getElementById("gamePanel");
const setupForm = document.getElementById("setupForm");
const clearStorageBtn = document.getElementById("clearStorageBtn");
const playerCountInput = document.getElementById("playerCount");
const playersFields = document.getElementById("playersFields");
const categoryCountInput = document.getElementById("categoryCount");
const difficultySelect = document.getElementById("difficulty");
const categoriesList = document.getElementById("categoriesList");
const newRoundBtn = document.getElementById("newRoundBtn");
const editSetupBtn = document.getElementById("editSetupBtn");
const letterDisplay = document.getElementById("letterDisplay");
const startLetterBtn = document.getElementById("startLetterBtn");
const stopLetterBtn = document.getElementById("stopLetterBtn");
const durationPreset = document.getElementById("durationPreset");
const minutesInput = document.getElementById("minutesInput");
const secondsInput = document.getElementById("secondsInput");
const applyDurationBtn = document.getElementById("applyDurationBtn");
const timeReadout = document.getElementById("timeReadout");
const startTimerBtn = document.getElementById("startTimerBtn");
const pauseTimerBtn = document.getElementById("pauseTimerBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");
const resetScoresBtn = document.getElementById("resetScoresBtn");
const scoreBoard = document.getElementById("scoreBoard");
const vesselLiquid = document.getElementById("vesselLiquid");
const timerVessel = document.getElementById("timerVessel");
const confirmModal = document.getElementById("confirmModal");
const confirmModalTitle = document.getElementById("confirmModalTitle");
const confirmModalMessage = document.getElementById("confirmModalMessage");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");
const confirmAcceptBtn = document.getElementById("confirmAcceptBtn");

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const categoriesByDifficulty = {
  1: [
    "Prenom",
    "Ville",
    "Pays",
    "Animal",
    "Couleur",
    "Fruit",
    "Legume",
    "Metier",
    "Objet de la maison",
    "Marque connue",
    "Sport",
    "Musique ou groupe",
    "Film",
    "Serie TV",
    "Boisson",
    "Fleur"
  ],
  2: [
    "Personnage historique",
    "Element de cuisine",
    "Type de danse",
    "Montagne",
    "Matiere scolaire",
    "Verbe d'action",
    "Emotion",
    "Vehicule",
    "Outil",
    "Plante aromatique",
    "Monument",
    "Jeu video",
    "Paysage naturel",
    "Insecte",
    "Marque de vetement",
    "Type de livre"
  ],
  3: [
    "Concept philosophique",
    "Terme scientifique",
    "Auteur litteraire",
    "Mouvement artistique",
    "Capitale peu connue",
    "Materiau industriel",
    "Instrument traditionnel",
    "Constellation",
    "Personnage mythologique",
    "Courant musical niche",
    "Peintre celebre",
    "Chef cuisinier connu",
    "Element chimique",
    "Titre de poeme",
    "Region viticole",
    "Explorateur celebre"
  ]
};

let gameState = {
  players: [],
  difficulty: 1,
  categoryCount: 5,
  scores: {},
  selectedCategories: [],
  usedLetters: []
};

let letterInterval = null;
let timerInterval = null;
let isTimerRunning = false;
let timerDuration = 60;
let timeLeft = timerDuration;
let warningSongInterval = null;
let audioContext = null;
let letterShuffleSoundInterval = null;
const STORAGE_KEY = "petit-bac-helper-state-v1";
let resolveConfirmModal = null;

function createPlayerInputs(prefilledNames = []) {
  const count = Math.max(1, parseInt(playerCountInput.value || "1", 10));
  playersFields.innerHTML = "";

  for (let i = 1; i <= count; i += 1) {
    const wrapper = document.createElement("div");
    const label = document.createElement("label");
    label.setAttribute("for", `player-${i}`);
    label.textContent = `Nom du joueur ${i}`;

    const input = document.createElement("input");
    input.id = `player-${i}`;
    input.type = "text";
    input.maxLength = 30;
    input.required = true;
    input.value = prefilledNames[i - 1] || `Joueur ${i}`;

    wrapper.append(label, input);
    playersFields.appendChild(wrapper);
  }
}

function pickCategories() {
  const difficulty = String(gameState.difficulty);
  const pool = [...categoriesByDifficulty[difficulty]];
  const wanted = Math.max(3, gameState.categoryCount);
  const picked = [];

  while (pool.length && picked.length < wanted) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }

  if (picked.length < wanted) {
    const extraPools = Object.values(categoriesByDifficulty).flat();
    while (picked.length < wanted) {
      const fallback = extraPools[Math.floor(Math.random() * extraPools.length)];
      if (!picked.includes(fallback)) {
        picked.push(fallback);
      }
    }
  }

  gameState.selectedCategories = picked;
  categoriesList.innerHTML = picked.map((cat) => `<li>${cat}</li>`).join("");
}

function renderScoreboard() {
  scoreBoard.innerHTML = "";

  gameState.players.forEach((name) => {
    const card = document.createElement("div");
    card.className = "player-score";
    card.innerHTML = `
      <strong>${name}</strong>
      <div>Points: <span id="score-${cssSafeId(name)}">${gameState.scores[name]}</span></div>
      <div class="score-controls">
        <button class="btn ghost" data-name="${name}" data-delta="-1">-</button>
        <button class="btn ghost" data-name="${name}" data-delta="1">+</button>
      </div>
    `;
    scoreBoard.appendChild(card);
  });
}

function cssSafeId(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function initAudio() {
  if (!audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    audioContext = Context ? new Context() : null;
  }
}

function playMelodyStep() {
  if (!audioContext || timeLeft > 15 || timeLeft <= 0) return;
  const start = audioContext.currentTime;
  const notes = [659.25, 587.33, 523.25, 587.33];
  notes.forEach((freq, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start + i * 0.2);
    gain.gain.exponentialRampToValueAtTime(0.12, start + i * 0.2 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + i * 0.2 + 0.18);
    osc.connect(gain).connect(audioContext.destination);
    osc.start(start + i * 0.2);
    osc.stop(start + i * 0.2 + 0.2);
  });
}

function startWarningMelodyLoop() {
  if (warningSongInterval || timeLeft > 15 || timeLeft <= 0) return;
  playMelodyStep();
  warningSongInterval = setInterval(() => {
    playMelodyStep();
  }, 800);
}

function stopWarningMelodyLoop() {
  clearInterval(warningSongInterval);
  warningSongInterval = null;
}

function playGongSound() {
  if (!audioContext) return;
  const duration = 2.6;
  const sampleRate = audioContext.sampleRate;
  const bufferSize = sampleRate * duration;
  const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    const t = i / sampleRate;
    const decay = Math.exp(-t * 1.4);
    const tone = Math.sin(2 * Math.PI * 180 * t) + 0.6 * Math.sin(2 * Math.PI * 240 * t);
    const shimmer = (Math.random() * 2 - 1) * 0.2;
    data[i] = (tone + shimmer) * decay * 0.45;
  }

  const src = audioContext.createBufferSource();
  src.buffer = buffer;
  const lowPass = audioContext.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = 1300;

  const gain = audioContext.createGain();
  gain.gain.value = 0.65;

  src.connect(lowPass).connect(gain).connect(audioContext.destination);
  src.start();
}

function playLetterShuffleStep() {
  if (!audioContext) return;
  const now = audioContext.currentTime;

  const noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * 0.08), audioContext.sampleRate);
  const channel = noiseBuffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) {
    channel[i] = (Math.random() * 2 - 1) * 0.45;
  }

  const source = audioContext.createBufferSource();
  source.buffer = noiseBuffer;

  const bandpass = audioContext.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.setValueAtTime(1700, now);
  bandpass.Q.value = 1.4;

  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

  source.connect(bandpass).connect(gain).connect(audioContext.destination);
  source.start(now);
  source.stop(now + 0.09);
}

function startLetterShuffleSoundLoop() {
  if (!audioContext || letterShuffleSoundInterval) return;
  playLetterShuffleStep();
  letterShuffleSoundInterval = setInterval(() => {
    playLetterShuffleStep();
  }, 95);
}

function stopLetterShuffleSoundLoop() {
  clearInterval(letterShuffleSoundInterval);
  letterShuffleSoundInterval = null;
}

function launchLetterShuffle() {
  if (letterInterval) return;
  const available = letters.filter((letter) => !gameState.usedLetters.includes(letter));
  if (available.length === 0) return;
  initAudio();
  if (audioContext?.state === "suspended") {
    audioContext.resume();
  }
  startLetterShuffleSoundLoop();

  letterInterval = setInterval(() => {
    const pool = letters.filter((letter) => !gameState.usedLetters.includes(letter));
    if (pool.length === 0) return;
    const randomLetter = pool[Math.floor(Math.random() * pool.length)];
    letterDisplay.textContent = randomLetter.toUpperCase();
  }, 62);
}

function stopLetterShuffle(finalize = true) {
  clearInterval(letterInterval);
  letterInterval = null;
  stopLetterShuffleSoundLoop();
  if (!finalize) return;

  const currentLetter = String(letterDisplay.textContent || "").trim().toUpperCase();
  if (!letters.includes(currentLetter)) return;
  if (gameState.usedLetters.includes(currentLetter)) return;

  gameState.usedLetters.push(currentLetter);
  persistState();
}

function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function updateVesselFill() {
  const ratio = timerDuration > 0 ? 1 - timeLeft / timerDuration : 1;
  vesselLiquid.style.height = `${Math.min(100, Math.max(0, ratio * 100))}%`;
}

function refreshTimerUI() {
  timeReadout.textContent = formatTime(timeLeft);
  updateVesselFill();
}

function startTimer() {
  if (isTimerRunning || timeLeft <= 0) return;
  initAudio();
  if (audioContext?.state === "suspended") {
    audioContext.resume();
  }
  isTimerRunning = true;
  timerVessel.classList.add("flowing");

  timerInterval = setInterval(() => {
    timeLeft = Math.max(0, timeLeft - 1);
    refreshTimerUI();

    if (timeLeft <= 15 && timeLeft > 0) {
      startWarningMelodyLoop();
    }

    if (timeLeft === 0) {
      stopTimer();
      playGongSound();
    }
  }, 1000);
}

function stopTimer() {
  isTimerRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  stopWarningMelodyLoop();
  timerVessel.classList.remove("flowing");
}

function setDuration(seconds, options = {}) {
  const { persist = true } = options;
  timerDuration = Math.max(5, seconds);
  timeLeft = timerDuration;
  stopTimer();
  refreshTimerUI();
  if (persist) {
    persistState();
  }
}

function updateScore(name, delta) {
  gameState.scores[name] += delta;
  const scoreSpan = document.getElementById(`score-${cssSafeId(name)}`);
  scoreSpan.textContent = String(gameState.scores[name]);
  persistState();
}

function getPersistedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistState() {
  const payload = {
    difficulty: gameState.difficulty,
    categoryCount: gameState.categoryCount,
    players: gameState.players,
    scores: gameState.scores,
    selectedCategories: gameState.selectedCategories,
    usedLetters: gameState.usedLetters,
    timerDuration
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function askConfirmation(message, title = "Confirmation") {
  if (!confirmModal || !confirmModalMessage || !confirmModalTitle) {
    return Promise.resolve(false);
  }

  if (resolveConfirmModal) {
    resolveConfirmModal(false);
    resolveConfirmModal = null;
  }

  confirmModalTitle.textContent = title;
  confirmModalMessage.textContent = message;
  confirmModal.classList.add("open");
  confirmModal.setAttribute("aria-hidden", "false");

  return new Promise((resolve) => {
    resolveConfirmModal = resolve;
    confirmAcceptBtn.focus();
  });
}

function closeConfirmModal(accepted) {
  if (!resolveConfirmModal) return;
  const resolver = resolveConfirmModal;
  resolveConfirmModal = null;
  confirmModal.classList.remove("open");
  confirmModal.setAttribute("aria-hidden", "true");
  resolver(accepted);
}

function hydrateFromStorage() {
  const saved = getPersistedState();
  if (!saved) return;

  const safePlayers = Array.isArray(saved.players) ? saved.players.filter(Boolean) : [];
  const safeScores = saved.scores && typeof saved.scores === "object" ? saved.scores : {};
  const safeUsedLetters = Array.isArray(saved.usedLetters)
    ? saved.usedLetters
        .map((letter) => String(letter || "").toUpperCase())
        .filter((letter) => letters.includes(letter))
    : [];
  const safeDifficulty = [1, 2, 3].includes(saved.difficulty) ? saved.difficulty : 1;
  const safeCategoryCount = Math.max(3, Number(saved.categoryCount) || 5);
  const safeDuration = Math.max(5, Number(saved.timerDuration) || 60);

  difficultySelect.value = String(safeDifficulty);
  categoryCountInput.value = String(safeCategoryCount);
  playerCountInput.value = String(Math.max(1, safePlayers.length || 2));
  createPlayerInputs(safePlayers);

  gameState.difficulty = safeDifficulty;
  gameState.categoryCount = safeCategoryCount;
  gameState.players = safePlayers;
  gameState.scores = Object.fromEntries(
    safePlayers.map((name) => [name, Number(safeScores[name] ?? 0)])
  );
  gameState.selectedCategories = Array.isArray(saved.selectedCategories) ? saved.selectedCategories : [];
  gameState.usedLetters = [...new Set(safeUsedLetters)];

  setDuration(safeDuration, { persist: false });
  durationPreset.value = String(safeDuration);
  minutesInput.value = String(Math.floor(safeDuration / 60));
  secondsInput.value = String(safeDuration % 60);

  if (gameState.players.length > 0) {
    categoriesList.innerHTML = gameState.selectedCategories
      .map((cat) => `<li>${cat}</li>`)
      .join("");
    renderScoreboard();
    setupPanel.classList.remove("active");
    gamePanel.classList.add("active");
  }
}

async function clearSavedGame() {
  const confirmed = await askConfirmation(
    "Effacer la sauvegarde locale et remettre la partie a zero ?",
    "Effacer la sauvegarde"
  );
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  stopTimer();
  stopLetterShuffle(false);
  gameState = {
    players: [],
    difficulty: 1,
    categoryCount: 5,
    scores: {},
    selectedCategories: [],
    usedLetters: []
  };
  difficultySelect.value = "1";
  categoryCountInput.value = "5";
  playerCountInput.value = "2";
  createPlayerInputs();
  categoriesList.innerHTML = "";
  scoreBoard.innerHTML = "";
  durationPreset.value = "60";
  minutesInput.value = "1";
  secondsInput.value = "0";
  setDuration(60);
  letterDisplay.textContent = "A";
  gamePanel.classList.remove("active");
  setupPanel.classList.add("active");
}

async function resetScores() {
  if (gameState.players.length === 0) return;
  const confirmed = await askConfirmation(
    "Remettre tous les scores a zero ?",
    "Reinitialiser les scores"
  );
  if (!confirmed) return;

  gameState.scores = Object.fromEntries(gameState.players.map((name) => [name, 0]));
  gameState.usedLetters = [];
  stopLetterShuffle(false);
  letterDisplay.textContent = "A";
  renderScoreboard();
  persistState();
}

playerCountInput.addEventListener("change", createPlayerInputs);
playerCountInput.addEventListener("input", createPlayerInputs);

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  initAudio();

  const difficulty = parseInt(difficultySelect.value, 10);
  const categoryCount = Math.max(3, parseInt(categoryCountInput.value, 10) || 3);
  const playerNames = [...playersFields.querySelectorAll("input")]
    .map((input) => input.value.trim())
    .filter(Boolean);

  if (playerNames.length === 0) return;

  const previousScores = gameState.scores || {};
  gameState = {
    ...gameState,
    difficulty,
    categoryCount,
    players: playerNames,
    usedLetters: [],
    // Keep known scores for unchanged names, initialize only new players.
    scores: Object.fromEntries(
      playerNames.map((name) => [name, Number(previousScores[name] ?? 0)])
    )
  };

  pickCategories();
  renderScoreboard();
  persistState();
  setupPanel.classList.remove("active");
  gamePanel.classList.add("active");
});

newRoundBtn.addEventListener("click", () => {
  const available = letters.filter((letter) => !gameState.usedLetters.includes(letter));
  if (available.length === 0) {
    stopLetterShuffle(false);
    return;
  }

  pickCategories();
  persistState();
  setDuration(timerDuration);
  launchLetterShuffle();
  setTimeout(() => stopLetterShuffle(true), 1300);
});

editSetupBtn.addEventListener("click", () => {
  stopTimer();
  stopLetterShuffle(false);
  persistState();
  gamePanel.classList.remove("active");
  setupPanel.classList.add("active");
});

startLetterBtn.addEventListener("click", launchLetterShuffle);
stopLetterBtn.addEventListener("click", () => stopLetterShuffle(true));

durationPreset.addEventListener("change", () => {
  const sec = parseInt(durationPreset.value, 10);
  minutesInput.value = String(Math.floor(sec / 60));
  secondsInput.value = String(sec % 60);
  setDuration(sec);
});

applyDurationBtn.addEventListener("click", () => {
  const minutes = parseInt(minutesInput.value, 10) || 0;
  const seconds = parseInt(secondsInput.value, 10) || 0;
  const total = Math.max(5, minutes * 60 + Math.min(59, Math.max(0, seconds)));
  setDuration(total);
});

startTimerBtn.addEventListener("click", startTimer);
pauseTimerBtn.addEventListener("click", stopTimer);
resetTimerBtn.addEventListener("click", () => setDuration(timerDuration));

scoreBoard.addEventListener("click", (event) => {
  const btn = event.target.closest("button[data-name][data-delta]");
  if (!btn) return;
  updateScore(btn.dataset.name, Number(btn.dataset.delta));
});
clearStorageBtn.addEventListener("click", clearSavedGame);
resetScoresBtn.addEventListener("click", resetScores);
confirmCancelBtn.addEventListener("click", () => closeConfirmModal(false));
confirmAcceptBtn.addEventListener("click", () => closeConfirmModal(true));
confirmModal.addEventListener("click", (event) => {
  if (event.target === confirmModal) {
    closeConfirmModal(false);
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && confirmModal.classList.contains("open")) {
    closeConfirmModal(false);
  }
});

createPlayerInputs();
setDuration(timerDuration, { persist: false });
hydrateFromStorage();
