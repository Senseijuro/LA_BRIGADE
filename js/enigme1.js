document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var emojiEl = document.getElementById('bg-emoji');
  var titleEl = document.getElementById('bg-title');
  var subEl = document.getElementById('bg-sub');
  var roleCard = document.getElementById('bg-role-card');
  var choicesEl = document.getElementById('bg-choices');
  var explainEl = document.getElementById('bg-explain');
  var progressEl = document.getElementById('bg-progress');
  var correctEl = document.getElementById('bg-correct');
  var errorsEl = document.getElementById('bg-errors');

  // 1. BYPASS
  if (state.enigme1 && state.enigme1.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    showResult(state.enigme1.completed);
    return;
  }

  // 2. CACHER LE JEU AU DÉMARRAGE
  if (gameArea) gameArea.classList.add('hidden');

  // 3. AFFICHER LE TUTORIEL
  Tutorial.show({
    icon: '👨‍🍳',
    title: 'BRIGADE EN CUISINE',
    subtitle: 'ÉPREUVE 1',
    description: 'Associe chaque rôle de la cuisine à sa vraie mission.',
    steps: [
      { icon: '📖', text: 'Lis la description du poste qui s\'affiche.' },
      { icon: '🤔', text: 'Réfléchis au membre de la brigade concerné.' },
      { icon: '👆', text: 'Clique sur la bonne réponse parmi les 3 propositions.' },
      { icon: '🎯', text: 'Obtiens au moins 3 bonnes réponses sur 5 !' }
    ],
    warning: 'Ne confonds pas les rôles, le service doit être parfait !',
    buttonText: 'C\'EST PARTI !',
    theme: 'gold'
  }).then(function() {
    if (window.globalTimer) globalTimer.start();
    if (gameArea) gameArea.classList.remove('hidden');
    initGame();
  });

  // 4. LOGIQUE DU JEU
  function initGame() {
    var roles = [
      {
        emoji: '👨‍🍳', title: 'CHEF DE CUISINE', sub: 'Le patron des fourneaux',
        correct: 'Il dirige toute la cuisine : il crée les recettes, supervise l\'équipe et goûte chaque plat avant qu\'il parte en salle',
        wrongs: ['Il fait uniquement la vaisselle et nettoie la cuisine', 'Il accueille les clients et prend les réservations'],
        explain: 'Le Chef, c\'est le boss de la cuisine. Il décide du menu et tout le monde suit ses ordres !'
      },
      {
        emoji: '🧑‍🍳', title: 'COMMIS DE CUISINE', sub: 'L\'apprenti en cuisine',
        correct: 'Il prépare les ingrédients, épluche les légumes et assiste les cuisiniers plus expérimentés',
        wrongs: ['Il gère la comptabilité et les finances du restaurant', 'Il conduit le camion de livraison des aliments'],
        explain: 'C\'est le premier poste en cuisine — tout le monde commence commis avant de monter en grade !'
      },
      {
        emoji: '🍷', title: 'SOMMELIER', sub: 'L\'expert des vins',
        correct: 'Il conseille les clients sur le choix du vin en accord avec leur plat et gère la cave',
        wrongs: ['Il prépare les cocktails et les jus de fruits au bar', 'Il fait le ménage de la salle après le service'],
        explain: 'Le sommelier a un nez incroyable ! Il peut reconnaître des centaines de vins différents.'
      },
      {
        emoji: '🤵', title: 'MAÎTRE D\'HÔTEL', sub: 'Le chef de la salle',
        correct: 'Il accueille les clients, les place à leur table et coordonne tout le service en salle',
        wrongs: ['Il cuisine les desserts et les pâtisseries', 'Il répare les équipements cassés de la cuisine'],
        explain: 'Le maître d\'hôtel est le premier visage que les clients voient — l\'image du restaurant !'
      },
      {
        emoji: '🧹', title: 'PLONGEUR', sub: 'L\'indispensable',
        correct: 'Il lave toute la vaisselle, les ustensiles et maintient la cuisine propre pendant le service',
        wrongs: ['Il plonge dans la piscine de l\'hôtel pour vérifier l\'eau', 'Il prépare les entrées froides et les salades'],
        explain: 'Sans plongeur, aucun restaurant ne tourne ! C\'est souvent le premier job en restauration.'
      },
      {
        emoji: '🥐', title: 'PÂTISSIER', sub: 'Le maître du sucré',
        correct: 'Il prépare tous les desserts, gâteaux, viennoiseries et pains du restaurant',
        wrongs: ['Il s\'occupe uniquement de griller les viandes', 'Il gère les réservations par téléphone'],
        explain: 'Le pâtissier est un artiste ! Il peut travailler en restaurant, en boulangerie ou en hôtel.'
      },
      {
        emoji: '🔥', title: 'CHEF DE PARTIE', sub: 'Le spécialiste d\'un poste',
        correct: 'Il est responsable d\'un secteur précis : les viandes, les poissons, les sauces ou les garnitures',
        wrongs: ['Il est le DJ qui met la musique dans le restaurant', 'Il livre les plats à domicile en vélo'],
        explain: 'Saucier, poissonnier, rôtisseur… chaque chef de partie est expert de son domaine !'
      },
      {
        emoji: '📋', title: 'SERVEUR', sub: 'Le lien avec le client',
        correct: 'Il prend les commandes des clients, apporte les plats et s\'assure que tout se passe bien à table',
        wrongs: ['Il décide du prix des plats sur le menu', 'Il choisit les ingrédients au marché le matin'],
        explain: 'Un bon serveur connaît le menu par cœur et sait conseiller les clients !'
      }
    ];

    var order = getShuffledOrder('enigme1', roles.length);
    var shuffled = order.map(function(i) { return roles[i]; }).slice(0, 5);

    var currentIndex = 0, correctCount = 0, errorCount = 0;
    var total = shuffled.length;
    var isProcessing = false;

    function updateStats() {
      if (progressEl) progressEl.textContent = '👨‍🍳 ' + (currentIndex + 1) + ' / ' + total;
      if (correctEl) correctEl.textContent = '✅ ' + correctCount;
      if (errorsEl) errorsEl.textContent = '❌ ' + errorCount;
    }

    function shuffle(arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }

    function showRole() {
      if (currentIndex >= total) { endGame(); return; }
      var role = shuffled[currentIndex];
      updateStats();
      if (emojiEl) emojiEl.textContent = role.emoji;
      if (titleEl) titleEl.textContent = role.title;
      if (subEl) subEl.textContent = role.sub;
      if (explainEl) { explainEl.textContent = ''; explainEl.className = 'brigade-explain'; }
      if (roleCard) { roleCard.classList.remove('brigade-slide-in'); void roleCard.offsetWidth; roleCard.classList.add('brigade-slide-in'); }

      var options = [{ text: role.correct, isCorrect: true }];
      role.wrongs.forEach(function(w) { options.push({ text: w, isCorrect: false }); });
      options = shuffle(options);

      choicesEl.innerHTML = '';
      // --- ANTI-STICKY HOVER JS ---
      choicesEl.style.pointerEvents = 'none';
      setTimeout(function() { choicesEl.style.pointerEvents = 'auto'; }, 150);
      // -----------------------------
      isProcessing = false;

      options.forEach(function(opt) {
        var el = document.createElement('div');
        el.className = 'brigade-choice';
        el.textContent = opt.text;
        el.addEventListener('click', function() { handlePick(el, opt.isCorrect, role); });
        choicesEl.appendChild(el);
      });
    }

    function handlePick(el, isCorrect, role) {
      if (isProcessing) return;
      isProcessing = true;
      var allChoices = choicesEl.querySelectorAll('.brigade-choice');
      allChoices.forEach(function(c) { c.classList.add('disabled'); });

      if (isCorrect) {
        el.classList.remove('disabled');
        el.classList.add('correct-pick');
        correctCount++;
        if (explainEl) { explainEl.textContent = '💡 ' + role.explain; explainEl.className = 'brigade-explain good'; }
      } else {
        el.classList.remove('disabled');
        el.classList.add('wrong-pick');
        errorCount++;
        allChoices.forEach(function(c) {
          if (c.textContent === role.correct) { c.classList.remove('disabled'); c.classList.add('reveal'); }
        });
        if (explainEl) { explainEl.textContent = '💡 ' + role.explain; explainEl.className = 'brigade-explain bad'; }
      }

      updateStats();
      currentIndex++;
      setTimeout(showRole, 2200);
    }

    function endGame() {
      var success = correctCount >= 3;
      if (!state.enigme1) state.enigme1 = { completed: null };
      state.enigme1.completed = success;
      saveGameState(state);
      setTimeout(function() { if (gameArea) gameArea.classList.add('hidden'); showResult(success); }, 400);
    }

    updateStats();
    showRole();
  }

  // 5. FONCTION SHOWRESULT
  function showResult(success) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var resultBox = document.getElementById('result-box');
    var resultIcon = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');
    var resultScore = document.getElementById('result-score');
    
    // Si on a le score direct, on l'affiche
    var currentState = getGameState();
    if (resultScore && currentState.enigme1) {
       resultScore.textContent = (currentState.enigme1.completed ? 'Défi réussi' : 'Défi échoué');
    }
    
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
      if (resultTitle) resultTitle.textContent = 'BRIGADE COMPLÈTE !';
      if (resultText) resultText.textContent = 'Tu connais les postes de la cuisine ! Demande à l\'intervenant lequel l\'intéresse le plus. Étoile débloquée !';
    } else {
      if (navigator.vibrate) navigator.vibrate([50, 100, 50, 100, 50]); 
      if (resultBox) {
        resultBox.classList.remove('fail-effect'); 
        void resultBox.offsetWidth; 
        resultBox.classList.add('fail-effect', 'fail');
      }

      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'BRIGADE INCOMPLÈTE';
      if (resultText) resultText.textContent = 'Il fallait au moins 3/5. Profite de l\'échange avec l\'intervenant pour découvrir ces métiers ! Étoile verrouillée.';
    }
  }
});