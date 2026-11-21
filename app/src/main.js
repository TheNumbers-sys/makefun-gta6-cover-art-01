import { drawCover } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const images = [];
const urls = [];
let activeSize = { width: 960, height: 540 };
let state = { photos: [], panels: [], layout: 'strip', title: 'VICE CITY NIGHTS', subtitle: 'EVERY NIGHT HAS A STORY', tagline: 'SUNSET BLVD · 1986', style: 'bold', position: 'bottom' };
const dimensions = { square: [1080, 1080], portrait: [1080, 1350], landscape: [1920, 1080] };

function paint() { drawCover(canvas, state, activeSize); }
function dataURL(file) { return URL.createObjectURL(file); }
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src;
  });
}
function panelSlots() { return ({ strip: 3, split: 2, grid: 4, hero: 1 })[state.layout] ?? 3; }
function rebuildPanelState() {
  const previous = state.panels;
  state.panels = Array.from({ length: panelSlots() }, (_, i) => previous[i] ?? ({ img: state.photos[i % Math.max(state.photos.length, 1)]?.img ?? null, photoIndex: state.photos.length ? i % state.photos.length : -1, zoom: 1, x: 0, y: 0 }));
  renderPanelControls(); paint();
}
function renderPhotoTray() {
  const tray = $('photo-list'); tray.replaceChildren();
  images.forEach((entry, index) => {
    const thumb = document.createElement('img'); thumb.className = 'photo-chip'; thumb.src = entry.url; thumb.alt = `Photo ${index + 1}`; tray.append(thumb);
  });
}
function renderPanelControls() {
  const host = $('panel-controls'); host.replaceChildren();
  state.panels.forEach((panel, i) => {
    const card = document.createElement('div'); card.className = 'panel-card';
    const title = document.createElement('strong'); title.textContent = `PANEL ${String(i + 1).padStart(2, '0')}`;
    const select = document.createElement('select'); select.setAttribute('aria-label', `Photo for panel ${i + 1}`);
    const blank = new Option('No photo', '-1'); select.add(blank);
    images.forEach((_, n) => select.add(new Option(`Photo ${n + 1}`, String(n)))); select.value = String(panel.photoIndex);
    select.addEventListener('change', () => { panel.photoIndex = Number(select.value); panel.img = images[panel.photoIndex]?.img ?? null; paint(); });
    card.append(title, select);
    for (const [key, label] of [['zoom', 'ZOOM'], ['x', 'LEFT / RIGHT'], ['y', 'UP / DOWN']]) {
      const row = document.createElement('label'); row.className = 'crop-row'; row.append(document.createTextNode(label));
      const input = document.createElement('input'); input.type = 'range'; input.min = key === 'zoom' ? '1' : '-1'; input.max = key === 'zoom' ? '2.6' : '1'; input.step = key === 'zoom' ? '.01' : '.02'; input.value = String(panel[key]); input.setAttribute('aria-label', `${label} panel ${i + 1}`);
      input.addEventListener('input', () => { panel[key] = Number(input.value); paint(); }); row.append(input); card.append(row);
    }
    host.append(card);
  });
}
async function addPhotos(files) {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const url = dataURL(file); urls.push(url);
    try { const img = await loadImage(url); images.push({ img, url }); } catch { $('status').textContent = `Could not read ${file.name}`; }
  }
  state.photos = images.map((entry) => ({ ...entry, zoom: 1, x: 0, y: 0 }));
  renderPhotoTray(); rebuildPanelState(); $('status').textContent = `${images.length} photo${images.length === 1 ? '' : 's'} ready · all local`;
}
async function useSamples() {
  images.length = 0;
  for (const name of ['boulevard.jpg', 'pier.jpg']) {
    const url = `./samples/${name}`; images.push({ img: await loadImage(url), url });
  }
  state.photos = images.map((entry) => ({ ...entry, zoom: 1, x: 0, y: 0 }));
  renderPhotoTray(); state.panels = [];
  $('status').textContent = 'Sample photos ready · try a different story'; rebuildPanelState();
}

$('photos').addEventListener('change', (event) => addPhotos([...event.target.files]));
$('samples').addEventListener('click', useSamples);
$('layout').addEventListener('change', (event) => { state.layout = event.target.value; rebuildPanelState(); });
for (const [id, key] of [['title', 'title'], ['subtitle', 'subtitle'], ['tagline', 'tagline'], ['style', 'style'], ['position', 'position']]) {
  $(id).addEventListener(id === 'title' || id === 'subtitle' || id === 'tagline' ? 'input' : 'change', (event) => { state[key] = event.target.value; paint(); });
}
$('size').addEventListener('change', (event) => {
  const [width, height] = dimensions[event.target.value]; activeSize = { width: Math.min(1100, width), height: Math.round(Math.min(1100, width) * height / width) };
  $('canvas-size').textContent = `${width} × ${height}`; paint();
});
$('export').addEventListener('click', () => {
  const [width, height] = dimensions[$('size').value];
  const output = document.createElement('canvas'); drawCover(output, state, { width, height });
  output.toBlob((blob) => {
    if (!blob) { $('status').textContent = 'Export failed. Please try again.'; return; }
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `vice-city-cover-${width}x${height}.png`; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000); $('status').textContent = `PNG saved · ${width} × ${height}`;
  }, 'image/png');
});

paint();
const shot = new URLSearchParams(location.search).get('shot');
if (shot) runShot(shot, { state, canvas, useSamples, paint, active: (size) => { activeSize = size; }, layoutSelect: $('layout'), sizeLabel: $('canvas-size') });
