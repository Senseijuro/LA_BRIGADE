// ==========================================
// MUSIC.JS - Gestion de la musique de fond
// + Switch automatique vers version SPEED
//   quand le timer global atteint le seuil
//
// CONVENTION : pour chaque fichier audio "xxx.mp3" :
//   - "xxx_speed.mp3"        → version speed AVEC le son "Hurry Up" au début
//   - "xxx_speed_neutre.mp3" → version speed SANS le son "Hurry Up"
//
// LOGIQUE HURRY UP (sans reset manuel) :
//   - Chaque page HTML doit déclarer son ordre AVANT d'inclure music.js :
//       <script>var EPREUVE_ORDER = 1;</script>  ← enigme1.html
//       <script>var EPREUVE_ORDER = 2;</script>  ← quiz.html
//       <script>var EPREUVE_ORDER = 3;</script>  ← enigme.html
//   - Quand on charge l'épreuve 1 (order = 1), le localStorage est remis à zéro
//     automatiquement → nouveau groupe, tout repart à zéro
//   - La première épreuve qui atteint 60s joue le Hurry Up
//   - Les épreuves suivantes jouent le neutre
//
// ====== CONFIGURATION (MODIFIER ICI) ======
var MUSIC_CONFIG = {
  SPEED_THRESHOLD: 60,
  SPEED_SUFFIX: '_speed',
  SPEED_NEUTRE_SUFFIX: '_speed_neutre',
  NORMAL_VOLUME: 0.2,
  SPEED_VOLUME: 0.3,
  FADE_DURATION: 800,
  HURRYUP_ORDER_KEY: 'hurryup_first_order',
  FIRST_ORDER: 1  // Numéro de la première épreuve → reset auto au chargement
};
// ==========================================

(function() {
  var music = document.getElementById('bg-music');
  if (!music) return;

  music.volume = MUSIC_CONFIG.NORMAL_VOLUME;
  var started = false;
  var speedSwitched = false;
  var speedCheckInterval = null;

  // Numéro d'ordre de cette page (défini dans le HTML, défaut 99 si absent)
  var myOrder = (typeof window.EPREUVE_ORDER !== 'undefined') ? window.EPREUVE_ORDER : 99;

  // --- Reset automatique quand on charge la première épreuve ---
  // Si on est sur l'épreuve 1, c'est forcément un nouveau groupe → on efface
  if (myOrder === MUSIC_CONFIG.FIRST_ORDER) {
    localStorage.removeItem(MUSIC_CONFIG.HURRYUP_ORDER_KEY);
  }

  // --- Détecter les fichiers speed automatiquement ---
  var normalSrc = '';
  var speedSrc = '';
  var speedNeutreSrc = '';
  var sourceEl = music.querySelector('source');
  if (sourceEl && sourceEl.getAttribute('src')) {
    normalSrc = sourceEl.getAttribute('src');
  } else if (music.src) {
    normalSrc = music.src;
  }

  if (normalSrc) {
    var dotIndex = normalSrc.lastIndexOf('.');
    if (dotIndex !== -1) {
      var base = normalSrc.substring(0, dotIndex);
      var ext = normalSrc.substring(dotIndex);
      speedSrc       = base + MUSIC_CONFIG.SPEED_SUFFIX + ext;
      speedNeutreSrc = base + MUSIC_CONFIG.SPEED_NEUTRE_SUFFIX + ext;
    }
  }

  // --- Lecture audio ---
  function tryPlay() {
    if (started) return;
    var p = music.play();
    if (p !== undefined) {
      p.then(function() {
        started = true;
        removeListeners();
        startSpeedCheck();
      }).catch(function() {});
    } else {
      started = true;
      removeListeners();
      startSpeedCheck();
    }
  }

  var events = ['click', 'touchstart', 'touchend', 'mousemove', 'mousedown', 'scroll', 'keydown', 'pointerdown', 'pointerup'];
  function onInteraction() { tryPlay(); }

  function addListeners() {
    events.forEach(function(evt) {
      document.addEventListener(evt, onInteraction, { once: true, passive: true });
    });
  }
  function removeListeners() {
    events.forEach(function(evt) {
      document.removeEventListener(evt, onInteraction);
    });
  }

  // --- Switch vers la version SPEED ---
  function switchToSpeed() {
    if (speedSwitched || !speedSrc) return;
    speedSwitched = true;

    var wasMuted = music.muted;

    // Récupérer l'ordre de la 1ère épreuve qui a joué le hurry up
    var firstOrder = localStorage.getItem(MUSIC_CONFIG.HURRYUP_ORDER_KEY);
    firstOrder = firstOrder !== null ? parseInt(firstOrder, 10) : null;

    var targetSrc;

    if (firstOrder === null) {
      // Personne n'a encore joué le hurry up → cette page est la première
      localStorage.setItem(MUSIC_CONFIG.HURRYUP_ORDER_KEY, myOrder);
      targetSrc = speedSrc; // Avec Hurry Up
    } else {
      // Une épreuve a déjà joué le hurry up → neutre
      targetSrc = speedNeutreSrc; // Sans Hurry Up
    }

    // Coupure : mute + volume 0 + pause
    music.muted = true;
    music.volume = 0;
    music.pause();

    // Changer la source
    if (sourceEl) sourceEl.src = targetSrc;
    music.src = targetSrc;
    music.currentTime = 0;
    music.loop = true;

    // Attendre que le nouveau fichier soit prêt
    music.oncanplay = function() {
      music.oncanplay = null;
      music.muted = wasMuted;
      music.volume = 0;

      var playPromise = music.play();
      if (playPromise !== undefined) {
        playPromise.then(fadeInSpeed).catch(fadeInSpeed);
      } else {
        fadeInSpeed();
      }
    };

    function fadeInSpeed() {
      var fadeSteps = 20;
      var fadeStepTime = MUSIC_CONFIG.FADE_DURATION / fadeSteps;
      var targetVol = MUSIC_CONFIG.SPEED_VOLUME;
      var inCount = 0;
      var fadeIn = setInterval(function() {
        inCount++;
        music.volume = Math.min(targetVol, (targetVol / fadeSteps) * inCount);
        if (inCount >= fadeSteps) {
          clearInterval(fadeIn);
          music.volume = targetVol;
        }
      }, fadeStepTime);
    }
  }

  // --- Vérifier si le fichier speed existe réellement ---
  function checkSpeedFileExists(callback) {
    if (!speedSrc) { callback(false); return; }
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', speedSrc, true);
    xhr.onload = function() { callback(xhr.status >= 200 && xhr.status < 400); };
    xhr.onerror = function() { callback(false); };
    xhr.send();
  }

  // --- Surveiller le timer global ---
  function startSpeedCheck() {
    if (speedCheckInterval || !speedSrc) return;

    checkSpeedFileExists(function(exists) {
      if (!exists) return;

      speedCheckInterval = setInterval(function() {
        if (speedSwitched) { clearInterval(speedCheckInterval); return; }
        if (window.globalTimer && typeof window.globalTimer.getTimeRemaining === 'function' && window.globalTimer.isStarted()) {
          var remaining = window.globalTimer.getTimeRemaining();
          if (remaining <= MUSIC_CONFIG.SPEED_THRESHOLD && remaining > 0) {
            switchToSpeed();
            clearInterval(speedCheckInterval);
          }
        }
      }, 500);
    });
  }

  // 1) Essayer immédiatement
  tryPlay();
  // 2) Sinon écouter le moindre contact
  if (!started) addListeners();

  // --- Bouton toggle musique ---
  var musicBtn = document.createElement('button');
  musicBtn.id = 'music-toggle';
  musicBtn.innerHTML = '🔊';
  musicBtn.title = 'Couper/Activer la musique';
  musicBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; width: 50px; height: 50px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); background: rgba(17,17,20,0.9); color: white; font-size: 1.5rem; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;';
  document.body.appendChild(musicBtn);

  musicBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (music.muted) {
      music.muted = false;
      musicBtn.innerHTML = '🔊';
      musicBtn.style.opacity = '1';
    } else {
      music.muted = true;
      musicBtn.innerHTML = '🔇';
      musicBtn.style.opacity = '0.5';
    }
  });

  musicBtn.addEventListener('mouseenter', function() {
    musicBtn.style.transform = 'scale(1.1)';
    musicBtn.style.borderColor = '#ff007f';
  });
  musicBtn.addEventListener('mouseleave', function() {
    musicBtn.style.transform = 'scale(1)';
    musicBtn.style.borderColor = 'rgba(255,255,255,0.3)';
  });
})();
