// Vice Sunset editor: photo slots, panel controls, live preview and PNG export.
// Photos are read with FileReader on this machine and never uploaded anywhere.

import { SIZES, GRADES, panelRects, drawCover } from './cover.js';

const SAMPLES = [
  { src: './samples/boulevard.jpg', name: 'Boulevard sunset' },
  { src: './samples/pier.jpg', name: 'Neon pier' },
];

const state = {
  photos: [null, null, null],
  photoNames: ['Empty slot', 'Empty slot', 'Empty slot'],
  layout: 'triptych',
  grade: 'sunset',
  size: 'square',
  caption: 'SUNSET HEIST',
  tagline: 'One last job before the sun goes down',
  panels: [
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
    { photo: 1, zoom: 1, dx: 0, dy: 0 },
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
  ],
  selectedPanel: 0,
};

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');

function panelCount() {
  return state.layout === 'grid' ? 4 : 3;
}

function ensurePanels() {
  const n = panelCount();
  while (state.panels.length < n) {
    // A new panel starts on the other photo, so a fresh layout shows variety.
    state.panels.push({ photo: state.panels.length % 2, zoom: 1, dx: 0, dy: 0 });
  }
  state.panels.length = n;
  if (state.selectedPanel >= n) state.selectedPanel = 0;
}

function redraw() {
  ensurePanels();
  const [w, h] = SIZES[state.size];
  if (preview.width !== w || preview.height !== h) {
    preview.width = w;
    preview.height = h;
  }
  drawCover(preview, state);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function renderSlots() {
  const wrap = $('slots');
  wrap.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    if (photo) {
      const img = document.createElement('img');
      img.src = photo.src;
      img.alt = state.photoNames[i];
      slot.appendChild(img);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'remove';
      remove.textContent = '×';
      remove.setAttribute('aria-label', `Remove photo ${i + 1}`);
      remove.addEventListener('click', () => {
        state.photos[i] = null;
        state.photoNames[i] = 'Empty slot';
        state.panels.forEach((p) => { if (p.photo === i) p.photo = 0; });
        renderSlots();
        renderPanelEditor();
        redraw();
        setStatus(`Photo ${i + 1} removed.`);
      });
      slot.appendChild(remove);
    } else {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = `Photo ${i + 1} — empty`;
      slot.appendChild(empty);
    }
    const name = document.createElement('span');
    name.className = 'slot-name';
    name.textContent = `Photo ${i + 1} · ${state.photoNames[i]}`;
    slot.appendChild(name);
    wrap.appendChild(slot);
  });
}

function renderPanelEditor() {
  ensurePanels();
  const wrap = $('panelEditor');
  wrap.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === state.selectedPanel ? ' is-selected' : '');
    row.addEventListener('click', () => {
      state.selectedPanel = i;
      renderPanelEditor();
    });

    const head = document.createElement('div');
    head.className = 'row-head';
    const title = document.createElement('strong');
    title.textContent = `Panel ${i + 1}`;
    const select = document.createElement('select');
    select.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    state.photos.forEach((photo, p) => {
      const opt = document.createElement('option');
      opt.value = String(p);
      opt.textContent = photo ? `Photo ${p + 1} — ${state.photoNames[p]}` : `Photo ${p + 1} (empty)`;
      select.appendChild(opt);
    });
    select.value = String(panel.photo);
    select.addEventListener('change', () => {
      panel.photo = Number(select.value);
      redraw();
    });
    select.addEventListener('click', (e) => e.stopPropagation());
    head.append(title, select);
    row.appendChild(head);

    const sliders = [
      ['Zoom', 'zoom', 1, 3, 0.05, (v) => `${v.toFixed(2)}×`],
      ['Pan X', 'dx', -1, 1, 0.05, (v) => v.toFixed(2)],
      ['Pan Y', 'dy', -1, 1, 0.05, (v) => v.toFixed(2)],
    ];
    sliders.forEach(([label, key, min, max, step, fmt]) => {
      const lab = document.createElement('label');
      lab.textContent = label;
      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(panel[key]);
      input.setAttribute('aria-label', `${label} for panel ${i + 1}`);
      const out = document.createElement('output');
      out.textContent = fmt(panel[key]);
      input.addEventListener('input', () => {
        panel[key] = Number(input.value);
        out.textContent = fmt(panel[key]);
        redraw();
      });
      input.addEventListener('click', (e) => e.stopPropagation());
      lab.append(input, out);
      row.appendChild(lab);
    });
    wrap.appendChild(row);
  });
}

function wireChoices(id, key, onChange) {
  $(id).querySelectorAll('button').forEach((btn) => {
    btn.addEventListener('click', () => {
      $(id).querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state[key] = btn.dataset[key];
      if (key === 'layout') renderPanelEditor();
      redraw();
      if (onChange) onChange(btn.dataset[key]);
    });
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not read ${file.name}`));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function addUploads(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (!images.length) {
    setStatus('That was not an image file — try a JPG or PNG.');
    return;
  }
  let added = 0;
  for (const file of images) {
    const slot = state.photos.findIndex((p) => p === null);
    if (slot === -1) break;
    try {
      const img = await readFileAsImage(file);
      state.photos[slot] = img;
      state.photoNames[slot] = file.name;
      added += 1;
    } catch (err) {
      setStatus(err.message);
    }
  }
  if (added === 0) setStatus('All three photo slots are full — remove one first.');
  else setStatus(`Added ${added} photo${added > 1 ? 's' : ''}. Pick a panel to place it.`);
  renderSlots();
  renderPanelEditor();
  redraw();
}

/** Renders one size off-screen and returns a PNG data URL. Used by the UI and by tests. */
export async function exportCover(sizeName) {
  const [w, h] = SIZES[sizeName];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  return new Promise((resolve) => canvas.toBlob((blob) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  }, 'image/png'));
}

function downloadPng(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function exportSelected() {
  const url = await exportCover(state.size);
  const [w, h] = SIZES[state.size];
  downloadPng(url, `vice-sunset-cover-${w}x${h}.png`);
  setStatus(`Exported ${w} × ${h} PNG. Share it anywhere.`);
}

async function exportAll() {
  for (const name of Object.keys(SIZES)) {
    const url = await exportCover(name);
    const [w, h] = SIZES[name];
    downloadPng(url, `vice-sunset-cover-${w}x${h}.png`);
    await new Promise((r) => setTimeout(r, 150));
  }
  setStatus('Exported all three sizes: 1080 × 1080, 1080 × 1350 and 1920 × 1080.');
}

function previewPanelAt(clientX, clientY) {
  const box = preview.getBoundingClientRect();
  const x = (clientX - box.left) * (preview.width / box.width);
  const y = (clientY - box.top) * (preview.height / box.height);
  const rects = panelRects(state.layout, preview.width, preview.height);
  return rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}

function wirePreviewDrag() {
  let drag = null;
  preview.addEventListener('pointerdown', (e) => {
    const i = previewPanelAt(e.clientX, e.clientY);
    if (i === -1) return;
    state.selectedPanel = i;
    renderPanelEditor();
    const rects = panelRects(state.layout, preview.width, preview.height);
    drag = { panel: state.panels[i], startX: e.clientX, startY: e.clientY, rect: rects[i], box: preview.getBoundingClientRect() };
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const scaleX = preview.width / drag.box.width;
    const scaleY = preview.height / drag.box.height;
    const dxPx = (e.clientX - drag.startX) * scaleX;
    const dyPx = (e.clientY - drag.startY) * scaleY;
    const p = drag.panel;
    const img = state.photos[p.photo];
    if (img) {
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      const base = Math.max(drag.rect.w / iw, drag.rect.h / ih) * p.zoom;
      const slackX = Math.max(1, (iw * base - drag.rect.w) / 2);
      const slackY = Math.max(1, (ih * base - drag.rect.h) / 2);
      p.dx = Math.max(-1, Math.min(1, p.dx + (dxPx / slackX) * 0.5));
      p.dy = Math.max(-1, Math.min(1, p.dy + (dyPx / slackY) * 0.5));
    }
    drag.startX = e.clientX;
    drag.startY = e.clientY;
    redraw();
  });
  preview.addEventListener('pointerup', () => { drag = null; });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const i = previewPanelAt(e.clientX, e.clientY);
    if (i === -1) return;
    const p = state.panels[i];
    p.zoom = Math.max(1, Math.min(3, p.zoom - Math.sign(e.deltaY) * 0.1));
    state.selectedPanel = i;
    renderPanelEditor();
    redraw();
  }, { passive: false });
}

async function init() {
  $('photoInput').addEventListener('change', (e) => {
    addUploads(e.target.files);
    e.target.value = '';
  });
  $('captionInput').addEventListener('input', (e) => { state.caption = e.target.value; redraw(); });
  $('taglineInput').addEventListener('input', (e) => { state.tagline = e.target.value; redraw(); });
  $('exportBtn').addEventListener('click', exportSelected);
  $('exportAllBtn').addEventListener('click', exportAll);
  wireChoices('layoutChoices', 'layout');
  wireChoices('gradeChoices', 'grade');
  wireChoices('sizeChoices', 'size');
  wirePreviewDrag();

  try {
    await document.fonts.load('80px Anton');
    await document.fonts.ready;
  } catch { /* Anton falls back to Arial Black; the cover still draws */ }

  for (let i = 0; i < SAMPLES.length; i += 1) {
    try {
      state.photos[i] = await loadImage(SAMPLES[i].src);
      state.photoNames[i] = SAMPLES[i].name;
    } catch (err) {
      setStatus(err.message);
    }
  }
  renderSlots();
  renderPanelEditor();
  redraw();
  setStatus('Ready — samples loaded. Add your own photo, tweak the panels, export.');
  window.__viceCover = { exportCover, state };
  window.__viceReady = true;
}

init();
