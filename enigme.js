document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var locked = document.getElementById('locked');
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');

  if (!state.quiz || state.quiz.completed === null) {
    if (locked) locked.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    return;
  }

  if (state.enigma && state.enigma.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.enigma.completed, 0);
    return;
  }

  if (locked) locked.classList.add('hidden');

  // Tous les plats possibles
  var allDishes = [
    { emoji: '🥗', text: 'Salade César' },
    { emoji: '🍜', text: 'Soupe à l\'oignon' },
    { emoji: '🥖', text: 'Bruschetta' },
    { emoji: '🍝', text: 'Pâtes carbonara' },
    { emoji: '🥩', text: 'Steak frites' },
    { emoji: '🐟', text: 'Filet de saumon' },
    { emoji: '🍗', text: 'Poulet rôti' },
    { emoji: '🍕', text: 'Pizza margherita' },
    { emoji: '🍰', text: 'Fondant chocolat' },
    { emoji: '🍮', text: 'Crème brûlée' },
    { emoji: '🧁', text: 'Tiramisu' },
    { emoji: '🍦', text: 'Glace vanille' },
    { emoji: '🥐', text: 'Croissant' },
    { emoji: '🧀', text: 'Plateau fromages' },
    { emoji: '🍷', text: 'Jus de fruit' }
  ];

  var customers = [
    { avatar: '👦', name: 'Client 1', dishCount: 3 },
    { avatar: '👩', name: 'Client 2', dishCount: 3 },
    { avatar: '🧔', name: 'Client 3', dishCount: 3 }
  ];

  var currentRound = 0;
  var totalCorrect = 0;
  var totalErrors = 0;
  var roundOrders = []; // Ce que chaque client a commandé

  // Préparer les commandes à l'avance
  var shuffledAll = allDishes.slice();
  // Fisher-Yates
  for (var i = shuffledAll.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = shuffledAll[i]; shuffledAll[i] = shuffledAll[j]; shuffledAll[j] = tmp;
  }
  // Client 1: plats 0-2, Client 2: 3-5, Client 3: 6-8
  for (var r = 0; r < 3; r++) {
    roundOrders.push(shuffledAll.slice(r * 3, r * 3 + 3));
  }

  var roundEl = document.getElementById('cmd-round');
  var scoreEl = document.getElementById('cmd-score');
  var errorsEl = document.getElementById('cmd-errors');
  var avatarEl = document.getElementById('cmd-avatar');
  var msgEl = document.getElementById('cmd-msg');
  var memoZone = document.getElementById('cmd-memo-zone');
  var selectZone = document.getElementById('cmd-select-zone');
  var orderDisplay = document.getElementById('cmd-order-display');
  var timerEl = document.getElementById('cmd-timer');
  var grid = document.getElementById('cmd-grid');
  var hintEl = document.getElementById('cmd-hint');

  function updateStats() {
    if (roundEl) roundEl.textContent = '🍽️ Client ' + (currentRound + 1) + ' / 3';
    if (scoreEl) scoreEl.textContent = '✅ ' + totalCorrect;
    if (errorsEl) errorsEl.textContent = '❌ ' + totalErrors;
  }

  function startRound() {
    if (currentRound >= 3) { endGame(); return; }

    var customer = customers[currentRound];
    var order = roundOrders[currentRound];

    updateStats();
    if (avatarEl) avatarEl.textContent = customer.avatar;
    if (msgEl) msgEl.textContent = 'Bonjour ! Voici ma commande, mémorise-la bien...';

    // Phase mémo: montrer la commande
    memoZone.style.display = '';
    selectZone.style.display = 'none';

    orderDisplay.innerHTML = '';
    order.forEach(function(dish) {
      var el = document.createElement('div');
      el.className = 'cmd-order-item';
      el.innerHTML = '<span class="cmd-order-item-emoji">' + dish.emoji + '</span>' +
                     '<span class="cmd-order-item-text">' + dish.text + '</span>';
      orderDisplay.appendChild(el);
    });

    // Countdown 5 secondes
    var countdown = 5;
    if (timerEl) timerEl.textContent = countdown;

    var countInterval = setInterval(function() {
      countdown--;
      if (timerEl) timerEl.textContent = countdown;
      if (countdown <= 0) {
        clearInterval(countInterval);
        startSelection();
      }
    }, 1000);
  }

  function startSelection() {
    var order = roundOrders[currentRound];
    memoZone.style.display = 'none';
    selectZone.style.display = '';
    if (msgEl) msgEl.textContent = 'C\'était quoi ma commande déjà ? Retrouve mes 3 plats !';

    // Créer une grille de 8 plats: 3 corrects + 5 leurres
    var orderIds = order.map(function(d) { return d.emoji; });
    var lures = allDishes.filter(function(d) { return orderIds.indexOf(d.emoji) === -1; });
    // Shuffle lures
    for (var i = lures.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = lures[i]; lures[i] = lures[j]; lures[j] = tmp;
    }
    var gridItems = order.concat(lures.slice(0, 5));
    // Shuffle grid
    for (var i = gridItems.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = gridItems[i]; gridItems[i] = gridItems[j]; gridItems[j] = tmp;
    }

    grid.innerHTML = '';
    var foundThisRound = 0;
    var errorsThisRound = 0;

    gridItems.forEach(function(dish) {
      var isCorrect = orderIds.indexOf(dish.emoji) !== -1;
      var el = document.createElement('div');
      el.className = 'cmd-dish';
      el.innerHTML = '<span class="cmd-dish-emoji">' + dish.emoji + '</span>' +
                     '<span class="cmd-dish-text">' + dish.text + '</span>';
      el.addEventListener('click', function() {
        if (el.classList.contains('selected-correct') || el.classList.contains('selected-wrong')) return;

        if (isCorrect) {
          el.classList.add('selected-correct');
          foundThisRound++;
          totalCorrect++;
          updateStats();

          if (foundThisRound >= 3) {
            // Prochain client
            setTimeout(function() {
              currentRound++;
              startRound();
            }, 800);
          }
        } else {
          el.classList.add('selected-wrong');
          errorsThisRound++;
          totalErrors++;
          updateStats();

          // 3 erreurs dans un round = passe au suivant
          if (errorsThisRound >= 3) {
            setTimeout(function() {
              currentRound++;
              startRound();
            }, 800);
          }
        }
      });
      grid.appendChild(el);
    });

    if (hintEl) hintEl.textContent = 'Trouve les 3 plats de la commande (attention aux leurres !)';
  }

  function endGame() {
    var success = totalCorrect >= 7 && totalErrors <= 4;
    if (!state.enigma) state.enigma = { completed: null };
    state.enigma.completed = success;
    saveGameState(state);

    setTimeout(function() {
      if (gameArea) gameArea.classList.add('hidden');
      showResult(success, totalCorrect);
    }, 500);
  }

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

    if (resultScore) resultScore.textContent = score + ' / 9 plats retrouvés';

    if (success) {
      if (resultBox) resultBox.classList.add('success');
      if (resultIcon) resultIcon.textContent = '✓';
      if (resultTitle) resultTitle.textContent = 'SERVICE PARFAIT !';
      if (resultText) resultText.textContent = 'Tu as une mémoire de chef ! Tous les clients sont satisfaits. Dernière étoile débloquée !';
    } else {
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'COMMANDES MÉLANGÉES';
      if (resultText) resultText.textContent = totalErrors > 4
        ? 'Trop d\'erreurs ! Les clients ont reçu les mauvais plats. Étoile verrouillée.'
        : 'Il fallait retrouver au moins 7 plats sur 9. Étoile verrouillée.';
    }
  }

  updateStats();
  startRound();
});
