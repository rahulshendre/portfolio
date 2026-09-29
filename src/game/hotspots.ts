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
  /** Runs instead of following the link (the href stays as the no-JS and middle-click fallback). */
  action?: 'terminal';
}

/** Things you operate rather than open. Buttons, not links. */
export interface Control {
  id: 'cord' | 'radio' | 'cat' | 'window';
  label: string;
  tag: string;
  rect: [number, number, number, number];
}

const yt = site.links.youtube;

export const HOTSPOTS: Hotspot[] = [
  { id: 'pipecd', label: 'PIPECD POSTER · OPEN SOURCE', tag: 'PIPECD', href: '/open-source', rect: [192, 38, 44, 72] },
  { id: 'planetread', label: 'PLANETREAD POSTER · SUBTITLES AND APPS', tag: 'PLANETREAD', href: '/planetread', rect: [244, 33, 54, 42] },
  { id: 'bookbox', label: 'BOOKBOX · THE REACT NATIVE APP', tag: 'BOOKBOX', href: '/planetread#bookbox', rect: [244, 79, 54, 36] },
  { id: 'bike', label: 'THE SCRAMBLER 400X', tag: 'THE BIKE', href: '/garage', rect: [108, 146, 214, 106] },
  // enamel signs: the socials
  { id: 'youtube', label: yt ? 'YOUTUBE · MY CHANNEL' : 'YOUTUBE · VIDEOS FROM OCT', tag: 'YOUTUBE', href: yt || '/videos', rect: [92, 24, 63, 13], external: !!yt },
  { id: 'x', label: `TWITTER · ${site.links.xHandle.toUpperCase()}`, tag: 'X', href: site.links.x, rect: [92, 40, 63, 13], external: true },
  { id: 'linkedin', label: 'LINKEDIN · RAHUL SHENDRE', tag: 'LINKEDIN', href: site.links.linkedin, rect: [92, 56, 63, 13], external: true },
  { id: 'github', label: 'GITHUB · RAHULSHENDRE', tag: 'GITHUB', href: site.links.github, rect: [92, 72, 63, 13], external: true },
  { id: 'tv', label: 'CRT TV · OPEN THE TERMINAL', tag: 'TERMINAL', href: '/videos', rect: [18, 96, 66, 64], action: 'terminal' },
  { id: 'binders', label: 'BINDERS · WRITING AND DOCS', tag: 'WRITING', href: '/writing', rect: [90, 128, 58, 32] },
  { id: 'coffee', label: 'COFFEE · ABOUT ME', tag: 'COFFEE', href: '/about', rect: [152, 140, 20, 20] },
  { id: 'pegboard', label: 'PEGBOARD · THE STACK', tag: 'STACK', href: '/about#stack', rect: [300, 22, 88, 52] },
  { id: 'whiteboard', label: 'WHITEBOARD · ABOUT ME', tag: 'ABOUT', href: '/about', rect: [392, 22, 84, 62] },
  { id: 'calendar', label: 'CALENDAR · PR LOG', tag: 'PR LOG', href: '/open-source#log', rect: [304, 82, 30, 42] },
  { id: 'clipboard', label: 'CLIPBOARD · RESUME', tag: 'RESUME', href: '/resume', rect: [348, 82, 26, 36] },
  { id: 'toolbox', label: 'TOOLBOX STICKERS · PROJECTS', tag: 'PROJECTS', href: '/open-source#projects', rect: [322, 146, 62, 88] },
  { id: 'shelf', label: 'PARTS SHELF · BUILDS', tag: 'BUILDS', href: '/builds', rect: [390, 86, 86, 112] },
];

export const CONTROLS: Control[] = [
  { id: 'cord', label: 'PULL CORD · LIGHTS', tag: 'LIGHTS', rect: [169, 28, 16, 26] },
  { id: 'radio', label: 'RADIO · LO-FI ON OR OFF', tag: 'RADIO', rect: [96, 108, 44, 22] },
  { id: 'window', label: 'WINDOW · CHANGE THE WEATHER', tag: 'WEATHER', rect: [9, 23, 66, 74] },
  { id: 'cat', label: 'THE CAT · PET HER', tag: 'CAT', rect: [6, 196, 38, 20] },
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
