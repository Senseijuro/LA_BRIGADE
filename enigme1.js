document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var timeLeft = 60; 
  var timerInterval = null;
  var timerRunning = false;
  var hasValidated = false;

  var enigme1Layout = document.getElementById('enigme1-layout');
  var validation = document.getElementById('validation');
  var result = document.getElementById('result');
  var btnStart = document.getElementById('btn-start');
  var timerMin = document.getElementById('timer-min');
  var timerSec = document.getElementById('timer-sec');
  var warningBox = document.getElementById('warning-box');
  var backBtn = document.getElementById('back-btn');
  var btnYes = document.getElementById('btn-yes');
  var btnNo = document.getElementById('btn-no');
  var timerContainer = document.querySelector('.timer-container');

  updateTimerDisplay(timerMin, timerSec, timeLeft);

  // Si déjà terminé, afficher le résultat
  if (state.enigme1 && state.enigme1.completed !== null) {
    hasValidated = true;
    if (enigme1Layout) enigme1Layout.classList.add('hidden');
    showResult(state.enigme1.completed);
    
    if (backBtn) {
      backBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
      });
    }
    return;
  }

  // S'assurer que le layout est visible
  if (enigme1Layout) {
    enigme1Layout.classList.remove('hidden');
    enigme1Layout.style.display = 'grid';
  }

  // Quitter via bouton retour = ÉCHOUÉ
  if (backBtn) {
    backBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (!hasValidated && timerRunning) {
        if (!state.enigme1) state.enigme1 = { completed: null };
        state.enigme1.completed = false;
        saveGameState(state);
        alert('⚠️ Vous avez quitté l\'épreuve. Mission échouée !');
      }
      window.location.href = 'index.html';
    });
  }

  // Quitter via fermeture/navigation = ÉCHOUÉ (seulement si timer en cours)
  window.addEventListener('beforeunload', function() {
    if (!hasValidated && timerRunning) {
      if (!state.enigme1) state.enigme1 = { completed: null };
      state.enigme1.completed = false;
      saveGameState(state);
    }
  });

  function scrollToValidation() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (timerContainer) {
      setTimeout(function() {
        timerContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    if (btnStart) { btnStart.disabled = true; btnStart.textContent = 'EN COURS...'; }
    if (warningBox) warningBox.classList.add('active');

    timerInterval = setInterval(function() {
      timeLeft--;
      updateTimerDisplay(timerMin, timerSec, timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        if (btnStart) btnStart.textContent = 'TERMINÉ';
        if (warningBox) warningBox.classList.add('hidden');
        if (validation) validation.classList.remove('hidden');
        scrollToValidation();
      }
    }, 1000);
  }

  function validate(success) {
    hasValidated = true;
    if (!state.enigme1) state.enigme1 = { completed: null };
    state.enigme1.completed = success;
    timerRunning = false;
    if (timerInterval) clearInterval(timerInterval);
    saveGameState(state);
    if (validation) validation.classList.add('hidden');
    if (enigme1Layout) enigme1Layout.classList.add('hidden');
    showResult(success);
  }

  function showResult(success) {
    if (result) result.classList.remove('hidden');
    if (enigme1Layout) enigme1Layout.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    var resultBox = document.getElementById('result-box');
    var resultIcon = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');

    if (success) {
      if (resultBox) resultBox.classList.add('success');
      if (resultIcon) resultIcon.textContent = '✓';
      if (resultTitle) resultTitle.textContent = 'ÉPREUVE RÉUSSIE !';
      if (resultText) resultText.textContent = 'Bravo ! Vous avez débloqué une récompense dans le coffre.';
    } else {
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'ÉPREUVE ÉCHOUÉE';
      if (resultText) resultText.textContent = 'Dommage ! La récompense reste verrouillée.';
    }
  }

  if (btnStart) btnStart.addEventListener('click', startTimer);
  if (btnYes) btnYes.addEventListener('click', function() { validate(true); });
  if (btnNo) btnNo.addEventListener('click', function() { validate(false); });
});
