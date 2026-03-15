document.addEventListener('DOMContentLoaded', function() {
  var state      = getGameState();
  var locked     = document.getElementById('locked');
  var gameArea   = document.getElementById('game-area');
  var resultDiv  = document.getElementById('result');
  var roundEl    = document.getElementById('wis-round');
  var correctEl  = document.getElementById('wis-correct');
  var wrongEl    = document.getElementById('wis-wrong');
  var card       = document.getElementById('wis-card');
  var pointsBadge = document.getElementById('wis-points-badge');
  var cluesList  = document.getElementById('wis-clues-list');
  var revealBtn  = document.getElementById('wis-reveal-btn');
  var feedbackEl = document.getElementById('wis-feedback');
  var choicesEl  = document.getElementById('wis-choices');

  if (!state.quiz || state.quiz.completed === null) {
    if (locked)   locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }
  if (state.enigme && state.enigme.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked)   locked.classList.add('hidden');
    showResult(state.enigme.completed, state.enigme.score || 0);
    return;
  }
  if (locked) locked.classList.add('hidden');
  if (gameArea) gameArea.classList.add('hidden');

  window._showTimerResult = function() {
    if (state.enigme && state.enigme.completed !== null) return;
    state.enigme = { completed: false, score: 0 };
    saveGameState(state);
    showResult(false, 0);
  };

  Tutorial.show({
    icon: '🕵️',
    title: 'QUI SUIS-JE ?',
    subtitle: 'ÉPREUVE 3',
    description: 'Des indices se dévoilent un à un. Plus tu en utilises, moins tu gagnes de points !',
    steps: [
      { icon: '💡', text: 'Lis le premier indice. C\'est le plus dur !' },
      { icon: '👁', text: 'Clique sur "Indice suivant" pour voir d\'autres indices (mais tu perds des points).' },
      { icon: '🎯', text: 'Trouve 3 bonnes réponses sur 5 pour réussir !' }
    ],
    buttonText: 'C\'EST PARTI !',
    theme: 'purple'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  function initGame() {
    var allEnigmas = [
      { answer: 'Le BAFA', choices: ['Le BAFA', 'Le Baccalauréat', 'Le BPJEPS', 'Le Brevet des collèges'], clues: ['🕵️ Je suis un brevet qui permet d\'encadrer des enfants pendant les vacances.', '🏕️ Avec moi, tu peux travailler dans une colonie de vacances ou un centre aéré.', '🎓 Je se prépare en quelques semaines, pas en plusieurs années.', '✅ Mon nom commence par "B" et se termine par "A".'] },
      { answer: 'L\'animateur', choices: ['L\'animateur', 'Le comptable', 'Le chauffeur de bus', 'Le cuisinier'], clues: ['🕵️ Je suis un professionnel qui encadre et amuse des groupes de personnes.', '🎨 J\'organise des jeux, des ateliers créatifs et des activités sportives.', '🧒 Je travaille souvent avec des enfants dans des centres de loisirs.', '🎪 Mon métier, c\'est de rendre les journées fun et éducatives !'] },
      { answer: 'Le centre de loisirs', choices: ['Le centre de loisirs', 'L\'hôpital', 'La bibliothèque', 'Le supermarché'], clues: ['🕵️ Je suis un endroit où les enfants vont pendant les vacances scolaires ou le mercredi.', '🎨 On y fait des activités : sport, dessin, jeux, sorties...', '🏠 Les enfants rentrent chez eux chaque soir, ils ne dorment pas sur place.', '🏫 Je suis souvent géré par la mairie de ta ville.'] },
      { answer: 'La colonie de vacances', choices: ['La colonie de vacances', 'L\'école', 'La cantine', 'La garderie'], clues: ['🕵️ Je suis un séjour où les enfants partent loin de chez eux pendant les vacances.', '🛏️ Les enfants dorment sur place, sans leurs parents.', '🎒 On y fait plein d\'activités : randonnée, piscine, veillées...', '🏕️ Je peux se passer à la mer, à la montagne ou à la campagne.'] },
      { answer: 'La MJC', choices: ['La MJC', 'La mairie', 'Le collège', 'La pharmacie'], clues: ['🕵️ Je suis un lieu ouvert à tous les jeunes d\'un quartier ou d\'une ville.', '🎭 On y propose des cours de théâtre, de musique, de sport et de bricolage.', '🤝 Je favorise les rencontres entre jeunes et adultes du quartier.', '🏠 Mon nom complet est "Maison des Jeunes et de la Culture".'] },
      { answer: 'Le BPJEPS', choices: ['Le BPJEPS', 'Le BAFA', 'Le Brevet des collèges', 'Le BTS Vente'], clues: ['🕵️ Je suis un diplôme professionnel qui permet de travailler comme animateur.', '🎓 Je s\'obtient après une formation d\'environ 1 an, souvent en alternance.', '💼 Avec moi, tu peux être embauché par une mairie ou une association.', '📜 Mon niveau est équivalent au baccalauréat.'] },
      { answer: 'Le projet pédagogique', choices: ['Le projet pédagogique', 'La liste de courses', 'Le règlement du collège', 'Le carnet de notes'], clues: ['🕵️ Je suis un document que l\'équipe d\'animateurs rédige avant chaque séjour.', '🎯 J\'explique les objectifs : ce qu\'on veut apprendre aux enfants pendant le séjour.', '📋 Je sers de guide pour préparer toutes les activités de la semaine.', '✅ Toute structure qui accueille des enfants est obligée d\'en avoir un.'] },
      { answer: 'L\'animateur périscolaire', choices: ['L\'animateur périscolaire', 'Le professeur', 'Le directeur', 'Le médecin scolaire'], clues: ['🕵️ Je travaille dans une école, mais je ne fais pas cours.', '🌅 Je m\'occupe des enfants le matin avant les cours et le soir après les cours.', '🍽️ Je surveille aussi parfois la cantine ou les récréations.', '🎨 J\'organise des activités ludiques pendant les temps libres des élèves.'] }
    ];

    function shuffle(arr) {
      var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a;
    }

    var questions = shuffle(allEnigmas).slice(0, 5);
    var current = 0, totalScore = 0, correctCount = 0, wrongCount = 0, clueIndex = 0;
    var answered = false, wrongQuestions = [];

    function updateStats() {
      if (roundEl)   roundEl.textContent   = '🕵️ ' + (current + 1) + ' / ' + questions.length;
      if (correctEl) correctEl.textContent = '✅ ' + correctCount;
      if (wrongEl)   wrongEl.textContent   = '❌ ' + wrongCount;
    }

    function getMaxPoints() { return Math.max(1, questions[current].clues.length - clueIndex); }

    function showQuestion() {
      if (current >= questions.length) { endGame(); return; }
      answered = false; clueIndex = 0; updateStats();
      card.classList.remove('flash-correct', 'flash-wrong');
      if (feedbackEl) { feedbackEl.textContent = ''; feedbackEl.className = 'wis-feedback'; }
      cluesList.innerHTML = ''; choicesEl.innerHTML = '';
      if (revealBtn) { revealBtn.disabled = false; revealBtn.textContent = '👁 Indice suivant (-1 pt)'; }
      showNextClue();
      renderChoices();
    }

    function showNextClue() {
      var q = questions[current];
      if (clueIndex >= q.clues.length) return;
      var clue = document.createElement('div');
      clue.className = 'wis-clue';
      clue.textContent = q.clues[clueIndex];
      cluesList.appendChild(clue);
      clueIndex++;
      var pts = getMaxPoints();
      if (pointsBadge) pointsBadge.textContent = '⭐ ' + pts + ' pt' + (pts > 1 ? 's' : '') + ' possible' + (pts > 1 ? 's' : '');
      if (clueIndex >= q.clues.length && revealBtn) { revealBtn.disabled = true; revealBtn.textContent = '🚫 Plus d\'indices'; }
    }

    function renderChoices() {
      choicesEl.innerHTML = '';
      
      // --- AJOUT ANTI-STICKY HOVER JS ---
      choicesEl.style.pointerEvents = 'none';
      setTimeout(function() { choicesEl.style.pointerEvents = 'auto'; }, 150);
      // ----------------------------------

      var shuffled = shuffle(questions[current].choices);
      shuffled.forEach(function(choice) {
        var btn = document.createElement('div');
        btn.className = 'wis-choice';
        btn.textContent = choice;
        btn.addEventListener('click', function() { handleChoice(choice, btn); });
        choicesEl.appendChild(btn);
      });
    }

    function handleChoice(choice, btn) {
      if (answered) return;
      answered = true;
      if (revealBtn) revealBtn.disabled = true;
      choicesEl.querySelectorAll('.wis-choice').forEach(function(c) { c.classList.add('disabled'); });

      var correct = choice === questions[current].answer;
      if (correct) {
        var pts = getMaxPoints(); totalScore += pts; correctCount++;
        btn.classList.add('correct'); card.classList.add('flash-correct');
        if (feedbackEl) { feedbackEl.textContent = '✅ Bonne réponse ! +' + pts + ' point' + (pts > 1 ? 's' : '') + ' !'; feedbackEl.className = 'wis-feedback correct'; }
      } else {
        wrongCount++; wrongQuestions.push({ q: questions[current].clues[0], correct: questions[current].answer });
        btn.classList.add('wrong'); card.classList.add('flash-wrong');
        if (navigator.vibrate) navigator.vibrate([50]);
        choicesEl.querySelectorAll('.wis-choice').forEach(function(c) { if (c.textContent === questions[current].answer) c.classList.add('reveal'); });
        if (feedbackEl) { feedbackEl.textContent = '❌ C\'était : ' + questions[current].answer; feedbackEl.className = 'wis-feedback wrong'; }
      }
      updateStats();
      setTimeout(function() { current++; showQuestion(); }, 1600);
    }

    if (revealBtn) { revealBtn.addEventListener('click', function() { if (!answered) showNextClue(); }); }

    function endGame() {
      var success = correctCount >= 3;
      state.enigme = { completed: success, score: totalScore, wrong: wrongQuestions };
      saveGameState(state);
      setTimeout(function() { if (gameArea) gameArea.classList.add('hidden'); showResult(success, totalScore); }, 300);
    }

    updateStats();
    setTimeout(function() { showQuestion(); }, 800);
  }

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
    if (resultScore) resultScore.textContent = score + ' points récoltés';

    if (success) {
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      if (window.confetti) confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ['#a855f7', '#c8a96e'] });
      if (resultBox) { resultBox.classList.remove('success-effect'); void resultBox.offsetWidth; resultBox.classList.add('success-effect', 'success'); }
      if (resultIcon)  resultIcon.textContent  = '✓';
      if (resultTitle) resultTitle.textContent = 'DÉTECTIVE DE L\'ANIMATION !';
      if (resultText)  resultText.textContent  = 'Tu connais bien le secteur animation ! L\'intervenant approfondira les métiers avec toi. Dernier badge débloqué !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]);
      if (resultBox) { resultBox.classList.remove('fail-effect'); void resultBox.offsetWidth; resultBox.classList.add('fail-effect', 'fail'); }
      if (resultIcon)  resultIcon.textContent  = '✗';
      if (resultTitle) resultTitle.textContent = 'ENCORE UN EFFORT !';
      if (resultText)  resultText.textContent  = 'Il fallait 3 bonnes réponses. L\'intervenant t\'expliquera tout ça ! Badge verrouillé.';
    }
  }
});