// Neon Coast Cover Studio: the cover rendering engine.
// Everything is drawn on a 2D canvas from the user's own photos: a multi-panel
// poster layout with thick white panel borders, a gradient-map colour grade in
// a Vice City sunset or neon palette, bold gradient title lettering, a script
// subtitle, a heat meter of stars, a tilted badge ribbon, film grain and a
// vignette. No image ever leaves the machine and nothing is fetched.

export const LAYOUTS = {
  classic: { label: 'Classic Grid (4 panels)', panels: classicGridPanels },
  hero: { label: 'Hero + Three', panels: heroAndThreePanels },
  fullbleed: { label: 'Full Bleed', panels: fullBleedPanels },
  nine: { label: 'Nine Panel Grid', panels: ninePanelGridPanels },
  filmstrip: { label: 'Film Strip', panels: filmStripPanels },
  tilted: { label: 'Tilted Snapshots', panels: tiltedSnapshotPanels },
};

export const GRADES = {
  vice: { label: 'Vice Sunset', shadow: [38, 10, 66], mid: [198, 44, 110], highlight: [255, 176, 92], sky: '#ff9a5c', glow: '#ff2e88' },
  neon: { label: 'Neon Night', shadow: [6, 8, 38], mid: [24, 92, 168], highlight: [120, 255, 230], sky: '#19d3ff', glow: '#ff3df0' },
  golden: { label: 'Golden Hour', shadow: [52, 22, 6], mid: [196, 106, 28], highlight: [255, 224, 138], sky: '#ffc44d', glow: '#ff7b2e' },
  teal: { label: 'Teal Heat', shadow: [4, 34, 40], mid: [10, 128, 128], highlight: [255, 128, 84], sky: '#ffb347', glow: '#00e0c6' },
  mono: { label: 'Mono Ink', shadow: [8, 8, 12], mid: [110, 110, 122], highlight: [245, 245, 240], sky: '#e8e8e8', glow: '#ffffff' },
  candy: { label: 'Candy Duotone', shadow: [44, 6, 84], mid: [236, 64, 168], highlight: [140, 240, 255], sky: '#8cf0ff', glow: '#ff5ce1' },
};

export const EXPORT_SIZES = [
  { id: 'square', label: '1080 x 1080 (post)', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 x 1350 (portrait post)', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 x 1080 (wide)', w: 1920, h: 1080 },
  { id: 'story', label: '1080 x 1920 (story)', w: 1080, h: 1920 },
];

function classicGridPanels(w, h) {
  const hw = w / 2, hh = h / 2;
  return [
    { x: 0, y: 0, w: hw, h: hh }, { x: hw, y: 0, w: hw, h: hh },
    { x: 0, y: hh, w: hw, h: hh }, { x: hw, y: hh, w: hw, h: hh },
  ];
}

function heroAndThreePanels(w, h) {
  const heroW = w * 0.56, sideW = w - heroW, third = h / 3;
  return [
    { x: 0, y: 0, w: heroW, h },
    { x: heroW, y: 0, w: sideW, h: third },
    { x: heroW, y: third, w: sideW, h: third },
    { x: heroW, y: third * 2, w: sideW, h: third },
  ];
}

function fullBleedPanels(w, h) {
  return [{ x: 0, y: 0, w, h }];
}

function ninePanelGridPanels(w, h) {
  const rects = [], cw = w / 3, ch = h / 3;
  for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) rects.push({ x: col * cw, y: row * ch, w: cw, h: ch });
  return rects;
}

function filmStripPanels(w, h) {
  const rects = [], sw = w / 4;
  for (let i = 0; i < 4; i++) rects.push({ x: i * sw, y: 0, w: sw, h });
  return rects;
}

function tiltedSnapshotPanels(w, h) {
  const pw = w * 0.58, ph = h * 0.62;
  return [
    { x: w * 0.04, y: h * 0.05, w: pw, h: ph, rot: -0.10 },
    { x: w * 0.40, y: h * 0.16, w: pw, h: ph, rot: 0.07 },
    { x: w * 0.20, y: h * 0.42, w: pw, h: ph, rot: -0.03 },
  ];
}

export function layoutPanels(layoutId, w, h) {
  return (LAYOUTS[layoutId] ?? LAYOUTS.classic).panels(w, h);
}

/** Remaps one pixel toward the grade's shadow-to-highlight ramp (duotone). */
function gradientMapChannel(value, shadow, mid, highlight) {
  const t = value / 255;
  const mix = (a, b, k) => Math.round(a + (b - a) * k);
  if (t < 0.5) { const k = t * 2; return [mix(shadow[0], mid[0], k), mix(shadow[1], mid[1], k), mix(shadow[2], mid[2], k)]; }
  const k = (t - 0.5) * 2; return [mix(mid[0], highlight[0], k), mix(mid[1], highlight[1], k), mix(mid[2], highlight[2], k)];
}

/** Applies the gradient-map grade to a canvas: colour follows brightness. */
export function applyGradientGrade(canvas, grade) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  if (!w || !h) return;
  const image = ctx.getImageData(0, 0, w, h), data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const [gr, gg, gb] = gradientMapChannel(lum, grade.shadow, grade.mid, grade.highlight);
    // Keep 45% of the photo's own colour so faces and clothes stay readable.
    data[i] = Math.round(data[i] * 0.45 + gr * 0.55);
    data[i + 1] = Math.round(data[i + 1] * 0.45 + gg * 0.55);
    data[i + 2] = Math.round(data[i + 2] * 0.45 + gb * 0.55);
  }
  ctx.putImageData(image, 0, 0);
}

function drawPhotoCoverFit(ctx, photo, rect, view) {
  const zoom = view?.zoom ?? 1, ox = view?.ox ?? 0, oy = view?.oy ?? 0;
  const scale = Math.max(rect.w / photo.naturalWidth, rect.h / photo.naturalHeight) * zoom;
  const pw = photo.naturalWidth * scale, ph = photo.naturalHeight * scale;
  const dx = rect.x + (rect.w - pw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - ph) / 2 + oy * rect.h;
  ctx.drawImage(photo, dx, dy, pw, ph);
}

function drawEmptyPanelScene(ctx, rect, grade, seed) {
  const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  sky.addColorStop(0, grade.sky); sky.addColorStop(1, grade.glow);
  ctx.fillStyle = sky; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const sunX = rect.x + rect.w * (0.3 + 0.18 * seed), sunY = rect.y + rect.h * 0.62;
  ctx.fillStyle = 'rgba(255, 240, 190, 0.9)';
  ctx.beginPath(); ctx.arc(sunX, sunY, rect.h * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(20, 6, 34, 0.85)';
  ctx.beginPath();
  ctx.moveTo(rect.x, rect.y + rect.h);
  for (let i = 0; i <= 6; i++) ctx.lineTo(rect.x + (rect.w / 6) * i, rect.y + rect.h * (0.86 - 0.05 * ((i + seed) % 3)));
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h); ctx.closePath(); ctx.fill();
}

/** Draws one panel: the assigned photo, graded, clipped to the panel rect. */
export function drawPanelCover(ctx, rect, photo, view, grade, seed) {
  ctx.save();
  ctx.beginPath();
  if (rect.rot) {
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
    ctx.translate(cx, cy); ctx.rotate(rect.rot); ctx.translate(-cx, -cy);
  }
  ctx.rect(rect.x, rect.y, rect.w, rect.h); ctx.clip();
  if (photo) {
    const off = document.createElement('canvas');
    off.width = Math.max(2, Math.round(rect.w)); off.height = Math.max(2, Math.round(rect.h));
    const offCtx = off.getContext('2d');
    drawPhotoCoverFit(offCtx, photo, { x: 0, y: 0, w: off.width, h: off.height }, view);
    applyGradientGrade(off, grade);
    ctx.drawImage(off, rect.x, rect.y);
    const sheen = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    sheen.addColorStop(0, 'rgba(255,255,255,0.10)'); sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
    sheen.addColorStop(1, 'rgba(10,0,24,0.22)');
    ctx.fillStyle = sheen; ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  } else {
    drawEmptyPanelScene(ctx, rect, grade, seed);
  }
  ctx.restore();
}

function strokePanelBorders(ctx, rects, w) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(6, w * 0.009);
  ctx.lineJoin = 'round';
  for (const rect of rects) {
    ctx.save();
    if (rect.rot) {
      const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
      ctx.translate(cx, cy); ctx.rotate(rect.rot); ctx.translate(-cx, -cy);
    }
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
  ctx.restore();
}

function drawHalftoneTitleBlock(ctx, w, h, grade, showDots) {
  const blockH = h * 0.30, dotGap = Math.max(10, w * 0.014);
  ctx.save();
  const band = ctx.createLinearGradient(0, h - blockH, 0, h);
  band.addColorStop(0, 'rgba(12,2,26,0)'); band.addColorStop(0.35, 'rgba(12,2,26,0.72)'); band.addColorStop(1, 'rgba(12,2,26,0.94)');
  ctx.fillStyle = band; ctx.fillRect(0, h - blockH, w, blockH);
  if (!showDots) { ctx.restore(); return; }
  ctx.fillStyle = grade.glow;
  for (let y = h - blockH * 0.82; y < h - blockH * 0.30; y += dotGap) {
    for (let x = dotGap * 0.6; x < w; x += dotGap) {
      const r = dotGap * 0.16 * (1 - (y - (h - blockH * 0.82)) / (blockH * 0.6));
      if (r <= 0.4) continue;
      ctx.globalAlpha = 0.30; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

/** Bold gradient title lettering with a dark stroke, plus a neon script sub. */
export function drawTitleLettering(ctx, w, h, caption, sub, grade) {
  const title = (caption || '').trim().toUpperCase();
  ctx.save();
  ctx.textAlign = 'center';
  if (sub && sub.trim()) {
    ctx.font = `italic 700 ${Math.round(h * 0.045)}px Georgia, 'Times New Roman', serif`;
    ctx.shadowColor = grade.glow; ctx.shadowBlur = h * 0.02;
    ctx.fillStyle = grade.sky;
    ctx.fillText(sub.trim(), w / 2, h - h * 0.155);
    ctx.shadowBlur = 0;
  }
  if (!title) { ctx.restore(); return; }
  let size = h * 0.115;
  const setFont = () => { ctx.font = `900 ${size}px 'Arial Black', 'Segoe UI', Arial, sans-serif`; };
  setFont();
  while (ctx.measureText(title).width > w * 0.92 && size > 14) { size -= 3; setFont(); }
  const fill = ctx.createLinearGradient(0, h - h * 0.16, 0, h - h * 0.03);
  fill.addColorStop(0, '#ffe259'); fill.addColorStop(0.55, '#ffa751'); fill.addColorStop(1, '#ff2e88');
  ctx.lineWidth = size * 0.16; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#16041f';
  ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = size * 0.18; ctx.shadowOffsetY = size * 0.06;
  ctx.strokeText(title, w / 2, h - h * 0.045);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = fill;
  ctx.fillText(title, w / 2, h - h * 0.045);
  ctx.restore();
}

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.46;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** The heat meter: five stars along the top edge, filled up to the rating. */
export function drawHeatStars(ctx, w, h, stars) {
  const r = Math.min(w, h) * 0.028, gap = r * 2.5;
  const totalW = gap * 4, startX = w - totalW - r - w * 0.035, cy = r + h * 0.028;
  ctx.save();
  for (let i = 0; i < 5; i++) {
    starPath(ctx, startX + i * gap, cy, r);
    ctx.fillStyle = i < stars ? '#ffd23e' : 'rgba(16,4,28,0.55)';
    ctx.strokeStyle = '#16041f'; ctx.lineWidth = r * 0.16;
    ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

/** A tilted ribbon badge across the top-left corner of the cover. */
export function drawBadgeRibbon(ctx, w, h, grade) {
  ctx.save();
  const bw = w * 0.46, bh = Math.max(26, h * 0.052);
  ctx.translate(w * 0.015, h * 0.055); ctx.rotate(-0.10);
  ctx.fillStyle = grade.glow;
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = bh * 0.3; ctx.shadowOffsetY = bh * 0.12;
  ctx.fillRect(-bw * 0.08, 0, bw, bh);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = `900 ${Math.round(bh * 0.52)}px 'Arial Black', Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('NEON COAST', bw * 0.42, bh * 0.54);
  ctx.restore();
}

let grainPatternCanvas = null;
function buildGrainPattern() {
  grainPatternCanvas = document.createElement('canvas');
  grainPatternCanvas.width = 140; grainPatternCanvas.height = 140;
  const gtx = grainPatternCanvas.getContext('2d');
  const img = gtx.createImageData(140, 140);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  gtx.putImageData(img, 0, 0);
}

/** A light film grain laid over the whole cover. */
export function applyFilmGrain(ctx, w, h) {
  if (!grainPatternCanvas) buildGrainPattern();
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  const pattern = ctx.createPattern(grainPatternCanvas, 'repeat');
  if (pattern) { ctx.fillStyle = pattern; ctx.fillRect(0, 0, w, h); }
  ctx.restore();
}

/** A soft dark vignette that pulls the eye to the centre of the cover. */
export function applyVignette(ctx, w, h) {
  ctx.save();
  const grad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.78);
  grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(8,0,18,0.42)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/** Renders the whole cover described by `state` onto `canvas`. */
export function renderCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] ?? GRADES.vice;
  ctx.fillStyle = '#12041f'; ctx.fillRect(0, 0, w, h);
  const rects = layoutPanels(state.layout, w, h);
  rects.forEach((rect, i) => {
    const photoIndex = state.panelPhotos?.[i] ?? (state.photos.length ? i % state.photos.length : -1);
    const photo = photoIndex >= 0 ? state.photos[photoIndex] ?? null : null;
    drawPanelCover(ctx, rect, photo, state.panelViews?.[i], grade, i);
  });
  strokePanelBorders(ctx, rects, w);
  drawHalftoneTitleBlock(ctx, w, h, grade, state.halftone);
  if (state.badge) drawBadgeRibbon(ctx, w, h, grade);
  if (state.stars > 0) drawHeatStars(ctx, w, h, state.stars);
  drawTitleLettering(ctx, w, h, state.caption, state.sub, grade);
  if (state.vignette) applyVignette(ctx, w, h);
  if (state.grain) applyFilmGrain(ctx, w, h);
}
