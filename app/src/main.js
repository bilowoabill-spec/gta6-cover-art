// Vice Sunset — editor wiring: uploads, panel editing, caption, export.
// Photos are read with FileReader on this machine and never uploaded.

import { SIZES, LAYOUTS, defaultState, drawCover } from './cover.js';

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const ctx = stage.getContext('2d');
const state = defaultState();
let fontReady = false;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image'));
    img.src = src;
  });
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('could not read file'));
    reader.readAsDataURL(file);
  });
}

function ensurePanels() {
  const count = LAYOUTS[state.layout](100, 100, 0).length;
  while (state.panels.length < count) {
    state.panels.push({ photo: state.photos.length ? 0 : -1, zoom: 1, ox: 0, oy: 0 });
  }
  state.panels.length = count;
  if (state.selected >= count) state.selected = 0;
}

function render() {
  const size = SIZES[state.size];
  if (stage.width !== size.w || stage.height !== size.h) {
    stage.width = size.w;
    stage.height = size.h;
  }
  ensurePanels();
  drawCover(ctx, state, size.w, size.h);
  refreshPanelSelect();
  refreshThumbs();
}

function refreshThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const img = document.createElement('img');
    img.className = 'thumb' + (i === 0 ? ' is-first' : '');
    img.src = photo.img.src;
    img.alt = photo.name;
    img.title = photo.name + ' — click to put it in the selected panel';
    img.addEventListener('click', () => {
      state.panels[state.selected].photo = i;
      render();
    });
    box.appendChild(img);
  });
}

function refreshPanelSelect() {
  const select = $('panel-photo');
  const previous = select.value;
  select.innerHTML = '';
  const none = document.createElement('option');
  none.value = '-1';
  none.textContent = 'No photo (painted sunset)';
  select.appendChild(none);
  state.photos.forEach((photo, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `${i + 1}. ${photo.name}`;
    select.appendChild(option);
  });
  const current = state.panels[state.selected]
    ? String(state.panels[state.selected].photo)
    : '-1';
  select.value = [...select.options].some((o) => o.value === current) ? current : previous;
  const panel = state.panels[state.selected];
  if (panel) {
    $('zoom').value = String(Math.round((panel.zoom || 1) * 100));
    $('zoom-val').textContent = `${Math.round((panel.zoom || 1) * 100)}%`;
  }
}

async function addPhoto(source, name) {
  const img = await loadImage(source);
  state.photos.push({ img, name });
  // New photos fill empty panels first, then the selected one.
  ensurePanels();
  const empty = state.panels.findIndex((p) => p.photo === -1);
  if (empty !== -1) state.panels[empty].photo = state.photos.length - 1;
  else state.panels[state.selected].photo = state.photos.length - 1;
  render();
}

async function addSample(kind) {
  const note = $('export-note');
  try {
    const response = await fetch(`samples/${kind}.jpg`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    await addPhoto(url, kind === 'pier' ? 'Pier sunset' : 'Boulevard');
    note.textContent = 'Sample photo loaded — drag it, crop it, make it yours.';
  } catch {
    note.textContent = 'Could not load the sample photo.';
  }
}

// --- Uploads ---------------------------------------------------------------
$('upload').addEventListener('change', async (event) => {
  const files = [...event.target.files];
  for (const file of files) {
    try {
      const dataUrl = await readFileAsDataURL(file);
      await addPhoto(dataUrl, file.name);
    } catch {
      $('export-note').textContent = `Could not read ${file.name}.`;
    }
  }
  event.target.value = '';
  $('export-note').textContent = `${files.length} photo(s) loaded — pick a panel and drag to crop.`;
});

$('sample-pier').addEventListener('click', () => addSample('pier'));
$('sample-boulevard').addEventListener('click', () => addSample('boulevard'));

$('fill-all').addEventListener('click', () => {
  if (!state.photos.length) {
    $('export-note').textContent = 'Add a photo first.';
    return;
  }
  ensurePanels();
  state.panels.forEach((p) => { p.photo = 0; p.zoom = 1; p.ox = 0; p.oy = 0; });
  render();
  $('export-note').textContent = 'Every panel now shows the first photo.';
});

// --- Layout, grade, size ---------------------------------------------------
function bindChoiceRow(id, key) {
  $(id).addEventListener('click', (event) => {
    const button = event.target.closest('button[data-' + key + ']');
    if (!button) return;
    state[key] = button.dataset[key];
    [...$(id).querySelectorAll('button')].forEach((b) =>
      b.classList.toggle('is-active', b === button));
    if (key === 'layout') ensurePanels();
    render();
  });
}
bindChoiceRow('layout-row', 'layout');
bindChoiceRow('grade-row', 'grade');

document.querySelectorAll('.size-btn').forEach((button) => {
  button.addEventListener('click', () => {
    state.size = button.dataset.size;
    document.querySelectorAll('.size-btn').forEach((b) =>
      b.classList.toggle('is-active', b === button));
    render();
  });
});

// --- Caption and panel controls --------------------------------------------
$('title').addEventListener('input', (e) => { state.title = e.target.value; render(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; render(); });
$('title-size').addEventListener('input', (e) => {
  state.titleScale = Number(e.target.value) / 100;
  $('title-size-val').textContent = `${e.target.value}%`;
  render();
});
$('panel-photo').addEventListener('change', (e) => {
  state.panels[state.selected].photo = Number(e.target.value);
  render();
});
$('zoom').addEventListener('input', (e) => {
  const panel = state.panels[state.selected];
  panel.zoom = Number(e.target.value) / 100;
  $('zoom-val').textContent = `${e.target.value}%`;
  render();
});

// --- Canvas interaction: click to select a panel, drag to pan, wheel to zoom
function panelAt(clientX, clientY) {
  const box = stage.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * stage.width;
  const y = ((clientY - box.top) / box.height) * stage.height;
  const rects = LAYOUTS[state.layout](stage.width, stage.height, Math.max(4, 8 * (stage.width / 1080)));
  const hit = rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
  return { hit, x, y, box };
}

let dragging = null;
stage.addEventListener('pointerdown', (e) => {
  const { hit, x, y, box } = panelAt(e.clientX, e.clientY);
  if (hit === -1) return;
  state.selected = hit;
  stage.setPointerCapture(e.pointerId);
  dragging = { x, y, box, panel: state.panels[hit] };
  render();
});
stage.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const box = stage.getBoundingClientRect();
  const x = ((e.clientX - box.left) / box.width) * stage.width;
  const y = ((e.clientY - box.top) / box.height) * stage.height;
  const rects = LAYOUTS[state.layout](stage.width, stage.height, Math.max(4, 8 * (stage.width / 1080)));
  const rect = rects[state.selected];
  dragging.panel.ox += (x - dragging.x) / rect.w;
  dragging.panel.oy += (y - dragging.y) / rect.h;
  dragging.panel.ox = Math.max(-0.5, Math.min(0.5, dragging.panel.ox));
  dragging.panel.oy = Math.max(-0.5, Math.min(0.5, dragging.panel.oy));
  dragging.x = x;
  dragging.y = y;
  render();
});
stage.addEventListener('pointerup', () => { dragging = null; });
stage.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  if (!panel) return;
  panel.zoom = Math.max(1, Math.min(3, (panel.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.93)));
  render();
}, { passive: false });

// --- Export ----------------------------------------------------------------
function exportCanvas(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), state, size.w, size.h);
  return off;
}

function downloadPNG(sizeKey) {
  const size = SIZES[sizeKey];
  exportCanvas(sizeKey).toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vice-sunset-${sizeKey}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    $('export-note').textContent = `Exported ${size.label} PNG — check your downloads.`;
  }, 'image/png');
}

$('export-png').addEventListener('click', () => downloadPNG(state.size));

// Test hooks (also handy for screenshots): export any size as a data URL.
window.__vice = {
  state,
  render,
  exportPNG(sizeKey) {
    return new Promise((resolve) => {
      exportCanvas(sizeKey).toBlob((blob) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }, 'image/png');
    });
  },
};

// --- Boot: font first, then optional shot mode for screenshots --------------
async function boot() {
  try {
    await document.fonts.load('80px Anton');
    await document.fonts.ready;
    fontReady = true;
  } catch {
    fontReady = false;
  }
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (params.get('caption')) state.title = params.get('caption');
  if (params.get('subtitle')) state.subtitle = params.get('subtitle');
  if (params.get('layout') && LAYOUTS[params.get('layout')]) state.layout = params.get('layout');
  if (params.get('grade') && params.get('grade') in { sunset: 1, neon: 1, noir: 1 }) state.grade = params.get('grade');
  if (params.get('size') && SIZES[params.get('size')]) {
    state.size = params.get('size');
    document.querySelectorAll('.size-btn').forEach((b) =>
      b.classList.toggle('is-active', b.dataset.size === state.size));
  }
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (params.get('photo')) {
    await addSample(params.get('photo'));
    if (shot === 'cover') state.panels.forEach((p) => { if (p.photo === -1) p.photo = 0; });
  }
  render();
  window.__vice.ready = fontReady;
}

boot();
