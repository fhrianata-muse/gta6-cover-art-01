// Fixed scenes for screenshots and for the kit's shots.json.
// ?shot=cover paints one finished cover across the whole viewport and
// ?shot=editor opens the editor with a sample photo already loaded. Both set
// window.__shotReady once the cover is painted, after the photo has loaded.

export const SAMPLE_PHOTOS = [
  { id: 'pier', label: 'Pier sample', url: 'samples/pier.jpg' },
  { id: 'boulevard', label: 'Boulevard sample', url: 'samples/boulevard.jpg' },
];

/** Loads one image element from a URL inside app/, resolving when drawable. */
export function loadSampleImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function defaultPanelViews(count) {
  return Array.from({ length: count }, () => ({ zoom: 1, ox: 0, oy: 0 }));
}

function alternatingPanelPhotos(count) {
  return Array.from({ length: count }, (_, i) => i % 2);
}

/** Builds the cover state a ?shot=cover URL describes. */
export async function buildShotCoverState(query) {
  const firstName = query.get('photo') ?? 'pier';
  const secondName = firstName === 'pier' ? 'boulevard' : 'pier';
  const first = await loadSampleImage(`samples/${firstName}.jpg`);
  const second = await loadSampleImage(`samples/${secondName}.jpg`);
  return {
    photos: [first, second],
    panelPhotos: alternatingPanelPhotos(9),
    panelViews: defaultPanelViews(9),
    layout: query.get('layout') ?? 'classic',
    grade: query.get('grade') ?? 'vice',
    caption: query.get('caption') ?? 'NEON COAST',
    sub: query.get('sub') ?? 'Vice Nights',
    stars: Number(query.get('stars') ?? 5),
    badge: true, grain: true, vignette: true, halftone: true,
  };
}

/** Tells the screenshot tool the scene is painted and stable. */
export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
