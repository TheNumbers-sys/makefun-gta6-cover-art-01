import { getPanels } from './panels.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

function pathPanel(ctx, p) {
  ctx.beginPath();
  ctx.moveTo(p.x + p.tilt, p.y);
  ctx.lineTo(p.x + p.w + p.tilt, p.y + p.tilt * .2);
  ctx.lineTo(p.x + p.w - p.tilt * .3, p.y + p.h);
  ctx.lineTo(p.x, p.y + p.h - p.tilt * .25);
  ctx.closePath();
}

function drawPalm(ctx, x, y, scale, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(5, -85, -7, -170);
  ctx.lineTo(8, -170); ctx.quadraticCurveTo(20, -78, 6, 0); ctx.closePath(); ctx.fill();
  const fronds = [[0,-166,-75,-199,-117,-184],[0,-166,-65,-154,-118,-130],[0,-166,-38,-212,-43,-246],[0,-166,55,-205,104,-206],[0,-166,69,-177,124,-164],[0,-166,40,-226,66,-247]];
  for (const [sx, sy, cx, cy, ex, ey] of fronds) {
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.quadraticCurveTo(cx * .72, cy + 20, sx + 1, sy + 7); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(cx, cy, ex, ey); ctx.stroke();
  }
  ctx.restore();
}

function paintPanel(ctx, panel, entry, w, h, index) {
  pathPanel(ctx, panel); ctx.save(); ctx.clip();
  const bg = ctx.createLinearGradient(0, panel.y, 0, panel.y + panel.h);
  bg.addColorStop(0, '#f3a16c'); bg.addColorStop(.45, '#e95a82'); bg.addColorStop(1, '#25213f');
  ctx.fillStyle = bg; ctx.fillRect(panel.x - 3, panel.y - 3, panel.w + 8, panel.h + 8);
  if (entry?.img) {
    const img = entry.img, zoom = entry.zoom ?? 1;
    const scale = Math.max(panel.w / img.naturalWidth, panel.h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    const cx = entry.x ?? 0, cy = entry.y ?? 0;
    ctx.drawImage(img, panel.x + (panel.w - dw) / 2 + cx * panel.w * .42, panel.y + (panel.h - dh) / 2 + cy * panel.h * .42, dw, dh);
    const grade = ctx.createLinearGradient(panel.x, panel.y, panel.x + panel.w * .15, panel.y + panel.h);
    grade.addColorStop(0, 'rgba(255,112,131,.22)'); grade.addColorStop(.52, 'rgba(244,83,135,.14)'); grade.addColorStop(1, 'rgba(30,20,60,.53)');
    ctx.fillStyle = grade; ctx.fillRect(panel.x - 3, panel.y - 3, panel.w + 8, panel.h + 8);
  } else {
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  }
  // Original sun disc, palette wash and foreground silhouettes anchor each frame in a warm coastal night.
  const sunX = panel.x + panel.w * (.79 - index * .045), sunY = panel.y + panel.h * .24;
  const sunR = Math.min(panel.w, panel.h) * .115;
  const sun = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
  sun.addColorStop(0, '#fff0b7'); sun.addColorStop(1, '#ff8a94');
  ctx.globalAlpha = .72; ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'multiply';
  const wash = ctx.createLinearGradient(0, panel.y, 0, panel.y + panel.h);
  wash.addColorStop(0, 'rgba(255,185,115,.32)'); wash.addColorStop(.5, 'rgba(255,95,153,.04)'); wash.addColorStop(1, 'rgba(28,14,55,.68)');
  ctx.fillStyle = wash; ctx.fillRect(panel.x - 3, panel.y - 3, panel.w + 8, panel.h + 8);
  ctx.globalCompositeOperation = 'source-over';
  const palmScale = Math.min(panel.w, panel.h) / 310;
  drawPalm(ctx, panel.x + panel.w * .08, panel.y + panel.h * 1.02, palmScale, '#171326');
  if (panel.w > panel.h * 1.2) drawPalm(ctx, panel.x + panel.w * .9, panel.y + panel.h * 1.03, palmScale * .77, '#191426');
  ctx.fillStyle = 'rgba(255,73,175,.54)'; ctx.fillRect(panel.x + panel.w * .08, panel.y + panel.h * .82, panel.w * .76, Math.max(2, h * .003));
  // Fine halftone dots are kept subtle enough to preserve photo detail.
  ctx.fillStyle = 'rgba(25,12,42,.16)';
  const spacing = Math.max(5, Math.round(w / 180));
  for (let yy = panel.y + 2; yy < panel.y + panel.h; yy += spacing) for (let xx = panel.x + 2; xx < panel.x + panel.w; xx += spacing) {
    const fade = (yy - panel.y) / panel.h;
    if (fade > .38 && ((xx / spacing + yy / spacing) % 3 !== 0)) ctx.fillRect(xx, yy, 1.2, 1.2);
  }
  ctx.restore();
}

function fitText(ctx, text, max, base, weight = 900) {
  let size = base;
  ctx.font = `${weight} ${size}px Impact, Haettenschweiler, "Arial Narrow", system-ui, sans-serif`;
  while (ctx.measureText(text).width > max && size > 12) {
    size -= 2; ctx.font = `${weight} ${size}px Impact, Haettenschweiler, "Arial Narrow", system-ui, sans-serif`;
  }
  return size;
}

function drawLettering(ctx, state, w, h) {
  const bandH = h * .245, bandY = state.position === 'top' ? h * .07 : h * .685;
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  band.addColorStop(0, 'rgba(15,12,29,.12)'); band.addColorStop(.22, 'rgba(13,11,28,.76)'); band.addColorStop(1, 'rgba(13,11,28,.9)');
  ctx.fillStyle = band; ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = '#ff4da9'; ctx.fillRect(w * .045, bandY + bandH * .1, w * .13, Math.max(2, h * .006));
  const title = (state.title || 'VICE CITY NIGHTS').trim().toUpperCase();
  const base = h * .105, titleSize = fitText(ctx, title, w * .9, base);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  const titleY = bandY + bandH * .52;
  if (state.style === 'neon') {
    ctx.shadowColor = '#ff32bc'; ctx.shadowBlur = h * .045; ctx.strokeStyle = '#ff45bd'; ctx.lineWidth = Math.max(2, h * .006); ctx.strokeText(title, w / 2, titleY);
    ctx.shadowBlur = h * .055; ctx.fillStyle = '#fff5fb'; ctx.fillText(title, w / 2, titleY); ctx.shadowBlur = 0;
  } else if (state.style === 'gold') {
    const gold = ctx.createLinearGradient(0, titleY - titleSize / 2, 0, titleY + titleSize / 2);
    gold.addColorStop(0, '#fff5bb'); gold.addColorStop(.48, '#ffd36b'); gold.addColorStop(1, '#ef8b37');
    ctx.strokeStyle = '#24162b'; ctx.lineWidth = Math.max(3, h * .012); ctx.strokeText(title, w / 2, titleY);
    ctx.fillStyle = gold; ctx.fillText(title, w / 2, titleY);
  } else {
    ctx.strokeStyle = '#170f25'; ctx.lineWidth = Math.max(4, h * .014); ctx.strokeText(title, w / 2, titleY);
    ctx.shadowColor = '#ff5aaa'; ctx.shadowBlur = h * .017; ctx.fillStyle = '#fffaf6'; ctx.fillText(title, w / 2, titleY); ctx.shadowBlur = 0;
  }
  const subtitle = (state.subtitle || '').trim().toUpperCase();
  const tag = (state.tagline || '').trim().toUpperCase();
  ctx.font = `700 ${Math.max(9, h * .019)}px system-ui, sans-serif`; ctx.letterSpacing = `${Math.max(1, h * .003)}px`;
  ctx.fillStyle = '#ffb1d8'; if (subtitle) ctx.fillText(subtitle, w / 2, bandY + bandH * .79);
  ctx.font = `800 ${Math.max(8, h * .014)}px system-ui, sans-serif`; ctx.fillStyle = '#f2e8ec';
  ctx.fillText(tag, w / 2, bandY + bandH * .92); ctx.letterSpacing = '0px';
}

/** Draw a complete cover into a canvas using photo entries and live editor state. */
export function drawCover(canvas, state, size = null) {
  const { width: w, height: h } = size ?? canvas;
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  const sky = ctx.createLinearGradient(0, 0, w * .85, h);
  sky.addColorStop(0, '#ffbd80'); sky.addColorStop(.38, '#ef638c'); sky.addColorStop(.72, '#693a76'); sky.addColorStop(1, '#16152d');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
  const panels = getPanels(state.layout, w, h);
  // Dark outer keyline, white comic gutter, then the art panel.
  for (const panel of panels) {
    pathPanel(ctx, panel); ctx.fillStyle = '#10101a'; ctx.fill();
    ctx.save(); ctx.translate(-w * .002, -h * .003); pathPanel(ctx, { ...panel, x: panel.x + w * .004, y: panel.y + h * .004, w: panel.w, h: panel.h, tilt: panel.tilt }); ctx.fillStyle = '#fff7ef'; ctx.fill(); ctx.restore();
    const entry = state.panels?.[panels.indexOf(panel)] ?? state.photos?.[0];
    paintPanel(ctx, panel, entry, w, h, panels.indexOf(panel));
  }
  // Cover-wide pink/cyan edge light and vignette frame the composition.
  const edge = ctx.createLinearGradient(0, 0, w, 0);
  edge.addColorStop(0, 'rgba(255,63,173,.35)'); edge.addColorStop(.025, 'rgba(255,63,173,0)'); edge.addColorStop(.97, 'rgba(54,226,238,0)'); edge.addColorStop(1, 'rgba(54,226,238,.34)');
  ctx.fillStyle = edge; ctx.fillRect(0, 0, w, h);
  const vignette = ctx.createRadialGradient(w * .5, h * .48, h * .15, w * .5, h * .48, Math.max(w, h) * .72);
  vignette.addColorStop(0, 'rgba(0,0,0,0)'); vignette.addColorStop(1, 'rgba(8,6,20,.42)');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, w, h);
  drawLettering(ctx, state, w, h);
}
