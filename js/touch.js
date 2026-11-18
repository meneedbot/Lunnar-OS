(function () {
  'use strict';

  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var isTouchDevice = coarse || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && Math.max(screen.width, screen.height) < 1100);
  if (!isTouchDevice) return;

  document.documentElement.classList.add('touch-mode');
  document.body.classList.add('touch-mode');

  var warn = document.getElementById('mobile-warning');
  if (warn) {
    try { if (warn.open) warn.close(); } catch (e) {}
    warn.style.display = 'none';
  }

  // A phone has no hover, so anything that used to arrive on mouseenter - the
  // window controls, the dock, the frame-rate readout - has to be laid out to be
  // there, and out of the way of everything else.
  var css = [
    'body.touch-mode{-webkit-text-size-adjust:100%;overscroll-behavior:none}',
    'body.touch-mode #mobile-warning{display:none!important}',
    /* hover-only reveal strips: on a phone they just swallow taps near the edges */
    'body.touch-mode #top-trigger,body.touch-mode #bottom-trigger{display:none}',
    /* the day is already on the lock screen, and this label sat under the icons */
    'body.touch-mode #hud-top{display:none}',
    /* under the windows, so it can never cover a close button again */
    'body.touch-mode #fps-counter{top:8px;bottom:auto;left:auto;right:10px;padding:5px 9px;font-size:11px;opacity:.7;z-index:400}',

    /* boot: fit the wordmark, and make skipping obvious since Enter does not exist */
    'body.touch-mode .boot-logo{font-size:1.9rem;letter-spacing:5px}',
    'body.touch-mode .boot-sub{font-size:.85rem;letter-spacing:2px;margin-bottom:30px}',
    'body.touch-mode #boot-btn{padding:14px 36px;font-size:16px}',
    'body.touch-mode .boot__hint{display:none}',
    'body.touch-mode .boot-touch-skip{display:inline-block;margin-top:26px;padding:12px 20px;border:1px solid #444;border-radius:999px;font-size:.85rem;color:#ccc;letter-spacing:1px;cursor:pointer}',

    /* lock screen: the day stays clear of the edges, the clock clears the login panel */
    'body.touch-mode .l-day{font-size:clamp(1.6rem,8.5vw,3rem);letter-spacing:clamp(2px,1.2vw,8px);line-height:1.05}',
    'body.touch-mode .l-date{font-size:clamp(.8rem,3.4vw,1.1rem);letter-spacing:2px}',
    'body.touch-mode .l-time{font-size:clamp(.85rem,3.6vw,1.05rem)}',
    'body.touch-mode #lock-ui{top:18%;transform:translate(-50%,0);transition:opacity .2s}',
    'body.touch-mode .lock-hint{margin-top:24px;font-size:11px;letter-spacing:2px;color:#777;text-transform:uppercase;animation:pulseHint 2.4s ease-in-out infinite}',
    '@keyframes pulseHint{50%{opacity:.35}}',
    'body.touch-mode #lock-screen.login-open #lock-ui{opacity:0}',
    'body.touch-mode #lnr-login{top:auto!important;bottom:calc(6% + 6px)!important;transform:translateX(-50%)!important;width:min(300px,calc(100vw - 28px))!important;max-height:calc(100dvh - 30%)!important;overflow-y:auto!important}',
    '#lnr-login input{font-size:16px!important;padding:12px 11px!important}',
    '#lnr-login button{padding:13px!important}',

    /* windows: readable title-bar buttons, and the apps end above the dock */
    'body.touch-mode .win-header{transform:none!important;height:48px}',
    'body.touch-mode .win-body{height:calc(100% - 124px);margin-top:48px}',
    'body.touch-mode .win-btn{width:32px;height:32px;color:#fff}',
    'body.touch-mode .btn-close::before,body.touch-mode .btn-close::after{width:11px}',
    'body.touch-mode .btn-min::before{width:11px}',
    'body.touch-mode .win-controls{gap:14px;padding-right:2px}',
    'body.touch-mode .win-title{font-size:12px;letter-spacing:1px}',

    /* dock: always there, finger-sized, and opaque so app content cannot show through */
    'body.touch-mode #dock-container.dock-hidden{transform:translate(-50%,0)!important}',
    'body.touch-mode #dock-container{bottom:calc(10px + env(safe-area-inset-bottom));max-width:calc(100vw - 16px);gap:8px;padding:0 10px;height:58px;background:#0b0b0b;border:1px solid #2a2a2a;backdrop-filter:none;-webkit-backdrop-filter:none;overflow-x:auto;overflow-y:hidden;justify-content:flex-start;scrollbar-width:none;z-index:2400}',
    'body.touch-mode #dock-container::-webkit-scrollbar{display:none}',
    'body.touch-mode .dock-item{width:44px;height:44px;flex:0 0 auto}',
    'body.touch-mode .dock-item img{width:30px;height:30px}',
    'body.touch-mode .dock-sep{display:none}',

    /* panels that used to open wider than the screen */
    'body.touch-mode #app-drawer{padding:22px;overflow-y:auto;max-width:none;max-height:none;margin:0;background:#0b0b0b}',
    'body.touch-mode .drawer-grid{grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:18px}',
    'body.touch-mode #toast-container{left:8px;right:8px;bottom:80px;align-items:stretch}',
    'body.touch-mode .toast-notification{width:100%}',
    'body.touch-mode #cine-noti{left:8px;right:8px;width:auto;bottom:calc(80px + env(safe-area-inset-bottom))}',

    '@media (max-width:720px){',
    'body.touch-mode #right-sidebar{display:none}',
    'body.touch-mode .os-menu{width:calc(100vw - 16px);height:min(560px,72dvh);padding:18px;bottom:14px;border-radius:20px}',
    'body.touch-mode #wallpaper-menu{width:calc(100vw - 16px);max-height:82dvh;padding:18px;border-radius:20px}',
    'body.touch-mode .wp-grid{grid-template-columns:repeat(2,1fr)}',
    'body.touch-mode .modal__content,body.touch-mode .faq-box{width:calc(100vw - 32px);padding:22px}',
    '}'
  ].join('\n');

  var style = document.createElement('style');
  style.id = 'touch-support-style';
  style.textContent = css;
  document.head.appendChild(style);

  // The dock no longer hides itself: an app's content ends above it, so it can
  // always be reached without a hidden reveal strip.
  var dock = document.getElementById('dock-container');
  if (dock) dock.classList.remove('dock-hidden');

  // A tap anywhere on the boot screen skips the intro; the small link alone is
  // easy to miss, and a phone has no Enter key.
  var boot = document.getElementById('boot-layer');
  if (boot) {
    boot.addEventListener('pointerdown', function (e) {
      if (typeof bootActive === 'undefined' || !bootActive) return;
      var content = document.getElementById('boot-content');
      if (content && content.style.display !== 'none') return;
      e.preventDefault();
      if (typeof skipBootSequence === 'function') skipBootSequence();
    });
  }

  // Tell the user the lock screen is tappable, and get the clock out of the way
  // while the login panel asks for a name.
  var lock = document.getElementById('lock-screen');
  var login = document.getElementById('lnr-login');
  if (lock) {
    var lockContent = lock.querySelector('.lock-content');
    if (lockContent && !lockContent.querySelector('.lock-hint')) {
      var lockHint = document.createElement('div');
      lockHint.className = 'lock-hint';
      lockHint.textContent = 'Tap to unlock';
      lockContent.appendChild(lockHint);
    }
  }
  if (lock && login) {
    var syncLogin = function () {
      var shown = login.offsetParent !== null;
      if (lock.classList.contains('login-open') !== shown) lock.classList.toggle('login-open', shown);
    };
    if (window.MutationObserver) {
      new MutationObserver(syncLogin).observe(login, { attributes: true, attributeFilter: ['style', 'class'] });
    }
    setInterval(syncLogin, 600);
    syncLogin();
  }

  var lpTimer = null;

  function cancelLongPress() {
    if (lpTimer) {
      clearTimeout(lpTimer);
      lpTimer = null;
    }
  }

  function wireTile(el) {
    if (el.getAttribute('data-touch-wired')) return;
    el.setAttribute('data-touch-wired', '1');
    el.ondblclick = null;

    el.addEventListener('click', function () {
      if (window.DragSystem && DragSystem.isDragMove) return;
      var idx = this.getAttribute('data-idx');
      var item = window.desktopLayout ? window.desktopLayout[idx] : null;
      if (!item || item.type === 'folder') return;
      if (window.APPS && APPS[item.id] && typeof toggleApp === 'function') toggleApp(item.id);
    });

    el.addEventListener('touchstart', function (ev) {
      var t = ev.touches && ev.touches[0];
      if (!t) return;
      var self = this;
      cancelLongPress();
      lpTimer = setTimeout(function () {
        self.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: t.clientX,
          clientY: t.clientY
        }));
      }, 550);
    }, { passive: true });

    el.addEventListener('touchend', cancelLongPress);
    el.addEventListener('touchmove', cancelLongPress);
    el.addEventListener('touchcancel', cancelLongPress);
  }

  function fitTiles() {
    var tiles = document.querySelectorAll('.desktop-app');
    if (!tiles.length) return;

    var maxX = window.innerWidth - 96;
    var maxY = window.innerHeight - 130;
    var out = false;
    var i;

    for (i = 0; i < tiles.length; i++) {
      var x = parseFloat(tiles[i].style.left) || 0;
      var y = parseFloat(tiles[i].style.top) || 0;
      if (x > maxX || y > maxY) {
        out = true;
        break;
      }
    }
    if (!out) return;

    var colW = 96;
    var rowH = 108;
    var perCol = Math.max(1, Math.floor((maxY - 12) / rowH) + 1);

    for (i = 0; i < tiles.length; i++) {
      tiles[i].style.left = (12 + Math.floor(i / perCol) * colW) + 'px';
      tiles[i].style.top = (12 + (i % perCol) * rowH) + 'px';
    }
  }

  function wireAll() {
    var tiles = document.querySelectorAll('.desktop-app');
    for (var i = 0; i < tiles.length; i++) wireTile(tiles[i]);
    fitTiles();
  }

  var origLoadDesktop = window.loadDesktop;
  if (typeof origLoadDesktop === 'function') {
    window.loadDesktop = function () {
      origLoadDesktop.apply(this, arguments);
      wireAll();
    };
  }

  window.addEventListener('resize', fitTiles);
  window.addEventListener('orientationchange', function () {
    setTimeout(fitTiles, 250);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAll);
  } else {
    wireAll();
  }
})();
