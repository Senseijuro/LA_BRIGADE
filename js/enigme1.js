document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var gameArea    = document.getElementById('game-area');
  var resultDiv   = document.getElementById('result');
  var roundEl     = document.getElementById('qcm-round');
  var correctEl   = document.getElementById('qcm-correct');
  var wrongEl     = document.getElementById('qcm-wrong');
  var timerFill   = document.getElementById('qcm-timer-fill');
  var card        = document.getElementById('qcm-card');
  var categoryEl  = document.getElementById('qcm-category');
  var questionEl  = document.getElementById('qcm-question');
  var feedbackEl  = document.getElementById('qcm-feedback');
  var choicesEl   = document.getElementById('qcm-choices');

  if (state.enigme1 && state.enigme1.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    showResult(state.enigme1.completed, state.enigme1.score || 0);
    return;
  }
  if (gameArea) gameArea.classList.add('hidden');

  window._showTimerResult = function() {
    if (state.enigme1 && state.enigme1.completed !== null) return;
    state.enigme1 = { completed: false, score: 0 };
    saveGameState(state);
    showResult(false, 0);
  };

  Tutorial.show({
    icon: '🎪',
    title: 'QUIZ DE L\'ANIMATEUR',
    subtitle: 'ÉPREUVE 1',
    description: 'Teste tes connaissances sur l\'animation, les diplômes et les métiers du secteur.',
    steps: [
      { icon: '⏱️', text: 'Lis chaque question avant la fin du chronomètre (10 secondes).' },
      { icon: '👆', text: 'Sélectionne la bonne réponse parmi les 4 choix.' },
      { icon: '🎯', text: 'Obtiens au moins 3 bonnes réponses sur 5 pour réussir l\'épreuve.' }
    ],
    warning: 'Attention, le temps s\'écoule vite !',
    buttonText: 'C\'EST PARTI !',
    theme: 'gold'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  function initGame() {
    var allQuestions = [
      { cat: '🎓 Diplômes', q: 'Le BAFA, c\'est quoi exactement ?', answer: 'Un brevet pour encadrer des enfants en vacances', choices: ['Un brevet pour encadrer des enfants en vacances', 'Un diplôme de cuisine', 'Un permis de conduire spécial', 'Un bac professionnel'] },
      { cat: '🎪 Le métier', q: 'Qu\'est-ce que fait un animateur en centre de loisirs ?', answer: 'Il organise des activités et encadre des enfants', choices: ['Il organise des activités et encadre des enfants', 'Il répare des machines', 'Il enseigne les maths', 'Il conduit des bus scolaires'] },
      { cat: '🏕️ Les lieux', q: 'Dans quel endroit travaille souvent un animateur ?', answer: 'Un centre de loisirs ou une colonie de vacances', choices: ['Un centre de loisirs ou une colonie de vacances', 'Un supermarché', 'Un tribunal', 'Une usine automobile'] },
      { cat: '🎓 Diplômes', q: 'À quel âge minimum peut-on commencer le BAFA ?', answer: '17 ans', choices: ['17 ans', '14 ans', '21 ans', '25 ans'] },
      { cat: '💼 Le métier', q: 'Quelle qualité est la plus importante pour être animateur ?', answer: 'Aimer travailler avec les enfants et être patient', choices: ['Aimer travailler avec les enfants et être patient', 'Être très fort en sport', 'Savoir jouer de la guitare', 'Parler 5 langues'] },
      { cat: '🏕️ Les lieux', q: 'Une MJC, c\'est quoi ?', answer: 'Une Maison des Jeunes et de la Culture', choices: ['Une Maison des Jeunes et de la Culture', 'Un Musée des Jouets Classiques', 'Un Marché de Jeux et Confiseries', 'Une Médiathèque des Jeux en Commun'] },
      { cat: '🎪 Le métier', q: 'Pour qui travaille un animateur BPJEPS ?', answer: 'La mairie, une association ou un club de sport', choices: ['La mairie, une association ou un club de sport', 'Uniquement à l\'hôpital', 'Seulement dans les écoles primaires', 'Uniquement dans les discothèques'] },
      { cat: '💼 Le métier', q: 'Qu\'est-ce qu\'un animateur périscolaire ?', answer: 'Un animateur qui s\'occupe des enfants avant et après l\'école', choices: ['Un animateur qui s\'occupe des enfants avant et après l\'école', 'Un prof de sport', 'Un animateur de radio', 'Un gardien de nuit'] },
      { cat: '🎓 Diplômes', q: 'Quel diplôme permet de devenir animateur professionnel de niveau bac ?', answer: 'Le BPJEPS', choices: ['Le BPJEPS', 'Le BEP Vente', 'Le CAP Cuisine', 'Le BTS Comptabilité'] },
      { cat: '🏕️ Les lieux', q: 'Dans une colonie de vacances, les enfants…', answer: 'Dorment sur place et font des activités toute la journée', choices: ['Dorment sur place et font des activités toute la journée', 'Rentrent chez eux chaque soir', 'Travaillent pour gagner de l\'argent', 'Passent des examens scolaires'] }
    ];

    function shuffle(arr) {
      var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a;
    }

    var questions = shuffle(allQuestions).slice(0, 5);
    var QUESTION_TIME = 10000;
    var current = 0, correctCount = 0, wrongCount = 0;
    var answered = false, questionTimer = null;
    var wrongQuestions = [];

    function updateStats() {
      if (roundEl)   roundEl.textContent   = '❓ ' + (current + 1) + ' / ' + questions.length;
      if (correctEl) correctEl.textContent = '✅ ' + correctCount;
      if (wrongEl)   wrongEl.textContent   = '❌ ' + wrongCount;
    }

    function startQuestion() {
      if (current >= questions.length) { endGame(); return; }
      answered = false;
      updateStats();
      card.classList.remove('flash-correct', 'flash-wrong');
      if (feedbackEl) { feedbackEl.textContent = ''; feedbackEl.className = 'qcm-feedback'; }
      if (timerFill)  { timerFill.style.width = '100%'; timerFill.classList.remove('danger'); }

      var q = questions[current];
      if (categoryEl) categoryEl.textContent = q.cat;
      if (questionEl) questionEl.textContent = q.q;

      var shuffled = shuffle(q.choices);
      choicesEl.innerHTML = '';
      
      // --- AJOUT ANTI-STICKY HOVER JS ---
      choicesEl.style.pointerEvents = 'none';
      setTimeout(function() { choicesEl.style.pointerEvents = 'auto'; }, 150);
      // ----------------------------------

      shuffled.forEach(function(choice) {
        var btn = document.createElement('div');
        btn.className = 'qcm-choice';
        btn.textContent = choice;
        btn.addEventListener('click', function() { handleChoice(choice, btn); });
        choicesEl.appendChild(btn);
      });

      var start = Date.now();
      questionTimer = setInterval(function() {
        var elapsed = Date.now() - start;
        var pct = Math.max(0, 100 - (elapsed / QUESTION_TIME * 100));
        if (timerFill) { timerFill.style.width = pct + '%'; if (pct < 30) timerFill.classList.add('danger'); }
        if (elapsed >= QUESTION_TIME && !answered) { clearInterval(questionTimer); handleTimeout(); }
      }, 50);
    }

    function handleChoice(choice, btn) {
      if (answered) return;
      answered = true;
      clearInterval(questionTimer);
      choicesEl.querySelectorAll('.qcm-choice').forEach(function(c) { c.classList.add('disabled'); });

      var correct = choice === questions[current].answer;
      if (correct) {
        correctCount++;
        btn.classList.add('correct');
        card.classList.add('flash-correct');
        if (feedbackEl) { feedbackEl.textContent = '✅ Bonne réponse !'; feedbackEl.className = 'qcm-feedback correct'; }
      } else {
        wrongCount++;
        wrongQuestions.push({ q: questions[current].q, correct: questions[current].answer });
        btn.classList.add('wrong');
        card.classList.add('flash-wrong');
        if (navigator.vibrate) navigator.vibrate([50]);
        choicesEl.querySelectorAll('.qcm-choice').forEach(function(c) {
          if (c.textContent === questions[current].answer) c.classList.add('reveal');
        });
        if (feedbackEl) { feedbackEl.textContent = '❌ Raté ! C\'était : ' + questions[current].answer; feedbackEl.className = 'qcm-feedback wrong'; }
      }
      updateStats();
      setTimeout(function() { current++; startQuestion(); }, 1400);
    }

    function handleTimeout() {
      answered = true;
      wrongCount++;
      wrongQuestions.push({ q: questions[current].q, correct: questions[current].answer });
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
      choicesEl.querySelectorAll('.qcm-choice').forEach(function(c) {
        c.classList.add('disabled');
        if (c.textContent === questions[current].answer) c.classList.add('reveal');
      });
      card.classList.add('flash-wrong');
      if (feedbackEl) { feedbackEl.textContent = '⏰ Temps écoulé ! C\'était : ' + questions[current].answer; feedbackEl.className = 'qcm-feedback wrong'; }
      updateStats();
      setTimeout(function() { current++; startQuestion(); }, 1400);
    }

    function endGame() {
      var success = correctCount >= 3;
      state.enigme1 = { completed: success, score: correctCount, wrong: wrongQuestions };
      saveGameState(state);
      setTimeout(function() { if (gameArea) gameArea.classList.add('hidden'); showResult(success, correctCount); }, 300);
    }

    updateStats();
    setTimeout(function() { startQuestion(); }, 800);
  }

  function showResult(success, score) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea)  gameArea.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    var resultBox   = document.getElementById('result-box');
    var resultIcon  = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText  = document.getElementById('result-text');
    var resultScore = document.getElementById('result-score');
    if (resultScore) resultScore.textContent = score + ' / 5 bonnes réponses';

    if (success) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      if (window.confetti) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#c8a96e', '#00d4ff'] });
      if (resultBox) { resultBox.classList.remove('success-effect'); void resultBox.offsetWidth; resultBox.classList.add('success-effect', 'success'); }
      if (resultIcon)  resultIcon.textContent  = '✓';
      if (resultTitle) resultTitle.textContent = 'ANIMATEUR EN HERBE !';
      if (resultText)  resultText.textContent  = 'Tu maîtrises les bases du secteur animation ! L\'intervenant pourra approfondir avec toi ! Badge débloqué !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]);
      if (resultBox) { resultBox.classList.remove('fail-effect'); void resultBox.offsetWidth; resultBox.classList.add('fail-effect', 'fail'); }
      if (resultIcon)  resultIcon.textContent  = '✗';
      if (resultTitle) resultTitle.textContent = 'À REVOIR !';
      if (resultText)  resultText.textContent  = 'Il fallait au moins 3 bonnes réponses. Pose tes questions à l\'intervenant ! Badge verrouillé.';
    }
  }
});