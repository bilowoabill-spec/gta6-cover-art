// Draws the Vice Nights poster: a multi-panel GTA-style cover with a sunset or neon
// colour grade, bold Anton caption lettering, and the user's own photos. Pure drawing:
// no network, no library, every pixel comes from this file and the photos passed in.

/** The three panel layouts, as fractions of the poster's width and height. */
export const LAYOUTS = {
  strip: {
    name: 'Sunset Strip',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.6 },
      { x: 0, y: 0.6, w: 0.5, h: 0.4 },
      { x: 0.5, y: 0.6, w: 0.5, h: 0.4 },
    ],
  },
  grid: {
    name: 'Neon Grid',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  hero: {
    name: 'Hero Shot',
    panels: [{ x: 0, y: 0, w: 1, h: 1 }],
  },
};

/** The colour grades: sky gradient, photo tint, caption and accent colours. */
export const GRADES = {
  sunset: {
    name: 'Sunset',
    sky: ['#2b1055', '#ff7e2e', '#ff2e88'],
    tint: 'rgba(255, 90, 40, 0.16)',
    caption: '#fff7ea',
    stroke: '#1b0b2e',
    accent: '#ffd166',
  },
  neon: {
    name: 'Neon Nights',
    sky: ['#0b1035', '#7b2ff7', '#00e5ff'],
    tint: 'rgba(0, 229, 255, 0.14)',
    caption: '#eafcff',
    stroke: '#12082e',
    accent: '#00e5ff',
  },
  midnight: {
    name: 'Midnight',
    sky: ['#050914', '#16224d', '#3b2d6b'],
    tint: 'rgba(20, 30, 80, 0.32)',
    caption: '#fdfdfd',
    stroke: '#050914',
    accent: '#f5c542',
  },
  candy: {
    name: 'Candy',
    sky: ['#ff5e8a', '#ffb347', '#ffe259'],
    tint: 'rgba(255, 94, 138, 0.14)',
    caption: '#ffffff',
    stroke: '#3d0a24',
    accent: '#ffe259',
  },
};

/** A small deterministic pseudo-random stream, so skyline art is stable per panel. */
function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Draws a photo cover-fitting a rectangle, with zoom and pan offsets. */
function drawPhoto(ctx, photo, px, py, pw, ph, zoom, ox, oy) {
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const z = zoom > 0 ? zoom : 1;
  const scale = Math.max(pw / iw, ph / ih) * z;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = px + (pw - dw) / 2 + ox * pw;
  const dy = py + (ph - dh) / 2 + oy * ph;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

/** Draws an original sunset-skyline art panel: gradient sky, sun disc, buildings. */
function drawSkylinePanel(ctx, grade, px, py, pw, ph, seed) {
  const sky = ctx.createLinearGradient(0, py, 0, py + ph);
  sky.addColorStop(0, grade.sky[0]);
  sky.addColorStop(0.55, grade.sky[1]);
  sky.addColorStop(1, grade.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(px, py, pw, ph);
  const r = Math.min(pw, ph) * 0.2;
  const cx = px + pw * 0.68;
  const cy = py + ph * 0.34;
  const sun = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
  sun.addColorStop(0, '#fff3c4');
  sun.addColorStop(0.6, grade.accent);
  sun.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  const rand = seeded(seed);
  let bx = px;
  ctx.fillStyle = '#160a24';
  while (bx < px + pw) {
    const bw = pw * (0.08 + rand() * 0.14);
    const bh = ph * (0.18 + rand() * 0.3);
    ctx.fillRect(bx, py + ph - bh, bw, bh);
    if (rand() > 0.6) ctx.fillRect(bx + bw * 0.35, py + ph - bh - ph * 0.06, bw * 0.08, ph * 0.06);
    ctx.fillStyle = 'rgba(255, 209, 102, 0.85)';
    for (let k = 0; k < 4; k += 1) {
      if (rand() > 0.55) ctx.fillRect(bx + bw * (0.15 + rand() * 0.6), py + ph - bh + ph * (0.05 + rand() * 0.6), 2, 3);
    }
    ctx.fillStyle = '#160a24';
    bx += bw + 1;
  }
}

/** Fits the caption into lines no wider than maxWidth, shrinking the font as needed. */
function fitCaption(ctx, text, maxWidth, startSize) {
  let size = startSize;
  const words = text.split(/\s+/);
  for (;;) {
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    const lines = [];
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width <= maxWidth || !line) line = trial;
      else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    if (lines.length <= 2 || size <= 18) return { lines, size };
    size -= 4;
  }
}

/**
 * Draws the whole poster onto ctx at its own size.
 * state: { layout, grade, caption, subtitle, photos, panels }
 * photos: array of images (or null) per slot; panels: { slot, zoom, ox, oy } each.
 */
export function drawPoster(ctx, state) {
  const { width: W, height: H } = ctx.canvas;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.strip;
  const gap = Math.round(Math.min(W, H) * 0.012);
  ctx.fillStyle = '#12081f';
  ctx.fillRect(0, 0, W, H);

  layout.panels.forEach((panel, i) => {
    const px = Math.round(panel.x * W) + gap / 2;
    const py = Math.round(panel.y * H) + gap / 2;
    const pw = Math.round(panel.w * W) - gap;
    const ph = Math.round(panel.h * H) - gap;
    const spec = state.panels[i] ?? { slot: -1, zoom: 1, ox: 0, oy: 0 };
    const photo = spec.slot >= 0 ? state.photos[spec.slot] : null;
    if (photo) {
      drawPhoto(ctx, photo, px, py, pw, ph, spec.zoom, spec.ox, spec.oy);
      ctx.fillStyle = grade.tint;
      ctx.fillRect(px, py, pw, ph);
    } else {
      drawSkylinePanel(ctx, grade, px, py, pw, ph, 1000 + i * 77);
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = Math.max(1, Math.min(W, H) * 0.002);
    ctx.strokeRect(px, py, pw, ph);
  });

  // A scrim across the foot so the caption reads over any photo.
  const scrim = ctx.createLinearGradient(0, H * 0.62, 0, H);
  scrim.addColorStop(0, 'rgba(10, 4, 20, 0)');
  scrim.addColorStop(1, 'rgba(10, 4, 20, 0.82)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.62, W, H * 0.38);

  // The brand strip: our own wordmark, top left, with an accent rule.
  const brandSize = Math.round(H * 0.028);
  ctx.font = `${brandSize}px Anton, 'Arial Narrow', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = grade.accent;
  ctx.fillText('VICE NIGHTS', W * 0.045, H * 0.055);
  const brandWidth = ctx.measureText('VICE NIGHTS').width;
  ctx.fillRect(W * 0.045, H * 0.065, brandWidth, Math.max(2, H * 0.004));

  // The caption: bold Anton capitals, slightly tilted, outlined, with a shadow.
  const text = (state.caption || '').trim().toUpperCase();
  if (text) {
    const maxWidth = W * 0.9;
    const { lines, size } = fitCaption(ctx, text, maxWidth, H * 0.115);
    const lineHeight = size * 1.02;
    const blockHeight = lines.length * lineHeight;
    const baseY = H * 0.965 - blockHeight + lineHeight * 0.82;
    ctx.save();
    ctx.translate(W / 2, baseY);
    ctx.rotate(-0.035);
    ctx.translate(-W / 2, -baseY);
    ctx.font = `${size}px Anton, 'Arial Narrow', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, size * 0.09);
    ctx.strokeStyle = grade.stroke;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
    lines.forEach((line, k) => {
      const y = baseY + k * lineHeight;
      ctx.strokeText(line, W / 2, y);
      ctx.fillStyle = grade.caption;
      ctx.fillText(line, W / 2, y);
    });
    ctx.restore();
    // Accent underline beneath the caption block.
    const underlineY = H * 0.965 + H * 0.012;
    ctx.fillStyle = grade.accent;
    ctx.fillRect(W * 0.2, underlineY, W * 0.6, Math.max(3, H * 0.006));
  }

  // The subtitle: small, letter-spaced, on a dark pill above the caption.
  const sub = (state.subtitle || '').trim();
  if (sub) {
    const subSize = Math.round(H * 0.026);
    ctx.font = `bold ${subSize}px 'Arial Narrow', sans-serif`;
    const subWidth = ctx.measureText(sub.toUpperCase()).width + subSize * 1.6;
    const pillW = Math.min(subWidth, W * 0.86);
    const pillH = subSize * 2;
    const pillX = (W - pillW) / 2;
    const pillY = H * 0.965 - (text ? H * 0.115 * 1.1 + pillH + H * 0.02 : pillH + H * 0.02);
    ctx.fillStyle = 'rgba(10, 4, 20, 0.78)';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = grade.accent;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sub.toUpperCase(), W / 2, pillY + pillH / 2 + 1);
  }
}
