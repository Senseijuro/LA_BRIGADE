document.addEventListener('DOMContentLoaded', function() {
  var state      = getGameState();
  var locked     = document.getElementById('locked');
  var gameArea   = document.getElementById('game-area');
  var resultDiv  = document.getElementById('result');
  var phaseEl    = document.getElementById('seq-phase');
  var livesEl    = document.getElementById('seq-lives');
  var memoZone   = document.getElementById('memo-zone');
  var answerZone = document.getElementById('answer-zone');
  var stepsDisp  = document.getElementById('seq-steps-display');
  var countdownEl = document.getElementById('seq-countdown');
  var dropZone   = document.getElementById('seq-drop-zone');
  var choicesPool = document.getElementById('seq-choices-pool');
  var feedbackEl = document.getElementById('seq-feedback');
  var validateBtn = document.getElementById('seq-validate');
  var undoBtn    = document.getElementById('seq-undo');

  // 1. BYPASS LOCK
  if (!state.enigme1 || state.enigme1.completed === null) {
    if (locked)   locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }
  if (state.quiz && state.quiz.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked)   locked.classList.add('hidden');
    showResult(state.quiz.completed, state.quiz.score || 0);
    return;
  }
  if (locked) locked.classList.add('hidden');

  // 2. CACHER LE JEU
  if (gameArea) gameArea.classList.add('hidden');

  // Exposer au globalTimer pour qu'il puisse afficher le résultat si le temps expire
  window._showTimerResult = function() {
    if (state.quiz && state.quiz.completed !== null) return;
    state.quiz = { completed: false, score: 0 };
    saveGameState(state);
    showResult(false, 0);
  };

  // 3. TUTORIEL
  Tutorial.show({
    icon: '📅',
    title: 'PLANNING ANIMATEUR',
    subtitle: 'ÉPREUVE 2',
    description: 'Un animateur doit organiser sa journée avec méthode. Sauras-tu reconstituer le bon déroulé ?',
    steps: [
      { icon: '👀', text: 'Mémorise les étapes de la journée pendant quelques secondes.' },
      { icon: '🔀', text: 'Elles seront mélangées : remets-les dans le bon ordre en cliquant dessus.' },
      { icon: '✅', text: 'Valide ton ordre. Tu as 3 essais maximum !' }
    ],
    buttonText: 'C\'EST PARTI !',
    theme: 'pink'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // 4. DONNÉES — Plannings simplifiés (5 étapes max pour des 3èmes)
  var plannings = [
    {
      title: 'Journée en centre de loisirs',
      steps: [
        { icon: '🌅', text: 'Accueil des enfants à l\'arrivée' },
        { icon: '🎨', text: 'Activités créatives du matin' },
        { icon: '🍽️', text: 'Déjeuner et temps calme' },
        { icon: '⚽', text: 'Jeux et sport l\'après-midi' },
        { icon: '🏠', text: 'Départ et au revoir aux enfants' }
      ]
    },
    {
      title: 'Préparer une animation',
      steps: [
        { icon: '💡', text: 'Choisir l\'activité et le thème' },
        { icon: '🛒', text: 'Préparer le matériel nécessaire' },
        { icon: '🤝', text: 'Expliquer les règles aux enfants' },
        { icon: '🎉', text: 'Réaliser l\'activité avec le groupe' },
        { icon: '📝', text: 'Faire le bilan avec l\'équipe' }
      ]
    },
    {
      title: 'Organiser une sortie',
      steps: [
        { icon: '📋', text: 'Demander l\'autorisation à la direction' },
        { icon: '📩', text: 'Envoyer les autorisations aux parents' },
        { icon: '🚌', text: 'Préparer le transport et les listes' },
        { icon: '🎒', text: 'Encadrer les enfants pendant la sortie' },
        { icon: '🏡', text: 'Rentrer et remettre les enfants aux familles' }
      ]
    }
  ];

  function initGame() {
    var planning = plannings[Math.floor(Math.random() * plannings.length)];
    var correctOrder = planning.steps.map(function(s) { return s.text; });
    var lives = 3;
    var placed = [];

    function updateLives() {
      var hearts = '';
      for (var i = 0; i < 3; i++) hearts += (i < lives ? '❤️' : '🖤');
      if (livesEl) livesEl.textContent = hearts;
    }

    // --- PHASE MÉMORISATION ---
    if (phaseEl) phaseEl.textContent = '📋 Mémorisation';
    updateLives();

    stepsDisp.innerHTML = '';
    planning.steps.forEach(function(step, idx) {
      var div = document.createElement('div');
      div.className = 'seq-step-shown';
      div.innerHTML =
        '<span class="seq-step-num">' + (idx + 1) + '</span>' +
        '<span class="seq-step-icon">' + step.icon + '</span>' +
        '<span class="seq-step-text">' + step.text + '</span>';
      stepsDisp.appendChild(div);
    });

    var timeLeft = 10;
    countdownEl.textContent = '⏳ ' + timeLeft;
    var memoTimer = setInterval(function() {
      timeLeft--;
      countdownEl.textContent = '⏳ ' + timeLeft;
      if (timeLeft <= 0) {
        clearInterval(memoTimer);
        startAnswerPhase();
      }
    }, 1000);

    function startAnswerPhase() {
      if (memoZone)   memoZone.classList.add('hidden');
      if (answerZone) answerZone.classList.remove('hidden');
      if (phaseEl)    phaseEl.textContent = '🔀 Remets dans l\'ordre';
      placed = [];
      renderDropZone();
      renderChoices();
    }

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    var shuffledSteps = shuffle(planning.steps.slice());

    function renderDropZone() {
      dropZone.innerHTML = '';
      if (placed.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'seq-drop-empty';
        empty.textContent = 'Clique sur les étapes ci-dessous pour les placer ici';
        dropZone.appendChild(empty);
        return;
      }
      placed.forEach(function(stepText, idx) {
        var step = planning.steps.find(function(s) { return s.text === stepText; });
        var div = document.createElement('div');
        div.className = 'seq-placed';
        div.innerHTML =
          '<span class="seq-placed-num">' + (idx + 1) + '</span>' +
          '<span class="seq-placed-icon">' + (step ? step.icon : '📌') + '</span>' +
          '<span class="seq-placed-text">' + stepText + '</span>';
        dropZone.appendChild(div);
      });
    }

    function renderChoices() {
      choicesPool.innerHTML = '';

      // --- ANTI-STICKY HOVER JS ---
      choicesPool.style.pointerEvents = 'none';
      setTimeout(function() { choicesPool.style.pointerEvents = 'auto'; }, 150);
      // -----------------------------
      shuffledSteps.forEach(function(step) {
        var used = placed.indexOf(step.text) !== -1;
        var chip = document.createElement('div');
        chip.className = 'seq-chip' + (used ? ' used' : '');
        chip.innerHTML = '<span class="seq-chip-icon">' + step.icon + '</span><span>' + step.text + '</span>';
        chip.addEventListener('click', function() {
          if (used) return;
          placed.push(step.text);
          used = true;
          chip.classList.add('used');
          renderDropZone();
        });
        choicesPool.appendChild(chip);
      });
    }

    if (undoBtn) {
      undoBtn.addEventListener('click', function() {
        if (placed.length === 0) return;
        placed.pop();
        renderDropZone();
        renderChoices();
      });
    }

    if (validateBtn) {
      validateBtn.addEventListener('click', function() {
        if (placed.length < correctOrder.length) {
          if (feedbackEl) { feedbackEl.textContent = '⚠️ Place toutes les étapes d\'abord !'; feedbackEl.className = 'seq-feedback wrong'; }
          return;
        }

        var allCorrect = true;
        for (var i = 0; i < correctOrder.length; i++) {
          if (placed[i] !== correctOrder[i]) { allCorrect = false; break; }
        }

        if (allCorrect) {
          if (feedbackEl) { feedbackEl.textContent = '✅ Parfait ! Le planning est dans le bon ordre !'; feedbackEl.className = 'seq-feedback correct'; }
          state.quiz = { completed: true, score: lives, planningTitle: planning.title };
          saveGameState(state);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          setTimeout(function() {
            if (gameArea) gameArea.classList.add('hidden');
            showResult(true, lives);
          }, 1500);
        } else {
          lives--;
          updateLives();
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

          if (lives <= 0) {
            if (feedbackEl) { feedbackEl.textContent = '❌ Plus d\'essais ! Voici le bon ordre.'; feedbackEl.className = 'seq-feedback wrong'; }
            placed = correctOrder.slice();
            renderDropZone();
            renderChoices();
            if (validateBtn) validateBtn.disabled = true;
            if (undoBtn) undoBtn.disabled = true;
            state.quiz = { completed: false, score: 0, planningTitle: planning.title, correctOrder: correctOrder };
            saveGameState(state);
            setTimeout(function() {
              if (gameArea) gameArea.classList.add('hidden');
              showResult(false, 0);
            }, 2500);
          } else {
            if (feedbackEl) {
              feedbackEl.textContent = '❌ Pas tout à fait… ' + lives + ' essai(s) restant(s). Réessaie !';
              feedbackEl.className = 'seq-feedback wrong';
            }
            placed = [];
            renderDropZone();
            renderChoices();
          }
        }
      });
    }
  }

  // 5. SHOWRESULT
  function showResult(success, score) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea)  gameArea.classList.add('hidden');
    if (locked)    locked.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    var resultBox   = document.getElementById('result-box');
    var resultIcon  = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText  = document.getElementById('result-text');
    var resultScore = document.getElementById('result-score');
    if (resultScore) resultScore.textContent = 'Planning réussi avec ' + score + ' essai(s) restant(s)';

    if (success) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      if (window.confetti) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#ff69b4', '#c8a96e'] });
      if (resultBox) { resultBox.classList.remove('success-effect'); void resultBox.offsetWidth; resultBox.classList.add('success-effect', 'success'); }
      if (resultIcon)  resultIcon.textContent  = '✓';
      if (resultTitle) resultTitle.textContent = 'PLANNING MAÎTRISÉ !';
      if (resultText)  resultText.textContent  = 'Tu sais organiser une journée d\'animation ! L\'intervenant approfondira avec toi. Badge débloqué !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]);
      if (resultBox) { resultBox.classList.remove('fail-effect'); void resultBox.offsetWidth; resultBox.classList.add('fail-effect', 'fail'); }
      if (resultIcon)  resultIcon.textContent  = '✗';
      if (resultTitle) resultTitle.textContent = 'PLANNING À RETRAVAILLER';
      if (resultText)  resultText.textContent  = 'L\'ordre n\'était pas bon mais tu apprends vite ! L\'intervenant t\'expliquera la logique. Badge verrouillé.';
    }
  }
});