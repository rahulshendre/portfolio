// Clickable things in the garage. Rects are in world pixels (480x270).
import { site } from '../data/site';
import { WORLD_H, WORLD_W } from './engine/screen';

export interface Hotspot {
  id: string;
  label: string; // "LOOK AT: ..." line
  tag: string;   // short tag shown on touch screens
  href: string;
  rect: [number, number, number, number];
  external?: boolean;
}

export const HOTSPOTS: Hotspot[] = [
  { id: 'pipecd', label: 'PIPECD SIGN · OPEN SOURCE', tag: 'OPEN SOURCE', href: '/open-source', rect: [186, 22, 108, 130] },
  { id: 'bike', label: 'THE SCRAMBLER 400X', tag: 'THE BIKE', href: '/garage', rect: [164, 172, 152, 78] },
  { id: 'tv', label: 'CRT TV · VIDEOS', tag: 'VIDEOS', href: '/videos', rect: [18, 92, 66, 68] },
  { id: 'polaroids', label: 'POLAROID WALL · VIDEOS', tag: 'VIDEOS', href: '/videos', rect: [12, 26, 140, 62] },
  { id: 'binders', label: 'BINDERS · WRITING AND DOCS', tag: 'WRITING', href: '/writing', rect: [90, 124, 64, 36] },
  { id: 'shelf', label: 'PARTS SHELF · BUILDS', tag: 'BUILDS', href: '/builds', rect: [390, 86, 86, 112] },
  { id: 'toolbox', label: 'TOOLBOX STICKERS · PROJECTS', tag: 'PROJECTS', href: '/open-source#projects', rect: [316, 146, 68, 88] },
  { id: 'whiteboard', label: 'WHITEBOARD · ABOUT ME', tag: 'ABOUT', href: '/about', rect: [392, 22, 84, 62] },
  { id: 'pegboard', label: 'PEGBOARD · THE STACK', tag: 'STACK', href: '/about#stack', rect: [300, 26, 88, 50] },
  { id: 'radio', label: `RADIO · ON X ${site.links.xHandle.toUpperCase()}`, tag: 'X', href: site.links.x, rect: [304, 76, 44, 26], external: true },
  { id: 'calendar', label: 'CALENDAR · PR LOG', tag: 'PR LOG', href: '/open-source#log', rect: [154, 36, 30, 42] },
  { id: 'clipboard', label: 'CLIPBOARD · RESUME', tag: 'RESUME', href: '/resume', rect: [156, 82, 26, 36] },
  { id: 'coffee', label: 'COFFEE · ABOUT ME', tag: 'COFFEE', href: '/about', rect: [156, 138, 18, 22] },
];

// Bottom bar buttons, also real links.
export const BAR = {
  list: { id: 'list', label: 'EVERYTHING ON ONE PAGE', tag: '', href: '/list', rect: [2, 256, 70, 14] } as Hotspot,
  ride: { id: 'ride', label: 'RIDE IN AGAIN', tag: '', href: '/?ride', rect: [398, 256, 80, 14] } as Hotspot,
};

/** World rect to CSS percentages of the stage, so links line up with the canvas at any scale. */
export function toPct([x, y, w, h]: Hotspot['rect']) {
  const p = (n: number, d: number) => `${+((n / d) * 100).toFixed(4)}%`;
  return { left: p(x, WORLD_W), top: p(y, WORLD_H), width: p(w, WORLD_W), height: p(h, WORLD_H) };
}
