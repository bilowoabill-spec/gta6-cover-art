// Vice Sunset — Cover Art Studio.
// Turns the user's own photos + a caption into a GTA 6-style multi-panel
// poster and exports it as a PNG. Everything runs locally in the browser:
// photos are read with FileReader and never leave the machine.
(function () {
  'use strict';

  var canvas = document.getElementById('preview');
  var ctx = canvas.getContext('2d');

  var LAYOUTS = {
    split: [
      { x: 0.04, y: 0.18, w: 0.92, h: 0.42 },
      { x: 0.04, y: 0.62, w: 0.45, h: 0.23 },
      { x: 0.51, y: 0.62, w: 0.45, h: 0.23 }
    ],
    grid: [
      { x: 0.04, y: 0.18, w: 0.56, h: 0.67 },
      { x: 0.63, y: 0.18, w: 0.33, h: 0.32 },
      { x: 0.63, y: 0.53, w: 0.33, h: 0.32 }
    ],
    triptych: [
      { x: 0.04, y: 0.18, w: 0.28, h: 0.67 },
      { x: 0.36, y: 0.18, w: 0.28, h: 0.67 },
      { x: 0.68, y: 0.18, w: 0.28, h: 0.67 }
    ]
  };

  var SIZES = {
    '1080x1080': { w: 1080, h: 1080 },
    '1080x1350': { w: 1080, h: 1350 },
    '1920x1080': { w: 1920, h: 1080 }
  };

  var CAPTION_STYLES = {
    sunset: ['#ff5e78', '#ff9a3d'],
    neon: ['#ff2ea6', '#7b2ff7'],
    gold: ['#f7c948', '#e07b39']
  };

  var state = {
    photos: [],
    nextPhotoId: 1,
    layout: 'split',
    selectedPanel: 0,
    panels: [
      { photoId: null, zoom: 1, dx: 0, dy: 0 },
      { photoId: null, zoom: 1, dx: 0, dy: 0 },
      { photoId: null, zoom: 1, dx: 0, dy: 0 }
    ],
    caption: 'SUNSET DRIVE',
    subline: 'NEON NIGHTS',
    captionScale: 1,
    captionPos: 'bottom',
    captionStyle: 'sunset',
    grade: 'sunset',
    size: '1080x1080'
  };

  function $(id) { return document.getElementById(id); }

  function photoById(id) {
    for (var i = 0; i < state.photos.length; i++) {
      if (state.photos[i].id === id) return state.photos[i];
    }
    return null;
  }

  function panelRects(W, H) {
    return LAYOUTS[state.layout].map(function (r) {
      return { x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H };
    });
  }

  // ---- poster drawing -------------------------------------------------

  function drawPalm(c, x, y, s, color) {
    c.save();
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = Math.max(2, s * 0.06);
    c.lineCap = 'round';
    // trunk
    c.beginPath();
    c.moveTo(x, y);
    c.quadraticCurveTo(x + s * 0.08, y - s * 0.55, x + s * 0.22, y - s * 0.95);
    c.stroke();
    var topX = x + s * 0.22;
    var topY = y - s * 0.95;
    // fronds
    var angles = [-2.6, -2.0, -1.4, -0.8, -0.2, 0.4];
    for (var i = 0; i < angles.length; i++) {
      var a = angles[i];
      var ex = topX + Math.cos(a) * s * 0.62;
      var ey = topY + Math.sin(a) * s * 0.5 + s * 0.28;
      c.beginPath();
      c.moveTo(topX, topY);
      c.quadraticCurveTo(topX + Math.cos(a) * s * 0.35, topY + Math.sin(a) * s * 0.28 - s * 0.1, ex, ey);
      c.stroke();
    }
    // coconuts
    c.beginPath();
    c.arc(topX - s * 0.03, topY + s * 0.05, s * 0.05, 0, Math.PI * 2);
    c.arc(topX + s * 0.06, topY + s * 0.06, s * 0.045, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawSun(c, W, H, skyGrad) {
    var cx = W * 0.78;
    var cy = H * 0.095;
    var r = Math.min(W, H) * 0.075;
    var g = c.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#fff7ae');
    g.addColorStop(0.55, '#ffb347');
    g.addColorStop(1, '#ff6b35');
    c.save();
    c.beginPath();
    c.arc(cx, cy, r, 0, Math.PI * 2);
    c.fillStyle = g;
    c.fill();
    c.clip();
    // retro slats across the lower half, painted with the sky gradient so
    // they blend exactly with the sky behind the sun
    c.fillStyle = skyGrad;
    var slats = [0.08, 0.22, 0.38, 0.56];
    for (var i = 0; i < slats.length; i++) {
      var y = cy + r * slats[i];
      var h = r * (0.03 + i * 0.022);
      c.fillRect(cx - r - 2, y, r * 2 + 4, h);
    }
    c.restore();
  }

  function drawPhotoCover(c, img, px, py, pw, ph, panel) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var scale = Math.max(pw / iw, ph / ih) * panel.zoom;
    var dw = iw * scale;
    var dh = ih * scale;
    var dx = px + (pw - dw) / 2 + panel.dx * pw;
    var dy = py + (ph - dh) / 2 + panel.dy * ph;
    c.drawImage(img, dx, dy, dw, dh);
  }

  function gradeOverlay(c, px, py, pw, ph) {
    c.save();
    if (state.grade === 'sunset') {
      var g = c.createLinearGradient(px, py, px, py + ph);
      g.addColorStop(0, 'rgba(255,170,60,0.16)');
      g.addColorStop(1, 'rgba(255,60,140,0.20)');
      c.globalCompositeOperation = 'overlay';
      c.fillStyle = g;
      c.fillRect(px, py, pw, ph);
    } else if (state.grade === 'neon') {
      c.globalCompositeOperation = 'screen';
      c.fillStyle = 'rgba(255,0,170,0.10)';
      c.fillRect(px, py, pw, ph);
      c.globalCompositeOperation = 'multiply';
      c.fillStyle = 'rgba(0,200,255,0.12)';
      c.fillRect(px, py, pw, ph);
    } else if (state.grade === 'noir') {
      c.globalCompositeOperation = 'overlay';
      c.fillStyle = 'rgba(120,80,180,0.15)';
      c.fillRect(px, py, pw, ph);
    }
    c.restore();
    // vignette
    var v = c.createRadialGradient(
      px + pw / 2, py + ph / 2, Math.min(pw, ph) * 0.35,
      px + pw / 2, py + ph / 2, Math.max(pw, ph) * 0.75
    );
    v.addColorStop(0, 'rgba(20,8,42,0)');
    v.addColorStop(1, 'rgba(20,8,42,0.30)');
    c.fillStyle = v;
    c.fillRect(px, py, pw, ph);
  }

  function drawPanel(c, rect, panel, W) {
    var px = rect.x, py = rect.y, pw = rect.w, ph = rect.h;
    c.save();
    c.beginPath();
    c.rect(px, py, pw, ph);
    c.clip();
    var photo = panel.photoId === null ? null : photoById(panel.photoId);
    if (photo) {
      if (state.grade === 'noir') c.filter = 'grayscale(1) contrast(1.15) brightness(0.95)';
      drawPhotoCover(c, photo.img, px, py, pw, ph, panel);
      c.filter = 'none';
      gradeOverlay(c, px, py, pw, ph);
    } else {
      var g = c.createLinearGradient(px, py, px + pw, py + ph);
      g.addColorStop(0, '#4b1d7a');
      g.addColorStop(1, '#c2437a');
      c.fillStyle = g;
      c.fillRect(px, py, pw, ph);
      c.fillStyle = 'rgba(255,255,255,0.75)';
      c.font = Math.round(ph * 0.09) + 'px Anton, sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('ADD A PHOTO', px + pw / 2, py + ph / 2);
    }
    c.restore();
    var bw = Math.max(2, W / 1080 * 5);
    c.lineWidth = bw;
    c.strokeStyle = '#14082a';
    c.strokeRect(px, py, pw, ph);
    c.lineWidth = Math.max(1, W / 1080 * 2);
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.strokeRect(px + bw, py + bw, pw - bw * 2, ph - bw * 2);
  }

  function drawCaptionBand(c, W, H) {
    var bandH = H * 0.115;
    var bandY = state.captionPos === 'top' ? H * 0.015 : H * 0.865;
    var colors = CAPTION_STYLES[state.captionStyle];
    c.save();
    c.translate(W / 2, bandY + bandH / 2);
    c.rotate(-0.026);
    var g = c.createLinearGradient(-W / 2, 0, W / 2, 0);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1]);
    c.fillStyle = g;
    c.fillRect(-W * 0.53, -bandH / 2, W * 1.06, bandH);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.fillRect(-W * 0.53, -bandH / 2, W * 1.06, Math.max(2, H * 0.004));
    c.fillRect(-W * 0.53, bandH / 2 - Math.max(2, H * 0.004), W * 1.06, Math.max(2, H * 0.004));
    var size = H * 0.082 * state.captionScale;
    c.font = size + 'px Anton, sans-serif';
    try { c.letterSpacing = Math.round(size * 0.04) + 'px'; } catch (e) { /* older canvas */ }
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = Math.max(3, H * 0.006);
    c.strokeStyle = '#1c0a2e';
    var label = (state.caption || 'UNTITLED').toUpperCase();
    c.strokeText(label, 0, size * 0.04);
    c.fillStyle = '#ffffff';
    c.fillText(label, 0, size * 0.04);
    try { c.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
    c.restore();
  }

  function drawPoster(c, W, H) {
    // sunset sky
    var sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#1a0b2e');
    sky.addColorStop(0.35, '#7b2d8b');
    sky.addColorStop(0.62, '#e84a7a');
    sky.addColorStop(0.85, '#ff8a3d');
    sky.addColorStop(1, '#ffb347');
    c.fillStyle = sky;
    c.fillRect(0, 0, W, H);

    drawSun(c, W, H, sky);

    // palm silhouettes in the sky band
    drawPalm(c, W * 0.03, H * 0.175, H * 0.13, '#160826');
    drawPalm(c, W * 0.13, H * 0.178, H * 0.10, '#1d0a30');

    // subline in the sky band
    c.save();
    c.font = Math.round(H * 0.024) + 'px Anton, sans-serif';
    try { c.letterSpacing = Math.round(H * 0.004) + 'px'; } catch (e) { /* older canvas */ }
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillStyle = '#ffd166';
    c.fillText((state.subline || '').toUpperCase(), W * 0.04, H * 0.055);
    try { c.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
    c.restore();

    var rects = panelRects(W, H);
    for (var i = 0; i < rects.length; i++) {
      drawPanel(c, rects[i], state.panels[i], W);
    }

    drawCaptionBand(c, W, H);
  }

  // ---- preview ------------------------------------------------------

  function previewDims() {
    var s = SIZES[state.size];
    var longSide = 720;
    if (s.w >= s.h) return { w: longSide, h: Math.round(longSide * s.h / s.w) };
    return { w: Math.round(longSide * s.w / s.h), h: longSide };
  }

  function renderPreview() {
    var d = previewDims();
    if (canvas.width !== d.w || canvas.height !== d.h) {
      canvas.width = d.w;
      canvas.height = d.h;
    }
    drawPoster(ctx, d.w, d.h);
  }

  // ---- photos -------------------------------------------------------

  function setStatus(msg) { $('status').textContent = msg; }

  function refreshPhotoStrip() {
    var strip = $('photoStrip');
    strip.innerHTML = '';
    state.photos.forEach(function (p) {
      var img = document.createElement('img');
      img.src = p.src;
      img.alt = p.name;
      img.title = p.name + ' — click to use in the selected panel';
      img.addEventListener('click', function () {
        state.panels[state.selectedPanel].photoId = p.id;
        syncPanelControls();
        renderPreview();
      });
      strip.appendChild(img);
    });
    var sel = $('panelPhoto');
    sel.innerHTML = '';
    var none = document.createElement('option');
    none.value = '';
    none.textContent = 'Empty panel';
    sel.appendChild(none);
    state.photos.forEach(function (p) {
      var o = document.createElement('option');
      o.value = String(p.id);
      o.textContent = p.name;
      sel.appendChild(o);
    });
    syncPanelControls();
  }

  function addPhoto(img, src, name) {
    var p = { id: state.nextPhotoId++, name: name, img: img, src: src };
    state.photos.push(p);
    var anyFilled = state.panels.some(function (pn) { return pn.photoId !== null; });
    if (!anyFilled) {
      state.panels.forEach(function (pn) { pn.photoId = p.id; });
    }
    refreshPhotoStrip();
    renderPreview();
    setStatus('Photo loaded: ' + name + ' — pick a layout, then export a PNG.');
  }

  function loadFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () { addPhoto(img, String(reader.result), file.name); };
      img.onerror = function () { setStatus('Could not read ' + file.name + '.'); };
      img.src = String(reader.result);
    };
    reader.onerror = function () { setStatus('Could not read ' + file.name + '.'); };
    reader.readAsDataURL(file);
  }

  function loadSample(url, name) {
    var img = new Image();
    img.onload = function () { addPhoto(img, url, name); };
    img.onerror = function () { setStatus('Could not load the sample photo.'); };
    img.src = url;
  }

  // ---- panel controls -----------------------------------------------

  function syncPanelControls() {
    var btns = $('panelBtns');
    btns.innerHTML = '';
    LAYOUTS[state.layout].forEach(function (_r, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'layout-btn' + (i === state.selectedPanel ? ' active' : '');
      b.textContent = 'Panel ' + (i + 1);
      b.addEventListener('click', function () {
        state.selectedPanel = i;
        syncPanelControls();
        renderPreview();
      });
      btns.appendChild(b);
    });
    var panel = state.panels[state.selectedPanel];
    $('panelPhoto').value = panel.photoId === null ? '' : String(panel.photoId);
    $('zoomRange').value = String(panel.zoom);
    $('panXRange').value = String(panel.dx);
    $('panYRange').value = String(panel.dy);
  }

  // ---- export --------------------------------------------------------

  function exportPNG() {
    var s = SIZES[state.size];
    var off = document.createElement('canvas');
    off.width = s.w;
    off.height = s.h;
    drawPoster(off.getContext('2d'), s.w, s.h);
    off.toBlob(function (blob) {
      if (!blob) { setStatus('Export failed — please try again.'); return; }
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'vice-sunset-' + s.w + 'x' + s.h + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      setStatus('Exported ' + s.w + ' × ' + s.h + ' PNG.');
    }, 'image/png');
  }

  // ---- wiring ---------------------------------------------------------

  $('photoInput').addEventListener('change', function (e) {
    var files = Array.prototype.slice.call(e.target.files || []);
    files.forEach(loadFile);
    e.target.value = '';
  });

  $('sampleBoulevard').addEventListener('click', function () {
    loadSample('samples/boulevard.jpg', 'Boulevard sample');
  });
  $('samplePier').addEventListener('click', function () {
    loadSample('samples/pier.jpg', 'Pier sample');
  });

  $('layoutRow').addEventListener('click', function (e) {
    var b = e.target.closest('[data-layout]');
    if (!b) return;
    state.layout = b.getAttribute('data-layout');
    state.selectedPanel = 0;
    Array.prototype.forEach.call($('layoutRow').children, function (el) {
      el.classList.toggle('active', el === b);
    });
    syncPanelControls();
    renderPreview();
  });

  $('panelPhoto').addEventListener('change', function (e) {
    state.panels[state.selectedPanel].photoId = e.target.value === '' ? null : Number(e.target.value);
    renderPreview();
  });
  $('zoomRange').addEventListener('input', function (e) {
    state.panels[state.selectedPanel].zoom = Number(e.target.value);
    renderPreview();
  });
  $('panXRange').addEventListener('input', function (e) {
    state.panels[state.selectedPanel].dx = Number(e.target.value);
    renderPreview();
  });
  $('panYRange').addEventListener('input', function (e) {
    state.panels[state.selectedPanel].dy = Number(e.target.value);
    renderPreview();
  });

  $('fillAllBtn').addEventListener('click', function () {
    var id = state.panels[state.selectedPanel].photoId;
    state.panels.forEach(function (pn) { pn.photoId = id; });
    syncPanelControls();
    renderPreview();
  });

  $('captionInput').addEventListener('input', function (e) {
    state.caption = e.target.value;
    renderPreview();
  });
  $('sublineInput').addEventListener('input', function (e) {
    state.subline = e.target.value;
    renderPreview();
  });
  $('captionSize').addEventListener('input', function (e) {
    state.captionScale = Number(e.target.value);
    renderPreview();
  });
  $('captionStyle').addEventListener('change', function (e) {
    state.captionStyle = e.target.value;
    renderPreview();
  });
  document.querySelectorAll('.pos-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      state.captionPos = b.getAttribute('data-pos');
      document.querySelectorAll('.pos-btn').forEach(function (el) {
        el.classList.toggle('active', el === b);
      });
      renderPreview();
    });
  });

  $('gradeSelect').addEventListener('change', function (e) {
    state.grade = e.target.value;
    renderPreview();
  });

  $('sizeRow').addEventListener('click', function (e) {
    var b = e.target.closest('[data-size]');
    if (!b) return;
    state.size = b.getAttribute('data-size');
    Array.prototype.forEach.call($('sizeRow').children, function (el) {
      el.classList.toggle('active', el === b);
    });
    renderPreview();
  });

  $('exportBtn').addEventListener('click', exportPNG);

  $('resetBtn').addEventListener('click', function () {
    state.photos = [];
    state.nextPhotoId = 1;
    state.layout = 'split';
    state.selectedPanel = 0;
    state.panels = [
      { photoId: null, zoom: 1, dx: 0, dy: 0 },
      { photoId: null, zoom: 1, dx: 0, dy: 0 },
      { photoId: null, zoom: 1, dx: 0, dy: 0 }
    ];
    state.caption = 'SUNSET DRIVE';
    state.subline = 'NEON NIGHTS';
    state.captionScale = 1;
    state.captionPos = 'bottom';
    state.captionStyle = 'sunset';
    state.grade = 'sunset';
    state.size = '1080x1080';
    $('captionInput').value = state.caption;
    $('sublineInput').value = state.subline;
    $('captionSize').value = '1';
    $('captionStyle').value = 'sunset';
    $('gradeSelect').value = 'sunset';
    refreshPhotoStrip();
    renderPreview();
    setStatus('Load a photo to begin.');
  });

  // drag to move the photo inside the selected panel, wheel to zoom
  var drag = null;
  function canvasPoint(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * canvas.width / r.width,
      y: (e.clientY - r.top) * canvas.height / r.height
    };
  }
  function panelAt(x, y) {
    var rects = panelRects(canvas.width, canvas.height);
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i];
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
    }
    return -1;
  }
  canvas.addEventListener('pointerdown', function (e) {
    var p = canvasPoint(e);
    var i = panelAt(p.x, p.y);
    if (i < 0) return;
    state.selectedPanel = i;
    syncPanelControls();
    var rect = panelRects(canvas.width, canvas.height)[i];
    drag = { x: p.x, y: p.y, w: rect.w, h: rect.h };
    canvas.setPointerCapture(e.pointerId);
    renderPreview();
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var p = canvasPoint(e);
    var panel = state.panels[state.selectedPanel];
    panel.dx = Math.max(-0.5, Math.min(0.5, panel.dx + (p.x - drag.x) / drag.w));
    panel.dy = Math.max(-0.5, Math.min(0.5, panel.dy + (p.y - drag.y) / drag.h));
    drag.x = p.x;
    drag.y = p.y;
    $('panXRange').value = String(panel.dx);
    $('panYRange').value = String(panel.dy);
    renderPreview();
  });
  canvas.addEventListener('pointerup', function () { drag = null; });
  canvas.addEventListener('pointercancel', function () { drag = null; });
  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    var p = canvasPoint(e);
    var i = panelAt(p.x, p.y);
    if (i < 0) return;
    state.selectedPanel = i;
    var panel = state.panels[i];
    panel.zoom = Math.max(1, Math.min(2.5, panel.zoom * Math.exp(-e.deltaY * 0.001)));
    syncPanelControls();
    renderPreview();
  }, { passive: false });

  // first paint, then repaint once the display font is ready
  renderPreview();
  refreshPhotoStrip();
  if (document.fonts && document.fonts.load) {
    document.fonts.load('40px Anton').then(renderPreview).catch(function () { /* keep fallback */ });
    document.fonts.ready.then(renderPreview).catch(function () { /* keep fallback */ });
  }
})();
