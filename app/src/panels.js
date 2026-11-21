const layouts = {
  strip: [
    { x: .035, y: .075, w: .49, h: .85, tilt: -.012, label: 'HERO' },
    { x: .545, y: .075, w: .415, h: .405, tilt: .01, label: 'SCENE 02' },
    { x: .555, y: .515, w: .405, h: .41, tilt: -.009, label: 'SCENE 03' },
  ],
  split: [
    { x: .035, y: .075, w: .565, h: .85, tilt: -.01, label: 'HERO' },
    { x: .625, y: .075, w: .34, h: .85, tilt: .009, label: 'SCENE 02' },
  ],
  grid: [
    { x: .035, y: .075, w: .45, h: .405, tilt: -.008, label: 'SCENE 01' },
    { x: .515, y: .075, w: .45, h: .405, tilt: .008, label: 'SCENE 02' },
    { x: .035, y: .515, w: .45, h: .41, tilt: .008, label: 'SCENE 03' },
    { x: .515, y: .515, w: .45, h: .41, tilt: -.008, label: 'SCENE 04' },
  ],
  hero: [{ x: .035, y: .075, w: .93, h: .85, tilt: 0, label: 'HERO' }],
};

export function getPanels(layout, width, height) {
  return (layouts[layout] ?? layouts.strip).map((panel) => ({
    ...panel, x: panel.x * width, y: panel.y * height,
    w: panel.w * width, h: panel.h * height, tilt: panel.tilt * width,
  }));
}
