// Vice Sunset cover renderer: draws the multi-panel GTA-style poster onto any
// 2D canvas context. Pure drawing code — no network, no DOM, no game assets.
// Every shape (sun, palms, gradients, lettering) is drawn here from scratch.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: '1080 x 1080' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 x 1350' },
  '1920x1080': { w: 1920, h: 1080, label: '1920 x 1080' },
};

// Panel rectangles as fractions of the cover, per layout. The caption band
// overlays the bottom of the panels, poster style.
export const LAYOUTS = {
  hero: (w, h, g) => [
    { x: g, y: g, w: w * 0.60 - g * 1.5, h: h - g * 2 },
    { x: w * 0.60 + g * 0.5, y: g, w: w * 0.40 - g * 1.5, h: h * 0.495 - g * 1.5 },
    { x: w * 0.60 + g * 0.5, y: h * 0.505 + g * 0.5, w: w * 0.40 - g * 1.5, h: h * 0.495 - g * 1.5 },
  ],
  triptych: (w, h, g) => [0, 1, 2].map((i) => ({
    x: g + i * (w / 3),
    y: g,
    w: w / 3 - g * (i === 2 ? 2 : 1),
    h: h - g * 2,
  })),
  quad: (w, h, g) => [
    { x: g, y: g, w: w / 2 - g * 1.5, h: h / 2 - g * 1.5 },
    { x: w / 2 + g * 0.5, y: g, w: w / 2 - g * 1.5, h: h / 2 - g * 1.5 },
    { x: g, y: h / 2 + g * 0.5, w: w / 2 - g * 1.5, h: h / 2 - g * 1.5 },
    { x: w / 2 + g * 0.5, y: h / 2 + g * 0.5, w: w / 2 - g * 1.5, h: h / 2 - g * 1.5 },
  ],
  strip: (w, h, g) => [
    { x: g, y: g, w: w - g * 2, h: h * 0.58 - g * 1.5 },
    ...[0, 1, 2].map((i) => ({
      x: g + i * (w / 3),
      y: h * 0.58 + g * 0.5,
      w: w / 3 - g * (i === 2 ? 2 : 1),
      h: h * 0.42 - g * 1.5,
    })),
  ],
};

export const GRADES = {
  sunset: {
    stops: ['rgba(255,154,60,0.20)', 'rgba(255,46,136,0.28)'],
    tint: 'rgba(255,122,24,0.10)',
  },
  neon: {
    stops: ['rgba(0,229,255,0.22)', 'rgba(255,0,170,0.30)'],
    tint: 'rgba(168,85,247,0.10)',
  },
  noir: {
    stops: ['rgba(10,20,40,0.30)', 'rgba(0,0,0,0.38)'],
    tint: 'rgba(120,180,255,0.06)',
  },
};

export function panelCount(layout) {
  return LAYOUTS[layout] ? LAYOUTS[layout](100, 100, 0).length : 3;
}

export function defaultState() {
  return {
    size: '1080x1080',
    layout: 'hero',
    grade: 'sunset',
    title: 'SUNSET HEIST',
    subtitle: 'VICE CITY · SUMMER 2026',
    titleScale: 1,
    photos: [], // { img: HTMLImageElement, name: string }
    panels: [], // { photo: number, zoom: number, ox: number, oy: number }
    selected: 0,
  };
}

// Draw one photo into a panel rect, cover-fit, with zoom and pan offsets
// (ox, oy in fractions of the panel size, -0.5..0.5).
export function drawPanelPhoto(ctx, img, rect, zoom, ox, oy) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + oy * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// A synthwave sun: a striped disc, drawn from scratch on its own offscreen
// canvas so the slats cut out of the disc alone, never of the poster behind it.
export function drawSun(ctx, cx, cy, r, top, bottom) {
  const off = document.createElement('canvas');
  const pad = 2;
  off.width = Math.ceil(r * 2) + pad * 2;
  off.height = Math.ceil(r * 2) + pad * 2;
  const octx = off.getContext('2d');
  octx.translate(pad + r, pad + r);
  const grad = octx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  octx.fillStyle = grad;
  octx.beginPath();
  octx.arc(0, 0, r, 0, Math.PI * 2);
  octx.fill();
  // Cut horizontal slats out of the lower half of the disc.
  octx.globalCompositeOperation = 'destination-out';
  let y = r * 0.05;
  let thick = r * 0.05;
  while (y < r) {
    octx.fillRect(-r, y, r * 2, thick);
    y += thick * 2.6;
    thick *= 1.35;
  }
  ctx.drawImage(off, cx - r - pad, cy - r - pad);
}

// A palm silhouette: curved trunk + seven fronds, all vector paths.
export function drawPalm(ctx, x, y, s, lean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * lean, s);
  ctx.fillStyle = '#160a2e';
  ctx.beginPath(); // trunk, leaning slightly
  ctx.moveTo(-0.06, 0);
  ctx.quadraticCurveTo(0.02, -0.5, 0.16, -0.95);
  ctx.quadraticCurveTo(0.2, -1.0, 0.24, -0.95);
  ctx.quadraticCurveTo(0.14, -0.5, 0.06, 0);
  ctx.closePath();
  ctx.fill();
  const fronds = [-2.4, -1.8, -1.2, -0.6, 0, 0.6, 1.2];
  for (const a of fronds) {
    ctx.beginPath();
    ctx.moveTo(0.2, -0.96);
    ctx.quadraticCurveTo(0.2 + Math.sin(a) * 0.55, -0.96 - Math.cos(a) * 0.42, 0.2 + Math.sin(a) * 0.95, -0.96 - Math.cos(a) * 0.55 + 0.28);
    ctx.quadraticCurveTo(0.2 + Math.sin(a) * 0.5, -0.96 - Math.cos(a) * 0.28, 0.2, -0.96);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawGrade(ctx, rect, grade) {
  const g = GRADES[grade] || GRADES.sunset;
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, g.stops[0]);
  grad.addColorStop(1, g.stops[1]);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = g.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawCaptionBand(ctx, state, W, H) {
  const bandH = H * 0.30;
  const bandY = H - bandH;
  const sky = ctx.createLinearGradient(0, bandY, 0, H);
  sky.addColorStop(0, 'rgba(30,8,54,0)');
  sky.addColorStop(0.35, 'rgba(46,10,74,0.82)');
  sky.addColorStop(1, 'rgba(16,4,32,0.96)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, bandY, W, H - bandY);

  // Sun peeking from behind the title, palms at the edges.
  const sunR = Math.min(W, H) * 0.085;
  const sunY = bandY + bandH * 0.42;
  drawSun(ctx, W * 0.5, sunY, sunR, '#ffd319', '#ff2e88');
  drawPalm(ctx, W * 0.055, H * 0.985, H * 0.16, 1);
  drawPalm(ctx, W * 0.945, H * 0.985, H * 0.15, -1);

  // Title: bold Anton, gradient fill, dark outline, slight upward slant feel
  // from tight letter spacing.
  const title = (state.title || 'VICE SUNSET').toUpperCase();
  const subtitle = (state.subtitle || '').toUpperCase();
  let titleSize = Math.min(W * 0.115, H * 0.115) * (state.titleScale || 1);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${titleSize}px Anton, 'Arial Black', sans-serif`;
  // Shrink long titles until they fit the cover with a margin.
  const maxTitleWidth = W * 0.92;
  while (ctx.measureText(title).width > maxTitleWidth && titleSize > 10) {
    titleSize *= 0.92;
    ctx.font = `${titleSize}px Anton, 'Arial Black', sans-serif`;
  }
  try { ctx.letterSpacing = `${titleSize * 0.02}px`; } catch { /* older canvas */ }
  const ty = bandY + bandH * 0.52;
  const fill = ctx.createLinearGradient(0, ty - titleSize * 0.6, 0, ty + titleSize * 0.6);
  fill.addColorStop(0, '#ffffff');
  fill.addColorStop(0.55, '#ffe9a8');
  fill.addColorStop(1, '#ff7a18');
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(20,4,40,0.9)';
  ctx.lineWidth = titleSize * 0.09;
  ctx.strokeText(title, W / 2, ty);
  ctx.fillStyle = fill;
  ctx.fillText(title, W / 2, ty);
  ctx.restore();

  if (subtitle) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const subSize0 = Math.max(14, titleSize * 0.22);
    let subSize = subSize0;
    ctx.font = `${subSize}px Anton, 'Arial Black', sans-serif`;
    while (ctx.measureText(subtitle).width > W * 0.9 && subSize > 8) {
      subSize *= 0.92;
      ctx.font = `${subSize}px Anton, 'Arial Black', sans-serif`;
    }
    try { ctx.letterSpacing = `${subSize * 0.42}px`; } catch { /* older canvas */ }
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = 'rgba(34,211,238,0.8)';
    ctx.shadowBlur = subSize * 0.6;
    ctx.fillText(subtitle, W / 2, bandY + bandH * 0.86);
    ctx.restore();
  }
}

// The whole poster. state.photos holds loaded images; a panel with no photo
// gets a painted sunset placeholder so the cover never looks empty.
export function drawCover(ctx, state, W, H) {
  const scale = W / 1080;
  const g = Math.max(4, 8 * scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const rects = LAYOUTS[state.layout](W, H, g);
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || { photo: -1, zoom: 1, ox: 0, oy: 0 };
    const photo = state.photos[panel.photo];
    if (photo && photo.img) {
      drawPanelPhoto(ctx, photo.img, rect, panel.zoom || 1, panel.ox || 0, panel.oy || 0);
    } else {
      // Painted placeholder: dusk gradient + sun + sea band.
      const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      grad.addColorStop(0, '#2b0f54');
      grad.addColorStop(0.5, '#ff7a18');
      grad.addColorStop(1, '#ff2e88');
      ctx.fillStyle = grad;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      drawSun(ctx, rect.x + rect.w / 2, rect.y + rect.h * 0.38, Math.min(rect.w, rect.h) * 0.16, '#ffd319', '#ff5e62');
      ctx.fillStyle = 'rgba(16,4,32,0.55)';
      ctx.fillRect(rect.x, rect.y + rect.h * 0.72, rect.w, rect.h * 0.28);
    }
    drawGrade(ctx, rect, state.grade);
    // Thin inner frame line, comic-panel style.
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });
  drawCaptionBand(ctx, state, W, H);
}
