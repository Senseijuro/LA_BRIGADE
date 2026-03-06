document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var gameArea = document.getElementById('game-area');
  var resultDiv = document.getElementById('result');
  var arena = document.getElementById('mep-arena');
  var correctEl = document.getElementById('mep-correct');
  var progressEl = document.getElementById('mep-progress');
  var errorsEl = document.getElementById('mep-errors');

  if (state.enigme1 && state.enigme1.completed !== null) {
    if (gameArea) gameArea.classList.add('hidden');
    showResult(state.enigme1.completed);
    return;
  }

  // 10 bons ustensiles + 5 intrus
  var goodItems = [
    { emoji: '🍳', text: 'Poêle' },
    { emoji: '🔪', text: 'Couteau de chef' },
    { emoji: '🥄', text: 'Louche' },
    { emoji: '🍲', text: 'Casserole' },
    { emoji: '🧑‍🍳', text: 'Toque' },
    { emoji: '🥣', text: 'Saladier' },
    { emoji: '🫕', text: 'Marmite' },
    { emoji: '🧤', text: 'Gant de four' },
    { emoji: '⏲️', text: 'Minuteur' },
    { emoji: '🧂', text: 'Sel & Poivre' }
  ];

  var badItems = [
    { emoji: '⚽', text: 'Ballon' },
    { emoji: '📱', text: 'Smartphone' },
    { emoji: '🎸', text: 'Guitare' },
    { emoji: '🧸', text: 'Peluche' },
    { emoji: '🩴', text: 'Tongs' }
  ];

  // Construire la séquence: 15 items (10 bons + 5 mauvais) mélangés
  var allItems = [];
  goodItems.forEach(function(it) { allItems.push({ emoji: it.emoji, text: it.text, good: true }); });
  badItems.forEach(function(it) { allItems.push({ emoji: it.emoji, text: it.text, good: false }); });

  var order = getShuffledOrder('enigme1', allItems.length);
  var sequence = order.map(function(i) { return allItems[i]; });

  var currentIndex = 0;
  var correctCount = 0;
  var errorCount = 0;
  var missedCount = 0;
  var total = sequence.length;
  var totalGood = 10;
  var itemTimeout = null;
  var gameOver = false;

  function updateStats() {
    if (correctEl) correctEl.textContent = '✅ ' + correctCount;
    if (progressEl) progressEl.textContent = '📦 ' + currentIndex + ' / ' + total;
    if (errorsEl) errorsEl.textContent = '❌ ' + (errorCount + missedCount);
  }

  function getRandomPos() {
    var arenaRect = arena.getBoundingClientRect();
    var maxX = Math.max(50, arenaRect.width - 100);
    var maxY = Math.max(50, arenaRect.height - 100);
    return {
      x: Math.floor(Math.random() * maxX) + 10,
      y: Math.floor(Math.random() * maxY) + 10
    };
  }

  function spawnItem() {
    if (gameOver || currentIndex >= total) { endGame(); return; }

    var item = sequence[currentIndex];
    var pos = getRandomPos();

    var el = document.createElement('div');
    el.className = 'mep-item';
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    el.innerHTML = '<span class="mep-item-emoji">' + item.emoji + '</span>' +
                   '<span class="mep-item-text">' + item.text + '</span>';

    el.addEventListener('click', function() {
      if (el.classList.contains('correct-grab') || el.classList.contains('wrong-grab')) return;
      clearTimeout(itemTimeout);

      if (item.good) {
        correctCount++;
        el.classList.add('correct-grab');
      } else {
        errorCount++;
        el.classList.add('wrong-grab');
      }
      updateStats();

      setTimeout(function() {
        if (el.parentNode) el.parentNode.removeChild(el);
        currentIndex++;
        if (currentIndex >= total) { endGame(); }
        else { spawnItem(); }
      }, 400);
    });

    arena.appendChild(el);

    // L'objet disparaît après 2.5s si pas cliqué
    itemTimeout = setTimeout(function() {
      if (el.parentNode) {
        if (item.good) {
          missedCount++; // Raté un bon ustensile
          el.classList.add('missed');
        } else {
          // Bien ignoré un intrus, pas de pénalité
          el.classList.add('missed');
        }
        updateStats();
        setTimeout(function() {
          if (el.parentNode) el.parentNode.removeChild(el);
          currentIndex++;
          if (currentIndex >= total) { endGame(); }
          else { spawnItem(); }
        }, 300);
      }
    }, 2500);
  }

  function endGame() {
    if (gameOver) return;
    gameOver = true;
    clearTimeout(itemTimeout);

    var success = correctCount >= 7 && (errorCount + missedCount) <= 4;
    if (!state.enigme1) state.enigme1 = { completed: null };
    state.enigme1.completed = success;
    saveGameState(state);

    setTimeout(function() {
      if (gameArea) gameArea.classList.add('hidden');
      showResult(success);
    }, 500);
  }

  function showResult(success) {
    if (resultDiv) resultDiv.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    var resultBox = document.getElementById('result-box');
    var resultIcon = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');
    var resultScore = document.getElementById('result-score');

    if (resultScore) resultScore.textContent = correctCount + ' ustensiles attrapés';

    if (success) {
      if (resultBox) resultBox.classList.add('success');
      if (resultIcon) resultIcon.textContent = '✓';
      if (resultTitle) resultTitle.textContent = 'CUISINE PRÊTE !';
      if (resultText) resultText.textContent = 'Bravo commis ! Ta mise en place est impeccable. Étoile débloquée !';
    } else {
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'MISE EN PLACE RATÉE';
      if (resultText) resultText.textContent = 'Tu as raté trop d\'ustensiles ou attrapé trop d\'intrus. Étoile verrouillée.';
    }
  }

  updateStats();
  // Petit délai avant de commencer
  setTimeout(function() { spawnItem(); }, 800);
});
