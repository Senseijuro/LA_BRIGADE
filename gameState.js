// ==========================================
// GAME STATE MANAGER
// Fonctions partagées entre toutes les pages
// ==========================================

var STORAGE_KEY = 'destinationApprentissage';

var defaultState = {
  enigme1: { completed: null },  // Épreuve 1 : Les Indices du Saboteur
  quiz: { completed: null, score: 0 },  // Épreuve 2 : Quiz BTP
  enigma: { completed: null }  // Épreuve 3 : Les Gardiens du Chantier
};

function getGameState() {
  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      var parsed = JSON.parse(saved);
      // Fusionner avec les valeurs par défaut pour les nouvelles propriétés
      return {
        enigme1: parsed.enigme1 || { completed: null },
        quiz: parsed.quiz || { completed: null, score: 0 },
        enigma: parsed.enigma || { completed: null }
      };
    } catch (e) {
      return JSON.parse(JSON.stringify(defaultState));
    }
  }
  return JSON.parse(JSON.stringify(defaultState));
}

function saveGameState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetGameState() {
  localStorage.removeItem(STORAGE_KEY);
}

function formatTime(seconds) {
  var min = Math.floor(seconds / 60);
  var sec = seconds % 60;
  return {
    min: min.toString().padStart(2, '0'),
    sec: sec.toString().padStart(2, '0')
  };
}

function updateTimerDisplay(minEl, secEl, timeLeft) {
  var time = formatTime(timeLeft);
  if (minEl) minEl.textContent = time.min;
  if (secEl) secEl.textContent = time.sec;
}
