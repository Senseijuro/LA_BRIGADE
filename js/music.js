// ==========================================
// MUSIC.JS - Gestion de la musique de fond
// ==========================================

(function() {
  var music = document.getElementById('bg-music');
  
  if (!music) return;
  
  // Volume bas (20%)
  music.volume = 0.2;
  
  // Essayer de lancer la musique automatiquement
  var playPromise = music.play();
  
  if (playPromise !== undefined) {
    playPromise.catch(function() {
      // Si autoplay bloqué, relancer à chaque clic jusqu'à ce que ça marche
      function startMusic() {
        music.play().then(function() {
          // Musique lancée, on retire le listener
          document.removeEventListener('click', startMusic);
          document.removeEventListener('touchstart', startMusic);
        }).catch(function() {
          // Toujours bloqué, on garde le listener pour le prochain clic
        });
      }
      document.addEventListener('click', startMusic);
      document.addEventListener('touchstart', startMusic);
    });
  }
  
  // Bouton pour contrôler la musique
  var musicBtn = document.createElement('button');
  musicBtn.id = 'music-toggle';
  musicBtn.innerHTML = '🔊';
  musicBtn.title = 'Couper/Activer la musique';
  musicBtn.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999; width: 50px; height: 50px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); background: rgba(17,17,20,0.9); color: white; font-size: 1.5rem; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;';
  
  document.body.appendChild(musicBtn);
  
  // Toggle mute
  musicBtn.addEventListener('click', function() {
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
  
  // Hover effect
  musicBtn.addEventListener('mouseenter', function() {
    musicBtn.style.transform = 'scale(1.1)';
    musicBtn.style.borderColor = '#ff007f';
  });
  
  musicBtn.addEventListener('mouseleave', function() {
    musicBtn.style.transform = 'scale(1)';
    musicBtn.style.borderColor = 'rgba(255,255,255,0.3)';
  });
})();
