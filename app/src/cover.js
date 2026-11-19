// Draws the poster: a sunset sky, a sun, several photo panels with a warm
// colour grade, and a bold caption band along the foot. Everything here is
// original art drawn with canvas primitives; no game artwork is used.

export const SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  wide: [1920, 1080],
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    sky: ['#2b1055', '#b83280', '#ff7847', '#ffb35c'],
    tint: '255, 120, 80',
    sun: '#ffe08a',
    band: '#1c0b33',
    accent: '#ffd166',
  },
  neon: {
    label: 'Neon Night',
    sky: ['#0b1030', '#3b1a6e', '#c62b8a', '#ff5e7a'],
    tint: '90, 70, 255',
    sun: '#ff7ad9',
    band: '#12082e',
    accent: '#39e6ff',
  },
  palm: {
    label: 'Palm Dusk',
    sky: ['#0e2f26', '#1f6f4a', '#f2a541', '#ff7b54'],
    tint: '255, 170, 60',
    sun: '#fff3b0',
    band: '#0d241c',
    accent: '#7ef0c1',
  },
};

/** Panel rectangles for a layout, as fractions of the panel area. */
export function panelRects(layout, w, h) {
  const x0 = w * 0.03;
  const x1 = w * 0.97;
  const y0 = h * 0.03;
  const y1 = h * 0.72;
  const g = Math.max(6, w * 0.012);
  const midX = x0 + (x1 - x0) * 0.55;
  const midY = y0 + (y1 - y0) * 0.5;
  const heroY = y0 + (y1 - y0) * 0.6;
  if (layout === 'grid') {
    const cx = x0 + (x1 - x0) * 0.5;
    return [
      { x: x0, y: y0, w: cx - x0 - g / 2, h: midY - y0 - g / 2 },
      { x: cx + g / 2, y: y0, w: x1 - cx - g / 2, h: midY - y0 - g / 2 },
      { x: x0, y: midY + g / 2, w: cx - x0 - g / 2, h: y1 - midY - g / 2 },
      { x: cx + g / 2, y: midY + g / 2, w: x1 - cx - g / 2, h: y1 - midY - g / 2 },
    ];
  }
  if (layout === 'hero') {
    return [
      { x: x0, y: y0, w: x1 - x0, h: heroY - y0 - g / 2 },
      { x: x0, y: heroY + g / 2, w: midX - x0 - g / 2, h: y1 - heroY - g / 2 },
      { x: midX + g / 2, y: heroY + g / 2, w: x1 - midX - g / 2, h: y1 - heroY - g / 2 },
    ];
  }
  // triptych: one tall panel on the left, two stacked on the right.
  return [
    { x: x0, y: y0, w: midX - x0 - g / 2, h: y1 - y0 },
    { x: midX + g / 2, y: y0, w: x1 - midX - g / 2, h: midY - y0 - g / 2 },
    { x: midX + g / 2, y: midY + g / 2, w: x1 - midX - g / 2, h: y1 - midY - g / 2 },
  ];
}

function drawSky(ctx, w, h, grade) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  grade.sky.forEach((color, i) => sky.addColorStop(i / (grade.sky.length - 1), color));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
}

function drawSun(ctx, w, h, grade) {
  const cx = w * 0.93;
  const cy = h * 0.055;
  const r = Math.min(w, h) * 0.075;
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.6);
  glow.addColorStop(0, grade.sun);
  glow.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.6, cy - r * 2.6, r * 5.2, r * 5.2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = grade.sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.18, 0, Math.PI * 2);
  ctx.stroke();
}

function drawSkyline(ctx, w, h, grade) {
  // A small original skyline silhouette along the top of the caption band.
  const base = h * 0.755;
  const top = h * 0.72;
  ctx.fillStyle = grade.band;
  let x = w * 0.03;
  let i = 0;
  const widths = [0.05, 0.08, 0.04, 0.1, 0.06, 0.09, 0.05, 0.07, 0.11, 0.06, 0.08, 0.05];
  const heights = [0.5, 0.9, 0.65, 1, 0.75, 0.55, 0.95, 0.6, 0.85, 0.7, 1, 0.5];
  while (x < w * 0.97) {
    const bw = widths[i % widths.length] * w;
    const bh = heights[i % heights.length] * (base - top);
    ctx.fillRect(x, base - bh, bw, bh);
    x += bw + w * 0.004;
    i += 1;
  }
  ctx.fillRect(w * 0.03, base, w * 0.94, h * 0.004);
}

function drawPhotoPanel(ctx, rect, photo, panel, grade) {
  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 4);
  else ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (photo) {
    const iw = photo.naturalWidth || photo.width;
    const ih = photo.naturalHeight || photo.height;
    const base = Math.max(rect.w / iw, rect.h / ih) * panel.zoom;
    const dw = iw * base;
    const dh = ih * base;
    const slackX = Math.max(0, (dw - rect.w) / 2);
    const slackY = Math.max(0, (dh - rect.h) / 2);
    ctx.drawImage(
      photo,
      rect.x + (rect.w - dw) / 2 + panel.dx * slackX,
      rect.y + (rect.h - dh) / 2 + panel.dy * slackY,
      dw,
      dh,
    );
  } else {
    const fill = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    fill.addColorStop(0, 'rgba(43, 16, 85, 0.9)');
    fill.addColorStop(1, 'rgba(184, 50, 128, 0.9)');
    ctx.fillStyle = fill;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `700 ${Math.round(rect.h * 0.07)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  // Warm sunset grade over the photo, stronger toward the foot.
  const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  tint.addColorStop(0, `rgba(${grade.tint}, 0.05)`);
  tint.addColorStop(1, `rgba(${grade.tint}, 0.32)`);
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(3, rect.w * 0.006);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
}

function fitCaption(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  while (size > 20 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  }
  return size;
}

/**
 * Draws the whole cover onto `canvas` (any size) from `state`:
 * { photos, panels, layout, caption, tagline, grade }.
 * photos are HTMLImageElements (or null); panels are { photo, zoom, dx, dy }.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const rects = panelRects(state.layout, w, h);

  drawSky(ctx, w, h, grade);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? { photo: 0, zoom: 1, dx: 0, dy: 0 };
    drawPhotoPanel(ctx, rect, state.photos[panel.photo] ?? null, panel, grade);
  });
  drawSun(ctx, w, h, grade);

  // Caption band.
  const bandY = h * 0.755;
  const band = ctx.createLinearGradient(0, bandY, 0, h);
  band.addColorStop(0, grade.band);
  band.addColorStop(1, '#0d0618');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, h - bandY);
  drawSkyline(ctx, w, h, grade);

  const caption = (state.caption || 'SUNSET HEIST').trim().toUpperCase();
  const kicker = 'A SOLARA BAY STORY';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const kickerSize = Math.round(h * 0.021);
  try { ctx.letterSpacing = `${Math.round(kickerSize * 0.45)}px`; } catch { /* older canvas */ }
  ctx.font = `700 ${kickerSize}px system-ui, sans-serif`;
  ctx.fillStyle = grade.accent;
  ctx.fillText(kicker, w / 2, bandY + h * 0.045);
  try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }

  const size = fitCaption(ctx, caption, w * 0.92, Math.round(h * 0.088));
  const capY = bandY + h * 0.135;
  ctx.font = `${size}px Anton, "Arial Black", sans-serif`;
  // Retro offset shadow, then a dark outline, then white letters.
  ctx.fillStyle = '#ff4fa3';
  ctx.fillText(caption, w / 2 + size * 0.03, capY + size * 0.03);
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeStyle = '#1a0b2e';
  ctx.lineJoin = 'round';
  ctx.strokeText(caption, w / 2, capY);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(caption, w / 2, capY);

  const tagline = (state.tagline || '').trim();
  if (tagline) {
    const tagSize = Math.round(h * 0.02);
    ctx.font = `italic 600 ${tagSize}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(246, 239, 255, 0.9)';
    ctx.fillText(tagline, w / 2, bandY + h * 0.185);
  }

  // Thin white poster frame.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = Math.max(4, w * 0.005);
  ctx.strokeRect(w * 0.008, h * 0.008, w * 0.984, h * 0.984);
}
