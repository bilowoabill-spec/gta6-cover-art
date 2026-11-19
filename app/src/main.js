// main.js — Vice Sunset editor wiring.
//
// Owns the editor state, the preview canvas, photo uploads (FileReader only,
// nothing ever leaves the machine), panel selection / dragging, and PNG export
// at 1080×1080, 1080×1350 and 1920×1080. Rendering itself lives in cover.js.

import { SIZES, LAYOUTS, GRADES, defaultState, drawCover, panelAt } from './cover.js';

const state = defaultState();
const preview = document.getElementById('preview');
const statusEl = document.getElementById('status');
const panelLabel = document.getElementById('panelLabel');
const photoSelect = document.getElementById('photoSelect');
const photoStrip = document.getElementById('photoStrip');

function setStatus(text) {
  statusEl.textContent = text;
}

function render() {
  drawCover(preview, state);
  syncPanelControls();
}

function syncPanelControls() {
  const layout = LAYOUTS[state.layout];
  panelLabel.textContent = `Panel ${state.selected + 1} of ${layout.panels.length} selected`;
  const slot = state.slots[state.selected];
  document.getElementById('zoomRange').value = String(slot.zoom);
  document.getElementById('zoomVal').textContent = `${slot.zoom.toFixed(2)}×`;
  document.getElementById('panXRange').value = String(slot.ox);
  document.getElementById('panYRange').value = String(slot.oy);
  photoSelect.value = String(slot.photo);
}

// ---- option rows (sizes, layouts, grades) -------------------------------

function buildChips(container, entries, current, onPick) {
  container.innerHTML = '';
  for (const [key, value] of Object.entries(entries)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chip';
    button.textContent = value.label;
    button.setAttribute('aria-pressed', key === current ? 'true' : 'false');
    button.addEventListener('click', () => {
      onPick(key);
      buildChips(container, entries, key, onPick);
      render();
    });
    container.appendChild(button);
  }
}

buildChips(document.getElementById('sizeRow'), SIZES, state.size, (key) => {
  state.size = key;
  setStatus(`Export size: ${SIZES[key].label}.`);
});
buildChips(document.getElementById('layoutRow'), LAYOUTS, state.layout, (key) => {
  state.layout = key;
  state.selected = 0;
  // Grow the slot list to the new layout's panel count.
  while (state.slots.length < LAYOUTS[key].panels.length) {
    state.slots.push({ photo: 0, zoom: 1, ox: 0, oy: 0 });
  }
  setStatus(`Layout: ${LAYOUTS[key].label}.`);
});
buildChips(document.getElementById('gradeRow'), GRADES, state.grade, (key) => {
  state.grade = key;
  setStatus(`Colour grade: ${GRADES[key].label}.`);
});

// ---- photos --------------------------------------------------------------

function addPhoto(img, name) {
  state.photos.push({ img, name });
  const index = state.photos.length - 1;
  // First photo fills every panel; later photos fill empty slots.
  if (state.photos.length === 1) {
    state.slots.forEach((slot) => { slot.photo = 0; });
  }
  const thumb = document.createElement('img');
  thumb.className = 'thumb';
  thumb.src = img.src;
  thumb.alt = name;
  thumb.title = name;
  thumb.setAttribute('aria-pressed', 'false');
  thumb.addEventListener('click', () => {
    state.slots[state.selected].photo = index;
    refreshPhotoPicker();
    render();
  });
  photoStrip.appendChild(thumb);
  refreshPhotoPicker();
  return index;
}

function refreshPhotoPicker() {
  photoSelect.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const option = document.createElement('option');
    option.value = String(i);
    option.textContent = `${i + 1} · ${photo.name}`;
    photoSelect.appendChild(option);
  });
  if (state.photos.length === 0) {
    const option = document.createElement('option');
    option.value = '0';
    option.textContent = 'No photo yet';
    photoSelect.appendChild(option);
  }
  [...photoStrip.children].forEach((thumb, i) => {
    thumb.setAttribute('aria-pressed', i === state.slots[state.selected].photo ? 'true' : 'false');
  });
  photoSelect.value = String(state.slots[state.selected].photo);
}

function loadPhotoFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`${file.name} is not a readable image`));
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function loadPhotoUrl(url, name) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${name}`));
    img.src = url;
  });
}

async function addFiles(files) {
  let added = 0;
  for (const file of files) {
    try {
      const img = await loadPhotoFile(file);
      addPhoto(img, file.name);
      added += 1;
    } catch (err) {
      setStatus(err.message);
    }
  }
  if (added > 0) {
    setStatus(`${added} photo${added > 1 ? 's' : ''} loaded. Click a panel, then a thumbnail, to place it.`);
    render();
  }
}

document.getElementById('fileInput').addEventListener('change', (event) => {
  addFiles([...event.target.files]);
  event.target.value = '';
});

async function loadSample(url, name) {
  try {
    const img = await loadPhotoUrl(url, name);
    addPhoto(img, name);
    setStatus(`Sample photo “${name}” loaded.`);
    render();
  } catch (err) {
    setStatus(err.message);
  }
}

document.getElementById('sampleBoulevard').addEventListener('click', () => {
  loadSample('samples/sunset-boulevard.jpg', 'Sunset Boulevard');
});
document.getElementById('samplePier').addEventListener('click', () => {
  loadSample('samples/neon-pier.jpg', 'Neon Pier');
});

// ---- caption -------------------------------------------------------------

document.getElementById('captionInput').addEventListener('input', (event) => {
  state.caption = event.target.value;
  render();
});
document.getElementById('subInput').addEventListener('input', (event) => {
  state.subcaption = event.target.value;
  render();
});

// ---- selected panel: picker, sliders, fill-all ---------------------------

photoSelect.addEventListener('change', () => {
  state.slots[state.selected].photo = Number(photoSelect.value);
  refreshPhotoPicker();
  render();
});

document.getElementById('zoomRange').addEventListener('input', (event) => {
  state.slots[state.selected].zoom = Number(event.target.value);
  render();
});
document.getElementById('panXRange').addEventListener('input', (event) => {
  state.slots[state.selected].ox = Number(event.target.value);
  render();
});
document.getElementById('panYRange').addEventListener('input', (event) => {
  state.slots[state.selected].oy = Number(event.target.value);
  render();
});

document.getElementById('fillAllBtn').addEventListener('click', () => {
  const photo = state.slots[state.selected].photo;
  state.slots.forEach((slot) => { slot.photo = photo; });
  refreshPhotoPicker();
  render();
  setStatus('Every panel now shows the same photo.');
});

// ---- panel picking + dragging on the preview -----------------------------

function previewPoint(event) {
  const rect = preview.getBoundingClientRect();
  const scaleX = preview.width / rect.width;
  const scaleY = preview.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

let drag = null;

preview.addEventListener('pointerdown', (event) => {
  const point = previewPoint(event);
  const panel = panelAt(state, point.x, point.y);
  if (panel === -1) return;
  state.selected = panel;
  const slot = state.slots[panel];
  drag = { lastX: point.x, lastY: point.y, ox: slot.ox, oy: slot.oy };
  preview.setPointerCapture(event.pointerId);
  render();
});

preview.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = previewPoint(event);
  const slot = state.slots[state.selected];
  const size = SIZES[state.size];
  slot.ox = Math.max(-0.5, Math.min(0.5, drag.ox + (point.x - drag.lastX) / size.width));
  slot.oy = Math.max(-0.5, Math.min(0.5, drag.oy + (point.y - drag.lastY) / size.height));
  render();
});

preview.addEventListener('pointerup', () => { drag = null; });
preview.addEventListener('pointercancel', () => { drag = null; });

// ---- export ---------------------------------------------------------------

export function exportCover() {
  const canvas = document.createElement('canvas');
  drawCover(canvas, state);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Export failed: the browser could not encode the PNG.'));
        return;
      }
      resolve(blob);
    }, 'image/png');
  });
}

document.getElementById('exportBtn').addEventListener('click', async () => {
  const button = document.getElementById('exportBtn');
  button.disabled = true;
  setStatus('Exporting…');
  try {
    const blob = await exportCover();
    const size = SIZES[state.size];
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vice-sunset-${size.width}x${size.height}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatus(`Exported ${size.label} PNG — check your downloads.`);
  } catch (err) {
    setStatus(err.message);
  } finally {
    button.disabled = false;
  }
});

// ---- boot -----------------------------------------------------------------

refreshPhotoPicker();
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => render());
}
render();
