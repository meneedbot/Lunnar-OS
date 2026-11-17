(function () {
  'use strict';

  var canvas = document.getElementById('board');
  var wrap = canvas.parentNode;
  var ctx = canvas.getContext('2d');

  var scoreEl = document.getElementById('score');
  var bestEl = document.getElementById('best');
  var lvlEl = document.getElementById('level-num');
  var overlay = document.getElementById('overlay');
  var ovTitle = document.getElementById('ov-title');
  var ovSub = document.getElementById('ov-sub');
  var startBtn = document.getElementById('start');

  var W = 360;
  var H = 480;
  var DPR = 1;
  var rectLeft = 0;

  var state = 'menu';
  var player = { x: 180, y: 400, w: 30, h: 18 };
  var items = [];
  var keys = { left: false, right: false };
  var dragX = null;

  var score = 0;
  var shownScore = -1;
  var best = 0;
  var level = 1;
  var elapsed = 0;
  var sinceSpawn = 0;

  var last = 0;
  var rafId = 0;
  var bgGrad = null;

  try {
    best = parseInt(localStorage.getItem('lunaar_arcade_best') || '0', 10) || 0;
  } catch (err) {
    best = 0;
  }
  bestEl.textContent = String(best);

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    var x;
    var y;
    for (x = 0; x < W; x += 64) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, H);
    }
    for (y = 0; y < H; y += 64) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(W, y + 0.5);
    }
    ctx.stroke();
  }

  function drawItem(it) {
    var half = it.s * 0.5;

    if (it.orb) {
      ctx.beginPath();
      ctx.arc(it.x, it.y, half, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(150, 240, 255, 0.95)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(it.x, it.y, half + 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(150, 240, 255, 0.35)';
      ctx.lineWidth = 2;
      ctx.stroke();
      return;
    }

    var hue = 350 - Math.min(120, (it.v - 180) * 0.25);

    ctx.save();
    ctx.translate(it.x, it.y);
    ctx.rotate(it.spin * 0.25);
    ctx.fillStyle = 'hsla(' + hue + ', 85%, 62%, 0.92)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(-half, -half, it.s, it.s, 5);
      ctx.fill();
    } else {
      ctx.fillRect(-half, -half, it.s, it.s);
    }
    ctx.restore();
  }

  function drawPlayer() {
    var px = player.x;
    var py = player.y;

    ctx.beginPath();
    ctx.moveTo(px, py - 13);
    ctx.lineTo(px + 15, py + 8);
    ctx.lineTo(px - 15, py + 8);
    ctx.closePath();
    ctx.fillStyle = 'rgba(170, 240, 255, 0.96)';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(px, py + 11, 10, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(120, 220, 255, 0.35)';
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle = bgGrad || '#04060b';
    ctx.fillRect(0, 0, W, H);

    drawGrid();

    var i;
    for (i = 0; i < items.length; i++) drawItem(items[i]);
    drawPlayer();

    var shown = Math.floor(score);
    if (shown !== shownScore) {
      shownScore = shown;
      scoreEl.textContent = String(shown);
    }
  }

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = wrap.clientWidth || 360;
    H = wrap.clientHeight || 480;

    canvas.width = Math.max(1, Math.round(W * DPR));
    canvas.height = Math.max(1, Math.round(H * DPR));
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    rectLeft = wrap.getBoundingClientRect().left;

    bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#070c14');
    bgGrad.addColorStop(1, '#03040a');

    player.y = H - 54;
    player.x = clamp(player.x, player.w, Math.max(player.w, W - player.w));

    draw();
  }

  function reset() {
    items.length = 0;
    score = 0;
    shownScore = -1;
    elapsed = 0;
    level = 1;
    sinceSpawn = 0;
    dragX = null;
    player.x = W / 2;

    scoreEl.textContent = '0';
    lvlEl.textContent = '1';
  }

  function start() {
    state = 'playing';
    reset();
    overlay.classList.add('is-hidden');
    last = 0;
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  function gameOver() {
    state = 'over';

    var final = Math.floor(score);
    var isBest = final > best;

    if (isBest) {
      best = final;
      try {
        localStorage.setItem('lunaar_arcade_best', String(best));
      } catch (err) {}
      bestEl.textContent = String(best);
    }

    ovTitle.textContent = 'GAME OVER';
    ovSub.innerHTML = 'Score <strong>' + final + '</strong>' + (isBest ? ' &middot; new best' : '');
    startBtn.textContent = 'Play again';
    overlay.classList.remove('is-hidden');
  }

  function spawn() {
    var orb = Math.random() < 0.28;
    var size = orb ? 18 : 22 + Math.random() * 14;
    var speed = (180 + (level - 1) * 28) * (orb ? 0.85 : 1) + Math.random() * 40;

    items.push({
      orb: orb,
      x: 24 + Math.random() * Math.max(1, W - 48),
      y: -30,
      s: size,
      v: speed,
      spin: Math.random() * Math.PI
    });
  }

  function step(dt) {
    elapsed += dt;
    level = 1 + Math.floor(elapsed / 15);
    lvlEl.textContent = String(level);
    score += dt * 10;

    var moveSpeed = 420;
    if (keys.left) player.x -= moveSpeed * dt;
    if (keys.right) player.x += moveSpeed * dt;
    if (dragX !== null) player.x += (dragX - player.x) * Math.min(1, dt * 14);
    player.x = clamp(player.x, player.w / 2 + 4, W - player.w / 2 - 4);

    sinceSpawn += dt;
    var interval = Math.max(0.28, 0.62 - (level - 1) * 0.035);
    if (sinceSpawn >= interval) {
      sinceSpawn -= interval;
      spawn();
    }

    var px = player.x;
    var py = player.y;

    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      it.y += it.v * dt;
      it.spin += dt * 2;

      if (it.y > H + 40) {
        items.splice(i, 1);
        continue;
      }

      var half = it.s * 0.5;
      var hitX = Math.abs(it.x - px) < half + player.w * 0.4;
      var hitY = Math.abs(it.y - py) < half + player.h * 0.5;

      if (hitX && hitY) {
        items.splice(i, 1);
        if (it.orb) {
          score += 50;
        } else {
          gameOver();
          return;
        }
      }
    }
  }

  function frame(now) {
    if (state !== 'playing') {
      rafId = 0;
      draw();
      return;
    }

    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;

    step(dt);
    draw();
    rafId = requestAnimationFrame(frame);
  }

  startBtn.addEventListener('click', start);

  window.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') {
      keys.left = true;
      e.preventDefault();
    } else if (k === 'ArrowRight' || k === 'd' || k === 'D') {
      keys.right = true;
      e.preventDefault();
    } else if (k === ' ' || k === 'Enter') {
      if (state !== 'playing') {
        e.preventDefault();
        start();
      }
    }
  });

  window.addEventListener('keyup', function (e) {
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
  });

  canvas.addEventListener('pointerdown', function (e) {
    rectLeft = wrap.getBoundingClientRect().left;
    dragX = e.clientX - rectLeft;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}
    if (state !== 'playing') start();
  });

  canvas.addEventListener('pointermove', function (e) {
    if (dragX !== null) dragX = e.clientX - rectLeft;
  });

  function endDrag() {
    dragX = null;
  }

  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', endDrag);

  window.addEventListener('blur', function () {
    keys.left = false;
    keys.right = false;
  });

  document.addEventListener('visibilitychange', function () {
    keys.left = false;
    keys.right = false;
    last = 0;
  });

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);

  resize();
})();
