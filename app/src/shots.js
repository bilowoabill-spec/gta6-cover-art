// Fixed scenes for screenshots, driven by the query string:
//   ?shot=editor — the editor with two sample photos loaded.
//   ?shot=cover&photo=pier&caption=...&size=1080x1350&layout=strip&grade=sunset
//     — the cover alone, drawn at its export size.
//   ?shot=exported&photo=...&caption=...&size=1920x1080 — the PNG the app wrote,
//     shown as an <img> so the screenshot shows the exported file itself.
// window.__shotReady is set once the scene has painted.
import { SIZES } from './main.js';

function sizeFrom(query) {
  const wanted = query.get('size') ?? '1080x1350';
  return SIZES.find((s) => `${s.w}x${s.h}` === wanted) ?? SIZES[1];
}

function readySoon() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

export async function runShot(shot, query, applyState, exportCover) {
  const caption = query.get('caption') ?? 'Sunset Heist';
  const subtitle = query.get('subtitle') ?? 'Vice Nights • Est. 2026';
  const layout = query.get('layout') ?? 'strip';
  const grade = query.get('grade') ?? 'sunset';
  const size = sizeFrom(query);
  const photo = query.get('photo') ?? 'pier';
  const photo2 = query.get('photo2') ?? 'boulevard';
  // Per-panel framing overrides from the query: oy=0.15,0.32,... pans each photo
  // with the app's own pan controls, so a wide panel can frame a face.
  const numList = (name) => (query.get(name) ?? '').split(',').map((s) => (s.trim() === '' ? NaN : Number(s)));
  const oxList = numList('ox');
  const oyList = numList('oy');
  const zoomList = numList('zoom');
  const panels = [
    { slot: 0, zoom: 1.05 },
    { slot: 1, zoom: 1.1, ox: -0.05 },
    { slot: 0, zoom: 1.2 },
  ].map((spec, i) => ({
    ...spec,
    ...(Number.isFinite(oxList[i]) ? { ox: oxList[i] } : {}),
    ...(Number.isFinite(oyList[i]) ? { oy: oyList[i] } : {}),
    ...(Number.isFinite(zoomList[i]) ? { zoom: zoomList[i] } : {}),
  }));

  await document.fonts.load('100px Anton');
  if (shot === 'editor') {
    await applyState({
      layout, grade, caption, subtitle, size,
      photos: [`samples/${photo}.jpg`, `samples/${photo2}.jpg`],
      panels,
    });
    readySoon();
    return;
  }
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    await applyState({
      layout, grade, caption, subtitle, size,
      photos: [`samples/${photo}.jpg`, `samples/${photo2}.jpg`],
      panels,
    });
    readySoon();
    return;
  }
  if (shot === 'exported') {
    document.body.classList.add('shot-exported');
    await applyState({
      layout, grade, caption, subtitle, size,
      photos: [`samples/${photo}.jpg`, `samples/${photo2}.jpg`],
      panels,
    });
    const blob = await exportCover(size.w, size.h);
    const img = document.getElementById('exportedImg');
    img.src = URL.createObjectURL(blob);
    img.alt = `Exported Vice Nights cover, ${size.w} by ${size.h} pixels`;
    await new Promise((resolve) => { img.onload = resolve; });
    readySoon();
  }
}
