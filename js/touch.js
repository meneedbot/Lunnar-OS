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

  var css = [
    'body.touch-mode #mobile-warning{display:none!important}',
    'body.touch-mode #top-trigger,body.touch-mode #bottom-trigger{display:none}',
    'body.touch-mode .win-header{transform:translateY(0)}',
    'body.touch-mode .win-body{height:calc(100% - 45px);margin-top:45px}',
    'body.touch-mode .win-btn{width:30px;height:30px}',
    'body.touch-mode .win-controls{gap:18px}',
    'body.touch-mode #dock-container{max-width:calc(100vw - 20px);overflow-x:auto;overflow-y:hidden;justify-content:flex-start;scrollbar-width:none}',
    'body.touch-mode #dock-container::-webkit-scrollbar{display:none}',
    'body.touch-mode .dock-item{flex:0 0 auto}',
    'body.touch-mode #app-drawer{padding:24px}',
    'body.touch-mode .desktop-app{width:88px;height:100px}',
    '#touch-dock-handle{position:fixed;left:50%;bottom:0;transform:translateX(-50%);width:150px;height:30px;padding:0;border:0;background:transparent;z-index:2600;display:flex;align-items:flex-end;justify-content:center;cursor:pointer}',
    '#touch-dock-handle span{display:block;width:64px;height:5px;border-radius:3px;background:rgba(255,255,255,.35);margin-bottom:6px}',
    'body.touch-mode .boot-logo{font-size:2rem;letter-spacing:5px}',
    'body.touch-mode .boot-sub{font-size:1rem;letter-spacing:2px;margin-bottom:34px}',
    'body.touch-mode #boot-btn{padding:15px 34px}',
    'body.touch-mode .boot-touch-skip{display:block;margin-top:22px;font-size:.85rem;color:#888;letter-spacing:1px;text-decoration:underline;cursor:pointer;padding:12px}',
    /* the login panel: above the lock clock, never under the on-screen keyboard, and scrollable on short screens */
    '#lnr-login{max-height:calc(100dvh - 90px);overflow-y:auto}',
    '#lnr-login input{font-size:16px!important}',
    '#lnr-login .lnr-skip{color:#777;text-align:center;cursor:pointer;font-size:12px;padding:6px}',
    '@media (max-width:720px){',
    'body.touch-mode #right-sidebar{display:none}',
    'body.touch-mode .os-menu{width:calc(100vw - 20px);height:min(600px,82vh);padding:18px}',
    'body.touch-mode #wallpaper-menu{width:calc(100vw - 20px);padding:18px}',
    'body.touch-mode .l-day{font-size:2.6rem;letter-spacing:6px}',
    'body.touch-mode .hud-day{font-size:2rem;letter-spacing:6px}',
    'body.touch-mode .wp-grid{grid-template-columns:repeat(2,1fr)}',
    '#lnr-login{width:min(300px,calc(100vw - 28px))!important;bottom:auto!important;top:50%!important;transform:translate(-50%,-50%)!important}',
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
