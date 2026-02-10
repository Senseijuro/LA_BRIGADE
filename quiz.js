document.addEventListener('DOMContentLoaded', function() {
  var state = getGameState();
  var hasValidated = false;

  var questions = [
    { 
      question: "Combien d'étoiles maximum un restaurant peut-il recevoir au Guide Michelin ?", 
      options: [
        "2 étoiles", 
        "3 étoiles", 
        "5 étoiles",
        "10 étoiles"
      ], 
      correct: 1 
    },
    { 
      question: "Avant de cuisiner ou de servir des clients, quelle est la première chose qu'un professionnel de la restauration doit TOUJOURS faire ?", 
      options: [
        "Mettre sa toque", 
        "Goûter les plats", 
        "Se laver les mains", 
        "Allumer les fourneaux"
      ], 
      correct: 2 
    },
    { 
      question: "Dans un hôtel, comment appelle-t-on le repas du matin qui est souvent inclus dans le prix de la chambre ?", 
      options: [
        "Le brunch", 
        "Le room service", 
        "Le petit-déjeuner continental",
        "Le goûter"
      ], 
      correct: 2 
    }
  ];

  var currentQuestion = 0;
  var correctAnswers = 0;

  var locked = document.getElementById('locked');
  var quizLayout = document.getElementById('quiz-layout');
  var quizStartBox = document.getElementById('quiz-start-box');
  var quizContent = document.getElementById('quiz-content');
  var result = document.getElementById('result');
  var questionEl = document.getElementById('question');
  var optionsEl = document.getElementById('options');
  var progressText = document.getElementById('progress-text');
  var progressFill = document.getElementById('progress-fill');
  var backBtn = document.getElementById('back-btn');
  var btnStartQuiz = document.getElementById('btn-start-quiz');

  if (!state.enigme1 || state.enigme1.completed === null) {
    hasValidated = true;
    if (locked) locked.classList.remove('hidden');
    if (quizLayout) quizLayout.classList.add('hidden');
    
    if (backBtn) {
      backBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
      });
    }
    return;
  }

  if (state.quiz && state.quiz.completed !== null) {
    hasValidated = true;
    if (quizLayout) quizLayout.classList.add('hidden');
    if (locked) locked.classList.add('hidden');
    showResult(state.quiz.completed, state.quiz.score || 0);
    
    if (backBtn) {
      backBtn.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'index.html';
      });
    }
    return;
  }
  
  if (locked) locked.classList.add('hidden');
  if (quizLayout) {
    quizLayout.classList.remove('hidden');
    quizLayout.style.display = 'grid';
  }
  if (quizStartBox) quizStartBox.classList.remove('hidden');
  if (quizContent) quizContent.classList.add('hidden');

  if (backBtn) {
    backBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (!hasValidated) {
        if (!state.quiz) state.quiz = { completed: null, score: 0 };
        state.quiz.completed = false;
        state.quiz.score = 0;
        saveGameState(state);
        alert('⚠️ T\'as quitté la cuisine. Service annulé pour cette épreuve !');
      }
      window.location.href = 'index.html';
    });
  }

  window.addEventListener('beforeunload', function() {
    if (!hasValidated) {
      if (!state.quiz) state.quiz = { completed: null, score: 0 };
      state.quiz.completed = false;
      state.quiz.score = 0;
      saveGameState(state);
    }
  });

  if (btnStartQuiz) {
    btnStartQuiz.addEventListener('click', function() {
      if (quizStartBox) quizStartBox.classList.add('hidden');
      if (quizContent) quizContent.classList.remove('hidden');
      showQuestion();
    });
  }

  function showQuestion() {
    var q = questions[currentQuestion];
    if (progressText) progressText.textContent = 'Question ' + (currentQuestion + 1) + '/3';
    if (progressFill) progressFill.style.width = (((currentQuestion + 1) / 3) * 100) + '%';
    if (questionEl) questionEl.textContent = q.question;

    if (optionsEl) {
      optionsEl.innerHTML = '';
      q.options.forEach(function(opt, i) {
        var btn = document.createElement('button');
        btn.className = 'quiz-option';
        btn.textContent = opt;
        btn.addEventListener('click', function() { selectAnswer(i); });
        optionsEl.appendChild(btn);
      });
    }
  }

  function selectAnswer(selected) {
    var q = questions[currentQuestion];
    document.querySelectorAll('.quiz-option').forEach(function(opt, i) {
      opt.disabled = true;
      opt.style.pointerEvents = 'none';
      if (i === q.correct) opt.classList.add('correct');
      else if (i === selected) opt.classList.add('wrong');
    });
    if (selected === q.correct) correctAnswers++;

    setTimeout(function() {
      currentQuestion++;
      if (currentQuestion < questions.length) showQuestion();
      else finishQuiz();
    }, 1000);
  }

  function finishQuiz() {
    hasValidated = true;
    var success = correctAnswers >= 2;
    if (!state.quiz) state.quiz = { completed: null, score: 0 };
    state.quiz.completed = success;
    state.quiz.score = correctAnswers;
    saveGameState(state);
    if (quizLayout) quizLayout.classList.add('hidden');
    showResult(success, correctAnswers);
  }

  function showResult(success, score) {
    if (result) result.classList.remove('hidden');
    if (locked) locked.classList.add('hidden');
    if (quizLayout) quizLayout.classList.add('hidden');

    var resultBox = document.getElementById('result-box');
    var resultIcon = document.getElementById('result-icon');
    var resultTitle = document.getElementById('result-title');
    var resultText = document.getElementById('result-text');
    var resultScore = document.getElementById('result-score');

    if (resultScore) resultScore.textContent = 'Score : ' + score + '/3';

    if (success) {
      if (resultBox) resultBox.classList.add('success');
      if (resultIcon) resultIcon.textContent = '✔';
      if (resultTitle) resultTitle.textContent = 'QUIZ VALIDÉ !';
      if (resultText) resultText.textContent = 'Bien joué ! T\'as décroché une étoile dans le livre de recettes.';
    } else {
      if (resultBox) resultBox.classList.add('fail');
      if (resultIcon) resultIcon.textContent = '✗';
      if (resultTitle) resultTitle.textContent = 'QUIZ RATÉ';
      if (resultText) resultText.textContent = 'Il fallait au moins 2 bonnes réponses. L\'étoile reste verrouillée.';
    }
  }
});
