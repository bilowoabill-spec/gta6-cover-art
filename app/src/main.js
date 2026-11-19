// Wires the Vice Nights editor: photo uploads, layout and grade picks, panel
// selection by click, drag-to-pan on the preview, caption editing, and PNG export
// in 1080 x 1080, 1080 x 1350 and 1920 x 1080. Photos are read on this machine with
// FileReader and never uploaded anywhere.
import { drawPoster, GRADES, LAYOUTS } from './poster.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('poster');
const status = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const panelPhoto = document.getElementById('panelPhoto');
const zoomInput = document.getElementById('zoom');
const offsetXInput = document.getElementById('offsetX');
const offsetYInput = document.getElementById('offsetY');
const selectedLabel = document.getElementById('selectedPanel');
const exportPreview = document.getElementById('exportPreview');
const lastExport = document.getElementById('lastExport');

export const SIZES = [
  { label: '1080 x 1080', w: 1080, h: 1080 },
  { label: '1080 x 1350', w: 1080, h: 1350 },
  { label: '1920 x 1080', w: 1920, h: 1080 },
];

/** The editor state: three photo slots, one crop spec per panel of the layout. */
export const state = {
  layout: 'strip',
  grade: 'sunset',
  caption: 'Sunset Heist',
  subtitle: 'Vice Nights • Est. 2026',
  size: SIZES[1],
  photos: [null, null, null],
  panels: [],
  selected: 0,
};

function defaultPanels(layout) {
  const count = LAYOUTS[layout].panels.length;
  const slots = [0, 1, 2, -1];
  return Array.from({ length: count }, (_, i) => ({ slot: slots[i] ?? -1, zoom: 1, ox: 0, oy: 0 }));
}

state.panels = defaultPanels(state.layout);

function render() {
  const ctx = canvas.getContext('2d');
  drawPoster(ctx, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function readFileAsImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result).then(resolve, reject);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function refreshPanelControls() {
  const layout = LAYOUTS[state.layout];
  const spec = state.panels[state.selected];
  selectedLabel.textContent = `Panel ${state.selected + 1} of ${layout.panels.length} (${layout.name})`;
  panelPhoto.value = String(spec.slot);
  zoomInput.value = spec.zoom;
  offsetXInput.value = spec.ox;
  offsetYInput.value = spec.oy;
}

/** Applies a full editor state (used by the screenshot scenes too). */
export async function applyState(next) {
  if (next.layout && LAYOUTS[next.layout]) {
    state.layout = next.layout;
    state.panels = defaultPanels(next.layout);
    state.selected = 0;
  }
  if (next.grade && GRADES[next.grade]) state.grade = next.grade;
  if (typeof next.caption === 'string') {
    state.caption = next.caption;
    captionInput.value = next.caption;
  }
  if (typeof next.subtitle === 'string') {
    state.subtitle = next.subtitle;
    subtitleInput.value = next.subtitle;
  }
  if (next.size) state.size = next.size;
  if (next.photos) {
    for (let i = 0; i < next.photos.length; i += 1) {
      if (next.photos[i]) state.photos[i] = await loadImage(next.photos[i]);
    }
  }
  if (next.panels) {
    next.panels.forEach((spec, i) => {
      if (state.panels[i]) state.panels[i] = { ...state.panels[i], ...spec };
    });
  }
  canvas.width = state.size.w;
  canvas.height = state.size.h;
  refreshPanelControls();
  render();
}

// Layout radios.
document.querySelectorAll('input[name="layout"]').forEach((radio) => {
  radio.addEventListener('change', () => {
    state.layout = radio.value;
    state.panels = defaultPanels(state.layout);
    state.selected = 0;
    refreshPanelControls();
    render();
  });
});

// Grade buttons.
document.querySelectorAll('[data-grade]').forEach((button) => {
  button.addEventListener('click', () => {
    state.grade = button.dataset.grade;
    document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === button));
    render();
  });
});

// Photo slots: upload from the machine, load a free sample, or clear.
document.querySelectorAll('[data-slot]').forEach((block) => {
  const slot = Number(block.dataset.slot);
  const fileInput = block.querySelector('input[type="file"]');
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    try {
      state.photos[slot] = await readFileAsImage(file);
      status.textContent = `Photo ${'ABC'[slot]} loaded: ${file.name}`;
      render();
    } catch {
      status.textContent = `Could not read ${file.name}. Try another image.`;
    }
  });
  block.querySelector('[data-sample]').addEventListener('click', async (e) => {
    try {
      state.photos[slot] = await loadImage(e.target.dataset.sample);
      status.textContent = `Photo ${'ABC'[slot]} loaded from the sample set.`;
      render();
    } catch {
      status.textContent = 'The sample photo could not be loaded.';
    }
  });
  block.querySelector('[data-clear]').addEventListener('click', () => {
    state.photos[slot] = null;
    fileInput.value = '';
    status.textContent = `Photo ${'ABC'[slot]} cleared.`;
    render();
  });
});

// Caption and subtitle.
captionInput.addEventListener('input', () => {
  state.caption = captionInput.value;
  render();
});
subtitleInput.addEventListener('input', () => {
  state.subtitle = subtitleInput.value;
  render();
});

// Selected-panel controls: which photo fills it, zoom and pan.
panelPhoto.addEventListener('change', () => {
  state.panels[state.selected].slot = Number(panelPhoto.value);
  render();
});
zoomInput.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomInput.value);
  render();
});
offsetXInput.addEventListener('input', () => {
  state.panels[state.selected].ox = Number(offsetXInput.value);
  render();
});
offsetYInput.addEventListener('input', () => {
  state.panels[state.selected].oy = Number(offsetYInput.value);
  render();
});

// Click a panel to select it; drag to pan its photo.
function posterPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}
function panelAt(x, y) {
  const layout = LAYOUTS[state.layout];
  return layout.panels.findIndex((p) => x >= p.x * canvas.width && x < (p.x + p.w) * canvas.width
    && y >= p.y * canvas.height && y < (p.y + p.h) * canvas.height);
}
let drag = null;
canvas.addEventListener('pointerdown', (event) => {
  const point = posterPoint(event);
  const index = panelAt(point.x, point.y);
  if (index === -1) return;
  state.selected = index;
  refreshPanelControls();
  const spec = state.panels[index];
  const panel = LAYOUTS[state.layout].panels[index];
  drag = { x: point.x, y: point.y, ox: spec.ox, oy: spec.oy, pw: panel.w * canvas.width, ph: panel.h * canvas.height, moved: false };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointermove', (event) => {
  if (!drag) return;
  const point = posterPoint(event);
  const dx = point.x - drag.x;
  const dy = point.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  const spec = state.panels[state.selected];
  spec.ox = Math.max(-0.4, Math.min(0.4, drag.ox + dx / drag.pw));
  spec.oy = Math.max(-0.4, Math.min(0.4, drag.oy + dy / drag.ph));
  offsetXInput.value = spec.ox;
  offsetYInput.value = spec.oy;
  render();
});
canvas.addEventListener('pointerup', () => {
  drag = null;
  render();
});

/** Renders the poster at w x h and resolves with the PNG blob the app wrote. */
export function exportCover(w, h) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawPoster(off.getContext('2d'), state);
  return new Promise((resolve) => off.toBlob(resolve, 'image/png'));
}

async function exportSize(size) {
  const blob = await exportCover(size.w, size.h);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vice-nights-${size.w}x${size.h}.png`;
  a.click();
  exportPreview.src = url;
  lastExport.hidden = false;
  status.textContent = `Saved vice-nights-${size.w}x${size.h}.png (${blob.size.toLocaleString('en-US')} bytes).`;
  return blob;
}

document.querySelectorAll('[data-size]').forEach((button) => {
  button.addEventListener('click', async () => {
    const [w, h] = button.dataset.size.split('x').map(Number);
    await exportSize({ label: button.dataset.size, w, h });
  });
});
document.getElementById('exportAll').addEventListener('click', async () => {
  for (const size of SIZES) await exportSize(size);
  status.textContent = 'Saved all three sizes: 1080 x 1080, 1080 x 1350 and 1920 x 1080.';
});

// Screenshot scenes: ?shot=editor shows the editor with photos; ?shot=cover shows the
// cover alone; ?shot=exported shows the PNG the app wrote, as an image. window.__shotReady
// is set once the scene has painted.
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, applyState, exportCover);
} else {
  document.fonts.load('100px Anton').then(render);
  document.fonts.ready.then(render);
  refreshPanelControls();
  render();
}
