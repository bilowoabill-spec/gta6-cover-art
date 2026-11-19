// cover.js — Vice Sunset poster renderer.
//
// Draws a GTA-style multi-panel poster onto any canvas: photo panels with a
// sunset / neon colour grade, dark gutters, a caption band with big display
// lettering, and original vector sunset art (sun disc, skyline, palm trees).
// No network, no Rockstar assets: every pixel is drawn from the user's own
// photos plus shapes and text drawn here.

export const SIZES = {
  square: { width: 1080, height: 1080, label: '1080 × 1080 · Square' },
  portrait: { width: 1080, height: 1350, label: '1080 × 1350 · Portrait' },
  wide: { width: 1920, height: 1080, label: '1920 × 1080 · Wide' },
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.45) contrast(1.1) brightness(1.03)',
    wash: ['rgba(255, 122, 24, 0.20)', 'rgba(255, 45, 120, 0.22)', 'rgba(90, 20, 160, 0.18)'],
    captionFrom: '#ffd23f',
    captionTo: '#ff2d78',
    bandFrom: '#160a24',
    bandTo: '#2b0f3d',
    accent: '#ffd23f',
  },
  neon: {
    label: 'Neon Nights',
    filter: 'saturate(1.6) contrast(1.14) brightness(0.98) hue-rotate(-12deg)',
    wash: ['rgba(0, 229, 255, 0.16)', 'rgba(255, 0, 229, 0.20)', 'rgba(20, 0, 80, 0.22)'],
    captionFrom: '#7df9ff',
    captionTo: '#ff00e5',
    bandFrom: '#05021a',
    bandTo: '#1c0540',
    accent: '#00e5ff',
  },
  gold: {
    label: 'Golden Hour',
    filter: 'saturate(1.3) contrast(1.06) brightness(1.06) sepia(0.22)',
    wash: ['rgba(255, 190, 60, 0.22)', 'rgba(255, 110, 30, 0.18)', 'rgba(120, 40, 0, 0.10)'],
    captionFrom: '#fff3b0',
    captionTo: '#ff7a18',
    bandFrom: '#1d0f02',
    bandTo: '#3d1e05',
    accent: '#ffb03a',
  },
};

// Layouts are panel rectangles in fractions of the canvas. The caption band
// sits below (or over) the panels; every layout works at all three sizes.
export const LAYOUTS = {
  quad: {
    label: 'Quad Grid',
    panels: [
      { x: 0.0, y: 0.0, w: 0.5, h: 0.39 },
      { x: 0.5, y: 0.0, w: 0.5, h: 0.39 },
      { x: 0.0, y: 0.39, w: 0.5, h: 0.39 },
      { x: 0.5, y: 0.39, w: 0.5, h: 0.39 },
    ],
    band: { x: 0, y: 0.78, w: 1, h: 0.22 },
    bandOverlay: false,
  },
  hero: {
    label: 'Hero Split',
    panels: [
      { x: 0.0, y: 0.0, w: 0.62, h: 1.0 },
      { x: 0.62, y: 0.0, w: 0.38, h: 0.5 },
      { x: 0.62, y: 0.5, w: 0.38, h: 0.5 },
    ],
    band: { x: 0, y: 0.74, w: 1, h: 0.26 },
    bandOverlay: true,
  },
  strip: {
    label: 'Sunset Strip',
    panels: [
      { x: 0.0, y: 0.0, w: 1.0, h: 0.52 },
      { x: 0.0, y: 0.52, w: 0.5, h: 0.26 },
      { x: 0.5, y: 0.52, w: 0.5, h: 0.26 },
    ],
    band: { x: 0, y: 0.78, w: 1, h: 0.22 },
    bandOverlay: false,
  },
};

export function defaultState() {
  return {
    size: 'wide',
    layout: 'quad',
    grade: 'sunset',
    caption: 'VICE SUNSET',
    subcaption: 'ONE LAST RIDE · SUMMER 2026',
    photos: [], // { img: HTMLImageElement, name: string }
    // One slot per panel: which photo fills it, plus its crop (zoom, offset).
    slots: [
      { photo: 0, zoom: 1.0, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.0, ox: 0, oy: 0 },
      { photo: 0, zoom: 1.0, ox: 0, oy: 0 },
      { photo: 1, zoom: 1.0, ox: 0, oy: 0 },
    ],
    selected: 0,
  };
}

// Draw one photo into a rectangle with cover-fit, zoom and pan offsets.
// ox / oy are fractions of the panel (-0.5 .. 0.5); zoom >= 1 magnifies.
export function drawPhotoInto(ctx, img, rect, slot, filter) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(rect.w / iw, rect.h / ih) * (slot.zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (slot.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (slot.oy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.filter = filter || 'none';
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Original vector art: a setting sun with rays over a skyline, drawn small
// inside the caption band. No borrowed artwork — plain canvas shapes.
export function drawSunsetMark(ctx, cx, cy, r, grade) {
  ctx.save();
  ctx.translate(cx, cy);
  const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.1);
  glow.addColorStop(0, 'rgba(255, 150, 60, 0.55)');
  glow.addColorStop(1, 'rgba(255, 45, 120, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
  ctx.fill();
  const sun = ctx.createLinearGradient(0, -r, 0, r);
  sun.addColorStop(0, '#ffe259');
  sun.addColorStop(0.55, '#ff7a18');
  sun.addColorStop(1, '#ff2d78');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  // Horizon slats cut across the lower half of the sun.
  ctx.fillStyle = grade.bandFrom;
  for (let i = 0; i < 3; i++) {
    const y = r * (0.15 + i * 0.28);
    const half = Math.sqrt(Math.max(0, r * r - y * y));
    ctx.fillRect(-half, y, half * 2, r * 0.07);
  }
  ctx.restore();
}

function drawPalm(ctx, x, baseY, h, lean, color) {
  ctx.save();
  ctx.translate(x, baseY);
  ctx.rotate(lean);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, h * 0.045);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(h * 0.06, -h * 0.55, 0, -h);
  ctx.stroke();
  ctx.fillStyle = color;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.08 + i * 0.16);
    const len = h * (0.42 - Math.abs(i - 2.5) * 0.05);
    ctx.beginPath();
    ctx.moveTo(0, -h);
    ctx.quadraticCurveTo(Math.cos(a) * len * 0.6, -h + Math.sin(a) * len * 0.6 - h * 0.1, Math.cos(a) * len, -h + Math.sin(a) * len);
    ctx.quadraticCurveTo(Math.cos(a) * len * 0.6, -h + Math.sin(a) * len * 0.6 + h * 0.08, 0, -h);
    ctx.fill();
  }
  ctx.restore();
}

function drawSkyline(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  const buildings = [0.5, 0.85, 0.62, 1.0, 0.72, 0.9, 0.55, 0.78];
  const bw = w / buildings.length;
  for (let i = 0; i < buildings.length; i++) {
    const bh = h * buildings[i];
    ctx.fillRect(x + i * bw, y + h - bh, bw * 0.82, bh);
    if (i % 2 === 0) ctx.fillRect(x + i * bw + bw * 0.25, y + h - bh - h * 0.16, bw * 0.3, h * 0.16);
  }
}

function fitCaptionFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = `${px}px ${family}`;
  }
  return px;
}

// The main render: state -> canvas at the chosen export size.
export function drawCover(canvas, state) {
  const size = SIZES[state.size] || SIZES.wide;
  const layout = LAYOUTS[state.layout] || LAYOUTS.quad;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const W = size.width;
  const H = size.height;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const u = W / 1080; // scale unit: 1 at 1080 wide
  const gutter = Math.max(4, Math.round(8 * u));

  // Backdrop: deep dusk gradient behind everything.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, grade.bandFrom);
  bg.addColorStop(1, grade.bandTo);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Photo panels with gutters.
  layout.panels.forEach((p, i) => {
    const rect = {
      x: p.x * W + (p.x > 0 ? gutter / 2 : 0),
      y: p.y * H + (p.y > 0 ? gutter / 2 : 0),
      w: p.w * W - (p.x > 0 ? gutter / 2 : 0) - (p.x + p.w < 1 ? gutter / 2 : 0),
      h: p.h * H - (p.y > 0 ? gutter / 2 : 0) - (p.y + p.h < 1 ? gutter / 2 : 0),
    };
    const slot = state.slots[i] || { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos[slot.photo];
    if (photo && photo.img) {
      drawPhotoInto(ctx, photo.img, rect, slot, grade.filter);
    } else {
      // Empty panel: a painted sunset placeholder so the poster never looks blank.
      const ph = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      ph.addColorStop(0, '#ff9a3d');
      ph.addColorStop(0.55, '#ff2d78');
      ph.addColorStop(1, '#3b0f5e');
      ctx.fillStyle = ph;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      drawSunsetMark(ctx, rect.x + rect.w / 2, rect.y + rect.h * 0.42, Math.min(rect.w, rect.h) * 0.16, grade);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `600 ${Math.round(22 * u)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD YOUR PHOTO', rect.x + rect.w / 2, rect.y + rect.h * 0.72);
      ctx.textAlign = 'left';
    }
    // Sunset wash over the photo, then a thin neon edge.
    const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    grade.wash.forEach((c, j) => wash.addColorStop(j / (grade.wash.length - 1), c));
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = Math.max(1, 2 * u);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Caption band.
  const band = {
    x: layout.band.x * W,
    y: layout.band.y * H,
    w: layout.band.w * W,
    h: layout.band.h * H,
  };
  if (layout.bandOverlay) {
    const fade = ctx.createLinearGradient(0, band.y - H * 0.12, 0, band.y + band.h);
    fade.addColorStop(0, 'rgba(10, 4, 24, 0)');
    fade.addColorStop(0.45, 'rgba(10, 4, 24, 0.82)');
    fade.addColorStop(1, grade.bandTo);
    ctx.fillStyle = fade;
    ctx.fillRect(band.x, band.y - H * 0.12, band.w, band.h + H * 0.12);
  } else {
    const bf = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
    bf.addColorStop(0, grade.bandFrom);
    bf.addColorStop(1, grade.bandTo);
    ctx.fillStyle = bf;
    ctx.fillRect(band.x, band.y, band.w, band.h);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(band.x, band.y, band.w, Math.max(2, 4 * u));
  }

  // Skyline + palms along the band, sun mark at the right.
  const bandPad = 34 * u;
  drawSkyline(ctx, band.x + bandPad, band.y + band.h - 46 * u, band.w * 0.5, 40 * u, 'rgba(0,0,0,0.35)');
  drawPalm(ctx, band.x + band.w - 150 * u, band.y + band.h - 8 * u, 120 * u, -0.08, 'rgba(0,0,0,0.55)');
  drawPalm(ctx, band.x + band.w - 96 * u, band.y + band.h - 8 * u, 92 * u, 0.12, 'rgba(0,0,0,0.55)');
  drawSunsetMark(ctx, band.x + band.w - 52 * u, band.y + band.h * 0.34, 30 * u, grade);

  // Caption: bold display type, sunset gradient fill, dark outline, hard shadow.
  const caption = (state.caption || 'VICE SUNSET').toUpperCase();
  const sub = (state.subcaption || '').toUpperCase();
  const textX = band.x + bandPad;
  const textW = band.w - bandPad * 2 - 190 * u;
  const family = '"Anton", "Arial Black", sans-serif';
  const capPx = fitCaptionFont(ctx, caption, textW, Math.round(band.h * 0.52), family);
  const grad = ctx.createLinearGradient(textX, band.y, textX, band.y + capPx);
  grad.addColorStop(0, grade.captionFrom);
  grad.addColorStop(1, grade.captionTo);
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${capPx}px ${family}`;
  const capY = band.y + band.h * 0.44 + capPx * 0.32;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20, 4, 32, 0.9)';
  ctx.lineWidth = Math.max(2, capPx * 0.09);
  ctx.strokeText(caption, textX, capY);
  ctx.shadowColor = 'rgba(255, 45, 120, 0.55)';
  ctx.shadowBlur = Math.round(18 * u);
  ctx.shadowOffsetY = Math.round(4 * u);
  ctx.fillStyle = grad;
  ctx.fillText(caption, textX, capY);
  ctx.restore();

  if (sub) {
    ctx.save();
    ctx.font = `600 ${Math.round(Math.max(15, band.h * 0.115))}px system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    const subY = band.y + band.h * 0.82;
    // Letter-spaced subcaption, drawn letter by letter.
    let sx = textX;
    const tracking = Math.round(3 * u);
    for (const ch of sub) {
      ctx.fillText(ch, sx, subY);
      sx += ctx.measureText(ch).width + tracking;
      if (sx > textX + textW) break;
    }
    ctx.restore();
  }

  // Vignette to pull the eye to the middle.
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,0,25,0.34)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Thin outer frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(2, 3 * u);
  ctx.strokeRect(2 * u, 2 * u, W - 4 * u, H - 4 * u);
  return canvas;
}

// Panel hit-test in preview-canvas pixel coordinates (already scaled to the
// export size): returns the panel index or -1.
export function panelAt(state, px, py) {
  const size = SIZES[state.size] || SIZES.wide;
  const layout = LAYOUTS[state.layout] || LAYOUTS.quad;
  const fx = px / size.width;
  const fy = py / size.height;
  for (let i = 0; i < layout.panels.length; i++) {
    const p = layout.panels[i];
    if (fx >= p.x && fx < p.x + p.w && fy >= p.y && fy < p.y + p.h) return i;
  }
  return -1;
}
