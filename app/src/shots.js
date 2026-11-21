/** Configure fixed art direction for review captures; signal only after the final canvas frame has painted. */
export async function runShot(name, { state, canvas, useSamples, paint, active, layoutSelect, sizeLabel }) {
  const scenes = {
    cover: { width: 1920, height: 1080, className: 'shot-canvas', title: 'VICE CITY NIGHTS', subtitle: 'EVERY NIGHT HAS A STORY', tagline: 'SUNSET BLVD · 1986', sizeLabel: '1920 × 1080' },
    'cover-portrait': { width: 1080, height: 1350, className: 'shot-canvas', title: 'AFTER THE SUNSET', subtitle: 'THE CITY IS OURS', tagline: 'VICE CITY · 1986', sizeLabel: '1080 × 1350' },
    'cover-square': { width: 1080, height: 1080, className: 'shot-canvas', title: 'NIGHTS LIKE THIS', subtitle: 'NEON NEVER SLEEPS', tagline: 'VICE CITY · AFTER DARK', sizeLabel: '1080 × 1080' },
    editor: { width: 960, height: 540, title: 'VICE CITY NIGHTS', subtitle: 'EVERY NIGHT HAS A STORY', tagline: 'SUNSET BLVD · 1986', sizeLabel: '1920 × 1080' },
  };
  const scene = scenes[name];
  if (!scene) { window.__shotReady = true; return; }
  await useSamples();
  if (name === 'editor') document.body.classList.add('shot-editor');
  state.layout = name === 'editor' ? 'hero' : 'strip'; layoutSelect.value = state.layout;
  layoutSelect.dispatchEvent(new Event('change'));
  state.title = scene.title; state.subtitle = scene.subtitle; state.tagline = scene.tagline;
  state.style = name === 'cover-square' ? 'gold' : 'bold';
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('tagline').value = state.tagline;
  document.getElementById('style').value = state.style;
  if (scene.className) document.body.classList.add(scene.className);
  const renderSize = name === 'editor' ? { width: 960, height: 540 } : { width: scene.width, height: scene.height };
  active(renderSize); sizeLabel.textContent = scene.sizeLabel;
  paint();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
