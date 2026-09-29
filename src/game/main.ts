// Boots the home-page game: door (arrival) -> garage, with the ride one click away. The garage's objects are real links.
import { Screen } from './engine/screen';
import { input } from './engine/input';
import { Director } from './engine/scene';
import { loadImage } from './engine/sprites';
import { RideScene } from './scenes/ride';
import { DoorScene } from './scenes/door';
import { GarageScene } from './scenes/garage';
import { BAR, CONTROLS, HOTSPOTS, toPct } from './hotspots';
import { hasVisited, loadNight, markVisited, pickStart, saveNight } from './state';
import { radio } from './engine/audio';
import { mountTerminal } from './terminal-ui';

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

let current: GarageScene | undefined;

function toggleNight() {
  if (!current) return;
  current.setNight(!current.night);
  saveNight(current.night);
}

function toggleRadio() {
  const on = radio.toggle();
  if (current) current.radioOn = on;
  document.querySelector('[data-control="radio"]')?.setAttribute('aria-pressed', String(on));
}

const terminal = mountTerminal({
  night: toggleNight,
  radio: toggleRadio,
  ride: () => ride(),
  closed: () => (document.querySelector('a[data-action="terminal"]') as HTMLElement | null)?.focus(),
});

document.getElementById('phone-term')?.addEventListener('click', () => terminal.open()); // the TV is off-screen on a portrait phone

async function garage() {
  const img = await images;
  const scene = new GarageScene(screen, img);
  scene.night = loadNight();
  scene.radioOn = radio.on;
  current = scene;
  director.go(scene);
  markVisited();
  mountHotspots(scene);
  requestAnimationFrame(centre);
  if (location.hash === '#terminal') terminal.open();
}

// On phones the garage is wider than the screen: keep it centred on the bike (also after rotating).
const centre = () => { viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2; };
screen.onResize(() => { if (director.current instanceof GarageScene) requestAnimationFrame(centre); });

async function door() {
  const img = await images;
  current = undefined;
  director.go(new DoorScene(screen, img.bike, () => new GarageScene(screen, img).roomSprite(false), garage));
}

function mountHotspots(scene: GarageScene) {
  layer.replaceChildren();
  for (const c of CONTROLS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.control = c.id;
    b.setAttribute('aria-label', c.label.replace(' · ', ': ').toLowerCase());
    b.setAttribute('aria-pressed', String(c.id === 'radio' ? radio.on : scene.night));
    Object.assign(b.style, toPct(c.rect));
    b.addEventListener('click', () => {
      if (c.id === 'cord') { toggleNight(); b.setAttribute('aria-pressed', String(scene.night)); } else toggleRadio();
    });
    hoverable(b, c.id, scene);
    layer.append(b);
  }
  for (const h of [...HOTSPOTS, BAR.list, BAR.ride]) {
    const a = document.createElement('a');
    a.href = h.href;
    if ('action' in h && h.action) {
      a.dataset.action = h.action;
      a.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); terminal.open(); });
    }
    a.setAttribute('aria-label', h.id === 'list' || h.id === 'ride' ? h.label.toLowerCase() : h.label.replace(' · ', ': ').toLowerCase());
    if (h.external) { a.target = '_blank'; a.rel = 'noopener'; }
    Object.assign(a.style, toPct(h.rect));
    hoverable(a, h.id, scene);
    layer.append(a);
  }
}

function hoverable(el: HTMLElement, id: string, scene: GarageScene) {
  const on = () => { scene.hover = id; };
  const off = () => { if (scene.hover === id) scene.hover = null; };
  el.addEventListener('pointerenter', on); el.addEventListener('focus', on);
  el.addEventListener('pointerleave', off); el.addEventListener('blur', off);
}

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
async function ride() {
  await images;
  current = undefined;
  director.go(new RideScene(screen, door, garage));
}

const start = pickStart(location.search, hasVisited(), reduced);
if (location.hash === '#terminal') garage();
else if (start === 'ride') ride();
else if (start === 'door') door();
else garage();

// The garage leans a little toward the pointer: cheap CSS 3D that keeps the hotspot links lined up.
const stage = document.getElementById('stage') as HTMLElement;
const canLean = !reduced && matchMedia('(pointer: fine)').matches;
let lean = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
if (canLean) addEventListener('pointermove', (e) => { aim = { x: e.clientX / innerWidth - 0.5, y: e.clientY / innerHeight - 0.5 }; });
function leanStage(dt: number) {
  const on = canLean && director.current instanceof GarageScene && !terminal.isOpen && !(current?.lowFx);
  const k = Math.min(1, dt * 6), tx = on ? aim.x : 0, ty = on ? aim.y : 0;
  lean = { x: lean.x + (tx - lean.x) * k, y: lean.y + (ty - lean.y) * k };
  stage.style.transform = Math.abs(lean.x) + Math.abs(lean.y) < 0.002 ? '' : `perspective(1200px) rotateY(${(lean.x * 2.4).toFixed(3)}deg) rotateX(${(-lean.y * 1.8).toFixed(3)}deg) scale(1.02)`;
}

// If frames get slow, the garage drops its extras (dust, flicker, lean) and keeps its look.
let last = performance.now(), slow = 0, frames = 0;
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const s = director.current;
  if (s) { s.update(dt); s.draw(); }
  if (current && !current.lowFx && ++frames > 90) { slow = slow * 0.95 + dt * 0.05; if (slow > 1 / 38) current.lowFx = true; }
  leanStage(dt);
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => (document.hidden ? radio.suspend() : radio.resume()));
requestAnimationFrame(frame);
