// Boots the home-page game: ride -> door -> garage. The garage's objects are real <a> links.
import { Screen } from './engine/screen';
import { input } from './engine/input';
import { Director } from './engine/scene';
import { loadImage } from './engine/sprites';
import { RideScene } from './scenes/ride';
import { DoorScene } from './scenes/door';
import { GarageScene } from './scenes/garage';
import { BAR, HOTSPOTS, toPct } from './hotspots';
import { hasVisited, markVisited, pickStart } from './state';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const layer = document.getElementById('hotspots') as HTMLElement;
const viewport = document.getElementById('viewport') as HTMLElement;
const screen = new Screen(canvas);
const director = new Director((m) => screen.setMode(m));
input.attach(screen);

const SPRITES = ['bike-side', 'pipecd', 'pipecd-sm', 'icon-github', 'icon-x', 'icon-linkedin', 'icon-youtube'] as const;
const images = Promise.all(SPRITES.map((n) => loadImage(`/sprites/${n}.png`))).then(([bike, pipecd, pipecdSm, github, x, linkedin, youtube]) => ({
  bike, pipecd, icons: { pipecd: pipecdSm, github, x, linkedin, youtube },
}));

async function garage() {
  const img = await images;
  const scene = new GarageScene(screen, img);
  director.go(scene);
  markVisited();
  mountHotspots(scene);
  requestAnimationFrame(centre);
}

// On phones the garage is wider than the screen: keep it centred on the bike (also after rotating).
const centre = () => { viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2; };
screen.onResize(() => { if (director.current instanceof GarageScene) requestAnimationFrame(centre); });

async function door() {
  const img = await images;
  director.go(new DoorScene(screen, img.bike, () => new GarageScene(screen, img).roomSprite(false), garage));
}

function mountHotspots(scene: GarageScene) {
  layer.replaceChildren();
  for (const h of [...HOTSPOTS, BAR.list, BAR.ride]) {
    const a = document.createElement('a');
    a.href = h.href;
    a.setAttribute('aria-label', h.id === 'list' || h.id === 'ride' ? h.label.toLowerCase() : h.label.replace(' · ', ': ').toLowerCase());
    if (h.external) { a.target = '_blank'; a.rel = 'noopener'; }
    Object.assign(a.style, toPct(h.rect));
    const on = () => { scene.hover = h.id; };
    const off = () => { if (scene.hover === h.id) scene.hover = null; };
    a.addEventListener('pointerenter', on); a.addEventListener('focus', on);
    a.addEventListener('pointerleave', off); a.addEventListener('blur', off);
    layer.append(a);
  }
}

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
async function ride() {
  const img = await images;
  director.go(new RideScene(screen, img.icons, door, garage));
}

if (new URLSearchParams(location.search).has('door')) door(); // handy for testing the door on its own
else if (pickStart(location.search, hasVisited(), reduced) === 'ride') ride();
else garage();

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const s = director.current;
  if (s) { s.update(dt); s.draw(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
