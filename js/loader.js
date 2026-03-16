// ==========================================
// LOADER.JS - Gestion du loader de page
// PC = toujours auto
// Mobile game pages = auto (le tutoriel sert de geste)
// Mobile non-game pages (coffre, index) = tap pour entrer
// ==========================================

(function() {
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  window.addEventListener('load', function() {
    var loader = document.getElementById('page-loader');
    if (!loader) return;

    // Détecter si c'est une page de jeu (qui a un tutoriel)
    var isGamePage = !!document.getElementById('game-area');

    setTimeout(function() {

      // ====== AUTO-DISMISS : PC ou page de jeu (le tuto sert de geste) ======
      if (!isTouch || isGamePage) {
        loader.classList.add('hidden');
        setTimeout(function() { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 500);
        return;
      }

      // ====== MOBILE + NON-GAME (coffre, index) : attendre un tap ======
      var status = loader.querySelector('.loader-status');
      if (status) {
        status.textContent = '▶ APPUIE POUR ENTRER';
        status.style.cssText = 'animation: tapPulse 1s ease infinite alternate; font-weight: 700; font-size: 1rem; color: #ff007f; cursor: pointer;';
      }

      if (!document.getElementById('tap-pulse-style')) {
        var style = document.createElement('style');
        style.id = 'tap-pulse-style';
        style.textContent = '@keyframes tapPulse { 0% { opacity: 0.6; transform: scale(1); } 100% { opacity: 1; transform: scale(1.05); } }';
        document.head.appendChild(style);
      }

      loader.style.cursor = 'pointer';

      function onTap() {
        loader.removeEventListener('click', onTap);
        loader.removeEventListener('touchstart', onTap);
        var music = document.getElementById('bg-music');
        if (music) { music.volume = 0.2; music.play().catch(function() {}); }
        loader.classList.add('hidden');
        setTimeout(function() { if (loader.parentNode) loader.parentNode.removeChild(loader); }, 500);
      }

      loader.addEventListener('click', onTap);
      loader.addEventListener('touchstart', onTap, { passive: true });

    }, 1500);
  });

  // Fallback si la page prend trop de temps
  setTimeout(function() {
    var loader = document.getElementById('page-loader');
    if (loader && !loader.classList.contains('hidden')) {
      var isGamePage = !!document.getElementById('game-area');

      if (!isTouch || isGamePage) {
        loader.classList.add('hidden');
        return;
      }

      var status = loader.querySelector('.loader-status');
      if (status) {
        status.textContent = '▶ APPUIE POUR ENTRER';
        status.style.cssText = 'animation: tapPulse 1s ease infinite alternate; font-weight: 700; font-size: 1rem; color: #ff007f; cursor: pointer;';
      }
      loader.style.cursor = 'pointer';

      function onTapFallback() {
        loader.removeEventListener('click', onTapFallback);
        loader.removeEventListener('touchstart', onTapFallback);
        var music = document.getElementById('bg-music');
        if (music) { music.volume = 0.2; music.play().catch(function() {}); }
        loader.classList.add('hidden');
      }
      loader.addEventListener('click', onTapFallback);
      loader.addEventListener('touchstart', onTapFallback, { passive: true });
    }
  }, 5000);
})();
