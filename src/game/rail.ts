// The ride's settings buttons (view, night, weather, light, look, photo). Each presses the key the ride already handles and shows the
// current setting, which the ride reports through `look`.

export interface Look { cam: string; night: boolean; sky: string; lights: string; pixel: boolean }

export function mountRail() {
  const rail = document.getElementById('rail');
  if (!rail) return { look: (_: Look) => {} };
  rail.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-key]');
    if (!b) return;
    const code = b.dataset.key!;
    dispatchEvent(new KeyboardEvent('keydown', { code, key: code }));
    dispatchEvent(new KeyboardEvent('keyup', { code, key: code }));
    b.blur();                                                       // the keyboard goes back to the ride, so Space stays the horn
  });
  const set = (look: string, text: string, on?: boolean) => {
    const b = rail.querySelector<HTMLElement>(`[data-look="${look}"]`);
    if (!b) return;
    b.textContent = text;
    if (on === undefined) b.removeAttribute('aria-pressed'); else b.setAttribute('aria-pressed', String(on));
  };
  return {
    look(l: Look) {
      set('cam', `VIEW: ${l.cam}`);
      set('night', `NIGHT: ${l.night ? 'ON' : 'OFF'}`, l.night);
      set('sky', `WEATHER: ${l.sky.toUpperCase()}`, l.sky !== 'clear');
      set('lights', `LIGHT: ${l.lights.toUpperCase()}`, l.lights === 'on');
      set('pixel', `LOOK: ${l.pixel ? 'PIXEL' : 'SMOOTH'}`, l.pixel);
    },
  };
}
