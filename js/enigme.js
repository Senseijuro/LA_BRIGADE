document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var locked = document.getElementById('locked');
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var situation = document.getElementById('ht-situation');
  var emojiEl = document.getElementById('ht-emoji');
  var saysEl = document.getElementById('ht-says');
  var counterEl = document.getElementById('ht-counter');
  var prosEl = document.getElementById('ht-pros');
  var explainEl = document.getElementById('ht-explain');
  var progressEl = document.getElementById('ht-progress');
  var correctEl = document.getElementById('ht-correct');
  var errorsEl = document.getElementById('ht-errors');

  // 1. BYPASS
  if (!state.quiz || state.quiz.completed === null) {
    if (locked) locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }
  if (state.enigma && state.enigma.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.enigma.completed, state.enigma.score || 0);
    return;
  }
  if (locked) locked.classList.add('hidden');

  // 2. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 3. TUTORIEL
  Tutorial.show({
    icon: '🛎️',
    title: 'HÔTEL 5 ÉTOILES',
    subtitle: 'ÉPREUVE 3',
    description: 'Les clients ont des requêtes ou des problèmes. Envoie le bon professionnel pour les aider !',
    steps: [
      { icon: '💬', text: 'Lis la demande formulée par le client.' },
      { icon: '🏨', text: 'Choisis le membre du personnel qualifié pour intervenir.' },
      { icon: '🎯', text: 'Trouve la bonne personne au moins 3 fois sur 5.' }
    ],
    buttonText: 'C\'EST PARTI !',
    theme: 'cyan'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // 4. LOGIQUE DU JEU
  function initGame() {
    var allPros = [
      { emoji: '🛎️', name: 'Réceptionniste', role: 'Accueil & réservations' },
      { emoji: '🧹', name: 'Femme de chambre', role: 'Ménage & linge' },
      { emoji: '🎩', name: 'Concierge', role: 'Services & conseils' },
      { emoji: '🍽️', name: 'Room Service', role: 'Repas en chambre' },
      { emoji: '🔧', name: 'Agent technique', role: 'Maintenance' },
      { emoji: '🤵', name: 'Directeur d\'hôtel', role: 'Gestion & décisions' }
    ];

    var situations = [
      {
        emoji: '😰', says: 'Bonjour, j\'arrive de l\'aéroport. J\'ai réservé une chambre au nom de Dupont, est-ce que tout est prêt ?',
        correctPro: 'Réceptionniste',
        explain: 'Le réceptionniste gère l\'arrivée (check-in), vérifie la réservation et donne la clé de chambre.'
      },
      {
        emoji: '😡', says: 'Il y a de l\'eau qui coule du plafond dans ma chambre ! C\'est inacceptable !',
        correctPro: 'Agent technique',
        explain: 'L\'agent technique (ou agent de maintenance) intervient pour les pannes, fuites et réparations.'
      },
      {
        emoji: '😊', says: 'Je voudrais un petit-déjeuner en chambre demain matin à 7h30, c\'est possible ?',
        correctPro: 'Room Service',
        explain: 'Le room service prépare et livre les repas directement en chambre — petit-déjeuner, déjeuner ou dîner.'
      },
      {
        emoji: '🤔', says: 'Pouvez-vous me réserver un taxi pour aller au musée du Louvre et me recommander un restaurant ?',
        correctPro: 'Concierge',
        explain: 'Le concierge est l\'expert local : réservations, recommandations, billets de spectacle, transport...'
      },
      {
        emoji: '😤', says: 'Les serviettes n\'ont pas été changées et le lit n\'est pas fait. Ma chambre n\'a pas été nettoyée !',
        correctPro: 'Femme de chambre',
        explain: 'La femme/le valet de chambre s\'occupe du ménage, du linge et de la présentation de chaque chambre.'
      },
      {
        emoji: '😟', says: 'Je viens de perdre mon passeport dans l\'hôtel, je ne sais plus quoi faire...',
        correctPro: 'Réceptionniste',
        explain: 'La réception est le point central : objets trouvés, urgences, et coordination avec toute l\'équipe.'
      },
      {
        emoji: '🤩', says: 'C\'est notre anniversaire de mariage ! Peut-on avoir un surclassement et du champagne en chambre ?',
        correctPro: 'Directeur d\'hôtel',
        explain: 'Le directeur prend les décisions commerciales : surclassements, gestes commerciaux, offres spéciales.'
      },
      {
        emoji: '😴', says: 'La climatisation ne marche plus et il fait 35°C dans la chambre, je ne peux pas dormir !',
        correctPro: 'Agent technique',
        explain: 'Climatisation, chauffage, électricité — tout ce qui est technique passe par l\'agent de maintenance.'
      }
    ];

    var order = getShuffledOrder('enigma', situations.length);
    var shuffled = order.map(function(i) { return situations[i]; }).slice(0, 5);

    var currentIndex = 0, correctCount = 0, errorCount = 0;
    var total = shuffled.length; // 5
    var isProcessing = false;

    function updateStats() {
      if (progressEl) progressEl.textContent = '🏨 ' + (currentIndex + 1) + ' / ' + total;
      if (correctEl) correctEl.textContent = '✅ ' + correctCount;
      if (errorsEl) errorsEl.textContent = '❌ ' + errorCount;
    }

    function shuffle(arr) {
      var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a;
    }

    function showSituation() {
      if (currentIndex >= total) { endGame(); return; }
      var sit = shuffled[currentIndex];
      updateStats();
      if (emojiEl) emojiEl.textContent = sit.emoji;
      if (saysEl) saysEl.textContent = sit.says;
      if (counterEl) counterEl.textContent = 'Situation ' + (currentIndex + 1) + ' / ' + total;
      if (explainEl) { explainEl.textContent = ''; explainEl.className = 'hotel-explain'; }
      if (situation) { situation.classList.remove('hotel-slide-in'); void situation.offsetWidth; situation.classList.add('hotel-slide-in'); }

      var correctProObj = allPros.find(function(p) { return p.name === sit.correctPro; });
      var others = allPros.filter(function(p) { return p.name !== sit.correctPro; });
      others = shuffle(others).slice(0, 2);
      var options = shuffle([correctProObj].concat(others));

      prosEl.innerHTML = '';
      // --- ANTI-STICKY HOVER JS ---
      prosEl.style.pointerEvents = 'none';
      setTimeout(function() { prosEl.style.pointerEvents = 'auto'; }, 150);
      // -----------------------------
      isProcessing = false;

      options.forEach(function(pro) {
        var el = document.createElement('div');
        el.className = 'hotel-pro';
        el.innerHTML = '<span class="hotel-pro-emoji">' + pro.emoji + '</span><span class="hotel-pro-name">' + pro.name + '</span><span class="hotel-pro-role">' + pro.role + '</span>';
        el.addEventListener('click', function() { handlePick(el, pro.name === sit.correctPro, sit, pro); });
        prosEl.appendChild(el);
      });
    }

    function handlePick(el, isCorrect, sit, pro) {
      if (isProcessing) return;
      isProcessing = true;
      var allProsEls = prosEl.querySelectorAll('.hotel-pro');
      allProsEls.forEach(function(p) { p.classList.add('disabled'); });

      if (isCorrect) {
        el.classList.remove('disabled');
        el.classList.add('correct-pick');
        correctCount++;
        if (explainEl) { explainEl.textContent = '💡 ' + sit.explain; explainEl.className = 'hotel-explain good'; }
      } else {
        el.classList.remove('disabled');
        el.classList.add('wrong-pick');
        errorCount++;
        allProsEls.forEach(function(p) {
          if (p.querySelector('.hotel-pro-name').textContent === sit.correctPro) { p.classList.remove('disabled'); p.classList.add('reveal'); }
        });
        if (explainEl) { explainEl.textContent = '💡 ' + sit.explain; explainEl.className = 'hotel-explain bad'; }
      }

      updateStats();
      currentIndex++;
      setTimeout(showSituation, 2200);
    }

    function endGame() {
      var success = correctCount >= 3;
      if (!state.enigma) state.enigma = { completed: null };
      state.enigma.completed = success;
      state.enigma.score = correctCount; // Mémorise le score pour le bypass
      saveGameState(state);
      setTimeout(function() { if (gameArea) gameArea.classList.add('hidden'); showResult(success, correctCount); }, 400);
    }

    updateStats();
    showSituation();
  }

  // 5. FONCTION SHOWRESULT
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
    
    if (resultScore) resultScore.textContent = score + ' / 5 situations résolues';
    
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
      if (resultTitle) resultTitle.textContent = 'HÔTEL 5 ÉTOILES !';
      if (resultText) resultText.textContent = 'Tu sais qui fait quoi dans un hôtel ! Demande à l\'intervenant quel poste l\'intéresse le plus. Dernière étoile débloquée !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) {
        resultBox.classList.remove('fail-effect'); 
        void resultBox.offsetWidth; 
        resultBox.classList.add('fail-effect', 'fail');
      }

      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'CLIENTS MÉCONTENTS';
      if (resultText) resultText.textContent = 'Il fallait au moins 3/5. Profite de l\'échange pour découvrir ces métiers ! Étoile verrouillée.';
    }
  }
});