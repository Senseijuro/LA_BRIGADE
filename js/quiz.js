document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var locked = document.getElementById('locked');
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var roundEl = document.getElementById('tg-round');
  var correctEl = document.getElementById('tg-correct');
  var errorsEl = document.getElementById('tg-errors');
  var phaseEl = document.getElementById('tg-phase');
  var refZone = document.getElementById('tg-ref-zone');
  var pickZone = document.getElementById('tg-pick-zone');
  var reference = document.getElementById('tg-reference');
  var options = document.getElementById('tg-options');
  var timerEl = document.getElementById('tg-timer');
  var hintEl = document.getElementById('tg-hint');

  // 1. BYPASS
  if (!state.enigme1 || state.enigme1.completed === null) {
    if (locked) locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }

  if (state.quiz && state.quiz.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.quiz.completed, state.quiz.score || 0);
    return;
  }

  if (locked) locked.classList.add('hidden');

  // 2. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 3. AFFICHER LE TUTORIEL
  Tutorial.show({
    icon: '🍽️',
    title: 'DRESSAGE DE TABLE',
    subtitle: 'ÉPREUVE 2',
    description: 'Le sens du détail est primordial en salle. Mémorise le dressage parfait et retrouve-le !',
    steps: [
      { icon: '👁️', text: 'Mémorise le modèle parfait affiché à l\'écran pendant quelques secondes.' },
      { icon: '🎯', text: 'Retrouve ce <strong>modèle exact</strong> parmi les 4 propositions.' },
      { icon: '⚠️', text: 'Attention aux pièges : couteaux inversés, verres déplacés...' }
    ],
    warning: 'Il te faut au moins 4 bonnes réponses sur 5 !',
    buttonText: 'C\'EST PARTI !',
    theme: 'pink'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // --- ÉCRAN CHANGER DE JOUEUR ---
  function showPlayerChange(roundLabel, callback) {
    var overlay = document.createElement('div');
    overlay.className = 'tt-change-overlay';
    overlay.innerHTML =
      '<div class="tt-change-content">' +
        '<div class="tt-change-icon">🔄</div>' +
        '<div class="tt-change-text">CHANGER DE JOUEUR</div>' +
        '<div class="tt-change-wave">' + roundLabel + '</div>' +
        '<div class="tt-change-countdown" id="tt-countdown">3</div>' +
      '</div>';
    gameArea.appendChild(overlay);
    void overlay.offsetWidth;
    overlay.classList.add('visible');

    var count = 3;
    var countEl = document.getElementById('tt-countdown');
    var countInterval = setInterval(function() {
      count--;
      if (countEl) countEl.textContent = count;
      if (count <= 0) {
        clearInterval(countInterval);
        overlay.classList.remove('visible');
        setTimeout(function() {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          callback();
        }, 300);
      }
    }, 700);
  }

  // 4. LOGIQUE DU JEU
  function initGame() {
    // Chaque dressage = grille 2x3 [top-left, top-center, top-right, bot-left, bot-center, bot-right]
    var rounds = [
      {
        name: 'Table simple', timer: 6, correct: ['', '', '🥂', '🍴', '🍽️', '🔪'],
        wrongs: [
          ['', '', '🥂', '🔪', '🍽️', '🍴'],  // couteau/fourchette inversés
          ['', '', '🍴', '🥂', '🍽️', '🔪'],  // verre/fourchette inversés
          ['', '🥂', '', '🍴', '🍽️', '🔪']   // verre mauvais côté
        ]
      },
      {
        name: 'Table avec pain', timer: 6, correct: ['🍞', '', '🥂', '🍴', '🍽️', '🔪'],
        wrongs: [
          ['', '', '🥂', '🍴', '🍽️', '🔪'],  // pain manquant
          ['🥂', '', '🍞', '🍴', '🍽️', '🔪'],  // pain/verre inversés
          ['🍞', '', '🥂', '🔪', '🍽️', '🍴']   // couteau/fourchette inversés
        ]
      },
      {
        name: 'Table complète', timer: 5, correct: ['🍞', '🥄', '🥂', '🍴', '🍽️', '🔪'],
        wrongs: [
          ['🍞', '🥄', '🥂', '🔪', '🍽️', '🍴'],  // fourchette/couteau
          ['🍞', '🥂', '🥄', '🍴', '🍽️', '🔪'],  // cuillère/verre
          ['🥂', '🥄', '🍞', '🍴', '🍽️', '🔪']   // pain/verre
        ]
      },
      {
        name: 'Grand service', timer: 5, correct: ['🍞', '🥄', '🥂', '🍴', '🍽️', '🔪'],
        wrongs: [
          ['🍞', '🥄', '🥂', '🍴', '🔪', '🍽️'],  // assiette/couteau
          ['🍞', '🔪', '🥂', '🍴', '🍽️', '🥄'],  // cuillère/couteau
          ['🥄', '🍞', '🥂', '🍴', '🍽️', '🔪']   // pain/cuillère
        ]
      },
      {
        name: 'Service étoilé', timer: 4, correct: ['🍞', '🥄', '🥂', '🍴', '🍽️', '🔪'],
        wrongs: [
          ['🍞', '🥄', '🥂', '🍽️', '🍴', '🔪'],  // fourchette/assiette (subtil)
          ['🍞', '🥄', '🥂', '🍴', '🍽️', '🥂'],  // double verre, pas de couteau
          ['🍴', '🥄', '🥂', '🍞', '🍽️', '🔪']   // pain/fourchette
        ]
      }
    ];

    var currentRound = 0;
    var correctCount = 0;
    var errorCount = 0;
    var total = rounds.length;

    function updateStats() {
      if (roundEl) roundEl.textContent = '🍽️ Table ' + (currentRound + 1) + ' / ' + total;
      if (correctEl) correctEl.textContent = '✅ ' + correctCount;
      if (errorsEl) errorsEl.textContent = '❌ ' + errorCount;
    }

    function renderSetting(container, grid, label) {
      container.innerHTML = '';
      if (label) {
        var lbl = document.createElement('span');
        lbl.className = 'table-ref-label';
        lbl.textContent = label;
        container.appendChild(lbl);
      }
      var row1 = document.createElement('div');
      row1.className = 'table-setting-row';
      for (var i = 0; i < 3; i++) {
        var cell = document.createElement('div');
        cell.className = 'table-cell' + (grid[i] ? '' : ' empty');
        cell.textContent = grid[i] || '·';
        row1.appendChild(cell);
      }
      container.appendChild(row1);
      
      var row2 = document.createElement('div');
      row2.className = 'table-setting-row';
      for (var i = 3; i < 6; i++) {
        var cell = document.createElement('div');
        cell.className = 'table-cell' + (grid[i] ? '' : ' empty');
        cell.textContent = grid[i] || '·';
        row2.appendChild(cell);
      }
      container.appendChild(row2);
    }

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }

    function startRound() {
      if (currentRound >= total) { endGame(); return; }

      var round = rounds[currentRound];
      updateStats();

      refZone.style.display = '';
      pickZone.style.display = 'none';
      if (phaseEl) { phaseEl.textContent = '👁️ MÉMORISE : ' + round.name; phaseEl.className = 'table-phase-msg memo'; }
      if (hintEl) hintEl.textContent = 'Observe la position de chaque couvert — ' + round.timer + 's !';

      renderSetting(reference, round.correct, '✨ DRESSAGE CORRECT');

      var countdown = round.timer;
      if (timerEl) timerEl.textContent = countdown;

      var countInterval = setInterval(function() {
        countdown--;
        if (timerEl) timerEl.textContent = countdown;
        if (countdown <= 0) {
          clearInterval(countInterval);
          startPickPhase(round);
        }
      }, 1000);
    }

    function startPickPhase(round) {
      refZone.style.display = 'none';
      pickZone.style.display = '';
      if (phaseEl) { phaseEl.textContent = '🎯 RETROUVE LE BON DRESSAGE !'; phaseEl.className = 'table-phase-msg pick'; }
      if (hintEl) hintEl.textContent = 'Un seul dressage est correct — les autres ont des erreurs subtiles';

      var allOptions = [{ grid: round.correct, isCorrect: true }];
      round.wrongs.forEach(function(w) { allOptions.push({ grid: w, isCorrect: false }); });
      allOptions = shuffle(allOptions);

      options.innerHTML = '';
      // --- ANTI-STICKY HOVER JS ---
      options.style.pointerEvents = 'none';
      setTimeout(function() { options.style.pointerEvents = 'auto'; }, 150);
      // -----------------------------
      var labels = ['A', 'B', 'C', 'D'];

      allOptions.forEach(function(opt, i) {
        var el = document.createElement('div');
        el.className = 'table-option';
        el.dataset.correct = opt.isCorrect;

        var labelSpan = document.createElement('span');
        labelSpan.className = 'table-option-label';
        labelSpan.textContent = 'TABLE ' + labels[i];
        el.appendChild(labelSpan);

        renderSetting(el, opt.grid);

        el.addEventListener('click', function() { handlePick(el, opt.isCorrect); });
        options.appendChild(el);
      });
    }

    function handlePick(el, isCorrect) {
      var allOpts = options.querySelectorAll('.table-option');
      allOpts.forEach(function(o) { o.classList.add('disabled'); });

      if (isCorrect) {
        el.classList.add('correct-pick');
        el.classList.remove('disabled');
        correctCount++;
      } else {
        el.classList.add('wrong-pick');
        el.classList.remove('disabled');
        errorCount++;
        allOpts.forEach(function(o) {
          if (o.dataset.correct === 'true') { o.classList.add('correct-pick'); o.classList.remove('disabled'); }
        });
      }

      updateStats();
      setTimeout(function() {
        currentRound++;
        if (currentRound >= total) { endGame(); return; }
        showPlayerChange('TABLE ' + (currentRound + 1) + ' / ' + total, function() {
          startRound();
        });
      }, 1200);
    }

    function endGame() {
      var success = correctCount >= 4;
      if (!state.quiz) state.quiz = { completed: null, score: 0 };
      state.quiz.completed = success;
      state.quiz.score = correctCount;
      saveGameState(state);

      setTimeout(function() {
        if (gameArea) gameArea.classList.add('hidden');
        showResult(success, correctCount);
      }, 400);
    }

    updateStats();
    setTimeout(function() { startRound(); }, 600);
  }

  // 5. FONCTION SHOWRESULT HORS DE INITGAME
  function showResult(success, score) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    var resultBox = document.getElementById('result-box');
    var resultIcon = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');
    var resultScore = document.getElementById('result-score');

    if (resultScore) resultScore.textContent = score + ' / 5 tables correctes';

    if (success) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
      if (window.confetti) {
        confetti({ 
          particleCount: 150, spread: 80, origin: { y: 0.6 },
          colors: ['#ff007f', '#00d4ff', '#ffd700', '#a855f7'], 
          disableForReducedMotion: true
        });
      }

      if (resultBox) {
        resultBox.classList.remove('success-effect'); 
        void resultBox.offsetWidth; 
        resultBox.classList.add('success-effect', 'success');
      }
      if (resultIcon) resultIcon.textContent = '✓';
      if (resultTitle) resultTitle.textContent = 'TABLE PARFAITE !';
      if (resultText) resultText.textContent = 'Tu as l\'œil d\'un maître d\'hôtel. Étoile débloquée !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) {
        resultBox.classList.remove('fail-effect'); 
        void resultBox.offsetWidth; 
        resultBox.classList.add('fail-effect', 'fail');
      }
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'DRESSAGE INCORRECT';
      if (resultText) resultText.textContent = 'Il fallait reconnaître au moins 4 dressages sur 5. Étoile verrouillée.';
    }
  }
});
