// Boots the home-page game: door (arrival) -> garage, with the ride one click away. The garage's objects are real links.
import { Screen, WIDE_W, WORLD_H, WORLD_W } from './engine/screen';
import { input } from './engine/input';
import { Fx, fxWanted } from './engine/fx';
import { Director } from './engine/scene';
import { loadImage } from './engine/sprites';
import { RideScene } from './scenes/ride';
import { DoorScene } from './scenes/door';
import { GarageScene } from './scenes/garage';
import { BAR, CONTROLS, HOTSPOTS, toPct } from './hotspots';
import { THEMES, WEATHERS, hasVisited, isNightHour, loadMute, saveMute, loadNight, loadRadio, loadTried, markVisited, pickStart, pickTheme, pickWeather, saveNight, saveRadio, saveTried } from './state';
import { engine, hiss, meow, preloadMeow, radio, setMuted } from './engine/audio';
import { mountTerminal } from './terminal-ui';
import { isPanelHref, mountPanel, parsePanelHash, titleFor } from './panel';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const layer = document.getElementById('hotspots') as HTMLElement;
const viewport = document.getElementById('viewport') as HTMLElement;
const screen = new Screen(canvas);
const director = new Director((m) => screen.setMode(m));
input.attach(screen);
const fx = new Fx(canvas); // glow, vignette and warmth over the pixel scenes
if (fx.ok) canvas.after(fx.canvas);

const SPRITES = ['mountains', 'bike-side', 'pipecd', 'pipecd-sm', 'planetread', 'icon-github', 'icon-x', 'icon-linkedin', 'icon-youtube'] as const;
const images = Promise.all(SPRITES.map((n) => loadImage(`/sprites/${n}.png`))).then(([mountains, bike, pipecd, pipecdSm, planetread, github, x, linkedin, youtube]) => ({
  mountains, bike, pipecd, planetread, icons: { pipecd: pipecdSm, github, x, linkedin, youtube },
}));

let theme = pickTheme(location.search); // the arrival's look, and the view from the garage window
let weather = pickWeather(location.search); // one weather per visit: the door scene and the garage window show the same sky
const LOGOS: Record<string, string> = { planetread: '/sprites/planetread-px.png', bookbox: '/sprites/bookbox-px.png' };
let current: GarageScene | undefined;
const tried = new Set(loadTried());
const markTried = (f: 'tv' | 'cord' | 'radio') => { if (!tried.has(f)) { tried.add(f); saveTried([...tried]); } };

function toggleNight() {
  if (!current) return;
  current.setNight(!current.night);
  saveNight(current.night);
  layer.toggleAttribute('data-night', current.night);
  markTried('cord');
}

function toggleRadio() {
  const on = radio.toggle();
  saveRadio(on);
  markTried('radio');
  if (current) current.radioOn = on;
  document.querySelector('[data-control="radio"]')?.setAttribute('aria-pressed', String(on));
}

const panel = mountPanel({
  closed: () => (document.activeElement as HTMLElement | null)?.blur?.(),
});

const terminal = mountTerminal({
  opened: () => { markTried('tv'); },
  go: (href) => {
    if (!isPanelHref(href)) return false;
    terminal.close(true); // the panel takes over the same history entry
    panel.open(href, titleFor(href));
    return true;
  },
  night: toggleNight,
  radio: toggleRadio,
  ride: () => ride(),
  closed: () => (document.querySelector('a[data-action="terminal"]') as HTMLElement | null)?.focus(),
});

// The speaker button: one switch for every sound (radio, door, engine, cat). The choice is remembered.
const soundBtn = document.getElementById('sound') as HTMLButtonElement | null;
const showMute = (m: boolean) => { if (soundBtn) { soundBtn.setAttribute('aria-pressed', String(!m)); soundBtn.textContent = m ? 'SOUND OFF' : 'SOUND ON'; } };
setMuted(loadMute()); showMute(loadMute());
soundBtn?.addEventListener('click', () => { const m = soundBtn.getAttribute('aria-pressed') === 'true'; setMuted(m); saveMute(m); showMute(m); });

document.getElementById('phone-term')?.addEventListener('click', () => terminal.open()); // the TV is off-screen on a portrait phone

// Garage-only buttons for the sky outside the window: the weather and the view (the window click still cycles the weather).
const sky = document.getElementById('sky');
const skyWeather = document.getElementById('sky-weather');
const skyTheme = document.getElementById('sky-theme');
const showSky = () => {
  if (skyWeather) skyWeather.textContent = `SKY: ${weather.toUpperCase()}`;
  if (skyTheme) skyTheme.textContent = `VIEW: ${theme === 'xp' ? 'BLISS' : 'HIMALAYA'}`;
};
const cycleWeather = (scene: GarageScene) => { weather = WEATHERS[(WEATHERS.indexOf(weather) + 1) % WEATHERS.length]; scene.setWeather(weather); showSky(); };
skyWeather?.addEventListener('click', () => { if (current) cycleWeather(current); });
skyTheme?.addEventListener('click', () => { if (current) { theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length]; current.setTheme(theme); showSky(); } });

async function garage() {
  const img = await images;
  const scene = new GarageScene(screen, img, weather, theme);
  const q = new URLSearchParams(location.search); // ?night and ?day force the lights (handy for screenshots)
  scene.night = q.has('night') ? true : q.has('day') ? false : loadNight() ?? isNightHour(new Date().getHours()); // until they pull the cord, the room follows their clock
  scene.tried = tried;
  void preloadMeow();
  if (loadRadio() && !radio.on) radio.autostart(); // the radio plays unless the visitor turned it off last time
  scene.radioOn = radio.on;
  current = scene;
  if (sky) sky.hidden = false;
  showSky();
  director.go(scene);
  markVisited();
  mountHotspots(scene);
  layer.toggleAttribute('data-night', scene.night);
  requestAnimationFrame(centre);
  if (location.hash === '#terminal') terminal.open();
  const deep = parsePanelHash(location.hash);
  if (deep) panel.open(deep, titleFor(deep));
}

// On phones the garage is wider than the screen: keep it centred on the bike (also after rotating).
const centre = () => { viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2; };
screen.onResize(() => { if (director.current instanceof GarageScene) requestAnimationFrame(centre); });

async function door() {
  const img = await images;
  current = undefined;
  if (sky) sky.hidden = true;
  director.go(new DoorScene(screen, img.bike, img.mountains, () => new GarageScene(screen, img, weather, theme).roomSprite(false), garage, weather, theme, (o) => { weather = o.weather ?? weather; theme = o.theme ?? theme; void door(); }));
}

function mountHotspots(scene: GarageScene) {
  layer.replaceChildren();
  for (const c of CONTROLS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.control = c.id;
    b.setAttribute('aria-label', c.label.replace(' · ', ': ').toLowerCase());
    if (c.id === 'cord' || c.id === 'radio') b.setAttribute('aria-pressed', String(c.id === 'radio' ? radio.on : scene.night));
    Object.assign(b.style, toPct(c.rect));
    b.addEventListener('click', () => {
      if (c.id === 'cord') { toggleNight(); b.setAttribute('aria-pressed', String(scene.night)); }
      else if (c.id === 'radio') toggleRadio();
      else if (c.id === 'window') cycleWeather(scene);
      else if (c.id === 'clock') scene.clock24 = !scene.clock24;
      else if (c.id === 'compressor') { scene.puff(); hiss(); }
      else { scene.pet(); meow(); }
    });
    hoverable(b, c.id, scene);
    layer.append(b);
  }
  for (const h of [...HOTSPOTS, BAR.list, BAR.ride]) {
    const a = document.createElement('a');
    a.href = h.href;
    if (isPanelHref(h.href) && !h.external && !('action' in h && h.action) && h.id !== 'list' && h.id !== 'ride') {
      a.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); panel.open(h.href, h.tag || titleFor(h.href), a); });
    }
    if ('action' in h && h.action) {
      a.dataset.action = h.action;
      a.addEventListener('click', (e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); terminal.open(); });
    }
    a.setAttribute('aria-label', h.id === 'list' || h.id === 'ride' ? h.label.toLowerCase() : h.label.replace(' · ', ': ').toLowerCase());
    if (h.external) { a.target = '_blank'; a.rel = 'noopener'; }
    Object.assign(a.style, toPct(h.rect));
    const logo = LOGOS[h.id];
    if (logo) { // the real logo, drawn by the browser at full resolution over its plaque
      const img = document.createElement('img');
      img.src = logo; img.alt = ''; img.decoding = 'async';
      a.append(img);
    }
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
  if (sky) sky.hidden = true;
  director.go(new RideScene(screen, door, garage));
}

const start = pickStart(location.search, hasVisited(), reduced);
if (location.hash === '#terminal' || parsePanelHash(location.hash)) garage();
else if (start === 'ride') ride();
else if (start === 'door') door();
else garage();

// "/" or "`" opens the terminal from anywhere in the garage, like a real one.
addEventListener('keydown', (e) => {
  if ((e.key !== '/' && e.key !== '`') || e.metaKey || e.ctrlKey || e.altKey || terminal.isOpen || panel.isOpen) return;
  if (!(director.current instanceof GarageScene) || (e.target as HTMLElement)?.closest?.('input,textarea')) return;
  e.preventDefault();
  terminal.open();
});

// The garage leans a little toward the pointer: cheap CSS 3D that keeps the hotspot links lined up.
const stage = document.getElementById('stage') as HTMLElement;
const canLean = !reduced && matchMedia('(pointer: fine)').matches;
let lean = { x: 0, y: 0 }, aim = { x: 0, y: 0 };
if (canLean) addEventListener('pointermove', (e) => { aim = { x: e.clientX / innerWidth - 0.5, y: e.clientY / innerHeight - 0.5 }; });
// Opening the terminal pushes the camera in on the TV; closing pulls it back out.
const TV = HOTSPOTS.find((h) => h.id === 'tv')!.rect, ZOOM = 1.9;
const tvOrigin = `${(((TV[0] + TV[2] / 2) / WORLD_W) * 100).toFixed(2)}% ${(((TV[1] + TV[3] / 2) / WORLD_H) * 100).toFixed(2)}%`;
let zoom = 0, pan = { x: 0, y: 0 };
function zoomStep(dt: number) {
  const want = !reduced && terminal.isOpen && director.current instanceof GarageScene;
  if (want && zoom === 0) { // aim at the TV, but never slide the stage so far that its edge shows
    const r = stage.getBoundingClientRect();
    const fx = r.left + ((TV[0] + TV[2] / 2) / WORLD_W) * r.width, fy = r.top + ((TV[1] + TV[3] / 2) / WORLD_H) * r.height;
    const fit = (want: number, focus: number, lo: number, hi: number, view: number) => {
      const min = view - focus - (hi - focus) * ZOOM, max = -(focus + (lo - focus) * ZOOM); // pan range that keeps the stage covering the window
      return min > max ? (min + max) / 2 : Math.min(max, Math.max(min, want));
    };
    pan = { x: fit(innerWidth / 2 - fx, fx, r.left, r.right, innerWidth), y: fit(innerHeight / 2 - fy, fy, r.top, r.bottom, innerHeight) };
  }
  zoom = Math.min(1, Math.max(0, zoom + (want ? 1 : -1) * dt * 2.6));
  viewport.classList.toggle('zooming', zoom > 0); // no scrollbars while the stage is scaled
}

function leanStage(dt: number) {
  zoomStep(dt);
  const on = canLean && director.current instanceof GarageScene && !terminal.isOpen && !panel.isOpen && !(current?.lowFx);
  const k = Math.min(1, dt * 6), tx = on ? aim.x : 0, ty = on ? aim.y : 0;
  lean = { x: lean.x + (tx - lean.x) * k, y: lean.y + (ty - lean.y) * k };
  if (zoom > 0) {
    const e = zoom * zoom * (3 - 2 * zoom);
    stage.style.transformOrigin = tvOrigin;
    stage.style.transform = `translate(${(pan.x * e).toFixed(1)}px, ${(pan.y * e).toFixed(1)}px) scale(${(1 + (ZOOM - 1) * e).toFixed(3)})`;
    return;
  }
  stage.style.transformOrigin = '';
  stage.style.transform = Math.abs(lean.x) + Math.abs(lean.y) < 0.002 ? '' : `perspective(1200px) rotateY(${(lean.x * 2.4).toFixed(3)}deg) rotateX(${(-lean.y * 1.8).toFixed(3)}deg) scale(1.02)`;
}

// If frames get slow, the garage drops its extras (dust, flicker, lean) and keeps its look.
let last = performance.now(), slow = 0, frames = 0;
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const s = director.current;
  if (s) { s.update(dt); s.draw(); fx.render(fxWanted(screen.mode, !!current?.lowFx, location.search)); if (!viewport.classList.contains('ready')) viewport.classList.add('ready'); } // first real frame: the poster steps aside
  if (s instanceof DoorScene && viewport.scrollWidth > viewport.clientWidth) { // phone: pan along with the bike
    const want = (s.focus / WIDE_W) * viewport.scrollWidth - viewport.clientWidth / 2;
    viewport.scrollLeft += (want - viewport.scrollLeft) * Math.min(1, dt * 5);
  }
  if (current && !current.lowFx && ++frames > 90) { slow = slow * 0.95 + dt * 0.05; if (slow > 1 / 38) current.lowFx = true; }
  leanStage(dt);
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) { radio.suspend(); engine.suspend(); } else { radio.resume(); engine.resume(); } });
requestAnimationFrame(frame);
