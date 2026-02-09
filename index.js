document.addEventListener('DOMContentLoaded', function() {
  
  document.querySelectorAll('.poster-img').forEach(function(img) {
    if (img.complete && img.naturalHeight !== 0) {
      img.classList.add('loaded');
    }
    img.addEventListener('load', function() {
      img.classList.add('loaded');
    });
    img.addEventListener('error', function() {
      img.classList.remove('loaded');
    });
  });

  var currentSlide = 0;
  var totalSlides = 5;
  var track = document.getElementById('slider-track');
  var dots = document.querySelectorAll('.dot');
  var btnPrev = document.getElementById('btn-prev');
  var btnNext = document.getElementById('btn-next');
  var viewport = document.querySelector('.slider-viewport');

  function goToSlide(index) {
    if (index < 0) index = 0;
    if (index >= totalSlides) index = totalSlides - 1;
    currentSlide = index;
    
    if (track) {
      track.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
    }
    
    dots.forEach(function(dot, i) {
      if (i === currentSlide) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', function() {
      goToSlide(currentSlide - 1);
    });
  }
  
  if (btnNext) {
    btnNext.addEventListener('click', function() {
      goToSlide(currentSlide + 1);
    });
  }

  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      goToSlide(parseInt(dot.dataset.index));
    });
  });

  var touchStartX = 0;
  
  if (viewport) {
    viewport.addEventListener('touchstart', function(e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    viewport.addEventListener('touchend', function(e) {
      var touchEndX = e.changedTouches[0].clientX;
      var diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToSlide(currentSlide + 1);
        } else {
          goToSlide(currentSlide - 1);
        }
      }
    }, { passive: true });
  }

  function updateDisplay() {
    var state = getGameState();

    // Epreuve 1 : Enigme 1 - Les Indices du Saboteur
    var cardEnigme1 = document.getElementById('card-enigme1');
    var statusEnigme1 = document.getElementById('status-enigme1');
    var btnEnigme1 = document.getElementById('btn-enigme1');

    if (cardEnigme1 && statusEnigme1 && btnEnigme1) {
      if (state.enigme1 && state.enigme1.completed === true) {
        statusEnigme1.innerHTML = '<span class="status-dot success"></span><span>Reussi</span>';
        btnEnigme1.textContent = 'TERMINE';
        btnEnigme1.classList.add('success');
      } else if (state.enigme1 && state.enigme1.completed === false) {
        statusEnigme1.innerHTML = '<span class="status-dot fail"></span><span>Echoue</span>';
        btnEnigme1.textContent = 'ECHOUE';
        btnEnigme1.classList.add('fail');
      }
    }

    // Epreuve 2 : Quiz BTP
    var cardQuiz = document.getElementById('card-quiz');
    var statusQuiz = document.getElementById('status-quiz');
    var btnQuiz = document.getElementById('btn-quiz');

    if (cardQuiz && statusQuiz && btnQuiz) {
      if (state.enigme1 && state.enigme1.completed !== null) {
        cardQuiz.classList.remove('locked');
        btnQuiz.classList.remove('disabled');
        btnQuiz.textContent = 'COMMENCER';
        statusQuiz.innerHTML = '<span class="status-dot"></span><span>A faire</span>';

        if (state.quiz && state.quiz.completed === true) {
          statusQuiz.innerHTML = '<span class="status-dot success"></span><span>Reussi</span>';
          btnQuiz.textContent = 'TERMINE';
          btnQuiz.classList.add('success');
        } else if (state.quiz && state.quiz.completed === false) {
          statusQuiz.innerHTML = '<span class="status-dot fail"></span><span>Echoue</span>';
          btnQuiz.textContent = 'ECHOUE';
          btnQuiz.classList.add('fail');
        }
      }
    }

    // Epreuve 3 : Enigme finale - Les Gardiens du Chantier
    var cardEnigma = document.getElementById('card-enigma');
    var statusEnigma = document.getElementById('status-enigma');
    var btnEnigma = document.getElementById('btn-enigma');

    if (cardEnigma && statusEnigma && btnEnigma) {
      if (state.quiz && state.quiz.completed !== null) {
        cardEnigma.classList.remove('locked');
        btnEnigma.classList.remove('disabled');
        btnEnigma.textContent = 'COMMENCER';
        statusEnigma.innerHTML = '<span class="status-dot"></span><span>A faire</span>';

        if (state.enigma && state.enigma.completed === true) {
          statusEnigma.innerHTML = '<span class="status-dot success"></span><span>Reussi</span>';
          btnEnigma.textContent = 'TERMINE';
          btnEnigma.classList.add('success');
        } else if (state.enigma && state.enigma.completed === false) {
          statusEnigma.innerHTML = '<span class="status-dot fail"></span><span>Echoue</span>';
          btnEnigma.textContent = 'ECHOUE';
          btnEnigma.classList.add('fail');
        }
      }
    }

    // Coffre
    var statusCoffre = document.getElementById('status-coffre');
    if (statusCoffre) {
      var count = 0;
      if (state.enigme1 && state.enigme1.completed === true) count++;
      if (state.quiz && state.quiz.completed === true) count++;
      if (state.enigma && state.enigma.completed === true) count++;
      var dotClass = count > 0 ? 'success' : '';
      statusCoffre.innerHTML = '<span class="status-dot ' + dotClass + '"></span><span>' + count + '/3 debloque</span>';
    }
  }

  document.querySelectorAll('.slide-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      if (btn.classList.contains('disabled')) {
        e.preventDefault();
      }
    });
  });

  updateDisplay();
});
