(function () {
  'use strict';

  var ALLOW = 'autoplay; fullscreen; gamepad; microphone; camera; clipboard-read; clipboard-write; accelerometer; gyroscope; screen-wake-lock; web-share; xr-spatial-tracking';
  var MIRRORS = ['cdn.jsdelivr.net', 'fastly.jsdelivr.net', 'gcore.jsdelivr.net', 'testingcf.jsdelivr.net'];
  var MIRROR_RE = /(?:cdn|fastly|gcore|testingcf)\.jsdelivr\.net/g;
  var GAMES = {};
  var seq = 0;
  window.__lunaarGames = GAMES; // for debugging in the console

  /* ---------- helpers ---------- */
  function baseFor(url) {
    return String(url || '').replace(/[?#].*$/, '').replace(/[^\/]*$/, '');
  }

  // Convert a jsDelivr/GitHub URL into one that serves real text/html (so it can be iframed directly)
  function directUrl(url) {
    if (!url) return null;
    var m = /jsdelivr\.net\/gh\/([^\/]+)\/([^@\/]+)(?:@([^\/]+))?\/(.+)$/.exec(url);
    if (m) return 'https://raw.githack.com/' + m[1] + '/' + m[2] + '/' + (m[3] || 'master') + '/' + m[4];
    if (/raw\.githubusercontent\.com/.test(url)) return url.replace('raw.githubusercontent.com', 'raw.githack.com');
    return url;
  }

  // Small script injected into every game: reports errors, fixes blocked storage, grabs focus
  function shim(id) {
    var code = [
      '(function(){',
      'var I=' + JSON.stringify(id) + ';',
      'function send(o){o.__lunaarGame=I;try{parent.postMessage(o,"*")}catch(e){}}',
      'addEventListener("error",function(e){var t=e.target;',
      ' if(t&&t!==window&&(t.src||t.href)){send({err:"file failed: "+(t.src||t.href)})}',
      ' else{send({err:(e.message||"error")+(e.filename?" ("+String(e.filename).split("/").pop()+":"+e.lineno+")":"")})}',
      '},true);',
      'addEventListener("unhandledrejection",function(e){send({err:"promise: "+(e.reason&&e.reason.message||e.reason)})});',
      'try{localStorage.setItem("__t","1");localStorage.removeItem("__t")}catch(e){',
      ' var mk=function(){var m={};return{getItem:function(k){return Object.prototype.hasOwnProperty.call(m,k)?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}},key:function(i){return Object.keys(m)[i]||null},get length(){return Object.keys(m).length}}};',
      ' try{Object.defineProperty(window,"localStorage",{value:mk(),configurable:true})}catch(_){}',
      ' try{Object.defineProperty(window,"sessionStorage",{value:mk(),configurable:true})}catch(_){}',
      '}',
      'addEventListener("load",function(){send({loaded:1});try{window.focus()}catch(e){}});',
      'addEventListener("pointerdown",function(){try{window.focus()}catch(e){}},true);',
      '})();'
    ].join('\n');
    return '<script>' + code + '<\/script>';
  }

  function buildHtml(g) {
    var html = String(g.html || '');
    var head = '';
    if (g.url && !/<base[\s>]/i.test(html)) head += '<base href="' + baseFor(g.url) + '">';
    head += shim(g.id);
    if (/<head(\s[^>]*)?>/i.test(html)) return html.replace(/<head(\s[^>]*)?>/i, function (m) { return m + head; });
    if (/<html(\s[^>]*)?>/i.test(html)) return html.replace(/<html(\s[^>]*)?>/i, function (m) { return m + '<head>' + head + '</head>'; });
    var dt = /^\s*<!doctype[^>]*>/i.exec(html);
    if (dt) return dt[0] + head + html.slice(dt[0].length);
    return head + html;
  }

  /* ---------- window handling ---------- */
  function bumpZ(win) {
    try { win.style.zIndex = ++highestZ; } catch (e) { win.style.zIndex = 6000; }
  }

  function closeGame(id) {
    try { if (typeof closeWindow === 'function') { closeWindow(id); return; } } catch (e) {}
    var w = document.getElementById('win-' + id); if (w) w.remove();
  }

  function ensureWindow(g) {
    var win = document.getElementById('win-' + g.id);
    if (!win) {
      try { if (typeof openWindow === 'function') openWindow(g.id); }
      catch (e) { console.warn('[game-fix] openWindow failed, using fallback window', e); }
      win = document.getElementById('win-' + g.id);
    }
    if (!win) { // fallback window if the OS one couldn't be created
      var layer = document.getElementById('windows-layer') || document.body;
      win = document.createElement('div');
      win.id = 'win-' + g.id;
      win.className = 'window';
      win.innerHTML = '<div class="win-header"><span class="win-title"></span><div class="win-controls"><div class="win-btn btn-min"></div><div class="win-btn btn-close"></div></div></div><div class="win-body"></div>';
      win.querySelector('.win-title').textContent = g.title;
      win.querySelector('.btn-close').onclick = function () { closeGame(g.id); };
      win.querySelector('.btn-min').onclick = function () {
        try { minimizeWindow(g.id); } catch (e) { win.classList.add('minimized'); win.classList.remove('active'); }
      };
      layer.appendChild(win);
    }
    win.classList.remove('minimized');
    win.classList.add('active');
    bumpZ(win);
    try { activeWindowId = g.id; } catch (e) {}
    try { if (typeof startImmersiveMode === 'function') startImmersiveMode(win); } catch (e) {}
    return win;
  }

  /* ---------- mounting the game ---------- */
  function mount(g, mode) {
    var win = ensureWindow(g);
    var host = win.querySelector('.win-body') || win;
    var old = document.getElementById('frame-' + g.id);
    var bar = win.querySelector('.game-diag'); if (bar) bar.remove();
    if (g.blobUrl) { try { URL.revokeObjectURL(g.blobUrl); } catch (e) {} g.blobUrl = null; }
    g.errs = []; g.loaded = false; g.mode = mode;

    var fr = document.createElement('iframe');
    fr.id = 'frame-' + g.id;
    fr.setAttribute('allow', ALLOW);
    fr.setAttribute('allowfullscreen', '');
    fr.setAttribute('tabindex', '0');
    fr.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#000;';

    if (mode === 'direct' && g.direct) {
      fr.src = g.direct;
    } else {
      var doc = buildHtml(g);
      try {
        g.blobUrl = URL.createObjectURL(new Blob([doc], { type: 'text/html;charset=utf-8' }));
        fr.src = g.blobUrl;
      } catch (e) {
        fr.srcdoc = doc;
      }
    }
    fr.addEventListener('load', function () { g.loaded = true; try { fr.focus(); } catch (e) {} });

    // Replace whatever iframe openWindow made (kills any pending navigation that blanks the game)
    if (old && old.parentNode) old.parentNode.replaceChild(fr, old); else host.appendChild(fr);
    var stray = host.querySelectorAll('iframe');
    for (var i = 0; i < stray.length; i++) if (stray[i] !== fr) stray[i].remove();

    if (!win.__gfFocus) {
      win.__gfFocus = true;
      win.addEventListener('pointerdown', function () {
        var f = document.getElementById('frame-' + g.id); try { f && f.focus(); } catch (e) {}
      });
    }

    clearTimeout(g.diagT);
    g.diagT = setTimeout(function () { diagnose(g); }, 8000);
    console.log('[game-fix] mounted', g.title, 'mode=' + mode, mode === 'direct' ? g.direct : '(blob)');
  }

  /* ---------- diagnostics ---------- */
  function diagnose(g) {
    var win = document.getElementById('win-' + g.id);
    var fr = document.getElementById('frame-' + g.id);
    if (!win || !fr || win.querySelector('.game-diag')) return;
    var empty = false;
    if (g.mode !== 'direct') {
      try {
        var b = fr.contentDocument && fr.contentDocument.body;
        empty = !b || (!b.children.length && !b.textContent.trim());
      } catch (e) {}
    }
    if (empty && g.direct && !g.triedDirect) { // auto-recover once
      g.triedDirect = true;
      console.warn('[game-fix] page empty, switching to direct mode');
      mount(g, 'direct');
      return;
    }
    if (!g.errs.length && !empty) return;
    showDiag(g, win, empty);
  }

  function btn(label, fn) {
    var b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'margin:6px 6px 0 0;padding:4px 10px;cursor:pointer;background:#222;color:#fff;border:1px solid #555;border-radius:6px';
    b.onclick = fn;
    return b;
  }

  function showDiag(g, win, empty) {
    var bar = document.createElement('div');
    bar.className = 'game-diag';
    bar.style.cssText = 'position:absolute;left:12px;right:12px;bottom:12px;z-index:50;background:rgba(20,10,10,.94);border:1px solid #6b2434;color:#ffb3bf;font:12px/1.5 system-ui,sans-serif;padding:10px 12px;border-radius:10px;max-height:40%;overflow:auto';
    var t = document.createElement('div');
    t.innerHTML = '<b>This game may not be loading (' + g.mode + ' mode).</b>';
    var list = document.createElement('div');
    list.textContent = g.errs.slice(0, 5).join('  •  ') || (empty ? 'The game page is empty.' : '');
    bar.appendChild(t); bar.appendChild(list);
    bar.appendChild(btn('Reload', function () { mount(g, g.mode); }));
    if (g.direct && g.mode !== 'direct') bar.appendChild(btn('Direct mode', function () { g.triedDirect = true; mount(g, 'direct'); }));
    if (g.mode === 'direct' && g.html) bar.appendChild(btn('Standard mode', function () { mount(g, 'blob'); }));
    bar.appendChild(btn('Open in new tab', function () { window.popOutGame(g.id); }));
    bar.appendChild(btn('Hide', function () { bar.remove(); }));
    (win.querySelector('.win-body') || win).appendChild(bar);
  }

  /* ---------- messages from games (errors + CDN fallback) ---------- */
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || typeof d !== 'object' || !d.__lunaarGame) return;
    var g = GAMES[d.__lunaarGame]; if (!g) return;
    if (d.loaded) { g.loaded = true; return; }
    if (!d.err) return;
    g.errs.push(String(d.err).slice(0, 300));
    if (g.errs.length > 50) g.errs.shift();

    var m = /^file failed: (.*)$/.exec(d.err);
    if (m && /jsdelivr\.net/.test(m[1]) && !g.lock) {
      g.lock = true; setTimeout(function () { g.lock = false; }, 3000);
      if (g.mirror < MIRRORS.length - 1) {
        g.mirror++;
        g.html = g.html.replace(MIRROR_RE, MIRRORS[g.mirror]);
        if (g.url) g.url = g.url.replace(MIRROR_RE, MIRRORS[g.mirror]);
        console.warn('[game-fix] CDN file failed, retrying via', MIRRORS[g.mirror]);
        setTimeout(function () { mount(g, 'blob'); }, 200);
      } else if (g.direct && !g.triedDirect) {
        g.triedDirect = true;
        console.warn('[game-fix] all jsDelivr mirrors failed, switching to direct mode');
        setTimeout(function () { mount(g, 'direct'); }, 200);
      }
    }
  });

  /* ---------- public API (replaces the originals) ---------- */
  window.openGameWindow = function (title, html, icon, url) {
    var id = 'game-' + (++seq) + '-' + Date.now().toString(36); // must start with "game-" for closeWindow cleanup
    var g = GAMES[id] = {
      id: id, title: String(title || 'Game'), html: String(html || ''),
      url: url || '', direct: directUrl(url), mirror: 0, errs: []
    };
    if (g.url) { var hi = MIRRORS.indexOf((/\/\/([^\/]+)/.exec(g.url) || [])[1]); if (hi > 0) g.mirror = hi; }
    try { if (typeof APPS !== 'undefined' && APPS) APPS[id] = { title: g.title, icon: icon || (APPS.files ? APPS.files.icon : ''), pinned: true }; } catch (e) {}
    try { if (typeof GAME_HTML !== 'undefined') GAME_HTML[id] = g.html; } catch (e) {}
    try { if (typeof renderUI === 'function') renderUI(); } catch (e) {}
    mount(g, g.html ? 'blob' : 'direct');
    try { if (typeof renderUI === 'function') renderUI(); } catch (e) {}
    return id;
  };

  var origPop = window.popOutGame;
  window.popOutGame = function (id) {
    var g = GAMES[id];
    if (!g) { if (typeof origPop === 'function') origPop(id); return; }
    if (g.mode === 'direct' && g.direct) { window.open(g.direct, '_blank'); return; }
    var doc = buildHtml(g);
    var w = window.open('', '_blank');
    if (!w) { alert('Your browser blocked the new tab. Allow popups for this page.'); return; }
    try { w.document.open(); w.document.write(doc); w.document.close(); }
    catch (e) { w.location.href = URL.createObjectURL(new Blob([doc], { type: 'text/html' })); }
  };

  // free memory when game windows close
  setInterval(function () {
    for (var id in GAMES) {
      if (!document.getElementById('win-' + id)) {
        var g = GAMES[id]; clearTimeout(g.diagT);
        if (g.blobUrl) { try { URL.revokeObjectURL(g.blobUrl); } catch (e) {} }
        delete GAMES[id];
      }
    }
  }, 4000);

  console.log('[game-fix] installed');
})();
