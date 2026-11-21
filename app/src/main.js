// Neon Coast Cover Studio: the editor wiring.
// Loads photos from the user's machine (they are never uploaded), keeps the
// cover state with undo and redo history, lets each panel be repositioned by
// dragging and zoomed with a slider, and exports the finished cover as a PNG
// in the four common post sizes. A ?shot= query builds a fixed scene instead,
// for the entry's screenshots (see ./shots.js).

import { LAYOUTS, GRADES, EXPORT_SIZES, layoutPanels, renderCover } from './cover.js';
import { SAMPLE_PHOTOS, buildShotCoverState, loadSampleImage, markShotReady } from './shots.js';

const canvas = document.getElementById('coverCanvas');
const captionInput = document.getElementById('captionInput');
const subInput = document.getElementById('subInput');
const layoutSelect = document.getElementById('layoutSelect');
const gradeSelect = document.getElementById('gradeSelect');
const starsRange = document.getElementById('starsRange');
const starsValue = document.getElementById('starsValue');
const zoomRange = document.getElementById('zoomRange');
const photoStrip = document.getElementById('photoStrip');
const statusLine = document.getElementById('statusLine');
const panelLabel = document.getElementById('panelLabel');

const state = {
  photos: [], photoNames: [],
  panelPhotos: [], panelViews: [],
  layout: 'classic', grade: 'vice',
  caption: 'NEON COAST', sub: 'Vice Nights',
  stars: 5, badge: true, grain: true, vignette: true, halftone: true,
};
let selectedPanel = 0;
const undoStack = [], redoStack = [];

function ensurePanelSlots() {
  const count = layoutPanels(state.layout, 100, 100).length;
  while (state.panelPhotos.length < count) {
    state.panelPhotos.push(state.photos.length ? state.panelPhotos.length % state.photos.length : 0);
    state.panelViews.push({ zoom: 1, ox: 0, oy: 0 });
  }
}

function snapshotState() {
  return JSON.stringify({
    panelPhotos: state.panelPhotos, panelViews: state.panelViews,
    layout: state.layout, grade: state.grade, caption: state.caption, sub: state.sub,
    stars: state.stars, badge: state.badge, grain: state.grain,
    vignette: state.vignette, halftone: state.halftone,
  });
}

function restoreSnapshot(json) {
  Object.assign(state, JSON.parse(json));
  syncControlsFromState();
  redraw();
}

function pushHistory() {
  undoStack.push(snapshotState());
  if (undoStack.length > 60) undoStack.shift();
  redoStack.length = 0;
}

function redraw() {
  ensurePanelSlots();
  renderCover(canvas, state);
  panelLabel.textContent = `Panel ${selectedPanel + 1} selected - drag on the cover to reposition it, zoom with the slider`;
  zoomRange.value = String(Math.round((state.panelViews[selectedPanel]?.zoom ?? 1) * 100));
}

function syncControlsFromState() {
  captionInput.value = state.caption;
  subInput.value = state.sub;
  layoutSelect.value = state.layout;
  gradeSelect.value = state.grade;
  starsRange.value = String(state.stars);
  starsValue.textContent = String(state.stars);
  document.getElementById('badgeToggle').checked = state.badge;
  document.getElementById('grainToggle').checked = state.grain;
  document.getElementById('vignetteToggle').checked = state.vignette;
  document.getElementById('halftoneToggle').checked = state.halftone;
}

function renderPhotoStrip() {
  photoStrip.replaceChildren();
  state.photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'photo-thumb';
    btn.title = `Put photo ${i + 1} (${state.photoNames[i]}) into panel ${selectedPanel + 1}`;
    const thumb = document.createElement('canvas');
    thumb.width = 84; thumb.height = 84;
    const tctx = thumb.getContext('2d');
    const scale = Math.max(84 / photo.naturalWidth, 84 / photo.naturalHeight);
    tctx.drawImage(photo, (84 - photo.naturalWidth * scale) / 2, (84 - photo.naturalHeight * scale) / 2, photo.naturalWidth * scale, photo.naturalHeight * scale);
    const tag = document.createElement('span');
    tag.textContent = `Photo ${i + 1}`;
    btn.append(thumb, tag);
    btn.addEventListener('click', () => {
      pushHistory();
      state.panelPhotos[selectedPanel] = i;
      redraw();
      setStatus(`Panel ${selectedPanel + 1} now shows photo ${i + 1}`);
    });
    photoStrip.append(btn);
  });
  const fillBtn = document.createElement('button');
  fillBtn.type = 'button';
  fillBtn.className = 'photo-thumb fill-all';
  fillBtn.textContent = 'Fill every panel with the selected photo';
  fillBtn.addEventListener('click', () => {
    if (!state.photos.length) return;
    pushHistory();
    const chosen = state.panelPhotos[selectedPanel] ?? 0;
    state.panelPhotos = state.panelPhotos.map(() => chosen);
    redraw();
    setStatus('Every panel now shows the same photo');
  });
  photoStrip.append(fillBtn);
}

function setStatus(text) { statusLine.textContent = text; }

async function addPhoto(img, name) {
  if (state.photos.length >= 4) { setStatus('Four photos is the limit - the cover already has plenty to work with'); return; }
  state.photos.push(img);
  state.photoNames.push(name);
  renderPhotoStrip();
  redraw();
}

function exportCoverAsPng(size) {
  const out = document.createElement('canvas');
  out.width = size.w; out.height = size.h;
  renderCover(out, state);
  out.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setStatus(`Saved neon-coast-cover-${size.w}x${size.h}.png`);
  }, 'image/png');
}

function buildEditorControls() {
  for (const [id, layout] of Object.entries(LAYOUTS)) {
    const opt = document.createElement('option');
    opt.value = id; opt.textContent = layout.label;
    layoutSelect.append(opt);
  }
  for (const [id, grade] of Object.entries(GRADES)) {
    const opt = document.createElement('option');
    opt.value = id; opt.textContent = grade.label;
    gradeSelect.append(opt);
  }
  const exportRow = document.getElementById('exportRow');
  for (const size of EXPORT_SIZES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'export-button';
    btn.textContent = `Export PNG ${size.label}`;
    btn.addEventListener('click', () => exportCoverAsPng(size));
    exportRow.append(btn);
  }
}

function wireEditorEvents() {
  document.getElementById('photoUpload').addEventListener('change', async (event) => {
    const files = [...event.target.files].slice(0, 4 - state.photos.length);
    for (const file of files) await addPhoto(await loadSampleImage(URL.createObjectURL(file)), file.name);
    if (files.length) setStatus(`${files.length} photo(s) loaded - click a panel, then a photo to place it`);
  });
  document.getElementById('loadSamplesButton').addEventListener('click', async () => {
    for (const sample of SAMPLE_PHOTOS) {
      if (state.photoNames.includes(sample.id)) continue;
      await addPhoto(await loadSampleImage(sample.url), sample.id);
    }
    setStatus('Sample photos loaded');
  });
  captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
  captionInput.addEventListener('change', pushHistory);
  subInput.addEventListener('input', () => { state.sub = subInput.value; redraw(); });
  subInput.addEventListener('change', pushHistory);
  layoutSelect.addEventListener('change', () => { pushHistory(); state.layout = layoutSelect.value; selectedPanel = 0; redraw(); });
  gradeSelect.addEventListener('change', () => { pushHistory(); state.grade = gradeSelect.value; redraw(); });
  starsRange.addEventListener('input', () => { state.stars = Number(starsRange.value); starsValue.textContent = starsRange.value; redraw(); });
  starsRange.addEventListener('change', pushHistory);
  zoomRange.addEventListener('input', () => {
    ensurePanelSlots();
    state.panelViews[selectedPanel].zoom = Number(zoomRange.value) / 100;
    redraw();
  });
  zoomRange.addEventListener('change', pushHistory);
  for (const [id, key] of [['badgeToggle', 'badge'], ['grainToggle', 'grain'], ['vignetteToggle', 'vignette'], ['halftoneToggle', 'halftone']]) {
    document.getElementById(id).addEventListener('change', (event) => { pushHistory(); state[key] = event.target.checked; redraw(); });
  }
  document.getElementById('undoButton').addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(snapshotState());
    restoreSnapshot(undoStack.pop());
  });
  document.getElementById('redoButton').addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(snapshotState());
    restoreSnapshot(redoStack.pop());
  });

  let dragging = null;
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const px = (event.clientX - rect.left) * (canvas.width / rect.width);
    const py = (event.clientY - rect.top) * (canvas.height / rect.height);
    const panels = layoutPanels(state.layout, canvas.width, canvas.height);
    const hit = panels.findIndex((p) => px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h);
    if (hit >= 0) selectedPanel = hit;
    ensurePanelSlots();
    dragging = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const view = state.panelViews[selectedPanel];
    view.ox += (event.clientX - dragging.x) / canvas.clientWidth;
    view.oy += (event.clientY - dragging.y) / canvas.clientHeight;
    dragging = { x: event.clientX, y: event.clientY };
    redraw();
  });
  canvas.addEventListener('pointerup', () => { if (dragging) { dragging = null; pushHistory(); } });
}

async function startEditor(shotQuery) {
  buildEditorControls();
  wireEditorEvents();
  syncControlsFromState();
  if (shotQuery) {
    const shotState = await buildShotCoverState(shotQuery);
    state.photos = shotState.photos;
    state.photoNames = ['pier', 'boulevard'];
    state.panelPhotos = shotState.panelPhotos;
    state.panelViews = shotState.panelViews;
    state.caption = shotState.caption;
    state.sub = shotState.sub;
    captionInput.value = state.caption;
    subInput.value = state.sub;
  } else {
    for (const sample of SAMPLE_PHOTOS) await addPhoto(await loadSampleImage(sample.url), sample.id);
  }
  renderPhotoStrip();
  redraw();
  if (shotQuery) markShotReady();
}

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot === 'cover') {
  document.body.classList.add('shot-cover');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  buildShotCoverState(query).then((shotState) => {
    renderCover(canvas, shotState);
    markShotReady();
  });
} else {
  startEditor(shot === 'editor' ? query : null);
}
