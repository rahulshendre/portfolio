// Boots the home-page game: ride -> door -> garage.
import { Screen } from './engine/screen';
import { input } from './engine/input';
import { Director } from './engine/scene';
import { RideScene } from './scenes/ride';
import { hasVisited, markVisited, pickStart } from './state';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const screen = new Screen(canvas);
const director = new Director((m) => screen.setMode(m));
input.attach(screen);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const toGarage = () => { markVisited(); location.href = '/list'; }; // replaced once the garage scene lands
const ride = () => new RideScene(screen, toGarage, toGarage);

if (pickStart(location.search, hasVisited(), reduced) === 'ride') director.go(ride());
else director.go(ride());

let last = performance.now();
function frame(now: number) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const s = director.current;
  if (s) { s.update(dt); s.draw(); }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
