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

  // A phone has no hover, so the frame-rate readout used to sit on top of the
  // dock's Start button (and on the lock clock). Move it to the corner instead.
  var css = [
    'body.touch-mode{-webkit-text-size-adjust:100%;overscroll-behavior:none}',
    'body.touch-mode #mobile-warning{display:none!important}',
    /* hover-only reveal strips: on a phone they just swallow taps near the edges */
    'body.touch-mode #top-trigger,body.touch-mode #bottom-trigger{display:none}',
    'body.touch-mode #fps-counter{top:8px;bottom:auto;left:auto;right:10px;padding:5px 9px;font-size:11px;opacity:.75}',

    /* boot: fit the wordmark and make skipping obvious, since Enter does not exist */
    'body.touch-mode .boot-logo{font-size:1.9rem;letter-spacing:5px}',
    'body.touch-mode .boot-sub{font-size:.85rem;letter-spacing:2px;margin-bottom:30px}',
    'body.touch-mode #boot-btn{padding:14px 36px;font-size:16px}',
    'body.touch-mode .boot__hint{display:none}',
    'body.touch-mode .boot-touch-skip{display:inline-block;margin-top:26px;padding:12px 20px;border:1px solid #444;border-radius:999px;font-size:.85rem;color:#ccc;letter-spacing:1px;cursor:pointer}',

    /* lock screen: the day word must stay clear of the edges, the clock clear of the login panel */
    'body.touch-mode .l-day{font-size:clamp(1.6rem,8.5vw,3rem);letter-spacing:clamp(2px,1.2vw,8px);line-height:1.05}',
    'body.touch-mode .l-date{font-size:clamp(.8rem,3.4vw,1.1rem);letter-spacing:2px}',
    'body.touch-mode .l-time{font-size:clamp(.85rem,3.6vw,1.05rem)}',
    'body.touch-mode #lock-ui{top:18%;transform:translate(-50%,0)}',
    'body.touch-mode .lock-hint{margin-top:24px;font-size:11px;letter-spacing:2px;color:#666;text-transform:uppercase;animation:pulseHint 2.4s ease-in-out infinite}',
    '@keyframes pulseHint{50%{opacity:.3}}',
    'body.touch-mode #lock-screen.login-open #lock-ui{opacity:0;transition:opacity .2s}',
    'body.touch-mode #lnr-login{top:auto!important;bottom:calc(6% + 6px)!important;transform:translateX(-50%)!important;width:min(300px,calc(100vw - 28px))!important;max-height:calc(100dvh - 26%)!important;overflow-y:auto!important}',
    '#lnr-login input{font-size:16px!important;padding:12px 11px!important}',
    '#lnr-login button{padding:13px!important}',

    /* windows: readable title-bar buttons, reachable without hover */
    'body.touch-mode .win-header{transform:none!important;height:48px}',
    'body.touch-mode .win-body{height:calc(100% - 48px);margin-top:48px}',
    'body.touch-mode .win-btn{width:32px;height:32px;color:#fff}',
    'body.touch-mode .btn-close::before,body.touch-mode .btn-close::after{width:11px}',
    'body.touch-mode .btn-min::before{width:11px}',
    'body.touch-mode .win-controls{gap:14px;padding-right:2px}',
    'body.touch-mode .win-title{font-size:12px;letter-spacing:1px}',

    /* dock: finger-sized targets that still fit a phone, opaque so content cannot show through */
    'body.touch-mode #dock-container{bottom:calc(10px + env(safe-area-inset-bottom));max-width:calc(100vw - 16px);gap:8px;padding:0 10px;height:58px;background:rgba(10,10,10,.97);backdrop-filter:none;-webkit-backdrop-filter:none;overflow-x:auto;overflow-y:hidden;justify-content:flex-start;scrollbar-width:none}',
    'body.touch-mode #dock-container::-webkit-scrollbar{display:none}',
    'body.touch-mode .dock-item{width:44px;height:44px;flex:0 0 auto}',
    'body.touch-mode .dock-item img{width:30px;height:30px}',
    'body.touch-mode .dock-sep{display:none}',
    '#touch-dock-handle{position:fixed;left:50%;bottom:calc(8px + env(safe-area-inset-bottom));transform:translateX(-50%);width:132px;height:34px;padding:0;border:0;background:transparent;z-index:2600;display:flex;align-items:center;justify-content:center;cursor:pointer}',
    '#touch-dock-handle span{display:block;width:56px;height:5px;border-radius:3px;background:rgba(255,255,255,.4)}',

    /* panels that used to open wider than the screen */
    'body.touch-mode #app-drawer{padding:22px;overflow-y:auto;max-width:none;max-height:none;margin:0}',
    'body.touch-mode .drawer-grid{grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:18px}',
    'body.touch-mode #toast-container{left:8px;right:8px;bottom:86px;align-items:stretch}',
    'body.touch-mode .toast-notification{width:100%}',
    'body.touch-mode #cine-noti{left:8px;right:8px;width:auto;bottom:calc(84px + env(safe-area-inset-bottom))}',

    '@media (max-width:720px){',
    'body.touch-mode #right-sidebar{display:none}',
    'body.touch-mode .os-menu{width:calc(100vw - 16px);height:min(560px,72dvh);padding:18px;bottom:14px;border-radius:20px}',
    'body.touch-mode #wallpaper-menu{width:calc(100vw - 16px);max-height:82dvh;padding:18px;border-radius:20px}',
    'body.touch-mode .hud-day{font-size:1.5rem;letter-spacing:5px}',
    'body.touch-mode .wp-grid{grid-template-columns:repeat(2,1fr)}',
    'body.touch-mode .modal__content,body.touch-mode .faq-box{width:calc(100vw - 32px);padding:22px}',
    '}'
  ].join('\n');

  var style = document.createElement('style');
  style.id = 'touch-support-style';
  style.textContent = css;
  document.head.appendChild(style);

  var dock = document.getElementById('dock-container');
  var dockTimer = null;

  function syncHandle() {
    if (!dock || !handle) return;
    handle.style.display = dock.classList.contains('dock-hidden') ? 'flex' : 'none';
  }

  function hideDockSoon() {
    clearTimeout(dockTimer);
    dockTimer = setTimeout(function () {
      if (!dock) return;
      if (document.querySelector('#windows-layer .window.active:not(.minimized)')) {
        dock.classList.add('dock-hidden');
        syncHandle();
      }
    }, 4000);
  }

  function toggleDock() {
    if (!dock) return;
    if (dock.classList.contains('dock-hidden')) {
      dock.classList.remove('dock-hidden');
      hideDockSoon();
    } else {
      dock.classList.add('dock-hidden');
    }
    syncHandle();
  }

  var handle = document.createElement('button');
  handle.id = 'touch-dock-handle';
  handle.type = 'button';
  handle.setAttribute('aria-label', 'Show taskbar');
  handle.innerHTML = '<span></span>';
  handle.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    toggleDock();
  });
  document.body.appendChild(handle);

  if (dock && window.MutationObserver) {
    new MutationObserver(syncHandle).observe(dock, { attributes: true, attributeFilter: ['class'] });
  }
  syncHandle();

  // Closing the last window used to leave the dock hidden for good, so the
  // taskbar could not be brought back. Whenever nothing is open, show it again.
  var layer = document.getElementById('windows-layer');

  function showDockWhenEmpty() {
    if (!dock || !layer) return;
    if (layer.querySelectorAll('.window.active:not(.minimized)').length === 0) {
      clearTimeout(dockTimer);
      dock.classList.remove('dock-hidden');
      syncHandle();
    }
  }

  if (layer && window.MutationObserver) {
    new MutationObserver(showDockWhenEmpty).observe(layer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }
  showDockWhenEmpty();

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

  // Tell the user the lock screen is tappable, and keep its clock clear of the
  // login panel once that opens.
  var lock = document.getElementById('lock-screen');
  if (lock) {
    var lockContent = lock.querySelector('.lock-content');
    if (lockContent && !lockContent.querySelector('.lock-hint')) {
      var lockHint = document.createElement('div');
      lockHint.className = 'lock-hint';
      lockHint.textContent = 'Tap to unlock';
      lockContent.appendChild(lockHint);
    }
    var login = document.getElementById('lnr-login');
    if (login && window.MutationObserver) {
      new MutationObserver(function () {
        lock.classList.toggle('login-open',
          login.style.display === 'flex' || login.style.display === 'block');
      }).observe(login, { attributes: true, attributeFilter: ['style'] });
    }
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

  // The boot video can only be skipped with the Enter key, which a phone does not have.
  var skipEl = document.querySelector('.boot-touch-skip');
  if (skipEl) {
    skipEl.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      if (typeof skipBootSequence === 'function') skipBootSequence();
    });
  }

  // accounts.js replaces unlockSystem with a login panel that had no way out,
  // leaving the desktop unreachable without an account. Give it a skip.
  window.addEventListener('load', function () {
    var box = document.getElementById('lnr-login');
    if (!box || box.querySelector('.lnr-skip')) return;
    box.style.overflowY = 'auto';
    box.style.maxHeight = 'calc(100dvh - 90px)';
    var skip = document.createElement('a');
    skip.className = 'lnr-skip';
    skip.textContent = 'Skip login — use without an account';
    skip.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      box.style.display = 'none';
      if (typeof isDesktopActive !== 'undefined') {
        // unlockSystem is the accounts.js gate; step past it deliberately.
        isDesktopActive = true;
        var scr = document.getElementById('lock-screen');
        if (scr) { scr.classList.add('slide-up'); setTimeout(function () { scr.classList.remove('active'); }, 600); }
        var lv = document.getElementById('lock-video');
        if (lv) lv.pause();
        if (typeof syncBgPlayback === 'function') syncBgPlayback();
      }
    });
    box.appendChild(skip);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireAll);
  } else {
    wireAll();
  }
})();
